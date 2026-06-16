// ════════════════════════════════════════════════════════════════
// TIMETABLE ENGINE
// ════════════════════════════════════════════════════════════════

// State
let ttIsHoliday = false;
let ttBlockStates = {};   // blockId -> {pts, done, checkedActs}
let ttClockInterval = null;

// ── BLOCK DEFINITIONS ─────────────────────────────────────────

// ── Get current schedule ───────────────────────────────────────
function ttGetSchedule(){
  const d = new Date();
  const day = d.getDay(); // 0=Sun,6=Sat
  const isWeekend = (day===0||day===6);
  return (isWeekend || ttIsHoliday) ? TT_WEEKEND : TT_WEEKDAY;
}

// ── Get current hour (0-23) ────────────────────────────────────
const TT_TEST_MODE = false; // LIVE — time-based locking active (set true to unlock all blocks for testing)
function ttNowHour(){
  return new Date().getHours() + new Date().getMinutes()/60;
}

// ── Determine block state ──────────────────────────────────────
function ttBlockState(block, nowH){
  if(block.type==='locked-until-3pm') return 'done';
  if(block.type==='break') return 'break';
  const bState = ttBlockStates[block.id];
  if(bState && bState.markedDone) return 'done';

  // TEST MODE: every block is fully editable — no time restrictions
  if(typeof TT_TEST_MODE !== 'undefined' && TT_TEST_MODE) return 'current';

  const schedule = ttGetSchedule();
  const thisIdx  = schedule.findIndex(b => b.id === block.id);
  const unlockH  = block.unlockHour || 0;

  // Find the NEXT non-break block's unlockHour to determine this block's end time
  let endH = unlockH + 1.5; // default fallback
  for(let i = thisIdx + 1; i < schedule.length; i++){
    if(schedule[i].unlockHour !== undefined){
      endH = schedule[i].unlockHour;
      break;
    }
  }

  if(nowH < unlockH)            return 'locked';
  if(nowH >= unlockH && nowH < endH) return 'current';
  return 'normal'; // past its window — unlocked but no longer active
}

// ── Toggle holiday mode ────────────────────────────────────────
function ttToggleHoliday(){
  ttIsHoliday = !ttIsHoliday;
  lp_syncTabStyles();
  ttRender();
  calcDayPts();
}

// ── Left panel: set schedule tab ──────────────────────────────
function lp_setSchedule(mode){
  const d = new Date();
  const day = d.getDay();
  const isNaturalWeekend = (day===0||day===6);
  const frozen = localStorage.getItem('tt_frozen_schedule');
  const todayKey = new Date().toLocaleDateString('en-CA');
  const frozenDate = localStorage.getItem('tt_frozen_date');
  if(frozen && frozen !== mode && frozenDate === todayKey){
    const msg = 'You already have activities on the '+(frozen==='holiday'?'Holiday':'Weekday')+' schedule today.\n\nSwitch anyway?';
    if(!confirm(msg)) return;
  }
  if(mode==='holiday'){ if(!isNaturalWeekend) ttIsHoliday = true; }
  else { ttIsHoliday = false; }
  localStorage.setItem('tt_frozen_schedule', mode);
  localStorage.setItem('tt_frozen_date', todayKey);
  lp_syncTabStyles(); ttRender(); calcDayPts(); lp_updateDateCard();
}

function lp_restoreFrozenSchedule(){
  const frozen = localStorage.getItem('tt_frozen_schedule');
  const frozenDate = localStorage.getItem('tt_frozen_date');
  const todayKey = new Date().toLocaleDateString('en-CA');
  if(frozen && frozenDate === todayKey){
    const d = new Date();
    const isNaturalWeekend = (d.getDay()===0||d.getDay()===6);
    if(frozen==='holiday' && !isNaturalWeekend) ttIsHoliday = true;
    else if(frozen==='weekday') ttIsHoliday = false;
    lp_syncTabStyles(); lp_updateDateCard();
  }
}

// ── Style the two tabs based on active schedule ───────────────
function lp_syncTabStyles(){
  const d = new Date();
  const isNaturalWeekend = (d.getDay()===0||d.getDay()===6);
  const holidayActive = isNaturalWeekend || ttIsHoliday;

  const wdBtn = document.getElementById('lp-tab-weekday');
  const hlBtn = document.getElementById('lp-tab-holiday');
  if(!wdBtn||!hlBtn) return;

  if(holidayActive){
    // Holiday active
    wdBtn.style.background='#F9FAFB'; wdBtn.style.color='#6B7280'; wdBtn.style.borderColor='transparent';
    hlBtn.style.background='linear-gradient(135deg,#FFF7ED,#FEF3C7)'; hlBtn.style.color='#92400E'; hlBtn.style.borderColor='#FCD34D';
  } else {
    // Weekday active
    wdBtn.style.background='linear-gradient(135deg,#EFF6FF,#E0E7FF)'; wdBtn.style.color='#1E3A8A'; wdBtn.style.borderColor='#BFDBFE';
    hlBtn.style.background='#F9FAFB'; hlBtn.style.color='#6B7280'; hlBtn.style.borderColor='transparent';
  }
}

// ── Update the date card text ─────────────────────────────────
function lp_updateDateCard(){
  const d = new Date();
  const day = d.getDay();
  const dayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const isNaturalWeekend = (day===0||day===6);
  const holidayActive = isNaturalWeekend || ttIsHoliday;

  const dayEl  = document.getElementById('lp-day-name');
  const noteEl = document.getElementById('lp-date-note');

  if(dayEl) dayEl.textContent = dayNames[day];
  if(noteEl){
    if(holidayActive){
      noteEl.textContent = '☀️ Holiday / Weekend schedule · Full day from 7:00 AM';
      noteEl.style.color='#92400E'; noteEl.style.background='#FEF3C7';
    } else {
      noteEl.textContent = '🏫 School day · Timetable unlocks at 3:00 PM';
      noteEl.style.color='#1E3A8A'; noteEl.style.background='#EFF6FF';
    }
  }
}

// ── Initialise day (called on date change too) ─────────────────
function ttInitDay(){
  const d = new Date();
  const day = d.getDay();
  const isWeekend = (day===0||day===6);
  // On weekends, force holiday schedule automatically
  if(isWeekend) ttIsHoliday = false; // natural weekend handled by lp_syncTabStyles logic

  // Drive left panel
  lp_restoreFrozenSchedule();
  lp_updateDateCard();
  lp_syncTabStyles();

  ttRender();
  // Sync brain pts into timetable on each render
  if(typeof ttSyncBrainLabPts==='function') setTimeout(ttSyncBrainLabPts, 100);
  // Refresh every minute
  if(ttClockInterval) clearInterval(ttClockInterval);
  ttClockInterval = setInterval(()=>{ttRender();ttUpdateClock();lp_updateDateCard();if(typeof ttSyncBrainLabPts==='function')ttSyncBrainLabPts();}, 60000);
}

// ── Toggle block open/close ────────────────────────────────────
function ttToggleBlock(blockId){
  const el = document.getElementById('ttb-'+blockId);
  if(!el) return;
  el.classList.toggle('open');
}

