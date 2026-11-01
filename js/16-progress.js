// ============================================================================
// NIYAM — js/16-progress.js
// The child's Progress page, "My Journey" (30 Oct 2026). Loads LAST.
//
// Every day is measured against the child's OWN full day (what their own
// timetable can give that day), never against fixed numbers — the old page
// asked for 200–490 points a day, which a Class 4 day (165) can never reach.
//   Star Day  = 90% or more of a full day    ⭐
//   Great Day = 70% or more                  🌈
//   Good Day  = 50% or more                  👍
//
//   • the week as 7 suns, the streak, points this week, Star Days, a note
//   • the medal shelf (this month) and personal bests
//   • a sticker calendar (‹ › months)
//   • the habit garden: each part of the day is a plant, last 14 days
//   • collections: Brain Lab leaves, dictionary words, shlokas, kind acts
//   • points, day by day (30 days)
// The old page (js/03-brainlab.js renderGraphs) stays in the page, hidden.
// ============================================================================
(function(){
  'use strict';

  var PG = { month:null };
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var WD = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var LEAF_STEPS = [[10,'its first branch'],[50,'a butterfly'],[100,'its first aerial root'],[150,'a parrot'],[250,'a swing'],[400,'red banyan figs'],[600,'a squirrel family'],[800,'a second aerial root'],[1000,'a bench'],[1500,'a nest'],[2000,'fireflies'],[3000,'a whole courtyard of branches'],[4000,'the Great Banyan']];
  var WORD_RANKS = [[0,'Word Collector'],[50,'Word Explorer'],[150,'Wordsmith'],[300,'Lexicon Keeper'],[600,'Master of Words']];
  var KIND_STEPS = [[10,'Kind Friend'],[25,'Kind Heart'],[50,'Golden Heart'],[100,'Heart of Gold']];

  // ---- helpers --------------------------------------------------------------------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function num(v){ var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function fmtN(n){ return (+n || 0).toLocaleString('en-IN'); }
  function today(){ return new Date().toLocaleDateString('en-CA'); }
  function addDays(d, n){ var x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toLocaleDateString('en-CA'); }
  function dObj(d){ return new Date(d + 'T12:00:00'); }
  function days(){ return (typeof savedDays !== 'undefined' && Array.isArray(savedDays)) ? savedDays : []; }
  function rec(date){ return days().find(function(d){ return d && d.date === date; }); }
  function parse(s){ try{ var v = typeof s === 'string' ? JSON.parse(s) : s; return (v && typeof v === 'object') ? v : {}; }catch(e){ return {}; } }
  function first(){ return String(window.niyamChildName || '').split(' ')[0] || 'Superstar'; }
  function plural(n, a, b){ return n + ' ' + (n === 1 ? a : b); }
  function shortDay(d){ var x = dObj(d); return WD[x.getDay()] + ' ' + x.getDate() + ' ' + MONTHS[x.getMonth()].slice(0, 3); }
  // The day the child joined (js/00-shell.js), or the first saved day for older families.
  function joined(){
    var j = window.niyamJoinDate || '', e = days().map(function(d){ return d && d.date; }).filter(Boolean).sort()[0] || '';
    if(!j) return e || today(); return (e && e < j) ? e : j;
  }
  function dayNo(date){ return Math.round((dObj(date) - dObj(joined())) / 86400000) + 1; }
  function weekend(date){ var g = dObj(date).getDay(); return g === 0 || g === 6; }

  // ---- the child's own full day -------------------------------------------------------
  function list(isWeekend){
    var C = window.TT_CUSTOM || {}, L;
    if(isWeekend) L = (C.weekend && C.weekend.length) ? C.weekend : (typeof TT_WEEKEND !== 'undefined' ? TT_WEEKEND : []);
    else L = (C.weekday && C.weekday.length) ? C.weekday : (typeof TT_WEEKDAY !== 'undefined' ? TT_WEEKDAY : []);
    try{ if(window.niyamFilterSchedule) L = window.niyamFilterSchedule(L, window.niyamFeatures || {}); }catch(e){}
    return L || [];
  }
  var maxCache = {};
  function fullDay(isWeekend){
    var k = isWeekend ? 'we' : 'wd'; if(maxCache[k]) return maxCache[k];
    var L = list(isWeekend), games = {}, sets = (typeof TT_WORD_SETS === 'number') ? TT_WORD_SETS : 3, m = 0;
    try{ if(typeof ttBrainTasks === 'function') games = ttBrainTasks(L) || {}; }catch(e){}
    L.forEach(function(b){
      if(b.type === 'break' || b.type === 'locked-until-3pm') return;
      (b.activities || []).forEach(function(a){
        var t = a.type || 'self';
        if(t === 'link'){ if(games[a.id]) m += num(games[a.id].max); }
        else if(t === 'pct-calc' || t === 'parent-select') m += num(a.maxCalcPts);
        else if(t === 'wordbook') m += num(a.pts) * sets;
        else if(t === 'dropdown') m += Math.max.apply(null, (a.options && a.options.length) ? a.options : [10]);
        else m += num(a.pts);
      });
    });
    maxCache[k] = Math.max(1, m);
    return maxCache[k];
  }
  function dayMax(date){ return fullDay(weekend(date)); }
  // 'st' Star · 'gr' Great · 'go' Good · 'sm' a start · '' nothing
  function kindOf(d){
    if(!d) return ''; var p = num(d.pts); if(p <= 0) return '';
    var r = p / dayMax(d.date);
    return r >= 0.9 ? 'st' : r >= 0.7 ? 'gr' : r >= 0.5 ? 'go' : 'sm';
  }
  var STICK = { st:'⭐', gr:'🌈', go:'👍', sm:'🌱', w:'⏳' };

  // ---- streaks --------------------------------------------------------------------------
  function approvedDates(){ return days().filter(function(d){ return d && d.approved === true && num(d.pts) > 0; }).map(function(d){ return d.date; }).sort(); }
  function longestStreak(){
    var ds = approvedDates(), best = 0, run = 0, from = '', to = '', bFrom = '', bTo = '';
    ds.forEach(function(d, i){
      if(i && addDays(ds[i - 1], 1) === d) run++; else { run = 1; from = d; }
      to = d; if(run > best){ best = run; bFrom = from; bTo = to; }
    });
    return { n:best, from:bFrom, to:bTo };
  }
  function streakNow(){ try{ return getStreak(); }catch(e){ return 0; } }

  // ---- styles -------------------------------------------------------------------------------
  var CSS = ''
  + '#tab-graphs.pg-on>*:not(#pg-root){display:none!important}'
  + '#pg-root{font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#1E1B3A;box-sizing:border-box}'
  + '#pg-root *{box-sizing:border-box}'
  + '#pg-root button{font-family:inherit;cursor:pointer}'
  + '#pg-root .r{font-family:"Rozha One",Georgia,serif;font-weight:400}'
  + '#pg-root .k{font-family:Kalam,"Comic Sans MS",cursive}'
  + '#pg-root .hero{position:relative;overflow:hidden;border-radius:28px;padding:26px 30px;color:#fff;background:linear-gradient(160deg,#3B1A6B 0%,#5B2A9B 40%,#8A3FA0 75%,#C2563A 115%)}'
  + '#pg-root .hero .pgstars{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(1.6px 1.6px at 12% 20%,#fff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 30% 70%,#fff 50%,transparent 51%),radial-gradient(1.8px 1.8px at 62% 16%,#FFE9A8 50%,transparent 51%),radial-gradient(1.2px 1.2px at 80% 62%,#fff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 92% 12%,#fff 50%,transparent 51%);opacity:.7}'
  + '#pg-root .hero>*{position:relative}'
  + '#pg-root .hgrid{display:grid;grid-template-columns:minmax(0,1fr);gap:22px;align-items:center}'
  + '#pg-root .eyebrow{font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;opacity:.85}'
  + '#pg-root .hero h1{font-size:30px;line-height:1.1;margin:8px 0 0;color:#fff}'
  + '#pg-root .hero h1 em{font-style:normal;color:#FFD36B}'
  + '#pg-root .hero p{margin:10px 0 0;font-weight:600;font-size:14.5px;opacity:.92}'
  + '#pg-root .suns{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}'
  + '#pg-root .sun{text-align:center;font-size:12px;font-weight:800;width:52px}'
  + '#pg-root .sun .o{width:46px;height:46px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:19px;border:2px solid rgba(255,255,255,.28);position:relative}'
  + '#pg-root .sun .o.f{background:radial-gradient(circle at 40% 35%,#FFF3C4,#FFC83D 55%,#F59E0B);border-color:#FFE08A;box-shadow:0 0 22px rgba(255,200,61,.65)}'
  + '#pg-root .sun .o.h{background:radial-gradient(circle at 40% 35%,#FFF3C4,#FFD36B 60%,rgba(255,211,107,.3));border-color:#FFE08A}'
  + '#pg-root .sun .o.q{background:rgba(255,211,107,.28)}'
  + '#pg-root .sun .o.t{border:2.5px dashed #fff}'
  + '#pg-root .sun .o b{position:absolute;right:-7px;top:-7px;font-size:15px}'
  + '#pg-root .orbs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}'
  + '#pg-root .orb{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:22px;padding:14px 10px;text-align:center}'
  + '#pg-root .orb .i{font-size:24px}'
  + '#pg-root .orb b{display:block;font-family:"Rozha One",serif;font-weight:400;font-size:30px;line-height:1.1;margin-top:4px}'
  + '#pg-root .orb span{font-size:12px;font-weight:700;opacity:.9}'
  + '#pg-root .orb small{display:block;font-size:11.5px;font-weight:700;color:#FFD36B;margin-top:4px}'
  + '#pg-root .note{margin-top:14px;background:rgba(255,255,255,.14);border-radius:16px;padding:12px 16px;font-size:16px}'
  + '#pg-root .grid{display:grid;gap:18px;margin-top:18px}'
  + '#pg-root .two{grid-template-columns:minmax(0,1fr)}'
  + '#pg-root .card{background:#fff;border:1.5px solid #ECE9F6;border-radius:24px;padding:20px 22px;box-shadow:0 10px 30px -18px rgba(91,42,155,.25)}'
  + '#pg-root .card h2{margin:0;font-size:24px;color:#5B2A9B}'
  + '#pg-root .sub{color:#6B6788;font-weight:600;font-size:13.5px;margin-top:2px}'
  + '#pg-root .medals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}'
  + '#pg-root .md{text-align:center;border-radius:20px;padding:20px 8px 14px;background:var(--bg);border:1.5px solid var(--bd)}'
  + '#pg-root .md .m{width:68px;height:68px;margin:0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--c);box-shadow:inset 0 -6px 0 rgba(0,0,0,.12),0 8px 18px -6px var(--sh);position:relative;z-index:1}'
  + '#pg-root .md .m:before,#pg-root .md .m:after{content:"";position:absolute;top:-14px;width:15px;height:24px;background:var(--rb);z-index:-1}'
  + '#pg-root .md .m:before{left:16px;transform:skewX(14deg)}#pg-root .md .m:after{right:16px;transform:skewX(-14deg)}'
  + '#pg-root .md b{display:block;font-family:"Rozha One",serif;font-weight:400;font-size:32px;line-height:1;margin-top:10px}'
  + '#pg-root .md .n{font-weight:800;font-size:14.5px}'
  + '#pg-root .md .d{font-size:12px;color:#6B6788;font-weight:600;margin-top:2px}'
  + '#pg-root .next{margin-top:14px;display:flex;align-items:center;gap:12px;background:#FFF8E7;border:1.5px dashed #F5C04A;border-radius:16px;padding:12px 14px;font-weight:700;font-size:14px}'
  + '#pg-root .pgb{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px dashed #ECE9F6;font-size:13px;color:#6B6788;font-weight:600}'
  + '#pg-root .pgb span{width:40px;height:40px;border-radius:12px;background:#F5F1FF;display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto}'
  + '#pg-root .pgb b{display:block;color:#1E1B3A;font-size:15.5px;font-weight:800}'
  + '#pg-root .cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px;margin-top:14px}'
  + '#pg-root .cal .h{text-align:center;font-size:11px;font-weight:800;letter-spacing:.1em;color:#9C97B8;text-transform:uppercase}'
  + '#pg-root .cal .c{aspect-ratio:1/1;border-radius:14px;background:#F7F5FC;border:1.5px solid #EFEBF8;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#9C97B8;min-width:0}'
  + '#pg-root .cal .c .s{font-size:22px;line-height:1}'
  + '#pg-root .cal .c.st{background:#FFF6D6;border-color:#FCD34D;color:#92400E}'
  + '#pg-root .cal .c.gr{background:#F1ECFF;border-color:#D4C6FB;color:#5B2A9B}'
  + '#pg-root .cal .c.go{background:#EAF4FF;border-color:#B8D8FB;color:#1D4ED8}'
  + '#pg-root .cal .c.sm{background:#EFFAF2;border-color:#CBEBD5;color:#15803D}'
  + '#pg-root .cal .c.w{background:#fff;border:1.5px dashed #F5C04A;color:#B45309}'
  + '#pg-root .cal .c.t{box-shadow:0 0 0 2.5px #5B2A9B}'
  + '#pg-root .cal .c.e{background:transparent;border:0}'
  + '#pg-root .cal .c.j{background:linear-gradient(160deg,#FFF3C4,#FDE7F3);border-color:#F5C04A;color:#B45309}'
  + '#pg-root .sun.pre{opacity:.35}#pg-root .sun.pre .o{border-style:dotted}'
  + '#pg-root .mnav{display:flex;align-items:center;gap:6px}'
  + '#pg-root .mnav button{width:34px;height:34px;border-radius:11px;border:1.5px solid #ECE9F6;background:#fff;font-size:16px;font-weight:800;color:#5B2A9B}'
  + '#pg-root .mnav button:disabled{opacity:.35;cursor:default}'
  + '#pg-root .legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:12px;font-size:12.5px;font-weight:700;color:#6B6788}'
  + '#pg-root .garden{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}'
  + '#pg-root .pl{border-radius:20px;padding:14px 8px 12px;text-align:center;background:linear-gradient(180deg,#F2FBF4,#fff 70%);border:1.5px solid #DDF2E3;position:relative;min-width:0}'
  + '#pg-root .pl .p{font-size:38px;line-height:1;height:50px;display:flex;align-items:flex-end;justify-content:center}'
  + '#pg-root .pl .soil{height:10px;border-radius:0 0 40px 40px;background:#C8A27A;margin:2px auto 8px;width:58px}'
  + '#pg-root .pl b{display:block;font-size:13.5px;line-height:1.2}'
  + '#pg-root .pl span{font-size:11.5px;color:#6B6788;font-weight:700}'
  + '#pg-root .pl .dots{display:flex;gap:3px;justify-content:center;margin-top:6px;flex-wrap:wrap}'
  + '#pg-root .pl .dots i{width:7px;height:7px;border-radius:50%;background:#E4E0F2}'
  + '#pg-root .pl .dots i.on{background:#16A34A}'
  + '#pg-root .pl.wilt{background:linear-gradient(180deg,#FFF6EC,#fff 70%);border-color:#F6DCC3}'
  + '#pg-root .pl .tag{position:absolute;top:8px;right:8px;font-size:10.5px;font-weight:800;border-radius:99px;padding:2px 7px;background:#FFEDD5;color:#C2410C}'
  + '#pg-root .coll{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}'
  + '#pg-root .co{border-radius:20px;padding:16px;border:1.5px solid #ECE9F6;background:#fff;display:flex;gap:12px;align-items:center;min-width:0}'
  + '#pg-root .ring{width:64px;height:64px;border-radius:50%;flex:0 0 auto;display:flex;align-items:center;justify-content:center}'
  + '#pg-root .ring div{width:50px;height:50px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:23px}'
  + '#pg-root .co b{display:block;font-family:"Rozha One",serif;font-weight:400;font-size:27px;line-height:1}'
  + '#pg-root .co .l{font-weight:800;font-size:13.5px}'
  + '#pg-root .co .n{font-size:11.5px;color:#6B6788;font-weight:700;margin-top:2px}'
  + '#pg-root .empty{text-align:center;color:#6B6788;font-weight:600;padding:18px 8px}'
  + '@media (min-width:900px){'
  +   '#pg-root .hgrid{grid-template-columns:1.25fr 1fr;gap:26px}'
  +   '#pg-root .hero h1{font-size:38px}'
  +   '#pg-root .sun{width:56px}#pg-root .sun .o{width:52px;height:52px;font-size:20px}'
  +   '#pg-root .two{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}'
  + '}'
  + '@media (max-width:899px){'
  +   '#pg-root .hero{padding:20px 18px}'
  +   '#pg-root .garden{grid-template-columns:repeat(2,minmax(0,1fr))}'
  +   '#pg-root .coll{grid-template-columns:minmax(0,1fr)}'
  +   '#pg-root .card{padding:16px}'
  +   '#pg-root .md .d{display:none}'
  +   '#pg-root .sun{width:38px}#pg-root .sun .o{width:36px;height:36px;font-size:15px}#pg-root .suns{gap:6px}'
  + '}';

  function addStyles(){
    if($('pg-style')) return;
    var st = document.createElement('style'); st.id = 'pg-style'; st.textContent = CSS; document.head.appendChild(st);
    if(!document.querySelector('link[data-td-font]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-td-font', '1');
      l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Rozha+One&family=Kalam:wght@400;700&display=swap';
      document.head.appendChild(l);
    }
  }

  // ---- 1. the week ------------------------------------------------------------------------------
  function heroHtml(){
    var t = today(), x = dObj(t), mon = addDays(t, -((x.getDay() + 6) % 7));
    var suns = '', shown = 0, counted = 0, ptsWeek = 0, ptsLast = 0, starsWeek = 0, J = joined(), dn = dayNo(t);
    for(var i = 0; i < 7; i++){
      var dt = addDays(mon, i), r = rec(dt), k = kindOf(r), isT = dt === t, future = dt > t, before = dt < J;
      var cls = k === 'st' || k === 'gr' ? 'f' : k === 'go' ? 'h' : k === 'sm' ? 'q' : '';
      if(isT && !cls) cls = 't';
      if(before && !r){ suns += '<div class="sun pre"><div class="o"></div>' + WD[(i + 1) % 7].slice(0, 3) + '</div>'; continue; }   // before joining: not counted
      if(dt === J && !cls) cls = 't';
      var ic = cls === 'f' ? '☀️' : cls === 'h' ? '🌤️' : cls === 'q' ? '⛅' : '';
      suns += '<div class="sun"><div class="o ' + cls + '">' + ic + (k === 'st' ? '<b>⭐</b>' : '') + '</div>' + WD[(i + 1) % 7].slice(0, 3) + '</div>';
      if(!future && !(isT && !r)) counted++;
      if(r && num(r.pts) > 0 && !future){ shown++; ptsWeek += num(r.pts); }
      if(k === 'st') starsWeek++;
      var lw = rec(addDays(dt, -7)); if(!future && !(isT && !r) && lw && addDays(dt, -7) >= J) ptsLast += num(lw.pts);
    }
    var nm = esc(first()), title, line, eyebrow = 'My Journey · this week', newWeek = J > mon;
    if(dn <= 1){ eyebrow = 'My Journey · Day 1'; title = 'Welcome to NIYAM, <em>' + nm + '</em>! 🎉'; line = 'Today your journey begins. Every task you tick lights up today’s sun — let’s make it glow! ☀️'; }
    else if(!counted){ title = 'A new week begins, ' + nm + '!'; line = 'Every sun you light up is a day you worked on your habits.'; }
    else if(newWeek){ eyebrow = 'My Journey · Day ' + dn; title = 'You showed up on <em>' + shown + ' of ' + counted + '</em> ' + (counted === 1 ? 'day' : 'days') + ' since you joined, ' + nm + '!'; line = 'What a start! Every sun is a day you worked on your habits.'; }
    else { title = 'You showed up on <em>' + shown + ' of ' + counted + '</em> ' + (counted === 1 ? 'day' : 'days') + ' this week, ' + nm + '!'; line = 'Every sun is a day you worked on your habits. A full, glowing sun is a great day.'; }
    var st = streakNow(), best = longestStreak().n, diff = ptsWeek - ptsLast;
    var stNote = dn <= 1 ? 'Your first streak starts today' : best > st ? 'Best ever: ' + best : (st ? 'Your best ever!' : 'Start today!');
    var ptNote = dn <= 1 ? (ptsWeek ? 'Your very first points!' : 'Tick a task to earn points') : (ptsLast ? (diff >= 0 ? '▲ ' + fmtN(diff) + ' more than last week' : 'Last week: ' + fmtN(ptsLast)) : 'Keep going!');
    var orbs = '<div class="orbs"><div class="orb"><div class="i">🔥</div><b>' + st + '</b><span>' + (st === 1 ? 'day' : 'days') + ' in a row</span><small>' + stNote + '</small></div>'
      + '<div class="orb"><div class="i">⭐</div><b>' + fmtN(ptsWeek) + '</b><span>points ' + (newWeek ? 'since you joined' : 'this week') + '</span><small>' + ptNote + '</small></div>'
      + '<div class="orb"><div class="i">🏅</div><b>' + starsWeek + '</b><span>Star ' + (starsWeek === 1 ? 'Day' : 'Days') + ' this week</span><small>' + (starsWeek ? 'Shining bright!' : 'Almost all tasks = a Star Day') + '</small></div></div>';
    // the best day of this month, as a note
    var mk = t.slice(0, 7), bestD = null;
    days().forEach(function(d){ if(d && d.approved === true && d.date.slice(0, 7) === mk && (!bestD || num(d.pts) > num(bestD.pts))) bestD = d; });
    var note = dn <= 1 ? '“Welcome aboard! Tonight your parent checks your day, and your points go into your Star Bank. Then your first sticker appears!” 🌱'
      : bestD && num(bestD.pts) > 0 && bestD.date !== t
      ? '“' + WD[dObj(bestD.date).getDay()] + ' ' + dObj(bestD.date).getDate() + ' was your best day this month — ' + fmtN(bestD.pts) + ' points. You can do it again!” 🌟'
      : '“Small habits, every day. That is how big things grow.” 🌱';
    return '<div class="hero"><div class="pgstars"></div><div class="hgrid"><div><div class="eyebrow">' + eyebrow + '</div><h1 class="r">' + title + '</h1><p>' + line + '</p><div class="suns">' + suns + '</div></div>'
      + '<div>' + orbs + '<div class="note k">' + note + '</div></div></div></div>';
  }

  // ---- 2. medals and personal bests ------------------------------------------------------------------
  function medalsHtml(){
    var mk = today().slice(0, 7), c = { st:0, gr:0, go:0 };
    days().forEach(function(d){ if(d && d.approved === true && d.date.slice(0, 7) === mk){ var k = kindOf(d); if(c[k] !== undefined) c[k]++; } });
    var full = fullDay(false);
    var md = function(k, n, name, desc, bg, bd, cc, rb, sh, ic){
      return '<div class="md" style="--bg:' + bg + ';--bd:' + bd + ';--c:' + cc + ';--rb:' + rb + ';--sh:' + sh + '"><div class="m">' + ic + '</div><b>' + n + '</b><div class="n">' + name + '</div><div class="d">' + desc + '</div></div>';
    };
    var goal = 7, left = Math.max(0, goal - c.st);
    var tt0 = today(), endM = new Date(+tt0.slice(0, 4), +tt0.slice(5, 7), 0).getDate(), daysLeft = endM - (+tt0.slice(8)) + 1;
    var next = (left && left > daysLeft) ? (c.st ? 'Lovely! Keep going for more Star Days next month — 7 in a month earns the <b>Shining Month</b> badge.' : 'Aim for your first <b>Star Day</b> ⭐ — tick almost every task in one day.')
      : left ? left + ' more Star ' + (left === 1 ? 'Day' : 'Days') + ' this month and you earn the <b>Shining Month</b> badge.' : 'You earned the <b>Shining Month</b> badge this month! 🏅';
    var J = joined(), since = J.slice(0, 7) === mk ? 'Since you joined on ' + dObj(J).getDate() + ' ' + MONTHS[dObj(J).getMonth()].slice(0, 3) + '.' : MONTHS[+mk.slice(5) - 1] + '.';
    var h = '<div class="card"><h2 class="r">My medal shelf</h2><div class="sub">' + since + ' Every day is measured against <b>your own</b> full day — ' + fmtN(full) + ' points on a school day.</div><div class="medals">'
      + md('st', c.st, 'Star ' + (c.st === 1 ? 'Day' : 'Days'), 'almost everything done', '#FFF8E1', '#FCE7A8', 'radial-gradient(circle at 35% 30%,#FFF3C4,#FFC83D 55%,#E09B00)', '#5B2A9B', 'rgba(224,155,0,.6)', '⭐')
      + md('gr', c.gr, 'Great ' + (c.gr === 1 ? 'Day' : 'Days'), 'three-quarters done', '#F4F6FA', '#DDE3EC', 'radial-gradient(circle at 35% 30%,#FFFFFF,#CBD5E1 55%,#94A3B8)', '#0EA5E9', 'rgba(100,116,139,.5)', '🌈')
      + md('go', c.go, 'Good ' + (c.go === 1 ? 'Day' : 'Days'), 'half the day done', '#FDF2EA', '#F6D7BF', 'radial-gradient(circle at 35% 30%,#FFE3C8,#F2A66A 55%,#C2703A)', '#16A34A', 'rgba(194,112,58,.5)', '👍')
      + '</div><div class="next"><span style="font-size:24px">🎯</span><span>' + next + '</span></div>';
    // personal bests
    var best = null; days().forEach(function(d){ if(d && d.approved === true && (!best || num(d.pts) > num(best.pts))) best = d; });
    var ls = longestStreak(), wk = wordsBestWeek(), four = days().filter(function(d){ return d && num(d.savedWorksheetPts) > 0; }).length;
    var pbs = [];
    if(best && num(best.pts) > 0) pbs.push(['🏆', fmtN(best.pts) + ' points', 'best day · ' + shortDay(best.date)]);
    if(ls.n > 1) pbs.push(['🔥', ls.n + ' days', 'longest streak · ' + dObj(ls.from).getDate() + ' ' + MONTHS[dObj(ls.from).getMonth()].slice(0, 3) + ' – ' + dObj(ls.to).getDate() + ' ' + MONTHS[dObj(ls.to).getMonth()].slice(0, 3)]);
    if(wk) pbs.push(['📖', plural(wk, 'word', 'words'), 'most new words in a week']);
    if(four) pbs.push(['🧠', 'All four', 'Brain Lab challenges on ' + plural(four, 'day', 'days')]);
    h += '<h3 class="r" style="margin:20px 0 4px;font-size:20px;color:#5B2A9B">My personal bests</h3>'
      + (pbs.length ? pbs.map(function(p){ return '<div class="pgb"><span>' + p[0] + '</span><div><b>' + p[1] + '</b>' + esc(p[2]) + '</div></div>'; }).join('')
                    : '<div class="pgb"><span>🌱</span><div><b>Your first records are on their way</b>they appear here once your parent approves your days</div></div>');
    return h + '</div>';
  }
  function words(){ return (typeof wbWords !== 'undefined' && Array.isArray(wbWords)) ? wbWords : []; }
  function wordsBestWeek(){
    var by = {}; words().forEach(function(w){ var d = String(w.date_added || w.date || '').slice(0, 10); if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) return; var x = dObj(d), mon = addDays(d, -((x.getDay() + 6) % 7)); by[mon] = (by[mon] || 0) + 1; });
    var m = 0; Object.keys(by).forEach(function(k){ if(by[k] > m) m = by[k]; }); return m;
  }

  // ---- 3. the sticker calendar -------------------------------------------------------------------------
  function calendarHtml(){
    var t = today(); if(!PG.month) PG.month = t.slice(0, 7);
    var p = PG.month.split('-'), y = +p[0], mo = +p[1] - 1, n = new Date(y, mo + 1, 0).getDate(), lead = (new Date(y, mo, 1).getDay() + 6) % 7;
    var c = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(function(d){ return '<div class="h">' + d + '</div>'; }).join('');
    for(var i = 0; i < lead; i++) c += '<div class="c e"></div>';
    for(var dn = 1; dn <= n; dn++){
      var ds = PG.month + '-' + String(dn).padStart(2, '0'), r = rec(ds), k = r ? (r.approved === true ? kindOf(r) : (num(r.pts) > 0 ? 'w' : '')) : '';
      var isJ = ds === joined();
      c += '<div class="c ' + k + (ds === t ? ' t' : '') + (isJ && !k ? ' j' : '') + '">' + (k ? '<span class="s">' + STICK[k] + '</span>' : (isJ ? '<span class="s">🚀</span>' : '')) + '<span>' + (isJ ? 'Day 1' : dn) + '</span></div>';
    }
    var first0 = days().map(function(d){ return d && d.date; }).filter(Boolean).sort()[0] || t;
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><h2 class="r">My sticker calendar</h2><div class="sub">' + MONTHS[mo] + ' ' + y + ' · a sticker for every day your parent approves</div></div>'
      + '<div class="mnav"><button data-pg="m" data-v="-1"' + (PG.month <= first0.slice(0, 7) ? ' disabled' : '') + ' aria-label="Earlier month">‹</button><button data-pg="m" data-v="1"' + (PG.month >= t.slice(0, 7) ? ' disabled' : '') + ' aria-label="Later month">›</button></div></div>'
      + '<div class="cal">' + c + '</div><div class="legend">' + (joined().slice(0, 7) === PG.month ? '<span>🚀 Day 1 · your first day</span>' : '') + '<span>⭐ Star Day</span><span>🌈 Great Day</span><span>👍 Good Day</span><span>🌱 a start</span><span>⏳ waiting for your parent</span></div></div>';
  }

  // ---- 4. the habit garden -------------------------------------------------------------------------------
  function touched(st){
    if(!st) return false; if(num(st.pts) > 0) return true;
    var c = st.checkedActs || {}; for(var k in c) if(c[k]) return true;
    if(st.parentPts) for(var j in st.parentPts) if(num(st.parentPts[j]) > 0) return true;
    return false;
  }
  function gardenHtml(){
    var t = today(), blocks = {}, order = [];
    [false, true].forEach(function(we){
      list(we).forEach(function(b){
        if(b.type === 'break' || b.type === 'locked-until-3pm' || !(b.activities || []).length) return;
        var key = String(b.name || '').trim(); if(!key) return;
        if(!blocks[key]){ blocks[key] = { name:key, icon:b.icon || '🌿', ids:{}, wd:false, we:false, brain:false }; order.push(key); }
        if((b.activities || []).some(function(a){ return a.type === 'link'; })) blocks[key].brain = true;
        blocks[key].ids[b.id] = 1; blocks[key][we ? 'we' : 'wd'] = true;
      });
    });
    var J = joined(), span = []; for(var i = 13; i >= 0; i--){ var sd = addDays(t, -i); if(sd >= J) span.push(sd); }
    var kRows = []; try{ var K = window.niyamKindness && window.niyamKindness.state(); kRows = (K && K.rows) || []; }catch(e){}
    // the habits of the timetable in use today (school day or holiday), not both at once
    var useWe = false; try{ useWe = ttIsWeekendSchedule(); }catch(e){ useWe = weekend(t); }
    order = order.filter(function(key){ return useWe ? blocks[key].we : blocks[key].wd; });
    var plants = order.map(function(key){
      var B = blocks[key], seen = [], done = 0;
      span.forEach(function(ds){
        if(!(weekend(ds) ? B.we : B.wd)) return;
        var r = rec(ds), st = r ? parse(r.ttBlockStatesJSON) : {}, ok = false;
        Object.keys(B.ids).forEach(function(id){ if(touched(st[id])) ok = true; });
        if(!ok && B.brain && r && ['savedMathsPts','savedLogicPts','savedSudokuPts','savedRiddlePts'].some(function(k){ return num(r[k]) > 0; })) ok = true;   // Brain Lab work is saved on the day itself
        if(ds === t && !ok) return;               // today is not over yet
        seen.push(ok); if(ok) done++;
      });
      return { icon:B.icon, name:B.name, seen:seen, done:done };
    });
    if(kRows.length || window.niyamKindness){
      var seenK = [], doneK = 0;
      span.forEach(function(ds){ var ok = kRows.some(function(r){ return r.week === ds && (r.status === 'done' || r.status === 'confirmed'); }); if(ds === t && !ok) return; seenK.push(ok); if(ok) doneK++; });
      plants.push({ icon:'💛', name:'Kindness', seen:seenK, done:doneK });
    }
    if(!plants.length) return '';
    if(plants.every(function(p){ return !p.seen.length; })){
      return '<div class="card"><h2 class="r">My habit garden</h2><div class="sub">Your garden is planted! 🌱 Every habit is a seed. Do it today and tomorrow, and watch it grow into a sapling 🌿 and then a tree 🌳.</div><div class="garden">'
        + plants.map(function(p){ return '<div class="pl"><div class="p">🌱</div><div class="soil"></div><b>' + esc(p.icon) + ' ' + esc(p.name) + '</b><span>planted today</span></div>'; }).join('') + '</div></div>';
    }
    var h = plants.map(function(p){
      var n = p.seen.length, r = n ? p.done / n : 0, dry = n >= 3 && r < 0.4;
      // plants grow over days, not in one go: a tree needs 5 good days, a sapling 2
      var plant = (p.done >= 5 && r >= 0.75) ? '🌳' : (p.done >= 2 && r >= 0.4) ? '🌿' : '🌱';
      if(!n) return '<div class="pl"><div class="p">🌱</div><div class="soil"></div><b>' + esc(p.icon) + ' ' + esc(p.name) + '</b><span>just planted</span></div>';
      return '<div class="pl' + (dry ? ' wilt' : '') + '">' + (dry ? '<span class="tag">💧 needs water</span>' : '') + '<div class="p">' + plant + '</div><div class="soil"></div>'
        + '<b>' + esc(p.icon) + ' ' + esc(p.name) + '</b><span>' + p.done + ' of ' + plural(n, 'day', 'days') + '</span>'
        + '<div class="dots">' + p.seen.map(function(x){ return '<i class="' + (x ? 'on' : '') + '"></i>'; }).join('') + '</div></div>';
    }).join('');
    return '<div class="card"><h2 class="r">My habit garden</h2><div class="sub">Each habit is a plant. Do it often and it grows from a seed 🌱 to a sapling 🌿 to a tree 🌳. ' + (span.length < 14 ? 'Since you joined.' : 'Last 14 days.') + '</div><div class="garden">' + h + '</div></div>';
  }

  // ---- 5. collections ----------------------------------------------------------------------------------------
  function ring(p, col, ic){ p = Math.max(0, Math.min(100, Math.round(p))); return '<div class="ring" style="background:conic-gradient(' + col + ' 0 ' + p + '%,#EFEBF8 ' + p + '% 100%)"><div>' + ic + '</div></div>'; }
  function stepInfo(n, steps){ var prev = 0, next = null; for(var i = 0; i < steps.length; i++){ if(n >= steps[i][0]) prev = steps[i][0]; else { next = steps[i]; break; } } return { prev:prev, next:next, pct: next ? (n - prev) / (next[0] - prev) * 100 : 100 }; }
  function collectionsHtml(){
    var items = [];
    var lv = 0; try{ if(window.niyamBrainLab && window.niyamBrainLab.leaves) lv = window.niyamBrainLab.leaves().total || 0; }catch(e){}
    if(!(window.niyamFeatures && window.niyamFeatures.brainlab === false)){
      var L = stepInfo(lv, LEAF_STEPS);
      items.push([ring(L.pct, '#16A34A', '🍃'), fmtN(lv), 'Brain Lab ' + (lv === 1 ? 'leaf' : 'leaves'), L.next ? fmtN(L.next[0] - lv) + ' more for ' + L.next[1] : 'the Great Banyan is complete!']);
    }
    var wn = words().length, W = stepInfo(wn, WORD_RANKS);
    items.push([ring(W.pct, '#0EA5E9', '📖'), fmtN(wn), 'words in my dictionary', W.next ? (W.next[0] - wn) + ' more to become a ' + W.next[1] : 'Master of Words!']);
    try{ if(typeof _geetaLoadProgress === 'function' && typeof geetaProgress !== 'undefined' && !Object.keys(geetaProgress).length) _geetaLoadProgress(); }catch(e){}
    var S = (typeof SHLOKAS !== 'undefined' && SHLOKAS) || [], gp = (typeof geetaProgress !== 'undefined' && geetaProgress) || {};
    var mast = S.filter(function(s){ return gp[s.id] && gp[s.id].status === 'mastered'; }).length;
    var learn = S.find(function(s){ var x = gp[s.id]; return x && (x.status === 'inprogress' || x.status === 'relearning'); });
    if(S.length) items.push([ring(mast / S.length * 100, '#EA580C', '🕉️'), mast + ' / ' + S.length, 'shlokas mastered', learn ? 'learning: ' + (learn.chapter || '') : (mast < S.length ? 'start the next one on your Geeta page' : 'all mastered!')]);
    var kc = 0; try{ var K = window.niyamKindness && window.niyamKindness.state(); kc = ((K && K.rows) || []).filter(function(r){ return r.status === 'confirmed' && !/^little:/.test(r.mission || ''); }).length; }catch(e){}
    var KI = stepInfo(kc, KIND_STEPS);
    items.push([ring(KI.pct, '#E8467C', '💛'), fmtN(kc), 'kind ' + (kc === 1 ? 'act' : 'acts') + ' done', KI.next ? (KI.next[0] - kc) + ' more for the ' + KI.next[1] + ' badge' : 'Heart of Gold!']);
    return '<div class="card"><h2 class="r">My collections</h2><div class="sub">Everything you have built so far</div><div class="coll">'
      + items.map(function(x){ return '<div class="co">' + x[0] + '<div style="min-width:0"><b>' + x[1] + '</b><div class="l">' + esc(x[2]) + '</div><div class="n">' + esc(x[3]) + '</div></div></div>'; }).join('') + '</div></div>';
  }

  // ---- 6. points, day by day ---------------------------------------------------------------------------------
  function chartHtml(){
    var t = today(), N = 30, W = 1000, H = 170, slot = W / N, bw = slot - 8, svg = '', top = 1;
    var J = joined(), ds = []; for(var i = N - 1; i >= 0; i--){ var cd = addDays(t, -i); if(cd >= J) ds.push(cd); }
    N = ds.length; slot = W / Math.max(N, 7); bw = Math.min(slot - 8, 60);
    ds.forEach(function(d){ var r = rec(d); top = Math.max(top, r ? num(r.pts) : 0, dayMax(d)); });
    var COL = { st:'#F4B400', gr:'#8B5CF6', go:'#60A5FA', sm:'#86EFAC' };
    ds.forEach(function(d, i){
      var r = rec(d), v = r ? num(r.pts) : 0, x = i * slot + 4;
      if(v > 0){
        var h = v / top * H, fill = r.approved === true ? COL[kindOf(r)] || '#C4B5FD' : 'url(#pgw)';
        svg += '<rect x="' + x.toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="6" fill="' + fill + '"><title>' + shortDay(d) + ' · ' + v + ' points</title></rect>';
      } else svg += '<rect x="' + x.toFixed(1) + '" y="' + (H - 6) + '" width="' + bw.toFixed(1) + '" height="6" rx="3" fill="#EFEBF8"/>';
    });
    var full = fullDay(false), good = Math.round(full * 0.7), gy = H - good / top * H, fy = H - full / top * H;
    svg += '<line x1="0" x2="' + W + '" y1="' + fy.toFixed(1) + '" y2="' + fy.toFixed(1) + '" stroke="#B45309" stroke-dasharray="3 6" stroke-width="1.2" opacity=".6"/>'
      + '<text x="' + W + '" y="' + (fy - 6).toFixed(1) + '" text-anchor="end" font-size="12" font-weight="800" fill="#B45309" font-family="Plus Jakarta Sans,sans-serif">full school day · ' + full + '</text>'
      + '<line x1="0" x2="' + W + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="#5B2A9B" stroke-dasharray="5 5" stroke-width="1.4" opacity=".6"/>'
      + '<text x="' + W + '" y="' + (gy - 6).toFixed(1) + '" text-anchor="end" font-size="12" font-weight="800" fill="#5B2A9B" font-family="Plus Jakarta Sans,sans-serif">a great day · ' + good + '</text>';
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap"><div><h2 class="r">My points, day by day</h2><div class="sub">' + (N < 30 ? 'Since you joined' : 'Last 30 days') + '</div></div>'
      + '<div class="legend" style="margin:0"><span style="color:#B45309">■ Star Day</span><span style="color:#7C3AED">■ Great Day</span><span style="color:#2563EB">■ Good Day</span><span style="color:#16A34A">■ a start</span><span style="color:#B45309">▨ waiting</span></div></div>'
      + '<svg viewBox="0 -18 ' + W + ' ' + (H + 22) + '" width="100%" style="display:block;margin-top:12px"><defs><pattern id="pgw" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#FDE68A"/><rect width="4" height="8" fill="#FCD34D"/></pattern></defs>' + svg + '</svg>'
      + '<div style="display:flex;justify-content:space-between;color:#9C97B8;font-size:12px;font-weight:700;margin-top:6px"><span>' + shortDay(ds[0]) + '</span><span>Today</span></div></div>';
  }

  // ---- draw -------------------------------------------------------------------------------------------------------
  function render(){
    var tab = $('tab-graphs'); if(!tab) return;
    addStyles(); maxCache = {};
    var root = $('pg-root');
    if(!root){ root = document.createElement('div'); root.id = 'pg-root'; tab.insertBefore(root, tab.firstChild); root.addEventListener('click', onClick); }
    tab.classList.add('pg-on');
    var h = '';
    try{
      h = heroHtml() + '<div class="grid two">' + medalsHtml() + calendarHtml() + '</div><div class="grid">' + gardenHtml() + collectionsHtml() + chartHtml() + '</div>';
    }catch(e){ console.error('[progress] draw:', e); h = '<div class="card empty">Your progress could not be drawn just now. Please refresh the page.</div>'; }
    root.innerHTML = h;
  }
  function onClick(e){
    var b = e.target.closest('[data-pg]'); if(!b || b.disabled) return;
    if(b.getAttribute('data-pg') === 'm'){
      var p = (PG.month || today().slice(0, 7)).split('-'), x = new Date(+p[0], +p[1] - 1 + num(b.getAttribute('data-v')), 1);
      PG.month = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); render();
    }
  }
  function isOpen(){ var t = $('tab-graphs'); return !!(t && (t.classList.contains('active') || t.style.display === 'block')); }

  // ---- connections --------------------------------------------------------------------------------------------------
  // The old page popped up "NOT YET! Need 200 more pts for Bronze" when Progress
  // opened, measured against numbers a younger child's day can never reach.
  if(typeof cupSoundAndOverlay === 'function') cupSoundAndOverlay = function(){};
  if(typeof showCupOverlay === 'function') showCupOverlay = function(){};
  if(typeof renderGraphs === 'function'){
    var rg = renderGraphs;
    renderGraphs = function(){ var r; try{ r = rg.apply(this, arguments); }catch(e){} try{ render(); }catch(e){ console.error('[progress]', e); } return r; };
  }
  if(typeof showTab === 'function'){
    var sh = showTab;
    showTab = function(id){
      var r = sh.apply(this, arguments);
      if(id === 'graphs'){
        try{ render(); }catch(e){ console.error('[progress]', e); }
        // the dictionary and kindness arrive a moment later
        try{ if(typeof wbLoad === 'function' && !words().length){ var w = wbLoad(); if(w && w.then) w.then(function(){ if(isOpen()) render(); }); } }catch(e){}
        try{ if(window.niyamKindness && window.niyamKindness.reload){ var k = window.niyamKindness.reload(); if(k && k.then) k.then(function(){ if(isOpen()) render(); }); } }catch(e){}
      }
      return r;
    };
  }
  window.niyamProgress = { render: render };
})();
