// ============================================================================
// NIYAM — js/09-parent-review.js
// The Parent's Review page: what the parent sees on entering the Parent Zone.
// Loads LAST, after js/08-rewards-admin.js.
//
// Layout (top to bottom): summary + Approve, "Needs you" (tasks only a parent
// can score), what the child wrote, tasks already scored, tasks not done,
// then the day's grade, a note and Approve again.
//
// How it works — read this before changing anything:
//  * It works from the SAVED day record (savedDays), never from the child's
//    live form. The old approval recalculated points from the form, which
//    used TODAY's weekday/weekend timetable and so lost a day's timetable
//    points when, say, Friday was approved on a Saturday.
//  * A day's points = timetable tasks + Brain Lab + parent awards
//    (+ 100 bonus on every 5th A grade in a row). The grade itself carries
//    no points.
//  * The parent can tap a task to mark it not done (or done). Parent-scored
//    tasks can be awarded now or left for "Later"; anything left stays open
//    and is shown again on following days until it is awarded.
//  * What the parent decided is stored on the record as reviewJSON, and the
//    record's ttBlockStatesJSON is rewritten to match.
//  * There is no Reject.
//
// The old review sections in index.html are kept in the page (other code
// still reads their fields) but moved into a hidden holder.
// ============================================================================
(function(){
  'use strict';

  var RV = {
    date: null,      // the pending day on screen
    edits: {},       // per date: what the parent changed but has not approved yet
    carried: {},     // "date|taskId" -> award chosen for a task left for later
    busy: false
  };

  // ---- helpers -------------------------------------------------------------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                     .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function parse(s, fb){ try{ var v = JSON.parse(s); return (v && typeof v==='object') ? v : fb; }catch(e){ return fb; } }
  function num(v){ var n = parseInt(v,10); return isNaN(n) ? 0 : n; }
  function round5(n){ return Math.round(n/5)*5; }
  function child(){ return window.niyamChildName || 'your child'; }
  function shortDate(d){ return new Date(d+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'}); }
  function longDate(d){ return new Date(d+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}); }
  function pts(n){ return n + (n===1 ? ' pt' : ' pts'); }

  function editsFor(date){
    if(!RV.edits[date]) RV.edits[date] = { undone:{}, done:{}, awards:{}, later:{}, open:{}, grade:'', note:null };
    return RV.edits[date];
  }
  function pendingDays(){
    return savedDays.filter(function(d){ return d && d.date && d.approved !== true; })
                    .sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  }
  function findDay(date){ return savedDays.find(function(d){ return d.date === date; }); }

  // ---- which timetable a saved day used --------------------------------------
  function lists(){
    var C = window.TT_CUSTOM || {};
    return {
      weekday: (C.weekday && C.weekday.length) ? C.weekday : (typeof TT_WEEKDAY!=='undefined' ? TT_WEEKDAY : []),
      weekend: (C.weekend && C.weekend.length) ? C.weekend : (typeof TT_WEEKEND!=='undefined' ? TT_WEEKEND : [])
    };
  }
  function touched(st){
    if(!st) return false;
    if(num(st.pts) > 0) return true;
    var c = st.checkedActs || {};
    for(var k in c) if(c[k]) return true;
    return false;
  }
  // A child can switch a school day to the holiday timetable, so the date alone
  // does not say which list was used: go by the blocks the child worked in.
  function scheduleFor(d, states){
    var L = lists(), keys = Object.keys(states), known = {};
    L.weekday.concat(L.weekend).forEach(function(b){ known[b.id] = 1; });
    function hits(arr){
      var ids = {}; arr.forEach(function(b){ ids[b.id] = 1; });
      return keys.filter(function(k){ return ids[k] && touched(states[k]); }).length;
    }
    var nWd = hits(L.weekday), nWe = hits(L.weekend);
    var day = new Date(d.date+'T12:00:00').getDay();
    var useWeekend = (nWe !== nWd) ? (nWe > nWd) : (day === 0 || day === 6);
    var arr = useWeekend ? L.weekend : L.weekday;
    if(typeof window.niyamFilterSchedule === 'function') arr = window.niyamFilterSchedule(arr, window.niyamFeatures || {});
    return { blocks: arr, known: known };
  }

  // ---- Brain Lab: saved on the record as separate numbers ---------------------
  var BRAIN = [
    ['sudoku',     'savedSudokuPts',    'Sudoku',       /sudoku/i],
    ['maths',      'savedMathsPts',     'Maths Sprint', /maths\s*sprint/i],
    ['logic',      'savedLogicPts',     'Logic',        /logic/i],
    ['riddles',    'savedRiddlePts',    'Riddles',      /riddle/i],
    ['worksheets', 'savedWorksheetPts', 'Worksheets',   /worksheet/i]
  ];
  function brainKey(name){
    for(var i=0;i<BRAIN.length;i++) if(BRAIN[i][3].test(name||'')) return BRAIN[i][0];
    return null;
  }

  function kindOf(a, b){
    if(a.type === 'parent-select') return 'creative';
    if(/shloka|geeta/i.test((b.name||'') + ' ' + (a.name||''))) return 'shloka';
    return 'award';
  }
  // The points a parent can pick for a task they score.
  function chipsFor(kind, max){
    var raw = (kind === 'creative') ? [0, round5(max*0.4), round5(max*0.7), max] : [0, round5(max*0.4), max];
    var vals = [];
    raw.forEach(function(v){ if(v >= 0 && v <= max && vals.indexOf(v) === -1) vals.push(v); });
    vals.sort(function(a,b){ return a-b; });
    return vals.map(function(v){
      var label = String(v);
      if(kind !== 'creative') label = (v === 0 ? 'Not yet' : v === max ? 'Well done' : 'Partly') + ' · ' + v;
      return { v:v, label:label };
    });
  }
  function wordsOf(d, saved){
    var out = [];
    if(Array.isArray(saved)) saved.forEach(function(x){ if(x && x.w) out.push(x.w); });
    if(!out.length) ['word1','word2','word3'].forEach(function(k){ if(d[k] && String(d[k]).trim()) out.push(String(d[k]).trim()); });
    return out;
  }
  // The shloka the child is learning on that day, as saved with the day.
  function shlokaInfo(d){
    var prog = parse(d.geetaProgress, {}), name = '';
    Object.keys(prog).forEach(function(id){
      var st = prog[id] && prog[id].status;
      if(name || (st !== 'inprogress' && st !== 'relearning')) return;
      var s = (typeof SHLOKAS !== 'undefined') ? SHLOKAS.find(function(x){ return x.id === id; }) : null;
      if(s) name = s.chapter + ' — ' + s.chapterName;
    });
    return { name: name, reflect: String(d.shlokaReflect||'').trim() };
  }

  // ---- the day, as the parent will approve it ---------------------------------
  function model(d){
    var E = editsFor(d.date), states = parse(d.ttBlockStatesJSON, {});
    if(!E.seeded){
      // a day moved back to "under review" opens with what the parent decided last time
      E.seeded = true;
      Object.keys(states).forEach(function(k){
        var pp = (states[k] || {}).parentPts || {};
        Object.keys(pp).forEach(function(id){ if(E.awards[id] === undefined) E.awards[id] = num(pp[id]); });
      });
      if(!E.grade && d.parentGrade) E.grade = d.parentGrade;
    }
    var S = scheduleFor(d, states), brLeft = {};
    var m = { d:d, E:E, blocks:[], parents:[], extra:[], wrote:[],
              tt:0, awards:0, brain:0, done:0, notDone:0, need:0 };
    BRAIN.forEach(function(x){ brLeft[x[0]] = num(d[x[1]]); m.brain += brLeft[x[0]]; });

    S.blocks.forEach(function(b){
      if(b.type === 'break' || b.type === 'locked-until-3pm') return;
      var st = states[b.id] || {}, chk = st.checkedActs || {}, B = { b:b, rows:[] };
      (b.activities||[]).forEach(function(a){
        var t = a.type || 'self';
        var r = { id:a.id, a:a, b:b, type:t, name:a.name || b.name, max:0, pts:0,
                  child:false, done:false, can:'', detail:'', by:'' };
        if(t === 'parent' || t === 'parent-select'){
          r.parent = true;
          r.kind = kindOf(a, b);
          r.max = (t === 'parent') ? num(a.pts) : num(a.maxCalcPts);
          r.child = !!chk[a.id];
          r.award = (E.awards[a.id] === undefined) ? undefined : E.awards[a.id];
          r.later = !!E.later[a.id];
          r.inNeed = r.child || !!E.open[a.id] || r.award !== undefined || r.later;
          r.pts = r.award || 0;
          m.parents.push(r);
        }
        else if(t === 'link'){
          r.fixed = true;                       // scored by Brain Lab itself
          r.key = brainKey(a.name);
          if(r.key){ r.pts = brLeft[r.key]; brLeft[r.key] = 0; r.done = r.pts > 0; }
          else r.info = true;
        }
        else if(t === 'pct-calc'){
          r.max = num(a.maxCalcPts);
          var earned = num((st.calcPts||{})[a.id]);
          var obt = (st.calcObt||{})[a.id], tot = num((st.calcTot||{})[a.id]);
          r.child = (obt !== undefined && obt !== '' && tot > 0) || earned > 0;
          if(r.child && tot > 0) r.detail = obt + ' / ' + tot + ' · ' + Math.round(obt/tot*100) + '%';
          r.done = r.child && !E.undone[a.id];
          r.pts = r.done ? earned : 0;
          r.can = r.child ? 'undo' : '';
        }
        else if(t === 'dropdown'){
          var o = (a.options && a.options.length) ? a.options : [3,5,7,10];
          r.max = Math.max.apply(null, o);
          var picked = num((st.ddPts||{})[a.id]);
          r.child = picked > 0;
          r.done = r.child && !E.undone[a.id];
          r.pts = r.done ? picked : 0;
          r.can = r.child ? 'undo' : '';
        }
        else {                                  // a tick worth fixed points
          r.max = num(a.pts);
          r.child = !!chk[a.id];
          r.done = E.undone[a.id] ? false : (E.done[a.id] ? true : r.child);
          r.pts = r.done ? r.max : 0;
          r.can = 'toggle';
          if(t === 'text-entry'){
            var txt = String((st.textEntries||{})[a.id] || '').trim();
            if(txt && r.child) m.wrote.push({ title:r.name, text:txt });
          }
          if(t === 'wordbook'){
            var W = wordsOf(d, (st.words||{})[a.id]);
            if(W.length) m.wrote.push({ title:'New words', text:W.join(' · ') });
          }
        }
        if(E.undone[a.id]) r.by = 'marked not done by you';
        else if(E.done[a.id] && r.can === 'toggle' && !r.child) r.by = 'marked done by you';
        B.rows.push(r);
      });
      if(B.rows.length) m.blocks.push(B);
    });

    // points and counts
    m.blocks.forEach(function(B){
      B.rows.forEach(function(r){
        if(r.info) return;
        if(r.parent){
          m.awards += r.pts;
          if(r.award !== undefined){ if(r.award > 0) m.done++; else m.notDone++; }
          else if(r.inNeed) m.need++;
          else m.notDone++;
          return;
        }
        if(!r.fixed) m.tt += r.pts;
        if(r.done) m.done++; else m.notDone++;
      });
    });
    // work in a block that has since been removed from the timetable still counts
    Object.keys(states).forEach(function(k){
      if(S.known[k]) return;
      var st = states[k] || {}, link = 0;
      Object.keys(st.linkPts||{}).forEach(function(x){ link += num(st.linkPts[x]); });
      var p = num(st.pts) - link;
      if(p > 0){ m.extra.push({ name:'Tasks from an earlier timetable', pts:p }); m.tt += p; }
    });
    // Brain Lab points that no task in the timetable points at
    BRAIN.forEach(function(x){ if(brLeft[x[0]] > 0) m.extra.push({ name:'Brain Lab — ' + x[2], pts:brLeft[x[0]] }); });

    m.pts = m.tt + m.brain + m.awards;
    return m;
  }

  // ---- grades -------------------------------------------------------------------
  // A's in a row before this date, counting only days that were given a grade.
  function aRunBefore(date){
    var graded = savedDays.filter(function(d){ return d.approved === true && d.parentGrade && d.date < date; })
                          .sort(function(a,b){ return a.date < b.date ? 1 : -1; });
    var n = 0;
    for(var i=0;i<graded.length;i++){ if(graded[i].parentGrade === 'A') n++; else break; }
    return n;
  }
  function gradeBonus(date, grade){
    if(grade !== 'A') return 0;
    return ((aRunBefore(date) + 1) % 5 === 0) ? 100 : 0;
  }

  // ---- tasks left for later on days already approved ------------------------------
  function carriedItems(){
    var out = [];
    savedDays.forEach(function(d){
      if(d.approved !== true || !d.reviewJSON) return;
      (parse(d.reviewJSON, {}).later || []).forEach(function(it){ out.push({ date:d.date, it:it }); });
    });
    out.sort(function(a,b){ return a.date < b.date ? -1 : 1; });
    return out;
  }

  // ---- styles -------------------------------------------------------------------
  var CSS = ''
  + '#rv-root{font-family:"Comic Neue","Comic Sans MS",system-ui,Segoe UI,Roboto,sans-serif;color:#1f2433;margin-bottom:18px}'
  + '#rv-root button{font-family:inherit}'
  + '.rv-c{background:#fff;border-radius:16px;padding:14px 15px;margin-bottom:10px}'
  + '.rv-sec{color:#d7d7ea;font-size:11.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin:16px 3px 7px}'
  + '.rv-sec small{font-weight:700;letter-spacing:0;text-transform:none;color:#a9a9c4;margin-left:6px}'
  + '.rv-wait{color:#f6c453;font-size:12.5px;font-weight:800;margin:0 3px 7px}'
  + '.rv-days{display:flex;gap:7px;overflow-x:auto;padding-bottom:4px;margin-bottom:10px}'
  + '.rv-day{flex:0 0 auto;border:1.5px solid #3a3b57;background:transparent;color:#c9c9dc;border-radius:11px;'
  +   'padding:7px 11px;font-size:12px;font-weight:800;text-align:center;cursor:pointer}'
  + '.rv-day small{display:block;font-weight:700;opacity:.8}'
  + '.rv-day.on{background:#e8a838;border-color:#e8a838;color:#191a2f}'
  + '.rv-sum{background:linear-gradient(135deg,#3b2fa0,#6d3fd8);color:#fff}'
  + '.rv-sum .rv-date{font-size:12px;font-weight:800;opacity:.9;margin-bottom:6px}'
  + '.rv-big{font-size:34px;font-weight:900;line-height:1}'
  + '.rv-big small{font-size:13px;font-weight:700;opacity:.85}'
  + '.rv-bar{height:8px;border-radius:5px;background:rgba(255,255,255,.25);margin:10px 0 8px;overflow:hidden}'
  + '.rv-bar i{display:block;height:100%;background:#f6c453;border-radius:5px}'
  + '.rv-facts{display:flex;gap:6px;flex-wrap:wrap;font-size:12px;font-weight:800;margin-bottom:12px}'
  + '.rv-facts span{background:rgba(255,255,255,.16);border-radius:8px;padding:4px 9px}'
  + '.rv-btn{border:0;border-radius:13px;padding:13px;font-size:15px;font-weight:900;cursor:pointer;width:100%}'
  + '.rv-btn:disabled{opacity:.6;cursor:default}'
  + '.rv-go{background:linear-gradient(180deg,#f6c453,#e8a838);color:#191a2f;box-shadow:0 6px 16px rgba(232,168,56,.3)}'
  + '.rv-ghost{background:transparent;color:#c9c9dc;border:1.5px solid #3a3b57;font-size:13px;padding:10px;margin-bottom:10px}'
  + '.rv-fine{font-size:11.5px;line-height:1.5;opacity:.85;margin-top:8px}'
  + '.rv-need{border:1.5px solid #fdba74;background:#fff7ed}'
  + '.rv-need-b{font-size:11.5px;font-weight:800;color:#b45309}'
  + '.rv-need-n{font-size:15px;font-weight:900;margin:1px 0 6px}'
  + '.rv-need-d{font-size:13px;color:#6b7280;margin-bottom:8px;line-height:1.5}'
  + '.rv-quote{background:#fff;border:1px solid #f1e3c8;border-radius:10px;padding:8px 10px;font-size:13px;font-style:italic;'
  +   'color:#4b5563;margin-bottom:8px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}'
  + '.rv-img{max-width:100%;max-height:280px;border-radius:12px;display:block;margin:0 0 8px}'
  + '.rv-chips{display:flex;gap:7px;flex-wrap:wrap;align-items:center}'
  + '.rv-chip{border:1.5px solid #e6e2da;background:#fff;color:#1f2433;border-radius:10px;padding:8px 12px;font-size:13px;'
  +   'font-weight:800;cursor:pointer}'
  + '.rv-chip.on{background:#e8a838;border-color:#e8a838;color:#191a2f}'
  + '.rv-chip.later{border-style:dashed;color:#6b7280}'
  + '.rv-chip.later.on{background:#191a2f;border-color:#191a2f;border-style:solid;color:#fff}'
  + '.rv-chip.g{min-width:48px;font-size:16px;text-align:center}'
  + '.rv-save{border:0;border-radius:10px;padding:9px 13px;font-size:13px;font-weight:900;cursor:pointer;'
  +   'background:#047857;color:#fff;margin-left:auto}'
  + '.rv-wrote{border-left:3px solid #e8a838;padding-left:10px;margin:8px 0}'
  + '.rv-wrote b{display:block;font-size:12.5px}'
  + '.rv-wrote span{font-size:13px;color:#4b5563;font-style:italic;white-space:pre-wrap;overflow-wrap:anywhere}'
  + '.rv-blk{font-weight:900;font-size:13.5px;margin:10px 0 3px;display:flex;justify-content:space-between;gap:8px}'
  + '.rv-blk:first-child{margin-top:0}'
  + '.rv-blk em{font-style:normal;color:#6b7280;font-weight:800;font-size:12px;white-space:nowrap}'
  + '.rv-ln{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;text-align:left;border:0;'
  +   'border-top:1px solid #f3f0ea;background:transparent;padding:8px 2px;font-size:13.5px;color:#1f2433}'
  + 'button.rv-ln{cursor:pointer}'
  + 'button.rv-ln:hover{background:#faf8f3}'
  + '.rv-ln .l{min-width:0}'
  + '.rv-ln .l small{display:block;color:#6b7280;font-size:12px}'
  + '.rv-ln .l small.by{color:#b45309;font-weight:800}'
  + '.rv-ln .p{flex:0 0 auto;font-weight:900;color:#047857;white-space:nowrap}'
  + '.rv-ln.no{color:#8a8f9c}'
  + '.rv-ln.no .p{color:#8a8f9c}'
  + '.rv-hint{font-size:12px;color:#8a8f9c;margin:0 0 4px}'
  + '.rv-lab{font-size:12.5px;font-weight:900;margin:12px 0 6px}'
  + '.rv-lab:first-child{margin-top:0}'
  + '.rv-lab small{font-weight:700;color:#6b7280;margin-left:4px}'
  + '#rv-note{width:100%;box-sizing:border-box;border:1.5px solid #e6e2da;border-radius:11px;padding:10px 11px;font-size:14px;'
  +   'font-family:inherit;background:#fcfbf8;min-height:64px;resize:vertical;color:#1f2433;margin-bottom:12px}'
  + '.rv-bonus{font-size:12.5px;font-weight:800;color:#047857;margin-top:6px}'
  + '.rv-empty{text-align:center;color:#4b5563;font-size:14px;line-height:1.6;padding:22px 14px}'
  + '.rv-empty b{display:block;font-size:17px;color:#1f2433;margin-bottom:4px}'
  + '#rv-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:26px;z-index:100001;background:#191a2f;color:#fff;'
  +   'padding:12px 20px;border-radius:12px;font-size:14px;font-weight:700;display:none;box-shadow:0 10px 26px rgba(0,0,0,.3);'
  +   'border:1px solid #3a3b57;max-width:90vw;text-align:center}'
  + '#rv-legacy{display:none !important}';

  function toast(msg){
    var t = $('rv-toast'); if(!t) return;
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(t._h); t._h = setTimeout(function(){ t.style.display = 'none'; }, 3200);
  }

  // ---- put the page into the Parent tab, once ---------------------------------------
  function arrange(){
    if($('rv-root')) return true;
    var host = $('parent-content');
    if(!host) return false;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    var root = document.createElement('div'); root.id = 'rv-root';
    host.insertBefore(root, host.firstChild);

    // Old review sections: other code still reads their fields, so they stay in
    // the page, out of sight.
    var legacy = document.createElement('div'); legacy.id = 'rv-legacy';
    host.appendChild(legacy);
    var old = ['pending-queue-sec','pr-acc-1','pr-acc-4','pr-acc-5','pr-acc-6'].map($);
    var chip = $('pr-daily-pts');                       // the old purple banner has no id of its own
    while(chip && chip.parentNode && chip.parentNode !== host) chip = chip.parentNode;
    if(chip && chip.parentNode === host) old.push(chip);
    old.forEach(function(el){ if(el) legacy.appendChild(el); });
    var award = $('shloka-pts-award');                  // shloka points are awarded on this page now
    if(award && award.parentNode) award.parentNode.style.display = 'none';

    var tools = document.createElement('div');
    tools.className = 'rv-sec'; tools.textContent = 'More parent tools';
    host.insertBefore(tools, root.nextSibling);

    var t = document.createElement('div'); t.id = 'rv-toast'; document.body.appendChild(t);

    root.addEventListener('click', onClick);
    root.addEventListener('input', function(e){
      if(e.target && e.target.id === 'rv-note' && RV.date) editsFor(RV.date).note = e.target.value;
    });
    return true;
  }

  // ---- render --------------------------------------------------------------------
  function needCard(r, d){
    var E = editsFor(d.date), body = '';
    if(r.kind === 'shloka'){
      var sh = shlokaInfo(d);
      body += '<div class="rv-need-d">' + (sh.name ? 'Learning: <b>' + esc(sh.name) + '</b>. ' : '')
            + 'Ask ' + esc(child()) + ' to recite it and explain the meaning.</div>';
      if(sh.reflect.length > 2) body += '<div class="rv-quote">' + esc(sh.reflect) + '</div>';
    } else if(r.kind === 'creative'){
      if(d.creativeChosen) body += '<div class="rv-need-d">Chosen: <b>' + esc(d.creativeChosen) + '</b></div>';
      var desc = String(d.creativeDesc||'').trim();
      if(desc.length > 2) body += '<div class="rv-quote">' + esc(desc) + '</div>';
      if(typeof d.creativeImgData === 'string' && d.creativeImgData.indexOf('data:image') === 0)
        body += '<img class="rv-img" alt="Creative work" src="' + esc(d.creativeImgData) + '">';
      if(!d.creativeChosen && desc.length <= 2) body += '<div class="rv-need-d">' + esc(child()) + ' marked this as done.</div>';
    } else {
      body += '<div class="rv-need-d">' + (r.child ? esc(child()) + ' marked this as done.' : 'You opened this to award points.')
            + (r.a.note ? ' ' + esc(r.a.note) : '') + '</div>';
    }
    var chips = chipsFor(r.kind, r.max).map(function(c){
      return '<button type="button" class="rv-chip' + (r.award === c.v ? ' on' : '') + '" data-do="award" data-id="'
           + esc(r.id) + '" data-v="' + c.v + '">' + esc(c.label) + '</button>';
    }).join('');
    return '<div class="rv-c rv-need">'
      + '<div class="rv-need-b">' + esc(r.b.icon||'') + ' ' + esc(r.b.name||'') + '</div>'
      + '<div class="rv-need-n">' + esc(r.name) + '</div>'
      + body
      + '<div class="rv-chips">' + chips
      +   '<button type="button" class="rv-chip later' + (E.later[r.id] ? ' on' : '') + '" data-do="later" data-id="'
      +   esc(r.id) + '">Later</button></div>'
      + '</div>';
  }

  function carriedCard(c){
    var key = c.date + '|' + c.it.id, sel = RV.carried[key];
    var chips = chipsFor(c.it.kind, num(c.it.max)).map(function(x){
      return '<button type="button" class="rv-chip' + (sel === x.v ? ' on' : '') + '" data-do="caward" data-key="'
           + esc(key) + '" data-v="' + x.v + '">' + esc(x.label) + '</button>';
    }).join('');
    return '<div class="rv-c rv-need">'
      + '<div class="rv-need-b">Left for later · ' + esc(shortDate(c.date)) + '</div>'
      + '<div class="rv-need-n">' + esc(c.it.name) + '</div>'
      + (c.it.info ? '<div class="rv-quote">' + esc(c.it.info) + '</div>' : '')
      + '<div class="rv-chips">' + chips
      + (sel !== undefined ? '<button type="button" class="rv-save" data-do="csave" data-key="' + esc(key) + '">Save · +'
          + sel + ' pts</button>' : '')
      + '</div></div>';
  }

  function lineHtml(r, done){
    var sub = r.detail ? '<small>' + esc(r.detail) + '</small>' : '';
    if(r.by) sub += '<small class="by">' + esc(r.by) + ' · tap to undo</small>';
    var right = done ? (r.fixed || r.max > 0 || r.pts > 0 ? '+' + r.pts : '✓')
                     : (r.max > 0 ? String(r.max) : '—');
    var inner = '<span class="l">' + esc(r.name) + sub + '</span><span class="p">' + right + '</span>';
    var act = r.parent ? 'open' : (r.can ? 'toggle' : '');
    if(act) return '<button type="button" class="rv-ln' + (done ? '' : ' no') + '" data-do="' + act + '" data-id="' + esc(r.id) + '">' + inner + '</button>';
    return '<div class="rv-ln' + (done ? '' : ' no') + '">' + inner + '</div>';
  }

  function render(){
    var root = $('rv-root'); if(!root) return;
    var pend = pendingDays(), carried = carriedItems();
    if(!RV.date || !pend.some(function(d){ return d.date === RV.date; })) RV.date = pend.length ? pend[pend.length-1].date : null;
    var h = '';

    if(!RV.date){
      h += '<div class="rv-c rv-empty"><b>Nothing is waiting for you</b>' + esc(child())
         + '’s next day will appear here as soon as it is saved.</div>';
      if(carried.length){
        h += '<div class="rv-sec">Left for later</div>' + carried.map(carriedCard).join('');
      }
      root.innerHTML = h;
      return;
    }

    var d = findDay(RV.date), m = model(d), E = m.E;
    var bonus = gradeBonus(d.date, E.grade), total = m.pts + bonus;
    var tasks = m.done + m.notDone + m.need;

    if(pend.length > 1){
      var sum = 0; pend.forEach(function(x){ sum += model(x).pts; });
      h += '<div class="rv-wait">' + pend.length + ' days waiting for you</div><div class="rv-days">'
        + pend.map(function(x){
            return '<button type="button" class="rv-day' + (x.date === RV.date ? ' on' : '') + '" data-do="day" data-date="'
              + esc(x.date) + '">' + esc(shortDate(x.date)) + '<small>' + pts(model(x).pts) + '</small></button>';
          }).join('') + '</div>'
        + '<button type="button" class="rv-btn rv-ghost" data-do="all">Approve all ' + pend.length + ' days · ' + pts(sum) + '</button>';
    }

    // summary + quick approve
    h += '<div class="rv-c rv-sum">'
      + '<div class="rv-date">' + esc(longDate(d.date)) + '</div>'
      + '<div class="rv-big">' + total + ' <small>' + (total===1?'pt':'pts') + ' today</small></div>'
      + '<div class="rv-bar"><i style="width:' + (tasks ? Math.round(m.done/tasks*100) : 0) + '%"></i></div>'
      + '<div class="rv-facts"><span>✓ ' + m.done + ' done</span><span>✗ ' + m.notDone + ' not done</span>'
      +   (m.need ? '<span>⏳ ' + m.need + (m.need===1?' needs you':' need you') + '</span>' : '') + '</div>'
      + '<button type="button" class="rv-btn rv-go" data-do="approve"' + (RV.busy ? ' disabled' : '') + '>Approve · ' + pts(total) + '</button>'
      + (m.need ? '<div class="rv-fine">Approving now banks these points. Anything under “Needs you” that you have not '
          + 'scored stays open, and is shown again tomorrow.</div>' : '')
      + '</div>';

    // needs you
    var need = m.parents.filter(function(r){ return r.inNeed; });
    if(need.length || carried.length){
      h += '<div class="rv-sec">Needs you</div>' + need.map(function(r){ return needCard(r, d); }).join('')
        + carried.map(carriedCard).join('');
    }

    // what the child wrote
    if(m.wrote.length){
      h += '<div class="rv-sec">' + esc(child()) + ' wrote</div><div class="rv-c">'
        + m.wrote.map(function(w){ return '<div class="rv-wrote"><b>' + esc(w.title) + '</b><span>' + esc(w.text) + '</span></div>'; }).join('')
        + '</div>';
    }

    // already scored
    var scored = '', scoredPts = 0;
    m.blocks.forEach(function(B){
      var rows = B.rows.filter(function(r){ return !r.parent && !r.info && r.done; });
      if(!rows.length) return;
      var sub = 0; rows.forEach(function(r){ sub += r.pts; }); scoredPts += sub;
      scored += '<div class="rv-blk"><span>' + esc(B.b.icon||'') + ' ' + esc(B.b.name||'') + '</span><em>' + pts(sub) + '</em></div>'
              + rows.map(function(r){ return lineHtml(r, true); }).join('');
    });
    m.extra.forEach(function(x){
      scoredPts += x.pts;
      scored += '<div class="rv-ln"><span class="l">' + esc(x.name) + '</span><span class="p">+' + x.pts + '</span></div>';
    });
    if(scored){
      h += '<div class="rv-sec">Already scored <small>' + pts(scoredPts) + '</small></div><div class="rv-c">'
        + '<div class="rv-hint">Tap a task if it was not really done.</div>' + scored + '</div>';
    }

    // not done
    var nd = '';
    m.blocks.forEach(function(B){
      B.rows.forEach(function(r){
        if(r.info) return;
        if(r.parent ? (!r.inNeed) : !r.done) nd += lineHtml(r, false);
      });
    });
    if(nd){
      h += '<div class="rv-sec">Not done</div><div class="rv-c"><div class="rv-hint">Tap a task to count it as done.</div>' + nd + '</div>';
    }

    // grade, note, approve
    var run = aRunBefore(d.date) + (E.grade === 'A' ? 1 : 0);
    h += '<div class="rv-sec">Finish</div><div class="rv-c">'
      + '<div class="rv-lab">Grade for the day <small>optional · no points</small></div>'
      + '<div class="rv-chips">' + ['A','B','C','D'].map(function(g){
          return '<button type="button" class="rv-chip g' + (E.grade === g ? ' on' : '') + '" data-do="grade" data-g="' + g + '">' + g + '</button>';
        }).join('') + '</div>'
      + '<div class="rv-bonus">' + (bonus ? 'This is the 5th A in a row: +100 bonus points.'
          : (run % 5 ? run % 5 + ' of 5 A grades in a row. ' : '') + 'Five A grades in a row earn 100 bonus points.') + '</div>'
      + '<div class="rv-lab">A note for ' + esc(child()) + ' <small>optional</small></div>'
      + '<textarea id="rv-note" placeholder="e.g. Proud of how you finished your homework today.">'
      +   esc(E.note === null ? (d.parentComment||'') : E.note) + '</textarea>'
      + '<button type="button" class="rv-btn rv-go" data-do="approve"' + (RV.busy ? ' disabled' : '') + '>Approve · ' + pts(total) + '</button>'
      + '</div>';

    root.innerHTML = h;
  }

  // ---- saving ---------------------------------------------------------------------
  function putDay(rec){
    var i = savedDays.findIndex(function(x){ return x.date === rec.date; });
    if(i >= 0) savedDays[i] = rec; else savedDays.unshift(rec);
    savedDays.sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
    try{ localStorage.setItem('vaanya_days', JSON.stringify(savedDays)); }catch(e){}
  }
  function blockState(states, id){
    if(!states[id]) states[id] = { pts:0, checkedActs:{}, markedDone:false };
    if(!states[id].checkedActs) states[id].checkedActs = {};
    return states[id];
  }
  // Rewrite the day's saved ticks so they match what was approved.
  function correctedStates(d, m){
    var states = parse(d.ttBlockStatesJSON, {});
    m.blocks.forEach(function(B){
      var st = blockState(states, B.b.id), sum = 0, link = 0;
      B.rows.forEach(function(r){
        if(r.fixed || r.info) return;
        if(r.parent){
          if(r.award !== undefined){
            if(!st.parentPts) st.parentPts = {};
            st.parentPts[r.id] = r.award; st.checkedActs[r.id] = true; sum += r.award;
          }
          return;
        }
        st.checkedActs[r.id] = !!r.done;
        if(!r.done){
          if(st.calcPts) delete st.calcPts[r.id];
          if(st.ddPts && st.ddPts[r.id]) st.ddPts[r.id] = 0;
        }
        sum += r.pts;
      });
      Object.keys(st.linkPts||{}).forEach(function(k){ link += num(st.linkPts[k]); });
      st.pts = sum + link;     // the child's screen shows Brain Lab points inside the block
    });
    return states;
  }
  // A full-marks shloka award also marks the shloka as mastered, as the old page did.
  async function masterShloka(){
    try{
      if(typeof _geetaLoadProgress === 'function') _geetaLoadProgress();
      var id = (typeof _geetaInProgressId === 'function') ? _geetaInProgressId() : null;
      if(id && typeof _parentApproveShloka === 'function') await _parentApproveShloka(id);
      // that helper also sets the old award dropdown, which the child's live
      // score still reads — the points were already given on this page
      var old = $('shloka-pts-award');
      if(old){ old.selectedIndex = 0; if(typeof calcDayPts === 'function') calcDayPts(); }
    }catch(e){ console.warn('[review] shloka mastery:', e); }
  }
  function afterBankChange(date){
    try{ updateTopBar(); }catch(e){}
    try{ populateResetDatePicker(); }catch(e){}
    try{ if(typeof renderPendingQueue === 'function') renderPendingQueue(); }catch(e){}
  }

  async function approveDay(date){
    var d = findDay(date);
    if(!d || d.approved === true) return null;
    var m = model(d), E = m.E, awards = {}, later = [], shloka = 0, creative = 0, mastered = false;
    m.parents.forEach(function(r){
      if(r.award !== undefined){
        awards[r.id] = r.award;
        if(r.kind === 'shloka'){ shloka += r.award; if(r.max > 0 && r.award >= r.max) mastered = true; }
        if(r.kind === 'creative') creative += r.award;
      } else if(r.inNeed){
        var info = '';
        if(r.kind === 'creative') info = [d.creativeChosen, String(d.creativeDesc||'').trim()].filter(Boolean).join(' — ');
        if(r.kind === 'shloka') info = shlokaInfo(d).name;
        later.push({ id:r.id, blockId:r.b.id, name:r.name, kind:r.kind, max:r.max, info:String(info||'').substring(0,300) });
      }
    });
    var bonus = gradeBonus(d.date, E.grade), total = m.pts + bonus;
    var rec = Object.assign({}, d, {
      pts: total, approved: true, savedAt: new Date().toISOString(),
      parentGrade: E.grade || '', gradeBonus: bonus, parentRating: 0,
      parentComment: String(E.note === null ? (d.parentComment||'') : E.note).substring(0, 2000),
      shlokaPtsAwarded: shloka, creativePtsAwarded: creative,
      ttBlockStatesJSON: JSON.stringify(correctedStates(d, m)),
      reviewJSON: JSON.stringify({ v:1, tt:m.tt, brain:m.brain, awards:awards, later:later, bonus:bonus,
                                   undone:Object.keys(E.undone), done:Object.keys(E.done) })
    });
    putDay(rec);
    var ok = await saveToSupabase(rec);
    try{ if(typeof _sessionClearDate === 'function') _sessionClearDate(date); }catch(e){}
    // if this is the day open on the child's screen, lock it there too
    try{
      var loaded = $('rpt-date') && $('rpt-date').value;
      if(loaded === date){
        ttBlockStates = parse(rec.ttBlockStatesJSON, {});
        if(typeof lockForm === 'function') lockForm(date, total);
        if(typeof ttRender === 'function') ttRender();
      }
    }catch(e){ console.warn('[review] lock:', e); }
    if(mastered) await masterShloka();
    delete RV.edits[date];
    return { ok:ok, pts:total, bonus:bonus, later:later.length };
  }

  async function saveCarried(key){
    var sel = RV.carried[key]; if(sel === undefined) return;
    var cut = key.indexOf('|'), date = key.slice(0, cut), id = key.slice(cut + 1);
    var d = findDay(date); if(!d) return;
    var rv = parse(d.reviewJSON, {}), it = (rv.later||[]).find(function(x){ return x.id === id; });
    if(!it) return;
    rv.later = rv.later.filter(function(x){ return x.id !== id; });
    rv.awards = rv.awards || {}; rv.awards[id] = sel;
    var states = parse(d.ttBlockStatesJSON, {});
    if(it.blockId){
      var st = blockState(states, it.blockId);
      if(!st.parentPts) st.parentPts = {};
      st.parentPts[id] = sel; st.checkedActs[id] = true; st.pts = num(st.pts) + sel;
    }
    var rec = Object.assign({}, d, { pts: num(d.pts) + sel, reviewJSON: JSON.stringify(rv),
                                     ttBlockStatesJSON: JSON.stringify(states) });
    if(it.kind === 'shloka') rec.shlokaPtsAwarded = num(d.shlokaPtsAwarded) + sel;
    if(it.kind === 'creative') rec.creativePtsAwarded = num(d.creativePtsAwarded) + sel;
    putDay(rec);
    delete RV.carried[key];
    var ok = await saveToSupabase(rec);
    if(it.kind === 'shloka' && num(it.max) > 0 && sel >= num(it.max)) await masterShloka();
    afterBankChange();
    toast(ok ? '+' + sel + ' pts added for ' + shortDate(date) : 'Saved on this device — it will sync when the connection is back.');
  }

  // ---- clicks -----------------------------------------------------------------------
  function findRow(m, id){
    for(var i=0;i<m.blocks.length;i++) for(var j=0;j<m.blocks[i].rows.length;j++)
      if(m.blocks[i].rows[j].id === id) return m.blocks[i].rows[j];
    return null;
  }
  async function onClick(e){
    var btn = e.target && e.target.closest ? e.target.closest('[data-do]') : null;
    if(!btn || RV.busy) return;
    var act = btn.getAttribute('data-do'), id = btn.getAttribute('data-id');
    var E = RV.date ? editsFor(RV.date) : null, v, key;

    if(act === 'day'){ RV.date = btn.getAttribute('data-date'); render(); return; }
    if(act === 'award'){
      v = num(btn.getAttribute('data-v'));
      if(E.awards[id] === v) delete E.awards[id]; else { E.awards[id] = v; delete E.later[id]; }
      render(); return;
    }
    if(act === 'later'){
      if(E.later[id]) delete E.later[id]; else { E.later[id] = 1; delete E.awards[id]; }
      render(); return;
    }
    if(act === 'open'){ E.open[id] = 1; render(); return; }
    if(act === 'toggle'){
      var r = findRow(model(findDay(RV.date)), id);
      if(!r) return;
      if(r.child){ if(E.undone[id]) delete E.undone[id]; else E.undone[id] = 1; }
      else if(r.can === 'toggle'){ if(E.done[id]) delete E.done[id]; else E.done[id] = 1; }
      render(); return;
    }
    if(act === 'grade'){
      var g = btn.getAttribute('data-g');
      E.grade = (E.grade === g) ? '' : g;
      render(); return;
    }
    if(act === 'caward'){
      key = btn.getAttribute('data-key'); v = num(btn.getAttribute('data-v'));
      if(RV.carried[key] === v) delete RV.carried[key]; else RV.carried[key] = v;
      render(); return;
    }
    if(act === 'csave'){
      RV.busy = true;
      try{ await saveCarried(btn.getAttribute('data-key')); }
      finally{ RV.busy = false; render(); }
      return;
    }
    if(act === 'approve' || act === 'all'){
      var dates = (act === 'all') ? pendingDays().map(function(d){ return d.date; }) : [RV.date];
      if(act === 'all'){
        var sum = 0; pendingDays().forEach(function(d){ sum += model(d).pts; });
        if(!confirm('Approve all ' + dates.length + ' days?\n\n' + pts(sum) + ' will be added to ' + child()
            + '’s bank. Tasks under “Needs you” that you have not scored stay open for later.')) return;
      }
      RV.busy = true; render();
      var got = 0, synced = true, bonus = 0, n = 0;
      try{
        for(var i=0;i<dates.length;i++){
          var res = await approveDay(dates[i]);
          if(res){ got += res.pts; bonus += res.bonus; n++; if(!res.ok) synced = false; }
        }
      }catch(err){
        console.error('[review] approve failed:', err);
        alert('Could not approve: ' + (err && err.message ? err.message : err) + '\n\nNothing was lost — please try again.');
      }finally{
        RV.busy = false;
        afterBankChange();
        render();
        var zone = $('ns-parent-zone'); if(zone && zone.scrollTo) zone.scrollTo(0, 0);
      }
      if(n){
        toast(!synced ? 'Approved on this device — it will sync when the connection is back.'
            : (n > 1 ? n + ' days approved' : 'Approved') + ' · ' + pts(got) + ' added to the bank'
              + (bonus ? ' (includes ' + bonus + ' bonus)' : ''));
      }
      return;
    }
  }

  // ---- open -------------------------------------------------------------------------
  // The day open on the child's screen may have ticks newer than its last save.
  function freshen(){
    try{
      if(typeof dbReady !== 'undefined' && !dbReady) return;
      if(typeof todayApproved !== 'undefined' && todayApproved) return;
      var date = $('rpt-date') && $('rpt-date').value;
      if(!date) return;
      var existing = findDay(date);
      if(existing && existing.approved === true) return;
      var total = calcDayPts(), any = total > 0;
      Object.keys(ttBlockStates||{}).forEach(function(k){ if(touched(ttBlockStates[k])) any = true; });
      if(!any) return;
      var data = collectFormData(date, total);
      putDay(existing ? Object.assign({}, existing, data) : data);
      saveToSupabase(data);
    }catch(e){ console.warn('[review] freshen:', e); }
  }

  function open(){
    if(!arrange()) return;
    freshen();
    render();
  }

  window.niyamOpenReview = open;
  window.niyamRenderReview = function(){ if($('rv-root')) render(); };
})();
