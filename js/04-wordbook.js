// ════════════════════════════════════════════
// PARENT RESET SECTION
// ════════════════════════════════════════════
let resetCurrentDate = null;

function openManagePinModal(){
  // Use main PIN modal but with manage-specific callback
  pinBuf=''; updatePinDots();
  document.getElementById('pin-err').textContent='';
  window._pinCallback = ()=>{
    // Unlock the manage section
    const wall    = document.getElementById('manage-locked-wall');
    const content = document.getElementById('manage-content');
    if(wall)    wall.style.display    = 'none';
    if(content) content.style.display = 'block';
    populateResetDatePicker();
    toast('Manage section unlocked 🔓');
  };
  document.getElementById('pin-overlay').classList.add('show');
  setTimeout(focusPinInput, 200);
}

function populateResetDatePicker(){
  const sel = document.getElementById('reset-date-sel');
  if(!sel) return;
  // Clear and repopulate with approved days only
  sel.innerHTML = '<option value="">— Choose a date —</option>';
  const approved = [...savedDays]
    .filter(d => d.approved === true)
    .sort((a,b) => new Date(b.date) - new Date(a.date));
  approved.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.date;
    opt.textContent = fmtDate(d.date) + '  (' + (d.pts||0) + ' pts)';
    sel.appendChild(opt);
  });
}

function loadResetReport(date){
  resetCurrentDate = date;
  closeResetConfirm();
  // Hide result messages
  const dm = document.getElementById('reset-msg-deleted');
  const em = document.getElementById('reset-msg-edited');
  if(dm){ dm.style.display='none'; }
  if(em){ em.style.display='none'; }

  const noRpt = document.getElementById('reset-no-report');
  const rptView = document.getElementById('reset-report-view');
  if(!date){
    if(noRpt) noRpt.style.display='block';
    if(rptView) rptView.style.display='none';
    return;
  }

  const d = savedDays.find(x => x.date === date);
  if(!d){
    if(noRpt) noRpt.style.display='block';
    if(rptView) rptView.style.display='none';
    return;
  }

  if(noRpt) noRpt.style.display='none';
  if(rptView) rptView.style.display='block';

  // Fill date + pts
  const dateEl = document.getElementById('rrv-date');
  if(dateEl) dateEl.textContent = fmtDate(d.date);
  const ptsEl = document.getElementById('rrv-pts');
  if(ptsEl) ptsEl.textContent = d.pts || 0;

  // Status badge
  const badge = document.getElementById('rrv-status-badge');
  if(badge){
    if(d.approved){
      badge.innerHTML = '<span style="background:#ECFDF5;color:#065F46;border:1px solid #6EE7B7;border-radius:10px;padding:3px 10px;font-size:11px;font-weight:800">✅ Approved</span>';
    } else {
      badge.innerHTML = '<span style="background:#FFFBEB;color:#92400E;border:1px solid #FCD34D;border-radius:10px;padding:3px 10px;font-size:11px;font-weight:800">⏳ Under Review</span>';
    }
  }

  // Tasks
  const tasks = document.getElementById('rrv-tasks');
  if(tasks){
    const items = [
      {icon:'🧠', label:'Brain Lab', done: !!d.brainD, sub: !!d.brainD?'done':'missed'},
      {icon:'🕉️', label:'Shloka',    done: !!d.shlokaD, sub: !!d.shlokaD?'done':'missed'},
      {icon:'🎨', label:'Creative',  done: !!d.creativeD, sub: !!d.creativeD?'done':'missed'},
    ];
    tasks.innerHTML = items.map(t=>`
      <div style="background:${t.done?'#ECFDF5':'#F9FAFB'};
        border:1px solid ${t.done?'#6EE7B7':'#E5E7EB'};
        border-radius:12px;padding:10px 8px;text-align:center">
        <div style="font-size:18px;margin-bottom:4px">${t.icon}</div>
        <div style="font-size:10px;font-weight:800;color:${t.done?'#065F46':'#6B7280'}">${t.label}</div>
        <div style="font-size:9px;color:${t.done?'#10B981':'#9CA3AF'};margin-top:2px">${t.sub}</div>
      </div>`).join('');
  }

  // Comment
  const cWrap = document.getElementById('rrv-comment-wrap');
  const cEl   = document.getElementById('rrv-comment');
  if(d.parentComment && d.parentComment.trim().length > 0){
    if(cWrap) cWrap.style.display = 'block';
    if(cEl)   cEl.textContent = '"' + d.parentComment + '"';
  } else {
    if(cWrap) cWrap.style.display = 'none';
  }

  // Pre-fill confirm pts
  const dp = document.getElementById('confirm-delete-pts');
  if(dp) dp.textContent = (d.pts||0) + ' pts';
  const ep = document.getElementById('confirm-edit-pts');
  if(ep) ep.textContent = (d.pts||0);
}

function showResetConfirm(type){
  const del = document.getElementById('reset-confirm-delete');
  const edt = document.getElementById('reset-confirm-edit');
  if(del) del.style.display = type==='delete' ? 'block' : 'none';
  if(edt) edt.style.display = type==='edit'   ? 'block' : 'none';
}

function closeResetConfirm(){
  const del = document.getElementById('reset-confirm-delete');
  const edt = document.getElementById('reset-confirm-edit');
  if(del) del.style.display='none';
  if(edt) edt.style.display='none';
}

async function doResetDelete(){
  if(!resetCurrentDate) return;
  const d = savedDays.find(x => x.date === resetCurrentDate);
  const pts = d ? (d.pts||0) : 0;
  const dateLabel = d ? fmtDate(d.date) : resetCurrentDate;

  // 1. Delete from Supabase
  try{
    await _supabase.from('daily_reports').delete().eq('date', resetCurrentDate);
  }catch(e){ console.error('Delete error:', e); }

  // 2. Remove from savedDays
  savedDays = savedDays.filter(x => x.date !== resetCurrentDate);
  updateTopBar();

  // 3. Repopulate picker
  populateResetDatePicker();
  document.getElementById('reset-date-sel').value = '';

  // 4. Hide view, show success
  closeResetConfirm();
  document.getElementById('reset-report-view').style.display = 'none';
  document.getElementById('reset-no-report').style.display = 'block';
  document.getElementById('reset-no-report').innerHTML = '✅ Entry for ' + dateLabel + ' deleted. ' + pts + ' pts removed from bank. Day is now unlocked for a fresh report.';
  document.getElementById('reset-no-report').style.color = '#065F46';
  document.getElementById('reset-no-report').style.background = '#ECFDF5';
  document.getElementById('reset-no-report').style.borderColor = '#6EE7B7';

  toast('🗑️ Report deleted — ' + pts + ' pts removed from bank.');
  resetCurrentDate = null;

  // Refresh history tab if open
  renderHistory();
}

async function doResetEdit(){
  if(!resetCurrentDate) return;
  const idx = savedDays.findIndex(x => x.date === resetCurrentDate);
  if(idx < 0) return;
  const d = savedDays[idx];
  const dateLabel = fmtDate(d.date);
  const pts = d.pts || 0;

  // 1. Change approved → false in savedDays
  savedDays[idx] = {...d, approved: false};
  updateTopBar();

  // 2. Update Supabase
  try{
    await _supabase.from('daily_reports')
      .update({approved: false})
      .eq('date', resetCurrentDate);
  }catch(e){ console.error('Update error:', e); }

  // 3. Update UI — refresh date picker, reload the card view with new status
  populateResetDatePicker();
  document.getElementById('reset-date-sel').value = '';

  closeResetConfirm();
  document.getElementById('reset-report-view').style.display = 'none';
  document.getElementById('reset-no-report').style.display = 'block';
  document.getElementById('reset-no-report').innerHTML = '✏️ ' + dateLabel + ' moved to Under Review. Vaanya can now edit this entry. ' + pts + ' pts paused until re-approved.';
  document.getElementById('reset-no-report').style.color = '#92400E';
  document.getElementById('reset-no-report').style.background = '#FFF7ED';
  document.getElementById('reset-no-report').style.borderColor = '#FCD34D';

  // Also unlock on the Daily Report page for that date
  toast('✏️ Report reopened for editing — ' + pts + ' pts paused until re-approved.');
  resetCurrentDate = null;

  renderHistory();
}

// ════════════════════════════════════════════
// AURORA LIGHT BEAMS
// ════════════════════════════════════════════
(function initBeams(){
  const canvas = document.getElementById('beam-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const beams = Array.from({length:5},(_,i)=>({
    x: -200 + i*175,
    angle: 20 + i*7,
    speed: 0.28 + i*0.12,
    width: 32 + i*22,
    op: 0.07 + i*0.02,
    col: i%2===0 ? 'rgba(16,185,129,' : 'rgba(59,130,246,'
  }));
  function resize(){ canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    beams.forEach(b=>{
      b.x += b.speed;
      if(b.x > canvas.width + 350) b.x = -350;
      ctx.save();
      ctx.translate(b.x, 0);
      ctx.rotate(b.angle * Math.PI/180);
      const g = ctx.createLinearGradient(0,-60,0,canvas.height+60);
      g.addColorStop(0, b.col+'0)');
      g.addColorStop(0.3, b.col+b.op+')');
      g.addColorStop(0.7, b.col+(b.op*.65)+')');
      g.addColorStop(1, b.col+'0)');
      ctx.fillStyle = g;
      ctx.fillRect(-b.width/2, -220, b.width, canvas.height+440);
      ctx.restore();
    });
    requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(draw);
})();

// ════════════════════════════════════════════
// MOTIVATIONAL QUOTES
// ════════════════════════════════════════════
const QUOTES_R = QUOTES_L; // unified pool — R used only for compat
let qLi=0, qRi=0;

function renderQuote(side, idx){
  if(side==='R') return;
  const q = QUOTES_L[idx % QUOTES_L.length];

  // Accent bar
  const accent = document.getElementById('qL-accent');
  if(accent) accent.style.background = q.accent || 'linear-gradient(90deg,#6366F1,#EC4899)';

  // Panel border colour
  const panel = document.getElementById('quote-panel');
  if(panel) panel.style.borderColor = q.border || '#E0E7FF';

  // Bottom section background tint
  const bottom = document.getElementById('qL-bottom');
  if(bottom) bottom.style.background = q.bg || '#fff';

  // Full-width photo — img fills the entire photo container
  const photoDiv = document.getElementById('qL-photo');
  if(photoDiv){
    if(q.photo && q.photo.startsWith('data:')){
      photoDiv.innerHTML = '<img src="'+q.photo+'" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block">';
    } else {
      photoDiv.innerHTML = '<span style="font-size:56px">'+q.icon+'</span>';
    }
  }

  // Author + tag
  const auth = document.getElementById('qL-author');
  if(auth){ auth.textContent = q.author; auth.style.color = '#1B1034'; }
  const tag = document.getElementById('qL-tag');
  if(tag){ tag.textContent = q.tag; tag.style.color = '#9CA3AF'; }

  // Quote text
  const txt = document.getElementById('qL-text');
  if(txt) txt.textContent = q.text;
}
function nextQuote(side){
  if(side==='L'||side==='R'){ qLi=(qLi+1)%QUOTES_L.length; renderQuote('L',qLi); }
}
function prevQuote(side){
  if(side==='L'||side==='R'){ qLi=(qLi-1+QUOTES_L.length)%QUOTES_L.length; renderQuote('L',qLi); }
}
// Auto-rotate silently every 12 seconds — no user controls
setInterval(()=>nextQuote('L'), 12000);
setTimeout(()=>renderQuote('L',0), 150);

