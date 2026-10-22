// ============================================================================
// NIYAM — js/08-rewards-admin.js
// Parent's Star Rewards editor. Self-contained: injects its own button into
// the Parent Zone bar and its own full-screen editor. Touches NO existing
// file — pairs with the small id-tracking fix already made in
// js/02-report.js (claimReward/renderRewards) and js/01-core.js (REWARDS).
//
// Reads:  localStorage['vaanya_admin_rewards'] (kept in sync with Supabase
//         by js/00-shell.js on login) as the starting point, or the built-in
//         REWARDS list (js/01-core.js) if the family hasn't customised yet.
//         window.TT_CUSTOM + niyamDayMax() (data/timetable-bands.js) for the
//         "~N good days" estimate.
// Writes: window.niyamSaveRewards(items)  [defined in js/00-shell.js], which
//         also refreshes localStorage['vaanya_admin_rewards'] so the Rewards
//         tab reflects the change on its very next render.
//
// Claim / points logic is NOT touched anywhere in this file.
// ============================================================================
(function(){
  'use strict';

  var RA = { items: [], open: {} };

  function $(id){ return document.getElementById(id); }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function uid(){ return 'rwd-' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                     .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var STRIP_CHOICES = ['#FF006E','#8338EC','#3A86FF','#06D6A0','#FFBE0B','#FB5607','#EC4899','#059669'];
  function nextStrip(i){ return STRIP_CHOICES[i % STRIP_CHOICES.length]; }

  // Best points-per-perfect-day estimate we have: the family's own weekday
  // timetable max, same number the Tomorrow's Plan preview already shows.
  function dayMax(){
    try{
      var C = window.TT_CUSTOM;
      var wd = C && Array.isArray(C.weekday) ? C.weekday : null;
      if(wd && wd.length && typeof window.niyamDayMax === 'function'){
        var m = window.niyamDayMax(wd);
        if(m > 0) return m;
      }
    }catch(e){}
    return 0;
  }
  function goodDaysLabel(pts){
    var m = dayMax();
    if(!m) return '';
    var days = Math.ceil(pts / m);
    return '~' + days + ' good ' + (days===1?'day':'days') + ' to save up';
  }

  // The Star Bank's default list (js/12-star-bank.js), or the old built-in list.
  function defaults(){
    if(typeof window.niyamRewardDefaults === 'function') return window.niyamRewardDefaults();
    return clone((typeof REWARDS!=='undefined') ? REWARDS : []);
  }
  var LEVELS = [['everyday','Everyday treat'],['weekend','Weekend reward'],['big','Big reward'],['dream','Dream goal']];
  function levelOf(r){
    if(r.level) return r.level;
    var p = +r.pts || 0;
    return p <= 150 ? 'everyday' : p <= 600 ? 'weekend' : p <= 3500 ? 'big' : 'dream';
  }
  function levelName(k){ var x = LEVELS.find(function(l){ return l[0] === k; }); return x ? x[1] : ''; }
  function isDaily(r){ return r.daily === true || (r.daily === undefined && levelOf(r) === 'everyday'); }

  // ---- styles ---------------------------------------------------------------
  var CSS = ''
  + '#rwa-screen{position:fixed;inset:0;z-index:99999;background:#f7f6fb;overflow:auto;display:none;'
  +   'font-family:"Comic Neue","Comic Sans MS",system-ui,Segoe UI,Roboto,sans-serif;color:#1f2433}'
  + '#rwa-bar{position:sticky;top:0;z-index:5;background:#191a2f;color:#fff;display:flex;align-items:center;'
  +   'justify-content:space-between;gap:10px;padding:13px 16px;box-shadow:0 2px 10px rgba(0,0,0,.28);flex-wrap:wrap}'
  + '#rwa-bar h2{margin:0;font-size:17px;font-weight:800;letter-spacing:.01em}'
  + '.rwa-btn{border:0;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;padding:9px 14px}'
  + '.rwa-ghost{background:rgba(255,255,255,.16);color:#fff}'
  + '.rwa-gold{background:linear-gradient(180deg,#f6c453,#e8a838);color:#191a2f;box-shadow:0 6px 16px rgba(232,168,56,.34)}'
  + '.rwa-warn{background:#fff1f1;color:#9f1239;border:1px solid #fecdd3}'
  + '.rwa-soft{background:#eef0f5;color:#3a4150}'
  + '#rwa-body{max-width:720px;margin:0 auto;padding:16px 14px 80px}'
  + '.rwa-note{background:#fff8e6;border:1px solid #f0d9a0;border-radius:12px;padding:11px 13px;'
  +   'font-size:12.5px;line-height:1.6;color:#6b5a2a;margin-bottom:14px}'
  + '.rwa-card{background:#fff;border:1px solid #ece7df;border-radius:15px;padding:12px 13px;margin-bottom:11px;'
  +   'box-shadow:0 5px 16px rgba(90,80,130,.07)}'
  + '.rwa-card.off{opacity:.55}'
  + '.rwa-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
  + '.rwa-ico{font-size:23px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;'
  +   'background:#faf7f0;border-radius:12px;flex:0 0 auto}'
  + '.rwa-tt{flex:1;min-width:150px}'
  + '.rwa-tt b{display:block;font-size:15px}'
  + '.rwa-tt span{font-size:12px;color:#6b7280}'
  + '.rwa-mini{border:0;background:#f1f2f6;border-radius:9px;width:32px;height:32px;font-size:14px;cursor:pointer}'
  + '.rwa-mini:hover{background:#e3e5ec}'
  + '.rwa-mini.on{background:#e4f6ed;color:#1d7a53}'
  + '.rwa-open{border-top:1px dashed #e9e4db;margin-top:11px;padding-top:11px}'
  + '.rwa-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}'
  + '.rwa-f{flex:1;min-width:120px}'
  + '.rwa-f label{display:block;font-size:10.5px;font-weight:800;text-transform:uppercase;'
  +   'letter-spacing:.06em;color:#8a8f9c;margin-bottom:3px}'
  + '#rwa-screen select{width:100%;padding:9px 10px;border:1.5px solid #e6e2da;border-radius:10px;font-size:14px;background:#fcfbf8;font-family:inherit;color:#1f2433}'
  + '#rwa-screen label.rwa-chk{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:#3a4150;text-transform:none;letter-spacing:0;margin-top:4px}'
  + '#rwa-screen label.rwa-chk input{width:auto}'
  + '#rwa-screen input{width:100%;padding:9px 10px;border:1.5px solid #e6e2da;border-radius:10px;'
  +   'font-size:14px;background:#fcfbf8;box-sizing:border-box;font-family:inherit;color:#1f2433}'
  + '#rwa-screen input:focus{outline:none;border-color:#e8a838;background:#fff}'
  + '.rwa-empty{text-align:center;color:#9aa0ad;font-size:13px;padding:14px}'
  + '#rwa-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:26px;z-index:100001;background:#191a2f;'
  +   'color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:700;display:none;'
  +   'box-shadow:0 10px 26px rgba(0,0,0,.3)}'
  + '#ns-rwa-btn{background:linear-gradient(180deg,#f6c453,#e8a838);color:#191a2f;border:0;border-radius:10px;'
  +   'padding:8px 13px;font-size:12.5px;font-weight:800;cursor:pointer;margin-right:8px}';

  // ---- build DOM once ---------------------------------------------------------
  function build(){
    if($('rwa-screen')) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    var d = document.createElement('div');
    d.id = 'rwa-screen';
    d.innerHTML =
      '<div id="rwa-bar">'
      + '<h2>🏆 Rewards list</h2>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +   '<button class="rwa-btn rwa-warn" id="rwa-default">↺ Go Default</button>'
      +   '<button class="rwa-btn rwa-ghost" id="rwa-close">✕ Close</button>'
      +   '<button class="rwa-btn rwa-gold" id="rwa-save">💾 Save</button>'
      + '</div></div>'
      + '<div id="rwa-body">'
      +   '<div class="rwa-note">These are the rewards your child can choose in their Star Bank. Tap ✏️ to change '
      +     'one — its picture, name, points, level, and whether it can be chosen only once a day — or turn it off without deleting it. '
      +     'Every child is different: add the things <b>your</b> child would love. '
      +     '<b>Rewards already chosen are never affected</b> by your changes.</div>'
      +   '<div id="rwa-list"></div>'
      +   '<button class="rwa-btn rwa-soft" id="rwa-addone" style="width:100%;padding:13px;margin-top:6px">'
      +     '➕ Add a new reward</button>'
      + '</div>';
    document.body.appendChild(d);

    var t = document.createElement('div'); t.id='rwa-toast'; document.body.appendChild(t);

    $('rwa-close').onclick   = close;
    $('rwa-save').onclick    = save;
    $('rwa-default').onclick = goDefault;
    $('rwa-addone').onclick  = addReward;
  }

  function toast(m){
    var t=$('rwa-toast'); if(!t) return;
    t.textContent=m; t.style.display='block';
    clearTimeout(t._h); t._h=setTimeout(function(){ t.style.display='none'; }, 2600);
  }

  // ---- render ---------------------------------------------------------------
  function render(){
    var host = $('rwa-list');
    if(!host) return;
    if(!RA.items.length){ host.innerHTML = '<div class="rwa-empty">No rewards yet — tap “Add a new reward” below.</div>'; return; }

    host.innerHTML = RA.items.map(function(r, i){
      var isOpen = !!RA.open[r.id];
      var isOff = r.active === false;
      var goodDays = goodDaysLabel(r.pts||0);
      var h = '<div class="rwa-card'+(isOff?' off':'')+'">'
        + '<div class="rwa-head">'
        +   '<div class="rwa-ico">'+esc(r.icon||'⭐')+'</div>'
        +   '<div class="rwa-tt"><b>'+esc(r.title||'Untitled reward')+'</b>'
        +     '<span>'+levelName(levelOf(r))+' · '+(r.pts||0).toLocaleString()+' pts'+(isDaily(r)?' · once a day':'')+(goodDays?' · '+goodDays:'')+(isOff?' · turned off':'')+'</span></div>'
        +   '<button class="rwa-mini'+(isOff?'':' on')+'" data-a="tgl" data-i="'+i+'" title="'+(isOff?'Turn on':'Turn off')+'">'+(isOff?'🔒':'✅')+'</button>'
        +   '<button class="rwa-mini" data-a="del" data-i="'+i+'" title="Delete reward">🗑️</button>'
        +   '<button class="rwa-mini" data-a="tog" data-i="'+i+'" title="Open/close">'+(isOpen?'✕':'✏️')+'</button>'
        + '</div>';

      if(isOpen){
        h += '<div class="rwa-open">'
          + '<div class="rwa-row">'
          +   '<div class="rwa-f" style="flex:0 0 74px"><label>Icon</label>'
          +     '<input data-f="icon" data-i="'+i+'" value="'+esc(r.icon||'')+'" maxlength="4"></div>'
          +   '<div class="rwa-f" style="flex:2"><label>Reward title</label>'
          +     '<input data-f="title" data-i="'+i+'" value="'+esc(r.title||'')+'"></div>'
          +   '<div class="rwa-f" style="flex:0 0 110px"><label>Points cost</label>'
          +     '<input data-f="pts" data-i="'+i+'" type="number" min="1" value="'+(r.pts||0)+'"></div>'
          + '</div>'
          + '<div class="rwa-row">'
          +   '<div class="rwa-f"><label>Level</label><select data-f="level" data-i="'+i+'">'
          +     LEVELS.map(function(l){ return '<option value="'+l[0]+'"'+(levelOf(r)===l[0]?' selected':'')+'>'+l[1]+'</option>'; }).join('')
          +   '</select></div>'
          +   '<div class="rwa-f"><label>How often</label><label class="rwa-chk"><input type="checkbox" data-f="daily" data-i="'+i+'"'+(isDaily(r)?' checked':'')+'> Only once a day</label></div>'
          + '</div></div>';
      }
      return h + '</div>';
    }).join('');

    // buttons
    Array.prototype.forEach.call(host.querySelectorAll('button[data-a]'), function(btn){
      btn.onclick = function(){
        var i=+btn.getAttribute('data-i'), r=RA.items[i];
        switch(btn.getAttribute('data-a')){
          case 'tog': RA.open[r.id] = !RA.open[r.id]; render(); break;
          case 'tgl': r.active = (r.active===false) ? true : false; render(); break;
          case 'del':
            if(confirm('Delete the reward “'+(r.title||'this reward')+'”?\n\n'
                      + 'This does not remove any trophy your child already claimed for it — '
                      + 'only the option to claim it again.')){
              RA.items.splice(i,1); render();
            }
            break;
        }
      };
    });

    // field edits
    Array.prototype.forEach.call(host.querySelectorAll('[data-f]'), function(el){
      el.onchange = function(){
        var r = RA.items[+el.getAttribute('data-i')], f = el.getAttribute('data-f');
        if(f==='pts'){ r.pts = Math.max(1, parseInt(el.value)||0); }
        else if(f==='daily'){ r.daily = !!el.checked; }
        else { r[f] = el.value; }
        if(f==='icon' || f==='title' || f==='level' || f==='daily' || f==='pts') render();
      };
    });
  }

  // ---- actions ----------------------------------------------------------------
  function addReward(){
    var r = { id: uid(), pts: 300, icon: '⭐', title: 'New reward', level: 'weekend', daily: false,
              strip: nextStrip(RA.items.length), active: true };
    RA.items.push(r);
    RA.open[r.id] = true;
    render();
    window.scrollTo(0, document.body.scrollHeight);
  }

  function goDefault(){
    if(!confirm('Reset ALL rewards back to the NIYAM default list?\n\n'
                + 'Rewards already chosen are not affected. Nothing is saved until you press Save.')) return;
    RA.items = defaults();
    RA.open = {};
    render();
    toast('Reset to defaults — press Save to keep it');
  }

  function tidy(items){
    return items.map(function(r){
      var c = clone(r);
      c.id = c.id || uid();
      c.pts = Math.max(1, parseInt(c.pts)||0);
      c.title = (c.title||'Reward').trim() || 'Reward';
      c.icon = c.icon || '⭐';
      c.active = c.active !== false;
      c.level = levelOf(c);
      c.daily = isDaily(c);
      return c;
    });
  }

  async function save(){
    if(typeof window.niyamSaveRewards !== 'function'){
      alert('Could not save — the app is still starting up. Please refresh and try again.');
      return;
    }
    if(!RA.items.length){
      alert('Add at least one reward before saving, or use Go Default.');
      return;
    }
    var btn = $('rwa-save'); btn.disabled = true; btn.textContent = 'Saving…';
    try{
      await window.niyamSaveRewards(tidy(RA.items));
      toast('✅ Rewards saved!');
    }catch(e){
      alert('Save failed: ' + (e && e.message ? e.message : e) + '\n\nYour edits are still on screen — try Save again.');
    }finally{
      btn.disabled = false; btn.textContent = '💾 Save';
    }
  }

  async function open(){
    build();
    // Same rule as the timetable editor: load the real timetable first so the
    // "~N good days" estimate is accurate, not a guess made before it's ready.
    if(!window.TT_CUSTOM && typeof window.niyamLoadTimetable === 'function'){
      try{ await window.niyamLoadTimetable(); }catch(e){ console.warn('[rewards editor] tt load:', e); }
    }
    var cur = (function(){
      try{ return JSON.parse(localStorage.getItem('vaanya_admin_rewards')||'null'); }catch(e){ return null; }
    })();
    RA.items = (Array.isArray(cur) && cur.length) ? clone(cur) : defaults();
    RA.open = {};
    render();
    $('rwa-screen').style.display = 'block';
    window.scrollTo(0,0);
  }
  function close(){
    if(!confirm('Close the rewards editor?\n\nAnything you have not saved will be lost.')) return;
    $('rwa-screen').style.display = 'none';
  }

  // ---- entry button, injected into the Parent Zone bar ------------------------
  function injectButton(){
    var bar = document.getElementById('ns-pz-bar');
    if(!bar || document.getElementById('ns-rwa-btn')) return;
    var b = document.createElement('button');
    b.id = 'ns-rwa-btn';
    b.textContent = '🏆 Rewards list';
    b.onclick = open;
    var logout = document.getElementById('ns-pz-logout');
    if(logout && logout.parentNode) logout.parentNode.insertBefore(b, logout);
    else bar.appendChild(b);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectButton);
  } else { injectButton(); }
  setTimeout(injectButton, 1200);   // safety net if the shell renders late

  window.niyamOpenRewardsEditor = open;   // manual escape hatch
})();
