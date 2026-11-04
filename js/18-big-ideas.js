/* NIYAM — Today's Big Idea (Nov 2026)
   One general-knowledge topic a night. Topics come from the Supabase table big_ideas
   (one row per class and day; new months are a CSV import). data/big-ideas.js is only
   a fallback if the table cannot be read.
   The child writes what they know or think, submits, and only then reads "The facts".
   Then they explain it to a parent and tick the second task.
   Timetable tasks are marked in the class timetable: bigidea:'write' (ticked by Submit)
   and bigidea:'teach' (opens only after writing). What the child wrote is saved with the
   day as bigIdeaJSON and shown to the parent in the Parent Zone report. */
(function(){
  'use strict';
  if(window.__niyamBigIdea) return; window.__niyamBigIdea = true;

  var MEM = {};                // date -> state for days touched in this visit
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function parse(s){ try{ var v = typeof s === 'string' ? JSON.parse(s) : s; return (v && typeof v === 'object') ? v : null; }catch(e){ return null; } }
  function today(){ return new Date().toLocaleDateString('en-CA'); }
  function dateOpen(){ return ($('rpt-date') && $('rpt-date').value) || today(); }
  function days(){ return (typeof savedDays !== 'undefined' && Array.isArray(savedDays)) ? savedDays : []; }
  function cls(){ return parseInt(String(window.niyamChildClass || '').replace(/\D/g, ''), 10) || 0; }
  // Topics per class, loaded once from the big_ideas table (sorted by day).
  var LIST = {}, LOADING = {}, TRIED = {};
  function fromRow(r){ return { area:r.area || '', title:r.title || '', question:r.question || '', starter:r.starter || '', facts:r.facts || '',
    remember:[r.remember_1, r.remember_2, r.remember_3].filter(function(x){ return x && String(x).trim(); }), dyk:r.dyk || '' }; }
  function load(c){
    c = c || cls(); if(!c) return Promise.resolve();
    if(LIST[c] || TRIED[c]) return Promise.resolve();
    if(LOADING[c]) return LOADING[c];
    LOADING[c] = (async function(){
      try{
        if(typeof _supabase === 'undefined' || !_supabase) return;
        var r = await _supabase.from('big_ideas').select('*').eq('class', c).order('day', { ascending:true });
        if(r.error){ console.warn('[big idea] table:', r.error); return; }
        var rows = (r.data || []).filter(function(x){ return +x.class === c; }).sort(function(a, b){ return a.day - b.day; });   // own class only
        if(rows.length) LIST[c] = rows.map(fromRow);
      }catch(e){ console.warn('[big idea] load:', e); }
      finally{ TRIED[c] = true; LOADING[c] = null; try{ decorate(); }catch(e){} }
    })();
    return LOADING[c];
  }
  function list(){
    var c = cls(); if(LIST[c]) return LIST[c];
    load(c);
    var B = window.NIYAM_BIG_IDEAS || {}; return TRIED[c] ? (B[String(c)] || []) : [];   // the old file, only if the table has nothing
  }
  var MIN_WORDS = { 5:30, 6:40, 7:60, 8:80 };     // Pooja, 3–4 Nov 2026
  function minWords(){ return MIN_WORDS[cls()] || 60; }
  function words(t){ return (String(t || '').match(/[A-Za-zऀ-ॿ0-9]+(?:['’-][A-Za-z]+)*/g) || []).length; }
  function first(){ return String(window.niyamChildName || '').split(' ')[0] || ''; }
  function rec(date){ return days().find(function(d){ return d && d.date === date; }); }
  function approved(date){ var r = rec(date); return !!(r && r.approved === true); }

  // The saved state of a day: { v, cls, day, idx, title, text, words, at, done }
  function state(date){
    if(MEM[date]) return MEM[date];
    var r = rec(date), st = r && parse(r.bigIdeaJSON);
    return st && st.done ? st : null;
  }
  // The child's own Big Idea day: 1 + earlier days written with this class's topics.
  function dayFor(date){
    var n = 0, c = cls();
    days().forEach(function(d){ if(!d || !d.date || d.date >= date) return; var st = parse(d.bigIdeaJSON); if(st && st.done && +st.cls === c) n++; });
    return n + 1;
  }
  function topicFor(date){
    var st = state(date), L = list();
    if(st && +st.cls === cls()){
      var byTitle = -1; L.forEach(function(t, i){ if(byTitle < 0 && t.title === st.title) byTitle = i; });
      if(byTitle >= 0) return { t:L[byTitle], day:st.day, idx:byTitle };
      if(L[st.idx]) return { t:L[st.idx], day:st.day, idx:st.idx };
    }
    if(!L.length) return null;
    var d = dayFor(date), idx = (d - 1) % L.length;
    return { t:L[idx], day:d, idx:idx };
  }

  // ---- the timetable tasks ------------------------------------------------------------
  function findAct(actId){
    try{ var S = ttGetSchedule() || []; for(var i = 0; i < S.length; i++){ var A = S[i].activities || []; for(var j = 0; j < A.length; j++) if(A[j].id === actId) return { b:S[i], a:A[j] }; } }catch(e){}
    return null;
  }
  function actsOfKind(kind){
    var out = []; try{ (ttGetSchedule() || []).forEach(function(b){ (b.activities || []).forEach(function(a){ if(a.bigidea === kind) out.push({ b:b, a:a }); }); }); }catch(e){}
    return out;
  }
  var allowTick = false;
  if(typeof window.ttToggleAct === 'function'){
    var toggle0 = window.ttToggleAct;
    window.ttToggleAct = function(blockId, actId){
      var f = findAct(actId);
      if(f && f.a.bigidea && !allowTick){
        var date = dateOpen(), done = !!state(date);
        if(f.a.bigidea === 'write'){ open(blockId); return; }                     // writing is done in the Big Idea screen
        if(f.a.bigidea === 'teach' && !done){
          if(typeof toast === 'function') toast('💡 First write today’s Big Idea — then explain it to your parent.');
          open(blockId); return;
        }
      }
      return toggle0.apply(this, arguments);
    };
  }
  // Show on the task whether today's Big Idea is written.
  function decorate(){
    var date = dateOpen(), st = state(date), T = topicFor(date);
    actsOfKind('write').forEach(function(x){
      var el = $('ttact-' + x.a.id); if(!el) return;
      var sub = el.querySelector('.tt-act-sub'); if(!sub) return;
      sub.innerHTML = st ? '✅ Written · tap to read the facts again' : (T ? '“' + esc(T.t.title) + '” · tap to write · at least ' + minWords() + ' words' : esc(x.a.note || ''));
    });
    actsOfKind('teach').forEach(function(x){
      var el = $('ttact-' + x.a.id); if(!el) return;
      var sub = el.querySelector('.tt-act-sub'); if(sub) sub.textContent = st ? 'Tick when you have explained it' : 'Opens after you have written about it';
    });
  }
  if(typeof window.ttRender === 'function'){
    var render0 = window.ttRender;
    window.ttRender = function(){ var r = render0.apply(this, arguments); try{ decorate(); }catch(e){} return r; };
  }

  // ---- the Big Idea screen ---------------------------------------------------------------
  var CSS = ''
  + '#bi-ov{position:fixed;inset:0;z-index:9600;background:rgba(21,18,40,.55);backdrop-filter:blur(3px);overflow-y:auto;-webkit-overflow-scrolling:touch;display:none}'
  + '#bi-ov *{box-sizing:border-box;font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif}'
  + '#bi-box{max-width:720px;width:94%;margin:28px auto;background:#FFFDF8;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.3)}'
  + '#bi-ov .hd{position:relative;padding:22px 24px 20px;color:#fff;background:radial-gradient(120% 140% at 90% 0%,rgba(242,214,138,.35),transparent 55%),linear-gradient(120deg,#3B1E6B,#7C2D12)}'
  + '#bi-ov .hd .k{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#F2D68A}'
  + '#bi-ov .hd h2{font-family:"Rozha One",Georgia,serif!important;font-weight:400;font-size:28px;line-height:1.15;margin:6px 46px 0 0;color:#fff}'
  + '#bi-ov .x{position:absolute;right:14px;top:14px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:22px;cursor:pointer}'
  + '#bi-ov .bd{padding:20px 24px 24px}'
  + '#bi-ov .q{font-size:17px;font-weight:800;color:#1F2937;line-height:1.5}'
  + '#bi-ov .st{margin-top:8px;font-size:14px;color:#6B5B45;background:#FFF5E1;border-radius:12px;padding:10px 12px}'
  + '#bi-ov textarea{width:100%;min-height:170px;margin-top:14px;border:1.5px solid #E8DCC4;border-radius:14px;padding:12px 14px;font-size:15.5px;line-height:1.6;color:#1F2937;background:#fff;resize:vertical}'
  + '#bi-ov textarea:focus{outline:none;border-color:#7C2D12}'
  + '#bi-ov .wc{display:flex;justify-content:space-between;gap:10px;margin-top:6px;font-size:13px;font-weight:700;color:#9A6B3C}'
  + '#bi-ov .wc b.ok{color:#15803D}'
  + '#bi-ov .go{display:block;width:100%;margin-top:14px;border:0;border-radius:14px;padding:14px;font-size:16px;font-weight:800;color:#fff;background:#7C2D12;cursor:pointer}'
  + '#bi-ov .go:disabled{background:#CDBFA8;cursor:not-allowed}'
  + '#bi-ov .mine{margin-top:4px;font-size:14px;color:#4B5563;background:#F7F4EE;border-radius:12px;padding:10px 12px;white-space:pre-wrap;line-height:1.6}'
  + '#bi-ov .lab{font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9A6B3C;margin:18px 0 6px}'
  + '#bi-ov .facts{font-size:15.5px;line-height:1.85;color:#374151}'
  + '#bi-ov ul{margin:0;padding-left:20px}#bi-ov li{margin:4px 0;font-size:14.5px;line-height:1.6;color:#1F2937}'
  + '#bi-ov .dyk{margin-top:16px;background:#ECFDF5;border-radius:14px;padding:12px 14px;font-size:14.5px;line-height:1.6;color:#065F46}'
  + '#bi-ov .tt{margin-top:16px;background:#FFF8EC;border:1px solid #F1DDB5;border-radius:14px;padding:12px 14px;font-size:14.5px;font-weight:700;color:#7C2D12}'
  + '@media (max-width:600px){#bi-box{margin:0;width:100%;min-height:100%;border-radius:0}#bi-ov .hd h2{font-size:23px}#bi-ov .bd{padding:18px 16px 22px}}';

  function build(){
    if($('bi-ov')) return;
    var st = document.createElement('style'); st.id = 'bi-css'; st.textContent = CSS; document.head.appendChild(st);
    var ov = document.createElement('div'); ov.id = 'bi-ov';
    ov.innerHTML = '<div id="bi-box" role="dialog" aria-modal="true" aria-label="Today’s Big Idea"></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if(e.target === ov) close(); });
    ov.addEventListener('input', function(e){ if(e.target.id === 'bi-text') typed(); });
    ov.addEventListener('click', function(e){
      var b = e.target.closest('[data-bi]'); if(!b) return;
      var a = b.getAttribute('data-bi');
      if(a === 'close') close();
      if(a === 'submit') submit();
    });
  }
  var OPEN = { block:null, date:null };
  function draftKey(date){ return 'niyam_bi_draft_' + date; }
  function open(blockId){
    var c = cls();
    if(c && !LIST[c] && !TRIED[c]){ if(typeof toast === 'function') toast('💡 Getting today’s Big Idea…'); load(c).then(function(){ open(blockId); }); return; }
    var date = dateOpen(), st = state(date), T = topicFor(date);
    if(!T){ if(typeof toast === 'function') toast('Big Ideas for your class are coming soon.'); return; }
    var canWrite = !st && date === today() && !approved(date);
    if(canWrite && blockId && typeof ttTickWaits === 'function' && ttTickWaits(blockId)) return;   // not its time yet
    build(); OPEN.block = blockId || null; OPEN.date = date;
    var t = T.t, h = '<div class="hd"><div class="k">💡 Today’s Big Idea · Day ' + T.day + ' · ' + esc(t.area) + '</div><h2>' + esc(t.title) + '</h2>'
      + '<button class="x" data-bi="close" aria-label="Close">×</button></div><div class="bd">';
    h += '<div class="q">' + esc(t.question) + '</div>';
    if(st){
      h += '<div class="lab">What you wrote</div><div class="mine">' + esc(st.text) + '</div>' + factsHtml(t);
      h += '<div class="tt">Now explain it to ' + (first() ? 'a parent' : 'your parent') + ' in two minutes — like a teacher. Then tick “Explain today’s Big Idea” in your timetable.</div>';
      h += '<button class="go" data-bi="close">Done</button>';
    } else if(canWrite){
      var dr = ''; try{ dr = localStorage.getItem(draftKey(date)) || ''; }catch(e){}
      h += '<div class="st">💭 <b>Need a start?</b> ' + esc(t.starter) + '</div>'
        + '<textarea id="bi-text" placeholder="Write what you know or think. Guessing is allowed — the facts open when you submit.">' + esc(dr) + '</textarea>'
        + '<div class="wc"><span>At least ' + minWords() + ' words</span><b id="bi-wc">0 words</b></div>'
        + '<button class="go" id="bi-go" data-bi="submit" disabled>Submit and see the facts</button>';
    } else {
      h += '<div class="mine">' + (date === today() ? 'This day is already approved.' : 'Nothing was written on this day.') + '</div>';
      h += '<button class="go" data-bi="close">Close</button>';
    }
    h += '</div>';
    $('bi-box').innerHTML = h;
    $('bi-ov').style.display = 'block'; document.body.style.overflow = 'hidden';
    if($('bi-text')){ typed(); setTimeout(function(){ try{ $('bi-text').focus(); }catch(e){} }, 50); }
  }
  function factsHtml(t){
    return '<div class="lab">The facts</div><div class="facts">' + esc(t.facts) + '</div>'
      + '<div class="lab">Remember for exams</div><ul>' + (t.remember || []).map(function(r){ return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>'
      + '<div class="dyk"><b>Did you know?</b> ' + esc(t.dyk) + '</div>';
  }
  function typed(){
    var ta = $('bi-text'); if(!ta) return;
    var n = words(ta.value), ok = n >= minWords();
    var wc = $('bi-wc'); if(wc){ wc.textContent = n + (n === 1 ? ' word' : ' words'); wc.className = ok ? 'ok' : ''; }
    var go = $('bi-go'); if(go) go.disabled = !ok;
    try{ localStorage.setItem(draftKey(OPEN.date), ta.value); }catch(e){}
  }
  function close(){ var ov = $('bi-ov'); if(ov) ov.style.display = 'none'; document.body.style.overflow = ''; }
  function submit(){
    var ta = $('bi-text'); if(!ta) return;
    var date = OPEN.date, T = topicFor(date), n = words(ta.value);
    if(!T || n < minWords() || date !== today() || approved(date)) return;
    MEM[date] = { v:1, cls:cls(), day:T.day, idx:T.idx, title:T.t.title, text:String(ta.value).trim().slice(0, 4000), words:n, at:new Date().toISOString(), done:true };
    try{ localStorage.removeItem(draftKey(date)); }catch(e){}
    // tick the writing task (this also saves the day)
    var w = actsOfKind('write')[0];
    if(w){
      var bs = (typeof ttBlockStates !== 'undefined' && ttBlockStates[w.b.id]) || {}, on = !!((bs.checkedActs || {})[w.a.id]);
      allowTick = true;
      try{ if(!on) window.ttToggleAct(w.b.id, w.a.id, +w.a.pts || 0, w.a.type || 'self'); else if(typeof ttQueueSave === 'function') ttQueueSave(); }
      finally{ allowTick = false; }
    } else if(typeof ttQueueSave === 'function') ttQueueSave();
    open(OPEN.block);           // now shows the facts
    try{ decorate(); }catch(e){}
    if(typeof toast === 'function') toast('💡 Well done! Read the facts, then explain it to your parent.');
  }

  // ---- saving with the day -----------------------------------------------------------------
  if(typeof collectFormData === 'function'){
    var collect = collectFormData;
    collectFormData = function(date, pts){
      var d = collect.apply(this, arguments);
      try{
        if(MEM[date]) d.bigIdeaJSON = JSON.stringify(MEM[date]);
        else { var r = rec(date); if(r && r.bigIdeaJSON) d.bigIdeaJSON = r.bigIdeaJSON; }
      }catch(e){}
      return d;
    };
  }

  // ---- the parent sees what was written ---------------------------------------------------------
  function hookReview(){
    var R = window.niyamReview; if(!R || R.__bi || typeof R.model !== 'function') return !!(R && R.__bi);
    var model0 = R.model;
    R.model = function(d){
      var m = model0.apply(this, arguments);
      try{
        var st = parse(d && d.bigIdeaJSON);
        if(m && st && st.done && st.text && Array.isArray(m.wrote)) m.wrote.push({ title:'Big Idea: ' + (st.title || 'today’s topic'), text:st.text });
      }catch(e){}
      return m;
    };
    R.__bi = true; return true;
  }
  if(!hookReview()){ var tries = 0, iv = setInterval(function(){ if(hookReview() || ++tries > 40) clearInterval(iv); }, 250); }

  window.niyamBigIdea = { open: open, state: state, topic: topicFor, load: load };
  // load this class's topics soon after the app has started
  (function warm(n){ if(cls()) load(); else if(n < 60) setTimeout(function(){ warm(n + 1); }, 500); })(0);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ try{ decorate(); }catch(e){} });
  else try{ decorate(); }catch(e){}
})();