// ════════════════════════════════════════════
// SIDE PANELS — live update
// ════════════════════════════════════════════
const MOODS = [
  [0,   '😴','Fill your report!','#6B7280'],
  [60,  '😟','Keep going!','#EF4444'],
  [130, '😏','Getting there!','#F97316'],
  [200, '🙂','Good going!','#F59E0B'],
  [280, '😊','Well done! 💚','#10B981'],
  [360, '😄','Brilliant! 🌟','#3B82F6'],
  [440, '🤩','AMAZING!! 🌈','#8B5CF6'],
  [500, '🥳','LEGENDARY!! 👑','#EC4899'],
];
const LEVELS = [
  [0,'1','Beginner'],[200,'2','Explorer'],[400,'3','Achiever'],
  [700,'4','Warrior'],[1000,'5','Champion'],[1400,'6','Superstar'],[1800,'7','Legend'],
];
function updateSidePanels(pts){
  const max = (typeof calcMaxPts==='function') ? calcMaxPts().total : 465;
  const pct = Math.min(100, Math.max(0, Math.round(pts/max*100)));

  // LEFT — big points number + bar
  const ptsNum = document.getElementById('sp-pts-num');
  if(ptsNum) ptsNum.textContent = pts;
  const ptsBar = document.getElementById('sp-pts-bar');
  if(ptsBar) ptsBar.style.width = pct+'%';
  const pctLbl = document.getElementById('sp-pct-lbl');
  if(pctLbl) pctLbl.textContent = pts+' / '+max+' pts';

  // LEFT — streak
  const strEl = document.getElementById('sp-streak');
  if(strEl) strEl.textContent = getStreak()+'🔥';

  // RIGHT — mood (big emoji + bold label + sub)
  let mood = MOODS[0];
  for(const m of MOODS) if(pts>=m[0]) mood=m;
  const moodEl = document.getElementById('sp-mood');
  if(moodEl) moodEl.textContent = mood[1];
  const moodLbl = document.getElementById('sp-mood-lbl');
  if(moodLbl){ moodLbl.textContent=mood[2]; moodLbl.style.color=mood[3]; }
  const moodSub = document.getElementById('sp-mood-sub');
  if(moodSub){
    if(pts<=0) moodSub.textContent='Fill your report!';
    else if(pct<30) moodSub.textContent='Keep going, you can do it!';
    else if(pct<60) moodSub.textContent='You are doing great!';
    else if(pct<85) moodSub.textContent='Almost at the top!';
    else moodSub.textContent='Absolutely brilliant today!';
    moodSub.style.color=mood[3];
  }
}

// ════════════════════════════════════════════
// DATE CHANGE — clear form + check if approved
// ════════════════════════════════════════════
function onDateChange(){
  const el = document.getElementById('rpt-date');
  const date = el?.value;
  if(!date) return;

  // Step 1: Save session for the PREVIOUS date (before we switch)
  const prevDate = el.dataset.prev;
  if(prevDate && prevDate !== date && !todayApproved){
    const _prev = savedDays.find(d => d.date === prevDate);
    if(!_prev || !_prev.approved) _sessionSaveForDate(prevDate);
  }

  // Step 2: Clear the form (suppress flag prevents blank session save)
  silentClearDay();

  // Step 3: Update shloka for the new date
  buildShlokaDisplay();

  // Step 4: Load data for selected date
  const existing = savedDays.find(d => d.date === date);

  if(existing && existing.approved){
    loadApprovedDay(existing);
    lockForm(date, existing.pts);
    toast('🔒 '+fmtDate(date)+' — Parent Approved · Read only');
  } else if(existing && !existing.approved){
    // Draft in Supabase — also check session for this specific date
    const sessionSnap = _sessionLoadForDate(date);
    if(sessionSnap){
      const snapAge = Date.now() - (sessionSnap.ts || 0);
      const dbAge   = existing.savedAt ? Date.now() - new Date(existing.savedAt).getTime() : Infinity;
      if(snapAge < dbAge){
        unlockForm();
        _restoreFormFromSnap(sessionSnap);
        toast('✏️ Restored your unsaved work for '+fmtDate(date)+'!');
        return;
      }
    }
    unlockForm();
    loadDraftDay(existing);
    toast('✏️ Draft loaded for '+fmtDate(date)+' — continue where you left off!');
    checkPenalty();
    calcDayPts();
  } else {
    // No Supabase record — check session for this specific date
    const sessionSnap = _sessionLoadForDate(date);
    if(sessionSnap){
      unlockForm();
      _restoreFormFromSnap(sessionSnap);
      toast('✅ Your unsaved work for '+fmtDate(date)+' has been restored!');
    } else {
      unlockForm();
      checkPenalty();
      calcDayPts();
    }
  }
  // Remember current date for next switch
  if(el) el.dataset.prev = date;
}

function silentClearDay(){
  // Suppress session saves while we clear — prevents saving blank state
  _suppressSession = true;
  // Clear without confirm dialog and without resetting date
  const dateVal = document.getElementById('rpt-date')?.value;
  document.querySelectorAll('#tab-report input[type=text],#tab-report input[type=number],#tab-report textarea').forEach(e=>{
    if(e.id!=='rpt-date') e.value='';
  });
  document.querySelectorAll('#tab-report input[type=checkbox]').forEach(e=>e.checked=false);
  document.querySelectorAll('#tab-report select').forEach(e=>{
    if(e.id!=='rpt-date') e.selectedIndex=0;
  });
  // These dropdowns live in #tab-parent (not #tab-report) so must be reset explicitly
  const _shAwd=document.getElementById('shloka-pts-award'); if(_shAwd) _shAwd.selectedIndex=0;
  const _crAwd=document.getElementById('creative-pts-award'); if(_crAwd) _crAwd.selectedIndex=0;
  const _prRat=document.getElementById('parent-rating'); if(_prRat) _prRat.selectedIndex=0;
  PCLS.forEach(cl=>document.querySelectorAll('#tab-report .'+cl).forEach(e=>e.classList.remove(cl)));
  document.querySelectorAll('#tab-report .star').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('#tab-report .creative-option').forEach(o=>o.classList.remove('chosen'));
  const cd=document.getElementById('creative-detail');if(cd)cd.style.display='none';
  const oaDet=document.getElementById('odda-assign-detail');if(oaDet)oaDet.style.display='none';
  const oaRes=document.getElementById('odda-assign-result');if(oaRes)oaRes.innerHTML='';
  document.querySelectorAll('#odda-time .pill, #gym-time .pill').forEach(p=>{p.classList.remove('pg','pr','pa','pb','pt');});
  const tcBox=document.getElementById('test-chapters-box');if(tcBox)tcBox.style.display='none';
  const prPend=document.getElementById('parent-pending-section');if(prPend)prPend.style.display='none'; /* always hidden */
  const prAct=document.getElementById('parent-action-section');if(prAct)prAct.style.display='block';
  const prApp=document.getElementById('approved-section');if(prApp)prApp.style.display='none';
  const freeMsg=document.getElementById('free-act-msg');if(freeMsg)freeMsg.innerHTML='';
  const prRatRes=document.getElementById('parent-rating-result');if(prRatRes)prRatRes.innerHTML='';
  // Clear Geeta tab fields (outside #tab-report)
  const sr=document.getElementById('shloka-reflect');if(sr)sr.value='';
  const ps=document.getElementById('past-shlokas');if(ps)ps.value='';
  checkGeetaSaveReady();

  const skDid=document.getElementById('skill-did');if(skDid)skDid.value='';
  const skPtsSel=document.getElementById('skill-pts-select');if(skPtsSel)skPtsSel.value='';
  const skF=document.getElementById('skill-pts-final');if(skF)skF.style.display='none';
  const skYes=document.getElementById('skill-yes-box');if(skYes)skYes.style.display='none';
  const skNo=document.getElementById('skill-no-msg');if(skNo)skNo.style.display='none';
  creativeChosen=null; brainPtsToday=0; todayApproved=false; aiSkillPts=0;
  sudokuPts=0; logicPtsTotal=0; riddlePtsTotal=0; mathsPtsToday=0; worksheetPts=0;
  sudokuFrozen=false; logicFrozen=false; logicCurrentPuzzles=[]; mathsFrozen=false; mathsChecked=false; mathsSelected=[]; mathsStarted=false; clearInterval(mathsTimerInt); try{sessionStorage.removeItem(MATHS_SESSION_KEY);}catch(e){}
  genSudoku('easy'); genLogicPuzzles(); initMathsSprint();
  reflPts1=0; reflPts2=0; reflPts3=0;
  // Reset geetaProgress to ONLY the permanent mastered store — clears today's inprogress
  // so shloka pts don't phantom-add after a clear
  geetaProgress={};
  try{
    const mastered=JSON.parse(localStorage.getItem('vaanya_geeta_mastered')||'{}');
    Object.entries(mastered).forEach(([id,v])=>{ geetaProgress[id]=v; });
  }catch(e){}
  buildShlokaDisplay(); // refresh Geeta tab to reflect cleared state
  if(dateVal) document.getElementById('rpt-date').value=dateVal;
  calcDayPts();
  // Re-enable session tracking after a short delay
  setTimeout(()=>{ _suppressSession = false; }, 500);
}

function lockForm(date, pts){
  todayApproved=true;
  const mc=document.querySelector('.main-content');
  if(mc) mc.classList.add('form-locked');
  // Date input MUST stay editable so user can navigate to other dates
  const dateInput=document.getElementById('rpt-date');
  if(dateInput){ dateInput.style.pointerEvents='auto'; dateInput.style.opacity='1'; }
  // Brain Lab must always remain interactive (puzzles are independent of report approval)
  const brainTab=document.getElementById('tab-brain');
  if(brainTab){ brainTab.style.pointerEvents='auto'; brainTab.style.opacity='1'; }
  const banner=document.getElementById('locked-banner');
  if(banner){
    banner.classList.add('show');
    const msg=document.getElementById('locked-date-msg');
    if(msg) msg.textContent='Date: '+fmtDate(date)+' · '+pts+' pts approved ✅ · Change date above to fill another day';
  }
  // Hide save/clear buttons
  const btnRow=document.querySelector('#tab-report .btn-row');
  if(btnRow) btnRow.style.display='none';
  // parent-action-section always stays visible (tab is already PIN-gated)
  const prPend=document.getElementById('parent-pending-section');if(prPend)prPend.style.display='none';
}

function unlockForm(){
  todayApproved=false;
  const mc=document.querySelector('.main-content');
  if(mc) mc.classList.remove('form-locked');
  // Restore date input
  const dateInput=document.getElementById('rpt-date');
  if(dateInput){ dateInput.style.pointerEvents=''; dateInput.style.opacity=''; }
  const banner=document.getElementById('locked-banner');
  if(banner) banner.classList.remove('show');
  const btnRow=document.querySelector('#tab-report .btn-row');
  if(btnRow) btnRow.style.display='';
  // parent-action-section always stays visible
  const prPend=document.getElementById('parent-pending-section');
  if(prPend) prPend.style.display='none';
  const prApp=document.getElementById('approved-section');
  if(prApp) prApp.style.display='none';
}

function loadApprovedDay(d){

  if(d.parentComment){ const e=document.getElementById('parent-comment');if(e)e.value=d.parentComment; }
  const appSec=document.getElementById('approved-section');
  if(appSec) appSec.style.display='block';
  const appMsg=document.getElementById('approved-msg');
  if(appMsg) appMsg.textContent='✅ +'+d.pts+' points approved on '+fmtDate(d.date);
  const appTime=document.getElementById('approved-time');
  if(appTime) appTime.textContent='Approved: '+(d.savedAt?new Date(d.savedAt).toLocaleString('en-IN'):'');
}