// ── Toggle activity checkbox ───────────────────────────────────
function ttToggleAct(blockId, actId, pts, type){
  if(type==='parent') return; // parents award, child just marks done
  if(!ttBlockStates[blockId]) ttBlockStates[blockId]={pts:0,checkedActs:{},markedDone:false};
  const state = ttBlockStates[blockId];
  const wasChecked = state.checkedActs[actId]||false;
  if(wasChecked){ state.checkedActs[actId]=false; if(type!=='parent') state.pts=Math.max(0,state.pts-pts); }
  else           { state.checkedActs[actId]=true;  if(type!=='parent') state.pts+=pts; }
  // Update checkbox visuals
  const actEl = document.getElementById('ttact-'+actId);
  if(actEl){
    if(state.checkedActs[actId]){ actEl.classList.add('checked'); actEl.querySelector('.tt-act-cb').textContent='✓'; }
    else                        { actEl.classList.remove('checked'); actEl.querySelector('.tt-act-cb').textContent=''; }
  }
  // Update block pts badge
  ttUpdateBlockPts(blockId);
  calcDayPts();
}

// ── Mark block as done ────────────────────────────────────────
function ttMarkDone(blockId){
  if(!ttBlockStates[blockId]) ttBlockStates[blockId]={pts:0,checkedActs:{},markedDone:false};
  ttBlockStates[blockId].markedDone = true;
  ttRender();
  calcDayPts();
}

// ── Update pts badge on a block ────────────────────────────────
function ttUpdateBlockPts(blockId){
  const el = document.getElementById('ttpts-'+blockId);
  const state = ttBlockStates[blockId];
  if(el && state) el.textContent = state.pts + ' pts earned';
}

