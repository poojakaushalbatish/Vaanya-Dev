// ============================================================================
// NIYAM — 07-tomorrows-plan.js
// The screen a parent lands on the moment setup finishes: a preview of the
// real day their child will see, with the option to keep it or customise it.
//
// Self-contained. Injects its own screen; edits no existing file.
// Reads window.TT_CUSTOM (set by 00-shell.js) or the class band as a fallback.
// Opens the timetable editor from js/06-timetable-admin.js when asked.
//
// Load LAST, after js/06-timetable-admin.js.
// ============================================================================
(function(){
  'use strict';

  var TP = { tab: 'weekday', name: 'your child' };

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                     .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Is tomorrow a Saturday or Sunday?
  function tomorrowIsWeekend(){
    var d = new Date(); d.setDate(d.getDate() + 1);
    var day = d.getDay();
    return (day === 0 || day === 6);
  }
  function tomorrowLabel(){
    var d = new Date(); d.setDate(d.getDate() + 1);
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
  }

  function schedules(){
    var C = window.TT_CUSTOM;
    if(C && ((C.weekday && C.weekday.length) || (C.weekend && C.weekend.length))){
      return { weekday: C.weekday || [], weekend: C.weekend || [] };
    }
    // Fallback: build from the class band if the save hasn't landed yet.
    if(typeof window.niyamBuildTimetable === 'function' && window.__niyamClass){
      var t = window.niyamBuildTimetable(window.__niyamClass, window.__niyamStartHour);
      return { weekday: t.weekday, weekend: t.weekend };
    }
    return {
      weekday: (typeof TT_WEEKDAY !== 'undefined') ? TT_WEEKDAY : [],
      weekend: (typeof TT_WEEKEND !== 'undefined') ? TT_WEEKEND : []
    };
  }

  var CSS = ''
  + '#tp-screen{position:fixed;inset:0;z-index:99998;background:#f7f6fb;overflow:auto;display:none;'
  +   'font-family:"Comic Neue","Comic Sans MS",system-ui,Segoe UI,Roboto,sans-serif;color:#1f2433}'
  + '#tp-inner{max-width:760px;margin:0 auto;padding:22px 15px 40px}'
  + '#tp-hero{background:linear-gradient(135deg,#fff5dd,#ffe9c7);border:1.5px solid #f0d9a0;'
  +   'border-radius:20px;padding:20px 18px;text-align:center;margin-bottom:16px}'
  + '#tp-hero h1{margin:0 0 7px;font-size:21px;font-weight:800;line-height:1.35}'
  + '#tp-hero p{margin:0;font-size:13.5px;color:#6b5a2a;line-height:1.6}'
  + '.tp-tabs{display:flex;gap:8px;margin-bottom:14px}'
  + '.tp-tab{flex:1;padding:11px;border-radius:12px;border:1.6px solid #e6e2da;background:#fff;'
  +   'font-weight:800;font-size:13.5px;cursor:pointer;color:#6b7280;font-family:inherit}'
  + '.tp-tab.on{border-color:#e8a838;background:#fff5dd;color:#8a5a00}'
  + '.tp-day{background:#fff;border:1px solid #ece7df;border-radius:16px;padding:6px 4px;margin-bottom:16px}'
  + '.tp-b{display:flex;gap:11px;align-items:center;padding:11px 12px;border-bottom:1px solid #f4f1ec}'
  + '.tp-b:last-child{border-bottom:0}'
  + '.tp-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;'
  +   'justify-content:center;font-size:21px;flex:0 0 auto}'
  + '.tp-t{flex:1;min-width:0}'
  + '.tp-t b{display:block;font-size:14.5px;line-height:1.3}'
  + '.tp-t span{font-size:11.5px;color:#8a8f9c}'
  + '.tp-pts{flex:0 0 auto;font-size:11.5px;font-weight:800;color:#8a5a00;background:#fff5dd;'
  +   'border-radius:9px;padding:5px 9px;white-space:nowrap}'
  + '.tp-pts.zero{color:#9aa0ad;background:#f4f5f8}'
  + '#tp-total{text-align:center;font-size:12.5px;color:#6b7280;margin:-6px 0 16px}'
  + '.tp-btn{width:100%;border:0;border-radius:14px;padding:15px;font-size:15px;font-weight:800;'
  +   'cursor:pointer;font-family:inherit;margin-bottom:10px}'
  + '.tp-go{background:linear-gradient(180deg,#f6c453,#e8a838);color:#191a2f;'
  +   'box-shadow:0 8px 20px rgba(232,168,56,.32)}'
  + '.tp-edit{background:#fff;color:#3a4150;border:1.6px solid #e6e2da}'
  + '#tp-done{position:fixed;inset:0;z-index:99999;background:rgba(15,16,32,.72);display:none;'
  +   'align-items:center;justify-content:center;padding:20px}'
  + '#tp-done .box{background:#fff;border-radius:20px;padding:26px 22px;max-width:400px;width:100%;text-align:center}'
  + '#tp-done h3{margin:0 0 9px;font-size:20px}'
  + '#tp-done p{margin:0 0 18px;font-size:13.5px;color:#6b7280;line-height:1.6}';

  function build(){
    if($('tp-screen')) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    var d = document.createElement('div');
    d.id = 'tp-screen';
    d.innerHTML =
      '<div id="tp-inner">'
      + '<div id="tp-hero">'
      +   '<h1 id="tp-title">This is what your child will see tomorrow.</h1>'
      +   '<p id="tp-sub">Built for their class. Tap <b>Customise the day</b> to change any block, '
      +     'or keep it as it is \u2014 you can always change it later.</p>'
      + '</div>'
      + '<div class="tp-tabs">'
      +   '<button class="tp-tab on" id="tp-t-wd">\uD83C\uDFEB School day</button>'
      +   '<button class="tp-tab" id="tp-t-we">\u2600\uFE0F Weekend</button>'
      + '</div>'
      + '<div class="tp-day" id="tp-list"></div>'
      + '<div id="tp-total"></div>'
      + '<button class="tp-btn tp-go" id="tp-ok">\u2713 Looks good \u2014 I\u2019m done</button>'
      + '<button class="tp-btn tp-edit" id="tp-customise">\u270F\uFE0F Customise the day</button>'
      + '</div>';
    document.body.appendChild(d);

    var done = document.createElement('div');
    done.id = 'tp-done';
    done.innerHTML = '<div class="box">'
      + '<div style="font-size:44px;margin-bottom:6px">\uD83C\uDF1F</div>'
      + '<h3 id="tp-done-h">The first day is ready</h3>'
      + '<p id="tp-done-p">When they\u2019re free, hand them the phone \u2014 they\u2019ll set up their own '
      +   'look and pick a reward to work towards. It takes a minute.<br><br>'
      +   'Nothing else is needed from you until the end of the day, when you\u2019ll review and approve.</p>'
      + '<button class="tp-btn tp-go" id="tp-open">\uD83D\uDC66 Open the dashboard now</button>'
      + '<button class="tp-btn tp-edit" id="tp-stay">Not now \u2014 stay in Parent Zone</button>'
      + '</div>';
    document.body.appendChild(done);

    $('tp-t-wd').onclick = function(){ TP.tab='weekday'; render(); };
    $('tp-t-we').onclick = function(){ TP.tab='weekend'; render(); };
    $('tp-ok').onclick = function(){ $('tp-done').style.display='flex'; };
    $('tp-customise').onclick = function(){
      if(typeof window.niyamOpenTimetableEditor === 'function'){ window.niyamOpenTimetableEditor(); }
      else alert('The timetable editor is still loading \u2014 try again in a moment.');
    };
    $('tp-open').onclick = function(){ close(); };
    $('tp-stay').onclick = function(){
      close();
      var pb = document.getElementById('ns-parent-btn');
      if(pb) pb.click();
    };
  }

  function render(){
    var sch = schedules();
    var list = TP.tab === 'weekend' ? sch.weekend : sch.weekday;
    $('tp-t-wd').className = 'tp-tab' + (TP.tab==='weekday' ? ' on' : '');
    $('tp-t-we').className = 'tp-tab' + (TP.tab==='weekend' ? ' on' : '');

    var host = $('tp-list');
    if(!list || !list.length){
      host.innerHTML = '<div style="padding:22px;text-align:center;color:#9aa0ad;font-size:13px">'
        + 'No blocks yet \u2014 tap Customise the day to build one.</div>';
      $('tp-total').textContent = '';
      return;
    }

    host.innerHTML = list.map(function(b){
      var pts = parseInt(b.maxPts) || 0;
      var label = (b.type === 'break') ? 'break'
                : (b.type === 'locked-until-3pm') ? 'school'
                : (pts + ' pts');
      return '<div class="tp-b">'
        + '<div class="tp-ic" style="background:'+esc(b.iconBg||'#faf7f0')+'">'+esc(b.icon||'\u2b50')+'</div>'
        + '<div class="tp-t"><b>'+esc(b.name||'')+'</b><span>'+esc(b.time||'')+'</span></div>'
        + '<div class="tp-pts'+(pts?'':' zero')+'">'+label+'</div>'
        + '</div>';
    }).join('');

    var total = list.reduce(function(s,b){ return s + (parseInt(b.maxPts)||0); }, 0);
    $('tp-total').innerHTML = '<b>'+total+' points</b> possible on a perfect '
      + (TP.tab==='weekend' ? 'weekend day' : 'school day')
      + ' \u00B7 ' + list.length + ' blocks';
  }

  function open(opts){
    build();
    opts = opts || {};
    TP.name = opts.name || 'your child';
    TP.tab  = tomorrowIsWeekend() ? 'weekend' : 'weekday';

    $('tp-title').textContent = 'This is what ' + TP.name + ' will see on ' + tomorrowLabel() + '.';
    $('tp-done-h').textContent = TP.name + '\u2019s first day is ready';
    $('tp-screen').style.display = 'block';
    render();
    window.scrollTo(0,0);
  }

  function close(){
    var s = $('tp-screen'), d = $('tp-done');
    if(s) s.style.display = 'none';
    if(d) d.style.display = 'none';
  }

  // Re-render when the editor saves, so the preview always shows the truth.
  window.niyamRefreshPlan = function(){ if($('tp-screen') && $('tp-screen').style.display !== 'none') render(); };
  window.niyamOpenTomorrowsPlan = open;
  window.niyamCloseTomorrowsPlan = close;
})();
