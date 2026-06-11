// ════════════════════════════════════════════
// SCORE CALC — fix #4: show % + points in section
// ════════════════════════════════════════════
function calcScore(){
  const got=parseFloat(document.getElementById('test-got')?.value);
  const tot=parseFloat(document.getElementById('test-tot')?.value)||0;
  const pEl=document.getElementById('test-pct');
  const gEl=document.getElementById('test-grade');
  const ptEl=document.getElementById('test-pts-display');
  if(!isNaN(got)&&tot>0){
    const pct=Math.round(got/tot*100);
    pEl.textContent=pct+'%';
    let gr,gc,earnedPts;
    if(pct>=90){gr='🌟 Excellent!';gc='#10B981';earnedPts=50;}
    else if(pct>=75){gr='⭐ Very Good!';gc='#06B6D4';earnedPts=40;}
    else if(pct>=60){gr='👍 Good!';gc='#3B82F6';earnedPts=25;}
    else{gr='💪 Keep trying!';gc='#F97316';earnedPts=10;}
    gEl.innerHTML=`<span style="font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;background:${gc}18;color:${gc};border:1.5px solid ${gc}40">${gr}</span>`;
    if(ptEl)ptEl.textContent=earnedPts+' pts';
  }else{
    pEl.textContent='–';gEl.innerHTML='';
    if(ptEl)ptEl.textContent='0 pts';
  }
  calcDayPts();
}

// ════════════════════════════════════════════

// ════════════════════════════════════════════
// ODDA ASSIGNMENT — fix #6
// ════════════════════════════════════════════
function showOddaAssign(show){
  const el=document.getElementById('odda-assign-detail');
  if(el)el.style.display=show?'block':'none';
}
// ════════════════════════════════════════════
// POINTS CALC — fixes #7,#8,#9 (gym/screen/summary working)
// ════════════════════════════════════════════
function calcOddaAssign(){
  const el=document.getElementById('odda-assign-result');
  if(!el)return;
  const corr=parseFloat(document.getElementById('odda-correct')?.value)||0;
  const totQ=parseFloat(document.getElementById('odda-total-q')?.value)||0;
  if(!totQ){el.innerHTML='';return;}
  const pct=Math.round(corr/totQ*100);
  let assignPts=0;
  if(pct>=90)assignPts=10;
  else if(pct>=75)assignPts=8;
  else if(pct>=60)assignPts=6;
  else if(pct>=40)assignPts=4;
  else assignPts=2;
  const col=pct>=75?'var(--gd)':pct>=50?'var(--ad)':'var(--rd)';
  const icon=pct>=90?'🌟':pct>=75?'🎉':pct>=60?'👍':pct>=40?'🙂':'💪';
  el.innerHTML=`<span style="color:${col}">${icon} ${pct}% — Assignment pts: +${assignPts}/10</span>`;
  calcDayPts();
}

function calcDayPts(){
  // Brain lab sync is called directly from brain lab check functions — not from here
  const ttPts = (typeof ttGetTotalPts==='function') ? ttGetTotalPts() : 0;
  let pts=0;
  let breakdown={};

  // Timetable + school
  const ttVal=parseInt(document.getElementById('rpt-tt')?.value||0);
  // Self-study pts — 10 per subject checked
  let ssPts=0;
  SS_SUBJECTS.forEach((_,i)=>{ if(document.getElementById('ss-'+i)?.checked) ssPts+=10; });
  pts+=ttVal+ssPts+ttPts;
  breakdown.overview=ttVal+ssPts+ttPts;
  breakdown.ss=ssPts; // separate ss so live panel can show timetable and study independently
  const ovEl=document.getElementById('overview-pts');
  if(ovEl)ovEl.textContent=ttVal+' pts'; // show only timetable pts in overview section
  const ssEl=document.getElementById('ss-pts-display');
  if(ssEl)ssEl.textContent=ssPts+' pts';

  // Test
  let testPts=0;
  const got=parseFloat(document.getElementById('test-got')?.value);
  const tot=parseFloat(document.getElementById('test-tot')?.value)||0;
  if(!isNaN(got)&&tot>0){
    const pct=got/tot*100;
    if(pct>=90)testPts=50;else if(pct>=75)testPts=40;else if(pct>=60)testPts=25;else testPts=10;
  }
  pts+=testPts;breakdown.test=testPts;

  // Odda — attendance (+10 yes / -15 missed) + timing (+5 on time / -10 late) + assignment (% based max +10 / incomplete 0)
  let oddaPts=0;
  const oAtt=document.getElementById('odda-att');
  if(oAtt?.querySelector('.pg'))oddaPts+=10;       // attended +10
  else if(oAtt?.querySelector('.pr'))oddaPts-=15;  // missed -15
  const oTime=document.getElementById('odda-time');
  if(oTime?.querySelector('.pg'))oddaPts+=5;       // on time +5
  else if(oTime?.querySelector('.pr'))oddaPts-=10; // late -10
  // Assignment — % based pts (max +10), incomplete = 0 pts added
  const oAssign=document.getElementById('odda-assign');
  if(oAssign?.querySelector('.pg')){
    const corr=parseFloat(document.getElementById('odda-correct')?.value)||0;
    const totQ=parseFloat(document.getElementById('odda-total-q')?.value)||0;
    if(totQ>0){
      const pct=corr/totQ*100;
      if(pct>=90)oddaPts+=10;
      else if(pct>=75)oddaPts+=8;
      else if(pct>=60)oddaPts+=6;
      else if(pct>=40)oddaPts+=4;
      else oddaPts+=2;
    }
  }
  // else incomplete = 0 bonus pts (no deduction for assignment)
  // Cap maximum at 25 (10 att + 5 timing + 10 assignment — can still go negative)
  const oddaFinal=Math.min(25, oddaPts);
  pts+=oddaFinal;breakdown.odda=oddaFinal;
  const oddaPtEl=document.getElementById('odda-pts-display');
  if(oddaPtEl)oddaPtEl.textContent=oddaFinal+' pts';

  // Gym — dropdown activity pts + timing pill (+5 on time / -10 late)
  let gymPts=0;
  const gymSel=document.getElementById('gym-today');
  gymPts=parseInt(gymSel?.value||0);
  const gymTime=document.getElementById('gym-time');
  if(gymTime?.querySelector('.pg'))gymPts+=5;       // on time +5
  else if(gymTime?.querySelector('.pr'))gymPts-=10; // late -10
  pts+=gymPts;breakdown.gym=gymPts;
  const gymPtEl=document.getElementById('gym-pts-display');
  if(gymPtEl)gymPtEl.textContent=gymPts+' pts';
  // Gym message
  const gymMsg=document.getElementById('gym-pts-msg');
  if(gymMsg){
    if(gymPts>0)gymMsg.innerHTML=`<span style="color:var(--g);font-weight:800">🎉 Great! +${gymPts} pts earned!</span>`;
    else if(gymSel?.value==='0'&&gymSel?.selectedIndex>0)gymMsg.innerHTML=`<span style="color:var(--muted)">Rest day — recharge for tomorrow!</span>`;
    else gymMsg.innerHTML='';
  }

  // Screen — screen check: +10 within 30 mins, -10 if over
  let screenPts=0;
  const sc=document.getElementById('screen-check');
  if(sc?.querySelector('.pg'))screenPts+=10;
  else if(sc?.querySelector('.pr'))screenPts-=10;
  // skill builder — pts from self-assessment dropdown
  const skillDidVal = document.getElementById('skill-did')?.value;
  aiSkillPts = skillDidVal === 'yes' ? (parseInt(document.getElementById('skill-pts-select')?.value||0)||0) : 0;
  screenPts += aiSkillPts;
  // book type
  // Reading — +10 pts only when all 3 words + meanings filled
  const bookYes = document.getElementById('book-type')?.value === 'yes';
  const w1=(document.getElementById('word1')?.value||'').trim();
  const m1=(document.getElementById('mean1')?.value||'').trim();
  const w2=(document.getElementById('word2')?.value||'').trim();
  const m2=(document.getElementById('mean2')?.value||'').trim();
  const w3=(document.getElementById('word3')?.value||'').trim();
  const m3=(document.getElementById('mean3')?.value||'').trim();
  const bookPts = (bookYes && w1&&m1&&w2&&m2&&w3&&m3) ? 10 : 0;
  screenPts += bookPts;
  // free time activity
  const freeActVal=parseInt(document.getElementById('free-act')?.value||0);
  screenPts+=freeActVal;
  const freeMsg=document.getElementById('free-act-msg');
  if(freeMsg){
    const fv=document.getElementById('free-act')?.value;
    if(fv==='-10')freeMsg.innerHTML='<span style="color:var(--r)">😴 Timepass — that\'s −10 pts! Use time better tomorrow.</span>';
    else if(fv==='10')freeMsg.innerHTML='<span style="color:var(--g)">🎉 Great choice! +10 pts earned!</span>';
    else if(fv==='5')freeMsg.innerHTML='<span style="color:var(--b)">👍 Nice! +5 pts earned!</span>';
    else freeMsg.innerHTML='';
  }
  pts+=screenPts;breakdown.screen=screenPts;
  const scPtEl=document.getElementById('screen-pts-display');
  if(scPtEl)scPtEl.textContent=screenPts+' pts';

  // Reflection removed from daily report

  // Parent comment — no points, just a note from Mamma & Papa
  const pc=(document.getElementById('parent-comment')?.value||'').trim();
  let parentPts=0;
  // parentPts intentionally 0 — comments are feedback only, not scored
  pts+=parentPts;breakdown.parent=parentPts;

  // Shloka — only count activity that belongs to the currently loaded date.
  // Rules:
  //   mastered  → only if mastered ON the loaded date (parent approved today)
  //   inprogress/relearning → only if started ON or AFTER the loaded date
  //                            OR shloka has no date (edge case)
  // Historical mastered shlokas from previous days do NOT add to today's score.
  // The parent dropdown overrides everything when explicitly set.
  const _lgPts=parseInt(document.getElementById('shloka-pts-award')?.value||0)||0;
  const _loadedDate=(document.getElementById('rpt-date')?.value)||
    new Date(Date.now()+5.5*60*60000).toISOString().split('T')[0];
  let shlokaPts=0;
  if(_lgPts>0){
    // Parent has explicitly set a value — use it directly, no auto-calc
    shlokaPts=_lgPts;
  } else {
    // Auto-calc: only mastered TODAY by parent adds pts. inprogress = 0 auto-pts.
    Object.values(geetaProgress||{}).forEach(function(v){
      if(v.status==='mastered' && v.date===_loadedDate){ shlokaPts+=25; }
    });
  }
  pts+=shlokaPts; breakdown.shloka=shlokaPts;
  const shRes=document.getElementById('shloka-pts-result');
  if(shRes) shRes.textContent=_lgPts>0?'+'+_lgPts+' pts awarded ✅':(shlokaPts>0?'+'+shlokaPts+' pts ✅':'');

  // Creative — pts from parent award dropdown
  let crPts = parseInt(document.getElementById('creative-pts-award')?.value||0)||0;
  breakdown.creative=crPts; pts+=crPts;
  const crRes=document.getElementById('creative-pts-result');
  if(crRes) crRes.textContent = crPts>0 ? '+'+crPts+' pts awarded ✅' : '';

  // Brain lab — pts added directly from puzzle completions, no gating
  const brPts=brainPtsToday;
  pts+=brPts;breakdown.brain=brPts;
  updateBrainDisplay();

  // Parent rating (in parent tab)
  const ratingVal=parseInt(document.getElementById('parent-rating')?.value||0);
  let parentRatingPts=ratingVal;
  pts+=parentRatingPts;breakdown.parentRating=parentRatingPts;

  // Penalty bar removed — no deduction applied

  // Update live panel and XP bar — single source of truth
  const livePts=document.getElementById('day-pts-live');
  if(livePts)livePts.textContent=pts;
  updateLivePanel(breakdown, pts);

  // Summary indicators
  const oAttQ=document.getElementById('odda-att');
  // Summary cards removed — pts tracked via XP bar and breakdown chips only

  // Points breakdown display — fix #9
  renderBreakdown(breakdown,pts);

  return pts; // no cap — total grows as more activities are added
}

