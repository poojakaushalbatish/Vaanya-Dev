// ============================================================
// NIYAM-SE SHELL (Phase 1 / B1)
// Creates the authenticated Supabase client (shared with the app),
// runs the login + onboarding gate, and boots the app on entry.
// Loads BEFORE 01-core.js so window.sb exists when the app reads it.
// ============================================================
(function(){
  var isFile = location.protocol === 'file:'; // local test = memory session; https = persistent
  window.sb = (typeof supabase !== 'undefined')
    ? supabase.createClient(
        'https://zeengmnzstpfozupqjif.supabase.co',
        'sb_publishable_IFQqrRiTHi45T4IvKHok6Q_X7EIPkEN',
        { auth: { persistSession: !isFile, autoRefreshToken: !isFile } })
    : null;

  var css = `
  #niyam-shell{font-family:system-ui,Segoe UI,Roboto,sans-serif;
    --navy:#191a2f;--navy2:#23244a;--ink:#1f2433;--muted:#6b7280;
    --gold:#f4b740;--gold-deep:#cf962a;--gold-soft:#fff5dd;--gold-line:#f0d9a0;
    --card:#ffffff;--cream:#fbfaf6;--line:#ece7df}
  #niyam-shell .ns-screen{position:fixed;inset:0;z-index:99999;overflow:auto;display:none;
    background:radial-gradient(60% 40% at 12% 8%, rgba(255,214,170,.55), transparent 60%),radial-gradient(55% 45% at 92% 12%, rgba(201,224,255,.55), transparent 60%),radial-gradient(70% 55% at 50% 108%, rgba(214,245,224,.5), transparent 60%),linear-gradient(180deg,#fffaf3 0%,#faf6ff 100%)}
  #niyam-shell .ns-wrap{max-width:460px;margin:0 auto;padding:44px 18px 56px}
  #niyam-shell .ns-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 20px;margin-bottom:16px;box-shadow:0 10px 28px rgba(90,80,130,.12)}
  #niyam-shell .ns-brand{text-align:center;margin-bottom:20px}
  #niyam-shell .ns-mark{width:66px;height:66px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;border-radius:20px;
    background:radial-gradient(circle at 50% 38%, rgba(244,183,64,.32), rgba(244,183,64,.04) 72%)}
  #niyam-shell h1{font-size:30px;margin:0;text-align:center;color:#191a2f;letter-spacing:.16em;font-weight:800}
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
  #niyam-shell .ns-opts{display:flex;flex-direction:column;gap:9px}
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
  `;
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var html = `
  <div id="ns-login" class="ns-screen">
   <div class="ns-wrap">
    <div class="ns-brand">
     <div class="ns-mark"><svg width="42" height="42" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="nsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36b"/><stop offset="1" stop-color="#e8a838"/></linearGradient></defs><path d="M12 2.2l2.55 6.06 6.55.52-4.99 4.27 1.55 6.39L12 16.6l-5.21 3.84 1.55-6.39-4.99-4.27 6.55-.52z" fill="url(#nsg)"/></svg></div>
     <h1>NIYAM-SE</h1>
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
     <div class="ns-step">Step 1 of 3</div><h2>Welcome to NIYAM-SE</h2>
     <p class="ns-sub">NIYAM-SE helps your child build small daily habits. You're in control of everything.</p>
     <div class="ns-consent"><input id="ns-consent-check" type="checkbox"><span>I am the parent or legal guardian, and I consent to my child's information being used in NIYAM-SE. <em>(Wording to be finalised with legal review.)</em></span></div>
     <button id="ns-consent-next" class="ns-primary">Continue</button>
     <div id="ns-consent-err" class="ns-err"></div>
    </div>
    <div id="ns-ob-pin" class="ns-card" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="consent">&#8592;</button><div class="ns-step" style="margin-bottom:0">Step 2 of 3</div></div><h2>Create your Parent PIN</h2>
     <p class="ns-sub">A 4-digit PIN for the Parent Zone. You can change it later.</p>
     <label>4-digit PIN</label><input id="ns-pin1" type="tel" inputmode="numeric" maxlength="4" class="ns-pin" placeholder="****">
     <label>Confirm PIN</label><input id="ns-pin2" type="tel" inputmode="numeric" maxlength="4" class="ns-pin" placeholder="****">
     <button id="ns-pin-next" class="ns-primary">Save PIN</button>
     <div id="ns-pin-err" class="ns-err"></div>
    </div>
    <div id="ns-p1" class="ns-card" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0">About your child</div></div>
     <div class="ns-progress"><div class="ns-progress-fill" style="width:9%"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Your child's full name</div>
       <input id="ns-full-name" type="text" autocomplete="off" placeholder="e.g. Vaanya Sharma"></div>
     <div class="ns-q"><div class="ns-qlabel">Which class?</div><div class="ns-opts" id="ns-opts-grade"></div></div>
     <button class="ns-primary" data-page="p1" data-next="ns-p2">Continue</button>
     <div id="ns-p1-err" class="ns-err"></div>
    </div>

    <div id="ns-p2" class="ns-card" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0">About your child</div></div>
     <div class="ns-progress"><div class="ns-progress-fill" style="width:18%"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Which board?</div><div class="ns-opts" id="ns-opts-board"></div></div>
     <div class="ns-q"><div class="ns-qlabel">School name <span class="ns-optional-tag">optional</span></div>
       <input id="ns-school" type="text" autocomplete="off" placeholder="e.g. DPS Noida"></div>
     <button class="ns-primary" data-page="p2" data-next="ns-p3">Continue</button>
     <div id="ns-p2-err" class="ns-err"></div>
    </div>

    <div id="ns-p3" class="ns-card" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0">Learning</div></div>
     <div class="ns-progress"><div class="ns-progress-fill" style="width:27%"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Favourite subject</div><div class="ns-opts" id="ns-opts-fav"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Subject that needs attention</div><div class="ns-opts" id="ns-opts-focus"></div></div>
     <button class="ns-primary" data-page="p3" data-next="ns-p4">Continue</button>
     <div id="ns-p3-err" class="ns-err"></div>
    </div>

    <div id="ns-p4" class="ns-card" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0">Character</div></div>
     <div class="ns-progress"><div class="ns-progress-fill" style="width:36%"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Character content should draw from&#8230;</div><div class="ns-opts" id="ns-opts-source"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Core values to nurture</div><div class="ns-qhint">Pick 2 or 3.</div><div class="ns-opts" id="ns-opts-values"></div></div>
     <button class="ns-primary" data-page="p4" data-next="ns-p5">Continue</button>
     <div id="ns-p4-err" class="ns-err"></div>
    </div>

    <div id="ns-p5" class="ns-card" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0">Character</div></div>
     <div class="ns-progress"><div class="ns-progress-fill" style="width:45%"></div></div>
     <div class="ns-q"><div class="ns-qlabel">The one value that matters most</div><div class="ns-qhint">Choose from the values you picked.</div><div class="ns-opts" id="ns-opts-top"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Your goal for the year <span class="ns-optional-tag">optional</span></div><div class="ns-opts" id="ns-opts-goal"></div></div>
     <button class="ns-primary" data-page="p5" data-next="ns-p6">Continue</button>
     <div id="ns-p5-err" class="ns-err"></div>
    </div>

    <div id="ns-p6" class="ns-card" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0">A photo <span class="ns-optional-tag">optional</span></div></div>
     <div class="ns-progress"><div class="ns-progress-fill" style="width:55%"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Child's photo</div><div class="ns-qhint">Used as their avatar. You can skip this.</div>
       <div class="ns-photo-row">
         <div class="ns-photo-prev" id="ns-photo-prev">&#11088;</div>
         <button type="button" class="ns-photo-btn" id="ns-photo-pick">Choose photo</button>
         <button type="button" class="ns-skip" id="ns-photo-clear" style="display:none">Remove</button>
         <input id="ns-photo-input" type="file" accept="image/*" style="display:none">
       </div></div>
     <button class="ns-primary" data-next="ns-hp">Continue</button>
    </div>

    <div id="ns-hp" class="ns-card ns-childcard" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button></div>
     <div class="ns-handoff">
       <div class="ns-flame">&#127775;</div>
       <h2 id="ns-handoff-title">Now hand the phone to your child</h2>
       <p class="ns-sub">The next few questions are for them to answer.</p>
     </div>
     <button class="ns-primary" data-next="ns-c1">I'm ready!</button>
    </div>

    <div id="ns-c1" class="ns-card ns-childcard" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0">Your turn &#10024;</div></div>
     <div class="ns-progress"><div class="ns-progress-fill" style="width:73%"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Pick your Star Name</div><div class="ns-qhint">This goes on your Aurora Star badge.</div>
       <input id="ns-star-name" type="text" autocomplete="off" placeholder="e.g. Star Explorer"></div>
     <div class="ns-q"><div class="ns-qlabel">What do you love doing?</div><div class="ns-qhint">Pick up to 3.</div><div class="ns-opts" id="ns-opts-interests"></div></div>
     <button class="ns-primary" data-page="c1" data-next="ns-c2">Continue</button>
     <div id="ns-c1-err" class="ns-err"></div>
    </div>

    <div id="ns-c2" class="ns-card ns-childcard" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0">Your turn &#10024;</div></div>
     <div class="ns-progress"><div class="ns-progress-fill" style="width:82%"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Favourite kind of reward</div><div class="ns-opts" id="ns-opts-reward"></div></div>
     <button class="ns-primary" data-page="c2" data-next="ns-t1">Continue</button>
     <div id="ns-c2-err" class="ns-err"></div>
    </div>

    <div id="ns-t1" class="ns-card" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0">Personalize <span class="ns-optional-tag">optional</span></div></div>
     <div class="ns-progress"><div class="ns-progress-fill" style="width:91%"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Does your child take tuitions / coaching?</div><div class="ns-opts" id="ns-opts-tuition"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Family type</div><div class="ns-opts" id="ns-opts-family"></div></div>
     <button class="ns-primary" data-next="ns-t2">Continue</button>
    </div>

    <div id="ns-t2" class="ns-card" style="display:none">
     <div class="ns-cardhead"><button class="ns-back" data-back="prev">&#8592;</button><div class="ns-step" style="margin-bottom:0">Personalize <span class="ns-optional-tag">optional</span></div></div>
     <div class="ns-progress"><div class="ns-progress-fill" style="width:100%"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Daily screen time</div><div class="ns-opts" id="ns-opts-screen"></div></div>
     <div class="ns-q"><div class="ns-qlabel">Daily outdoor play</div><div class="ns-opts" id="ns-opts-outdoor"></div></div>
     <button class="ns-primary" data-finish="1">Save &amp; finish</button>
     <button class="ns-skip" data-finish="1">Skip &amp; finish</button>
     <div id="ns-t2-err" class="ns-err"></div>
    </div>
    <div id="ns-ob-done" class="ns-card" style="display:none;text-align:center">
     <h2>All set! &#10024;</h2><p class="ns-sub" id="ns-done-msg">Opening the app&#8230;</p>
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

  function enterApp(){
    $('ns-login').style.display='none';
    $('ns-onboard').style.display='none';
    $('ns-topbtns').style.display='flex';
    if(profile && profile.child_name){ var nm=$('ns-pz-name'); if(nm) nm.textContent=profile.child_name; }
    var ar=document.getElementById('app-root'); if(ar) ar.style.display='';
    if(!booted){ booted=true; if(typeof window.bootApp==='function') window.bootApp(); }
  }

  async function route(){
    if(!window.sb){ screen('ns-login'); showErr('ns-login-err','Could not load the login system — check your connection and refresh.'); return; }
    var s = await window.sb.auth.getSession();
    currentUser = s.data.session ? s.data.session.user : null;
    if(!currentUser){ screen('ns-login'); return; }
    profile = await loadProfile();
    var c = profile && profile.consent_at, p = profile && profile.parent_pin, ch = profile && profile.child_name;
    if(c && p && ch){ enterApp(); return; }
    screen('ns-onboard');
    ['ns-ob-consent','ns-ob-pin','ns-p1','ns-p2','ns-p3','ns-p4','ns-p5','ns-p6','ns-hp','ns-c1','ns-c2','ns-t1','ns-t2','ns-ob-done'].forEach(function(x){ if($(x)) $(x).style.display='none'; });
    if(!c) $('ns-ob-consent').style.display='block';
    else if(!p) $('ns-ob-pin').style.display='block';
    else { var _p=$('ns-p1'); _p.style.display='block'; _p.classList.add('ns-in'); }
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
    try{ await saveProfile({ parent_pin:a }); route(); }catch(e){ showErr('ns-pin-err', e.message); }
  };
  // ---- Step 3: profile-setup questionnaire (paged) ----
  (function(){
    var GRADES=['Class 4','Class 5','Class 6','Class 7','Class 8'];
    var BOARDS=['CBSE','ICSE','State Board','IB / Cambridge','Other'];
    var SUBJECTS=['Maths','Science','English','Hindi','Social Studies','Computers / IT','Arts & Craft','Music','Sports / PE','Other'];
    var VALUES=['Honesty','Discipline','Respect','Kindness','Courage','Gratitude','Responsibility','Patience','Focus'];
    var SOURCES=['Bhagavad Geeta & Indian wisdom','Universal / secular values','A mix of both'];
    var GOALS=['Build daily discipline & routine','Improve academics','Strengthen character & values','More independence & responsibility','Better focus & less screen time','Balanced all-round growth'];
    var INTERESTS=['Drawing / Art','Reading','Sports','Dancing','Music / Singing','Building / Lego','Video games','Animals','Cooking / Baking','Science experiments','Outdoor play','Coding'];
    var REWARDS=['Extra screen time','A treat / outing','A small toy / gift','Pocket money / savings','Special time with parent','A fun privilege'];
    var YESNO=['Yes','No'];
    var FAMILY=['Nuclear','Joint'];
    var SCREEN=['Under 1 hour','1-2 hours','2-3 hours','3+ hours'];
    var OUTDOOR=['Under 30 min','30-60 min','1-2 hours','2+ hours'];

    var Q={ interests:[], values:[] };

    function choiceLabel(type,key,label){
      var lab=document.createElement('label'); lab.className='ns-choice '+(type==='radio'?'ns-radio':'ns-check');
      var inp=document.createElement('input'); inp.type=type; inp.value=label; if(type==='radio') inp.name='ns_'+key;
      var bx=document.createElement('span'); bx.className='ns-box';
      var tx=document.createElement('span'); tx.className='ns-choice-txt'; tx.textContent=label;
      lab.appendChild(inp); lab.appendChild(bx); lab.appendChild(tx);
      return { lab:lab, inp:inp };
    }
    function wireRadio(box,key){
      box.addEventListener('click',function(e){
        var lab=e.target && e.target.closest ? e.target.closest('.ns-choice') : null;
        if(!lab || !box.contains(lab)) return;
        e.preventDefault();
        Q[key]=lab.getAttribute('data-v');
        Array.prototype.forEach.call(box.querySelectorAll('.ns-choice'),function(x){ x.classList.remove('sel'); var i=x.querySelector('input'); if(i) i.checked=false; });
        lab.classList.add('sel'); var inp=lab.querySelector('input'); if(inp) inp.checked=true;
      });
    }
    function renderRadios(id,list,key){
      var box=$(id); if(!box) return; box.innerHTML='';
      list.forEach(function(label){
        var c=choiceLabel('radio',key,label); c.lab.setAttribute('data-v',label);
        if(Q[key]===label){ c.inp.checked=true; c.lab.classList.add('sel'); }
        box.appendChild(c.lab);
      });
      if(!box._wired){ box._wired=true; wireRadio(box,key); }
    }
    function renderChecks(id,list,key,max){
      var box=$(id); if(!box) return; box.innerHTML='';
      list.forEach(function(label){
        var c=choiceLabel('check',key,label); c.lab.setAttribute('data-v',label);
        if(Q[key].indexOf(label)>-1){ c.inp.checked=true; c.lab.classList.add('sel'); }
        box.appendChild(c.lab);
      });
      if(!box._wired){ box._wired=true;
        box.addEventListener('click',function(e){
          var lab=e.target && e.target.closest ? e.target.closest('.ns-choice') : null;
          if(!lab || !box.contains(lab)) return;
          e.preventDefault();
          var label=lab.getAttribute('data-v'), arr=Q[key], i=arr.indexOf(label), inp=lab.querySelector('input');
          if(i>-1){ arr.splice(i,1); lab.classList.remove('sel'); if(inp) inp.checked=false; }
          else { if(arr.length>=max) return; arr.push(label); lab.classList.add('sel'); if(inp) inp.checked=true; }
          if(key==='values') renderTopValue();
        });
      }
    }
    function renderTopValue(){
      var box=$('ns-opts-top'); if(!box) return; box.innerHTML='';
      if(Q.top_value && Q.values.indexOf(Q.top_value)===-1) Q.top_value=null;
      if(!Q.values.length){ box.innerHTML='<div class="ns-qhint">Choose 2\u20133 values on the previous step first.</div>'; }
      else { Q.values.forEach(function(label){
        var c=choiceLabel('radio','top',label); c.lab.setAttribute('data-v',label);
        if(Q.top_value===label){ c.inp.checked=true; c.lab.classList.add('sel'); }
        box.appendChild(c.lab);
      }); }
      if(!box._wired){ box._wired=true; wireRadio(box,'top_value'); }
    }

    renderRadios('ns-opts-grade',GRADES,'grade');
    renderRadios('ns-opts-board',BOARDS,'board');
    renderRadios('ns-opts-fav',SUBJECTS,'fav_subject');
    renderRadios('ns-opts-focus',SUBJECTS,'focus_subject');
    renderRadios('ns-opts-source',SOURCES,'values_source');
    renderChecks('ns-opts-values',VALUES,'values',3);
    renderRadios('ns-opts-goal',GOALS,'parent_goal');
    renderChecks('ns-opts-interests',INTERESTS,'interests',3);
    renderRadios('ns-opts-reward',REWARDS,'fav_reward');
    renderRadios('ns-opts-tuition',YESNO,'takes_tuitions');
    renderRadios('ns-opts-family',FAMILY,'family_type');
    renderRadios('ns-opts-screen',SCREEN,'screen_time');
    renderRadios('ns-opts-outdoor',OUTDOOR,'outdoor_time');
    renderTopValue();

    var photoInput=$('ns-photo-input'), photoPrev=$('ns-photo-prev'), photoClear=$('ns-photo-clear'), photoPick=$('ns-photo-pick');
    if(photoPick) photoPick.onclick=function(){ photoInput.click(); };
    if(photoClear) photoClear.onclick=function(){ Q.child_photo=null; photoPrev.textContent='\u2b50'; photoClear.style.display='none'; photoInput.value=''; };
    if(photoInput) photoInput.onchange=function(){
      var f=photoInput.files && photoInput.files[0]; if(!f) return;
      var rd=new FileReader();
      rd.onload=function(){
        var img=new Image();
        img.onload=function(){
          var max=256, s=Math.min(max/img.width,max/img.height,1);
          var cv=document.createElement('canvas'); cv.width=Math.round(img.width*s); cv.height=Math.round(img.height*s);
          cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
          Q.child_photo=cv.toDataURL('image/jpeg',0.82);
          photoPrev.innerHTML='<img src="'+Q.child_photo+'" alt="">';
          photoClear.style.display='inline';
        };
        img.src=rd.result;
      };
      rd.readAsDataURL(f);
    };

    var PAGES=['ns-p1','ns-p2','ns-p3','ns-p4','ns-p5','ns-p6','ns-hp','ns-c1','ns-c2','ns-t1','ns-t2'];
    function hideAll(){ ['ns-ob-consent','ns-ob-pin','ns-ob-done'].concat(PAGES).forEach(function(x){ var e=$(x); if(e) e.style.display='none'; }); }
    function visiblePage(){ for(var i=0;i<PAGES.length;i++){ var e=$(PAGES[i]); if(e && e.style.display!=='none') return PAGES[i]; } return null; }
    function showCard(id){
      hideAll();
      var el=$(id); if(!el) return;
      if(id==='ns-p5') renderTopValue();
      if(id==='ns-hp'){ var fn=(Q.full_name||'').split(/\s+/)[0]; var ht=$('ns-handoff-title'); if(fn && ht) ht.textContent='Now hand the phone to '+fn+' \ud83c\udf1f'; }
      el.style.display='block';
      var idx=PAGES.indexOf(id), fill=el.querySelector('.ns-progress-fill');
      if(fill && idx>=0) fill.style.width=Math.round((idx+1)/PAGES.length*100)+'%';
      el.classList.remove('ns-in'); void el.offsetWidth; el.classList.add('ns-in');
      window.scrollTo(0,0);
    }
    function back(){
      var cur=visiblePage(), idx=PAGES.indexOf(cur);
      if(idx>0) showCard(PAGES[idx-1]); else showCard('ns-ob-pin');
    }
    function validate(page){
      if(page==='p1'){ Q.full_name=$('ns-full-name').value.trim();
        if(!Q.full_name) return 'Please enter your child\u2019s name.';
        if(!Q.grade) return 'Please pick a class.'; }
      if(page==='p2'){ Q.school=$('ns-school').value.trim();
        if(!Q.board) return 'Please pick a board.'; }
      if(page==='p3'){ if(!Q.fav_subject) return 'Please pick a favourite subject.';
        if(!Q.focus_subject) return 'Please pick a subject that needs attention.'; }
      if(page==='p4'){ if(!Q.values_source) return 'Please choose where character content draws from.';
        if(Q.values.length<2) return 'Please pick at least 2 values.'; }
      if(page==='p5'){ if(!Q.top_value) return 'Please pick the one value that matters most.'; }
      if(page==='c1'){ Q.star_name=$('ns-star-name').value.trim();
        if(!Q.star_name) return 'Please pick a star name.';
        if(Q.interests.length<1) return 'Please pick at least one thing you love.'; }
      if(page==='c2'){ if(!Q.fav_reward) return 'Please pick a favourite reward.'; }
      return null;
    }
    async function finish(){
      var first=(Q.full_name||'').split(/\s+/)[0]||Q.full_name;
      var pd={
        full_name:Q.full_name, grade:Q.grade, board:Q.board, school:Q.school||null,
        fav_subject:Q.fav_subject, focus_subject:Q.focus_subject,
        values_source:Q.values_source, values:Q.values, top_value:Q.top_value,
        parent_goal:Q.parent_goal||null, child_photo:Q.child_photo||null,
        star_name:Q.star_name, interests:Q.interests, fav_reward:Q.fav_reward,
        takes_tuitions:Q.takes_tuitions||null, family_type:Q.family_type||null,
        screen_time:Q.screen_time||null, outdoor_time:Q.outdoor_time||null
      };
      await saveProfile({ child_name:first, child_class:Q.grade, profile_data:pd });
      hideAll();
      $('ns-ob-done').style.display='block';
      $('ns-done-msg').textContent='Opening '+first+"'s view\u2026";
      setTimeout(enterApp,1300);
    }

    var ob=$('ns-onboard');
    if(ob) ob.addEventListener('click', async function(e){
      var t=e.target; if(!t || t.tagName!=='BUTTON') return;
      var backTo=t.getAttribute('data-back');
      if(backTo!==null){ if(backTo==='consent') showCard('ns-ob-consent'); else back(); return; }
      var page=t.getAttribute('data-page'), next=t.getAttribute('data-next'), fin=t.getAttribute('data-finish');
      if(page===null && next===null && fin===null) return;
      if(page!==null){ clearErr('ns-'+page+'-err'); var msg=validate(page); if(msg){ showErr('ns-'+page+'-err', msg); return; } }
      if(fin!==null){ try{ await finish(); }catch(err){ showErr('ns-t2-err', err.message); } return; }
      if(next!==null) showCard(next);
    });
  })();

  $('ns-pz-logout').onclick=async function(){ try{ await window.sb.auth.signOut(); }catch(e){} location.reload(); };

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