function loadDraftDay(d){
  // ── Text & select fields ──────────────────────────────────────
  const setVal=(id,val)=>{ if(val!==undefined&&val!==null){ const e=document.getElementById(id);if(e)e.value=val; }};
  setVal('parent-comment', d.parentComment);
  setVal('test-subj',  d.testSubj);
  setVal('test-got',   d.testGot);
  setVal('test-tot',   d.testTot);
  setVal('odda-subj',  d.oddaSubj);
  setVal('gym-today',  d.gymActivity);
  setVal('rpt-tt',     d.ttVal);
  setVal('rpt-school', d.schoolVal);
  setVal('free-act',   d.freeAct);
  setVal('screen-what',d.screenWhat);
  setVal('r1', d.r1); setVal('r2', d.r2); setVal('r3', d.r3);
  setVal('shloka-reflect', d.shlokaReflect);
  setVal('past-shlokas',   d.pastShlokas);
  setVal('creative-desc',  d.creativeDesc);
  setVal('word1',d.word1); setVal('mean1',d.mean1); setVal('exam1',d.exam1||'');
  setVal('word2',d.word2); setVal('mean2',d.mean2); setVal('exam2',d.exam2||'');
  setVal('word3',d.word3); setVal('mean3',d.mean3); setVal('exam3',d.exam3||'');
  if(typeof checkGeetaSaveReady==='function') checkGeetaSaveReady();

  // ── Skill box ─────────────────────────────────────────────────
  if(d.skillDesc){
    setVal('skill-desc', d.skillDesc);
    setVal('skill-did',  d.skillDid||'');
    if(d.skillDid==='yes'){
      const sb=document.getElementById('skill-yes-box');if(sb)sb.style.display='block';
      setVal('skill-pts-select', String(d.skillPtsAwarded||0));
      aiSkillPts=d.skillPtsAwarded||0;
    }
  }

  // ── Book knowledge ───────────────────────────────────────────
  if(d.bookType&&d.bookType!=='0'){
    setVal('book-type', d.bookType);
    if(typeof showWordBoxes==='function') showWordBoxes();
  }
  // ── Test chapters box ─────────────────────────────────────────
  if(d.testSubj){ const tcBox=document.getElementById('test-chapters-box');if(tcBox)tcBox.style.display='block'; }

  // ── Restore pill states — parse from JSON string (saved as string to survive Supabase filter) ──
  const pillStates = (()=>{
    try{
      if(d.pillStatesJSON) return JSON.parse(d.pillStatesJSON);
      if(d.pillStates && typeof d.pillStates==='object') return d.pillStates; // legacy
    }catch(e){}
    return null;
  })();
  if(pillStates){
    Object.entries(pillStates).forEach(([gid,{cls,idx}])=>{
      const grp=document.getElementById(gid);
      if(!grp) return;
      const pills=[...grp.querySelectorAll('.pill')];
      if(pills[idx]){
        pills.forEach(p=>PCLS.forEach(c=>p.classList.remove(c)));
        pills[idx].classList.add(cls);
      }
    });
    const oddaGrp=document.getElementById('odda-assign');
    if(oddaGrp&&oddaGrp.querySelector('.pg')){
      const od=document.getElementById('odda-assign-detail');if(od)od.style.display='block';
    }
  }
  
  // ── Restore ssDone/ssDets — also parse from JSON string ──────────────────
  const ssDone = (()=>{ try{ return d.ssDoneJSON ? JSON.parse(d.ssDoneJSON) : (Array.isArray(d.ssDone)?d.ssDone:null); }catch(e){return null;} })();
  const ssDets = (()=>{ try{ return d.sDetsJSON  ? JSON.parse(d.sDetsJSON)  : (Array.isArray(d.ssDets)?d.ssDets:null); }catch(e){return null;} })();
  if(ssDone) ssDone.forEach((checked,i)=>{ const cb=document.getElementById('ss-'+i);if(cb)cb.checked=!!checked; });
  if(ssDets) ssDets.forEach((txt,i)=>{ const el=document.getElementById('ssdet-'+i);if(el)el.value=txt||''; });
  if(typeof updateSS==='function') updateSS();

  // ── Creative ─────────────────────────────────────────────────
  // Restore timetable block states
  if(d.ttBlockStatesJSON){
    try{ ttBlockStates = JSON.parse(d.ttBlockStatesJSON)||{}; }
    catch(e){ ttBlockStates = {}; }
    if(typeof TT_TEST_MODE !== 'undefined' && TT_TEST_MODE){
      Object.keys(ttBlockStates).forEach(k=>{
        if(ttBlockStates[k]) ttBlockStates[k].markedDone = false;
      });
    }
    ttRender();
    if(typeof ttRenderMiniSchedule==='function') ttRenderMiniSchedule();
    // Sync brain lab pts after restoring state
    setTimeout(()=>{ if(typeof ttSyncBrainLabPts==='function') ttSyncBrainLabPts(); }, 300);
  }

  if(d.creativeChosen){
    creativeChosen=d.creativeChosen;
    document.querySelectorAll('.creative-option').forEach(el=>
      el.classList.toggle('chosen', el.dataset.val===creativeChosen));
    const sel=document.getElementById('creative-activity-select');
    if(sel&&typeof _CREATIVE_MAP!=='undefined'){
      const key=Object.keys(_CREATIVE_MAP).find(k=>_CREATIVE_MAP[k].title===creativeChosen);
      if(key){ sel.value=key; onCreativeSelect(key); }
    } else {
      const cd=document.getElementById('creative-detail');if(cd)cd.style.display='block';
    }
  }

  // ── Parent award dropdowns ────────────────────────────────────
  if(d.shlokaPtsAwarded!==undefined) setVal('shloka-pts-award', String(d.shlokaPtsAwarded));
  // Restore geetaProgress from draft, but NEVER let stale inprogress beat a mastered entry.
  // The permanent mastered store (localStorage) always wins over any draft value.
  if(d.geetaProgress){
    try{
      const draftProg=JSON.parse(d.geetaProgress);
      const permMastered=JSON.parse(localStorage.getItem('vaanya_geeta_mastered')||'{}');
      // Start with draft progress
      geetaProgress={...draftProg};
      // Overwrite with permanent mastered — mastered always wins
      Object.entries(permMastered).forEach(([id,v])=>{
        geetaProgress[id]=v; // mastered from localStorage beats anything in draft
      });
    }catch(e){ geetaProgress={}; }
  }  if(d.creativePtsAwarded!==undefined) setVal('creative-pts-award', String(d.creativePtsAwarded));
  // Only restore parentRating if actually set (non-zero means parent rated)
  if(d.parentRating && d.parentRating !== 0) setVal('parent-rating', String(d.parentRating));
  else { const pr=document.getElementById('parent-rating'); if(pr) pr.selectedIndex=0; }

  // ── Show draft banner ─────────────────────────────────────────
  const mc=document.querySelector('.main-content');
  if(mc){
    const old=mc.querySelector('.draft-info-bar');if(old)old.remove();
    const bar=document.createElement('div');
    bar.className='draft-info-bar';
    bar.style.cssText='background:#FFFBEB;border:1.5px solid #FCD34D;border-radius:10px;padding:10px 14px;margin-bottom:10px;font-size:12px;font-weight:800;color:#92400E;display:flex;align-items:center;gap:8px';
    bar.innerHTML='⏳ Draft from '+fmtDate(d.date)+' loaded — continue editing and save anytime!';
    mc.prepend(bar);
  }

  // ── Restore brain lab pts variables (so score survives refresh) ──
  if(d.savedSudokuPts    !== undefined) sudokuPts       = d.savedSudokuPts;
  if(d.savedLogicPts !== undefined){ logicPtsTotal = d.savedLogicPts; if(d.savedLogicPts > 0){ logicFrozen = true; } }
  if(d.savedMathsPts     !== undefined){ mathsPtsToday = d.savedMathsPts; if(d.savedMathsPts>0){ mathsFrozen=true; mathsChecked=true; } }
  if(d.savedRiddlePts    !== undefined) riddlePtsTotal  = d.savedRiddlePts;
  if(d.savedWorksheetPts !== undefined) worksheetPts    = d.savedWorksheetPts;
  if(d.savedWsAnswered){
    try{ Object.assign(_wsAnswered, JSON.parse(d.savedWsAnswered)); }catch(e){}
  }
  // ── Restore sudoku freeze state ──────────────────────────────
  if(d.savedSudokuFrozen === true || (d.savedSudokuPts > 0 && d.savedSudokuFrozen !== false)){
    sudokuFrozen = false; // reset so freezeSudoku() can run
    freezeSudoku();
  }
  brainPtsToday = sudokuPts + logicPtsTotal + riddlePtsTotal + mathsPtsToday + worksheetPts;
  updateBrainDisplay();

  // ── Recalculate from restored data ───────────────────────────
  if(typeof checkPenalty==='function') checkPenalty();
  calcDayPts();
}

// ════════════════════════════════════════════
// PARENT TAB — PIN GATE
// ════════════════════════════════════════════
function showParentTabWithPin(btn){
  if(parentUnlocked){
    // Already authenticated this session — go straight in
    showTab('parent', btn);
    renderPendingQueue();
    renderParentTab();
    renderParentShlokaMgmt();
    return;
  }
  // Show tab but display locked wall
  showTab('parent', btn);
  const wall = document.getElementById('parent-locked-wall');
  const content = document.getElementById('parent-content');
  if(wall) wall.style.display='block';
  if(content) content.style.display='none';
}

function openPinModalParent(){
  pinBuf=''; updatePinDots();
  document.getElementById('pin-err').textContent='';
  // Override pinSubmit temporarily to unlock parent content
  window._pinCallback = ()=>{
    parentUnlocked = true;
    const wall = document.getElementById('parent-locked-wall');
    const content = document.getElementById('parent-content');
    if(wall) wall.style.display='none';
    if(content) content.style.display='block';
    renderPendingQueue();
    renderParentTab();
    renderParentShlokaMgmt();
    toast('Welcome! Review Vaanya report 📋');
  };
  document.getElementById('pin-overlay').classList.add('show');
  setTimeout(focusPinInput, 200);
}

// ════════════════════════════════════════════
// PENDING APPROVALS QUEUE
// ════════════════════════════════════════════
let _pendingReviewDate = null; // date currently loaded for review in parent tab

function renderPendingQueue(){
  const pending = savedDays.filter(d => d.approved !== true);
  const sec = document.getElementById('pending-queue-sec');
  const badge = document.getElementById('pending-count-badge');
  const cards = document.getElementById('pending-date-cards');
  if(!sec) return;

  if(!pending.length){
    sec.style.display = 'none';
    return;
  }
  // Show the accordion and auto-open it so parents see it immediately
  sec.style.display = 'block';
  if(!sec.classList.contains('pr-open')) sec.classList.add('pr-open');
  if(badge){
    badge.textContent = pending.length + ' pending';
    // Pulse the badge amber when there are reports waiting
    badge.style.background = '#F59E0B';
  }

  if(cards){
    cards.innerHTML = pending.map(d => {
      const isActive = _pendingReviewDate === d.date;
      return `<button onclick="loadPendingForReview('${d.date}')"
        style="background:${isActive?'#F59E0B':'#fff'};color:${isActive?'#fff':'#92400E'};
          border:2px solid ${isActive?'#D97706':'#FCD34D'};border-radius:10px;
          padding:9px 14px;font-size:12px;font-weight:900;cursor:pointer;
          font-family:'Nunito',sans-serif;transition:all .18s;min-width:120px;text-align:left">
        <div style="font-size:10px;opacity:.8;margin-bottom:2px">⏳ Pending</div>
        <div>${fmtDate(d.date)}</div>
        <div style="font-size:13px;font-weight:900;margin-top:3px;color:${isActive?'#fff':'#10B981'}">${d.pts||0} pts</div>
      </button>`;
    }).join('');
  }
}

