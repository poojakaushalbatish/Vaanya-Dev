// ============================================================================
// NIYAM — js/13-kindness.js
// The Kindness Mission tab (new, 22 Oct 2026) and the parent's check.
// Loads after js/12-star-bank.js and data/kindness-missions.js.
//
//   • One mission a week (Monday to Sunday), done on any day. Only the
//     current mission is shown; the next one is revealed on Monday. A week
//     that is missed keeps the same mission, so none is skipped.
//   • The child taps "I did it!" and writes what they did. The parent checks
//     it in the Parent Zone and gives 10–50 points (or asks them to try again).
//   • Points from kindness are added to the child's bank (totalEarned).
//   • "Little kindness, every day": small things to tick, no points. Saved with
//     the day as kindTicksJSON.
//
// Missions: data/kindness-missions.js. Saved in the Supabase table `kindness`
// (week = the Monday, mission = mission id, note, status 'done' | 'confirmed'
// | 'redo', pts) — see star-bank-and-kindness.sql.
// ============================================================================
(function(){
  'use strict';

  var LITTLE = [['thanks','Said thank you'],['table','Helped set the table'],['share','Shared something'],['friend','Helped a friend'],
                ['smile','Made someone smile'],['elder','Called or helped an elder'],['tidy','Tidied up without being asked'],['sorry','Said sorry when I was wrong']];
  var SCALE = [10, 20, 30, 40, 50];
  var K = { rows:null, loading:false, form:false, note:'', busy:false, ticks:null, ticksDate:'' };

  // ---- helpers ---------------------------------------------------------------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function missions(){ return (window.NIYAM_KINDNESS && window.NIYAM_KINDNESS.length) ? window.NIYAM_KINDNESS : []; }
  function byId(id){ return missions().find(function(m){ return m.id === id; }); }
  function today(){ return new Date().toLocaleDateString('en-CA'); }
  function dateOpen(){ return ($('rpt-date') && $('rpt-date').value) || today(); }
  function days(){ return (typeof savedDays !== 'undefined' && Array.isArray(savedDays)) ? savedDays : []; }
  function parse(s){ try{ var v = JSON.parse(s); return (v && typeof v === 'object') ? v : null; }catch(e){ return null; } }
  function childName(){ return window.niyamChildName || ''; }
  function toastMsg(m){ if(typeof toast === 'function') toast(m); }
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(d){ var p = String(d || '').split('-'); return p.length === 3 ? (+p[2]) + ' ' + MONTHS[(+p[1]) - 1] : ''; }
  function monday(ds){ var d = new Date((ds || today()) + 'T12:00:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.toLocaleDateString('en-CA'); }
  function addDays(ds, n){ var d = new Date(ds + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); }

  // ---- this week's mission -------------------------------------------------------
  function rows(){ return K.rows || []; }
  function thisWeek(){ var w = monday(); return rows().filter(function(r){ return r.week === w; }).sort(function(a, b){ return (b.id || 0) - (a.id || 0); })[0] || null; }
  function current(){
    var w = monday(), row = thisWeek();
    if(row && byId(row.mission)) return { m:byId(row.mission), row:row };
    var done = rows().filter(function(r){ return r.week < w && (r.status === 'done' || r.status === 'confirmed'); }).length;
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

  // ---- little kindness ticks (saved with the day) ----------------------------------
  function ticks(){
    var date = dateOpen();
    if(K.ticksDate !== date){
      var rec = days().find(function(d){ return d.date === date; });
      K.ticks = parse(rec && rec.kindTicksJSON) || {}; K.ticksDate = date;
    }
    return K.ticks;
  }
  function approved(){ var rec = days().find(function(d){ return d.date === dateOpen(); }); return !!(rec && rec.approved === true); }

  // ---- styles -------------------------------------------------------------------------
  var CSS = ''
  + '#kd-root{--ink:#24163F;--soft:#6E6488;--line:#FFE0EA;--pink:#E8467C;--rose:#B8336A;font-family:Nunito,system-ui,sans-serif;color:var(--ink);background:#FFF7FA;border-radius:24px;padding:14px;max-width:1240px;margin:0 auto;box-sizing:border-box}'
  + '#kd-root *{box-sizing:border-box}'
  + '#kd-root button{font-family:inherit;cursor:pointer}'
  + '#kd-root .f{font-family:Fredoka,Nunito,sans-serif}'
  + '#kd-root .cap{font-size:11.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}'
  + '#kd-root .lay{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"hero" "mission" "wall" "little"}'
  + '#kd-root .a-hero{grid-area:hero} #kd-root .a-mission{grid-area:mission} #kd-root .a-wall{grid-area:wall} #kd-root .a-little{grid-area:little}'
  + '#kd-root .kh{position:relative;overflow:hidden;border-radius:26px;padding:20px;color:#fff;background:radial-gradient(110% 90% at 100% 0%,#FFB4A2,rgba(255,180,162,0) 50%),linear-gradient(160deg,#B8336A,#E8467C 60%,#FF8A5B)}'
  + '#kd-root .kh .ht{position:absolute;font-size:18px;animation:kdFloat 6s linear infinite;opacity:0}'
  + '#kd-root .kh>.in{position:relative}'
  + '#kd-root .kh .cap{color:#FFE0EA}'
  + '#kd-root .kh h1{font-family:Fredoka,sans-serif;font-weight:700;font-size:30px;margin:4px 0 0;line-height:1.1;color:#fff}'
  + '#kd-root .chip{display:inline-block;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:99px;padding:5px 12px;font-weight:800;font-size:12.5px;margin:12px 6px 0 0}'
  + '#kd-root .card{background:#fff;border-radius:22px;padding:16px;margin-top:14px;border:2px solid var(--line)}'
  + '#kd-root .mission{background:#fff;border-radius:24px;padding:18px;margin-top:14px;box-shadow:0 14px 34px rgba(184,51,106,.14);border:2px solid #FFD3E1;position:relative;overflow:hidden}'
  + '#kd-root .mission .em{width:80px;height:80px;border-radius:24px;background:#FFE8EF;display:flex;align-items:center;justify-content:center;font-size:46px;transform:rotate(-6deg);flex:0 0 auto;animation:kdWiggle 3.5s ease-in-out infinite}'
  + '#kd-root .mission h2{margin:4px 0 0;font-family:Fredoka,sans-serif;font-weight:700;font-size:24px;line-height:1.15;color:var(--ink)}'
  + '#kd-root .steps{margin:12px 0 0;padding:0;list-style:none;counter-reset:s}'
  + '#kd-root .steps li{counter-increment:s;position:relative;padding-left:34px;margin-top:9px;font-weight:700;line-height:1.45}'
  + '#kd-root .steps li::before{content:counter(s);position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:var(--pink);color:#fff;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center}'
  + '#kd-root .why{background:#FFF5F8;border-radius:16px;padding:12px 14px;margin-top:14px;font-weight:700;font-size:14px;line-height:1.45}'
  + '#kd-root .grown{display:inline-block;margin-top:10px;background:#EEF2FF;color:#3730A3;border-radius:99px;padding:4px 12px;font-weight:800;font-size:12.5px}'
  + '#kd-root .btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;border:0;border-radius:16px;font-family:Fredoka,sans-serif;font-weight:600;font-size:18px;color:#fff;background:var(--pink);margin-top:14px;box-shadow:0 5px 0 #B8336A}'
  + '#kd-root .btn.ghost{background:#fff;color:var(--ink);border:2px solid var(--line);box-shadow:none}'
  + '#kd-root .btn[disabled]{opacity:.5}'
  + '#kd-root textarea{width:100%;min-height:96px;border:2px solid #FFD3E1;border-radius:14px;padding:12px;font-family:Nunito,sans-serif;font-size:16px;font-weight:700;color:var(--ink);resize:vertical;outline:none;margin-top:10px}'
  + '#kd-root textarea:focus{border-color:var(--pink)}'
  + '#kd-root .state{margin-top:14px;border-radius:16px;padding:12px 14px;font-weight:800;line-height:1.45}'
  + '#kd-root .next{margin-top:14px;border:2px dashed #F5B5CB;border-radius:20px;padding:16px;text-align:center;background:repeating-linear-gradient(-45deg,#fff 0 10px,#FFF5F8 10px 20px)}'
  + '#kd-root .next .lock{font-size:34px;animation:kdBob 2.2s ease-in-out infinite;display:inline-block}'
  + '#kd-root .wall{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}'
  + '#kd-root .heart{background:#fff;border-radius:18px;border:2px solid var(--line);padding:10px 6px;text-align:center;font-weight:800;font-size:11.5px;line-height:1.25;color:#7A2E4F}'
  + '#kd-root .heart b{display:block;font-size:26px;margin-bottom:2px}'
  + '#kd-root .heart span{color:#B48AA0}'
  + '#kd-root .heart.empty{border-style:dashed;color:#D9B3C4;background:transparent}'
  + '#kd-root .heart.empty b{animation:kdBeat 1.6s ease-in-out infinite}'
  + '#kd-root .little{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}'
  + '#kd-root .little button{background:#fff;border:1.5px solid #FFD3E1;border-radius:99px;padding:8px 13px;font-weight:800;font-size:13.5px;color:#7A2E4F}'
  + '#kd-root .little button.on{background:var(--pink);color:#fff;border-color:var(--pink);animation:kdPop .3s}'
  + '#kd-root .little button[disabled]{cursor:default}'
  + '@keyframes kdFloat{0%{transform:translateY(20px) scale(.6);opacity:0}20%{opacity:.9}100%{transform:translateY(-120px) scale(1.1);opacity:0}}'
  + '@keyframes kdWiggle{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(4deg)}}'
  + '@keyframes kdBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'
  + '@keyframes kdBeat{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}'
  + '@keyframes kdPop{0%{transform:scale(.9)}60%{transform:scale(1.08)}100%{transform:scale(1)}}'
  + '@media (prefers-reduced-motion:reduce){#kd-root *{animation:none!important}}'
  + '@media (min-width:820px){'
  +   '#kd-root{padding:24px 26px}'
  +   '#kd-root .lay{grid-template-columns:360px minmax(0,1fr);grid-template-areas:"hero mission" "little mission" "little wall";grid-template-rows:auto auto 1fr;column-gap:24px;align-items:start}'
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
        b.setAttribute('onclick', "showTab('kindness',this)"); b.textContent = '💗 Kindness';
        rb.parentNode.insertBefore(b, rb.nextSibling);
      }
    }
    return tab;
  }
  function root(){
    var tab = ensureTab(); if(!tab) return null;
    var r = $('kd-root');
    if(!r){ addStyles(); r = document.createElement('div'); r.id = 'kd-root'; tab.appendChild(r); r.addEventListener('click', onClick); r.addEventListener('input', onInput); }
    return r;
  }

  // ---- the page ---------------------------------------------------------------------------
  function heroHtml(){
    var conf = rows().filter(function(r){ return r.status === 'confirmed'; });
    var hearts = ''; for(var i = 0; i < 7; i++) hearts += '<span class="ht" style="left:' + (10 + i * 12) + '%;bottom:0;animation-delay:' + (i * 0.85).toFixed(2) + 's">' + (i % 2 ? '💗' : '✨') + '</span>';
    return '<div class="kh">' + hearts + '<div class="in"><div class="cap">' + (childName() ? esc(childName()) + '’s ' : 'My ') + 'Kindness Mission</div>'
      + '<h1>Small acts,<br>big hearts 💗</h1>'
      + '<span class="chip">💗 ' + conf.length + ' kind ' + (conf.length === 1 ? 'act' : 'acts') + '</span>'
      + '<span class="chip">⭐ ' + kindPts().toLocaleString('en-IN') + ' points from kindness</span></div></div>';
  }
  function missionHtml(){
    if(K.missing) return '<div class="mission"><div class="f" style="font-size:22px;font-weight:700">Kindness Missions are almost ready</div><div class="why">Ask your parent to finish the setup (one step in Supabase). Then your first mission will appear here.</div></div>';
    if(K.rows === null) return '<div class="mission"><div class="f" style="font-size:20px;font-weight:700">Opening your mission…</div></div>';
    var c = current(), m = c.m, row = c.row;
    if(!m) return '';
    var mon = monday(), sun = addDays(mon, 6);
    var h = '<div class="mission"><div style="display:flex;gap:14px;align-items:center"><div class="em">' + m.em + '</div><div style="flex:1;min-width:0">'
      + '<div class="cap" style="color:var(--pink)">This week’s mission · ' + fmt(mon) + '–' + fmt(sun) + '</div><h2>' + esc(m.title) + '</h2>'
      + '<div style="font-weight:800;color:var(--soft);font-size:13px;margin-top:4px">Do it any day this week · 10 to 50 points</div></div></div>'
      + '<ol class="steps">' + m.steps.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'
      + (m.grownup ? '<span class="grown">👨‍👩‍👧 Do this one with a grown-up</span>' : '')
      + '<div class="why"><b style="color:var(--rose)">Why it matters:</b> ' + esc(m.why) + '</div>';
    if(row && row.status === 'confirmed'){
      h += '<div class="state" style="background:#DCFCE7;color:#166534">🎉 Mission complete! Your parent gave you <b>' + (+row.pts || 0) + ' points</b>.' + (row.note ? '<br><span style="font-weight:700;color:#3F6212">“' + esc(row.note) + '”</span>' : '') + '</div>';
    } else if(row && row.status === 'done'){
      h += '<div class="state" style="background:#FFF3C4;color:#7A5300">💗 Done! Waiting for your parent to check and give the points.<br><span style="font-weight:700">“' + esc(row.note || '') + '”</span></div>';
    } else if(approved() && dateOpen() !== today()){
      h += '';
    } else if(K.form){
      h += '<div style="margin-top:14px;font-weight:900">Tell your parent what you did</div>'
        + '<textarea id="kd-note" placeholder="For example: I made a card for our guard uncle and gave it to him. He smiled a lot!">' + esc(K.note) + '</textarea>'
        + '<button class="btn" data-act="send"' + (K.note.trim().length >= 10 && !K.busy ? '' : ' disabled') + '>' + (K.busy ? 'Sending…' : '💗 Send to my parent') + '</button>'
        + '<button class="btn ghost" data-act="cancel">Not yet</button>';
    } else {
      if(row && row.status === 'redo') h += '<div class="state" style="background:#EEF2FF;color:#3730A3">Your parent asked you to give this one another try. You can do it! 💪</div>';
      h += '<button class="btn" data-act="did">💗 I did it! Tell my parent</button>'
        + '<div style="text-align:center;font-weight:700;color:var(--soft);font-size:13px;margin-top:8px">Your parent will check and give the points.</div>';
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
    var done = rows().filter(function(r){ return r.status === 'confirmed' || r.status === 'done'; }).slice().reverse();
    var h = '<div class="cap" style="color:var(--rose);margin-top:22px">My kindness wall</div><div class="wall">';
    done.forEach(function(r){ var m = byId(r.mission) || { em:'💗', title:'Kindness mission' };
      h += '<div class="heart"><b>' + m.em + '</b>' + esc(m.title) + '<br><span>Week of ' + fmt(r.week) + (r.status === 'done' ? ' · waiting' : '') + '</span></div>'; });
    var empty = Math.max(2, 4 - done.length % 4);
    for(var i = 0; i < empty; i++) h += '<div class="heart empty"><b>💗</b>' + (i === 0 ? (done.length ? 'Your next heart' : 'Your first heart') : '&nbsp;') + '</div>';
    return h + '</div>';
  }
  function littleHtml(){
    var t = ticks(), ro = approved(), n = Object.keys(t).filter(function(k){ return t[k]; }).length;
    var h = '<div class="card"><div class="cap" style="color:var(--rose)">Little kindness, every day</div>'
      + '<div style="font-size:13px;font-weight:700;color:var(--soft);margin-top:2px">No points — just tick what you did today. It still counts in your heart.</div><div class="little">';
    LITTLE.forEach(function(x){ h += '<button class="' + (t[x[0]] ? 'on' : '') + '" data-act="tick" data-k="' + x[0] + '"' + (ro ? ' disabled' : '') + '>' + (t[x[0]] ? '✓ ' : '') + esc(x[1]) + '</button>'; });
    h += '</div>' + (n ? '<div style="margin-top:10px;font-weight:900;color:var(--rose)">' + n + (n === 1 ? ' little kindness' : ' little kindnesses') + ' today 💗</div>' : '') + '</div>';
    return h;
  }
  function render(){
    var r = root(); if(!r) return;
    var focus = document.activeElement && document.activeElement.id === 'kd-note';
    r.innerHTML = '<div class="lay"><div class="a-hero">' + heroHtml() + '</div><div class="a-mission">' + missionHtml() + '</div>'
      + '<div class="a-wall">' + wallHtml() + '</div><div class="a-little">' + littleHtml() + '</div></div>';
    if(focus){ var n = $('kd-note'); if(n){ n.focus(); n.selectionStart = n.selectionEnd = n.value.length; } }
    if(K.rows === null) load();
  }
  function redraw(){ try{ var t = $('tab-kindness'); if(t && t.classList.contains('active')) render(); }catch(e){ console.error('[kindness] render:', e); } }

  function onInput(e){
    if(e.target.id !== 'kd-note') return;
    K.note = e.target.value;
    var b = document.querySelector('#kd-root [data-act="send"]'); if(b) b.disabled = K.note.trim().length < 10 || K.busy;
  }
  async function onClick(e){
    var b = e.target.closest('[data-act]'); if(!b || b.disabled) return;
    var act = b.getAttribute('data-act');
    if(act === 'did'){ K.form = true; render(); var n = $('kd-note'); if(n) n.focus(); return; }
    if(act === 'cancel'){ K.form = false; render(); return; }
    if(act === 'tick'){
      var k = b.getAttribute('data-k'), t = ticks();
      if(t[k]) delete t[k]; else t[k] = 1;
      render();
      if(dateOpen() === today() && typeof ttQueueSave === 'function') ttQueueSave();
      return;
    }
    if(act === 'send'){
      var c = current(); if(!c.m || K.note.trim().length < 10) return;
      K.busy = true; render();
      var row = { week:monday(), mission:c.m.id, note:K.note.trim(), status:'done', done_at:new Date().toISOString() }, res;
      try{
        if(c.row && c.row.status === 'redo') res = await _supabase.from('kindness').update(row).eq('id', c.row.id).select();
        else res = await _supabase.from('kindness').insert(row).select();
      }catch(err){ res = { error:err }; }
      K.busy = false;
      if(res.error){ render(); toastMsg('⚠️ Could not send — check the internet and try again.'); console.warn('[kindness] save:', res.error); return; }
      var saved = (res.data && res.data[0]) || row;
      K.rows = rows().filter(function(x){ return !c.row || x.id !== c.row.id; }).concat([saved]);
      K.form = false; K.note = '';
      render(); renderParent();
      toastMsg('💗 Sent to your parent. What a kind heart!');
    }
  }

  // ---- parent side: kindness to check -----------------------------------------------------
  function renderParent(){
    var host = typeof window.niyamParentFamilyHost === 'function' ? window.niyamParentFamilyHost() : null;
    if(!host) return;
    var box = $('pz-kindness');
    if(!box){ box = document.createElement('div'); box.id = 'pz-kindness'; host.insertBefore(box, host.firstChild); box.addEventListener('click', onParent); }
    var wait = rows().filter(function(r){ return r.status === 'done'; });
    var h = '<div class="pz-card"><div class="pz-h"><span>💗 Kindness to check</span></div>';
    if(K.missing) h += '<div class="pz-note">Kindness Missions need a one-time Supabase step: run <b>star-bank-and-kindness.sql</b> in the SQL Editor.</div>';
    else if(K.rows === null) h += '<div class="pz-note">Loading…</div>';
    else if(!wait.length) h += '<div class="pz-note">Nothing to check. When your child finishes this week’s Kindness Mission, it appears here for you to confirm and give 10–50 points.</div>';
    wait.forEach(function(r){
      var m = byId(r.mission) || { em:'💗', title:'Kindness mission' };
      h += '<div class="pz-row" style="align-items:flex-start"><span class="pz-e">' + m.em + '</span><div style="flex:1;min-width:200px"><b>' + esc(m.title) + '</b><small>Week of ' + fmt(r.week) + '</small>'
        + '<div style="margin-top:6px;font-weight:700;font-size:14px;background:#FFF5F8;border-radius:10px;padding:8px 10px">“' + esc(r.note || '') + '”</div>'
        + '<div style="margin-top:8px;font-size:12.5px;font-weight:800;color:#6E6488">How kind was it? Give points:</div>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + SCALE.map(function(p){ return '<button class="pz-btn ok" data-kz="give" data-id="' + esc(r.id) + '" data-p="' + p + '">+' + p + '</button>'; }).join('')
        + '<button class="pz-btn" data-kz="redo" data-id="' + esc(r.id) + '">Ask to try again</button></div></div></div>';
    });
    box.innerHTML = h + '</div>';
  }
  async function onParent(e){
    var b = e.target.closest('[data-kz]'); if(!b || b.disabled) return;
    var id = b.getAttribute('data-id'), r = rows().find(function(x){ return String(x.id) === id; }); if(!r) return;
    var give = b.getAttribute('data-kz') === 'give', p = +b.getAttribute('data-p') || 0;
    var patch = give ? { status:'confirmed', pts:p, confirmed_at:new Date().toISOString() } : { status:'redo' };
    Array.prototype.forEach.call(b.parentNode.querySelectorAll('button'), function(x){ x.disabled = true; });
    var res = await _supabase.from('kindness').update(patch).eq('id', r.id);
    if(res.error){ alert('Could not save: ' + res.error.message); renderParent(); return; }
    Object.assign(r, patch);
    try{ if(typeof updateTopBar === 'function') updateTopBar(); }catch(err){}
    renderParent(); redraw();
  }

  // ---- connections -----------------------------------------------------------------------------
  // Kindness points count in the child's bank.
  if(typeof totalEarned === 'function'){
    var te = totalEarned;
    totalEarned = function(){ return te.apply(this, arguments) + kindPts(); };
  }
  // The little ticks are saved with the day.
  if(typeof collectFormData === 'function'){
    var collect = collectFormData;
    collectFormData = function(date, pts){
      var d = collect(date, pts);
      try{
        if(K.ticks && K.ticksDate === date) d.kindTicksJSON = JSON.stringify(K.ticks);
        else { var rec = days().find(function(x){ return x.date === date; }); if(rec && rec.kindTicksJSON) d.kindTicksJSON = rec.kindTicksJSON; }
      }catch(e){}
      return d;
    };
  }
  ['loadDraftDay', 'loadApprovedDay'].forEach(function(fn){
    if(typeof window[fn] !== 'function') return;
    var orig = window[fn];
    window[fn] = function(){ var r = orig.apply(this, arguments); K.ticksDate = ''; return r; };
  });
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
  // Add the tab now, and load the missions once the app has signed in (the bank needs the points).
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureTab); else ensureTab();
  (function wait(n){
    if(typeof _supabase !== 'undefined' && _supabase && (typeof dbReady === 'undefined' || dbReady)){ load(); return; }
    if(n < 120) setTimeout(function(){ wait(n + 1); }, 500);
  })(0);

  window.niyamKindness = { render: render, reload: load, state: function(){ return K; } };
})();
