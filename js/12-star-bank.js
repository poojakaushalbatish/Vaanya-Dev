// ============================================================================
// NIYAM — js/12-star-bank.js
// The Rewards tab, redesigned as the child's "Star Bank" (22 Oct 2026).
// Loads after js/11-dictionary.js. Draws over the old Rewards screen (its
// markup stays in index.html, hidden).
//
// Left:  the Star Bank (points ready to spend, with a buddy who cheers),
//        My goal (chosen by the child), points this week, points on the way
//        (days waiting for the parent), and My rewards (coming soon / enjoyed).
// Right: the rewards in four levels — Everyday Treats, Weekend Rewards,
//        Big Rewards, Dream Goal.
//
// Rules (Pooja, 22 Oct 2026):
//  • Claiming needs the parent PIN. The points come off at once and the
//    reward shows as "Coming soon" until the parent marks it enjoyed.
//  • The child chooses their goal (saved in profile_data.reward_goal).
//  • Every reward shows "about N good days" from the child's own timetable.
//  • One list (the old separate Rewards and Spend lists are merged).
//  • Everyday treats can be claimed once a day each.
//
// The family's own list lives in the `rewards` table (js/00-shell.js keeps it
// in localStorage 'vaanya_admin_rewards'); the parent edits it with the
// rewards editor (js/08-rewards-admin.js). With no list of their own, the
// defaults below are used. Claims are rows in `spend_history`, with a
// `status` column ('coming' or 'enjoyed') — see star-bank-and-kindness.sql.
// ============================================================================
(function(){
  'use strict';

  // ---- the default rewards (Class 4; the same for every class until each class gets its own list) ----
  var DEFAULTS = [
    { id:'d-dessert',  level:'everyday', daily:true, icon:'🍨', title:'Choose tonight’s dessert',               pts:60 },
    { id:'d-play15',   level:'everyday', daily:true, icon:'🎮', title:'15 extra minutes of play or screen time', pts:80 },
    { id:'d-dinner',   level:'everyday', daily:true, icon:'🍕', title:'Pick the family’s dinner',               pts:100 },
    { id:'d-stayup',   level:'everyday', daily:true, icon:'🌙', title:'Stay up 15 minutes later (weekend night)', pts:120 },
    { id:'d-boardgame',level:'everyday', daily:true, icon:'🎲', title:'Board game with Mum or Dad',             pts:120 },
    { id:'d-chore',    level:'everyday', daily:true, icon:'🧹', title:'Skip one chore today (parent picks which)', pts:150 },
    { id:'d-movienight',level:'weekend', icon:'🎬', title:'Family movie night — you choose the film', pts:300 },
    { id:'d-bake',     level:'weekend', icon:'🧁', title:'Bake or cook something together', pts:350 },
    { id:'d-icecream', level:'weekend', icon:'🍦', title:'Ice-cream or park outing',         pts:400 },
    { id:'d-book',     level:'weekend', icon:'📚', title:'A new book of your choice',        pts:500 },
    { id:'d-theatre',  level:'big',     icon:'🍿', title:'Movie in a theatre with family',   pts:1500 },
    { id:'d-halfyes',  level:'big',     icon:'🌟', title:'Half “Yes Day” — you plan half a day', pts:2000 },
    { id:'d-toy',      level:'big',     icon:'⚽', title:'A toy, game or sports item (parent sets the budget)', pts:2500 },
    { id:'d-trip',     level:'big',     icon:'🦁', title:'A day trip you choose — zoo, museum or science centre', pts:3000 },
    { id:'d-fullyes',  level:'dream',   icon:'👑', title:'Full “Yes Day” — you plan the whole day', pts:6000 },
    { id:'d-special',  level:'dream',   icon:'🚲', title:'Something special you choose with your parents', pts:8000 }
  ];
  window.niyamRewardDefaults = function(){ return JSON.parse(JSON.stringify(DEFAULTS)); };

  var LEVELS = [
    { key:'everyday', name:'Everyday Treats',  sub:'About one good day or less', c:'#14B8A6', tint:'#E6FBF7', grad:'linear-gradient(120deg,#0EA5A0,#2DD4BF)' },
    { key:'weekend',  name:'Weekend Rewards',  sub:'About 3 to 5 good days',     c:'#3B82F6', tint:'#EAF2FF', grad:'linear-gradient(120deg,#2563EB,#60A5FA)' },
    { key:'big',      name:'Big Rewards',      sub:'About 2 to 3 weeks',         c:'#F97316', tint:'#FFF1E6', grad:'linear-gradient(120deg,#EA580C,#FB923C)' },
    { key:'dream',    name:'Dream Goal',       sub:'About 2 months',             c:'#8B5CF6', tint:'#F3EEFF', grad:'linear-gradient(120deg,#6D28D9,#A78BFA)' }
  ];
  function levelOf(r){
    if(r.level && LEVELS.some(function(L){ return L.key === r.level; })) return r.level;
    var p = +r.pts || 0;
    return p <= 150 ? 'everyday' : p <= 600 ? 'weekend' : p <= 3500 ? 'big' : 'dream';
  }

  var S = { rows:null, loading:false, modal:null, pick:null, pin:'', pinErr:'', busy:false, goalBusy:false };

  // ---- helpers ------------------------------------------------------------------
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmtN(n){ return (+n || 0).toLocaleString('en-IN'); }
  function today(){ return new Date().toLocaleDateString('en-CA'); }
  function days(){ return (typeof savedDays !== 'undefined' && Array.isArray(savedDays)) ? savedDays : []; }
  function bank(){ try{ return availablePts(); }catch(e){ return 0; } }
  function earned(){ try{ return totalEarned(); }catch(e){ return 0; } }
  function childName(){ return window.niyamChildName || ''; }
  function toastMsg(m){ if(typeof toast === 'function') toast(m); }
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmtDate(d){ var p = String(d || '').split('-'); return p.length === 3 ? (+p[2]) + ' ' + MONTHS[(+p[1]) - 1] : ''; }

  function rewards(){
    var list = null;
    try{ list = JSON.parse(localStorage.getItem('vaanya_admin_rewards') || 'null'); }catch(e){}
    if(!Array.isArray(list) || !list.length) list = DEFAULTS;
    return list.filter(function(r){ return r && r.active !== false && (+r.pts > 0); })
      .map(function(r){ return { id:String(r.id), icon:r.icon || '🎁', title:r.title || 'Reward', pts:+r.pts, level:levelOf(r),
        daily: r.daily === true || (r.daily === undefined && levelOf(r) === 'everyday') }; });
  }
  // About how many points a good day brings: this child's own average over the
  // last 30 approved days (once there are 3), otherwise 3/4 of a full school day.
  function goodDay(){
    try{
      var since = new Date(); since.setDate(since.getDate() - 30); since = since.toLocaleDateString('en-CA');
      var ok = days().filter(function(d){ return d && d.approved === true && d.date >= since && (parseInt(d.pts, 10) || 0) > 0; });
      if(ok.length >= 3) return Math.max(40, Math.round(ok.reduce(function(a, d){ return a + (parseInt(d.pts, 10) || 0); }, 0) / ok.length));
    }catch(e){}
    try{
      var wd = (window.TT_CUSTOM && Array.isArray(window.TT_CUSTOM.weekday) && window.TT_CUSTOM.weekday.length) ? window.TT_CUSTOM.weekday
             : (typeof TT_WEEKDAY !== 'undefined' ? TT_WEEKDAY : null);
      var m = (wd && typeof window.niyamDayMax === 'function') ? window.niyamDayMax(wd) : 0;
      if(m > 0) return Math.max(40, Math.round(m * 0.75));
    }catch(e){}
    return 125;
  }
  function daysFor(pts){ var n = Math.max(1, Math.ceil(pts / goodDay())); return 'about ' + n + ' good ' + (n === 1 ? 'day' : 'days'); }
  function goalId(){ try{ return (window.niyamProfileData && window.niyamProfileData().reward_goal) || ''; }catch(e){ return ''; } }

  // ---- claims (spend_history) -----------------------------------------------------------
  function rowsFor(id){ return (S.rows || []).filter(function(r){ return r.item_id === 'reward_' + id; }); }
  function usedToday(r){ return r.daily && rowsFor(r.id).some(function(x){ return x.date === today(); }); }
  async function loadRows(force){
    if(S.loading || (S.rows && !force)) return;
    if(typeof _supabase === 'undefined' || !_supabase){ S.rows = S.rows || []; return; }
    S.loading = true;
    try{
      var r = await _supabase.from('spend_history').select('*').order('date', { ascending:false });
      if(!r.error) S.rows = (r.data || []).map(function(x){ return { rid:x.id, date:x.date, item_id:x.item_id, title:x.item_name, pts:+x.pts_spent || 0, status:x.status || 'enjoyed' }; });
      else { console.warn('[star bank] claims:', r.error); S.rows = S.rows || []; }
    }catch(e){ console.warn('[star bank] claims:', e); S.rows = S.rows || []; }
    S.loading = false;
    redraw();
  }
  async function claim(r){
    var date = today(), row = { date:date, item_id:'reward_' + r.id, item_name:r.title, pts_spent:r.pts, status:'coming' };
    var res = await _supabase.from('spend_history').insert(row).select();
    if(res.error && /status/i.test(res.error.message || '')){        // the status column is not there yet
      delete row.status; res = await _supabase.from('spend_history').insert(row).select();
    }
    if(res.error) throw new Error(res.error.message);
    var saved = (res.data && res.data[0]) || {};
    S.rows = S.rows || [];
    S.rows.unshift({ rid:saved.id, date:date, item_id:row.item_id, title:r.title, pts:r.pts, status:'coming' });
    // the rest of the app's own copy of what was spent
    try{
      totalSpent += r.pts;
      spendHist.unshift({ id:row.item_id, cost:r.pts, title:r.title, date:date });
      localStorage.setItem('vaanya_spent_total', totalSpent);
      localStorage.setItem('vaanya_spend_hist', JSON.stringify(spendHist));
      if(typeof markRewardClaimed === 'function') markRewardClaimed(row.item_id, r.pts, r.title);
      if(typeof updateTopBar === 'function') updateTopBar();
    }catch(e){ console.warn('[star bank] totals:', e); }
  }

  // ---- the buddy (NIYAM's own character: Captain Star) -------------------------------------
  function starPts(cx, cy, R, r){
    var out = []; for(var k = 0; k < 10; k++){ var rad = k % 2 ? r : R, a = (-90 + k * 36) * Math.PI / 180; out.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1)); }
    return out.join(' ');
  }
  function buddy(size){
    return '<svg class="sb-buddy" width="' + size + '" height="' + size + '" viewBox="0 0 120 120" aria-hidden="true"><g class="b-body">'
      + '<path class="b-cape" d="M44 52 Q30 90 22 108 Q60 96 98 108 Q90 90 76 52 Z" fill="#E11D48"/>'
      + '<polygon points="' + starPts(60, 62, 44, 21) + '" fill="#FFC83D" stroke="#FFC83D" stroke-width="10" stroke-linejoin="round"/>'
      + '<polygon points="' + starPts(60, 60, 30, 15) + '" fill="#FFD86B"/>'
      + '<path d="M36 50 Q60 40 84 50 L82 60 Q60 52 38 60 Z" fill="#1E3A8A"/>'
      + '<g class="b-eyes"><ellipse cx="50" cy="55" rx="5" ry="6" fill="#fff"/><ellipse cx="70" cy="55" rx="5" ry="6" fill="#fff"/><circle cx="51" cy="56" r="2.6" fill="#1F1235"/><circle cx="71" cy="56" r="2.6" fill="#1F1235"/></g>'
      + '<path d="M50 70 Q60 80 70 70" stroke="#7A3E00" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
      + '<circle cx="42" cy="68" r="4" fill="#FF8FA3" opacity=".7"/><circle cx="78" cy="68" r="4" fill="#FF8FA3" opacity=".7"/></g></svg>';
  }
  function jar(fillPct){
    var top = 112 - Math.round(Math.max(0, Math.min(1, fillPct)) * 74), stars = '', seed = 7;
    function r(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for(var i = 0; i < 14; i++){ var x = 26 + r() * 44, y = top + 6 + r() * (106 - top); if(y < 108) stars += '<polygon class="sb-tw" style="animation-delay:' + (r() * 2).toFixed(1) + 's" points="' + starPts(x, y, 5, 2.2) + '" fill="#FFF4C7"/>'; }
    return '<div class="sb-jar"><span class="sb-coin">⭐</span><span class="sb-coin" style="animation-delay:1.3s;left:52px">⭐</span>'
      + '<svg viewBox="0 0 96 118" width="92" height="116" aria-hidden="true"><defs><linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset="1" stop-color="#FFB000"/></linearGradient>'
      + '<clipPath id="sbc"><path d="M18 30 Q18 22 26 22 H70 Q78 22 78 30 V102 Q78 112 68 112 H28 Q18 112 18 102 Z"/></clipPath></defs>'
      + '<rect x="24" y="8" width="48" height="14" rx="5" fill="#FFC83D"/><g clip-path="url(#sbc)"><rect x="0" y="' + top + '" width="96" height="120" fill="url(#sbg)"/>' + stars + '</g>'
      + '<path d="M18 30 Q18 22 26 22 H70 Q78 22 78 30 V102 Q78 112 68 112 H28 Q18 112 18 102 Z" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.8)" stroke-width="2.5"/>'
      + '<line x1="20" y1="38" x2="76" y2="38" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 3"/><text x="48" y="35" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="9" fill="#fff">GOAL</text></svg></div>';
  }

  // ---- styles --------------------------------------------------------------------------------
  var CSS = ''
  + '#tab-rewards>:not(#sb-root){display:none!important}'
  + '#sb-root,#sb-modal{--ink:#24163F;--soft:#6E6488;--line:#ECE6F5;--plum:#5B2A9B;--gold:#FFC83D;--gold2:#FFB000;--leaf:#16A34A;font-family:Nunito,system-ui,sans-serif;color:var(--ink);box-sizing:border-box}'
  + '#sb-root *,#sb-modal *{box-sizing:border-box}'
  + '#sb-root button,#sb-modal button{font-family:inherit;cursor:pointer}'
  + '#sb-root{background:#F7F3FF;border-radius:24px;padding:14px;max-width:1240px;margin:0 auto}'
  + '#sb-root .f,#sb-modal .f{font-family:Fredoka,Nunito,sans-serif}'
  + '#sb-root .cap,#sb-modal .cap{font-size:11.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}'
  + '#sb-root .lay{display:grid;grid-template-columns:minmax(0,1fr);gap:0}'
  // star bank
  + '#sb-root .bank{position:relative;overflow:hidden;border-radius:26px;padding:20px 18px 18px;color:#fff;background:radial-gradient(120% 90% at 100% 0%,#FF9A6B 0%,rgba(255,122,89,0) 45%),linear-gradient(160deg,#2A1758 0%,#4A2290 55%,#7A2E8E 100%)}'
  + '#sb-root .bank .sp{position:absolute;width:6px;height:6px;border-radius:50%;background:#FFE9A8;box-shadow:0 0 8px #FFE9A8;animation:sbFloat 5s linear infinite}'
  + '#sb-root .bank>.in{position:relative}'
  + '#sb-root .bank .cap{color:#FFD9A0}'
  + '#sb-root .row{display:flex;align-items:flex-end;gap:10px}'
  + '#sb-root .big{font-family:Fredoka,sans-serif;font-weight:700;font-size:54px;line-height:.95;background:linear-gradient(180deg,#FFF3C4,#FFC83D 60%,#FFB000);-webkit-background-clip:text;background-clip:text;color:transparent}'
  + '#sb-root .sb-jar{position:relative;width:92px;height:116px;flex:0 0 auto}'
  + '#sb-root .sb-coin{position:absolute;left:40px;top:0;font-size:16px;animation:sbDrop 2.6s ease-in infinite}'
  + '#sb-root .sb-tw{animation:sbTwinkle 2.2s infinite;transform-box:fill-box;transform-origin:center}'
  + '#sb-root .speech{position:relative;background:#fff;color:var(--ink);border-radius:16px;padding:9px 12px;font-weight:800;font-size:13px;line-height:1.35;margin-bottom:6px}'
  + '#sb-root .speech:after{content:"";position:absolute;right:26px;bottom:-8px;border:8px solid transparent;border-bottom:0;border-top-color:#fff}'
  + '#sb-root .chips{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}'
  + '#sb-root .chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:99px;padding:5px 12px;font-weight:800;font-size:12.5px}'
  // buddy animation
  + '.sb-buddy .b-body{animation:sbBob 2.6s ease-in-out infinite;transform-origin:60px 110px}'
  + '.sb-buddy .b-eyes{animation:sbBlink 4.5s infinite;transform-origin:60px 58px;transform-box:view-box}'
  + '.sb-buddy .b-cape{animation:sbSway 2.2s ease-in-out infinite;transform-origin:60px 52px;transform-box:view-box}'
  // goal + panels
  + '#sb-root .goal{margin-top:14px;background:#fff;border-radius:22px;padding:14px 16px;display:flex;gap:14px;align-items:center;box-shadow:0 10px 30px rgba(91,42,155,.12);border:2px solid #FFE7A3}'
  + '#sb-root .ring{flex:0 0 auto;width:76px;height:76px;border-radius:50%;display:flex;align-items:center;justify-content:center;animation:sbPulse 2.4s infinite}'
  + '#sb-root .ring div{width:60px;height:60px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:30px}'
  + '#sb-root .goal h3{margin:2px 0 0;font-family:Fredoka,sans-serif;font-weight:600;font-size:19px;line-height:1.15}'
  + '#sb-root .bar{height:10px;border-radius:99px;background:#F1ECFA;margin-top:8px;overflow:hidden}'
  + '#sb-root .bar i{display:block;height:100%;background:linear-gradient(90deg,#FFC83D,#FF7A59)}'
  + '#sb-root .goal.none{border-style:dashed;background:#FFFDF5}'
  + '#sb-root .pending{margin-top:12px;background:#FFF8E6;border:1.5px dashed #F5C04A;border-radius:18px;padding:11px 14px;display:flex;gap:12px;align-items:center;font-weight:800;font-size:14px}'
  + '#sb-root .panel{background:#fff;border-radius:20px;padding:14px 16px;margin-top:12px;border:2px solid var(--line)}'
  + '#sb-root .week{display:flex;align-items:flex-end;gap:8px;height:112px;margin-top:10px}'
  + '#sb-root .week div{flex:1;text-align:center;font-size:11px;font-weight:800;color:var(--soft);display:flex;flex-direction:column;justify-content:flex-end;height:100%}'
  + '#sb-root .week b{display:block;font-size:10.5px;color:var(--ink);margin-bottom:2px}'
  + '#sb-root .week i{display:block;border-radius:8px 8px 4px 4px;background:linear-gradient(180deg,#A78BFA,#6D28D9);margin-bottom:4px;min-height:4px}'
  + '#sb-root .week i.p{background:repeating-linear-gradient(45deg,#FDE68A 0 6px,#FCD34D 6px 12px)}'
  + '#sb-root .week div.today{color:var(--plum)}'
  + '#sb-root .myr .r{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed var(--line);font-weight:800;font-size:14px}'
  + '#sb-root .myr .r:last-child{border-bottom:0}'
  + '#sb-root .myr .r span.e{font-size:22px;flex:0 0 auto}'
  + '#sb-root .myr .r small{display:block;font-weight:700;color:var(--soft);font-size:12px}'
  + '#sb-root .st{margin-left:auto;font-size:12px;font-weight:900;border-radius:99px;padding:3px 10px;white-space:nowrap}'
  // levels and cards
  + '#sb-root .landhead{position:relative;overflow:hidden;border-radius:20px;padding:14px 16px;color:#fff;min-height:78px;display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:22px}'
  + '#sb-root .landhead h2{margin:0;font-family:Fredoka,sans-serif;font-weight:700;font-size:23px;line-height:1;color:#fff}'
  + '#sb-root .landhead p{margin:4px 0 0;font-weight:800;font-size:13px;opacity:.92}'
  + '#sb-root .landhead .cl{position:absolute;top:10px;width:60px;height:18px;border-radius:20px;background:rgba(255,255,255,.35);animation:sbDrift 7s ease-in-out infinite alternate}'
  + '#sb-root .landhead .tag{position:relative;background:rgba(255,255,255,.22);border-radius:99px;padding:4px 11px;font-weight:900;font-size:12px;white-space:nowrap}'
  + '#sb-root .cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}'
  + '#sb-root .card{position:relative;overflow:hidden;background:#fff;border-radius:20px;padding:14px 12px 12px;text-align:center;border:2px solid var(--line);display:flex;flex-direction:column}'
  + '#sb-root .card .em{width:64px;height:64px;margin:0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:34px;background:var(--tint)}'
  + '#sb-root .card h4{margin:8px 0 2px;font-family:Fredoka,sans-serif;font-weight:600;font-size:16px;line-height:1.2;min-height:38px;display:flex;align-items:center;justify-content:center}'
  + '#sb-root .price{font-family:Fredoka,sans-serif;font-weight:700;font-size:20px;color:var(--c)}'
  + '#sb-root .price small{font-family:Nunito,sans-serif;font-size:12px;font-weight:800;color:var(--soft)}'
  + '#sb-root .days{font-size:12px;font-weight:800;color:var(--soft);margin-top:1px}'
  + '#sb-root .card .sp{flex:1}'
  + '#sb-root .go{display:block;width:100%;margin-top:10px;border:0;border-radius:14px;min-height:44px;font-family:Fredoka,sans-serif;font-weight:600;font-size:16px;color:#fff;background:var(--c);box-shadow:0 4px 0 rgba(0,0,0,.12)}'
  + '#sb-root .card.ready{border-color:var(--c)}'
  + '#sb-root .card.ready:after{content:"";position:absolute;top:0;bottom:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:sbShine 3.4s ease-in-out infinite;pointer-events:none}'
  + '#sb-root .card.ready .em{animation:sbBob 2.4s ease-in-out infinite}'
  + '#sb-root .card.ready .go{animation:sbNudge 4s infinite}'
  + '#sb-root .card .tw{position:absolute;right:10px;top:8px;font-size:16px;animation:sbTwinkle 1.8s infinite}'
  + '#sb-root .card.locked .em{filter:grayscale(.6);opacity:.6}'
  + '#sb-root .card.locked .go,#sb-root .card.used .go{box-shadow:none;cursor:default}'
  + '#sb-root .card.locked .go{background:#F1ECFA;color:var(--soft)}'
  + '#sb-root .card.used .go{background:#ECFDF5;color:var(--leaf)}'
  + '#sb-root .lockbar{height:7px;border-radius:99px;background:#F1ECFA;margin-top:8px;overflow:hidden}'
  + '#sb-root .lockbar i{display:block;height:100%;background:var(--c)}'
  + '#sb-root .card.isgoal{border-color:var(--gold2)}'
  + '#sb-root .card .pinb{position:absolute;left:8px;top:7px;border:0;background:transparent;font-size:17px;line-height:1;padding:4px;color:#CFC6E3;z-index:1}'
  + '#sb-root .card .pinb.on{background:#FFF3C4;color:#9A6400;border-radius:99px;font-size:11px;font-weight:900;padding:3px 8px}'
  + '#sb-root .hint{font-size:12.5px;font-weight:700;color:var(--soft);margin-top:10px;text-align:center}'
  // the claim window
  + '#sb-modal{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(36,22,63,.55);animation:sbFade .2s}'
  + '#sb-modal .sheet{background:#fff;border-radius:28px 28px 0 0;padding:20px 18px 26px;max-width:520px;width:100%;margin:0 auto;text-align:center;animation:sbUp .25s ease-out;max-height:100vh;overflow:auto}'
  + '#sb-modal .handle{width:46px;height:5px;border-radius:9px;background:#E5DEF2;margin:0 auto 14px}'
  + '#sb-modal .bigem{width:110px;height:110px;margin:0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:62px}'
  + '#sb-modal .sum{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:16px;font-weight:800;flex-wrap:wrap}'
  + '#sb-modal .sum>div{border-radius:16px;padding:10px 12px;min-width:84px}'
  + '#sb-modal .sum .n{font-family:Fredoka,sans-serif;font-size:22px;font-weight:700}'
  + '#sb-modal .sum small{display:block;font-size:12px;color:var(--soft)}'
  + '#sb-modal .btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:52px;border:0;border-radius:16px;font-family:Fredoka,sans-serif;font-weight:600;font-size:18px;color:#fff;background:var(--plum);margin-top:10px}'
  + '#sb-modal .btn.ghost{background:#fff;color:var(--ink);border:2px solid var(--line)}'
  + '#sb-modal .btn.gold{background:linear-gradient(180deg,#FFD25E,#FFB000);color:#3B2600;box-shadow:0 5px 0 #D68F00}'
  + '#sb-modal .btn[disabled]{opacity:.5}'
  + '#sb-modal .dots{display:flex;gap:12px;justify-content:center;margin-top:12px;min-height:16px}'
  + '#sb-modal .dots i{width:16px;height:16px;border-radius:50%;background:var(--plum)}'
  + '#sb-modal .dots.err{animation:sbShake .35s}'
  + '#sb-modal .pad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}'
  + '#sb-modal .pad button{height:56px;border-radius:16px;background:#F5F1FC;border:0;font-family:Fredoka,sans-serif;font-weight:600;font-size:24px;color:var(--ink)}'
  + '#sb-modal.yay{justify-content:center;background:linear-gradient(170deg,#2A1758,#5B2A9B 60%,#FF7A59);color:#fff;text-align:center;overflow:hidden}'
  + '#sb-modal .conf{position:absolute;top:-20px;width:10px;height:16px;border-radius:2px;animation:sbFall linear infinite}'
  + '#sb-modal .yaybox{position:relative;max-width:460px;margin:0 auto;padding:30px 22px}'
  + '#sb-modal .glow{width:150px;height:150px;margin:0 auto;border-radius:50%;background:radial-gradient(circle,#FFF3C4,#FFC83D 70%);display:flex;align-items:center;justify-content:center;font-size:84px;box-shadow:0 0 0 12px rgba(255,200,61,.25),0 0 60px rgba(255,200,61,.6);animation:sbPop .6s cubic-bezier(.2,1.6,.4,1)}'
  // keyframes
  + '@keyframes sbBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'
  + '@keyframes sbBlink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.1)}}'
  + '@keyframes sbSway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}'
  + '@keyframes sbTwinkle{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}'
  + '@keyframes sbFloat{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-140px);opacity:0}}'
  + '@keyframes sbShine{0%{transform:translateX(-120%) skewX(-20deg)}55%,100%{transform:translateX(260%) skewX(-20deg)}}'
  + '@keyframes sbNudge{0%,86%,100%{transform:scale(1)}90%{transform:scale(1.06)}94%{transform:scale(.98)}}'
  + '@keyframes sbDrop{0%{transform:translateY(-30px);opacity:0}20%{opacity:1}70%{transform:translateY(40px);opacity:1}100%{transform:translateY(40px);opacity:0}}'
  + '@keyframes sbDrift{0%{transform:translateX(-30px)}100%{transform:translateX(30px)}}'
  + '@keyframes sbPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,200,61,.55)}50%{box-shadow:0 0 0 12px rgba(255,200,61,0)}}'
  + '@keyframes sbFade{from{opacity:0}to{opacity:1}}'
  + '@keyframes sbUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}'
  + '@keyframes sbShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}'
  + '@keyframes sbFall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(110vh) rotate(540deg)}}'
  + '@keyframes sbPop{0%{transform:scale(.3)}100%{transform:scale(1)}}'
  + '@media (prefers-reduced-motion:reduce){#sb-root *,#sb-modal *{animation:none!important}}'
  + '@media (min-width:820px){'
  +   '#sb-root{padding:24px 26px}'
  +   '#sb-root .lay{grid-template-columns:360px minmax(0,1fr);gap:24px;align-items:start}'
  +   '#sb-root .landhead:first-child{margin-top:0}'
  +   '#sb-modal{justify-content:center;padding:20px}'
  +   '#sb-modal .sheet{border-radius:28px}'
  + '}'
  + '@media (min-width:1180px){#sb-root .cards{grid-template-columns:repeat(4,minmax(0,1fr))}}';

  function addStyles(){
    if($('sb-style')) return;
    var st = document.createElement('style'); st.id = 'sb-style'; st.textContent = CSS; document.head.appendChild(st);
    if(!document.querySelector('link[data-sb-font]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-sb-font', '1');
      l.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800;900&display=swap';
      document.head.appendChild(l);
    }
  }
  function root(){
    var tab = $('tab-rewards'); if(!tab) return null;
    var r = $('sb-root');
    if(!r){
      addStyles();
      r = document.createElement('div'); r.id = 'sb-root';
      tab.insertBefore(r, tab.firstChild);
      r.addEventListener('click', onClick);
    }
    return r;
  }

  // ---- the page -------------------------------------------------------------------------------
  function bankHtml(list){
    var b = bank(), g = list.find(function(r){ return r.id === goalId(); });
    var ready = list.filter(function(r){ return b >= r.pts && !usedToday(r); }).length;
    var say = g ? (b >= g.pts ? 'You have enough for your goal! Ask your parent when you are ready. 🎉'
                              : 'Only ' + fmtN(g.pts - b) + ' more for ' + g.title.split(' — ')[0].replace(/\s*\(.*\)$/, '') + '. You can do it! ' + g.icon)
            : ready ? 'You can choose from ' + ready + (ready === 1 ? ' reward' : ' rewards') + ' right now! Pick a goal too ⭐'
            : 'Every good day fills your jar. Keep going! ⭐';
    var enjoyed = (S.rows || []).filter(function(x){ return /^reward_/.test(x.item_id) && x.status !== 'coming'; }).length;
    var sparks = ''; for(var i = 0; i < 12; i++) sparks += '<i class="sp" style="left:' + ((i * 37 + 9) % 95) + '%;bottom:' + ((i * 23) % 40) + '%;animation-delay:' + ((i * 0.45) % 5).toFixed(1) + 's;animation-duration:' + (4 + (i % 3)) + 's"></i>';
    var fill = g ? b / g.pts : Math.min(1, b / 1000);
    var name = childName();
    return '<div class="bank">' + sparks + '<div class="in"><div class="cap">' + (name ? esc(name) + '’s ' : 'My ') + 'Star Bank</div>'
      + '<div class="row" style="margin-top:6px"><div style="flex:1;min-width:0"><div class="f" style="font-weight:700;font-size:20px">You’ve saved</div><div class="big">' + fmtN(b) + '</div>'
      + '<div style="font-weight:800;font-size:14px;color:#F3E8FF">points ready to spend</div></div>' + jar(fill) + '</div>'
      + '<div class="row" style="margin-top:8px;align-items:center"><div style="flex:1;min-width:0"><div class="speech">' + esc(say) + '</div></div>' + buddy(84) + '</div>'
      + '<div class="chips"><span class="chip">⭐ ' + fmtN(earned()) + ' earned in all</span>'
      + '<span class="chip">🔥 ' + (typeof getStreak === 'function' ? getStreak() : 0) + '-day streak</span>'
      + '<span class="chip">🎁 ' + enjoyed + ' enjoyed</span></div></div></div>';
  }
  function goalHtml(list){
    var g = list.find(function(r){ return r.id === goalId(); });
    if(!g) return '<div class="goal none"><div class="ring" style="background:#F1ECFA;animation:none"><div>🎯</div></div><div style="flex:1;min-width:0"><div class="cap" style="color:#C77700">My goal</div>'
      + '<h3>Choose a reward to save for</h3><div style="font-weight:700;font-size:13px;color:var(--soft);margin-top:2px">Tap the ☆ on any reward to make it your goal.</div></div></div>';
    var b = bank(), pct = Math.min(100, Math.round(b / g.pts * 100));
    return '<div class="goal"><div class="ring" style="background:conic-gradient(var(--gold2) 0 ' + pct + '%,#F1ECFA ' + pct + '% 100%)"><div>' + esc(g.icon) + '</div></div>'
      + '<div style="flex:1;min-width:0"><div class="cap" style="color:#C77700">🎯 My goal</div><h3>' + esc(g.title) + '</h3>'
      + '<div style="font-weight:800;font-size:13px;color:var(--soft);margin-top:2px">' + (b >= g.pts ? 'You have enough — it is ready for you!' : fmtN(g.pts - b) + ' more points · ' + daysFor(g.pts - b)) + '</div>'
      + '<div class="bar"><i style="width:' + pct + '%"></i></div></div></div>';
  }
  function pendingHtml(){
    var wait = days().filter(function(d){ return d && d.approved !== true && (parseInt(d.pts, 10) || 0) > 0; });
    if(!wait.length) return '';
    var sum = wait.reduce(function(a, d){ return a + (parseInt(d.pts, 10) || 0); }, 0);
    return '<div class="pending"><span style="font-size:24px">⏳</span><div style="flex:1">About <b>' + fmtN(sum) + ' more points</b> are on the way<br>'
      + '<span style="font-weight:700;color:var(--soft);font-size:12.5px">' + wait.length + (wait.length === 1 ? ' day is' : ' days are') + ' waiting for your parent to approve</span></div></div>';
  }
  function weekHtml(){
    var now = new Date(), dow = (now.getDay() + 6) % 7, mon = new Date(now); mon.setDate(now.getDate() - dow);
    var cols = [], max = 1, tdy = today(), total = 0;
    for(var i = 0; i < 7; i++){
      var d = new Date(mon); d.setDate(mon.getDate() + i);
      var ds = d.toLocaleDateString('en-CA'), rec = days().find(function(x){ return x.date === ds; });
      var p = rec ? (parseInt(rec.pts, 10) || 0) : 0; total += p;
      cols.push({ ds:ds, p:p, ok:!!(rec && rec.approved === true), name:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i] });
      max = Math.max(max, p);
    }
    return '<div class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><div class="cap" style="color:var(--plum)">My points this week</div>'
      + '<div style="font-weight:900;font-size:13px">' + fmtN(total) + ' pts</div></div><div class="week">'
      + cols.map(function(c){ return '<div class="' + (c.ds === tdy ? 'today' : '') + '">' + (c.p ? '<b>' + c.p + '</b>' : '') + '<i class="' + (c.p && !c.ok ? 'p' : '') + '" style="height:' + (c.p ? Math.max(6, Math.round(c.p / max * 80)) : 4) + 'px"></i>' + c.name + '</div>'; }).join('')
      + '</div><div style="font-size:12px;font-weight:700;color:var(--soft);margin-top:6px">Striped = waiting for your parent to approve</div></div>';
  }
  function myRewardsHtml(list){
    var icon = {}; list.forEach(function(r){ icon['reward_' + r.id] = r.icon; });
    var all = (S.rows || []).filter(function(x){ return x.pts > 0; });
    var coming = all.filter(function(x){ return x.status === 'coming'; }), done = all.filter(function(x){ return x.status !== 'coming'; }).slice(0, 4);
    var h = '<div class="panel myr"><div class="cap" style="color:var(--plum)">My rewards</div>';
    if(S.rows === null) return h + '<div class="hint">Loading…</div></div>';
    if(!coming.length && !done.length) return h + '<div style="font-weight:700;color:var(--soft);font-size:13.5px;margin-top:6px">Rewards you choose will appear here.</div></div>';
    coming.concat(done).forEach(function(x){
      var c = x.status === 'coming';
      h += '<div class="r"><span class="e">' + esc(icon[x.item_id] || '🎁') + '</span><div style="min-width:0">' + esc(x.title) + '<small>Claimed ' + fmtDate(x.date) + '</small></div>'
        + '<span class="st" style="' + (c ? 'background:#FFF3C4;color:#9A6400' : 'background:#DCFCE7;color:#15803D') + '">' + (c ? 'Coming soon' : 'Enjoyed ✓') + '</span></div>';
    });
    return h + '</div>';
  }
  function cardHtml(r, L){
    var b = bank(), used = usedToday(r), isGoal = r.id === goalId(), ready = b >= r.pts && !used;
    var st = used ? 'used' : ready ? 'ready' : 'locked';
    var pin = isGoal ? '<button class="pinb on" data-act="goal" data-id="' + esc(r.id) + '" title="Your goal">🎯 My goal</button>'
                     : '<button class="pinb" data-act="goal" data-id="' + esc(r.id) + '" title="Make this my goal" aria-label="Make this my goal">☆</button>';
    var body;
    if(used) body = '<div class="days">Back tomorrow</div><div class="sp"></div><button class="go" disabled>✓ Enjoyed today</button>';
    else if(ready) body = '<div class="days">Ready now!</div><div class="sp"></div><button class="go" data-act="want" data-id="' + esc(r.id) + '">I want this!</button>';
    else body = '<div class="days">' + fmtN(r.pts - b) + ' more · ' + daysFor(r.pts - b) + '</div><div class="sp"></div><div class="lockbar"><i style="width:' + Math.round(b / r.pts * 100) + '%"></i></div><button class="go" disabled>🔒 Keep going</button>';
    return '<div class="card ' + st + (isGoal ? ' isgoal' : '') + '" style="--c:' + L.c + ';--tint:' + L.tint + '">' + pin + (ready ? '<span class="tw">✨</span>' : '')
      + '<div class="em">' + esc(r.icon) + '</div><h4>' + esc(r.title) + '</h4><div class="price">' + fmtN(r.pts) + ' <small>points</small></div>' + body + '</div>';
  }
  function levelsHtml(list){
    var h = '', b = bank();
    LEVELS.forEach(function(L){
      var items = list.filter(function(r){ return r.level === L.key; }).sort(function(a, z){ return a.pts - z.pts; });
      if(!items.length) return;
      var n = items.filter(function(r){ return b >= r.pts && !usedToday(r); }).length;
      h += '<div class="landhead" style="background:' + L.grad + '"><span class="cl" style="right:90px"></span><span class="cl" style="right:20px;top:34px;animation-delay:2s;width:40px"></span>'
        + '<div style="position:relative"><h2>' + L.name + '</h2><p>' + L.sub + '</p></div><span class="tag">' + (n ? n + ' ready ✨' : '🔒 Keep saving') + '</span></div>'
        + '<div class="cards">' + items.map(function(r){ return cardHtml(r, L); }).join('') + '</div>';
    });
    return h + '<div class="hint">Tap ☆ on a reward to make it your goal. Everyday treats can be chosen once a day each.</div>';
  }
  function render(){
    var r = root(); if(!r) return;
    var list = rewards();
    r.innerHTML = '<div class="lay"><div>' + bankHtml(list) + goalHtml(list) + pendingHtml() + weekHtml() + myRewardsHtml(list) + '</div><div>' + levelsHtml(list) + '</div></div>';
    if(S.rows === null) loadRows();
  }
  function redraw(){ try{ var t = $('tab-rewards'); if(t && t.classList.contains('active')) render(); }catch(e){ console.error('[star bank] render:', e); } }

  // ---- the claim window ------------------------------------------------------------------------
  function modal(){
    var m = $('sb-modal');
    if(!S.modal){ if(m) m.remove(); return; }
    if(!m){ addStyles(); m = document.createElement('div'); m.id = 'sb-modal'; document.body.appendChild(m); m.addEventListener('click', onModal); }
    var r = S.pick, L = LEVELS.find(function(x){ return x.key === r.level; }) || LEVELS[0], b = bank();
    m.className = S.modal === 'yay' ? 'yay' : '';
    if(S.modal === 'sheet'){
      var g = rewards().find(function(x){ return x.id === goalId(); }), after = b - r.pts;
      var goalNote = g && g.id !== r.id ? (after >= g.pts ? 'You will still have enough for your goal.' : 'Your goal (' + esc(g.title.split(' — ')[0]) + ') will be <b>' + fmtN(g.pts - after) + ' points</b> away after this.') : '';
      m.innerHTML = '<div class="sheet" role="dialog" aria-label="Choose this reward"><div class="handle"></div>'
        + '<div class="bigem" style="background:' + L.tint + ';box-shadow:0 0 0 8px ' + L.tint + '">' + esc(r.icon) + '</div>'
        + '<div class="cap" style="color:' + L.c + ';margin-top:14px">' + L.name + '</div>'
        + '<div class="f" style="font-weight:700;font-size:25px;line-height:1.15;margin-top:4px">' + esc(r.title) + '</div>'
        + '<div class="sum"><div style="background:#F7F3FF"><div class="n">' + fmtN(b) + '</div><small>you have</small></div><span>−</span>'
        + '<div style="background:' + L.tint + '"><div class="n" style="color:' + L.c + '">' + fmtN(r.pts) + '</div><small>this reward</small></div><span>=</span>'
        + '<div style="background:#FFF8E6"><div class="n" style="color:#C77700">' + fmtN(after) + '</div><small>left after</small></div></div>'
        + (goalNote ? '<div style="font-weight:700;color:var(--soft);margin-top:12px;font-size:14px">' + goalNote + '</div>' : '')
        + '<button class="btn gold" style="margin-top:16px" data-act="ask">Ask my parent to say yes</button>'
        + '<button class="btn ghost" data-act="close">Not now — keep saving</button></div>';
    } else if(S.modal === 'pin'){
      var dots = ''; for(var i = 0; i < S.pin.length; i++) dots += '<i></i>';
      var keys = ''; ['1','2','3','4','5','6','7','8','9','⌫','0','OK'].forEach(function(k){ keys += '<button data-act="key" data-k="' + k + '"' + (k === 'OK' ? ' style="background:var(--plum);color:#fff;font-size:18px"' : '') + '>' + k + '</button>'; });
      m.innerHTML = '<div class="sheet" role="dialog" aria-label="Parent PIN"><div class="handle"></div><div style="font-size:40px">🔐</div>'
        + '<div class="f" style="font-weight:700;font-size:24px;margin-top:4px">Parent, please say yes</div>'
        + '<div style="font-weight:700;color:var(--soft);font-size:14px;margin-top:4px">' + esc(childName() || 'Your child') + ' would like <b style="color:var(--ink)">' + esc(r.title) + '</b> for ' + fmtN(r.pts) + ' points.<br>Enter your parent PIN to approve.</div>'
        + '<div class="dots' + (S.pinErr ? ' err' : '') + '">' + dots + '</div>'
        + (S.pinErr ? '<div style="color:#BE123C;font-weight:800;font-size:13.5px;margin-top:6px">' + esc(S.pinErr) + '</div>' : '')
        + '<div class="pad">' + keys + '</div>'
        + '<button class="btn ghost" data-act="close"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? 'Saving…' : 'Not now') + '</button></div>';
    } else if(S.modal === 'yay'){
      var conf = '', cols = ['#FFC83D','#FF7A59','#8B5CF6','#14B8A6','#3B82F6','#E8467C'];
      for(var k = 0; k < 40; k++) conf += '<i class="conf" style="left:' + ((k * 41) % 100) + '%;background:' + cols[k % 6] + ';animation-duration:' + (2.5 + (k % 5) * 0.5) + 's;animation-delay:' + ((k * 0.13) % 2).toFixed(2) + 's"></i>';
      m.innerHTML = conf + '<div class="yaybox"><div class="glow">' + esc(r.icon) + '</div>'
        + '<div class="cap" style="color:#FFD9A0;margin-top:26px">Your parent said yes!</div>'
        + '<div class="f" style="font-weight:700;font-size:32px;line-height:1.12;margin-top:6px">' + esc(r.title.split(' — ')[0]) + '<br>is yours!</div>'
        + '<div style="font-weight:800;font-size:15px;color:#F3E8FF;margin-top:10px">You earned this with your hard work. Enjoy it' + (childName() ? ', ' + esc(childName()) : '') + '!</div>'
        + '<div style="display:inline-block;margin-top:16px;background:rgba(255,255,255,.14);border-radius:99px;padding:8px 16px;font-weight:800">⭐ ' + fmtN(bank()) + ' points left in your Star Bank</div>'
        + '<button class="btn gold" style="margin-top:24px" data-act="close">Yay! Back to my rewards</button></div>';
    }
  }
  function closeModal(){ S.modal = null; S.pick = null; S.pin = ''; S.pinErr = ''; S.busy = false; modal(); render(); }
  async function onModal(e){
    var b = e.target.closest('[data-act]');
    if(!b){ if(e.target.id === 'sb-modal' && S.modal !== 'yay' && !S.busy) closeModal(); return; }
    if(b.disabled) return;
    var act = b.getAttribute('data-act');
    if(act === 'close'){ closeModal(); return; }
    if(act === 'ask'){ S.modal = 'pin'; S.pin = ''; S.pinErr = ''; modal(); return; }
    if(act === 'key' && !S.busy){
      var k = b.getAttribute('data-k');
      if(k === '⌫'){ S.pin = S.pin.slice(0, -1); S.pinErr = ''; modal(); return; }
      if(k !== 'OK'){ if(S.pin.length < 8){ S.pin += k; S.pinErr = ''; } modal(); return; }
      if(!S.pin) return;
      if(typeof window.niyamCheckPin !== 'function' || !window.niyamCheckPin(S.pin)){ S.pin = ''; S.pinErr = 'That PIN is not right. Please try again.'; modal(); return; }
      var r = S.pick;
      if(bank() < r.pts){ S.pinErr = 'Not enough points yet.'; modal(); return; }
      if(usedToday(r)){ S.pinErr = 'This treat was already enjoyed today.'; modal(); return; }
      S.busy = true; modal();
      try{ await claim(r); S.busy = false; S.modal = 'yay'; modal(); render(); }
      catch(err){ S.busy = false; S.pin = ''; S.pinErr = 'Could not save — check the internet and try again.'; console.warn('[star bank] claim:', err); modal(); }
    }
  }

  // ---- taps on the page -----------------------------------------------------------------------------
  async function onClick(e){
    var b = e.target.closest('[data-act]'); if(!b || b.disabled) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id');
    if(act === 'want'){
      var r = rewards().find(function(x){ return x.id === id; });
      if(!r) return;
      if(bank() < r.pts){ toastMsg('Not enough points yet — keep going! 💪'); return; }
      S.pick = r; S.modal = 'sheet'; modal();
      return;
    }
    if(act === 'goal'){
      if(S.goalBusy || typeof window.niyamSaveProfileData !== 'function') return;
      var next = goalId() === id ? '' : id;
      S.goalBusy = true;
      try{ await window.niyamSaveProfileData({ reward_goal:next }); toastMsg(next ? '🎯 New goal set!' : 'Goal removed.'); }
      catch(err){ toastMsg('⚠️ Could not save your goal. Check the internet.'); console.warn('[star bank] goal:', err); }
      S.goalBusy = false; render();
    }
  }

  // ---- parent side: rewards to give -------------------------------------------------------------------
  function parentHtml(){
    var list = rewards(), icon = {}; list.forEach(function(r){ icon['reward_' + r.id] = r.icon; });
    var coming = (S.rows || []).filter(function(x){ return x.status === 'coming'; });
    var h = '<div class="pz-card"><div class="pz-h"><span>🎁 Rewards to give</span>'
      + '<button class="pz-btn" data-pz="edit">Edit the rewards list</button></div>';
    if(S.rows === null) return h + '<div class="pz-note">Loading…</div></div>';
    if(!coming.length) h += '<div class="pz-note">Nothing waiting. When your child chooses a reward (with your PIN), it appears here until you mark it as enjoyed.</div>';
    coming.forEach(function(x){
      h += '<div class="pz-row"><span class="pz-e">' + esc(icon[x.item_id] || '🎁') + '</span><div style="flex:1;min-width:0"><b>' + esc(x.title) + '</b><small>Chosen ' + fmtDate(x.date) + ' · ' + fmtN(x.pts) + ' points</small></div>'
        + '<button class="pz-btn ok" data-pz="enjoyed" data-rid="' + esc(x.rid) + '">✓ Given — mark enjoyed</button></div>';
    });
    return h + '</div>';
  }
  var PZ_CSS = ''
  + '#pz-family{font-family:Nunito,system-ui,sans-serif;color:#24163F;margin-bottom:16px}'
  + '#pz-family .pz-card{background:#fff;border:1px solid #ECE6F5;border-radius:16px;padding:14px 16px;margin-bottom:12px;box-shadow:0 4px 14px rgba(36,22,63,.06)}'
  + '#pz-family .pz-h{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;font-weight:900;font-size:16px;margin-bottom:6px}'
  + '#pz-family .pz-note{font-size:13.5px;font-weight:600;color:#6E6488;line-height:1.5}'
  + '#pz-family .pz-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px dashed #ECE6F5;flex-wrap:wrap}'
  + '#pz-family .pz-row small{display:block;font-size:12.5px;color:#6E6488;font-weight:700}'
  + '#pz-family .pz-e{font-size:26px}'
  + '#pz-family .pz-btn{border:1.5px solid #E5DEF2;background:#fff;border-radius:10px;padding:8px 12px;font-weight:800;font-size:13px;cursor:pointer;color:#24163F;font-family:inherit}'
  + '#pz-family .pz-btn.ok{background:#16A34A;border-color:#16A34A;color:#fff}'
  + '#pz-family .pz-btn[disabled]{opacity:.5}';
  function parentHost(){
    var host = $('parent-content'); if(!host) return null;
    var f = $('pz-family');
    if(!f){
      if(!$('pz-style')){ var st = document.createElement('style'); st.id = 'pz-style'; st.textContent = PZ_CSS; document.head.appendChild(st); }
      f = document.createElement('div'); f.id = 'pz-family';
      host.insertBefore(f, host.firstChild);
      f.addEventListener('click', onParent);
    }
    return f;
  }
  function renderParent(){
    var f = parentHost(); if(!f) return;
    var box = $('pz-rewards');
    if(!box){ box = document.createElement('div'); box.id = 'pz-rewards'; f.appendChild(box); }
    box.innerHTML = parentHtml();
  }
  window.niyamParentFamilyHost = parentHost;
  async function onParent(e){
    var b = e.target.closest('[data-pz]'); if(!b || b.disabled) return;
    var act = b.getAttribute('data-pz');
    if(act === 'edit'){ if(typeof window.niyamOpenRewardsEditor === 'function') window.niyamOpenRewardsEditor(); return; }
    if(act === 'enjoyed'){
      var rid = b.getAttribute('data-rid'), x = (S.rows || []).find(function(y){ return String(y.rid) === rid; });
      if(!x) return;
      b.disabled = true; b.textContent = 'Saving…';
      var res = await _supabase.from('spend_history').update({ status:'enjoyed' }).eq('id', x.rid);
      if(res.error){ b.disabled = false; b.textContent = '✓ Given — mark enjoyed'; alert('Could not save: ' + res.error.message + (/status/i.test(res.error.message) ? '\n\nThe Supabase setup step (star-bank-and-kindness.sql) has not been run yet.' : '')); return; }
      x.status = 'enjoyed'; renderParent();
    }
  }

  // ---- connections to the rest of the app ----------------------------------------------------------
  // The old Rewards code calls renderRewards() whenever the tab opens or points change.
  if(typeof renderRewards === 'function'){
    var rr = renderRewards;
    renderRewards = function(){
      try{ rr.apply(this, arguments); }catch(e){}
      try{ render(); }catch(e){ console.error('[star bank] render:', e); }
    };
  }
  // The buddy now says the encouraging words; no pop-up each time the tab opens.
  if(typeof showVaanyaMotivation === 'function') showVaanyaMotivation = function(){};
  // Parent Zone: show what is waiting, above the review page.
  if(typeof window.niyamOpenReview === 'function'){
    var or = window.niyamOpenReview;
    window.niyamOpenReview = function(){
      var r = or.apply(this, arguments);
      try{ renderParent(); loadRows(true).then(renderParent); }catch(e){ console.error('[star bank] parent:', e); }
      return r;
    };
  }
  window.niyamStarBank = { render: render, reload: function(){ return loadRows(true); }, state: function(){ return S; } };
})();
