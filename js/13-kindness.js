// ============================================================================
// NIYAM — js/13-kindness.js
// The Kindness tab (22 Oct 2026) and the parent's check.
// Loads after js/12-star-bank.js and data/kindness-missions.js.
//
//   • Kindness Mission: one a week (Monday to Sunday), done on any day. Only
//     the current mission is shown; the next one is revealed on Monday. A
//     missed week keeps the same mission, so none is skipped. The child taps
//     "I did it" (and can undo a mistaken tap until the parent has checked);
//     the parent gives 10–50 points, or asks them to try again.
//   • Little kindness, every day: small acts (helping grandparents, saying
//     thank you…), 5 points each, up to 6 a day. Points count only once the
//     parent approves them.
//   • Approved points are added to the child's bank (totalEarned).
//
// Everything is saved in the Supabase table `kindness`
// (star-bank-and-kindness.sql), one row per mission or little act:
//   mission  — the mission id ('k01'…) or 'little:<act>' for a little act
//   week     — the Monday for a mission, the day itself for a little act
//   status   — 'done' (waiting for the parent) | 'confirmed' | 'redo'
//   pts      — the points the parent gave (little acts: 5)
// Colours: calm teal with warm gold — for every child (Pooja, 22 Oct 2026).
// ============================================================================
(function(){
  'use strict';

  var LITTLE = [
    ['thanks',  '🙏', 'Said thank you to someone'],
    ['oil',     '🫙', 'Oiled a grandparent’s feet or hands'],
    ['massage', '💆', 'Gave a grandparent a head massage'],
    ['elder',   '👵', 'Sat and talked with a grandparent'],
    ['fetch',   '🥛', 'Fetched water or medicine for an elder'],
    ['table',   '🍽️', 'Helped set or clear the table'],
    ['parent',  '🤲', 'Helped Mum or Dad without being asked'],
    ['tidy',    '🧹', 'Tidied up without being asked'],
    ['share',   '🍪', 'Shared something with someone'],
    ['friend',  '🤝', 'Helped a friend or classmate'],
    ['smile',   '😊', 'Cheered someone up'],
    ['sorry',   '💬', 'Said sorry when I was wrong'],
    ['animal',  '🐦', 'Fed a bird or an animal'],
    ['save',    '💡', 'Switched off lights or fans no one was using']
  ];
  var LITTLE_PTS = 5, LITTLE_MAX = 6;
  var SCALE = [10, 20, 30, 40, 50];
  var K = { rows:null, loading:false, busy:false, missing:false };

  // ---- helpers ---------------------------------------------------------------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function missions(){ return (window.NIYAM_KINDNESS && window.NIYAM_KINDNESS.length) ? window.NIYAM_KINDNESS : []; }
  function byId(id){ return missions().find(function(m){ return m.id === id; }); }
  function littleOf(key){ return LITTLE.find(function(x){ return x[0] === key; }); }
  function today(){ return new Date().toLocaleDateString('en-CA'); }
  function childName(){ return window.niyamChildName || ''; }
  function toastMsg(m){ if(typeof toast === 'function') toast(m); }
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function fmt(d){ var p = String(d || '').split('-'); return p.length === 3 ? (+p[2]) + ' ' + MONTHS[(+p[1]) - 1] : ''; }
  function fmtDay(d){ var x = new Date(d + 'T12:00:00'); return DAYS[x.getDay()] + ' ' + fmt(d); }
  function monday(ds){ var d = new Date((ds || today()) + 'T12:00:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.toLocaleDateString('en-CA'); }
  function addDays(ds, n){ var d = new Date(ds + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); }
  function isLittle(r){ return /^little:/.test(r.mission || ''); }

  // ---- what is saved ---------------------------------------------------------------
  function rows(){ return K.rows || []; }
  function missionRows(){ return rows().filter(function(r){ return !isLittle(r); }); }
  function littleToday(){ var t = today(); return rows().filter(function(r){ return isLittle(r) && r.week === t; }); }
  function thisWeek(){ var w = monday(); return missionRows().filter(function(r){ return r.week === w; }).sort(function(a, b){ return (b.id || 0) > (a.id || 0) ? 1 : -1; })[0] || null; }
  function current(){
    var w = monday(), row = thisWeek();
    if(row && byId(row.mission)) return { m:byId(row.mission), row:row };
    var done = missionRows().filter(function(r){ return r.week < w && (r.status === 'done' || r.status === 'confirmed'); }).length;
    var list = missions();
    return { m:list.length ? list[done % list.length] : null, row:null };
  }
  function kindPts(){ return rows().reduce(function(a, r){ return a + (r.status === 'confirmed' ? (+r.pts || 0) : 0); }, 0); }

  async function load(){
    if(K.loading || typeof _supabase === 'undefined' || !_supabase) return;
    K.loading = true;
    try{
      var r = await _supabase.from('kindness').select('*').order('week', { ascending:true });
      if(r.error){ console.warn('[kindness] load:', r.error.message); K.rows = K.rows || []; K.missing = /relation|does not exist|schema cache/i.test(r.error.message || ''); }
      else { K.rows = r.data || []; K.missing = false; }
    }catch(e){ console.warn('[kindness] load:', e); K.rows = K.rows || []; }
    K.loading = false;
    try{ if(typeof updateTopBar === 'function') updateTopBar(); }catch(e){}
    redraw(); renderParent();
  }

  // ---- styles -------------------------------------------------------------------------
  var CSS = ''
  + '#kd-root{--ink:#132B2A;--soft:#557371;--line:#CDEBE5;--teal:#0F766E;--teal2:#14B8A6;--deep:#0B4F4A;--gold:#F5B935;--gold2:#FCE7A8;'
  +   'font-family:Nunito,system-ui,sans-serif;color:var(--ink);background:#F3FBF9;border-radius:24px;padding:14px;max-width:1240px;margin:0 auto;box-sizing:border-box}'
  + '#kd-root *{box-sizing:border-box}'
  + '#kd-root button{font-family:inherit;cursor:pointer}'
  + '#kd-root .f{font-family:Fredoka,Nunito,sans-serif}'
  + '#kd-root .cap{font-size:11.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}'
  + '#kd-root .lay{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"hero" "mission" "little" "wall"}'
  + '#kd-root .a-hero{grid-area:hero} #kd-root .a-mission{grid-area:mission} #kd-root .a-wall{grid-area:wall} #kd-root .a-little{grid-area:little}'
  + '#kd-root .kh{position:relative;overflow:hidden;border-radius:26px;padding:20px;color:#fff;background:radial-gradient(110% 90% at 100% 0%,rgba(245,185,53,.55),rgba(245,185,53,0) 50%),linear-gradient(160deg,#0B4F4A,#0F766E 55%,#14B8A6)}'
  + '#kd-root .kh .ht{position:absolute;font-size:18px;animation:kdFloat 6s linear infinite;opacity:0}'
  + '#kd-root .kh>.in{position:relative}'
  + '#kd-root .kh .cap{color:#FCE7A8}'
  + '#kd-root .kh h1{font-family:Fredoka,sans-serif;font-weight:700;font-size:30px;margin:4px 0 0;line-height:1.1;color:#fff}'
  + '#kd-root .chip{display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.28);border-radius:99px;padding:5px 12px;font-weight:800;font-size:12.5px;margin:12px 6px 0 0}'
  + '#kd-root .card{background:#fff;border-radius:22px;padding:16px;margin-top:14px;border:2px solid var(--line)}'
  + '#kd-root .mission{background:#fff;border-radius:24px;padding:18px;margin-top:14px;box-shadow:0 14px 34px rgba(15,118,110,.12);border:2px solid #BFE9E1;position:relative;overflow:hidden}'
  + '#kd-root .mission .em{width:80px;height:80px;border-radius:24px;background:linear-gradient(160deg,#E6F7F3,#FDF3D3);display:flex;align-items:center;justify-content:center;font-size:46px;transform:rotate(-6deg);flex:0 0 auto;animation:kdWiggle 3.5s ease-in-out infinite}'
  + '#kd-root .mission h2{margin:4px 0 0;font-family:Fredoka,sans-serif;font-weight:700;font-size:24px;line-height:1.15;color:var(--ink)}'
  + '#kd-root .steps{margin:12px 0 0;padding:0;list-style:none;counter-reset:s}'
  + '#kd-root .steps li{counter-increment:s;position:relative;padding-left:34px;margin-top:9px;font-weight:700;line-height:1.45}'
  + '#kd-root .steps li::before{content:counter(s);position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:var(--teal);color:#fff;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center}'
  + '#kd-root .why{background:#EFFAF7;border-radius:16px;padding:12px 14px;margin-top:14px;font-weight:700;font-size:14px;line-height:1.45}'
  + '#kd-root .grown{display:inline-block;margin-top:10px;background:#FDF3D3;color:#7A5300;border-radius:99px;padding:4px 12px;font-weight:800;font-size:12.5px}'
  + '#kd-root .btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;border:0;border-radius:16px;font-family:Fredoka,sans-serif;font-weight:600;font-size:19px;color:#fff;background:var(--teal);margin-top:14px;box-shadow:0 5px 0 var(--deep)}'
  + '#kd-root .btn.ghost{background:#fff;color:var(--soft);border:2px solid var(--line);box-shadow:none;font-size:15px;min-height:42px;margin-top:10px}'
  + '#kd-root .btn[disabled]{opacity:.5}'
  + '#kd-root .state{margin-top:14px;border-radius:16px;padding:12px 14px;font-weight:800;line-height:1.45}'
  + '#kd-root .next{margin-top:14px;border:2px dashed #9ED9CE;border-radius:20px;padding:16px;text-align:center;background:repeating-linear-gradient(-45deg,#fff 0 10px,#F0FAF7 10px 20px)}'
  + '#kd-root .next .lock{font-size:34px;animation:kdBob 2.2s ease-in-out infinite;display:inline-block}'
  + '#kd-root .wall{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}'
  + '#kd-root .heart{background:#fff;border-radius:18px;border:2px solid var(--line);padding:10px 6px;text-align:center;font-weight:800;font-size:11.5px;line-height:1.25;color:var(--deep)}'
  + '#kd-root .heart b{display:block;font-size:26px;margin-bottom:2px}'
  + '#kd-root .heart span{color:#7FA6A1}'
  + '#kd-root .heart.empty{border-style:dashed;color:#9CC9C1;background:transparent}'
  + '#kd-root .heart.empty b{animation:kdBeat 1.6s ease-in-out infinite}'
  + '#kd-root .acts{display:flex;flex-direction:column;gap:8px;margin-top:12px}'
  + '#kd-root .act{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:#fff;border:2px solid var(--line);border-radius:14px;padding:9px 12px;font-weight:800;font-size:14px;color:var(--ink);min-height:46px}'
  + '#kd-root .act .ae{font-size:20px;flex:0 0 auto}'
  + '#kd-root .act .ap{margin-left:auto;font-size:12px;font-weight:900;color:var(--soft);white-space:nowrap}'
  + '#kd-root .act .bx{width:22px;height:22px;border-radius:7px;border:2px solid #9ED9CE;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff}'
  + '#kd-root .act.on{border-color:var(--teal2);background:#ECFAF6}'
  + '#kd-root .act.on .bx{background:var(--teal);border-color:var(--teal)}'
  + '#kd-root .act.ok{border-color:#F5B935;background:#FFFBEB}'
  + '#kd-root .act.ok .bx{background:#F5B935;border-color:#F5B935}'
  + '#kd-root .act.on .ap{color:var(--teal)} #kd-root .act.ok .ap{color:#9A6400}'
  + '#kd-root .act[disabled]{cursor:default;opacity:.55}'
  + '#kd-root .act.on[disabled],#kd-root .act.ok[disabled]{opacity:1}'
  + '#kd-root .act.on{animation:kdPop .3s}'
  + '#kd-root .sum{margin-top:12px;border-radius:14px;padding:10px 12px;font-weight:800;font-size:13.5px;background:#EFFAF7;color:var(--deep)}'
  + '@keyframes kdFloat{0%{transform:translateY(20px) scale(.6);opacity:0}20%{opacity:.9}100%{transform:translateY(-120px) scale(1.1);opacity:0}}'
  + '@keyframes kdWiggle{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(4deg)}}'
  + '@keyframes kdBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'
  + '@keyframes kdBeat{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}'
  + '@keyframes kdPop{0%{transform:scale(.97)}60%{transform:scale(1.02)}100%{transform:scale(1)}}'
  + '@media (prefers-reduced-motion:reduce){#kd-root *{animation:none!important}}'
  + '@media (min-width:820px){'
  +   '#kd-root{padding:24px 26px}'
  +   '#kd-root .lay{grid-template-columns:380px minmax(0,1fr);grid-template-areas:"hero mission" "little mission" "little wall";grid-template-rows:auto auto 1fr;column-gap:24px;align-items:start}'
  +   '#kd-root .a-mission .mission{margin-top:0}'
  + '}';

  function addStyles(){
    if($('kd-style')) return;
    var st = document.createElement('style'); st.id = 'kd-style'; st.textContent = CSS; document.head.appendChild(st);
    if(!document.querySelector('link[data-sb-font]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-sb-font', '1');
      l.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800;900&display=swap';
      document.head.appendChild(l);
    }
  }
  // The tab and its menu button are added here, so index.html needs no new markup.
  function ensureTab(){
    var tab = $('tab-kindness');
    if(!tab){
      var after = $('tab-rewards'); if(!after) return null;
      tab = document.createElement('div'); tab.className = 'tab'; tab.id = 'tab-kindness';
      after.parentNode.insertBefore(tab, after.nextSibling);
    }
    if(!document.querySelector('.nb[data-kind]')){
      var rb = Array.prototype.find.call(document.querySelectorAll('.nb'), function(b){ return /showTab\('rewards'/.test(b.getAttribute('onclick') || ''); });
      if(rb){
        var b = document.createElement('button'); b.className = 'nb t1'; b.setAttribute('data-kind', '1');
        b.setAttribute('onclick', "showTab('kindness',this)"); b.textContent = '💛 Kindness';
        rb.parentNode.insertBefore(b, rb.nextSibling);
      }
    }
    return tab;
  }
  function root(){
    var tab = ensureTab(); if(!tab) return null;
    var r = $('kd-root');
    if(!r){ addStyles(); r = document.createElement('div'); r.id = 'kd-root'; tab.appendChild(r); r.addEventListener('click', onClick); }
    return r;
  }

  // ---- the page ---------------------------------------------------------------------------
  function heroHtml(){
    var conf = rows().filter(function(r){ return r.status === 'confirmed'; });
    var floats = ''; for(var i = 0; i < 7; i++) floats += '<span class="ht" style="left:' + (10 + i * 12) + '%;bottom:0;animation-delay:' + (i * 0.85).toFixed(2) + 's">' + (i % 2 ? '💛' : '✨') + '</span>';
    return '<div class="kh">' + floats + '<div class="in"><div class="cap">' + (childName() ? esc(childName()) + '’s ' : 'My ') + 'Kindness</div>'
      + '<h1>Small acts,<br>big hearts 💛</h1>'
      + '<span class="chip">💛 ' + conf.length + ' kind ' + (conf.length === 1 ? 'act' : 'acts') + '</span>'
      + '<span class="chip">⭐ ' + kindPts().toLocaleString('en-IN') + ' points from kindness</span></div></div>';
  }
  function missionHtml(){
    if(K.missing) return '<div class="mission"><div class="f" style="font-size:22px;font-weight:700">Kindness Missions are almost ready</div><div class="why">Ask your parent to finish the setup (one step in Supabase). Then your first mission will appear here.</div></div>';
    if(K.rows === null) return '<div class="mission"><div class="f" style="font-size:20px;font-weight:700">Opening your mission…</div></div>';
    var c = current(), m = c.m, row = c.row;
    if(!m) return '';
    var mon = monday(), sun = addDays(mon, 6);
    var h = '<div class="mission"><div style="display:flex;gap:14px;align-items:center"><div class="em">' + m.em + '</div><div style="flex:1;min-width:0">'
      + '<div class="cap" style="color:var(--teal)">This week’s mission · ' + fmt(mon) + '–' + fmt(sun) + '</div><h2>' + esc(m.title) + '</h2>'
      + '<div style="font-weight:800;color:var(--soft);font-size:13px;margin-top:4px">Do it any day this week · 10 to 50 points</div></div></div>'
      + '<ol class="steps">' + m.steps.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'
      + (m.grownup ? '<span class="grown">👨‍👩‍👧 Do this one with a grown-up</span>' : '')
      + '<div class="why"><b style="color:var(--teal)">Why it matters:</b> ' + esc(m.why) + '</div>';
    if(row && row.status === 'confirmed'){
      h += '<div class="state" style="background:#FFFBEB;color:#7A5300;border:2px solid #FCE7A8">🌟 Mission complete! Your parent gave you <b>' + (+row.pts || 0) + ' points</b> for your kindness.</div>';
    } else if(row && row.status === 'done'){
      h += '<div class="state" style="background:#ECFAF6;color:var(--deep);border:2px solid #BFE9E1">✓ Done — what a kind heart! Your parent will check and give 10 to 50 points.</div>'
        + '<button class="btn ghost" data-act="undo"' + (K.busy ? ' disabled' : '') + '>Not yet — I tapped by mistake</button>';
    } else {
      if(row && row.status === 'redo') h += '<div class="state" style="background:#FDF3D3;color:#7A5300">Your parent asked you to give this one another try. You can do it! 💪</div>';
      h += '<button class="btn" data-act="did"' + (K.busy ? ' disabled' : '') + '>✓ I did it!</button>';
    }
    h += '</div>';
    if(row && (row.status === 'confirmed' || row.status === 'done')){
      var nextMon = addDays(mon, 7), left = Math.round((new Date(nextMon + 'T12:00:00') - new Date(today() + 'T12:00:00')) / 86400000);
      h += '<div class="next"><span class="lock">🎁</span><div class="f" style="font-size:20px;font-weight:700;margin-top:4px">Your next mission is a surprise!</div>'
        + '<div style="font-weight:800;color:var(--soft);font-size:13.5px;margin-top:2px">It arrives on Monday, ' + fmt(nextMon) + ' — ' + (left === 1 ? 'tomorrow!' : 'in ' + left + ' days.') + '</div></div>';
    }
    return h;
  }
  function wallHtml(){
    var done = missionRows().filter(function(r){ return r.status === 'confirmed' || r.status === 'done'; }).slice().reverse();
    var h = '<div class="cap" style="color:var(--teal);margin-top:22px">My kindness wall</div><div class="wall">';
    done.forEach(function(r){ var m = byId(r.mission) || { em:'💛', title:'Kindness mission' };
      h += '<div class="heart"><b>' + m.em + '</b>' + esc(m.title) + '<br><span>Week of ' + fmt(r.week) + (r.status === 'done' ? ' · waiting' : '') + '</span></div>'; });
    var empty = Math.max(2, 4 - done.length % 4);
    for(var i = 0; i < empty; i++) h += '<div class="heart empty"><b>💛</b>' + (i === 0 ? (done.length ? 'Your next mission' : 'Your first mission') : '&nbsp;') + '</div>';
    return h + '</div>';
  }
  function littleHtml(){
    var todays = littleToday(), got = {};
    todays.forEach(function(r){ got[r.mission.slice(7)] = r; });
    var n = todays.length, full = n >= LITTLE_MAX;
    var waiting = todays.filter(function(r){ return r.status === 'done'; }).length, ok = todays.filter(function(r){ return r.status === 'confirmed'; }).length;
    var h = '<div class="card"><div class="cap" style="color:var(--teal)">Little kindness, every day</div>'
      + '<div style="font-size:13px;font-weight:700;color:var(--soft);margin-top:2px">Tick what you did today. Each one is worth ' + LITTLE_PTS + ' points once your parent approves it — up to ' + LITTLE_MAX + ' a day.</div>';
    if(K.missing) return h + '<div class="sum">Almost ready — ask your parent to finish the setup.</div></div>';
    h += '<div class="acts">';
    LITTLE.forEach(function(x){
      var r = got[x[0]], cls = r ? (r.status === 'confirmed' ? 'act ok' : 'act on') : 'act';
      var dis = (r && r.status === 'confirmed') || (!r && full) || K.busy || K.rows === null;
      h += '<button class="' + cls + '" data-act="tick" data-k="' + x[0] + '"' + (dis ? ' disabled' : '') + '><span class="bx">' + (r ? '✓' : '') + '</span><span class="ae">' + x[1] + '</span>'
        + '<span>' + esc(x[2]) + '</span><span class="ap">' + (r && r.status === 'confirmed' ? '+' + LITTLE_PTS + ' ✓' : '+' + LITTLE_PTS) + '</span></button>';
    });
    h += '</div>';
    if(n) h += '<div class="sum">' + n + (n === 1 ? ' kind act' : ' kind acts') + ' today 💛'
      + (waiting ? ' · <b>+' + waiting * LITTLE_PTS + ' points</b> waiting for your parent' : '') + (ok ? ' · <b>+' + ok * LITTLE_PTS + '</b> approved' : '')
      + (full ? '<br>That’s today’s limit — what a kind day!' : '') + '</div>';
    return h + '</div>';
  }
  function render(){
    var r = root(); if(!r) return;
    r.innerHTML = '<div class="lay"><div class="a-hero">' + heroHtml() + '</div><div class="a-mission">' + missionHtml() + '</div>'
      + '<div class="a-wall">' + wallHtml() + '</div><div class="a-little">' + littleHtml() + '</div></div>';
    if(K.rows === null) load();
  }
  function redraw(){ try{ var t = $('tab-kindness'); if(t && t.classList.contains('active')) render(); }catch(e){ console.error('[kindness] render:', e); } }

  async function onClick(e){
    var b = e.target.closest('[data-act]'); if(!b || b.disabled || K.busy) return;
    var act = b.getAttribute('data-act'), res;
    if(act === 'did'){
      var c = current(); if(!c.m) return;
      var row = { week:monday(), mission:c.m.id, note:null, status:'done', pts:0, done_at:new Date().toISOString() };
      K.busy = true; render();
      try{ res = (c.row && c.row.status === 'redo') ? await _supabase.from('kindness').update(row).eq('id', c.row.id).select() : await _supabase.from('kindness').insert(row).select(); }
      catch(err){ res = { error:err }; }
      K.busy = false;
      if(res.error){ render(); toastMsg('⚠️ Could not save — check the internet and try again.'); console.warn('[kindness] save:', res.error); return; }
      var saved = (res.data && res.data[0]) || row;
      K.rows = rows().filter(function(x){ return !c.row || x.id !== c.row.id; }).concat([saved]);
      render(); renderParent();
      toastMsg('💛 Wonderful! Your parent will check it.');
      return;
    }
    if(act === 'undo'){
      var cur = current().row; if(!cur || cur.status !== 'done') return;
      K.busy = true; render();
      try{ res = await _supabase.from('kindness').delete().eq('id', cur.id); }catch(err){ res = { error:err }; }
      K.busy = false;
      if(res.error){ render(); toastMsg('⚠️ Could not undo — check the internet.'); return; }
      K.rows = rows().filter(function(x){ return x.id !== cur.id; });
      render(); renderParent();
      return;
    }
    if(act === 'tick'){
      var k = b.getAttribute('data-k'), t = today(), have = littleToday().find(function(r){ return r.mission === 'little:' + k; });
      if(have && have.status === 'confirmed') return;
      if(!have && littleToday().length >= LITTLE_MAX){ toastMsg('That’s today’s limit — what a kind day! 💛'); return; }
      K.busy = true; render();
      try{
        res = have ? await _supabase.from('kindness').delete().eq('id', have.id)
                   : await _supabase.from('kindness').insert({ week:t, mission:'little:' + k, note:null, status:'done', pts:LITTLE_PTS, done_at:new Date().toISOString() }).select();
      }catch(err){ res = { error:err }; }
      K.busy = false;
      if(res.error){ render(); toastMsg('⚠️ Could not save — check the internet and try again.'); console.warn('[kindness] little:', res.error); return; }
      if(have) K.rows = rows().filter(function(x){ return x.id !== have.id; });
      else K.rows = rows().concat([(res.data && res.data[0]) || { week:t, mission:'little:' + k, status:'done', pts:LITTLE_PTS }]);
      render(); renderParent();
    }
  }

  // ---- parent side: kindness to check -----------------------------------------------------
  function renderParent(){
    var host = typeof window.niyamParentFamilyHost === 'function' ? window.niyamParentFamilyHost() : null;
    if(!host) return;
    var box = $('pz-kindness');
    if(!box){ box = document.createElement('div'); box.id = 'pz-kindness'; host.insertBefore(box, host.firstChild); box.addEventListener('click', onParent); }
    var wait = missionRows().filter(function(r){ return r.status === 'done'; });
    var littleWait = rows().filter(function(r){ return isLittle(r) && r.status === 'done'; });
    var h = '<div class="pz-card"><div class="pz-h"><span>💛 Kindness to check</span></div>';
    if(K.missing) h += '<div class="pz-note">Kindness needs a one-time Supabase step: run <b>star-bank-and-kindness.sql</b> in the SQL Editor.</div>';
    else if(K.rows === null) h += '<div class="pz-note">Loading…</div>';
    else if(!wait.length && !littleWait.length) h += '<div class="pz-note">Nothing to check. When your child finishes this week’s Kindness Mission or ticks a little kindness, it appears here for you to approve.</div>';
    wait.forEach(function(r){
      var m = byId(r.mission) || { em:'💛', title:'Kindness mission' };
      h += '<div class="pz-row" style="align-items:flex-start"><span class="pz-e">' + m.em + '</span><div style="flex:1;min-width:200px"><b>Weekly mission: ' + esc(m.title) + '</b><small>Week of ' + fmt(r.week) + ' · your child says it is done</small>'
        + '<div style="margin-top:8px;font-size:12.5px;font-weight:800;color:#557371">How kind was it? Give points:</div>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + SCALE.map(function(p){ return '<button class="pz-btn ok" data-kz="give" data-id="' + esc(r.id) + '" data-p="' + p + '">+' + p + '</button>'; }).join('')
        + '<button class="pz-btn" data-kz="redo" data-id="' + esc(r.id) + '">Not done yet — try again</button></div></div></div>';
    });
    // little acts, one row per day
    var byDay = {};
    littleWait.forEach(function(r){ (byDay[r.week] = byDay[r.week] || []).push(r); });
    Object.keys(byDay).sort().forEach(function(d){
      var list = byDay[d];
      h += '<div class="pz-row" style="align-items:flex-start"><span class="pz-e">🤲</span><div style="flex:1;min-width:200px"><b>Little kindness · ' + fmtDay(d) + '</b><small>' + list.length + ' × ' + LITTLE_PTS + ' points · tap ✕ to remove one that did not happen</small>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + list.map(function(r){ var x = littleOf(r.mission.slice(7)) || ['', '💛', r.mission.slice(7)];
            return '<span style="display:inline-flex;align-items:center;gap:6px;background:#ECFAF6;border:1.5px solid #BFE9E1;border-radius:99px;padding:5px 6px 5px 10px;font-weight:800;font-size:13px">' + x[1] + ' ' + esc(x[2])
              + '<button class="pz-btn" style="padding:2px 8px;border-radius:99px" data-kz="drop" data-id="' + esc(r.id) + '" aria-label="Remove">✕</button></span>'; }).join('') + '</div>'
        + '<button class="pz-btn ok" style="margin-top:8px" data-kz="okday" data-day="' + d + '">Approve all · +' + list.length * LITTLE_PTS + ' points</button></div></div>';
    });
    box.innerHTML = h + '</div>';
  }
  async function onParent(e){
    var b = e.target.closest('[data-kz]'); if(!b || b.disabled) return;
    var kz = b.getAttribute('data-kz'), now = new Date().toISOString();
    Array.prototype.forEach.call(b.closest('.pz-row').querySelectorAll('button'), function(x){ x.disabled = true; });
    try{
      if(kz === 'okday'){
        var d = b.getAttribute('data-day');
        var list = rows().filter(function(r){ return isLittle(r) && r.status === 'done' && r.week === d; });
        for(var i = 0; i < list.length; i++){
          var res = await _supabase.from('kindness').update({ status:'confirmed', pts:LITTLE_PTS, confirmed_at:now }).eq('id', list[i].id);
          if(res.error) throw new Error(res.error.message);
          Object.assign(list[i], { status:'confirmed', pts:LITTLE_PTS, confirmed_at:now });
        }
      } else {
        var id = b.getAttribute('data-id'), r = rows().find(function(x){ return String(x.id) === id; }); if(!r) return;
        if(kz === 'drop'){
          var del = await _supabase.from('kindness').delete().eq('id', r.id);
          if(del.error) throw new Error(del.error.message);
          K.rows = rows().filter(function(x){ return x !== r; });
        } else {
          var patch = kz === 'give' ? { status:'confirmed', pts:+b.getAttribute('data-p') || 0, confirmed_at:now } : { status:'redo' };
          var up = await _supabase.from('kindness').update(patch).eq('id', r.id);
          if(up.error) throw new Error(up.error.message);
          Object.assign(r, patch);
        }
      }
    }catch(err){ alert('Could not save: ' + (err && err.message ? err.message : err)); }
    try{ if(typeof updateTopBar === 'function') updateTopBar(); }catch(err){}
    renderParent(); redraw();
  }

  // ---- connections -----------------------------------------------------------------------------
  // Approved kindness points count in the child's bank.
  if(typeof totalEarned === 'function'){
    var te = totalEarned;
    totalEarned = function(){ return te.apply(this, arguments) + kindPts(); };
  }
  if(typeof showTab === 'function'){
    var show = showTab;
    showTab = function(id){
      var r = show.apply(this, arguments);
      if(id === 'kindness'){ try{ render(); }catch(e){ console.error('[kindness] render:', e); } }
      return r;
    };
  }
  if(typeof window.niyamOpenReview === 'function'){
    var or = window.niyamOpenReview;
    window.niyamOpenReview = function(){ var r = or.apply(this, arguments); try{ renderParent(); load(); }catch(e){ console.error('[kindness] parent:', e); } return r; };
  }
  // Add the tab now, and load once the app has signed in (the bank needs the points).
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureTab); else ensureTab();
  (function wait(n){
    if(typeof _supabase !== 'undefined' && _supabase && (typeof dbReady === 'undefined' || dbReady)){ load(); return; }
    if(n < 120) setTimeout(function(){ wait(n + 1); }, 500);
  })(0);

  window.niyamKindness = { render: render, reload: load, state: function(){ return K; } };
})();
