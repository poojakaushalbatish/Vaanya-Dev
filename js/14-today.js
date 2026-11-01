// ============================================================================
// NIYAM — js/14-today.js
// "Your day, your sky" (23 Oct 2026): the Daily Report becomes "Today", and
// every page gets a new top bar (and a bottom tab bar on phones).
// Loads LAST, after js/13-kindness.js.
//
//   Top bar (all pages): the child's picture, name, class and level; the menu;
//   and a bright "Parent Zone" button with a count of things waiting
//   (days to approve + kindness to check + rewards to give).
//   On phones the menu becomes a tab bar fixed at the bottom.
//
//   Today page:
//   • a sky that follows the time of day (morning / afternoon / evening /
//     night), with the greeting, the date (‹ ›), the kind of day, a ring with
//     today's points and bars for tasks, Brain Lab and points from parents,
//     and chips for the Star Bank, the streak, the goal and the level;
//   • "My day": the timetable as a timeline (the block for now opens by itself) — a green line for the day so far,
//     a red line for now, and each block's result ("✓ 3 of 3 · +25");
//   • on the side: Today's Act of Kindness (js/13-kindness.js), "Also today"
//     and a thought for the day; small notes at the bottom (saved, approved
//     days, backup).
//   Removed from the child's page (Pooja, 23 Oct 2026): the "Draft loaded"
//   banner, the clock and date panels, the Clear button (now in the Parent
//   Zone) and Save Report (ticks save themselves).
//
// The timetable itself is still drawn by js/05-timetable-boot.js (ttRender);
// this file moves it into the new page and adds the times, the lines and the
// results around it.
// ============================================================================
(function(){
  'use strict';

  var LEVELS = [[0, 'Starter'], [300, 'Go-Getter'], [1000, 'Rising Star'], [2500, 'Shining Star'], [5000, 'Super Star'], [10000, 'Legend']];
  var TABS = { report:['☀️','Today','Today'], brain:['🧠','Brain Lab','Brain Lab'], geeta:['🕉️','Geeta','Geeta'], wordbook:['📖','My Dictionary','Words'],
               rewards:['🏆','Rewards','Rewards'], graphs:['📈','Progress','Progress'], creative:['🎨','Creative','Creative'], gallery:['🖼️','Gallery','Gallery'] };
  var built = false, timer = null;

  // ---- helpers ----------------------------------------------------------------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function today(){ return new Date().toLocaleDateString('en-CA'); }
  function dateOpen(){ return ($('rpt-date') && $('rpt-date').value) || today(); }
  function days(){ return (typeof savedDays !== 'undefined' && Array.isArray(savedDays)) ? savedDays : []; }
  function fmtN(n){ return (+n || 0).toLocaleString('en-IN'); }
  function childName(){ return window.niyamChildName || ''; }
  function nowH(){ var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  function hm(h){ var H = Math.floor(h), M = Math.round((h - H) * 60); if(M === 60){ H++; M = 0; } var ap = H >= 12 ? 'PM' : 'AM', h12 = H % 12 || 12; return h12 + ':' + (M < 10 ? '0' : '') + M + ' ' + ap; }
  function hmShort(h){ return hm(h).replace(/ (AM|PM)$/, ''); }
  function schedule(){ try{ return ttGetSchedule() || []; }catch(e){ return []; } }
  function score(){ try{ return ttDayScore(); }catch(e){ return null; } }
  function levelOf(pts){ var l = LEVELS[0], i = 0; LEVELS.forEach(function(x, k){ if(pts >= x[0]){ l = x; i = k; } }); return { n:i + 1, name:l[1] }; }
  function mood(){ var h = nowH(); return h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 19.5 ? 'evening' : 'night'; }
  function rec(date){ return days().find(function(d){ return d.date === date; }); }
  // The day the child joined (js/00-shell.js), or their first saved day for older families.
  function num(v){ var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function joined(){
    var j = window.niyamJoinDate || '', e = days().map(function(d){ return d && d.date; }).filter(Boolean).sort()[0] || '';
    if(!j) return e || today(); return (e && e < j) ? e : j;
  }
  function dayNo(date){ return Math.round((new Date(date + 'T12:00:00') - new Date(joined() + 'T12:00:00')) / 86400000) + 1; }
  function brainOn(){ return !(window.niyamFeatures && window.niyamFeatures.brainlab === false); }   // switched off in the Parent Zone

  // When each block starts and ends (the end is the next block's start).
  function times(){
    var S = schedule(), out = [];
    S.forEach(function(b, i){
      var start = typeof b.unlockHour === 'number' ? b.unlockHour : null, end = null;
      for(var j = i + 1; j < S.length; j++) if(typeof S[j].unlockHour === 'number'){ end = S[j].unlockHour; break; }
      if(start === null){ var m = String(b.time || '').match(/(\d+):(\d+)\s*(AM|PM)/i); if(m){ start = (+m[1] % 12) + (+m[2]) / 60 + (/pm/i.test(m[3]) ? 12 : 0); } }
      if(end === null && start !== null) end = start + 1.5;
      out.push({ b:b, start:start, end:end });
    });
    return out;
  }
  function stateOf(t){ try{ return ttBlockState(t.b, nowH()); }catch(e){ return 'upcoming'; } }

  // ---- styles -------------------------------------------------------------------
  var CSS = ''
  // hide what the new page replaces
  + '#aurora-topbar,#ns-topbtns,#mob-pts-pill,#tab-report .draft-info-bar,#tab-report .page-layout{display:none!important}'
  + '.ab-oldbar{display:none!important}'
  + 'body.td-on{background-color:#EFEAF9;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cg fill=%27%23C9BEEA%27 opacity=%27.55%27%3E%3Cpath d=%27M20 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z%27/%3E%3Ccircle cx=%2786%27 cy=%2732%27 r=%271.6%27/%3E%3Ccircle cx=%2752%27 cy=%2790%27 r=%271.6%27/%3E%3Cpath d=%27M98 82l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z%27/%3E%3C/g%3E%3C/svg%3E"),'
  +   'radial-gradient(55% 45% at 0% 0%,#E4D9FF 0%,rgba(228,217,255,0) 70%),radial-gradient(50% 40% at 100% 0%,#FFE1CF 0%,rgba(255,225,207,0) 70%),'
  +   'radial-gradient(60% 50% at 100% 100%,#D3F1E8 0%,rgba(211,241,232,0) 70%),radial-gradient(50% 45% at 0% 100%,#FDE2F0 0%,rgba(253,226,240,0) 70%);background-attachment:fixed}'
  + 'body.td-on #app-root{padding-top:0!important}'
  + 'body.td-on .page{max-width:1500px;padding:12px 18px}'
  + '#ab-bar,#ab-bar *,#td-root,#td-root *{font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif!important}'
  + '#ab-bar .who b,#td-root .greet,#td-root .ring .c b,#td-root .st b,#td-root .tt-block-name,#td-root #kd-bar h3,#td-root .side .card .cap,#td-root .tl-cap'
  +   '{font-family:"Rozha One",Georgia,serif!important;font-weight:400!important;letter-spacing:.01em}'
  + '#td-root .cap.tl-cap,#td-root .side .card .cap{text-transform:none;letter-spacing:0;font-size:21px;color:#5B2A9B!important}'
  + '#td-root .tt-block-name{font-size:18px!important}'
  + '#td-root .greet{font-size:34px}'
  + '#ab-bar .who b{font-size:21px}'
  + '#td-root #kd-bar h3{font-size:22px}'
  + '#td-root #kd-bar .cap{font-family:"Plus Jakarta Sans",sans-serif!important}'
  + '#td-root .side .card.thought{position:relative;margin-top:22px;padding:22px 20px 18px;border-radius:6px 6px 22px 6px;background:linear-gradient(180deg,#FFF6C9,#FFEFA8);border:0;box-shadow:0 14px 28px rgba(180,130,0,.18),0 2px 0 rgba(0,0,0,.03);transform:rotate(-1.2deg)}'
  + '#td-root .thought .pin{position:absolute;top:-14px;left:50%;margin-left:-14px;font-size:26px;filter:drop-shadow(0 3px 2px rgba(0,0,0,.2))}'
  + '#td-root .side .card.thought .cap{color:#B45309!important;font-family:"Rozha One",Georgia,serif!important;text-transform:none;letter-spacing:0;font-size:19px;font-weight:400!important}'
  + '#td-root .thought .q{font-family:Kalam,"Comic Sans MS",cursive!important;font-weight:700!important;font-size:22px;line-height:1.35;color:#3B2A12;margin-top:6px}'
  + '#td-root .thought .by{font-family:Kalam,cursive!important;font-weight:400!important;font-size:17px;color:#8A5A12;margin-top:8px;text-align:right}'
  // 3. a finished frame around the app
  + '#app-frame{max-width:1460px;margin:0 auto 18px;background:radial-gradient(circle,rgba(124,92,196,.13) 1.1px,transparent 1.5px) 0 0/22px 22px,linear-gradient(180deg,#FFFFFF 0%,#FAF7FF 35%,#F6F1FF 70%,#FFF5EC 100%);border:1px solid #E3DEF2;border-radius:32px;padding:18px 22px 22px;box-shadow:0 24px 60px rgba(30,27,58,.10),0 2px 0 rgba(255,255,255,.8) inset;box-sizing:border-box}'
  // top bar
  + '#ab-bar{font-family:Nunito,system-ui,sans-serif;color:#1E1B3A;display:flex;align-items:center;gap:12px;margin:4px 0 12px;box-sizing:border-box}'
  + '#ab-bar *{box-sizing:border-box}'
  + '#ab-bar .ab-av{width:48px;height:48px;border-radius:50%;padding:3px;flex:0 0 auto;background:conic-gradient(#F472B6,#FBBF24,#34D399,#60A5FA,#A78BFA,#F472B6)}'
  + '#ab-bar .ab-av>div{width:100%;height:100%;border-radius:50%;background:#FFF7E0;display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden}'
  + '#ab-bar .ab-av img{width:100%;height:100%;object-fit:cover}'
  + '#ab-bar .who{min-width:0}'
  + '#ab-bar .who b{display:block;font-family:Fredoka,Nunito,sans-serif;font-weight:700;font-size:18px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + '#ab-bar .who span{font-size:12.5px;font-weight:800;color:#6B6788;white-space:nowrap}'
  + '#ab-bar .nav{display:flex;flex-wrap:nowrap;gap:4px;margin:0 0 0 14px;background:#fff;border:1.5px solid #ECE9F6;border-radius:99px;padding:4px;box-shadow:none;overflow-x:auto}'
  + '#ab-bar .nav .nb{display:inline-flex;align-items:center;gap:6px;border:0!important;background:transparent!important;color:#6B6788!important;border-radius:99px!important;padding:8px 13px!important;margin:0!important;font-family:Nunito,sans-serif;font-weight:900!important;font-size:13.5px!important;white-space:nowrap;box-shadow:none!important;transform:none!important;min-height:0}'
  + '#ab-bar .nav .nb.active{background:#5B2A9B!important;color:#fff!important}'
  + '#ab-bar .nav .nb i{font-style:normal}'
  + '#ab-bar .nav .nb .s{display:none}'
  + '#ab-bar .pz{margin-left:14px;position:relative;flex:1 1 auto;min-width:230px;display:flex;align-items:center;gap:12px;border:0;cursor:pointer;border-radius:99px;padding:5px 22px 5px 5px;text-align:left;'
  +   'background:linear-gradient(135deg,#FFB300,#FF7A45 55%,#F43F5E);color:#fff;box-shadow:0 8px 22px rgba(244,63,94,.35),inset 0 -3px 0 rgba(0,0,0,.12);font-family:Fredoka,Nunito,sans-serif}'
  + '#ab-bar .pz:hover{filter:brightness(1.05)}'
  + '#ab-bar .pz .fam{width:42px;height:42px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:21px;box-shadow:0 0 0 3px rgba(255,255,255,.45)}'
  + '#ab-bar .pz b{display:block;font-weight:800;font-size:17px;line-height:1.1;letter-spacing:.01em}'
  + '#ab-bar .pz .arr{margin-left:auto;font-size:22px;font-weight:800;opacity:.9}'
  + '#ab-bar .nav{flex:0 0 auto}'
  + '#ab-bar .pz small{display:block;font-family:Nunito,sans-serif;font-size:11.5px;font-weight:900;opacity:.95}'
  + '#ab-bar .pz .badge{position:absolute;top:-7px;right:-5px;min-width:24px;height:24px;border-radius:99px;background:#1E1B3A;color:#FCD34D;font-family:Nunito,sans-serif;font-weight:900;font-size:12.5px;'
  +   'display:flex;align-items:center;justify-content:center;padding:0 6px;border:2px solid #fff;animation:tdPulse 1.8s infinite}'
  // Today page
  + '#td-root{font-family:Nunito,system-ui,sans-serif;color:#1E1B3A;box-sizing:border-box}'
  + '#td-root *{box-sizing:border-box}'
  + '#td-root button{font-family:inherit;cursor:pointer}'
  + '#td-root .f{font-family:Fredoka,Nunito,sans-serif}'
  + '#td-root .cap{font-size:11.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}'
  + '#td-root .hero{position:relative;overflow:hidden;border-radius:28px;padding:20px;color:#fff;min-height:240px}'
  + '#td-root .hero.morning{background:linear-gradient(160deg,#4C2C82 0%,#8E3F7E 45%,#C9655A 80%,#E59A5F 110%)}'
  + '#td-root .hero.afternoon{background:linear-gradient(160deg,#075985 0%,#0369A1 40%,#0284C7 75%,#0EA5E9 110%)}'
  + '#td-root .hero.evening{background:linear-gradient(160deg,#3B1A6B 0%,#8A2A5C 45%,#C2563A 85%,#E08A3C 110%)}'
  + '#td-root .hero.night{background:linear-gradient(165deg,#1E1B4B 0%,#312E81 45%,#5B21B6 100%)}'
  + '#td-root .hero .deco{position:absolute;inset:0;pointer-events:none;z-index:0}'
  + '#td-root .hero .in{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr);gap:16px}'
  + '#td-root .greet{font-family:Fredoka,Nunito,sans-serif;font-weight:700;font-size:30px;line-height:1.08;text-shadow:0 2px 10px rgba(0,0,0,.14)}'
  + '#td-root .datenav{display:inline-flex;align-items:center;gap:6px;margin-top:10px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.35);border-radius:99px;padding:4px 5px}'
  + '#td-root .datenav button{width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.25);color:#fff;font-size:16px;font-weight:900}'
  + '#td-root .datenav input{border:0;background:transparent;color:#fff;font-family:Nunito,sans-serif;font-weight:900;font-size:15px;padding:4px 2px;width:auto;max-width:150px;color-scheme:dark;cursor:pointer}'
  + '#td-root .daytype{margin-top:8px;font-weight:800;font-size:13.5px;opacity:.97}'
  + '#td-root .sched{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}'
  + '#td-root .sched button{display:flex;align-items:center;gap:8px;border:1.5px solid rgba(255,255,255,.45);background:rgba(0,0,0,.18);color:#fff;border-radius:14px;padding:8px 12px;font-weight:700;font-size:13px;text-align:left;line-height:1.2}'
  + '#td-root .sched button small{display:block;font-size:11px;font-weight:600;opacity:.85}'
  + '#td-root .sched button.on{background:#fff;color:#1E1B3A;border-color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.18)}'
  + '#td-root .sched button.on small{opacity:.7}'
  + '#td-root .sched button span.i{font-size:18px}'
  + '#td-root .ringbox{display:flex;align-items:center;gap:16px}'
  + '#td-root .ring{position:relative;width:132px;height:132px;flex:0 0 auto;border-radius:50%}'
  + '#td-root .ring .c{position:absolute;inset:13px;border-radius:50%;background:rgba(255,255,255,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#1E1B3A}'
  + '#td-root .ring .c b{font-family:Fredoka,sans-serif;font-size:36px;line-height:1}'
  + '#td-root .ring .c span{font-size:12px;font-weight:800;color:#6B6788;text-align:center;padding:0 6px}'
  + '#td-root .split{display:flex;flex-direction:column;gap:7px;flex:1;min-width:0}'
  + '#td-root .split .sp{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.3);border-radius:14px;padding:7px 10px;font-weight:800;font-size:13px}'
  + '#td-root .split .sp .bar{height:6px;border-radius:99px;background:rgba(255,255,255,.3);margin-top:5px;overflow:hidden}'
  + '#td-root .split .sp .bar i{display:block;height:100%;background:#fff}'
  + '#td-root .stats{display:flex;gap:8px;flex-wrap:wrap}'
  + '#td-root .st{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.3);border-radius:16px;padding:8px 12px;border-width:1px;color:#fff;text-align:left}'
  + '#td-root .st b{display:block;font-family:Fredoka,sans-serif;font-size:21px;line-height:1}'
  + '#td-root .st span{font-size:11.5px;font-weight:800;opacity:.94}'
  + '#td-root .cols{display:grid;grid-template-columns:minmax(0,1fr);gap:0}'
  // timeline
  + '#td-root .tl-cap{color:#6B6788;margin:18px 0 10px}'
  + '#td-root .tt-block.state-current{box-shadow:0 12px 30px rgba(14,165,233,.15)!important}'
  + '#td-root #tt-blocks-container{position:relative;padding-left:66px;margin:0}'
  + '#td-root #tt-blocks-container:before{content:"";position:absolute;left:52px;top:10px;bottom:10px;width:3px;border-radius:3px;background:#E4E0F2}'
  + '#td-root #tt-blocks-container .td-rail{position:absolute;left:52px;top:10px;width:3px;border-radius:3px;background:linear-gradient(#34D399,#16A34A);height:var(--done,0px);pointer-events:none}'
  + '#td-root .tt-block{position:relative;border-radius:18px!important;border:1.5px solid #ECE9F6!important;box-shadow:none!important;margin-bottom:10px!important;background:#fff!important;overflow:visible!important}'
  + '#td-root .tt-block:before{content:attr(data-t);position:absolute;left:-66px;top:18px;width:44px;text-align:right;font-size:11.5px;font-weight:900;color:#6B6788;line-height:1.1}'
  + '#td-root .tt-block:after{content:"";position:absolute;left:-20px;top:18px;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #CFC9E6;box-sizing:border-box}'
  + '#td-root .tt-block.td-past:after,#td-root .tt-block.state-done:after{background:#16A34A;border-color:#16A34A}'
  + '#td-root .tt-block.state-current{border:2px solid #0EA5E9!important}'
  + '#td-root .tt-block.state-current:after{background:#0EA5E9;border-color:#fff;box-shadow:0 0 0 3px #0EA5E9}'
  + '#td-root .tt-block.state-break{background:transparent!important;border-style:dashed!important}'
  + '#td-root .tt-block-hdr{border-radius:18px}'
  + '#td-root .tt-status-badge{border-radius:99px!important;font-size:12px!important;font-weight:900!important;padding:4px 10px!important;letter-spacing:0!important;white-space:nowrap}'
  + '#td-root .td-nowline{position:relative;height:0;margin:2px 0 12px}'
  + '#td-root .td-nowline:before{content:"";position:absolute;left:-14px;right:0;top:0;border-top:2.5px dashed #F43F5E}'
  + '#td-root .td-nowline span{position:absolute;left:-66px;top:-10px;background:#F43F5E;color:#fff;border-radius:99px;padding:2px 7px;font-size:11px;font-weight:900}'
  // side
  + '#td-root .side .card{background:#fff;border:1.5px solid #ECE9F6;border-radius:22px;padding:14px 16px;margin-top:14px}'
  + '#td-root .pnote .pn{display:flex;gap:12px;align-items:flex-start;border-radius:14px;padding:10px 12px;margin-top:8px}'
  + '#td-root .pnote .pn.up{background:#ECFDF3}#td-root .pnote .pn.dn{background:#FFF1EE}'
  + '#td-root .pnote .pn b{font-family:"Rozha One",Georgia,serif!important;font-weight:400!important;font-size:22px;line-height:1.1;min-width:46px}'
  + '#td-root .pnote .pn.up b{color:#15803D}#td-root .pnote .pn.dn b{color:#C2410C}'
  + '#td-root .pnote .pn span{font-weight:700;font-size:14px;color:#1E1B3A}'
  + '#td-root .pnote .pn small{display:block;font-weight:600;font-size:12px;color:#6B6788;margin-top:2px}'
  + '#td-root .side .card.guide{background:linear-gradient(160deg,#FFF8E1,#FFFDF7 60%,#F3EEFF);border:2px solid #F5D48A;box-shadow:0 14px 30px -18px rgba(180,120,0,.45)}'
  + '#td-root .guide .gh{display:flex;gap:12px;align-items:center}'
  + '#td-root .guide .gh>span{font-size:30px}'
  + '#td-root .guide .gt{font-family:"Rozha One",Georgia,serif!important;font-size:21px;line-height:1.2;color:#1E1B3A}'
  + '#td-root .guide .gbar{height:8px;border-radius:99px;background:#F1E7C8;margin-top:12px;overflow:hidden}'
  + '#td-root .guide .gbar i{display:block;height:100%;background:linear-gradient(90deg,#FFC83D,#16A34A);border-radius:99px;transition:width .4s}'
  + '#td-root .guide .gn{font-size:12px;font-weight:800;color:#8A6326;margin-top:5px}'
  + '#td-root .guide .gs{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;background:#fff;border:1.5px solid #F1E7C8;border-radius:14px;padding:10px 12px;margin-top:8px;color:#1E1B3A}'
  + '#td-root .guide .gs:hover{border-color:#F5C04A}'
  + '#td-root .guide .gs .gi{width:32px;height:32px;border-radius:10px;background:#FFF3C4;display:flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto}'
  + '#td-root .guide .gs b{display:block;font-size:14px}'
  + '#td-root .guide .gs small{display:block;font-size:12px;color:#6B6788;font-weight:600}'
  + '#td-root .guide .gs.ok{background:#F0FBF4;border-color:#BFE9CC}'
  + '#td-root .guide .gs.ok .gi{background:#16A34A;color:#fff;font-weight:900}'
  + '#td-root .guide .gs.ok b{text-decoration:line-through;color:#15803D}'
  + '#td-root .guide .gf{margin-top:10px;font-size:12.5px;font-weight:600;color:#6B6788;line-height:1.45}'
  + '#td-root .guide .gx{margin-top:10px;width:100%;border:0;background:transparent;color:#8A6326;font-weight:800;font-size:13px;padding:6px}'
  + '#td-root #td-kind-slot #kd-bar{margin:14px 0 0}'
  + '#td-root #td-kind-slot #kd-bar .closed{flex-wrap:wrap}'
  + '#td-root #td-kind-slot #kd-bar .closed>div:nth-child(2){flex:1 1 150px!important;min-width:150px!important}'
  + '#td-root #td-kind-slot #kd-bar .tap{margin-left:0!important;flex:1 1 100%;text-align:center}'
  + '#td-root #td-kind-slot #kd-bar .open>div:nth-child(2){flex:1 1 150px!important;min-width:150px!important}'
  + '#td-root #td-kind-slot #kd-bar .open{flex-wrap:wrap}'
  + '#td-root .mini{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px dashed #ECE9F6;font-weight:800;font-size:14px;width:100%;background:none;border-left:0;border-right:0;border-bottom:0;text-align:left;color:#1E1B3A}'
  + '#td-root .mini:first-of-type{border-top:0}'
  + '#td-root .mini .e{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex:0 0 auto}'
  + '#td-root .mini .s{margin-left:auto;font-size:12px;font-weight:900;border-radius:99px;padding:3px 10px;white-space:nowrap}'
  + '#td-root .quote{font-family:Fredoka,sans-serif;font-weight:600;font-size:17px;line-height:1.35}'
  + '#td-root .foot{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:18px 0 6px;font-size:12.5px;font-weight:800;color:#6B6788}'
  + '#td-root .foot>*{background:#fff;border:1px solid #ECE9F6;border-radius:99px;padding:5px 12px}'
  + '#td-root .foot button{color:#6B6788;font-weight:800;font-size:12.5px}'
  + '#td-root .foot #sync-status span{font-size:12.5px!important}'
  + '@keyframes tdPulse{0%,100%{opacity:1}50%{opacity:.35}}'
  + '@keyframes tdTw{0%,100%{opacity:.25}50%{opacity:1}}'
  + '@keyframes tdDrift{0%{transform:translateX(-20px)}100%{transform:translateX(20px)}}'
  + '@media (prefers-reduced-motion:reduce){#td-root *,#ab-bar *{animation:none!important}}'
  // computers
  + '@media (min-width:820px){'
  +   '#td-root .hero{padding:26px 30px}'
  +   '#td-root .hero .in{grid-template-columns:1.2fr 1fr .9fr;align-items:center;gap:24px}'
  +   '#td-root .greet{font-size:40px}'
  +   '#td-root .ring{width:150px;height:150px}'
  +   '#td-root .cols{grid-template-columns:minmax(0,1fr) 360px;gap:26px;align-items:start}'
  + '}'
  // phones: the menu becomes a tab bar at the bottom
  + '@media (max-width:819px){'
  +   '#ab-bar .who span{display:none}'
  +   '#ab-bar .pz{padding:4px 12px 4px 4px;gap:8px}'
  +   '#ab-bar .pz .fam{width:36px;height:36px;font-size:18px}'
  +   '#ab-bar .pz b{font-size:15px}'
  +   '#ab-bar .pz small{display:none}'
  +   '#ab-bar .nav{position:fixed;left:0;right:0;bottom:0;margin:0;z-index:9990;border-radius:0;border:0;border-top:1px solid #ECE9F6;background:rgba(255,255,255,.97);'
  +     'backdrop-filter:blur(10px);justify-content:space-around;padding:6px 4px calc(8px + env(safe-area-inset-bottom));gap:0;overflow:visible}'
  +   '#ab-bar .nav .nb{flex-direction:column;gap:1px;padding:4px 2px!important;font-size:10.5px!important;flex:1;min-width:0;background:transparent!important;color:#6B6788!important}'
  +   '#ab-bar .nav .nb i{font-size:21px;line-height:1.2;padding:1px 10px;border-radius:12px}'
  +   '#ab-bar .nav .nb.active{background:transparent!important;color:#5B2A9B!important}'
  +   '#ab-bar .nav .nb.active i{background:#EFE9FF}'
  +   '#ab-bar .nav .nb .l{display:none}'
  +   '#ab-bar .nav .nb .s{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}'
  +   'body.td-on{padding-bottom:78px}'
  +   '#app-frame{margin:0;border-radius:0;border:0;box-shadow:none;padding:10px 10px 16px;background:transparent}'
  +   'body.td-on .page{padding:0}'
  +   '#td-root .greet{font-size:28px}'
  +   '#ab-bar .pz{flex:0 0 auto;min-width:0;margin-left:auto}'
  +   '#ab-bar .pz .arr{display:none}'
  +   '#td-root .sched button{flex:1}'
  + '}';

  function addStyles(){
    if($('td-style')) return;
    var st = document.createElement('style'); st.id = 'td-style'; st.textContent = CSS; document.head.appendChild(st);
    if(!document.querySelector('link[data-sb-font]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-sb-font', '1');
      l.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800;900&display=swap';
      document.head.appendChild(l);
    }
    if(!document.querySelector('link[data-td-font]')){
      var j = document.createElement('link'); j.rel = 'stylesheet'; j.setAttribute('data-td-font', '1');
      j.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Rozha+One&family=Kalam:wght@400;700&display=swap';
      document.head.appendChild(j);
    }
  }
  // The top bar and every page sit inside one framed card.
  function frame(){
    var bar = $('ab-bar'); if(!bar) return;
    var f = $('app-frame');
    if(!f){ f = document.createElement('div'); f.id = 'app-frame'; bar.parentNode.insertBefore(f, bar); }
    if(bar.parentNode !== f) f.appendChild(bar);
    Array.prototype.slice.call(f.parentNode.children).forEach(function(t){ if(t.classList.contains('tab')) f.appendChild(t); });
  }

  // ---- the top bar (every page) ---------------------------------------------------
  function tabId(b){ var m = /showTab\('([a-z]+)'/.exec(b.getAttribute('onclick') || ''); return m ? m[1] : ''; }
  function buildBar(){
    var nav = document.querySelector('.nav'); if(!nav || $('ab-bar')) return !!$('ab-bar');
    addStyles();
    document.body.classList.add('td-on');
    var bar = document.createElement('div'); bar.id = 'ab-bar';
    bar.innerHTML = '<div class="ab-av"><div id="ab-av">⭐</div></div><div class="who"><b id="ab-name">My day</b><span id="ab-sub"></span></div>'
      + '<button class="pz" id="ab-pz" aria-label="Parent Zone"><span class="fam">👪</span><span><b>Parent Zone</b><small id="ab-pz-sub">For grown-ups</small></span><span class="arr">›</span><span class="badge" id="ab-pz-n" style="display:none"></span></button>';
    nav.parentNode.insertBefore(bar, nav);
    bar.insertBefore(nav, $('ab-pz'));
    // the old sync bar (saved / approved / backup) moves to the bottom of Today
    var sync = $('sync-status'); if(sync && sync.parentNode) sync.parentNode.classList.add('ab-oldbar');
    $('ab-pz').addEventListener('click', function(){ var b = $('ns-parent-btn'); if(b) b.click(); });
    relabel();
    frame();
    return true;
  }
  function relabel(){
    Array.prototype.forEach.call(document.querySelectorAll('.nav .nb'), function(b){
      var id = tabId(b), t = TABS[id];
      if(!t || b.getAttribute('data-td')) return;
      b.setAttribute('data-td', '1');
      b.innerHTML = '<i>' + t[0] + '</i><span class="l">' + t[1] + '</span><span class="s">' + t[2] + '</span>';
    });
  }
  function waiting(){
    try{ if(window.niyamParentZone && window.niyamParentZone.count) return window.niyamParentZone.count(); }catch(e){}   // the same count as inside the Parent Zone
    var n = 0, t = today();
    var wait = days().filter(function(d){ return d && d.date < t && d.approved !== true && (parseInt(d.pts, 10) || 0) > 0; }), on = {};
    wait.forEach(function(d){ on[d.date] = 1; }); n += wait.length;
    try{ var K = window.niyamKindness && window.niyamKindness.state(); if(K && K.rows) n += K.rows.filter(function(r){ return r.status === 'done' && !on[r.week]; }).length; }catch(e){}
    return n;
  }
  function updateBar(){
    if(!$('ab-bar')) return;
    var src = $('hdr-avatar'), av = $('ab-av');
    if(src && av){ var img = src.querySelector('img'); av.innerHTML = img ? '<img src="' + esc(img.getAttribute('src')) + '" alt="">' : esc((src.textContent || '⭐').trim() || '⭐'); }
    var lv = levelOf(typeof totalEarned === 'function' ? totalEarned() : 0);
    $('ab-name').textContent = childName() || 'My day';
    $('ab-sub').textContent = (window.niyamChildClass ? window.niyamChildClass + ' · ' : '') + lv.name;
    var n = waiting(), badge = $('ab-pz-n');
    badge.style.display = n ? 'flex' : 'none'; badge.textContent = n > 9 ? '9+' : String(n);
    $('ab-pz-sub').textContent = n ? n + (n === 1 ? ' thing' : ' things') + ' waiting' : 'For grown-ups';
    relabel();
  }

  // ---- the Today page -------------------------------------------------------------------
  function buildToday(){
    var tab = $('tab-report'), tl = $('tt-blocks-container');
    if(!tab || !tl) return false;
    if($('td-root')) return true;
    addStyles();
    var r = document.createElement('div'); r.id = 'td-root';
    r.innerHTML = '<div id="td-hero"></div><div class="cols"><div><div class="cap tl-cap">My day</div><div id="td-tl"></div></div>'
      + '<div class="side"><div id="td-guide"></div><div id="td-pnote"></div><div id="td-kind-slot"></div><div id="td-also"></div><div id="td-thought"></div></div></div><div class="foot" id="td-foot"></div>';
    var lock = $('locked-banner');
    tab.insertBefore(r, lock ? lock.nextSibling : tab.firstChild);
    $('td-tl').appendChild(tl);
    // the date picker moves into the sky; it keeps its own onchange
    var foot = $('td-foot'), sync = $('sync-status');
    if(sync) foot.appendChild(sync);
    var ap = document.createElement('span'); ap.id = 'td-approved'; foot.appendChild(ap);
    var bk = document.createElement('button'); bk.textContent = '⬇️ Backup'; bk.style.cssText = 'border:1px solid #ECE9F6;background:#fff;border-radius:99px;padding:5px 12px;cursor:pointer';
    bk.onclick = function(){ if(typeof exportBackup === 'function') exportBackup(); };
    foot.appendChild(bk);
    r.addEventListener('click', onClick);
    var kb = $('kd-bar'); if(kb) $('td-kind-slot').appendChild(kb);
    built = true;
    return true;
  }

  function decoHtml(m){
    var h = '';
    if(m === 'night'){
      for(var i = 0; i < 28; i++) h += '<i style="position:absolute;left:' + ((i * 37) % 97) + '%;top:' + ((i * 23) % 72) + '%;width:' + (2 + i % 2) + 'px;height:' + (2 + i % 2) + 'px;border-radius:50%;background:#fff;animation:tdTw ' + (2 + i % 3) + 's infinite ' + (i * 0.3).toFixed(1) + 's"></i>';
      h += '<div style="position:absolute;right:34px;top:24px;width:70px;height:70px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FEF9C3,#FDE68A 60%,#FCD34D);box-shadow:0 0 50px rgba(253,230,138,.6)"></div>'
        + '<div style="position:absolute;right:20px;top:14px;width:60px;height:60px;border-radius:50%;background:#312E81"></div>';
    } else {
      var sun = m === 'morning' ? 'right:6%;top:-120px' : m === 'evening' ? 'right:12%;bottom:-160px' : 'right:-60px;bottom:-130px';
      h += '<div style="position:absolute;' + sun + ';width:240px;height:240px;border-radius:50%;opacity:.55;background:radial-gradient(circle,#FEF3C7 0%,#FDE68A 35%,rgba(253,230,138,0) 70%)"></div>';
    }
    return '<div class="deco">' + h + '</div>';
  }
  function renderHero(){
    var el = $('td-hero'); if(!el) return;
    var m = mood(), s = score() || { total:0, max:0, tasks:0, tasksMax:0, brain:0, brainMax:0, parent:0, parentMax:0 };
    var date = dateOpen(), isToday = date === today(), r = rec(date), approved = !!(r && r.approved === true);
    var total = approved ? (parseInt(r.pts, 10) || 0) : s.total, max = Math.max(1, s.max), pct = Math.min(100, Math.round(total / max * 100));
    var name = childName(), inp = $('rpt-date');   // the date picker is kept and put back after the sky is redrawn
    var greet = { morning:'Good morning', afternoon:'Good afternoon', evening:'Good evening', night:'Good night soon' }[m] + (name ? ',<br>' + esc(name) : '') + ' ' + { morning:'🌤️', afternoon:'☀️', evening:'🌇', night:'🌙' }[m];
    if(!isToday) greet = (approved ? 'Approved day' : 'Looking back') + (name ? ',<br>' + esc(name) : '') + ' 📖';
    var dn = dayNo(date);
    if(isToday && dn === 1) greet = 'Welcome to NIYAM' + (name ? ',<br>' + esc(name) : '') + ' 🎉';
    var T = times(), first = T.find(function(t){ return t.b.type !== 'locked-until-3pm' && typeof t.start === 'number'; });
    var weekend = false; try{ weekend = ttIsWeekendSchedule(); }catch(e){}
    var natural = [0, 6].indexOf(new Date(date + 'T12:00:00').getDay()) >= 0;
    var dayType = (first ? 'Your day starts at ' + hm(first.start) : '') + (isToday ? (first ? ' · ' : '') + 'now ' + hm(nowH()) : '');
    if(dn >= 1 && dn <= 7) dayType = 'Day ' + dn + ' of your NIYAM journey' + (dn === 1 ? ' ✨' : '') + (dayType ? ' · ' + dayType : '');
    var toggle = '<div class="sched">'
      + '<button class="' + (weekend ? '' : 'on') + '" data-act="sched" data-m="weekday"' + (isToday ? '' : ' disabled') + '><span class="i">🏫</span><span>School day<small>Mon – Fri timetable</small></span></button>'
      + '<button class="' + (weekend ? 'on' : '') + '" data-act="sched" data-m="holiday"' + (isToday ? '' : ' disabled') + '><span class="i">☀️</span><span>Holiday<small>Sat · Sun · holidays</small></span></button></div>';
    var bank = typeof availablePts === 'function' ? availablePts() : 0, streak = typeof getStreak === 'function' ? getStreak() : 0;
    var goal = ''; try{ var g = window.niyamStarBank && window.niyamStarBank.goal && window.niyamStarBank.goal(); if(g) goal = '<button class="st" data-act="tab" data-t="rewards"><b>' + esc(g.icon) + ' ' + (bank >= g.pts ? '✓' : fmtN(g.pts - bank)) + '</b><span>' + (bank >= g.pts ? 'goal ready!' : 'to my goal') + '</span></button>'; }catch(e){}
    var lv = levelOf(typeof totalEarned === 'function' ? totalEarned() : 0);
    function bar(label, a, b){ return '<div class="sp">' + label + ' · ' + fmtN(a) + ' / ' + fmtN(b) + '<div class="bar"><i style="width:' + (b ? Math.min(100, Math.round(a / b * 100)) : 0) + '%"></i></div></div>'; }
    el.innerHTML = '<div class="hero ' + m + '">' + decoHtml(m) + '<div class="in">'
      + '<div><div class="greet">' + greet + '</div>'
      + '<div class="datenav"><button data-act="prev" aria-label="Previous day">‹</button><span id="td-date-slot"></span><button data-act="next" aria-label="Next day"' + (date >= today() ? ' disabled style="opacity:.35"' : '') + '>›</button></div>'
      + toggle + '<div class="daytype">' + dayType + '</div></div>'
      + '<div class="ringbox"><div class="ring" style="background:conic-gradient(#fff 0 ' + pct + '%,rgba(255,255,255,.28) ' + pct + '% 100%)"><div class="c"><b>' + fmtN(total) + '</b><span>' + (approved ? '✅ approved' : 'of ' + fmtN(s.max) + ' today') + '</span></div></div>'
      + '<div class="split">' + bar('📋 My tasks', s.tasks, s.tasksMax) + (brainOn() ? bar('🧠 Brain Lab', s.brain, s.brainMax) : '') + bar('👨‍👩‍👧 From parents', s.parent, s.parentMax) + '</div></div>'
      + '<div class="stats"><button class="st" data-act="tab" data-t="rewards"><b>⭐ ' + fmtN(bank) + '</b><span>in my Star Bank</span></button>'
      + '<div class="st"><b>🔥 ' + streak + '</b><span>day streak</span></div>' + goal
      + '<div class="st"><b>🏅 Lv ' + lv.n + '</b><span>' + lv.name + '</span></div></div>'
      + '</div></div>';
    var slot = $('td-date-slot');
    if(inp && slot){ if(inp.getAttribute('style')) inp.removeAttribute('style'); slot.appendChild(inp); }
  }

  // Times, results, the green "so far" line and the red "now" line around the timetable.
  function decorate(){
    var box = $('tt-blocks-container'); if(!box || !$('td-root')) return;
    var T = times(), s = score(), isToday = dateOpen() === today(), h = nowH();
    var old = box.querySelector('.td-nowline'); if(old) old.remove();
    var rail = box.querySelector('.td-rail'); if(!rail){ rail = document.createElement('div'); rail.className = 'td-rail'; box.insertBefore(rail, box.firstChild); }
    var lineBefore = null;
    T.forEach(function(t){
      var el = $('ttb-' + t.b.id); if(!el) return;
      el.setAttribute('data-t', typeof t.start === 'number' ? hmShort(t.start) : '');
      var st = stateOf(t), past = st === 'passed' || st === 'done';
      el.classList.toggle('td-past', past && isToday);
      var badge = el.querySelector('.tt-status-badge'); if(!badge) return;
      var b = s && s.blocks ? s.blocks[t.b.id] : null, txt = null, style = null;
      if(t.b.type === 'break'){ txt = 'Break'; style = 'background:transparent;color:#94A3B8'; }
      else if(t.b.type === 'locked-until-3pm'){ txt = '✓ Done'; style = 'background:#DCFCE7;color:#15803D'; }
      else if(st === 'current' && isToday){ txt = '● Now'; style = 'background:#0EA5E9;color:#fff'; }
      else if(b && b.n && (past || b.d)){
        var pts = (b.own || 0) + (b.link || 0) + (b.given || 0), full = b.d >= b.n;
        txt = (full ? '✓ ' : '') + b.d + ' of ' + b.n + (pts ? ' · +' + pts : '');
        style = full ? 'background:#DCFCE7;color:#15803D' : b.d ? 'background:#FEF3C7;color:#92400E' : 'background:#FEE2E2;color:#B91C1C';
      }
      else if(st === 'upcoming' && isToday && typeof t.start === 'number'){ txt = 'Opens ' + hmShort(t.start); style = 'background:#F4F2FB;color:#6B6788'; }
      if(txt){ badge.textContent = txt; badge.setAttribute('style', style); badge.setAttribute('data-label', txt); badge.setAttribute('data-style', style); }
      if(isToday && !lineBefore && typeof t.start === 'number' && (st === 'current' || t.start > h)) lineBefore = el;
    });
    if(isToday){
      var line = document.createElement('div'); line.className = 'td-nowline'; line.innerHTML = '<span>' + hmShort(h) + '</span>';
      if(lineBefore) box.insertBefore(line, lineBefore); else box.appendChild(line);
      var top = line.offsetTop; rail.style.setProperty('--done', Math.max(0, top - 10) + 'px');
    } else {
      var allPast = dateOpen() < today();
      rail.style.setProperty('--done', allPast ? (box.scrollHeight - 20) + 'px' : '0px');
    }
  }

  // ---- Day 1: a short guide that ticks itself off ----
  function renderGuide(){
    var g = $('td-guide'); if(!g) return;
    var t = today(), off = false; try{ off = localStorage.getItem('niyam_guide_done') === t; }catch(e){}
    if(dateOpen() !== t || dayNo(t) !== 1 || off){ g.innerHTML = ''; return; }
    var ticked = false; try{ Object.keys(ttBlockStates || {}).forEach(function(k){ var st = ttBlockStates[k] || {}, c = st.checkedActs || {}; if(num(st.pts) > 0) ticked = true; for(var a in c) if(c[a]) ticked = true; }); }catch(e){}
    var kind = false; try{ kind = localStorage.getItem('niyam_kind_open') === t; }catch(e){}
    var brain = false; try{ var BL = window.niyamBrainLab && window.niyamBrainLab.state && window.niyamBrainLab.state();
      if(BL && BL.date === t) brain = !!BL.sudoku.level || ['riddle','logic','maths'].some(function(x){ return BL[x] && Object.keys(BL[x].ans || {}).length; }); }catch(e){}
    var word = false; try{ Object.keys(ttBlockStates || {}).forEach(function(k){ var w = (ttBlockStates[k] || {}).words || {}; Object.keys(w).forEach(function(a){ if((w[a] || []).some(function(x){ return x && x.w; })) word = true; }); }); }catch(e){}
    var steps = [[ticked, '✅', 'Tick a task when you finish it', 'It turns green and earns points.', 'tick'],
                 [kind, '🎁', 'Open today’s surprise', 'One Act of Kindness, just for today.', 'kind']];
    if(brainOn()) steps.push([brain, '🧠', 'Try the Brain Lab', 'Four thinking challenges from great Indian thinkers.', 'brain']);
    steps.push([word, '📖', 'Add a new word', 'Start your very own dictionary.', 'word']);
    var done = steps.filter(function(x){ return x[0]; }).length, all = done === steps.length;
    g.innerHTML = '<div class="card guide"><div class="gh"><span>🎉</span><div><div class="cap" style="color:#B45309">Day 1 · Welcome aboard</div>'
      + '<div class="gt">' + (all ? 'Day 1 complete! You are a natural 🌟' : 'Here is how NIYAM works, ' + esc(String(childName()).split(' ')[0] || 'superstar') + '!') + '</div></div></div>'
      + '<div class="gbar"><i style="width:' + Math.round(done / steps.length * 100) + '%"></i></div><div class="gn">' + done + ' of ' + steps.length + ' done</div>'
      + steps.map(function(x){ return '<button class="gs' + (x[0] ? ' ok' : '') + '" data-act="guide" data-g="' + x[4] + '"><span class="gi">' + (x[0] ? '✓' : x[1]) + '</span><span><b>' + x[2] + '</b><small>' + x[3] + '</small></span></button>'; }).join('')
      + '<div class="gf">⭐ Tonight your parent checks your day, and your points go into your <b>Star Bank</b>.</div>'
      + '<button class="gx" data-act="guidex">' + (all ? 'Yay! Close this' : 'Got it — hide this') + '</button></div>';
  }
  // Bonuses and deductions a parent gave in the last 3 days, with the reason.
  function renderParentNote(){
    var el = $('td-pnote'); if(!el) return;
    var since = new Date(); since.setDate(since.getDate() - 3); since = since.toLocaleDateString('en-CA');
    var items = [];
    days().forEach(function(d){
      if(!d || d.approved !== true || d.date < since || !d.reviewJSON) return;
      var rv = {}; try{ rv = JSON.parse(d.reviewJSON) || {}; }catch(e){}
      (rv.adjust || []).forEach(function(x){ items.push({ date:d.date, pts:num(x.pts), why:x.reason || '' }); });
    });
    if(!items.length){ el.innerHTML = ''; return; }
    items.sort(function(a, b){ return a.date < b.date ? 1 : -1; });
    var nm = esc(String(childName()).split(' ')[0] || '');
    el.innerHTML = '<div class="card pnote"><div class="cap" style="color:#5B2A9B">From your parent</div>'
      + items.slice(0, 4).map(function(x){
          var up = x.pts >= 0, dd = new Date(x.date + 'T12:00:00');
          return '<div class="pn ' + (up ? 'up' : 'dn') + '"><b>' + (up ? '+' : '−') + Math.abs(x.pts) + '</b><span>' + esc(x.why) + '<small>'
            + (up ? 'Bonus · well done' + (nm ? ', ' + nm : '') + '! 🌟' : 'Points taken off · tomorrow is a new chance 💪') + ' · ' + dd.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' }) + '</small></span></div>';
        }).join('') + '</div>';
  }
  function renderSide(){
    renderGuide();
    renderParentNote();
    var el = $('td-also'); if(!el) return;
    var rows = [];
    if(brainOn()) try{
      var BL = window.niyamBrainLab && window.niyamBrainLab.state && window.niyamBrainLab.state();
      if(!BL && window.niyamBrainLab && window.niyamBrainLab.score){ window.niyamBrainLab.score(); BL = window.niyamBrainLab.state(); }
      if(BL && BL.date === dateOpen()){ var n = ['riddle','logic','maths','sudoku'].filter(function(g){ return BL[g] && BL[g].done; }).length;
        rows.push(['🧠', '#EDE9FE', 'Brain Lab', n + ' of 4' + (n === 4 ? ' ✓' : n ? ' done' : ' · any time'), n === 4 ? 'ok' : '', 'brain']); }
    }catch(e){}
    try{
      var S = schedule(), wb = null, sh = null;
      S.forEach(function(b){ (b.activities || []).forEach(function(a){ if(!wb && a.type === 'wordbook') wb = { b:b, a:a }; if(!sh && /shloka|geeta/i.test((a.name || '') + ' ' + (b.name || ''))) sh = { b:b, a:a }; }); });
      if(wb){ var st = (ttBlockStates[wb.b.id] || {}), w = ((st.words || {})[wb.a.id] || []).filter(function(x){ return x && x.w && x.m && x.e; }).length, wp = (st.wordPts || {})[wb.a.id] || 0;
        rows.push(['📖', '#E0F2FE', 'New words', Math.min(w, 9) + ' of 9' + (wp ? ' · +' + wp : ''), w >= 9 ? 'ok' : w ? 'mid' : '', 'wordbook']); }
      if(sh){ var s2 = (ttBlockStates[sh.b.id] || {}), dn = !!((s2.checkedActs || {})[sh.a.id]) || (s2.parentPts && s2.parentPts[sh.a.id] !== undefined);
        var tt = times().find(function(t){ return t.b.id === sh.b.id; });
        rows.push(['🕉️', '#FFEDD5', 'Geeta shloka', dn ? 'Done ✓' : tt && typeof tt.start === 'number' ? 'At ' + hm(tt.start) : 'Today', dn ? 'ok' : '', 'geeta']); }
    }catch(e){}
    try{ var rd = window.niyamStarBank && window.niyamStarBank.ready ? window.niyamStarBank.ready() : 0;
      rows.push(['🏆', '#FEF3C7', 'Star Bank', rd ? rd + (rd === 1 ? ' reward' : ' rewards') + ' ready ✨' : 'Keep saving ⭐', 'gold', 'rewards']); }catch(e){}
    var styles = { ok:'background:#DCFCE7;color:#15803D', mid:'background:#E0F2FE;color:#0369A1', gold:'background:#FEF3C7;color:#9A6400', '':'background:#F4F2FB;color:#6B6788' };
    el.innerHTML = '<div class="card"><div class="cap" style="color:#5B2A9B">Also today</div>'
      + rows.map(function(r){ return '<button class="mini" data-act="tab" data-t="' + r[5] + '"><span class="e" style="background:' + r[1] + '">' + r[0] + '</span>' + r[2] + '<span class="s" style="' + styles[r[4]] + '">' + esc(r[3]) + '</span></button>'; }).join('') + '</div>';
    var q = $('td-thought');
    if(q && !q.innerHTML){
      try{
        var L = (typeof QUOTES_L !== 'undefined' && QUOTES_L.length) ? QUOTES_L : null;
        if(L){ var k = 0, d = today(); for(var i = 0; i < d.length; i++) k = (k * 31 + d.charCodeAt(i)) % 9973; var Q = L[k % L.length];
          q.innerHTML = '<div class="card thought"><span class="pin">📌</span><div class="cap">Thought for today</div>'
            + '<div class="q">“' + esc(Q.text) + '”</div><div class="by">— ' + esc(Q.author || '') + '</div></div>'; }
      }catch(e){}
    }
    var ap = $('td-approved'); if(ap) ap.textContent = '✅ ' + days().filter(function(d){ return d.approved === true; }).length + ' days approved';
  }

  function refresh(){
    if(!buildBar()) return;
    updateBar();
    if(!buildToday()) return;
    renderHero(); decorate(); renderSide();
    var kb = $('kd-bar'), slot = $('td-kind-slot'); if(kb && slot && kb.parentNode !== slot) slot.appendChild(kb);
  }
  function light(){ try{ if($('td-root')){ renderHero(); decorate(); renderSide(); } updateBar(); }catch(e){ console.warn('[today] refresh:', e); } }

  // ---- taps ----------------------------------------------------------------------------------
  function goTab(id){
    var b = Array.prototype.find.call(document.querySelectorAll('.nav .nb'), function(x){ return tabId(x) === id; });
    if(b) b.click();
  }
  function onClick(e){
    var b = e.target.closest('[data-act]'); if(!b || b.disabled) return;
    var act = b.getAttribute('data-act');
    if(act === 'prev' || act === 'next'){
      var inp = $('rpt-date'); if(!inp) return;
      var d = new Date((inp.value || today()) + 'T12:00:00'); d.setDate(d.getDate() + (act === 'prev' ? -1 : 1));
      var v = d.toLocaleDateString('en-CA'); if(v > today()) return;
      inp.value = v; inp.dispatchEvent(new Event('change', { bubbles:true }));
      return;
    }
    if(act === 'sched'){ var mode = b.getAttribute('data-m'), w = false; try{ w = ttIsWeekendSchedule(); }catch(err){}
      if((mode === 'holiday') !== w && typeof lp_setSchedule === 'function') lp_setSchedule(mode);
      light(); return; }
    if(act === 'tab'){ goTab(b.getAttribute('data-t')); return; }
    if(act === 'reveal'){ setTimeout(renderGuide, 80); return; }   // the kindness surprise was opened (js/13-kindness.js)
    if(act === 'guidex'){ try{ localStorage.setItem('niyam_guide_done', today()); }catch(err){} renderGuide(); return; }
    if(act === 'guide'){
      var g = b.getAttribute('data-g'), to = g === 'tick' ? $('td-tl') : g === 'kind' ? $('kd-bar') : null;
      if(g === 'brain'){ goTab('brain'); return; }
      if(g === 'word'){ goTab('wordbook'); return; }
      if(to && to.scrollIntoView) to.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }
  }

  // ---- Parent Zone: Clear lives here now ------------------------------------------------------
  function parentTools(){
    var host = typeof window.niyamParentFamilyHost === 'function' ? window.niyamParentFamilyHost() : null;
    if(!host || $('pz-daytools')) return;
    var box = document.createElement('div'); box.id = 'pz-daytools';
    box.innerHTML = '<div class="pz-card"><div class="pz-h"><span>🧹 Day tools</span></div>'
      + '<div class="pz-note">Start the open day again: clears the ticks and entries for the day shown on your child’s page. Saved and approved days are kept.</div>'
      + '<button class="pz-btn" style="margin-top:8px" id="pz-clear">🗑️ Clear this day’s report</button></div>';
    host.appendChild(box);
    $('pz-clear').onclick = function(){ if(typeof clearDay === 'function') clearDay(); };
  }

  // ---- connections -------------------------------------------------------------------------------
  if(typeof ttRender === 'function'){
    var tr = ttRender;
    ttRender = function(){ var r = tr.apply(this, arguments); try{ if($('td-root')) decorate(); }catch(e){} return r; };
  }
  if(typeof calcDayPts === 'function'){
    var cd = calcDayPts;
    calcDayPts = function(){ var r = cd.apply(this, arguments); try{ light(); }catch(e){} return r; };
  }
  if(typeof updateTopBar === 'function'){
    var ut = updateTopBar;
    updateTopBar = function(){ var r = ut.apply(this, arguments); try{ light(); }catch(e){} return r; };
  }
  if(typeof showTab === 'function'){
    var show = showTab;
    showTab = function(id){ var r = show.apply(this, arguments); try{ if(id === 'report') refresh(); else updateBar(); }catch(e){} var rp = $('right-panel'); if(rp) rp.style.display = 'none'; return r; };
  }
  if(typeof window.niyamOpenReview === 'function'){
    var or = window.niyamOpenReview;
    window.niyamOpenReview = function(){ var r = or.apply(this, arguments); try{ parentTools(); }catch(e){} return r; };
  }
  function start(){
    try{ refresh(); }catch(e){ console.error('[today] start:', e); }
    if(!timer) timer = setInterval(light, 60000);       // the sky, the "now" line and the minutes left
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // once the family's data is in: the Star Bank's waiting rewards count in the Parent Zone button
  (function wait(n){
    if(typeof _supabase !== 'undefined' && _supabase && (typeof dbReady === 'undefined' || dbReady)){
      try{ if(window.niyamStarBank && window.niyamStarBank.reload) window.niyamStarBank.reload().then(light); }catch(e){}
      light(); return;
    }
    if(n < 120) setTimeout(function(){ wait(n + 1); }, 500);
  })(0);

  window.niyamToday = { refresh: refresh, light: light };
})();
