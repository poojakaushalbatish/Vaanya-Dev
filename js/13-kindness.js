// ============================================================================
// NIYAM — js/13-kindness.js
// Today's Act of Kindness: a bar under the timetable on the Daily Report
// (Pooja, 22 Oct 2026 — this replaced the separate Kindness tab).
// Loads after js/12-star-bank.js and data/kindness-missions.js.
//
//   • Every day one act of kindness is wrapped as a surprise. The child taps to
//     reveal it, does it, and taps "I did it" ("Not yet" undoes a mistaken tap
//     until the parent has checked). Tomorrow brings a new surprise.
//   • School days: a small 5–10 minute act (NIYAM_KINDNESS_DAILY);
//     weekends and holidays: a bigger act (NIYAM_KINDNESS).
//   • The parent checks it in the Parent Zone and gives 5 / 10 / 15 / 20 points
//     on school days, 10 to 50 on weekends — or "Not done yet".
//   • Approved points are added to the child's bank (totalEarned).
//
// Saved in the Supabase table `kindness` (star-bank-and-kindness.sql), one row
// per act done: week = the date, mission = the act id ('d07', 'k12'), status
// 'done' | 'confirmed' | 'redo', pts. Older rows from the first Kindness tab
// (weekly missions, 'little:' acts) still count in the bank.
// ============================================================================
(function(){
  'use strict';

  var SCALE_SCHOOL = [5, 10, 15, 20], SCALE_WEEKEND = [10, 20, 30, 40, 50];
  var EPOCH = '2026-01-05';                       // a Monday: the count of days starts here
  var K = { rows:null, loading:false, busy:false, missing:false };

  // ---- helpers ---------------------------------------------------------------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function today(){ return new Date().toLocaleDateString('en-CA'); }
  function dateOpen(){ return ($('rpt-date') && $('rpt-date').value) || today(); }
  function days(){ return (typeof savedDays !== 'undefined' && Array.isArray(savedDays)) ? savedDays : []; }
  function toastMsg(m){ if(typeof toast === 'function') toast(m); }
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function fmtDay(d){ var p = String(d || '').split('-'), x = new Date(d + 'T12:00:00'); return p.length === 3 ? DAYS[x.getDay()] + ' ' + (+p[2]) + ' ' + MONTHS[(+p[1]) - 1] : ''; }
  function big(){ return window.NIYAM_KINDNESS || []; }
  function small(){ return window.NIYAM_KINDNESS_DAILY || []; }
  function findAct(id){ return small().find(function(a){ return a.id === id; }) || big().find(function(a){ return a.id === id; }) || null; }
  function isWeekendAct(id){ return /^k/.test(id || ''); }

  // Weekend or holiday? Same rule as the timetable for the day that is open.
  function weekendDay(date){
    if(date === dateOpen() && typeof ttIsWeekendSchedule === 'function'){ try{ return !!ttIsWeekendSchedule(); }catch(e){} }
    var g = new Date(date + 'T12:00:00').getDay(); return g === 0 || g === 6;
  }
  // The act for a date: school days walk through the 60 small acts, weekends through the 52 big ones.
  function actFor(date){
    var diff = Math.round((new Date(date + 'T12:00:00') - new Date(EPOCH + 'T12:00:00')) / 86400000);
    if(diff < 0) diff = 0;
    var weeks = Math.floor(diff / 7), rest = diff % 7;
    if(weekendDay(date)){
      var n = weeks * 2 + Math.max(0, rest - 5), B = big();
      return B.length ? B[n % B.length] : null;
    }
    var m = weeks * 5 + Math.min(rest, 5), S = small();
    return S.length ? S[m % S.length] : null;
  }

  // ---- what is saved ---------------------------------------------------------------
  function rows(){ return K.rows || []; }
  function rowFor(date){ return rows().filter(function(r){ return r.week === date && !/^little:/.test(r.mission || ''); }).sort(function(a, b){ return String(b.id) > String(a.id) ? 1 : -1; })[0] || null; }
  function kindPts(){ return rows().reduce(function(a, r){ return a + (r.status === 'confirmed' ? (+r.pts || 0) : 0); }, 0); }
  function kindCount(){ return rows().filter(function(r){ return r.status === 'confirmed'; }).length; }
  function approvedDay(date){ var rec = days().find(function(d){ return d.date === date; }); return !!(rec && rec.approved === true); }
  // Revealing is remembered on this device only (a small convenience; nothing depends on it).
  function revealed(date){ try{ return localStorage.getItem('niyam_kind_open') === date; }catch(e){ return false; } }
  function setRevealed(date){ try{ localStorage.setItem('niyam_kind_open', date); }catch(e){} }

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
    render(); renderParent();
  }

  // ---- styles -------------------------------------------------------------------------
  var CSS = ''
  + '#kd-bar{--ink:#132B2A;--soft:#557371;--teal:#0F766E;--deep:#0B4F4A;font-family:Nunito,system-ui,sans-serif;color:var(--ink);margin:16px 0 8px;box-sizing:border-box}'
  + '#kd-bar *{box-sizing:border-box}'
  + '#kd-bar button{font-family:inherit;cursor:pointer}'
  + '#kd-bar .f{font-family:Fredoka,Nunito,sans-serif}'
  + '#kd-bar .cap{font-size:11.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}'
  + '#kd-bar .wrap{position:relative;overflow:hidden;border-radius:22px;border:2px solid #F5D48A;background:linear-gradient(120deg,#FFF8E1,#FFFDF5 55%,#EFFAF7)}'
  + '#kd-bar .closed{display:flex;align-items:center;gap:14px;width:100%;border:0;background:transparent;padding:16px 18px;text-align:left;color:var(--ink)}'
  + '#kd-bar .gift{flex:0 0 auto;width:64px;height:64px;border-radius:18px;background:linear-gradient(160deg,#0F766E,#14B8A6);display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:0 6px 16px rgba(15,118,110,.3);animation:kdShake 2.6s ease-in-out infinite}'
  + '#kd-bar .closed h3{margin:2px 0 0;font-family:Fredoka,sans-serif;font-weight:700;font-size:21px;line-height:1.15}'
  + '#kd-bar .tap{margin-left:auto;flex:0 0 auto;background:var(--teal);color:#fff;border-radius:99px;padding:9px 16px;font-family:Fredoka,sans-serif;font-weight:600;font-size:15px;box-shadow:0 4px 0 var(--deep)}'
  + '#kd-bar .gift,#kd-bar .em{position:relative}'
  + '#kd-bar .spk{position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:50%;background:linear-gradient(160deg,#FBBF24,#F59E0B);color:#fff;font-size:13px;line-height:1;'
  +   'display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 3px 8px rgba(217,119,6,.45);animation:kdSpk 2.2s ease-in-out infinite}'
  + '#kd-bar .open{display:flex;gap:14px;align-items:flex-start;padding:16px 18px;animation:kdOpen .5s cubic-bezier(.2,1.4,.4,1)}'
  + '#kd-bar .em{flex:0 0 auto;width:64px;height:64px;border-radius:18px;background:#fff;border:2px solid #F5D48A;display:flex;align-items:center;justify-content:center;font-size:36px}'
  + '#kd-bar .open h3{margin:2px 0 0;font-family:Fredoka,sans-serif;font-weight:700;font-size:21px;line-height:1.2}'
  + '#kd-bar .how{margin-top:4px;font-weight:700;font-size:14.5px;line-height:1.45}'
  + '#kd-bar ol{margin:6px 0 0 18px;padding:0;font-weight:700;font-size:14px;line-height:1.5}'
  + '#kd-bar .why{margin-top:6px;font-weight:700;font-size:13px;color:var(--soft)}'
  + '#kd-bar .grown{display:inline-block;margin-top:6px;background:#FDF3D3;color:#7A5300;border-radius:99px;padding:3px 10px;font-weight:800;font-size:12px}'
  + '#kd-bar .acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center}'
  + '#kd-bar .btn{border:0;border-radius:14px;min-height:46px;padding:8px 18px;font-family:Fredoka,sans-serif;font-weight:600;font-size:17px;color:#fff;background:var(--teal);box-shadow:0 4px 0 var(--deep)}'
  + '#kd-bar .btn.ghost{background:#fff;color:var(--soft);border:2px solid #D6EDE8;box-shadow:none;font-size:14px;min-height:40px}'
  + '#kd-bar .btn[disabled]{opacity:.5}'
  + '#kd-bar .state{margin-top:10px;border-radius:14px;padding:10px 12px;font-weight:800;font-size:14px;line-height:1.45}'
  + '#kd-bar .foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;border-top:1.5px dashed #F5D48A;padding:9px 18px;font-weight:800;font-size:12.5px;color:var(--soft)}'
  + '@keyframes kdShake{0%,80%,100%{transform:rotate(0)}84%{transform:rotate(-10deg)}88%{transform:rotate(9deg)}92%{transform:rotate(-6deg)}96%{transform:rotate(4deg)}}'
  + '@keyframes kdSpk{0%,100%{transform:scale(.9) rotate(0)}50%{transform:scale(1.12) rotate(20deg)}}'
  + '@keyframes kdTw{0%,100%{opacity:.15;transform:scale(.6)}50%{opacity:1;transform:scale(1.1)}}'
  + '@keyframes kdOpen{0%{transform:scale(.9);opacity:0}100%{transform:none;opacity:1}}'
  + '@media (prefers-reduced-motion:reduce){#kd-bar *{animation:none!important}}'
  + '@media (max-width:560px){#kd-bar .closed{flex-wrap:wrap}#kd-bar .tap{margin-left:78px}}';

  function addStyles(){
    if($('kd-style')) return;
    var st = document.createElement('style'); st.id = 'kd-style'; st.textContent = CSS; document.head.appendChild(st);
    if(!document.querySelector('link[data-sb-font]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-sb-font', '1');
      l.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800;900&display=swap';
      document.head.appendChild(l);
    }
  }
  // The bar sits right after the timetable blocks (or on the side of the Today page).
  function bar(){
    var tt = $('tt-blocks-container'); if(!tt || !tt.parentNode) return null;
    var b = $('kd-bar');
    if(!b){ addStyles(); b = document.createElement('div'); b.id = 'kd-bar'; b.addEventListener('click', onClick); }
    var slot = $('td-kind-slot');                  // the Today page (js/14-today.js) gives it a place on the side
    if(slot){ if(b.parentNode !== slot) slot.appendChild(b); }
    else if(b.previousElementSibling !== tt) tt.parentNode.insertBefore(b, tt.nextSibling);
    return b;
  }

  // ---- the bar ---------------------------------------------------------------------------
  function render(){
    var b = bar(); if(!b) return;
    var date = dateOpen(), isToday = date === today(), act = actFor(date), row = rowFor(date), wk = weekendDay(date);
    if(!act){ b.innerHTML = ''; return; }
    var scale = wk ? '10 to 50 points' : '5 to 20 points';
    var sparks = '', spk = '<span class="spk">✦</span>';   // a golden sparkle badge on the gift's corner (by design)
    var foot = '<div class="foot"><span>💛 ' + kindCount() + ' kind ' + (kindCount() === 1 ? 'act' : 'acts') + ' · ⭐ ' + kindPts().toLocaleString('en-IN') + ' points from kindness</span>'
      + '<span>' + (isToday ? 'Tomorrow brings a new surprise 🎁' : fmtDay(date)) + '</span></div>';
    if(K.missing){ b.innerHTML = '<div class="wrap"><div class="closed" style="cursor:default"><div class="gift">🎁</div><div><div class="cap" style="color:var(--teal)">Today’s Act of Kindness</div><h3>Almost ready</h3><div class="how">Ask your parent to finish the setup (one step in Supabase).</div></div></div></div>'; return; }
    var open = row || revealed(date) || !isToday;
    if(!open){
      b.innerHTML = '<div class="wrap">' + sparks + '<button class="closed" data-act="reveal"><div class="gift">🎁' + spk + '</div><div style="min-width:0">'
        + '<div class="cap" style="color:var(--teal)">Today’s Act of Kindness' + (wk ? ' · weekend special' : '') + '</div>'
        + '<h3>A surprise is waiting for you!</h3><div class="how" style="color:var(--soft)">Tap to find out today’s kind deed · ' + scale + '</div></div>'
        + '<span class="tap">Open it ✨</span></button>' + foot + '</div>';
      return;
    }
    var h = '<div class="wrap">' + sparks + '<div class="open"><div class="em">' + act.em + spk + '</div><div style="flex:1;min-width:0">'
      + '<div class="cap" style="color:var(--teal)">' + (isToday ? 'Today’s' : fmtDay(date) + ' ·') + ' Act of Kindness' + (wk ? ' · weekend special' : '') + '</div>'
      + '<h3>' + esc(act.title) + '</h3>'
      + (act.how ? '<div class="how">' + esc(act.how) + '</div>' : '')
      + (act.steps ? '<ol>' + act.steps.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '')
      + (act.why ? '<div class="why">💡 ' + esc(act.why) + '</div>' : '')
      + (act.grownup ? '<span class="grown">👨‍👩‍👧 Do this one with a grown-up</span>' : '');
    if(row && row.status === 'confirmed'){
      h += '<div class="state" style="background:#FFFBEB;color:#7A5300;border:2px solid #FCE7A8">🌟 Your parent gave you <b>' + (+row.pts || 0) + ' points</b> for this kindness. Wonderful!</div>';
    } else if(row && row.status === 'done'){
      h += '<div class="state" style="background:#ECFAF6;color:var(--deep);border:2px solid #BFE9E1">✓ Done — what a kind heart! Your parent will check and give ' + scale + '.</div>';
      if(isToday && !approvedDay(date)) h += '<div class="acts"><button class="btn ghost" data-act="undo"' + (K.busy ? ' disabled' : '') + '>Not yet — I tapped by mistake</button></div>';
    } else if(isToday && !approvedDay(date)){
      if(row && row.status === 'redo') h += '<div class="state" style="background:#FDF3D3;color:#7A5300">Your parent asked you to give it another try. You can do it! 💪</div>';
      h += '<div class="acts"><button class="btn" data-act="did"' + (K.busy || K.rows === null ? ' disabled' : '') + '>✓ I did it!</button>'
        + '<span style="font-weight:700;font-size:13px;color:var(--soft)">Your parent will check and give ' + scale + '.</span></div>';
    } else {
      h += '<div class="state" style="background:#F1F5F4;color:var(--soft)">This day’s act was not marked as done.</div>';
    }
    b.innerHTML = h + '</div></div>' + foot + '</div>';
  }

  async function onClick(e){
    var t = e.target.closest('[data-act]'); if(!t || t.disabled || K.busy) return;
    var act = t.getAttribute('data-act'), date = today(), res;
    if(act === 'reveal'){ setRevealed(dateOpen()); render(); return; }
    if(act === 'did'){
      var a = actFor(date); if(!a) return;
      var cur = rowFor(date);
      var row = { week:date, mission:a.id, note:null, status:'done', pts:0, done_at:new Date().toISOString() };
      K.busy = true; render();
      try{ res = (cur && cur.status === 'redo') ? await _supabase.from('kindness').update(row).eq('id', cur.id).select() : await _supabase.from('kindness').insert(row).select(); }
      catch(err){ res = { error:err }; }
      K.busy = false;
      if(res.error){ render(); toastMsg('⚠️ Could not save — check the internet and try again.'); console.warn('[kindness] save:', res.error); return; }
      var saved = (res.data && res.data[0]) || row;
      K.rows = rows().filter(function(x){ return !cur || x.id !== cur.id; }).concat([saved]);
      render(); renderParent();
      toastMsg('💛 Wonderful! Your parent will check it.');
      return;
    }
    if(act === 'undo'){
      var r = rowFor(date); if(!r || r.status !== 'done') return;
      K.busy = true; render();
      try{ res = await _supabase.from('kindness').delete().eq('id', r.id); }catch(err){ res = { error:err }; }
      K.busy = false;
      if(res.error){ render(); toastMsg('⚠️ Could not undo — check the internet.'); return; }
      K.rows = rows().filter(function(x){ return x.id !== r.id; });
      render(); renderParent();
    }
  }

  // ---- parent side: kindness to check -----------------------------------------------------
  function renderParent(){
    var host = typeof window.niyamParentFamilyHost === 'function' ? window.niyamParentFamilyHost() : null;
    if(!host) return;
    var box = $('pz-kindness');
    if(!box){ box = document.createElement('div'); box.id = 'pz-kindness'; host.insertBefore(box, host.firstChild); box.addEventListener('click', onParent); }
    var wait = rows().filter(function(r){ return r.status === 'done'; }).sort(function(a, b){ return a.week < b.week ? -1 : 1; });
    var h = '<div class="pz-card"><div class="pz-h"><span>💛 Kindness to check</span></div>';
    if(K.missing) h += '<div class="pz-note">Kindness needs a one-time Supabase step: run <b>star-bank-and-kindness.sql</b> in the SQL Editor.</div>';
    else if(K.rows === null) h += '<div class="pz-note">Loading…</div>';
    else if(!wait.length) h += '<div class="pz-note">Nothing to check. When your child does today’s Act of Kindness, it appears here for you to give points.</div>';
    wait.forEach(function(r){
      var little = /^little:/.test(r.mission || ''), a = little ? { em:'🤲', title:'Little kindness: ' + r.mission.slice(7) } : (findAct(r.mission) || { em:'💛', title:'Act of kindness' });
      var scale = little ? [5] : (isWeekendAct(r.mission) ? SCALE_WEEKEND : SCALE_SCHOOL);
      h += '<div class="pz-row" style="align-items:flex-start"><span class="pz-e">' + a.em + '</span><div style="flex:1;min-width:200px"><b>' + esc(a.title) + '</b>'
        + '<small>' + fmtDay(r.week) + (isWeekendAct(r.mission) ? ' · weekend act' : '') + ' · your child says it is done</small>'
        + '<div style="margin-top:8px;font-size:12.5px;font-weight:800;color:#557371">How well was it done? Give points:</div>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + scale.map(function(p){ return '<button class="pz-btn ok" data-kz="give" data-id="' + esc(r.id) + '" data-p="' + p + '">+' + p + '</button>'; }).join('')
        + '<button class="pz-btn" data-kz="redo" data-id="' + esc(r.id) + '">Not done yet</button></div></div></div>';
    });
    box.innerHTML = h + '</div>';
  }
  async function onParent(e){
    var b = e.target.closest('[data-kz]'); if(!b || b.disabled) return;
    var id = b.getAttribute('data-id'), r = rows().find(function(x){ return String(x.id) === id; }); if(!r) return;
    var patch = b.getAttribute('data-kz') === 'give' ? { status:'confirmed', pts:+b.getAttribute('data-p') || 0, confirmed_at:new Date().toISOString() } : { status:'redo' };
    Array.prototype.forEach.call(b.closest('.pz-row').querySelectorAll('button'), function(x){ x.disabled = true; });
    var res = await _supabase.from('kindness').update(patch).eq('id', r.id);
    if(res.error){ alert('Could not save: ' + res.error.message); renderParent(); return; }
    Object.assign(r, patch);
    try{ if(typeof updateTopBar === 'function') updateTopBar(); }catch(err){}
    renderParent(); render();
  }

  // ---- connections -----------------------------------------------------------------------------
  // Approved kindness points count in the child's bank.
  if(typeof totalEarned === 'function'){
    var te = totalEarned;
    totalEarned = function(){ return te.apply(this, arguments) + kindPts(); };
  }
  // Redraw with the timetable (a new day, a holiday switch, a reload of the day).
  if(typeof ttRender === 'function'){
    var tr = ttRender;
    ttRender = function(){ var r = tr.apply(this, arguments); try{ render(); }catch(e){ console.error('[kindness] render:', e); } return r; };
  }
  ['loadDraftDay', 'loadApprovedDay'].forEach(function(fn){
    if(typeof window[fn] !== 'function') return;
    var orig = window[fn];
    window[fn] = function(){ var r = orig.apply(this, arguments); try{ render(); }catch(e){} return r; };
  });
  if(typeof window.niyamOpenReview === 'function'){
    var or = window.niyamOpenReview;
    window.niyamOpenReview = function(){ var r = or.apply(this, arguments); try{ renderParent(); load(); }catch(e){ console.error('[kindness] parent:', e); } return r; };
  }
  // Load once the app has signed in (the bank needs the points).
  (function wait(n){
    if(typeof _supabase !== 'undefined' && _supabase && (typeof dbReady === 'undefined' || dbReady)){ load(); return; }
    if(n < 120) setTimeout(function(){ wait(n + 1); }, 500);
  })(0);

  window.niyamKindness = { render: render, reload: load, state: function(){ return K; }, actFor: actFor };
})();