function renderBreakdown(bd,total){
  const el=document.getElementById('pts-breakdown');if(!el)return;
  const rows=[
    {label:'📅 Timetable + School',pts:bd.overview||0,col:'var(--p)'},
    {label:'📝 Weekly Test',pts:bd.test||0,col:'var(--pk)'},
    {label:'📚 Homework',pts:bd.hw||0,col:'var(--g)'},
    {label:'💻 Odda class',pts:bd.odda||0,col:'var(--p)'},
    {label:'🤸 Physical activity',pts:bd.gym||0,col:'var(--a)'},
    {label:'📺 Screen & free time',pts:bd.screen||0,col:'var(--pk)'},
    {label:'💭 Reflection',pts:0,col:'var(--t)'},
    {label:'🕉️ Shloka',pts:bd.shloka||0,col:'var(--o)'},
    {label:'🎨 Creative',pts:bd.creative||0,col:'var(--pk)'},
    {label:'🧠 Brain Lab',pts:bd.brain||0,col:'var(--b)'},
    {label:'⭐ Parent rating',pts:bd.parentRating||0,col:bd.parentRating>=0?'var(--g)':'var(--r)'},
  ].filter(r=>r.pts!==0);

  if(!rows.length){el.innerHTML='';return;}
  el.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
    ${rows.map(r=>`<span style="font-size:11px;font-weight:800;padding:4px 10px;border-radius:20px;background:${r.col}15;color:${r.col};border:1.5px solid ${r.col}40">${r.label}: ${r.pts>=0?'+':''}${r.pts}</span>`).join('')}
  </div>
  <div style="background:linear-gradient(135deg,var(--pl),var(--al));border-radius:var(--rads);padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
    <span style="font-size:13px;font-weight:800;color:var(--pd)">⭐ Total points today (all sections)</span>
    <span style="font-size:28px;font-weight:900;color:var(--gold)">${total} pts</span>
  </div>`;
}

// ════════════════════════════════════════════
// DYNAMIC MAX POINTS CALCULATOR
// Reads the actual DOM — no hardcoded totals.
// Add/remove any dropdown or checkbox and the
// max updates automatically on next calcDayPts.
// ════════════════════════════════════════════
function calcMaxPts(){
  let max={daily:0, brain:0, geeta:0, parent:0};

  // ── Daily Report ─────────────────────────────────────────────
  // Timetable: max option value
  max.daily += Math.max(...[...document.querySelectorAll('#rpt-tt option')].map(o=>parseInt(o.value)||0));
  // Self-study: 10 per subject
  max.daily += SS_SUBJECTS.length * 10;
  // Test: max pts tier
  max.daily += 50;
  // Odda: attend+time+assign = 10+5+10 capped at 25
  max.daily += 25;
  // Gym: max option value + on-time bonus
  max.daily += Math.max(...[...document.querySelectorAll('#gym-today option')].map(o=>parseInt(o.value)||0)) + 5;
  // Screen: +10
  max.daily += 10;
  // Skill builder: max option
  max.daily += Math.max(...[...document.querySelectorAll('#skill-pts-select option')].map(o=>parseInt(o.value)||0).filter(v=>v>0));
  // Reading (3 words): +10
  max.daily += 10;
  // Free time: max positive option
  max.daily += Math.max(...[...document.querySelectorAll('#free-act option')].map(o=>parseInt(o.value)||0));

  // ── Brain Lab ─────────────────────────────────────────────────
  // Sudoku hard: 30 + 10 bonus
  max.brain += 40;
  // Logic: shown as /20 in UI
  max.brain += 20;
  // Riddles: 3 × 10
  max.brain += 30;
  // Maths sprint: shown as /25 in UI
  max.brain += 25;

  // ── Geeta & Creative ─────────────────────────────────────────
  // Shloka: max option value
  max.geeta += Math.max(...[...document.querySelectorAll('#shloka-pts-award option')].map(o=>parseInt(o.value)||0));
  // Creative: max option value
  max.geeta += Math.max(...[...document.querySelectorAll('#creative-pts-award option')].map(o=>parseInt(o.value)||0));

  // ── Parent Rating ─────────────────────────────────────────────
  // Max positive option in parent-rating
  max.parent += Math.max(...[...document.querySelectorAll('#parent-rating option')].map(o=>parseInt(o.value)||0));

  max.total = max.daily + max.brain + max.geeta + max.parent;
  return max;
}

// ── Grade label from pct ──────────────────────────────────────
function _lppGrade(pct){
  if(pct>=95)return'🌟 Outstanding!';
  if(pct>=80)return'🎉 Excellent!';
  if(pct>=60)return'👍 Great going!';
  if(pct>=40)return'💪 Keep going!';
  if(pct>=20)return'📚 Just started';
  return'✏️ Fill the report';
}

// ── Bar colour by pct ─────────────────────────────────────────
function _lppColor(pct){
  if(pct>=80)return'linear-gradient(90deg,#059669,#10B981)';
  if(pct>=50)return'linear-gradient(90deg,#7C3AED,#EC4899)';
  if(pct>=20)return'linear-gradient(90deg,#2563EB,#7C3AED)';
  return'linear-gradient(90deg,#9CA3AF,#6B7280)';
}

// ── Format a section pts with penalty colouring ───────────────
function _lppFmt(pts, elId, maxElId, maxVal){
  const el=document.getElementById(elId);
  const maxEl=document.getElementById(maxElId);
  if(el){
    el.textContent=pts>=0?pts:pts; // show negative as-is
    el.style.color=pts<0?'#EF4444':el.dataset.col||el.style.color;
  }
  if(maxEl) maxEl.textContent='/'+maxVal;
}

// ── Toggle section expand/collapse ───────────────────────────
function lppToggle(sec){
  const detail=document.getElementById('lpp-'+sec+'-detail');
  const arr=document.getElementById('lpp-'+sec+'-arr');
  if(!detail) return;
  const open=detail.style.display==='flex';
  detail.style.display=open?'none':'flex';
  if(arr) arr.textContent=open?'▼':'▲';
}
function updateLivePanel(bd, totalPts){
  const max=calcMaxPts();

  const ttPts   =(bd.overview||0)-(bd.test||0); // overview = tt+ss, isolate tt
  const ssPts   = bd.ss||0;
  const testPts = bd.test||0;
  const oddaPts = bd.odda||0;
  const gymPts  = bd.gym||0;
  const screenPts=bd.screen||0;
  const dailyPts=(bd.overview||0)+testPts+oddaPts+gymPts+screenPts;
  const brainPts=bd.brain||0;
  const shlokaPts=bd.shloka||0;
  const creativePts=bd.creative||0;
  const geetaPts=shlokaPts+creativePts;
  const parentPts=bd.parentRating||0;
  const total=totalPts;
  const pct=max.total>0?Math.round(Math.max(0,total)/max.total*100):0;
  const barPct=Math.min(100,Math.max(0,pct));
  const grade=_lppGrade(pct);

  // ── SVG ring (r=28, circ=175.9) ──────────────────────────────
  const circ=175.9;
  const ring=document.getElementById('lpp-ring');
  if(ring) ring.style.strokeDashoffset=circ-circ*barPct/100;

  // ── Big total ─────────────────────────────────────────────────
  const _set=(id,val,redOnNeg=true)=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.textContent=val;
    if(redOnNeg) el.style.color=val<0?'#F87171':'';
  };
  _set('lpp-total',total);
  _set('lpp-total2',total);
  document.getElementById('lpp-max')&&(document.getElementById('lpp-max').textContent=max.total);
  document.getElementById('lpp-max2')&&(document.getElementById('lpp-max2').textContent=max.total);
  document.getElementById('lpp-pct')&&(document.getElementById('lpp-pct').textContent=pct+'%');
  document.getElementById('lpp-grade')&&(document.getElementById('lpp-grade').textContent=grade);

  // ── Section totals ────────────────────────────────────────────
  const _sec=(id,maxId,val,maxVal)=>{
    const el=document.getElementById(id); const mEl=document.getElementById(maxId);
    if(el){el.textContent=val; el.style.color=val<0?'#F87171':'';}
    if(mEl) mEl.textContent='/'+maxVal;
  };
  _sec('lpp-daily','lpp-daily-max',dailyPts,max.daily);
  _sec('lpp-brain','lpp-brain-max',brainPts,max.brain);
  _sec('lpp-geeta','lpp-geeta-max',geetaPts,max.geeta);
  _sec('lpp-parent','lpp-parent-max',parentPts,max.parent);
  // Restore pastel colours when non-negative
  const dailyEl=document.getElementById('lpp-daily'); if(dailyEl&&dailyPts>=0) dailyEl.style.color='#045D56';
  const brainEl=document.getElementById('lpp-brain'); if(brainEl&&brainPts>=0) brainEl.style.color='#FF8F00';
  const geetaEl=document.getElementById('lpp-geeta'); if(geetaEl&&geetaPts>=0) geetaEl.style.color='#00695C';
  const parentEl=document.getElementById('lpp-parent'); if(parentEl&&parentPts>=0) parentEl.style.color='#FF8F00';

  // ── Sub-rows ──────────────────────────────────────────────────
  _set('lpp-d-tt',   (bd.overview||0)-ssPts, true);
  _set('lpp-d-ss',   ssPts, true);
  _set('lpp-d-test', testPts, true);
  _set('lpp-d-odda', oddaPts, true);
  _set('lpp-d-gym',  gymPts,  true);
  _set('lpp-d-screen',screenPts,true);
  _set('lpp-b-sudoku', sudokuPts, true);
  _set('lpp-b-logic',  logicPtsTotal, true);
  _set('lpp-b-riddles',riddlePtsTotal,true);
  _set('lpp-b-maths',  mathsPtsToday,true);
  _set('lpp-g-shloka', shlokaPts,  true);
  _set('lpp-g-creative',creativePts,true);
  _set('lpp-p-rating', parentPts,  true);

  // ── Mobile pill & overlay ─────────────────────────────────────
  const pillNum=document.getElementById('mob-pill-num');
  if(pillNum) pillNum.textContent=total;
  const mobTotal=document.getElementById('mob-total');
  if(mobTotal){mobTotal.textContent=total;mobTotal.style.color=total<0?'#EF4444':'#1E1B4B';}
  const mobMax=document.getElementById('mob-max'); if(mobMax) mobMax.textContent=max.total;
  const mobPct=document.getElementById('mob-pct'); if(mobPct) mobPct.textContent=pct+'%';
  const mobBar=document.getElementById('mob-bar');
  if(mobBar){mobBar.style.width=barPct+'%';}
  const mobGrade=document.getElementById('mob-grade'); if(mobGrade) mobGrade.textContent=grade;
  const _mob=(elId,maxElId,val,maxVal)=>{
    const el=document.getElementById(elId); const mEl=document.getElementById(maxElId);
    if(el){el.textContent=val; el.style.color=val<0?'#EF4444':'';}
    if(mEl) mEl.textContent=maxVal;
  };
  _mob('mob-daily','mob-daily-max',dailyPts,max.daily);
  _mob('mob-brain','mob-brain-max',brainPts,max.brain);
  _mob('mob-geeta','mob-geeta-max',geetaPts,max.geeta);
  _mob('mob-parent','mob-parent-max',parentPts,max.parent);

  // ── XP bar (header) ───────────────────────────────────────────
  const xpBar=document.getElementById('xp-bar');
  if(xpBar) xpBar.style.width=barPct+'%';
  const xpLbl=document.getElementById('xp-lbl');
  if(xpLbl) xpLbl.textContent=total+' / '+max.total+' pts earned today';
  const livePts=document.getElementById('day-pts-live');
  if(livePts) livePts.textContent=total;
  updateSidePanels(total);
}

function updateXP(pts){
  // Now a thin wrapper — real work done in updateLivePanel
  // Called from legacy paths that don't have breakdown
  const xpBar=document.getElementById('xp-bar');
  if(!xpBar) return;
  const max=calcMaxPts();
  const pct=max.total>0?Math.min(100,Math.round(Math.max(0,pts)/max.total*100)):0;
  xpBar.style.width=pct+'%';
  const xpLbl=document.getElementById('xp-lbl');
  if(xpLbl) xpLbl.textContent=pts+' / '+max.total+' pts earned today';
  const lppTotal=document.getElementById('lpp-total');
  if(lppTotal) lppTotal.textContent=pts;
  const pillNum=document.getElementById('mob-pill-num');
  if(pillNum) pillNum.textContent=pts;
}

// ── Scroll to section ─────────────────────────────────────────
function lppScroll(sectionId){
  const tabMap={
    'sec-daily':'report', 'sec-brain':'brain',
    'sec-geeta':'geeta',  'sec-parent':'parent'
  };
  const tabId=tabMap[sectionId];
  // Find tab button by its onclick content
  const allBtns=[...document.querySelectorAll('.nb')];
  const tabBtn=allBtns.find(b=>b.getAttribute('onclick')&&b.getAttribute('onclick').includes("'"+tabId+"'"));
  if(tabBtn) tabBtn.click();
  // Scroll to top of tab after switch
  setTimeout(()=>{
    const target=document.getElementById(sectionId)||document.getElementById('tab-'+tabId);
    if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
  }, tabBtn ? 150 : 0);
}

// ── Toggle mobile overlay ─────────────────────────────────────
function toggleMobPtsPanel(){
  const overlay=document.getElementById('mob-pts-overlay');
  if(!overlay) return;
  const open=overlay.style.display==='block';
  overlay.style.display=open?'none':'block';
}

// ── Show/hide mobile pill based on screen width ───────────────
function _lppResponsive(){
  const pill=document.getElementById('mob-pts-pill');
  if(!pill) return;
  // Show pill only on daily report tab AND on narrow screens
  const isMobile=window.innerWidth<900;
  const reportActive=document.getElementById('tab-report')?.classList.contains('active');
  pill.style.display=(isMobile&&reportActive)?'flex':'none';
}
window.addEventListener('resize',_lppResponsive);
document.addEventListener('DOMContentLoaded',_lppResponsive);
setTimeout(_lppResponsive, 300);

// ════════════════════════════════════════════
// PENALTY CHECK
// ════════════════════════════════════════════
function checkPenalty(){ /* penalty bar removed */ }

// ════════════════════════════════════════════
// REFLECTION SMART EVALUATOR
// ════════════════════════════════════════════
function evalReflection(n){
  const val=(document.getElementById('r'+n)?.value||'').trim();
  const box=document.getElementById('r'+n+'-verdict');
  if(!box) return;
  if(!val || val.length<3){ box.style.display='none'; return; }

  const d=val.toLowerCase();
  const words=val.trim().split(/\s+/).length;

  // Generic/lazy answer detection
  const lazy=['nothing','idk','ok','fine','good','bad','yes','no','same','dunno','whatever','none'];
  const isLazy = lazy.some(w=>d===w||d===w+'.'||d===w+'!') || words<=1;

  // Age-appropriate genuine content
  const achieveWords=['finished','completed','helped','learnt','practised','read','wrote','drew','cooked','solved','scored','won','tried','studied','understood','improved','made','built'];
  const improveWords=['focus','concentrate','distract','procrastinat','late','rush','complete','homework','study','practice','practice','listen','sleep','wake','organise','time','manage','patient','calm','temper','argue','fight','phone','screen','eat','exercise'];
  const planWords=['will','going to','plan','study','practice','read','draw','help','sleep','wake','exercise','finish','complete','revise','prepare','try','learn','write','cook','clean','organise','spend','reduce','limit','start','stop','improve','focus'];

  let pts=0, icon='', msg='', bg='', col='';

  if(isLazy){
    pts=0; icon='😐';
    msg='Too vague! Write a real, specific answer to earn points.';
    bg='var(--rl)'; col='var(--rd)';
  } else if(n===1){
    // Best thing today — should be a genuine achievement
    const isGenuine = achieveWords.some(w=>d.includes(w)) || words>=6;
    pts = isGenuine ? (words>=12?7:words>=7?5:3) : 2;
    icon = pts>=6?'🌟':pts>=4?'👍':'🙂';
    msg = pts>=6?'Wonderful reflection, Vaanya! That is a real achievement!':pts>=4?'Good effort! Being specific helps you remember your wins.':'Try to be more specific — what exactly did you do?';
    bg='var(--pl)'; col='var(--pd)';
  } else if(n===2){
    // Improvement — should be honest and specific
    const isGenuine = improveWords.some(w=>d.includes(w)) || words>=6;
    pts = isGenuine ? (words>=12?7:words>=7?5:3) : 2;
    icon = pts>=6?'💪':pts>=4?'👍':'🙂';
    msg = pts>=6?'Excellent self-awareness, Vaanya! Knowing what to improve is the first step!':pts>=4?'Good honest reflection! The more specific, the better.':'Be more honest and specific — what exactly needs improving?';
    bg='var(--al)'; col='var(--ad)';
  } else if(n===3){
    // Tomorrow plan — should be actionable
    const isGenuine = planWords.some(w=>d.includes(w)) || words>=5;
    pts = isGenuine ? (words>=12?7:words>=7?5:3) : 2;
    icon = pts>=6?'🎯':pts>=4?'👍':'🙂';
    msg = pts>=6?'Great plan, Vaanya! A clear goal for tomorrow sets you up for success!':pts>=4?'Good plan! Try to make it even more specific next time.':'Make your plan more actionable — say exactly what you will do!';
    bg='var(--gl)'; col='var(--gd)';
  }

  // Update global pts store
  if(n===1) reflPts1=pts;
  if(n===2) reflPts2=pts;
  if(n===3) reflPts3=pts;

  box.style.display='block';
  box.style.background=bg;
  box.style.border='1px solid '+col+'60';
  box.innerHTML=`<span style="font-weight:900;color:${col}">${icon} ${pts}/7 pts</span> <span style="color:var(--ink)">${msg}</span>`;
  calcDayPts();
}

// ════════════════════════════════════════════
// SAVE DRAFT + GO TO BRAIN LAB
// ════════════════════════════════════════════
function collectFormData(date, pts){
  // Collect all form fields into a data object for saving
  const shD  = !!document.getElementById('shloka-done')?.querySelector('.pg');
  const crD  = !!(document.getElementById('creative-done')?.querySelector('.pg')||document.getElementById('creative-done')?.querySelector('.pa'));
  const brD  = !!(document.getElementById('brain-done')?.querySelector('.pg')||document.getElementById('brain-done')?.querySelector('.pa'));
  const odD  = !!document.getElementById('odda-att')?.querySelector('.pg');
  return {
    date, pts,
    shlokaD:shD, creativeD:crD, brainD:brD, odda:odD,
    // CRITICAL: read approved status from savedDays — never hardcode false
    // This prevents auto-save from overwriting an approved report back to pending
    approved: (()=>{
      const existing = savedDays.find(d => d.date === date);
      return existing ? (existing.approved === true) : false;
    })(),

    parentComment:document.getElementById('parent-comment')?.value||'',
    parentRating:parseInt(document.getElementById('parent-rating')?.value||0),
    bookType:document.getElementById('book-type')?.value||'0',
    ssDone: SS_SUBJECTS.map((_,i)=>!!document.getElementById('ss-'+i)?.checked),
    ssDets: SS_SUBJECTS.map((_,i)=>document.getElementById('ssdet-'+i)?.value||''),
    word1:document.getElementById('word1')?.value||'',mean1:document.getElementById('mean1')?.value||'',exam1:document.getElementById('exam1')?.value||'',
    word2:document.getElementById('word2')?.value||'',mean2:document.getElementById('mean2')?.value||'',exam2:document.getElementById('exam2')?.value||'',
    word3:document.getElementById('word3')?.value||'',mean3:document.getElementById('mean3')?.value||'',exam3:document.getElementById('exam3')?.value||'',
    skillPtsAwarded: parseInt(document.getElementById('skill-pts-select')?.value||0)||0,
    shlokaReflect:(document.getElementById('shloka-reflect')?.value||'').substring(0,1000),
    pastShlokas:(document.getElementById('past-shlokas')?.value||'').substring(0,3000),
    shlokaPtsAwarded: parseInt(document.getElementById('shloka-pts-award')?.value||0)||0,
    geetaProgress:     JSON.stringify(geetaProgress||{}),
    creativePtsAwarded: parseInt(document.getElementById('creative-pts-award')?.value||0)||0,
    creativeImgData: creativeImgData || null,
    testSubj:document.getElementById('test-subj')?.value||'',
    testGot:document.getElementById('test-got')?.value||'',
    testTot:document.getElementById('test-tot')?.value||'',
    oddaSubj:document.getElementById('odda-subj')?.value||'',
    gymActivity:document.getElementById('gym-today')?.value||'0',
    skillDesc:document.getElementById('skill-desc')?.value||'',
    skillDid:document.getElementById('skill-did')?.value||'',
    r1:document.getElementById('r1')?.value||'',
    r2:document.getElementById('r2')?.value||'',
    r3:document.getElementById('r3')?.value||'',
    ttVal:document.getElementById('rpt-tt')?.value||'0',
    schoolVal:document.getElementById('rpt-school')?.value||'0',
    freeAct:document.getElementById('free-act')?.value||'0',
    screenWhat:document.getElementById('screen-what')?.value||'',
    creativeDesc:document.getElementById('creative-desc')?.value||'',
    creativeChosen: creativeChosen||null,
    // Pill states — stored as JSON STRING so saveToSupabase doesn't strip it
    pillStatesJSON: JSON.stringify((()=>{
      const ps={};
      document.querySelectorAll('#tab-report .pills[id]').forEach(grp=>{
        const active=grp.querySelector('.pg,.pr,.pa,.pb,.pt');
        if(active){
          const cls=PCLS.find(c=>active.classList.contains(c));
          if(cls){
            const pills=[...grp.querySelectorAll('.pill')];
            ps[grp.id]={cls, idx:pills.indexOf(active)};
          }
        }
      });
      return ps;
    })()),
    // ssDone and ssDets also stored as JSON strings (arrays are objects — stripped otherwise)
    ssDoneJSON: JSON.stringify(SS_SUBJECTS.map((_,i)=>!!document.getElementById('ss-'+i)?.checked)),
    sDetsJSON:  JSON.stringify(SS_SUBJECTS.map((_,i)=>document.getElementById('ssdet-'+i)?.value||'')),
    // Brain lab pts — saved as plain numbers so they survive the Supabase filter
    savedSudokuPts:    sudokuPts,
    savedSudokuFrozen: sudokuFrozen,  // persist freeze state so it survives refresh
    savedLogicPts:     logicPtsTotal,
    savedMathsPts:     mathsPtsToday,
    savedRiddlePts:    riddlePtsTotal,
    savedWorksheetPts: worksheetPts,
    savedWsAnswered:   JSON.stringify(_wsAnswered||{}),
    savedAt:new Date().toISOString(),
    // Timetable block states — which activities checked, pts per block
    ttBlockStatesJSON: JSON.stringify(ttBlockStates||{})
  };
}

async function saveDraftAndGoBrainLab(){
  const date=document.getElementById('rpt-date')?.value;
  if(!date){toast('Please set today\'s date first!');return;}
  // Populate reset date picker with approved days
  populateResetDatePicker();

  // Restore parent dropdown values if previously saved
  const date0 = document.getElementById('rpt-date')?.value;
  if(date0){
    const existing = savedDays.find(d=>d.date===date0);
    if(existing){
      const sAwd=document.getElementById('shloka-pts-award');
      if(sAwd && existing.shlokaPtsAwarded!==undefined) sAwd.value=String(existing.shlokaPtsAwarded);
      const cAwd=document.getElementById('creative-pts-award');
      if(cAwd && existing.creativePtsAwarded!==undefined) cAwd.value=String(existing.creativePtsAwarded);
    }
  }
  const pts=calcDayPts();
  const data = collectFormData(date, pts);

  // Save into savedDays array (upsert by date)
  const idx = savedDays.findIndex(d=>d.date===date);
  if(idx>=0){ savedDays[idx]={...savedDays[idx],...data}; }
  else { savedDays.unshift(data); }
  savedDays.sort((a,b)=>new Date(b.date)-new Date(a.date));

  // Save to Supabase as draft (approved=false — no bank credit)
  const ok = await saveToSupabase(data);
  // Always keep a local backup so the child's work survives a refresh even if
  // the cloud write fails for any reason.
  try{ localStorage.setItem('vaanya_days', JSON.stringify(savedDays)); }catch(e){}
  updateTopBar();
  if(ok){
    toast('💾 Draft saved! Appears in History as Pending. Going to Brain Lab...');
    setTimeout(()=>showTab('brain', document.querySelector('.nb.t3')),900);
  } else {
    toast('⚠️ Save failed — check your connection and try again.');
  }
}

// Also allow saving draft without navigating away
async function saveDraftOnly(){
  const date=document.getElementById('rpt-date')?.value;
  if(!date){toast('Please set today\'s date first!');return;}
  const pts=calcDayPts();
  const data = collectFormData(date, pts);
  const idx = savedDays.findIndex(d=>d.date===date);
  if(idx>=0){ savedDays[idx]={...savedDays[idx],...data}; }
  else { savedDays.unshift(data); }
  savedDays.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const ok = await saveToSupabase(data);
  // Local backup — guarantees the in-progress report survives a refresh.
  try{ localStorage.setItem('vaanya_days', JSON.stringify(savedDays)); }catch(e){}
  updateTopBar();
  if(ok){
    toast('💾 Draft saved for '+fmtDate(date)+'! ('+pts+' pts · Pending approval)');
  } else {
    toast('⚠️ Save failed — check your connection and try again.');
  }
}

function updateTopBar(){
  const earned = totalEarned();
  const avail  = availablePts();
  // Top bar — show available (earned minus spent)
  const el=document.getElementById('total-pts-top');
  if(el) el.textContent=avail;
  const st=document.getElementById('streak-top');if(st)st.textContent=getStreak()+'🔥';
  const ss=document.getElementById('streak-spend');if(ss)ss.textContent=getStreak()+'🔥';
  const sa=document.getElementById('spend-avail');if(sa)sa.textContent=avail;
  // Debug info in sync bar
  const dbg=document.getElementById('bank-debug');
  if(dbg){
    const approvedCount=savedDays.filter(d=>d.approved).length;
    dbg.textContent=`✅ ${approvedCount} approved day(s) · ${earned} earned − ${totalSpent} spent = ${avail} in bank`;
  }
}

// ════════════════════════════════════════════
// PIN MODAL — fix #10: parent approval working
// ════════════════════════════════════════════
function getPin(){return localStorage.getItem('vaanya_admin_pin')||'1234';} // PIN stays local for security

function openPinModal(){
  pinBuf=''; updatePinDots();
  document.getElementById('pin-err').textContent='';
  document.getElementById('pin-overlay').classList.add('show');
  setTimeout(focusPinInput, 200);
}

function focusPinInput(){
  const inp = document.getElementById('pin-keyboard-input');
  if(inp){ inp.value=''; inp.focus(); }
}

function onPinKeyboardInput(val){
  const digits = val.replace(/[^0-9]/g,'').substring(0,4);
  const inp = document.getElementById('pin-keyboard-input');
  if(inp) inp.value = digits;
  pinBuf = digits;
  updatePinDots();
  document.getElementById('pin-err').textContent='';
  if(pinBuf.length===4) setTimeout(pinSubmit, 300);
}
function closePinModal(){
  pinBuf=''; updatePinDots();
  document.getElementById('pin-overlay').classList.remove('show');
  const inp = document.getElementById('pin-keyboard-input');
  if(inp){ inp.value=''; inp.blur(); }
}
function pinPress(d){
  if(pinBuf.length>=4)return;
  pinBuf+=d;updatePinDots();
  if(pinBuf.length===4)setTimeout(pinSubmit,200);
}
function pinClear(){
  pinBuf=pinBuf.slice(0,-1);updatePinDots();
  document.getElementById('pin-err').textContent='';
}
function updatePinDots(){
  for(let i=0;i<4;i++)document.getElementById('pd'+i).classList.toggle('filled',i<pinBuf.length);
}
function pinSubmit(){
  if(pinBuf===getPin()){
    closePinModal();
    if(window._pinCallback){
      window._pinCallback();
      window._pinCallback = null;
    } else {
      unlockParentActions();
    }
  }else{
    document.getElementById('pin-err').textContent='❌ Wrong PIN — try again!';
    pinBuf='';updatePinDots();
  }
}

function unlockParentActions(){
  // Show the Approve/Reject buttons, hide the PIN button
  const pending=document.getElementById('parent-pending-section');
  const actions=document.getElementById('parent-action-section');
  if(pending)pending.style.display='none'; /* always hidden */
  if(actions)actions.style.display='block';
  toast('PIN accepted! Now choose Approve or Reject.');
}

async function approveReport(){
  const date = (typeof _pendingReviewDate!=='undefined'&&_pendingReviewDate) ? _pendingReviewDate : document.getElementById('rpt-date').value;
  if(!date){toast("Please set today\'s date first!");return;}
  todayApproved=true;

  // ── Auto-promote shloka: if parent awarded 25 pts via dropdown,
  //    mark the in-progress shloka as mastered in geetaProgress now,
  //    BEFORE collectFormData snapshots it. This keeps the two systems in sync.
  const shlokaPtsEl = document.getElementById('shloka-pts-award');
  const shlokaPtsVal = parseInt(shlokaPtsEl?.value||0)||0;
  if(shlokaPtsVal >= 25){
    const inProgId = _geetaInProgressId();
    if(inProgId){
      geetaProgress[inProgId] = {status:'mastered', date:date, pts:25};
      _persistGeetaToLocalStorage();
    }
  }

  const pts=calcDayPts();

  const shD=!!document.getElementById('shloka-done')?.querySelector('.pg');
  const crD=!!(document.getElementById('creative-done')?.querySelector('.pg')||document.getElementById('creative-done')?.querySelector('.pa'));
  const brD=!!(document.getElementById('brain-done')?.querySelector('.pg')||document.getElementById('brain-done')?.querySelector('.pa'));
  const odD=!!document.getElementById('odda-att')?.querySelector('.pg');

  // Use FULL collectFormData so all form fields are preserved in full_data
  // Override approved:true explicitly after collectFormData runs
  const data = collectFormData(date, pts);
  data.approved    = true;
  data.shlokaD     = shD;
  data.creativeD   = crD;
  data.brainD      = brD;
  data.odda        = odD;
  data.parentComment = (document.getElementById('parent-comment')?.value||'').substring(0,2000);
  data.parentRating  = parseInt(document.getElementById('parent-rating')?.value||0);
  data.savedAt       = new Date().toISOString();

  const idx=savedDays.findIndex(d=>d.date===date);
  if(idx>=0)savedDays[idx]={...savedDays[idx],...data};
  else savedDays.unshift(data);
  savedDays.sort((a,b)=>new Date(b.date)-new Date(a.date));
  localStorage.setItem('vaanya_days',JSON.stringify(savedDays));
  const _approveOk = await saveToSupabase(data);
  // Re-write the local backup AFTER the save so the approved state is always
  // captured locally — if the cloud write failed, the load-time merge will
  // automatically re-push this approval on the next refresh.
  try{ localStorage.setItem('vaanya_days', JSON.stringify(savedDays)); }catch(e){}

  // Show approved banner
  const actions=document.getElementById('parent-action-section');
  if(actions)actions.style.display='none';
  const appSec=document.getElementById('approved-section');
  if(appSec)appSec.style.display='block';
  const appMsg=document.getElementById('approved-msg');
  if(appMsg)appMsg.textContent='✅ +'+pts+' points approved! Keep shining, Vaanya! 🌟';
  const appTime=document.getElementById('approved-time');
  if(appTime)appTime.textContent='Approved: '+new Date().toLocaleString('en-IN');

  updateTopBar();
  lockForm(date, pts);
  _sessionClearDate(date); // approved — session must never override Supabase
  const _rptEl=document.getElementById('rpt-date');
  if(_rptEl && _rptEl.value!==date) _rptEl.value=date;
  populateResetDatePicker();
  showPop('✅','Report Approved! 🎉','Vaanya your report has been approved! You earned '+pts+' points today! ⭐ Keep it up!');
  toast('Report approved! +'+pts+' points saved! Report is now locked.');
  if(!_approveOk){
    toast('⚠️ Cloud sync is slow right now — your approval is saved on this device and will sync automatically.');
  }
  // Note: saveToSupabase already called above — no second call needed

  // Streak celebration
  const streak=getStreak();
  if([5,10,15,20,30].includes(streak)){
    const bonus=streak>=20?150:streak>=10?120:50;
    setTimeout(()=>showPop('🔥',streak+'-Day Streak!','Amazing consistency Vaanya! +'+bonus+' bonus points!'),1800);
  }
}

async function rejectReport(){
  const date = _pendingReviewDate || document.getElementById('rpt-date')?.value;
  if(!confirm('REJECT this report? This will completely erase all entries for '+(date||'today')+'. Vaanya will need to start fresh.')) return;

  // 1. Delete from Supabase (remove the draft entirely)
  if(date){
    try{
      await _supabase.from('daily_reports').delete().eq('date', date);
      console.log('Draft deleted from Supabase for', date);
    }catch(e){ console.error('Delete error:', e); }
    // Remove from local savedDays array too
    savedDays = savedDays.filter(d => d.date !== date);
    // Keep the local backup in sync so the rejected day is not resurrected by
    // the load-time merge.
    try{ localStorage.setItem('vaanya_days', JSON.stringify(savedDays)); }catch(e){}
    // Also drop any lingering session snapshot for this date.
    try{ _sessionClearDate(date); }catch(e){}
  }

  // 2. Clear the form completely
  silentClearDay();
  setTodayDate();

  // 3. Reset parent auth state — require PIN again next time
  parentUnlocked = false;
  const wall = document.getElementById('parent-locked-wall');
  const content = document.getElementById('parent-content');
  if(wall) wall.style.display='block';
  if(content) content.style.display='none';

  // 4. Reset approve/reject buttons
  const appSec=document.getElementById('approved-section');
  if(appSec)appSec.style.display='none';
  todayApproved=false;
  updateTopBar();

  showPop('❌','Report Rejected!','The report has been completely erased. Vaanya, please fill everything carefully and resubmit for approval! 💪');

  // 5. Go to Daily Report tab
  setTimeout(()=>showTab('report', document.querySelector('.nb.t0')), 800);
}

// ════════════════════════════════════════════
// MOTIVATIONAL POP-UPS FOR VAANYA
// ════════════════════════════════════════════
const VAANYA_QUOTES = [
  {icon:'\u{1F31F}',title:"You're a Superstar, Vaanya!",msg:"Every point you earn is a step closer to your dreams. Keep shining, beta!"},
  {icon:'\u{1F525}',title:"On Fire Today!",msg:"Look at those points adding up! Consistency is your superpower, Vaanya!"},
  {icon:'\u{1F3C6}',title:"Champion in the Making!",msg:"Champions dont give up - and you never do. Mamma and Papa are SO proud!"},
  {icon:'\u{1F4AB}',title:"Almost There!",msg:"You are getting closer to your reward with every task. Keep going, you have got this!"},
  {icon:'\u{1F308}',title:"Brilliant, Vaanya!",msg:"Hard work today = amazing rewards tomorrow. You are building an incredible future!"},
  {icon:'\u{1F451}',title:"The Star of the House!",msg:"Every effort you make today makes tomorrow better. You ARE amazing, Vaanya!"},
  {icon:'\u{1F48E}',title:"Diamonds are Made Under Pressure!",msg:"Tough tasks make you stronger. You are becoming unstoppable, Vaanya!"},
  {icon:'\u{1F3AF}',title:"Eyes on the Prize!",msg:"Look at the rewards waiting for you - every point counts! YOU are worth it!"},
]
let _lastQuoteIdx = -1;
function showVaanyaMotivation(){
  let idx;
  do { idx = Math.floor(Math.random()*VAANYA_QUOTES.length); } while(idx===_lastQuoteIdx);
  _lastQuoteIdx = idx;
  const q = VAANYA_QUOTES[idx];
  showPop(q.icon, q.title, q.msg);
}
// Show a motivation pop-up when switching to rewards or spend tab
// (called from showTab)
// ════════════════════════════════════════════
// REWARDS TAB
// ════════════════════════════════════════════
// ── Claimed rewards helpers ────────────────────────────────────
function getClaimedRewards(){
  try{ return JSON.parse(localStorage.getItem('vaanya_claimed_rewards')||'{}'); }
  catch(e){ return {}; }
}
function markRewardClaimed(key, pts, title){
  const claimed = getClaimedRewards();
  if(!claimed[key]) claimed[key] = {count:0, history:[]};
  claimed[key].count++;
  claimed[key].lastClaimed = new Date().toISOString();
  claimed[key].history.unshift({date:new Date().toLocaleDateString('en-IN'), pts, title});
  localStorage.setItem('vaanya_claimed_rewards', JSON.stringify(claimed));
}

function claimReward(rewardIdx, pts){
  const _rData=(()=>{try{return JSON.parse(localStorage.getItem('vaanya_admin_rewards')||'null')||REWARDS;}catch(e){return REWARDS;}})();
  const _r=_rData.filter(x=>x.active!==false).sort((a,b)=>a.pts-b.pts)[rewardIdx]||{};
  const title=_r.title||'Reward';
  if(availablePts() < pts){ toast('Not enough points yet! Keep earning! 💪'); return; }
  if(!confirm('Claim "'+title+'" for '+pts.toLocaleString()+' pts?\n\nTell Mamma or Papa!\nDeducts '+pts.toLocaleString()+' pts from your bank.')) return;
  // Reuse spendPts mechanism to deduct pts + log to Supabase
  const key = 'reward_'+rewardIdx;
  totalSpent += pts;
  const spendItem = {id:key, cost:pts, title, date:new Date().toISOString().split('T')[0]};
  spendHist.unshift(spendItem);
  localStorage.setItem('vaanya_spent_total', totalSpent);
  localStorage.setItem('vaanya_spend_hist', JSON.stringify(spendHist));
  saveSpendToSupabase(spendItem);
  markRewardClaimed(key, pts, title);
  updateTopBar();
  showPop('🎉', 'Reward Claimed! 🌟', 'You claimed "'+title+'"! Tell Mamma & Papa to make it happen! 🏆');
  renderRewards();
  renderSpend();
}

function renderRewards(){
  const avail=availablePts(); const earned=totalEarned();
  const el=document.getElementById('rwd-total-pts'); if(el)el.textContent=earned.toLocaleString()+' total points earned';
  const ea=document.getElementById('rwd-avail');     if(ea)ea.textContent=avail.toLocaleString();
  const ed=document.getElementById('rwd-days');      if(ed)ed.textContent=savedDays.length;
  const es=document.getElementById('rwd-streak');    if(es)es.textContent=getStreak()+'🔥';
  // Keep spend-avail in sync for any legacy JS
  const sa=document.getElementById('spend-avail');   if(sa)sa.textContent=avail;

  const rewardsData=(()=>{try{return JSON.parse(localStorage.getItem('vaanya_admin_rewards')||'null')||REWARDS;}catch(e){return REWARDS;}})();
  const claimed = getClaimedRewards();
  const g=document.getElementById('reward-grid'); if(!g)return; g.innerHTML='';

  rewardsData.filter(r=>r.active!==false).sort((a,b)=>a.pts-b.pts).forEach((r,idx)=>{
    const unlocked = avail>=r.pts;
    const prog = Math.min(100,Math.round(avail/r.pts*100));
    const grad = r.grad||('linear-gradient(135deg,'+r.col+','+r.col+'CC)');
    const key = 'reward_'+idx;
    const claimInfo = claimed[key];
    const claimCount = claimInfo ? claimInfo.count : 0;

    const div=document.createElement('div');
    div.className='';div.style.cssText='';

    // Trophy badge if ever claimed
    const trophyBadge = claimCount>0
      ? '<div style="position:absolute;top:9px;left:11px;background:rgba(255,255,255,.9);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:900;color:#B45309">'
        + '✅ Claimed '+(claimCount>1?claimCount+'x':'')+'</div>'
      : '';

    const strip = r.strip||r.bdr||'#8338EC';
    let btnText, btnStyle, btnClick;
    if(unlocked){
      btnText = claimCount>0 ? '🔄 Claim again!' : '🎉 Claim it!';
      btnStyle = 'color:'+strip+';border-color:'+strip;
      btnClick = 'onclick="claimReward('+idx+','+r.pts+')"';
    } else {
      btnText = '🔒 '+(r.pts-avail).toLocaleString()+' more needed';
      btnStyle = 'color:#9CA3AF;border-color:#E5E7EB;cursor:not-allowed';
      btnClick = 'disabled';
    }

    const trophyHtml = claimCount>0
      ? '<span class="rw-trophy">✅ '+( claimCount>1?'Claimed '+claimCount+'x':'Claimed')+'</span>'
      : '';

    div.className='rw-strip-row';
    div.innerHTML=
      '<div class="rw-accent" style="background:'+strip+'"></div>'+
      '<div class="rw-body">'+
        '<div class="rw-icon">'+r.icon+'</div>'+
        '<div class="rw-info">'+
          '<div class="rw-name">'+r.title+trophyHtml+'</div>'+
          '<div class="rw-sub">'+r.pts.toLocaleString()+' pts'+(unlocked?' · you have '+avail.toLocaleString():' · need '+(r.pts-avail).toLocaleString()+' more')+'</div>'+
          '<div class="rw-prog"><div class="rw-prog-fill" style="width:0%;background:'+strip+'" id="rfill-'+idx+'"></div></div>'+
        '</div>'+
      '</div>'+
      '<div class="rw-right">'+
        '<span class="rw-pts">'+r.pts.toLocaleString()+' pts</span>'+
        '<button class="rw-btn" style="'+btnStyle+'" '+btnClick+'>'+btnText+'</button>'+
      '</div>';

    g.appendChild(div);
    setTimeout(()=>{
      const f=document.getElementById('rfill-'+idx);
      if(f) f.style.width=prog+'%';
    },80);
  });

  // Also render the spend grid and history now that they're on the same page
  renderSpend();
}

// ════════════════════════════════════════════
// SPEND TAB — redesigned #9
// ════════════════════════════════════════════
const SPEND_MESSAGES={
  tv30:   '📺 30 extra minutes of TV unlocked! Enjoy — but keep track of time! ⏰',
  tv60:   '📺✨ A whole extra hour! Sit back and enjoy — you earned it! 💪',
  sweets: '🍬 Sweet treat time! Go grab your favourite sweets — yum! 😋',
  canteen:'🏫 ₹30 canteen money approved! Treat yourself at school today! 🎉',
  snack:  '🍟 Snack time! Go pick your favourite — you deserve it! 🎊',
  game:   '🎮 Game on! Enjoy your game — have fun! 🏆',
  buy50:  '🛒 ₹50 shopping approved! Pick something nice — tell Mamma/Papa what you buy! 🌟',
};
const SPEND_USED_KEY='vaanya_spend_used_today';

function getUsedToday(){
  const today=new Date().toISOString().split('T')[0];
  try{
    const raw=JSON.parse(localStorage.getItem(SPEND_USED_KEY)||'{}');
    return raw.date===today?(raw.ids||[]):[];
  }catch(e){return [];}
}
function markUsedToday(id){
  const today=new Date().toISOString().split('T')[0];
  const used=getUsedToday();
  if(!used.includes(id))used.push(id);
  localStorage.setItem(SPEND_USED_KEY,JSON.stringify({date:today,ids:used}));
}

// Spend tracking helpers (SPEND_USED_KEY already declared above)

// ════════════════════════════════════════════
// SPEND PAGE QUOTES
// ════════════════════════════════════════════
const SPEND_QUOTES = [
  {q:"The best rewards are the ones you earned yourself!", attr:"— Your Hard Work", grad:"linear-gradient(135deg,#FF006E,#FF8E53)", emoji:"🌟"},
  {q:"Spend your points with joy — you worked hard for every single one!", attr:"— Mamma & Papa", grad:"linear-gradient(135deg,#8338EC,#3A86FF)", emoji:"🎉"},
  {q:"Earning is beautiful. Spending wisely is an art!", attr:"— A lesson for life", grad:"linear-gradient(135deg,#06D6A0,#1B9AAA)", emoji:"💎"},
  {q:"Every treat you enjoy today is a trophy from your effort!", attr:"— Your Daily Star", grad:"linear-gradient(135deg,#FFBE0B,#FB5607)", emoji:"🏆"},
  {q:"When you earn it yourself, even a simple sweet tastes like a victory!", attr:"— Vaanya's motto", grad:"linear-gradient(135deg,#FF9A3C,#FF006E)", emoji:"🍬"},
  {q:"Fun is sweeter when you know you deserve it!", attr:"— The feeling of achievement", grad:"linear-gradient(135deg,#3A86FF,#8338EC)", emoji:"✨"},
  {q:"Your points, your rules, your joy. This is YOUR reward shelf!", attr:"— Mamma & Papa", grad:"linear-gradient(135deg,#06D6A0,#FFBE0B)", emoji:"🌈"},
  {q:"The satisfaction of performing well is the real reward. Points are just the bonus!", attr:"— A wise thought", grad:"linear-gradient(135deg,#FF006E,#8338EC)", emoji:"💫"},
];
let _spendQIdx = 0;
function renderSpendQuote(){
  const el = document.getElementById('spend-quote-bar');
  if(!el) return;
  const q = SPEND_QUOTES[_spendQIdx % SPEND_QUOTES.length];
  el.innerHTML =
    '<div style="background:'+q.grad+';border-radius:18px;padding:16px 20px;border:3px solid rgba(255,255,255,.45);'+
    'position:relative;overflow:hidden;text-align:center;cursor:pointer" onclick="nextSpendQuote()">'+
    '<div style="position:absolute;font-size:70px;right:-10px;top:-15px;opacity:.18;pointer-events:none">'+q.emoji+'</div>'+
    '<div style="position:absolute;font-size:50px;left:6px;bottom:-12px;opacity:.18;pointer-events:none">'+q.emoji+'</div>'+
    '<div style="font-family:Fredoka One,cursive;font-size:16px;color:#fff;text-shadow:1px 1px 0 rgba(0,0,0,.2);'+
    'margin-bottom:6px;position:relative;line-height:1.4">&ldquo;'+q.q+'&rdquo;</div>'+
    '<div style="font-size:11px;color:rgba(255,255,255,.85);font-weight:800;position:relative">'+q.attr+'</div>'+
    '<div style="font-size:10px;color:rgba(255,255,255,.65);margin-top:5px">tap for next quote ✨</div>'+
    '</div>';
}
function nextSpendQuote(){
  _spendQIdx = (_spendQIdx + 1) % SPEND_QUOTES.length;
  renderSpendQuote();
}
function renderSpend(){
  renderSpendQuote();
  const avail=availablePts();
  const el=document.getElementById('spend-avail');if(el)el.textContent=avail;
  const spendData=(()=>{try{return JSON.parse(localStorage.getItem('vaanya_admin_spend_items')||'null')||SPEND_ITEMS;}catch(e){return SPEND_ITEMS;}})();
  const usedToday=getUsedToday();
  const g=document.getElementById('spend-grid');if(!g)return;g.innerHTML='';

  spendData.filter(s=>s.active!==false).sort((a,b)=>a.cost-b.cost).forEach(item=>{
    const can=avail>=item.cost;
    const used=usedToday.includes(item.id);
    const strip=item.strip||item.col||'#8338EC';
    const div=document.createElement('div');
    div.className='rw-strip-row'+(used?' used':'');

    let btnStyle, btnText, btnDisabled;
    if(used){
      btnStyle='color:#6B7280;border-color:#D1D5DB;cursor:not-allowed';
      btnText='✅ Used today'; btnDisabled='disabled';
    } else if(can){
      btnStyle='color:'+strip+';border-color:'+strip;
      btnText='🎁 Claim '+item.cost+' pts'; btnDisabled='';
    } else {
      btnStyle='color:#9CA3AF;border-color:#E5E7EB;cursor:not-allowed';
      btnText='🔒 '+(item.cost-avail)+' more needed'; btnDisabled='disabled';
    }

    const _btn = document.createElement('button');
    _btn.className='rw-btn';
    _btn.setAttribute('style',btnStyle);
    if(btnDisabled) _btn.disabled=true;
    if(can&&!used) _btn.addEventListener('click',()=>spendPts(item.id,item.cost,item.title));
    _btn.textContent=btnText;

    div.innerHTML=
      '<div class="rw-accent" style="background:'+strip+'"></div>'+
      '<div class="rw-body">'+
        '<div class="rw-icon">'+item.icon+'</div>'+
        '<div class="rw-info">'+
          '<div class="rw-name">'+item.title+'</div>'+
          '<div class="rw-sub">'+(item.desc||'')+'</div>'+
        '</div>'+
      '</div>'+
      '<div class="rw-right" id="rw-right-'+item.id+'">'+
        '<span class="rw-pts">'+item.cost+' pts</span>'+
      '</div>';
    const _r=div.querySelector('.rw-right');
    if(_r)_r.appendChild(_btn);
    g.appendChild(div);  });

  const hl=document.getElementById('spend-hist-list');if(!hl)return;
  if(!spendHist.length){
    hl.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted)"><div style="font-size:32px;margin-bottom:8px">🎁</div><div style="font-weight:800">No spending yet!</div><div style="font-size:11px;margin-top:4px">Earn points and treat yourself!</div></div>';
    return;
  }
  hl.innerHTML='<table><thead><tr><th>Date</th><th>Reward</th><th>Points spent</th></tr></thead><tbody>'+
    spendHist.slice(0,20).map(s=>'<tr><td style="color:var(--muted);white-space:nowrap">'+s.date+'</td><td style="font-weight:700">'+s.title+'</td><td style="font-weight:900;color:var(--r)">−'+s.cost+' pts</td></tr>').join('')+
    '</tbody></table>';
}

function spendPts(id,cost,title,col){
  if(availablePts()<cost){toast('Not enough points yet! Keep earning! 💪');return;}
  const MSGS={
    tv30:   '📺 30 extra minutes of TV unlocked! Enjoy — keep track of time! ⏰',
    tv60:   '📺✨ A whole extra hour! Sit back and enjoy — you earned it! 💪',
    sweets: '🍬 Sweet treat time! Go grab your favourite sweets — yum! 😋',
    canteen:'🏫 ₹30 canteen money approved! Treat yourself at school today! 🎉',
    snack:  '🍟 Snack time! Go pick your favourite — you deserve it! 🎊',
    game:   '🎮 Game on! Enjoy your game — have fun! 🏆',
    buy50:  '🛒 ₹50 shopping approved! Pick something nice — tell Mamma/Papa! 🌟',
  };
  const msg=MSGS[id]||'You spent '+cost+' points for: '+title+'! Enjoy! 🌟';
  if(!confirm('Spend '+cost+' points for: '+title+'?\n\n⚠️ Always tell Mamma or Papa before using!\n\nThis option will be locked for the rest of today.'))return;
  totalSpent+=cost;
  const spendItem={id,cost,title,date:new Date().toISOString().split('T')[0]};
  spendHist.unshift(spendItem);
  localStorage.setItem('vaanya_spent_total',totalSpent); // local backup
  localStorage.setItem('vaanya_spend_hist',JSON.stringify(spendHist)); // local backup
  saveSpendToSupabase(spendItem); // save to cloud
  markUsedToday(id);
  updateTopBar();
  showPop('🎉','Reward Unlocked! 🌟',msg);
  renderSpend();
}

async function clearAllSpendHistory(){
  if(!confirm('Clear ALL spending history and reset spent points to 0?\n\nThis cannot be undone.')) return;
  try {
    // Delete all spend records for this user from Supabase
    await _supabase.from('spend_history').delete().neq('id', 0);
  } catch(e) {
    // Try alternate — delete by matching known dates
    try {
      const dates=[...new Set(spendHist.map(s=>s.date))];
      for(const d of dates){
        await _supabase.from('spend_history').delete().eq('date',d);
      }
    } catch(e2){ console.error('Supabase spend delete error:',e2); }
  }
  // Reset local state
  spendHist=[];
  totalSpent=0;
  localStorage.removeItem('vaanya_spent_total');
  localStorage.removeItem('vaanya_spend_hist');
  localStorage.removeItem(SPEND_USED_KEY);
  updateTopBar();
  renderSpend();
  toast('🗑️ Spending history cleared! Starting fresh from 0 spent.');
}
// ════════════════════════════════════════════
function renderParentTab(){
  // Always reload geetaProgress from cloud+localStorage before rendering
  // so the approval panel has the freshest state
  _geetaLoadProgress();
  // Populate shloka reflection for parent view
  const shlokaReflect = (document.getElementById('shloka-reflect')?.value||'').trim();
  const shlokaDisp = document.getElementById('parent-shloka-display');
  const shlokaRef = document.getElementById('parent-shloka-reflect');
  const shlokaEl = document.getElementById('shloka-display');
  if(shlokaDisp && shlokaEl){
    const verseEl = shlokaEl.querySelector('.shloka-text');
    shlokaDisp.innerHTML = verseEl
      ? '<span style="font-weight:700;color:#065F46">Todays shloka:</span> ' + verseEl.textContent.substring(0,80) + '...'
      : '(Shloka not loaded)';
  }
  if(shlokaRef){
    shlokaRef.textContent = shlokaReflect.length>2 ? shlokaReflect : '— Vaanya has not filled this yet —';
    shlokaRef.style.color = shlokaReflect.length>2 ? '#064E3B' : '#9CA3AF';
  }

  // Creative activity + desc + image
  const creativeActEl = document.getElementById('parent-creative-activity');
  if(creativeActEl){
    creativeActEl.textContent = creativeChosen ? 'Activity: ' + creativeChosen : 'No creative activity selected yet.';
    creativeActEl.style.color = creativeChosen ? '#3B0764' : '#9CA3AF';
    creativeActEl.style.fontWeight = creativeChosen ? '800' : '600';
    creativeActEl.style.fontStyle = creativeChosen ? 'normal' : 'italic';
  }
  const creativeDesc = (document.getElementById('creative-desc')?.value||'').trim();
  const parentDescWrap = document.getElementById('parent-creative-desc-wrap');
  const parentDesc = document.getElementById('parent-creative-desc');
  if(parentDescWrap && parentDesc){
    if(creativeDesc.length>2){ parentDescWrap.style.display='block'; parentDesc.textContent=creativeDesc; }
    else { parentDescWrap.style.display='none'; }
  }
  const imgWrap = document.getElementById('parent-creative-img-wrap');
  const imgEl = document.getElementById('parent-creative-img');
  const noImg = document.getElementById('parent-creative-no-img');
  if(creativeImgData){
    if(imgWrap) imgWrap.style.display='block';
    if(imgEl) imgEl.src=creativeImgData;
    if(noImg) noImg.style.display='none';
  } else {
    if(imgWrap) imgWrap.style.display='none';
    if(noImg) noImg.style.display='block';
  }

  const pts=calcDayPts();
  // Compute section sub-totals for the parent view
  const ttVal=parseInt(document.getElementById('rpt-tt')?.value||0);
  let ssPtsP=0; SS_SUBJECTS.forEach((_,i)=>{ if(document.getElementById('ss-'+i)?.checked) ssPtsP+=10; });

  let testPts=0;
  const got=parseFloat(document.getElementById('test-got')?.value);
  const tot=parseFloat(document.getElementById('test-tot')?.value)||0;
  if(!isNaN(got)&&tot>0){const pct=got/tot*100;if(pct>=90)testPts=50;else if(pct>=75)testPts=40;else if(pct>=60)testPts=25;else testPts=10;}
  let oddaPts=0;const oAtt=document.getElementById('odda-att');
  if(oAtt?.querySelector('.pg'))oddaPts=10;
  const oTimeP=document.getElementById('odda-time');
  if(oTimeP?.querySelector('.pg'))oddaPts+=5;else if(oTimeP?.querySelector('.pr'))oddaPts-=10;
  const oAssignP=document.getElementById('odda-assign');
  if(oAssignP?.querySelector('.pg'))oddaPts+=10;else if(oAssignP?.querySelector('.pr'))oddaPts-=15;
  oddaPts=Math.min(10,oddaPts);
  let gymPts=0;const gym=document.getElementById('gym-today');
  if(gym?.querySelector('.pa'))gymPts=20;else if(gym?.querySelector('.pb')||gym?.querySelector('.pt'))gymPts=10;
  let screenPts=0;
  const sc=document.getElementById('screen-check');if(sc?.querySelector('.pg'))screenPts+=10;else if(sc?.querySelector('.pa'))screenPts+=5;
  const skillChk=document.getElementById('skill-check');if(skillChk?.querySelector('.pb'))screenPts+=10;
  const bookYesP = document.getElementById('book-type')?.value === 'yes';
  const _w1=(document.getElementById('word1')?.value||'').trim(), _m1=(document.getElementById('mean1')?.value||'').trim();
  const _w2=(document.getElementById('word2')?.value||'').trim(), _m2=(document.getElementById('mean2')?.value||'').trim();
  const _w3=(document.getElementById('word3')?.value||'').trim(), _m3=(document.getElementById('mean3')?.value||'').trim();
  screenPts+=(bookYesP&&_w1&&_m1&&_w2&&_m2&&_w3&&_m3)?10:0;
  screenPts+=parseInt(document.getElementById('free-act')?.value||0);
  const dailyPts=ttVal+ssPtsP+testPts+oddaPts+gymPts+screenPts;

  let shlokaPts=0;const sh=document.getElementById('shloka-done');if(sh?.querySelector('.pg'))shlokaPts=25;
  let crPts=0;const cr=document.getElementById('creative-done');if(cr?.querySelector('.pg'))crPts=20;else if(cr?.querySelector('.pa'))crPts=10;
  const soulPts=shlokaPts+crPts;

  let brPts=brainPtsToday;
  const parentRating=parseInt(document.getElementById('parent-rating')?.value||0);
  const parentComment=(document.getElementById('parent-comment')?.value||'').trim();
  const parentCommentPts=0; // comments are feedback only — no points awarded

  // Update header chips
  const el1=document.getElementById('pr-daily-pts');if(el1)el1.textContent=dailyPts;
  const el2=document.getElementById('pr-brain-pts');if(el2)el2.textContent=brPts;
  const el3=document.getElementById('pr-soul-pts');if(el3)el3.textContent=soulPts;
  const el4=document.getElementById('pr-total-pts');if(el4)el4.textContent=pts;

  // ── Section 1: Daily Report accordion body & badge ──
  const bars=document.getElementById('parent-breakdown-bars');
  if(bars){
    const dailyAreas=[
      {label:'⏰ Tuition Time',pts:ttVal},
      {label:'📚 Self Study (Subjects)',pts:ssPtsP},
      {label:'📝 Test / Exam',pts:testPts},
      {label:'💻 Odda (Coding)',pts:oddaPts},
      {label:'🏋️ Gym / Exercise',pts:gymPts},
      {label:'📱 Screen & Reading',pts:screenPts},
    ];
    const dailyPct=Math.min(100,Math.round(dailyPts/430*100));
    bars.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <span style="font-size:11px;font-weight:800;color:var(--muted)">Daily total progress</span>
        <span style="font-size:13px;font-weight:900;color:#7C3AED">${dailyPts} / 430 pts</span>
      </div>
      <div class="pr-section-bar-wrap"><div class="pr-section-bar" style="width:${dailyPct}%;background:linear-gradient(90deg,#8B5CF6,#6D28D9)"></div></div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:12px">${dailyPct}% of daily maximum</div>
      ${dailyAreas.map(a=>`
        <div class="pr-area-row">
          <span class="pr-area-lbl">${a.label}</span>
          <span class="pr-area-pts" style="color:#8B5CF6">+${a.pts} pts</span>
        </div>`).join('')}`;
  }
  const b1=document.getElementById('pr-acc-pts-1');if(b1)b1.textContent=dailyPts+' pts';

  // ── Section 2: Brain Lab accordion body & badge ──
  const brainBd=document.getElementById('pr-brain-breakdown');
  if(brainBd){
    const brainMax=55;
    const brainPct=Math.min(100,Math.round(brPts/brainMax*100));
    const brainAreas=[
      {label:'🔢 Sudoku',pts:sudokuPts,max:10},
      {label:'🧩 Logic',pts:logicPtsTotal,max:10},
      {label:'➕ Maths Sprint',pts:mathsPtsToday,max:10},
      {label:'🎯 Riddles',pts:riddlePtsTotal,max:10},
      {label:'📋 Worksheets',pts:worksheetPts,max:15},
    ];
    brainBd.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <span style="font-size:11px;font-weight:800;color:var(--muted)">Brain Lab total</span>
        <span style="font-size:13px;font-weight:900;color:#2563EB">${brPts} / ${brainMax} pts</span>
      </div>
      <div class="pr-section-bar-wrap"><div class="pr-section-bar" style="width:${brainPct}%;background:linear-gradient(90deg,#3B82F6,#1D4ED8)"></div></div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:10px">${brainPct}% of maximum</div>
      <div class="pr-brain-grid">
        ${brainAreas.map(a=>{
          const pct=a.max>0?Math.min(100,Math.round(a.pts/a.max*100)):0;
          return `<div class="pr-brain-card">
            <div class="pr-brain-sub-title">${a.label}</div>
            <div class="pr-brain-sub-pts">${a.pts}<span style="font-size:11px;color:var(--muted);font-weight:700"> / ${a.max}</span></div>
            <div class="pr-brain-mini-bar"><div class="pr-brain-mini-fill" style="width:${pct}%"></div></div>
          </div>`;
        }).join('')}
      </div>`;
  }
  const b2=document.getElementById('pr-acc-pts-2');if(b2)b2.textContent=brPts+' pts';

  // ── Section 3: Geeta badge ──
  const b3=document.getElementById('pr-acc-pts-3');if(b3)b3.textContent=soulPts+' pts';

  // ── Section 4: Creative badge ──
  const crPtsAward=parseInt(document.getElementById('creative-pts-award')?.value||0);
  const b4=document.getElementById('pr-acc-pts-4');if(b4)b4.textContent=crPtsAward+' pts';

  // ── Section 5: Wordbook summary ──
  const wbWrap=document.getElementById('pr-wordbook-summary');
  if(wbWrap){
    const today=new Date(Date.now()+5.5*60*60000).toISOString().split('T')[0];
    const todayWords=(typeof wbWords!=='undefined'?wbWords:[]).filter(w=>w.date_added===today);
    const wbPts=todayWords.length*10;
    const b5=document.getElementById('pr-acc-pts-5');
    if(b5)b5.textContent=wbPts+' pts · '+todayWords.length+' word'+(todayWords.length!==1?'s':'');
    if(todayWords.length>0){
      wbWrap.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:11px;font-weight:800;color:var(--muted)">Words added today</span>
          <span style="font-size:13px;font-weight:900;color:#6D28D9">${todayWords.length} word${todayWords.length!==1?'s':''} · +${wbPts} pts</span>
        </div>
        <div class="pr-section-bar-wrap"><div class="pr-section-bar" style="width:${Math.min(100,todayWords.length*33)}%;background:linear-gradient(90deg,#8B5CF6,#6D28D9)"></div></div>
        <div style="font-size:10px;color:#6D28D9;font-weight:800;margin-bottom:10px">+10 pts per word with meaning &amp; sentence</div>
        <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:7px">New words added today:</div>
        <div class="pr-words-pills">${todayWords.map(w=>`<span class="pr-word-pill">✨ ${w.word}</span>`).join('')}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:9px;padding:6px 10px;background:var(--bg);border-radius:8px">👁 Full meanings and sentences are visible in the Wordbook tab</div>`;
    } else {
      wbWrap.innerHTML=`<div style="font-size:12px;color:var(--muted);font-style:italic;padding:8px 0">No new words added to the Wordbook today.</div>`;
      const b5e=document.getElementById('pr-acc-pts-5');if(b5e)b5e.textContent='0 pts';
    }
  }

  // ── Section 6: Overall progress bar ──
  const totalMax=430+55+45+80;
  const overallPct=totalMax>0?Math.min(100,Math.round(pts/totalMax*100)):0;
  const ob=document.getElementById('pr-overall-bar');if(ob)ob.style.width=overallPct+'%';
  const ol=document.getElementById('pr-overall-label');if(ol)ol.textContent=pts+' / '+totalMax+' pts';
  const op=document.getElementById('pr-overall-pct');if(op)op.textContent=overallPct+'%';

  // Refresh sudoku unlock panel every time parent tab renders
  refreshParentSudokuPanel();
  // Refresh shloka approval panel — shows inprogress shlokas from any day
  renderParentShlokaApproval();
  renderParentShlokaMgmt();
}

