// ============================================================
// NIYAM SHELL (Phase 1 / B1)
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
  #niyam-shell{font-family:system-ui,Segoe UI,Roboto,sans-serif}
  #niyam-shell .ns-screen{position:fixed;inset:0;background:#f4f5f7;z-index:99999;overflow:auto;display:none}
  #niyam-shell .ns-wrap{max-width:460px;margin:0 auto;padding:48px 18px}
  #niyam-shell .ns-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:22px;margin-bottom:16px}
  #niyam-shell h1{font-size:22px;margin:0 0 4px;text-align:center;color:#191a2f}
  #niyam-shell h2{font-size:17px;margin:0 0 12px;color:#1f2937}
  #niyam-shell .ns-sub{color:#6b7280;font-size:14px;margin:0 0 16px;line-height:1.5}
  #niyam-shell label{display:block;font-size:13px;font-weight:600;margin:14px 0 4px;color:#374151}
  #niyam-shell input{width:100%;padding:11px;border:1px solid #d1d5db;border-radius:9px;font-size:16px;box-sizing:border-box}
  #niyam-shell button{border:0;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;padding:12px 16px}
  #niyam-shell .ns-primary{background:#0d9488;color:#fff;width:100%;margin-top:16px}
  #niyam-shell .ns-link{background:none;color:#0d9488;padding:6px;font-size:14px}
  #niyam-shell .ns-err{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-size:13px;padding:10px;border-radius:9px;margin-top:12px;display:none}
  #niyam-shell .ns-step{color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
  #niyam-shell .ns-consent{display:flex;gap:10px;align-items:flex-start;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;font-size:14px;line-height:1.5;color:#374151}
  #niyam-shell .ns-consent input{width:auto;margin-top:3px}
  #niyam-shell .ns-pin{letter-spacing:.5em;text-align:center;font-size:22px}
  #ns-topbtns{position:fixed;top:8px;right:10px;z-index:99998;display:none;gap:8px;align-items:center}
  #ns-logout{background:rgba(25,26,47,.10);color:#374151;border:0;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer}
  #btn-parent-tab{display:none !important;}
  #ns-parent-btn{background:#191a2f;color:#fff;border:0;border-radius:8px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer}
  #ns-parent-zone{position:fixed;inset:0;background:#0f1020;z-index:99997;overflow:auto;display:none}
  #ns-pz-bar{position:sticky;top:0;background:#191a2f;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;box-shadow:0 2px 8px rgba(0,0,0,.3)}
  #ns-pz-bar h1{font-size:18px;margin:0;color:#fff}
  #ns-pz-back{background:rgba(255,255,255,.16);color:#fff;border:0;border-radius:9px;padding:8px 13px;font-size:13px;font-weight:600;cursor:pointer}
  #ns-pz-body{padding:14px;max-width:900px;margin:0 auto}
  #ns-pz-body .tab{display:block !important}
  `;
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var html = `
  <div id="ns-login" class="ns-screen">
   <div class="ns-wrap">
    <h1>NIYAM</h1>
    <p class="ns-sub" style="text-align:center">Small Habits, Big Destiny.</p>
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
     <div class="ns-step">Step 2 of 3</div><h2>Create your Parent PIN</h2>
     <p class="ns-sub">A 4-digit PIN for the Parent Zone. You can change it later.</p>
     <label>4-digit PIN</label><input id="ns-pin1" type="tel" inputmode="numeric" maxlength="4" class="ns-pin" placeholder="****">
     <label>Confirm PIN</label><input id="ns-pin2" type="tel" inputmode="numeric" maxlength="4" class="ns-pin" placeholder="****">
     <button id="ns-pin-next" class="ns-primary">Save PIN</button>
     <div id="ns-pin-err" class="ns-err"></div>
    </div>
    <div id="ns-ob-child" class="ns-card" style="display:none">
     <div class="ns-step">Step 3 of 3</div><h2>Set up your child</h2>
     <p class="ns-sub">Just the basics for now.</p>
     <label>Child's name</label><input id="ns-child-name" type="text" autocomplete="off" placeholder="e.g. Vaanya">
     <label>Class</label><input id="ns-child-class" type="text" autocomplete="off" placeholder="e.g. 6">
     <button id="ns-child-save" class="ns-primary">Save &amp; finish</button>
     <div id="ns-child-err" class="ns-err"></div>
    </div>
    <div id="ns-ob-done" class="ns-card" style="display:none;text-align:center">
     <h2>All set! &#10024;</h2><p class="ns-sub" id="ns-done-msg">Opening the app&#8230;</p>
    </div>
   </div>
  </div>
  <div id="ns-topbtns"><button id="ns-parent-btn">&#128274; Parent</button><button id="ns-logout">Log out</button></div>
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
   <div id="ns-pz-bar"><h1>Parent Zone</h1><button id="ns-pz-back">&#8592; Back to <span id="ns-pz-name">child</span></button></div>
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
    ['ns-ob-consent','ns-ob-pin','ns-ob-child','ns-ob-done'].forEach(function(x){ $(x).style.display='none'; });
    if(!c) $('ns-ob-consent').style.display='block';
    else if(!p) $('ns-ob-pin').style.display='block';
    else $('ns-ob-child').style.display='block';
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
  $('ns-child-save').onclick=async function(){ clearErr('ns-child-err');
    var name=$('ns-child-name').value.trim();
    if(!name) return showErr('ns-child-err','Please enter your child\u2019s name.');
    try{
      await saveProfile({ child_name:name, child_class:$('ns-child-class').value.trim() });
      ['ns-ob-consent','ns-ob-pin','ns-ob-child'].forEach(function(x){ $(x).style.display='none'; });
      $('ns-ob-done').style.display='block';
      $('ns-done-msg').textContent='Opening '+name+"'s view\u2026";
      setTimeout(enterApp, 1300);
    }catch(e){ showErr('ns-child-err', e.message); }
  };

  $('ns-logout').onclick=async function(){ try{ await window.sb.auth.signOut(); }catch(e){} location.reload(); };

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