function loadPendingForReview(date){
  const d = savedDays.find(x => x.date === date);
  if(!d){ toast('Could not find report for ' + date); return; }

  _pendingReviewDate = date;

  // Set the rpt-date input so approveReport() picks it up correctly
  const dateEl = document.getElementById('rpt-date');
  if(dateEl) dateEl.value = date;

  // Load all form fields from saved data
  unlockForm();
  loadDraftDay(d);

  // Show reviewing bar
  const bar = document.getElementById('pending-reviewing-bar');
  const lbl = document.getElementById('pending-reviewing-date');
  const summary = document.getElementById('pending-report-summary');
  const chips = document.getElementById('pending-summary-chips');
  if(bar){ bar.style.display = 'flex'; }
  if(lbl){ lbl.textContent = fmtDate(date) + ' · ' + (d.pts||0) + ' pts'; }

  // Build summary chips
  if(chips){
    const items = [
      d.ttVal && d.ttVal !== '0'  ? '📅 Timetable: ' + d.ttVal + ' pts' : null,
      d.testGot && d.testTot      ? '📝 Test: ' + d.testGot + '/' + d.testTot : null,
      (d.savedSudokuPts||0) + (d.savedLogicPts||0) + (d.savedRiddlePts||0) + (d.savedMathsPts||0) > 0
        ? '🧠 Brain: ' + ((d.savedSudokuPts||0)+(d.savedLogicPts||0)+(d.savedRiddlePts||0)+(d.savedMathsPts||0)) + ' pts' : null,
      d.shlokaReflect             ? '🕉️ Shloka filled' : null,
      d.creativeChosen            ? '🎨 Creative: ' + d.creativeChosen : null,
      d.parentComment             ? '💬 Comment: "' + d.parentComment.substring(0,40) + (d.parentComment.length>40?'…':'"') : null,
    ].filter(Boolean);
    chips.innerHTML = items.map(t =>
      `<span style="font-size:11px;font-weight:800;padding:4px 10px;border-radius:20px;
        background:#FFFBEB;color:#92400E;border:1.5px solid #FDE68A">${t}</span>`
    ).join('');
  }
  if(summary) summary.style.display = 'block';

  // Refresh the date cards to highlight active
  renderPendingQueue();
  // Scroll to top of parent content
  document.getElementById('parent-content')?.scrollIntoView({behavior:'smooth', block:'start'});
  // Refresh renderParentTab to show loaded data
  renderParentTab();
  toast('📋 Loaded ' + fmtDate(date) + ' — review and Approve or Reject below ⬇️');
}

async function approvePendingReport(){
  if(!_pendingReviewDate){ toast('No pending report selected.'); return; }
  // approveReport() already reads from rpt-date which we set in loadPendingForReview
  await approveReport();
  // After approval, clean up queue
  _pendingReviewDate = null;
  const bar = document.getElementById('pending-reviewing-bar');
  const summary = document.getElementById('pending-report-summary');
  if(bar) bar.style.display = 'none';
  if(summary) summary.style.display = 'none';
  renderPendingQueue();
}

async function rejectPendingReport(){
  if(!_pendingReviewDate){ toast('No pending report selected.'); return; }
  await rejectReport();
  _pendingReviewDate = null;
  const bar = document.getElementById('pending-reviewing-bar');
  const summary = document.getElementById('pending-report-summary');
  if(bar) bar.style.display = 'none';
  if(summary) summary.style.display = 'none';
  renderPendingQueue();
}
// ── Parent Shloka Status Manager ──────────────────────────────────────────────
function renderParentShlokaMgmt(){
  const el=document.getElementById('parent-shloka-mgmt-content');
  if(!el) return;
  const masteredList=SHLOKAS.filter(s=>geetaProgress[s.id]&&geetaProgress[s.id].status==='mastered');
  const relearningList=SHLOKAS.filter(s=>geetaProgress[s.id]&&geetaProgress[s.id].status==='relearning');
  const inProgressList=SHLOKAS.filter(s=>{
    const p=geetaProgress[s.id];
    if(!p||p.status!=='inprogress') return false;
    const dayRec=savedDays.find(d=>d.date===p.date);
    return !(dayRec&&dayRec.approved===true); // exclude ghost inprogress
  });
  if(!masteredList.length&&!relearningList.length&&!inProgressList.length){
    el.innerHTML='<div style="font-size:12px;color:#9CA3AF;text-align:center;padding:8px">No shlokas started yet.</div>';
    return;
  }
  let html='';
  if(inProgressList.length){
    html+='<div style="font-size:11px;font-weight:900;color:#92400E;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">📖 Currently Learning</div>';
    html+=inProgressList.map(s=>{
      const prog=geetaProgress[s.id];
      return '<div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:#FFFBEB;border-radius:10px;margin-bottom:5px;border:1.5px solid #FCD34D">'
        +'<div style="font-size:16px">📖</div>'
        +'<div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:900;color:#92400E">'+s.chapter+'</div>'
        +'<div style="font-size:10px;color:#78350F">'+s.chapterMeaning+'</div>'
        +(prog.date?'<div style="font-size:10px;color:#9CA3AF">since '+fmtDate(prog.date)+'</div>':'')+'</div>'
        +'<span style="font-size:9px;font-weight:900;padding:2px 8px;border-radius:50px;background:#FFFBEB;color:#92400E;border:1px solid #FCD34D;flex-shrink:0">10 pts</span></div>';
    }).join('');
  }
  if(masteredList.length){
    html+='<div style="font-size:11px;font-weight:900;color:#065F46;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;'+(inProgressList.length?'margin-top:12px;':'')+'">✅ Mastered ('+masteredList.length+')</div>';
    html+=masteredList.map(s=>{
      const prog=geetaProgress[s.id];
      return '<div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:#ECFDF5;border-radius:10px;margin-bottom:5px;border:1.5px solid #6EE7B7">'
        +'<div style="font-size:16px">✅</div>'
        +'<div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:900;color:#065F46">'+s.chapter+'</div>'
        +'<div style="font-size:10px;color:#047857">'+s.chapterMeaning+'</div>'
        +(prog.date?'<div style="font-size:10px;color:#9CA3AF">mastered '+fmtDate(prog.date)+'</div>':'')+'</div>'
        +'<button onclick="_moveToRelearning(\''+s.id+'\')" style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:8px;font-size:10px;cursor:pointer;color:#1D4ED8;padding:6px 10px;flex-shrink:0;font-weight:900;font-family:\'Nunito\',sans-serif;white-space:nowrap;line-height:1.4">🔄 Move to<br>Relearning</button>'
        +'</div>';
    }).join('');
  }
  if(relearningList.length){
    html+='<div style="font-size:11px;font-weight:900;color:#1D4ED8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;'+((masteredList.length||inProgressList.length)?'margin-top:12px;':'')+'">🔄 Relearning ('+relearningList.length+')</div>';
    html+=relearningList.map(s=>{
      const prog=geetaProgress[s.id];
      return '<div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:#EFF6FF;border-radius:10px;margin-bottom:5px;border:1.5px solid #93C5FD">'
        +'<div style="font-size:16px">🔄</div>'
        +'<div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:900;color:#1D4ED8">'+s.chapter+'</div>'
        +'<div style="font-size:10px;color:#1E3A8A">'+s.chapterMeaning+'</div>'
        +(prog.date?'<div style="font-size:10px;color:#9CA3AF">relearning since '+fmtDate(prog.date)+'</div>':'')+'</div>'
        +'<button onclick="_parentApproveShloka(\''+s.id+'\')" style="background:linear-gradient(135deg,#065F46,#10B981);color:#fff;border:none;border-radius:8px;font-size:10px;cursor:pointer;padding:6px 10px;font-weight:900;font-family:\'Nunito\',sans-serif;white-space:nowrap;line-height:1.4">✅ Re-<br>Master</button>'
        +'</div>';
    }).join('');
  }
  el.innerHTML=html;
}

// ════════════════════════════════════════════
// MY WORDBOOK — Full JS
// ════════════════════════════════════════════
let wbWords = []; // in-memory cache from Supabase
let wbFilter_ = 'all';
let wbSearch_ = '';

// THE LEXICON GUILD — 5 levels, 100 words each, max 500
const WB_LEVELS = [
  {min:0,   max:100, level:1, title:'The Initiate',        badge:'🪶', color:'#C0392B',
   desc:'A newcomer to the archives — just beginning the journey of words.',
   svg:'<circle cx="36" cy="36" r="33" fill="%231a0a00" stroke="%23C0392B" stroke-width="3"/><text x="36" y="44" text-anchor="middle" font-size="26" fill="%23C0392B">🪶</text>'},
  {min:100, max:200, level:2, title:'The Scribe',          badge:'✒️', color:'#1A5276',
   desc:'A keeper of knowledge — writing and preserving words with discipline.',
   svg:'<circle cx="36" cy="36" r="33" fill="%231a0a00" stroke="%231A5276" stroke-width="3"/><text x="36" y="44" text-anchor="middle" font-size="26" fill="%231A5276">✒️</text>'},
  {min:200, max:300, level:3, title:'The Cryptographer',   badge:'⚙️', color:'#196F3D',
   desc:'A decoder of language — unlocking hidden meanings and complexities.',
   svg:'<circle cx="36" cy="36" r="33" fill="%231a0a00" stroke="%23196F3D" stroke-width="3"/><text x="36" y="44" text-anchor="middle" font-size="26" fill="%23196F3D">⚙️</text>'},
  {min:300, max:400, level:4, title:'The Rhetoric Elite',  badge:'🦅', color:'#D4AC0D',
   desc:'A master of persuasion — commanding words with power and precision.',
   svg:'<circle cx="36" cy="36" r="33" fill="%231a0a00" stroke="%23D4AC0D" stroke-width="3"/><text x="36" y="44" text-anchor="middle" font-size="26" fill="%23D4AC0D">🦅</text>'},
  {min:400, max:9999,level:5, title:'Chancellor of the Word', badge:'👑', color:'#D4AF37',
   desc:'The supreme guardian of language — sovereign of the entire Lexicon Guild.',
   svg:'<circle cx="36" cy="36" r="33" fill="%231a0a00" stroke="%23D4AF37" stroke-width="3"/><text x="36" y="44" text-anchor="middle" font-size="26" fill="%23D4AF37">👑</text>'},
];

// Pastel card colours by first letter
function wbCardColor(word){
  const ch=(word||'A').toUpperCase().charCodeAt(0);
  if(ch<=69)  return {border:'#818CF8',bg:'#EEF2FF',text:'#3730A3'};  // A–E indigo
  if(ch<=74)  return {border:'#60A5FA',bg:'#EFF6FF',text:'#1D4ED8'};  // F–J blue
  if(ch<=79)  return {border:'#34D399',bg:'#ECFDF5',text:'#065F46'};  // K–O green
  if(ch<=84)  return {border:'#FB923C',bg:'#FFF7ED',text:'#92400E'};  // P–T orange
  return       {border:'#F472B6',bg:'#FDF4FF',text:'#86198F'};        // U–Z pink
}

// ── Load all words from Supabase ──────────────────────────────
async function wbLoad(){
  const list=document.getElementById('wb-list');

  // Show loading state immediately
  if(list) list.innerHTML='<div style="text-align:center;padding:30px;color:#059669;font-size:13px;font-weight:800">⏳ Loading your WordBook...</div>';

  // Wait for Supabase to be ready (max 5 seconds)
  if(!_supabase){
    if(list) list.innerHTML='<div style="text-align:center;padding:30px;color:#EF4444;font-size:12px;font-weight:700">⚠️ Not connected to cloud.</div>';
    return;
  }

  // If dbReady is false, wait up to 5s for it
  let waited=0;
  while(typeof dbReady!=='undefined' && !dbReady && waited<5000){
    await new Promise(r=>setTimeout(r,200));
    waited+=200;
  }

  try{
    const {data,error}=await _supabase
      .from('vaanya_wordbook')
      .select('*')
      .order('id',{ascending:false}); // order by id (most recently inserted first)

    if(error){
      console.warn('WordBook load error',error);
      if(list) list.innerHTML='<div style="background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:12px;padding:16px;font-size:12px;font-weight:700;color:#B91C1C">'
        +'⚠️ Error loading WordBook: '+error.message+'<br><br>'
        +'If table is missing, run this SQL in Supabase → SQL Editor:<br>'
        +'<code style="background:#fff;padding:8px;border-radius:6px;display:block;font-size:10px;margin-top:6px;white-space:pre-wrap;border:1px solid #FCA5A5">'
        +'create table vaanya_wordbook (id bigint generated always as identity primary key, word text not null, meaning text not null, example text not null, date_added date default current_date, source text default \'daily_report\');\n'
        +'alter table vaanya_wordbook enable row level security;\n'
        +'create policy "allow all" on vaanya_wordbook for all using (true) with check (true);'
        +'</code></div>';
      return;
    }

    wbWords = data || [];
    console.log('WordBook loaded:', wbWords.length, 'words');
    wbRender();
    wbUpdateGamification();

  }catch(e){
    console.warn('WordBook exception',e);
    if(list) list.innerHTML='<div style="text-align:center;padding:30px;color:#EF4444;font-size:12px;font-weight:700">⚠️ Failed to load: '+e.message+'</div>';
  }
}