// ── Helper: update accordion badge points live (called from dropdowns) ──
function prUpdateBadges(){
  if(!parentUnlocked) return;
  renderParentTab();
}

// ── Helper: toggle accordion sections ──
function prToggle(id){
  const sec=document.getElementById(id);
  if(!sec) return;
  sec.classList.toggle('pr-open');
}

// ════════════════════════════════════════════
// HISTORY TAB — fix #1
// ════════════════════════════════════════════
function renderHistory(){
  const dl=document.getElementById('day-list');if(!dl)return;
  dl.innerHTML='';
  document.getElementById('hist-detail-box').innerHTML='';
  const nh=document.getElementById('no-hist');
  if(!savedDays.length){if(nh)nh.style.display='block';return;}
  if(nh)nh.style.display='none';

  // Sort all days newest first
  const allDays=[...savedDays].sort((a,b)=>new Date(b.date)-new Date(a.date));

  allDays.forEach((d,i)=>{
    const isApproved=d.approved;
    const card=document.createElement('div');
    card.className='hist-card '+(isApproved?'approved':'draft');
    card.innerHTML=`
      <div class="hist-card-left">
        <div class="hist-status-icon">${isApproved?'✅':'⏳'}</div>
        <div style="min-width:0">
          <div class="hist-date">${fmtDate(d.date)}</div>
          <div class="hist-status-lbl" style="color:${isApproved?'#10B981':'#D97706'}">
            ${isApproved?'✅ Parent Approved':'⏳ Pending Parent Approval'}
          </div>
        </div>
      </div>
      <div class="hist-pts-box">
        <div class="hist-pts-num" style="color:${isApproved?'#10B981':'#D97706'}">${d.pts||0}</div>
        <div class="hist-pts-lbl">pts</div>
      </div>
      <button class="btn btn-o" style="padding:7px 14px;font-size:12px;flex-shrink:0"
        onclick="viewHistDay(${i},event)">👁 View</button>
      ${!isApproved ? `<button class="btn" style="padding:7px 14px;font-size:12px;flex-shrink:0;background:#FEF2F2;color:#B91C1C;border:2px solid #FECACA;border-radius:10px;font-weight:800;cursor:pointer"
        onclick="deleteDraft('${d.date}',event)">🗑 Delete</button>` : ''}`;
    dl.appendChild(card);
  });
}

