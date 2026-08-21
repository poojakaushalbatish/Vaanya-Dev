// ============================================================================
// NIYAM — 06-timetable-admin.js
// Parent's timetable editor. Self-contained: injects its own button into the
// Parent Zone bar and its own full-screen editor. Touches NO existing file.
// Loads LAST, after js/05-timetable-boot.js.
//
// Reads:  window.TT_CUSTOM (set by 00-shell.js) or the built-in TT_WEEKDAY /
//         TT_WEEKEND defaults.
// Writes: window.niyamSaveTimetable(weekday, weekend)  [defined in 00-shell.js]
//
// Approval / points / report logic is NOT touched anywhere in this file.
// ============================================================================
(function(){
  'use strict';

  var TTA = { weekday: [], weekend: [], tab: 'weekday', open: {} };

  // ---- helpers -------------------------------------------------------------
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function uid(p){ return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                     .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function $(id){ return document.getElementById(id); }

  // Points a block can award = sum of fixed pts + any calculated maxima.
  function blockMax(b){
    return (b.activities||[]).reduce(function(sum,a){
      return sum + (parseInt(a.pts)||0) + (parseInt(a.maxCalcPts)||0);
    }, 0);
  }

  // ---- time handling ------------------------------------------------------
  // Blocks are ordered and unlocked by unlockHour (decimal 24h). Parents pick
  // real start/end times, so we always know exactly when a block belongs.
  function hhmmToDec(s){
    if(!s) return null;
    var m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
    if(!m) return null;
    return parseInt(m[1],10) + parseInt(m[2],10)/60;
  }
  function decToHHMM(d){
    if(d===undefined || d===null || isNaN(d)) return '';
    var h = Math.floor(d), mi = Math.round((d-h)*60);
    if(mi===60){ h+=1; mi=0; }
    return ('0'+h).slice(-2) + ':' + ('0'+mi).slice(-2);
  }
  function fmt12(hhmm){
    var d = hhmmToDec(hhmm); if(d===null) return '';
    var h = Math.floor(d), mi = Math.round((d-h)*60);
    var ap = h>=12 ? 'PM' : 'AM', h12 = h%12; if(h12===0) h12=12;
    return h12 + ':' + ('0'+mi).slice(-2) + ' ' + ap;
  }
  // Reads "6:00 AM \u2013 3:00 PM", "3:30 TO 4:00", "7:00-8:00", "9:30 PM"\u2026
  function parseOne(txt){
    if(!txt) return null;
    var m = /(\d{1,2})\s*:\s*(\d{2})\s*([ap]\.?m\.?)?/i.exec(txt);
    if(!m) return null;
    var h = parseInt(m[1],10), mi = parseInt(m[2],10), ap = (m[3]||'').toLowerCase();
    if(ap.indexOf('p')===0 && h<12) h+=12;
    if(ap.indexOf('a')===0 && h===12) h=0;
    return ('0'+h).slice(-2) + ':' + ('0'+mi).slice(-2);
  }
  function splitTime(b){
    var txt = String(b.time||'');
    var parts = txt.split(/\u2013|\u2014|--|\bto\b|-/i);
    var st = parseOne(parts[0]);
    var en = parts.length>1 ? parseOne(parts.slice(1).join(' ')) : null;
    if(st===null && b.unlockHour!==undefined) st = decToHHMM(b.unlockHour);
    return { start: st || '', end: en || '' };
  }
  function blockDec(b){
    if(b.unlockHour!==undefined && b.unlockHour!==null && !isNaN(b.unlockHour)) return b.unlockHour;
    var d = hhmmToDec(splitTime(b).start);
    return (d===null ? 99 : d);
  }
  // Order blocks by start time \u2014 what the parent sees is what the child sees.
  function sortByTime(arr){
    return (arr||[]).slice().sort(function(a,b){ return blockDec(a) - blockDec(b); });
  }
  function applyTimes(b, start, end){
    b.time = fmt12(start) + (end ? ' \u2013 ' + fmt12(end) : '');
    var d = hhmmToDec(start);
    if(d!==null) b.unlockHour = d;
  }

  function defaults(which){
    var src = (which==='weekend')
      ? (typeof TT_WEEKEND!=='undefined' ? TT_WEEKEND : [])
      : (typeof TT_WEEKDAY!=='undefined' ? TT_WEEKDAY : []);
    return clone(src);
  }

  function loadIntoEditor(){
    var C = window.TT_CUSTOM || {};
    TTA.weekday = sortByTime((C.weekday && C.weekday.length) ? clone(C.weekday) : defaults('weekday'));
    TTA.weekend = sortByTime((C.weekend && C.weekend.length) ? clone(C.weekend) : defaults('weekend'));
  }

  function list(){ return TTA.tab==='weekend' ? TTA.weekend : TTA.weekday; }

  // ---- styles --------------------------------------------------------------
  var CSS = ''
  + '#tta-screen{position:fixed;inset:0;z-index:99999;background:#f7f6fb;overflow:auto;display:none;'
  +   'font-family:"Comic Neue","Comic Sans MS",system-ui,Segoe UI,Roboto,sans-serif;color:#1f2433}'
  + '#tta-bar{position:sticky;top:0;z-index:5;background:#191a2f;color:#fff;display:flex;align-items:center;'
  +   'justify-content:space-between;gap:10px;padding:13px 16px;box-shadow:0 2px 10px rgba(0,0,0,.28);flex-wrap:wrap}'
  + '#tta-bar h2{margin:0;font-size:17px;font-weight:800;letter-spacing:.01em}'
  + '.tta-btn{border:0;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;padding:9px 14px}'
  + '.tta-ghost{background:rgba(255,255,255,.16);color:#fff}'
  + '.tta-gold{background:linear-gradient(180deg,#f6c453,#e8a838);color:#191a2f;box-shadow:0 6px 16px rgba(232,168,56,.34)}'
  + '.tta-warn{background:#fff1f1;color:#9f1239;border:1px solid #fecdd3}'
  + '.tta-soft{background:#eef0f5;color:#3a4150}'
  + '#tta-body{max-width:880px;margin:0 auto;padding:16px 14px 80px}'
  + '.tta-tabs{display:flex;gap:8px;margin-bottom:14px}'
  + '.tta-tab{flex:1;padding:11px;border-radius:12px;border:1.6px solid #e6e2da;background:#fff;'
  +   'font-weight:800;font-size:14px;cursor:pointer;color:#6b7280}'
  + '.tta-tab.on{border-color:#e8a838;background:#fff5dd;color:#8a5a00}'
  + '.tta-note{background:#fff8e6;border:1px solid #f0d9a0;border-radius:12px;padding:11px 13px;'
  +   'font-size:12.5px;line-height:1.6;color:#6b5a2a;margin-bottom:14px}'
  + '.tta-card{background:#fff;border:1px solid #ece7df;border-radius:15px;padding:12px 13px;margin-bottom:11px;'
  +   'box-shadow:0 5px 16px rgba(90,80,130,.07)}'
  + '.tta-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
  + '.tta-ico{font-size:23px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;'
  +   'background:#faf7f0;border-radius:12px;flex:0 0 auto}'
  + '.tta-tt{flex:1;min-width:150px}'
  + '.tta-tt b{display:block;font-size:15px}'
  + '.tta-tt span{font-size:12px;color:#6b7280}'
  + '.tta-mini{border:0;background:#f1f2f6;border-radius:9px;width:32px;height:32px;font-size:14px;cursor:pointer}'
  + '.tta-mini:hover{background:#e3e5ec}'
  + '.tta-open{border-top:1px dashed #e9e4db;margin-top:11px;padding-top:11px}'
  + '.tta-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}'
  + '.tta-f{flex:1;min-width:120px}'
  + '.tta-f label{display:block;font-size:10.5px;font-weight:800;text-transform:uppercase;'
  +   'letter-spacing:.06em;color:#8a8f9c;margin-bottom:3px}'
  + '#tta-screen input,#tta-screen select{width:100%;padding:9px 10px;border:1.5px solid #e6e2da;border-radius:10px;'
  +   'font-size:14px;background:#fcfbf8;box-sizing:border-box;font-family:inherit;color:#1f2433}'
  + '#tta-screen input:focus,#tta-screen select:focus{outline:none;border-color:#e8a838;background:#fff}'
  + '.tta-act{background:#faf9fc;border:1px solid #eeecf3;border-radius:11px;padding:9px 10px;margin-bottom:7px}'
  + '.tta-acth{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px}'
  + '.tta-acth b{font-size:12px;color:#6b7280;font-weight:800}'
  + '.tta-empty{text-align:center;color:#9aa0ad;font-size:13px;padding:14px}'
  + '#tta-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:26px;z-index:100001;background:#191a2f;'
  +   'color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:700;display:none;'
  +   'box-shadow:0 10px 26px rgba(0,0,0,.3)}'
  + '#tta-ask{position:fixed;inset:0;z-index:100002;background:rgba(15,16,32,.72);display:none;'
  +   'align-items:center;justify-content:center;padding:20px}'
  + '#tta-ask .box{background:#fff;border-radius:18px;padding:24px 22px;max-width:380px;width:100%;text-align:center}'
  + '#tta-ask h3{margin:0 0 8px;font-size:19px}'
  + '#tta-ask p{margin:0 0 18px;font-size:14px;color:#6b7280;line-height:1.55}'
  + '#ns-tta-btn{background:linear-gradient(180deg,#f6c453,#e8a838);color:#191a2f;border:0;border-radius:10px;'
  +   'padding:8px 13px;font-size:12.5px;font-weight:800;cursor:pointer;margin-right:8px}';

  // ---- build DOM once ------------------------------------------------------
  function build(){
    if($('tta-screen')) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    var d = document.createElement('div');
    d.id = 'tta-screen';
    d.innerHTML =
      '<div id="tta-bar">'
      + '<h2>\uD83D\uDDD3\uFE0F Timetable Setup</h2>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +   '<button class="tta-btn tta-warn" id="tta-default">\u21BA Go Default</button>'
      +   '<button class="tta-btn tta-ghost" id="tta-close">\u2715 Close</button>'
      +   '<button class="tta-btn tta-gold" id="tta-save">\uD83D\uDCBE Save</button>'
      + '</div></div>'
      + '<div id="tta-body">'
      +   '<div class="tta-tabs">'
      +     '<button class="tta-tab on" id="tta-t-wd">\uD83C\uDFEB Weekdays</button>'
      +     '<button class="tta-tab" id="tta-t-we">\u2600\uFE0F Weekends</button>'
      +   '</div>'
      +   '<div class="tta-note">Edit your child\u2019s day here. Tap \u270F\uFE0F to open a block, '
      +     'set its start and end time, and add or remove tasks. Blocks sort themselves into '
      +     'time order automatically. <b>Already-approved past reports never change</b> \u2014 '
      +     'edits apply to days going forward.</div>'
      +   '<div id="tta-list"></div>'
      +   '<button class="tta-btn tta-soft" id="tta-addblock" style="width:100%;padding:13px;margin-top:6px">'
      +     '\u2795 Add a new time block</button>'
      + '</div>';
    document.body.appendChild(d);

    var t = document.createElement('div'); t.id='tta-toast'; document.body.appendChild(t);

    var ask = document.createElement('div');
    ask.id = 'tta-ask';
    ask.innerHTML = '<div class="box"><h3>\u2705 Timetable saved!</h3>'
      + '<p>Where would you like to go now?</p>'
      + '<button class="tta-btn tta-gold" id="tta-go-child" style="width:100%;margin-bottom:9px;padding:13px">'
      +   '\uD83D\uDC66 Go to child\u2019s page</button>'
      + '<button class="tta-btn tta-soft" id="tta-stay" style="width:100%;padding:13px">'
      +   '\uD83D\uDEE0\uFE0F Stay here and keep editing</button></div>';
    document.body.appendChild(ask);

    $('tta-close').onclick    = close;
    $('tta-save').onclick     = save;
    $('tta-default').onclick  = goDefault;
    $('tta-addblock').onclick = addBlock;
    $('tta-t-wd').onclick     = function(){ switchTab('weekday'); };
    $('tta-t-we').onclick     = function(){ switchTab('weekend'); };
    $('tta-stay').onclick     = function(){ $('tta-ask').style.display='none'; };
    $('tta-go-child').onclick = function(){
      if(typeof window.niyamCloseTomorrowsPlan === 'function') window.niyamCloseTomorrowsPlan();
      location.reload();
    };
  }

  function toast(m){
    var t=$('tta-toast'); if(!t) return;
    t.textContent=m; t.style.display='block';
    clearTimeout(t._h); t._h=setTimeout(function(){ t.style.display='none'; }, 2600);
  }

  function switchTab(which){
    TTA.tab = which; TTA.open = {};
    $('tta-t-wd').className = 'tta-tab' + (which==='weekday'?' on':'');
    $('tta-t-we').className = 'tta-tab' + (which==='weekend'?' on':'');
    render();
  }

  // ---- render --------------------------------------------------------------
  var TYPES = [
    ['normal',           'Earns points'],
    ['break',            'No points \u2014 break or rest'],
    ['locked-until-3pm', 'School time \u2014 locked until the day opens']
  ];
  var ACT_TYPES = [
    ['self',      'Child ticks it'],
    ['parent',    'Parent awards points'],
    ['pct-calc',  'Score out of 100% \u2192 points'],
    ['text-entry','Child writes an answer']
  ];

  function opts(pairs, val){
    return pairs.map(function(p){
      return '<option value="'+p[0]+'"'+(p[0]===val?' selected':'')+'>'+esc(p[1])+'</option>';
    }).join('');
  }

  function render(){
    var L = list(), host = $('tta-list');
    if(!host) return;
    if(!L.length){ host.innerHTML = '<div class="tta-empty">No blocks yet \u2014 tap \u201cAdd a new time block\u201d below.</div>'; return; }

    host.innerHTML = L.map(function(b, i){
      var isOpen = !!TTA.open[b.id];
      var h = '<div class="tta-card">'
        + '<div class="tta-head">'
        +   '<div class="tta-ico">'+esc(b.icon||'\u2B50')+'</div>'
        +   '<div class="tta-tt"><b>'+esc(b.name||'Untitled block')+'</b>'
        +     '<span>'+esc(b.time||'no time set')+' \u00B7 '+blockMax(b)+' pts max \u00B7 '
        +     (b.activities||[]).length+' task(s)</span></div>'
        +   '<button class="tta-mini" data-a="del"  data-i="'+i+'" title="Delete block">\uD83D\uDDD1\uFE0F</button>'
        +   '<button class="tta-mini" data-a="tog"  data-i="'+i+'" title="Open/close">'+(isOpen?'\u2715':'\u270F\uFE0F')+'</button>'
        + '</div>';

      if(isOpen){
        var tm = splitTime(b);
        h += '<div class="tta-open">'
          + '<div class="tta-row">'
          +   '<div class="tta-f" style="flex:0 0 74px"><label>Icon</label>'
          +     '<input data-f="icon" data-i="'+i+'" value="'+esc(b.icon||'')+'" maxlength="4"></div>'
          +   '<div class="tta-f" style="flex:2"><label>Block name</label>'
          +     '<input data-f="name" data-i="'+i+'" value="'+esc(b.name||'')+'"></div>'
          + '</div>'
          + '<div class="tta-row">'
          +   '<div class="tta-f"><label>Starts at</label>'
          +     '<input data-f="start" data-i="'+i+'" type="time" value="'+esc(tm.start)+'"></div>'
          +   '<div class="tta-f"><label>Ends at</label>'
          +     '<input data-f="end" data-i="'+i+'" type="time" value="'+esc(tm.end)+'"></div>'
          + '</div>'
          + '<div class="tta-row"><div class="tta-f"><label>Block type</label>'
          +   '<select data-f="type" data-i="'+i+'">'+opts(TYPES, b.type||'normal')+'</select></div></div>';

        // Break and school blocks carry no tasks \u2014 hide the task editor entirely.
        var earns = (b.type !== 'break' && b.type !== 'locked-until-3pm');
        if(!earns){
          h += '<div style="background:#f6f7fa;border-radius:11px;padding:11px 13px;margin-top:6px;'
            +  'font-size:12.5px;color:#6b7280;line-height:1.55">'
            +  (b.type === 'break'
                 ? '\uD83D\uDE0C This is rest time \u2014 no tasks and no points. Switch the block type to '
                   + '<b>Earns points</b> if you want tasks here.'
                 : '\uD83C\uDFEB This block stays locked until the day opens, so it holds no tasks.')
            +  '</div></div>';
          return h + '</div>';
        }

        h += '<div style="margin-top:12px"><b style="font-size:12px;color:#6b7280;text-transform:uppercase;'
          +   'letter-spacing:.06em">Tasks in this block</b></div>';

        (b.activities||[]).forEach(function(a, j){
          var isCalc = (a.type==='pct-calc');
          h += '<div class="tta-act">'
            + '<div class="tta-acth"><b>Task '+(j+1)+'</b>'
            +   '<button class="tta-mini" data-a="delact" data-i="'+i+'" data-j="'+j+'" '
            +   'title="Remove task">\uD83D\uDDD1\uFE0F</button></div>'
            + '<div class="tta-row"><div class="tta-f" style="flex:3"><label>Task name</label>'
            +   '<input data-af="name" data-i="'+i+'" data-j="'+j+'" value="'+esc(a.name||'')+'"></div>'
            +   '<div class="tta-f" style="flex:0 0 92px"><label>'+(isCalc?'Max pts':'Points')+'</label>'
            +     '<input data-af="'+(isCalc?'maxCalcPts':'pts')+'" data-i="'+i+'" data-j="'+j+'" type="number" min="0" '
            +     'value="'+(isCalc ? (a.maxCalcPts||0) : (a.pts||0))+'"></div>'
            + '</div>'
            + '<div class="tta-row"><div class="tta-f"><label>How it is scored</label>'
            +   '<select data-af="type" data-i="'+i+'" data-j="'+j+'">'+opts(ACT_TYPES, a.type||'self')+'</select></div>'
            +   '<div class="tta-f" style="flex:2"><label>Note for child (optional)</label>'
            +     '<input data-af="note" data-i="'+i+'" data-j="'+j+'" value="'+esc(a.note||'')+'"></div>'
            + '</div></div>';
        });

        h += '<button class="tta-btn tta-soft" data-a="addact" data-i="'+i+'" '
          +  'style="width:100%;padding:11px;margin-top:4px">\u2795 Add a task</button></div>';
      }
      return h + '</div>';
    }).join('');

    // buttons
    Array.prototype.forEach.call(host.querySelectorAll('button[data-a]'), function(btn){
      btn.onclick = function(){
        var i=+btn.getAttribute('data-i'), j=+btn.getAttribute('data-j'), L=list(), b=L[i];
        switch(btn.getAttribute('data-a')){
          case 'tog':  TTA.open[b.id] = !TTA.open[b.id]; render(); break;
          case 'del':
            if(confirm('Delete the block \u201C'+(b.name||'this block')+'\u201D and all its tasks?')){
              L.splice(i,1); render();
            }
            break;
          case 'addact':
            b.activities = b.activities || [];
            b.activities.push({ id: uid('cact'), name:'New task', pts:5, type:'self', note:'' });
            TTA.open[b.id] = true; render();
            break;
          case 'delact':
            if(confirm('Remove this task?')){ b.activities.splice(j,1); render(); }
            break;
        }
      };
    });

    // block field edits — mutate in place so unknown keys (tab, entryKey,
    // saveTo, galleryKey…) are preserved exactly as the app expects.
    Array.prototype.forEach.call(host.querySelectorAll('[data-f]'), function(el){
      el.onchange = function(){
        var b = list()[+el.getAttribute('data-i')], f = el.getAttribute('data-f');
        if(f==='start' || f==='end'){
          var host2 = el.closest('.tta-card');
          var st = host2.querySelector('[data-f="start"]').value;
          var en = host2.querySelector('[data-f="end"]').value;
          if(!st){ alert('Please set a start time \u2014 it decides where this block sits in the day.'); return; }
          applyTimes(b, st, en);
          // Re-sort so the block jumps straight to its correct place in the day.
          if(TTA.tab==='weekend') TTA.weekend = sortByTime(TTA.weekend);
          else TTA.weekday = sortByTime(TTA.weekday);
          render();
          return;
        }
        b[f] = el.value;
        if(f==='type'){
          // Moving to break/school clears tasks; moving back gives a fresh one.
          if(el.value === 'break' || el.value === 'locked-until-3pm'){ b.activities = []; }
          else if(!b.activities || !b.activities.length){
            b.activities = [{ id: uid('cact'), name:'New task', pts:5, type:'self', note:'' }];
          }
        }
        if(f==='name' || f==='icon' || f==='type') render();
      };
    });

    // activity field edits
    Array.prototype.forEach.call(host.querySelectorAll('[data-af]'), function(el){
      el.onchange = function(){
        var b = list()[+el.getAttribute('data-i')];
        var a = b.activities[+el.getAttribute('data-j')];
        var f = el.getAttribute('data-af');
        if(f==='pts' || f==='maxCalcPts'){ a[f] = parseInt(el.value)||0; }
        else if(f==='type'){
          a.type = el.value;
          if(a.type==='pct-calc'){ a.maxCalcPts = a.maxCalcPts || a.pts || 10; a.pts = 0; }
          else { delete a.maxCalcPts; }
          render();
        }
        else { a[f] = el.value; }
      };
    });
  }

  // ---- actions -------------------------------------------------------------
  function addBlock(){
    list().push({
      id: uid('cblk'), time:'', name:'New time block', icon:'\u2B50', unlockHour: 17,
      iconBg:'#FFF7ED', iconColor:'#EA580C', color:'#EA580C', lightBg:'#FFF7ED',
      type:'normal', maxPts:0, unlockHour:undefined,
      activities:[{ id: uid('cact'), name:'New task', pts:5, type:'self', note:'' }]
    });
    var L=list(); var nb=L[L.length-1];
    applyTimes(nb, '17:00', '18:00');
    TTA.open[nb.id]=true;
    if(TTA.tab==='weekend') TTA.weekend = sortByTime(TTA.weekend); else TTA.weekday = sortByTime(TTA.weekday);
    render();
    window.scrollTo(0, document.body.scrollHeight);
  }

  function goDefault(){
    var label = TTA.tab==='weekend' ? 'Weekend' : 'Weekday';
    if(!confirm('Reset the '+label+' timetable back to the built-in NIYAM default?\n\n'
                + 'Your other tab is not affected. Nothing is saved until you press Save.')) return;
    if(TTA.tab==='weekend') TTA.weekend = defaults('weekend'); else TTA.weekday = defaults('weekday');
    TTA.open = {}; render();
    toast(label + ' timetable reset to default \u2014 press Save to keep it');
  }

  function tidy(arr){
    return sortByTime(arr).map(function(b){
      var c = clone(b);
      c.id = c.id || uid('cblk');
      c.activities = (c.activities||[]).map(function(a){
        var x = clone(a); x.id = x.id || uid('cact'); x.pts = parseInt(x.pts)||0; return x;
      });
      c.maxPts = blockMax(c);            // keep the progress bar honest
      return c;
    });
  }

  async function save(){
    if(typeof window.niyamSaveTimetable !== 'function'){
      alert('Could not save \u2014 the app is still starting up. Please refresh and try again.');
      return;
    }
    var btn = $('tta-save'); btn.disabled = true; btn.textContent = 'Saving\u2026';
    try{
      await window.niyamSaveTimetable(tidy(TTA.weekday), tidy(TTA.weekend));
      if(typeof window.niyamRefreshPlan === 'function') window.niyamRefreshPlan();
      $('tta-ask').style.display = 'flex';
    }catch(e){
      alert('Save failed: ' + (e && e.message ? e.message : e) + '\n\nYour edits are still on screen \u2014 try Save again.');
    }finally{
      btn.disabled = false; btn.textContent = '\uD83D\uDCBE Save';
    }
  }

  function open(){
    build(); loadIntoEditor(); switchTab('weekday');
    $('tta-screen').style.display = 'block';
    window.scrollTo(0,0);
  }
  function close(){
    if(!confirm('Close the timetable editor?\n\nAnything you have not saved will be lost.')) return;
    $('tta-screen').style.display = 'none';
  }

  // ---- entry button, injected into the Parent Zone bar ----------------------
  function injectButton(){
    var bar = document.getElementById('ns-pz-bar');
    if(!bar || document.getElementById('ns-tta-btn')) return;
    var b = document.createElement('button');
    b.id = 'ns-tta-btn';
    b.textContent = '\uD83D\uDDD3\uFE0F Timetable Setup';
    b.onclick = open;
    var logout = document.getElementById('ns-pz-logout');
    if(logout && logout.parentNode) logout.parentNode.insertBefore(b, logout);
    else bar.appendChild(b);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectButton);
  } else { injectButton(); }
  setTimeout(injectButton, 1200);   // safety net if the shell renders late

  window.niyamOpenTimetableEditor = open;   // manual escape hatch
})();
