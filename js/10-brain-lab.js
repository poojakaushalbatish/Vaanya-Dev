// ============================================================================
// NIYAM — js/10-brain-lab.js
// The Brain Lab tab: four daily challenges set by great Indian thinkers, and
// the child's own banyan tree, which grows a leaf for every right answer.
// Loads LAST, after js/09-parent-review.js. Replaces the old Brain Lab screens
// (their markup stays in index.html, hidden, because old code still reads it).
//
//   Riddles       with Birbal & Tenali Rama   2 a day, hint costs 2 pts   5 pts each
//   Logic         with Chanakya               5 a day                    3 pts each
//   Maths Sprint  with Ramanujan              10 a day, own timer        3 pts each
//   Sudoku        from Lilavati's puzzle book Easy / Medium / Hard       15 / 30 / 40
//   All four done the same day                                         +10 bonus
//
// Leaves: 1 for every right answer, Sudoku 1 / 2 / 3 by level, and a golden
// leaf for finishing all four. A wrong answer never takes a leaf away. The tree
// belongs to the child and keeps growing from class to class; at MILESTONES it
// changes (a butterfly, aerial roots, a parrot …). Leaves change nothing in
// the points.
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
// the day as brainStateJSON (with that day's leaves, so the tree can be
// counted without the old questions).
// ============================================================================
(function(){
  'use strict';

  var PTS   = { riddle:5, hintCost:2, logic:3, maths:3, sudoku:{ easy:15, medium:30, hard:40 }, bonus:10 };
  var COUNT = { riddle:2, logic:5, maths:10 };
  var GIVEN = { easy:36, medium:30, hard:27 };       // numbers shown at the start of a Sudoku (fewer = harder)
  var SUDOKU_LEAVES = { easy:1, medium:2, hard:3 };
  var TIMER_CHOICES = [0, 5, 10, 15, 20];            // minutes; 0 = no timer
  var TIMER_DEFAULT = 10;
  var GAMES = ['riddle', 'logic', 'maths', 'sudoku'];
  var LOOK = {
    riddle: { name:'Riddles',      c:'#7A1F2B', unit:'Riddle',   icon:'bulb',  who:'with Birbal & Tenali Rama' },
    logic:  { name:'Logic',        c:'#0E6B70', unit:'Puzzle',   icon:'logic', who:'with Chanakya' },
    maths:  { name:'Maths Sprint', c:'#33307A', unit:'Question', icon:'bolt',  who:'with Ramanujan' },
    sudoku: { name:'Sudoku',       c:'#3D7A3A', unit:'',         icon:'grid',  who:'from Lilavati’s puzzle book' }
  };
  // The thinker who sets each challenge: initials for the seal, and what they say.
  var MENTOR = {
    birbal:   { name:'Birbal',      seal:'बी', c:'#7A1F2B', says:'A riddle from Emperor Akbar’s court. Think before you answer!' },
    tenali:   { name:'Tenali Rama', seal:'ते', c:'#7A1F2B', says:'A riddle from King Krishnadevaraya’s court. Don’t let it trick you!' },
    chanakya: { name:'Chanakya',    seal:'चा', c:'#0E6B70', says:['A wise mind looks for the rule hiding inside.', 'Read slowly. Every word is a clue.',
                'Think one step at a time.', 'Check each answer against the rule.', 'The last one! Stay calm and think it through.'] },
    ramanujan:{ name:'Ramanujan',   seal:'रा', c:'#33307A', says:'Numbers are friends. Some are fast friends, some are slow friends — take the time you need.' },
    lilavati: { name:'Lilavati’s puzzle book', seal:'ली', c:'#3D7A3A',
                says:'Bhaskaracharya wrote a book of maths puzzles more than 850 years ago and named it after his daughter, Lilavati. Here is today’s puzzle!' }
  };
  function mentorFor(g, i){
    if(g === 'riddle') return i === 1 ? MENTOR.tenali : MENTOR.birbal;
    return g === 'logic' ? MENTOR.chanakya : g === 'maths' ? MENTOR.ramanujan : MENTOR.lilavati;
  }
  function mentorSays(m, i){ return Array.isArray(m.says) ? m.says[i % m.says.length] : m.says; }

  // What grows on the tree, and when (total leaves).
  var MILESTONES = [
    [10,   'branch',    'its first branch'],
    [50,   'butterfly', 'a butterfly'],
    [100,  'root1',     'its first aerial root'],
    [150,  'parrot',    'a parrot'],
    [250,  'swing',     'a swing'],
    [400,  'figs',      'red banyan figs'],
    [600,  'squirrels', 'a squirrel family'],
    [800,  'root2',     'a second aerial root'],
    [1000, 'bench',     'a bench, and a 1,000-leaf certificate'],
    [1500, 'nest',      'a nest with baby birds'],
    [2000, 'fireflies', 'fireflies'],
    [3000, 'full',      'branches across the whole courtyard'],
    [4000, 'great',     'the Great Banyan'] ];

  // "Did you know?" — one a day, about Indian thinkers. Checked by Pooja and Claude.
  var FACTS = [
    'Chanakya taught at Takshashila, one of the world’s oldest centres of learning, more than 2,000 years ago.',
    'Chanakya helped Chandragupta Maurya become emperor and start the Maurya Empire.',
    'Chanakya is believed to have written the Arthashastra, a book about how to run a kingdom well.',
    'Birbal was one of the “nine jewels” — the nine most gifted people — in Emperor Akbar’s court.',
    'Birbal’s name before he joined Akbar’s court was Mahesh Das.',
    'Tenali Rama was a poet in the court of King Krishnadevaraya of the Vijayanagara Empire, about 500 years ago.',
    'Tenali Rama was one of the eight great poets of Krishnadevaraya’s court, and he wrote in Telugu.',
    'Srinivasa Ramanujan was born in Erode, Tamil Nadu, on 22 December 1887.',
    'India celebrates National Mathematics Day every year on 22 December — Ramanujan’s birthday.',
    'As a teenager, Ramanujan taught himself from a borrowed book of about 5,000 maths results.',
    'In 1913 Ramanujan wrote a letter full of new ideas to G. H. Hardy at Cambridge, and Hardy invited him to England.',
    '1729 is called the Ramanujan number: it is the smallest number you can make by adding two cubes in two different ways (1³ + 12³ and 9³ + 10³).',
    'Ramanujan became a Fellow of the Royal Society in 1918, at just 30 years old.',
    'Aryabhata wrote his famous book, the Aryabhatiya, in the year 499, when he was only 23.',
    'Aryabhata explained that the Earth spins on its own axis — that is why the stars seem to move across the sky.',
    'Aryabhata worked out that pi is about 3.1416 — very close to the value we use today.',
    'India’s first satellite, launched in 1975, was named Aryabhata.',
    'Bhaskaracharya finished his maths book Lilavati in the year 1150.',
    'Many of the puzzles in Lilavati are written as little poems — one is about bees flying around lotus flowers.',
    'About 1,400 years ago, Brahmagupta wrote down rules for adding, subtracting and multiplying with zero.',
    'The digits 0 to 9 that the whole world uses today first developed in India.',
    'In 1980 Shakuntala Devi multiplied two 13-digit numbers in her head in 28 seconds. People called her “the human computer”.',
    'About 2,500 years ago, Panini wrote nearly 4,000 short rules that describe the whole of Sanskrit grammar.',
    'More than 2,000 years ago, Pingala wrote patterns of short and long beats that work like the binary numbers computers use today.',
    'Baudhayana’s Sulba Sutra, written more than 2,500 years ago, gives a rule about right-angled triangles that we now call the Pythagoras theorem.',
    'Sushruta, a doctor of ancient India, described more than 300 kinds of surgery.',
    'The ancient thinker Kanada said that everything is made of tiny particles, which he called “anu”.',
    'About 600 years ago, Madhava of Sangamagrama in Kerala found new ways to work out pi very accurately.',
    'C. V. Raman won the Nobel Prize in Physics in 1930. India celebrates National Science Day on 28 February for his discovery.',
    'Varahamihira wrote about stars, weather, plants and animals in his great book, the Brihat Samhita, about 1,500 years ago.'
  ];
  var PRAISE = ['Brilliant thinking', 'Sharp thinking', 'What a mind', 'Wonderful work', 'Great thinking', 'Your tree is proud of you'];

  var BL = null;          // the Brain Lab day open on the child's page
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
  function childName(){ return window.niyamChildName || ''; }
  function possessive(){ var n = childName(); return n ? esc(n) + '’s' : 'My'; }

  var ICON = {
    bulb:  '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    logic: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5l3 8M16 7.5l-3 8M8.5 6h7"/>',
    bolt:  '<path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z"/>',
    grid:  '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    cross: '<path d="M6 6l12 12M18 6L6 18"/>',
    back:  '<path d="M15 6l-6 6 6 6"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
    flame: '<path d="M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 11.5c0-1.6.8-2.6 1.6-3.4.3 1.5 1.1 2.2 1.9 2.2 0-2.6-.5-4.8.5-7.3z"/>'
  };
  function icon(k, size, sw, color){
    return '<svg width="' + (size||22) + '" height="' + (size||22) + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="' + (sw||2.4)
      + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>';
  }
  function leafIcon(size, gold){
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4C9 4 4 10 4 20c10 0 16-5 16-16z" fill="'
      + (gold ? '#F2A007' : '#5FA86B') + '"' + (gold ? ' stroke="#C47F00" stroke-width="1"' : '') + '/></svg>';
  }

  // ---- state --------------------------------------------------------------------
  function fresh(date){
    return { date:date, view:'home', day:0, loaded:false, loading:false, error:'', celebrated:false,
      riddle:{ ans:{}, hint:{}, i:0, pick:'', done:false },
      logic: { ans:{}, i:0, pick:'', done:false },
      maths: { ans:{}, i:0, pick:'', done:false, mins:TIMER_DEFAULT, started:false, endAt:0, left:0, paused:false },
      sudoku:{ level:'', cells:{}, sel:-1, done:false, ok:false } };
  }
  // what is saved with the day
  function snapshot(){
    if(!BL) return null;
    var m = BL.maths;
    return { v:2, day:BL.day, leaves:leavesToday(), celebrated:BL.celebrated,
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
      BL.celebrated = !!st.celebrated;
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

  // ---- points and leaves -----------------------------------------------------------
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
  function leavesOf(g){
    if(g === 'sudoku') return BL.sudoku.ok ? (SUDOKU_LEAVES[BL.sudoku.level] || 0) : 0;
    return rightCount(g);
  }
  function leavesToday(){
    if(!BL) return 0;
    // Before today's questions have loaded, keep what was saved for today.
    if(!BL.loaded){ var rec = days().find(function(d){ return d.date === BL.date; }), st = parse(rec && rec.brainStateJSON); return st ? (+st.leaves || 0) : 0; }
    return leavesOf('riddle') + leavesOf('logic') + leavesOf('maths') + leavesOf('sudoku') + (allDone() ? 1 : 0);
  }
  // every leaf the child has grown, on every other day plus today
  function leavesTotal(){
    var n = 0;
    days().forEach(function(d){ if(d && d.date !== BL.date){ var st = parse(d.brainStateJSON); if(st) n += (+st.leaves || 0); } });
    return n + leavesToday();
  }
  function milestoneNext(total){ for(var i = 0; i < MILESTONES.length; i++) if(total < MILESTONES[i][0]) return MILESTONES[i]; return null; }
  function milestonePrev(total){ var p = null; MILESTONES.forEach(function(m){ if(total >= m[0]) p = m; }); return p; }

  // Put the points where the rest of the app reads them, then save.
  function apply(saveNow){
    if(!BL || locked()) return;
    var before = BL._leaves === undefined ? null : BL._leaves;
    var s = score();
    try{
      riddlePtsTotal = s.riddle; logicPtsTotal = s.logic; mathsPtsToday = s.maths;
      sudokuPts = s.sudoku; worksheetPts = s.bonus;
      brainPtsToday = s.riddle + s.logic + s.maths + s.sudoku + s.bonus;
      logicFrozen = BL.logic.done; mathsFrozen = BL.maths.done; mathsChecked = BL.maths.done; sudokuFrozen = BL.sudoku.done;
    }catch(e){ console.warn('[brain] points:', e); }
    // a new milestone reached
    var after = leavesTotal(); BL._leaves = after;
    if(before !== null && after > before){
      MILESTONES.forEach(function(m){ if(before < m[0] && after >= m[0] && typeof toast === 'function') toast('🌳 Your tree has grown ' + m[2] + '!'); });
    }
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

  // ---- the banyan --------------------------------------------------------------------------
  // Drawn from the total leaves: it gets bigger as it grows, today's leaves are
  // gold, small buds show room to grow, and each milestone adds something.
  function treeSvg(total, todayN){
    var W = 360, H = 260, base = 226, seed = 11, out = [];
    function r(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function has(k){ return MILESTONES.some(function(m){ return m[1] === k && total >= m[0]; }); }
    // courtyard floor and diyas
    out.push('<g opacity=".55" stroke="#D9BF8C" stroke-width="1">');
    for(var x = -40; x < W + 40; x += 34) out.push('<line x1="180" y1="161" x2="' + x + '" y2="' + H + '"/>');
    out.push('<line x1="0" y1="203" x2="' + W + '" y2="203"/><line x1="0" y1="234" x2="' + W + '" y2="234"/></g>');
    function diya(cx, cy){ return '<path d="M' + (cx - 13) + ' ' + cy + ' q13 14 26 0 z" fill="#B5651D"/><circle cx="' + cx + '" cy="' + (cy - 6) + '" r="12" fill="#F2A007" opacity=".15"/>'
      + '<path d="M' + cx + ' ' + (cy - 15) + ' q6 8 0 13 q-6 -5 0 -13z" fill="#F2A007"/>'; }
    out.push(diya(46, 224), diya(W - 46, 224));
    if(has('bench')) out.push('<g fill="#9C6A45"><rect x="214" y="206" width="56" height="7" rx="2"/><rect x="218" y="213" width="5" height="12"/><rect x="261" y="213" width="5" height="12"/></g>');
    // the tree grows from about three-quarters size to full size
    var s = 0.74 + 0.3 * Math.min(1, Math.sqrt(total / 3000));
    if(has('full')) s = 1.08;
    out.push('<g transform="translate(180 ' + base + ') scale(' + s.toFixed(3) + ') translate(-180 -' + base + ')">');
    var roots = [[112,132],[256,116],[140,86],[230,80]], nRoots = (has('root1') ? 1 : 0) + (has('root2') ? 1 : 0) + (has('great') ? 2 : 0);
    for(var k = 0; k < nRoots; k++){ var p = roots[k];
      out.push('<path d="M' + p[0] + ' ' + p[1] + ' C' + (p[0] + 3) + ' ' + (p[1] + 40) + ' ' + (p[0] - 3) + ' ' + (p[1] + 70) + ' ' + p[0] + ' ' + (base - 4) + '" stroke="#9C6A45" stroke-width="2.5" fill="none"/>'); }
    out.push('<path d="M176 ' + base + ' C178 200 172 170 180 140 C186 118 182 104 186 92" stroke="#7A4A2A" stroke-width="15" fill="none" stroke-linecap="round"/>');
    out.push('<path d="M180 150 C152 136 128 130 98 130 M183 128 C214 112 238 110 268 114' + (has('branch') ? ' M184 108 C166 92 150 86 128 82 M186 98 C206 84 224 78 246 76' : '') + '" stroke="#7A4A2A" stroke-width="6" fill="none" stroke-linecap="round"/>');
    if(has('swing')) out.push('<g stroke="#7A4A2A" stroke-width="1.6"><line x1="236" y1="112" x2="236" y2="176"/><line x1="258" y1="114" x2="258" y2="176"/></g><rect x="230" y="175" width="34" height="5" rx="2" fill="#B5651D"/>');
    var spots = [[110,124,64,30],[262,110,64,30],[146,82,56,28],[232,76,56,28],[188,62,82,36],[188,104,46,22]];
    out.push('<g fill="#DCEFD5">');
    spots.forEach(function(q){ out.push('<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="' + (q[2] + 12) + '" ry="' + (q[3] + 12) + '"/>'); });
    out.push('</g>');
    // leaves: every leaf up to 200, then one drawn for every 20 more
    var drawn = total <= 200 ? total : Math.min(400, Math.round(200 + (total - 200) / 20));
    var gold = Math.min(todayN, drawn, 25);
    var nxt = milestoneNext(total), buds = nxt ? Math.max(0, Math.min(40, nxt[0] - total)) : 0;
    for(var i = 0; i < drawn + buds; i++){
      var q = spots[i % spots.length], a = r() * Math.PI * 2, d = Math.sqrt(r()), rot = Math.round(r() * 180), shade = r();
      var lx = (q[0] + Math.cos(a) * q[2] * d).toFixed(1), ly = (q[1] + Math.sin(a) * q[3] * d).toFixed(1), tr = ' transform="rotate(' + rot + ' ' + lx + ' ' + ly + ')"';
      if(i >= drawn) out.push('<ellipse cx="' + lx + '" cy="' + ly + '" rx="4.5" ry="2.8" fill="#BFDDB6" opacity=".8"' + tr + '/>');
      else if(i >= drawn - gold) out.push('<circle cx="' + lx + '" cy="' + ly + '" r="10" fill="#F2A007" opacity=".16"/><ellipse cx="' + lx + '" cy="' + ly + '" rx="8.5" ry="5" fill="#F2A007" stroke="#C47F00" stroke-width="1"' + tr + '/>');
      else out.push('<ellipse cx="' + lx + '" cy="' + ly + '" rx="8.5" ry="5" fill="' + (shade < .5 ? '#2F7D4F' : '#5FA86B') + '"' + tr + '/>');
    }
    if(has('figs')) [[120,116],[150,96],[200,70],[240,92],[270,104],[176,52],[96,130],[214,120]].forEach(function(f){ out.push('<circle cx="' + f[0] + '" cy="' + f[1] + '" r="3.2" fill="#C0392B"/>'); });
    if(has('nest')) out.push('<path d="M120 128 q14 12 28 0 z" fill="#8B5A2B"/><circle cx="128" cy="124" r="3" fill="#F5D76E"/><circle cx="140" cy="124" r="3" fill="#F5D76E"/>');
    if(has('parrot')) out.push('<g transform="translate(262 108)"><ellipse cx="0" cy="0" rx="7" ry="10" fill="#2EAD4B"/><circle cx="1" cy="-9" r="5.5" fill="#2EAD4B"/><path d="M5 -10 l5 2 -4 3z" fill="#D7263D"/><circle cx="2" cy="-10" r="1.2" fill="#111"/><path d="M-2 9 l-3 10 4-6z" fill="#1E7A34"/></g>');
    if(has('squirrels')) out.push('<g fill="#A0522D"><ellipse cx="168" cy="186" rx="5" ry="7"/><circle cx="168" cy="178" r="3.5"/><path d="M163 190 q-10 -6 -6 -16 q6 8 6 16z"/></g>');
    if(has('great')) out.push('<path d="M150 46 l8 -10 8 8 8 -12 8 12 8 -8 8 10 z" fill="#F2A007" stroke="#C47F00" stroke-width="1"/>');
    out.push('</g>');
    if(has('butterfly')) out.push('<g transform="translate(66 70) rotate(-15)"><ellipse cx="-5" cy="0" rx="6" ry="8" fill="#E86FA5"/><ellipse cx="5" cy="0" rx="6" ry="8" fill="#F29BC1"/><rect x="-1" y="-6" width="2" height="12" fill="#5A2A3A"/></g>');
    if(has('fireflies')) [[70,110],[300,90],[90,60],[290,150],[60,160],[310,50]].forEach(function(f){ out.push('<circle cx="' + f[0] + '" cy="' + f[1] + '" r="7" fill="#FFE066" opacity=".25"/><circle cx="' + f[0] + '" cy="' + f[1] + '" r="2.2" fill="#FFD60A"/>'); });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Your banyan tree with ' + total + ' leaves">' + out.join('') + '</svg>';
  }

  // ---- styles --------------------------------------------------------------------------
  var CSS = ''
  + '#tab-brain>:not(#bl-root){display:none!important}'          // the old Brain Lab screens
  + '#bl-root{--ivory:#FFF8EC;--ink:#2A1A14;--soft:#6B5848;--line:#EAD9BC;--maroon:#7A1F2B;--teal:#0E6B70;--indigo:#33307A;--green:#3D7A3A;'
  +   '--saffron:#F2A007;--gold:#C9962B;--leaf:#2F7D4F;--leaf2:#5FA86B;--c:var(--maroon);'
  +   'font-family:Mukta,system-ui,sans-serif;color:var(--ink);background:var(--ivory);'
  +   'background-image:radial-gradient(circle at 1px 1px,rgba(201,150,43,.13) 1px,transparent 1.5px);background-size:18px 18px;'
  +   'border:1.5px solid var(--line);border-radius:22px;padding:16px 16px 22px;max-width:1180px;margin:0 auto;box-sizing:border-box}'
  + '#bl-root *{box-sizing:border-box}'
  + '#bl-root button{font-family:inherit;cursor:pointer;color:inherit}'
  + '#bl-root .bl-disp{font-family:"Rozha One",Georgia,serif;font-weight:400}'
  + '#bl-root .bl-border{height:12px;margin-bottom:12px;background:radial-gradient(circle at 6px 6px,var(--gold) 2.6px,transparent 3px) 0 0/12px 12px,'
  +   'linear-gradient(var(--maroon),var(--maroon)) 0 5px/100% 2px no-repeat}'
  + '#bl-root .bl-eyebrow{font-weight:800;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--maroon)}'
  + '#bl-root h1.bl-title{font-family:"Rozha One",Georgia,serif;font-weight:400;font-size:34px;line-height:1.05;margin:4px 0;color:var(--maroon)}'
  + '#bl-root .bl-lede{margin:0;font-weight:600;font-size:15px;line-height:1.45;color:var(--soft)}'
  // tree
  + '#bl-root .bl-treecard{display:flex;gap:12px;align-items:center;margin-top:14px}'
  + '#bl-root .bl-court{position:relative;flex:0 0 58%;border:2px solid var(--gold);border-radius:999px 999px 18px 18px;overflow:hidden;'
  +   'background:linear-gradient(#FDF1D8,#FFF8EC 62%,#F3E2BF 62%,#F3E2BF)}'
  + '#bl-root .bl-court::before{content:"";position:absolute;inset:7px;border:1.5px dashed rgba(201,150,43,.6);border-radius:999px 999px 13px 13px;pointer-events:none}'
  + '#bl-root .bl-court svg{display:block;width:100%;height:auto}'
  + '#bl-root .bl-side{flex:1;display:flex;flex-direction:column;gap:8px;justify-content:flex-end;min-width:0}'
  + '#bl-root .bl-chip{background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:7px 11px;font-weight:800;font-size:12px;line-height:1.2;box-shadow:0 6px 16px rgba(122,31,43,.08)}'
  + '#bl-root .bl-chip b{display:block;font-family:"Rozha One",Georgia,serif;font-weight:400;font-size:24px;line-height:1;color:var(--leaf)}'
  + '#bl-root .bl-chip.pts b{color:var(--maroon)}'
  + '#bl-root .bl-bar{height:8px;border-radius:99px;background:#EADFC9;margin-top:6px;overflow:hidden}'
  + '#bl-root .bl-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--leaf2),var(--leaf))}'
  // halls
  + '#bl-root .bl-halls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}'
  + '#bl-root .bl-arch{background:#fff;border:2px solid var(--c);border-radius:999px 999px 16px 16px;padding:14px 10px 12px;text-align:center;width:100%;display:block}'
  + '#bl-root .bl-arch.next{box-shadow:0 0 0 4px rgba(14,107,112,.18)}'
  + '#bl-root .bl-seal{width:56px;height:56px;margin:4px auto 6px;border-radius:50%;background:var(--c);color:#fff;display:flex;align-items:center;justify-content:center;'
  +   'font-family:"Rozha One",Georgia,serif;font-size:22px;position:relative;box-shadow:0 0 0 3px #fff,0 0 0 5px var(--c);flex:0 0 auto}'
  + '#bl-root .bl-arch.done .bl-seal::after{content:"✓";position:absolute;right:-6px;bottom:-4px;width:22px;height:22px;border-radius:50%;background:var(--green);color:#fff;'
  +   'font-family:Mukta,sans-serif;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff}'
  + '#bl-root .bl-arch h3{font-family:"Rozha One",Georgia,serif;font-weight:400;font-size:19px;line-height:1.1;margin:0;color:var(--c)}'
  + '#bl-root .bl-who{font-size:12.5px;font-weight:700;color:var(--soft);margin-top:2px}'
  + '#bl-root .bl-pill{display:inline-block;margin-top:7px;font-size:12px;font-weight:800;padding:3px 10px;border-radius:99px;background:#F6EEDF;color:var(--c)}'
  + '#bl-root .bl-cta{display:block;margin-top:8px;background:var(--c);color:#fff;border-radius:12px;padding:7px 8px;font-weight:800;font-size:14px}'
  + '#bl-root .bl-leafrow{display:flex;gap:3px;justify-content:center;margin-top:6px;flex-wrap:wrap}'
  + '#bl-root .bl-leafrow i{width:10px;height:14px;border-radius:10px 0 10px 0;background:#E6DCC6;transform:rotate(-20deg)}'
  + '#bl-root .bl-leafrow i.on{background:var(--leaf2)}'
  + '#bl-root .bl-strip{margin-top:12px;display:flex;align-items:center;gap:12px;background:#fff;border:1.5px dashed var(--gold);border-radius:16px;padding:10px 14px;font-weight:800;font-size:14px}'
  + '#bl-root .bl-strip .n{margin-left:auto;font-family:"Rozha One",Georgia,serif;font-size:20px;color:var(--maroon)}'
  + '#bl-root .bl-fact{margin-top:12px;background:#FDF0D5;border-left:5px solid var(--saffron);border-radius:0 14px 14px 0;padding:11px 14px;font-size:14.5px;font-weight:600;line-height:1.45}'
  + '#bl-root .bl-fact b{color:var(--maroon)}'
  + '#bl-root .bl-note{margin-top:10px;text-align:center;font-size:13px;font-weight:700;color:var(--soft)}'
  + '#bl-root .bl-card{background:#fff;border:1.5px solid var(--line);border-radius:16px;padding:14px}'
  // question screens
  + '#bl-root .bl-top{display:flex;align-items:center;gap:10px}'
  + '#bl-root .bl-back{width:44px;height:44px;border-radius:12px;border:1.5px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;flex:0 0 auto}'
  + '#bl-root .bl-top .t{font-weight:800;font-size:15px;line-height:1.2;min-width:0}'
  + '#bl-root .bl-top .t small{display:block;font-size:12px;color:var(--soft);font-weight:700}'
  + '#bl-root .bl-top .r{margin-left:auto;display:flex;align-items:center;gap:6px;font-weight:800;font-size:13px;background:#fff;border:1.5px solid var(--line);border-radius:99px;padding:5px 11px;white-space:nowrap}'
  + '#bl-root .bl-progress{display:flex;gap:5px;margin-top:12px}'
  + '#bl-root .bl-progress span{flex:1;height:8px;border-radius:99px;background:#EADFC9}'
  + '#bl-root .bl-progress span.ok{background:var(--leaf2)} #bl-root .bl-progress span.no{background:#E9A0A0} #bl-root .bl-progress span.cur{background:var(--c)}'
  + '#bl-root .bl-mentor{display:flex;gap:10px;align-items:flex-start;margin-top:14px}'
  + '#bl-root .bl-mentor .bl-seal{width:46px;height:46px;font-size:19px;margin:2px 0 0}'
  + '#bl-root .bl-bubble{flex:1;background:#fff;border:1.5px solid var(--line);border-radius:4px 16px 16px 16px;padding:12px 14px;font-size:15px;font-weight:700;line-height:1.45;min-width:0}'
  + '#bl-root .bl-bubble .who{display:block;font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--c);margin-bottom:2px}'
  + '#bl-root .bl-q{margin-top:12px;background:#fff;border:2px solid var(--c);border-radius:20px;padding:18px 16px;text-align:center}'
  + '#bl-root .bl-q .topic{font-size:11.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--c)}'
  + '#bl-root .bl-q .q{font-size:19px;font-weight:700;line-height:1.45;margin-top:6px;white-space:pre-line}'
  + '#bl-root .bl-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}'
  + '#bl-root .bl-opts.one{grid-template-columns:1fr}'
  + '#bl-root .bl-opt{border:2px solid var(--line);border-radius:14px;padding:10px 12px;font-size:17px;font-weight:800;text-align:center;background:#fff;min-height:54px;'
  +   'display:flex;align-items:center;justify-content:center;gap:6px;line-height:1.3}'
  + '#bl-root .bl-opts.one .bl-opt{justify-content:flex-start;text-align:left}'
  + '#bl-root .bl-opt.pick{border-color:var(--c);background:#F3ECF7;background:color-mix(in srgb,var(--c) 12%,#fff)}'
  + '#bl-root .bl-opt.right{border-color:#3D7A3A;background:#DDF0D8}'
  + '#bl-root .bl-opt.wrong{border-color:#C0504D;background:#F9DEDC}'
  + '#bl-root .bl-opt.dim{opacity:.5}'
  + '#bl-root .bl-opt[disabled]{cursor:default}'
  + '#bl-root .bl-btn{display:block;width:100%;margin-top:14px;min-height:52px;border:0;border-radius:14px;background:var(--c);color:#fff;font-weight:800;font-size:17px;padding:8px 14px}'
  + '#bl-root .bl-btn.ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line)}'
  + '#bl-root .bl-btn[disabled]{opacity:.45;cursor:default}'
  + '#bl-root .bl-hint{margin-top:12px;display:flex;gap:10px;align-items:flex-start;background:#FFF4D6;border:1.5px dashed var(--saffron);border-radius:14px;padding:10px 12px;font-weight:700;font-size:14.5px;line-height:1.4;width:100%;text-align:left}'
  + '#bl-root .bl-hint small{display:block;font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9A6400}'
  + '#bl-root .bl-win{margin-top:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#DDF0D8;border-radius:14px;padding:10px 14px;font-weight:800}'
  + '#bl-root .bl-win.miss{background:#FBEBD8}'
  + '#bl-root .bl-win .big{font-family:"Rozha One",Georgia,serif;font-size:22px;color:var(--leaf)}'
  + '#bl-root .bl-steps{margin:8px 0 0;padding:0;list-style:none;counter-reset:s}'
  + '#bl-root .bl-steps li{counter-increment:s;position:relative;padding-left:30px;margin-top:7px;font-weight:600;line-height:1.45}'
  + '#bl-root .bl-steps li::before{content:counter(s);position:absolute;left:0;top:1px;width:21px;height:21px;border-radius:50%;background:var(--c);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}'
  + '#bl-root .bl-timers{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px}'
  + '#bl-root .bl-timers button{border:2px solid var(--line);border-radius:14px;background:#fff;text-align:center;padding:8px 2px;font-family:"Rozha One",Georgia,serif;font-size:22px;line-height:1}'
  + '#bl-root .bl-timers button small{display:block;font-family:Mukta,sans-serif;font-size:11px;font-weight:800;margin-top:3px}'
  + '#bl-root .bl-timers button.pick{border-color:var(--c);background:#EBEAF6}'
  + '#bl-root .bl-level{display:flex;align-items:center;gap:12px;background:#fff;border:2px solid var(--line);border-radius:16px;padding:12px 14px;width:100%;text-align:left;margin-top:10px}'
  + '#bl-root .bl-level.pick{border-color:var(--c);background:#EEF6EC}'
  + '#bl-root .bl-level .bars{display:flex;gap:3px}'
  + '#bl-root .bl-level .bars i{width:9px;height:22px;border-radius:3px;border:1.5px solid var(--c);background:#fff}'
  + '#bl-root .bl-level .bars i.on{background:var(--c)}'
  + '#bl-root .bl-level h4{margin:0;font-family:"Rozha One",Georgia,serif;font-weight:400;font-size:19px;color:var(--c)}'
  + '#bl-root .bl-level p{margin:0;font-size:12.5px;font-weight:700;color:var(--soft)}'
  + '#bl-root .bl-level .pts{margin-left:auto;text-align:right;font-family:"Rozha One",Georgia,serif;font-size:22px;line-height:1}'
  + '#bl-root .bl-level .pts small{display:block;font-family:Mukta,sans-serif;font-size:11px;font-weight:800;color:var(--leaf)}'
  + '#bl-root .bl-board{margin-top:14px;background:#fff;border:2px solid var(--c);border-radius:12px;padding:4px}'
  + '#bl-root .bl-cell{aspect-ratio:1/1;border:0;border-right:1px solid #E2D6BE;border-bottom:1px solid #E2D6BE;background:#fff;'
  +   'font-family:"Rozha One",Georgia,serif;font-size:clamp(16px,4.8vw,24px);padding:0;display:flex;align-items:center;justify-content:center;color:var(--indigo)}'
  + '#bl-root .bl-cell.g{background:#F3EBDB;color:var(--ink);cursor:default}'
  + '#bl-root .bl-cell.sel{background:#FFE9A8}'
  + '#bl-root .bl-cell.bad{background:#F9DEDC}'
  + '#bl-root .bl-pad{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:14px}'
  + '#bl-root .bl-num{height:48px;border:2px solid var(--line);border-radius:12px;background:#fff;font-family:"Rozha One",Georgia,serif;font-size:22px}'
  + '#bl-root .bl-summary{margin-top:12px;background:#fff;border:1.5px solid var(--line);border-radius:18px;padding:4px 14px}'
  + '#bl-root .bl-summary div{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F1E7D3;font-weight:700}'
  + '#bl-root .bl-summary div:last-child{border-bottom:0}'
  + '#bl-root .bl-summary .bl-seal{width:30px;height:30px;font-size:13px;margin:0;box-shadow:none}'
  + '#bl-root .bl-summary b{margin-left:auto;font-weight:800}'
  + '#bl-root .bl-split>div{min-width:0}'
  // computers and tablets
  + '@media (min-width:820px){'
  +   '#bl-root{padding:26px 34px 34px}'
  +   '#bl-root h1.bl-title{font-size:48px}'
  +   '#bl-root .bl-split{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:start}'
  +   '#bl-root .v-home .bl-treecard{flex-direction:column;align-items:stretch}'   // a big tree fills the left side
  +   '#bl-root .v-home .bl-court{flex:none}'
  +   '#bl-root .v-home .bl-side{flex-direction:row}'
  +   '#bl-root .v-home .bl-side>*{flex:1}'
  +   '#bl-root .v-home .bl-halls{margin-top:0}'
  +   '#bl-root .bl-board,#bl-root .bl-pad{max-width:480px;margin-left:auto;margin-right:auto}'
  + '}';

  function addStyles(){
    if($('bl-style')) return;
    var st = document.createElement('style'); st.id = 'bl-style'; st.textContent = CSS; document.head.appendChild(st);
    if(!document.querySelector('link[data-bl-font]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-bl-font', '1');
      l.href = 'https://fonts.googleapis.com/css2?family=Rozha+One&family=Mukta:wght@500;600;700;800&display=swap';
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
  function seal(m, extra){ return '<div class="bl-seal" style="--c:' + m.c + ';background:' + m.c + (extra || '') + '">' + m.seal + '</div>'; }
  function iconSeal(g){ return '<div class="bl-seal">' + icon(LOOK[g].icon, 26, 2.2, '#fff') + '</div>'; }
  function top(g, sub, right){
    return '<div class="bl-top"><button class="bl-back" data-act="home" aria-label="Back to Brain Lab">' + icon('back', 20, 2.6) + '</button>'
      + '<div class="t">' + LOOK[g].name + '<small>' + sub + '</small></div>' + (right ? '<div class="r">' + right + '</div>' : '') + '</div>';
  }
  function bubble(m, who, text){
    return '<div class="bl-mentor">' + seal(m) + '<div class="bl-bubble"><span class="who" style="color:' + m.c + '">' + esc(who) + '</span>' + text + '</div></div>';
  }
  // An explanation in steps when it has more than one sentence.
  function steps(text){
    var parts = String(text || '').replace(/([.!?])\s+(?=[A-Z0-9₹“"(])/g, '$1\n').split('\n').filter(Boolean);
    if(parts.length < 2) return '<div style="margin-top:4px;font-weight:600">' + esc(text) + '</div>';
    return '<ol class="bl-steps">' + parts.map(function(p){ return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>';
  }
  function fact(){ return '<div class="bl-fact"><b>Did you know?</b> ' + esc(FACTS[(BL.day - 1) % FACTS.length]) + '</div>'; }
  function treeCard(total, todayN){
    var s = score(), nx = milestoneNext(total), pv = milestonePrev(total);
    var from = pv ? pv[0] : 0, pct = nx ? Math.round((total - from) / (nx[0] - from) * 100) : 100;
    return '<div class="bl-treecard"><div class="bl-court">' + treeSvg(total, todayN) + '</div><div class="bl-side">'
      + '<div class="bl-chip"><b>' + total + '</b>leaves on your tree' + (todayN ? '<br><span style="color:var(--leaf)">+' + todayN + ' today</span>' : '') + '</div>'
      + '<div class="bl-chip pts"><b>' + s.total + '</b>of ' + maxToday() + ' points today</div>'
      + '<div class="bl-chip">' + (nx ? 'Next: <span style="color:var(--leaf)">' + nx[2] + '</span> at ' + nx[0] : 'Your Great Banyan is complete!')
      + '<div class="bl-bar"><i style="width:' + pct + '%"></i></div></div>'
      + '</div></div>';
  }

  function homeHtml(){
    var total = leavesTotal(), todayN = leavesToday(), st = streak();
    var dt = new Date(BL.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' });
    var h = '<div class="bl-border"></div><div class="bl-split"><div>'
      + '<div class="bl-eyebrow">Day ' + BL.day + ' · ' + dt + ' · Class ' + classNo() + (st > 1 ? ' · ' + st + '-day streak' : '') + '</div>'
      + '<h1 class="bl-title">' + possessive() + ' Brain Lab</h1>'
      + '<p class="bl-lede">Great Indian thinkers set you a challenge every day. Every right answer grows a leaf on your banyan tree.</p>'
      + treeCard(total, todayN)
      + '</div><div>';
    if(locked()) h += '<div class="bl-card" style="margin-bottom:12px;font-weight:700">Today is approved by your parent, so the games are closed for this day.</div>';
    var next = GAMES.find(function(g){ return !BL[g].done; });
    h += '<div class="bl-halls">';
    GAMES.forEach(function(g){
      var L = LOOK[g], S = BL[g], done = S.done, isNext = g === next && !locked();
      var started = g === 'sudoku' ? !!S.level : Object.keys(S.ans).length > 0;
      var leaves = '', status;
      if(g === 'riddle' || g === 'logic'){
        leaves = '<div class="bl-leafrow">';
        for(var k = 0; k < COUNT[g]; k++){ var a = S.ans[k], q = list(g)[k]; leaves += '<i class="' + (a !== undefined && q && a === q.answer ? 'on' : '') + '"></i>'; }
        leaves += '</div>';
      }
      if(done){
        var s = score()[g];
        status = g === 'sudoku' ? (S.ok ? 'Solved · ' + S.level + ' · +' + s + ' pts' : 'Tried · ' + S.level + ' · new one tomorrow')
               : rightCount(g) + ' of ' + COUNT[g] + ' · +' + s + ' pts';
        if(g === 'maths') status += ' · ' + leavesOf('maths') + ' leaves';
      } else if(g === 'sudoku') status = '1, 2 or 3 leaves';
      else if(g === 'maths') status = COUNT.maths + ' questions · up to ' + COUNT.maths + ' leaves';
      else status = COUNT[g] + ' ' + (g === 'riddle' ? 'riddles' : 'puzzles') + ' · up to ' + COUNT[g] * PTS[g] + ' pts';
      var label = started ? 'Carry on' + (g !== 'sudoku' ? ' · ' + (firstOpen(g) + 1) + ' of ' + COUNT[g] : '') : 'Start';
      h += '<button class="bl-arch' + (done ? ' done' : '') + (isNext ? ' next' : '') + '" style="--c:' + L.c + '" data-act="' + (done ? 'review' : 'go') + '" data-g="' + g + '">'
        + iconSeal(g) + '<h3>' + L.name + '</h3><div class="bl-who">' + esc(L.who) + '</div>' + leaves
        + (isNext ? '<span class="bl-cta">' + label + '</span>' : '<span class="bl-pill">' + status + '</span>') + '</button>';
    });
    h += '</div>';
    var nDone = GAMES.filter(function(g){ return BL[g].done; }).length;
    h += '<div class="bl-strip">' + leafIcon(26, true)
      + (nDone === 4 ? 'All four done: +' + PTS.bonus + ' points and a golden leaf earned!' : 'Finish all four today: +' + PTS.bonus + ' points and a golden leaf')
      + '<span class="n">' + nDone + '/4</span></div>';
    if(nDone === 4) h += '<button class="bl-btn" style="--c:var(--maroon)" data-act="done">See today’s tree</button>';
    h += fact() + '</div></div>';
    return h;
  }

  function noQuestions(g){
    var msg = BL.error === 'missing' ? 'The question table is not set up yet. Ask your parent to finish the Brain Lab setup.'
            : BL.error === 'empty'   ? 'There are no questions for Class ' + classNo() + ' yet. They are coming soon!'
            : BL.error === 'offline' ? 'Could not load today’s questions. Check the internet and try again.'
            : 'Loading today’s questions…';
    return top(g, '') + '<div class="bl-card" style="margin-top:18px;font-weight:700;text-align:center">' + msg
      + (BL.error === 'offline' ? '<button class="bl-btn" data-act="retry">Try again</button>' : '') + '</div>';
  }

  function quizHtml(g){
    var L = LOOK[g], Q = list(g), S = BL[g];
    if(!Q.length) return noQuestions(g);
    if(g === 'maths' && !S.started && !S.done) return sprintSetupHtml();
    if(S.done && S._showSummary) return summaryHtml(g);
    var i = S.i, q = Q[i] || Q[0], ans = S.ans[i], answered = ans !== undefined, m = mentorFor(g, i);
    var ok = answered && ans === q.answer;
    var pts = g === 'riddle' && S.hint[i] ? PTS.riddle - PTS.hintCost : PTS[g];
    var right = g === 'maths' ? icon('clock', 16, 2.4) + ' <span id="bl-timer">' + fmtLeft(msLeft()) + '</span>' : PTS[g] + ' pts · 1 leaf';
    var sub = L.unit + ' ' + (i + 1) + ' of ' + COUNT[g] + ' · with ' + m.name;
    var a = '<div style="--c:' + L.c + '">' + top(g, sub, right);
    if(g === 'maths' && S.mins){
      var w = Math.max(0, Math.min(100, msLeft() / (S.mins * 600)));
      a += '<div class="bl-bar" style="height:8px;margin-top:10px;background:#E6E4F4"><i id="bl-timebar" style="width:' + w + '%;background:var(--indigo)"></i></div>';
    }
    a += '<div class="bl-progress">';
    for(var k = 0; k < COUNT[g]; k++){
      var ak = S.ans[k];
      a += '<span class="' + (ak === undefined ? (k === i ? 'cur' : '') : (Q[k] && ak === Q[k].answer ? 'ok' : 'no')) + '"></span>';
    }
    a += '</div>';
    if(!answered && g !== 'maths') a += bubble(m, m.name + ' says', esc(mentorSays(m, i)));
    a += '<div class="bl-q"><div class="topic">' + esc(q.topic || L.name) + '</div><div class="q">' + esc(q.question) + '</div></div>';
    if(g === 'riddle' && q.hint){
      if(S.hint[i]) a += '<div class="bl-hint">' + icon('bulb', 22, 2.2, '#9A6400') + '<div><small>' + esc(m.name) + ' whispers a hint · −' + PTS.hintCost + ' pts</small>' + esc(q.hint) + '</div></div>';
      else if(!answered) a += '<button class="bl-hint" data-act="hint">' + icon('bulb', 22, 2.2, '#9A6400') + '<div><small>Stuck?</small>Ask ' + esc(m.name) + ' for a hint (costs ' + PTS.hintCost + ' points)</div></button>';
    }
    a += '</div>';

    var long = ['A','B','C','D'].some(function(Lt){ return String(opt(q, Lt) || '').length > 22; });
    var b = '<div style="--c:' + L.c + '"><div class="bl-opts' + (long ? ' one' : '') + '">';
    ['A','B','C','D'].forEach(function(Lt){
      var cls = 'bl-opt';
      if(answered){ cls += Lt === q.answer ? ' right' : Lt === ans ? ' wrong' : ' dim'; }
      else if(S.pick === Lt) cls += ' pick';
      b += '<button class="' + cls + '" data-act="pick" data-l="' + Lt + '"' + (answered ? ' disabled' : '') + '>'
        + (answered && Lt === q.answer ? '✓ ' : '') + esc(opt(q, Lt)) + '</button>';
    });
    b += '</div>';
    if(answered){
      b += ok ? '<div class="bl-win"><span class="big">+' + pts + '</span> points <span style="display:flex;align-items:center;gap:4px;margin-left:auto">' + leafIcon(16) + ' +1 leaf on your tree</span></div>'
              : '<div class="bl-win miss">' + (ans === '-' ? 'Time ran out for this one.' : 'Not this time — and no leaf is lost.') + ' The answer is ' + esc(opt(q, q.answer)) + '.</div>';
      b += bubble(m, m.name + ' explains', steps(q.explanation));
      b += '<button class="bl-btn" data-act="next">' + (i >= COUNT[g] - 1 ? 'See how I did' : 'Next ' + L.unit.toLowerCase()) + '</button>';
    } else {
      b += '<button class="bl-btn" data-act="check"' + (S.pick ? '' : ' disabled') + '>Give my answer</button>';
      if(g === 'riddle') b += '<div class="bl-note">No hint used? You get all ' + PTS.riddle + ' points.</div>';
      else b += '<div class="bl-note">Right or wrong, ' + esc(m.name) + ' explains the answer.</div>';
    }
    b += '</div>';
    return '<div class="bl-split"><div>' + a + '</div><div>' + b + '</div></div>';
  }

  function sprintSetupHtml(){
    var M = BL.maths, m = MENTOR.ramanujan;
    var h = '<div style="--c:' + LOOK.maths.c + '">' + top('maths', COUNT.maths + ' questions · with Ramanujan', PTS.maths + ' pts each')
      + '<div class="bl-split"><div>' + bubble(m, 'Ramanujan says', esc(m.says))
      + '<div class="bl-disp" style="font-size:22px;margin-top:16px;color:var(--indigo)">How much time do you want?</div><div class="bl-timers">';
    TIMER_CHOICES.forEach(function(t){
      h += '<button class="' + (M.mins === t ? 'pick' : '') + '" data-act="mins" data-m="' + t + '">' + (t ? t + '<small>min</small>' : 'No<small>timer</small>') + '</button>';
    });
    h += '</div><div class="bl-note" style="text-align:left">Same points whatever you choose. The clock stops while you read each explanation.</div>'
      + '<button class="bl-btn" data-act="start-sprint">Start the sprint</button></div><div>' + fact() + '</div></div></div>';
    return h;
  }

  function summaryHtml(g){
    var L = LOOK[g], n = rightCount(g), s = score(), m = mentorFor(g, 0);
    var who = g === 'riddle' ? 'Birbal & Tenali Rama' : m.name;
    return '<div style="--c:' + L.c + '">' + top(g, 'Done for today · with ' + who)
      + '<div class="bl-split"><div><div class="bl-q" style="margin-top:18px">' + iconSeal(g)
      + '<div class="bl-disp" style="font-size:28px;color:var(--c)">' + n + ' of ' + COUNT[g] + ' right</div>'
      + '<div style="font-weight:800;margin-top:4px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap"><span>+' + s[g] + ' points</span>'
      + '<span style="display:flex;align-items:center;gap:4px">' + leafIcon(16) + ' +' + leavesOf(g) + (leavesOf(g) === 1 ? ' leaf' : ' leaves') + '</span></div></div></div><div>'
      + '<button class="bl-btn ghost" data-act="review" data-g="' + g + '">See every answer, explained</button>'
      + '<button class="bl-btn" data-act="home">Back to Brain Lab</button></div></div></div>';
  }

  function reviewHtml(g){
    var L = LOOK[g];
    if(g === 'sudoku') return sudokuHtml();
    var Q = list(g), S = BL[g];
    if(!Q.length) return noQuestions(g);
    var h = '<div style="--c:' + L.c + '">' + top(g, 'Your answers, explained') + '<div class="bl-split" style="margin-top:14px">';
    var cols = ['', ''];
    Q.forEach(function(q, i){
      var a = S.ans[i], ok = a === q.answer, m = mentorFor(g, i);
      cols[i % 2] += '<div class="bl-card" style="margin-bottom:12px"><div style="display:flex;gap:8px;align-items:flex-start">'
        + '<span style="flex:0 0 auto;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:' + (ok ? '#DDF0D8' : '#F9DEDC') + '">'
        + icon(ok ? 'check' : 'cross', 14, 3, ok ? '#3D7A3A' : '#C0504D') + '</span><div style="font-weight:800;line-height:1.45">' + esc(q.question) + '</div></div>'
        + '<div style="margin-top:8px;font-weight:800">Answer: ' + esc(opt(q, q.answer)) + (ok || a === undefined ? '' : a === '-' ? ' · time ran out' : ' · you chose ' + esc(opt(q, a))) + '</div>'
        + '<div style="margin-top:6px;font-weight:600;line-height:1.5;color:var(--soft)"><b style="color:var(--c)">' + esc(m.name) + ':</b> ' + esc(q.explanation) + '</div></div>';
    });
    return h + '<div>' + cols[0] + '</div><div>' + cols[1] + '</div></div><button class="bl-btn" data-act="home">Back to Brain Lab</button></div>';
  }

  function sudokuHtml(){
    var S = BL.sudoku, L = LOOK.sudoku, m = MENTOR.lilavati;
    if(!S.level){
      var h = '<div style="--c:' + L.c + '">' + top('sudoku', 'From Lilavati’s puzzle book · one try') + '<div class="bl-split"><div>'
        + bubble(m, 'From Lilavati', esc(m.says))
        + '<div class="bl-disp" style="font-size:22px;margin-top:16px;color:var(--green)">Choose your challenge</div></div><div>';
      [['easy','Easy','a warm-up'],['medium','Medium','best for Class 4'],['hard','Hard','for champions']].forEach(function(x, k){
        var bars = ''; for(var b = 0; b < 3; b++) bars += '<i class="' + (b <= k ? 'on' : '') + '"></i>';
        h += '<button class="bl-level' + (S.pick === x[0] ? ' pick' : '') + '" data-act="level" data-lv="' + x[0] + '"><div class="bars">' + bars + '</div>'
          + '<div><h4>' + x[1] + '</h4><p>' + GIVEN[x[0]] + ' numbers given · ' + x[2] + '</p></div>'
          + '<div class="pts">' + PTS.sudoku[x[0]] + '<small>' + SUDOKU_LEAVES[x[0]] + (SUDOKU_LEAVES[x[0]] > 1 ? ' leaves' : ' leaf') + '</small></div></button>';
      });
      return h + '<button class="bl-btn" data-act="start-sudoku"' + (S.pick ? '' : ' disabled') + '>'
        + (S.pick ? 'Start ' + S.pick + ' · ' + PTS.sudoku[S.pick] + ' pts' : 'Pick a level first') + '</button>'
        + '<div class="bl-note">Once you start, the level is fixed for today. You can check your answers once.</div></div></div></div>';
    }
    var P = puzzle(S.level), wrong = {};
    if(S.done && !S.ok) for(var i0 = 0; i0 < 81; i0++) if(!P.start[i0] && S.cells[i0] && S.cells[i0] !== P.sol[i0]) wrong[i0] = 1;
    var lv = S.level.charAt(0).toUpperCase() + S.level.slice(1);
    var a = '<div style="--c:' + L.c + '">' + top('sudoku', lv + ' · from Lilavati’s puzzle book', PTS.sudoku[S.level] + ' pts')
      + '<div class="bl-board"><div style="display:grid;grid-template-columns:repeat(9,minmax(0,1fr))">';
    for(var i = 0; i < 81; i++){
      var r = Math.floor(i / 9), c = i % 9, given = !!P.start[i];
      var v = given ? P.start[i] : (S.done ? (S.cells[i] || P.sol[i]) : (S.cells[i] || ''));
      var bs = 'border-right:' + (c % 3 === 2 && c < 8 ? '2.5px solid var(--green)' : '1px solid #E2D6BE') + ';border-bottom:' + (r % 3 === 2 && r < 8 ? '2.5px solid var(--green)' : '1px solid #E2D6BE')
        + (S.done && !given && !S.cells[i] ? ';color:#2F7D4F' : '');
      var cls = 'bl-cell' + (given ? ' g' : '') + (S.sel === i ? ' sel' : '') + (wrong[i] ? ' bad' : '');
      a += '<button class="' + cls + '" style="' + bs + '" data-act="cell" data-i="' + i + '"' + (given || S.done ? ' disabled' : '') + ' aria-label="Row ' + (r + 1) + ' column ' + (c + 1) + '">' + v + '</button>';
    }
    a += '</div></div></div>';
    var b = '<div style="--c:' + L.c + '">';
    if(S.done){
      b += S.ok ? '<div class="bl-win" style="margin-top:14px"><span class="big">+' + PTS.sudoku[S.level] + '</span> points <span style="display:flex;align-items:center;gap:4px;margin-left:auto">' + leafIcon(16) + ' +' + SUDOKU_LEAVES[S.level] + (SUDOKU_LEAVES[S.level] > 1 ? ' leaves' : ' leaf') + '</span></div>'
                : '<div class="bl-win miss" style="margin-top:14px">Not quite this time — and no leaf is lost. The red boxes were wrong; the green numbers show the answers.</div>';
      b += bubble(m, 'From Lilavati', S.ok ? 'Brilliant! Every row, column and box has 1 to 9 exactly once. A new puzzle comes tomorrow.' : 'Every row, column and box must hold 1 to 9 exactly once. Try again tomorrow!')
        + '<button class="bl-btn" data-act="home">Back to Brain Lab</button>';
    } else {
      b += '<div class="bl-pad">';
      for(var n = 1; n <= 9; n++) b += '<button class="bl-num" data-act="num" data-n="' + n + '">' + n + '</button>';
      b += '<button class="bl-num" data-act="num" data-n="0" style="font-family:Mukta,sans-serif;font-size:14px;font-weight:800">Erase</button></div>';
      var filled = Object.keys(S.cells).filter(function(k){ return S.cells[k]; }).length + P.start.filter(Boolean).length;
      b += '<button class="bl-btn" data-act="check-sudoku"' + (filled === 81 ? '' : ' disabled') + '>' + (filled === 81 ? 'Check my Sudoku' : (81 - filled) + ' boxes left to fill') + '</button>'
         + '<div class="bl-note">Tap a box, then a number. You can check only once, so look carefully first!</div>';
    }
    b += '</div>';
    return '<div class="bl-split"><div>' + a + '</div><div>' + b + '</div></div>';
  }

  function doneHtml(){
    var s = score(), total = leavesTotal(), todayN = leavesToday(), nx = milestoneNext(total), pv = milestonePrev(total);
    var newM = MILESTONES.filter(function(m){ return total - todayN < m[0] && total >= m[0]; });
    var from = pv ? pv[0] : 0, pct = nx ? Math.round((total - from) / (nx[0] - from) * 100) : 100;
    var name = childName();
    function row(mm, text, pts){ return '<div>' + seal(mm) + text + '<b>+' + pts + '</b></div>'; }
    var h = '<div class="bl-border"></div><div class="bl-split"><div style="text-align:center">'
      + '<div class="bl-eyebrow">Day ' + BL.day + ' · all four done</div>'
      + '<h1 class="bl-title">' + PRAISE[(BL.day - 1) % PRAISE.length] + (name ? ', ' + esc(name) : '') + '!</h1>'
      + '<p class="bl-lede">Your tree grew ' + todayN + ' new ' + (todayN === 1 ? 'leaf' : 'leaves') + ' today.</p>'
      + '<div class="bl-court" style="margin-top:14px">' + treeSvg(total, todayN) + '</div>'
      + '<div style="display:flex;gap:10px;margin-top:10px"><div class="bl-chip" style="flex:1;text-align:left"><b>' + total + ' leaves</b>+' + todayN + ' today</div>'
      + '<div class="bl-chip pts" style="flex:1;text-align:right"><b>' + s.total + '</b>of ' + maxToday() + ' points</div></div>'
      + '</div><div><div class="bl-summary">'
      + row(MENTOR.birbal, 'Riddles · ' + rightCount('riddle') + ' of ' + COUNT.riddle, s.riddle)
      + row(MENTOR.chanakya, 'Logic · ' + rightCount('logic') + ' of ' + COUNT.logic, s.logic)
      + row(MENTOR.ramanujan, 'Maths Sprint · ' + rightCount('maths') + ' of ' + COUNT.maths, s.maths)
      + row(MENTOR.lilavati, 'Sudoku · ' + (BL.sudoku.ok ? BL.sudoku.level + ' solved' : BL.sudoku.level + ' tried'), s.sudoku)
      + '<div><span style="width:30px;display:flex;justify-content:center">' + leafIcon(24, true) + '</span>All-four bonus + golden leaf<b>+' + s.bonus + '</b></div></div>'
      + '<div class="bl-card" style="margin-top:12px;font-weight:700">'
      + (newM.length ? '🌱 New on your tree today: <b style="color:var(--leaf)">' + newM.map(function(m){ return m[2]; }).join(', ') + '</b>!<br>' : '')
      + (nx ? '<span style="color:var(--soft)">Next surprise at ' + nx[0] + ' leaves: ' + nx[2] + '.</span>' : 'Your Great Banyan is complete!')
      + '<div class="bl-bar" style="height:10px"><i style="width:' + pct + '%"></i></div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--soft);margin-top:4px"><span>' + total + '</span><span>' + (nx ? nx[0] : '') + '</span></div></div>'
      + '<button class="bl-btn" style="--c:var(--maroon)" data-act="home">Back to Brain Lab</button>'
      + '<div class="bl-note">New challenges tomorrow · Day ' + (BL.day + 1) + '</div></div></div>';
    return h;
  }

  function render(){
    var r = root(); if(!r) return;
    ensure();
    if(!BL.loaded && !BL.error) load();
    if(BL._leaves === undefined && BL.loaded) BL._leaves = leavesTotal();
    var v = BL.view, html;
    if(v === 'home') html = homeHtml();
    else if(v === 'done') html = doneHtml();
    else if(v === 'sudoku') html = sudokuHtml();
    else if(v.indexOf('review-') === 0) html = reviewHtml(v.slice(7));
    else html = quizHtml(v);
    r.innerHTML = '<div class="v-' + (v === 'home' ? 'home' : 'game') + '">' + html + '</div>';
    // A new screen starts at its top, not where the last one was scrolled to.
    if(r._view && r._view !== v){ try{ var t = r.getBoundingClientRect().top; if(t < 0 || t > 200) r.scrollIntoView({ block:'start', behavior:'instant' }); }catch(e){} }
    r._view = v;
    if(v === 'maths' && BL.maths.started && !BL.maths.done && !BL.maths.paused) startTick();
  }

  // ---- taps -------------------------------------------------------------------------------
  function onClick(e){
    var b = e.target.closest('[data-act]'); if(!b || b.disabled) return;
    var act = b.getAttribute('data-act'), g = b.getAttribute('data-g');
    if(['home', 'review', 'retry', 'done'].indexOf(act) < 0 && locked()){ if(typeof toast === 'function') toast('This day is approved — the games are closed.'); return; }
    if(act === 'home'){
      stopTick();
      // the first time all four are done, show the day's tree
      if(allDone() && !BL.celebrated){ BL.celebrated = true; BL.view = 'done'; apply(true); }
      else BL.view = 'home';
    }
    else if(act === 'done'){ BL.view = 'done'; }
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

  window.niyamBrainLab = { render: render, state: function(){ return BL; }, score: function(){ ensure(); return score(); },
    leaves: function(){ ensure(); return { total: leavesTotal(), today: leavesToday() }; } };
})();
