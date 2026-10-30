// ============================================================================
// NIYAM — js/15-parent-zone.js
// The Parent Zone, redesigned (23 Oct 2026): a calm, grown-up space.
// Loads LAST, after js/14-today.js.
//
//   Today      — every day waiting for approval, one card each: the parent's
//                score (tasks only a parent can judge, the Act of Kindness),
//                a grade, and Approve. "See the full day" opens the rest in
//                place: what the child wrote, Brain Lab, the ticks, a note.
//                Days still waiting from earlier are shown first, in red.
//                On the side: this week's points and "Tonight at dinner".
//   Progress   — the month as a calendar (grade and points on each day; tap a
//                day to reopen or delete it), points per day, how often each
//                part of the day was done, and the Geeta shlokas (learning /
//                mastered / relearning, with Mark as mastered and Move to
//                relearning).
//   Timetable  — the school-day and holiday timetable; Edit opens the
//                timetable editor (js/06-timetable-admin.js).
//   Rewards    — the rewards list: edit, add, delete, back to NIYAM's list.
//   Settings   — child, PIN, backup, clear the open day, log out, and which
//                parts of the app the child sees.
//
// Nothing here counts or saves points by itself: approval goes through
// js/09-parent-review.js (window.niyamReview), kindness through
// js/13-kindness.js (window.niyamKindness), Geeta through js/01-core.js
// (_parentApproveShloka / _moveToRelearning), rewards through js/00-shell.js
// (window.niyamSaveRewards). The old Parent Zone stays in the page, hidden,
// because older code still reads its fields.
// ============================================================================
(function(){
  'use strict';

  var PZ = { page:'today', open:{}, exp:{}, apOpen:{}, apw:0, kind:{}, carry:{}, busy:false, month:null, sel:null, shl:null, tt:null, rw:null, rwNew:false, pin:null };
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var WD = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var LEVELS = [['everyday','Everyday treats','once a day'],['weekend','Weekend treats',''],['big','Big rewards',''],['dream','Dream rewards','']];
  var EMOJI = ['🍨','🎮','🍕','🌙','🎲','🧹','🎬','🧁','🍦','📚','🍿','🌟','⚽','🦁','👑','🚲','🎨','🧸','🎭','🚆','🌈','✨','🏊','🎤'];

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
  function child(){ return window.niyamChildName || 'your child'; }
  function first(){ return String(child()).split(' ')[0]; }
  function R(){ return window.niyamReview; }
  function NK(){ return window.niyamKindness; }
  function kRows(){ try{ var K = NK() && NK().state(); return (K && K.rows) || []; }catch(e){ return []; } }
  function shortDay(d){ var x = dObj(d); return WD[x.getDay()].slice(0, 3) + ' ' + x.getDate() + ' ' + MONTHS[x.getMonth()].slice(0, 3); }
  function longDay(d){ var x = dObj(d); return WD[x.getDay()] + ', ' + x.getDate() + ' ' + MONTHS[x.getMonth()]; }
  function plural(n, a, b){ return n + ' ' + (n === 1 ? a : b); }
  function bank(){ try{ return availablePts(); }catch(e){ return 0; } }
  function streak(){ try{ return getStreak(); }catch(e){ return 0; } }
  function toast(msg){
    var t = $('pz2-toast'); if(!t){ t = document.createElement('div'); t.id = 'pz2-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(function(){ t.style.display = 'none'; }, 3400);
  }
  // About how many points a good day brings (the same rule as the Star Bank).
  function goodDay(){
    var since = addDays(today(), -30);
    var ok = days().filter(function(d){ return d && d.approved === true && d.date >= since && num(d.pts) > 0; });
    if(ok.length >= 3) return Math.max(40, Math.round(ok.reduce(function(a, d){ return a + num(d.pts); }, 0) / ok.length));
    try{ var m = window.niyamDayMax ? window.niyamDayMax(weekdayList()) : 0; if(m > 0) return Math.max(40, Math.round(m * 0.75)); }catch(e){}
    return 125;
  }
  function weekdayList(){ var C = window.TT_CUSTOM || {}; return (C.weekday && C.weekday.length) ? C.weekday : (typeof TT_WEEKDAY !== 'undefined' ? TT_WEEKDAY : []); }
  function weekendList(){ var C = window.TT_CUSTOM || {}; return (C.weekend && C.weekend.length) ? C.weekend : (typeof TT_WEEKEND !== 'undefined' ? TT_WEEKEND : []); }

  var P = {
    today:'<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4M8.5 15l2.5 2.5 4.5-5"/>',
    progress:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    timetable:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    rewards:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    left:'<path d="M19 12H5M11 6l-6 6 6 6"/>', right:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    down:'<path d="M6 9l6 6 6-6"/>', up:'<path d="M6 15l6-6 6 6"/>', tick:'<path d="M5 12.5l4.5 4.5L19 7"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
    pen:'<path d="M4 20h4L19 9l-4-4L4 16z"/>', trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', plus:'<path d="M12 5v14M5 12h14"/>',
    book:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16"/>', heart:'<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 019-3 4.8 4.8 0 019 3c-2 4.6-9 9-9 9z"/>',
    spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    dl:'<path d="M12 3v12M6 11l6 6 6-6M4 21h16"/>', out:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>', alert:'<path d="M12 3l10 18H2zM12 10v5M12 18v.5"/>'
  };
  function I(n, s){ return '<svg class="i" viewBox="0 0 24 24"' + (s ? ' style="' + s + '"' : '') + '>' + P[n] + '</svg>'; }

  // ---- styles ---------------------------------------------------------------------------
  var CSS = ''
  + '#ns-parent-zone.pz2-on{background:#F6F3EC}'
  + '#ns-parent-zone.pz2-on>#ns-pz-bar,#ns-parent-zone.pz2-on>#ns-pz-body{display:none!important}'
  + '#pz2{--paper:#F6F3EC;--paper2:#EFEBE1;--ink:#151A2C;--ink2:#454B5F;--mute:#7E8292;--line:#E5E0D4;--line2:#EFEBE2;--navy:#151A2C;--brass:#A57A35;--brass2:#C79A4E;--brass-soft:#F4EBD9;'
  +   '--sage:#3C7457;--sage-soft:#E3EEE6;--rust:#B0503A;--rust-soft:#F5E4DD;--sky:#3E6A8F;--sky-soft:#E2EAF1;'
  +   'display:grid;grid-template-columns:250px minmax(0,1fr);min-height:100vh;background:var(--paper);color:var(--ink);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:14px;line-height:1.45;-webkit-font-smoothing:antialiased;text-align:left}'
  + '#pz2 *{box-sizing:border-box}'
  + '#pz2 button{font-family:inherit;cursor:pointer;color:inherit}'
  + '#pz2 button:disabled{opacity:.5;cursor:default}'
  + '#pz2 .serif,#pz2 h1,#pz2 h2{font-family:Fraunces,Georgia,serif;font-optical-sizing:auto}'
  + '#pz2 .num{font-family:Fraunces,Georgia,serif;font-variant-numeric:lining-nums tabular-nums}'
  + '#pz2 .eyebrow{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--mute)}'
  + '#pz2 svg.i{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}'
  // side menu
  + '#pz2 .side{background:var(--navy);color:#E9E6DD;padding:24px 16px 18px;display:flex;flex-direction:column;gap:4px;position:sticky;top:0;height:100vh;overflow:hidden}'
  + '#pz2 .side:before{content:"";position:absolute;right:-120px;top:-120px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(199,154,78,.16),rgba(199,154,78,0) 70%);pointer-events:none}'
  + '#pz2 .brand{display:flex;align-items:center;gap:10px;padding:0 8px 18px;position:relative}'
  + '#pz2 .mark{width:34px;height:34px;border-radius:10px;border:1.5px solid var(--brass2);display:flex;align-items:center;justify-content:center;font-family:Fraunces,serif;font-size:18px;color:var(--brass2)}'
  + '#pz2 .brand b{display:block;font-family:Fraunces,serif;font-weight:600;font-size:18px;letter-spacing:.06em;color:#fff}'
  + '#pz2 .brand span{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#9B9AA3}'
  + '#pz2 .kid{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:11px;margin-bottom:12px}'
  + '#pz2 .kid .av{width:40px;height:40px;border-radius:50%;background:#2B3352;display:flex;align-items:center;justify-content:center;font-size:19px;box-shadow:0 0 0 2px var(--brass2);overflow:hidden;flex:0 0 auto}'
  + '#pz2 .kid .av img{width:100%;height:100%;object-fit:cover}'
  + '#pz2 .kid b{display:block;font-size:14px;font-weight:600;color:#fff}'
  + '#pz2 .kid span{font-size:12px;color:#A9A8B0}'
  + '#pz2 .navl{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#7E7F8C;padding:12px 10px 6px}'
  + '#pz2 .nv{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;color:#C9C7C0;font-weight:500;font-size:14px;background:none;border:0;width:100%;text-align:left}'
  + '#pz2 .nv:hover{background:rgba(255,255,255,.06)}'
  + '#pz2 .nv.on{background:#F6F3EC;color:var(--ink);font-weight:600}'
  + '#pz2 .nv .ct{margin-left:auto;background:var(--brass2);color:#1A1405;border-radius:99px;font-size:11.5px;font-weight:700;padding:1px 8px}'
  + '#pz2 .nv.on .ct{background:var(--ink);color:#fff}'
  + '#pz2 .grow{flex:1}'
  + '#pz2 .back{display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:11px 12px;color:#fff;font-weight:600;font-size:13.5px;background:none;width:100%;margin-top:6px}'
  + '#pz2 .back:hover{background:rgba(255,255,255,.06)}'
  // main
  + '#pz2 .main{padding:28px 36px 60px;min-width:0;max-width:1320px}'
  + '#pz2 .head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px;flex-wrap:wrap}'
  + '#pz2 h1{margin:6px 0 0;font-weight:500;font-size:38px;line-height:1.08;letter-spacing:-.01em}'
  + '#pz2 h1 em,#pz2 h2 em{font-style:italic;color:var(--brass)}'
  + '#pz2 .head p{margin:8px 0 0;color:var(--ink2);font-size:15px}'
  + '#pz2 .cols{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:20px;align-items:start}'
  + '#pz2 .stack>*+*{margin-top:16px}'
  + '#pz2 .card{background:#fff;border:1px solid var(--line);border-radius:22px;padding:20px 22px;box-shadow:0 18px 40px -30px rgba(21,26,44,.25)}'
  + '#pz2 h2{margin:0;font-weight:500;font-size:21px}'
  + '#pz2 h2 small{font-family:Inter,sans-serif;font-size:13px;font-weight:500;color:var(--mute);margin-left:8px}'
  + '#pz2 .ch{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap}'
  + '#pz2 .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;padding:10px 16px;font-weight:600;font-size:13.5px;border:1px solid var(--line);background:#fff;color:var(--ink);white-space:nowrap}'
  + '#pz2 .btn:hover{border-color:#CFC9BB}'
  + '#pz2 .btn.dark{background:var(--ink);color:#fff;border-color:var(--ink)}'
  + '#pz2 .btn.dark:hover{background:#262C44}'
  + '#pz2 .btn.red{color:var(--rust)}'
  + '#pz2 .btn.sm{padding:7px 12px;font-size:13px;border-radius:10px}'
  + '#pz2 .lnk{color:var(--ink2);font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;background:none;border:0;padding:4px 0}'
  + '#pz2 .lnk.b{color:var(--brass)}'
  + '#pz2 .tag{display:inline-flex;align-items:center;gap:6px;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:600;white-space:nowrap}'
  + '#pz2 .t-sage{background:var(--sage-soft);color:var(--sage)}#pz2 .t-rust{background:var(--rust-soft);color:var(--rust)}#pz2 .t-brass{background:var(--brass-soft);color:#8A6326}#pz2 .t-sky{background:var(--sky-soft);color:var(--sky)}#pz2 .t-mute{background:var(--paper2);color:var(--ink2)}'
  + '#pz2 .seg{display:inline-flex;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff;flex:0 0 auto}'
  + '#pz2 .seg button{border:0;border-left:1px solid var(--line);background:#fff;padding:8px 12px;font-weight:600;font-size:13px;color:var(--ink2);min-width:42px}'
  + '#pz2 .seg button:first-child{border-left:0}'
  + '#pz2 .seg button:hover{background:var(--paper)}'
  + '#pz2 .seg button.on{background:var(--ink);color:#fff}'
  + '#pz2 .seg button.no{color:var(--rust)}#pz2 .seg button.no.on{background:var(--rust);color:#fff}'
  // day cards
  + '#pz2 .day{background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:0 18px 40px -30px rgba(21,26,44,.25);overflow:hidden}'
  + '#pz2 .day+.day{margin-top:14px}'
  + '#pz2 .day.late{border-color:#E6C2B6;box-shadow:inset 4px 0 0 var(--rust),0 18px 40px -30px rgba(21,26,44,.25)}'
  + '#pz2 .dtop{display:flex;align-items:center;gap:16px;padding:18px 22px;width:100%;background:none;border:0;text-align:left;font:inherit}'
  + '#pz2 .chev{color:var(--mute);flex:0 0 auto;display:flex}'
  + '#pz2 .tile{display:flex;align-items:center;gap:16px;width:100%;text-align:left;font:inherit;background:#fff;border:1px solid var(--line);border-radius:18px;padding:12px 18px;box-shadow:0 12px 30px -26px rgba(21,26,44,.3)}'
  + '#pz2 .tile+.tile,#pz2 .tile+.day,#pz2 .day+.tile{margin-top:10px}'
  + '#pz2 .tile:hover{border-color:#CFC9BB}'
  + '#pz2 .tile .dbadge{width:48px;height:50px;border-radius:13px}#pz2 .tile .dbadge b{font-size:20px}'
  + '#pz2 .tile .tx{flex:1;min-width:0}'
  + '#pz2 .tile .tx b{display:block;font-family:Fraunces,serif;font-weight:500;font-size:18px}'
  + '#pz2 .tile .tx span{color:var(--mute);font-size:13px}'
  + '#pz2 .tile.late{border-color:#E6C2B6;box-shadow:inset 4px 0 0 var(--rust)}'
  + '#pz2 .tile.late .dbadge{background:var(--rust-soft);border-color:#EBCFC5}#pz2 .tile.late .dbadge b{color:var(--rust)}'
  + '#pz2 .tile.ok .dbadge{background:var(--sage-soft);border-color:#CFE0D4}#pz2 .tile.ok .dbadge b{color:var(--sage)}'
  + '#pz2 .apv{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden}'
  + '#pz2 .apv+.apv{margin-top:10px}'
  + '#pz2 .apv .tile{border:0;border-radius:0;box-shadow:none}'
  + '#pz2 .apbody{padding:4px 22px 18px;border-top:1px solid var(--line2)}'
  + '#pz2 .wk{display:flex;align-items:center;gap:6px}'
  + '#pz2 .wk button{width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;padding:0}'
  + '#pz2 .wk span{font-weight:600;font-size:13px;color:var(--ink2);min-width:120px;text-align:center}'
  + '#pz2 .tile.wait{border-color:#E6C2B6;box-shadow:inset 4px 0 0 var(--rust),0 12px 30px -26px rgba(21,26,44,.3)}'
  + '#pz2 .tile.wait .dbadge{background:var(--rust-soft);border-color:#EBCFC5}#pz2 .tile.wait .dbadge b{color:var(--rust)}'
  + '#pz2 .tile.wait .tx>span{color:var(--rust)}'
  + '#pz2 .day.wait{border-color:#E6C2B6;box-shadow:inset 4px 0 0 var(--rust),0 18px 40px -30px rgba(21,26,44,.25)}'
  + '#pz2 .day.wait .dbadge{background:var(--rust-soft);border-color:#EBCFC5}#pz2 .day.wait .dbadge b{color:var(--rust)}'
  + '#pz2 .apv{border-color:#C8DDCF;box-shadow:inset 4px 0 0 var(--sage)}'
  + '#pz2 .apv .tile{background:transparent}'
  + '#pz2 .okl{color:var(--sage)!important;font-weight:600}'
  + '#pz2 .hsec{display:flex;align-items:center;gap:10px;margin:28px 0 12px}'
  + '#pz2 .hsec:first-child{margin-top:0}'
  + '#pz2 .hsec h2{font-size:24px;font-weight:600}'
  + '#pz2 .hsec .cnt{min-width:26px;height:26px;border-radius:99px;padding:0 8px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff}'
  + '#pz2 .hsec.r h2{color:var(--rust)}#pz2 .hsec.r .cnt{background:var(--rust)}'
  + '#pz2 .hsec.g h2{color:var(--sage)}#pz2 .hsec.g .cnt{background:var(--sage)}'
  + '#pz2 .rcol{align-self:stretch}'
  + '#pz2 .live{position:sticky;top:16px;z-index:2}'
  + '#pz2 .live.on{border:1.5px solid var(--ink);box-shadow:0 22px 44px -28px rgba(21,26,44,.45)}'
  + '#pz2 .live .ln{display:flex;justify-content:space-between;padding:9px 0;border-top:1px dashed var(--line);color:var(--ink2)}'
  + '#pz2 .live .ln:first-of-type{margin-top:10px;border-top:0}'
  + '#pz2 .live .ln b{font-family:Fraunces,serif;font-weight:500;font-size:17px;color:var(--ink)}'
  + '#pz2 .live .ln.neg b{color:var(--rust)}#pz2 .live .ln.pos b{color:var(--sage)}'
  + '#pz2 .live .tot{display:flex;justify-content:space-between;align-items:flex-end;border-top:1.5px solid var(--ink);margin-top:6px;padding-top:12px;font-weight:600}'
  + '#pz2 .live .tot .big{font-size:46px}'
  + '#pz2 .bankline{margin-top:10px;background:var(--paper);border-radius:12px;padding:4px 12px;font-size:13px;color:var(--ink2)}'
  + '#pz2 .bankline div{display:flex;justify-content:space-between;gap:10px;padding:6px 0}'
  + '#pz2 .bankline div+div{border-top:1px solid var(--line)}'
  + '#pz2 .bankline b{color:var(--ink);white-space:nowrap}'
  + '#pz2 .livebar{display:none}'
  + '#pz2 .notice{display:flex;align-items:center;gap:10px;background:var(--rust-soft);border:1px solid #EBCFC5;color:#7A3524;border-radius:14px;padding:10px 14px;margin-bottom:14px;font-size:13.5px}'
  + '#pz2 .notice b{color:#6B2C1D}'
  + '#pz2 .dbadge{width:58px;height:62px;border-radius:16px;background:var(--paper);border:1px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;flex:0 0 auto}'
  + '#pz2 .dbadge b{font-family:Fraunces,serif;font-weight:500;font-size:25px;line-height:1}'
  + '#pz2 .dbadge span{font-size:10.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-top:3px}'
  + '#pz2 .late .dbadge{background:var(--rust-soft);border-color:#EBCFC5}#pz2 .late .dbadge b{color:var(--rust)}'
  + '#pz2 .dtop .tx{flex:1;min-width:0}'
  + '#pz2 .dtop .tx b{display:block;font-family:Fraunces,serif;font-weight:500;font-size:21px}'
  + '#pz2 .dtop .tx span{color:var(--mute);font-size:13px}'
  + '#pz2 .dsec{padding:0 22px 14px}'
  + '#pz2 .lab{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--brass);padding:14px 0 4px;border-top:1px solid var(--line2)}'
  + '#pz2 .lab small{letter-spacing:.02em;text-transform:none;font-weight:500;color:var(--mute);font-size:12px}'
  + '#pz2 .srow{display:flex;align-items:center;gap:14px;padding:10px 0;flex-wrap:wrap}'
  + '#pz2 .srow .nm{flex:1 1 220px;min-width:0;font-weight:600}'
  + '#pz2 .srow .nm small{display:block;font-weight:400;color:var(--mute);font-size:12.5px}'
  + '#pz2 .dfoot{display:flex;align-items:center;gap:12px;padding:14px 22px;background:#FBF9F4;border-top:1px solid var(--line2);flex-wrap:wrap}'
  + '#pz2 .dfoot .sum{flex:1;color:var(--mute);font-size:12.5px;text-align:right;min-width:160px}'
  + '#pz2 .gch{display:flex;gap:6px}'
  + '#pz2 .gch button{width:40px;height:38px;border-radius:10px;border:1px solid var(--line);background:#fff;font-family:Fraunces,serif;font-size:17px}'
  + '#pz2 .gch button.on{background:var(--ink);color:#fff;border-color:var(--ink)}'
  + '#pz2 .words{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:6px 0 8px}'
  + '#pz2 .word{border:1px solid var(--line);border-radius:14px;padding:12px 14px;background:linear-gradient(180deg,#fff,#FBF9F4)}'
  + '#pz2 .word b{font-family:Fraunces,serif;font-weight:600;font-size:18px}'
  + '#pz2 .word div{color:var(--ink2);font-size:13px;margin-top:2px}'
  + '#pz2 .word i{display:block;font-family:Fraunces,serif;font-size:14px;margin-top:6px;color:var(--ink)}'
  + '#pz2 .quote{border-left:3px solid var(--brass2);padding:4px 0 4px 12px;margin:6px 0;font-family:Fraunces,serif;font-style:italic;color:var(--ink2);white-space:pre-wrap;overflow-wrap:anywhere}'
  + '#pz2 .blk{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin:12px 0 0;display:flex;justify-content:space-between;gap:10px}'
  + '#pz2 .task{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line2);width:100%;background:none;border-left:0;border-right:0;border-bottom:0;text-align:left;font-size:14px}'
  + '#pz2 button.task:hover{background:#FCFBF8}'
  + '#pz2 .box{width:22px;height:22px;border-radius:7px;border:1.5px solid #CFC9BB;display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#fff}'
  + '#pz2 .box.on{background:var(--sage);border-color:var(--sage)}'
  + '#pz2 .box svg.i{width:14px;height:14px;stroke-width:2.6}'
  + '#pz2 .task .nm{flex:1;min-width:0;font-weight:500}'
  + '#pz2 .task .nm small{display:block;color:var(--mute);font-size:12px;font-weight:400}'
  + '#pz2 .task.off .nm{color:var(--mute)}'
  + '#pz2 .task .p{font-family:Fraunces,serif;font-size:16px;color:var(--ink2);min-width:40px;text-align:right}'
  + '#pz2 textarea,#pz2 input[type=text],#pz2 input[type=number],#pz2 input[type=password],#pz2 select{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 13px;background:#FDFCF9;font:inherit;font-size:14px;color:var(--ink)}'
  + '#pz2 textarea{font-family:Fraunces,serif;font-style:italic;font-size:15px;min-height:76px;resize:vertical}'
  + '#pz2 .banner{display:flex;align-items:center;gap:14px;background:var(--rust-soft);border:1px solid #EBCFC5;color:#7A3524;border-radius:18px;padding:14px 18px;margin-bottom:16px}'
  + '#pz2 .banner b{display:block;font-weight:600;font-size:15px;color:#6B2C1D}'
  + '#pz2 .pzsec{display:flex;align-items:center;gap:10px;margin:22px 0 10px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--mute)}'
  + '#pz2 .pzsec:after{content:"";flex:1;height:1px;background:var(--line)}'
  + '#pz2 .pzsec.r{color:var(--rust)}'
  + '#pz2 .pzsec:first-child{margin-top:0}'
  // week + dinner
  + '#pz2 .big{font-family:Fraunces,serif;font-weight:500;font-size:52px;line-height:1;letter-spacing:-.02em}'
  + '#pz2 .kpis{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line2);margin-top:14px}'
  + '#pz2 .kpis div{padding:12px 0 0}'
  + '#pz2 .kpis div+div{padding-left:14px;border-left:1px solid var(--line2)}'
  + '#pz2 .kpis b{display:block;font-family:Fraunces,serif;font-weight:500;font-size:22px}'
  + '#pz2 .kpis span{font-size:12px;color:var(--mute)}'
  + '#pz2 .talk{background:var(--navy);color:#EDEAE2;border-radius:22px;padding:22px;position:relative;overflow:hidden}'
  + '#pz2 .talk:before{content:"";position:absolute;right:-90px;top:-90px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(199,154,78,.22),rgba(199,154,78,0) 70%);pointer-events:none}'
  + '#pz2 .talk .q{border-top:1px solid rgba(255,255,255,.12);padding:14px 0 2px;margin-top:14px;display:flex;gap:14px;position:relative}'
  + '#pz2 .talk .k{width:34px;height:34px;border-radius:10px;background:rgba(199,154,78,.16);color:var(--brass2);display:flex;align-items:center;justify-content:center;flex:0 0 auto}'
  + '#pz2 .talk .q b{display:block;font-family:Fraunces,serif;font-weight:400;font-size:17.5px;line-height:1.32;color:#fff}'
  + '#pz2 .talk .q b em{color:var(--brass2)}'
  + '#pz2 .talk .q span{display:block;font-size:11.5px;color:#9C9BA5;margin-top:5px;letter-spacing:.06em;text-transform:uppercase}'
  // progress
  + '#pz2 .cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px}'
  + '#pz2 .cal .h{font-size:11px;font-weight:600;letter-spacing:.12em;color:var(--mute);text-align:center;text-transform:uppercase}'
  + '#pz2 .cal .c{aspect-ratio:1/1;border-radius:13px;border:1px dashed var(--line);padding:7px;display:flex;flex-direction:column;justify-content:space-between;background:transparent;font-size:11.5px;color:var(--mute);text-align:left;min-width:0}'
  + '#pz2 .cal .c b{font-family:Fraunces,serif;font-weight:500;font-size:19px;color:var(--mute);align-self:flex-end;line-height:1}'
  + '#pz2 .cal .c.has b{color:var(--ink)}'
  + '#pz2 .cal .c.A{background:#DDEBE1;border:1px solid #C8DDCF}#pz2 .cal .c.B{background:#ECF2EA;border:1px solid #DCE7DA}#pz2 .cal .c.C{background:#F6EEDC;border:1px solid #ECDFC0}#pz2 .cal .c.D{background:#F5E4DD;border:1px solid #EBCFC5}#pz2 .cal .c.N{background:#fff;border:1px solid var(--line)}'
  + '#pz2 .cal .c.W{background:#fff;border:1.5px dashed var(--brass2);color:#8A6326}'
  + '#pz2 .cal .c.T{box-shadow:inset 0 0 0 2px var(--ink)}'
  + '#pz2 .cal .c.S{outline:2px solid var(--brass);outline-offset:2px}'
  + '#pz2 .cal .c.E{border:0}'
  + '#pz2 .cal .c span b{font-family:Inter;font-size:12px;color:var(--ink);font-weight:700}'
  + '#pz2 .hb{display:grid;grid-template-columns:minmax(0,180px) 1fr 44px;gap:12px;align-items:center;padding:8px 0;border-top:1px solid var(--line2)}'
  + '#pz2 .hb .bar{height:8px;background:var(--paper2);border-radius:99px;overflow:hidden}'
  + '#pz2 .hb .bar i{display:block;height:100%;background:var(--ink)}'
  + '#pz2 .hb.low .bar i{background:var(--rust)}'
  + '#pz2 .shg{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px}'
  + '#pz2 .shg button{aspect-ratio:1/1;border-radius:10px;border:1px solid var(--line);background:#fff;font-family:Fraunces,serif;font-size:14px;color:var(--mute);padding:0}'
  + '#pz2 .shg button.m{background:var(--sage);border-color:var(--sage);color:#fff}'
  + '#pz2 .shg button.l{background:var(--brass-soft);border-color:var(--brass2);color:#8A6326}'
  + '#pz2 .shg button.r{background:var(--sky-soft);border-color:#B9CCDD;color:var(--sky)}'
  + '#pz2 .shg button.sel{outline:2px solid var(--ink);outline-offset:2px}'
  + '#pz2 .key{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--mute);margin-top:10px}'
  + '#pz2 .key i{display:inline-block;width:11px;height:11px;border-radius:4px;vertical-align:-1px;margin-right:5px}'
  // timetable + rewards + settings
  + '#pz2 .tt .r{display:grid;grid-template-columns:70px 16px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 10px;border:0;border-top:1px solid var(--line2);width:100%;background:none;text-align:left;font:inherit;border-radius:0}'
  + '#pz2 .tt .r:hover{background:#FCFBF8}#pz2 .tt .r.sel{background:var(--brass-soft);border-radius:14px;border-top-color:transparent}'
  + '#pz2 .tt .r:first-child{border-top:0}'
  + '#pz2 .tt .tm{font-family:Fraunces,serif;font-size:16px;text-align:right}'
  + '#pz2 .tt .tm small{display:block;font-family:Inter;font-size:11.5px;color:var(--mute)}'
  + '#pz2 .tt .dt{width:12px;height:12px;border-radius:50%;border:2px solid var(--ink);background:#fff;justify-self:center}'
  + '#pz2 .tt .brk .dt{border-style:dashed;border-color:var(--mute)}'
  + '#pz2 .tt .nm b{font-weight:600;font-size:15px}'
  + '#pz2 .tt .brk .nm b{color:var(--mute);font-weight:500}'
  + '#pz2 .chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:5px}'
  + '#pz2 .chips i{font-style:normal;font-size:12px;border:1px solid var(--line);border-radius:99px;padding:2px 9px;color:var(--ink2);background:#FBF9F4}'
  + '#pz2 .rw{display:grid;grid-template-columns:34px minmax(0,1fr) auto 84px 70px;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--line2)}'
  + '#pz2 .rw .e{font-size:22px;text-align:center}'
  + '#pz2 .rw .n{font-weight:600}'
  + '#pz2 .rw .d{color:var(--mute);font-size:12.5px;white-space:nowrap}'
  + '#pz2 .rw .s{font-family:Fraunces,serif;font-size:18px;text-align:right}'
  + '#pz2 .rw .a{display:flex;gap:6px;justify-content:flex-end}'
  + '#pz2 .rw .a button{width:32px;height:32px;border-radius:9px;border:1px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;color:var(--mute);padding:0}'
  + '#pz2 .rw .a button:hover{color:var(--ink);border-color:#CFC9BB}'
  + '#pz2 .rw .a svg.i{width:15px;height:15px}'
  + '#pz2 .rw.sel{background:var(--brass-soft);border-radius:14px;margin:0 -12px;padding:10px 12px;border-top-color:transparent}'
  + '#pz2 .rw.off{opacity:.5}'
  + '#pz2 .emo{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px}'
  + '#pz2 .emo button{height:38px;border-radius:10px;border:1px solid var(--line);background:#fff;font-size:19px;padding:0}'
  + '#pz2 .emo button.on{border:2px solid var(--ink)}'
  + '#pz2 .fl{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:600;margin:14px 0 6px}'
  + '#pz2 .set{display:flex;align-items:center;gap:14px;padding:14px 0;border-top:1px solid var(--line2);flex-wrap:wrap}'
  + '#pz2 .set:first-of-type{border-top:0}'
  + '#pz2 .set .tx{flex:1 1 220px;min-width:0}'
  + '#pz2 .set .tx b{display:block;font-weight:600}'
  + '#pz2 .set .tx span{color:var(--mute);font-size:13px}'
  + '#pz2 .tog{width:42px;height:24px;border-radius:99px;background:#D8D3C7;position:relative;border:0;flex:0 0 auto;padding:0}'
  + '#pz2 .tog:after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s}'
  + '#pz2 .tog.on{background:var(--sage)}#pz2 .tog.on:after{left:21px}'
  + '#pz2 .empty{text-align:center;padding:34px 20px}'
  + '#pz2 .empty .ok{width:56px;height:56px;border-radius:50%;background:var(--sage-soft);color:var(--sage);display:flex;align-items:center;justify-content:center;margin:0 auto 12px}'
  + '#pz2 .ptabs{display:none}'
  + '#pz2 .mtop{display:none}'
  + '#pz2-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:28px;z-index:100003;background:#151A2C;color:#fff;padding:12px 20px;border-radius:12px;font:600 14px Inter,system-ui,sans-serif;display:none;box-shadow:0 12px 30px rgba(0,0,0,.3);max-width:90vw;text-align:center}'
  // phones and small tablets
  + '@media (max-width:899px){'
  +   '#pz2{grid-template-columns:minmax(0,1fr)}'
  +   '#pz2 .side{display:none}'
  +   '#pz2 .main{padding:0 14px 96px}'
  +   '#pz2 .mtop{display:flex;align-items:center;gap:10px;margin:0 -14px 18px;padding:14px 16px;background:var(--navy);color:#fff;position:sticky;top:0;z-index:5}'
  +   '#pz2 .mtop .mark{width:30px;height:30px;font-size:16px}'
  +   '#pz2 .mtop b{font-family:Fraunces,serif;font-weight:500;font-size:17px;flex:1}'
  +   '#pz2 .mtop button{border:1px solid rgba(255,255,255,.2);background:none;color:#fff;border-radius:10px;padding:7px 11px;font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:6px}'
  +   '#pz2 h1{font-size:28px}'
  +   '#pz2 .cols{grid-template-columns:minmax(0,1fr)}'
  +   '#pz2 .ptabs{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:6;background:#fff;border-top:1px solid var(--line);justify-content:space-around;padding:8px 4px calc(10px + env(safe-area-inset-bottom))}'
  +   '#pz2 .ptabs button{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;font-weight:600;color:var(--mute);background:none;border:0;position:relative;flex:1;padding:2px 0}'
  +   '#pz2 .ptabs button.on{color:var(--ink)}'
  +   '#pz2 .ptabs .ct{position:absolute;top:-6px;left:50%;margin-left:6px;background:var(--brass);color:#fff;border-radius:99px;font-size:10px;padding:0 5px}'
  +   '#pz2 .dtop{padding:14px 16px;gap:12px}#pz2 .dsec{padding:0 16px 12px}#pz2 .dfoot{padding:12px 16px}'
  +   '#pz2 .dbadge{width:48px;height:52px}#pz2 .dbadge b{font-size:21px}'
  +   '#pz2 .srow .seg{width:100%;display:grid;grid-auto-flow:column;grid-auto-columns:1fr}'
  +   '#pz2 .dfoot .btn.dark{width:100%}#pz2 .dfoot .sum{text-align:left}'
  +   '#pz2 .rw{grid-template-columns:30px minmax(0,1fr) 70px 70px}#pz2 .rw .d{display:none}'
  +   '#pz2 .shg{grid-template-columns:repeat(6,minmax(0,1fr))}'
  +   '#pz2 .tt .r{grid-template-columns:56px 12px minmax(0,1fr)}#pz2 .tt .r>div:last-child{grid-column:3}'
  +   '#pz2-toast{bottom:150px}'
  +   '#pz2 .live{position:static}'
  +   '#pz2 .livebar{display:flex;align-items:center;gap:10px;position:fixed;left:10px;right:10px;bottom:76px;z-index:6;background:var(--navy);color:#fff;border-radius:16px;padding:10px 16px;box-shadow:0 14px 30px rgba(0,0,0,.25);font-size:13px}'
  +   '#pz2 .livebar b{font-family:Fraunces,serif;font-weight:500;font-size:24px;color:var(--brass2)}'
  +   '#pz2 .livebar small{margin-left:auto;color:#A9A8B0;font-size:12px}'
  +   '#pz2 .main{padding-bottom:160px}'
  +   '#pz2 .day .dtop .tag{display:none}'
  +   '#pz2 .tile{padding:12px 14px;gap:12px}#pz2 .tile .tag{display:none}#pz2 .tile .tx b{font-size:17px}'
  +   '#pz2 .edcols{grid-template-columns:minmax(0,1fr)!important}#pz2 .edcols>div:last-child{order:-1}#pz2 .edcols .card[style*=sticky]{position:static!important}'
  + '}'
  // the PIN screen
  + '#ns-pinprompt.pz2-pin{background:#151A2C!important}'
  + '#ns-pinprompt.pz2-pin .ns-card{background:transparent!important;box-shadow:none!important;border:0!important;color:#EDEAE2;text-align:center;max-width:360px;margin:0 auto}'
  + '#ns-pinprompt.pz2-pin h2{font-family:Fraunces,Georgia,serif!important;font-weight:500!important;font-size:30px!important;color:#fff!important;margin:14px 0 4px!important}'
  + '#ns-pinprompt.pz2-pin .ns-sub{color:#A9A8B0!important}'
  + '#ns-pinprompt.pz2-pin .pzmark{width:54px;height:54px;border-radius:16px;border:1.5px solid #C79A4E;display:flex;align-items:center;justify-content:center;font-family:Fraunces,Georgia,serif;font-size:26px;color:#C79A4E;margin:0 auto}'
  + '#ns-pinprompt.pz2-pin #ns-pinprompt-input{background:transparent!important;border:0!important;color:#C79A4E!important;font-size:30px!important;letter-spacing:.6em!important;text-align:center;-webkit-text-security:disc;box-shadow:none!important;outline:none}'
  + '#ns-pinprompt.pz2-pin .pzpad{display:grid;grid-template-columns:repeat(3,72px);gap:14px 24px;justify-content:center;margin:18px 0 6px}'
  + '#ns-pinprompt.pz2-pin .pzpad button{width:72px;height:72px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:transparent;color:#fff;font-family:Fraunces,Georgia,serif;font-size:28px;cursor:pointer}'
  + '#ns-pinprompt.pz2-pin .pzpad button:active{background:rgba(199,154,78,.25)}'
  + '#ns-pinprompt.pz2-pin .pzpad button.n{border:0;font-family:Inter,system-ui,sans-serif;font-size:14px;color:#A9A8B0}'
  + '#ns-pinprompt.pz2-pin #ns-pinprompt-ok{display:none!important}'
  + '#ns-pinprompt.pz2-pin.fg .ns-card>*:not(#pz2-fg):not(.pzmark){display:none!important}'
  + '#ns-pinprompt.pz2-pin #pz2-fg{text-align:left;font-family:Inter,system-ui,sans-serif}'
  + '#ns-pinprompt.pz2-pin #pz2-fg h2{margin:16px 0 6px!important;font-size:26px!important;text-align:center}'
  + '#ns-pinprompt.pz2-pin #pz2-fg .ns-sub{text-align:center;color:#A9A8B0!important;line-height:1.5}'
  + '#ns-pinprompt.pz2-pin #pz2-fg .fgl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9B9AA3;font-weight:600;margin:16px 0 6px}'
  + '#ns-pinprompt.pz2-pin #pz2-fg .fgv{color:#fff;font-weight:600}'
  + '#ns-pinprompt.pz2-pin #pz2-fg input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.2)!important;color:#fff!important;border-radius:12px!important;padding:12px!important;font-size:16px!important;box-shadow:none!important}'
  + '#ns-pinprompt.pz2-pin #pz2-fg .fgb{display:block;width:100%;margin-top:18px;background:#C79A4E!important;color:#151A2C!important;border:0;border-radius:12px;padding:13px;font:700 15px Inter,system-ui,sans-serif;cursor:pointer}'
  + '#ns-pinprompt.pz2-pin #pz2-fg .fgl2{display:block;width:100%;margin-top:12px;background:none!important;border:0!important;color:#C7C5CF!important;font:500 13.5px Inter,system-ui,sans-serif;cursor:pointer;padding:6px;box-shadow:none!important}'
  + '#ns-pinprompt.pz2-pin #pz2-fg .fgm{margin-top:12px;background:rgba(176,80,58,.25);color:#FFD9CF;border-radius:10px;padding:10px 12px;font-size:13.5px}'
  + '#ns-pinprompt.pz2-pin #pz2-fg .fgm.ok{background:rgba(60,116,87,.3);color:#D6F0DF}'
  + '#ns-pinprompt.pz2-pin #ns-pinprompt-cancel{background:transparent!important;color:#A9A8B0!important;border:1px solid rgba(255,255,255,.16)!important}';

  function addStyles(){
    if($('pz2-style')) return;
    var st = document.createElement('style'); st.id = 'pz2-style'; st.textContent = CSS; document.head.appendChild(st);
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(l);
  }

  // ---- the shell: side menu, phone bar, page ----------------------------------------------------
  var PAGES = [['today','Today'],['progress','Progress'],['timetable','Timetable'],['rewards','Rewards']];
  function counts(){
    // days before today (today is still going), kindness on days not waiting, tasks left for later
    var n = 0, on = {}, t = today();
    try{ R().pending().forEach(function(d){ on[d.date] = 1; if(d.date < t) n++; }); }catch(e){}
    n += kRows().filter(function(r){ return r.status === 'done' && !on[r.week] && !/^little:/.test(r.mission || ''); }).length;
    try{ n += R().carried().length; }catch(e){}
    return n;
  }
  function avatar(){
    var src = $('hdr-avatar'); if(!src) return '⭐';
    var img = src.querySelector('img'); return img ? '<img src="' + esc(img.getAttribute('src')) + '" alt="">' : esc((src.textContent || '⭐').trim() || '⭐');
  }
  function shell(){
    var n = counts();
    var nav = function(k, lab){ return '<button class="nv' + (PZ.page === k ? ' on' : '') + '" data-pz="go" data-p="' + k + '">' + I(k) + lab + (k === 'today' && n ? '<span class="ct">' + n + '</span>' : '') + '</button>'; };
    var h = '<aside class="side"><div class="brand"><div class="mark">N</div><div><b>NIYAM</b><span>Parent Zone</span></div></div>'
      + '<div class="kid"><div class="av">' + avatar() + '</div><div><b>' + esc(child()) + '</b><span>' + esc(window.niyamChildClass || '') + '</span></div></div>'
      + '<div class="navl">Every day</div>' + nav('today', 'Today') + '<div class="navl">Now and then</div>'
      + PAGES.slice(1).map(function(p){ return nav(p[0], p[1]); }).join('')
      + '<div class="grow"></div>' + nav('settings', 'Settings')
      + '<button class="back" data-pz="leave">' + I('lock') + 'Lock &amp; back to ' + esc(first()) + '</button></aside>';
    h += '<main class="main"><div class="mtop"><div class="mark">N</div><b>Parent Zone</b><button data-pz="leave">' + I('lock', 'width:14px;height:14px') + 'Back to ' + esc(first()) + '</button></div><div id="pz2-page"></div></main>';
    h += '<nav class="ptabs">' + PAGES.concat([['settings','Settings']]).map(function(p){
      return '<button class="' + (PZ.page === p[0] ? 'on' : '') + '" data-pz="go" data-p="' + p[0] + '">' + I(p[0]) + p[1] + (p[0] === 'today' && n ? '<span class="ct">' + n + '</span>' : '') + '</button>'; }).join('') + '</nav>';
    return h;
  }
  function render(){
    var root = $('pz2'); if(!root) return;
    var y = $('ns-parent-zone') ? $('ns-parent-zone').scrollTop : 0;
    root.innerHTML = shell();
    var page = { today:pageToday, progress:pageProgress, timetable:pageTimetable, rewards:pageRewards, settings:pageSettings }[PZ.page] || pageToday;
    try{ $('pz2-page').innerHTML = page(); }
    catch(e){ console.error('[parent zone] ' + PZ.page + ':', e); $('pz2-page').innerHTML = '<div class="card">Something went wrong drawing this page. Please go back and open the Parent Zone again.</div>'; }
    if($('ns-parent-zone')) $('ns-parent-zone').scrollTop = y;
  }
  function go(p){ PZ.page = p; try{ sessionStorage.setItem('pz2-page', p); }catch(e){} render(); if($('ns-parent-zone')) $('ns-parent-zone').scrollTop = 0; }

  // ======================================================================================
  // TODAY
  // ======================================================================================
  function kindFor(date){ return kRows().filter(function(r){ return r.week === date && r.status === 'done' && !/^little:/.test(r.mission || ''); })[0] || null; }
  function kindAct(r){ try{ return (NK().findAct && NK().findAct(r.mission)) || null; }catch(e){ return null; } }
  function kindScale(r){ try{ return NK().scaleFor(r.mission); }catch(e){ return [5, 10, 15, 20]; } }
  function brainLine(d){
    var parts = [['Maths', 'savedMathsPts'], ['Logic', 'savedLogicPts'], ['Sudoku', 'savedSudokuPts'], ['Riddles', 'savedRiddlePts'], ['All-four bonus', 'savedWorksheetPts']]
      .filter(function(x){ return num(d[x[1]]) > 0; }).map(function(x){ return x[0] + ' +' + num(d[x[1]]); });
    return parts.join(' · ');
  }
  function brainCount(d){ return ['savedMathsPts', 'savedLogicPts', 'savedSudokuPts', 'savedRiddlePts'].filter(function(k){ return num(d[k]) > 0; }).length; }
  function tickRows(m){ var out = []; m.blocks.forEach(function(B){ B.rows.forEach(function(r){ if(!r.parent && !r.info) out.push(r); }); }); return out; }
  function wordsOfDay(m){ var w = m.wrote.find(function(x){ return x.title === 'New words'; }); return w ? w.text.split(' · ').filter(Boolean) : []; }
  function meaningOf(word){
    try{ var W = (typeof wbWords !== 'undefined' && Array.isArray(wbWords)) ? wbWords : [];
      var f = W.find(function(x){ return String(x.word || x.w || '').toLowerCase() === String(word).toLowerCase(); });
      return f ? { m:f.meaning || f.m || '', e:f.example || f.sentence || f.e || '' } : null; }catch(e){ return null; }
  }
  function dayCalc(d){
    var m = R().model(d), E = m.E, kr = kindFor(d.date), kv = kr ? PZ.kind[kr.id] : undefined;
    var kpts = (typeof kv === 'number') ? kv : 0, bonus = R().gradeBonus(d.date, E.grade);
    var toScore = m.parents.filter(function(r){ return r.award === undefined; }).length + (kr && kv === undefined ? 1 : 0);
    return { m:m, E:E, kr:kr, kv:kv, kpts:kpts, bonus:bonus, total:m.pts + bonus + kpts, toScore:toScore };
  }
  function segHtml(vals, on, act, date, id, labels){
    return '<div class="seg">' + vals.map(function(v, i){
      return '<button class="' + (v === on ? 'on' : '') + (v === 'redo' ? ' no' : '') + '" data-pz="' + act + '" data-date="' + esc(date) + '" data-id="' + esc(id) + '" data-v="' + v + '"'
        + (labels && labels[i] ? ' title="' + esc(labels[i]) + '"' : '') + '>' + (v === 'redo' ? 'Not done' : v) + '</button>'; }).join('') + '</div>';
  }
  function dayCard(d, late){
    var C = dayCalc(d), m = C.m, E = C.E, x = dObj(d.date), open = !!PZ.open[d.date], isToday = d.date === today();
    var ticks = tickRows(m), done = ticks.filter(function(r){ return r.done; }).length, words = wordsOfDay(m), bc = brainCount(d);
    var facts = [done + ' of ' + ticks.length + ' tasks ticked'];
    if(bc) facts.push('Brain Lab ' + bc + ' of 4'); if(words.length) facts.push(plural(words.length, 'new word', 'new words'));
    var waitDays = Math.round((dObj(today()) - x) / 86400000);
    var tag = late ? '<span class="tag t-rust">Waiting ' + plural(waitDays, 'day', 'days') + '</span>'
            : C.toScore ? '<span class="tag t-brass">' + C.toScore + ' to score</span>' : '<span class="tag t-mute">Ready to approve</span>';
    var badge = '<div class="dbadge"><b>' + x.getDate() + '</b><span>' + MONTHS[x.getMonth()].slice(0, 3) + '</span></div>';
    var title = WD[x.getDay()] + ', ' + x.getDate() + ' ' + MONTHS[x.getMonth()];
    if(!PZ.exp[d.date]){
      return '<button class="tile wait' + (late ? ' late' : '') + '" data-pz="exp" data-date="' + d.date + '">' + badge
        + '<span class="tx"><b>' + title + '</b><span' + (late ? ' style="color:var(--rust)"' : '') + '>' + (isToday ? 'Today · still going · ' : '') + (late ? 'Awaiting approval for ' + plural(waitDays, 'day', 'days') : 'Awaiting approval') + ' · ' + fmtN(C.total) + ' points accrued</span></span>'
        + (late ? '' : tag) + '<span class="chev">' + I('down') + '</span></button>';
    }
    var h = '<div class="day wait' + (late ? ' late' : '') + '"><button class="dtop" data-pz="exp" data-date="' + d.date + '">' + badge
      + '<span class="tx"><b>' + title + (isToday ? ' <span style="font-family:Inter;font-size:13px;color:var(--mute);font-weight:500">· today, still going</span>' : '') + '</b><span>' + facts.join(' · ') + '</span></span>' + tag + '<span class="chev">' + I('up') + '</span></button>';

    // the parent's score
    var rows = '';
    m.parents.forEach(function(r){
      var sub = r.child ? first() + ' ticked it' : 'Not ticked by ' + first();
      if(r.kind === 'shloka'){ var sh = R().shloka(d); sub = (sh.name ? 'Learning ' + sh.name + '. ' : '') + 'Full marks also marks the shloka as mastered.'; }
      if(r.kind === 'creative' && d.creativeChosen) sub = 'Chose: ' + d.creativeChosen;
      if(r.a && r.a.note && r.kind === 'award') sub += ' · ' + r.a.note;
      var ch = R().chips(r.kind, r.max);
      rows += '<div class="srow"><div class="nm">' + esc(r.name) + '<small>' + esc(sub) + '</small></div>'
        + segHtml(ch.map(function(c){ return c.v; }), r.award, 'award', d.date, r.id, ch.map(function(c){ return c.label; })) + '</div>';
    });
    if(C.kr){
      var a = kindAct(C.kr) || { title:'Act of Kindness' };
      rows += '<div class="srow"><div class="nm">Act of Kindness<small>“' + esc(a.title) + '”</small></div>' + segHtml(kindScale(C.kr).concat(['redo']), C.kv, 'kind', d.date, C.kr.id) + '</div>';
    }
    var run = R().aRunBefore(d.date);
    var gradeRow = '<div class="srow"><div class="nm">Grade for the day<small>Optional · ' + (C.bonus ? 'this A completes 5 in a row: +100 bonus' : (run % 5) + ' A’s in a row · 5 in a row earn +100') + '</small></div>'
      + '<div class="gch">' + ['A', 'B', 'C', 'D'].map(function(g){ return '<button class="' + (E.grade === g ? 'on' : '') + '" data-pz="grade" data-date="' + d.date + '" data-g="' + g + '">' + g + '</button>'; }).join('') + '</div></div>';
    h += '<div class="dsec">' + (rows ? '<div class="lab"><span>Parent’s score</span><small>only you can judge these</small></div>' + rows : '')
      + (open ? '' : gradeRow) + '</div>';

    if(open){
      // what the child wrote
      var wrote = '';
      if(words.length) wrote += '<div class="words">' + words.map(function(w){ var mm = meaningOf(w) || {};
        return '<div class="word"><b>' + esc(w) + '</b>' + (mm.m ? '<div>' + esc(mm.m) + '</div>' : '') + (mm.e ? '<i>“' + esc(mm.e) + '”</i>' : '') + '</div>'; }).join('') + '</div>';
      m.wrote.filter(function(w){ return w.title !== 'New words'; }).forEach(function(w){ wrote += '<div style="font-weight:600;margin-top:6px">' + esc(w.title) + '</div><div class="quote">' + esc(w.text) + '</div>'; });
      var sh2 = R().shloka(d); if(sh2.reflect.length > 2) wrote += '<div style="font-weight:600;margin-top:6px">Geeta — how he will use it</div><div class="quote">' + esc(sh2.reflect) + '</div>';
      var bl = brainLine(d); if(bl) wrote += '<div style="color:var(--ink2);font-size:13px;padding:6px 0 4px"><b style="color:var(--ink)">Brain Lab:</b> ' + esc(bl) + '</div>';
      if(wrote) h += '<div class="dsec"><div class="lab"><span>What ' + esc(first()) + ' wrote</span></div>' + wrote + '</div>';
      // the ticks
      var tk = '';
      m.blocks.forEach(function(B){
        var rs = B.rows.filter(function(r){ return !r.parent && !r.info; }); if(!rs.length) return;
        var dn = rs.filter(function(r){ return r.done; }).length;
        tk += '<div class="blk"><span>' + esc(B.b.name || '') + '</span><span>' + (dn === rs.length ? '✓ ' : '') + dn + ' of ' + rs.length + '</span></div>';
        rs.forEach(function(r){
          var sub = r.detail || '', can = r.child || r.can === 'toggle', mark = r.done ? I('tick') : '';
          if(r.by) sub = (sub ? sub + ' · ' : '') + r.by;
          if(r.fixed) sub = (sub ? sub + ' · ' : '') + 'scored by Brain Lab';
          var inner = '<span class="box' + (r.done ? ' on' : '') + '">' + mark + '</span><span class="nm">' + esc(r.name) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><span class="p">' + (r.done ? '+' + r.pts : (r.max ? r.max : '')) + '</span>';
          tk += can && !r.fixed ? '<button class="task' + (r.done ? '' : ' off') + '" data-pz="tick" data-date="' + d.date + '" data-id="' + esc(r.id) + '">' + inner + '</button>'
                                : '<div class="task' + (r.done ? '' : ' off') + '">' + inner + '</div>';
        });
      });
      m.extra.forEach(function(x2){ tk += '<div class="task"><span class="box on">' + I('tick') + '</span><span class="nm">' + esc(x2.name) + '</span><span class="p">+' + x2.pts + '</span></div>'; });
      if(tk) h += '<div class="dsec"><div class="lab"><span>' + esc(first()) + '’s ticks</span><small>tap a task to change it</small></div>' + tk + '</div>';
      var note = E.note === null ? (d.parentComment || '') : E.note;
      h += '<div class="dsec"><div class="lab"><span>Grade &amp; a note</span><small>both optional</small></div>' + gradeRow
        + '<textarea data-pz-note="' + d.date + '" placeholder="A note for ' + esc(first()) + ' — he sees it on his Today page">' + esc(note) + '</textarea></div>';
    }
    var sum = m.need ? 'Anything you don’t score waits for later' : '';
    h += '<div class="dfoot"><button class="lnk" data-pz="open" data-date="' + d.date + '">' + I(open ? 'up' : 'down') + (open ? 'Show less' : 'See the full day') + '</button>'
      + '<span class="sum">' + esc(sum) + '</span>'
      + '<button class="btn dark" data-pz="approve" data-date="' + d.date + '"' + (PZ.busy ? ' disabled' : '') + '>' + I('tick') + 'Approve · ' + fmtN(C.total) + ' points</button></div></div>';
    return h;
  }
  function carriedCard(c){
    var key = c.date + '|' + c.it.id, sel = PZ.carry[key], ch = R().chips(c.it.kind, num(c.it.max));
    return '<div class="srow"><div class="nm">' + esc(c.it.name) + '<small>Left for later · ' + shortDay(c.date) + (c.it.info ? ' · ' + esc(c.it.info) : '') + '</small></div>'
      + '<div class="seg">' + ch.map(function(x){ return '<button class="' + (sel === x.v ? 'on' : '') + '" data-pz="carry" data-k="' + esc(key) + '" data-v="' + x.v + '" title="' + esc(x.label) + '">' + x.v + '</button>'; }).join('') + '</div>'
      + '<button class="btn sm dark" data-pz="csave" data-k="' + esc(key) + '"' + (sel === undefined || PZ.busy ? ' disabled' : '') + '>Save</button></div>';
  }
  function kindCard(r){
    var a = kindAct(r) || { title:'Act of Kindness' }, kv = PZ.kind[r.id];
    return '<div class="srow"><div class="nm">“' + esc(a.title) + '”<small>Act of Kindness · ' + shortDay(r.week) + '</small></div>' + segHtml(kindScale(r).concat(['redo']), kv, 'kind', r.week, r.id)
      + '<button class="btn sm dark" data-pz="ksave" data-id="' + esc(r.id) + '"' + (kv === undefined || PZ.busy ? ' disabled' : '') + '>Give</button></div>';
  }

  // ---- the live counter: what the child ticked, what the parent changed, what goes to the bank ----
  function focusDay(){
    var pend = []; try{ pend = R().pending(); }catch(e){}
    var f = PZ.focus && PZ.exp[PZ.focus] ? pend.find(function(d){ return d.date === PZ.focus; }) : null;
    if(!f) f = pend.slice().reverse().find(function(d){ return PZ.exp[d.date]; }) || null;
    return f;
  }
  function liveNums(d){
    var C = dayCalc(d), E = C.E, u = E.undone, dn = E.done;
    E.undone = {}; E.done = {};
    var base; try{ base = R().model(d); } finally { E.undone = u; E.done = dn; }
    return { C:C, child:base.tt, changed:C.m.tt - base.tt, brain:C.m.brain, parent:C.m.awards, kind:C.kpts, bonus:C.bonus, total:C.total };
  }
  function liveCard(){
    var d = focusDay(), b = bank(), pend = []; try{ pend = R().pending(); }catch(e){}
    if(!d){
      if(!pend.length) return '';
      var all = pend.reduce(function(a, x){ return a + dayCalc(x).total; }, 0);
      return '<div class="card live"><div class="eyebrow">Points summary</div><div style="display:flex;align-items:flex-end;gap:12px;margin-top:8px"><div class="big">' + fmtN(all) + '</div><div style="padding-bottom:6px;font-weight:600">points awaiting approval<div style="font-weight:400;color:var(--mute);font-size:13px">across ' + plural(pend.length, 'day', 'days') + '</div></div></div>'
        + '<div class="bankline"><div><span>Current Star Bank balance</span><b>' + fmtN(b) + ' ★</b></div><div><span>Balance once all are approved</span><b>' + fmtN(b + all) + ' ★</b></div></div>'
        + '<div style="color:var(--mute);font-size:12.5px;margin-top:10px">Open a day to review it. This summary updates as you assess each item.</div></div>';
    }
    var L = liveNums(d), x = dObj(d.date);
    var ln = function(lab, v, cls){ return '<div class="ln' + (cls ? ' ' + cls : '') + '"><span>' + lab + '</span><b>' + (v > 0 ? '+' : v < 0 ? '−' : '') + fmtN(Math.abs(v)) + '</b></div>'; };
    var h = '<div class="card live on"><div class="eyebrow">Points summary · ' + WD[x.getDay()] + ' ' + x.getDate() + ' ' + MONTHS[x.getMonth()].slice(0, 3) + '</div>'
      + ln('Tasks completed by ' + esc(first()), L.child)
      + (L.changed ? ln(L.changed < 0 ? 'Deducted on your review' : 'Added on your review', L.changed, L.changed < 0 ? 'neg' : 'pos') : '')
      + (L.brain ? ln('Brain Lab challenges', L.brain) : '')
      + ln('Parent’s score', L.parent, L.parent ? 'pos' : '')
      + (L.C.kr ? ln('Act of Kindness', L.kind, L.kind ? 'pos' : '') : '')
      + (L.bonus ? ln('A-grade streak bonus', L.bonus, 'pos') : '')
      + '<div class="tot"><span>Total to be credited</span><span class="big">' + fmtN(L.total) + '</span></div>'
      + '<div class="bankline"><div><span>Current Star Bank balance</span><b>' + fmtN(b) + ' ★</b></div><div><span>Balance after approval</span><b>' + fmtN(b + L.total) + ' ★</b></div></div>';
    var left = L.C.toScore; if(left) h += '<div style="color:#8A6326;font-size:12.5px;margin-top:8px;font-weight:600">' + plural(left, 'item awaits', 'items await') + ' your assessment</div>';
    return h + '</div>';
  }
  function liveBar(){   // phones: the same total, always in sight
    var d = focusDay(); if(!d) return '';
    var L = liveNums(d), b = bank();
    return '<div class="livebar"><span>To be credited</span><b>' + fmtN(L.total) + '</b><small>Balance ' + fmtN(b) + ' → ' + fmtN(b + L.total) + ' ★</small></div>';
  }
  function weekCard(){
    var t = today(), x = dObj(t), mon = addDays(t, -((x.getDay() + 6) % 7)), gd = goodDay(), W = [], sum = 0, lastSum = 0, appr = 0, have = 0, waiting = 0;
    for(var i = 0; i < 7; i++){ var dt = addDays(mon, i), r = rec(dt); W.push({ dt:dt, r:r }); if(r){ have++; if(r.approved === true){ appr++; sum += num(r.pts); } else waiting++; } }
    for(var j = 0; j < 7; j++){ var dj = addDays(mon, j - 7); if(addDays(dj, 7) > t) break; var r2 = rec(dj); if(r2 && r2.approved === true) lastSum += num(r2.pts); }   // the same days of last week
    var max = Math.max(gd * 1.4, W.reduce(function(a, w){ return Math.max(a, w.r ? num(w.r.pts) : 0); }, 0)), H = 120, bw = 26, gap = (300 - 7 * bw) / 6, svg = '';
    W.forEach(function(w, i){
      var px = i * (bw + gap), v = w.r ? num(w.r.pts) : 0, h = v / max * H, col = !w.r ? null : w.r.approved === true ? '#151A2C' : '#C9C3B4';
      svg += col && v ? '<rect x="' + px.toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + bw + '" height="' + h.toFixed(1) + '" rx="7" fill="' + col + '"/>'
                      : '<rect x="' + px.toFixed(1) + '" y="' + (H - 8) + '" width="' + bw + '" height="8" rx="4" fill="#EFEBE2"/>';
      svg += '<text x="' + (px + bw / 2).toFixed(1) + '" y="' + (H + 18) + '" text-anchor="middle" font-size="11" fill="' + (w.dt === t ? '#151A2C' : '#868A98') + '" font-weight="' + (w.dt === t ? '700' : '400') + '" font-family="Inter,sans-serif">' + 'MTWTFSS'[i] + '</text>';
    });
    var gy = H - gd / max * H;
    svg += '<line x1="0" x2="300" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="#A57A35" stroke-dasharray="4 4" stroke-width="1.2"/>'
      + '<text x="300" y="' + (gy - 6).toFixed(1) + '" text-anchor="end" font-size="10.5" fill="#A57A35" font-family="Inter,sans-serif" font-weight="600">a good day · ' + gd + '</text>';
    var delta = lastSum > 0 ? Math.round((sum - lastSum) / lastSum * 100) : null;
    return '<div class="card"><div class="eyebrow">This week · ' + dObj(mon).getDate() + ' ' + MONTHS[dObj(mon).getMonth()].slice(0, 3) + ' – ' + dObj(addDays(mon, 6)).getDate() + ' ' + MONTHS[dObj(addDays(mon, 6)).getMonth()].slice(0, 3) + '</div>'
      + '<div style="display:flex;align-items:flex-end;gap:12px;margin-top:8px"><div class="big">' + fmtN(sum) + '</div><div style="padding-bottom:6px"><div style="font-weight:600">points approved</div>'
      + (delta !== null ? '<div style="color:' + (delta >= 0 ? 'var(--sage)' : 'var(--rust)') + ';font-weight:600;font-size:13px">' + (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta) + '% on the same days last week</div>' : '') + '</div></div>'
      + '<svg viewBox="0 -14 300 ' + (H + 36) + '" width="100%" style="display:block;margin-top:12px">' + svg + '</svg>'
      + '<div class="key"><span><i style="background:#151A2C"></i>approved</span><span><i style="background:#C9C3B4"></i>waiting for you</span></div>'
      + '<div class="kpis"><div><b>' + appr + ' of ' + have + '</b><span>days approved</span></div><div><b>' + plural(streak(), 'day', 'days') + '</b><span>streak</span></div><div><b>' + fmtN(bank()) + ' ★</b><span>in Star Bank</span></div></div></div>';
  }

  // Three things to talk about tonight, from the child's own day.
  function talkCard(){
    var t = today(), q = [], k = 0;
    for(var i = 0; i < t.length; i++) k = (k * 31 + t.charCodeAt(i)) % 997;
    // a new word from the most recent day
    var recent = days().filter(function(d){ return d && d.date <= t; }).sort(function(a, b){ return a.date < b.date ? 1 : -1; }).slice(0, 2), word = '';
    recent.forEach(function(d){ if(word) return; try{ var w = wordsOfDay(R().model(d)); if(w.length) word = w[k % w.length]; if(d.approved === true) R().forget(d.date); }catch(e){} });
    if(word){
      var WQ = ['When did you last feel <em>' + esc(word) + '</em>, or see someone who was?', 'Can you use <em>' + esc(word) + '</em> in a sentence about your day?', 'Who in our family is the most <em>' + esc(word) + '</em>? Why?'];
      var mm = meaningOf(word); if(mm && mm.m && /^to /i.test(mm.m)) WQ[0] = 'When did you last <em>' + esc(word) + '</em>? Tell me about it.';
      q.push(['book', '“' + WQ[k % 3] + '”', 'His new word · ' + esc(word)]);
    }
    // the shloka he is learning
    geetaReady();
    try{
      var id = (typeof geetaProgress !== 'undefined') ? Object.keys(geetaProgress).find(function(s){ var st = geetaProgress[s] && geetaProgress[s].status; return st === 'inprogress' || st === 'relearning'; }) : null;
      var S = id && typeof SHLOKAS !== 'undefined' ? SHLOKAS.find(function(s){ return s.id === id; }) : null;
      if(S){ var mean = (String(S.meaning || '').match(/^[^.!?]*[.!?]?/) || [''])[0].trim(); if(mean.length > 120) mean = mean.slice(0, 117) + '…';
        q.push(['spark', '“' + esc(mean) + ' What does that mean to you?”', 'The shloka he is learning · ' + esc(S.chapter || '')]); }
    }catch(e){}
    // today's act of kindness
    try{ var act = NK() && NK().actFor(t), kr = kindFor(t) || kRows().find(function(r){ return r.week === t; });
      if(act) q.push(['heart', kr ? '“How did it feel to ' + esc(String(act.title).replace(/^./, function(c){ return c.toLowerCase(); })) + '? How did they feel?”' : '“Today’s kind act was: ' + esc(act.title) + '. Did you manage it?”', 'His Act of Kindness']); }catch(e){}
    if(!q.length) q.push(['spark', '“What was the best part of your day, and what was the hardest?”', 'For any evening']);
    return '<div class="talk"><div class="eyebrow" style="color:var(--brass2)">Tonight at dinner</div><div class="serif" style="font-size:24px;line-height:1.2;margin-top:6px;color:#fff">'
      + (q.length > 1 ? (q.length === 2 ? 'Two' : 'Three') + ' things to talk about with ' + esc(first()) : 'Something to talk about with ' + esc(first())) + '</div>'
      + q.map(function(x){ return '<div class="q"><div class="k">' + I(x[0]) + '</div><div><b>' + x[1] + '</b><span>' + x[2] + '</span></div></div>'; }).join('') + '</div>';
  }

  function pageToday(){
    var pend = [], carried = [], yest = addDays(today(), -1);
    try{ pend = R().pending(); carried = R().carried(); }catch(e){}
    var on = {}; pend.forEach(function(d){ on[d.date] = 1; });
    var loose = kRows().filter(function(r){ return r.status === 'done' && !on[r.week] && !/^little:/.test(r.mission || ''); });
    var late = pend.filter(function(d){ return d.date < yest; });
    var n = pend.length, hr = new Date().getHours();
    var hello = hr < 12 ? 'Good morning.' : hr < 17 ? 'Good afternoon.' : 'Good evening.';
    var title = n ? hello + ' <em>' + plural(n, 'day is', 'days are') + '</em> waiting for you.' : hello + ' <em>All caught up.</em>';
    var h = '<div class="head"><div><div class="eyebrow">' + longDay(today()) + ' ' + new Date().getFullYear() + '</div><h1>' + title + '</h1>'
      + '<p>' + (n ? 'Tap a day to open it. Score what only you can judge, then approve — the points reach ' + esc(first()) + '’s Star Bank straight away.' : 'Every saved day is approved. ' + esc(first()) + '’s next day appears here as soon as it is saved.') + '</p></div></div>';
    h += '<div class="cols"><div>';
    if(late.length) h += '<div class="notice">' + I('alert', 'color:var(--rust)') + '<span><b>' + plural(late.length, 'older day', 'older days') + ' still waiting</b> — since ' + longDay(late[0].date) + '. Those points are not in the Star Bank yet.</span></div>';
    if(n) h += '<div class="hsec r"><h2>Waiting for approval</h2><span class="cnt">' + n + '</span></div>';
    h += pend.slice().reverse().map(function(d){ return dayCard(d, d.date < yest); }).join('');   // the most recent day first
    var ready = pend.filter(function(d){ return !dayCalc(d).toScore; });
    if(ready.length > 1){
      var tot = ready.reduce(function(a, d){ return a + dayCalc(d).total; }, 0);
      h += '<div style="text-align:center;margin-top:12px"><button class="btn" data-pz="all"' + (PZ.busy ? ' disabled' : '') + '>' + I('tick') + 'Approve the ' + ready.length + ' ready days · ' + fmtN(tot) + ' points</button></div>';
    }
    if(carried.length || loose.length){
      h += '<div class="card" style="margin-top:16px"><div class="ch"><h2>Still to score <small>from days already approved</small></h2></div>'
        + carried.map(carriedCard).join('') + loose.map(kindCard).join('') + '</div>';
    }
    if(!n && !carried.length && !loose.length) h += '<div class="card empty"><div class="ok">' + I('tick', 'width:26px;height:26px') + '</div><h2>Nothing needs you right now</h2></div>';
    h += approvedSection();
    h += '</div><div class="stack rcol">' + liveCard() + talkCard() + weekCard() + '</div></div>' + liveBar();
    return h;
  }

  // ---- approved reports: one line each, a week at a time --------------------------------------------
  function weekStart(off){ var t = today(), x = dObj(t); return addDays(addDays(t, -((x.getDay() + 6) % 7)), (off || 0) * 7); }
  function approvedSection(){
    var off = PZ.apw || 0, mon = weekStart(off), sun = addDays(mon, 6);
    var list = days().filter(function(d){ return d && d.approved === true && d.date >= mon && d.date <= sun; }).sort(function(a, b){ return a.date < b.date ? 1 : -1; });
    var lab = off === 0 ? 'This week' : off === -1 ? 'Last week' : dObj(mon).getDate() + ' ' + MONTHS[dObj(mon).getMonth()].slice(0, 3) + ' – ' + dObj(sun).getDate() + ' ' + MONTHS[dObj(sun).getMonth()].slice(0, 3);
    var h = '<div class="hsec g"><h2>Approved reports</h2><span class="cnt">' + list.length + '</span><span style="flex:1"></span><div class="wk"><button data-pz="apw" data-v="-1" title="Earlier week">' + I('left', 'width:15px;height:15px') + '</button><span>' + lab + '</span>'
      + '<button data-pz="apw" data-v="1"' + (off >= 0 ? ' disabled' : '') + ' title="Later week">' + I('right', 'width:15px;height:15px') + '</button></div></div>';
    if(!list.length) return h + '<div class="card" style="color:var(--mute);text-align:center;padding:18px">No approved days in this week.</div>';
    return h + list.map(function(d){
      var x = dObj(d.date), open = !!(PZ.apOpen || {})[d.date];
      return '<div class="apv"><button class="tile ok" data-pz="apopen" data-date="' + d.date + '"><div class="dbadge"><b>' + x.getDate() + '</b><span>' + MONTHS[x.getMonth()].slice(0, 3) + '</span></div>'
        + '<span class="tx"><b>' + WD[x.getDay()] + ', ' + x.getDate() + ' ' + MONTHS[x.getMonth()] + '</b><span class="okl">✓ Approved · ' + fmtN(d.pts) + ' points' + (d.parentGrade ? ' · grade ' + esc(d.parentGrade) : '') + '</span></span>'
        + '<span class="chev">' + I(open ? 'up' : 'down') + '</span></button>' + (open ? '<div class="apbody">' + reportBody(d) + '</div>' : '') + '</div>';
    }).join('');
  }
  // What an approved day looked like: points, note, words, Brain Lab, kindness and the ticks.
  function reportBody(d){
    var rv = {}; try{ rv = JSON.parse(d.reviewJSON || '{}') || {}; }catch(e){}
    var aw = 0; Object.keys(rv.awards || {}).forEach(function(k){ aw += num(rv.awards[k]); });
    var m = null; try{ m = R().model(d); R().forget(d.date); }catch(e){}
    var h = '';
    if(rv.tt !== undefined) h += '<div style="color:var(--ink2);font-size:13px;margin-top:12px">Ticks ' + num(rv.tt) + ' · Brain Lab ' + num(rv.brain) + ' · Parent’s score ' + aw + (rv.bonus ? ' · A bonus ' + rv.bonus : '') + '</div>';
    var kr = kRows().find(function(r){ return r.week === d.date && r.status === 'confirmed' && !/^little:/.test(r.mission || ''); });
    if(kr){ var a = kindAct(kr) || { title:'Act of Kindness' }; h += '<div style="color:var(--ink2);font-size:13px;margin-top:4px">Act of Kindness: “' + esc(a.title) + '” · +' + num(kr.pts) + '</div>'; }
    if(d.parentComment) h += '<div class="quote" style="margin-top:10px">' + esc(d.parentComment) + '</div>';
    if(m){
      var words = wordsOfDay(m); if(words.length) h += '<div style="margin-top:10px;font-size:13px"><b>New words:</b> ' + words.map(esc).join(', ') + '</div>';
      var bl = brainLine(d); if(bl) h += '<div style="margin-top:4px;font-size:13px"><b>Brain Lab:</b> ' + esc(bl) + '</div>';
      var rows = '';
      m.blocks.forEach(function(B){
        var rs = B.rows.filter(function(r){ return !r.info; }); if(!rs.length) return;
        var dn = rs.filter(function(r){ return r.parent ? (r.award || 0) > 0 : r.done; });
        var miss = rs.filter(function(r){ return !(r.parent ? (r.award || 0) > 0 : r.done); });
        rows += '<div class="task"><span class="box' + (miss.length ? '' : ' on') + '">' + (miss.length ? '' : I('tick')) + '</span><span class="nm">' + esc(B.b.name || '') + (miss.length ? '<small>Not done: ' + miss.map(function(r){ return esc(r.name); }).join(', ') + '</small>' : '') + '</span><span class="p" style="font-size:14px">' + dn.length + ' of ' + rs.length + '</span></div>';
      });
      if(rows) h += '<div class="lab" style="margin-top:12px"><span>The day</span></div>' + rows;
    }
    h += '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn sm" data-pz="reopen" data-date="' + d.date + '">' + I('pen', 'width:15px;height:15px') + 'Open again for review</button>'
      + '<button class="btn sm red" data-pz="del" data-date="' + d.date + '">' + I('trash', 'width:15px;height:15px') + 'Delete this day</button></div>';
    return h;
  }

  // ---- Today: actions ------------------------------------------------------------------------
  async function approveDates(dates){
    if(PZ.busy) return;
    PZ.busy = true; render();
    var got = 0, n = 0, synced = true, bonus = 0;
    try{
      for(var i = 0; i < dates.length; i++){
        var date = dates[i], kr = kindFor(date), kv = kr ? PZ.kind[kr.id] : undefined;
        var res = await R().approve(date);
        if(res){ got += res.pts; bonus += res.bonus; n++; if(!res.ok) synced = false; }
        if(kr && kv !== undefined){
          try{ if(kv === 'redo') await NK().redo(kr.id); else { await NK().give(kr.id, kv); got += kv; } delete PZ.kind[kr.id]; }
          catch(err){ synced = false; console.warn('[parent zone] kindness:', err); }
        }
        delete PZ.open[date]; delete PZ.exp[date];
      }
    }catch(err){
      console.error('[parent zone] approve failed:', err);
      alert('Could not approve: ' + (err && err.message ? err.message : err) + '\n\nNothing was lost — please try again.');
    }finally{
      PZ.busy = false;
      try{ R().after(); }catch(e){}
      render();
    }
    if(n) toast(!synced ? 'Approved on this device — it will sync when the connection is back.' : (n > 1 ? n + ' days approved' : 'Approved') + ' · ' + fmtN(got) + ' points added' + (bonus ? ' (includes ' + bonus + ' bonus)' : ''));
  }
  function toggleTick(date, id){
    var d = R().find(date); if(!d) return;
    var m = R().model(d), E = m.E, r = null;
    m.blocks.forEach(function(B){ B.rows.forEach(function(x){ if(x.id === id) r = x; }); });
    if(!r) return;
    if(r.child){ if(E.undone[id]) delete E.undone[id]; else E.undone[id] = 1; }
    else if(r.can === 'toggle'){ if(E.done[id]) delete E.done[id]; else E.done[id] = 1; }
  }

  // ======================================================================================
  // PROGRESS
  // ======================================================================================
  function monthKey(){ if(!PZ.month) PZ.month = today().slice(0, 7); return PZ.month; }
  function shiftMonth(n){ var p = monthKey().split('-'), x = new Date(+p[0], +p[1] - 1 + n, 1); PZ.month = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); PZ.sel = null; }
  function pageProgress(){
    var mk = monthKey(), p = mk.split('-'), y = +p[0], mo = +p[1] - 1, nDays = new Date(y, mo + 1, 0).getDate(), lead = (new Date(y, mo, 1).getDay() + 6) % 7, t = today();
    var inMonth = days().filter(function(d){ return d && d.date && d.date.slice(0, 7) === mk; });
    var appr = inMonth.filter(function(d){ return d.approved === true; });
    var avg = appr.length ? Math.round(appr.reduce(function(a, d){ return a + num(d.pts); }, 0) / appr.length) : 0;
    var aN = appr.filter(function(d){ return d.parentGrade === 'A'; }).length;
    var h = '<div class="head"><div><div class="eyebrow">Progress</div><h1>' + MONTHS[mo] + ' <em>' + y + '</em></h1><p>'
      + (appr.length ? plural(appr.length, 'day', 'days') + ' approved · average ' + fmtN(avg) + ' points a day' + (aN ? ' · ' + plural(aN, 'A grade', 'A grades') : '') : 'No approved days in this month yet.') + '</p></div>'
      + '<div style="display:flex;gap:8px"><button class="btn" data-pz="month" data-v="-1">' + I('left', 'width:15px;height:15px') + '</button><button class="btn" data-pz="month" data-v="1"' + (mk >= t.slice(0, 7) ? ' disabled' : '') + '>' + I('right', 'width:15px;height:15px') + '</button>'
      + '<button class="btn" data-pz="backup">' + I('dl') + 'Download backup</button></div></div>';
    // calendar
    var c = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(function(x){ return '<div class="h">' + x + '</div>'; }).join('');
    for(var i = 0; i < lead; i++) c += '<div class="c E"></div>';
    for(var dn = 1; dn <= nDays; dn++){
      var ds = mk + '-' + String(dn).padStart(2, '0'), r = rec(ds), cls = 'c', lab = '';
      if(r && r.approved === true){ cls += ' has ' + (r.parentGrade || 'N'); lab = (r.parentGrade ? '<b>' + r.parentGrade + '</b> ' : '') + fmtN(r.pts) + ' pts'; }
      else if(r){ cls += ' has W'; lab = 'to review'; }
      if(ds === t) cls += ' T'; if(ds === PZ.sel) cls += ' S';
      c += r ? '<button class="' + cls + '" data-pz="pick" data-date="' + ds + '"><span>' + lab + '</span><b>' + dn + '</b></button>' : '<div class="' + cls + '"><span>' + (ds === t ? 'Today' : '') + '</span><b>' + dn + '</b></div>';
    }
    var left = '<div class="card"><div class="ch"><h2>Every day</h2><div class="key" style="margin:0"><span><i style="background:#DDEBE1"></i>A</span><span><i style="background:#ECF2EA"></i>B</span><span><i style="background:#F6EEDC"></i>C</span><span><i style="background:#F5E4DD"></i>D</span><span><i style="border:1.5px dashed var(--brass2)"></i>to review</span></div></div>'
      + '<div class="cal">' + c + '</div><div style="color:var(--mute);font-size:12.5px;margin-top:10px">Tap a day to see it, open it again for review, or delete it.</div></div>';
    left += geetaCard();
    // right column
    var right = PZ.sel ? dayDetail(PZ.sel) : '';
    right += trendCard(inMonth, nDays, mk) + habitsCard(appr);
    return h + '<div class="cols" style="grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)"><div class="stack">' + left + '</div><div class="stack">' + right + '</div></div>';
  }
  function trendCard(inMonth, nDays, mk){
    var pts = inMonth.filter(function(d){ return d.approved === true; }).sort(function(a, b){ return a.date < b.date ? -1 : 1; });
    if(pts.length < 2) return '<div class="card"><h2>Points per day</h2><p style="color:var(--mute);margin:8px 0 0">The line appears once two days of this month are approved.</p></div>';
    var W = 560, H = 140, mx = Math.max(goodDay() * 1.5, pts.reduce(function(a, d){ return Math.max(a, num(d.pts)); }, 0));
    var xy = pts.map(function(d){ var dn = +d.date.slice(8); return [((dn - 1) / (nDays - 1)) * W, H - num(d.pts) / mx * H]; });
    var line = xy.map(function(p){ return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '), gy = H - goodDay() / mx * H;
    var area = 'M' + xy[0][0].toFixed(1) + ',' + H + ' L' + line.replace(/ /g, ' L') + ' L' + xy[xy.length - 1][0].toFixed(1) + ',' + H + ' Z';
    return '<div class="card"><div class="ch"><h2>Points per day</h2></div><svg viewBox="0 -6 ' + W + ' ' + (H + 12) + '" width="100%" style="display:block;overflow:visible">'
      + '<defs><linearGradient id="pz2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151A2C" stop-opacity=".14"/><stop offset="1" stop-color="#151A2C" stop-opacity="0"/></linearGradient></defs>'
      + '<line x1="0" x2="' + W + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="#A57A35" stroke-dasharray="4 4"/><path d="' + area + '" fill="url(#pz2g)"/>'
      + '<polyline points="' + line + '" fill="none" stroke="#151A2C" stroke-width="2.2" stroke-linejoin="round"/>'
      + xy.map(function(p){ return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="#151A2C"/>'; }).join('') + '</svg>'
      + '<div style="display:flex;justify-content:space-between;color:var(--mute);font-size:11.5px;margin-top:6px"><span>1 ' + MONTHS[+mk.slice(5) - 1].slice(0, 3) + '</span><span style="color:var(--brass)">— a good day · ' + goodDay() + '</span><span>' + nDays + ' ' + MONTHS[+mk.slice(5) - 1].slice(0, 3) + '</span></div></div>';
  }
  function habitsCard(appr){
    if(!appr.length) return '';
    var agg = {}, order = [];
    appr.forEach(function(d){
      var m; try{ m = R().model(d); R().forget(d.date); }catch(e){ return; }
      m.blocks.forEach(function(B){
        var rs = B.rows.filter(function(r){ return !r.info; }); if(!rs.length) return;
        var name = B.b.name || ''; if(!agg[name]){ agg[name] = { s:0, n:0 }; order.push(name); }
        var dn = rs.filter(function(r){ return r.parent ? (r.award || 0) > 0 : r.done; }).length;
        agg[name].s += dn / rs.length; agg[name].n++;
      });
    });
    var kc = kRows().filter(function(r){ return r.status === 'confirmed' && appr.some(function(d){ return d.date === r.week; }); }).length;
    var rows = order.map(function(nm){ return [nm, Math.round(agg[nm].s / agg[nm].n * 100)]; });
    if(kRows().length) rows.push(['Act of Kindness', Math.round(kc / appr.length * 100)]);
    return '<div class="card"><div class="ch"><h2>How often each part was done</h2><small style="color:var(--mute)">approved days</small></div>'
      + rows.map(function(r){ return '<div class="hb' + (r[1] < 70 ? ' low' : '') + '"><span style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r[0]) + '</span><div class="bar"><i style="width:' + r[1] + '%"></i></div><b class="num" style="text-align:right;font-weight:500">' + r[1] + '%</b></div>'; }).join('') + '</div>';
  }
  function dayDetail(date){
    var d = rec(date); if(!d) return '';
    var x = dObj(date);
    var h = '<div class="card" style="border-color:var(--brass2)"><div class="ch"><div><div class="eyebrow">' + (d.approved === true ? 'Approved · ' + fmtN(d.pts) + ' points' + (d.parentGrade ? ' · grade ' + esc(d.parentGrade) : '') : 'Waiting for you') + '</div><h2 style="margin-top:2px">' + longDay(date) + '</h2></div>'
      + '<button class="btn sm" data-pz="pick" data-date="' + date + '">' + I('x', 'width:14px;height:14px') + '</button></div>';
    if(d.approved === true) h += reportBody(d);
    else h += '<p style="color:var(--ink2);margin:0 0 12px">This day has not been approved yet.</p><button class="btn dark" data-pz="goday" data-date="' + date + '">Open it in Today ' + I('right', 'width:15px;height:15px') + '</button>';
    return h + '</div>';
  }
  async function reopenDay(date){
    var i = savedDays.findIndex(function(x){ return x.date === date; }); if(i < 0) return;
    var d = savedDays[i];
    if(!confirm('Open ' + longDay(date) + ' again for review?\n\nIts ' + fmtN(d.pts) + ' points leave the Star Bank until you approve it again.')) return;
    savedDays[i] = Object.assign({}, d, { approved:false });
    try{ localStorage.setItem('vaanya_days', JSON.stringify(savedDays)); }catch(e){}
    var res; try{ res = await _supabase.from('daily_reports').update({ approved:false }).eq('date', date); }catch(e){ res = { error:e }; }
    if(res && res.error){ savedDays[i] = d; alert('Could not open it again: ' + (res.error.message || res.error)); render(); return; }
    try{ R().forget(date); R().after(); }catch(e){}
    PZ.sel = null; toast(longDay(date) + ' is back in Today for review.'); render();
  }
  async function deleteDay(date){
    var d = rec(date); if(!d) return;
    if(!confirm('Delete ' + longDay(date) + ' completely?\n\n' + (d.approved === true ? fmtN(d.pts) + ' points leave the Star Bank. ' : '') + 'This cannot be undone.')) return;
    var res; try{ res = await _supabase.from('daily_reports').delete().eq('date', date); }catch(e){ res = { error:e }; }
    if(res && res.error){ alert('Could not delete: ' + (res.error.message || res.error)); return; }
    savedDays = savedDays.filter(function(x){ return x.date !== date; });
    try{ localStorage.setItem('vaanya_days', JSON.stringify(savedDays)); }catch(e){}
    try{ R().forget(date); R().after(); }catch(e){}
    try{ if(typeof renderHistory === 'function') renderHistory(); }catch(e){}
    PZ.sel = null; toast(longDay(date) + ' deleted.'); render();
  }

  // ---- Geeta shlokas: learning / mastered / relearning ----------------------------------------
  function geetaReady(){ try{ if(typeof _geetaLoadProgress === 'function' && typeof geetaProgress !== 'undefined' && !Object.keys(geetaProgress).length) _geetaLoadProgress(); }catch(e){} }
  function shStatus(id){
    var p = (typeof geetaProgress !== 'undefined' && geetaProgress[id]) || null; if(!p) return '';
    if(p.status === 'inprogress'){ var dr = rec(p.date); if(dr && dr.approved === true) return ''; return 'l'; }
    return p.status === 'mastered' ? 'm' : p.status === 'relearning' ? 'r' : '';
  }
  function geetaCard(){
    if(typeof SHLOKAS === 'undefined' || !SHLOKAS.length) return '';
    geetaReady();
    var st = SHLOKAS.map(function(s){ return shStatus(s.id); });
    var cm = st.filter(function(x){ return x === 'm'; }).length, cl = st.filter(function(x){ return x === 'l'; }).length, cr = st.filter(function(x){ return x === 'r'; }).length;
    var h = '<div class="card"><div class="ch"><h2>Geeta shlokas <small>' + cm + ' of ' + SHLOKAS.length + ' mastered</small></h2></div>'
      + '<div class="shg">' + SHLOKAS.map(function(s, i){ return '<button class="' + st[i] + (PZ.shl === s.id ? ' sel' : '') + '" data-pz="shl" data-id="' + esc(s.id) + '" title="' + esc(s.chapter || '') + '">' + (i + 1) + '</button>'; }).join('') + '</div>'
      + '<div class="key"><span><i style="background:var(--sage)"></i>mastered · ' + cm + '</span><span><i style="background:var(--brass-soft);border:1px solid var(--brass2)"></i>learning · ' + cl + '</span><span><i style="background:var(--sky-soft);border:1px solid #B9CCDD"></i>relearning · ' + cr + '</span><span><i style="background:#fff;border:1px solid var(--line)"></i>not started · ' + (SHLOKAS.length - cm - cl - cr) + '</span></div>';
    var S = PZ.shl ? SHLOKAS.find(function(s){ return s.id === PZ.shl; }) : null;
    if(S){
      var s2 = shStatus(S.id), p = (geetaProgress[S.id] || {}), when = p.date ? ' since ' + shortDay(p.date) : '';
      var label = { m:'Mastered' + (p.date ? ' on ' + shortDay(p.date) : ''), l:'Learning' + when, r:'Relearning' + when, '':'Not started' }[s2];
      h += '<div style="border-top:1px solid var(--line2);margin-top:14px;padding-top:14px"><div class="eyebrow">' + esc(S.chapter || '') + (S.chapterName ? ' · ' + esc(S.chapterName) : '') + '</div>'
        + (S.meaning ? '<div class="quote" style="margin-top:8px">' + esc(String(S.meaning).length > 220 ? String(S.meaning).slice(0, 217) + '…' : S.meaning) + '</div>' : '')
        + '<div style="display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap"><span class="tag ' + { m:'t-sage', l:'t-brass', r:'t-sky', '':'t-mute' }[s2] + '">' + label + '</span><span style="flex:1"></span>'
        + (s2 === 'l' || s2 === 'r' ? '<button class="btn dark sm" data-pz="master" data-id="' + esc(S.id) + '">' + I('tick', 'width:15px;height:15px') + (s2 === 'r' ? 'Mastered again' : 'Mark as mastered') + '</button>' : '')
        + (s2 === 'm' ? '<button class="btn sm" data-pz="relearn" data-id="' + esc(S.id) + '">Move to relearning</button>' : '')
        + '</div>' + (s2 === 'l' || s2 === 'r' ? '<div style="color:var(--mute);font-size:12px;margin-top:6px">Ask ' + esc(first()) + ' to recite it first. Mastering unlocks the next shloka.</div>' : '')
        + (s2 === 'm' ? '<div style="color:var(--mute);font-size:12px;margin-top:6px">If he has forgotten it, move it to relearning: he practises it again and you master it again later.</div>' : '')
        + (s2 === '' ? '<div style="color:var(--mute);font-size:12px;margin-top:6px">' + esc(first()) + ' starts a shloka from his Geeta page.</div>' : '') + '</div>';
    } else h += '<div style="color:var(--mute);font-size:12.5px;margin-top:8px">Tap a shloka to see it, mark it mastered, or move it back to relearning.</div>';
    return h + '</div>';
  }
  async function masterShloka(id){
    var S = SHLOKAS.find(function(s){ return s.id === id; });
    if(!confirm('Mark ' + (S ? S.chapter : 'this shloka') + ' as mastered?\n\nDo this after ' + first() + ' recites it correctly. The next shloka unlocks.')) return;
    try{
      if(typeof _parentApproveShloka === 'function') await _parentApproveShloka(id);
      var old = $('shloka-pts-award'); if(old){ old.selectedIndex = 0; if(typeof calcDayPts === 'function') calcDayPts(); }   // the old award box is not used any more
    }catch(e){ alert('Could not save: ' + (e && e.message ? e.message : e)); }
    render();
  }
  async function relearnShloka(id){
    try{ if(typeof _moveToRelearning === 'function') await _moveToRelearning(id); }catch(e){ alert('Could not save: ' + (e && e.message ? e.message : e)); }
    render();
  }

  // ======================================================================================
  // TIMETABLE
  // ======================================================================================
  // Timetable editing happens on this page (Pooja, 23 Oct 2026). The rules are
  // the same as the older editor (js/06-timetable-admin.js): every block has a
  // name and a start time, an end comes after its start, blocks never overlap,
  // and tasks of a switched-off feature are kept aside and put back on save.
  var KINDS = [['normal', 'Earns points'], ['break', 'Break — no points'], ['locked-until-3pm', 'School time']];
  var ACT_TYPES = [['self', 'Child ticks it'], ['parent', 'Parent scores it'], ['pct-calc', 'Score out of 100% → points'], ['text-entry', 'Child writes an answer']];
  var BUILT_IN = { wordbook:'Points for every 3 words in My Dictionary', link:'Points come from Brain Lab', 'parent-select':'Parent scores it, up to the maximum', dropdown:'Child picks points for quality' };
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function uid(p){ return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function hm(h){ var H = Math.floor(h), M = Math.round((h - H) * 60); if(M === 60){ H++; M = 0; } return (H % 12 || 12) + ':' + (M < 10 ? '0' : '') + M; }
  function ap(h){ return Math.floor(h) % 24 >= 12 ? 'pm' : 'am'; }
  function parseT(txt){
    var m = /(\d{1,2})\s*:\s*(\d{2})\s*([ap]\.?m\.?)?/i.exec(txt || ''); if(!m) return null;
    var h = +m[1], mi = +m[2], a = (m[3] || '').toLowerCase();
    if(a.indexOf('p') === 0 && h < 12) h += 12; if(a.indexOf('a') === 0 && h === 12) h = 0;
    return h + mi / 60;
  }
  function times(b){
    var parts = String(b.time || '').split(/–|—|--|\bto\b|-/i);
    var s = parseT(parts[0]), e = parts.length > 1 ? parseT(parts.slice(1).join(' ')) : null;
    if(s === null && typeof b.unlockHour === 'number') s = b.unlockHour;
    return { s:s, e:e };
  }
  function fmt12(d){ var H = Math.floor(d), M = Math.round((d - H) * 60); if(M === 60){ H++; M = 0; } return (H % 12 || 12) + ':' + (M < 10 ? '0' : '') + M + ' ' + (H % 24 >= 12 ? 'PM' : 'AM'); }
  function setTimes(b, s, e){ b.time = fmt12(s) + (e !== null ? ' – ' + fmt12(e) : ''); b.unlockHour = s; }
  function byTime(arr){ return arr.slice().sort(function(a, b){ var x = times(a).s, y = times(b).s; return (x === null ? 99 : x) - (y === null ? 99 : y); }); }
  function blockPts(b){ return (b.activities || []).reduce(function(a, x){ var t = x.type || 'self'; return a + (t === 'wordbook' ? num(x.pts) * 3 : (t === 'pct-calc' || t === 'parent-select') ? num(x.maxCalcPts) : t === 'dropdown' ? Math.max.apply(null, (x.options && x.options.length ? x.options : [10])) : t === 'link' ? 0 : num(x.pts)); }, 0); }
  function ttLoad(){
    if(PZ.T) return;
    var T = { weekday:[], weekend:[], hidden:{} };
    ['weekday', 'weekend'].forEach(function(w){
      var src = clone(w === 'weekday' ? weekdayList() : weekendList()), H = { blocks:[], acts:{} };
      src.forEach(function(b){ b.id = b.id || uid('cblk'); });
      var shown = src;
      if(typeof window.niyamFilterSchedule === 'function'){
        shown = window.niyamFilterSchedule(src, window.niyamFeatures || {});
        var byId = {}; shown.forEach(function(b){ byId[b.id] = b; });
        src.forEach(function(b){
          var s2 = byId[b.id]; if(!s2){ H.blocks.push(b); return; }
          var gone = []; (b.activities || []).forEach(function(a, i){ if((s2.activities || []).indexOf(a) === -1) gone.push({ at:i, act:a }); });
          if(gone.length) H.acts[b.id] = gone;
        });
      }
      T[w] = byTime(shown.map(clone)); T.hidden[w] = H;
    });
    PZ.T = T;
  }
  function withHidden(w){
    var H = PZ.T.hidden[w] || { blocks:[], acts:{} };
    return PZ.T[w].map(function(b){
      var extra = H.acts[b.id]; if(!extra || b.type === 'break' || b.type === 'locked-until-3pm') return clone(b);
      var c = clone(b); c.activities = c.activities || [];
      extra.forEach(function(g){ c.activities.splice(Math.min(g.at, c.activities.length), 0, clone(g.act)); });
      return c;
    }).concat(clone(H.blocks));
  }
  function tidy(arr){
    return byTime(arr).map(function(b){
      var c = clone(b); c.id = c.id || uid('cblk'); c.name = String(c.name || '').trim();
      c.activities = (c.activities || []).map(function(a){ var x = clone(a); x.id = x.id || uid('cact'); x.pts = num(x.pts); x.name = String(x.name || '').trim() || c.name; return x; });
      c.maxPts = blockPts(c); return c;
    });
  }
  function which(){ return PZ.tt === 'holiday' ? 'weekend' : 'weekday'; }
  function pickT(id, d, empty){
    var h12 = '', mi = 0, a = 'PM';
    if(d !== null && d !== undefined){ var H = Math.floor(d); mi = Math.round((d - H) * 60); if(mi === 60){ H++; mi = 0; } a = H % 24 >= 12 ? 'PM' : 'AM'; h12 = String(H % 12 || 12); }
    var hrs = (empty ? ['<option value="">—</option>'] : []).concat([12,1,2,3,4,5,6,7,8,9,10,11].map(function(x){ return '<option' + (String(x) === h12 ? ' selected' : '') + '>' + x + '</option>'; }));
    var ms = []; for(var m = 0; m < 60; m += 5) ms.push(m); if(ms.indexOf(mi) < 0){ ms.push(mi); ms.sort(function(p, q){ return p - q; }); }
    return '<div style="display:flex;gap:6px;align-items:center"><select id="' + id + '-h" style="flex:1">' + hrs.join('') + '</select><b style="color:var(--mute)">:</b>'
      + '<select id="' + id + '-m" style="flex:1">' + ms.map(function(x){ return '<option value="' + x + '"' + (x === mi ? ' selected' : '') + '>' + (x < 10 ? '0' : '') + x + '</option>'; }).join('') + '</select>'
      + '<select id="' + id + '-a" style="flex:1"><option' + (a === 'AM' ? ' selected' : '') + '>AM</option><option' + (a === 'PM' ? ' selected' : '') + '>PM</option></select></div>';
  }
  function readT(id){
    var h = $(id + '-h'); if(!h || h.value === '') return null;
    var H = num(h.value) % 12; if($(id + '-a').value === 'PM') H += 12;
    return H + num($(id + '-m').value) / 60;
  }
  // copy what is typed in the form into the block being edited
  function tRead(){
    var b = PZ.tdraft; if(!b) return;
    if($('pz2-tb-name')) b.name = $('pz2-tb-name').value;
    if($('pz2-tb-kind')){ b.type = $('pz2-tb-kind').value === 'normal' ? undefined : $('pz2-tb-kind').value; if(!b.type) delete b.type; }
    if($('pz2-tb-s-h')){ b._s = readT('pz2-tb-s'); b._e = readT('pz2-tb-e'); }
    (b.activities || []).forEach(function(a, i){
      var n = $('pz2-ta-n-' + i), t = $('pz2-ta-t-' + i), pts = $('pz2-ta-p-' + i);
      if(n) a.name = n.value;
      if(t) a.type = t.value;
      if(pts){ if(a.type === 'pct-calc' || a.type === 'parent-select') a.maxCalcPts = num(pts.value); else a.pts = num(pts.value); }
    });
  }
  function ttEditor(){
    var b = PZ.tdraft, kind = b.type === 'break' || b.type === 'locked-until-3pm' ? b.type : 'normal', tt = b._s !== undefined ? { s:b._s, e:b._e } : times(b);
    var h = '<div class="card" style="position:sticky;top:20px"><div class="ch"><div><div class="eyebrow">' + (PZ.tnew ? 'New block' : 'Editing') + ' · ' + (which() === 'weekend' ? 'holiday timetable' : 'school day timetable') + '</div><h2 style="margin-top:2px">' + esc(b.name || 'A new block') + '</h2></div><button class="btn sm" data-pz="tclose">' + I('x', 'width:14px;height:14px') + '</button></div>'
      + '<label class="fl" style="margin-top:0">Name</label><input type="text" id="pz2-tb-name" maxlength="60" value="' + esc(b.name || '') + '" placeholder="e.g. Homework">'
      + '<label class="fl">Kind of block</label><select id="pz2-tb-kind" data-pz-ch="tkind">' + KINDS.map(function(k){ return '<option value="' + k[0] + '"' + (k[0] === kind ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select>'
      + '<div style="display:grid;grid-template-columns:1fr;gap:4px"><label class="fl">Starts</label>' + pickT('pz2-tb-s', tt.s, tt.s === null) + '<label class="fl">Ends</label>' + pickT('pz2-tb-e', tt.e, true) + '</div>';
    if(kind === 'normal'){
      h += '<label class="fl">Tasks</label>';
      (b.activities || []).forEach(function(a, i){
        var t = a.type || 'self', pick = ACT_TYPES.some(function(x){ return x[0] === t; });
        var ptsField = (t === 'link' || t === 'dropdown') ? '' : '<input type="number" id="pz2-ta-p-' + i + '" min="0" step="5" value="' + ((t === 'pct-calc' || t === 'parent-select') ? num(a.maxCalcPts) : num(a.pts)) + '" style="width:84px" title="' + (t === 'wordbook' ? 'Points for every 3 words' : 'Points') + '">';
        h += '<div style="border:1px solid var(--line);border-radius:14px;padding:10px;margin-bottom:8px;background:#FDFCF9">'
          + '<div style="display:flex;gap:8px"><input type="text" id="pz2-ta-n-' + i + '" value="' + esc(a.name || '') + '" placeholder="Task">' + ptsField
          + '<button class="btn sm red" data-pz="tadel" data-i="' + i + '" title="Remove this task" style="padding:7px 10px">' + I('trash', 'width:15px;height:15px') + '</button></div>'
          + (pick ? '<select id="pz2-ta-t-' + i + '" style="margin-top:6px">' + ACT_TYPES.map(function(x){ return '<option value="' + x[0] + '"' + (x[0] === t ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>'
                  : '<div style="color:var(--mute);font-size:12px;margin-top:6px">' + esc(BUILT_IN[t] || 'Built-in task') + '</div>') + '</div>';
      });
      h += '<button class="btn" style="width:100%;border-style:dashed" data-pz="taadd">' + I('plus') + 'Add a task</button>';
    }
    if(PZ.terr) h += '<div style="color:var(--rust);font-weight:600;margin-top:12px">' + esc(PZ.terr) + '</div>';
    h += '<div style="display:flex;gap:10px;margin-top:14px"><button class="btn dark" style="flex:1" data-pz="tsave"' + (PZ.busy ? ' disabled' : '') + '>Save</button>'
      + (PZ.tnew ? '' : '<button class="btn red" data-pz="tbdel">' + I('trash') + 'Delete block</button>') + '</div>'
      + '<div style="color:var(--mute);font-size:12px;margin-top:8px">Changes start from the next day ' + esc(first()) + ' opens. Approved days never change.</div></div>';
    return h;
  }
  function pageTimetable(){
    if(PZ.tt === null){ var w = false; try{ w = ttIsWeekendSchedule(); }catch(e){} PZ.tt = w ? 'holiday' : 'school'; }
    ttLoad();
    var list = PZ.T[which()], mx = list.reduce(function(a, b){ return a + (b.type === 'break' || b.type === 'locked-until-3pm' ? 0 : blockPts(b)); }, 0);
    var rows = list.map(function(b){
      var t = times(b), brk = b.type === 'break' || b.type === 'locked-until-3pm', pts = brk ? 0 : blockPts(b), sel = PZ.tdraft && !PZ.tnew && PZ.tdraft.id === b.id;
      var tasks = (b.activities || []).map(function(a){ return '<i>' + esc(a.name || '') + ((a.type === 'parent' || a.type === 'parent-select') ? ' · you score' : '') + '</i>'; }).join('');
      return '<button class="r' + (brk ? ' brk' : '') + (sel ? ' sel' : '') + '" data-pz="tsel" data-id="' + esc(b.id) + '"><div class="tm">' + (t.s !== null ? hm(t.s) + '<small>' + (t.e !== null ? 'to ' + hm(t.e) + ' ' + ap(t.e) : ap(t.s)) + '</small>' : '') + '</div><div class="dt"></div>'
        + '<div class="nm"><b>' + esc((b.icon ? b.icon + ' ' : '') + (b.name || 'New block')) + '</b>' + (tasks ? '<div class="chips">' + tasks + '</div>' : (brk ? '<div style="color:var(--mute);font-size:12.5px">' + (b.type === 'break' ? 'Break' : 'School time') + '</div>' : '')) + '</div>'
        + '<div>' + (pts ? '<span class="num" style="font-size:17px">' + pts + '</span> <span style="color:var(--mute);font-size:12px">pts</span>' : '') + '</div></button>';
    }).join('');
    var custom = !!(window.TT_CUSTOM && ((window.TT_CUSTOM.weekday || []).length || (window.TT_CUSTOM.weekend || []).length));
    var hid = PZ.T.hidden[which()] || { blocks:[], acts:{} }, nHid = hid.blocks.length + Object.keys(hid.acts).length;
    var h = '<div class="head"><div><div class="eyebrow">Timetable</div><h1>' + esc(first()) + '’s <em>day</em>, block by block</h1><p>'
      + plural(list.filter(function(b){ return b.type !== 'break' && b.type !== 'locked-until-3pm'; }).length, 'block', 'blocks') + ' · up to ' + fmtN(mx) + ' points · ' + (custom ? 'your own timetable' : 'NIYAM’s timetable for ' + esc(window.niyamChildClass || 'his class')) + '</p></div>'
      + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="seg"><button class="' + (PZ.tt === 'school' ? 'on' : '') + '" data-pz="tt" data-v="school" style="padding:10px 16px">School day timetable</button><button class="' + (PZ.tt === 'holiday' ? 'on' : '') + '" data-pz="tt" data-v="holiday" style="padding:10px 16px">Holiday timetable</button></div>'
      + '<button class="btn dark" data-pz="tbadd">' + I('plus') + 'Add a block</button></div></div>';
    h += '<div class="cols edcols" style="grid-template-columns:minmax(0,1fr) ' + (PZ.tdraft ? '380px' : '0') + '"><div><div class="card tt">' + (rows || '<p style="color:var(--mute)">No blocks yet.</p>') + '</div>'
      + '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:12px 4px 0;color:var(--mute);font-size:12.5px"><span>Tap a block to change it.' + (nHid ? ' Blocks of switched-off parts of the app are kept aside and come back if you switch them on.' : '') + '</span>'
      + '<button class="lnk" data-pz="tdefault">Use NIYAM’s suggested timetable</button></div></div><div>' + (PZ.tdraft ? ttEditor() : '') + '</div></div>';
    return h;
  }
  function ttProblem(list, b){
    if(!String(b.name || '').trim()) return 'Please give the block a name.';
    var s = b._s, e = b._e;
    if(s === null || s === undefined) return 'Please set a start time.';
    if(e !== null && e !== undefined && e <= s) return 'The block ends before it starts. Please check the end time.';
    var ra = { s:s, e:(e === null || e === undefined) ? s : e };
    for(var i = 0; i < list.length; i++){
      var o = list[i]; if(o.id === b.id) continue;
      var t = times(o); if(t.s === null) continue;
      var rb = { s:t.s, e:t.e === null || t.e <= t.s ? t.s : t.e };
      var hit = (ra.e > ra.s && rb.e > rb.s) ? (ra.s < rb.e - 1e-6 && rb.s < ra.e - 1e-6) : (ra.e > ra.s ? (ra.s < rb.s - 1e-6 && rb.s < ra.e - 1e-6) : (rb.e > rb.s ? (rb.s < ra.s - 1e-6 && ra.s < rb.e - 1e-6) : false));
      if(hit) return 'This time overlaps with “' + (o.name || 'another block') + '” (' + (o.time || '') + '). Please change one of them.';
    }
    return '';
  }
  async function ttSaveAll(msg){
    PZ.busy = true; render();
    try{
      await window.niyamSaveTimetable(tidy(withHidden('weekday')), tidy(withHidden('weekend')));
      try{ if(typeof window.niyamRefreshPlan === 'function') window.niyamRefreshPlan(); }catch(e){}
      try{ if(typeof ttRender === 'function') ttRender(); }catch(e){}
      PZ.T = null; PZ.tdraft = null; PZ.tnew = false; PZ.terr = '';
      toast(msg); return true;
    }catch(err){ PZ.terr = 'Could not save: ' + (err && err.message ? err.message : err) + ' — your changes are still here, try again.'; return false; }
    finally{ PZ.busy = false; render(); }
  }

  // ======================================================================================
  // REWARDS
  // ======================================================================================
  function rwList(){
    var list = null; try{ list = JSON.parse(localStorage.getItem('vaanya_admin_rewards') || 'null'); }catch(e){}
    if(!Array.isArray(list) || !list.length) list = window.niyamRewardDefaults ? window.niyamRewardDefaults() : [];
    return list;
  }
  function lvOf(r){ if(r.level) return r.level; var p = num(r.pts); return p <= 150 ? 'everyday' : p <= 600 ? 'weekend' : p <= 3500 ? 'big' : 'dream'; }
  function daysFor(p){ var n = Math.max(1, Math.round(p / goodDay())); return p < 250 ? '' : 'about ' + n + ' good days'; }
  function pageRewards(){
    var list = rwList(), edit = PZ.rw ? (PZ.rwNew ? PZ.rw : list.find(function(r){ return String(r.id) === String(PZ.rw.id); }) && PZ.rw) : null;
    var h = '<div class="head"><div><div class="eyebrow">Rewards</div><h1>' + esc(first()) + '’s <em>rewards</em> list</h1><p>' + plural(list.length, 'reward', 'rewards') + '. He claims them on his Rewards page with your PIN.</p></div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-pz="rwreset">Back to NIYAM’s list</button><button class="btn dark" data-pz="rwadd">' + I('plus') + 'Add a reward</button></div></div>';
    var cat = '';
    LEVELS.forEach(function(L){
      var items = list.filter(function(r){ return lvOf(r) === L[0]; }).sort(function(a, b){ return num(a.pts) - num(b.pts); }); if(!items.length) return;
      cat += '<div class="blk" style="margin-top:16px"><span>' + L[1] + (L[2] ? ' · ' + L[2] : '') + '</span><span>' + items.length + '</span></div>';
      items.forEach(function(r){
        cat += '<div class="rw' + (edit && !PZ.rwNew && String(edit.id) === String(r.id) ? ' sel' : '') + (r.active === false ? ' off' : '') + '"><span class="e">' + esc(r.icon || '🎁') + '</span><span class="n">' + esc(r.title || '') + '</span><span class="d">' + daysFor(num(r.pts)) + '</span>'
          + '<span class="s">' + fmtN(r.pts) + ' <span style="font-family:Inter;color:var(--mute);font-size:12px">★</span></span>'
          + '<span class="a"><button data-pz="rwedit" data-id="' + esc(r.id) + '" title="Edit">' + I('pen') + '</button><button data-pz="rwdel" data-id="' + esc(r.id) + '" title="Delete">' + I('trash') + '</button></span></div>';
      });
    });
    var side = '';
    if(edit){
      var e = edit;
      side = '<div class="card" style="position:sticky;top:20px"><div class="ch"><div><div class="eyebrow">' + (PZ.rwNew ? 'New reward' : 'Editing') + '</div><h2 style="margin-top:2px">' + esc(e.title || 'A new reward') + '</h2></div><button class="btn sm" data-pz="rwclose">' + I('x', 'width:14px;height:14px') + '</button></div>'
        + '<label class="fl">Reward</label><input type="text" id="pz2-rw-title" maxlength="80" value="' + esc(e.title || '') + '" placeholder="e.g. A trip to the park">'
        + '<label class="fl">Picture</label><div class="emo">' + EMOJI.map(function(x){ return '<button class="' + (x === e.icon ? 'on' : '') + '" data-pz="rwicon" data-v="' + x + '">' + x + '</button>'; }).join('') + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="fl">Stars</label><input type="number" id="pz2-rw-pts" min="10" step="10" value="' + num(e.pts) + '"></div>'
        + '<div><label class="fl">Kind</label><select id="pz2-rw-level">' + LEVELS.map(function(L){ return '<option value="' + L[0] + '"' + (lvOf(e) === L[0] ? ' selected' : '') + '>' + L[1] + '</option>'; }).join('') + '</select></div></div>'
        + '<div class="set" style="padding:14px 0 4px;border-top:0"><div class="tx"><b>Once a day</b><span>He can claim it only once on the same day</span></div><button class="tog' + ((e.daily === true || (e.daily === undefined && lvOf(e) === 'everyday')) ? ' on' : '') + '" data-pz="rwdaily"></button></div>'
        + '<div style="display:flex;gap:10px;margin-top:14px"><button class="btn dark" style="flex:1" data-pz="rwsave"' + (PZ.busy ? ' disabled' : '') + '>Save</button>' + (PZ.rwNew ? '' : '<button class="btn red" data-pz="rwdel" data-id="' + esc(e.id) + '">' + I('trash') + 'Delete</button>') + '</div></div>';
    }
    return h + '<div class="cols edcols" style="grid-template-columns:minmax(0,1fr) ' + (edit ? '360px' : '0') + '"><div class="card" style="padding-top:6px">' + cat + '</div><div>' + side + '</div></div>';
  }
  function rwRead(){
    var e = PZ.rw; if(!e) return;
    if($('pz2-rw-title')) e.title = $('pz2-rw-title').value.trim();
    if($('pz2-rw-pts')) e.pts = num($('pz2-rw-pts').value);
    if($('pz2-rw-level')) e.level = $('pz2-rw-level').value;
  }
  async function rwSave(list, msg){
    PZ.busy = true; render();
    try{ await window.niyamSaveRewards(list); toast(msg); try{ if(window.niyamStarBank) window.niyamStarBank.render(); }catch(e){} return true; }
    catch(err){ alert(err && err.message ? err.message : String(err)); return false; }
    finally{ PZ.busy = false; render(); }
  }

  // ======================================================================================
  // SETTINGS
  // ======================================================================================
  function pageSettings(){
    var F = window.niyamFeatures || {}, pin = PZ.pin;
    var optional = [['brainlab', 'Brain Lab', 'Maths, logic, sudoku and riddles every day'], ['progress', 'Progress', 'His points and streaks over time']];
    var always = [['Daily timetable', 'His day, block by block'], ['Review & approval', 'Points are banked only when you approve'], ['Star Bank & rewards', 'He saves up and claims rewards with your PIN'], ['Geeta', 'One shloka at a time, mastered with you'], ['My Dictionary', 'Three new words a day'], ['Act of Kindness', 'One surprise act a day']];
    var h = '<div class="head"><div><div class="eyebrow">Settings</div><h1>Family <em>settings</em></h1></div></div><div class="cols" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><div class="stack">';
    h += '<div class="card"><div class="ch"><h2>Child</h2></div><div style="display:flex;gap:16px;align-items:center"><div style="width:60px;height:60px;border-radius:50%;background:var(--paper2);display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 0 0 2px var(--brass2);overflow:hidden;flex:0 0 auto">' + avatar() + '</div>'
      + '<div><div class="serif" style="font-size:22px">' + esc(child()) + '</div><div style="color:var(--mute)">' + esc(window.niyamChildClass || '') + '</div></div></div></div>';
    h += '<div class="card"><div class="ch"><h2>Parent PIN</h2></div>';
    if(pin){
      h += '<div style="display:grid;gap:10px"><div><label class="fl" style="margin-top:0">Current PIN</label><input type="password" inputmode="numeric" maxlength="4" id="pz2-pin0"></div>'
        + '<div><label class="fl" style="margin-top:0">New PIN (4 numbers)</label><input type="password" inputmode="numeric" maxlength="4" id="pz2-pin1"></div>'
        + '<div><label class="fl" style="margin-top:0">New PIN again</label><input type="password" inputmode="numeric" maxlength="4" id="pz2-pin2"></div></div>'
        + (pin.err ? '<div style="color:var(--rust);font-weight:600;margin-top:10px">' + esc(pin.err) + '</div>' : '')
        + '<div style="display:flex;gap:10px;margin-top:14px"><button class="btn dark" data-pz="pinsave"' + (PZ.busy ? ' disabled' : '') + '>Save new PIN</button><button class="btn" data-pz="pinx">Cancel</button></div>';
    } else h += '<div class="set" style="padding-top:0"><div class="tx"><b>4-number PIN</b><span>Opens the Parent Zone and confirms rewards</span></div><button class="btn" data-pz="pin">Change PIN</button></div>';
    h += '</div>';
    h += '<div class="card"><div class="ch"><h2>Your data</h2></div>'
      + '<div class="set"><div class="tx"><b>Download a backup</b><span>All days, words and rewards in one file</span></div><button class="btn" data-pz="backup">' + I('dl') + 'Download</button></div>'
      + '<div class="set"><div class="tx"><b>Clear the open day</b><span>Clears the ticks on the day open on ' + esc(first()) + '’s page. Approved days are kept.</span></div><button class="btn red" data-pz="clear">Clear day</button></div>'
      + '<div class="set"><div class="tx"><b>Log out</b><span>You will need your email and password to come back</span></div><button class="btn" data-pz="logout">' + I('out') + 'Log out</button></div></div>';
    h += '</div><div class="stack"><div class="card"><div class="ch"><h2>What ' + esc(first()) + ' sees</h2></div>'
      + optional.map(function(o){ var on = F[o[0]] !== false; return '<div class="set"><div class="tx"><b>' + o[1] + '</b><span>' + o[2] + '</span></div><button class="tog' + (on ? ' on' : '') + '" data-pz="feat" data-k="' + o[0] + '"' + (PZ.busy ? ' disabled' : '') + '></button></div>'; }).join('')
      + always.map(function(o){ return '<div class="set"><div class="tx"><b>' + esc(o[0]) + '</b><span>' + esc(o[1]) + '</span></div><span class="tag t-mute">always on</span></div>'; }).join('')
      + '</div></div></div>';
    return h;
  }
  async function savePin(){
    var a = ($('pz2-pin0') || {}).value || '', b = ($('pz2-pin1') || {}).value || '', c = ($('pz2-pin2') || {}).value || '';
    if(!window.niyamCheckPin(a)){ PZ.pin = { err:'The current PIN is not right.' }; render(); return; }
    if(!/^\d{4}$/.test(b)){ PZ.pin = { err:'The new PIN must be 4 numbers.' }; render(); return; }
    if(b !== c){ PZ.pin = { err:'The two new PINs are not the same.' }; render(); return; }
    PZ.busy = true; render();
    try{ await window.niyamSavePin(b); PZ.pin = null; toast('New PIN saved.'); }
    catch(err){ PZ.pin = { err:'Could not save: ' + (err && err.message ? err.message : err) }; }
    finally{ PZ.busy = false; render(); }
  }
  async function toggleFeature(k){
    var F = Object.assign({}, window.niyamFeatures || {}), on = F[k] !== false;
    if(!confirm((on ? 'Hide ' : 'Show ') + (k === 'brainlab' ? 'Brain Lab' : 'Progress') + ' on ' + first() + '’s app?\n\nThe app reloads to apply it.')) return;
    PZ.busy = true; render();
    try{
      var pd = window.niyamProfileData() || {}, feats = Object.assign({}, pd.features || {}); feats[k] = !on;
      await window.niyamSaveProfileData({ features:feats });
      try{ sessionStorage.setItem('pz2-msg', (k === 'brainlab' ? 'Brain Lab' : 'Progress') + (on ? ' is now switched off.' : ' is now switched on.')); }catch(e){}
      location.reload();
    }catch(err){ PZ.busy = false; alert('Could not save: ' + (err && err.message ? err.message : err)); render(); }
  }

  // ======================================================================================
  // clicks
  // ======================================================================================
  async function onClick(e){
    var b = e.target.closest('[data-pz]'); if(!b || b.disabled) return;
    var act = b.getAttribute('data-pz'), date = b.getAttribute('data-date'), id = b.getAttribute('data-id'), v = b.getAttribute('data-v'), E;
    if(act === 'go'){ PZ.rw = null; go(b.getAttribute('data-p')); return; }
    if(act === 'leave'){ var bk = $('ns-pz-back'); if(bk) bk.click(); return; }
    // Today
    if(act === 'award'){ PZ.focus = date; E = R().edits(date); var n = num(v); if(E.awards[id] === n) delete E.awards[id]; else { E.awards[id] = n; delete E.later[id]; } render(); return; }
    if(act === 'kind'){ if(date) PZ.focus = date; var kv = v === 'redo' ? 'redo' : num(v); PZ.kind[id] = PZ.kind[id] === kv ? undefined : kv; if(PZ.kind[id] === undefined) delete PZ.kind[id]; render(); return; }
    if(act === 'grade'){ PZ.focus = date; E = R().edits(date); var g = b.getAttribute('data-g'); E.grade = E.grade === g ? '' : g; render(); return; }
    if(act === 'open'){ PZ.open[date] = !PZ.open[date]; render(); return; }
    if(act === 'exp'){ PZ.exp[date] = !PZ.exp[date]; if(PZ.exp[date]) PZ.focus = date; if(!PZ.exp[date]) delete PZ.open[date]; render(); return; }
    if(act === 'apopen'){ PZ.apOpen = PZ.apOpen || {}; PZ.apOpen[date] = !PZ.apOpen[date]; render(); return; }
    if(act === 'apw'){ PZ.apw = Math.min(0, (PZ.apw || 0) + num(v)); PZ.apOpen = {}; render(); return; }
    if(act === 'goday'){ PZ.exp[date] = true; go('today'); return; }
    if(act === 'tick'){ PZ.focus = date; toggleTick(date, id); render(); return; }
    if(act === 'approve'){ approveDates([date]); return; }
    if(act === 'all'){
      var ready = R().pending().filter(function(d){ return !dayCalc(d).toScore; });
      if(!confirm('Approve ' + ready.length + ' days?\n\nTheir points go to ' + first() + '’s Star Bank.')) return;
      approveDates(ready.map(function(d){ return d.date; })); return;
    }
    if(act === 'carry'){ var key = b.getAttribute('data-k'), cv = num(v); if(PZ.carry[key] === cv) delete PZ.carry[key]; else PZ.carry[key] = cv; render(); return; }
    if(act === 'csave'){ var k2 = b.getAttribute('data-k'); if(PZ.carry[k2] === undefined) return; PZ.busy = true; render();
      try{ await R().saveCarried(k2, PZ.carry[k2]); toast('Saved · +' + PZ.carry[k2] + ' points'); delete PZ.carry[k2]; }catch(err){ alert('Could not save: ' + (err && err.message ? err.message : err)); }
      finally{ PZ.busy = false; render(); } return; }
    if(act === 'ksave'){ var kv2 = PZ.kind[id]; if(kv2 === undefined) return; PZ.busy = true; render();
      try{ if(kv2 === 'redo') await NK().redo(id); else await NK().give(id, kv2); delete PZ.kind[id]; toast(kv2 === 'redo' ? 'He will be asked to try again.' : '+' + kv2 + ' kindness points given'); }
      catch(err){ alert('Could not save: ' + (err && err.message ? err.message : err)); }
      finally{ PZ.busy = false; render(); } return; }
    // Progress
    if(act === 'month'){ shiftMonth(num(v)); render(); return; }
    if(act === 'pick'){ PZ.sel = PZ.sel === date ? null : date; render(); return; }
    if(act === 'reopen'){ reopenDay(date); return; }
    if(act === 'del'){ deleteDay(date); return; }
    if(act === 'shl'){ PZ.shl = PZ.shl === id ? null : id; render(); return; }
    if(act === 'master'){ masterShloka(id); return; }
    if(act === 'relearn'){ relearnShloka(id); return; }
    // Timetable
    if(act === 'tt'){ PZ.tt = v; PZ.tdraft = null; PZ.terr = ''; render(); return; }
    if(act === 'tsel'){ var tb = PZ.T[which()].find(function(x){ return x.id === id; }); if(tb){ PZ.tdraft = clone(tb); PZ.tnew = false; PZ.terr = ''; render(); } return; }
    if(act === 'tbadd'){ PZ.tdraft = { id:uid('cblk'), name:'', icon:'', activities:[{ id:uid('cact'), name:'', pts:5, type:'self', note:'' }] }; PZ.tdraft._s = null; PZ.tdraft._e = null; PZ.tnew = true; PZ.terr = ''; render(); return; }
    if(act === 'tclose'){ PZ.tdraft = null; PZ.terr = ''; render(); return; }
    if(act === 'taadd'){ tRead(); PZ.tdraft.activities = PZ.tdraft.activities || []; PZ.tdraft.activities.push({ id:uid('cact'), name:'', pts:5, type:'self', note:'' }); render(); return; }
    if(act === 'tadel'){ tRead(); PZ.tdraft.activities.splice(num(b.getAttribute('data-i')), 1); render(); return; }
    if(act === 'tsave'){
      tRead(); var L = PZ.T[which()], dr = PZ.tdraft, err = ttProblem(L, dr);
      if(err){ PZ.terr = err; render(); return; }
      var blk = clone(dr); delete blk._s; delete blk._e; setTimes(blk, dr._s, dr._e === undefined ? null : dr._e);
      if(blk.type === 'break' || blk.type === 'locked-until-3pm') blk.activities = [];
      var ix = L.findIndex(function(x){ return x.id === blk.id; }); if(ix >= 0) L[ix] = blk; else L.push(blk);
      PZ.T[which()] = byTime(L);
      ttSaveAll(PZ.tnew ? 'Block added' : 'Block saved'); return;
    }
    if(act === 'tbdel'){
      if(!confirm('Delete “' + (PZ.tdraft.name || 'this block') + '” from the ' + (which() === 'weekend' ? 'holiday' : 'school day') + ' timetable?')) return;
      var did = PZ.tdraft.id; PZ.T[which()] = PZ.T[which()].filter(function(x){ return x.id !== did; });
      ttSaveAll('Block deleted'); return;
    }
    if(act === 'tdefault'){
      if(!confirm('Use NIYAM’s suggested timetable for ' + (window.niyamChildClass || 'his class') + '?\n\nBoth the school day and holiday timetables are replaced. Approved days never change.')) return;
      PZ.T = null; var keep = window.TT_CUSTOM; window.TT_CUSTOM = null; ttLoad(); window.TT_CUSTOM = keep;
      PZ.tdraft = null; ttSaveAll('NIYAM’s suggested timetable is back'); return;
    }
    // Rewards
    if(act === 'rwadd'){ PZ.rw = { id:'c-' + Date.now(), icon:'🎁', title:'', pts:300, level:'weekend', daily:false }; PZ.rwNew = true; render(); return; }
    if(act === 'rwedit'){ var it = rwList().find(function(r){ return String(r.id) === id; }); if(it){ PZ.rw = Object.assign({}, it); PZ.rwNew = false; render(); } return; }
    if(act === 'rwclose'){ PZ.rw = null; render(); return; }
    if(act === 'rwicon'){ rwRead(); PZ.rw.icon = v; render(); return; }
    if(act === 'rwdaily'){ rwRead(); var cur = PZ.rw.daily === true || (PZ.rw.daily === undefined && lvOf(PZ.rw) === 'everyday'); PZ.rw.daily = !cur; render(); return; }
    if(act === 'rwsave'){
      rwRead(); var e2 = PZ.rw;
      if(!e2.title){ alert('Please give the reward a name.'); return; }
      if(num(e2.pts) < 10){ alert('Please set at least 10 stars.'); return; }
      var list = rwList(), i = list.findIndex(function(r){ return String(r.id) === String(e2.id); });
      var item = { id:e2.id, icon:e2.icon || '🎁', title:e2.title, pts:num(e2.pts), level:e2.level || lvOf(e2), daily:e2.daily === true || (e2.daily === undefined && (e2.level || lvOf(e2)) === 'everyday'), active:e2.active !== false };
      if(i >= 0) list[i] = Object.assign({}, list[i], item); else list.push(item);
      if(await rwSave(list, PZ.rwNew ? 'Reward added' : 'Reward saved')){ PZ.rw = null; PZ.rwNew = false; render(); }
      return;
    }
    if(act === 'rwdel'){
      var l2 = rwList(), it2 = l2.find(function(r){ return String(r.id) === id; }); if(!it2) return;
      if(!confirm('Delete “' + it2.title + '” from the rewards list?')) return;
      if(await rwSave(l2.filter(function(r){ return String(r.id) !== id; }), 'Reward deleted')){ PZ.rw = null; render(); }
      return;
    }
    if(act === 'rwreset'){
      if(!confirm('Go back to NIYAM’s list of 16 rewards?\n\nYour own changes to the list will be replaced.')) return;
      if(window.niyamRewardDefaults && await rwSave(window.niyamRewardDefaults(), 'NIYAM’s rewards list is back')){ PZ.rw = null; render(); }
      return;
    }
    // Settings
    if(act === 'pin'){ PZ.pin = {}; render(); return; }
    if(act === 'pinx'){ PZ.pin = null; render(); return; }
    if(act === 'pinsave'){ savePin(); return; }
    if(act === 'backup'){ if(typeof exportBackup === 'function') exportBackup(); return; }
    if(act === 'clear'){ if(typeof clearDay === 'function') clearDay(); return; }
    if(act === 'logout'){ if(confirm('Log out of NIYAM on this device?')){ var lo = $('ns-pz-logout'); if(lo) lo.click(); } return; }
    if(act === 'feat'){ toggleFeature(b.getAttribute('data-k')); return; }
  }
  function onChange(e){
    var t = e.target; if(!t || !t.getAttribute) return;
    if(t.getAttribute('data-pz-ch') === 'tkind'){ tRead(); if(PZ.tdraft._s === undefined){ var tt = times(PZ.tdraft); PZ.tdraft._s = tt.s; PZ.tdraft._e = tt.e; } render(); }
  }
  function onInput(e){
    var t = e.target; if(!t || !t.getAttribute) return;
    var nd = t.getAttribute('data-pz-note'); if(nd){ try{ R().edits(nd).note = t.value; }catch(err){} }
  }

  // ---- open ---------------------------------------------------------------------------------------
  function build(){
    var zone = $('ns-parent-zone'); if(!zone) return false;
    addStyles();
    var root = $('pz2');
    if(!root){ root = document.createElement('div'); root.id = 'pz2'; zone.appendChild(root); root.addEventListener('click', onClick); root.addEventListener('input', onInput); root.addEventListener('change', onChange); }
    zone.classList.add('pz2-on');
    return true;
  }
  function openZone(){
    if(!window.niyamReview || !build()) return;
    PZ.T = null; PZ.tdraft = null; PZ.terr = '';
    PZ.page = 'today'; try{ var lp = sessionStorage.getItem('pz2-page'); if(/^(today|progress|timetable|rewards|settings)$/.test(lp || '')) PZ.page = lp; }catch(e){}
    PZ.exp = {}; PZ.open = {}; PZ.apOpen = {}; PZ.apw = 0; PZ.sel = null; PZ.rw = null; PZ.pin = null; PZ.month = null; PZ.tt = null;
    render();
    // kindness and the dictionary arrive a moment later
    try{ if(NK() && NK().reload){ var p = NK().reload(); if(p && p.then) p.then(render); } }catch(e){}
    try{ if(typeof wbLoad === 'function' && (typeof wbWords === 'undefined' || !wbWords.length)){ var w = wbLoad(); if(w && w.then) w.then(function(){ if($('ns-parent-zone') && $('ns-parent-zone').style.display !== 'none' && PZ.page === 'today') render(); }); } }catch(e){}
  }
  if(typeof window.niyamOpenReview === 'function'){
    var orig = window.niyamOpenReview;
    window.niyamOpenReview = function(){ var r = orig.apply(this, arguments); try{ openZone(); }catch(e){ console.error('[parent zone] open:', e); } return r; };
  }
  // The timetable editor may change the day: redraw when it closes.
  if(typeof window.niyamRefreshPlan === 'function'){
    var rp = window.niyamRefreshPlan;
    window.niyamRefreshPlan = function(){ var r = rp.apply(this, arguments); try{ if($('pz2')) render(); }catch(e){} return r; };
  }

  // ---- the PIN screen: a number pad -----------------------------------------------------------------
  function pinPad(){
    var box = $('ns-pinprompt'), inp = $('ns-pinprompt-input'), ok = $('ns-pinprompt-ok'); if(!box || !inp || !ok || $('pz2-pad')) return;
    addStyles();
    box.classList.add('pz2-pin');
    var card = box.querySelector('.ns-card'); if(!card) return;
    var mk = document.createElement('div'); mk.className = 'pzmark'; mk.textContent = 'N'; card.insertBefore(mk, card.firstChild);
    var h2 = card.querySelector('h2'); if(h2) h2.textContent = 'Welcome back.';
    var sub = card.querySelector('.ns-sub'); if(sub) sub.textContent = 'Enter your Parent PIN.';
    var pad = document.createElement('div'); pad.id = 'pz2-pad'; pad.className = 'pzpad';
    pad.innerHTML = ['1','2','3','4','5','6','7','8','9','','0','⌫'].map(function(k){ return k ? '<button type="button" data-k="' + k + '"' + (k === '⌫' ? ' class="n"' : '') + '>' + k + '</button>' : '<span></span>'; }).join('');
    inp.parentNode.insertBefore(pad, inp.nextSibling);
    function shown(){ return box.style.display !== 'none' && getComputedStyle(box).display !== 'none'; }
    function check(){ inp.value = inp.value.replace(/\D/g, '').slice(0, 4); if(inp.value.length === 4){ ok.click(); setTimeout(function(){ if(shown()) inp.value = ''; }, 300); } }
    // phones and tablets use the pad (no keyboard pops up); computers can also type
    var touch = !!(window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
    if(touch) inp.setAttribute('readonly', 'readonly'); else inp.removeAttribute('readonly');
    inp.addEventListener('input', check);
    inp.addEventListener('keydown', function(e){ if(e.key === 'Enter') ok.click(); });
    pad.addEventListener('click', function(e){
      var b = e.target.closest('[data-k]'); if(!b) return;
      var k = b.getAttribute('data-k');
      if(k === '⌫') inp.value = inp.value.slice(0, -1); else if(inp.value.length < 4) inp.value += k;
      check();
    });
    // ---- Forgot PIN ----
    var fl = document.createElement('div'); fl.style.cssText = 'text-align:center;margin-top:10px';
    fl.innerHTML = '<button type="button" id="pz2-forgot" style="background:none!important;border:0!important;color:#C79A4E!important;font:600 14px Inter,system-ui,sans-serif;padding:6px;cursor:pointer;box-shadow:none!important">Forgot PIN?</button>';
    card.appendChild(fl);
    var fg = document.createElement('div'); fg.id = 'pz2-fg'; card.appendChild(fg);
    function fgShow(step, msg, ok){
      box.classList.add('fg');
      var em = window.niyamAccountEmail ? window.niyamAccountEmail() : '';
      var h = '';
      if(step === 1){
        h = '<h2>Reset your Parent PIN</h2><p class="ns-sub">To keep the Parent Zone safe, first confirm it is you with the password of your NIYAM account.</p>'
          + '<div class="fgl">Account</div><div class="fgv">' + esc(em) + '</div>'
          + '<div class="fgl">Account password</div><input id="pz2-fg-pw" type="password" autocomplete="current-password">'
          + '<button type="button" class="fgb" data-fg="check">Confirm</button>'
          + '<button type="button" class="fgl2" data-fg="mail">Forgot the account password too? Email me a reset link</button>';
      } else if(step === 2){
        h = '<h2>Choose a new PIN</h2><p class="ns-sub">4 numbers. Keep it private from your child.</p>'
          + '<div class="fgl">New PIN</div><input id="pz2-fg-p1" type="password" inputmode="numeric" maxlength="4">'
          + '<div class="fgl">New PIN again</div><input id="pz2-fg-p2" type="password" inputmode="numeric" maxlength="4">'
          + '<button type="button" class="fgb" data-fg="save">Save PIN and open the Parent Zone</button>';
      } else {
        h = '<h2>Check your email</h2><p class="ns-sub">We have sent a link to <b>' + esc(em) + '</b>. Open it on this device and choose a new account password. Then come back here, tap “Forgot PIN?” and use the new password.</p>';
      }
      h += (msg ? '<div class="fgm' + (ok ? ' ok' : '') + '">' + esc(msg) + '</div>' : '') + '<button type="button" class="fgl2" data-fg="back">← Back to the PIN</button>';
      fg.innerHTML = h;
      var f = fg.querySelector('input'); if(f) setTimeout(function(){ f.focus(); }, 50);
    }
    function fgHide(){ box.classList.remove('fg'); fg.innerHTML = ''; inp.value = ''; }
    $('pz2-forgot').addEventListener('click', function(){ fgShow(1); });
    var pb = $('ns-parent-btn'); if(pb) pb.addEventListener('click', fgHide);
    var cn = $('ns-pinprompt-cancel'); if(cn) cn.addEventListener('click', fgHide);
    fg.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ var b = fg.querySelector('.fgb'); if(b) b.click(); } });
    fg.addEventListener('click', async function(e){
      var b = e.target.closest('[data-fg]'); if(!b || b.disabled) return;
      var a = b.getAttribute('data-fg');
      if(a === 'back'){ fgHide(); return; }
      if(a === 'check'){
        var pw = ($('pz2-fg-pw') || {}).value || ''; if(!pw){ fgShow(1, 'Please type the account password.'); return; }
        b.disabled = true; b.textContent = 'Checking…';
        try{ await window.niyamReauth(pw); fgShow(2); }catch(err){ fgShow(1, 'That password is not right. Please try again.'); }
        return;
      }
      if(a === 'mail'){
        b.disabled = true;
        try{ await window.niyamSendPasswordReset(window.niyamAccountEmail()); fgShow(3); }catch(err){ fgShow(1, 'Could not send the email: ' + (err && err.message ? err.message : err)); }
        return;
      }
      if(a === 'save'){
        var p1 = ($('pz2-fg-p1') || {}).value || '', p2 = ($('pz2-fg-p2') || {}).value || '';
        if(!/^\d{4}$/.test(p1)){ fgShow(2, 'The PIN must be 4 numbers.'); return; }
        if(p1 !== p2){ fgShow(2, 'The two PINs are not the same.'); return; }
        b.disabled = true; b.textContent = 'Saving…';
        try{ await window.niyamSavePin(p1); fgHide(); if(window.niyamEnterParentZone) window.niyamEnterParentZone(); toast('Your new PIN is saved.'); }
        catch(err){ fgShow(2, 'Could not save: ' + (err && err.message ? err.message : err)); }
      }
    });

    // typing anywhere while the PIN screen is open goes into the PIN
    document.addEventListener('keydown', function(e){
      if(!shown() || box.classList.contains('fg') || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) return;
      if(/^\d$/.test(e.key)){ e.preventDefault(); if(inp.value.length < 4) inp.value += e.key; check(); }
      else if(e.key === 'Backspace'){ e.preventDefault(); inp.value = inp.value.slice(0, -1); }
      else if(e.key === 'Escape'){ var c = $('ns-pinprompt-cancel'); if(c) c.click(); }
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pinPad); else pinPad();
  // after a switch in Settings reloads the app, say what changed
  try{ var msg = sessionStorage.getItem('pz2-msg'); if(msg){ sessionStorage.removeItem('pz2-msg'); setTimeout(function(){ toast(msg); }, 1500); } }catch(e){}

  window.niyamParentZone = { render: render, go: go, count: counts };
})();
