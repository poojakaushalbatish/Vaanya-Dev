// ============================================================================
// NIYAM — js/11-dictionary.js
// The "My Dictionary" tab (it was "My WordBook"): the child's own dictionary.
// Loads LAST, after js/10-brain-lab.js. Draws over the old WordBook screen
// (its markup stays in index.html, hidden, because js/04-wordbook.js still
// fills it) and uses the same words, from the Supabase table vaanya_wordbook
// (word, meaning, example, date_added, source) through js/04-wordbook.js:
// wbLoad, wbSaveToSupabase, wbUpdateInSupabase and wbDeleteWord.
//
//   • The cover: words, letters of the alphabet used, streak, and a rank.
//   • Today's words: the timetable's WordBook task (10 points for every 3
//     words, up to 9). A word added here also goes into that task, so it
//     earns the same points as a word typed in the timetable.
//   • "Do you remember?": one of the child's own older words each day. What
//     they answer is saved with the day as dictRecallJSON ({id, r}), where r
//     is 'knew' or 'again'. No points — it is a learning habit.
//   • The pages: alphabetical, with guide words, A–Z thumb tabs, search, and
//     the child's sentence with the word picked out.
//   • New word: word, meaning in their own words, their own sentence, with a
//     live preview of the entry.
// Word types (noun, adjective…) are NOT asked for (Pooja, 21 Oct 2026): no
// one can check them. Kept on the backlog for later.
// ============================================================================
(function(){
  'use strict';

  var RANKS = [[0, 'Word Collector'], [50, 'Word Explorer'], [150, 'Wordsmith'], [300, 'Lexicon Keeper'], [600, 'Master of Words']];
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var D = { view:'home', q:'', menu:null, edit:null, open:false, flash:null, form:{ w:'', m:'', e:'' }, busy:false, recall:null, loading:false, error:false };

  // ---- helpers ----------------------------------------------------------------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function words(){ return (typeof wbWords !== 'undefined' && Array.isArray(wbWords)) ? wbWords : []; }
  function days(){ return (typeof savedDays !== 'undefined' && Array.isArray(savedDays)) ? savedDays : []; }
  function parse(s){ try{ var v = JSON.parse(s); return (v && typeof v === 'object') ? v : null; }catch(e){ return null; } }
  // the same "today" the WordBook saves with (India time)
  function today(){ return new Date(Date.now() + 5.5 * 3600000).toISOString().split('T')[0]; }
  function dateOpen(){ return ($('rpt-date') && $('rpt-date').value) || today(); }
  function added(w){ return String(w.date_added || '').substring(0, 10); }
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(d){ var p = String(d || '').split('-'); return p.length === 3 ? (+p[2]) + ' ' + MONTHS[(+p[1]) - 1] : ''; }
  function childName(){ return window.niyamChildName || ''; }
  function classNo(){ return parseInt(String(window.niyamChildClass || '').replace(/\D/g, ''), 10) || ''; }
  function first(w){ var c = String(w.word || '').trim().charAt(0).toUpperCase(); return LETTERS.indexOf(c) >= 0 ? c : '#'; }
  function sorted(list){ return list.slice().sort(function(a, b){ return String(a.word || '').localeCompare(String(b.word || ''), 'en', { sensitivity:'base' }); }); }
  function daysAgo(d){ return Math.round((new Date(today() + 'T12:00:00') - new Date(d + 'T12:00:00')) / 86400000); }
  function toastMsg(m){ if(typeof toast === 'function') toast(m); }

  // The word picked out in the child's sentence ("persevere" also finds "persevered").
  function markWord(sentence, word){
    var s = esc(sentence), w = String(word || '').trim().toLowerCase().replace(/[^a-z'-]/g, '');
    if(w.length < 2) return s;
    var stem = w.length > 4 && /[ey]$/.test(w) ? w.slice(0, -1) : w;
    var re = new RegExp('(^|[^A-Za-z])(' + stem.replace(/[-']/g, '\\$&') + '[A-Za-z]*)', 'i');
    return s.replace(re, '$1<u>$2</u>');
  }
  function usesWord(sentence, word){ return /<u>/.test(markWord(sentence, word)); }

  // ---- numbers for the cover ---------------------------------------------------
  function rankOf(n){ var r = RANKS[0], next = null; RANKS.forEach(function(x, i){ if(n >= x[0]){ r = x; next = RANKS[i + 1] || null; } }); return { r:r, next:next }; }
  function streak(){
    var set = {}; words().forEach(function(w){ set[added(w)] = 1; });
    var d = new Date(today() + 'T12:00:00'), n = 0;
    if(!set[today()]) d.setDate(d.getDate() - 1);
    while(set[d.toISOString().split('T')[0]]){ n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function letterCounts(){ var c = {}; words().forEach(function(w){ var L = first(w); c[L] = (c[L] || 0) + 1; }); return c; }

  // ---- today's words: the timetable's WordBook task ------------------------------
  function wordTask(){
    if(dateOpen() !== today() || typeof ttGetSchedule !== 'function') return null;
    try{
      var blocks = ttGetSchedule() || [];
      for(var i = 0; i < blocks.length; i++){
        var acts = blocks[i].activities || [];
        for(var k = 0; k < acts.length; k++) if(acts[k].type === 'wordbook') return { block:blocks[i], act:acts[k] };
      }
    }catch(e){}
    return null;
  }
  function approvedToday(){
    var rec = days().find(function(d){ return d.date === dateOpen(); });
    return !!(rec && rec.approved === true) || (typeof todayApproved !== 'undefined' && todayApproved);
  }
  function taskWords(t){
    var st = (typeof ttBlockStates !== 'undefined' && ttBlockStates[t.block.id]) || {};
    return ((st.words || {})[t.act.id] || []).filter(function(x){ return x && x.w && x.m && x.e; });
  }
  // A word added here joins the timetable task, and earns its points there.
  function addToTask(w, m, e){
    var t = wordTask(); if(!t || approvedToday() || typeof ttBlockStates === 'undefined') return;
    var id = t.block.id, a = t.act.id, pts = parseInt(t.act.pts, 10) || 0;
    if(!ttBlockStates[id]) ttBlockStates[id] = { pts:0, checkedActs:{}, markedDone:false };
    var st = ttBlockStates[id];
    st.checkedActs = st.checkedActs || {}; st.words = st.words || {}; st.wordPts = st.wordPts || {};
    var list = (st.words[a] || []).filter(function(x){ return x && (x.w || x.m || x.e); });
    if(list.some(function(x){ return String(x.w).toLowerCase() === w.toLowerCase(); })) return;
    list.push({ w:w, m:m, e:e });
    st.words[a] = list;
    var earned = typeof ttWordEarned === 'function' ? ttWordEarned(list, pts) : 0;
    st.wordPts[a] = earned; st.checkedActs[a] = earned > 0;
    // the first three words also go into the old report fields, as the timetable does
    var full = list.filter(function(x){ return x.w && x.m && x.e; });
    for(var i = 0; i < 3; i++){ var x = full[i] || { w:'', m:'', e:'' };
      [['word', x.w], ['mean', x.m], ['exam', x.e]].forEach(function(p){ var el = $(p[0] + (i + 1)); if(el) el.value = p[1]; }); }
    // redraw the task in the timetable so its boxes show the new word
    try{
      var panel = $('ttw-panel-' + a);
      if(panel && typeof ttWordEntryHTML === 'function') panel.outerHTML = ttWordEntryHTML(id, a, pts);
      var actEl = $('ttact-' + a); if(actEl) actEl.classList.toggle('checked', earned > 0);
      var ptsEl = $('ttact-pts-' + a); if(ptsEl && typeof ttWordLabel === 'function') ptsEl.textContent = ttWordLabel(earned, pts);
      if(typeof ttUpdateBlockPts === 'function') ttUpdateBlockPts(id);
    }catch(err){ console.warn('[dictionary] task:', err); }
    if(typeof calcDayPts === 'function') calcDayPts();
    if(typeof ttQueueSave === 'function') ttQueueSave();
  }

  // ---- "Do you remember?" -----------------------------------------------------------
  function recallAnswers(){
    var out = {};
    days().forEach(function(d){ var r = parse(d.dictRecallJSON); if(r && r.id != null && d.date !== D.recall_date) out[r.id] = r.r; });
    if(D.recall && D.recall.r) out[D.recall.id] = D.recall.r;
    return out;
  }
  function remembered(){ var a = recallAnswers(), n = 0; Object.keys(a).forEach(function(k){ if(a[k] === 'knew' && words().some(function(w){ return String(w.id) === String(k); })) n++; }); return n; }
  function ensureRecall(){
    var date = dateOpen();
    if(D.recall && D.recall.date === date && (D.recall.id != null || !words().length)) return;   // (picked again once the words have loaded)
    D.open = false; D.recall_date = date;
    var rec = days().find(function(d){ return d.date === date; }), saved = parse(rec && rec.dictRecallJSON);
    if(saved && words().some(function(w){ return String(w.id) === String(saved.id); })){ D.recall = { date:date, id:saved.id, r:saved.r || '' }; return; }
    var older = words().filter(function(w){ return added(w) && added(w) < date; });
    var pool = older.filter(function(w){ return daysAgo(added(w)) >= 3; });
    if(!pool.length) pool = older;
    if(!pool.length){ D.recall = { date:date, id:null, r:'' }; return; }
    var ans = recallAnswers(), fresh = pool.filter(function(w){ return ans[w.id] !== 'knew'; });
    var again = fresh.filter(function(w){ return ans[w.id] === 'again'; });
    var from = again.length ? again : fresh.length ? fresh : pool;
    from = from.slice().sort(function(a, b){ return String(a.id).localeCompare(String(b.id)); });
    var h = 0; for(var i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) % 100003;
    D.recall = { date:date, id:from[h % from.length].id, r:'' };
  }

  // ---- styles --------------------------------------------------------------------------
  var CSS = ''
  + '#tab-wordbook>:not(#dict-root){display:none!important}'
  + '#dict-root{--paper:#FBF7EE;--page:#FFFDF8;--ink:#1F2A44;--soft:#5B6478;--line:#E7DFCF;--rule:#D9CFBB;--navy:#1F2A44;--blue:#2F5D8C;--gold:#C9962B;--gold2:#F2C14E;--oxblood:#8C2F39;--leaf:#3D7A3A;'
  +   'font-family:Mukta,system-ui,sans-serif;color:var(--ink);background:#EFE9DC;border-radius:22px;padding:14px;max-width:1220px;margin:0 auto;box-sizing:border-box}'
  + '#dict-root *{box-sizing:border-box}'
  + '#dict-root button{font-family:inherit;cursor:pointer;color:inherit}'
  + '#dict-root .serif{font-family:Fraunces,Georgia,serif}'
  + '#dict-root .cap{font-size:11.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}'
  + '#dict-root .d-home{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"s1" "main" "s2";gap:0}'
  + '#dict-root .d-s1{grid-area:s1;min-width:0} #dict-root .d-main{grid-area:main;min-width:0} #dict-root .d-s2{grid-area:s2;min-width:0}'
  // cover
  + '#dict-root .cover{position:relative;background:var(--navy);color:#F5EEDC;border-radius:18px;padding:20px 20px 18px;overflow:hidden;'
  +   'background-image:linear-gradient(90deg,rgba(255,255,255,.06) 0 14px,transparent 14px),radial-gradient(circle at 85% -10%,rgba(242,193,78,.18),transparent 55%)}'
  + '#dict-root .cover::after{content:"";position:absolute;inset:8px 8px 8px 22px;border:1.5px solid rgba(242,193,78,.45);border-radius:12px;pointer-events:none}'
  + '#dict-root .cover>*{position:relative;z-index:1}'
  + '#dict-root .ribbon{position:absolute;right:26px;top:0;width:18px;height:58px;background:var(--oxblood);clip-path:polygon(0 0,100% 0,100% 100%,50% 82%,0 100%);z-index:2}'
  + '#dict-root .cover .cap{color:var(--gold2)}'
  + '#dict-root .cover h1{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:32px;line-height:1.05;margin:6px 0 2px;letter-spacing:-.01em;color:#F5EEDC}'
  + '#dict-root .cover h1 em{font-style:italic;font-weight:500;color:var(--gold2)}'
  + '#dict-root .cover .ed{font-family:Fraunces,Georgia,serif;font-style:italic;font-size:14px;color:#D9D2C0}'
  + '#dict-root .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}'
  + '#dict-root .stat{background:rgba(255,255,255,.07);border:1px solid rgba(242,193,78,.25);border-radius:12px;padding:8px 10px}'
  + '#dict-root .stat b{display:block;font-family:Fraunces,Georgia,serif;font-size:24px;line-height:1;color:#fff}'
  + '#dict-root .stat span{font-size:11.5px;font-weight:700;color:#CFC7B2}'
  + '#dict-root .rank{display:flex;align-items:center;gap:10px;margin-top:12px;font-size:13px;font-weight:700;flex-wrap:wrap}'
  + '#dict-root .rank .bar{flex:1;min-width:60px;height:6px;border-radius:99px;background:rgba(255,255,255,.15);overflow:hidden}'
  + '#dict-root .rank .bar i{display:block;height:100%;background:var(--gold2)}'
  // cards
  + '#dict-root .card{background:var(--page);border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-top:12px}'
  + '#dict-root .today{display:flex;align-items:center;gap:12px}'
  + '#dict-root .dots{display:flex;gap:4px;flex-wrap:wrap;max-width:140px;justify-content:flex-end}'
  + '#dict-root .dots i{width:11px;height:11px;border-radius:50%;border:1.5px solid var(--blue)}'
  + '#dict-root .dots i.on{background:var(--blue)}'
  + '#dict-root .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:46px;border:0;border-radius:12px;background:var(--navy);color:#fff;font-weight:800;font-size:15px;padding:8px 16px}'
  + '#dict-root .btn.gold{background:var(--gold2);color:var(--navy)}'
  + '#dict-root .btn.ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line)}'
  + '#dict-root .btn.green{background:var(--leaf)}'
  + '#dict-root .btn.full{width:100%}'
  + '#dict-root .btn[disabled]{opacity:.45;cursor:default}'
  + '#dict-root .recall{background:var(--page);border:1px solid var(--line);border-left:5px solid var(--gold);border-radius:4px 16px 16px 4px;padding:14px 16px;margin-top:12px}'
  + '#dict-root .recall .w{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:30px;line-height:1.1;margin-top:4px;word-break:break-word}'
  + '#dict-root .recall .hid{display:block;width:100%;margin-top:10px;border:1.5px dashed var(--rule);border-radius:12px;padding:12px;text-align:center;color:var(--soft);font-weight:700;'
  +   'background:repeating-linear-gradient(-45deg,#fff 0 8px,#FBF7EE 8px 16px)}'
  + '#dict-root .alpha{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:5px;margin-top:10px}'
  + '#dict-root .alpha button{aspect-ratio:1/1;border-radius:8px;border:1px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;'
  +   'font-family:Fraunces,Georgia,serif;font-weight:700;font-size:15px;line-height:1;background:#fff;color:#B9B2A3;padding:0}'
  + '#dict-root .alpha button small{font-family:Mukta,sans-serif;font-size:9.5px;font-weight:800;margin-top:1px}'
  + '#dict-root .alpha button.has{background:var(--navy);color:#fff;border-color:var(--navy)}'
  + '#dict-root .alpha button.has small{color:var(--gold2)}'
  // search + index
  + '#dict-root .search{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:0 14px;min-height:48px;flex:1}'
  + '#dict-root .search input{flex:1;border:0;outline:none;background:transparent;font-family:Mukta,sans-serif;font-size:16px;font-weight:600;color:var(--ink);min-width:0;padding:10px 0}'
  + '#dict-root .toolbar{display:flex;flex-direction:column;gap:10px;margin-top:12px}'
  + '#dict-root .thumbs{display:flex;gap:4px;overflow-x:auto;margin-top:10px;padding-bottom:2px;-webkit-overflow-scrolling:touch}'
  + '#dict-root .thumbs button{flex:0 0 auto;width:28px;height:32px;border-radius:6px 6px 2px 2px;background:#fff;border:1px solid var(--line);font-family:Fraunces,Georgia,serif;font-weight:700;font-size:13px;color:#C9C2B2;padding:0}'
  + '#dict-root .thumbs button.has{color:var(--navy)}'
  + '#dict-root .thumbs button.on{background:var(--navy);color:#fff;border-color:var(--navy)}'
  + '#dict-root .thumbs button[disabled]{cursor:default}'
  // pages
  + '#dict-root .pages{background:var(--page);border:1px solid var(--line);border-radius:16px;margin-top:12px;padding:6px 16px 10px;position:relative}'
  + '#dict-root .guide{display:flex;justify-content:space-between;align-items:baseline;gap:8px;border-bottom:2px solid var(--navy);padding:8px 0 6px;font-family:Fraunces,Georgia,serif;font-weight:700;font-size:13px;letter-spacing:.12em;text-transform:uppercase}'
  + '#dict-root .guide span:nth-child(2){font-family:Mukta,sans-serif;font-weight:700;letter-spacing:0;color:var(--soft);font-size:12px;text-transform:none;text-align:center}'
  + '#dict-root .letter{display:flex;align-items:center;gap:10px;margin:14px 0 4px;scroll-margin-top:80px}'
  + '#dict-root .letter b{font-family:Fraunces,Georgia,serif;font-size:34px;line-height:1;color:var(--oxblood)}'
  + '#dict-root .letter i{flex:1;height:1px;background:var(--rule)}'
  + '#dict-root .entry{padding:10px 40px 12px 0;border-bottom:1px dotted var(--rule);position:relative;break-inside:avoid}'
  + '#dict-root .entry.flash{animation:dictFlash 2.4s ease-out}'
  + '@keyframes dictFlash{0%,40%{background:#FFF1C7}100%{background:transparent}}'
  + '#dict-root .hw{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:22px;line-height:1.15;word-break:break-word}'
  + '#dict-root .meta{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);margin-left:6px;white-space:nowrap}'
  + '#dict-root .new{display:inline-block;margin-left:6px;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;background:var(--gold2);color:var(--navy);border-radius:99px;padding:1px 8px;vertical-align:3px}'
  + '#dict-root .def{margin-top:4px;font-size:15.5px;font-weight:600;line-height:1.45}'
  + '#dict-root .def b{font-family:Fraunces,Georgia,serif;color:var(--oxblood);margin-right:4px}'
  + '#dict-root .ex{margin-top:4px;font-family:Fraunces,Georgia,serif;font-style:italic;font-size:15px;line-height:1.45;color:#3E4760}'
  + '#dict-root .ex u{text-decoration:none;font-weight:700;background:linear-gradient(transparent 62%,rgba(242,193,78,.55) 62%)}'
  + '#dict-root .more{position:absolute;right:0;top:12px;width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--soft);font-weight:800;padding:0}'
  + '#dict-root .menu{display:flex;gap:8px;margin-top:8px}'
  + '#dict-root .menu button{flex:1;min-height:40px;border-radius:10px;border:1.5px solid var(--line);background:#fff;font-weight:800;font-size:14px}'
  + '#dict-root .menu button.del{color:#B42318;border-color:#F3C5C0}'
  + '#dict-root .empty{text-align:center;padding:30px 10px;color:var(--soft);font-weight:700}'
  + '#dict-root .empty .serif{font-size:22px;color:var(--ink);font-weight:700;margin-bottom:4px}'
  // forms
  + '#dict-root .field{margin-top:12px}'
  + '#dict-root .field label{display:block;font-weight:800;font-size:14px}'
  + '#dict-root .field small{display:block;font-size:12.5px;font-weight:600;color:var(--soft);margin:1px 0 6px}'
  + '#dict-root .inp{width:100%;border:1.5px solid var(--line);border-radius:12px;background:#fff;padding:11px 13px;font-family:Mukta,sans-serif;font-size:16px;font-weight:600;color:var(--ink);min-height:46px;outline:none}'
  + '#dict-root .inp:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(47,93,140,.15)}'
  + '#dict-root .inp.big{font-family:Fraunces,Georgia,serif;font-size:22px;font-weight:700}'
  + '#dict-root textarea.inp{resize:vertical;min-height:72px}'
  + '#dict-root .ok{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:13px;font-weight:700;min-height:18px}'
  + '#dict-root .preview{margin-top:8px;background:var(--page);border:1.5px dashed var(--gold);border-radius:14px;padding:4px 14px 6px}'
  + '#dict-root .top{display:flex;align-items:center;gap:10px}'
  + '#dict-root .back{width:44px;height:44px;border-radius:12px;border:1.5px solid var(--line);background:#fff;font-size:22px;font-weight:700;padding:0;flex:0 0 auto}'
  + '#dict-root .addwrap{max-width:640px;margin:0 auto}'
  + '@media (min-width:820px){'
  +   '#dict-root{padding:24px 28px}'
  +   '#dict-root .d-home{grid-template-columns:340px minmax(0,1fr);grid-template-areas:"s1 main" "s2 main";grid-template-rows:auto 1fr;column-gap:24px;align-items:start}'
  +   '#dict-root .toolbar{flex-direction:row;align-items:center;margin-top:0}'
  +   '#dict-root .thumbs.phone{display:none}'
  +   '#dict-root .pages{padding:8px 58px 14px 28px;min-height:640px;box-shadow:0 1px 0 var(--line),0 4px 0 -1px #F3EDE0,0 5px 0 -1px var(--line),0 9px 0 -2px #F3EDE0,0 10px 0 -2px var(--line)}'
  +   '#dict-root .cols{column-count:2;column-gap:34px;column-rule:1px solid var(--line)}'
  +   '#dict-root .letter{break-after:avoid}'
  +   '#dict-root .vthumbs{position:absolute;right:-1px;top:44px;display:flex;flex-direction:column;gap:2px}'
  +   '#dict-root .vthumbs button{width:30px;height:22px;border-radius:6px 0 0 6px;background:#fff;border:1px solid var(--line);border-right:0;font-family:Fraunces,Georgia,serif;font-weight:700;font-size:11.5px;color:#C9C2B2;padding:0}'
  +   '#dict-root .vthumbs button.has{color:var(--navy)}'
  +   '#dict-root .vthumbs button.on{background:var(--navy);color:#fff;width:36px;margin-left:-6px}'
  +   '#dict-root .addgrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:start}'
  +   '#dict-root .addwrap{max-width:1000px}'
  + '}'
  + '@media (max-width:819px){#dict-root .vthumbs{display:none}}';

  function addStyles(){
    if($('dict-style')) return;
    var st = document.createElement('style'); st.id = 'dict-style'; st.textContent = CSS; document.head.appendChild(st);
    if(!document.querySelector('link[data-dict-font]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-dict-font', '1');
      l.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,400;1,9..144,500;1,9..144,700&family=Mukta:wght@500;600;700;800&display=swap';
      document.head.appendChild(l);
    }
  }
  function root(){
    var tab = $('tab-wordbook'); if(!tab) return null;
    var r = $('dict-root');
    if(!r){
      addStyles();
      r = document.createElement('div'); r.id = 'dict-root';
      tab.insertBefore(r, tab.firstChild);
      r.addEventListener('click', onClick);
      r.addEventListener('input', onInput);
      r.addEventListener('keydown', function(e){ if(e.key === 'Enter' && e.target.id === 'dict-q') e.preventDefault(); });
    }
    return r;
  }

  // ---- the home page ---------------------------------------------------------------------
  function coverHtml(){
    var n = words().length, lc = letterCounts(), used = LETTERS.filter(function(L){ return lc[L]; }).length;
    var rk = rankOf(n), pct = rk.next ? Math.round((n - rk.r[0]) / (rk.next[0] - rk.r[0]) * 100) : 100;
    var name = childName(), cls = classNo();
    return '<div class="cover"><div class="ribbon"></div>'
      + '<div class="cap">' + (cls ? 'Class ' + cls + ' edition' : 'First edition') + '</div>'
      + '<h1>' + (name ? esc(name) + '’s ' : 'My ') + '<em>Dictionary</em></h1>'
      + '<div class="ed">Every word in it, found and explained by me.</div>'
      + '<div class="stats"><div class="stat"><b>' + n + '</b><span>' + (n === 1 ? 'word' : 'words') + '</span></div>'
      + '<div class="stat"><b>' + used + '</b><span>of 26 letters</span></div>'
      + '<div class="stat"><b>' + streak() + '</b><span>day streak</span></div></div>'
      + '<div class="rank"><span style="color:var(--gold2)">' + rk.r[1] + '</span><div class="bar"><i style="width:' + pct + '%"></i></div>'
      + '<span style="color:#CFC7B2">' + (rk.next ? (rk.next[0] - n) + ' to ' + rk.next[1] : 'Top rank!') + '</span></div></div>';
  }
  function todayHtml(){
    var t = wordTask(), addedToday = words().filter(function(w){ return added(w) === today(); }).length;
    if(!t){
      if(dateOpen() !== today()) return '';
      return '<div class="card today"><div style="flex:1"><div class="cap" style="color:var(--blue)">Today’s words</div>'
        + '<div style="font-weight:800;font-size:15px;margin-top:2px">' + addedToday + ' new ' + (addedToday === 1 ? 'word' : 'words') + ' today</div></div></div>';
    }
    var done = taskWords(t).length, pts = parseInt(t.act.pts, 10) || 0, sets = (typeof TT_WORD_SETS !== 'undefined' ? TT_WORD_SETS : 3), max = sets * 3;
    var earned = Math.min(Math.floor(done / 3), sets) * pts, toNext = 3 - done % 3;
    var dots = ''; for(var i = 0; i < max; i++) dots += '<i class="' + (i < done ? 'on' : '') + '"></i>';
    return '<div class="card today"><div style="flex:1;min-width:0"><div class="cap" style="color:var(--blue)">Today’s words</div>'
      + '<div style="font-weight:800;font-size:15px;margin-top:2px">' + Math.min(done, max) + ' of ' + max + ' added' + (earned ? ' · +' + earned + ' points' : '') + '</div>'
      + '<div style="font-size:13px;font-weight:600;color:var(--soft)">' + (done >= max ? 'All ' + max + ' done today — brilliant!' : toNext + ' more ' + (toNext === 1 ? 'word' : 'words') + ' = +' + pts + ' points') + '</div></div>'
      + '<div class="dots">' + dots + '</div></div>';
  }
  function recallHtml(){
    ensureRecall();
    var R = D.recall, w = R && R.id != null ? words().find(function(x){ return String(x.id) === String(R.id); }) : null;
    if(!w) return '';
    var ago = daysAgo(added(w)), when = ago <= 0 ? 'from today' : ago === 1 ? 'from yesterday' : 'from ' + ago + ' days ago';
    var h = '<div class="recall"><div class="cap" style="color:var(--gold)">Do you remember? · ' + when + '</div><div class="w">' + esc(w.word) + '</div>';
    if(!D.open && !R.r) return h + '<button class="hid" data-act="reveal">Tap to see what you wrote</button></div>';
    h += '<div class="entry" style="border:0;padding:6px 0 2px"><div class="def"><b>1</b>' + esc(w.meaning) + '</div><div class="ex">“' + markWord(w.example, w.word) + '”</div></div>';
    if(R.r === 'knew') h += '<div style="margin-top:8px;font-weight:800;color:var(--leaf)">✓ You remembered it. You remember ' + remembered() + ' of your ' + words().length + ' words.</div>';
    else if(R.r === 'again') h += '<div style="margin-top:8px;font-weight:800;color:var(--blue)">Good — it will come back again soon.</div>';
    else h += '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn green" style="flex:1" data-act="knew">✓ I remembered</button><button class="btn ghost" style="flex:1" data-act="again">Show me again soon</button></div>';
    return h + '</div>';
  }
  function alphaHtml(){
    var lc = letterCounts(), missing = LETTERS.filter(function(L){ return !lc[L]; }), used = 26 - missing.length;
    var h = '<div class="card"><div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px"><div class="cap" style="color:var(--blue)">Your alphabet</div>'
      + '<div style="font-size:13px;font-weight:700;color:var(--soft)">' + used + ' of 26 letters</div></div><div class="alpha">';
    LETTERS.forEach(function(L){ h += '<button class="' + (lc[L] ? 'has' : '') + '" data-act="jump" data-l="' + L + '"' + (lc[L] ? '' : ' disabled') + '>' + L + '<small>' + (lc[L] || '–') + '</small></button>'; });
    h += '</div>';
    if(!words().length) h += '<div style="font-size:13.5px;font-weight:700;margin-top:10px">Every word you add lights up its letter.</div>';
    else if(missing.length) h += '<div style="font-size:13.5px;font-weight:700;margin-top:10px">Word hunt: no <b class="serif">' + (missing.length > 1 ? missing.slice(0, -1).join(', ') + '</b> or <b class="serif">' + missing[missing.length - 1] : missing[0])
      + '</b> words yet. Can you find one?</div>';
    else h += '<div style="font-size:13.5px;font-weight:700;margin-top:10px;color:var(--leaf)">Every letter from A to Z — what a dictionary!</div>';
    return h + '</div>';
  }
  function entryHtml(w, isNew){
    var id = String(w.id);
    if(D.edit === id){
      return '<div class="entry" data-id="' + esc(id) + '" style="padding-right:0"><div class="field" style="margin-top:4px"><label>The word</label><input class="inp big" id="dict-ew" value="' + esc(w.word) + '"></div>'
        + '<div class="field"><label>What it means</label><input class="inp" id="dict-em" value="' + esc(w.meaning) + '"></div>'
        + '<div class="field"><label>Your sentence</label><textarea class="inp" id="dict-ee">' + esc(w.example) + '</textarea></div>'
        + '<div class="menu"><button data-act="cancel-edit">Cancel</button><button style="background:var(--navy);color:#fff;border-color:var(--navy)" data-act="save-edit" data-id="' + esc(id) + '">Save changes</button></div></div>';
    }
    return '<div class="entry' + (D.flash === id ? ' flash' : '') + '" data-id="' + esc(id) + '"><span class="hw">' + esc(w.word) + '</span><span class="meta">' + fmt(added(w)) + '</span>'
      + (isNew ? '<span class="new">today</span>' : '')
      + '<div class="def"><b>1</b>' + esc(w.meaning) + '</div>'
      + (w.example ? '<div class="ex">“' + markWord(w.example, w.word) + '”</div>' : '')
      + '<button class="more" data-act="menu" data-id="' + esc(id) + '" aria-label="Edit or delete ' + esc(w.word) + '">⋯</button>'
      + (D.menu === id ? '<div class="menu"><button data-act="edit" data-id="' + esc(id) + '">Edit</button><button class="del" data-act="delete" data-id="' + esc(id) + '">Delete</button></div>' : '')
      + '</div>';
  }
  function pagesHtml(){
    var all = words(), q = D.q.trim().toLowerCase();
    var list = sorted(q ? all.filter(function(w){ return String(w.word || '').toLowerCase().indexOf(q) >= 0 || String(w.meaning || '').toLowerCase().indexOf(q) >= 0; }) : all);
    var lc = {}; list.forEach(function(w){ lc[first(w)] = 1; });
    var thumbs = function(cls){
      var h = '<div class="' + cls + '">';
      LETTERS.forEach(function(L){ h += '<button class="' + (lc[L] ? 'has' : '') + '" data-act="jump" data-l="' + L + '"' + (lc[L] ? '' : ' disabled') + '>' + L + '</button>'; });
      return h + '</div>';
    };
    var h = '<div class="toolbar"><div class="search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6478" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'
      + '<input id="dict-q" type="search" placeholder="Look up a word in your dictionary…" value="' + esc(D.q) + '" autocomplete="off" aria-label="Look up a word"></div>'
      + '<button class="btn gold" data-act="add">＋ Add a new word</button></div>' + thumbs('thumbs phone');
    h += '<div class="pages">';
    if(D.error && !all.length) return h + '<div class="empty"><div class="serif">Your dictionary could not be opened</div>Check the internet, then <button class="btn ghost" data-act="retry" style="margin-top:10px">Try again</button></div></div>';
    if(D.loading && !all.length) return h + '<div class="empty"><div class="serif">Opening your dictionary…</div></div></div>';
    if(!list.length){
      h += all.length ? '<div class="empty"><div class="serif">No word matches “' + esc(D.q) + '”</div>Check the spelling, or add it as a new word.</div>'
                      : '<div class="empty"><div class="serif">Your dictionary is waiting for its first word</div>Found a new word in a book today? Add it — with what it means and your own sentence.</div>';
      return h + '</div>';
    }
    var a = list[0].word, z = list[list.length - 1].word;
    h += '<div class="guide"><span>' + esc(a) + '</span><span>' + list.length + ' ' + (list.length === 1 ? 'entry' : 'entries') + (q ? ' found' : '') + '</span><span>' + esc(z) + '</span></div><div class="cols">';
    var last = '', t = today();
    list.forEach(function(w){
      var L = first(w);
      if(L !== last){ h += '<div class="letter" id="dict-L-' + L + '"><b>' + L + '</b><i></i></div>'; last = L; }
      h += entryHtml(w, added(w) === t);
    });
    return h + '</div>' + thumbs('vthumbs') + '</div>';
  }
  function homeHtml(){
    return '<div class="d-home"><div class="d-s1">' + coverHtml() + todayHtml() + recallHtml() + '</div>'
      + '<div class="d-main">' + pagesHtml() + '</div><div class="d-s2">' + alphaHtml() + '</div></div>';
  }

  // ---- adding a word ----------------------------------------------------------------------
  function previewHtml(){
    var F = D.form;
    if(!F.w && !F.m && !F.e) return '<div class="entry" style="border:0;color:var(--soft);font-weight:700">Start typing — your entry will appear here.</div>';
    return '<div class="entry" style="border:0;padding-right:0"><span class="hw">' + esc(F.w || '…') + '</span><span class="meta">' + fmt(today()) + '</span><span class="new">today</span>'
      + '<div class="def"><b>1</b>' + esc(F.m || '…') + '</div>' + (F.e ? '<div class="ex">“' + markWord(F.e, F.w) + '”</div>' : '') + '</div>';
  }
  function checkHtml(){
    var F = D.form;
    if(!F.w || !F.e) return '';
    return usesWord(F.e, F.w) ? '<span style="color:var(--leaf)">✓ Your sentence uses the word</span>'
                              : '<span style="color:#9A6400">Try to use “' + esc(F.w) + '” in your sentence</span>';
  }
  function addHtml(){
    var F = D.form, t = wordTask(), done = t ? taskWords(t).length : 0;
    var sets = (typeof TT_WORD_SETS !== 'undefined' ? TT_WORD_SETS : 3), pts = t ? parseInt(t.act.pts, 10) || 0 : 0;
    var note = t && done < sets * 3 ? (3 - done % 3 === 1 ? 'This word completes a set: +' + pts + ' points!' : (3 - done % 3 - 1) + ' more after this = +' + pts + ' points') : '';
    var ready = F.w.trim() && F.m.trim() && F.e.trim();
    return '<div class="addwrap"><div class="top"><button class="back" data-act="home" aria-label="Back to my dictionary">‹</button>'
      + '<div><div class="cap" style="color:var(--blue)">New entry' + (t ? ' · word ' + (done + 1) + ' of today' : '') + '</div>'
      + '<div class="serif" style="font-size:24px;font-weight:700;line-height:1.1">Add to my dictionary</div></div></div>'
      + '<div class="addgrid"><div>'
      + '<div class="field"><label for="dict-w">The word</label><small>Spell it carefully — check the book you found it in.</small><input class="inp big" id="dict-w" value="' + esc(F.w) + '" autocomplete="off" autocapitalize="none"></div>'
      + '<div class="field"><label for="dict-m">What it means — in your own words</label><small>Not copied: explain it like you would to a friend.</small><input class="inp" id="dict-m" value="' + esc(F.m) + '" autocomplete="off"></div>'
      + '<div class="field"><label for="dict-e">Your own sentence</label><small>Use the word in a sentence about your life.</small><textarea class="inp" id="dict-e">' + esc(F.e) + '</textarea>'
      + '<div class="ok" id="dict-check">' + checkHtml() + '</div></div>'
      + '</div><div>'
      + '<div class="cap" style="color:var(--gold);margin-top:16px">How it will look in your dictionary</div>'
      + '<div class="preview" id="dict-preview">' + previewHtml() + '</div>'
      + '<button class="btn full" style="margin-top:14px" data-act="save" id="dict-save"' + (ready && !D.busy ? '' : ' disabled') + '>' + (D.busy ? 'Saving…' : 'Add to my dictionary') + '</button>'
      + (note ? '<div style="text-align:center;font-size:13px;font-weight:700;color:var(--soft);margin-top:8px">' + note + '</div>' : '')
      + '</div></div></div>';
  }

  function render(){
    var r = root(); if(!r) return;
    var v = D.view;
    r.innerHTML = v === 'add' ? addHtml() : homeHtml();
    if(r._view && r._view !== v){ try{ var t = r.getBoundingClientRect().top; if(t < 0 || t > 200) r.scrollIntoView({ block:'start', behavior:'instant' }); }catch(e){} }
    r._view = v;
  }

  // ---- taps and typing ----------------------------------------------------------------------
  function onInput(e){
    var id = e.target.id;
    if(id === 'dict-q'){
      D.q = e.target.value; var pos = e.target.selectionStart;
      var main = document.querySelector('#dict-root .d-main'); if(main) main.innerHTML = pagesHtml();
      var q = $('dict-q'); if(q){ q.focus(); try{ q.setSelectionRange(pos, pos); }catch(err){} }
      return;
    }
    if(id === 'dict-w' || id === 'dict-m' || id === 'dict-e'){
      D.form[{ 'dict-w':'w', 'dict-m':'m', 'dict-e':'e' }[id]] = e.target.value;
      var p = $('dict-preview'); if(p) p.innerHTML = previewHtml();
      var c = $('dict-check'); if(c) c.innerHTML = checkHtml();
      var s = $('dict-save'); if(s) s.disabled = !(D.form.w.trim() && D.form.m.trim() && D.form.e.trim()) || D.busy;
    }
  }
  function onClick(e){
    var b = e.target.closest('[data-act]'); if(!b || b.disabled) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id');
    if(act === 'add'){ D.view = 'add'; render(); var w = $('dict-w'); if(w) w.focus(); return; }
    if(act === 'home'){ D.view = 'home'; render(); return; }
    if(act === 'reveal'){ D.open = true; render(); return; }
    if(act === 'knew' || act === 'again'){
      D.recall.r = act; render();
      if(typeof ttQueueSave === 'function' && dateOpen() === today() && !approvedToday()) ttQueueSave();
      return;
    }
    if(act === 'jump'){
      var L = b.getAttribute('data-l'), el = $('dict-L-' + L);
      if(!el && D.q){ D.q = ''; render(); el = $('dict-L-' + L); }
      if(el) el.scrollIntoView({ block:'start', behavior:'smooth' });
      return;
    }
    if(act === 'menu'){ D.menu = D.menu === id ? null : id; D.edit = null; render(); return; }
    if(act === 'edit'){ D.edit = id; D.menu = null; render(); var ew = $('dict-ew'); if(ew) ew.focus(); return; }
    if(act === 'cancel-edit'){ D.edit = null; render(); return; }
    if(act === 'save-edit'){ saveEdit(id); return; }
    if(act === 'delete'){
      var w2 = words().find(function(x){ return String(x.id) === id; });
      D.menu = null;
      if(w2 && typeof wbDeleteWord === 'function') wbDeleteWord(w2.id, w2.word);   // asks first, then redraws through wbRender
      return;
    }
    if(act === 'save'){ saveNew(); return; }
    if(act === 'retry'){ if(typeof wbLoad === 'function') wbLoad(); return; }
  }

  async function saveNew(){
    var F = D.form, w = F.w.trim(), m = F.m.trim(), ex = F.e.trim();
    if(!w || !m || !ex || D.busy) return;
    if(words().some(function(x){ return String(x.word || '').toLowerCase() === w.toLowerCase(); })){
      toastMsg('“' + w + '” is already in your dictionary.'); return;
    }
    if(typeof wbSaveToSupabase !== 'function'){ toastMsg('⚠️ Could not save — please refresh the page.'); return; }
    D.busy = true; render();
    var row = null;
    try{ row = await wbSaveToSupabase(w, m, ex, 'manual'); }catch(err){ console.warn('[dictionary] save:', err); }
    D.busy = false;
    if(!row){ render(); toastMsg('⚠️ The word was not saved. Check the internet and try again.'); return; }
    if(typeof wbWords !== 'undefined') wbWords.unshift(row);
    addToTask(w, m, ex);
    D.form = { w:'', m:'', e:'' }; D.view = 'home'; D.q = ''; D.flash = String(row.id);
    render();
    toastMsg('📖 “' + w + '” is now in your dictionary!');
    var el = document.querySelector('#dict-root .entry[data-id="' + String(row.id).replace(/"/g, '') + '"]');
    if(el) el.scrollIntoView({ block:'center', behavior:'smooth' });
    setTimeout(function(){ D.flash = null; }, 2500);
  }
  async function saveEdit(id){
    var w = ($('dict-ew') || {}).value || '', m = ($('dict-em') || {}).value || '', ex = ($('dict-ee') || {}).value || '';
    if(!w.trim() || !m.trim() || !ex.trim()){ toastMsg('Please fill in the word, the meaning and your sentence.'); return; }
    var x = words().find(function(v){ return String(v.id) === String(id); });
    var ok = x && typeof wbUpdateInSupabase === 'function' ? await wbUpdateInSupabase(x.id, w, m, ex) : false;
    if(!ok){ toastMsg('⚠️ The change was not saved. Check the internet and try again.'); return; }
    if(x){ x.word = w.trim(); x.meaning = m.trim(); x.example = ex.trim(); }
    D.edit = null; D.flash = String(id); render();
    toastMsg('✏️ Saved.');
    setTimeout(function(){ D.flash = null; }, 2500);
  }

  // ---- connections to the rest of the app ---------------------------------------------------
  // What the child answered in "Do you remember?" is saved with the day.
  if(typeof collectFormData === 'function'){
    var collect = collectFormData;
    collectFormData = function(date, pts){
      var d = collect(date, pts);
      try{
        if(D.recall && D.recall.date === date && D.recall.r) d.dictRecallJSON = JSON.stringify({ id:D.recall.id, r:D.recall.r });
        else { var rec = days().find(function(x){ return x.date === date; }); if(rec && rec.dictRecallJSON) d.dictRecallJSON = rec.dictRecallJSON; }
      }catch(e){}
      return d;
    };
  }
  // The WordBook code redraws its old list after loading, adding or deleting; draw ours too.
  if(typeof wbRender === 'function'){
    var wr = wbRender;
    wbRender = function(){
      var r; try{ r = wr.apply(this, arguments); }catch(e){ console.warn('[dictionary] old list:', e); }
      try{ var t = $('tab-wordbook'); if(t && t.classList.contains('active')) render(); }catch(e){ console.error('[dictionary] render:', e); }
      return r;
    };
  }
  // Loading the words: show "Opening…", and say so if it fails (not an empty dictionary).
  if(typeof wbLoad === 'function'){
    var wl = wbLoad;
    wbLoad = async function(){
      D.loading = true; D.error = false; redraw();
      try{ return await wl.apply(this, arguments); }
      finally{
        D.loading = false;
        var list = $('wb-list');
        D.error = !words().length && !!list && /⚠️/.test(list.textContent || '');
        redraw();
      }
    };
  }
  function redraw(){ try{ var t = $('tab-wordbook'); if(t && t.classList.contains('active')) render(); }catch(e){ console.error('[dictionary] render:', e); } }
  if(typeof showTab === 'function'){
    var show = showTab;
    showTab = function(id){
      var r = show.apply(this, arguments);
      if(id === 'wordbook'){ try{ D.menu = null; D.edit = null; render(); }catch(e){ console.error('[dictionary] render:', e); } }
      return r;
    };
  }
  // A different day opened: its own "Do you remember?".
  ['loadDraftDay', 'loadApprovedDay'].forEach(function(fn){
    if(typeof window[fn] !== 'function') return;
    var orig = window[fn];
    window[fn] = function(){ var r = orig.apply(this, arguments); D.recall = null; return r; };
  });
  // The menu button says "My Dictionary".
  function relabel(){
    document.querySelectorAll('.nb').forEach(function(b){
      if(/showTab\('wordbook'/.test(b.getAttribute('onclick') || '') && /WordBook/.test(b.textContent)) b.innerHTML = b.innerHTML.replace('My WordBook', 'My Dictionary');
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', relabel); else relabel();

  window.niyamDictionary = { render: render, state: function(){ return D; } };
})();
