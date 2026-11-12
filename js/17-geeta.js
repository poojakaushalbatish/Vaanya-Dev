/* NIYAM — Geeta page look (Nov 2026)
   Keeps the same Geeta page and the same buttons/saving.
   Only changes the look: app fonts, a calmer peacock header with a feather,
   cleaner shloka rows, and the shloka reader. Removes the "Today's Shloka Reflection" box from view. */
(function(){
  if(window.__niyamGeetaLook) return; window.__niyamGeetaLook = true;

  function fonts(){
    if(document.getElementById('gt-fonts')) return;
    var l = document.createElement('link'); l.id = 'gt-fonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Rozha+One&family=Tiro+Devanagari+Sanskrit:ital@0;1&display=swap';
    document.head.appendChild(l);
  }

  // Peacock feather, drawn as SVG (no image file needed)
  function feather(id){
    var barbs = '';
    for(var y = 34; y <= 262; y += 4.2){
      var t = (y - 34) / 228, w = y < 96 ? 26 + (y - 34) * 0.45 : Math.max(6, 54 - (y - 96) * 0.29);
      var c = t < 0.35 ? '#9BC53D' : t < 0.7 ? '#5E9E3A' : '#B79A45';
      barbs += '<path d="M60 ' + y.toFixed(1) + ' Q' + (60 - w * 0.6).toFixed(1) + ' ' + (y - 6).toFixed(1) + ' ' + (60 - w).toFixed(1) + ' ' + (y - 16).toFixed(1) + '" stroke="' + c + '"/>'
             + '<path d="M60 ' + y.toFixed(1) + ' Q' + (60 + w * 0.6).toFixed(1) + ' ' + (y - 6).toFixed(1) + ' ' + (60 + w).toFixed(1) + ' ' + (y - 16).toFixed(1) + '" stroke="' + c + '"/>';
    }
    return '<svg viewBox="0 0 120 310" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<defs><radialGradient id="' + id + 'g" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#2DD4BF"/><stop offset="1" stop-color="#0E7490"/></radialGradient></defs>'
      + '<g fill="none" stroke-width="1.15" stroke-linecap="round" opacity=".9">' + barbs + '</g>'
      + '<ellipse cx="60" cy="74" rx="31" ry="40" fill="#C9A227" opacity=".9"/>'
      + '<ellipse cx="60" cy="76" rx="25" ry="33" fill="#7C4A1E"/>'
      + '<ellipse cx="60" cy="78" rx="19.5" ry="26" fill="url(#' + id + 'g)"/>'
      + '<path d="M60 63 C70 63 73 74 70 83 C67 92 62 95 60 99 C58 95 53 92 50 83 C47 74 50 63 60 63 Z" fill="#1E2A78"/>'
      + '<ellipse cx="56" cy="72" rx="3" ry="4.5" fill="#fff" opacity=".35"/>'
      + '<path d="M60 304 C61 230 60 150 60 36" stroke="#E9D8A6" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      + '</svg>';
  }

  var CSS = ''
  + '#tab-geeta,#tab-geeta *,#shloka-overlay,#shloka-overlay *{font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif}'
  + '#tab-geeta .gt-serif,#shloka-overlay .gt-serif{font-family:"Rozha One",Georgia,serif!important;font-weight:400!important;letter-spacing:.01em}'
  // header
  + '#tab-geeta .gt-hero{position:relative;overflow:hidden;border-radius:24px;padding:26px 30px;margin-bottom:14px;color:#fff;display:flex;align-items:center;gap:22px;flex-wrap:wrap;'
  +   'background:radial-gradient(120% 140% at 85% 10%,rgba(201,162,39,.28),transparent 55%),linear-gradient(120deg,#0B2545 0%,#0F4C5C 58%,#126B66 100%);box-shadow:0 10px 30px rgba(11,37,69,.22)}'
  + '#tab-geeta .gt-hero .gt-txt{flex:1;min-width:240px;position:relative;z-index:2;padding-right:120px}'
  + '#tab-geeta .gt-eyebrow{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#F2D68A}'
  + '#tab-geeta .gt-hero h1{font-size:40px;line-height:1.05;margin:6px 0 6px;color:#fff}'
  + '#tab-geeta .gt-hero p{margin:0;color:rgba(255,255,255,.82);font-size:14.5px;font-weight:500}'
  + '#tab-geeta .gt-prog{display:flex;align-items:center;gap:12px;margin-top:16px;max-width:460px}'
  + '#tab-geeta .gt-prog .bar{flex:1;height:8px;border-radius:99px;background:rgba(255,255,255,.16);overflow:hidden}'
  + '#tab-geeta .gt-prog .bar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#F2D68A,#E0A030);transition:width .8s ease}'
  + '#tab-geeta .gt-prog span{font-size:13px;font-weight:700;color:#F2D68A;white-space:nowrap}'
  + '#tab-geeta .gt-stat{position:relative;z-index:2;text-align:center;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:12px 20px;margin-right:150px;backdrop-filter:blur(4px)}'
  + '#tab-geeta .gt-stat b{display:block;font-family:"Rozha One",Georgia,serif;font-weight:400;font-size:34px;line-height:1;color:#fff}'
  + '#tab-geeta .gt-stat span{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.75)}'
  + '#tab-geeta .gt-feather{position:absolute;right:40px;top:6px;width:104px;height:270px;transform:rotate(26deg);transform-origin:50% 25%;z-index:1;filter:drop-shadow(0 8px 16px rgba(0,0,0,.3))}'
  + '#tab-geeta .gt-feather svg{width:100%;height:100%}'
  // story bar
  + '#geeta-scene-card{border:1px solid #EADFCB!important;border-radius:20px!important;box-shadow:0 4px 18px rgba(120,80,20,.06)!important;background:#fff!important}'
  + '#geeta-scene-card>div:first-child{background:linear-gradient(90deg,#FFF7E8,#FFFDF8)!important;padding:14px 18px!important}'
  + '#geeta-scene-card>div:first-child>div:first-child{background:#FDE7C2!important;width:38px!important;height:38px!important;font-size:18px!important}'
  + '#geeta-scene-card>div:first-child>div:nth-child(2)>div:first-child{font-family:"Rozha One",Georgia,serif!important;font-weight:400!important;font-size:20px!important;color:#7C2D12!important}'
  + '#geeta-scene-card>div:first-child>div:nth-child(2)>div:last-child{font-size:12.5px!important;color:#9A6B3C!important}'
  + '#geeta-scene-arrow{color:#B45309!important}'
  + '#geeta-scene-body{font-size:15px!important;line-height:1.9!important;color:#374151!important;padding:20px 24px!important}'
  + '#geeta-scene-body b{color:#7C2D12}'
  // left column
  + '#tab-geeta .gt-img{border:1px solid #EADFCB!important;border-radius:20px!important;background:#FFF7E8!important;box-shadow:0 4px 18px rgba(120,80,20,.06)}'
  + '#tab-geeta .gt-img>div:last-child{background:#FFF7E8!important}#gimg-wrap{min-height:0!important;background:#FFF7E8!important}'
  + '#tab-geeta .gt-box{border:1px solid #EADFCB!important;border-radius:18px!important;padding:14px!important;background:#fff!important}'
  + '#tab-geeta .gt-box>div:first-child{font-size:11.5px!important;color:#9A6B3C!important;letter-spacing:.1em!important}'
  + '#geeta-main-grid{grid-template-columns:230px minmax(0,1fr)!important;gap:18px!important}#geeta-group-filters{gap:6px!important}'
  + '#geeta-group-filters button{font-size:12.5px!important;font-weight:700!important;padding:8px 10px!important;white-space:nowrap;border-radius:12px!important;background:#fff!important;border:1px solid #EFE6D6!important;color:#374151!important;display:flex;gap:8px;align-items:center;transition:background .15s}'
  + '#geeta-group-filters button:hover{background:#FFF7E8!important}'
  + '#geeta-group-filters button.gt-on{background:#0F4C5C!important;border-color:#0F4C5C!important;color:#fff!important}'
  + '#tab-geeta .gt-mast{border:1px solid #EADFCB!important;border-radius:18px!important}'
  + '#tab-geeta .gt-mast>div:first-child{background:linear-gradient(120deg,#0B2545,#0F4C5C)!important;padding:12px 14px!important}'
  + '#tab-geeta .gt-mast>div:first-child>div:first-child{font-size:14px!important}'
  // browse list
  + '#tab-geeta .gt-browse-h{font-family:"Rozha One",Georgia,serif!important;font-weight:400!important;font-size:24px!important;color:#1F2937!important}'
  + '#geeta-filter-lbl{font-size:13px!important;color:#9A6B3C!important}'
  + '#shloka-browse-grid .gt-grp{margin-bottom:18px}'
  + '#shloka-browse-grid .gt-gh{display:flex;align-items:baseline;gap:10px;margin:2px 4px 8px}'
  + '#shloka-browse-grid .gt-gh b{font-family:"Rozha One",Georgia,serif;font-weight:400;font-size:19px}'
  + '#shloka-browse-grid .gt-gh small{font-size:12px;font-weight:700;color:#9CA3AF}'
  + '#shloka-browse-grid .gt-row{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #EFE6D6;border-left:4px solid var(--gc);border-radius:16px;padding:12px 16px;margin-bottom:8px;cursor:pointer;transition:transform .15s,box-shadow .15s}'
  + '#shloka-browse-grid .gt-row:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(31,41,55,.08)}'
  + '#shloka-browse-grid .gt-row.locked{opacity:.55;cursor:not-allowed;border-left-color:#D1D5DB}'
  + '#shloka-browse-grid .gt-ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:18px;background:var(--gl);flex:none}'
  + '#shloka-browse-grid .gt-mid{flex:1;min-width:0}'
  + '#shloka-browse-grid .gt-ch{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--gc)}'
  + '#shloka-browse-grid .gt-ti{font-family:"Rozha One",Georgia,serif;font-size:18px;color:#1F2937;line-height:1.25;margin-top:1px}'
  + '#shloka-browse-grid .gt-le{font-size:13px;color:#6B7280;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + '#shloka-browse-grid .gt-pill{font-size:11.5px;font-weight:800;letter-spacing:.04em;padding:6px 11px;border-radius:99px;white-space:nowrap;flex:none}'
  + '#shloka-browse-grid .p-new{background:#F3F4F6;color:#4B5563}'
  + '#shloka-browse-grid .p-learn{background:#FEF3C7;color:#92400E}'
  + '#shloka-browse-grid .p-re{background:#DBEAFE;color:#1D4ED8}'
  + '#shloka-browse-grid .p-done{background:#D1FAE5;color:#065F46}'
  + '#shloka-browse-grid .p-lock{background:#F3F4F6;color:#9CA3AF}'
  // reader (overlay)
  + '#shloka-overlay-inner{border-radius:26px!important;background:#FFFDF8!important}'
  + '#shloka-overlay .gt-rh{position:relative;overflow:hidden;padding:26px 28px 24px;color:#fff;background:radial-gradient(120% 140% at 90% 0%,rgba(201,162,39,.3),transparent 55%),linear-gradient(120deg,#0B2545,var(--gc))}'
  + '#shloka-overlay .gt-rh .k{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#F2D68A}'
  + '#shloka-overlay .gt-rh h2{font-size:32px;line-height:1.1;margin:6px 0 4px;color:#fff}'
  + '#shloka-overlay .gt-rh p{margin:0;font-size:14px;color:rgba(255,255,255,.85)}'
  + '#shloka-overlay .gt-rh .gt-feather{position:absolute;right:70px;top:-4px;width:64px;height:170px;transform:rotate(24deg);transform-origin:50% 25%;opacity:.95}'
  + '#shloka-overlay .gt-rh .gt-feather svg{width:100%;height:100%}'
  + '#shloka-overlay .gt-rb{padding:22px 26px 26px}'
  + '#shloka-overlay .gt-sec{border-radius:18px;padding:16px 18px;margin-bottom:14px;background:#fff;border:1px solid #EFE6D6}'
  + '#shloka-overlay .gt-lab{font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9A6B3C;margin-bottom:8px}'
  + '#shloka-overlay .gt-sec .tx{font-size:15px;line-height:1.85;color:#374151}'
  + '#shloka-overlay .gt-verse{text-align:center;background:linear-gradient(180deg,#FFF7E8,#FFFBF2);border-color:#F1DDB5}'
  + '#shloka-overlay .gt-verse .sk{font-family:"Tiro Devanagari Sanskrit",serif!important;font-size:24px;line-height:1.9;color:#7C2D12}'
  + '#shloka-overlay .gt-verse .tl{font-family:"Tiro Devanagari Sanskrit",serif!important;font-style:italic;font-size:16px;line-height:1.75;color:#92400E;margin-top:10px;padding-top:10px;border-top:1px solid #F1DDB5}'
  + '#shloka-overlay .gt-words{width:100%;border-collapse:collapse}'
  + '#shloka-overlay .gt-words td{padding:7px 4px;border-bottom:1px solid #F3EEE2;font-size:14px;vertical-align:top;color:#4B5563}'
  + '#shloka-overlay .gt-words td:first-child{font-style:italic;font-weight:700;color:#92400E;width:44%}'
  + '#shloka-overlay .gt-mean .tx{font-family:"Rozha One",Georgia,serif!important;font-size:21px;line-height:1.45;color:#1F2937}'
  + '#shloka-overlay .gt-story{background:#FFFBF2;border-color:#F1DDB5}'
  + '#shloka-overlay .gt-story .tx>b:first-child{display:block;font-family:"Rozha One",Georgia,serif;font-weight:400;font-size:21px;color:#7C2D12;margin-bottom:10px}'
  + '#shloka-overlay .gt-lesson{background:linear-gradient(120deg,#0B2545,#0F4C5C);border:0}'
  + '#shloka-overlay .gt-lesson .gt-lab{color:#F2D68A}'
  + '#shloka-overlay .gt-lesson .tx{font-family:"Rozha One",Georgia,serif!important;font-size:20px;line-height:1.4;color:#fff}'
  + '#shloka-overlay .gt-act{border-radius:18px;padding:16px;text-align:center;margin-top:6px}'
  + '#shloka-overlay .gt-act b{display:block;font-size:16px}'
  + '#shloka-overlay .gt-act span{display:block;font-size:13.5px;margin-top:4px;line-height:1.6}'
  + '@media (max-width:760px){#geeta-main-grid{grid-template-columns:minmax(0,1fr)!important}#gimg-wrap{max-height:240px;overflow:hidden;background:#0B2545!important}#gimg-wrap img{height:240px!important;object-fit:contain}#geeta-group-filters{flex-direction:row!important;flex-wrap:wrap}#geeta-group-filters button{width:auto!important}#tab-geeta .gt-hero{padding:22px 20px}#tab-geeta .gt-hero h1{font-size:32px}'
  +   '#tab-geeta .gt-hero .gt-txt{padding-right:70px}#tab-geeta .gt-stat{margin-right:0}#tab-geeta .gt-feather{width:70px;height:180px;right:6px;top:-20px}'
  +   '#shloka-overlay .gt-rb{padding:18px 16px 20px}#shloka-overlay .gt-rh{padding:22px 20px}#shloka-overlay .gt-rh h2{font-size:26px}#shloka-overlay .gt-rh .gt-feather{right:60px;width:52px;height:140px}'
  +   '#shloka-overlay .gt-verse .sk{font-size:20px}}';

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function grp(id){ return ((typeof GITA_GROUPS !== 'undefined' && GITA_GROUPS) || []).find(function(g){ return g.id === id; }) || { color:'#0F4C5C', light:'#ECFEFF', icon:'🙏', name:'', chapters:'' }; }

  function setup(){
    var tab = document.getElementById('tab-geeta'); if(!tab || tab.__gt) return; tab.__gt = true;
    fonts();
    var st = document.createElement('style'); st.id = 'gt-css'; st.textContent = CSS; document.head.appendChild(st);

    // Header: same ids, new look
    var bar = document.getElementById('geeta-master-bar'), head = null;
    for(var n = bar; n && n.parentElement; n = n.parentElement){ if(n.parentElement === tab){ head = n; break; } }
    if(head){
      head.removeAttribute('style'); head.className = 'gt-hero';
      head.innerHTML = '<div class="gt-txt"><div class="gt-eyebrow">Bhagavad Geeta · 30 shlokas · 7 life lessons</div>'
        + '<h1 class="gt-serif">Geeta — Soul Work</h1><p>Learn a shloka, read its story, then recite it to your parent.</p>'
        + '<div class="gt-prog"><div class="bar"><i id="geeta-master-bar"></i></div><span id="geeta-master-lbl">0 / 30 shlokas mastered</span></div></div>'
        + '<div class="gt-stat"><b id="geeta-pts-badge">0</b><span>Geeta points</span></div>'
        + '<div class="gt-feather">' + feather('gtf1') + '</div>';
    }
    // Left column boxes
    var wrap = document.getElementById('gimg-wrap'); if(wrap && wrap.parentElement) wrap.parentElement.classList.add('gt-img');
    var fb = document.getElementById('gimg-aurora-fallback'); if(fb) fb.innerHTML = '<div style="font-size:44px">🕉️</div>';
    var gf = document.getElementById('geeta-group-filters'); if(gf && gf.parentElement) gf.parentElement.classList.add('gt-box');
    var mb = document.getElementById('mastered-count-badge'); if(mb){ var m = mb.closest('#geeta-main-grid > div > div'); if(m) m.classList.add('gt-mast'); }
    var fl = document.getElementById('geeta-filter-lbl'); if(fl && fl.previousElementSibling) fl.previousElementSibling.classList.add('gt-browse-h');
    // "Today's Shloka Reflection" — hidden (kept in the page so nothing else breaks)
    var rf = document.getElementById('shloka-reflect');
    for(var r = rf; r && r.parentElement; r = r.parentElement){ if(r.parentElement === tab){ r.style.display = 'none'; break; } }
    markActive();
  }

  function markActive(){
    var gf = document.getElementById('geeta-group-filters'); if(!gf) return;
    var ag = (typeof geetaActiveGroup !== 'undefined') ? geetaActiveGroup : null, on = ag ? 'gfbtn-' + ag : null;
    [].forEach.call(gf.children, function(b, i){ b.classList.toggle('gt-on', on ? b.id === on : i === 0); });
  }

  // Shloka rows — same rules as before (locked / learning / relearning / mastered)
  function renderBrowse(){
    var grid = document.getElementById('shloka-browse-grid'); if(!grid) return;
    var inId = _geetaActiveInProgressId(), reIds = _geetaReLearningIds(), blocker = inId || reIds.length > 0;
    var groups = geetaActiveGroup ? [GITA_GROUPS.find(function(g){ return g.id === geetaActiveGroup; })].filter(Boolean) : GITA_GROUPS;
    var h = '';
    groups.forEach(function(g){
      var list = SHLOKAS.filter(function(s){ return s.group === g.id; });
      h += '<div class="gt-grp"><div class="gt-gh"><b style="color:' + g.color + '">' + g.icon + ' ' + esc(g.name) + '</b><small>' + esc(g.chapters) + ' · ' + list.length + ' shlokas</small></div>';
      list.forEach(function(s){
        var p = geetaProgress[s.id], stt = p ? p.status : 'new';
        var locked = stt === 'new' && blocker && inId !== s.id && reIds.indexOf(s.id) < 0;
        var k = stt === 'mastered' ? ['✅', 'p-done', 'Mastered'] : stt === 'relearning' ? ['🔄', 'p-re', 'Relearning'] : stt === 'inprogress' ? ['📖', 'p-learn', 'Learning'] : locked ? ['🔒', 'p-lock', 'Locked'] : ['🪷', 'p-new', 'Tap to start'];
        var click = locked ? '_showLockedMsg()' : "_openShloka('" + s.id + "')";
        h += '<div class="gt-row' + (locked ? ' locked' : '') + '" style="--gc:' + g.color + ';--gl:' + g.light + '" onclick="' + click + '">'
          + '<div class="gt-ic">' + k[0] + '</div><div class="gt-mid"><div class="gt-ch">' + esc(s.chapter) + '</div><div class="gt-ti">' + esc(s.chapterMeaning) + '</div>'
          + '<div class="gt-le">' + esc(s.lesson || '') + '</div></div><div class="gt-pill ' + k[1] + '">' + k[2] + '</div></div>';
      });
      h += '</div>';
    });
    grid.innerHTML = h;
  }

  // Shloka reader
  function reader(s, before){
    var g = grp(s.group), p = geetaProgress[s.id], stt = p ? p.status : 'new';
    var words = (s.wordMeaning || []).map(function(w){ return '<tr><td>' + esc(w.w) + '</td><td>' + esc(w.m) + '</td></tr>'; }).join('');
    var act;
    if(stt === 'mastered') act = ['#ECFDF5', '#065F46', '✅ You have mastered this shloka!', 'Mastered on ' + esc(p && p.date || '') + '. You earned 25 points.'];
    else if(stt === 'relearning') act = ['#EFF6FF', '#1D4ED8', '🔄 You are re-learning this shloka', 'Your parent moved it back for practice. Recite it to them again — when they approve, it is mastered again.'];
    else act = ['#FFFBEB', '#92400E', before === 'new' ? '📖 You are now learning this shloka' : '📖 You are learning this shloka', 'Recite it to your parent. When they approve, it becomes Mastered. You earn 10 points while learning.'];
    var sec = function(cls, lab, body){ return '<div class="gt-sec ' + cls + '"><div class="gt-lab">' + lab + '</div><div class="tx">' + body + '</div></div>'; };
    return '<div class="gt-rh" style="--gc:' + g.color + '"><div class="k">' + g.icon + ' ' + esc(g.name) + ' · ' + esc(g.chapters) + '</div>'
      + '<h2 class="gt-serif">' + esc(s.chapter) + '</h2><p>' + esc(s.chapterName) + ' — <i>' + esc(s.chapterMeaning) + '</i></p>'
      + '<div class="gt-feather">' + feather('gtf2') + '</div></div>'
      + '<div class="gt-rb">'
      + sec('', '🏹 What was happening', s.moment)
      + '<div class="gt-sec gt-verse"><div class="gt-lab">🙏 The shloka</div><div class="sk">' + esc(s.sanskrit).replace(/\n/g, '<br>') + '</div><div class="tl">' + esc(s.transliteration).replace(/\n/g, '<br>') + '</div></div>'
      + '<div class="gt-sec"><div class="gt-lab">📖 Word by word</div><table class="gt-words">' + words + '</table></div>'
      + sec('gt-mean', '💬 The meaning', '“' + s.meaning + '”')
      + sec('', '🔵 What Krishna is really saying', s.krishnaSays)
      + sec('gt-story', '📚 The story', String(s.story || '').replace(/^(<b>[\s\S]*?<\/b>)(\s*<br>\s*)+/, '$1'))
      + sec('gt-lesson', '⭐ The lesson', s.lesson)
      + sec('', '🌟 In your life', s.lifeConnect)
      + '<div class="gt-act" style="background:' + act[0] + ';color:' + act[1] + '"><b>' + act[2] + '</b><span>' + act[3] + '</span></div>'
      + '</div>';
  }

  function wrapAll(){
    if(typeof window._renderBrowseGrid !== 'function' || typeof window._openShloka !== 'function') return false;
    window._renderBrowseGrid = function(){ try{ renderBrowse(); }catch(e){ console.error('geeta look', e); } markActive(); };
    var open0 = window._openShloka;
    window._openShloka = function(id){
      var p0 = geetaProgress[id], before = p0 ? p0.status : 'new';
      open0.apply(this, arguments);
      var ov = document.getElementById('shloka-overlay'), s = SHLOKAS.find(function(x){ return x.id === id; });
      if(ov && ov.style.display === 'block' && s){ try{ document.getElementById('shloka-overlay-content').innerHTML = reader(s, before); }catch(e){ console.error('geeta look', e); } }
    };
    // The reflection box (and its Save button) is gone, so save the day as soon as a shloka is started.
    var start0 = window._geetaStartLearn;
    if(typeof start0 === 'function') window._geetaStartLearn = function(){ var r = start0.apply(this, arguments); try{ if(typeof ttQueueSave === 'function') ttQueueSave(); }catch(e){} return r; };
    var filt0 = window.filterGeetaGroup;
    if(typeof filt0 === 'function') window.filterGeetaGroup = function(){ var r = filt0.apply(this, arguments); markActive(); return r; };
    return true;
  }

  function start(){ setup(); if(wrapAll()){ try{ if(window.SHLOKAS) renderBrowse(); markActive(); }catch(e){} } }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