// ── Navigate to linked tab ─────────────────────────────────────
function ttGoToTab(tabName){
  const map={'brain':'brain','creative':'creative','geeta':'geeta','wordbook':'wordbook','book':'wordbook'};
  const id = map[tabName]||tabName;
  const btn = document.querySelector('.nb.t'+(id==='brain'?'1':id==='geeta'?'2':id==='creative'?'3':'4'));
  // Use showTab directly
  showTab(id, btn || document.querySelector('.nb'));
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── Main render function ───────────────────────────────────────
let _ttFirstCurrentOpened = false; // reset each render
function ttRender(){
  _ttFirstCurrentOpened = false;
  const container = document.getElementById('tt-blocks-container');
  if(!container) return;
  const schedule = ttGetSchedule();
  const nowH = ttNowHour();
  container.innerHTML = '';

  // Test mode banner
  if(typeof TT_TEST_MODE !== 'undefined' && TT_TEST_MODE){
    const banner = document.createElement('div');
    banner.innerHTML = `<div style="background:linear-gradient(135deg,#FEF3C7,#FFFBEB);border:2px solid #FCD34D;border-radius:12px;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:18px">🧪</span>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:900;color:#92400E">TEST MODE is ON — all blocks are unlocked</div>
        <div style="font-size:10px;color:#78350F;margin-top:1px">Set <code>TT_TEST_MODE = false</code> in the code to restore live time-based locking</div>
      </div>
    </div>`;
    container.appendChild(banner);
  }

  schedule.forEach(block => {
    const state = ttBlockState(block, nowH);
    const bState = ttBlockStates[block.id]||{pts:0,checkedActs:{},markedDone:false};

    const wrapper = document.createElement('div');
    wrapper.className = 'tt-block';
    wrapper.id = 'ttb-'+block.id;
    // In test mode only auto-open the first current block, not all
    const isFirstCurrent = (state==='current' && !_ttFirstCurrentOpened);
    if(state==='current'){
      wrapper.classList.add('state-current');
      if(isFirstCurrent){ wrapper.classList.add('open'); _ttFirstCurrentOpened=true; }
    }
    else if(state==='done') wrapper.classList.add('state-done');
    else if(state==='locked')  wrapper.classList.add('state-locked');
    else if(state==='normal')  wrapper.classList.add('state-past');
    else if(state==='break') wrapper.classList.add('state-break');

    // Status badge text
    const statusMap = {current:'🔴 CURRENT',done:'✅ COMPLETED',locked:'👁 UPCOMING',normal:'👁 VIEW ONLY',break:'☕ BREAK'};
    const statusColors = {current:'background:#DBEAFE;color:#1D4ED8',done:'background:#DCFCE7;color:#166534',locked:'background:#F3F4F6;color:#6B7280',normal:'background:#F3F4F6;color:#6B7280',break:'background:#F9FAFB;color:#9CA3AF'};

    const earnedPts = bState.pts || 0;

    wrapper.innerHTML = `
      <div class="tt-block-hdr" onclick="ttToggleBlock('${block.id}')">
        <div class="tt-block-icon" style="background:${block.iconBg}">${block.icon}</div>
        <div class="tt-block-meta">
          <div class="tt-block-time">${block.time}</div>
          <div class="tt-block-name" style="color:${block.color}">${block.name}</div>
        </div>
        <div class="tt-block-right">
          <span class="tt-status-badge" style="${statusColors[state]||statusColors.normal}">${statusMap[state]||'UPCOMING'}</span>
          <span class="tt-chevron">▼</span>
        </div>
      </div>
      <div class="tt-block-body" id="ttbody-${block.id}">
        ${state==='current'?'<div class="tt-current-indicator"><span class="tt-current-dot"></span>You are here right now!</div>':''}
        ${state==='locked'?'<div style="font-size:11px;font-weight:800;color:#6B7280;background:#F3F4F6;border-radius:8px;padding:6px 10px;margin-bottom:10px;display:flex;align-items:center;gap:6px"><span style=\"font-size:14px\">🔒</span> This block is coming up later — you can see what\'s inside but it will unlock at the right time!</div>':''}
        ${state==='normal'?'<div style="font-size:11px;font-weight:800;color:#6B7280;background:#F3F4F6;border-radius:8px;padding:6px 10px;margin-bottom:10px;display:flex;align-items:center;gap:6px"><span style=\"font-size:14px\">⏰</span> This block\'s time has passed. Tap Mark Done above if you completed it.</div>':''}
        ${block.type==='break'?'<div style="font-size:12px;color:#6B7280;padding:4px 0">Free time — relax, no tasks required.</div>':''}
        ${block.activities && block.activities.length>0 ? `
          <div class="tt-activities">
            ${block.activities.map(act=>{
              const isChecked = bState.checkedActs[act.id]||false;
              const cls = act.type==='parent'?'parent-pending':act.type==='link'?'linked':act.type==='wordbook'?'linked':'';

              // Special rendering: parent-select (child marks done, parent awards pts)
              if(act.type==='parent-select'){
                const isCheckedPs = bState.checkedActs[act.id]||false;
                return `
                  <div class="tt-act parent-pending ${isCheckedPs?'checked':''}" id="ttact-${act.id}"
                    style="cursor:pointer" onclick="ttToggleAct('${block.id}','${act.id}',0,'parent-select')">
                    <div class="tt-act-left">
                      <div class="tt-act-cb">${isCheckedPs?'\u2713':''}</div>
                      <div>
                        <div class="tt-act-name">${act.name}</div>
                        <div class="tt-act-sub">${act.note||''}</div>
                      </div>
                    </div>
                    <div class="tt-act-pts" style="color:#F59E0B">
                      ${isCheckedPs?'\u2713 Done · awaiting parent':'up to '+act.maxCalcPts+' pts \U0001f468\u200d\U0001f469\u200d\U0001f467'}
                    </div>
                  </div>`;
              }

              // Special rendering: text entry (moral values, proverbs)
              if(act.type==='text-entry'){
                const isCheckedTe = bState.checkedActs[act.id]||false;
                const savedText   = (bState.textEntries && bState.textEntries[act.id]) || '';
                return `
                  <div class="tt-act ${isCheckedTe?'checked':''}" id="ttact-${act.id}"
                    style="flex-direction:column;align-items:flex-start;gap:8px;cursor:default">
                    <div style="display:flex;align-items:center;gap:10px;width:100%;cursor:pointer"
                      onclick="ttToggleTextEntry('${block.id}','${act.id}',${act.pts})">
                      <div class="tt-act-cb">${isCheckedTe?'\u2713':''}</div>
                      <div style="flex:1">
                        <div class="tt-act-name">${act.name}</div>
                        <div class="tt-act-sub">${act.note||''}</div>
                      </div>
                      <div class="tt-act-pts" style="color:${block.color}">+${act.pts} pts</div>
                    </div>
                    <div id="te-panel-${act.id}" style="display:${isCheckedTe?'block':'none'};width:100%">
                      <textarea id="te-text-${act.id}" rows="3"
                        style="width:100%;background:#FFFBF0;border:1.5px solid #FDE68A;border-radius:10px;
                          padding:10px 12px;font-size:13px;font-family:'Nunito',sans-serif;
                          color:#1E1B4B;resize:none;outline:none;box-sizing:border-box;line-height:1.7"
                        placeholder="${act.note||'Write your thoughts here...'}"
                        onfocus="this.style.borderColor='#F59E0B'" onblur="this.style.borderColor='#FDE68A'"
                        oninput="ttSaveTextEntry('${block.id}','${act.id}')"
                        >${savedText}</textarea>
                      <button id="te-save-btn-${act.id}"
                        onclick="ttSaveTextEntryToGallery('${block.id}','${act.id}','${act.galleryKey||act.entryKey||act.id}','${act.name}')"
                        style="margin-top:6px;padding:6px 16px;border-radius:8px;border:none;
                          background:${block.color};color:#fff;font-size:11px;font-weight:900;
                          cursor:pointer;font-family:'Nunito',sans-serif">
                        Save to Gallery
                      </button>
                    </div>
                  </div>`;
              }

              // Special rendering: points dropdown selector
              if(act.type==='dropdown'){
                const isCheckedDd = bState.checkedActs[act.id]||false;
                const savedDdPts  = (bState.ddPts && bState.ddPts[act.id]) || 0;
                const opts = (act.options||[3,5,7,10]).map(v =>
                  `<button onclick="ttSelectDropdownPts('${block.id}','${act.id}',${v})"
                    id="ddopt-${act.id}-${v}"
                    style="padding:5px 12px;border-radius:8px;font-size:12px;font-weight:900;cursor:pointer;
                      font-family:'Nunito',sans-serif;border:1.5px solid ${block.color}30;
                      background:${savedDdPts===v?block.color:'#fff'};
                      color:${savedDdPts===v?'#fff':block.color};transition:all .15s">
                    ${v} pts
                  </button>`
                ).join('');
                return `
                  <div class="tt-act ${isCheckedDd?'checked':''}" id="ttact-${act.id}"
                    style="flex-direction:column;align-items:flex-start;gap:6px;cursor:default">
                    <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
                      <div>
                        <div class="tt-act-name">${act.name}</div>
                        <div class="tt-act-sub">${act.note||'Select points earned'}</div>
                      </div>
                      <div class="tt-act-pts" style="color:${block.color}" id="ttact-pts-${act.id}">
                        ${savedDdPts>0?'+'+savedDdPts+' pts':'0 pts'}
                      </div>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">${opts}</div>
                  </div>`;
              }

              // Special rendering: percentage calculator
              if(act.type==='pct-calc'){
                const isCheckedPct = bState.checkedActs[act.id]||false;
                return `<div class="tt-act ${isCheckedPct?'checked':''}" id="ttact-${act.id}"
                  style="flex-direction:column;align-items:flex-start;gap:0;cursor:default;padding:0;border:none;background:transparent">
                  <div style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid #E5E7EB;background:${isCheckedPct?'#ECFDF5':'#FAFAFA'};cursor:pointer;box-sizing:border-box;transition:all .15s"
                    onclick="ttTogglePctCalc('${block.id}','${act.id}')">
                    <div class="tt-act-cb" style="display:flex">${isCheckedPct?'✓':''}</div>
                    <div style="flex:1">
                      <div class="tt-act-name">${act.name}</div>
                      <div class="tt-act-sub">Tap to enter marks · auto-calculates pts · max ${act.maxCalcPts} pts</div>
                    </div>
                    <div class="tt-act-pts" style="color:${block.color}" id="ttact-pts-${act.id}">
                      ${(bState.calcPts&&bState.calcPts[act.id])||0} pts
                    </div>
                  </div>
                  <div id="pctcalc-${act.id}" style="display:${isCheckedPct?'block':'none'};width:100%;margin-top:6px">
                    ${ttPctCalcHTML(act.id, act.maxCalcPts, block.color, bState)}
                  </div>
                </div>`;
              }

              // Special rendering: inline wordbook entry
              if(act.type==='wordbook'){
                return `<div class="tt-act linked" id="ttact-${act.id}" style="flex-direction:column;align-items:flex-start;gap:10px;cursor:default">
                  <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
                    <div>
                      <div class="tt-act-name">📖 ${act.name}</div>
                      <div class="tt-act-sub">${act.note||''}</div>
                    </div>
                    <div class="tt-act-pts" style="color:${block.color}">+${act.pts} pts 📖</div>
                  </div>
                  ${ttWordEntryHTML()}
                </div>`;
              }

              // For brain-linked activities: read live pts from global variable
              let displayPts = act.pts;
              let displayChecked = isChecked;
              if(act.type==='link' && typeof _TT_BRAIN_MAP!=='undefined' && _TT_BRAIN_MAP[act.id]){
                displayPts = _TT_BRAIN_MAP[act.id]();
                displayChecked = displayPts > 0;
              }

              return `
                <div class="tt-act ${cls} ${displayChecked?'checked':''}" id="ttact-${act.id}"
                  onclick="${act.type==='link'?`ttGoToTab('${act.tab||'brain'}')`:`ttToggleAct('${block.id}','${act.id}',${act.pts},'${act.type}')`}">
                  <div class="tt-act-left">
                    <div class="tt-act-cb">${displayChecked?'✓':''}</div>
                    <div>
                      <div class="tt-act-name">${act.name}</div>
                      ${act.note?`<div class="tt-act-sub">${act.note}</div>`:''}
                    </div>
                  </div>
                  <div class="tt-act-pts" style="color:${displayPts>0?block.color:'#9CA3AF'}" id="ttact-pts-${act.id}">+${displayPts} pts${act.type==='parent'?' 👨‍👩‍👧':act.type==='link'?' 🔗':''}</div>
                </div>`;
            }).join('')}
          </div>
          <div class="tt-block-pts-row" style="margin-top:10px">
            <span style="font-size:11px;font-weight:800;color:#6B7280">Points earned this block</span>
            <span style="font-size:14px;font-weight:900;color:${block.color}" id="ttpts-${block.id}">${earnedPts} pts</span>
          </div>
          ${(state==='current'||state==='normal') && state!=='break' && block.maxPts>0 ? `
            <button class="tt-mark-done-btn ${bState.markedDone?'done':'primary'}" onclick="ttMarkDone('${block.id}')">
              ${bState.markedDone?'✅ Block completed!':'✅ Mark this block as done'}
            </button>`:''}`:''}
      </div>`;
    container.appendChild(wrapper);
  });
}

// ── Collect timetable pts for calcDayPts ──────────────────────
function ttGetTotalPts(){
  // Only sum the ACTIVE schedule's blocks to prevent cross-contamination
  const activeSchedule = ttGetSchedule();
  const activeIds = new Set(activeSchedule.map(b=>b.id));
  let total = 0;
  Object.keys(ttBlockStates).forEach(id=>{
    if(!activeIds.has(id)) return;
    const bst = ttBlockStates[id];
    let blockPts = bst.pts||0;
    // Brain-lab activity points are counted once via brainPtsToday in calcDayPts().
    // They are synced into timetable blocks for DISPLAY only, so subtract them here
    // to avoid double-counting them in the day total.
    if(bst.linkPts) Object.values(bst.linkPts).forEach(v => blockPts -= (v||0));
    total += blockPts;
  });
  return total;
}

// ── Override timetable select with full points on rpt-tt ──────
function ttSyncRptTT(){
  // Set rpt-tt to max value so existing calcDayPts adds the timetable bonus
  const sel=document.getElementById('rpt-tt');
  if(sel) sel.value='15';
}

// ── LIVE CLOCK ────────────────────────────────────────────────
function ttUpdateClock(){
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const mStr = m < 10 ? '0'+m : m;
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const el = document.getElementById('tt-clock-display');
  const apEl = document.getElementById('tt-clock-ampm');
  const dayEl = document.getElementById('tt-clock-day');
  if(el) el.textContent = h12+':'+mStr;
  if(apEl) apEl.textContent = ampm;
  if(dayEl) dayEl.textContent = days[now.getDay()];
}
setInterval(ttUpdateClock, 1000);
ttUpdateClock();

// ── MINI SCHEDULE in left panel ───────────────────────────────
function ttRenderMiniSchedule(){
  const container = document.getElementById('tt-mini-schedule');
  const titleEl   = document.getElementById('tt-schedule-title');
  if(!container) return;
  const schedule = ttGetSchedule();
  const nowH = ttNowHour();
  const isWE = ttGetSchedule() === TT_WEEKEND;
  if(titleEl) titleEl.textContent = (isWE || ttIsHoliday) ? '☀️ Weekend Schedule' : '🏫 Weekday Schedule';

  container.innerHTML = schedule.map(block => {
    const state = ttBlockState(block, nowH);
    const isCurrent = state === 'current';
    const isDone    = state === 'done';
    const isBreak   = state === 'break';
    const bState    = ttBlockStates[block.id]||{};

    let bg = '#FAFAFA', border = '#E5E7EB', textColor = '#6B7280';
    if(isCurrent){ bg='#DBEAFE'; border='#3B82F6'; textColor='#1D4ED8'; }
    else if(isDone){ bg='#DCFCE7'; border='#10B981'; textColor='#166534'; }
    else if(isBreak){ bg='#F9FAFB'; border='#E5E7EB'; textColor='#9CA3AF'; }

    const pts = bState.pts || 0;
    const ptsText = (block.maxPts > 0 && pts > 0) ? ' · '+pts+' pts ✓' : '';

    return `<div style="display:flex;align-items:center;gap:7px;padding:5px 8px;border-radius:9px;background:${bg};border:1.5px solid ${border};cursor:pointer;transition:all .15s"
      onclick="ttToggleBlock('${block.id}');document.getElementById('ttb-${block.id}')?.scrollIntoView({behavior:'smooth',block:'center'})">
      <span style="font-size:14px;line-height:1;flex-shrink:0">${block.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:9px;font-weight:900;color:${textColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${block.name}${isCurrent?' 🔴':isDone?' ✅':''}</div>
        <div style="font-size:8px;color:${textColor};opacity:.8">${block.time}${ptsText}</div>
      </div>
    </div>`;
  }).join('');
}

// ── Wordbook inline entry HTML (used inside Book Reading block) ──
function ttWordEntryHTML(){
  return `
  <div style="width:100%;background:#F0FDF4;border-radius:12px;padding:14px;border:1.5px solid #A7F3D0">
    <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#065F46;margin-bottom:10px">
      📝 Write 3 new words — Word, Meaning and an Example Sentence:
    </div>
    ${[1,2,3].map(n=>`
    <div style="margin-bottom:10px;background:#fff;border-radius:10px;padding:10px 12px;border:1.5px solid #D1FAE5">
      <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#059669;margin-bottom:6px">Word ${n}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
        <input type="text" id="word${n}" placeholder="e.g. perseverance"
          style="padding:7px 10px;border-radius:8px;border:1.5px solid #D1FAE5;font-size:12px;font-family:'Nunito',sans-serif;background:#F0FDF4;color:#065F46;outline:none;box-sizing:border-box"
          oninput="calcWordPts();checkWordSaved()" onfocus="this.style.borderColor='#059669'" onblur="this.style.borderColor='#D1FAE5'">
        <input type="text" id="mean${n}" placeholder="Meaning"
          style="padding:7px 10px;border-radius:8px;border:1.5px solid #D1FAE5;font-size:12px;font-family:'Nunito',sans-serif;background:#F0FDF4;color:#065F46;outline:none;box-sizing:border-box"
          oninput="calcWordPts();checkWordSaved()" onfocus="this.style.borderColor='#059669'" onblur="this.style.borderColor='#D1FAE5'">
      </div>
      <input type="text" id="exam${n}" placeholder="Example sentence (required to save)"
        style="width:100%;padding:7px 10px;border-radius:8px;border:1.5px solid #D1FAE5;font-size:12px;font-family:'Nunito',sans-serif;background:#F0FDF4;color:#065F46;outline:none;box-sizing:border-box"
        oninput="checkWordSaved()" onfocus="this.style.borderColor='#059669'" onblur="this.style.borderColor='#D1FAE5'">
    </div>`).join('')}
    <div id="save-wordbook-wrap" style="margin-top:4px">
      <button id="save-wordbook-btn" onclick="saveWordsToWordBook()"
        style="width:100%;padding:10px;border-radius:10px;border:none;
          background:linear-gradient(135deg,#059669,#047857);color:#fff;
          font-size:13px;font-weight:900;cursor:pointer;font-family:'Nunito',sans-serif;
          box-shadow:0 4px 12px rgba(5,150,105,.3)">
        💾 Save to My Wordbook
      </button>
      <div id="save-wordbook-status" style="font-size:11px;font-weight:800;color:#059669;margin-top:6px;text-align:center;min-height:16px"></div>
    </div>
  </div>`;
}

// ── Percentage Calculator for Maths blocks ────────────────────
function ttPctCalcHTML(actId, maxPts, color, bState){
  const saved    = bState.calcPts && bState.calcPts[actId] ? bState.calcPts[actId] : 0;
  const savedObt = bState.calcObt && bState.calcObt[actId] ? bState.calcObt[actId] : '';
  const savedTot = bState.calcTot && bState.calcTot[actId] ? bState.calcTot[actId] : '';
  const savedPct = savedObt && savedTot ? Math.round(savedObt/savedTot*100) : 0;

  // Pre-build result bar if saved data exists
  let savedResultHTML = '';
  if(savedObt && savedTot && saved > 0){
    const {grade, gradeColor} = _ttGradeInfo(savedPct);
    savedResultHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:5px;padding:4px 8px;background:#F0FDF4;border-radius:7px;border:1px solid #BBF7D0">
        <span style="font-size:11px;font-weight:800;color:${gradeColor}">${savedPct}% — ${grade}</span>
        <span style="font-size:12px;font-weight:900;color:${gradeColor}">+${saved} pts ✅</span>
      </div>`;
  }

  return `
  <div style="background:#F8FAFF;border:1px solid #BFDBFE;border-radius:9px;padding:8px 10px;margin-top:4px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
      <span style="font-size:11px;font-weight:900;color:#2563EB">📊 Marks</span>
      <input type="number" id="pct-obt-${actId}" min="0" placeholder="Obtained"
        value="${savedObt}"
        style="width:70px;padding:4px 7px;border-radius:6px;border:1.5px solid #BFDBFE;
          font-size:12px;font-weight:800;color:#1E1B4B;background:#fff;
          font-family:'Nunito',sans-serif;outline:none;text-align:center"
        oninput="ttCalcPct('${actId}',${maxPts},'${color}')"
        onfocus="this.style.borderColor='#3B82F6'" onblur="this.style.borderColor='#BFDBFE'">
      <span style="font-size:11px;color:#6B7280;font-weight:700">/</span>
      <input type="number" id="pct-tot-${actId}" min="1" placeholder="Total"
        value="${savedTot}"
        style="width:70px;padding:4px 7px;border-radius:6px;border:1.5px solid #BFDBFE;
          font-size:12px;font-weight:800;color:#1E1B4B;background:#fff;
          font-family:'Nunito',sans-serif;outline:none;text-align:center"
        oninput="ttCalcPct('${actId}',${maxPts},'${color}')"
        onfocus="this.style.borderColor='#3B82F6'" onblur="this.style.borderColor='#BFDBFE'">
      <span style="font-size:10px;color:#9CA3AF;font-weight:700">max ${maxPts} pts</span>
    </div>
    <div id="pct-result-${actId}">${savedResultHTML}</div>
  </div>`;
}

// ── Grade helper — shared by HTML builder and calc ─────────────
function _ttGradeInfo(pct){
  if(pct===100)  return {grade:'🌟 Perfect! Full marks!',  gradeColor:'#059669'};
  if(pct>=90)    return {grade:'⭐ Excellent! 90%+',       gradeColor:'#0284C7'};
  if(pct>=80)    return {grade:'👍 Very Good! 80%+',       gradeColor:'#2563EB'};
  if(pct>=70)    return {grade:'📚 Good! 70%+',            gradeColor:'#7C3AED'};
  if(pct>=60)    return {grade:'✏️ Fair 60%+',              gradeColor:'#D97706'};
  if(pct>=40)    return {grade:'💪 Keep trying! 40%+',     gradeColor:'#EA580C'};
  return              {grade:'🔄 Practice more!',           gradeColor:'#DC2626'};
}

// ── Toggle pct-calc section open/close ─────────────────────────
function ttTogglePctCalc(blockId, actId){
  if(!ttBlockStates[blockId]) ttBlockStates[blockId]={pts:0,checkedActs:{},markedDone:false,calcPts:{},calcObt:{},calcTot:{}};
  const bState = ttBlockStates[blockId];
  const wasChecked = bState.checkedActs[actId]||false;
  bState.checkedActs[actId] = !wasChecked;

  // If unchecking, remove the calc pts
  if(wasChecked){
    const oldPts = (bState.calcPts&&bState.calcPts[actId])||0;
    bState.pts = Math.max(0, bState.pts - oldPts);
    if(bState.calcPts) delete bState.calcPts[actId];
    if(bState.calcObt) delete bState.calcObt[actId];
    if(bState.calcTot) delete bState.calcTot[actId];
  }

  const panel = document.getElementById('pctcalc-'+actId);
  const actEl = document.getElementById('ttact-'+actId);
  const ptsEl = document.getElementById('ttact-pts-'+actId);
  if(panel) panel.style.display = bState.checkedActs[actId] ? 'block' : 'none';
  if(actEl){
    const row = actEl.querySelector('[onclick*="ttTogglePctCalc"]');
    if(row) row.style.background = bState.checkedActs[actId] ? '#ECFDF5' : '#FAFAFA';
    const cb = actEl.querySelector('.tt-act-cb');
    if(cb) cb.textContent = bState.checkedActs[actId] ? '✓' : '';
  }
  if(ptsEl) ptsEl.textContent = '0 pts';
  ttUpdateBlockPts(blockId);
  calcDayPts();
}

// ── Live percentage calculation ────────────────────────────────
function ttCalcPct(actId, maxPts, color){
  const obt = parseFloat(document.getElementById('pct-obt-'+actId)?.value)||0;
  const tot = parseFloat(document.getElementById('pct-tot-'+actId)?.value)||0;
  const resultEl = document.getElementById('pct-result-'+actId);
  const ptsEl    = document.getElementById('ttact-pts-'+actId);
  if(!resultEl) return;

  if(!tot || obt < 0){
    resultEl.innerHTML = '';
    return;
  }

  const pct = Math.round(obt/tot*100);

  // New points scale: only 100% = full marks
  let pts;
  if(pct===100)    pts = maxPts;
  else if(pct>=90) pts = Math.round(maxPts*0.85);
  else if(pct>=80) pts = Math.round(maxPts*0.70);
  else if(pct>=70) pts = Math.round(maxPts*0.55);
  else if(pct>=60) pts = Math.round(maxPts*0.40);
  else if(pct>=40) pts = Math.round(maxPts*0.20);
  else             pts = 0;

  const {grade, gradeColor} = _ttGradeInfo(pct);

  // Progress bar width (capped at 100)
  const barW = Math.min(100, pct);

  resultEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;padding:4px 8px;background:#F0FDF4;border-radius:7px;border:1px solid #BBF7D0">
      <div>
        <span style="font-size:11px;font-weight:900;color:${gradeColor}">${pct}% — ${grade}</span>
        <div style="background:#E5E7EB;border-radius:3px;height:5px;overflow:hidden;margin-top:3px;width:120px">
          <div style="width:${barW}%;height:100%;background:${gradeColor};border-radius:3px;transition:width .4s"></div>
        </div>
      </div>
      <span style="font-size:13px;font-weight:900;color:${gradeColor};margin-left:10px">+${pts} pts</span>
    </div>`;

  if(ptsEl) ptsEl.textContent = '+'+pts+' pts';

  // Save into block state
  // Find which block this activity belongs to
  const schedule = ttGetSchedule();
  for(const block of schedule){
    const act = (block.activities||[]).find(a=>a.id===actId);
    if(act){
      if(!ttBlockStates[block.id]) ttBlockStates[block.id]={pts:0,checkedActs:{},markedDone:false};
      const bst = ttBlockStates[block.id];
      if(!bst.calcPts) bst.calcPts={};
      if(!bst.calcObt) bst.calcObt={};
      if(!bst.calcTot) bst.calcTot={};
      const oldPts = bst.calcPts[actId]||0;
      bst.pts = Math.max(0, bst.pts - oldPts + pts);
      bst.calcPts[actId] = pts;
      bst.calcObt[actId] = obt;
      bst.calcTot[actId] = tot;
      ttUpdateBlockPts(block.id);
      calcDayPts();
      break;
    }
  }
}

// ── Dropdown points selector ───────────────────────────────────
function ttSelectDropdownPts(blockId, actId, selectedPts){
  if(!ttBlockStates[blockId]) ttBlockStates[blockId]={pts:0,checkedActs:{},markedDone:false};
  const bState = ttBlockStates[blockId];
  if(!bState.ddPts) bState.ddPts = {};

  // Remove old pts
  const oldPts = bState.ddPts[actId] || 0;
  bState.pts = Math.max(0, bState.pts - oldPts);

  // Toggle off if same pts selected again
  if(oldPts === selectedPts){
    bState.ddPts[actId] = 0;
    bState.checkedActs[actId] = false;
  } else {
    bState.ddPts[actId] = selectedPts;
    bState.pts += selectedPts;
    bState.checkedActs[actId] = true;
  }

  // Update button visuals
  const act = ttGetSchedule().flatMap(b=>b.activities||[]).find(a=>a.id===actId);
  const block = ttGetSchedule().find(b=>(b.activities||[]).some(a=>a.id===actId));
  const opts = act?.options||[3,5,7,10];
  opts.forEach(v=>{
    const btn = document.getElementById('ddopt-'+actId+'-'+v);
    if(btn){
      const active = bState.ddPts[actId]===v;
      btn.style.background = active?(block?.color||'#7C3AED'):'#fff';
      btn.style.color      = active?'#fff':(block?.color||'#7C3AED');
    }
  });

  // Update pts display
  const ptsEl = document.getElementById('ttact-pts-'+actId);
  const actEl = document.getElementById('ttact-'+actId);
  const curPts = bState.ddPts[actId]||0;
  if(ptsEl) ptsEl.textContent = curPts>0?'+'+curPts+' pts':'0 pts';
  if(actEl){
    if(curPts>0) actEl.classList.add('checked');
    else actEl.classList.remove('checked');
  }

  ttUpdateBlockPts(blockId);
  calcDayPts();
}

// ── Text Entry (moral values, proverbs) ───────────────────────
function ttToggleTextEntry(blockId, actId, pts){
  if(!ttBlockStates[blockId]) ttBlockStates[blockId]={pts:0,checkedActs:{},markedDone:false};
  const bState = ttBlockStates[blockId];
  const wasChecked = bState.checkedActs[actId]||false;
  bState.checkedActs[actId] = !wasChecked;
  if(wasChecked){ bState.pts = Math.max(0, bState.pts - pts); }
  else { bState.pts += pts; }
  const panel = document.getElementById('te-panel-'+actId);
  const actEl = document.getElementById('ttact-'+actId);
  if(panel) panel.style.display = bState.checkedActs[actId] ? 'block' : 'none';
  if(actEl){
    if(bState.checkedActs[actId]) actEl.classList.add('checked');
    else actEl.classList.remove('checked');
    const cb = actEl.querySelector('.tt-act-cb');
    if(cb) cb.textContent = bState.checkedActs[actId] ? '\u2713' : '';
  }
  ttUpdateBlockPts(blockId); calcDayPts();
}

function ttSaveTextEntry(blockId, actId){
  if(!ttBlockStates[blockId]) return;
  const ta = document.getElementById('te-text-'+actId);
  if(!ta) return;
  if(!ttBlockStates[blockId].textEntries) ttBlockStates[blockId].textEntries = {};
  ttBlockStates[blockId].textEntries[actId] = ta.value;
}

async function ttSaveTextEntryToGallery(blockId, actId, galleryKey, actName){
  const ta = document.getElementById('te-text-'+actId);
  if(!ta || !ta.value.trim()){ toast('Please write something first!'); return; }
  ttSaveTextEntry(blockId, actId);
  const date = document.getElementById('rpt-date')?.value || new Date().toLocaleDateString('en-CA');
  if(!_supabase){ toast('Not connected to database.'); return; }
  const btn = document.getElementById('te-save-btn-'+actId);
  if(btn){ btn.disabled=true; btn.textContent='Saving...'; }
  try{
    const {error} = await _supabase.from('vaanya_creative_works').insert([{
      date, activity_key: galleryKey, activity_name: actName,
      text_content: ta.value.trim(), created_at: new Date().toISOString(),
    }]);
    if(error) throw error;
    if(btn){ btn.disabled=false; btn.textContent='Saved to Gallery!'; }
    toast('Saved to Gallery!');
    setTimeout(()=>{ if(btn){ btn.textContent='Save to Gallery'; btn.disabled=false; } },3000);
    _cgLoaded = false;
  } catch(e){
    console.error('Gallery save error:',e);
    if(btn){ btn.disabled=false; btn.textContent='Save to Gallery'; }
    toast('Could not save. Check connection.');
  }
}

// ── Brain Lab → Timetable point sync ──────────────────────────
let _ttSyncing = false;
// Maps timetable activity IDs to their brain lab global variable
const _TT_BRAIN_MAP = {
  // Holiday: Maths Deep Practice block
  'we-ma3': ()=>mathsPtsToday,   // Brain Lab Maths Sprint
  'we-ma4': ()=>logicPtsTotal,   // Brain Lab Logic
  // Holiday: Brain Lab + Focus block
  'we-br1': ()=>sudokuPts,       // Sudoku
  'we-br2': ()=>riddlePtsTotal,  // Riddles
  // Weekday: Homework & Study block
  'wd-st2': ()=>mathsPtsToday,   // Brain Lab Maths Sprint
  'wd-st3': ()=>logicPtsTotal,   // Brain Lab Logic
  'wd-st4': ()=>sudokuPts,       // Sudoku
};

function ttSyncBrainLabPts(){
  if(_ttSyncing) return; _ttSyncing=true;

  const schedule = ttGetSchedule();

  schedule.forEach(block => {
    const acts = block.activities || [];
    const brainActs = acts.filter(a => a.type==='link' && _TT_BRAIN_MAP && _TT_BRAIN_MAP[a.id]);
    if(!brainActs.length) return;

    // Ensure block state exists
    if(!ttBlockStates[block.id])
      ttBlockStates[block.id] = {pts:0, checkedActs:{}, markedDone:false, linkPts:{}};
    if(!ttBlockStates[block.id].linkPts)
      ttBlockStates[block.id].linkPts = {};

    const bst = ttBlockStates[block.id];

    // Recalculate block pts from scratch: self + pct-calc + dropdown + brain
    let selfPts = 0;
    acts.forEach(act => {
      if(act.type==='self' && bst.checkedActs[act.id]) selfPts += (act.pts||0);
      if(act.type==='pct-calc' && bst.calcPts && bst.calcPts[act.id]) selfPts += bst.calcPts[act.id];
      if(act.type==='dropdown' && bst.ddPts && bst.ddPts[act.id]) selfPts += bst.ddPts[act.id];
      if(act.type==='text-entry' && bst.checkedActs[act.id]) selfPts += (act.pts||0);
    });

    // Sum all live brain lab pts
    let brainTotal = 0;
    brainActs.forEach(act => {
      const livePts = _TT_BRAIN_MAP[act.id]();
      bst.linkPts[act.id] = livePts;
      if(livePts > 0) bst.checkedActs[act.id] = true;
      else delete bst.checkedActs[act.id];
      brainTotal += livePts;

      // Update pts display
      const ptsEl = document.getElementById('ttact-pts-'+act.id);
      if(ptsEl){
        ptsEl.textContent = '+'+livePts+' pts';
        ptsEl.style.color = livePts > 0 ? block.color : '#9CA3AF';
      }
      // Update checkbox
      const actEl = document.getElementById('ttact-'+act.id);
      if(actEl){
        if(livePts > 0) actEl.classList.add('checked');
        else actEl.classList.remove('checked');
        const cb = actEl.querySelector('.tt-act-cb');
        if(cb) cb.textContent = livePts > 0 ? '\u2713' : '';
      }
    });

    // Set block total
    bst.pts = selfPts + brainTotal;

    // Update footer
    const footerEl = document.getElementById('ttpts-'+block.id);
    if(footerEl) footerEl.textContent = bst.pts + ' pts earned';
  });

  _ttSyncing = false;
  // calcDayPts is NOT called here — it reads ttBlockStates directly via ttGetTotalPts()
  // The caller (brain lab check fn) calls calcDayPts after this sync
}

// ── Poem text formatting (Bold/Italic/Underline via markdown-style markers) ──
function cmFormatText(type){
  const ta = document.getElementById('cm-text-input');
  if(!ta) return;
  const start = ta.selectionStart;
  const end   = ta.selectionEnd;
  const selected = ta.value.substring(start, end);
  if(!selected){ toast('Select some text first, then tap the format button!'); return; }

  const markers = {bold:'**', italic:'_', underline:'__'};
  const m = markers[type];
  const already = selected.startsWith(m) && selected.endsWith(m);
  let replacement;
  if(already){
    replacement = selected.slice(m.length, -m.length); // remove formatting
  } else {
    replacement = m + selected + m;
  }
  ta.value = ta.value.substring(0,start) + replacement + ta.value.substring(end);
  ta.selectionStart = start;
  ta.selectionEnd   = start + replacement.length;
  ta.focus();
  onCreativeTextInput();
}

function bootApp(){ // was top-level boot; now deferred until login+onboarding done
buildAll();
_sessionWireInputs(); // start per-date session tracking
_sessionStartAutoSave(); // background Supabase auto-save every 60s

updateTopBar();
calcDayPts();
updateSidePanels(0);
// Load from Supabase cloud on startup
loadFromSupabase().then(ok => {
  if (ok) {
    updateTopBar();
    const today = document.getElementById('rpt-date')?.value;
    if(today) _onLoadRestoreDate(today);
    // If parent tab is open and unlocked, re-render it now that savedDays is loaded
    if(parentUnlocked && document.getElementById('tab-parent')?.classList.contains('active')){
      renderParentTab();
      renderParentShlokaApproval();
      renderParentShlokaMgmt();
      renderPendingQueue();
    }
  } else {
    // Fallback: try localStorage backup
    try {
      const local = localStorage.getItem('vaanya_days');
      if (local) { savedDays = JSON.parse(local); updateTopBar(); toast('📱 Loaded from local backup (offline mode)'); }
    } catch(e) {}
    // Try session restore offline
    const today = document.getElementById('rpt-date')?.value;
    if(today){
      const snap = _sessionLoadForDate(today);
      if(snap){ _restoreFormFromSnap(snap); toast('📱 Offline — restored your last saved work!'); }
    }
  }
});
}
window.bootApp = bootApp; // shell calls this once Child Zone opens

// ════════════════════════════════════════════════════════════════
// CREATIVE GALLERY — load, filter, display from Supabase
// ════════════════════════════════════════════════════════════════
const _CG_MAP = {
  draw:         {icon:'🎨', label:'Drawing / Painting', dotColor:'#F97316', textBg:'#FFF7ED', textColor:'#92400E'},
  poem:         {icon:'✍️',  label:'Poem',               dotColor:'#8B5CF6', textBg:'#F5F3FF', textColor:'#5B21B6'},
  story:        {icon:'📖', label:'Story',               dotColor:'#3B82F6', textBg:'#EFF6FF', textColor:'#1E3A8A'},
  craft:        {icon:'✂️',  label:'Paper Craft',         dotColor:'#10B981', textBg:'#ECFDF5', textColor:'#065F46'},
  mandala:      {icon:'🌸', label:'Mandala Art',          dotColor:'#EC4899', textBg:'#FDF2F8', textColor:'#9D174D'},
  journal:      {icon:'📔', label:'Journal',              dotColor:'#F59E0B', textBg:'#FFFDE7', textColor:'#92400E'},
  moral_values:      {icon:'📿', label:'Moral Values',        dotColor:'#065F46', textBg:'#F0FDF4', textColor:'#065F46'},
  proverb:           {icon:'💬', label:'Proverb',             dotColor:'#7C3AED', textBg:'#F5F3FF', textColor:'#5B21B6'},
  ai_notes:          {icon:'🤖', label:'AI Notes',            dotColor:'#2563EB', textBg:'#EFF6FF', textColor:'#1E3A8A'},
  ayurvedic_notes:   {icon:'🌿', label:'Ayurvedic Notes',     dotColor:'#059669', textBg:'#ECFDF5', textColor:'#065F46'},
  vedas_notes:       {icon:'🕉️', label:'Vedas Notes',         dotColor:'#D97706', textBg:'#FFFBEB', textColor:'#92400E'},
  interesting_facts: {icon:'🏛️', label:'Interesting Facts',   dotColor:'#7C3AED', textBg:'#F5F3FF', textColor:'#5B21B6'},
};

async function loadCreativeGallery(force=false){
  if(_cgLoaded && !force) return;
  _cgLoaded = true;

  const loading = document.getElementById('cg-loading');
  const grid    = document.getElementById('cg-grid');
  const empty   = document.getElementById('cg-empty');
  if(loading) loading.style.display='block';
  if(grid)    grid.style.display='none';
  if(empty)   empty.style.display='none';

  if(!_supabase){
    if(loading) loading.textContent='⚠️ Not connected to database.';
    return;
  }

  try{
    const {data, error} = await _supabase
      .from('vaanya_creative_works')
      .select('*')
      .order('created_at', {ascending: false});

    if(error){ throw error; }

    _cgAllWorks = data || [];
    cgUpdateStats();
    cgSetFilter(_cgFilter, null);

    if(loading) loading.style.display='none';
  } catch(e){
    console.error('Gallery load error:', e);
    if(loading) loading.textContent='⚠️ Could not load gallery. Check your connection.';
  }
}

function cgUpdateStats(){
  const total = _cgAllWorks.length;
  // Update badge count in header
  const badge = document.getElementById('cg-total-badge');
  if(badge){
    const numDiv = badge.querySelector('div');
    if(numDiv) numDiv.textContent = total;
  }
}

function cgSetFilter(key, btn){
  _cgFilter = key;
  _cgShown  = 0;

  // Update button active state
  if(btn){
    document.querySelectorAll('.cg-filter').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
  }

  _cgFiltered = key==='all'
    ? _cgAllWorks
    : _cgAllWorks.filter(w=>w.activity_key===key);

  cgRenderGrid(true);
}

function cgRenderGrid(reset=false){
  const grid  = document.getElementById('cg-grid');
  const empty = document.getElementById('cg-empty');
  const more  = document.getElementById('cg-load-more');
  if(!grid) return;

  if(reset) grid.innerHTML='';

  if(_cgFiltered.length===0){
    grid.style.display='none';
    if(empty)empty.style.display='block';
    if(more)more.style.display='none';
    return;
  }

  if(empty) empty.style.display='none';
  grid.style.display='grid';

  const slice = _cgFiltered.slice(_cgShown, _cgShown + _cgPageSize);
  slice.forEach((work, i) => {
    const card = cgBuildCard(work, _cgShown + i);
    grid.appendChild(card);
  });

  _cgShown += slice.length;

  if(more){
    more.style.display = _cgShown < _cgFiltered.length ? 'block' : 'none';
  }
}

function cgLoadMore(){ cgRenderGrid(false); }

function cgBuildCard(work, idx){
  const meta  = _CG_MAP[work.activity_key] || {icon:'🎨',label:work.activity_name,dotColor:'#8B5CF6',textBg:'#F5F3FF',textColor:'#5B21B6'};
  const isPhoto = work.activity_key==='draw'||work.activity_key==='craft'||work.activity_key==='mandala';
  const dateStr = work.date ? new Date(work.date+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '';

  const card = document.createElement('div');
  card.className = 'cg-card';
  card.onclick = () => cgOpenDetail(idx);

  // Thumbnail
  let thumbHtml = '';
  if(isPhoto && work.photo_data){
    thumbHtml = `<img src="${work.photo_data}" alt="${meta.label}" style="width:100%;height:100%;object-fit:cover">`;
  } else if(isPhoto){
    thumbHtml = `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;background:${meta.textBg};width:100%;height:100%;justify-content:center">
      <span style="font-size:38px;line-height:1">${meta.icon}</span>
      <span style="font-size:10px;font-weight:700;color:${meta.textColor}">Photo saved</span>
    </div>`;
  } else if(work.activity_key==='journal'){
    let preview = '';
    try{
      const ex = work.extra_json ? JSON.parse(work.extra_json) : {};
      preview = [ex.grateful1, ex.grateful2, ex.happyMoment].filter(Boolean).join(' · ');
    } catch(e){ preview = work.text_content||''; }
    thumbHtml = `<div class="cg-thumb-text" style="background:${meta.textBg}">
      <p class="cg-preview" style="color:${meta.textColor};font-size:11px">${preview||'Journal entry'}</p>
    </div>`;
  } else {
    const preview = (work.text_content||'').substring(0,180);
    const isPoem = work.activity_key==='poem';
    thumbHtml = `<div class="cg-thumb-text" style="background:${meta.textBg}">
      <p class="cg-preview" style="color:${meta.textColor};${isPoem?'font-family:Georgia,serif;':''}font-size:11px">${preview}</p>
    </div>`;
  }

  card.innerHTML = `
    <div class="cg-thumb" style="position:relative">
      ${thumbHtml}
      <div class="cg-ribbon">${meta.icon} ${meta.label}</div>
    </div>
    <div class="cg-card-body">
      <div class="cg-card-type">${meta.icon} ${meta.label}</div>
      <div class="cg-card-date">📅 ${dateStr}</div>
    </div>`;
  return card;
}

function cgOpenDetail(idx){
  _cgDetailIdx = idx;
  const work = _cgFiltered[idx];
  if(!work) return;

  const meta = _CG_MAP[work.activity_key] || {icon:'🎨',label:work.activity_name};
  const dateStr = work.date ? new Date(work.date+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '';

  document.getElementById('cg-detail-icon').textContent = meta.icon;
  document.getElementById('cg-detail-type').textContent = meta.label;
  document.getElementById('cg-detail-date').textContent = dateStr;

  const content = document.getElementById('cg-detail-content');
  const isPhoto = work.activity_key==='draw'||work.activity_key==='craft'||work.activity_key==='mandala';

  if(isPhoto){
    if(work.photo_data){
      content.innerHTML = `<div style="text-align:center">
        <img src="${work.photo_data}" style="max-width:100%;border-radius:16px;border:3px solid #FF69B4;box-shadow:0 8px 28px rgba(233,30,140,.18)">
        <div style="font-size:11px;color:#E91E8C;margin-top:10px;font-weight:800">${meta.icon} ${meta.label} · ${dateStr}</div>
      </div>`;
    } else {
      content.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:12px">${meta.icon}</div>
        <div style="font-size:13px;font-weight:700">No photo was uploaded for this entry.</div>
      </div>`;
    }
  } else if(work.activity_key==='moral_values'||work.activity_key==='proverb'){
    content.innerHTML = `<div class="cg-story-display" style="background:#F0FDF4;border-color:#A7F3D0;color:#064E3B">${(work.text_content||'').replace(/\n/g,'<br>')}</div>`;
  } else if(work.activity_key==='poem'){
    content.innerHTML = `<div class="cg-poem-display">${(work.text_content||'').replace(/\n/g,'<br>')}</div>`;
  } else if(work.activity_key==='story'){
    content.innerHTML = `<div class="cg-story-display">${(work.text_content||'').replace(/\n/g,'<br>')}</div>`;
  } else if(work.activity_key==='journal'){
    let extra = {};
    try{ extra = work.extra_json ? JSON.parse(work.extra_json) : {}; }catch(e){}
    const fields = [
      {icon:'🌸', label:"Grateful #1",      val: extra.grateful1},
      {icon:'🌻', label:"Grateful #2",      val: extra.grateful2},
      {icon:'😊', label:"Happy moment",     val: extra.happyMoment},
      {icon:'💡', label:"Today's learning", val: extra.learning},
      {icon:'🌿', label:"Inner growth",     val: extra.innerGrowth},
    ].filter(f=>f.val);
    content.innerHTML = `<div class="cg-journal-grid">
      ${fields.map(f=>`
        <div class="cg-journal-field">
          <div class="cg-journal-lbl">${f.icon} ${f.label}</div>
          <div class="cg-journal-val">${f.val}</div>
        </div>`).join('')}
    </div>`;
  }

  // Prev / Next
  document.getElementById('cg-prev-btn').disabled = idx <= 0;
  document.getElementById('cg-next-btn').disabled = idx >= _cgFiltered.length - 1;

  document.getElementById('cg-detail-view').style.display = 'block';
  document.getElementById('cg-detail-view').scrollIntoView({behavior:'smooth', block:'start'});
}

function cgCloseDetail(){
  document.getElementById('cg-detail-view').style.display='none';
}

function cgNavigate(dir){
  const next = _cgDetailIdx + dir;
  if(next >= 0 && next < _cgFiltered.length){
    // Load more if near end
    if(next >= _cgShown - 2){ cgLoadMore(); }
    cgOpenDetail(next);
  }
}

