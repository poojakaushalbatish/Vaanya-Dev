// ============================================================
// NIYAM SHELL (Phase 1 / B1)
// Creates the authenticated Supabase client (shared with the app),
// runs the login + onboarding gate, and boots the app on entry.
// Loads BEFORE 01-core.js so window.sb exists when the app reads it.
// ============================================================
(function(){
  // ---- BUILD STAMP -------------------------------------------------------
  // Bump this whenever you upload a new js/00-shell.js. Check it in the
  // browser console to be certain which build the browser is actually running.
  window.NIYAM_BUILD = '2026-08-21 · A3.2 · editor race fix';
  console.log('%cNIYAM build: ' + window.NIYAM_BUILD, 'color:#e8a838;font-weight:bold');

  var isFile = location.protocol === 'file:'; // local test = memory session; https = persistent
  window.sb = (typeof supabase !== 'undefined')
    ? supabase.createClient(
        'https://zeengmnzstpfozupqjif.supabase.co',
        'sb_publishable_IFQqrRiTHi45T4IvKHok6Q_X7EIPkEN',
        { auth: { persistSession: !isFile, autoRefreshToken: !isFile } })
    : null;

  var css = `
  @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap');
  #niyam-shell{font-family:'Comic Neue','Comic Sans MS',system-ui,Segoe UI,Roboto,cursive;
    --navy:#191a2f;--navy2:#23244a;--ink:#1f2433;--muted:#6b7280;
    --gold:#f4b740;--gold-deep:#cf962a;--gold-soft:#fff5dd;--gold-line:#f0d9a0;
    --card:#ffffff;--cream:#fbfaf6;--line:#ece7df}
  #niyam-shell .ns-screen{position:fixed;inset:0;z-index:99999;overflow:auto;display:none;
    background:radial-gradient(60% 40% at 12% 8%, rgba(255,214,170,.55), transparent 60%),radial-gradient(55% 45% at 92% 12%, rgba(201,224,255,.55), transparent 60%),radial-gradient(70% 55% at 50% 108%, rgba(214,245,224,.5), transparent 60%),linear-gradient(180deg,#fffaf3 0%,#faf6ff 100%)}
  #niyam-shell .ns-wrap{max-width:680px;margin:0 auto;padding:38px 22px 56px}
  #niyam-shell .ns-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 20px;margin-bottom:16px;box-shadow:0 10px 28px rgba(90,80,130,.12)}
  #niyam-shell .ns-brand{text-align:center;margin-bottom:20px}
  #niyam-shell .ns-mark{width:66px;height:66px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;border-radius:20px;
    background:radial-gradient(circle at 50% 38%, rgba(244,183,64,.32), rgba(244,183,64,.04) 72%)}
  #niyam-shell h1{font-size:30px;margin:0;text-align:center;color:#191a2f;letter-spacing:.06em;font-weight:700}
  #niyam-shell .ns-tag{color:#6b6e86;font-size:13px;text-align:center;margin:7px 0 0;letter-spacing:.03em}
  #niyam-shell h2{font-size:19px;margin:0 0 10px;color:var(--ink);font-weight:800;letter-spacing:-.01em}
  #niyam-shell .ns-sub{color:var(--muted);font-size:14px;margin:0 0 16px;line-height:1.55}
  #niyam-shell label{display:block;font-size:13px;font-weight:700;margin:14px 0 5px;color:#3a4150}
  #niyam-shell input{width:100%;padding:12px;border:1.5px solid var(--line);border-radius:12px;font-size:16px;box-sizing:border-box;background:var(--cream);color:var(--ink)}
  #niyam-shell input:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px rgba(244,183,64,.18);background:#fff}
  #niyam-shell button{border:0;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;padding:12px 16px}
  #niyam-shell .ns-primary{background:linear-gradient(180deg,#f6c453,#e8a838);color:#191a2f;width:100%;margin-top:18px;font-weight:800;letter-spacing:.01em;box-shadow:0 8px 20px rgba(232,168,56,.34)}
  #niyam-shell .ns-primary:hover{filter:brightness(1.04)}
  #niyam-shell .ns-link{background:none;color:var(--gold-deep);padding:6px;font-size:14px;font-weight:700}
  #niyam-shell .ns-err{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-size:13px;padding:10px;border-radius:10px;margin-top:12px;display:none}
  #niyam-shell .ns-step{display:inline-block;color:var(--gold-deep);background:var(--gold-soft);border:1px solid var(--gold-line);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;padding:4px 11px;border-radius:99px;margin-bottom:12px}
  #niyam-shell .ns-consent{display:flex;gap:10px;align-items:flex-start;background:var(--gold-soft);border:1px solid var(--gold-line);border-radius:12px;padding:14px;font-size:14px;line-height:1.5;color:#4a4434}
  #niyam-shell .ns-consent input{width:auto;margin-top:3px}
  #niyam-shell .ns-pin{letter-spacing:.5em;text-align:center;font-size:22px}
  #app-root{padding-top:40px}
  #ns-topbtns{position:fixed;top:7px;right:12px;z-index:99998;display:none;gap:8px;align-items:center}
  #btn-parent-tab{display:none !important;}
  #ns-parent-btn{background:#191a2f;color:var(--gold);border:1px solid rgba(244,183,64,.4);border-radius:10px;padding:7px 14px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 2px 8px rgba(25,26,47,.3)}
  #ns-pz-logout{background:rgba(255,255,255,.16);color:#fff;border:0;border-radius:9px;padding:8px 13px;font-size:13px;font-weight:600;cursor:pointer}
  #ns-parent-zone{position:fixed;inset:0;background:#0f1020;z-index:99997;overflow:auto;display:none}
  #ns-pz-bar{position:sticky;top:0;background:#191a2f;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;box-shadow:0 2px 8px rgba(0,0,0,.3)}
  #ns-pz-bar h1{font-size:18px;margin:0;color:#fff;letter-spacing:normal;text-shadow:none}
  #ns-pz-back{background:rgba(255,255,255,.16);color:#fff;border:0;border-radius:9px;padding:8px 13px;font-size:13px;font-weight:600;cursor:pointer}
  #ns-pz-body{padding:14px;max-width:900px;margin:0 auto}
  #ns-pz-body .tab{display:block !important}
  /* ---- profile-setup questionnaire ---- */
  #niyam-shell .ns-progress{height:7px;background:#eee5d4;border-radius:99px;overflow:hidden;margin:0 0 16px}
  #niyam-shell .ns-progress-fill{height:100%;background:linear-gradient(90deg,#f6c453,#e8a838);border-radius:99px;transition:width .25s ease}
  #niyam-shell .ns-q{margin-top:16px}
  #niyam-shell .ns-q:first-child{margin-top:0}
  #niyam-shell .ns-qlabel{font-size:14px;font-weight:800;color:var(--ink);margin:0 0 8px}
  #niyam-shell .ns-qhint{font-size:12px;color:var(--muted);font-weight:500;margin:-4px 0 8px}
  #niyam-shell .ns-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}
  #niyam-shell .ns-opt{background:#fff;border:1.5px solid var(--line);color:#3a4150;border-radius:12px;padding:10px 14px;font-size:14px;font-weight:600;cursor:pointer;flex:0 0 auto;transition:.12s}
  #niyam-shell .ns-opt:hover{border-color:var(--gold)}
  #niyam-shell .ns-opt.sel{background:#191a2f;border-color:#191a2f;color:var(--gold);box-shadow:0 5px 14px rgba(25,26,47,.28)}
  #niyam-shell .ns-skip{background:none;color:var(--muted);font-size:13px;font-weight:700;text-decoration:underline;padding:6px 0;margin-top:2px}
  #niyam-shell .ns-optional-tag{display:inline-block;font-size:11px;font-weight:800;color:var(--gold-deep);background:var(--gold-soft);border:1px solid var(--gold-line);border-radius:6px;padding:2px 7px;margin-left:6px;vertical-align:middle}
  #niyam-shell .ns-handoff{text-align:center;padding:8px 0}
  #niyam-shell .ns-handoff .ns-flame{font-size:52px;margin-bottom:6px}
  #niyam-shell .ns-childcard{border:2px solid var(--gold);background:linear-gradient(180deg,#fffdf7,#fff6e6)}
  #niyam-shell .ns-childcard h2{color:var(--gold-deep)}
  #niyam-shell .ns-photo-row{display:flex;align-items:center;gap:14px;margin-top:6px}
  #niyam-shell .ns-photo-prev{width:62px;height:62px;border-radius:14px;background:var(--gold-soft);border:1px solid var(--gold-line);display:flex;align-items:center;justify-content:center;font-size:24px;overflow:hidden;flex:0 0 auto}
  #niyam-shell .ns-photo-prev img{width:100%;height:100%;object-fit:cover}
  #niyam-shell .ns-photo-btn{background:#191a2f;color:#fff;font-size:13px;padding:9px 14px;border-radius:10px}
  #niyam-shell .ns-cardhead{display:flex;align-items:center;gap:10px;margin-bottom:12px}
  #niyam-shell .ns-back{width:auto;margin:0;background:#fff;border:1.5px solid var(--line);color:#3a4150;border-radius:10px;padding:6px 12px;font-size:16px;font-weight:800;cursor:pointer;line-height:1}
  #niyam-shell .ns-back:hover{border-color:var(--gold);color:var(--gold-deep)}
  #niyam-shell .ns-in{animation:nsIn .32s cubic-bezier(.22,1,.36,1)}
  @keyframes nsIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  #niyam-shell .ns-choice{display:flex;align-items:center;gap:12px;padding:13px 14px;border:1.6px solid var(--line);border-radius:13px;background:#fff;cursor:pointer;transition:.15s;position:relative}
  #niyam-shell .ns-choice:hover{border-color:var(--gold);transform:translateY(-1px)}
  #niyam-shell .ns-choice.sel{border-color:var(--gold);background:var(--gold-soft);box-shadow:0 5px 16px rgba(244,183,64,.25)}
  #niyam-shell .ns-choice input{position:absolute;opacity:0;width:0;height:0;margin:0}
  #niyam-shell .ns-box{flex:0 0 auto;width:22px;height:22px;border:2px solid #cdc6b6;display:flex;align-items:center;justify-content:center;transition:.15s;background:#fff}
  #niyam-shell .ns-radio .ns-box{border-radius:50%}
  #niyam-shell .ns-check .ns-box{border-radius:7px}
  #niyam-shell .ns-choice.sel .ns-box{border-color:var(--gold-deep);background:var(--gold)}
  #niyam-shell .ns-radio .ns-box:after{content:'';width:8px;height:8px;border-radius:50%;background:#fff;opacity:0;transform:scale(.3);transition:.15s}
  #niyam-shell .ns-radio.sel .ns-box:after{opacity:1;transform:scale(1)}
  #niyam-shell .ns-check .ns-box:after{content:'';width:6px;height:11px;border:solid #191a2f;border-width:0 3px 3px 0;transform:rotate(45deg) scale(.3);opacity:0;transition:.15s;margin-top:-2px}
  #niyam-shell .ns-check.sel .ns-box:after{opacity:1;transform:rotate(45deg) scale(1)}
  #niyam-shell .ns-choice-txt{font-size:14.5px;font-weight:600;color:#2c3242}
  #niyam-shell .ns-primary:active{transform:translateY(1px)}
  #niyam-shell .ns-qcard h2{text-align:center;font-size:23px;margin:2px 0 6px;font-weight:700;color:var(--ink)}
  #niyam-shell .ns-center{text-align:center}
  #niyam-shell .ns-qhint.ns-center{margin-top:0}
  #niyam-shell .ns-icon{width:76px;height:76px;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:40px;line-height:1;margin:6px auto 14px;box-shadow:0 8px 18px rgba(0,0,0,.07)}
  #niyam-shell .ns-qcard .ns-opts{margin-top:16px}
  #niyam-shell .ns-qcard input[type=text]{margin-top:8px;font-family:inherit}
  #niyam-shell .ns-choice-txt{font-family:inherit}
  #niyam-shell .ns-primary,#niyam-shell .ns-back,#niyam-shell .ns-skip,#niyam-shell button{font-family:inherit}
  #niyam-shell .ns-qcard .ns-handoff h2{font-size:24px}
  #niyam-shell .ns-qcard{padding-bottom:24px}
  #niyam-shell .ns-avatar-wrap{display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:8px}
  #niyam-shell .ns-avatar-wrap .ns-photo-prev{width:88px;height:88px;border-radius:26px;font-size:46px}
  #niyam-shell .ns-avatar-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:100%}
  #niyam-shell .ns-avatar{font-size:30px;line-height:1;padding:12px 0;border:1.6px solid var(--line);border-radius:14px;background:#fff;cursor:pointer;transition:.15s;width:auto;margin:0}
  #niyam-shell .ns-avatar:hover{border-color:var(--gold);transform:translateY(-1px)}
  #niyam-shell .ns-avatar.sel{border-color:var(--gold);background:var(--gold-soft);box-shadow:0 5px 14px rgba(244,183,64,.25)}
  #niyam-shell #opts-ns-star + .ns-qhint{margin-top:14px}
  `;
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var html = `
  <div id="ns-login" class="ns-screen">
   <div class="ns-wrap">
    <div class="ns-brand">
     <div class="ns-mark"><svg width="42" height="42" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="nsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36b"/><stop offset="1" stop-color="#e8a838"/></linearGradient></defs><path d="M12 2.2l2.55 6.06 6.55.52-4.99 4.27 1.55 6.39L12 16.6l-5.21 3.84 1.55-6.39-4.99-4.27 6.55-.52z" fill="url(#nsg)"/></svg></div>
     <h1>NIYAM</h1>
     <p class="ns-tag">Small Habits, Big Destiny.</p>
    </div>
    <div class="ns-card">
     <h2 id="ns-login-title">Parent login</h2>
     <label>Email</label><input id="ns-email" type="email" autocomplete="off" placeholder="you@example.com">
     <label>Password</label><input id="ns-password" type="password" autocomplete="off" placeholder="6+ characters">
     <button id="ns-btn-login" class="ns-primary">Log in</button>
     <button id="ns-btn-signup" class="ns-primary" style="display:none">Create account</button>
     <div style="text-align:center;margin-top:8px">
       <button id="ns-to-signup" class="ns-link">New family? Create an account</button>
       <button id="ns-to-login" class="ns-link" style="display:none">Have an account? Log in</button>
     </div>
     <div id="ns-login-err" class="ns-err"></div>
    </div>
   </div>
  </div>
  <div id="ns-onboard" class="ns-screen">
   <div class="ns-wrap">
    <div id="ns-ob-consent" class="ns-card" style="display:none">
     <div class="ns-step">Step 1 of 3</div><h2>Welcome to NIYAM</h2>
     <p class="ns-sub">NIYAM helps your child build small daily habits. You're in control of everything.</p>
     <div class="ns-consent"><input id="ns-consent-check" type="checkbox"><span>I am the parent or legal guardian, and I consent to my child's information being used in NIYAM. <em>(Wording to be finalised with legal review.)</em></span></div>
     <button id="ns-consent-next" class="ns-primary">Continue</button>
     <div id="ns-consent-err" class="ns-err"></div>
    </div>
    <div id="ns-ob-pin" class="ns-card" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0;color:#9a63e0;background:#f3ecff;border:1px solid #f3ecff">Almost there</div></div><h2>Set your 4-digit parent PIN</h2>
     <p class="ns-sub">This is what keeps the parent side yours. You&#8217;ll need it to approve the day, adjust points, change the timetable and manage rewards.<br><br>Keep it private from your child &#8212; the approval only means something if it&#8217;s really you.</p>
     <label>4-digit PIN</label><input id="ns-pin1" type="tel" inputmode="numeric" maxlength="4" class="ns-pin" placeholder="****">
     <label>Confirm PIN</label><input id="ns-pin2" type="tel" inputmode="numeric" maxlength="4" class="ns-pin" placeholder="****">
     <button id="ns-pin-next" class="ns-primary">Save PIN</button>
     <div id="ns-pin-err" class="ns-err"></div>
    </div>
    <div id="ns-pages"></div>

    <div id="ns-ob-done" class="ns-card" style="display:none;text-align:center">
     <h2>All set! &#10024;</h2><p class="ns-sub" id="ns-done-msg">Building the first day&#8230;</p>
    </div>
   </div>
  </div>
  <div id="ns-topbtns"><button id="ns-parent-btn">&#128274; Parent</button></div>
  <div id="ns-pinprompt" class="ns-screen">
   <div class="ns-wrap" style="padding-top:70px">
    <div class="ns-card">
     <h2>Enter Parent PIN</h2>
     <p class="ns-sub">Enter your 4-digit PIN to open the Parent Zone.</p>
     <input id="ns-pinprompt-input" type="tel" inputmode="numeric" maxlength="4" class="ns-pin" placeholder="****">
     <div style="display:flex;gap:10px;margin-top:14px">
       <button id="ns-pinprompt-cancel" style="flex:1;background:#eef0f3;color:#111827">Cancel</button>
       <button id="ns-pinprompt-ok" style="flex:1;background:#191a2f;color:#fff">Unlock</button>
     </div>
     <div id="ns-pinprompt-err" class="ns-err"></div>
    </div>
   </div>
  </div>
  <div id="ns-parent-zone">
   <div id="ns-pz-bar"><h1>Parent Zone</h1><div style="display:flex;gap:8px"><button id="ns-pz-logout">Log out</button><button id="ns-pz-back">&#8592; Back to <span id="ns-pz-name">child</span></button></div></div>
   <div id="ns-pz-body"></div>
  </div>
  `;
  var box=document.createElement('div'); box.id='niyam-shell'; box.innerHTML=html; document.body.appendChild(box);

  function $(id){ return document.getElementById(id); }
  function showErr(id,m){ var e=$(id); if(e){ e.textContent=m; e.style.display='block'; } }
  function clearErr(id){ var e=$(id); if(e){ e.textContent=''; e.style.display='none'; } }
  function screen(id){ $('ns-login').style.display='none'; $('ns-onboard').style.display='none'; if($(id)) $(id).style.display='block'; }

  window.addEventListener('error', function(e){ if(!booted) console.warn('[shell] pre-boot error:', e.message||e); });

  var currentUser=null, profile=null, booted=false;

  async function loadProfile(){
    var r = await window.sb.from('profiles').select('*').maybeSingle();
    if(r.error){ showErr('ns-login-err', r.error.message); return null; }
    return r.data;
  }
  async function saveProfile(patch){
    var row = Object.assign({ user_id: currentUser.id, updated_at: new Date().toISOString() }, patch);
    var r = await window.sb.from('profiles').upsert(row);
    if(r.error) throw new Error(r.error.message);
    profile = Object.assign(profile||{}, row);
  }

  // ---- Family timetable (parent admin screen) --------------------------
  // Fills window.TT_CUSTOM so ttGetSchedule() can prefer this family's own
  // schedule. No row = no override = built-in default schedule is used.
  window.TT_CUSTOM = null;
  async function loadFamilyTimetable(){
    try{
      if(!window.sb || !currentUser) return;
      var r = await window.sb.from('timetables').select('weekday,weekend').maybeSingle();
      if(r.error || !r.data) return;
      var wd = r.data.weekday, we = r.data.weekend;
      if(typeof wd === 'string'){ try{ wd = JSON.parse(wd); }catch(e){ wd = null; } }
      if(typeof we === 'string'){ try{ we = JSON.parse(we); }catch(e){ we = null; } }
      window.TT_CUSTOM = { weekday: wd || null, weekend: we || null };
    }catch(e){ console.warn('[shell] timetable load:', e); }
  }
  window.niyamLoadTimetable = loadFamilyTimetable;

  // Saves this family's schedules and refreshes the in-memory copy.
  async function saveFamilyTimetable(weekday, weekend){
    var row = { user_id: currentUser.id, weekday: weekday, weekend: weekend,
                updated_at: new Date().toISOString() };
    var r = await window.sb.from('timetables').upsert(row, { onConflict: 'user_id' });
    if(r.error){
      console.error('[shell] timetable save failed:', r.error);
      throw new Error('Could not save the timetable: ' + r.error.message
        + (r.error.hint ? ' (' + r.error.hint + ')' : ''));
    }
    window.TT_CUSTOM = { weekday: weekday, weekend: weekend };
  }
  window.niyamSaveTimetable = saveFamilyTimetable;

  // Hides the tabs a family switched off on the "What's included" screen.
  // Always-on features (timetable, approval, rewards, Geeta) are never hidden.
  function applyFeatureToggles(feats){
    if(!feats) return;
    var MAP = {
      brainlab: ["showTab('brain'"],
      wordbook: ["showTab('wordbook'"],
      creative: ["showTab('creative'", "showTab('gallery'"],
      progress: ["showTab('graphs'"]
      // sudoku lives inside Brain Lab; handled by the brainlab toggle
    };
    try{
      var buttons = document.querySelectorAll('button.nb');
      Object.keys(MAP).forEach(function(key){
        if(feats[key] !== false) return;             // only hide explicit false
        MAP[key].forEach(function(sig){
          Array.prototype.forEach.call(buttons, function(b){
            var oc = b.getAttribute('onclick') || '';
            if(oc.indexOf(sig) > -1) b.style.display = 'none';
          });
        });
      });
    }catch(e){ console.warn('[shell] feature toggles:', e); }
  }
  window.niyamApplyFeatures = applyFeatureToggles;

  function enterApp(){
    // --- Per-family browser-storage guard (fixes cross-account cache leak) ---
    try{
      var _uid = currentUser && currentUser.id;
      if(_uid && localStorage.getItem('niyam_owner') !== _uid){
        // Wipe ONLY app cache keys. Never touch 'sb-*' — that is Supabase's
        // login session; deleting it silently logs the requests out (42501s).
        var _rm = [];
        for(var _i = 0; _i < localStorage.length; _i++){
          var _k = localStorage.key(_i);
          if(_k && _k.indexOf('sb-') !== 0) _rm.push(_k);
        }
        _rm.forEach(function(_k){ localStorage.removeItem(_k); });
        sessionStorage.clear();
        localStorage.setItem('niyam_owner', _uid);
      }
    }catch(e){}
    // --- Personalize the dashboard header from this family's profile ---
    try{
      var p = profile || {}, pd = p.profile_data || {};
      if(typeof pd === 'string'){ try{ pd = JSON.parse(pd); }catch(e){ pd = {}; } }
      var nm = p.child_name || 'My Star';
      var tEl = document.getElementById('hdr-title');
      if(tEl) tEl.textContent = nm.toUpperCase() + "'S SCHEDULE & SCOREBOARD \uD83C\uDFC6";
      var sEl = document.getElementById('hdr-sub');
      if(sEl) sEl.textContent = [p.child_class, pd.school].filter(Boolean).join(' \u00B7 ') || 'NIYAM \u00B7 Small Habits, Big Destiny';
      var stEl = document.getElementById('hdr-star');
      if(stEl && pd.star_name) stEl.textContent = '\uD83C\uDF08 ' + pd.star_name.toUpperCase();
      var avEl = document.getElementById('hdr-avatar');
      if(avEl){
        if(pd.child_photo){ avEl.innerHTML = '<img src="'+pd.child_photo+'" style="width:100%;height:100%;object-fit:cover">'; }
        else if(pd.child_avatar){ avEl.textContent = pd.child_avatar; }
      }
    }catch(e){ console.warn('[shell] header personalize:', e); }
    try{
      var _pd = (profile && profile.profile_data) || {};
      if(typeof _pd === 'string'){ try{ _pd = JSON.parse(_pd); }catch(e){ _pd = {}; } }
      applyFeatureToggles(_pd.features);
    }catch(e){}
    $('ns-login').style.display='none';
    $('ns-onboard').style.display='none';
    $('ns-topbtns').style.display='flex';
    if(profile && profile.child_name){ var nm=$('ns-pz-name'); if(nm) nm.textContent=profile.child_name; }
    var ar=document.getElementById('app-root'); if(ar) ar.style.display='';
    if(!booted){
      booted=true;
      loadFamilyTimetable().then(function(){
        if(typeof window.bootApp==='function') window.bootApp();
        // Anything queued to run once the timetable is really loaded.
        if(typeof window.__niyamAfterBoot === 'function'){
          var fn = window.__niyamAfterBoot; window.__niyamAfterBoot = null; fn();
        }
      });
    }
  }

  async function route(){
    if(!window.sb){ screen('ns-login'); showErr('ns-login-err','Could not load the login system — check your connection and refresh.'); return; }
    var s = await window.sb.auth.getSession();
    currentUser = s.data.session ? s.data.session.user : null;
    if(!currentUser){ screen('ns-login'); return; }
    profile = await loadProfile();
    var pd = (profile && profile.profile_data) || {};
    if(typeof pd === 'string'){ try{ pd = JSON.parse(pd); }catch(e){ pd = {}; } }
    var c  = profile && profile.consent_at;      // S2 done
    var ch = profile && profile.child_name;      // S3 done
    var p  = profile && profile.parent_pin;      // S6 done
    var done = !!pd.setup_done;                  // S7 done

    if(c && ch && p && done){ enterApp(); return; }

    screen('ns-onboard');
    $('ns-ob-done') && ($('ns-ob-done').style.display='none');
    if(window.__nsShow){
      // S2 consent -> S3/S4/S5 -> S6 PIN -> S7 what's included
      if(!c)        window.__nsShow('ns-ob-consent');
      else if(!ch)  window.__nsShow(window.__nsFirstPage || 'ns-pp1');
      else if(!p)   window.__nsShow('ns-ob-pin');
      else          window.__nsShow(window.__nsLastPage || 'ns-pp4');
    }
    else if(!c){ $('ns-ob-consent').style.display='block'; }
  }

  // login / signup
  var loginMode='login';
  $('ns-to-signup').onclick=function(){ loginMode='signup'; $('ns-login-title').textContent='Create parent account'; $('ns-btn-login').style.display='none'; $('ns-btn-signup').style.display='block'; $('ns-to-signup').style.display='none'; $('ns-to-login').style.display='inline'; clearErr('ns-login-err'); };
  $('ns-to-login').onclick=function(){ loginMode='login'; $('ns-login-title').textContent='Parent login'; $('ns-btn-login').style.display='block'; $('ns-btn-signup').style.display='none'; $('ns-to-signup').style.display='inline'; $('ns-to-login').style.display='none'; clearErr('ns-login-err'); };
  $('ns-btn-login').onclick=async function(){ clearErr('ns-login-err');
    var r = await window.sb.auth.signInWithPassword({ email:$('ns-email').value.trim(), password:$('ns-password').value });
    if(r.error) return showErr('ns-login-err', r.error.message);
    route();
  };
  $('ns-btn-signup').onclick=async function(){ clearErr('ns-login-err');
    var r = await window.sb.auth.signUp({ email:$('ns-email').value.trim(), password:$('ns-password').value });
    if(r.error) return showErr('ns-login-err', r.error.message);
    route();
  };

  // onboarding
  $('ns-consent-next').onclick=async function(){ clearErr('ns-consent-err');
    if(!$('ns-consent-check').checked) return showErr('ns-consent-err','Please tick the consent box to continue.');
    try{ await saveProfile({ consent_at:new Date().toISOString() }); route(); }catch(e){ showErr('ns-consent-err', e.message); }
  };
  $('ns-pin-next').onclick=async function(){ clearErr('ns-pin-err');
    var a=$('ns-pin1').value.trim(), b=$('ns-pin2').value.trim();
    if(!/^\d{4}$/.test(a)) return showErr('ns-pin-err','PIN must be exactly 4 digits.');
    if(a!==b) return showErr('ns-pin-err','The two PINs do not match.');
    try{
      await saveProfile({ parent_pin:a });
      if(window.__nsShow && window.__nsLastPage) window.__nsShow(window.__nsLastPage);
      else route();
    }catch(e){ showErr('ns-pin-err', e.message); }
  };


  // ---- Parent setup questionnaire (A2 rewrite) -------------------------
  // Screen order: S3 About your child -> S4 Your wish -> S5 Day begins
  //               -> S6 Parent PIN -> S7 What's included -> build timetable
  (function(){
    var GRADES=['Class 4','Class 5','Class 6','Class 7','Class 8'];
    var GOALS=[
      'A steady routine they own',
      'Calmer evenings, less nagging',
      'More focus, fewer distractions',
      'Kinder and more responsible',
      'Confidence and independence',
      'Consistent study habits'
    ];
    var GOAL_HINT={
      'A steady routine they own':'fewer reminders, more self-starting',
      'Calmer evenings, less nagging':'the day runs without a fight',
      'More focus, fewer distractions':'finishing what they start',
      'Kinder and more responsible':'noticing others, helping at home',
      'Confidence and independence':'trying without being pushed',
      'Consistent study habits':'homework becomes normal, not a battle'
    };
    var STARTS=['1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];

    // S7 feature cards. locked:true = always included, cannot be switched off.
    var FEATURES=[
      {key:'timetable', icon:'\uD83D\uDDD3\uFE0F', name:'Daily Timetable',
       desc:'Their day, block by block \u2014 built for their class.', locked:true},
      {key:'approval',  icon:'\u2705', name:'Parent Review & Approval',
       desc:'You review the day and approve it. Points are banked only when you say so.', locked:true},
      {key:'rewards',   icon:'\uD83C\uDFC6', name:'Points & Rewards',
       desc:'Earn, save and spend on rewards you set yourself.', locked:true},
      {key:'geeta',     icon:'\uD83D\uDCFF', name:'Values & Wisdom',
       desc:'One short verse from the Bhagavad Geeta each day with its meaning in simple language \u2014 timeless wisdom about honesty, effort and self-control. NIYAM is rooted in Indian tradition and open to every family.', locked:true},
      {key:'brainlab',  icon:'\uD83E\uDDE0', name:'Brain Lab',
       desc:'A daily logical-reasoning set, new every day.'},
      {key:'sudoku',    icon:'\uD83D\uDD22', name:'Sudoku & Maths Practice',
       desc:'A puzzle a day, and maths practice scored out of 100%.'},
      {key:'wordbook',  icon:'\uD83D\uDCD6', name:'WordBook',
       desc:'New words with meanings and sentences, plus a quiz.'},
      {key:'creative',  icon:'\uD83C\uDFA8', name:'Creative Moments & Gallery',
       desc:'Drawings, poems and stories \u2014 saved into their own gallery.'},
      {key:'progress',  icon:'\uD83D\uDCC8', name:'Progress',
       desc:'Streaks, points over time, and how the week went.'}
    ];

    var Q={ features:{} };
    FEATURES.forEach(function(f){ Q.features[f.key]=true; });

    var SEC={
      about:{pill:'About your child',accent:'#d99a18',soft:'#fff3d6'},
      wish:{pill:'Your wish',accent:'#2fa674',soft:'#e4f6ed'},
      day:{pill:'Their day',accent:'#9a63e0',soft:'#f3ecff'},
      ready:{pill:'Ready',accent:'#d99a18',soft:'#fff3d6'}
    };

    var P=[
      {id:'ns-pp1',sec:'about',icon:'\uD83D\uDC4B',type:'childinfo',
       q:'Tell us about your child',
       hint:'Just enough to build their day. Nothing more.'},
      {id:'ns-pp2',sec:'wish',icon:'\uD83D\uDE80',key:'parent_goal',type:'radio',list:GOALS,
       q:'What would make this year a win for {name}?',
       hint:'Pick the one that matters most right now. NIYAM will keep it at the centre of everything.'},
      {id:'ns-pp3',sec:'day',icon:'\uD83C\uDF24\uFE0F',key:'day_start',type:'radio',list:STARTS,
       q:'When does {name}\u2019s day open up?',
       hint:'The school bag drops. The shoes come off. Somewhere in that gap, the day stops belonging to school and starts belonging to them.<br><br>NIYAM stays completely quiet until that moment \u2014 no tasks, no points, no nudges while {name} is still in class or on the way home. Tell us when their free time really begins, and their day will be waiting.',
       foot:'Weekends and holidays open earlier \u2014 you can set that separately whenever you like.'},
      {id:'ns-pp4',sec:'ready',icon:'\u2B50',type:'features',
       q:'Here\u2019s what {name} gets',
       hint:'Everything below is switched on. Turn off anything you don\u2019t want \u2014 you can change this any time from the Parent Zone.',
       last:true}
    ];
    var byId={}; P.forEach(function(p,i){ byId[p.id]=p; p._next=(i<P.length-1)?P[i+1].id:null; });
    var ORDER=P.map(function(p){return p.id;});
    // The PIN screen sits between S5 and S7 in the flow.
    var PIN_AFTER='ns-pp3';
    var ALLIDS=['ns-ob-consent','ns-ob-pin','ns-ob-done'].concat(ORDER);

    function nm(){ return Q.child_name || 'your child'; }
    function fill(t){ return String(t||'').replace(/\{name\}/g, nm()); }

    function E(tag,cls,html){ var d=document.createElement(tag); if(cls) d.className=cls; if(html!=null) d.innerHTML=html; return d; }

    function choiceLabel(key,label,sub){
      var lab=document.createElement('label'); lab.className='ns-choice ns-radio'; lab.setAttribute('data-v',label);
      var inp=document.createElement('input'); inp.type='radio'; inp.value=label; inp.name='ns_'+key;
      var bx=document.createElement('span'); bx.className='ns-box';
      var tx=document.createElement('span'); tx.className='ns-choice-txt';
      tx.innerHTML = sub ? (label+'<span style="display:block;font-size:11.5px;color:#8a8f9c;margin-top:2px">'+sub+'</span>') : label;
      lab.appendChild(inp); lab.appendChild(bx); lab.appendChild(tx); return {lab:lab,inp:inp};
    }
    function clearSel(box){ Array.prototype.forEach.call(box.querySelectorAll('.ns-choice'),function(x){ x.classList.remove('sel'); var i=x.querySelector('input'); if(i) i.checked=false; }); }
    function renderRadios(id,list,key,subs){
      var box=$(id); if(!box) return; box.innerHTML='';
      list.forEach(function(label){
        var c=choiceLabel(key,label,subs?subs[label]:null);
        if(Q[key]===label){ c.inp.checked=true; c.lab.classList.add('sel'); }
        box.appendChild(c.lab);
      });
      if(!box._wired){ box._wired=true;
        box.addEventListener('click',function(e){
          var lab=e.target && e.target.closest ? e.target.closest('.ns-choice') : null; if(!lab||!box.contains(lab)) return;
          e.preventDefault(); Q[key]=lab.getAttribute('data-v'); clearSel(box);
          lab.classList.add('sel'); var inp=lab.querySelector('input'); if(inp) inp.checked=true;
        });
      }
    }

    function head(p,sec){
      var h=E('div','ns-cardhead');
      var b=E('button','ns-back','&#8592;'); b.setAttribute('data-back','prev'); h.appendChild(b);
      if(sec){ var pill=E('span','ns-step',sec.pill); pill.style.color=sec.accent; pill.style.background=sec.soft; pill.style.border='1px solid '+sec.soft; h.appendChild(pill); }
      return h;
    }

    function buildCard(p,qi,total){
      var sec=SEC[p.sec];
      var card=E('div','ns-card ns-qcard'); card.id=p.id; card.style.display='none';
      card.appendChild(head(p,sec));
      var pr=E('div','ns-progress'); var fl=E('div','ns-progress-fill');
      fl.style.width=Math.round((qi+1)/total*100)+'%'; pr.appendChild(fl); card.appendChild(pr);
      var ic=E('div','ns-icon',p.icon); if(sec) ic.style.background=sec.soft; card.appendChild(ic);
      card.appendChild(Object.assign(E('h2',null,p.q),{id:p.id+'-q'}));
      if(p.hint) card.appendChild(Object.assign(E('div','ns-qhint ns-center',p.hint),{id:p.id+'-hint'}));

      if(p.type==='childinfo'){
        var w=E('div');
        w.appendChild(Object.assign(E('div','ns-qhint'),{innerHTML:'<b>What should we call them?</b>'}));
        var inp=E('input'); inp.type='text'; inp.id='in-child_name'; inp.setAttribute('autocomplete','off');
        inp.placeholder='First name or nickname'; w.appendChild(inp);
        w.appendChild(Object.assign(E('div','ns-qhint'),{innerHTML:'<b>Which class?</b>',style:'margin-top:14px'}));
        var bx=E('div','ns-opts'); bx.id='opts-'+p.id; w.appendChild(bx);
        w.appendChild(Object.assign(E('div','ns-qhint ns-center'),
          {innerHTML:'This shapes their whole timetable \u2014 how long they study, when they sleep, and which activities appear.',
           style:'margin-top:10px'}));
        w.appendChild(Object.assign(E('div','ns-qhint ns-center'),
          {innerHTML:'NIYAM is built for Classes 4 to 8 right now. <b>Little ones are coming soon.</b>',
           style:'margin-top:8px;background:#fff8e6;border:1px solid #f0d9a0;border-radius:11px;padding:9px 11px;color:#6b5a2a'}));
        card.appendChild(w);
      }
      else if(p.type==='radio'){ var rb=E('div','ns-opts'); rb.id='opts-'+p.id; card.appendChild(rb); }
      else if(p.type==='features'){
        var fw=E('div'); fw.id='ns-feat-wrap';
        FEATURES.forEach(function(f){
          var row=E('div','ns-feat-row');
          row.setAttribute('data-f',f.key);
          row.style.cssText='display:flex;gap:11px;align-items:flex-start;text-align:left;background:#fff;'
            +'border:1.5px solid #ece7df;border-radius:14px;padding:12px 13px;margin-bottom:9px';
          row.innerHTML =
            '<div style="font-size:23px;line-height:1;flex:0 0 auto">'+f.icon+'</div>'
            + '<div style="flex:1;min-width:0">'
            +   '<div style="font-weight:800;font-size:14.5px;margin-bottom:3px">'+f.name+'</div>'
            +   '<div style="font-size:12px;color:#6b7280;line-height:1.5">'+f.desc+'</div>'
            + '</div>'
            + (f.locked
                ? '<div style="flex:0 0 auto;font-size:10.5px;font-weight:800;color:#8a5a00;background:#fff5dd;'
                  +'border-radius:8px;padding:5px 8px;white-space:nowrap">Always on</div>'
                : '<button type="button" class="ns-feat-tog" data-k="'+f.key+'" '
                  +'style="flex:0 0 auto;border:0;border-radius:9px;padding:7px 11px;font-size:11.5px;'
                  +'font-weight:800;cursor:pointer;background:#e4f6ed;color:#1d7a53">On</button>');
          fw.appendChild(row);
        });
        card.appendChild(fw);
      }

      if(p.foot) card.appendChild(Object.assign(E('div','ns-qhint ns-center',p.foot),{style:'margin-top:12px'}));
      card.appendChild(Object.assign(E('div','ns-err'),{id:p.id+'-err'}));

      var btn=E('button','ns-primary', p.last ? 'Finish setup' : 'Continue');
      btn.setAttribute('data-page',p.id);
      if(p.last) btn.setAttribute('data-finish','1'); else btn.setAttribute('data-next', p._next);
      card.appendChild(btn);
      return card;
    }

    var host=$('ns-pages');
    if(host){
      host.innerHTML='';
      P.forEach(function(p,i){ host.appendChild(buildCard(p,i,P.length)); });
    }
    renderRadios('opts-ns-pp1',GRADES,'child_class');
    renderRadios('opts-ns-pp2',GOALS,'parent_goal',GOAL_HINT);
    renderRadios('opts-ns-pp3',STARTS,'day_start');

    // feature on/off toggles
    var fwrap=$('ns-feat-wrap');
    if(fwrap) fwrap.addEventListener('click',function(e){
      var b=e.target && e.target.closest ? e.target.closest('.ns-feat-tog') : null; if(!b) return;
      var k=b.getAttribute('data-k'); Q.features[k]=!Q.features[k];
      b.textContent = Q.features[k] ? 'On' : 'Off';
      b.style.background = Q.features[k] ? '#e4f6ed' : '#f1f2f6';
      b.style.color      = Q.features[k] ? '#1d7a53' : '#9aa0ad';
      var row=b.closest('.ns-feat-row');
      if(row) row.style.opacity = Q.features[k] ? '1' : '.55';
    });

    function visiblePage(){ for(var i=0;i<ALLIDS.length;i++){ var e=$(ALLIDS[i]); if(e && e.style.display!=='none') return ALLIDS[i]; } return null; }
    function showCard(id){
      ALLIDS.forEach(function(x){ var e=$(x); if(e) e.style.display='none'; });
      var el=$(id); if(!el) return;
      var p=byId[id];
      if(p){   // re-fill {name} placeholders now that we may know the child's name
        var qEl=$(p.id+'-q'); if(qEl) qEl.textContent=fill(p.q);
        var hEl=$(p.id+'-hint'); if(hEl && p.hint) hEl.innerHTML=fill(p.hint);
      }
      el.style.display='block'; el.classList.remove('ns-in'); void el.offsetWidth; el.classList.add('ns-in'); window.scrollTo(0,0);
    }
    window.__nsShow=showCard;

    function back(){
      var cur=visiblePage();
      if(cur==='ns-ob-pin'){ showCard(PIN_AFTER); return; }
      if(cur==='ns-pp4'){ showCard('ns-ob-pin'); return; }
      var idx=ORDER.indexOf(cur);
      if(idx>0) showCard(ORDER[idx-1]); else showCard('ns-ob-consent');
    }

    function validate(id){
      var p=byId[id]; if(!p) return null;
      if(p.type==='childinfo'){
        var v=$('in-child_name').value.trim();
        Q.child_name=v||null;
        if(!v) return 'Please tell us what to call your child.';
        if(!Q.child_class) return 'Please pick their class.';
        return null;
      }
      if(p.type==='radio' && !Q[p.key]) return 'Please pick an option to continue.';
      return null;
    }

    // '3:00 PM' -> 15
    function startHour(txt){
      var m=/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(txt||''); if(!m) return null;
      var h=parseInt(m[1],10); if(/pm/i.test(m[3]) && h<12) h+=12; if(/am/i.test(m[3]) && h===12) h=0;
      return h + parseInt(m[2],10)/60;
    }

    async function finish(){
      var cls=Q.child_class, sh=startHour(Q.day_start);
      var pd={
        child_name:Q.child_name, grade:cls, parent_goal:Q.parent_goal||null,
        day_start:Q.day_start||null, day_start_hour:sh,
        features:Q.features, setup_done:true, setup_at:new Date().toISOString()
      };
      await saveProfile({ child_name:Q.child_name, child_class:cls, profile_data:pd });

      // Build this family's starting timetable from their class band.
      // This must not fail quietly \u2014 if it does, the family silently gets
      // the old built-in default instead of their class band.
      if(typeof window.niyamBuildTimetable !== 'function'){
        throw new Error('Class timetables did not load. Check that data/timetable-bands.js '
          + 'is included in index.html, then refresh and try again.');
      }
      var tt = window.niyamBuildTimetable(cls, sh);
      console.log('[setup] band ' + tt.band + ' (' + tt.label + ') \u00B7 '
        + tt.weekday.length + ' weekday blocks, ' + tt.weekend.length + ' weekend blocks');
      await saveFamilyTimetable(tt.weekday, tt.weekend);
      console.log('[setup] timetable saved for class ' + cls);

      // Remember these so the preview can fall back to the band if needed.
      window.__niyamClass = cls; window.__niyamStartHour = sh;

      ALLIDS.forEach(function(x){ var e=$(x); if(e) e.style.display='none'; });
      $('ns-ob-done').style.display='block';
      $('ns-done-msg').textContent='Building '+Q.child_name+'\u2019s first day\u2026';
      setTimeout(function(){
        // Queue the preview so it opens only once the timetable is loaded.
        window.__niyamAfterBoot = function(){
          if(typeof window.niyamOpenTomorrowsPlan === 'function'){
            window.niyamOpenTomorrowsPlan({ name: Q.child_name });
          }
        };
        enterApp();
      },1300);
    }

    var ob=$('ns-onboard');
    if(ob) ob.addEventListener('click', async function(e){
      var t=e.target; if(!t || t.tagName!=='BUTTON') return;
      if(t.classList.contains('ns-feat-tog')) return;      // handled above
      var backTo=t.getAttribute('data-back');
      if(backTo!==null){ if(backTo==='consent') showCard('ns-ob-consent'); else back(); return; }
      var page=t.getAttribute('data-page'), next=t.getAttribute('data-next'), fin=t.getAttribute('data-finish');
      if(page===null && next===null && fin===null) return;
      if(page!==null){ clearErr(page+'-err'); var msg=validate(page); if(msg){ showErr(page+'-err', msg); return; } }
      if(fin!==null){ try{ await finish(); }catch(err){ showErr((page||'ns-pp4')+'-err', err.message); } return; }
      if(next!==null){
        if(page===PIN_AFTER){ showCard('ns-ob-pin'); return; }   // PIN sits here
        showCard(next);
      }
    });

    // expose for route()
    window.__nsFirstPage = ORDER[0];
    window.__nsLastPage  = ORDER[ORDER.length-1];
  })();

  $('ns-pz-logout').onclick=async function(){ try{ await window.sb.auth.signOut(); }catch(e){} try{ var _rm=[]; for(var _i=0;_i<localStorage.length;_i++){ var _k=localStorage.key(_i); if(_k && _k.indexOf('sb-')!==0) _rm.push(_k);} _rm.forEach(function(_k){ localStorage.removeItem(_k); }); sessionStorage.clear(); }catch(e){} location.reload(); };

  // ---- Parent Zone (B2): per-family PIN gate + navy zone ----
  function hidePinPrompt(){ $('ns-pinprompt').style.display='none'; }
  $('ns-parent-btn').onclick=function(){ clearErr('ns-pinprompt-err'); $('ns-pinprompt-input').value=''; $('ns-pinprompt').style.display='block'; setTimeout(function(){ var i=$('ns-pinprompt-input'); if(i) i.focus(); },100); };
  $('ns-pinprompt-cancel').onclick=hidePinPrompt;
  $('ns-pinprompt-ok').onclick=function(){
    clearErr('ns-pinprompt-err');
    if($('ns-pinprompt-input').value.trim() === (profile && profile.parent_pin)){ hidePinPrompt(); enterParentZone(); }
    else showErr('ns-pinprompt-err','Wrong PIN. Try again.');
  };
  var _tpOrigParent=null, _tpOrigNext=null;
  function enterParentZone(){
    var tp=document.getElementById('tab-parent'), body=$('ns-pz-body');
    if(tp && body){
      _tpOrigParent=tp.parentNode; _tpOrigNext=tp.nextSibling;
      body.appendChild(tp);
      tp.classList.add('active'); tp.style.display='block';
      var w=document.getElementById('parent-locked-wall'); if(w) w.style.display='none';
      var c=document.getElementById('parent-content');     if(c) c.style.display='block';
    }
    try{ parentUnlocked = true; }catch(e){}
    if(typeof renderPendingQueue==='function')      try{ renderPendingQueue(); }catch(e){}
    if(typeof renderParentTab==='function')         try{ renderParentTab(); }catch(e){}
    if(typeof renderParentShlokaMgmt==='function')  try{ renderParentShlokaMgmt(); }catch(e){}
    $('ns-topbtns').style.display='none';
    $('ns-parent-zone').style.display='block';
    window.scrollTo(0,0);
  }
  $('ns-pz-back').onclick=function(){
    $('ns-parent-zone').style.display='none';
    var tp=document.getElementById('tab-parent');
    if(tp && _tpOrigParent){ tp.classList.remove('active'); tp.style.display=''; if(_tpOrigNext) _tpOrigParent.insertBefore(tp,_tpOrigNext); else _tpOrigParent.appendChild(tp); }
    try{ parentUnlocked = false; }catch(e){}
    $('ns-topbtns').style.display='flex';
  };

  route();
})();