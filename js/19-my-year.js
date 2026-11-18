// ============================================================================
// NIYAM — js/19-my-year.js
// "My Year" — the child's keepsake book (18 Nov 2026). Loads after 18-big-ideas.js.
//
// One book for every class, written by the app one day at a time. The school
// year runs 1 April to 31 March, so each book is one class (Pooja, 18 Nov 2026).
// The child can peek at the book any time; on 31 March it is complete.
//
//   The book, 10 pages: cover · my year at a glance · my best moments · words ·
//   my Gita journey · kindness · Big Ideas · treasure chest · letters · my shelf.
//   Every number comes from what the app already saves (days, words, shlokas,
//   kindness, Big Idea writing, Star Bank claims, Brain Lab points).
//
//   • On My Journey (16-progress.js): the bookshelf card — open the book, save
//     it as a PDF, the monthly postcard, and the two letters.
//   • In the Parent Zone (15-parent-zone.js, Progress page): the parent's letter.
//     It becomes the last page and stays a surprise until 31 March.
//   • The letter to next year's self is written in March and stays sealed until
//     1 April, the first day of the next class.
//   • The monthly postcard: a picture of last month, ready on the 1st, to share
//     with the family (WhatsApp etc.).
//
// Letters and the favourite word are kept in profiles.profile_data.keepsake —
// no new table. Save as PDF uses the browser's print window (A4, one page each).
// ============================================================================
(function(){
  'use strict';
  if(window.__niyamMyYear) return; window.__niyamMyYear = true;

  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var WD = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var KIND_STEPS = [[10,'Kind Friend'],[25,'Kind Heart'],[50,'Golden Heart'],[100,'Heart of Gold']];
  var MIN_WORDS = { 4:20, 5:30, 6:40, 7:60, 8:80 };
  var PW = 720, PH = 1018;                       // one page, A4 proportions
  var FONTS = 'https://fonts.googleapis.com/css2?family=Rozha+One&family=Kalam:wght@300;400;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Tiro+Devanagari+Sanskrit&display=swap';

  // ---- helpers ------------------------------------------------------------------------------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function num(v){ var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function fmtN(n){ return (+n || 0).toLocaleString('en-IN'); }
  function today(){ return new Date().toLocaleDateString('en-CA'); }
  function dObj(d){ return new Date(d + 'T12:00:00'); }
  function addDays(d, n){ var x = dObj(d); x.setDate(x.getDate() + n); return x.toLocaleDateString('en-CA'); }
  function days(){ return (typeof savedDays !== 'undefined' && Array.isArray(savedDays)) ? savedDays : []; }
  function parse(s){ try{ var v = typeof s === 'string' ? JSON.parse(s) : s; return (v && typeof v === 'object') ? v : null; }catch(e){ return null; } }
  function first(){ return String(window.niyamChildName || '').split(' ')[0] || 'My'; }
  function poss(){ var n = first(); return n === 'My' ? 'My' : n + '’s'; }
  function plural(n, a, b){ return fmtN(n) + ' ' + (n === 1 ? a : b); }
  function clsNow(){ return parseInt(String(window.niyamChildClass || '').replace(/\D/g, ''), 10) || 0; }
  function dShort(d){ var x = dObj(d); return x.getDate() + ' ' + MONTHS[x.getMonth()].slice(0, 3); }
  function dDay(d){ var x = dObj(d); return WD[x.getDay()].slice(0, 3) + ' ' + x.getDate() + ' ' + MONTHS[x.getMonth()]; }
  function dLong(d){ var x = dObj(d); return x.getDate() + ' ' + MONTHS[x.getMonth()] + ' ' + x.getFullYear(); }
  function monthName(mk){ return MONTHS[+mk.slice(5, 7) - 1]; }
  function words(t){ return (String(t || '').match(/[A-Za-zऀ-ॿ0-9]+(?:['’-][A-Za-z]+)*/g) || []).length; }
  function hash(s){ var h = 2166136261; s = String(s); for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function clip(t, n){ t = String(t || '').replace(/\s+/g, ' ').trim(); if(t.length <= n) return t; var c = t.slice(0, n), sp = c.lastIndexOf(' '); return (sp > n * 0.6 ? c.slice(0, sp) : c).replace(/[,;:.\s]+$/, '') + '…'; }
  // its own toast — above the book and the Parent Zone
  var TT = null;
  function toastMsg(m){
    var t = $('my-toast'); if(!t){ t = document.createElement('div'); t.id = 'my-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:28px;z-index:100004;background:#1C0B3A;color:#FFE9A8;padding:12px 20px;border-radius:14px;font:700 14px "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.35);max-width:90vw;text-align:center;display:block';
    t.textContent = m; clearTimeout(TT); TT = setTimeout(function(){ t.style.display = 'none'; }, 3400);
  }

  // ---- the school year: 1 April – 31 March --------------------------------------------------------
  function yearOf(date){ var y = +date.slice(0, 4), m = +date.slice(5, 7), s = m >= 4 ? y : y - 1; return s + '-' + String((s + 1) % 100).padStart(2, '0'); }
  function yStart(yk){ return +yk.slice(0, 4); }
  function yFrom(yk){ return yStart(yk) + '-04-01'; }
  function yTo(yk){ return (yStart(yk) + 1) + '-03-31'; }
  function yLabel(yk){ return yStart(yk) + '–' + yk.slice(5); }
  function yShift(yk, n){ var s = yStart(yk) + n; return s + '-' + String((s + 1) % 100).padStart(2, '0'); }
  function joined(){
    var j = window.niyamJoinDate || '', e = days().map(function(d){ return d && d.date; }).filter(function(x){ return x && x > '2001'; }).sort()[0] || '';
    if(!j) return e || today(); return (e && e < j) ? e : j;
  }

  // ---- what is kept in the profile (letters, favourite word) ---------------------------------------
  // The letters may be written on another device (the parent on a laptop, the child on a
  // tablet), so the keepsake is read fresh from the cloud before showing or saving it.
  var CLOUD = null, CLOUD_AT = 0, CLOUD_P = null;
  function sbc(){ return window.sb || (typeof _supabase !== 'undefined' ? _supabase : null); }
  async function cloudPd(){
    var c = sbc(); if(!c) return null;
    var r = await c.from('profiles').select('profile_data').maybeSingle();
    if(r.error || !r.data) return null;
    var pd = r.data.profile_data; if(typeof pd === 'string'){ try{ pd = JSON.parse(pd); }catch(e){ pd = null; } }
    return (pd && typeof pd === 'object') ? pd : null;
  }
  function loadKeepsake(force){
    if(CLOUD_P) return CLOUD_P;
    if(!force && CLOUD && Date.now() - CLOUD_AT < 60000) return Promise.resolve(CLOUD);
    CLOUD_P = cloudPd().then(function(pd){ if(pd){ var k = pd.keepsake; CLOUD = (k && typeof k === 'object') ? k : {}; } CLOUD_AT = Date.now(); CLOUD_P = null; return CLOUD; },
                            function(){ CLOUD_AT = Date.now(); CLOUD_P = null; return CLOUD; });
    return CLOUD_P;
  }
  function KS(){
    if(CLOUD) return CLOUD;
    try{ var pd = window.niyamProfileData ? window.niyamProfileData() : {}; var k = pd && pd.keepsake; return (k && typeof k === 'object') ? k : {}; }catch(e){ return {}; }
  }
  function KY(yk){ var y = (KS().years || {})[yk]; return (y && typeof y === 'object') ? y : {}; }
  async function saveKY(yk, patch){
    if(typeof window.niyamSaveProfileData !== 'function') throw new Error('Not signed in');
    var fresh = null; try{ fresh = await cloudPd(); }catch(e){}
    var base = fresh ? fresh.keepsake : KS();
    var k = JSON.parse(JSON.stringify((base && typeof base === 'object') ? base : {})); k.years = k.years || {};
    if(fresh) CLOUD = k;
    var y = Object.assign({}, k.years[yk] || {}, patch);
    if(!y.cls && yk === yearOf(today()) && classFor(yk)) y.cls = classFor(yk);   // remember which class this book was
    k.years[yk] = y;
    // everything else in profile_data is sent as the cloud has it, so nothing newer is overwritten
    await window.niyamSaveProfileData(Object.assign({}, fresh || {}, { keepsake: k }));
    CLOUD = k; CLOUD_AT = Date.now();
  }
  // The class of a year's book. A book remembers its class once anything is saved for it;
  // on 1 April the profile may still show last year's class, so the new book is the next one.
  function classFor(yk){
    var y = (KS().years || {})[yk]; if(y && num(y.cls)) return num(y.cls);
    var cur = yearOf(today()), c = clsNow(); if(!c) return 0;
    var prev = (KS().years || {})[yShift(cur, -1)];
    if(prev && num(prev.cls) === c) c = Math.min(12, c + 1);
    return c - (yStart(cur) - yStart(yk));
  }

  // Each book remembers its class, written once while the year is on. Then on 1 April, even
  // before the profile is moved up a class, last year's book still says the right class.
  var REMEMBERED = false;
  function rememberClass(){
    if(REMEMBERED) return; var c = clsNow(); if(!c || typeof window.niyamSaveProfileData !== 'function' || !window.niyamProfileData) return;
    REMEMBERED = true;
    var cur = yearOf(today()), y = KY(cur), prev = KY(yShift(cur, -1));
    if(num(y.cls) || num(prev.cls) === c) return;                  // already known, or the profile still shows last year's class
    saveKY(cur, { cls:c }).catch(function(){ REMEMBERED = false; });
  }
  setTimeout(rememberClass, 8000);

  // ---- the child's own measure of a day (16-progress.js) ----------------------------------------------
  function kindOf(d){
    try{ if(window.niyamProgress && window.niyamProgress.kindOf) return window.niyamProgress.kindOf(d); }catch(e){}
    return d && num(d.pts) > 0 ? 'sm' : '';
  }

  // ---- other data the book needs, loaded once ---------------------------------------------------------
  var DATA = { spend:null, spendLoading:null };
  function loadSpend(){
    if(DATA.spend) return Promise.resolve(DATA.spend);
    if(DATA.spendLoading) return DATA.spendLoading;
    if(typeof _supabase === 'undefined' || !_supabase){ DATA.spend = []; return Promise.resolve(DATA.spend); }
    DATA.spendLoading = (async function(){
      try{
        var r = await _supabase.from('spend_history').select('*').order('date', { ascending:true });
        DATA.spend = r.error ? [] : (r.data || []).map(function(x){ return { date:String(x.date || '').slice(0, 10), id:x.item_id || '', title:x.item_name || 'A reward', pts:+x.pts_spent || 0 }; });
      }catch(e){ DATA.spend = []; }
      DATA.spendLoading = null;
      return DATA.spend;
    })();
    return DATA.spendLoading;
  }
  function wordList(){ return (typeof wbWords !== 'undefined' && Array.isArray(wbWords)) ? wbWords : []; }
  function kRows(){ try{ var K = window.niyamKindness && window.niyamKindness.state(); return (K && K.rows) || []; }catch(e){ return []; } }
  function gita(){
    try{ if(typeof _geetaLoadProgress === 'function' && typeof geetaProgress !== 'undefined' && !Object.keys(geetaProgress || {}).length) _geetaLoadProgress(); }catch(e){}
    return { S:(typeof SHLOKAS !== 'undefined' && SHLOKAS) || [], P:(typeof geetaProgress !== 'undefined' && geetaProgress) || {} };
  }
  async function ensureData(){
    var jobs = [loadSpend(), loadKeepsake(true)];
    try{ if(typeof wbLoad === 'function' && !wordList().length) jobs.push(wbLoad()); }catch(e){}
    try{ var K = window.niyamKindness && window.niyamKindness.state(); if(window.niyamKindness && K && !K.rows && window.niyamKindness.reload) jobs.push(window.niyamKindness.reload()); }catch(e){}
    await Promise.all(jobs.map(function(p){ return Promise.resolve(p).catch(function(){}); }));
  }
  function rewardIcon(c){
    try{
      var L = JSON.parse(localStorage.getItem('vaanya_admin_rewards') || 'null');
      if(Array.isArray(L)){ var r = L.find(function(x){ return x && ('reward_' + x.id) === c.id; }); if(r && r.icon) return r.icon; }
    }catch(e){}
    var t = String(c.title || '').toLowerCase(), M = [[/movie|film|cinema/,'🎬'],[/ice.?cream/,'🍦'],[/book|story/,'📚'],[/art|paint|draw|craft/,'🎨'],[/cricket|football|sport|play.*papa|badminton/,'🏏'],[/dessert|sweet|chocolate/,'🍨'],[/screen|game|play/,'🎮'],[/board/,'🎲'],[/dinner|pizza|food/,'🍕'],[/bake|cook|cake/,'🧁'],[/park|outing|trip|zoo/,'🌳'],[/stay up|late|night/,'🌙'],[/chore/,'🧹'],[/cycle|bicycle|bike/,'🚲'],[/toy|lego/,'🧸']];
    for(var i = 0; i < M.length; i++) if(M[i][0].test(t)) return M[i][1];
    return '🎁';
  }
  function shlokaParts(s){
    var ch = String(s.chapter || ''), m = ch.match(/(\d+)\D+(\d+)/), lines = String(s.sanskrit || '').split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
    var line = lines.find(function(x){ return !/उवाच|ुवाच/.test(x); }) || lines[0] || '';
    return { c: m ? m[1] : '', v: m ? m[2] : '', short: m ? m[1] + '.' + m[2] : ch, line: line.replace(/\s*[।॥]+\s*$/, ''), lesson: s.lesson || s.meaning || '' };
  }

  // ======================================================================================
  // Everything the book says about one school year
  // ======================================================================================
  function collect(yk){
    var t = today(), J = joined(), from = yFrom(yk), to = yTo(yk);
    var D = { yk:yk, from:from, to:to, cls:classFor(yk), name:first(), complete: t >= to, current: yearOf(t) === yk, joined:J };
    D.start = J > from ? J : from;                                    // the first day this book can have
    D.end = t < to ? t : to;
    var inY = function(d){ return d && d >= from && d <= to; };
    // days
    var all = days().filter(function(d){ return d && inY(d.date) && d.date <= t && !d.carryOver; });
    D.byDate = {}; all.forEach(function(d){ D.byDate[d.date] = d; });
    D.shown = all.filter(function(d){ return d.approved === true && num(d.pts) > 0; }).sort(function(a, b){ return a.date < b.date ? -1 : 1; });
    D.kind = {}; D.shown.forEach(function(d){ D.kind[d.date] = kindOf(d); });
    D.stars = D.shown.filter(function(d){ return D.kind[d.date] === 'st'; }).length;
    D.greats = D.shown.filter(function(d){ return D.kind[d.date] === 'gr'; }).length;
    D.dayPts = D.shown.reduce(function(a, d){ return a + num(d.pts); }, 0);
    // longest run of days in a row
    var run = 0, rFrom = '', best = { n:0, from:'', to:'' };
    D.shown.forEach(function(d, i){ if(i && addDays(D.shown[i - 1].date, 1) === d.date) run++; else { run = 1; rFrom = d.date; } if(run > best.n) best = { n:run, from:rFrom, to:d.date }; });
    D.streak = best;
    // kindness
    var kr = kRows().filter(function(r){ return r && r.status === 'confirmed' && inY(String(r.week || '').slice(0, 10)); });
    D.kindPts = kr.reduce(function(a, r){ return a + num(r.pts); }, 0);
    D.acts = kr.filter(function(r){ return !/^little:/.test(r.mission || ''); }).map(function(r){
      var a = null; try{ a = window.niyamKindness.findAct(r.mission); }catch(e){}
      return { date:String(r.week).slice(0, 10), pts:num(r.pts), title:(a && a.title) || 'An act of kindness', id:r.id };
    }).sort(function(a, b){ return a.date < b.date ? -1 : 1; });
    var allActs = kRows().filter(function(r){ return r && r.status === 'confirmed' && !/^little:/.test(r.mission || ''); }).map(function(r){ return String(r.week).slice(0, 10); }).sort();
    D.kindBadge = null;
    KIND_STEPS.forEach(function(s){ var d = allActs[s[0] - 1]; if(d && inY(d)) D.kindBadge = { n:s[0], name:s[1], date:d }; });
    D.points = D.dayPts + D.kindPts;
    // words
    D.words = wordList().map(function(w){ return { word:String(w.word || '').trim(), meaning:String(w.meaning || '').trim(), example:String(w.example || '').trim(), date:String(w.date_added || w.date || '').slice(0, 10) }; })
      .filter(function(w){ return w.word && inY(w.date); }).sort(function(a, b){ return a.date < b.date ? -1 : 1; });
    // shlokas learnt by heart this year
    var G = gita();
    D.shlokas = G.S.filter(function(s){ var p = G.P[s.id]; return p && p.status === 'mastered' && inY(String(p.date || '').slice(0, 10)); })
      .map(function(s){ return { s:s, date:String(G.P[s.id].date).slice(0, 10) }; }).sort(function(a, b){ return a.date < b.date ? -1 : 1; });
    // Big Ideas
    D.ideas = [];
    all.forEach(function(d){
      var st = parse(d.bigIdeaJSON); if(!st || !st.done || !String(st.text || '').trim()) return;
      var area = '';
      try{ if(+st.cls === clsNow() && window.niyamBigIdea){ var tp = window.niyamBigIdea.topic(d.date); if(tp && tp.t && tp.t.title === st.title) area = tp.t.area || ''; } }catch(e){}
      D.ideas.push({ date:d.date, title:st.title || 'My Big Idea', text:String(st.text).trim(), words:num(st.words) || words(st.text), area:area });
    });
    D.ideas.sort(function(a, b){ return a.date < b.date ? -1 : 1; });
    // Brain Lab
    var GAMES = [['savedRiddlePts','Riddles'],['savedLogicPts','Logic puzzles'],['savedMathsPts','Maths'],['savedSudokuPts','Sudoku']];
    var gTot = {}, bDays = 0, bBest = null, bAll = 0;
    D.shown.forEach(function(d){
      var p = 0; GAMES.forEach(function(g){ var v = num(d[g[0]]); gTot[g[1]] = (gTot[g[1]] || 0) + v; p += v; }); p += num(d.savedWorksheetPts);
      if(p > 0){ bDays++; bAll += p; if(!bBest || p > bBest.p) bBest = { date:d.date, p:p }; }
    });
    var fav = Object.keys(gTot).sort(function(a, b){ return gTot[b] - gTot[a]; })[0];
    D.brain = { pts:bAll, days:bDays, fav: fav && gTot[fav] > 0 ? fav : '', best:bBest };
    // Star Bank
    D.claims = (DATA.spend || []).filter(function(c){ return inY(c.date) && c.pts > 0; });
    D.spent = D.claims.reduce(function(a, c){ return a + c.pts; }, 0);
    D.bank = null; D.goal = null;
    if(D.current){
      try{ D.bank = availablePts(); }catch(e){}
      try{ var g = window.niyamStarBank && window.niyamStarBank.goal(); if(g && g.pts > 0) D.goal = g; }catch(e){}
    }
    // months
    D.months = [];
    for(var i = 0; i < 12; i++){
      var y = yStart(yk) + (i >= 9 ? 1 : 0), m = ((i + 3) % 12) + 1, mk = y + '-' + String(m).padStart(2, '0');
      var n = new Date(y, m, 0).getDate(), M = { mk:mk, label:MONTHS[m - 1], n:n, pts:0, stars:0, shown:0, words:0, acts:0, kpts:0 };
      D.shown.forEach(function(d){ if(d.date.slice(0, 7) === mk){ M.pts += num(d.pts); M.shown++; if(D.kind[d.date] === 'st') M.stars++; } });
      kr.forEach(function(r){ if(String(r.week).slice(0, 7) === mk){ M.pts += num(r.pts); M.kpts += num(r.pts); if(!/^little:/.test(r.mission || '')) M.acts++; } });
      D.words.forEach(function(w){ if(w.date.slice(0, 7) === mk) M.words++; });
      M.past = mk <= t.slice(0, 7); M.before = (mk + '-' + String(n).padStart(2, '0')) < D.start;
      D.months.push(M);
    }
    D.golden = D.months.filter(function(m){ return m.pts > 0; }).sort(function(a, b){ return b.pts - a.pts; })[0] || null;
    D.bestDay = D.shown.slice().sort(function(a, b){ return num(b.pts) - num(a.pts) || (a.date < b.date ? -1 : 1); })[0] || null;
    D.milestones = milestones(D);
    var L = KY(yk); D.parentLetter = L.parentLetter || null; D.childLetter = L.childLetter || null; D.favWord = L.favWord || '';
    return D;
  }

  function milestones(D){
    var L = [], cum = 0, ev = [];
    D.shown.forEach(function(d){ ev.push([d.date, num(d.pts)]); });
    kRows().forEach(function(r){ if(r && r.status === 'confirmed'){ var w = String(r.week).slice(0, 10); if(w >= D.from && w <= D.to) ev.push([w, num(r.pts)]); } });
    ev.sort(function(a, b){ return a[0] < b[0] ? -1 : 1; });
    var marks = [1000, 5000, 10000, 25000, 50000, 100000], mi = 0;
    ev.forEach(function(e){ cum += e[1]; while(mi < marks.length && cum >= marks[mi]){ L.push({ date:e[0], ic: marks[mi] >= 25000 ? '🌟' : marks[mi] >= 10000 ? '🌱' : '✨', label:fmtN(marks[mi]) + ' points', w: 3 + mi }); mi++; } });
    var fs = D.shown.find(function(d){ return D.kind[d.date] === 'st'; }); if(fs) L.push({ date:fs.date, ic:'⭐', label:'First Star Day', w:9 });
    [50, 100, 200].forEach(function(n, i){ if(D.shown[n - 1]) L.push({ date:D.shown[n - 1].date, ic:'💯', label:n + 'th day', w: n === 100 ? 9 : 5 + i }); });
    if(D.shlokas[0]) L.push({ date:D.shlokas[0].date, ic:'🕉️', label:'First shloka by heart', w:8 });
    [50, 100, 250].forEach(function(n, i){ if(D.words[n - 1]) L.push({ date:D.words[n - 1].date, ic:'📖', label:n + ' words', w:4 + i }); });
    if(D.kindBadge) L.push({ date:D.kindBadge.date, ic:'💛', label:D.kindBadge.name, w:8 });
    // Shining Month: 7 Star Days in one month
    var per = {}; for(var i = 0; i < D.shown.length; i++){ var d = D.shown[i]; if(D.kind[d.date] !== 'st') continue; var mk = d.date.slice(0, 7); per[mk] = (per[mk] || 0) + 1; if(per[mk] === 7){ L.push({ date:d.date, ic:'🏅', label:'Shining Month', w:8 }); break; } }
    // streaks of 7 and 30
    var run = 0; var got7 = false, got30 = false;
    D.shown.forEach(function(d, i){ run = (i && addDays(D.shown[i - 1].date, 1) === d.date) ? run + 1 : 1;
      if(run === 7 && !got7){ got7 = true; L.push({ date:d.date, ic:'🔥', label:'7 days in a row', w:6 }); }
      if(run === 30 && !got30){ got30 = true; L.push({ date:d.date, ic:'🔥', label:'30 days in a row', w:9 }); } });
    L.sort(function(a, b){ return b.w - a.w || (a.date < b.date ? -1 : 1); });
    return L.slice(0, 6).sort(function(a, b){ return a.date < b.date ? -1 : 1; });
  }

  // ======================================================================================
  // THE BOOK — pages
  // ======================================================================================
  function runHead(D){ return '<div class="run">' + esc(poss()) + ' Year · Class ' + (D.cls || '') + ' · ' + yLabel(D.yk) + '</div>'; }
  function pg(D, cls, body, no, opts){
    opts = opts || {};
    return '<div class="myw"><div class="myp ' + cls + '">' + (opts.noRun ? '' : runHead(D)) + body + (no ? '<div class="pno"><b>' + no + '</b></div>' : '') + '</div></div>';
  }
  // The rest of a page, sized after drawing (fitPages): while the year is on it says the
  // chapter is still being written; in a finished book it is a small gold ornament.
  function fill(D, msg){
    if(D.complete) return '<div class="fill end"><span class="r">✦</span></div>';
    var left = Math.max(0, Math.round((dObj(D.to) - dObj(today())) / 864e5));
    return '<div class="fill wip"><div class="k">✏️ ' + esc(msg) + '</div><span>' + (left ? plural(left, 'day', 'days') + ' until this book is complete' : 'complete tomorrow') + '</span></div>';
  }
  function soFar(D){ return D.complete ? '' : '<div class="sofar">This page is still being written · ' + dShort(D.end) + '</div>'; }

  // 1 · cover
  function pCover(D){
    var bits = []; if(D.shown.length) bits.push(plural(D.shown.length, 'day', 'days')); if(D.words.length) bits.push(plural(D.words.length, 'word', 'words'));
    if(D.shlokas.length) bits.push(plural(D.shlokas.length, 'shloka', 'shlokas')); if(D.acts.length) bits.push(plural(D.acts.length, 'kind act', 'kind acts'));
    var medal = '<svg viewBox="0 0 200 200" width="230" height="230"><defs><linearGradient id="myg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3C4"/><stop offset=".35" stop-color="#F7D774"/><stop offset=".7" stop-color="#E2A91E"/><stop offset="1" stop-color="#9A6412"/></linearGradient></defs>'
      + '<circle cx="100" cy="100" r="92" fill="none" stroke="url(#myg)" stroke-width="2.5"/><circle cx="100" cy="100" r="84" fill="none" stroke="url(#myg)" stroke-width="1" stroke-dasharray="2 5"/>'
      + '<g fill="url(#myg)"><path d="M100 150 C99 128 99 112 100 92 C101 112 101 128 100 150Z"/><path d="M100 118 C86 112 74 100 70 84 C86 88 96 98 100 118Z"/><path d="M100 106 C114 100 126 88 130 72 C114 76 104 86 100 106Z"/><path d="M100 96 C92 86 90 74 94 62 C102 72 104 84 100 96Z"/>'
      + '<circle cx="100" cy="52" r="5"/><circle cx="72" cy="70" r="3"/><circle cx="130" cy="58" r="3.5"/><path d="M64 152 Q100 140 136 152 Q100 158 64 152Z"/></g>'
      + '<g fill="#F7D774"><path d="M100 18 l2.2 5.8 6 .4 -4.6 3.9 1.5 5.9 -5.1-3.3 -5.1 3.3 1.5-5.9 -4.6-3.9 6-.4z"/></g></svg>';
    return pg(D, 'cover', '<div class="sky"></div><div class="spine"></div><div class="top kicker">' + esc(window.APP_NAME || 'Alchemy') + ' · Book of the Year</div>'
      + '<div class="medal">' + medal + '</div><div class="title r foil">My Year</div><div class="name k">' + esc(D.name) + '</div>'
      + '<div class="cls"><span>Class ' + (D.cls || '') + '</span><b></b><span>April ' + yStart(D.yk) + ' – March ' + (yStart(D.yk) + 1) + '</span></div>'
      + '<div class="foot">' + (bits.length ? esc(bits.join(' · ')) + '<br>' : '') + '<em>' + (D.complete ? 'written one small day at a time' : 'being written, one small day at a time') + '</em></div>', 0, { noRun:true });
  }

  // 2 · at a glance
  function pGlance(D){
    var cand = [
      [D.shown.length, 'days I showed up', '#4A1F86', '🌅'], [D.points, 'points earned', '#B7791F', '⭐'],
      [D.streak.n, D.streak.n === 1 ? 'day in a row — my longest streak' : 'days in a row — my longest streak', '#E11D48', '🔥'], [D.stars, D.stars === 1 ? 'Star Day' : 'Star Days', '#D97706', '🌟'],
      [D.words.length, 'new words in my dictionary', '#0284C7', '📖'], [D.shlokas.length, D.shlokas.length === 1 ? 'Gita shloka learnt by heart' : 'Gita shlokas learnt by heart', '#C2410C', '🕉️'],
      [D.acts.length, D.acts.length === 1 ? 'kind act' : 'kind acts', '#DB2777', '💛'], [D.ideas.length, 'Big Ideas I wrote about', '#15803D', '💡'],
      [D.brain.pts, 'Brain Lab points', '#7C3AED', '🧠'], [D.greats, D.greats === 1 ? 'Great Day' : 'Great Days', '#7C3AED', '🌈'], [D.claims.length, D.claims.length === 1 ? 'reward I earned' : 'rewards I earned', '#B7791F', '🎁']
    ];
    var pick = cand.filter(function(c){ return c[0] > 0; }); if(pick.length < 8) pick = pick.concat(cand.filter(function(c){ return !(c[0] > 0); })).slice(0, 8); pick = pick.slice(0, 8);
    var tiles = pick.map(function(c){ return '<div class="st"><div class="em">' + c[3] + '</div><div class="v r" style="color:' + c[2] + '">' + fmtN(c[0]) + '</div><div class="l">' + esc(c[1]) + '</div></div>'; }).join('');
    var t = today(), rows = '', hasB = false, hasF = false;
    D.months.forEach(function(M){
      var cells = '';
      for(var dn = 1; dn <= 31; dn++){
        if(dn > M.n){ cells += '<i class="x"></i>'; continue; }
        var ds = M.mk + '-' + String(dn).padStart(2, '0'), c = 'n';
        if(ds > t){ c = 'f'; hasF = true; }
        else if(ds < D.start){ c = 'b'; hasB = true; }
        else if(D.kind[ds] === 'st') c = 's';
        else if(D.kind[ds]) c = 'd';
        cells += '<i class="' + c + '"></i>';
      }
      rows += '<div class="mrow"><em>' + M.label.slice(0, 3) + '</em>' + cells + '</div>';
    });
    var dayN = function(n){ var d = D.shown[n - 1]; return d || null; };
    var d1 = dayN(1), d100 = dayN(100), last = D.shown[D.shown.length - 1];
    var f1 = d1 ? '<b>Day 1</b><span>' + esc(dDay(d1.date)) + ' · ' + fmtN(d1.pts) + ' points</span>' : '<b>Day 1</b><span>my first day is coming</span>';
    var f2 = d100 ? '<b>Day 100</b><span>' + esc(dDay(d100.date)) + ' · the 100th day</span>' : '<b>Day 100</b><span>' + (D.complete ? 'next year!' : plural(100 - D.shown.length, 'day', 'days') + ' to go') + '</span>';
    var f3 = last ? '<b>Day ' + fmtN(D.shown.length) + '</b><span>' + esc(dDay(last.date)) + (D.complete ? ' · my last day of Class ' + D.cls : ' · so far') + '</span>' : '<b>Day ' + fmtN(D.shown.length) + '</b><span>so far</span>';
    return pg(D, 'glance', '<div class="kicker">Chapter one</div><h1 class="r">My year at a glance</h1><p class="lede">Every number on this page is something ' + esc(D.name) + ' did — one ordinary day at a time.</p>'
      + '<div class="stats">' + tiles + '</div><div class="cal"><div class="calh' + (hasB || hasF ? ' wide' : '') + '"><b class="r">Every dot is one day</b><span class="key"><i class="s"></i>Star Day<i class="d"></i>Showed up<i class="n"></i>Rest day'
      + (hasB ? '<i class="b"></i>Before I joined' : '') + (hasF ? '<i class="f"></i>Still to come' : '') + '</span></div>' + rows + '</div>'
      + '<div class="firsts"><div><i class="s"></i>' + f1 + '</div><div><i class="s"></i>' + f2 + '</div><div><i class="s"></i>' + f3 + '</div></div>' + oneLine(D), 2);
  }

  function oneLine(D){
    var span = Math.max(0, Math.round((dObj(D.end) - dObj(D.start)) / 864e5) + 1); if(!span || !D.shown.length) return '';
    var r = Math.round(D.shown.length / span * 10), tail = r >= 10 ? 'nearly every single day.' : r >= 1 ? 'about ' + r + ' days out of every 10.' : 'and every one of them counted.';
    return '<div class="line1 k">Showed up on <b>' + fmtN(D.shown.length) + '</b> of the ' + fmtN(span) + ' days ' + (D.complete ? 'of the year' : 'so far') + ' — ' + tail + '</div>';
  }

  // 3 · best moments
  function pBest(D){
    var mx = Math.max.apply(null, D.months.map(function(m){ return m.pts; }).concat([1]));
    var bars = D.months.map(function(m){
      var isB = D.golden && m.mk === D.golden.mk, h = m.pts ? Math.max(6, Math.round(m.pts / mx * 150)) : 0;
      return '<div class="' + (isB ? 'best' : '') + (m.past ? '' : ' fut') + '"><em>' + (isB ? fmtN(m.pts) : '') + '</em><div style="height:' + (m.past ? h : 150) + 'px"></div><span>' + m.label.slice(0, 3) + '</span></div>';
    }).join('');
    var G = D.golden, gold;
    if(G){
      var sub = [fmtN(G.pts) + ' points']; if(G.stars) sub.push(plural(G.stars, 'Star Day', 'Star Days')); if(G.words) sub.push(plural(G.words, 'new word', 'new words'));
      var isNow = G.mk === today().slice(0, 7) && !D.complete;
      gold = '<div class="card gold"><div class="tag">🏆 My golden month</div><div class="big r">' + G.label + '</div><div class="sub">' + esc(sub.join(' · ')) + '</div>'
        + '<div class="k quote">“I showed up on ' + G.shown + ' of ' + (isNow ? num(today().slice(8)) : G.n) + ' days' + (isNow ? ' so far' : '') + '.”</div></div>';
    } else gold = '<div class="card gold"><div class="tag">🏆 My golden month</div><div class="big r">Coming soon</div><div class="sub">My best month appears here</div></div>';
    var B = D.bestDay, day;
    if(B){
      var li = [];
      if(D.kind[B.date] === 'st') li.push('A <b>Star Day</b> — almost every task done');
      var sh = D.shlokas.find(function(x){ return x.date === B.date; }); if(sh) li.push('Learnt <b>Gita ' + esc(shlokaParts(sh.s).short) + '</b> by heart');
      var bi = D.ideas.find(function(x){ return x.date === B.date; }); if(bi) li.push('Big Idea: <b>' + esc(clip(bi.title, 46)) + '</b>');
      var ka = D.acts.find(function(x){ return x.date === B.date; }); if(ka) li.push(esc(clip(ka.title, 50)) + ' 💛');
      var wn = D.words.filter(function(w){ return w.date === B.date; }).length; if(wn) li.push(plural(wn, 'new word', 'new words') + ' in my dictionary');
      var bp = 0; ['savedRiddlePts','savedLogicPts','savedMathsPts','savedSudokuPts','savedWorksheetPts'].forEach(function(k){ bp += num(B[k]); }); if(bp) li.push(fmtN(bp) + ' Brain Lab points');
      day = '<div class="card day"><div class="tag">⭐ My best day ever</div><div class="big r">' + esc(WD[dObj(B.date).getDay()].slice(0, 3) + ', ' + dShort(B.date)) + '</div><div class="sub">' + fmtN(B.pts) + ' points</div>'
        + (li.length ? '<ul>' + li.slice(0, 3).map(function(x){ return '<li>✓ ' + x + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    } else day = '<div class="card day"><div class="tag">⭐ My best day ever</div><div class="big r">Still to come</div></div>';
    var S = D.streak, dots = ''; for(var i = 0; i < Math.min(S.n, 48); i++) dots += '<span></span>';
    var streak = S.n ? '<div class="streak"><div class="flame">🔥</div><div><div class="r stn">' + plural(S.n, 'day', 'days') + ' in a row</div><div class="sub">' + (S.n > 1 ? esc(dShort(S.from) + ' → ' + dShort(S.to) + ' · ') : '') + 'my longest streak</div></div><div class="dots">' + dots + '</div></div>'
      : '<div class="streak"><div class="flame">🔥</div><div><div class="r stn">My first streak</div><div class="sub">starts with my first day</div></div></div>';
    var ms = D.milestones;
    var msH = ms.length ? '<div class="ml" style="grid-template-columns:repeat(' + Math.max(3, ms.length) + ',1fr)"><div class="mline"></div>' + ms.map(function(m){ return '<div><span class="mi">' + m.ic + '</span><b>' + esc(dShort(m.date)) + '</b><small>' + esc(m.label) + '</small></div>'; }).join('') + '</div>'
      : '<div class="mnone">My milestones appear here — my first Star Day, 1,000 points, my first shloka by heart…</div>';
    return pg(D, 'best', '<div class="kicker">Chapter two</div><h1 class="r">My best moments</h1><p class="lede">The month, the day and the streak ' + esc(D.name) + ' will always remember.</p>'
      + '<div class="chart"><div class="ch">Points each month</div><div class="bars">' + bars + '</div></div><div class="two">' + gold + day + '</div>' + streak
      + '<div class="ms"><div class="mt">Milestones</div>' + msH + '</div>' + fill(D, 'My best month, best day and longest streak can still change.') + soFar(D), 3);
  }

  // 4 · words
  var COLS = ['#4A1F86','#0284C7','#DB2777','#15803D','#C2410C','#B7791F','#E11D48','#7C3AED','#0E7490'];
  function favWord(D){
    var f = D.favWord && D.words.find(function(w){ return w.word.toLowerCase() === String(D.favWord).toLowerCase(); });
    if(f) return f;
    return D.words.slice().sort(function(a, b){ return b.example.length - a.example.length; })[0] || null;
  }
  function pWords(D){
    var W = D.words, n = W.length, F = favWord(D);
    if(!n){
      return pg(D, 'words', '<div class="kicker">Chapter three</div><h1 class="r">Words that are mine</h1><p class="lede">Every word ' + esc(D.name) + ' finds in a book, writes down and uses in a sentence lands on this page.</p>'
        + '<div class="cloud empty"><span class="k">My first word is waiting in a book somewhere…</span></div>' + fill(D, 'Room for every new word I find.') + soFar(D), 4);
    }
    var pickW = W.slice().sort(function(a, b){ return hash(a.word) - hash(b.word); }).slice(0, 28);
    if(F && !pickW.some(function(w){ return w.word === F.word; })) pickW[0] = F;
    var big = n < 10 ? 1.5 : n < 20 ? 1.25 : 1;
    var cloud = pickW.map(function(w){ var h = hash(w.word), s = Math.round((15 + h % 18) * big * 1.18); if(w.word.length > 11) s = Math.round(s * 0.85);
      return '<span style="font-size:' + s + 'px;color:' + COLS[h % COLS.length] + ';transform:rotate(' + [0, 0, 0, -3, 3, -6][h % 6] + 'deg)">' + esc(w.word) + '</span>'; }).join('');
    if(n > pickW.length) cloud += '<span class="more">…and ' + fmtN(n - pickW.length) + ' more</span>';
    var fav = F ? '<div class="fav"><div class="pin">📌</div><div class="ft">My favourite word this year</div><div class="fw r">' + esc(F.word) + '</div>' + (F.meaning ? '<div class="fm">' + esc(clip(F.meaning, 110)) + '</div>' : '')
      + (F.example ? '<div class="fe k">“' + esc(clip(F.example, 150)) + '”</div>' : '') + '<div class="fd">Added on ' + esc(dLong(F.date)) + '</div></div>' : '';
    var wm = D.months.filter(function(m){ return m.words > 0; }).sort(function(a, b){ return b.words - a.words; })[0];
    var letters = {}; W.forEach(function(w){ var c = w.word.charAt(0).toLowerCase(); if(c >= 'a' && c <= 'z') letters[c] = 1; });
    var miss = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(function(c){ return !letters[c]; });
    var lt = !miss.length ? ['A–Z', 'a word for every letter of the alphabet'] : miss.length <= 3 && n >= 20 ? ['A–Z', 'a word for every letter except ' + miss.map(function(c){ return c.toUpperCase(); }).join(', ')]
           : [String(26 - miss.length), 'letters of the alphabet my words start with'];
    var lw = W.slice().sort(function(a, b){ return b.word.length - a.word.length; })[0];
    var rows = '<div class="rows"><div><b class="r">' + (wm ? wm.words : 0) + '</b><span>' + (wm ? 'words in ' + wm.label + ', my wordiest month' : 'words this year') + '</span></div>'
      + '<div><b class="r">' + esc(lt[0]) + '</b><span>' + esc(lt[1]) + '</span></div>'
      + '<div><b class="r lw">' + esc(clip(lw.word, 16)) + '</b><span>my longest word · ' + lw.word.length + ' letters</span></div></div>';
    return pg(D, 'words', '<div class="kicker">Chapter three</div><h1 class="r">' + (n === 1 ? 'My first word' : fmtN(n) + ' words that are now mine') + '</h1><p class="lede">Every word ' + esc(D.name) + ' found in a book, wrote down, and used in a brand-new sentence.</p>'
      + '<div class="cloud' + (n < 10 ? ' few' : '') + '">' + cloud + '</div>' + fav + rows + fill(D, 'Room for every new word I find.') + soFar(D), 4);
  }

  // 5 · Gita
  function pGita(D){
    var L = D.shlokas.slice(0, 16);      // the page keeps as many as fit; the rest become '…and N more'
    var steps = L.map(function(x, i){ var P = shlokaParts(x.s);
      return '<div class="shk ' + (i % 2 ? 'rt' : 'lf') + '"><div class="lotus">' + (i + 1) + '</div><div class="box"><div class="vv">Chapter ' + esc(P.c) + ' · Verse ' + esc(P.v) + '<span>' + esc(dShort(x.date)) + '</span></div><div class="dev sk">' + esc(P.line) + '</div><div class="mm">' + esc(clip(P.lesson, 120)) + '</div></div></div>'; }).join('');
    if(L.length) steps += '<div class="shk mb" data-n="' + D.shlokas.length + '" style="display:none"><div class="lotus">+</div><div class="box moreb"><b class="r"></b><span>' + (D.complete ? 'all learnt by heart this year' : 'learnt by heart so far') + '</span></div></div>';
    var n = D.shlokas.length;
    if(n && n < 5 && !D.complete){
      var G2 = gita(), now2 = G2.S.find(function(s){ var p = G2.P[s.id]; return p && (p.status === 'inprogress' || p.status === 'relearning'); });
      for(var gi = n; gi < Math.min(5, n + 3); gi++){
        var cl = gi % 2 ? 'rt' : 'lf';
        if(gi === n && now2){ var P2 = shlokaParts(now2); steps += '<div class="shk ' + cl + ' ghost"><div class="lotus">' + (gi + 1) + '</div><div class="box"><div class="vv">Learning now · ' + esc(P2.short) + '</div><div class="dev sk">' + esc(P2.line) + '</div></div></div>'; }
        else steps += '<div class="shk ' + cl + ' ghost"><div class="lotus">' + (gi + 1) + '</div><div class="box"><div class="vv">Shloka ' + (gi + 1) + '</div><div class="mm">still to learn by heart</div></div></div>';
      }
    }
    if(!n){
      var G = gita(), learning = G.S.find(function(s){ var p = G.P[s.id]; return p && (p.status === 'inprogress' || p.status === 'relearning'); });
      steps = '<div class="shk lf"><div class="lotus">1</div><div class="box"><div class="vv">' + (learning ? 'Learning now' : 'My first shloka') + '</div>'
        + (learning ? '<div class="dev sk">' + esc(shlokaParts(learning).line) + '</div><div class="mm">' + esc(clip(shlokaParts(learning).lesson, 120)) + '</div>' : '<div class="mm">will appear here when I learn it by heart</div>') + '</div></div>';
    }
    return pg(D, 'gita', '<div class="kicker">Chapter four</div><h1 class="r">My Gita journey</h1><p class="lede">' + (n ? (n === 1 ? 'The shloka ' : 'The ' + n + ' shlokas ') + esc(D.name) + ' learnt by heart this year — and what ' + (n === 1 ? 'it means' : 'each one means') + '.' : 'Every shloka ' + esc(D.name) + ' learns by heart is added to this path.') + '</p>'
      + '<div class="path"><div class="line"></div>' + steps + '</div><div class="om dev">ॐ</div>' + fill(D, 'Room for every shloka I learn by heart.') + soFar(D), 5);
  }

  // 6 · kindness
  function pKind(D){
    var A = D.acts, n = A.length, show = Math.min(n, 96), cols = n <= 24 ? 8 : n <= 48 ? 12 : 16, hs = '';
    for(var i = 0; i < show; i++) hs += '<span class="' + ['a','b','c','a','a','b'][hash(A[i].id || i) % 6] + '">♥</span>';
    if(n > 96) hs += '<span class="plus">+' + (n - 96) + '</span>';
    var picked = [], seen = {};
    A.slice().sort(function(a, b){ return b.pts - a.pts || (a.date < b.date ? 1 : -1); }).forEach(function(a){ if(picked.length < 4 && !seen[a.title]){ seen[a.title] = 1; picked.push(a); } });
    picked.sort(function(a, b){ return a.date < b.date ? -1 : 1; });
    var notes = picked.map(function(a, i){ return '<div class="note" style="transform:rotate(' + [-2, 2, -1.5, 1.5][i] + 'deg)"><div class="k t">' + esc(clip(a.title, 80)) + '</div><div class="d">' + esc(dShort(a.date)) + '</div></div>'; }).join('');
    var mx = Math.max.apply(null, D.months.map(function(m){ return m.acts; }).concat([1]));
    var kb = D.months.map(function(m){ return '<div><em style="height:' + Math.round(m.acts / mx * 92) + 'px"></em><span>' + m.label.charAt(0) + '</span></div>'; }).join('');
    var body = n ? '<div class="hearts" style="grid-template-columns:repeat(' + cols + ',1fr)' + (cols === 8 ? ';font-size:38px' : '') + '">' + hs + '</div><div class="notes">' + notes + '</div>'
      : '<div class="hearts empty"><span class="k">My first heart appears when Mumma or Papa confirm my first kind act 💛</span></div>';
    var badge = D.kindBadge ? '<div class="gold"><b class="r">' + esc(D.kindBadge.name) + '</b> badge earned on ' + esc(dShort(D.kindBadge.date)) + ' — for ' + D.kindBadge.n + ' kind acts</div>' : '';
    return pg(D, 'kind', '<div class="kicker">Chapter five</div><h1 class="r">' + (n ? (n === 1 ? 'The first time I was kind' : fmtN(n) + ' times I was kind') : 'My kind acts') + '</h1><p class="lede">Every heart is a kind act ' + esc(D.name) + '’s family saw and confirmed.</p>'
      + body + '<div class="km"><div class="kt"><b class="r">' + fmtN(D.kindPts) + '</b><span>points of kindness this year</span></div><div class="kb">' + kb + '</div></div>' + badge + fill(D, 'Room for every kind thing I do.') + soFar(D), 6);
  }

  // 7 · Big Ideas
  function pIdeas(D){
    var I = D.ideas, n = I.length;
    if(!n) return pg(D, 'ideas', '<div class="kicker">Chapter six</div><h1 class="r">My big questions</h1><p class="lede">Each Big Idea starts with ' + esc(D.name) + '’s own answer, written <i>before</i> reading the facts. Those answers will fill this page.</p>'
      + '<div class="ideas"><div class="idea"><div class="q r">My first Big Idea</div><div class="k w">is waiting for me on the Today page…</div></div></div>' + fill(D, 'Room for every big question I answer.') + soFar(D), 7);
    var seenT = {}, U = I.filter(function(x){ var k = x.title.toLowerCase(); if(seenT[k]) return false; seenT[k] = 1; return true; });
    var short = U.filter(function(x){ return x.text.length <= 330; }).sort(function(a, b){ return b.words - a.words; });
    var pick = short.slice(0, 3); if(pick.length < 3) U.slice().sort(function(a, b){ return a.text.length - b.text.length; }).forEach(function(x){ if(pick.length < 3 && pick.indexOf(x) < 0) pick.push(x); });
    pick.sort(function(a, b){ return a.date < b.date ? -1 : 1; });
    var cards = pick.map(function(x){ return '<div class="idea"><div class="q r">' + esc(clip(x.title, 60)) + '</div><div class="dt">' + esc(dShort(x.date)) + '</div><div class="k w">' + esc(clip(x.text, 330)) + '</div></div>'; }).join('');
    var rest = U.filter(function(x){ return pick.indexOf(x) < 0; });
    var chips = rest.slice(0, 8).map(function(x){ return '<span>' + esc(clip(x.title, 36)) + '</span>'; }).join('') + (rest.length > 8 ? '<span>+ ' + (rest.length - 8) + ' more</span>' : '');
    var tw = I.reduce(function(a, x){ return a + x.words; }, 0), lg = I.slice().sort(function(a, b){ return b.words - a.words; })[0];
    var areas = {}; I.forEach(function(x){ if(x.area) areas[x.area] = 1; }); var ak = Object.keys(areas);
    var third = ak.length >= 2 ? '<div><b class="r">' + ak.length + '</b><span>subjects explored — ' + esc(ak.slice(0, 3).join(', ').toLowerCase()) + (ak.length > 3 ? '…' : '') + '</span></div>'
                               : '<div><b class="r">' + fmtN(Math.round(tw / n)) + '</b><span>words in an answer, on average</span></div>';
    return pg(D, 'ideas', '<div class="kicker">Chapter six</div><h1 class="r">' + (n === 1 ? 'My first big question' : fmtN(n) + ' big questions') + '</h1><p class="lede">Each one began with ' + esc(D.name) + '’s own answer, written <i>before</i> reading the facts. Here ' + (pick.length === 1 ? 'is that answer' : 'are ' + pick.length + ' of them') + ', exactly as written.</p>'
      + '<div class="ideas">' + cards + '</div>' + (chips ? '<div class="chips">' + chips + '</div>' : '')
      + '<div class="istat"><div><b class="r">' + fmtN(tw) + '</b><span>words I wrote</span></div><div><b class="r">' + fmtN(lg.words) + '</b><span>my longest answer, on ' + esc(clip(lg.title, 34)) + '</span></div>' + third + '</div>' + fill(D, 'Room for every big question I answer.') + soFar(D), 7);
  }

  // 8 · treasure chest
  function pTreasure(D){
    var bank = '<div class="bank"><div><span>Stars earned</span><b class="r">' + fmtN(D.points) + '</b></div><div><span>Spent on rewards</span><b class="r">' + fmtN(D.spent) + '</b></div>'
      + (D.bank !== null ? '<div><span>In my Star Bank now</span><b class="r">' + fmtN(D.bank) + '</b></div>' : '<div><span>Rewards I earned</span><b class="r">' + fmtN(D.claims.length) + '</b></div>') + '</div>';
    var C = D.claims.slice().sort(function(a, b){ return b.pts - a.pts || (a.date < b.date ? 1 : -1); }).slice(0, 5).sort(function(a, b){ return a.date < b.date ? -1 : 1; });
    var tix = C.length ? C.map(function(c){ return '<div class="tk"><div class="e">' + rewardIcon(c) + '</div><div class="tt"><b>' + esc(clip(c.title, 52)) + '</b><span>Claimed on ' + esc(dShort(c.date)) + '</span></div><div class="c">' + fmtN(c.pts) + ' ★</div></div>'; }).join('')
      + (D.claims.length > 5 ? '<div class="tmore">…and ' + (D.claims.length - 5) + ' more rewards</div>' : '')
      : '<div class="tk empty"><div class="e">🎁</div><div class="tt"><b>My first reward is on its way</b><span>Rewards I choose from the Star Bank appear here</span></div></div>';
    var goal = '';
    if(D.goal){ var pct = Math.min(100, Math.round((D.bank || 0) / D.goal.pts * 100));
      goal = '<div class="goal"><div class="gt"><span>' + esc(D.goal.icon || '🎯') + '</span><div><b>Saving up for: ' + esc(clip(D.goal.title, 60)) + '</b><em>' + fmtN(Math.min(D.bank || 0, D.goal.pts)) + ' of ' + fmtN(D.goal.pts) + ' stars' + (pct >= 100 ? ' — I have enough! 🎉' : pct >= 70 ? ' — nearly there!' : '') + '</em></div></div><div class="gb"><div style="width:' + pct + '%"></div></div></div>'; }
    var B = D.brain, brain = B.pts ? '<div class="brain"><div class="bt r">Brain Lab</div><div class="bg"><div><b>' + fmtN(B.pts) + '</b>Brain Lab points</div><div><b>' + fmtN(B.days) + '</b>days I played</div>'
      + '<div><b>' + esc(B.fav || '—') + '</b>my best game</div><div><b>' + (B.best ? esc(WD[dObj(B.best.date).getDay()].slice(0, 3) + ' ' + dShort(B.best.date)) : '—') + '</b>my best Brain Lab day</div></div></div>' : '';
    return pg(D, 'treasure', '<div class="kicker">Chapter seven</div><h1 class="r">My treasure chest</h1><p class="lede">Rewards ' + esc(D.name) + ' saved up for in the Star Bank — and earned.</p>'
      + bank + '<div class="tix">' + tix + '</div>' + goal + brain + fill(D, 'Room for every reward I save up for.') + soFar(D), 8);
  }

  // 9 · letters
  function pLetters(D, asParent){
    var P = D.parentLetter, C = D.childLetter, nx = D.cls ? D.cls + 1 : '';
    var showP = P && P.text && (today() >= D.to || asParent);
    var letter = showP ? '<div class="letter"><div class="lt">A letter from ' + esc(P.sign || 'my family') + '</div><div class="k body">' + esc(clipKeep(P.text, 900)).replace(/\n/g, '<br>') + '</div><div class="k sign">With all our love, ' + esc(P.sign || 'my family') + ' ♥</div></div>'
      : '<div class="letter waiting"><div class="lt">A letter from my family</div><div class="k body">' + (P && P.text ? 'Something is waiting here… it arrives on 31 March. ✉️' : 'In March, Mumma or Papa write a letter. It arrives on this page on 31 March. ✉️') + '</div></div>';
    var envTxt = C && C.text ? '<b>A letter to my Class ' + nx + ' self</b><span>Written by ' + esc(D.name) + ' on ' + esc(dLong(C.at ? String(C.at).slice(0, 10) : D.to)) + ' · ' + (today() >= (yStart(D.yk) + 1) + '-04-01' ? 'opened' : 'opens') + ' on 1 April ' + (yStart(D.yk) + 1) + ', my first day of Class ' + nx + '</span>'
      : '<b>A letter to my Class ' + nx + ' self</b><span>' + (D.complete ? 'Not written this year' : 'I write it in March · it opens on 1 April ' + (yStart(D.yk) + 1)) + '</span>';
    return pg(D, 'letters', '<div class="kicker">Chapter eight</div><h1 class="r">Letters</h1><p class="lede">One from the people who watched ' + esc(D.name) + ' grow. One from ' + esc(D.name) + ' to next year — sealed until Class ' + nx + ' begins.</p>'
      + letter + '<div class="k pnote">' + (C && C.text ? (D.complete ? 'Sealed in March. It opened on the first day of Class ' + nx + '.' : 'Nobody can open it — not even Mumma — until the day Class ' + nx + ' begins.') : (D.complete ? '' : 'In March, I write a letter to the me who starts Class ' + nx + '.')) + '</div>'
      + '<div class="env' + (C && C.text ? '' : ' none') + '"><div class="flap"></div><div class="seal r">' + esc(D.name.charAt(0).toUpperCase()) + '</div><div class="et">' + envTxt + '</div></div>', 9);
  }

  function clipKeep(t, n){ t = String(t || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(); if(t.length <= n) return t; var c = t.slice(0, n), sp = c.lastIndexOf(' '); return (sp > n * 0.6 ? c.slice(0, sp) : c).replace(/[,;:.\s]+$/, '') + '…'; }

  // 10 · the shelf
  function yearsWithDays(){ var Y = {}; days().forEach(function(d){ if(d && d.approved === true && num(d.pts) > 0 && d.date > '2001') Y[yearOf(d.date)] = 1; }); return Y; }
  function shelfBooks(D){
    var c = D.cls || 6, lo = Math.min(4, c), hi = Math.max(8, c), Y = yearsWithDays(), out = [];
    for(var k = lo; k <= hi; k++){
      var yk = yShift(D.yk, k - c), st;
      if(k === c) st = 'this'; else if(k < c) st = Y[yk] ? 'done' : 'ghost'; else st = 'nxt';
      out.push({ k:k, yk:yk, st:st });
    }
    return out;
  }
  function pShelf(D){
    var books = shelfBooks(D).map(function(b){
      var cap = b.st === 'this' ? yLabel(b.yk) + ' · this book' : b.st === 'done' ? yLabel(b.yk) + ' · my book' : b.st === 'ghost' ? 'before ' + esc(window.APP_NAME || 'Alchemy') : yLabel(b.yk) + ' · still to write';
      return '<div class="bk ' + b.st + '"><div class="sp"><span class="r">Class ' + b.k + '</span><b>★</b></div><div class="cap">' + cap + '</div></div>';
    }).join('');
    var n = D.cls, nx = n + 1, coming;
    if(n && n < 8) coming = '<div class="coming"><div class="nt r">Coming up in Class ' + nx + '</div><div class="ng"><span>💡 Harder Big Ideas · ' + (MIN_WORDS[nx] || 60) + ' words</span><span>🧠 New Brain Lab levels</span><span>🕉️ More shlokas to learn by heart</span><span>✉️ My sealed letter opens</span></div></div>';
    else coming = '<div class="coming"><div class="nt r">The next chapter</div><div class="ng"><span>📚 A shelf full of my books</span><span>✉️ My sealed letter opens</span></div></div>';
    var mine = shelfBooks(D).filter(function(b){ return b.st === 'done' || b.st === 'this'; }).length;
    return pg(D, 'shelf', '<div class="kicker">The road ahead</div><h1 class="r">My shelf, Class ' + Math.min(4, n || 4) + ' → ' + Math.max(8, n || 8) + '</h1><p class="lede">One book for every class. ' + (mine <= 1 ? 'This is ' + esc(poss()) + ' first.' : 'This is book number ' + mine + '.') + ' Everything built this year — words, shlokas, streaks and the Star Bank — travels on into Class ' + (nx || '') + '.</p>'
      + '<div class="shelf">' + books + '<div class="plank"></div></div>' + coming + '<div class="motto r">Small habits. Big destiny.</div>', 10);
  }

  function bookHtml(D, asParent){
    return pCover(D) + pGlance(D) + pBest(D) + pWords(D) + pGita(D) + pKind(D) + pIdeas(D) + pTreasure(D) + pLetters(D, asParent) + pShelf(D);
  }

  // ======================================================================================
  // STYLES
  // ======================================================================================
  // The page styles are written once and scoped to #my-book.
  var PAGE_CSS = ''
  + '.myp{--ink:#1E1B3A;--soft:#6B6788;--line:#E9E3F5;--plum:#4A1F86;--gold:#E2A91E;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:var(--ink);width:720px;height:1018px;position:relative;overflow:hidden;background:#FFFCF5;'
  +   'background-image:radial-gradient(circle at 20% 10%,rgba(255,236,200,.55),transparent 55%),radial-gradient(circle at 90% 95%,rgba(230,220,255,.55),transparent 50%),radial-gradient(rgba(74,31,134,.07) 1px,transparent 1.3px);background-size:auto,auto,18px 18px;padding:54px 56px 48px;transform-origin:0 0;line-height:1.35;text-align:left}'
  + '.myp *{box-sizing:border-box;margin:0;padding:0}'
  + '.myp:before{content:"";position:absolute;inset:14px;border:1.5px solid rgba(226,169,30,.45);border-radius:6px;pointer-events:none}'
  + '.myp:after{content:"";position:absolute;inset:19px;border:.8px solid rgba(226,169,30,.28);border-radius:4px;pointer-events:none}'
  + '.myp .r{font-family:"Rozha One",Georgia,serif;font-weight:400;letter-spacing:.2px}'
  + '.myp .k{font-family:Kalam,"Comic Sans MS",cursive}'
  + '.myp .dev{font-family:"Tiro Devanagari Sanskrit","Noto Serif Devanagari",serif}'
  + '.myp .run{position:absolute;top:30px;left:0;right:0;text-align:center;font-size:10.5px;letter-spacing:3px;text-transform:uppercase;color:#A08BC4;font-weight:700}'
  + '.myp .pno{position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:12px;color:#A08BC4;font-weight:700}'
  + '.myp .pno b{display:inline-block;width:26px;height:26px;line-height:26px;border-radius:50%;background:#F3ECFF;color:var(--plum)}'
  + '.myp .fill{margin-top:20px;border:2px dashed #E4DAF3;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:16px;background:repeating-linear-gradient(180deg,transparent 0 31px,rgba(124,77,204,.05) 31px 32px)}'
  + '.myp .fill .k{font-size:21px;color:#8C7AAE}.myp .fill span{font-size:12px;color:#B9AED0;font-weight:700}'
  + '.myp .fill.end{border:0;background:none}.myp .fill.end .r{font-size:44px;color:#E2A91E;opacity:.55}'
  + '.myp .sofar{position:absolute;right:34px;bottom:30px;font-size:10.5px;color:#B9AED0;font-weight:700;letter-spacing:.3px}'
  + '.myp .kicker{font-size:11.5px;letter-spacing:3px;text-transform:uppercase;font-weight:800;color:var(--gold)}'
  + '.myp h1.r{font-size:46px;line-height:1.02;margin:6px 0 4px;color:var(--plum)}'
  + '.myp .lede{font-size:15px;color:var(--soft);line-height:1.5}'
  + '.myp .foil{background:linear-gradient(100deg,#B7791F 0%,#F7D774 22%,#FFF3C4 34%,#E2A91E 50%,#F7D774 68%,#B7791F 100%);-webkit-background-clip:text;background-clip:text;color:transparent}'
  // cover
  + '.cover{background:radial-gradient(120% 80% at 50% 0%,#5B2A9B 0%,#3A1A6E 45%,#1C0B3A 100%);color:#fff;text-align:center;padding-top:70px}'
  + '.cover:before{border-color:rgba(247,215,116,.55);inset:22px;border-radius:10px}.cover:after{border-color:rgba(247,215,116,.3);inset:28px;border-radius:7px}'
  + '.cover .sky{position:absolute;inset:0;background-image:radial-gradient(1.6px 1.6px at 12% 20%,#fff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 30% 70%,#fff 50%,transparent 51%),radial-gradient(1.8px 1.8px at 62% 16%,#FFE9A8 50%,transparent 51%),radial-gradient(1.2px 1.2px at 80% 62%,#fff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 92% 12%,#fff 50%,transparent 51%),radial-gradient(1.1px 1.1px at 45% 40%,#fff 50%,transparent 51%),radial-gradient(1.4px 1.4px at 20% 85%,#FFE9A8 50%,transparent 51%),radial-gradient(1.2px 1.2px at 72% 88%,#fff 50%,transparent 51%),radial-gradient(1px 1px at 8% 52%,#fff 50%,transparent 51%),radial-gradient(1.3px 1.3px at 88% 38%,#fff 50%,transparent 51%);opacity:.8}'
  + '.cover .spine{position:absolute;left:0;top:0;bottom:0;width:34px;background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(255,255,255,.08) 60%,rgba(0,0,0,.15))}'
  + '.cover .top{position:relative;color:#F7D774;opacity:.9}'
  + '.cover .medal{position:relative;margin:118px auto 18px;width:230px;height:230px;filter:drop-shadow(0 0 30px rgba(247,215,116,.25))}'
  + '.cover .title{position:relative;font-size:128px;line-height:1;margin-top:8px}'
  + '.cover .name{position:relative;font-size:52px;color:#FFE9A8;margin-top:6px;transform:rotate(-3deg)}'
  + '.cover .cls{position:relative;display:flex;align-items:center;justify-content:center;gap:14px;margin-top:30px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;font-size:13px;color:#E7DBFF}'
  + '.cover .cls b{width:6px;height:6px;border-radius:50%;background:#F7D774}'
  + '.cover .foot{position:absolute;left:0;right:0;bottom:70px;font-size:13.5px;color:#CDBEF0;letter-spacing:.5px;line-height:1.9}'
  + '.cover .foot em{font-family:Kalam,cursive;font-style:normal;font-size:18px;color:#F7D774}'
  // glance
  + '.glance .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}'
  + '.glance .st{background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px;box-shadow:0 6px 14px rgba(74,31,134,.06)}'
  + '.glance .st .em{font-size:17px}.glance .st .v{font-size:33px;line-height:1;margin-top:4px}.glance .st .l{font-size:11.5px;color:var(--soft);font-weight:700;line-height:1.3;margin-top:5px}'
  + '.glance .cal{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 18px 14px}'
  + '.glance .calh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;gap:10px}.glance .calh>b{font-size:19px;color:var(--plum);white-space:nowrap}'
  + '.glance .calh.wide{display:block}.glance .calh.wide .key{display:block;text-align:left;margin:2px 0 -2px -9px}'
  + '.glance .calh .key{font-size:10.5px;color:var(--soft);font-weight:700;text-align:right;line-height:1.6}'
  + '.glance .mrow{display:flex;align-items:center;gap:2.5px;margin:6px 0}.glance .mrow em{font-style:normal;width:30px;font-size:10.5px;font-weight:800;color:#8C7FAE}'
  + '.glance i{display:inline-block;width:14.4px;height:14.4px;border-radius:50%;flex:0 0 auto;font-style:normal}'
  + '.glance .key i{width:10px;height:10px;margin:0 4px 0 9px;vertical-align:-1px}'
  + '.glance i.s{background:radial-gradient(circle at 35% 30%,#FFF3C4,#E2A91E 70%);box-shadow:0 0 0 1px #D99A0E inset}'
  + '.glance i.d{background:#7C4DCC}.glance i.n{background:#EEE8F7}.glance i.x{background:transparent}'
  + '.glance i.b{background:transparent;box-shadow:0 0 0 1px #E4DCF2 inset}.glance i.f{background:transparent;box-shadow:0 0 0 1.2px #D9CFEA inset;opacity:.7}'
  + '.glance .line1{margin-top:22px;text-align:center;font-size:21px;color:#5B2A9B;line-height:1.3}.glance .line1 b{font-family:"Rozha One",serif;font-weight:400;color:#B7791F;font-size:26px}'
  + '.glance .firsts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}'
  + '.glance .firsts>div{background:linear-gradient(160deg,#3A1A6E,#5B2A9B);color:#fff;border-radius:14px;padding:11px 14px;position:relative}'
  + '.glance .firsts i.s{position:absolute;right:12px;top:12px}.glance .firsts b{display:block;font-family:"Rozha One",serif;font-weight:400;font-size:22px;color:#F7D774}.glance .firsts span{font-size:11.5px;color:#D9CCF5;font-weight:700}'
  // best
  + '.best .chart{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 18px 10px;margin:22px 0 14px}'
  + '.best .ch,.best .mt{font-size:12px;font-weight:800;color:var(--soft);letter-spacing:1px;text-transform:uppercase}'
  + '.best .bars{display:flex;align-items:flex-end;gap:10px;height:205px;padding-top:12px}'
  + '.best .bars>div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px}'
  + '.best .bars>div>div{width:100%;border-radius:8px 8px 4px 4px;background:linear-gradient(180deg,#B79BEA,#7C4DCC)}'
  + '.best .bars>div.fut>div{background:transparent;border:1.5px dashed #E1D8F1}'
  + '.best .bars .best>div{background:linear-gradient(180deg,#FFE39A,#E2A91E);box-shadow:0 6px 16px rgba(226,169,30,.45)}'
  + '.best .bars span{font-size:11px;font-weight:800;color:#8C7FAE}.best .bars em{font-style:normal;font-size:11px;font-weight:800;color:#B7791F;min-height:14px}'
  + '.best .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}'
  + '.best .card{border-radius:18px;padding:16px 18px;border:1px solid var(--line);background:#fff;min-height:170px}'
  + '.best .card.gold{background:linear-gradient(160deg,#FFF6D6,#FFE7A6);border-color:#F5D27A}'
  + '.best .tag{font-size:12px;font-weight:800;color:#8A5A00;letter-spacing:.5px}.best .card.day .tag{color:var(--plum)}'
  + '.best .big{font-size:36px;line-height:1.05;margin-top:6px;color:var(--ink)}'
  + '.best .sub{font-size:12.5px;color:var(--soft);font-weight:700;margin-top:3px}'
  + '.best .quote{font-size:19px;color:#7A4B00;margin-top:12px;line-height:1.25}'
  + '.best ul{margin:10px 0 0;padding:0;list-style:none;font-size:13px;line-height:1.75}'
  + '.best .streak{display:flex;align-items:center;gap:14px;margin-top:12px;background:linear-gradient(120deg,#3A1A6E,#5B2A9B);color:#fff;border-radius:18px;padding:16px 18px}'
  + '.best .flame{font-size:34px}.best .streak .stn{font-size:28px;line-height:1}.best .streak .sub{color:#D9CCF5}'
  + '.best .dots{margin-left:auto;display:grid;grid-template-columns:repeat(12,9px);gap:4px}'
  + '.best .dots span{width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFF3C4,#F59E0B)}'
  + '.best .ms{margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px 18px 16px}'
  + '.best .ml{position:relative;display:grid;margin-top:10px;text-align:center}'
  + '.best .mline{position:absolute;left:8%;right:8%;top:19px;height:3px;background:repeating-linear-gradient(90deg,#C4B5FD 0 8px,transparent 8px 13px)}'
  + '.best .ml>div:not(.mline){position:relative}'
  + '.best .mi{display:flex;align-items:center;justify-content:center;width:40px;height:40px;margin:0 auto;border-radius:50%;background:#F5F1FF;font-size:19px;box-shadow:0 0 0 4px #fff}'
  + '.best .ml b{display:block;font-size:13px;margin-top:6px}.best .ml small{font-size:11px;color:var(--soft);font-weight:700;display:block;line-height:1.25}'
  + '.best .mnone{font-family:Kalam,cursive;font-size:17px;color:var(--soft);margin-top:8px}'
  // words
  + '.words .cloud{margin:20px 0 16px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px 20px;display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;justify-content:center;min-height:350px;max-height:400px;overflow:hidden}'
  + '.words .cloud.few{gap:10px 26px}'
  + '.words .cloud span{font-family:"Rozha One",serif;display:inline-block;line-height:1.15}'
  + '.words .cloud .more,.words .cloud .k{font-family:Kalam,cursive;font-size:17px;color:var(--soft)}'
  + '.words .cloud.empty{min-height:300px}'
  + '.words .fav{position:relative;background:#FFF7D1;border-radius:6px 6px 18px 6px;padding:22px 26px 18px;transform:rotate(-1.2deg);box-shadow:0 14px 28px rgba(120,80,0,.15);margin:0 30px}'
  + '.words .pin{position:absolute;top:-16px;left:50%;font-size:26px}'
  + '.words .ft{font-size:11.5px;letter-spacing:2.5px;text-transform:uppercase;font-weight:800;color:#A16207}'
  + '.words .fw{font-size:44px;color:#4A1F86;line-height:1.1;margin-top:4px}'
  + '.words .fm{font-size:14px;color:#6B5A2E;font-weight:700}'
  + '.words .fe{font-size:22px;color:#1E3A8A;margin-top:10px;line-height:1.3}'
  + '.words .fd{font-size:12px;color:#A16207;margin-top:8px;font-weight:700}'
  + '.words .rows{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:24px}'
  + '.words .rows>div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px}'
  + '.words .rows b{display:block;font-size:30px;color:#0284C7;line-height:1.05;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.words .rows b.lw{font-size:24px;line-height:1.3}.words .rows span{font-size:12px;color:var(--soft);font-weight:700}'
  // gita
  + '.gita{background-color:#FFF8EC}'
  + '.gita .path{position:relative;margin-top:16px}'
  + '.gita .line{position:absolute;left:50%;top:10px;bottom:10px;width:3px;margin-left:-1.5px;background:repeating-linear-gradient(180deg,#E9B949 0 8px,transparent 8px 14px)}'
  + '.gita .shk{position:relative;display:flex;align-items:center;min-height:70px}.gita .shk+.shk{margin-top:-24px}'
  + '.gita .lotus{position:absolute;left:50%;margin-left:-17px;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFE6B0,#F59E0B);color:#7A2E00;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 0 5px #FFF8EC,0 4px 10px rgba(194,65,12,.3)}'
  + '.gita .box{width:calc(50% - 30px);background:#fff;border:1px solid #F3DDB5;border-radius:14px;padding:9px 13px}'
  + '.gita .shk.rt{justify-content:flex-end}'
  + '.gita .vv{font-size:10.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#C2410C;display:flex;justify-content:space-between;gap:6px}.gita .vv span{color:#B9A27A}'
  + '.gita .sk{font-size:15.5px;color:#4A1F86;line-height:1.45;margin-top:2px}'
  + '.gita .mm{font-size:11.5px;color:var(--soft);font-weight:700;font-style:italic;line-height:1.35;margin-top:2px}'
  + '.gita .ghost .box{background:transparent;border:1.5px dashed #EBCB94;min-height:62px}.gita .ghost .lotus{background:#FFF8EC;color:#D4A55A;box-shadow:0 0 0 5px #FFF8EC;border:1.5px dashed #E9B949}'
  + '.gita .moreb b{display:block;font-size:22px;color:#C2410C}.gita .moreb span{font-size:12px;color:var(--soft);font-weight:700}'
  + '.gita .om{position:absolute;right:46px;top:52px;font-size:70px;color:rgba(194,65,12,.12)}'
  // kindness
  + '.kind .hearts{display:grid;gap:8px 4px;margin:20px 0 22px;padding:18px 20px;background:#FFF1F5;border-radius:20px;border:1px solid #FBD0DD;font-size:29px}'
  + '.kind .hearts span{line-height:1.1;text-align:center}.kind .hearts .a{color:#E11D48}.kind .hearts .b{color:#F472B6}.kind .hearts .c{color:#E2A91E}'
  + '.kind .hearts .plus{font-size:15px;font-weight:800;color:#BE185D;align-self:center}'
  + '.kind .hearts.empty{display:block;text-align:center;padding:60px 30px}.kind .hearts.empty span{font-size:22px;color:#BE185D}'
  + '.kind .notes{display:grid;grid-template-columns:1fr 1fr;gap:18px 20px;padding:0 6px}'
  + '.kind .note{background:#fff;padding:16px 16px 12px;box-shadow:0 10px 22px rgba(30,27,58,.12);border-radius:4px;border-top:14px solid #FDE68A}'
  + '.kind .note:nth-child(2){border-top-color:#BFDBFE}.kind .note:nth-child(3){border-top-color:#FBCFE8}.kind .note:nth-child(4){border-top-color:#BBF7D0}'
  + '.kind .note .t{font-size:19px;line-height:1.25;color:#1E1B3A}.kind .note .d{font-size:11.5px;color:var(--soft);font-weight:800;margin-top:6px}'
  + '.kind .km{display:flex;align-items:flex-end;gap:20px;margin-top:22px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px 18px}'
  + '.kind .kt{width:150px}.kind .kt b{display:block;font-size:40px;font-weight:400;color:#DB2777;line-height:1}.kind .kt span{font-size:12px;color:var(--soft);font-weight:700}'
  + '.kind .kb{flex:1;display:flex;align-items:flex-end;gap:8px;height:110px}.kind .kb>div{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}'
  + '.kind .kb em{display:block;width:100%;border-radius:6px 6px 3px 3px;background:linear-gradient(180deg,#F9A8D4,#DB2777)}.kind .kb span{font-size:10px;font-weight:800;color:#9CA3AF}'
  + '.kind .gold{margin-top:16px;text-align:center;font-size:13.5px;color:#8A5A00;font-weight:700;background:linear-gradient(90deg,#FFF6D6,#FFE7A6,#FFF6D6);border-radius:99px;padding:10px 16px}'
  + '.kind .gold b{font-size:18px;font-weight:400;color:#7A4B00;margin-right:6px}'
  // ideas
  + '.ideas .ideas{margin-top:18px;display:flex;flex-direction:column;gap:14px}'
  + '.ideas .idea{position:relative;background:#fff;border-radius:14px;padding:14px 18px 14px 58px;border:1px solid var(--line);background-image:linear-gradient(90deg,transparent 40px,#FBCFE8 40px,#FBCFE8 41.5px,transparent 41.5px),repeating-linear-gradient(180deg,transparent 0 29px,#E0E7FF 29px 30px);background-position:0 0,0 38px}'
  + '.ideas .q{font-size:22px;color:#15803D;line-height:1.1;padding-right:60px}.ideas .dt{position:absolute;top:16px;right:18px;font-size:11px;font-weight:800;color:#9CA3AF}'
  + '.ideas .w{font-size:18.5px;line-height:30px;color:#1E3A8A;margin-top:6px}'
  + '.ideas .chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:18px}'
  + '.ideas .chips span{font-size:12px;font-weight:700;background:#ECFDF5;color:#15803D;border:1px solid #BBF7D0;border-radius:99px;padding:5px 11px}'
  + '.ideas .istat{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:20px}.ideas .istat>div{background:#ECFDF5;border-radius:14px;padding:12px 14px}'
  + '.ideas .istat b{display:block;font-size:30px;font-weight:400;color:#15803D;line-height:1}.ideas .istat span{font-size:12px;color:#166534;font-weight:700}'
  // treasure
  + '.treasure .bank{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0 16px}'
  + '.treasure .bank>div{background:linear-gradient(160deg,#3A1A6E,#5B2A9B);color:#fff;border-radius:16px;padding:12px 14px}'
  + '.treasure .bank span{font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#D9CCF5}.treasure .bank b{display:block;font-size:32px;font-weight:400;color:#F7D774;line-height:1.1}'
  + '.treasure .tix{display:flex;flex-direction:column;gap:9px}'
  + '.treasure .tk{display:flex;align-items:center;gap:14px;background:#FFF6D6;border-radius:12px;padding:11px 16px;border:1.5px dashed #E9B949}'
  + '.treasure .tk .e{font-size:28px}.treasure .tk .tt{flex:1;min-width:0}.treasure .tk b{display:block;font-size:15.5px}.treasure .tk span{font-size:12px;color:#8A6D2E;font-weight:700}'
  + '.treasure .tk .c{font-family:"Rozha One",serif;font-size:20px;color:#B7791F;white-space:nowrap}'
  + '.treasure .tmore{font-size:12.5px;color:var(--soft);font-weight:700;text-align:center}'
  + '.treasure .goal,.treasure .brain{margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px 18px}'
  + '.treasure .gt{display:flex;align-items:center;gap:12px}.treasure .gt>span{font-size:30px}.treasure .gt b{display:block;font-size:16px}.treasure .gt em{font-style:normal;font-size:12.5px;color:var(--soft);font-weight:700}'
  + '.treasure .gb{height:12px;border-radius:99px;background:#F1ECF8;margin-top:10px;overflow:hidden}.treasure .gb div{height:100%;background:linear-gradient(90deg,#F7D774,#E2A91E)}'
  + '.treasure .bt{font-size:22px;color:#7C3AED}.treasure .bg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:6px}'
  + '.treasure .bg>div{font-size:11.5px;color:var(--soft);font-weight:700}.treasure .bg b{display:block;font-size:22px;color:var(--ink);line-height:1.2}'
  // letters
  + '.letters .letter{margin-top:26px;background:#FFFDF7;border:1px solid #EFE3C8;border-radius:6px;padding:22px 28px 18px;box-shadow:0 12px 26px rgba(80,60,20,.10);background-image:repeating-linear-gradient(180deg,transparent 0 31px,#EDE6F7 31px 32px);background-position:0 56px;max-height:470px;overflow:hidden}'
  + '.letters .letter.waiting .body{color:#7C6A9E}'
  + '.letters .lt{font-size:12px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#B7791F;margin-bottom:6px}'
  + '.letters .body{font-size:20px;line-height:32px;color:#1E3A8A}.letters .sign{text-align:right;font-size:21px;color:#9D174D;margin-top:4px}'
  + '.letters .pnote{text-align:center;font-size:19px;color:#6B21A8;margin-top:34px}'
  + '.letters .env{position:relative;margin:16px auto 0;width:520px;height:290px;background:linear-gradient(180deg,#EBDDFB,#DCC7F7);border-radius:10px;box-shadow:0 18px 34px rgba(74,31,134,.22);overflow:hidden}'
  + '.letters .env.none{opacity:.55;filter:saturate(.6)}'
  + '.letters .flap{position:absolute;left:0;right:0;top:0;height:180px;background:linear-gradient(180deg,#D2BAF5,#C3A5F0);clip-path:polygon(0 0,100% 0,50% 100%)}'
  + '.letters .seal{position:absolute;left:50%;top:146px;margin-left:-36px;width:72px;height:72px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#F87171,#B91C1C 70%);color:#FFE4E6;font-size:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(127,29,29,.4),inset 0 0 0 5px rgba(255,255,255,.12)}'
  + '.letters .et{position:absolute;left:24px;right:24px;bottom:16px;text-align:center}'
  + '.letters .et b{display:block;font-size:16px;color:#3B0764}.letters .et span{font-size:12px;color:#6B21A8;font-weight:700}'
  // shelf
  + '.shelf .shelf{position:relative;display:flex;align-items:flex-end;justify-content:center;gap:16px;margin:56px 0 0;height:330px;padding-bottom:22px}'
  + '.shelf .plank{position:absolute;left:10px;right:10px;bottom:0;height:22px;border-radius:4px;background:linear-gradient(180deg,#B7834A,#8A5A2B);box-shadow:0 10px 18px rgba(80,40,0,.25)}'
  + '.shelf .bk{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;width:104px}'
  + '.shelf .sp{width:92px;height:250px;border-radius:6px 10px 10px 6px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:18px 0;writing-mode:vertical-rl;transform:rotate(180deg)}'
  + '.shelf .sp span{font-size:24px}.shelf .sp b{font-size:18px;font-weight:400}'
  + '.shelf .cap{font-size:11px;font-weight:800;color:var(--soft);text-align:center;width:104px;line-height:1.3;position:absolute;top:100%;margin-top:30px}'
  + '.shelf .ghost .sp{background:repeating-linear-gradient(45deg,#F1ECF8 0 8px,#E9E2F5 8px 16px);color:#B9AED0;border:1.5px dashed #CFC4E3}'
  + '.shelf .this .sp{height:290px;background:linear-gradient(90deg,#2A1152,#5B2A9B 30%,#4A1F86 70%,#2A1152);color:#F7D774;box-shadow:0 18px 30px rgba(74,31,134,.4),0 0 0 2px #E2A91E inset}'
  + '.shelf .done .sp{height:270px;background:linear-gradient(90deg,#3B1A6B,#7C4DCC 40%,#5B2A9B);color:#FFE9A8}'
  + '.shelf .this .cap{color:#4A1F86}'
  + '.shelf .nxt .sp{background:#fff;border:2px dashed #C4B5FD;color:#A78BFA}'
  + '.shelf .coming{margin-top:80px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 18px}'
  + '.shelf .nt{font-size:22px;color:var(--plum)}.shelf .ng{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}'
  + '.shelf .ng span{font-size:13px;font-weight:700;background:#F5F1FF;border-radius:10px;padding:8px 10px}'
  + '.shelf .motto{text-align:center;font-size:38px;margin-top:64px;color:#B7791F}';

  function scope(css, pre){
    return css.replace(/(^|\})([^{}]+)\{/g, function(m, close, sel){
      return close + sel.split(',').map(function(s){ s = s.trim(); return s.indexOf('.myp') === 0 ? pre + ' ' + s : pre + ' .myp.' + s.replace(/^\./, ''); }).join(',') + '{';
    });
  }

  var UI_CSS = ''
  // the book overlay
  + '#my-book{position:fixed;inset:0;z-index:100000;background:#2A1F44;overflow:auto;-webkit-overflow-scrolling:touch;font-family:"Plus Jakarta Sans",system-ui,sans-serif}'
  + '#my-book .mybar{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:10px;padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top));background:rgba(28,11,58,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fff}'
  + '#my-book .mybar b{flex:1;font-family:"Rozha One",serif;font-weight:400;font-size:20px;color:#F7D774;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + '#my-book .mybar button{border:0;border-radius:99px;padding:9px 15px;font:800 13.5px "Plus Jakarta Sans",system-ui,sans-serif;cursor:pointer;white-space:nowrap}'
  + '#my-book .mybar .x{background:rgba(255,255,255,.12);color:#fff}'
  + '#my-book .mybar .pdf{background:linear-gradient(135deg,#FFE08A,#F4B400);color:#3B1A6B}'
  + '#my-book .mytip{max-width:760px;margin:10px auto 0;padding:0 14px;color:#CDBEF0;font-size:12.5px;font-weight:600;text-align:center}'
  + '#my-book .mypages{display:flex;flex-direction:column;align-items:center;gap:18px;padding:16px 12px 60px}'
  + '#my-book .myw{width:calc(720px * var(--s,1));height:calc(1018px * var(--s,1));overflow:hidden;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.35);flex:0 0 auto;background:#FFFCF5}'
  + '#my-book .myp{transform:scale(var(--s,1))}'
  + 'body.my-open{overflow:hidden}'
  // modals (letter, postcard)
  + '.my-modal{position:fixed;inset:0;z-index:100001;background:rgba(20,12,40,.62);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Plus Jakarta Sans",system-ui,sans-serif}'
  + '.my-modal .mm-box{background:#FFFCF5;border-radius:24px;width:100%;max-width:560px;max-height:calc(100vh - 32px);overflow:auto;padding:22px 22px 18px;box-shadow:0 30px 60px rgba(0,0,0,.35);color:#1E1B3A}'
  + '.my-modal h3{font-family:"Rozha One",serif;font-weight:400;font-size:28px;color:#4A1F86;margin:0 0 4px;line-height:1.1}'
  + '.my-modal p{margin:0 0 10px;color:#6B6788;font-size:14px;line-height:1.5;font-weight:600}'
  + '.my-modal textarea#my-cl-text{width:100%;min-height:240px;border:1.5px solid #E2D7F5;border-radius:14px;padding:14px 16px;font:400 19px/1.55 Kalam,"Comic Sans MS",cursive;color:#1E3A8A;background:#FFFDF7;resize:vertical;outline:none}'
  + '.my-modal textarea#my-cl-text:focus{border-color:#7C4DCC;box-shadow:0 0 0 3px #EDE5FB}'
  + '.my-modal .mm-ideas{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}.my-modal .mm-ideas span{font-size:12px;font-weight:700;background:#F5F1FF;color:#5B2A9B;border-radius:99px;padding:5px 10px}'
  + '.my-modal .mm-row{display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap}'
  + '.my-modal .mm-row .grow{flex:1;font-size:12.5px;color:#8C7FAE;font-weight:700}'
  + '.my-modal button{border:0;border-radius:99px;padding:11px 18px;font:800 14px "Plus Jakarta Sans",system-ui,sans-serif;cursor:pointer}'
  + '.my-modal .b-go{background:linear-gradient(135deg,#7C4DCC,#5B2A9B);color:#fff}.my-modal .b-go:disabled{opacity:.5;cursor:default}'
  + '.my-modal .b-gold{background:linear-gradient(135deg,#FFE08A,#F4B400);color:#3B1A6B}'
  + '.my-modal .b-no{background:#F1ECF8;color:#5B2A9B}'
  + '.my-modal .mm-letter{background:#FFFDF7;border:1px solid #EFE3C8;border-radius:10px;padding:18px 20px;font:400 20px/1.6 Kalam,cursive;color:#1E3A8A;white-space:pre-wrap;background-image:repeating-linear-gradient(180deg,transparent 0 31px,#EDE6F7 31px 32px)}'
  + '.my-modal .mm-pc{display:block;width:100%;max-width:432px;margin:6px auto 0;border-radius:14px;box-shadow:0 14px 30px rgba(28,11,58,.3)}'
  + '.my-modal .mm-nav{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px}.my-modal .mm-nav button{padding:7px 12px}'
  // the My Journey card
  + '#my-card{margin-top:18px}'
  + '#my-card .myh{position:relative;overflow:hidden;border-radius:28px;padding:26px 30px;color:#fff;background:linear-gradient(160deg,#2A1152 0%,#4A1F86 45%,#6B2E9E 80%,#8A3FA0 115%);display:grid;grid-template-columns:minmax(0,1fr);gap:22px;align-items:center}'
  + '#my-card .myh:before{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(1.6px 1.6px at 12% 20%,#fff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 30% 70%,#fff 50%,transparent 51%),radial-gradient(1.8px 1.8px at 62% 16%,#FFE9A8 50%,transparent 51%),radial-gradient(1.2px 1.2px at 80% 62%,#fff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 92% 12%,#fff 50%,transparent 51%);opacity:.6}'
  + '#my-card .myh>*{position:relative}'
  + '#my-card .kk{font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:800;color:#F7D774}'
  + '#my-card h2{font-family:"Rozha One",serif;font-weight:400;font-size:34px;margin:6px 0 6px;line-height:1.08;color:#fff}'
  + '#my-card .myh p{margin:0;color:#E7DBFF;font-size:14.5px;line-height:1.55;font-weight:600}'
  + '#my-card .my-prog{margin-top:16px;height:12px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}#my-card .my-prog div{height:100%;background:linear-gradient(90deg,#F7D774,#FFB300);border-radius:99px}'
  + '#my-card .my-pl{display:flex;justify-content:space-between;font-size:12px;color:#E7DBFF;font-weight:700;margin-top:6px;gap:10px}'
  + '#my-card .my-btns{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}'
  + '#my-card button{font-family:inherit;cursor:pointer}#my-card .lnk{border:0;background:none;color:#F7D774;font-weight:800;text-decoration:underline;padding:0;font-size:inherit}'
  + '#my-card .my-bg{border:0;padding:12px 18px;border-radius:99px;font-weight:800;font-size:14px;background:linear-gradient(135deg,#FFE08A,#F4B400);color:#3B1A6B;box-shadow:0 8px 18px rgba(244,180,0,.35)}'
  + '#my-card .my-bo{padding:11px 17px;border-radius:99px;font-weight:800;font-size:14px;border:1.5px solid rgba(255,255,255,.5);color:#fff;background:transparent}'
  + '#my-card .shelf2{position:relative;display:flex;align-items:flex-end;gap:10px;justify-content:center;height:230px;padding-bottom:16px}'
  + '#my-card .shelf2 .pk{position:absolute;left:0;right:0;bottom:0;height:16px;border-radius:4px;background:linear-gradient(180deg,#C99863,#8A5A2B)}'
  + '#my-card .b2{width:62px;height:170px;border-radius:5px 9px 9px 5px;writing-mode:vertical-rl;transform:rotate(180deg);display:flex;align-items:center;justify-content:center;font-family:"Rozha One",serif;font-size:18px;border:0;padding:0}'
  + '#my-card .b2.g{background:rgba(255,255,255,.08);border:1.5px dashed rgba(255,255,255,.35);color:rgba(255,255,255,.5);cursor:default}'
  + '#my-card .b2.t{height:206px;width:76px;background:linear-gradient(90deg,#FFF3C4,#F7D774 40%,#E2A91E);color:#3B1A6B;box-shadow:0 0 30px rgba(247,215,116,.5)}'
  + '#my-card .b2.d{height:186px;background:linear-gradient(90deg,#B79BEA,#7C4DCC);color:#fff}'
  + '#my-card .b2.n{background:rgba(255,255,255,.04);border:1.5px dashed rgba(255,255,255,.25);color:rgba(255,255,255,.4);cursor:default}'
  + '#my-card .row3{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-top:14px}'
  + '#my-card .c3{background:#fff;border-radius:22px;border:1.5px solid #ECE9F6;padding:18px 20px;box-shadow:0 10px 26px -18px rgba(91,42,155,.25)}'
  + '#my-card .c3 h3{font-family:"Rozha One",serif;font-weight:400;font-size:22px;margin:0 0 4px;color:#4A1F86}#my-card .c3 p{margin:0;color:#6B6788;font-size:13.5px;line-height:1.5;font-weight:600}'
  + '#my-card .mini{display:flex;gap:8px;margin-top:12px}#my-card .mini div{flex:1;background:#F7F3FF;border-radius:12px;padding:8px 10px;font-size:11px;color:#6B6788;font-weight:700}#my-card .mini b{display:block;font-size:20px;color:#1E1B3A;font-family:"Rozha One",serif;font-weight:400}'
  + '#my-card .wa{display:inline-flex;align-items:center;gap:8px;margin-top:12px;background:#25D366;color:#fff;font-weight:800;font-size:13px;padding:10px 15px;border-radius:99px;border:0}'
  + '#my-card .soft{display:inline-flex;align-items:center;gap:8px;margin-top:12px;background:#5B2A9B;color:#fff;font-weight:800;font-size:13px;padding:10px 15px;border-radius:99px;border:0}'
  + '#my-card .lock{display:flex;align-items:center;gap:10px;margin-top:12px;background:#FFF6D6;border-radius:12px;padding:10px 12px;font-size:12.5px;font-weight:700;color:#8A5A00}'
  + '@media (min-width:900px){#my-card .myh{grid-template-columns:1.1fr 1fr;gap:30px}#my-card h2{font-size:42px}#my-card .row3{grid-template-columns:repeat(3,minmax(0,1fr))}#my-card .b2{width:68px;height:186px}#my-card .b2.t{width:82px;height:222px}#my-card .b2.d{height:200px}#my-card .shelf2{height:250px}}'
  + '@media (max-width:899px){#my-card .myh{padding:20px 18px;border-radius:24px}#my-card .shelf2{height:190px;gap:7px}#my-card .b2{width:44px;height:136px;font-size:15px}#my-card .b2.t{width:56px;height:168px}#my-card .b2.d{height:150px}}'
  // print: only the book, A4, one page per sheet
  + '@media print{'
  +   '@page{size:A4;margin:0}'
  +   'html,body{background:#fff!important;height:auto!important;overflow:visible!important}'
  +   'body.my-open>*:not(#my-book){display:none!important}'
  +   '#my-book{position:static!important;overflow:visible!important;background:none!important;height:auto!important}'
  +   '#my-book .mybar,#my-book .mytip{display:none!important}'
  +   '#my-book .mypages{display:block!important;padding:0!important}'
  +   '#my-book .myw{width:210mm!important;height:297mm!important;margin:0!important;border-radius:0!important;box-shadow:none!important;break-after:page;page-break-after:always;overflow:hidden!important}'
  +   '#my-book .myw:last-child{break-after:auto;page-break-after:auto}'
  +   '#my-book .myp{transform:scale(1.10236)!important}'
  +   '#my-book *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}'
  + '}';

  function addStyles(){
    if(!$('my-style')){
      var st = document.createElement('style'); st.id = 'my-style'; st.textContent = scope(PAGE_CSS, '#my-book') + UI_CSS; document.head.appendChild(st);
    }
    if(!$('my-fonts')){
      var l = document.createElement('link'); l.id = 'my-fonts'; l.rel = 'stylesheet'; l.href = FONTS; document.head.appendChild(l);
    }
  }

  // ======================================================================================
  // THE BOOK — open, close, save as PDF
  // ======================================================================================
  var OPEN = { yk:null, parent:false };
  function fit(){
    var b = $('my-book'); if(!b) return;
    var w = Math.min(window.innerWidth || 720, document.documentElement.clientWidth || 720);
    b.style.setProperty('--s', String(Math.min(1, (w - 24) / PW)));
  }
  async function open(yk, asParent, page){
    addStyles();
    yk = yk || yearOf(today());
    OPEN = { yk:yk, parent:!!asParent };
    var b = $('my-book');
    if(!b){ b = document.createElement('div'); b.id = 'my-book'; b.setAttribute('data-no-dirty', '1'); document.body.appendChild(b); }
    b.innerHTML = '<div class="mybar"><button class="x" data-my="close">✕ Close</button><b>' + esc(poss()) + ' Year · ' + yLabel(yk) + '</b><button class="pdf" data-my="pdf">⬇ Save as PDF</button></div>'
      + '<div class="mypages"><div style="color:#CDBEF0;font-weight:700;padding:60px 0">Opening the book…</div></div>';
    document.body.classList.add('my-open'); fit(); b.scrollTop = 0;
    try{ await ensureData(); }catch(e){}
    if(!$('my-book') || OPEN.yk !== yk) return;
    var D = collect(yk);
    var tip = D.complete ? '' : '<div class="mytip">This book is still being written. Every day you finish adds to it — it is complete on 31 March ' + (yStart(yk) + 1) + '.</div>';
    b.querySelector('.mypages').outerHTML = tip + '<div class="mypages">' + bookHtml(D, asParent) + '</div>';
    fit();
    await fitPages(b);
    if(page){ var pw = b.querySelectorAll('.myw')[page]; if(pw) b.scrollTop = Math.max(0, pw.offsetTop - 70); }
  }
  // After the fonts arrive: shrink the word cloud until every word fits, and keep as many
  // shlokas on the Gita path as fit on the page (the rest become '…and N more').
  async function fitPages(root){
    try{ if(document.fonts && document.fonts.ready) await document.fonts.ready; }catch(e){}
    if(!root || !root.isConnected) return;
    [].forEach.call(root.querySelectorAll('.myp.words .cloud'), function(c){
      var sp = [].slice.call(c.querySelectorAll('span')).filter(function(x){ return !x.classList.contains('more') && !x.classList.contains('k'); });
      if(!sp.length) return;
      sp.forEach(function(x){ if(!x.getAttribute('data-fs')) x.setAttribute('data-fs', parseFloat(x.style.fontSize) || 20); });
      var k = 1, n = 0;
      while(c.scrollHeight > c.clientHeight + 1 && n++ < 16){ k *= 0.93; sp.forEach(function(x){ x.style.fontSize = (+x.getAttribute('data-fs') * k).toFixed(1) + 'px'; }); }
    });
    [].forEach.call(root.querySelectorAll('.myp .fill'), function(f){
      f.style.height = ''; var room = PH - 78 - f.offsetTop;
      if(room < (f.classList.contains('end') ? 70 : 130)){ f.style.display = 'none'; return; }
      f.style.display = ''; f.style.height = Math.min(room, f.classList.contains('end') ? 160 : 620) + 'px';
    });
    [].forEach.call(root.querySelectorAll('.myp.gita'), function(pg){
      var path = pg.querySelector('.path'), mb = path && path.querySelector('.shk.mb'); if(!mb) return;
      var items = [].slice.call(path.querySelectorAll('.shk:not(.mb)')), hidden = (+mb.getAttribute('data-n') || 0) - items.length;
      var more = function(){ if(hidden <= 0) return; mb.style.display = ''; mb.className = 'shk mb ' + (items.length % 2 ? 'rt' : 'lf'); mb.querySelector('b').textContent = '…and ' + hidden + ' more'; };
      more();
      while(path.offsetTop + path.offsetHeight > PH - 72 && items.length > 2){ var x = items.pop(); x.parentNode.removeChild(x); hidden++; more(); }
      var gf = pg.querySelector('.fill'); if(gf){ gf.style.height = ''; var room = PH - 78 - gf.offsetTop; if(room < 130) gf.style.display = 'none'; else gf.style.height = Math.min(room, 620) + 'px'; }
    });
  }
  function close(){
    var b = $('my-book'); if(b) b.parentNode.removeChild(b);
    document.body.classList.remove('my-open');
  }
  async function savePdf(){
    try{ if(document.fonts && document.fonts.ready) await document.fonts.ready; }catch(e){}
    if(!$('my-book') || !$('my-book').querySelector('.myw')) return;
    toastMsg('In the print window, choose “Save as PDF”.');
    setTimeout(function(){ try{ window.print(); }catch(e){ alert('Printing is not available here. Please open the app in Chrome or Safari and try again.'); } }, 350);
  }
  window.addEventListener('resize', fit);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ if(document.querySelector('.my-modal')) closeModal(); else if($('my-book')) close(); } });

  // ======================================================================================
  // MONTHLY POSTCARD (a picture, 1080 × 1350)
  // ======================================================================================
  function monthsWithDays(){
    var t = today().slice(0, 7), M = {};
    days().forEach(function(d){ if(d && d.approved === true && num(d.pts) > 0 && d.date > '2001' && d.date.slice(0, 7) < t) M[d.date.slice(0, 7)] = 1; });
    return Object.keys(M).sort();
  }
  function monthData(mk){
    var D = collect(yearOf(mk + '-01')), M = D.months.find(function(m){ return m.mk === mk; }) || { pts:0, stars:0, words:0, acts:0, n:30 };
    var sh = D.shown.filter(function(d){ return d.date.slice(0, 7) === mk; });
    var run = 0, best = 0; sh.forEach(function(d, i){ run = (i && addDays(sh[i - 1].date, 1) === d.date) ? run + 1 : 1; if(run > best) best = run; });
    var W = D.words.filter(function(w){ return w.date.slice(0, 7) === mk; });
    var wotm = W.filter(function(w){ return w.example; }).sort(function(a, b){ return b.example.length - a.example.length; })[0] || W[0] || null;
    var shl = D.shlokas.filter(function(x){ return x.date.slice(0, 7) === mk; }).pop() || null;
    var ideas = D.ideas.filter(function(x){ return x.date.slice(0, 7) === mk; });
    var acts = D.acts.filter(function(a){ return a.date.slice(0, 7) === mk; });
    var kind = acts.slice().sort(function(a, b){ return b.pts - a.pts; })[0] || null;
    var bd = sh.slice().sort(function(a, b){ return num(b.pts) - num(a.pts); })[0] || null;
    var dots = []; for(var i = 1; i <= M.n; i++){ var ds = mk + '-' + String(i).padStart(2, '0'); dots.push(ds < D.start ? 'b' : D.kind[ds] === 'st' ? 's' : D.kind[ds] ? 'd' : 'n'); }
    return { D:D, mk:mk, label:monthName(mk), year:mk.slice(0, 4), pts:M.pts, stars:M.stars, streak:best, words:W.length, wotm:wotm, shloka:shl, ideas:ideas, acts:acts.length, kind:kind, best:bd, bestStar: bd && D.kind[bd.date] === 'st', dots:dots, shown:sh.length };
  }
  function rr(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function spaced(c, s, x, y, sp){ var cx = x; for(var i = 0; i < s.length; i++){ c.fillText(s[i], cx, y); cx += c.measureText(s[i]).width + sp; } }
  function wrap(c, s, x, y, w, lh, max){
    var ws = String(s || '').split(/\s+/), line = '', n = 0;
    for(var i = 0; i < ws.length; i++){
      var test = line ? line + ' ' + ws[i] : ws[i];
      if(c.measureText(test).width > w && line){
        if(n === max - 1){ while(line && c.measureText(line + '…').width > w) line = line.slice(0, -1); c.fillText(line.replace(/[\s,.;:]+$/, '') + '…', x, y + n * lh); return n + 1; }
        c.fillText(line, x, y + n * lh); n++; line = ws[i];
      } else line = test;
    }
    if(line){ c.fillText(line, x, y + n * lh); n++; }
    return n;
  }
  async function drawPostcard(mk){
    var P = monthData(mk), S = 2, W = 540, H = 675, cv = document.createElement('canvas');
    cv.width = W * S; cv.height = H * S;
    try{ if(document.fonts){ await Promise.all(['58px "Rozha One"', '30px Kalam', '800 12px "Plus Jakarta Sans"', '700 12px "Plus Jakarta Sans"'].map(function(f){ return document.fonts.load(f); })); } }catch(e){}
    var c = cv.getContext('2d'); c.scale(S, S); c.textBaseline = 'alphabetic';
    var g = c.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 1.05); g.addColorStop(0, '#5B2A9B'); g.addColorStop(.5, '#3A1A6E'); g.addColorStop(1, '#1C0B3A');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    [[.12, .2, 1.6, '#fff'], [.3, .7, 1.2, '#fff'], [.62, .16, 1.8, '#FFE9A8'], [.8, .62, 1.2, '#fff'], [.92, .12, 1.5, '#fff'], [.45, .4, 1.1, '#fff'], [.2, .86, 1.3, '#FFE9A8'], [.88, .38, 1.2, '#fff']].forEach(function(s){ c.globalAlpha = .7; c.fillStyle = s[3]; c.beginPath(); c.arc(s[0] * W, s[1] * H, s[2], 0, Math.PI * 2); c.fill(); });
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(247,215,116,.45)'; c.lineWidth = 1.2; rr(c, 12, 12, W - 24, H - 24, 10); c.stroke();
    var X = 34;
    c.fillStyle = '#F7D774'; c.font = '800 11px "Plus Jakarta Sans",sans-serif'; spaced(c, ((window.APP_NAME || 'Alchemy') + ' · Month postcard').toUpperCase(), X, 50, 3);
    var fg = c.createLinearGradient(X, 0, X + 320, 0); fg.addColorStop(0, '#B7791F'); fg.addColorStop(.22, '#F7D774'); fg.addColorStop(.34, '#FFF3C4'); fg.addColorStop(.5, '#E2A91E'); fg.addColorStop(.68, '#F7D774'); fg.addColorStop(1, '#B7791F');
    c.fillStyle = fg; c.font = '58px "Rozha One",Georgia,serif'; c.fillText(P.label, X, 112);
    c.fillStyle = '#FFE9A8'; c.font = '30px Kalam,cursive'; c.fillText(first() + ' · Class ' + (P.D.cls || ''), X, 150);
    // six tiles
    var T = [[fmtN(P.pts), 'points earned'], [String(P.stars), P.stars === 1 ? 'Star Day ⭐' : 'Star Days ⭐'], [String(P.streak), (P.streak === 1 ? 'day' : 'days') + ' in a row 🔥'], [String(P.words), P.words === 1 ? 'new word' : 'new words'],
             P.shloka ? ['Gita ' + shlokaParts(P.shloka.s).short, 'learnt by heart'] : [String(P.ideas.length), P.ideas.length === 1 ? 'Big Idea written 💡' : 'Big Ideas written 💡'], [String(P.acts), (P.acts === 1 ? 'kind act' : 'kind acts') + ' 💛']];
    var tw = (W - 2 * X - 20) / 3, th = 66;
    T.forEach(function(t, i){
      var tx = X + (i % 3) * (tw + 10), ty = 170 + Math.floor(i / 3) * (th + 10);
      c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, tx, ty, tw, th, 16); c.fill(); c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#F7D774'; var fs = 30; c.font = fs + 'px "Rozha One",Georgia,serif'; while(c.measureText(t[0]).width > tw - 22 && fs > 16){ fs--; c.font = fs + 'px "Rozha One",Georgia,serif'; }
      c.fillText(t[0], tx + 12, ty + 36);
      c.fillStyle = '#D9CCF5'; c.font = '700 11.5px "Plus Jakarta Sans",sans-serif'; c.fillText(t[1], tx + 12, ty + 55);
    });
    // word of the month (or the month's Big Idea)
    var ny = 170 + 2 * (th + 10) + 8;
    c.save(); c.translate(X + 4, ny); c.rotate(-1 * Math.PI / 180);
    c.fillStyle = '#FFF7D1'; rr(c, 0, 0, W - 2 * X - 8, 96, 8); c.fill();
    c.fillStyle = '#A16207'; c.font = '800 10.5px "Plus Jakarta Sans",sans-serif';
    if(P.wotm){
      spaced(c, 'WORD OF THE MONTH', 18, 22, 2);
      c.fillStyle = '#4A1F86'; c.font = '30px "Rozha One",Georgia,serif'; c.fillText(clip(P.wotm.word, 22), 18, 54);
      c.fillStyle = '#1E3A8A'; c.font = '17px Kalam,cursive'; wrap(c, P.wotm.example ? '“' + P.wotm.example + '”' : P.wotm.meaning, 18, 80, W - 2 * X - 44, 20, 1);
    } else if(P.ideas.length){
      var I = P.ideas[P.ideas.length - 1]; spaced(c, 'MY BIG IDEA', 18, 22, 2);
      c.fillStyle = '#15803D'; c.font = '24px "Rozha One",Georgia,serif'; wrap(c, I.title, 18, 52, W - 2 * X - 44, 26, 1);
      c.fillStyle = '#1E3A8A'; c.font = '17px Kalam,cursive'; wrap(c, '“' + I.text + '”', 18, 80, W - 2 * X - 44, 20, 1);
    } else {
      spaced(c, 'THIS MONTH', 18, 22, 2); c.fillStyle = '#4A1F86'; c.font = '30px "Rozha One",Georgia,serif'; c.fillText('Showed up on ' + P.shown + ' ' + (P.shown === 1 ? 'day' : 'days'), 18, 58);
      c.fillStyle = '#1E3A8A'; c.font = '17px Kalam,cursive'; c.fillText('Small habits, every day.', 18, 82);
    }
    c.restore();
    // kindest moment · best day
    var by = ny + 112, bw = (W - 2 * X - 10) / 2, bh = 84;
    [[P.kind ? 'Kindest moment' : 'Kind acts', P.kind ? P.kind.title : (P.acts ? P.acts + ' kind acts this month' : 'My first kind act is coming 💛')],
     ['Best day', P.best ? WD[dObj(P.best.date).getDay()].slice(0, 3) + ' ' + dShort(P.best.date) + ' — ' + fmtN(P.best.pts) + ' points' + (P.bestStar ? ', a Star Day ⭐' : '') : 'Still to come']].forEach(function(b, i){
      var bx = X + i * (bw + 10);
      c.fillStyle = '#fff'; rr(c, bx, by, bw, bh, 14); c.fill();
      c.fillStyle = '#9D174D'; c.font = '800 10px "Plus Jakarta Sans",sans-serif'; spaced(c, b[0].toUpperCase(), bx + 12, by + 20, 1.5);
      c.fillStyle = '#1E1B3A'; c.font = '700 12.5px "Plus Jakarta Sans",sans-serif'; wrap(c, b[1], bx + 12, by + 40, bw - 24, 16, 3);
    });
    // the month, day by day
    var dy = by + bh + 26;
    c.fillStyle = '#F7D774'; c.font = '800 10.5px "Plus Jakarta Sans",sans-serif'; spaced(c, ('My ' + P.label + ', day by day').toUpperCase(), X, dy, 2);
    var gw = (W - 2 * X) * .62, cell = (gw - 15 * 5) / 16;
    P.dots.forEach(function(k, i){
      var cx = X + (i % 16) * (cell + 5) + cell / 2, cy = dy + 14 + Math.floor(i / 16) * (cell + 5) + cell / 2;
      if(k === 's'){ var sg = c.createRadialGradient(cx - cell * .15, cy - cell * .2, 0, cx, cy, cell / 2); sg.addColorStop(0, '#FFF3C4'); sg.addColorStop(.7, '#E2A91E'); c.fillStyle = sg; }
      else c.fillStyle = k === 'd' ? '#9B6FE0' : k === 'b' ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.14)';
      c.beginPath(); c.arc(cx, cy, cell / 2, 0, Math.PI * 2); c.fill();
    });
    // key, to the right of the dots
    var kx = X + gw + 18, ky = dy + 20;
    [['#E2A91E', 'Star Day'], ['#9B6FE0', 'Showed up'], ['rgba(255,255,255,.3)', 'Rest day']].forEach(function(k, i){ c.fillStyle = k[0]; c.beginPath(); c.arc(kx + 5, ky + i * 17 - 4, 5, 0, Math.PI * 2); c.fill(); c.fillStyle = '#D9CCF5'; c.font = '700 11px "Plus Jakarta Sans",sans-serif'; c.fillText(k[1], kx + 16, ky + i * 17); });
    c.fillStyle = '#BBA9E6'; c.font = '700 11.5px "Plus Jakarta Sans",sans-serif'; c.fillText('Made with ' + (window.APP_NAME || 'Alchemy'), X, H - 28);
    c.textAlign = 'right'; c.fillText(P.label + ' ' + P.year, W - X, H - 28); c.textAlign = 'left';
    return { canvas:cv, P:P };
  }

  // ======================================================================================
  // MODALS — the letter to next year's self, opening last year's letter, the postcard
  // ======================================================================================
  var MODAL = null;
  function modal(html){ closeModal(); addStyles(); var m = document.createElement('div'); m.className = 'my-modal'; m.setAttribute('data-no-dirty', '1'); m.innerHTML = '<div class="mm-box">' + html + '</div>'; m.addEventListener('click', function(e){ if(e.target === m) closeModal(); }); document.body.appendChild(m); MODAL = m; return m; }
  function closeModal(){ if(MODAL && MODAL.parentNode) MODAL.parentNode.removeChild(MODAL); MODAL = null; var o = document.querySelectorAll('.my-modal'); for(var i = 0; i < o.length; i++) o[i].parentNode.removeChild(o[i]); }
  function marchOpen(yk){ var t = today(); return t >= (yStart(yk) + 1) + '-03-01' && t <= yTo(yk); }
  function letterWrite(){
    var yk = yearOf(today()), C = KY(yk).childLetter, nx = (classFor(yk) || 0) + 1;
    if(!marchOpen(yk)) return;
    var m = modal('<h3>A letter to my Class ' + nx + ' self</h3><p>Write to the ' + esc(first()) + ' who starts Class ' + nx + ' on 1 April. It stays sealed — nobody can read it, not even Mumma — until then. You can change it until 31 March.</p>'
      + '<div class="mm-ideas"><span>What am I proud of this year?</span><span>What was hard, and how did I get through it?</span><span>What do I hope Class ' + nx + ' me will do?</span><span>A secret to remember</span></div>'
      + '<textarea id="my-cl-text" maxlength="3000" placeholder="Dear Class ' + nx + ' me,">' + esc(C && C.text || '') + '</textarea>'
      + '<div class="mm-row"><span class="grow" id="my-cl-n"></span><button class="b-no" data-my="mclose">Cancel</button><button class="b-go" data-my="cl-save">🔒 Seal my letter</button></div>');
    var ta = m.querySelector('#my-cl-text'), cnt = m.querySelector('#my-cl-n');
    var upd = function(){ var n = words(ta.value); cnt.textContent = n + (n === 1 ? ' word' : ' words'); m.querySelector('[data-my="cl-save"]').disabled = n < 3; };
    ta.addEventListener('input', upd); upd(); setTimeout(function(){ try{ ta.focus(); }catch(e){} }, 50);
  }
  async function letterSave(btn){
    var yk = yearOf(today()), ta = $('my-cl-text'); if(!ta || !marchOpen(yk)) return;
    var text = ta.value.trim(); if(words(text) < 3) return;
    btn.disabled = true; btn.textContent = 'Sealing…';
    try{ await saveKY(yk, { childLetter:{ text:text.slice(0, 3000), at:new Date().toISOString(), opens:(yStart(yk) + 1) + '-04-01' } }); closeModal(); toastMsg('🔒 Your letter is sealed until 1 April!'); refresh(); }
    catch(e){ btn.disabled = false; btn.textContent = '🔒 Seal my letter'; alert('Could not save your letter — please check the internet and try again.'); }
  }
  async function letterRead(yk){
    var C = KY(yk).childLetter; if(!C || !C.text || today() < (C.opens || (yStart(yk) + 1) + '-04-01')) return;
    modal('<h3>A letter from my Class ' + (classFor(yk) || '') + ' self</h3><p>Written on ' + esc(dLong(String(C.at || '').slice(0, 10) || yTo(yk))) + '. Sealed until today.</p><div class="mm-letter">' + esc(C.text) + '</div>'
      + '<div class="mm-row"><span class="grow"></span><button class="b-go" data-my="mclose">Close</button></div>');
    if(!C.openedAt){ try{ await saveKY(yk, { childLetter:Object.assign({}, C, { openedAt:new Date().toISOString() }) }); }catch(e){} }
  }
  var PC = { list:[], i:0, blob:null, busy:false };
  async function postcardOpen(mk){
    PC.list = monthsWithDays(); if(!PC.list.length) return;
    PC.i = mk ? Math.max(0, PC.list.indexOf(mk)) : PC.list.length - 1;
    try{ await ensureData(); }catch(e){}
    await postcardDraw();
  }
  async function postcardDraw(){
    var mk = PC.list[PC.i]; PC.blob = null;
    var canShare = !!(navigator.share && navigator.canShare);
    var m = modal('<h3>' + esc(poss()) + ' ' + esc(monthName(mk)) + '</h3><p>A postcard of the month to send to the family.</p><div id="my-pc-wrap" style="text-align:center;color:#8C7FAE;font-weight:700;padding:30px 0">Drawing the postcard…</div>'
      + (PC.list.length > 1 ? '<div class="mm-nav"><button class="b-no" data-my="pc-prev"' + (PC.i ? '' : ' disabled') + '>‹ Earlier</button><button class="b-no" data-my="pc-next"' + (PC.i < PC.list.length - 1 ? '' : ' disabled') + '>Later ›</button></div>' : '')
      + '<div class="mm-row"><span class="grow"></span><button class="b-no" data-my="mclose">Close</button>' + (canShare ? '<button class="b-go" data-my="pc-share" style="background:#25D366">Share with family</button>' : '') + '<button class="b-gold" data-my="pc-save">⬇ Save picture</button></div>');
    try{
      var r = await drawPostcard(mk);
      if(MODAL !== m) return;
      var url = r.canvas.toDataURL('image/png');
      m.querySelector('#my-pc-wrap').outerHTML = '<img class="mm-pc" alt="Postcard for ' + esc(monthName(mk)) + '" src="' + url + '">';
      r.canvas.toBlob(function(b){ PC.blob = b; }, 'image/png');
      PC.url = url;
    }catch(e){ console.error('[my year] postcard:', e); var w = m.querySelector('#my-pc-wrap'); if(w) w.textContent = 'The postcard could not be drawn just now.'; }
  }
  function pcName(){ var mk = PC.list[PC.i]; return (first() + '-' + monthName(mk) + '-' + mk.slice(0, 4)).replace(/[^A-Za-z0-9-]/g, '') + '.png'; }
  async function postcardShare(){
    if(!PC.blob) return;
    var f = new File([PC.blob], pcName(), { type:'image/png' }), mk = PC.list[PC.i];
    try{
      if(navigator.canShare && navigator.canShare({ files:[f] })){ await navigator.share({ files:[f], title:poss() + ' ' + monthName(mk), text:poss() + ' ' + monthName(mk) + ' — made with ' + (window.APP_NAME || 'Alchemy') + ' 🌟' }); return; }
    }catch(e){ if(e && e.name === 'AbortError') return; }
    postcardSave();
  }
  function postcardSave(){
    if(!PC.url) return;
    var a = document.createElement('a'); a.href = PC.url; a.download = pcName(); document.body.appendChild(a); a.click(); setTimeout(function(){ a.parentNode.removeChild(a); }, 100);
    toastMsg('🖼️ Postcard saved to your downloads.');
  }

  // ======================================================================================
  // ON MY JOURNEY — the bookshelf card
  // ======================================================================================
  function card(){
    addStyles();
    rememberClass();
    var t = today(), yk = yearOf(t), D;
    try{ D = collect(yk); }catch(e){ console.error('[my year] collect:', e); return ''; }
    if((!DATA.spend && !DATA.spendLoading) || (!CLOUD && !CLOUD_AT && !CLOUD_P)){
      Promise.all([loadSpend(), loadKeepsake()]).then(function(){ try{ if(window.niyamProgress && isProgressOpen()) window.niyamProgress.render(); }catch(e){} });
    }
    var nm = esc(D.name), nx = (D.cls || 0) + 1, end = yTo(yk), mon = +t.slice(5, 7);
    // In April, last year's book has just been finished: the card celebrates it first.
    var prev = yShift(yk, -1), PD = null;
    if(mon === 4){ try{ var pd0 = collect(prev); if(pd0.shown.length) PD = pd0; }catch(e){} }
    var shelf = shelfBooks(D).map(function(b){
      var c = b.st === 'this' ? 't' : b.st === 'done' ? 'd' : b.st === 'nxt' ? 'n' : 'g', can = b.st === 'this' || b.st === 'done';
      return '<button class="b2 ' + c + '"' + (can ? ' data-my="open" data-yk="' + b.yk + '" title="Open my Class ' + b.k + ' book"' : ' tabindex="-1" aria-hidden="true"') + '>Class ' + b.k + (b.st === 'this' ? ' ★' : '') + '</button>';
    }).join('');
    var h = '<div id="my-card"><div class="myh"><div>';
    if(PD){
      var bits = [plural(PD.shown.length, 'day', 'days')]; if(PD.words.length) bits.push(plural(PD.words.length, 'word', 'words')); if(PD.shlokas.length) bits.push(plural(PD.shlokas.length, 'shloka', 'shlokas')); if(PD.acts.length) bits.push(plural(PD.acts.length, 'kind act', 'kind acts'));
      h += '<div class="kk">My Year · Class ' + (PD.cls || '') + ' · complete</div><h2>' + nm + '’s Class ' + (PD.cls || '') + ' book is ready 🎉</h2>'
        + '<p>' + esc(bits.join(' · ')) + ' — the whole year in one book. Save it as a PDF to keep it forever.</p>'
        + '<div class="my-prog"><div style="width:100%"></div></div><div class="my-pl"><span>April ' + yStart(prev) + ' – March ' + (yStart(prev) + 1) + '</span><span>complete ★</span></div>'
        + '<div class="my-btns"><button class="my-bg" data-my="open" data-yk="' + prev + '">📖 Open my Class ' + (PD.cls || '') + ' book</button><button class="my-bo" data-my="openpdf" data-yk="' + prev + '">⬇ Save as PDF</button></div>'
        + '<p style="margin-top:14px;font-size:13px;opacity:.9">Your Class ' + (D.cls || '') + ' book has begun — every day from today goes into it. <button class="lnk" data-my="open" data-yk="' + yk + '">Peek at it</button></p></div>';
    } else {
      var span = Math.max(1, Math.round((dObj(end) - dObj(D.start)) / 864e5) + 1), gone = Math.max(0, Math.min(span, Math.round((dObj(t) - dObj(D.start)) / 864e5) + 1));
      var left = Math.max(0, Math.round((dObj(end) - dObj(t)) / 864e5));
      var head = t === end ? nm + '’s Class ' + (D.cls || '') + ' book is complete 🎉' : D.shown.length ? nm + '’s book is being written' : 'Your Class ' + (D.cls || '') + ' book begins';
      var sub = t === end ? 'Today is the last day of Class ' + (D.cls || '') + '. Open your book — there is a surprise on the last page.' : 'Every day you finish adds to it. Your book is ready to keep on <b>31 March ' + (yStart(yk) + 1) + '</b> — and you can peek at it any time.';
      h += '<div class="kk">My Year · Class ' + (D.cls || '') + '</div><h2>' + head + '</h2><p>' + sub + '</p>'
        + '<div class="my-prog"><div style="width:' + Math.round(gone / span * 100) + '%"></div></div><div class="my-pl"><span>' + plural(D.shown.length, 'day', 'days') + ' so far</span><span>' + (left ? plural(left, 'day', 'days') + ' to go' : 'the last day!') + '</span></div>'
        + '<div class="my-btns"><button class="my-bg" data-my="open" data-yk="' + yk + '">📖 Open my book</button><button class="my-bo" data-my="openpdf" data-yk="' + yk + '">⬇ Save as PDF</button></div></div>';
    }
    h += '<div class="shelf2">' + shelf + '<div class="pk"></div></div></div><div class="row3">';
    // postcard
    var ms = monthsWithDays();
    if(ms.length){
      var P = null; try{ P = monthData(ms[ms.length - 1]); }catch(e){}
      h += '<div class="c3"><h3>' + nm + '’s ' + esc(monthName(ms[ms.length - 1])) + '</h3><p>A one-page postcard of the month — a new one on the 1st of every month.</p>'
        + (P ? '<div class="mini"><div><b>' + fmtN(P.pts) + '</b>points</div><div><b>' + P.stars + '</b>Star ' + (P.stars === 1 ? 'Day' : 'Days') + '</div><div><b>' + P.words + '</b>' + (P.words === 1 ? 'word' : 'words') + '</div></div>' : '')
        + '<button class="wa" data-my="postcard">💌 Send to the family</button></div>';
    } else {
      var nm1 = new Date(); nm1.setDate(1); nm1.setMonth(nm1.getMonth() + 1);
      h += '<div class="c3"><h3>My monthly postcard</h3><p>A picture of your month to send to the family. Your first one arrives on <b>1 ' + MONTHS[nm1.getMonth()] + '</b>.</p><div class="lock">💌 Arrives on 1 ' + MONTHS[nm1.getMonth()] + '</div></div>';
    }
    // the letter to next year's self — and, in April and May, last year's letter
    var PLt = KY(prev).childLetter;
    if(PLt && PLt.text && (mon === 4 || mon === 5)){
      h += '<div class="c3"><h3>📬 A letter from my Class ' + (classFor(prev) || '') + ' self</h3><p>' + (PLt.openedAt ? 'The letter you wrote last March.' : 'You wrote it last March and sealed it. Today it opens!') + '</p><button class="soft" data-my="cl-read" data-yk="' + prev + '">' + (PLt.openedAt ? 'Read it again' : '✉️ Open my letter') + '</button></div>';
    } else {
      var CL = D.childLetter, inMarch = marchOpen(yk);
      h += '<div class="c3"><h3>Letter to my Class ' + nx + ' self</h3><p>Write it in March. It stays sealed — nobody can read it, not even Mumma — until your first day of Class ' + nx + '.</p>'
        + (inMarch ? (CL && CL.text ? '<div class="lock">🔒 Sealed · you can change it until 31 March</div><button class="soft" data-my="cl-write">✏️ Change my letter</button>' : '<button class="soft" data-my="cl-write">✏️ Write my letter</button>')
                   : '<div class="lock">🔒 Write in March · opens 1 April ' + (yStart(yk) + 1) + '</div>') + '</div>';
    }
    // the parent's letter: a surprise until 31 March, then the last page of the book
    var FL = PD ? PD.parentLetter : (t === end ? D.parentLetter : null), FY = PD ? prev : yk;
    if(FL && FL.text){
      h += '<div class="c3"><h3>💌 A letter from ' + esc(FL.sign || 'my family') + '</h3><p>It has arrived! It is the last page of your Class ' + ((PD ? PD.cls : D.cls) || '') + ' book.</p><button class="soft" data-my="open" data-yk="' + FY + '" data-page="8">✉️ Read my letter</button></div>';
    } else {
      h += '<div class="c3"><h3>A letter from my family</h3><p>In March, Mumma or Papa write a letter in the Parent Zone. It becomes the last page of your book — a surprise for 31 March.</p><div class="lock">✉️ Arrives on 31 March</div></div>';
    }
    return h + '</div></div>';
  }
  function isProgressOpen(){ var t = $('tab-graphs'); return !!(t && (t.classList.contains('active') || t.style.display === 'block')); }
  function refresh(){ try{ if(window.niyamProgress) window.niyamProgress.render(); }catch(e){} try{ if(window.niyamParentZone && $('pz2')) window.niyamParentZone.render(); }catch(e){} }

  // ======================================================================================
  // IN THE PARENT ZONE — the parent's letter (Progress page)
  // ======================================================================================
  var PL = { draft:null, sign:null, busy:false, yk:null };
  function parentCard(){
    addStyles();
    var yk = yearOf(today()), L = KY(yk).parentLetter || {}, nm = esc(first()), cls = classFor(yk);
    if(PL.yk !== yk){ PL = { draft:null, sign:null, busy:false, yk:yk }; }
    if(!CLOUD && !CLOUD_AT && !CLOUD_P) loadKeepsake().then(function(){
      var ta = $('my-pl-text'); if(!ta || PL.draft !== null || PL.sign !== null || document.activeElement === ta) return;
      var L2 = KY(yk).parentLetter; if((L2 && L2.text || '') !== (L.text || '')) refresh();
    });
    var text = PL.draft !== null ? PL.draft : (L.text || ''), sign = PL.sign !== null ? PL.sign : (L.sign || 'Mumma & Papa');
    var saved = L.text ? 'Saved on ' + dShort(String(L.at || '').slice(0, 10) || today()) + '. ' : '';
    return '<div class="card" id="my-pl"><div class="ch"><h2>' + nm + '’s My Year book</h2><button class="btn sm" data-my="open" data-yk="' + yk + '" data-parent="1">📖 Preview the book</button></div>'
      + '<div style="color:var(--ink2);font-size:13.5px;line-height:1.55;margin:6px 0 10px">Write a letter to ' + nm + ' for the last page of the Class ' + (cls || '') + ' book. ' + nm + ' sees it on <b>31 March ' + (yStart(yk) + 1) + '</b> — until then it stays a surprise. March is the best time to write it, but you can start any time.</div>'
      + '<textarea id="my-pl-text" data-no-dirty="1" maxlength="2500" rows="7" placeholder="Dear ' + nm + ',&#10;This year we watched you…" style="width:100%;font:400 17px/1.55 Kalam,cursive;color:#1E3A8A;border-radius:12px;padding:12px 14px;min-height:150px">' + esc(text) + '</textarea>'
      + '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px"><label style="font-size:12.5px;font-weight:700;color:var(--mute)">Signed</label><input id="my-pl-sign" data-no-dirty="1" type="text" maxlength="40" value="' + esc(sign) + '" style="max-width:220px">'
      + '<span style="flex:1;font-size:12.5px;color:var(--mute)">' + esc(saved) + '</span><button class="btn dark" data-my="pl-save"' + (PL.busy ? ' disabled' : '') + '>' + (L.text ? 'Save changes' : 'Save the letter') + '</button></div></div>';
  }
  async function parentSave(){
    var ta = $('my-pl-text'), sg = $('my-pl-sign'); if(!ta) return;
    var text = ta.value.trim(), sign = (sg && sg.value.trim()) || 'Mumma & Papa', yk = yearOf(today());
    PL.busy = true;
    try{ await saveKY(yk, { parentLetter: text ? { text:text.slice(0, 2500), sign:sign.slice(0, 40), at:new Date().toISOString() } : null }); PL.draft = null; PL.sign = null; toastMsg(text ? '✉️ Your letter is saved — a surprise for 31 March.' : 'Letter removed.'); }
    catch(e){ alert('Could not save the letter — please check the internet and try again.'); }
    PL.busy = false; refresh();
  }

  // ======================================================================================
  // clicks
  // ======================================================================================
  document.addEventListener('input', function(e){
    var t = e.target; if(!t) return;
    if(t.id === 'my-pl-text') PL.draft = t.value;
    if(t.id === 'my-pl-sign') PL.sign = t.value;
  }, true);
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-my]'); if(!b || b.disabled) return;
    var a = b.getAttribute('data-my'), yk = b.getAttribute('data-yk');
    e.preventDefault();
    if(a === 'open') open(yk, b.getAttribute('data-parent') === '1', num(b.getAttribute('data-page')));
    else if(a === 'openpdf') open(yk).then(savePdf);
    else if(a === 'close') close();
    else if(a === 'pdf') savePdf();
    else if(a === 'mclose') closeModal();
    else if(a === 'cl-write') letterWrite();
    else if(a === 'cl-save') letterSave(b);
    else if(a === 'cl-read') letterRead(yk);
    else if(a === 'postcard') postcardOpen();
    else if(a === 'pc-prev'){ if(PC.i > 0){ PC.i--; postcardDraw(); } }
    else if(a === 'pc-next'){ if(PC.i < PC.list.length - 1){ PC.i++; postcardDraw(); } }
    else if(a === 'pc-share') postcardShare();
    else if(a === 'pc-save') postcardSave();
    else if(a === 'pl-save') parentSave();
  });

  window.niyamMyYear = { card:card, parentCard:parentCard, open:open, close:close, collect:collect, postcard:drawPostcard, yearOf:yearOf, months:monthsWithDays, _css:function(){ return scope(PAGE_CSS, '#my-book') + UI_CSS; } };
})();
