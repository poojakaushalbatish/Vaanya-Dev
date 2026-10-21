// ============================================================================
// NIYAM — js/10-brain-lab.js
// The Brain Lab tab: a daily "Brain Quest" of four games, comic-book style.
// Loads LAST, after js/09-parent-review.js. Replaces the old Brain Lab screens
// (their markup stays in index.html, hidden, because old code still reads it).
//
//   Riddles       2 a day, 4 choices, a hint costs 2 points   5 pts each
//   Logic         5 a day, 4 choices, explained               3 pts each
//   Maths Sprint  10 a day, 4 choices, explained, own timer   3 pts each
//   Sudoku        Easy / Medium / Hard, one a day             15 / 30 / 40
//   All four done the same day                               +10 bonus
//
// Each game can be played at any time of day, once; then it waits for tomorrow.
//
// Where the questions come from: the Supabase table brain_questions (see
// brain-questions-table.sql), one row per question, filtered by the child's
// class and DAY. The day is the child's OWN day: Day 1 is the first day they
// played Brain Lab, and it only moves on on days they play, so a child who
// misses a week does not skip a week of questions. When the table has fewer
// days than the child has reached, the days start again from Day 1.
// Sudoku needs no table: the puzzle is built here from the class, the day and
// the level, so every child on the same day gets the same puzzle.
//
// Points go into the same numbers the rest of the app already uses:
// riddlePtsTotal, logicPtsTotal, mathsPtsToday, sudokuPts — and the all-four
// bonus into worksheetPts (Worksheets were removed on 14 Oct 2026; the parent
// review page shows it as "All-four bonus"). What the child did is saved with
// the day as brainStateJSON.
// ============================================================================
(function(){
  'use strict';

  var PTS   = { riddle:5, hintCost:2, logic:3, maths:3, sudoku:{ easy:15, medium:30, hard:40 }, bonus:10 };
  var COUNT = { riddle:2, logic:5, maths:10 };
  var GIVEN = { easy:36, medium:30, hard:27 };       // numbers shown at the start of a Sudoku (fewer = harder)
  var TIMER_CHOICES = [0, 5, 10, 15, 20];            // minutes; 0 = no timer
  var TIMER_DEFAULT = 10;
  var GAMES = ['riddle', 'logic', 'maths', 'sudoku'];
  var LOOK = {
    riddle: { name:'Riddles',      color:'#FFD23F', unit:'Riddle',   icon:'bulb'  },
    logic:  { name:'Logic Puzzles',color:'#3BCEAC', unit:'Puzzle',   icon:'logic' },
    maths:  { name:'Maths Sprint', color:'#FF8C42', unit:'Question', icon:'bolt'  },
    sudoku: { name:'Sudoku',       color:'#A78BFA', unit:'',         icon:'grid'  }
  };

  var BL = null;          // the Brain Quest for the date open on the child's page
  var BANK = {};          // "class|day" -> { riddle:[], logic:[], maths:[] }
  var MAXDAY = {};        // class -> highest day in the table
  var TICK = null;        // sprint timer

  // ---- helpers ----------------------------------------------------------------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function classNo(){ return parseInt(String(window.niyamChildClass || '').replace(/\D/g,''), 10) || 4; }
  function today(){ return new Date().toLocaleDateString('en-CA'); }
  function dateOpen(){ return ($('rpt-date') && $('rpt-date').value) || today(); }
  function days(){ return (typeof savedDays !== 'undefined' && Array.isArray(savedDays)) ? savedDays : []; }
  function parse(s){ try{ var v = JSON.parse(s); return (v && typeof v === 'object') ? v : null; }catch(e){ return null; } }
  function childName(){ return window.niyamChildName || 'Your'; }

  var ICON = {
    bulb:  '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    logic: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5l3 8M16 7.5l-3 8M8.5 6h7"/>',
    bolt:  '<path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z"/>',
    grid:  '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    cross: '<path d="M6 6l12 12M18 6L6 18"/>',
    back:  '<path d="M15 6l-6 6 6 6"/>',
    star:  '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    flame: '<path d="M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 11.5c0-1.6.8-2.6 1.6-3.4.3 1.5 1.1 2.2 1.9 2.2 0-2.6-.5-4.8.5-7.3z"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
    trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>'
  };
  function icon(k, size, sw){
    return '<svg width="' + (size||22) + '" height="' + (size||22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw||2.4)
      + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>';
  }

  // ---- state --------------------------------------------------------------------
  function fresh(date){
    return { date:date, view:'home', day:0, loaded:false, loading:false, error:'',
      riddle:{ ans:{}, hint:{}, i:0, pick:'', done:false },
      logic: { ans:{}, i:0, pick:'', done:false },
      maths: { ans:{}, i:0, pick:'', done:false, mins:TIMER_DEFAULT, started:false, endAt:0, left:0, paused:false },
      sudoku:{ level:'', cells:{}, sel:-1, done:false, ok:false } };
  }
  // what is saved with the day
  function snapshot(){
    if(!BL) return null;
    var m = BL.maths;
    return { v:1, day:BL.day,
      riddle:{ ans:BL.riddle.ans, hint:BL.riddle.hint, done:BL.riddle.done },
      logic: { ans:BL.logic.ans, done:BL.logic.done },
      maths: { ans:m.ans, done:m.done, mins:m.mins, started:m.started, endAt:m.endAt, left:m.left, paused:m.paused },
      sudoku:{ level:BL.sudoku.level, cells:BL.sudoku.cells, done:BL.sudoku.done, ok:BL.sudoku.ok } };
  }
  // newOnly: count only days played in this Brain Lab (for the child's Day number)
  function played(rec, newOnly){
    var st = parse(rec && rec.brainStateJSON);
    if(st){
      if(st.sudoku && st.sudoku.level) return true;
      for(var g of ['riddle','logic','maths']) if(st[g] && Object.keys(st[g].ans || {}).length) return true;
      return false;
    }
    if(newOnly) return false;
    return !!rec && ((+rec.savedSudokuPts||0) + (+rec.savedLogicPts||0) + (+rec.savedMathsPts||0) + (+rec.savedRiddlePts||0)) > 0;
  }
  // the child's own day: 1 + the days before this one on which they played
  function dayFor(date){
    var n = 0;
    days().forEach(function(d){ if(d && d.date && d.date < date && played(d, true)) n++; });
    return n + 1;
  }
  function streak(){
    var set = {};
    days().forEach(function(d){ if(d && d.date && played(d)) set[d.date] = 1; });
    if(anyPlayed()) set[BL.date] = 1;
    var n = 0, d = new Date(BL.date + 'T12:00:00');
    if(!set[BL.date]) d.setDate(d.getDate() - 1);
    while(set[d.toLocaleDateString('en-CA')]){ n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function ensure(){
    var date = dateOpen();
    if(BL && BL.date === date) return;
    stopTick();
    BL = fresh(date);
    var rec = days().find(function(d){ return d.date === date; });
    var st = parse(rec && rec.brainStateJSON);
    if(st){
      BL.day = st.day || dayFor(date);
      ['riddle','logic','maths','sudoku'].forEach(function(g){ if(st[g]) Object.assign(BL[g], st[g]); });
      BL.riddle.i = firstOpen('riddle'); BL.logic.i = firstOpen('logic'); BL.maths.i = firstOpen('maths');
    } else {
      BL.day = dayFor(date);
    }
    // Back on the page after reading an explanation: the clock runs again on the next question.
    if(BL.maths.started && !BL.maths.done && BL.maths.paused && BL.maths.mins){ BL.maths.endAt = Date.now() + BL.maths.left; BL.maths.paused = false; }
    if(BL.maths.started && !BL.maths.done) resumeSprint();
  }
  function firstOpen(g){
    for(var i = 0; i < COUNT[g]; i++) if(BL[g].ans[i] === undefined) return i;
    return COUNT[g] - 1;
  }
  function anyPlayed(){
    if(!BL) return false;
    return !!BL.sudoku.level || ['riddle','logic','maths'].some(function(g){ return Object.keys(BL[g].ans).length > 0; });
  }
  function locked(){
    var rec = days().find(function(d){ return d.date === BL.date; });
    return !!(rec && rec.approved === true);
  }

  // ---- questions ------------------------------------------------------------------
  function list(g){ var b = BANK[classNo() + '|' + BL.day]; return (b && b[g]) || []; }
  async function load(){
    if(!BL || BL.loaded || BL.loading) return;
    var cls = classNo(), key = cls + '|' + BL.day;
    if(BANK[key]){ BL.loaded = true; return; }
    BL.loading = true;
    try{
      if(typeof _supabase === 'undefined' || !_supabase){ BL.error = 'offline'; return; }
      if(MAXDAY[cls] === undefined){
        var r = await _supabase.from('brain_questions').select('day').eq('class', cls).order('day', { ascending:false }).limit(1);
        if(r.error){ BL.error = 'missing'; console.warn('[brain] questions table:', r.error); return; }
        MAXDAY[cls] = (r.data || []).reduce(function(m, x){ return Math.max(m, +x.day || 0); }, 0);
      }
      if(!MAXDAY[cls]){ BL.error = 'empty'; return; }
      var use = ((BL.day - 1) % MAXDAY[cls]) + 1;
      var r2 = await _supabase.from('brain_questions').select('*').eq('class', cls).eq('day', use);
      if(r2.error){ BL.error = 'offline'; console.warn('[brain] load:', r2.error); return; }
      var b = { riddle:[], logic:[], maths:[] };
      (r2.data || []).forEach(function(q){ if(b[q.game]) b[q.game].push(q); });
      Object.keys(b).forEach(function(g){ b[g].sort(function(x, y){ return x.slot - y.slot; }); b[g] = b[g].slice(0, COUNT[g]); });
      BANK[key] = b; BL.loaded = true; BL.error = '';
    } finally {
      BL.loading = false;
      render();
    }
  }
  function opt(q, L){ return q ? q['option_' + L.toLowerCase()] : ''; }

  // ---- points ----------------------------------------------------------------------
  function score(){
    var s = { riddle:0, logic:0, maths:0, sudoku:0, bonus:0 };
    var R = list('riddle');
    Object.keys(BL.riddle.ans).forEach(function(i){
      var q = R[i]; if(q && BL.riddle.ans[i] === q.answer) s.riddle += PTS.riddle - (BL.riddle.hint[i] ? PTS.hintCost : 0);
    });
    ['logic','maths'].forEach(function(g){
      var Q = list(g);
      Object.keys(BL[g].ans).forEach(function(i){ var q = Q[i]; if(q && BL[g].ans[i] === q.answer) s[g] += PTS[g]; });
    });
    if(BL.sudoku.ok) s.sudoku = PTS.sudoku[BL.sudoku.level] || 0;
    if(allDone()) s.bonus = PTS.bonus;
    s.total = s.riddle + s.logic + s.maths + s.sudoku + s.bonus;
    return s;
  }
  function allDone(){ return BL.riddle.done && BL.logic.done && BL.maths.done && BL.sudoku.done; }
  function maxToday(){ return COUNT.riddle * PTS.riddle + COUNT.logic * PTS.logic + COUNT.maths * PTS.maths + PTS.sudoku.hard + PTS.bonus; }
  function rightCount(g){
    var Q = list(g), n = 0;
    Object.keys(BL[g].ans).forEach(function(i){ if(Q[i] && BL[g].ans[i] === Q[i].answer) n++; });
    return n;
  }
  // Put the points where the rest of the app reads them, then save.
  function apply(saveNow){
    if(!BL || locked()) return;
    var s = score();
    try{
      riddlePtsTotal = s.riddle; logicPtsTotal = s.logic; mathsPtsToday = s.maths;
      sudokuPts = s.sudoku; worksheetPts = s.bonus;
      brainPtsToday = s.riddle + s.logic + s.maths + s.sudoku + s.bonus;
      logicFrozen = BL.logic.done; mathsFrozen = BL.maths.done; mathsChecked = BL.maths.done; sudokuFrozen = BL.sudoku.done;
    }catch(e){ console.warn('[brain] points:', e); }
    if(typeof ttSyncBrainLabPts === 'function') ttSyncBrainLabPts();
    if(typeof calcDayPts === 'function') calcDayPts();
    if(saveNow && typeof ttSaveNow === 'function') ttSaveNow();
    else if(typeof ttQueueSave === 'function') ttQueueSave();
  }

  // ---- Maths Sprint timer --------------------------------------------------------------
  function stopTick(){ if(TICK){ clearInterval(TICK); TICK = null; } }
  function msLeft(){
    var m = BL.maths;
    if(!m.mins) return Infinity;
    return m.paused ? m.left : Math.max(0, m.endAt - Date.now());
  }
  function fmtLeft(ms){
    if(ms === Infinity) return 'No timer';
    var s = Math.ceil(ms / 1000), mm = Math.floor(s / 60), ss = s % 60;
    return (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
  }
  function startTick(){
    stopTick();
    if(!BL.maths.mins) return;
    TICK = setInterval(function(){
      if(!BL || BL.maths.done){ stopTick(); return; }
      var left = msLeft();
      var el = $('bl-timer'); if(el) el.textContent = fmtLeft(left);
      var bar = $('bl-timebar'); if(bar) bar.style.width = Math.max(0, Math.min(100, left / (BL.maths.mins * 600))) + '%';
      if(left <= 0 && !BL.maths.paused) timeUp();
    }, 1000);
  }
  function resumeSprint(){
    if(BL.maths.mins && !BL.maths.paused && BL.maths.endAt && BL.maths.endAt <= Date.now()){ timeUp(true); return; }
    startTick();
  }
  function timeUp(quiet){
    var m = BL.maths;
    for(var i = 0; i < COUNT.maths; i++) if(m.ans[i] === undefined) m.ans[i] = '-';
    m.done = true; m.pick = ''; m._showSummary = true; stopTick();
    apply(true);
    if(!quiet && typeof toast === 'function') toast('⏰ Time is up! Here is how you did.');
    render();
  }

  // ---- Sudoku (built here, the same puzzle for everyone on the same day) ----------------
  function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffled(arr, r){ var a = arr.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function okAt(g, i, n){
    var r = Math.floor(i / 9), c = i % 9, br = r - r % 3, bc = c - c % 3;
    for(var k = 0; k < 9; k++){ if(g[r * 9 + k] === n || g[k * 9 + c] === n) return false; }
    for(var a = 0; a < 3; a++) for(var b = 0; b < 3; b++) if(g[(br + a) * 9 + bc + b] === n) return false;
    return true;
  }
  function fill(g, r){
    var i = g.indexOf(0); if(i < 0) return true;
    var nums = shuffled([1,2,3,4,5,6,7,8,9], r);
    for(var k = 0; k < 9; k++){ if(okAt(g, i, nums[k])){ g[i] = nums[k]; if(fill(g, r)) return true; g[i] = 0; } }
    return false;
  }
  // How many solutions (stops at limit). Tries the box with the fewest choices first, so it is quick.
  function countSol(g, limit){
    var best = -1, bestC = null;
    for(var i = 0; i < 81; i++){
      if(g[i]) continue;
      var c = [];
      for(var v = 1; v <= 9; v++) if(okAt(g, i, v)) c.push(v);
      if(!c.length) return 0;
      if(!bestC || c.length < bestC.length){ best = i; bestC = c; if(c.length === 1) break; }
    }
    if(best < 0) return 1;
    var n = 0;
    for(var k = 0; k < bestC.length && n < limit; k++){ g[best] = bestC[k]; n += countSol(g, limit - n); }
    g[best] = 0;
    return n;
  }
  var PUZZLES = {};
  function puzzle(level){
    var key = classNo() + '|' + BL.day + '|' + level;
    if(PUZZLES[key]) return PUZZLES[key];
    var r = rng(classNo() * 100003 + BL.day * 31 + ({ easy:1, medium:2, hard:3 })[level]);
    var sol = new Array(81).fill(0); fill(sol, r);
    var p = sol.slice(), given = 81;
    var order = shuffled(Array.from({ length:81 }, function(_, i){ return i; }), r);
    for(var k = 0; k < order.length && given > GIVEN[level]; k++){
      var i = order[k], keep = p[i]; p[i] = 0;
      if(countSol(p.slice(), 2) !== 1) p[i] = keep; else given--;
    }
    return (PUZZLES[key] = { sol:sol, start:p });
  }

  // ---- styles --------------------------------------------------------------------------
  var CSS = ''
  + '#bl-root{font-family:Nunito,system-ui,sans-serif;color:#111;background:#FFF6DE;background-image:radial-gradient(#F2DFA7 1.4px,transparent 1.5px);'
  +   'background-size:14px 14px;border:3px solid #111;border-radius:22px;padding:18px 16px 22px;max-width:560px;margin:0 auto;box-sizing:border-box}'
  + '#tab-brain>:not(#bl-root){display:none!important}'          // the old Brain Lab screens
  + '#bl-root *{box-sizing:border-box}'
  + '#bl-root .bl-h{font-family:"Baloo 2",Nunito,sans-serif;font-weight:800;line-height:1.15}'
  + '#bl-root .bl-card{background:#fff;border:3px solid #111;box-shadow:4px 4px 0 #111;border-radius:16px}'
  + '#bl-root button{font-family:inherit;cursor:pointer;color:#111}'
  + '#bl-root .bl-btn{min-height:50px;border:3px solid #111;box-shadow:4px 4px 0 #111;border-radius:14px;background:#FF3D7F;font-family:"Baloo 2",Nunito,sans-serif;'
  +   'font-weight:800;font-size:18px;padding:8px 16px;width:100%}'
  + '#bl-root .bl-btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #111}'
  + '#bl-root .bl-btn[disabled]{opacity:.45;cursor:default}'
  + '#bl-root .bl-mini{width:44px;height:44px;border:3px solid #111;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:3px 3px 0 #111;flex:0 0 auto}'
  + '#bl-root .bl-chip{display:inline-flex;align-items:center;gap:6px;border:2.5px solid #111;border-radius:999px;padding:4px 12px;font-weight:900;font-size:13px;background:#fff}'
  + '#bl-root .bl-top{display:flex;align-items:center;justify-content:space-between;gap:10px}'
  + '#bl-root .bl-game{display:flex;align-items:center;gap:12px;padding:12px;width:100%;text-align:left}'
  + '#bl-root .bl-dot{width:52px;height:52px;border-radius:50%;border:3px solid #111;display:flex;align-items:center;justify-content:center;flex:0 0 auto}'
  + '#bl-root .bl-opt{min-height:56px;border:3px solid #111;border-radius:14px;background:#fff;font-weight:900;font-size:16px;padding:8px 12px;box-shadow:3px 3px 0 #111;text-align:left}'
  + '#bl-root .bl-opt.pick{background:#FFE58A}'
  + '#bl-root .bl-opt.right{background:#BBF7D0}'
  + '#bl-root .bl-opt.wrong{background:#FECACA}'
  + '#bl-root .bl-opt[disabled]{cursor:default}'
  + '#bl-root .bl-seg{flex:1;height:10px;border:2px solid #111;border-radius:99px;background:#fff}'
  + '#bl-root .bl-cell{aspect-ratio:1/1;border:0;border-right:1px solid #CBD5E1;border-bottom:1px solid #CBD5E1;background:#fff;'
  +   'font-family:"Baloo 2",Nunito,sans-serif;font-weight:800;font-size:clamp(15px,4.6vw,22px);padding:0;display:flex;align-items:center;justify-content:center}'
  + '#bl-root .bl-cell.g{background:#EDE9FE;cursor:default}'
  + '#bl-root .bl-cell.sel{background:#FFE58A}'
  + '#bl-root .bl-cell.bad{background:#FECACA}'
  + '#bl-root .bl-num{height:46px;border:3px solid #111;border-radius:12px;background:#fff;font-family:"Baloo 2",Nunito,sans-serif;font-weight:800;font-size:20px;box-shadow:3px 3px 0 #111}'
  + '#bl-root .bl-explain{background:#fff;border:3px solid #111;border-radius:16px;padding:14px 16px;box-shadow:4px 4px 0 #111}';

  function addStyles(){
    if($('bl-style')) return;
    var st = document.createElement('style'); st.id = 'bl-style'; st.textContent = CSS; document.head.appendChild(st);
    if(!document.querySelector('link[data-bl-font]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-bl-font', '1');
      l.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap';
      document.head.appendChild(l);
    }
  }
  // The new root sits at the top of the tab; the old screens are hidden.
  function root(){
    var tab = $('tab-brain'); if(!tab) return null;
    var r = $('bl-root');
    if(!r){
      addStyles();
      r = document.createElement('div'); r.id = 'bl-root';
      tab.insertBefore(r, tab.firstChild);
      r.addEventListener('click', onClick);
    }
    return r;
  }

  // ---- screens --------------------------------------------------------------------------
  function header(title, color, right){
    return '<div class="bl-top"><button class="bl-mini" data-act="home" aria-label="Back to Brain Quest">' + icon('back', 20, 2.8) + '</button>'
      + '<div class="bl-h" style="font-size:21px;color:#111">' + title + '</div>' + (right || '<div style="width:44px"></div>') + '</div>';
  }

  function homeHtml(){
    var s = score(), mx = maxToday(), pct = Math.min(100, Math.round(s.total / mx * 100));
    var st = streak(), name = childName();
    var h = '<div class="bl-top"><div class="bl-h" style="font-size:22px">Brain Lab</div>'
      + '<span class="bl-chip" style="background:#3BCEAC">Class ' + classNo() + '</span></div>'
      + '<div style="display:flex;align-items:center;gap:14px;margin-top:12px">'
      +   '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:900;color:#3D3D3D">Day ' + BL.day + ' · '
      +   new Date(BL.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' }) + '</div>'
      +   '<div class="bl-h" style="font-size:30px;margin-top:2px">' + esc(name) + (name === 'Your' ? '' : '’s') + '<br>Brain Quest</div>'
      +   (st ? '<div style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:13px;font-weight:900;color:#B4235A">' + icon('flame', 16, 2.4) + ' ' + st + '-day brain streak</div>' : '')
      +   '</div>'
      +   '<div style="width:104px;height:104px;border-radius:50%;border:3px solid #111;background:conic-gradient(#FF3D7F 0 ' + pct + '%,#F2DFA7 ' + pct + '% 100%);display:flex;align-items:center;justify-content:center;flex:0 0 auto">'
      +     '<div style="width:78px;height:78px;border-radius:50%;background:#fff;border:3px solid #111;display:flex;flex-direction:column;align-items:center;justify-content:center">'
      +     '<div class="bl-h" style="font-size:27px;line-height:1">' + s.total + '</div><div style="font-size:11px;font-weight:900">of ' + mx + ' pts</div></div></div>'
      + '</div>';

    if(allDone()){
      h += '<div class="bl-card" style="margin-top:16px;padding:16px;background:#FFD23F;text-align:center">'
        + '<div style="display:flex;justify-content:center">' + icon('trophy', 44, 1.8) + '</div>'
        + '<div class="bl-h" style="font-size:26px;margin-top:4px">Brain Quest complete!</div>'
        + '<div style="font-weight:900;margin-top:4px">+' + s.total + ' points today · new puzzles tomorrow</div></div>';
    }
    if(locked()){
      h += '<div class="bl-card" style="margin-top:14px;padding:10px 14px;font-weight:800;font-size:13px">Today is approved by your parent, so the games are closed for this day.</div>';
    }

    var next = GAMES.find(function(g){ return !BL[g].done; });
    h += '<div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">';
    GAMES.forEach(function(g){
      var L = LOOK[g], done = BL[g].done, isNext = g === next && !locked();
      var sub, right;
      if(g === 'sudoku'){
        sub = done ? (BL.sudoku.ok ? 'Solved · ' + BL.sudoku.level : 'Tried · ' + BL.sudoku.level + ' · come back tomorrow') : 'Easy, Medium or Hard · up to ' + PTS.sudoku.hard + ' pts';
        right = done ? '+' + s.sudoku : '';
      } else {
        var n = Object.keys(BL[g].ans).length;
        sub = done ? rightCount(g) + ' of ' + COUNT[g] + ' right · done for today'
            : n ? n + ' of ' + COUNT[g] + ' answered'
            : COUNT[g] + ' ' + (g === 'riddle' ? 'riddles' : g === 'logic' ? 'puzzles' : 'questions') + ' · up to ' + COUNT[g] * PTS[g] + ' pts';
        right = done ? '+' + s[g] : '';
      }
      var dot = '<div class="bl-dot" style="background:' + (done ? L.color : '#fff') + '">' + icon(done ? 'check' : L.icon, 24, done ? 3 : 2.4) + '</div>';
      if(isNext){
        h += '<div class="bl-card" style="padding:14px;background:' + L.color + '"><div style="display:flex;align-items:center;gap:12px">' + dot.replace('background:#fff', 'background:#fff')
          + '<div style="flex:1"><div class="bl-h" style="font-size:20px">' + L.name + '</div><div style="font-size:12.5px;font-weight:900">' + sub + '</div></div></div>'
          + '<button class="bl-btn" style="margin-top:12px;background:#fff" data-act="go" data-g="' + g + '">' + (Object.keys(BL[g].ans || {}).length || (g === 'sudoku' && BL.sudoku.level) ? 'Carry on' : 'Start ' + L.name) + '</button></div>';
      } else {
        h += '<button class="bl-card bl-game" data-act="' + (done ? 'review' : 'go') + '" data-g="' + g + '">' + dot
          + '<div style="flex:1;min-width:0"><div class="bl-h" style="font-size:18px">' + L.name + '</div><div style="font-size:12px;font-weight:800;color:#3D3D3D">' + sub + '</div></div>'
          + '<div class="bl-h" style="font-size:18px">' + (right || 'Play') + '</div></button>';
      }
    });
    h += '</div>';
    var nDone = GAMES.filter(function(g){ return BL[g].done; }).length;
    h += '<div class="bl-card" style="margin-top:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;border-style:dashed">'
      + icon('star', 26, 2.2) + '<div style="flex:1;font-weight:900;font-size:13.5px">' + (nDone === 4 ? 'All four done — +' + PTS.bonus + ' bonus earned!' : 'Finish all four today for a +' + PTS.bonus + ' bonus') + '</div>'
      + '<div class="bl-h" style="font-size:18px">' + nDone + '/4</div></div>';
    return h;
  }

  function noQuestions(){
    var msg = BL.error === 'missing' ? 'The question table is not set up yet. Ask your parent to finish the Brain Lab setup.'
            : BL.error === 'empty'   ? 'There are no questions for Class ' + classNo() + ' yet. They are coming soon!'
            : BL.error === 'offline' ? 'Could not load today’s questions. Check the internet and try again.'
            : 'Loading today’s questions…';
    return '<div class="bl-card" style="margin-top:18px;padding:18px;font-weight:800;text-align:center">' + msg
      + (BL.error === 'offline' ? '<button class="bl-btn" style="margin-top:12px" data-act="retry">Try again</button>' : '') + '</div>';
  }

  function quizHtml(g){
    var L = LOOK[g], Q = list(g), S = BL[g];
    if(!Q.length) return header(L.name, L.color) + noQuestions();
    if(g === 'maths' && !S.started && !S.done) return sprintSetupHtml();
    if(S.done && S._showSummary) return summaryHtml(g);
    var i = S.i, q = Q[i] || Q[0], ans = S.ans[i], answered = ans !== undefined;
    var right = (g === 'maths' || g === 'logic' || g === 'riddle') ? PTS[g] : 0;
    var chip = g === 'maths'
      ? '<span class="bl-chip" style="background:#fff">' + icon('clock', 16, 2.4) + ' <span id="bl-timer">' + fmtLeft(msLeft()) + '</span></span>'
      : '<span class="bl-chip" style="background:' + L.color + '">' + right + ' pts</span>';
    var h = header(L.unit + ' ' + (i + 1) + ' of ' + COUNT[g], L.color, chip);
    if(g === 'maths' && S.mins){
      var w = Math.max(0, Math.min(100, msLeft() / (S.mins * 600)));
      h += '<div style="height:12px;border:2.5px solid #111;border-radius:99px;background:#fff;margin-top:14px;overflow:hidden"><div id="bl-timebar" style="height:100%;width:' + w + '%;background:#FF8C42"></div></div>';
    }
    // progress
    h += '<div style="display:flex;gap:6px;margin-top:12px">';
    for(var k = 0; k < COUNT[g]; k++){
      var a = S.ans[k], col = a === undefined ? (k === i ? L.color : '#fff') : (Q[k] && a === Q[k].answer ? '#22C55E' : '#F87171');
      h += '<div class="bl-seg" style="background:' + col + '"></div>';
    }
    h += '</div>';
    // a streak of right answers
    var run = 0; for(var k2 = i - (answered ? 0 : 1); k2 >= 0; k2--){ if(Q[k2] && S.ans[k2] === Q[k2].answer) run++; else break; }
    if(run >= 2 && g !== 'riddle') h += '<div style="margin-top:12px"><span class="bl-chip" style="background:#BBF7D0">' + icon('flame', 15, 2.4) + ' ' + run + ' in a row</span></div>';

    h += '<div class="bl-card" style="margin-top:14px;padding:18px 16px;background:' + (g === 'riddle' ? L.color : '#fff') + '">'
      + '<div style="font-size:11.5px;font-weight:900;letter-spacing:.1em">' + esc(String(q.topic || L.name).toUpperCase()) + '</div>'
      + '<div class="bl-h" style="font-size:' + (g === 'riddle' ? 22 : 20) + 'px;font-weight:700;margin-top:6px">' + esc(q.question) + '</div></div>';

    if(g === 'riddle' && q.hint){
      if(S.hint[i]) h += '<div class="bl-card" style="margin-top:12px;padding:12px 14px;display:flex;gap:10px">' + icon('bulb', 22, 2.2)
        + '<div><div style="font-size:12px;font-weight:900">HINT · −' + PTS.hintCost + ' points</div><div style="font-weight:800;margin-top:2px">' + esc(q.hint) + '</div></div></div>';
      else if(!answered) h += '<button class="bl-card" data-act="hint" style="margin-top:12px;padding:10px 14px;display:flex;gap:10px;align-items:center;width:100%;font-weight:900">'
        + icon('bulb', 22, 2.2) + ' Show a hint (costs ' + PTS.hintCost + ' points)</button>';
    }

    h += '<div style="display:grid;grid-template-columns:' + (g === 'riddle' ? 'repeat(2,minmax(0,1fr))' : '1fr') + ';gap:10px;margin-top:14px">';
    ['A','B','C','D'].forEach(function(Lt){
      var cls = 'bl-opt';
      if(answered){ if(Lt === q.answer) cls += ' right'; else if(Lt === ans) cls += ' wrong'; }
      else if(S.pick === Lt) cls += ' pick';
      h += '<button class="' + cls + '" data-act="pick" data-l="' + Lt + '"' + (answered ? ' disabled' : '') + '>'
        + (g === 'riddle' ? '' : Lt + ' · ') + esc(opt(q, Lt)) + '</button>';
    });
    h += '</div>';

    if(answered){
      var ok = ans === q.answer, pts = ok ? (g === 'riddle' && S.hint[i] ? PTS.riddle - PTS.hintCost : right) : 0;
      h += '<div class="bl-explain" style="margin-top:14px;background:' + (ok ? '#DCFCE7' : '#FFF') + '">'
        + '<div class="bl-h" style="font-size:19px">' + (ans === '-' ? 'Time ran out for this one' : ok ? 'Right! +' + pts + ' points' : 'Nearly! Here’s the trick') + '</div>'
        + (ok ? '' : '<div style="font-weight:900;margin-top:4px">Answer: ' + esc(opt(q, q.answer)) + '</div>')
        + '<div style="font-weight:700;line-height:1.55;margin-top:6px">' + esc(q.explanation) + '</div></div>';
      if(!ok) h += '<div style="text-align:center;font-size:12.5px;font-weight:800;margin-top:10px">No points lost for a wrong answer — now you know the trick!</div>';
      var last = i >= COUNT[g] - 1;
      h += '<button class="bl-btn" style="margin-top:16px;background:' + L.color + '" data-act="next">' + (last ? 'See my score' : 'Next ' + L.unit.toLowerCase()) + '</button>';
    } else {
      h += '<button class="bl-btn" style="margin-top:16px" data-act="check"' + (S.pick ? '' : ' disabled') + '>Check my answer</button>';
    }
    return h;
  }

  function sprintSetupHtml(){
    var m = BL.maths;
    var h = header('Maths Sprint', LOOK.maths.color)
      + '<div class="bl-card" style="margin-top:16px;padding:18px;background:#FF8C42">'
      + '<div class="bl-h" style="font-size:24px">Ready for 10 questions?</div>'
      + '<div style="font-weight:800;margin-top:6px;line-height:1.5">' + PTS.maths + ' points for each right answer. Every answer is explained. The clock stops while you read the explanation.</div></div>'
      + '<div class="bl-h" style="font-size:18px;margin-top:18px">How much time do you want?</div>'
      + '<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px">';
    TIMER_CHOICES.forEach(function(t){
      h += '<button class="bl-opt' + (m.mins === t ? ' pick' : '') + '" style="text-align:center;padding:8px 4px;font-size:15px" data-act="mins" data-m="' + t + '">'
        + (t ? t + '<div style="font-size:11px">min</div>' : 'No<div style="font-size:11px">timer</div>') + '</button>';
    });
    h += '</div><div style="font-size:12.5px;font-weight:800;margin-top:10px">Pick the time that suits you. You get the same points whichever you choose.</div>'
      + '<button class="bl-btn" style="margin-top:18px;background:#FF8C42" data-act="start-sprint">Start the sprint</button>';
    return h;
  }

  function summaryHtml(g){
    var L = LOOK[g], n = rightCount(g), s = score();
    return header(L.name, L.color)
      + '<div class="bl-card" style="margin-top:18px;padding:22px;text-align:center;background:' + L.color + '">'
      + '<div style="display:flex;justify-content:center">' + icon('trophy', 44, 1.8) + '</div>'
      + '<div class="bl-h" style="font-size:26px;margin-top:6px">' + n + ' of ' + COUNT[g] + ' right!</div>'
      + '<div class="bl-h" style="font-size:40px">+' + s[g] + '</div><div style="font-weight:900">points</div></div>'
      + '<button class="bl-btn" style="margin-top:16px;background:#fff" data-act="review" data-g="' + g + '">See all answers</button>'
      + '<button class="bl-btn" style="margin-top:12px" data-act="home">Back to Brain Quest</button>';
  }

  function reviewHtml(g){
    var L = LOOK[g];
    if(g === 'sudoku') return sudokuHtml();
    var Q = list(g), S = BL[g];
    if(!Q.length) return header(L.name, L.color) + noQuestions();
    var h = header('Your ' + L.name, L.color) + '<div style="display:flex;flex-direction:column;gap:12px;margin-top:14px">';
    Q.forEach(function(q, i){
      var a = S.ans[i], ok = a === q.answer;
      h += '<div class="bl-card" style="padding:14px"><div style="display:flex;gap:8px;align-items:flex-start">'
        + '<span class="bl-chip" style="background:' + (ok ? '#BBF7D0' : '#FECACA') + '">' + icon(ok ? 'check' : 'cross', 14, 3) + ' ' + (i + 1) + '</span>'
        + '<div style="font-weight:900;line-height:1.45">' + esc(q.question) + '</div></div>'
        + '<div style="margin-top:8px;font-weight:800">Answer: ' + esc(opt(q, q.answer)) + (ok || a === undefined ? '' : a === '-' ? ' · time ran out' : ' · you chose ' + esc(opt(q, a))) + '</div>'
        + '<div style="margin-top:6px;font-weight:700;line-height:1.5;color:#3D3D3D">' + esc(q.explanation) + '</div></div>';
    });
    return h + '</div><button class="bl-btn" style="margin-top:16px" data-act="home">Back to Brain Quest</button>';
  }

  function sudokuHtml(){
    var S = BL.sudoku, L = LOOK.sudoku;
    if(!S.level){
      var h = header('Sudoku', L.color)
        + '<div class="bl-h" style="font-size:24px;margin-top:14px">Pick today’s challenge</div>'
        + '<div style="font-weight:800;margin-top:4px">One puzzle a day. The harder it is, the more points it is worth.</div>'
        + '<div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">';
      [['easy','Easy','A warm-up'],['medium','Medium','A real challenge'],['hard','Hard','For champions']].forEach(function(x, k){
        var bars = ''; for(var b = 0; b < 3; b++) bars += '<div style="width:10px;height:22px;border:2px solid #111;border-radius:3px;background:' + (b <= k ? '#A78BFA' : '#fff') + '"></div>';
        h += '<button class="bl-card bl-game" data-act="level" data-lv="' + x[0] + '" style="' + (S.pick === x[0] ? 'background:#EDE9FE' : '') + '">'
          + '<div style="display:flex;gap:3px">' + bars + '</div>'
          + '<div style="flex:1"><div class="bl-h" style="font-size:18px">' + x[1] + (x[0] === 'medium' ? ' <span class="bl-chip" style="font-size:11px;padding:1px 8px;background:#A78BFA">Best for Class 4</span>' : '') + '</div>'
          + '<div style="font-size:12px;font-weight:800">' + x[2] + ' · ' + GIVEN[x[0]] + ' numbers given</div></div>'
          + '<div class="bl-h" style="font-size:20px">' + PTS.sudoku[x[0]] + '</div></button>';
      });
      return h + '</div><button class="bl-btn" style="margin-top:16px;background:#A78BFA" data-act="start-sudoku"' + (S.pick ? '' : ' disabled') + '>'
        + (S.pick ? 'Start ' + S.pick + ' · ' + PTS.sudoku[S.pick] + ' pts' : 'Pick a level first') + '</button>'
        + '<div style="text-align:center;font-size:12px;font-weight:800;margin-top:8px">Once you start, the level is fixed for today.</div>';
    }
    var P = puzzle(S.level), wrong = {};
    if(S.done && !S.ok) for(var i0 = 0; i0 < 81; i0++) if(!P.start[i0] && S.cells[i0] && S.cells[i0] !== P.sol[i0]) wrong[i0] = 1;
    var h2 = header('Sudoku · ' + S.level, L.color, '<span class="bl-chip" style="background:#A78BFA">' + PTS.sudoku[S.level] + ' pts</span>');
    h2 += '<div style="margin-top:14px;background:#fff;border:3px solid #111;border-radius:12px;padding:4px;box-shadow:4px 4px 0 #111">'
       + '<div style="display:grid;grid-template-columns:repeat(9,minmax(0,1fr))">';
    for(var i = 0; i < 81; i++){
      var r = Math.floor(i / 9), c = i % 9, given = !!P.start[i];
      var v = given ? P.start[i] : (S.done ? (S.cells[i] || P.sol[i]) : (S.cells[i] || ''));
      var bs = 'border-right:' + (c % 3 === 2 && c < 8 ? '3px solid #111' : '1px solid #CBD5E1') + ';border-bottom:' + (r % 3 === 2 && r < 8 ? '3px solid #111' : '1px solid #CBD5E1')
        + (S.done && !given && !S.cells[i] ? ';color:#16A34A' : '');
      var cls = 'bl-cell' + (given ? ' g' : '') + (S.sel === i ? ' sel' : '') + (wrong[i] ? ' bad' : '');
      h2 += '<button class="' + cls + '" style="' + bs + '" data-act="cell" data-i="' + i + '"' + (given || S.done ? ' disabled' : '') + ' aria-label="Row ' + (r + 1) + ' column ' + (c + 1) + '">' + v + '</button>';
    }
    h2 += '</div></div>';
    if(S.done){
      h2 += '<div class="bl-explain" style="margin-top:14px;background:' + (S.ok ? '#DCFCE7' : '#fff') + '"><div class="bl-h" style="font-size:20px">'
         + (S.ok ? 'Solved! +' + PTS.sudoku[S.level] + ' points' : 'Not quite this time') + '</div>'
         + '<div style="font-weight:800;margin-top:4px">' + (S.ok ? 'Brilliant thinking. A new puzzle comes tomorrow.' : 'The red boxes were wrong; the green numbers show the answers. Try again tomorrow!') + '</div></div>'
         + '<button class="bl-btn" style="margin-top:14px" data-act="home">Back to Brain Quest</button>';
    } else {
      h2 += '<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:14px">';
      for(var n = 1; n <= 9; n++) h2 += '<button class="bl-num" data-act="num" data-n="' + n + '">' + n + '</button>';
      h2 += '<button class="bl-num" data-act="num" data-n="0" style="font-size:14px">Erase</button></div>';
      var filled = Object.keys(S.cells).filter(function(k){ return S.cells[k]; }).length + P.start.filter(Boolean).length;
      h2 += '<button class="bl-btn" style="margin-top:14px;background:#A78BFA" data-act="check-sudoku"' + (filled === 81 ? '' : ' disabled') + '>'
         + (filled === 81 ? 'Check my Sudoku' : (81 - filled) + ' boxes left to fill') + '</button>'
         + '<div style="text-align:center;font-size:12px;font-weight:800;margin-top:8px">You can check only once, so look carefully first!</div>';
    }
    return h2;
  }

  function render(){
    var r = root(); if(!r) return;
    ensure();
    if(!BL.loaded && !BL.error) load();
    var v = BL.view, html;
    if(v === 'home') html = homeHtml();
    else if(v === 'sudoku') html = sudokuHtml();
    else if(v.indexOf('review-') === 0) html = reviewHtml(v.slice(7));
    else html = quizHtml(v);
    r.innerHTML = html;
    // A new screen starts at its top, not where the last one was scrolled to.
    if(r._view && r._view !== v){ try{ var top = r.getBoundingClientRect().top; if(top < 0 || top > 200) r.scrollIntoView({ block:'start', behavior:'instant' }); }catch(e){} }
    r._view = v;
    if(v === 'maths' && BL.maths.started && !BL.maths.done && !BL.maths.paused) startTick();
  }

  // ---- taps -------------------------------------------------------------------------------
  function onClick(e){
    var b = e.target.closest('[data-act]'); if(!b || b.disabled) return;
    var act = b.getAttribute('data-act'), g = b.getAttribute('data-g');
    if(act !== 'home' && act !== 'review' && act !== 'retry' && locked()){ if(typeof toast === 'function') toast('This day is approved — the games are closed.'); return; }
    if(act === 'home'){ BL.view = 'home'; stopTick(); }
    else if(act === 'retry'){ BL.error = ''; BL.loaded = false; load(); }
    else if(act === 'go'){ BL.view = g; if(g !== 'sudoku'){ BL[g].i = firstOpen(g); BL[g]._showSummary = false; } }
    else if(act === 'review'){ BL.view = g === 'sudoku' ? 'sudoku' : 'review-' + g; }
    else if(act === 'pick'){ var S = BL[BL.view]; if(S && S.ans[S.i] === undefined) S.pick = b.getAttribute('data-l'); }
    else if(act === 'hint'){ BL.riddle.hint[BL.riddle.i] = true; apply(false); }
    else if(act === 'check'){ answer(); }
    else if(act === 'next'){ nextQ(); }
    else if(act === 'mins'){ BL.maths.mins = +b.getAttribute('data-m'); }
    else if(act === 'start-sprint'){ startSprint(); }
    else if(act === 'level'){ BL.sudoku.pick = b.getAttribute('data-lv'); }
    else if(act === 'start-sudoku'){ if(BL.sudoku.pick){ BL.sudoku.level = BL.sudoku.pick; apply(true); } }
    else if(act === 'cell'){ BL.sudoku.sel = +b.getAttribute('data-i'); }
    else if(act === 'num'){ var Sd = BL.sudoku; if(Sd.sel >= 0 && !Sd.done){ var n = +b.getAttribute('data-n'); if(n) Sd.cells[Sd.sel] = n; else delete Sd.cells[Sd.sel]; if(typeof ttQueueSave === 'function') ttQueueSave(); } }
    else if(act === 'check-sudoku'){ checkSudoku(); }
    render();
  }

  function answer(){
    var g = BL.view, S = BL[g], q = list(g)[S.i];
    if(!q || !S.pick || S.ans[S.i] !== undefined) return;
    S.ans[S.i] = S.pick; S.pick = '';
    if(g === 'maths' && S.mins){ S.left = Math.max(0, S.endAt - Date.now()); S.paused = true; stopTick(); }   // the clock stops while reading
    if(Object.keys(S.ans).length >= COUNT[g]){ S.done = true; stopTick(); }
    apply(S.done);
    if(S.ans[S.i] === q.answer && typeof toast === 'function') toast(['Super!', 'Brilliant!', 'You got it!', 'Brain power!', 'Fantastic!'][S.i % 5] + ' +' + (g === 'riddle' && S.hint[S.i] ? PTS.riddle - PTS.hintCost : PTS[g]) + ' points');
  }
  function nextQ(){
    var g = BL.view, S = BL[g];
    if(S.i >= COUNT[g] - 1 || S.done){
      S._showSummary = true;
      if(!S.done){ S.done = true; apply(true); }
      return;
    }
    S.i++;
    if(g === 'maths' && S.mins && S.paused){ S.endAt = Date.now() + S.left; S.paused = false; }
  }
  function startSprint(){
    var m = BL.maths;
    m.started = true; m.i = 0;
    if(m.mins){ m.endAt = Date.now() + m.mins * 60000; m.paused = false; }
    apply(true);
  }
  function checkSudoku(){
    var S = BL.sudoku; if(!S.level || S.done) return;
    if(!confirm('Check your Sudoku now? You can check only once today.')) return;
    var P = puzzle(S.level), ok = true;
    for(var i = 0; i < 81; i++) if(!P.start[i] && S.cells[i] !== P.sol[i]){ ok = false; break; }
    S.done = true; S.ok = ok; S.sel = -1;
    apply(true);
    if(typeof toast === 'function') toast(ok ? '🎉 Sudoku solved! +' + PTS.sudoku[S.level] + ' points' : 'Good try! The answers are shown — new puzzle tomorrow.');
  }

  // ---- connections to the rest of the app ---------------------------------------------------
  // The day record carries what the child did in Brain Lab.
  if(typeof collectFormData === 'function'){
    var collect = collectFormData;
    collectFormData = function(date, pts){
      var d = collect(date, pts);
      try{
        if(BL && BL.date === date) d.brainStateJSON = JSON.stringify(snapshot());
        else {
          var rec = days().find(function(x){ return x.date === date; });
          if(rec && rec.brainStateJSON) d.brainStateJSON = rec.brainStateJSON;
        }
      }catch(e){}
      return d;
    };
  }
  // When another day is loaded, start again from its saved record.
  ['loadDraftDay', 'loadApprovedDay'].forEach(function(fn){
    if(typeof window[fn] !== 'function') return;
    var orig = window[fn];
    window[fn] = function(){
      var r = orig.apply(this, arguments);
      BL = null;
      try{ var t = $('tab-brain'); if(t && t.classList.contains('active')) render(); }catch(e){}
      return r;
    };
  });
  // Draw Brain Lab whenever its tab opens.
  if(typeof showTab === 'function'){
    var show = showTab;
    showTab = function(id, btn){
      var r = show.apply(this, arguments);
      if(id === 'brain'){ try{ if(BL && BL.date !== dateOpen()) BL = null; render(); }catch(e){ console.error('[brain] render:', e); } }
      return r;
    };
  }

  window.niyamBrainLab = { render: render, state: function(){ return BL; }, score: function(){ ensure(); return score(); } };
})();
