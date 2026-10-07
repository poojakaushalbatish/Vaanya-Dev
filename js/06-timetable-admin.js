// ============================================================================
// NIYAM — 06-timetable-admin.js
// Parent's timetable editor. Self-contained: injects its own button into the
// Parent Zone bar and its own full-screen editor. Touches NO existing file.
// Loads LAST, after js/05-timetable-boot.js.
//
// How it behaves: only one block is open at a time. Tapping a block shows its
// tasks read-only; the pencil opens the edit form. New blocks start with no
// name and no time, and overlapping times are flagged (and confirmed on Save).
//
// Reads:  window.TT_CUSTOM (set by 00-shell.js) or the built-in TT_WEEKDAY /
//         TT_WEEKEND defaults.
// Writes: window.niyamSaveTimetable(weekday, weekend)  [defined in 00-shell.js]
//
// Approval / points / report logic is NOT touched anywhere in this file.
// ============================================================================
(function(){
  'use strict';

  // sel    = the one block that is open: { id, mode:'view'|'edit' } or null
  // follow = ids of tasks still named after their block (screen-only, never saved)
  var TTA = { weekday: [], weekend: [], tab: 'weekday', sel: null, follow: {}, scrollTo: null, focus: null };

  // ---- helpers -------------------------------------------------------------
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function uid(p){ return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                     .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function $(id){ return document.getElementById(id); }

  // Points a block can award = sum of fixed pts + any calculated maxima.
  function blockMax(b){
    return (b.activities||[]).reduce(function(sum,a){
      return sum + (parseInt(a.pts)||0) + (parseInt(a.maxCalcPts)||0);
    }, 0);
  }

  // ---- time handling ------------------------------------------------------
  // Blocks are ordered and unlocked by unlockHour (decimal 24h). Parents pick
  // real start/end times, so we always know exactly when a block belongs.
  function hhmmToDec(s){
    if(!s) return null;
    var m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
    if(!m) return null;
    return parseInt(m[1],10) + parseInt(m[2],10)/60;
  }
  function decToHHMM(d){
    if(d===undefined || d===null || isNaN(d)) return '';
    var h = Math.floor(d), mi = Math.round((d-h)*60);
    if(mi===60){ h+=1; mi=0; }
    return ('0'+h).slice(-2) + ':' + ('0'+mi).slice(-2);
  }
  function fmt12(hhmm){
    var d = hhmmToDec(hhmm); if(d===null) return '';
    var h = Math.floor(d), mi = Math.round((d-h)*60);
    var ap = h>=12 ? 'PM' : 'AM', h12 = h%12; if(h12===0) h12=12;
    return h12 + ':' + ('0'+mi).slice(-2) + ' ' + ap;
  }
  // Reads "6:00 AM \u2013 3:00 PM", "3:30 TO 4:00", "7:00-8:00", "9:30 PM"\u2026
  function parseOne(txt){
    if(!txt) return null;
    var m = /(\d{1,2})\s*:\s*(\d{2})\s*([ap]\.?m\.?)?/i.exec(txt);
    if(!m) return null;
    var h = parseInt(m[1],10), mi = parseInt(m[2],10), ap = (m[3]||'').toLowerCase();
    if(ap.indexOf('p')===0 && h<12) h+=12;
    if(ap.indexOf('a')===0 && h===12) h=0;
    return ('0'+h).slice(-2) + ':' + ('0'+mi).slice(-2);
  }
  function splitTime(b){
    var txt = String(b.time||'');
    var parts = txt.split(/\u2013|\u2014|--|\bto\b|-/i);
    var st = parseOne(parts[0]);
    var en = parts.length>1 ? parseOne(parts.slice(1).join(' ')) : null;
    if(st===null && b.unlockHour!==undefined) st = decToHHMM(b.unlockHour);
    return { start: st || '', end: en || '' };
  }
  function blockDec(b){
    if(b.unlockHour!==undefined && b.unlockHour!==null && !isNaN(b.unlockHour)) return b.unlockHour;
    var d = hhmmToDec(splitTime(b).start);
    return (d===null ? 99 : d);
  }
  // Order blocks by start time \u2014 what the parent sees is what the child sees.
  function sortByTime(arr){
    return (arr||[]).slice().sort(function(a,b){ return blockDec(a) - blockDec(b); });
  }
  // start may still be empty while a parent is filling in a new block
  function applyTimes(b, start, end){
    b.time = fmt12(start) + (end ? ' \u2013 ' + fmt12(end) : '');
    var d = hhmmToDec(start);
    if(d!==null) b.unlockHour = d; else delete b.unlockHour;
  }

  function defaults(which){
    var src = (which==='weekend')
      ? (typeof TT_WEEKEND!=='undefined' ? TT_WEEKEND : [])
      : (typeof TT_WEEKDAY!=='undefined' ? TT_WEEKDAY : []);
    return clone(src);
  }

  function loadIntoEditor(){
    var C = window.TT_CUSTOM || {};
    TTA.weekday = sortByTime((C.weekday && C.weekday.length) ? clone(C.weekday) : defaults('weekday'));
    TTA.weekend = sortByTime((C.weekend && C.weekend.length) ? clone(C.weekend) : defaults('weekend'));
  }

  function list(){ return TTA.tab==='weekend' ? TTA.weekend : TTA.weekday; }

  // ---- styles --------------------------------------------------------------
  var CSS = ''
  + '#tta-screen{position:fixed;inset:0;z-index:99999;background:#f7f6fb;overflow:auto;display:none;'
  +   'font-family:"Comic Neue","Comic Sans MS",system-ui,Segoe UI,Roboto,sans-serif;color:#1f2433}'
  + '#tta-bar{position:sticky;top:0;z-index:5;background:#191a2f;color:#fff;display:flex;align-items:center;'
  +   'justify-content:space-between;gap:10px;padding:13px 16px;box-shadow:0 2px 10px rgba(0,0,0,.28);flex-wrap:wrap}'
  + '#tta-bar h2{margin:0;font-size:17px;font-weight:800;letter-spacing:.01em}'
  + '.tta-btn{border:0;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;padding:9px 14px}'
  + '.tta-ghost{background:rgba(255,255,255,.16);color:#fff}'
  + '.tta-gold{background:linear-gradient(180deg,#f6c453,#e8a838);color:#191a2f;box-shadow:0 6px 16px rgba(232,168,56,.34)}'
  + '.tta-warn{background:#fff1f1;color:#9f1239;border:1px solid #fecdd3}'
  + '.tta-soft{background:#eef0f5;color:#3a4150}'
  + '#tta-body{max-width:880px;margin:0 auto;padding:16px 14px 80px}'
  + '.tta-tabs{display:flex;gap:8px;margin-bottom:14px}'
  + '.tta-tab{flex:1;padding:11px;border-radius:12px;border:1.6px solid #e6e2da;background:#fff;'
  +   'font-weight:800;font-size:14px;cursor:pointer;color:#6b7280}'
  + '.tta-tab.on{border-color:#e8a838;background:#fff5dd;color:#8a5a00}'
  + '.tta-note{background:#fff8e6;border:1px solid #f0d9a0;border-radius:12px;padding:11px 13px;'
  +   'font-size:12.5px;line-height:1.6;color:#6b5a2a;margin-bottom:14px}'
  + '.tta-card{background:#fff;border:1px solid #ece7df;border-radius:15px;padding:12px 13px;margin-bottom:11px;'
  +   'box-shadow:0 5px 16px rgba(90,80,130,.07)}'
  + '.tta-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
  + '.tta-ico{font-size:23px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;'
  +   'background:#faf7f0;border-radius:12px;flex:0 0 auto}'
  + '.tta-tt{flex:1;min-width:150px}'
  + '.tta-tt b{display:block;font-size:15px}'
  + '.tta-tt span{font-size:12px;color:#6b7280}'
  + '.tta-mini{border:0;background:#f1f2f6;border-radius:9px;width:32px;height:32px;font-size:14px;cursor:pointer}'
  + '.tta-mini:hover{background:#e3e5ec}'
  + '.tta-open{border-top:1px dashed #e9e4db;margin-top:11px;padding-top:11px}'
  + '.tta-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}'
  + '.tta-f{flex:1;min-width:120px}'
  + '.tta-f label{display:block;font-size:10.5px;font-weight:800;text-transform:uppercase;'
  +   'letter-spacing:.06em;color:#8a8f9c;margin-bottom:3px}'
  + '#tta-screen input,#tta-screen select{width:100%;padding:9px 10px;border:1.5px solid #e6e2da;border-radius:10px;'
  +   'font-size:14px;background:#fcfbf8;box-sizing:border-box;font-family:inherit;color:#1f2433}'
  + '#tta-screen input:focus,#tta-screen select:focus{outline:none;border-color:#e8a838;background:#fff}'
  + '.tta-act{background:#faf9fc;border:1px solid #eeecf3;border-radius:11px;padding:9px 10px;margin-bottom:7px}'
  + '.tta-acth{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px}'
  + '.tta-acth b{font-size:12px;color:#6b7280;font-weight:800}'
  + '.tta-empty{text-align:center;color:#9aa0ad;font-size:13px;padding:14px}'
  + '#tta-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:26px;z-index:100001;background:#191a2f;'
  +   'color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:700;display:none;'
  +   'box-shadow:0 10px 26px rgba(0,0,0,.3)}'
  + '#tta-ask{position:fixed;inset:0;z-index:100002;background:rgba(15,16,32,.72);display:none;'
  +   'align-items:center;justify-content:center;padding:20px}'
  + '#tta-ask .box{background:#fff;border-radius:18px;padding:24px 22px;max-width:380px;width:100%;text-align:center}'
  + '#tta-ask h3{margin:0 0 8px;font-size:19px}'
  + '#tta-ask p{margin:0 0 18px;font-size:14px;color:#6b7280;line-height:1.55}'
  + '#ns-tta-btn{background:linear-gradient(180deg,#f6c453,#e8a838);color:#191a2f;border:0;border-radius:10px;'
  +   'padding:8px 13px;font-size:12.5px;font-weight:800;cursor:pointer;margin-right:8px}'
  + '.tta-card{scroll-margin-top:110px;scroll-margin-bottom:20px}'
  + '.tta-card.sel{border-color:#e8a838;box-shadow:0 6px 20px rgba(232,168,56,.2)}'
  + '.tta-head{cursor:pointer}'
  + '.tta-done{padding:7px 12px;font-size:12.5px;white-space:nowrap}'
  + '.tta-tt .tta-over{display:block;margin-top:3px;color:#b45309;font-weight:800}'
  + '.tta-warnbox{background:#fff7ed;border:1px solid #fdba74;border-radius:11px;padding:9px 12px;'
  +   'font-size:12.5px;line-height:1.55;color:#9a3412;margin-bottom:8px}'
  + '.tta-rest{background:#f6f7fa;border-radius:11px;padding:11px 13px;margin-top:6px;font-size:12.5px;'
  +   'color:#6b7280;line-height:1.55}'
  + '.tta-pv{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:9px 11px;'
  +   'background:#faf9fc;border:1px solid #eeecf3;border-radius:11px;margin-bottom:6px}'
  + '.tta-pv-l{min-width:0}'
  + '.tta-pv-l b{display:block;font-size:14px}'
  + '.tta-pv-l span{font-size:12px;color:#6b7280}'
  + '.tta-pv-p{flex:0 0 auto;font-size:12px;font-weight:800;color:#8a5a00;background:#fff5dd;'
  +   'border-radius:9px;padding:5px 9px;white-space:nowrap}'
  + '.tta-ro{padding:9px 10px;border:1.5px dashed #e6e2da;border-radius:10px;font-size:13.5px;'
  +   'background:#f6f7fa;color:#4b5563}'
  + '.tta-sub{font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em}'
  + '.tta-hint{font-size:12px;color:#8a8f9c;line-height:1.5;margin:4px 0 8px}';

  // ---- build DOM once ------------------------------------------------------
  function build(){
    if($('tta-screen')) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    var d = document.createElement('div');
    d.id = 'tta-screen';
    d.innerHTML =
      '<div id="tta-bar">'
      + '<h2>\uD83D\uDDD3\uFE0F Timetable Setup</h2>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +   '<button class="tta-btn tta-warn" id="tta-default">\u21BA Go Default</button>'
      +   '<button class="tta-btn tta-ghost" id="tta-close">\u2715 Close</button>'
      +   '<button class="tta-btn tta-gold" id="tta-save">\uD83D\uDCBE Save</button>'
      + '</div></div>'
      + '<div id="tta-body">'
      +   '<div class="tta-tabs">'
      +     '<button class="tta-tab on" id="tta-t-wd">\uD83C\uDFEB Weekdays</button>'
      +     '<button class="tta-tab" id="tta-t-we">\u2600\uFE0F Weekends</button>'
      +   '</div>'
      +   '<div class="tta-note">This is your child\u2019s day. Tap a block to see its tasks. '
      +     'Tap \u270F\uFE0F to change its name, time or tasks. Blocks sort themselves into '
      +     'time order automatically. <b>Already-approved past reports never change</b> \u2014 '
      +     'edits apply to days going forward.</div>'
      +   '<div id="tta-list"></div>'
      +   '<button class="tta-btn tta-soft" id="tta-addblock" style="width:100%;padding:13px;margin-top:6px">'
      +     '\u2795 Add a new time block</button>'
      + '</div>';
    document.body.appendChild(d);

    var t = document.createElement('div'); t.id='tta-toast'; document.body.appendChild(t);

    var ask = document.createElement('div');
    ask.id = 'tta-ask';
    ask.innerHTML = '<div class="box"><h3>\u2705 Timetable saved!</h3>'
      + '<p>Where would you like to go now?</p>'
      + '<button class="tta-btn tta-gold" id="tta-go-child" style="width:100%;margin-bottom:9px;padding:13px">'
      +   '\uD83D\uDC66 Go to child\u2019s page</button>'
      + '<button class="tta-btn tta-soft" id="tta-stay" style="width:100%;padding:13px">'
      +   '\uD83D\uDEE0\uFE0F Stay here and keep editing</button></div>';
    document.body.appendChild(ask);

    $('tta-close').onclick    = close;
    $('tta-save').onclick     = save;
    $('tta-default').onclick  = goDefault;
    $('tta-addblock').onclick = addBlock;
    $('tta-t-wd').onclick     = function(){ switchTab('weekday'); };
    $('tta-t-we').onclick     = function(){ switchTab('weekend'); };
    $('tta-stay').onclick     = function(){ $('tta-ask').style.display='none'; };
    $('tta-go-child').onclick = function(){
      if(typeof window.niyamCloseTomorrowsPlan === 'function') window.niyamCloseTomorrowsPlan();
      location.reload();
    };
  }

  function toast(m){
    var t=$('tta-toast'); if(!t) return;
    t.textContent=m; t.style.display='block';
    clearTimeout(t._h); t._h=setTimeout(function(){ t.style.display='none'; }, 2600);
  }

  function switchTab(which){
    TTA.tab = which; TTA.sel = null;
    $('tta-t-wd').className = 'tta-tab' + (which==='weekday'?' on':'');
    $('tta-t-we').className = 'tta-tab' + (which==='weekend'?' on':'');
    render();
  }

  // ---- render --------------------------------------------------------------
  var TYPES = [
    ['normal',           'Earns points'],
    ['break',            'No points — break or rest'],
    ['locked-until-3pm', 'School time — locked until the day opens']
  ];
  // The scoring types a parent can pick for a task they add or change.
  var ACT_TYPES = [
    ['self',      'Child ticks it'],
    ['parent',    'Parent awards points'],
    ['pct-calc',  'Score out of 100% → points'],
    ['text-entry','Child writes an answer']
  ];
  // Every scoring type the app knows, including the built-in ones a parent
  // cannot pick from the list above (WordBook, Brain Lab links, Creative).
  var SCORE_LABEL = {
    'self':          'Child ticks it',
    'parent':        'Parent awards points',
    'pct-calc':      'Score out of 100% → points',
    'text-entry':    'Child writes an answer',
    'wordbook':      'Child adds 3 new words to WordBook',
    'link':          'Points come from Brain Lab',
    'parent-select': 'Parent awards points, up to the maximum',
    'dropdown':      'Child picks points for quality'
  };
  function isPickable(t){ return ACT_TYPES.some(function(p){ return p[0]===t; }); }
  function scoreLabel(a){ return SCORE_LABEL[a.type||'self'] || 'Built-in task'; }
  function usesMax(a){ return a.type==='pct-calc' || a.type==='parent-select'; }
  function ptsText(a){
    if(a.type==='link') return 'from Brain Lab';
    if(a.type==='dropdown'){
      var o = (a.options && a.options.length) ? a.options : [3,5,7,10];
      return Math.min.apply(null,o) + '–' + Math.max.apply(null,o) + ' pts';
    }
    if(usesMax(a)) return 'up to ' + (parseInt(a.maxCalcPts)||0) + ' pts';
    var p = parseInt(a.pts)||0;
    return p ? p + ' pts' : 'no pts';
  }

  function opts(pairs, val){
    return pairs.map(function(p){
      return '<option value="'+p[0]+'"'+(p[0]===val?' selected':'')+'>'+esc(p[1])+'</option>';
    }).join('');
  }

  // ---- overlaps -----------------------------------------------------------
  // A block's start/end as decimals, or null when it has no usable range
  // (e.g. "Sleep" has only a start time).
  function range(b){
    var t = splitTime(b), s = hhmmToDec(t.start), e = hhmmToDec(t.end);
    if(s===null || e===null || e<=s) return null;
    return { s:s, e:e };
  }
  // blockId -> [blocks it overlaps]
  function findOverlaps(L){
    var map = {};
    for(var i=0;i<L.length;i++){
      var ra = range(L[i]); if(!ra) continue;
      for(var j=i+1;j<L.length;j++){
        var rb = range(L[j]); if(!rb) continue;
        if(ra.s < rb.e - 1e-6 && rb.s < ra.e - 1e-6){
          (map[L[i].id] = map[L[i].id] || []).push(L[j]);
          (map[L[j].id] = map[L[j].id] || []).push(L[i]);
        }
      }
    }
    return map;
  }
  function blockLabel(b){ return String(b.name||'').trim() || 'New block'; }
  function overlapNames(arr){
    return arr.map(function(o){ return blockLabel(o) + (o.time ? ' (' + o.time + ')' : ''); }).join(', ');
  }

  // ---- selection: only one block is ever open ------------------------------
  // mode 'view' = read-only list of its tasks, 'edit' = the full form.
  function modeOf(b){ return (TTA.sel && TTA.sel.id===b.id) ? TTA.sel.mode : ''; }
  function select(b, mode){
    TTA.sel = mode ? { id:b.id, mode:mode } : null;
    TTA.scrollTo = b.id;
    render();
  }

  function setBlockName(b, v){
    b.name = v;
    (b.activities||[]).forEach(function(a){ if(TTA.follow[a.id]) a.name = v; });
  }
  function newTask(b, follow){
    var a = { id: uid('cact'), name: follow ? (b.name||'') : '', pts:5, type:'self', note:'' };
    if(follow) TTA.follow[a.id] = true;
    return a;
  }

  function headHtml(b, i, mode, ov){
    var start = splitTime(b).start;
    var n = (b.activities||[]).length;
    return '<div class="tta-head" data-i="'+i+'" title="Tap to see the tasks in this block">'
      +   '<div class="tta-ico">'+esc(b.icon||'⭐')+'</div>'
      +   '<div class="tta-tt"><b>'+esc(blockLabel(b))+'</b>'
      +     '<span>'+esc(start ? b.time : 'time not set')+' · '+blockMax(b)+' pts max · '
      +     n+(n===1?' task':' tasks')+'</span>'
      +     (ov ? '<span class="tta-over">⚠️ Overlaps with '+esc(overlapNames(ov))+'</span>' : '')
      +   '</div>'
      +   '<button class="tta-mini" data-a="del" data-i="'+i+'" title="Delete block">🗑️</button>'
      +   (mode==='edit'
            ? '<button class="tta-btn tta-soft tta-done" data-a="done" data-i="'+i+'">✓ Done</button>'
            : '<button class="tta-mini" data-a="edit" data-i="'+i+'" title="Edit block">✏️</button>')
      + '</div>';
  }

  function noTasksNote(b){
    return '<div class="tta-rest">'
      + (b.type === 'break'
          ? '😌 This is rest time — no tasks and no points.'
          : '🏫 This block stays locked until the day opens, so it holds no tasks.')
      + '</div>';
  }

  // Read-only list of the tasks in a block.
  function viewHtml(b, i){
    var h = '<div class="tta-open">';
    if(b.type === 'break' || b.type === 'locked-until-3pm'){ h += noTasksNote(b); }
    else if(!(b.activities||[]).length){ h += '<div class="tta-empty">No tasks in this block yet.</div>'; }
    else {
      h += (b.activities||[]).map(function(a){
        return '<div class="tta-pv">'
          + '<div class="tta-pv-l"><b>'+esc(a.name || blockLabel(b))+'</b>'
          +   '<span>'+esc(scoreLabel(a))+(a.note ? ' · '+esc(a.note) : '')+'</span></div>'
          + '<div class="tta-pv-p">'+esc(ptsText(a))+'</div>'
          + '</div>';
      }).join('');
    }
    return h + '<button class="tta-btn tta-soft" data-a="edit" data-i="'+i+'" '
      + 'style="width:100%;padding:11px;margin-top:6px">✏️ Edit this block</button></div>';
  }

  function editHtml(b, i, ov){
    var tm = splitTime(b);
    var h = '<div class="tta-open">'
      + '<div class="tta-row">'
      +   '<div class="tta-f" style="flex:0 0 74px"><label>Icon</label>'
      +     '<input data-f="icon" data-i="'+i+'" value="'+esc(b.icon||'')+'" maxlength="4"></div>'
      +   '<div class="tta-f" style="flex:2"><label>Block name</label>'
      +     '<input data-f="name" data-i="'+i+'" value="'+esc(b.name||'')+'" placeholder="e.g. Olympiad practice"></div>'
      + '</div>'
      + '<div class="tta-row">'
      +   '<div class="tta-f"><label>Starts at</label>'
      +     '<input data-f="start" data-i="'+i+'" type="time" value="'+esc(tm.start)+'"></div>'
      +   '<div class="tta-f"><label>Ends at</label>'
      +     '<input data-f="end" data-i="'+i+'" type="time" value="'+esc(tm.end)+'"></div>'
      + '</div>'
      + (ov ? '<div class="tta-warnbox">⚠️ This time overlaps with <b>'+esc(overlapNames(ov))+'</b>. '
            + 'Change the time here, or shorten the other block.</div>' : '')
      + '<div class="tta-row"><div class="tta-f"><label>Block type</label>'
      +   '<select data-f="type" data-i="'+i+'">'+opts(TYPES, b.type||'normal')+'</select></div></div>';

    // Break and school blocks carry no tasks — hide the task editor entirely.
    if(b.type === 'break' || b.type === 'locked-until-3pm'){
      return h + noTasksNote(b) + '</div>';
    }

    var acts = b.activities || [];
    var oneFollowing = (acts.length===1 && TTA.follow[acts[0].id]);
    h += '<div style="margin-top:12px"><b class="tta-sub">Tasks in this block</b>'
      + (oneFollowing ? '<div class="tta-hint">One task, named after the block. Change it below, or add more tasks '
          + 'if this block has several things to do.</div>' : '')
      + '</div>';

    acts.forEach(function(a, j){
      var fixed = !isPickable(a.type||'self');           // built-in scoring — not changeable here
      var ptsCell;
      if(a.type==='link' || a.type==='dropdown'){
        ptsCell = '<div class="tta-ro">'+esc(ptsText(a))+'</div>';
      } else {
        var k = usesMax(a) ? 'maxCalcPts' : 'pts';
        ptsCell = '<input data-af="'+k+'" data-i="'+i+'" data-j="'+j+'" type="number" min="0" value="'+(parseInt(a[k])||0)+'">';
      }
      h += '<div class="tta-act">'
        + '<div class="tta-acth"><b>Task '+(j+1)+'</b>'
        +   '<button class="tta-mini" data-a="delact" data-i="'+i+'" data-j="'+j+'" '
        +   'title="Remove task">🗑️</button></div>'
        + '<div class="tta-row"><div class="tta-f" style="flex:3"><label>Task name</label>'
        +   '<input data-af="name" data-i="'+i+'" data-j="'+j+'" value="'+esc(a.name||'')+'" '
        +   'placeholder="'+(TTA.follow[a.id] ? 'Same as the block name' : 'e.g. Revise chapter 3')+'"></div>'
        +   '<div class="tta-f" style="flex:0 0 100px"><label>'+(usesMax(a)?'Max pts':'Points')+'</label>'+ptsCell+'</div>'
        + '</div>'
        + '<div class="tta-row"><div class="tta-f"><label>How it is scored</label>'
        +   (fixed
              ? '<div class="tta-ro">'+esc(scoreLabel(a))+'</div>'
              : '<select data-af="type" data-i="'+i+'" data-j="'+j+'">'+opts(ACT_TYPES, a.type||'self')+'</select>')
        +   '</div>'
        +   '<div class="tta-f" style="flex:2"><label>Note for child (optional)</label>'
        +     '<input data-af="note" data-i="'+i+'" data-j="'+j+'" value="'+esc(a.note||'')+'"></div>'
        + '</div>'
        + (fixed ? '<div class="tta-hint">Built-in task — its scoring is fixed. To score it differently, '
            + 'remove it and add a new task.</div>' : '')
        + '</div>';
    });

    return h + '<button class="tta-btn tta-soft" data-a="addact" data-i="'+i+'" '
      + 'style="width:100%;padding:11px;margin-top:4px">➕ Add a task</button></div>';
  }

  function render(){
    var L = list(), host = $('tta-list');
    if(!host) return;
    if(!L.length){
      host.innerHTML = '<div class="tta-empty">No blocks yet — tap “Add a new time block” below.</div>';
      return;
    }
    var overlaps = findOverlaps(L);

    host.innerHTML = L.map(function(b, i){
      var mode = modeOf(b), ov = overlaps[b.id];
      return '<div class="tta-card'+(mode?' sel':'')+'" id="tta-card-'+esc(b.id)+'">'
        + headHtml(b, i, mode, ov)
        + (mode==='edit' ? editHtml(b, i, ov) : mode==='view' ? viewHtml(b, i) : '')
        + '</div>';
    }).join('');

    // tapping a block's header shows (or hides) its tasks, read-only
    Array.prototype.forEach.call(host.querySelectorAll('.tta-head'), function(hd){
      hd.onclick = function(e){
        if(e.target.closest && e.target.closest('button')) return;
        var b = list()[+hd.getAttribute('data-i')];
        select(b, modeOf(b)==='view' ? '' : 'view');
      };
    });

    // buttons
    Array.prototype.forEach.call(host.querySelectorAll('button[data-a]'), function(btn){
      btn.onclick = function(){
        var i=+btn.getAttribute('data-i'), j=+btn.getAttribute('data-j'), L=list(), b=L[i];
        switch(btn.getAttribute('data-a')){
          case 'edit': select(b, 'edit'); break;
          case 'done': select(b, 'view'); break;
          case 'del':
            if(confirm('Delete the block “'+blockLabel(b)+'” and all its tasks?')){
              L.splice(i,1);
              if(TTA.sel && TTA.sel.id===b.id) TTA.sel = null;
              render();
            }
            break;
          case 'addact':
            b.activities = b.activities || [];
            b.activities.push(newTask(b, false));
            TTA.focus = '[data-af="name"][data-j="'+(b.activities.length-1)+'"]';
            render();
            break;
          case 'delact':
            if(confirm('Remove this task?')){ b.activities.splice(j,1); render(); }
            break;
        }
      };
    });

    // block field edits — mutate in place so unknown keys (tab, entryKey,
    // saveTo, galleryKey…) are preserved exactly as the app expects.
    Array.prototype.forEach.call(host.querySelectorAll('[data-f]'), function(el){
      var f = el.getAttribute('data-f');
      if(f==='name'){
        // Live: the header and any task still named after the block follow along.
        el.oninput = function(){
          var b = list()[+el.getAttribute('data-i')], card = el.closest('.tta-card');
          setBlockName(b, el.value);
          var title = card.querySelector('.tta-tt b'); if(title) title.textContent = blockLabel(b);
          (b.activities||[]).forEach(function(a, j){
            if(!TTA.follow[a.id]) return;
            var inp = card.querySelector('[data-af="name"][data-j="'+j+'"]'); if(inp) inp.value = a.name;
          });
        };
      }
      el.onchange = function(){
        var b = list()[+el.getAttribute('data-i')];
        if(f==='start' || f==='end'){
          var card = el.closest('.tta-card');
          applyTimes(b, card.querySelector('[data-f="start"]').value, card.querySelector('[data-f="end"]').value);
          // Re-sort so the block jumps straight to its correct place in the day.
          if(TTA.tab==='weekend') TTA.weekend = sortByTime(TTA.weekend);
          else TTA.weekday = sortByTime(TTA.weekday);
          TTA.scrollTo = b.id;
          // after a start time, move straight on to the end time if it is still empty
          if(f==='start' && !splitTime(b).end) TTA.focus = '[data-f="end"]';
          render();
          return;
        }
        if(f==='name'){ setBlockName(b, el.value.trim()); return; }
        b[f] = el.value;
        if(f==='type'){
          // Moving to break/school clears tasks; moving back gives a fresh one.
          if(el.value === 'break' || el.value === 'locked-until-3pm'){ b.activities = []; }
          else if(!b.activities || !b.activities.length){ b.activities = [newTask(b, true)]; }
        }
        if(f==='icon' || f==='type') render();
      };
    });

    // activity field edits
    Array.prototype.forEach.call(host.querySelectorAll('[data-af]'), function(el){
      el.onchange = function(){
        var b = list()[+el.getAttribute('data-i')];
        var a = b.activities[+el.getAttribute('data-j')];
        var f = el.getAttribute('data-af');
        if(f==='pts' || f==='maxCalcPts'){ a[f] = parseInt(el.value)||0; }
        else if(f==='type'){
          a.type = el.value;
          if(a.type==='pct-calc'){ a.maxCalcPts = a.maxCalcPts || a.pts || 10; a.pts = 0; }
          else { delete a.maxCalcPts; }
          render();
        }
        else {
          a[f] = el.value;
          if(f==='name') delete TTA.follow[a.id];   // the parent named it themselves
        }
      };
    });

    // keep the block being worked on in view, and put the cursor where asked
    var card = TTA.sel ? $('tta-card-'+TTA.sel.id) : null;
    if(TTA.scrollTo){
      var target = $('tta-card-'+TTA.scrollTo); TTA.scrollTo = null;
      if(target && target.scrollIntoView){
        // a block taller than the screen is shown from its top, not its nearest edge
        var tall = target.offsetHeight > (window.innerHeight - 120);
        target.scrollIntoView({ block: tall ? 'start' : 'nearest', behavior:'smooth' });
      }
    }
    if(TTA.focus){
      var inp = card ? card.querySelector(TTA.focus) : null; TTA.focus = null;
      if(inp){ try{ inp.focus({ preventScroll:true }); }catch(e){ inp.focus(); } }
    }
  }

  // ---- actions -------------------------------------------------------------
  // A new block starts with an empty name and no time. The built-in day has no
  // free gaps, so any default time would land on top of another block.
  function addBlock(){
    var nb = {
      id: uid('cblk'), time:'', name:'', icon:'⭐',
      iconBg:'#FFF7ED', iconColor:'#EA580C', color:'#EA580C', lightBg:'#FFF7ED',
      type:'normal', maxPts:0, activities:[]
    };
    nb.activities.push(newTask(nb, true));
    list().push(nb);
    TTA.sel = { id: nb.id, mode:'edit' };
    TTA.scrollTo = nb.id;
    TTA.focus = '[data-f="name"]';
    render();
  }

  function goDefault(){
    var label = TTA.tab==='weekend' ? 'Weekend' : 'Weekday';
    if(!confirm('Reset the '+label+' timetable back to the built-in NIYAM default?\n\n'
                + 'Your other tab is not affected. Nothing is saved until you press Save.')) return;
    if(TTA.tab==='weekend') TTA.weekend = defaults('weekend'); else TTA.weekday = defaults('weekday');
    TTA.sel = null; render();
    toast(label + ' timetable reset to default \u2014 press Save to keep it');
  }

  function tidy(arr){
    return sortByTime(arr).map(function(b){
      var c = clone(b);
      c.id = c.id || uid('cblk');
      c.name = String(c.name||'').trim();
      c.activities = (c.activities||[]).map(function(a){
        var x = clone(a); x.id = x.id || uid('cact'); x.pts = parseInt(x.pts)||0;
        x.name = String(x.name||'').trim() || c.name;      // unnamed task takes the block's name
        return x;
      });
      c.maxPts = blockMax(c);            // keep the progress bar honest
      return c;
    });
  }

  // Every block needs a name and a start time before it can be saved.
  function firstProblem(){
    var tabs = ['weekday','weekend'];
    for(var t=0;t<tabs.length;t++){
      var L = TTA[tabs[t]];
      for(var i=0;i<L.length;i++){
        var b = L[i];
        if(!String(b.name||'').trim())
          return { tab:tabs[t], id:b.id, focus:'[data-f="name"]', msg:'One block has no name yet. Please give it a name.' };
        if(!splitTime(b).start)
          return { tab:tabs[t], id:b.id, focus:'[data-f="start"]',
                   msg:'Please set a start time for \u201C'+b.name+'\u201D \u2014 it decides where the block sits in the day.' };
      }
    }
    return null;
  }
  function overlapSummary(){
    var out = [];
    [['weekday','Weekdays'],['weekend','Weekends']].forEach(function(t){
      var L = TTA[t[0]], map = findOverlaps(L), seen = {};
      L.forEach(function(b){
        (map[b.id]||[]).forEach(function(o){
          var key = [b.id,o.id].sort().join('|'); if(seen[key]) return; seen[key] = 1;
          out.push(t[1] + ': ' + blockLabel(b) + ' and ' + blockLabel(o));
        });
      });
    });
    return out.join('\n');
  }

  async function save(){
    if(typeof window.niyamSaveTimetable !== 'function'){
      alert('Could not save \u2014 the app is still starting up. Please refresh and try again.');
      return;
    }
    if(!TTA.weekday.length && !TTA.weekend.length){
      alert('Nothing to save yet \u2014 the timetable is still loading. Please try again in a moment.');
      return;
    }
    var bad = firstProblem();
    if(bad){
      switchTab(bad.tab);
      TTA.sel = { id: bad.id, mode:'edit' }; TTA.scrollTo = bad.id; TTA.focus = bad.focus;
      render();
      alert(bad.msg);
      return;
    }
    var ov = overlapSummary();
    if(ov && !confirm('Some blocks overlap in time:\n\n' + ov + '\n\nYour child will see the earlier block as '
        + '\u201Ctime has passed\u201D as soon as the later one starts.\n\nSave anyway?')) return;
    var btn = $('tta-save'); btn.disabled = true; btn.textContent = 'Saving\u2026';
    try{
      await window.niyamSaveTimetable(tidy(TTA.weekday), tidy(TTA.weekend));
      if(typeof window.niyamRefreshPlan === 'function') window.niyamRefreshPlan();
      $('tta-ask').style.display = 'flex';
    }catch(e){
      alert('Save failed: ' + (e && e.message ? e.message : e) + '\n\nYour edits are still on screen \u2014 try Save again.');
    }finally{
      btn.disabled = false; btn.textContent = '\uD83D\uDCBE Save';
    }
  }

  async function open(){
    build();
    // CRITICAL: never open on empty data. If the family's timetable hasn't
    // finished loading yet, wait for it — otherwise the editor would show the
    // built-in default and Save would overwrite the family's real timetable.
    if(!window.TT_CUSTOM && typeof window.niyamLoadTimetable === 'function'){
      var host = $('tta-list');
      if(host) host.innerHTML = '<div class="tta-empty">Loading your timetable\u2026</div>';
      $('tta-screen').style.display = 'block';
      try{ await window.niyamLoadTimetable(); }catch(e){ console.warn('[editor] load:', e); }
    }
    loadIntoEditor(); TTA.follow = {}; switchTab('weekday');
    $('tta-screen').style.display = 'block';
    window.scrollTo(0,0);
  }
  function close(){
    if(!confirm('Close the timetable editor?\n\nAnything you have not saved will be lost.')) return;
    $('tta-screen').style.display = 'none';
  }

  // ---- entry button, injected into the Parent Zone bar ----------------------
  function injectButton(){
    var bar = document.getElementById('ns-pz-bar');
    if(!bar || document.getElementById('ns-tta-btn')) return;
    var b = document.createElement('button');
    b.id = 'ns-tta-btn';
    b.textContent = '\uD83D\uDDD3\uFE0F Timetable Setup';
    b.onclick = open;
    var logout = document.getElementById('ns-pz-logout');
    if(logout && logout.parentNode) logout.parentNode.insertBefore(b, logout);
    else bar.appendChild(b);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectButton);
  } else { injectButton(); }
  setTimeout(injectButton, 1200);   // safety net if the shell renders late

  window.niyamOpenTimetableEditor = open;   // manual escape hatch
})();