async function deleteDraft(date, e){
  if(e) e.stopPropagation();
  if(!confirm('Delete draft for '+fmtDate(date)+'? This cannot be undone.')) return;
  // Remove from local array
  savedDays = savedDays.filter(d => d.date !== date);
  // Delete from Supabase
  try {
    await _supabase.from('daily_reports').delete().eq('date', date);
    toast('🗑️ Draft deleted for '+fmtDate(date));
  } catch(err) {
    toast('⚠️ Deleted locally but cloud delete failed — try again.');
    console.error('Delete error:', err);
  }
  updateTopBar();
  renderHistory();
  document.getElementById('hist-detail-box').innerHTML = '';
}

function viewHistDay(i, e){
  if(e)e.stopPropagation();
  const allDays=[...savedDays].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const d=allDays[i];
  const box=document.getElementById('hist-detail-box');

  // Rating label
  const ratingMap={'-100':'😟 Below Average','-50':'😐 Average','0':'🙂 Satisfactory','25':'😊 Good','50':'😄 Excellent','80':'🌟 Extraordinary'};
  const ratingLbl=d.parentRating!==undefined?ratingMap[String(d.parentRating)]||(''+d.parentRating+' pts'):'—';

  box.innerHTML=`
  <div class="hist-detail-v2">
    <div class="hd-header">
      <div class="hd-title">📅 ${fmtDate(d.date)}</div>
      <button class="hd-close" onclick="document.getElementById('hist-detail-box').innerHTML=''">✕ Close</button>
    </div>

    <!-- BIG POINTS HERO -->
    <div class="hd-pts-hero">
      <div class="hd-pts-big">${d.pts||0}</div>
      <div class="hd-pts-sub">${d.approved?'✅ Points approved & added to bank':'⏳ Pending — not yet added to bank'}</div>
    </div>

    <!-- KEY STATS GRID -->
    <div class="hd-grid">

      <div class="hd-stat" style="${d.approved?'':'background:#FFFBEB;border-color:#FCD34D'}">
        <div class="hd-stat-num" style="color:${d.approved?'#10B981':'#D97706'}">${d.approved?'✅':'⏳'}</div>
        <div class="hd-stat-lbl" style="color:${d.approved?'#065F46':'#92400E'}">${d.approved?'Parent Approved':'Awaiting Approval'}</div>
      </div>
    </div>

    <!-- MANDATORY TASKS -->
    <div style="font-size:11px;font-weight:900;color:#065F46;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Mandatory Tasks</div>
    <div class="hd-tasks">
      <div class="hd-task ${d.shlokaD?'':'missed'}">
        <span class="hd-task-icon">${d.shlokaD?'✅':'❌'}</span>
        <div class="hd-task-name">🕉️ Shloka</div>
      </div>
      <div class="hd-task ${d.creativeD?'':'missed'}">
        <span class="hd-task-icon">${d.creativeD?'✅':'❌'}</span>
        <div class="hd-task-name">🎨 Creative</div>
      </div>
      <div class="hd-task ${d.brainD?'':'missed'}">
        <span class="hd-task-icon">${d.brainD?'✅':'❌'}</span>
        <div class="hd-task-name">🧠 Brain Lab</div>
      </div>
      <div class="hd-task ${d.odda?'':'missed'}">
        <span class="hd-task-icon">${d.odda?'✅':'❌'}</span>
        <div class="hd-task-name">💻 Odda</div>
      </div>
    </div>

    <!-- PARENT COMMENT + RATING -->
    ${(d.parentComment||d.parentRating)?`
    <div style="font-size:11px;font-weight:900;color:#1D4ED8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;margin-top:4px">Parents Review</div>
    <div class="hd-parent-box">
      ${d.parentRating!==undefined&&d.parentRating!==0?`<div class="hd-parent-lbl">Rating: ${ratingLbl} (${d.parentRating>0?'+':''}${d.parentRating} pts)</div>`:''}
      ${d.parentComment?`<div class="hd-parent-val">"${d.parentComment}"</div>`:''}
    </div>
    `:''}
  </div>`;
  box.scrollIntoView({behavior:'smooth'});
}