// ── Save a single word to Supabase ───────────────────────────
async function wbSaveToSupabase(word,meaning,example,source){
  if(!_supabase) return null;
  const today=new Date(Date.now()+5.5*60*60000).toISOString().split('T')[0];
  try{
    const {data,error}=await _supabase
      .from('vaanya_wordbook')
      .insert([{word:word.trim(),meaning:meaning.trim(),example:example.trim(),date_added:today,source:source||'daily_report'}])
      .select();
    if(error){
      console.warn('WordBook save error',error.message,error.code);
      if(error.code==='42P01') toast('⚠️ WordBook table missing in Supabase — see My WordBook tab for setup instructions.');
      else toast('⚠️ Save failed: '+error.message);
      return null;
    }
    return data?.[0]||null;
  }catch(e){ console.warn('WordBook save exception',e); return null; }
}

// ── Update a word in Supabase ────────────────────────────────
async function wbUpdateInSupabase(id,word,meaning,example){
  if(!_supabase) return false;
  const {error}=await _supabase
    .from('vaanya_wordbook')
    .update({word:word.trim(),meaning:meaning.trim(),example:example.trim()})
    .eq('id',id);
  return !error;
}

// ── Add word from WordBook tab ───────────────────────────────
async function wbAddWord(){
  const word   =(document.getElementById('wb-new-word')?.value||'').trim();
  const meaning=(document.getElementById('wb-new-meaning')?.value||'').trim();
  const example=(document.getElementById('wb-new-example')?.value||'').trim();
  if(!word){   toast('⚠️ Please enter a word.'); return; }
  if(!meaning){ toast('⚠️ Please enter the meaning.'); return; }
  if(!example){ toast('⚠️ Please add an example sentence — it helps remember words!'); return; }
  // Check duplicate
  if(wbWords.some(w=>w.word.toLowerCase()===word.toLowerCase())){
    toast('📖 "'+word+'" is already in your WordBook!'); return;
  }
  const saved=await wbSaveToSupabase(word,meaning,example,'manual');
  if(saved){
    wbWords.unshift(saved);
    document.getElementById('wb-new-word').value='';
    document.getElementById('wb-new-meaning').value='';
    document.getElementById('wb-new-example').value='';
    wbRender(); wbUpdateGamification();
    toast('✨ "'+word+'" added to your WordBook! 📖');
  } else {
    toast('⚠️ Could not save — please check connection.');
  }
}

// ── Save words from Reading Today section ────────────────────
async function saveWordsToWordBook(){
  const btn=document.getElementById('save-wordbook-btn');
  const lbl=document.getElementById('save-wordbook-label');
  const status=document.getElementById('save-wordbook-status');
  if(btn){ btn.disabled=true; btn.style.opacity='.7'; }
  if(lbl) lbl.textContent='Saving…';

  const words=[
    {w:(document.getElementById('word1')?.value||'').trim(), m:(document.getElementById('mean1')?.value||'').trim(), e:(document.getElementById('exam1')?.value||'').trim()},
    {w:(document.getElementById('word2')?.value||'').trim(), m:(document.getElementById('mean2')?.value||'').trim(), e:(document.getElementById('exam2')?.value||'').trim()},
    {w:(document.getElementById('word3')?.value||'').trim(), m:(document.getElementById('mean3')?.value||'').trim(), e:(document.getElementById('exam3')?.value||'').trim()},
  ].filter(x=>x.w&&x.m&&x.e);

  if(!words.length){
    toast('⚠️ Fill Word + Meaning + Example sentence to save.');
    if(btn){ btn.disabled=false; btn.style.opacity='1'; }
    if(lbl) lbl.textContent='Save to My WordBook';
    return;
  }

  let saved=0, skipped=0;
  for(const item of words){
    if(wbWords.some(w=>w.word.toLowerCase()===item.w.toLowerCase())){
      skipped++; continue;
    }
    const result=await wbSaveToSupabase(item.w,item.m,item.e,'daily_report');
    if(result){ wbWords.unshift(result); saved++; }
  }

  wbRender(); wbUpdateGamification();

  if(btn){ btn.disabled=false; btn.style.opacity='1'; }
  if(lbl) lbl.textContent='✅ Saved!';
  if(status){
    const parts=[];
    if(saved)   parts.push(saved+' word'+(saved>1?'s':'')+' saved!');
    if(skipped) parts.push(skipped+' already in WordBook.');
    status.textContent=parts.join(' ');
    setTimeout(()=>{ status.textContent=''; if(lbl) lbl.textContent='Save to My WordBook'; },4000);
  }
  toast('📖 '+saved+' word'+(saved!==1?'s':'')+' added to your WordBook! 🌟');
}

// ── Check which words are saveable → show/hide Save button ───
function checkWordSaved(){
  const words=[
    {w:(document.getElementById('word1')?.value||'').trim(), m:(document.getElementById('mean1')?.value||'').trim(), e:(document.getElementById('exam1')?.value||'').trim()},
    {w:(document.getElementById('word2')?.value||'').trim(), m:(document.getElementById('mean2')?.value||'').trim(), e:(document.getElementById('exam2')?.value||'').trim()},
    {w:(document.getElementById('word3')?.value||'').trim(), m:(document.getElementById('mean3')?.value||'').trim(), e:(document.getElementById('exam3')?.value||'').trim()},
  ];
  const ready=words.filter(x=>x.w&&x.m&&x.e).length;
  const wrap=document.getElementById('save-wordbook-wrap');
  if(wrap) wrap.style.display=ready>0?'block':'none';
  const lbl=document.getElementById('save-wordbook-label');
  if(lbl) lbl.textContent='Save '+ready+' Word'+(ready!==1?'s':'')+' to My WordBook';
}

// ── Delete a single word ──────────────────────────────────────
async function wbDeleteWord(id, wordText){
  const confirmed = window.confirm('🗑️ Delete "' + wordText + '" from your WordBook?\n\nThis cannot be undone.');
  if(!confirmed) return;
  try{
    if(_supabase){
      const {error} = await _supabase.from('vaanya_wordbook').delete().eq('id', id);
      if(error){ toast('⚠️ Delete failed: ' + error.message); return; }
    }
    wbWords = wbWords.filter(w => String(w.id) !== String(id));
    wbRender();
    wbUpdateGamification();
    toast('🗑️ "' + wordText + '" removed from your WordBook.');
  }catch(e){ toast('⚠️ Delete error: ' + e.message); }
}

function wbToggleAdd(btn){
  const panel=document.getElementById('wb-add-panel');
  const arrow=document.getElementById('wb-add-arrow');
  if(!panel) return;
  const open=panel.style.display==='block';
  panel.style.display=open?'none':'block';
  if(arrow) arrow.textContent=open?'▼':'▲';
  if(btn){
    btn.style.borderRadius=open?'12px':'12px 12px 0 0';
  }
}

// ── Render word table ─────────────────────────────────────────
function wbRender(){
  const list=document.getElementById('wb-list');
  if(!list) return;

  const today=new Date(Date.now()+5.5*60*60000).toISOString().split('T')[0];
  let filtered=[...wbWords];

  if(wbSearch_){
    const q=wbSearch_.toLowerCase();
    filtered=filtered.filter(w=>(w.word||'').toLowerCase().includes(q));
  }
  if(wbFilter_==='today'){
    filtered=filtered.filter(w=>(w.date_added||'').substring(0,10)===today);
  } else if(wbFilter_!=='all'){
    const ranges={A:[65,69],F:[70,74],K:[75,79],P:[80,84],U:[85,122]};
    const r=ranges[wbFilter_];
    if(r) filtered=filtered.filter(w=>{ const ch=(w.word||'A').toUpperCase().charCodeAt(0); return ch>=r[0]&&ch<=r[1]; });
  }

  if(!filtered.length){
    list.innerHTML='<div style="text-align:center;padding:40px;color:#6D28D9;font-size:13px;font-weight:700;background:#F5F3FF;border-radius:12px;border:1.5px solid #C4B5FD">⚔️ '+(wbSearch_?'No words match "'+wbSearch_+'"':wbFilter_==='today'?'No words added today yet!':'The archives await your first word!')+(!wbSearch_?'<br><span style="font-size:11px;color:#8B5CF6">Add words from Reading Today in the Daily Report.</span>':'')+'</div>';
    return;
  }

  const sorted=[...filtered].sort((a,b)=>(a.word||'').localeCompare(b.word||''));
  let html='<div style="overflow-x:auto;border-radius:14px">';
  html+='<table class="wb-tbl"><thead><tr>'
    +'<th style="width:18%">Word</th>'
    +'<th style="width:28%">Meaning</th>'
    +'<th style="width:36%">Example Sentence</th>'
    +'<th style="width:10%">Date</th>'
    +'<th style="width:8%">Actions</th>'
    +'</tr></thead><tbody>';

  let lastLetter='';
  sorted.forEach(w=>{
    const fl=(w.word||'?')[0].toUpperCase();
    if(fl!==lastLetter){
      html+='<tr><td colspan="5" class="wb-alpha-hdr">'+fl+'</td></tr>';
      lastLetter=fl;
    }
    const dateShort=(w.date_added||'').substring(0,10);
    const src=w.source==='manual'?'\u270F\uFE0F':'\uD83D\uDCDA';
    html+='<tr>'
      +'<td class="wb-word-cell">'+wbHighlight(w.word||'')+'<div class="wb-src">'+src+' '+dateShort+'</div></td>'
      +'<td style="color:#1E1B4B;font-weight:700">'+wbHighlight(w.meaning||'')+'</td>'
      +'<td style="color:#4C3A8A;font-style:italic;font-size:11px">'+wbHighlight(w.example||'')+'</td>'
      +'<td style="color:#A78BFA;font-size:10px;white-space:nowrap">'+dateShort+'</td>'
      +'<td style="white-space:nowrap">'
        +'<button class="wb-edit-btn" onclick="wbOpenEdit(\''+w.id+'\')">✏️</button>'
        +'<button class="wb-del-btn" onclick="wbDeleteWord(\''+w.id+'\',\''+((w.word||'').replace(/'/g,"\'\'"))+'\')">\uD83D\uDDD1</button>'
      +'</td>'
      +'</tr>';
  });

  html+='</tbody></table></div>';
  html+='<div style="text-align:right;padding:6px 4px;font-size:10px;color:#A78BFA;font-weight:700">'+filtered.length+' word'+(filtered.length!==1?'s':'')+' shown</div>';
  list.innerHTML=html;
}

function wbHighlight(text){
  if(!wbSearch_) return text;
  const re=new RegExp('('+wbSearch_.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
  return text.replace(re,'<mark style="background:#FEF08A;border-radius:3px;padding:0 2px">$1</mark>');
}

// ── Search and filter ─────────────────────────────────────────
function wbSearch(){
  wbSearch_=(document.getElementById('wb-search')?.value||'').trim();
  wbRender();
}
function wbFilter(f,btn){
  wbFilter_=f;
  document.querySelectorAll('.wb-fpill').forEach(p=>p.classList.remove('wb-active'));
  if(btn) btn.classList.add('wb-active');
  wbRender();
}

// ── Gamification update ───────────────────────────────────────
// Real badge images — one per level

// ── Gamification update — Lexicon Guild ──────────────────────
function wbUpdateGamification(){
  const count = wbWords.length;
  const maxWords = 500;
  let currentLevel = WB_LEVELS[0];
  for(let i = WB_LEVELS.length-1; i >= 0; i--){
    if(count >= WB_LEVELS[i].min){ currentLevel = WB_LEVELS[i]; break; }
  }
  const nextLevel = WB_LEVELS.find(l => l.min > currentLevel.min) || null;
  const el = id => document.getElementById(id);

  // Inject SVG badge — full cover fill
  const badgeSvgDiv = el('wb-badge-svg');
  if(badgeSvgDiv){
    const imgStyle = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:0';
    const raw = WB_BADGE_SVGS[currentLevel.level-1] || WB_BADGE_SVGS[0];
    badgeSvgDiv.innerHTML = raw.replace(/style="[^"]*"/, 'style="'+imgStyle+'"');
  }

  if(el('wb-level-title')) el('wb-level-title').textContent = currentLevel.title;
  if(el('wb-level-subtitle')) el('wb-level-subtitle').textContent =
    'Level ' + currentLevel.level + ' · ' +
    (currentLevel.min===0?'1':currentLevel.min+1) + '–' +
    (currentLevel.max===9999?'500':currentLevel.max) + ' Words';
  if(el('wb-word-count')) el('wb-word-count').innerHTML =
    '<span style="background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.4);border-radius:20px;padding:3px 11px;font-size:11px;font-weight:900;color:#fff">'
    + count + ' word' + (count!==1?'s':'') + ' archived</span>';

  if(nextLevel){
    if(el('wb-next-label')) el('wb-next-label').textContent = 'Next rank in';
    if(el('wb-next-count')) el('wb-next-count').textContent = nextLevel.min - count;
  } else {
    if(el('wb-next-label')) el('wb-next-label').textContent = 'Max rank!';
    if(el('wb-next-count')) el('wb-next-count').textContent = '🏆';
  }

  // Master progress bar
  const masterPct = Math.min(100, Math.round(count / maxWords * 100));
  if(el('wb-master-bar')) el('wb-master-bar').style.width = masterPct + '%';
  if(el('wb-total-pct')) el('wb-total-pct').textContent = masterPct + '% (' + count + '/500)';

  // 5 coin badges with connecting arrows between each level
  const row = el('wb-levels-row');
  if(row){
    const items = [];
    WB_LEVELS.forEach((lv, i) => {
      const achieved  = count >= lv.min;
      const isCurrent = currentLevel.level === lv.level;
      const isNext    = !isCurrent && !achieved && (i === 0 || count >= WB_LEVELS[i-1].min);

      // Coin ring colours
      const ringColor  = isCurrent ? '#7C3AED' : achieved ? '#A78BFA' : '#D1D5DB';
      const ringWidth  = isCurrent ? '3px' : '2px';
      const coinBg     = isCurrent ? '#EDE9FE' : achieved ? '#F5F3FF' : '#F9FAFB';
      const opacity    = isCurrent ? '1' : achieved ? '0.82' : '0.38';
      const lvColor    = isCurrent ? '#5B21B6' : achieved ? '#7C3AED' : '#9CA3AF';
      const nameColor  = isCurrent ? '#3B0764' : achieved ? '#6D28D9' : '#6B7280';
      const nameFontSz = '11px';

      // Image — circular, cover fill
      const imgStyle = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:50%';
      const badgeImg = WB_BADGE_SVGS[i].replace(/style="[^"]*"/, 'style="'+imgStyle+'"');

      // Build badge column
      const badge =
        '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;opacity:'+opacity+';cursor:pointer;transition:opacity .2s,transform .2s" '
        +'onmouseenter="this.style.opacity=\'1\';this.style.transform=\'translateY(-3px)\'" '
        +'onmouseleave="this.style.opacity=\''+opacity+'\';this.style.transform=\'none\'">'
          // YOU pill — absolute above coin
          +(isCurrent ? '<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#F59E0B;color:#78350F;font-size:7px;font-weight:900;padding:1px 7px;border-radius:5px;white-space:nowrap;letter-spacing:.04em;z-index:2">YOU</div>' : '')
          // Coin
          +'<div style="width:46px;height:46px;border-radius:50%;border:'+ringWidth+' solid '+ringColor+';background:'+coinBg+';overflow:hidden;flex-shrink:0;">'
            + badgeImg
          +'</div>'
          // Lv label
          +'<div style="font-size:9px;font-weight:900;color:'+lvColor+';line-height:1;margin-top:1px">Lv '+lv.level+'</div>'
          // Badge name
          +'<div style="font-size:'+nameFontSz+';font-weight:900;color:'+nameColor+';text-align:center;line-height:1.25;max-width:72px">'+lv.title+'</div>'
        +'</div>';

      items.push(badge);

      // Arrow connector between badges (not after the last one)
      if(i < WB_LEVELS.length - 1){
        const arrowAchieved = count >= WB_LEVELS[i].min; // current badge achieved
        const arrowColor    = arrowAchieved ? '#A78BFA' : '#D1D5DB';
        const arrowBg       = arrowAchieved ? '#F5F3FF' : '#F9FAFB';
        const arrow =
          '<div style="display:flex;align-items:center;padding-bottom:32px;flex-shrink:0;margin:0 6px">'
            // Dashed line + arrowhead
            +'<div style="display:flex;align-items:center;gap:0">'
              +'<div style="width:18px;height:1.5px;background:'+arrowColor+';border-radius:1px"></div>'
              +'<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">'
                +'<path d="M2 2L8 5L2 8" stroke="'+arrowColor+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
              +'</svg>'
            +'</div>'
          +'</div>';
        items.push(arrow);
      }
    });
    row.innerHTML = items.join('');
  }

  // Update "Lv X of 5" indicator
  const lvBadge = el('wb-lv-badge');
  if(lvBadge) lvBadge.textContent = 'Lv ' + currentLevel.level + ' of 5';

  // Tab button badge
  const tabBtn = document.querySelector('.nb[onclick*="wordbook"]');
  if(tabBtn){
    let badge = tabBtn.querySelector('.wb-tab-badge');
    if(count >= 1){
      if(!badge){ badge=document.createElement('span'); badge.className='wb-tab-badge'; tabBtn.appendChild(badge); }
      badge.textContent = ' ' + currentLevel.badge;
    }
  }
}

// ── Edit word ─────────────────────────────────────────────────
function wbOpenEdit(id){
  const w=wbWords.find(x=>String(x.id)===String(id));
  if(!w) return;
  document.getElementById('wb-edit-id').value=id;
  document.getElementById('wb-edit-word').value=w.word||'';
  document.getElementById('wb-edit-meaning').value=w.meaning||'';
  document.getElementById('wb-edit-example').value=w.example||'';
  document.getElementById('wb-edit-modal').style.display='flex';
}
async function wbSaveEdit(){
  const id=document.getElementById('wb-edit-id').value;
  const word=(document.getElementById('wb-edit-word')?.value||'').trim();
  const meaning=(document.getElementById('wb-edit-meaning')?.value||'').trim();
  const example=(document.getElementById('wb-edit-example')?.value||'').trim();
  if(!word||!meaning||!example){ toast('⚠️ All fields are required.'); return; }
  const ok=await wbUpdateInSupabase(id,word,meaning,example);
  if(ok){
    const idx=wbWords.findIndex(x=>String(x.id)===String(id));
    if(idx>=0) wbWords[idx]={...wbWords[idx],word,meaning,example};
    document.getElementById('wb-edit-modal').style.display='none';
    wbRender();
    toast('✅ Word updated!');
  } else {
    toast('⚠️ Update failed. Please try again.');
  }
}
// Close edit modal on backdrop click
document.addEventListener('click',e=>{
  const modal=document.getElementById('wb-edit-modal');
  if(modal&&e.target===modal) modal.style.display='none';
});
// ════════════════════════════════════════════
function refreshParentSudokuPanel(){
  const badge          = document.getElementById('sudoku-freeze-badge');
  const status         = document.getElementById('parent-sudoku-status');
  const unlockW        = document.getElementById('parent-sudoku-unlock-wrap');
  const unlockedNotice = document.getElementById('parent-sudoku-unlocked-notice');
  const openNotice     = document.getElementById('parent-sudoku-open-notice');
  if(!status) return;

  if(sudokuFrozen){
    if(badge){ badge.textContent='🔒 Locked'; badge.style.background='#FEF2F2'; badge.style.color='#B91C1C'; badge.style.borderColor='#FCA5A5'; }
    const diffLabel = {easy:'Easy',medium:'Medium',hard:'Hard'}[sudokuDifficulty||'easy']||'—';
    status.innerHTML = `Vaanya completed her sudoku attempt today (<b>${sudokuPts} pts</b>, <b>${diffLabel}</b> difficulty).<br>
      <span style="color:#6B7280;font-size:12px">The sudoku is locked. You can grant one more attempt below.</span>`;
    if(unlockW) unlockW.style.display='block';
    if(unlockedNotice) unlockedNotice.style.display='none';
    if(openNotice) openNotice.style.display='none';
  } else if(sudokuPts > 0){
    if(badge){ badge.textContent='🔓 Unlocked'; badge.style.background='#ECFDF5'; badge.style.color='#065F46'; badge.style.borderColor='#6EE7B7'; }
    status.textContent = 'Sudoku is currently unlocked — Vaanya is on her bonus attempt.';
    if(unlockW) unlockW.style.display='none';
    if(unlockedNotice) unlockedNotice.style.display='block';
    if(openNotice) openNotice.style.display='none';
  } else {
    if(badge){ badge.textContent='📖 Not attempted'; badge.style.background='#EFF6FF'; badge.style.color='#1E3A8A'; badge.style.borderColor='#93C5FD'; }
    status.textContent = 'Vaanya has not attempted today\'s sudoku yet. No unlock needed.';
    if(unlockW) unlockW.style.display='none';
    if(unlockedNotice) unlockedNotice.style.display='none';
    if(openNotice) openNotice.style.display='block';
  }
}

function parentUnlockSudoku(){
  unfreezeSudoku();
  saveBrainDraft();           // persist unfrozen state immediately
  refreshParentSudokuPanel();
  toast('🔓 Sudoku unlocked! Vaanya gets one more attempt — will lock again after she checks.');
}

// ════════════════════════════════════════════
function renderParentComments(days){
  const el = document.getElementById('parent-comments-list');
  if(!el) return;

  const commented = days
    .filter(d => d.parentComment && d.parentComment.trim().length > 3)
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10); // last 10 comments

  if(!commented.length){
    el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;
      background:#F0FDF4;border-radius:14px;border:1.5px dashed #6EE7B7">
      💬 No parent comments yet — approve a report with a comment to see it here!
    </div>`;
    return;
  }

  const ratingEmoji = {'-100':'😟','-50':'😐','0':'🙂','25':'😊','50':'😄','80':'🌟'};
  const ratingLabel = {'-100':'Below Average','-50':'Average','0':'Satisfactory','25':'Good','50':'Excellent','80':'Extraordinary'};

  el.innerHTML = commented.map((d,i) => {
    const emoji = ratingEmoji[String(d.parentRating||0)] || '🙂';
    const label = ratingLabel[String(d.parentRating||0)] || '';
    const pts   = d.parentRating || 0;
    const col   = pts > 0 ? '#065F46' : pts < 0 ? '#B91C1C' : '#374151';
    const bg    = pts > 0 ? 'linear-gradient(135deg,#ECFDF5,#F0FDF4)'
                : pts < 0 ? 'linear-gradient(135deg,#FEF2F2,#FFF)'
                : 'linear-gradient(135deg,#F9FAFB,#fff)';
    const border= pts > 0 ? '#6EE7B7' : pts < 0 ? '#FCA5A5' : '#E5E7EB';

    return `<div style="background:${bg};border:2px solid ${border};border-radius:16px;
      padding:16px 18px;margin-bottom:10px;position:relative;overflow:hidden">
      <!-- quote mark decoration -->
      <div style="position:absolute;top:-8px;right:14px;font-size:60px;color:${border};
        font-family:Georgia,serif;line-height:1;pointer-events:none;opacity:.4">"</div>
      <!-- date + rating -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px">
        <div style="font-size:11px;font-weight:800;color:${col}">📅 ${fmtDate(d.date)}</div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:18px">${emoji}</span>
          <span style="font-size:11px;font-weight:900;color:${col};background:rgba(0,0,0,.06);
            padding:3px 10px;border-radius:10px">${label} · ${pts>0?'+':''}${pts} pts</span>
        </div>
      </div>
      <!-- comment text -->
      <div style="font-size:14px;font-weight:700;color:#1E1B4B;line-height:1.7;
        font-style:italic;position:relative">
        "${d.parentComment}"
      </div>
      <div style="font-size:10px;font-weight:800;color:${col};margin-top:10px;
        text-transform:uppercase;letter-spacing:.06em">— Mamma &amp; Papa 💜</div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════
// PER-DATE SESSION SYSTEM (v2 — fixed)
// Key insight: each date gets its OWN session slot.
// Switching dates never overwrites another date's data.
// ════════════════════════════════════════════

function _sessionKey(date){ return 'vaanya_sess_' + date; }

// Save snapshot using collectFormData so pills are always included
function _sessionSaveForDate(date){
  if(!date || _suppressSession) return;
  // Never save session for an approved report — DB is truth, session must not override
  const _existingDay = savedDays.find(d => d.date === date);
  if(_existingDay && _existingDay.approved) return;
  try {
    const pts = calcDayPts();
    const snap = collectFormData(date, pts);
    snap.ts = Date.now();
    sessionStorage.setItem(_sessionKey(date), JSON.stringify(snap));
  } catch(e){ console.warn('Session save failed', e); }
}

// Load snapshot for a specific date (returns null if none)
function _sessionLoadForDate(date){
  if(!date) return null;
  try {
    const raw = sessionStorage.getItem(_sessionKey(date));
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}

// Clear session for a specific date
function _sessionClearDate(date){
  if(date) sessionStorage.removeItem(_sessionKey(date));
}

// Restore form from a snapshot — snapshot IS a collectFormData object so loadDraftDay handles it
function _restoreFormFromSnap(snap){
  if(!snap || !snap.date) return;
  const currentDate = document.getElementById('rpt-date')?.value;
  if(snap.date !== currentDate){
    console.warn('Session date mismatch — skipping restore', snap.date, '!=', currentDate);
    return;
  }
  // Before restoring, silentClear to ensure no stale state
  _suppressSession = true;
  silentClearDay();
  document.getElementById('rpt-date').value = currentDate; // restore date after clear
  _suppressSession = false;
  // loadDraftDay now handles everything: pills, text, creative, skill, etc.
  loadDraftDay(snap);
  // Override the amber banner with a green "restored" banner
  const mc = document.querySelector('.main-content');
  const bar = mc ? mc.querySelector('.draft-info-bar') : null;
  if(bar){
    bar.style.background='#ECFDF5';
    bar.style.borderColor='#6EE7B7';
    bar.style.color='#065F46';
    bar.innerHTML='✅ Your work was restored after the page refreshed — continue where you left off!';
  }
}

// After Supabase loads: decide what to show for today's date
function _onLoadRestoreDate(date){
  const existing = savedDays.find(d => d.date === date);

  // APPROVED: always trust Supabase — never load any session for approved reports
  if(existing && existing.approved){
    _sessionClearDate(date); // clean up any stale session
    loadApprovedDay(existing);
    lockForm(date, existing.pts);
    return;
  }

  // Check session — only for non-approved dates
  const snap = _sessionLoadForDate(date);
  if(snap){
    // Extra safety: if session says approved, discard it — Supabase is truth
    if(snap.approved === true){
      _sessionClearDate(date);
    } else {
      const snapAge = Date.now() - (snap.ts || 0);
      if(snapAge < 86400000){ // session less than 24 hours old
        const dbAge = existing?.savedAt
          ? Date.now() - new Date(existing.savedAt).getTime() : Infinity;
        if(snapAge < dbAge){
          unlockForm();
          document.getElementById('rpt-date').value = date;
          _restoreFormFromSnap(snap);
          toast('✅ Your work was restored after the page refreshed!');
          return;
        }
      }
    }
  }

  // Fall back to Supabase draft
  if(existing && !existing.approved){
    unlockForm();
    loadDraftDay(existing);
    toast('✏️ Draft loaded — continue where you left off!');
    calcDayPts();
    return;
  }

  // Fresh day — no data anywhere
  brainPtsToday=0; sudokuPts=0; logicPtsTotal=0; riddlePtsTotal=0;
  mathsPtsToday=0; worksheetPts=0; aiSkillPts=0;
  // Explicitly reset dropdowns that live outside #tab-report
  const _fShAwd=document.getElementById('shloka-pts-award'); if(_fShAwd) _fShAwd.selectedIndex=0;
  const _fCrAwd=document.getElementById('creative-pts-award'); if(_fCrAwd) _fCrAwd.selectedIndex=0;
  const _fPrRat=document.getElementById('parent-rating'); if(_fPrRat) _fPrRat.selectedIndex=0;
  // Seed geetaProgress from permanent mastered only — no inprogress on a fresh day
  geetaProgress={};
  try{
    const permMastered=JSON.parse(localStorage.getItem('vaanya_geeta_mastered')||'{}');
    Object.entries(permMastered).forEach(([id,v])=>{ geetaProgress[id]=v; });
  }catch(e){}
  buildShlokaDisplay();
  calcDayPts();
  toast('☁️ Data loaded from cloud!');
}

// Wire session save to inputs — saves for the CURRENT date only
let _sesTimer = null;
let _suppressSession = false; // set true during silentClearDay to avoid saving blank state

function _sessionWireInputs(){
  const save = (delay) => {
    if(_suppressSession) return;
    if(!dbReady) return; // never save session before Supabase has loaded
    if(_sesTimer) clearTimeout(_sesTimer);
    _sesTimer = setTimeout(() => {
      if(_suppressSession || !dbReady) return;
      const date = document.getElementById('rpt-date')?.value;
      if(date && !todayApproved) _sessionSaveForDate(date);
    }, delay || 2000);
  };
  document.addEventListener('input',  ()=>save(2000));
  document.addEventListener('change', ()=>save(2000));
  document.addEventListener('click', e => {
    if(e.target.closest('.pill,.creative-option,.star')) save(800);
  });
}

// Background auto-save to Supabase every 60 seconds
let _autoSaveTimer = null;
function _sessionStartAutoSave(){
  if(_autoSaveTimer) clearInterval(_autoSaveTimer);
  _autoSaveTimer = setInterval(async () => {
    if(!dbReady) return; // never auto-save before Supabase data is loaded
    const date = document.getElementById('rpt-date')?.value;
    if(!date || todayApproved) return;
    // Only auto-save if on Daily Report tab and has meaningful content
    const pts = calcDayPts();
    const r1  = document.getElementById('r1')?.value || '';
    const sr  = document.getElementById('shloka-reflect')?.value || '';
    if(pts < 5 && r1.length < 3 && sr.length < 3) return;
    try{
      const data = collectFormData(date, pts);
      await saveToSupabase(data);
      // Update in-memory
      const idx = savedDays.findIndex(d => d.date === date);
      if(idx >= 0) savedDays[idx] = {...savedDays[idx], ...data};
      else savedDays.unshift(data);
      try{ localStorage.setItem('vaanya_days', JSON.stringify(savedDays)); }catch(e){}
      // Flash indicator
      const bar = document.getElementById('sync-status');
      if(bar){
        const orig = bar.innerHTML;
        bar.innerHTML = '<span style="color:#10B981;font-size:11px;font-weight:800">✅ Auto-saved to cloud!</span>';
        setTimeout(() => bar.innerHTML = orig, 3000);
      }
    } catch(e){ console.warn('Auto-save error:', e); }
  }, 60000);
}

// ════════════════════════════════════════════════════════════════
// WORKSHEET ENGINE — reads worksheets.json, renders MCQ worksheets
// You control everything by editing worksheets.json on GitHub.
// NEVER need to touch this code to add new worksheets.
// ════════════════════════════════════════════════════════════════

// Points awarded based on percentage score

// ════════════════════════════════════════════════════════════════
// WORKSHEET ENGINE v3 — KBC style, subject tabs, per-subject pts
// Edit worksheets.json only — never touch this code
// ════════════════════════════════════════════════════════════════

// Points scale per worksheet
function _wsPtsFromScore(correct, total){
  if(total === 0) return 0;
  const pct = (correct / total) * 100;
  if(pct >= 90) return 10;
  if(pct >= 75) return 8;
  if(pct >= 60) return 5;
  return 3;
}

// Subject → display config
const WS_SUBJECTS = {
  'English':        { icon:'📖', color:'#1D4ED8', light:'#EFF6FF', glow:'#93C5FD', badge:'E' },
  'Mental Maths':   { icon:'🧮', color:'#D97706', light:'#FFFBEB', glow:'#FCD34D', badge:'M' },
  'Social Science': { icon:'🌍', color:'#065F46', light:'#ECFDF5', glow:'#6EE7B7', badge:'S' },
  'Maths':          { icon:'📐', color:'#7C3AED', light:'#F5F3FF', glow:'#C4B5FD', badge:'M' },
  'Science':        { icon:'🔬', color:'#0E7490', light:'#ECFEFF', glow:'#67E8F9', badge:'S' },
  'GK':             { icon:'🌍', color:'#065F46', light:'#ECFDF5', glow:'#6EE7B7', badge:'G' },
  'General Knowledge': { icon:'🌍', color:'#065F46', light:'#ECFDF5', glow:'#6EE7B7', badge:'G' },
};
function _wsSubjConf(subject){
  return WS_SUBJECTS[subject] || { icon:'📋', color:'#4C1D95', light:'#F5F3FF', glow:'#C4B5FD', badge:'W' };
}

let _wsLoaded    = false;
let _wsAnswered  = {};
let _wsData      = [];
let _wsChosen    = {};
let _wsActiveTab = null; // currently selected subject tab

// Fetch and render
async function loadWorksheets(){
  const sec = document.getElementById('worksheet-section');
  if(!sec) return;

  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60000);
  const today = istDate.toISOString().split('T')[0];

  sec.innerHTML = `<div style="padding:20px;text-align:center;font-size:13px;color:#A5B4FC;font-weight:700">⏳ Loading worksheets...</div>`;

  try {
    const res = await fetch('worksheets.json?t=' + Date.now());
    if(!res.ok) throw new Error('Not found');
    _wsData = await res.json();
    _wsLoaded = true;
  } catch(e) {
    sec.innerHTML = `<div style="margin:10px 0;padding:20px;text-align:center;color:#9CA3AF;font-size:13px;background:#0F172A;border-radius:16px;border:1.5px dashed #334155">📋 No worksheets.json found in your GitHub repo</div>`;
    return;
  }

  const todaySheets = _wsData.filter(w => w.date === today);
  if(todaySheets.length === 0){
    sec.innerHTML = `<div style="margin:10px 0;padding:20px;text-align:center;color:#9CA3AF;font-size:13px;background:#0F172A;border-radius:16px;border:1.5px dashed #334155">📋 No worksheets for <b style="color:#C4B5FD">${today}</b> — check the date in worksheets.json</div>`;
    return;
  }

  // Group by subject
  const subjects = [...new Set(todaySheets.map(w => w.subject))];
  _wsActiveTab = _wsActiveTab && subjects.includes(_wsActiveTab) ? _wsActiveTab : subjects[0];

  renderWsShell(subjects, todaySheets);
}

// Render the outer shell — subject tabs + content area
function renderWsShell(subjects, allSheets){
  const sec = document.getElementById('worksheet-section');
  if(!sec) return;

  // Header card
  const totalWsPts = Object.values(_wsAnswered).reduce((s,v)=>s+v.pts,0);
  const completedCount = Object.keys(_wsAnswered).length;
  const totalCount = allSheets.length;

  let tabsHtml = subjects.map(subj => {
    const conf = _wsSubjConf(subj);
    const isActive = subj === _wsActiveTab;
    const subjSheets = allSheets.filter(w => w.subject === subj);
    const doneCount = subjSheets.filter(w => _wsAnswered[w.id]).length;
    const tick = doneCount === subjSheets.length && doneCount > 0 ? ' ✅' : (doneCount > 0 ? ` ${doneCount}/${subjSheets.length}` : '');
    return `<button onclick="_wsSelectTab('${subj}')" style="
      padding:8px 16px;border-radius:50px;font-size:12px;font-weight:900;
      font-family:'Nunito',sans-serif;cursor:pointer;border:2px solid;
      transition:all .2s;white-space:nowrap;
      background:${isActive ? conf.color : 'rgba(255,255,255,.07)'};
      border-color:${isActive ? conf.color : 'rgba(255,255,255,.15)'};
      color:${isActive ? '#fff' : 'rgba(255,255,255,.6)'};
      box-shadow:${isActive ? '0 4px 14px rgba(0,0,0,.4)' : 'none'};
    ">${conf.icon} ${subj}${tick}</button>`;
  }).join('');

  let html = `
    <div style="background:linear-gradient(135deg,#0F0C29,#1a1a4e,#24243e);border-radius:20px;margin-bottom:10px;overflow:hidden;border:1.5px solid rgba(167,139,250,.25)">
      <!-- Header -->
      <div style="padding:16px 16px 12px;border-bottom:1px solid rgba(255,255,255,.08)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-size:16px;font-weight:900;color:#E0E7FF">📋 Today's Worksheets</div>
            <div style="font-size:11px;color:#A5B4FC;margin-top:2px">${completedCount}/${totalCount} completed · ${totalWsPts} pts earned</div>
          </div>
          <div style="background:rgba(124,58,237,.3);border:1.5px solid #7C3AED;border-radius:16px;padding:6px 14px;text-align:center">
            <div style="font-size:22px;font-weight:900;color:#C4B5FD;line-height:1" id="ws-total-disp">${totalWsPts}</div>
            <div style="font-size:9px;color:#A5B4FC;text-transform:uppercase;letter-spacing:.06em">worksheet pts</div>
          </div>
        </div>
        <!-- Subject tabs -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px" id="ws-subject-tabs">
          ${tabsHtml}
        </div>
      </div>
      <!-- Content area -->
      <div id="ws-content-area" style="padding:16px">
        %%WS_CONTENT%%
      </div>
    </div>`;

  // Build content for active tab
  const activeSheets = allSheets.filter(w => w.subject === _wsActiveTab);
  const contentHtml = activeSheets.map((ws, wi) => _wsRenderCard(ws, wi)).join('');

  html = html.replace('%%WS_CONTENT%%', contentHtml);
  sec.innerHTML = html;
}

// Render a single worksheet card — KBC style
function _wsRenderCard(ws, wi){
  const done = _wsAnswered[ws.id];
  const conf = _wsSubjConf(ws.subject);

  const qs = (ws.questions || []).map((q, qi) => {
    return _wsRenderQuestion(ws.id, q, qi, done);
  }).join('');

  const resultHtml = done ? `
    <div style="margin-top:16px;background:rgba(16,185,129,.15);border:1.5px solid #10B981;border-radius:14px;padding:12px 16px;text-align:center">
      <div style="font-size:20px;margin-bottom:4px">🎉</div>
      <div style="font-size:15px;font-weight:900;color:#6EE7B7">Score: ${done.score} correct</div>
      <div style="font-size:13px;font-weight:700;color:#A7F3D0;margin-top:2px">+${done.pts} pts earned!</div>
    </div>` : `
    <button onclick="_wsSubmit('${ws.id}',${wi})" style="
      margin-top:16px;width:100%;padding:14px;
      background:linear-gradient(135deg,${conf.color},#1D4ED8);
      color:#fff;border:none;border-radius:14px;
      font-size:14px;font-weight:900;cursor:pointer;
      font-family:'Nunito',sans-serif;
      box-shadow:0 4px 20px rgba(0,0,0,.4);
      letter-spacing:.02em">
      ✅ Submit & Get Points
    </button>`;

  return `
    <div style="margin-bottom:20px">
      <!-- Worksheet title bar -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:10px 14px;background:rgba(255,255,255,.05);border-radius:12px">
        <div style="font-size:24px">${ws.icon || conf.icon}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:900;color:#E0E7FF">${ws.title}</div>
          <div style="font-size:11px;color:#A5B4FC;margin-top:1px">${ws.questions?.length||0} questions · up to 10 pts</div>
        </div>
        ${done ? '<div style="font-size:24px">✅</div>' : ''}
      </div>
      <!-- Questions -->
      ${qs}
      ${resultHtml}
    </div>`;
}

// Render one KBC-style question
function _wsRenderQuestion(wsId, q, qi, done){
  const chosen = _wsChosen[wsId] || {};
  const chosenIdx = chosen[qi];
  const labels = ['A','B','C','D'];

  // Build 4 options in KBC layout: A C / B D (left col: A,B  right col: C,D)
  const optHtml = (oi) => {
    const opt = q.opts[oi];
    const label = labels[oi] || String.fromCharCode(65+oi);
    let bg = 'linear-gradient(135deg,#1a237e,#283593)';
    let border = 'rgba(100,120,220,.5)';
    let glow = '';
    let textCol = '#E8EAF6';

    if(done){
      if(oi === q.ans){
        bg = 'linear-gradient(135deg,#1B5E20,#2E7D32)';
        border = '#4CAF50'; glow = '0 0 12px rgba(76,175,80,.5)';
        textCol = '#fff';
      } else if(chosenIdx === oi && oi !== q.ans){
        bg = 'linear-gradient(135deg,#7F1D1D,#991B1B)';
        border = '#EF4444'; textCol = '#fff';
      }
    } else if(chosenIdx === oi){
      bg = 'linear-gradient(135deg,#1565C0,#1976D2)';
      border = '#FFD600'; glow = '0 0 16px rgba(255,214,0,.4)';
      textCol = '#fff';
    }

    const disabled = done ? 'pointer-events:none' : 'cursor:pointer';
    return `
      <div onclick="_wsChoose('${wsId}',${qi},${oi},this)" style="
        display:flex;align-items:center;gap:0;
        border-radius:50px;overflow:hidden;
        border:2px solid ${border};
        background:${bg};
        box-shadow:${glow || 'none'};
        ${disabled};
        transition:all .2s;
        user-select:none;
      " data-wsid="${wsId}" data-qi="${qi}" data-oi="${oi}">
        <!-- Letter badge -->
        <div style="
          background:rgba(255,255,255,.12);
          border-right:1.5px solid rgba(255,255,255,.15);
          padding:10px 14px;
          font-size:13px;font-weight:900;
          color:rgba(255,255,255,.8);
          min-width:38px;text-align:center;
          flex-shrink:0;
        ">${label}:</div>
        <!-- Option text -->
        <div style="
          padding:10px 14px;
          font-size:12px;font-weight:700;
          color:${textCol};
          flex:1;
        ">${opt}</div>
      </div>`;
  };

  // 2×2 grid: A|C on top, B|D on bottom
  const opts = q.opts;
  const grid = opts.length === 4 ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${optHtml(0)}${optHtml(2)}
      ${optHtml(1)}${optHtml(3)}
    </div>` : `
    <div style="display:flex;flex-direction:column;gap:8px">
      ${q.opts.map((_,oi)=>optHtml(oi)).join('')}
    </div>`;

  return `
    <div style="margin-bottom:16px">
      <!-- Question pill -->
      <div style="
        background:linear-gradient(135deg,#1a237e,#1565C0);
        border:2px solid rgba(100,149,237,.6);
        border-radius:50px;
        padding:12px 20px;
        text-align:center;
        font-size:13px;font-weight:800;
        color:#E8EAF6;
        margin-bottom:10px;
        box-shadow:0 0 20px rgba(26,35,126,.5);
        position:relative;
      ">
        <span style="color:rgba(255,255,255,.5);margin-right:6px">Q${qi+1}.</span>${q.q}
      </div>
      ${grid}
    </div>`;
}

// Select a subject tab
function _wsSelectTab(subject){
  _wsActiveTab = subject;
  loadWorksheets(); // re-render
}

// Handle option click
function _wsChoose(wsId, qIdx, optIdx, el){
  if(_wsAnswered[wsId]) return;
  if(!_wsChosen[wsId]) _wsChosen[wsId] = {};
  _wsChosen[wsId][qIdx] = optIdx;

  // Re-render just this worksheet's content area — efficient
  const ws = _wsData.find(w => w.id === wsId);
  if(!ws) return;
  const today = new Date(new Date().getTime() + 5.5*60*60000).toISOString().split('T')[0];
  const allSheets = _wsData.filter(w => w.date === today);
  const activeSheets = allSheets.filter(w => w.subject === _wsActiveTab);
  const wi = activeSheets.findIndex(w => w.id === wsId);

  // Re-render just the question block
  const qBlock = el.closest('[data-ws-q]') || el.closest('.ws-q-block');
  // Simpler: just re-render the full content area
  const ca = document.getElementById('ws-content-area');
  if(ca) ca.innerHTML = activeSheets.map((w, i) => _wsRenderCard(w, i)).join('');
}

// Submit and grade
function _wsSubmit(wsId, sheetIdx){
  const ws = _wsData.find(w => w.id === wsId);
  if(!ws || _wsAnswered[wsId]) return;

  const chosen = _wsChosen[wsId] || {};
  const total = ws.questions.length;
  let correct = 0;

  ws.questions.forEach((q, qi) => {
    if(chosen[qi] === q.ans) correct++;
  });

  if(Object.keys(chosen).length < total){
    toast(`⚠️ Please answer all ${total} questions before submitting!`);
    return;
  }

  const pts = _wsPtsFromScore(correct, total);
  _wsAnswered[wsId] = { pts, score: `${correct}/${total}`, chosen: {...chosen} };

  // Recalculate totals
  worksheetPts = Object.values(_wsAnswered).reduce((s,v) => s + v.pts, 0);
  brainPtsToday = sudokuPts + logicPtsTotal + riddlePtsTotal + mathsPtsToday + worksheetPts;
  updateBrainDisplay();
  calcDayPts();

  toast(`📋 ${ws.subject} submitted! ${correct}/${total} correct — +${pts} pts! 🎉`);

  // Re-render to show results
  loadWorksheets();

  // Immediately save to Supabase so refresh never loses pts
  saveBrainDraft().catch(e => console.warn('Auto-save after worksheet failed:', e));
}

function _wsUpdateTotalDisplay(){
  const el = document.getElementById('ws-total-disp');
  if(el) el.textContent = Object.values(_wsAnswered).reduce((s,v)=>s+v.pts,0);
}

// ════════════════════════════════════════════
// INIT — load cloud data then build UI
// ════════════════════════════════════════════

