'use strict';
// ── CREATIVE GALLERY STATE ──────────────────────────────────────────────────
let _cgAllWorks   = [];
let _cgFiltered   = [];
let _cgShown      = 0;
let _cgPageSize   = 10;
let _cgFilter     = 'all';
let _cgDetailIdx  = -1;
let _cgLoaded     = false;
// ════════════════════════════════════════════
// DATA CONSTANTS
// ════════════════════════════════════════════
const SCOL=['#8B5CF6','#3B82F6','#EC4899','#10B981','#F97316','#D97706','#06B6D4'];

// ════════════════════════════════════════════
// HOMEWORK & SELF STUDY
// ════════════════════════════════════════════
const SS_SUBJECTS=[
  {name:'Maths',            icon:'📐', col:'#8B5CF6'},
  {name:'English',          icon:'📖', col:'#3B82F6'},
  {name:'Science',          icon:'🔬', col:'#10B981'},
  {name:'History & Civics', icon:'🏛️', col:'#EC4899'},
  {name:'Geography',        icon:'🌍', col:'#F97316'},
  {name:'Hindi',            icon:'🇮🇳', col:'#D97706'},
  {name:'Sanskrit',         icon:'🕉️',  col:'#059669'},
  {name:'Computers',        icon:'💻', col:'#06B6D4'},
];

function buildSS(){
  const c=document.getElementById('ss-list'); if(!c) return;
  c.innerHTML='';
  SS_SUBJECTS.forEach((s,i)=>{
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap';
    row.innerHTML=`
      <input type="checkbox" id="ss-${i}" onchange="updateSS()"
        style="width:20px;height:20px;accent-color:${s.col};cursor:pointer;flex-shrink:0">
      <label for="ss-${i}"
        style="font-size:12px;font-weight:800;padding:4px 10px;border-radius:8px;white-space:nowrap;
               flex-shrink:0;cursor:pointer;color:${s.col};background:${s.col}18;border:1.5px solid ${s.col}40">
        ${s.icon} ${s.name}</label>
      <span style="font-size:11px;font-weight:700;color:${s.col};background:${s.col}12;
                   border:1.5px solid ${s.col}30;border-radius:6px;padding:2px 8px;flex-shrink:0">+10 pts</span>
      <input type="text" id="ssdet-${i}" placeholder="What did I study today..."
        style="flex:1;min-width:140px;font-size:12px;border-color:${s.col}50">`;
    c.appendChild(row);
  });
}

function updateSS(){
  let done=0;
  SS_SUBJECTS.forEach((_,i)=>{ if(document.getElementById('ss-'+i)?.checked) done++; });
  const total=SS_SUBJECTS.length;
  const pct=Math.round(done/total*100);
  const prog=document.getElementById('ss-prog');
  if(prog) prog.style.width=pct+'%';
  const pctEl=document.getElementById('ss-pct');
  if(pctEl) pctEl.textContent=done+' / '+total+' subjects';
  const ptsEl=document.getElementById('ss-pts-display');
  if(ptsEl) ptsEl.textContent=(done*10)+' pts';
  calcDayPts();
}

const REWARDS=[
  {pts:400,  icon:'🎬', strip:'#FF6B6B', title:'A Movie at Home',                        items:['Family movie of your choice!','Popcorn & snacks included!','Any day, any time!']},
  {pts:600,  icon:'📚', strip:'#06D6A0', title:'Buy a New Book of your choice',           items:['Any book you want — fiction, comics, knowledge!','Visit bookstore together!']},
  {pts:800,  icon:'🌱', strip:'#FFBE0B', title:'1 Hour Do Not Disturb — anything you want', items:['No interruptions! 100% your time!','Read, draw, play, relax — you decide!','Parents will not disturb 🤐']},
  {pts:1000, icon:'🍿', strip:'#FB5607', title:'Movie in a Theater with Parents',         items:['Big screen experience!','Popcorn + cold drink included!','You pick the film!']},
  {pts:1200, icon:'🎁', strip:'#FF006E', title:'Surprise Gift by Parents',                items:['Mystery wrapped gift!','Could be ANYTHING amazing! 🌟']},
  {pts:1500, icon:'🌟', strip:'#8338EC', title:'Half Yes Day',                            items:['Half a day — you decide everything!','Morning or afternoon — your call!','Mamma & Papa say YES to your ideas!']},
  {pts:2700, icon:'👑', strip:'#FF006E', title:'Full Yes Day',                            items:['Vaanya rules for a FULL day!','One magical day — YOU decide EVERYTHING!','👑 The most epic reward EVER!']},
];

const SPEND_ITEMS=[
  {id:'snack_s',  icon:'🍭', title:'Special Snack of Your Choice', cost:30,  col:'#EC4899', strip:'#FF006E', desc:'Any snack you want — your pick!'},
  {id:'tv15',     icon:'📺', title:'Extra 15 Mins TV',             cost:40,  col:'#3B82F6', strip:'#3A86FF', desc:'15 extra minutes of TV or YouTube'},
  {id:'choc',     icon:'🍫', title:'A Chocolate',                  cost:50,  col:'#D97706', strip:'#FFBE0B', desc:'Any chocolate of your choice!'},
  {id:'tv30',     icon:'📺', title:'Extra 30 Mins TV',             cost:80,  col:'#0284C7', strip:'#06D6A0', desc:'30 extra minutes of TV or YouTube'},
  {id:'game_par', icon:'🎮', title:'Play Game with Parents',       cost:90,  col:'#7C3AED', strip:'#8338EC', desc:'Board game or outdoor — parents play with you!'},
  {id:'chess',    icon:'♟️', title:'Play Chess for 20 Mins',     cost:100, col:'#059669', strip:'#06D6A0', desc:'20 minutes of chess — sharpen your brain!'},
  {id:'tv60',     icon:'📺', title:'1 Hour Screen Time',           cost:200, col:'#8B5CF6', strip:'#8338EC', desc:'A full extra hour of screen time today!'},
  {id:'gift_s',   icon:'🎁', title:'Small Surprise Gift by Parents', cost:250, col:'#DB2777', strip:'#FF006E', desc:'A small surprise gift from Mamma or Papa!'},
  {id:'date',     icon:'❤️', title:'Date with Mom or Dad',       cost:250, col:'#E11D48', strip:'#FB5607', desc:'Special 1-on-1 time — your choice of activity!'},
];

const EARN_GUIDE=[
  ['Timetable followed fully','25 pts','Select "Fully followed"'],
  ['Timetable followed mostly','15 pts','Select "Mostly"'],
  ['Test — 90%+','50 pts','Enter test marks'],
  ['Test — 75–89%','40 pts','Enter test marks'],
  ['Test — 60–74%','25 pts','Enter test marks'],
  ['Test — attempted','10 pts','Enter any score'],
  ['Odda class attended','15 pts','Daily mandatory'],
  ['Odda assignment done','up to 20 pts','Based on accuracy %'],
  ['Gymnastics session','20 pts','Per gym class'],
  ['Exercise / Outdoor','10 pts','Per activity day'],
  ['Screen time within limits','20 pts','Daily reward'],
  
  ['Parent rating — Excellent','80 pts','After PIN approval'],
  ['Geeta Shloka — written','25 pts','MANDATORY −20 if skipped'],
  ['Creative activity done','20 pts','MANDATORY −20 if skipped'],
  ['Brain Lab completed','30 pts','MANDATORY −15 if skipped'],
  ['Sudoku correct','30 pts','+ difficulty bonus'],
  ['Logic puzzle correct','15 pts','Per puzzle'],
  ['Riddle correct','10 pts','Per riddle'],
  ['5-day streak bonus','50 pts','Consecutive days saved!'],
  ['10-day streak bonus','120 pts','Keep the streak alive!'],
];


const CREATIVE_OPTIONS=[
  {id:'draw',icon:'🎨',title:'Drawing / Painting',desc:'Draw anything you imagine — nature, a story scene, your favourite character.',pts:20},
  {id:'poem',icon:'✍️',title:'Write a Poem',desc:'Write a short poem in Hindi or English about anything you love.',pts:20},
  {id:'story',icon:'📖',title:'Mini Story',desc:'Write a short story (5–10 sentences) — make up characters and an adventure!',pts:20},
  {id:'craft',icon:'✂️',title:'Paper Craft / Origami',desc:'Make something with paper — origami, a card, a collage.',pts:20},
  {id:'rangoli',icon:'🌸',title:'Rangoli / Mandala',desc:'Create a beautiful rangoli or mandala pattern on paper using colours.',pts:20},
  {id:'journal',icon:'📔',title:'Diary / Gratitude Journal',desc:'Write 3 things you are grateful for today and one happy memory from this week.',pts:20},
];

const RIDDLES=[
  {q:'I have cities but no houses, mountains but no trees, water but no fish. What am I?',a:'A map',hint:'You use me to find your way.'},
  {q:'The more you take, the more you leave behind. What am I?',a:'Footsteps',hint:'Think about walking.'},
  {q:'I speak without a mouth and hear without ears. What am I?',a:'An echo',hint:'Say something in a mountain valley.'},
  {q:'What has to be broken before you can use it?',a:'An egg',hint:'Breakfast clue!'},
  {q:'I have hands but cannot clap. What am I?',a:'A clock',hint:'You check me many times a day.'},
  {q:'What begins with T, ends with T and has T in it?',a:'A teapot',hint:'Tea time!'},
  {q:'The more you have of it, the less you see. What is it?',a:'Darkness',hint:'Turn off the lights.'},
  {q:'I run but never walk, have a mouth but never talk. What am I?',a:'A river',hint:'Ganga, Yamuna...'},
  {q:'What can travel around the world while staying in a corner?',a:'A stamp',hint:'Letters need me.'},
  {q:'I have one eye but cannot see. What am I?',a:'A needle',hint:'Mamma uses it for stitching.'},
];

// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
// ════════════════════════════════════════════
// SUPABASE SETUP
// ════════════════════════════════════════════
const SUPABASE_URL = 'https://mlxoxzbpzpjfjwsppmgi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1seG94emJwenBqZmp3c3BwbWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTMyMTIsImV4cCI6MjA5MjQyOTIxMn0._w5nd9ZWcmTnK1k_pwq4rEc5P4oJxGawou36dvLVU-E';
const _supabase = window.sb || null; // shared authenticated client from js/00-shell.js

// Local state — loaded from Supabase on startup
let savedDays     = [];
let charts        = {};  // Chart.js instances keyed by name
let spendHist     = [];
let totalSpent    = 0;
let dbReady       = false;

async function loadFromSupabase() {
  if(!_supabase){ console.warn('Supabase not loaded — offline mode'); dbReady=true; return false; }
  try {
    showSyncStatus('loading');
    // Load daily reports
    const { data: days, error: e1 } = await _supabase
      .from('daily_reports')
      .select('*')
      .order('date', { ascending: false });
    if (!e1 && days) {
      const mapped = days.map(d => {
        const fullData = d.full_data ? (() => { try{ return JSON.parse(d.full_data); }catch(e){ return {}; } })() : {};
        // Remove 'approved' AND 'pts' from fullData before spreading — the
        // dedicated database columns are always the source of truth and must
        // win over any stale value sitting inside the full_data JSON blob.
        const { approved: _ig1, pts: _ig2, ...safeFullData } = fullData;
        const ap = d.approved === true || d.approved === 'true';
        if(ap){ try{ sessionStorage.removeItem(_sessionKey(d.date)); }catch(e){} }
        return {
          date: d.date,
          pts: d.pts || 0,
          shlokaD: d.shloka_done === true || d.shloka_done === 'true',
          creativeD: d.creative_done === true || d.creative_done === 'true',
          brainD: d.brain_done === true || d.brain_done === 'true',
          odda: d.odda_done === true || d.odda_done === 'true',
          parentComment: d.notes || '',
          parentRating: d.parent_rating || 0,
          approved: ap,
          savedAt: d.saved_at,
          ...safeFullData  // spread full_data EXCEPT approved & pts
        };
      });

      // ── Collapse any duplicate rows that share the same date ──────────────
      // Older saves could leave more than one row per date. Keep a SINGLE
      // record per date, preferring an APPROVED row, then the most recently
      // saved one. This is what keeps an approved report approved (and its
      // points banked) after a page refresh.
      const byDate = {};
      mapped.forEach(r => {
        const prev = byDate[r.date];
        if(!prev){ byDate[r.date] = r; return; }
        if(r.approved && !prev.approved){ byDate[r.date] = r; return; }
        if(!r.approved && prev.approved){ return; }
        const tNew = r.savedAt ? new Date(r.savedAt).getTime() : 0;
        const tOld = prev.savedAt ? new Date(prev.savedAt).getTime() : 0;
        if(tNew >= tOld) byDate[r.date] = r;
      });
      savedDays = Object.values(byDate);

      // ── Merge the local backup as a safety net ────────────────────────────
      // If a day was approved/saved locally but never reached the cloud (a
      // network hiccup, RLS error, etc.), keep showing it so points are never lost on
      // refresh — and quietly push the corrected state back up to the cloud.
      try{
        const localBackup = JSON.parse(localStorage.getItem('vaanya_days')||'[]');
        if(Array.isArray(localBackup)){
          localBackup.forEach(ld => {
            if(!ld || !ld.date) return;
            const cloud = byDate[ld.date];
            // Only treat a local-only day as a failed-sync within a short recent
            // window (3 days). This protects a just-approved today/yesterday whose
            // cloud write failed, without ever resurrecting an old day that was
            // deliberately rejected/deleted elsewhere.
            const ageDays = (Date.now() - new Date(ld.date+'T12:00:00').getTime()) / 86400000;
            if(!cloud){
              if(ageDays <= 3) savedDays.push(ld);      // cloud has nothing — restore local
            } else if(ld.approved && !cloud.approved){
              const idx = savedDays.findIndex(x=>x.date===ld.date);
              const fixed = {...cloud, ...ld, approved:true};
              if(idx>=0) savedDays[idx] = fixed;
              try{ saveToSupabase(fixed); }catch(e){} // re-push the approval to cloud
            }
          });
        }
      }catch(e){ console.warn('Local backup merge skipped', e); }

      savedDays.sort((a,b)=>new Date(b.date)-new Date(a.date));
      // Refresh the local backup with the reconciled truth
      try{ localStorage.setItem('vaanya_days', JSON.stringify(savedDays)); }catch(e){}
    }
    // Load spend history
    const { data: spend, error: e2 } = await _supabase
      .from('spend_history')
      .select('*')
      .order('date', { ascending: false });
    if (!e2 && spend) {
      spendHist = spend.map(s => ({ id: s.item_id, cost: s.pts_spent, title: s.item_name, date: s.date }));
      totalSpent = spend.reduce((a, s) => a + (s.pts_spent || 0), 0);
    }
    dbReady = true;
    showSyncStatus('ok');
    updateTopBar();
    // Force recalc + render after brief delay to ensure all data parsed
    setTimeout(()=>{
      updateTopBar();
      populateResetDatePicker();
      // Always render history — it lives on the Progress page now
      renderHistory();
      // Render graphs if Progress tab is currently active
      const graphsTab = document.getElementById('tab-graphs');
      if(graphsTab && graphsTab.classList.contains('active')){
        renderGraphs();
        setTimeout(()=>{ Object.values(charts||{}).forEach(ch=>{ try{ ch.resize(); }catch(e){} }); },200);
      }
    }, 600);
    return true;
  } catch(err) {
    showSyncStatus('error');
    console.error('Supabase load error:', err);
    return false;
  }
}

let _saveChain = Promise.resolve();
function saveToSupabase(data){
  // Serialize saves: the 60-second auto-save and manual saves were overlapping,
  // so two delete-then-insert sequences raced and the 2nd insert hit a 409
  // duplicate-key conflict on daily_reports. Running saves one-at-a-time
  // (chained) removes the race. No table or data-shape change.
  const run = () => _saveToSupabaseInner(data);
  _saveChain = _saveChain.then(run, run);
  return _saveChain;
}
async function _saveToSupabaseInner(data) {
  if(!_supabase){ console.warn('Supabase not available — save skipped'); return false; }
  try {
    showSyncStatus('saving');

    // Helper: strict type casting to prevent Supabase column type errors
    const _int  = v => { const n = parseInt(v); return isNaN(n) ? 0 : n; };
    const _bool = v => v === true || v === 'true' || (typeof v === 'number' && v !== 0) || v === 1 || v === '1';

    // Build safe JSON blob — only text/number/boolean fields, no undefined
    const safeData = {};
    const skipKeys = new Set(['full_data','creativeImgData','tt']); // 'tt' is a boolean column in Supabase — never send it
    for(const [k,v] of Object.entries(data)){
      if(skipKeys.has(k)) continue;
      if(v === undefined || v === null) { safeData[k] = null; continue; }
      if(typeof v === 'string' && v.length > 8000) continue;
      // Ensure only JSON-safe primitives enter full_data
      if(typeof v === 'object') continue;
      safeData[k] = v;
    }

    const row = {
      date: data.date,
      pts: _int(data.pts),
      shloka_done: _bool(data.shlokaD),
      creative_done: _bool(data.creativeD),
      brain_done: _bool(data.brainD),
      odda_done: _bool(data.odda),
      notes: (data.parentComment || '').substring(0, 2000),
      parent_rating: _int(data.parentRating),
      approved: _bool(data.approved),
      saved_at: data.savedAt || new Date().toISOString(),
      full_data: JSON.stringify(safeData).substring(0, 30000)
    };

    // Guarantee EXACTLY ONE row per date, regardless of how the table's
    // primary key / unique constraints are configured. A plain upsert() with
    // no conflict target was inserting a brand-new row on every save (including
    // the 60-second auto-save), so after approval the old "pending" copy still
    // lived in the table — which is what made approved reports re-appear as
    // pending and made banked points seem to vanish on refresh.
    try{ await _supabase.from('daily_reports').delete().eq('date', row.date); }
    catch(delErr){ console.warn('Pre-save cleanup failed (continuing):', delErr); }

    const { error } = await _supabase
      .from('daily_reports')
      .insert(row);

    if (error) {
      console.error('Supabase error:', error);
      showSyncStatus('error');
      return false;
    }

    showSyncStatus('ok');
    return true;

  } catch(err) {
    showSyncStatus('error');
    console.error('Save error:', err);
    return false;
  }
}

async function saveSpendToSupabase(item) {
  try {
    const { error } = await _supabase.from('spend_history').insert({
      date: item.date,
      item_id: item.id,
      item_name: item.title,
      pts_spent: item.cost
    });
    if (error) console.error('Spend save error:', error);
  } catch(err) { console.error(err); }
}

function showSyncStatus(state) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const states = {
    loading: { icon: '⏳', text: 'Loading data...', col: '#F59E0B' },
    saving:  { icon: '💾', text: 'Saving to cloud...', col: '#3B82F6' },
    ok:      { icon: '✅', text: 'All saved to cloud!', col: '#10B981' },
    error:   { icon: '❌', text: 'Save failed — try the Save button again', col: '#B91C1C' }
  };
  const s = states[state] || states.ok;
  el.innerHTML = `<span style="color:${s.col};font-size:11px;font-weight:900">${s.icon} ${s.text}</span>`;
}
let brainPtsToday = 0;
let worksheetPts = 0; // pts from daily MCQ worksheets
let parentUnlocked = false; // PIN authenticated this session
let aiSkillPts = 0; // set by AI skill evaluator
let reflPts1=0,reflPts2=0,reflPts3=0; // per-reflection pts
let todayApproved = false; // true once parent has approved today's report
let pinBuf = ''; // PIN entry buffer
const PCLS = ['pp','pt','pa','ppk','pg','pr','pb']; // all pill colour classes
// AI removed — no external API calls
let sudokuGrid=null, sudokuSolution=null, selectedCell=null, sudokuDifficulty='easy';
let creativeChosen=null;
let currentShloka=0;


let sudokuPts = 0, logicPtsTotal = 0, riddlePtsTotal = 0;
let logicAnswered = [], riddleAnswered = [];
let sudokuFrozen = false;
let logicFrozen  = false;
let logicPts = 0, riddlePts = 0;

function _lrDaySet(){
  var istNow=new Date(Date.now()+5.5*60*60*1000);
  return (istNow.getDate()-1)%30;
}
function _lrQuestions(){
  var si=_lrDaySet();
  return LR_BANK.slice(si*10, si*10+10);
}

let logicCurrentPuzzles = [];

function genLogicPuzzles(){
  logicAnswered=[];logicPts=0;logicCurrentPuzzles=[];
  var scoreDiv=document.getElementById('logic-score-display');
  var checkBtn=document.getElementById('logic-check-btn');
  var badge=document.getElementById('logic-day-badge');
  if(scoreDiv)scoreDiv.style.display='none';
  if(checkBtn){checkBtn.disabled=true;checkBtn.style.opacity='.4';checkBtn.style.cursor='not-allowed';}
  var questions=_lrQuestions();
  var setIdx=_lrDaySet();
  var istDateStr=new Date(Date.now()+5.5*60*60*1000).toISOString().split('T')[0];
  var dayLabel=new Date(istDateStr+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
  if(badge&&questions.length)badge.textContent='Set '+(setIdx+1)+'/30 · '+dayLabel+' · '+questions[0].cat;
  var container=document.getElementById('logic-puzzles');
  if(!container)return;
  container.innerHTML='';
  questions.forEach(function(p,i){
    logicCurrentPuzzles.push({qIndex:setIdx*10+i,ans:p.ans,exp:p.exp,cat:p.cat,chosenOpt:null,checked:false});
    var div=document.createElement('div');
    div.className='logic-card';div.id='lcard-'+i;
    var optsHtml=p.opts.map(function(o,oi){
      return '<button class="opt-btn" id="lopt-'+i+'-'+oi+'" onclick="selectLogicOption('+i+','+oi+')">'+String.fromCharCode(65+oi)+') '+o+'</button>';
    }).join('');
    div.innerHTML='<div class="logic-q">Q'+(i+1)+': '+p.q+'</div>'+optsHtml+'<div id="lexpl-'+i+'" style="display:none;margin-top:8px;font-size:12px;background:var(--gl);border-radius:6px;padding:8px 10px;color:var(--gd)"></div>';
    container.appendChild(div);
  });
}

function selectLogicOption(qi,oi){
  if(logicFrozen)return;
  if(!logicCurrentPuzzles||!logicCurrentPuzzles.length){genLogicPuzzles();return;}
  if(logicCurrentPuzzles[qi]&&logicCurrentPuzzles[qi].checked)return;
  logicCurrentPuzzles[qi].chosenOpt=oi;
  for(var j=0;j<4;j++){
    var b=document.getElementById('lopt-'+qi+'-'+j);
    if(!b)continue;
    b.className='opt-btn'+(j===oi?' selected-opt':'');
    b.style.background=j===oi?'var(--tl)':'';
    b.style.borderColor=j===oi?'var(--t)':'';
    b.style.color=j===oi?'var(--td)':'';
  }
  var allAnswered=logicCurrentPuzzles.every(function(p){return p.chosenOpt!==null;});
  var checkBtn=document.getElementById('logic-check-btn');
  if(checkBtn&&allAnswered){checkBtn.disabled=false;checkBtn.style.opacity='1';checkBtn.style.cursor='pointer';}
}

function checkLogicAnswers(){
  if(logicFrozen)return;
  var correct=0;
  logicCurrentPuzzles.forEach(function(p,i){
    var isRight=p.chosenOpt===p.ans;
    if(isRight)correct++;
    p.checked=true;
    for(var j=0;j<4;j++){
      var b=document.getElementById('lopt-'+i+'-'+j);
      if(!b)continue;
      b.disabled=true;b.style.cursor='default';
      if(j===p.ans){b.className='opt-btn correct';}
      else if(j===p.chosenOpt&&!isRight){b.className='opt-btn wrong';}
      else{b.className='opt-btn';b.style.background='';b.style.borderColor='';b.style.color='';}
    }
    var expl=document.getElementById('lexpl-'+i);
    if(expl){expl.style.display='block';expl.textContent='💡 '+p.exp;}
  });
  var pts=Math.round((correct/10)*15);
  logicPtsTotal=pts;
  brainPtsToday=sudokuPts+logicPtsTotal+riddlePtsTotal+mathsPtsToday+worksheetPts;
  if(typeof ttSyncBrainLabPts==='function') ttSyncBrainLabPts();
  updateBrainDisplay();if(typeof ttSyncBrainLabPts==='function') ttSyncBrainLabPts();calcDayPts();
  var scoreDiv=document.getElementById('logic-score-display');
  var scoreNum=document.getElementById('logic-score-num');
  var scoreMsg=document.getElementById('logic-score-msg');
  if(scoreDiv)scoreDiv.style.display='block';
  if(scoreNum)scoreNum.textContent=pts+' / 15 pts';
  var msg;
  if(correct===10)msg='Perfect 10/10! Logic champion! 🧠🎉';
  else if(correct>=8)msg='Excellent! '+correct+'/10 — almost perfect! 😊';
  else if(correct>=6)msg='Well done! '+correct+'/10 — '+Math.round(correct/10*100)+'%! 💪';
  else if(correct>=4)msg='Good effort! '+correct+'/10 — keep practising!';
  else msg=correct+'/10 — try again tomorrow! 📚';
  if(scoreMsg)scoreMsg.textContent=msg;
  var bdEl=document.getElementById('logic-score-breakdown');
  if(bdEl){
    bdEl.innerHTML=logicCurrentPuzzles.map(function(p,i){
      var right=p.chosenOpt===p.ans;
      return '<div style="background:'+(right?'#ECFDF5':'#FEF2F2')+';border:1.5px solid '+(right?'#6EE7B7':'#FCA5A5')+';border-radius:10px;padding:5px 10px;font-size:11px;font-weight:800;color:'+(right?'#065F46':'#B91C1C')+'">'+( right?'✅':'❌')+' Q'+(i+1)+'</div>';
    }).join('');
  }
  var checkBtn=document.getElementById('logic-check-btn');
  if(checkBtn){checkBtn.disabled=true;checkBtn.style.opacity='.4';checkBtn.style.cursor='not-allowed';}
  toast('LR done! '+pts+'/15 pts ('+correct+'/10 correct)');
  freezeLogic();
}

function freezeLogic(){
  if(logicFrozen)return;
  logicFrozen=true;
  var cb=document.getElementById('logic-check-btn');
  if(cb){cb.disabled=true;cb.style.opacity='.4';cb.style.cursor='not-allowed';}
  for(var i=0;i<10;i++){
    for(var j=0;j<4;j++){
      var b=document.getElementById('lopt-'+i+'-'+j);
      if(b){b.disabled=true;b.style.cursor='default';}
    }
  }
}

function showTab(id,btn){
  // Show live score right panel only on daily report tab
  const rp=document.getElementById('right-panel');
  if(rp){ rp.style.display = (id==='report') ? '' : 'none'; }
  _lppResponsive();
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  if(btn)btn.classList.add('active');
  if(id==='brain'){} // worksheets load when Worksheets tab clicked
  if(id==='wordbook'){ wbWords=[]; wbLoad(); }
  if(id==='history') id='graphs'; // history merged into progress
  if(id==='rewards'){renderRewards();setTimeout(showVaanyaMotivation,600);}
  if(id==='graphs'){
    renderHistory();
    // Two-stage: render immediately for data, then resize chart after tab is visible
    setTimeout(()=>{
      renderGraphs();
      // Force Chart.js to recalculate dimensions after tab is fully painted
      setTimeout(()=>{
        Object.values(charts||{}).forEach(ch=>{ try{ ch.resize(); }catch(e){} });
      }, 150);
    }, 80);
  }
  if(id==='parent'){
    const wall=document.getElementById('parent-locked-wall');
    const content=document.getElementById('parent-content');
    if(parentUnlocked){
      if(wall)wall.style.display='none';
      if(content)content.style.display='block';
      renderParentTab();
      renderParentShlokaApproval();
      renderParentShlokaMgmt();
    } else {
      if(wall)wall.style.display='block';
      if(content)content.style.display='none';
    }
  }
  // Re-lock parent when leaving
  if(id!=='parent' && parentUnlocked){
    parentUnlocked=false;
    // Also re-lock the manage section
    const mWall    = document.getElementById('manage-locked-wall');
    const mContent = document.getElementById('manage-content');
    if(mWall)    mWall.style.display    = 'block';
    if(mContent) mContent.style.display = 'none';
  }
  // Geeta image slider — start/stop auto-play
  if(id==='geeta'){
    geetaImgGo(1);
    if(typeof geetaAutoOn!=='undefined' && geetaAutoOn) geetaStartAuto();
  } else {
    if(typeof geetaStopAuto==='function') geetaStopAuto();
  }
}

// ── Test: show chapters textarea when subject selected
function showTestChapters(){
  const val=document.getElementById('test-subj')?.value;
  const box=document.getElementById('test-chapters-box');
  if(box)box.style.display=val?'block':'none';
}

// ── Reading: show/hide word boxes
function showWordBoxes(){
  const val = document.getElementById('book-type')?.value;
  const box = document.getElementById('word-boxes');
  if(box) box.style.display = val === 'yes' ? 'block' : 'none';
  if(val !== 'yes'){
    ['word1','mean1','exam1','word2','mean2','exam2','word3','mean3','exam3'].forEach(id=>{
      const e=document.getElementById(id); if(e) e.value='';
    });
    const msg=document.getElementById('word-pts-msg'); if(msg) msg.textContent='';
    const wrap=document.getElementById('save-wordbook-wrap');
    if(wrap) wrap.style.display='none';
  }
  calcWordPts();
  checkWordSaved();
}

function calcWordPts(){
  const w1=(document.getElementById('word1')?.value||'').trim();
  const m1=(document.getElementById('mean1')?.value||'').trim();
  const w2=(document.getElementById('word2')?.value||'').trim();
  const m2=(document.getElementById('mean2')?.value||'').trim();
  const w3=(document.getElementById('word3')?.value||'').trim();
  const m3=(document.getElementById('mean3')?.value||'').trim();
  const allFilled = w1&&m1&&w2&&m2&&w3&&m3;
  const msg=document.getElementById('word-pts-msg');
  if(msg){
    if(allFilled){
      msg.innerHTML='🌟 <span style="color:var(--gd)">+10 pts! All 3 words with meanings filled!</span>';
    } else {
      const filled=[w1&&m1,w2&&m2,w3&&m3].filter(Boolean).length;
      msg.innerHTML = filled>0
        ? `<span style="color:var(--ad)">✏️ ${filled}/3 words filled — fill all 3 to earn +10 pts</span>`
        : '';
    }
  }
  calcDayPts();
}

// ── Parent rating calc
function calcParentRating(){
  const val=parseInt(document.getElementById('parent-rating')?.value||0);
  const el=document.getElementById('parent-rating-result');
  if(!el)return;
  if(!document.getElementById('parent-rating').value){el.innerHTML='';return;}
  let col,icon,msg;
  if(val<=-100){col='#B91C1C';icon='😟';msg='Below Average — needs to work much harder tomorrow!';}
  else if(val<0){col='#D97706';icon='😐';msg='Average — Vaanya can definitely do better!';}
  else if(val===0){col='#6B7280';icon='🙂';msg='Satisfactory — an okay day. Keep improving!';}
  else if(val===25){col='#3B82F6';icon='😊';msg='Good — well done today, Vaanya!';}
  else if(val===50){col='#10B981';icon='😄';msg='Excellent — great effort and performance!';}
  else{col='#7C3AED';icon='🌟';msg='Extraordinary — outstanding day! We are so proud!';}
  el.style.background=col+'15';el.style.color=col;el.style.border='1.5px solid '+col+'40';
  el.innerHTML=`${icon} ${msg} <b style="margin-left:8px">${val>0?'+':''}${val} pts</b>`;
  calcDayPts();
}

function showPuzzle(type,btn){
  if(type==='logic'&&logicFrozen){var sd=document.getElementById('logic-score-display');if(sd&&sd.style.display==='none')sd.style.display='block';}
  if(type==='riddle'){toast('🎭 Riddles coming soon! Stay tuned.');return;}
  if(type==='maths') initMathsSprint(); // init sprint whenever maths tab opened
  ['sudoku','logic','riddle','maths','worksheet'].forEach(t=>{
    const el=document.getElementById('puzzle-'+t);
    if(el)el.style.display=t===type?'block':'none';
  });
  document.querySelectorAll('#puzzle-tabs button').forEach(b=>{
    b.className='btn btn-o';
    b.style.cssText='font-size:12px;padding:7px 14px;background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3);color:#fff';
  });
  if(btn){btn.className='btn btn-p';btn.style.cssText='font-size:12px;padding:7px 14px';}
  // When worksheet tab selected, load worksheets
  if(type==='worksheet') loadWorksheets();
}

// ════════════════════════════════════════════
// BUILD UI
// ════════════════════════════════════════════

function availablePts(){ return Math.max(0,totalEarned()-totalSpent); }
function fmtDate(d){
  if(!d)return'–';
  return new Date(d+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}

function getStreak(){
  // Only count APPROVED days in consecutive streak
  const approved = savedDays
    .filter(d => d.approved === true)
    .map(d => d.date)
    .sort()
    .reverse(); // newest first
  if(!approved.length) return 0;

  // Use IST (UTC+5:30) for today's date — avoids UTC midnight mismatch
  const istNow = new Date(Date.now() + 5.5 * 60 * 60000);
  const todayStr = istNow.toISOString().split('T')[0];
  const yestDate = new Date(istNow); yestDate.setUTCDate(yestDate.getUTCDate()-1);
  const yestStr  = yestDate.toISOString().split('T')[0];

  // Most recent approved day must be today or yesterday
  if(approved[0] !== todayStr && approved[0] !== yestStr) return 0;

  // Count consecutive days backwards from most recent
  let streak = 1;
  for(let i = 1; i < approved.length; i++){
    const prev = new Date(approved[i-1]+'T12:00:00');
    const curr = new Date(approved[i]+'T12:00:00');
    const diff = Math.round((prev - curr) / 86400000);
    if(diff === 1){ streak++; }
    else break;
  }
  return streak;
}

function toggleP(el,cls){el.classList.toggle(cls);}
function toggleEx(el,gid,cls){
  const g=document.getElementById(gid);
  if(g)g.querySelectorAll('.pill').forEach(p=>PCLS.forEach(c=>p.classList.remove(c)));
  el.classList.add(cls);
}

// Deselectable version — tapping already-selected pill clears it back to neutral
function toggleExDeselect(el,gid,cls){
  const g=document.getElementById(gid);
  if(!g) return;
  const alreadySelected = el.classList.contains(cls);
  // Clear all pills in group
  g.querySelectorAll('.pill').forEach(p=>PCLS.forEach(c=>p.classList.remove(c)));
  // If not already selected → select it; if already selected → leave cleared (deselect)
  if(!alreadySelected) el.classList.add(cls);
}

function totalEarned(){
  return savedDays
    .filter(d => d.approved === true)
    .reduce((a,d) => a + (parseInt(d.pts)||0), 0);
}

// ── One-time data repair ─────────────────────────────────────────────────────
// Removes s13 (Ch 6 V17) that was wrongly approved — runs once, marks done.
(function _oneTimeShlokaRepair(){
  try{
    if(localStorage.getItem('vaanya_shloka_repair_v1')) return;
    const mastered = JSON.parse(localStorage.getItem('vaanya_geeta_mastered')||'{}');
    if(mastered['s13']){ delete mastered['s13']; localStorage.setItem('vaanya_geeta_mastered', JSON.stringify(mastered)); }
    const prog = JSON.parse(localStorage.getItem('vaanya_geeta_progress')||'{}');
    if(prog['s13']){ delete prog['s13']; }
    Object.keys(prog).forEach(id=>{ if(prog[id]&&prog[id].status==='inprogress') delete prog[id]; });
    localStorage.setItem('vaanya_geeta_progress', JSON.stringify(prog));
    localStorage.setItem('vaanya_shloka_repair_v1','done');
  }catch(e){}
})();

// v2 repair — clears stale inprogress from localStorage that cause ghost locks
(function _shlokaRepairV2(){
  try{
    if(localStorage.getItem('vaanya_shloka_repair_v2')) return;
    const prog = JSON.parse(localStorage.getItem('vaanya_geeta_progress')||'{}');
    let changed=false;
    Object.keys(prog).forEach(id=>{
      if(prog[id]&&prog[id].status==='inprogress'){ delete prog[id]; changed=true; }
    });
    if(changed) localStorage.setItem('vaanya_geeta_progress', JSON.stringify(prog));
    const mastered = JSON.parse(localStorage.getItem('vaanya_geeta_mastered')||'{}');
    if(mastered['s13']){ delete mastered['s13']; localStorage.setItem('vaanya_geeta_mastered', JSON.stringify(mastered)); }
    localStorage.setItem('vaanya_shloka_repair_v2','done');
  }catch(e){}
})();

function buildAll(){
  // Clear stale admin-overridden spend/reward data when version changes
  // Bump this version string whenever SPEND_ITEMS or REWARDS data changes
  const DATA_VERSION = 'v2-2026-06-03';
  if(localStorage.getItem('vaanya_data_version') !== DATA_VERSION){
    localStorage.removeItem('vaanya_admin_spend_items');
    localStorage.removeItem('vaanya_admin_rewards');
    localStorage.setItem('vaanya_data_version', DATA_VERSION);
  }
  // Reset all in-memory pts to 0 — will be restored from cloud/session after load
  // Pre-fill today's date
  const _todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const _rptDate = document.getElementById('rpt-date');
  if(_rptDate && !_rptDate.value) _rptDate.value = _todayStr;
  ttInitDay();
  brainPtsToday=0; sudokuPts=0; logicPtsTotal=0; riddlePtsTotal=0;
  mathsPtsToday=0; worksheetPts=0; aiSkillPts=0;
  // Reset parent-tab dropdowns explicitly (they live outside #tab-report)
  const _bShAwd=document.getElementById('shloka-pts-award'); if(_bShAwd) _bShAwd.selectedIndex=0;
  const _bCrAwd=document.getElementById('creative-pts-award'); if(_bCrAwd) _bCrAwd.selectedIndex=0;
  const _bPrRat=document.getElementById('parent-rating'); if(_bPrRat) _bPrRat.selectedIndex=0;
  // Seed geetaProgress from permanent mastered store — ensures mastered shlokas
  // are always shown correctly even before cloud data arrives
  geetaProgress={};
  try{
    const permMastered=JSON.parse(localStorage.getItem('vaanya_geeta_mastered')||'{}');
    Object.entries(permMastered).forEach(([id,v])=>{ geetaProgress[id]=v; });
  }catch(e){}
  buildStars('creative-stars',5);
  buildCreativeOptions();buildShlokaDisplay();
  genSudoku('easy');genLogicPuzzles();genRiddles();initMathsSprint();
  buildEarnGuide();
  buildSS();
  setTodayDate();checkPenalty();
}

function setTodayDate(){
  const istNow=new Date(Date.now()+5.5*60*60*1000);
  const todayIST=istNow.toISOString().split('T')[0];
  const el=document.getElementById('rpt-date');
  el.min=todayIST; el.max=todayIST; el.value=todayIST; el.dataset.prev=todayIST;
  // Format the header pill from the already-correct IST date string. Using a
  // noon anchor avoids the double timezone shift that previously pushed the
  // displayed date one day ahead (e.g. showing 5 Jun while it was 4 Jun).
  document.getElementById('today-pill').textContent=new Date(todayIST+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
}

// ── Homework list — fix #5: subject + checkbox + pts badge + study notes textbox

function buildStars(id,n){
  const el=document.getElementById(id);if(!el)return;
  el.innerHTML='';
  for(let i=1;i<=n;i++){
    const s=document.createElement('div');s.className='star';s.dataset.v=i;s.textContent='★';
    s.onclick=()=>{setStar(id,i);calcDayPts();};
    el.appendChild(s);
  }
}
function setStar(id,v){
  const el=document.getElementById(id);if(!el)return;
  el.querySelectorAll('.star').forEach(s=>s.classList.toggle('on',parseInt(s.dataset.v)<=v));
}
function getStarVal(id){
  const el=document.getElementById(id);if(!el)return 0;
  let m=0;el.querySelectorAll('.star.on').forEach(s=>m=Math.max(m,parseInt(s.dataset.v)));return m;
}

// ── Dropdown-based creative selection ──────────────────────────────────────

// ════════════════════════════════════════════════════════════
// CREATIVE MOMENTS — per-activity panels + Supabase save
// ════════════════════════════════════════════════════════════
const _CREATIVE_MAP = {
  draw:    {icon:'🎨',title:'Drawing / Painting',        desc:'Draw anything you imagine — nature, a story scene, your favourite character!', bar:'linear-gradient(90deg,#F59E0B,#EF4444)', type:'photo'},
  poem:    {icon:'✍️', title:'Write a Poem',              desc:'Write a short poem in Hindi or English about anything you love.',              bar:'linear-gradient(90deg,#8B5CF6,#EC4899)', type:'text'},
  story:   {icon:'📖',title:'Write a Story or Paragraph', desc:'Make up characters and an adventure in 5–10 sentences or more!',               bar:'linear-gradient(90deg,#3B82F6,#06B6D4)', type:'text'},
  craft:   {icon:'✂️', title:'Paper Craft / Origami',     desc:'Make something with paper — origami, a greeting card, a collage.',            bar:'linear-gradient(90deg,#10B981,#059669)', type:'photo'},
  mandala: {icon:'🌸',title:'Mandala Art',                desc:'Create a beautiful mandala or rangoli pattern using colours!',                 bar:'linear-gradient(90deg,#EC4899,#8B5CF6)', type:'photo'},
  journal: {icon:'📔',title:'Diary / Gratitude Journal',  desc:'Write what you are grateful for today and a happy memory!',                   bar:'linear-gradient(90deg,#F97316,#F59E0B)', type:'journal'},
};

// In-memory state for the active creative session
let _creativeActiveKey = '';
let _creativePhotoData = null;   // base64 for photo activities
let _creativeSaved     = false;

// Themes per activity type
const _CREATIVE_THEMES = {
  photo: {bg:'#FFF7ED',border:'#FED7AA',accent:'#F97316',btnBg:'linear-gradient(135deg,#F97316,#EF4444)',inputBg:'#FFF7ED'},
  text:  {bg:'#F5F3FF',border:'#DDD6FE',accent:'#7C3AED',btnBg:'linear-gradient(135deg,#7C3AED,#5B21B6)',inputBg:'#FDFCFF'},
  journal:{bg:'linear-gradient(135deg,#FFF9EC,#FFF0FB)',border:'#FCD34D',accent:'#F59E0B',btnBg:'linear-gradient(135deg,#F59E0B,#EC4899)',inputBg:'#FFFEF0'},
};

// ── Render the content panel for the chosen activity ───────────────────────
function onCreativeSelect(val){
  _creativeActiveKey = val;
  _creativePhotoData = null;
  _creativeSaved     = false;

  // Sync creativeChosen for points calc
  const opt = _CREATIVE_MAP[val];
  creativeChosen = opt ? opt.title : null;

  const area = document.getElementById('creative-content-area');
  if(!area) return;

  if(!val || !opt){
    area.innerHTML = '';
    calcDayPts();
    return;
  }

  // Update dropdown border colour
  const selEl = document.getElementById('creative-activity-select');
  if(selEl) selEl.style.borderColor = '#8B5CF6';

  // Render appropriate panel
  if(opt.type === 'photo'){
    area.innerHTML = _buildPhotoPanel(val, opt);
  } else if(opt.type === 'text'){
    area.innerHTML = _buildNotepadPanel(val, opt);
  } else if(opt.type === 'journal'){
    area.innerHTML = _buildJournalPanel(val, opt);
  }

  calcDayPts();
}

// ── PHOTO PANEL (Drawing, Craft, Mandala) ──────────────────────────────────
function _buildPhotoPanel(key, opt){
  const colors = {
    draw:    {bg:'#FFF7ED',bdr:'#FED7AA',acnt:'#F97316',grd:'linear-gradient(135deg,#FFF7ED,#FEF3C7)'},
    craft:   {bg:'#ECFDF5',bdr:'#A7F3D0',acnt:'#059669',grd:'linear-gradient(135deg,#ECFDF5,#EFF6FF)'},
    mandala: {bg:'#FDF2F8',bdr:'#F9A8D4',acnt:'#EC4899',grd:'linear-gradient(135deg,#FDF2F8,#F5F3FF)'},
  }[key] || {bg:'#F5F3FF',bdr:'#DDD6FE',acnt:'#7C3AED',grd:'linear-gradient(135deg,#F5F3FF,#EFF6FF)'};

  return `
<div style="background:${colors.bg};border:2px solid ${colors.bdr};border-radius:18px;overflow:hidden;margin-bottom:14px;box-shadow:0 4px 20px rgba(0,0,0,.05)">
  <!-- Panel header -->
  <div style="background:${colors.grd};padding:14px 18px;border-bottom:1.5px solid ${colors.bdr};display:flex;align-items:center;gap:12px">
    <div style="font-size:32px;line-height:1">${opt.icon}</div>
    <div style="flex:1">
      <div style="font-size:15px;font-weight:900;color:#1E1B4B">${opt.title}</div>
      <div style="font-size:11px;color:#6B7280;font-weight:700;margin-top:2px">${opt.desc}</div>
    </div>
    <div style="width:4px;height:40px;border-radius:4px;background:${opt.bar};flex-shrink:0"></div>
  </div>
  <div style="padding:18px">
    <!-- Upload zone -->
    <div id="cm-upload-zone" style="border:3px dashed ${colors.bdr};border-radius:16px;padding:32px 20px;text-align:center;background:#fff;cursor:pointer;transition:all .2s;margin-bottom:14px"
      onclick="document.getElementById('cm-photo-input').click()"
      onmouseover="this.style.background='${colors.bg}';this.style.borderColor='${colors.acnt}'"
      onmouseout="this.style.background='#fff';this.style.borderColor='${colors.bdr}'">
      <div style="font-size:48px;margin-bottom:12px">📷</div>
      <div style="font-size:15px;font-weight:900;color:${colors.acnt};margin-bottom:5px">Upload your ${opt.title} photo</div>
      <div style="font-size:12px;color:#9CA3AF;font-weight:700">Tap here to take a photo or pick from gallery</div>
      <input type="file" id="cm-photo-input" accept="image/*" capture="environment" style="display:none" onchange="onCreativePhotoChosen(this)">
    </div>
    <!-- Preview (hidden initially) -->
    <div id="cm-photo-preview" style="display:none;margin-bottom:14px;text-align:center">
      <img id="cm-photo-img" style="max-width:100%;border-radius:14px;border:3px solid ${colors.acnt};box-shadow:0 8px 28px rgba(0,0,0,.15)">
      <div style="margin-top:10px;display:flex;align-items:center;justify-content:center;gap:10px">
        <span style="font-size:12px;font-weight:800;color:${colors.acnt}">\u2705 Photo ready to save!</span>
        <button onclick="onCreativePhotoChosen(null)" style="background:none;border:none;color:#EF4444;font-size:11px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif">\u2715 Remove</button>
      </div>
    </div>
    <!-- Parents note -->
    <div style="background:linear-gradient(135deg,${colors.bg},#fff);border:1.5px solid ${colors.bdr};border-radius:12px;padding:11px 16px;display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="font-size:20px">\U0001f469\u200d\U0001f467\u200d\U0001f466</div>
      <div style="font-size:12px;color:#374151;font-weight:700;line-height:1.5">Mamma &amp; Papa will see this photo and award your points! \U0001f3a8</div>
    </div>
    <!-- Action buttons -->
    <div id="cm-action-btns" style="display:none;display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <button onclick="cancelCreativeWork()" style="padding:13px;border-radius:13px;border:2px solid ${colors.bdr};background:#fff;color:#6B7280;font-size:14px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .15s"
        onmouseover="this.style.borderColor='${colors.acnt}';this.style.color='${colors.acnt}'"
        onmouseout="this.style.borderColor='${colors.bdr}';this.style.color='#6B7280'">\u274c Cancel</button>
      <button onclick="saveCreativeWork()" id="cm-save-btn" style="padding:13px;border-radius:13px;border:none;background:${opt.bar};color:#fff;font-size:14px;font-weight:900;cursor:pointer;font-family:'Nunito',sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.18);transition:all .2s"
        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(0,0,0,.22)'"
        onmouseout="this.style.transform='';this.style.boxShadow='0 4px 14px rgba(0,0,0,.18)'">\U0001f4be Save My Work</button>
    </div>
    <div id="cm-status" style="margin-top:10px;text-align:center;font-size:12px;font-weight:800;min-height:18px"></div>
  </div>
</div>`;
}

// ── TEXT NOTEPAD PANEL (Poem / Story) ─────────────────────────────────────
function _buildNotepadPanel(key, opt){
  const isPoem = key === 'poem';
  const noteStyle = isPoem
    ? `background:linear-gradient(180deg,#FDF8FF 0%,#F5F0FF 100%);border:2px solid #C4B5FD;`
    : `background:linear-gradient(180deg,#F0F9FF 0%,#E0F2FE 100%);border:2px solid #93C5FD;`;
  const acnt  = isPoem ? '#7C3AED' : '#2563EB';
  const grd   = isPoem ? 'linear-gradient(135deg,#8B5CF6,#7C3AED)' : 'linear-gradient(135deg,#3B82F6,#1D4ED8)';
  const lnClr = isPoem ? '#DDD6FE' : '#BFDBFE';
  const placeholder = isPoem
    ? 'Write your poem here...\n\nEvery great poem starts with one honest line.\nLet your heart speak — in Hindi or English!'
    : 'Write your story here...\n\nOnce upon a time...\n\nLet your imagination take you on an adventure!';
  const poemToolbar = isPoem
    ? '<div style="display:flex;gap:6px;margin-bottom:10px;padding:7px 10px;background:#F5F3FF;border-radius:10px;border:1.5px solid #DDD6FE;align-items:center;flex-wrap:wrap">'
      + '<span style="font-size:10px;font-weight:800;color:#7C3AED;margin-right:4px">Format:</span>'
      + '<button onclick="cmFormatText(\'bold\')" style="width:30px;height:30px;border-radius:7px;border:1.5px solid #C4B5FD;background:#fff;font-weight:900;font-size:14px;cursor:pointer;font-family:Georgia,serif;color:#3B0764">B</button>'
      + '<button onclick="cmFormatText(\'italic\')" style="width:30px;height:30px;border-radius:7px;border:1.5px solid #C4B5FD;background:#fff;font-size:14px;cursor:pointer;font-family:Georgia,serif;font-style:italic;color:#3B0764">I</button>'
      + '<button onclick="cmFormatText(\'underline\')" style="width:30px;height:30px;border-radius:7px;border:1.5px solid #C4B5FD;background:#fff;font-size:14px;cursor:pointer;font-family:Georgia,serif;text-decoration:underline;color:#3B0764">U</button>'
      + '<span style="font-size:10px;color:#9CA3AF;font-weight:700;margin-left:6px">Select text then tap</span>'
      + '</div>'
    : '';

  return `
<div style="background:#fff;border:2px solid ${isPoem?'#DDD6FE':'#93C5FD'};border-radius:18px;overflow:hidden;margin-bottom:14px;box-shadow:0 4px 20px rgba(0,0,0,.06)">
  <!-- Header -->
  <div style="background:${grd};padding:14px 18px;display:flex;align-items:center;gap:12px">
    <div style="font-size:28px;line-height:1">${opt.icon}</div>
    <div style="flex:1">
      <div style="font-size:15px;font-weight:900;color:#fff">${opt.title}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.8);font-weight:700;margin-top:1px">${opt.desc}</div>
    </div>
    <div style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:5px 11px;font-size:11px;font-weight:800;color:#fff">Notepad \U0001f4dd</div>
  </div>
  <div style="padding:18px">
    ${poemToolbar}
    <!-- Notepad -->
    <div style="${noteStyle}border-radius:14px;padding:6px 0;position:relative;overflow:hidden;margin-bottom:16px;box-shadow:inset 0 2px 6px rgba(0,0,0,.04)">
      <!-- Binding strip -->
      <div style="position:absolute;left:42px;top:0;bottom:0;width:2px;background:${isPoem?'#DDD6FE':'#BFDBFE'};z-index:1"></div>
      <div style="position:absolute;left:44px;top:0;bottom:0;width:1px;background:${isPoem?'#C4B5FD':'#93C5FD'};z-index:1"></div>
      <!-- Line guide pseudo-lines rendered via gradient -->
      <div style="position:absolute;inset:0;background:repeating-linear-gradient(transparent,transparent 31px,${lnClr} 31px,${lnClr} 32px);z-index:0;top:16px"></div>
      <textarea id="cm-text-input"
        style="position:relative;z-index:2;width:100%;min-height:240px;background:transparent;border:none;outline:none;
          padding:16px 16px 16px 60px;font-size:14px;font-family:${isPoem?'Georgia,serif':'\'Nunito\',sans-serif'};
          line-height:32px;color:#1E1B4B;resize:vertical;box-sizing:border-box;letter-spacing:${isPoem?'.01em':'0'}"
        placeholder="${placeholder}"
        oninput="onCreativeTextInput()">${_creativeRestoredText||''}</textarea>
    </div>
    <!-- Word count -->
    <div style="font-size:11px;font-weight:800;color:${acnt};margin-bottom:14px;text-align:right" id="cm-word-count">0 words</div>
    <!-- Action buttons -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <button onclick="cancelCreativeWork()" style="padding:13px;border-radius:13px;border:2px solid ${isPoem?'#C4B5FD':'#93C5FD'};background:#fff;color:#6B7280;font-size:14px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif">\u274c Cancel</button>
      <button onclick="saveCreativeWork()" id="cm-save-btn" style="padding:13px;border-radius:13px;border:none;background:${grd};color:#fff;font-size:14px;font-weight:900;cursor:pointer;font-family:'Nunito',sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.18)">\U0001f4be Save ${isPoem?'My Poem':'My Story'}</button>
    </div>
    <div id="cm-status" style="margin-top:10px;text-align:center;font-size:12px;font-weight:800;min-height:18px"></div>
  </div>
</div>`;
}

// ── GRATITUDE JOURNAL PANEL ────────────────────────────────────────────────
function _buildJournalPanel(key, opt){
  const today = new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
  const prompts = [
    {id:'cm-grateful-1', icon:'🌸', color:'#F59E0B', border:'#FDE68A', focusBorder:'#F59E0B', placeholder:'Today I am grateful for...', label:'Gratitude #1'},
    {id:'cm-grateful-2', icon:'🌻', color:'#EC4899', border:'#FBB6CE', focusBorder:'#EC4899', placeholder:'Something or someone that made today brighter...', label:'Gratitude #2'},
    {id:'cm-happy',      icon:'😊', color:'#8B5CF6', border:'#DDD6FE', focusBorder:'#7C3AED', placeholder:'One happy moment that filled my heart today...', label:'Happy Moment'},
    {id:'cm-learning',   icon:'💡', color:'#0EA5E9', border:'#BAE6FD', focusBorder:'#0284C7', placeholder:'Something new I discovered, felt, or understood today...', label:"Today's Learning"},
    {id:'cm-strength',   icon:'🌿', color:'#10B981', border:'#A7F3D0', focusBorder:'#059669', placeholder:'One small or big step I took today to grow stronger from within...', label:'My Inner Growth Today'},
  ];

  const ta = (p) => `
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
      <div style="min-width:36px;height:36px;background:${p.color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;margin-top:3px;box-shadow:0 3px 10px rgba(0,0,0,.15)">${p.icon}</div>
      <div style="flex:1">
        <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:${p.color};margin-bottom:5px">${p.label}</div>
        <textarea id="${p.id}" oninput="onCreativeTextInput()" rows="2"
          style="width:100%;background:#fff;border:2px solid ${p.border};border-radius:12px;padding:11px 14px;font-size:13px;font-family:'Nunito',sans-serif;color:#1E1B4B;resize:none;outline:none;line-height:1.6;box-sizing:border-box;transition:border-color .15s,box-shadow .15s"
          onfocus="this.style.borderColor='${p.focusBorder}';this.style.boxShadow='0 0 0 3px ${p.border}'"
          onblur="this.style.borderColor='${p.border}';this.style.boxShadow=''"
          placeholder="${p.placeholder}"></textarea>
      </div>
    </div>`;

  return `
<div style="background:#fff;border:2px solid #FCD34D;border-radius:20px;overflow:hidden;margin-bottom:14px;box-shadow:0 6px 28px rgba(245,158,11,.12)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#F59E0B 0%,#EC4899 60%,#8B5CF6 100%);padding:18px 20px;display:flex;align-items:center;gap:14px">
    <div style="width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">📔</div>
    <div style="flex:1">
      <div style="font-size:17px;font-weight:900;color:#fff;letter-spacing:.01em">My Gratitude Journal</div>
      <div style="font-size:11px;color:rgba(255,255,255,.85);font-weight:700;margin-top:3px">✨ Count your blessings · Every grateful heart is a happy heart!</div>
    </div>
    <div style="background:rgba(255,255,255,.22);border:1.5px solid rgba(255,255,255,.35);border-radius:10px;padding:7px 13px;text-align:center;flex-shrink:0">
      <div style="font-size:10px;color:rgba(255,255,255,.8);font-weight:700;text-transform:uppercase;letter-spacing:.06em">Today</div>
      <div style="font-size:11px;font-weight:900;color:#fff;margin-top:1px">📅 ${today}</div>
    </div>
  </div>

  <!-- Decorative stripe -->
  <div style="height:4px;background:linear-gradient(90deg,#F59E0B,#EC4899,#8B5CF6,#0EA5E9,#10B981)"></div>

  <div style="padding:20px 18px">

    <!-- Section label -->
    <div style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:16px;display:flex;align-items:center;gap:8px">
      <span style="flex:1;height:1.5px;background:linear-gradient(90deg,#FDE68A,transparent)"></span>
      Fill in all 5 prompts below
      <span style="flex:1;height:1.5px;background:linear-gradient(270deg,#FDE68A,transparent)"></span>
    </div>

    ${prompts.map(p => ta(p)).join('')}

    <!-- Save button — full width, prominent -->
    <div style="margin-top:8px">
      <button onclick="saveCreativeWork()" id="cm-save-btn"
        style="width:100%;padding:16px 24px;border-radius:14px;border:none;
          background:linear-gradient(135deg,#F59E0B,#EC4899,#8B5CF6);
          color:#fff;font-size:15px;font-weight:900;cursor:pointer;
          font-family:'Nunito',sans-serif;letter-spacing:.03em;
          box-shadow:0 6px 20px rgba(245,158,11,.35);transition:all .2s"
        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 10px 28px rgba(245,158,11,.45)'"
        onmouseout="this.style.transform='';this.style.boxShadow='0 6px 20px rgba(245,158,11,.35)'">
        💾 Save My Journal Entry
      </button>
      <button onclick="cancelCreativeWork()"
        style="width:100%;margin-top:10px;padding:11px;border-radius:12px;
          border:1.5px solid #E5E7EB;background:#F9FAFB;color:#9CA3AF;
          font-size:13px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .15s"
        onmouseover="this.style.borderColor='#FCD34D';this.style.color='#92400E'"
        onmouseout="this.style.borderColor='#E5E7EB';this.style.color='#9CA3AF'">
        Cancel
      </button>
    </div>
    <div id="cm-status" style="margin-top:12px;text-align:center;font-size:12px;font-weight:800;min-height:18px"></div>
  </div>
</div>`;
}

// ── Journal mood selector ──────────────────────────────────────────────────
function selectJournalMood(btn, mood){
  document.querySelectorAll('#creative-content-area button').forEach(b=>{
    if(b.textContent.includes('Joyful')||b.textContent.includes('Calm')||b.textContent.includes('Excited')||b.textContent.includes('Loved')||b.textContent.includes('Strong')){
      b.style.background='#FFFBEB';b.style.borderColor='#FDE68A';b.style.color='#92400E';
    }
  });
  btn.style.background='linear-gradient(135deg,#F59E0B,#EC4899)';
  btn.style.borderColor='#F59E0B';btn.style.color='#fff';
  const hid=document.getElementById('cm-journal-mood');if(hid)hid.value=mood;
}

// ── Handle photo chosen ────────────────────────────────────────────────────
function onCreativePhotoChosen(input){
  if(!input){
    // Remove
    _creativePhotoData=null;
    const preview=document.getElementById('cm-photo-preview');
    const zone=document.getElementById('cm-upload-zone');
    const btns=document.getElementById('cm-action-btns');
    if(preview)preview.style.display='none';
    if(zone)zone.style.display='block';
    if(btns)btns.style.display='none';
    return;
  }
  const file=input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    _creativePhotoData=e.target.result;
    // Also update legacy creativeImgData for parent review display
    creativeImgData=_creativePhotoData;
    const img=document.getElementById('cm-photo-img');
    const preview=document.getElementById('cm-photo-preview');
    const zone=document.getElementById('cm-upload-zone');
    const btns=document.getElementById('cm-action-btns');
    if(img)img.src=_creativePhotoData;
    if(preview)preview.style.display='block';
    if(zone)zone.style.display='none';
    if(btns){btns.style.display='grid';}
    calcDayPts();
  };
  reader.readAsDataURL(file);
}

// Legacy compat — old previewCreativeImg still works
function previewCreativeImg(input){ onCreativePhotoChosen(input); }

let _creativeRestoredText = '';
function onCreativeTextInput(){
  const ta=document.getElementById('cm-text-input');
  const wc=document.getElementById('cm-word-count');
  if(ta&&wc){
    const words=ta.value.trim().split(/\s+/).filter(Boolean).length;
    wc.textContent=words+' word'+(words!==1?'s':'');
  }
}

// ── Cancel ─────────────────────────────────────────────────────────────────
function cancelCreativeWork(){
  _creativePhotoData=null; creativeImgData=null;
  const area=document.getElementById('creative-content-area');if(area)area.innerHTML='';
  const sel=document.getElementById('creative-activity-select');if(sel)sel.value='';
  _creativeActiveKey=''; creativeChosen=null; calcDayPts();
}

// ── Save to Supabase ───────────────────────────────────────────────────────
async function saveCreativeWork(){
  const key=_creativeActiveKey;
  const opt=_CREATIVE_MAP[key];
  if(!key||!opt){toast('Please choose an activity first!');return;}

  const date=document.getElementById('rpt-date')?.value;
  if(!date){toast('Please select a date to approve first!');return;}

  const btn=document.getElementById('cm-save-btn');
  const status=document.getElementById('cm-status');
  if(btn){btn.disabled=true;btn.textContent='\u23f3 Saving...';}

  // Collect content
  let textContent='', photoBase64=null, extra={};

  if(opt.type==='photo'){
    if(!_creativePhotoData){
      toast('\u26a0\ufe0f Please upload a photo first!');
      if(btn){btn.disabled=false;btn.textContent='\U0001f4be Save My Work';}
      return;
    }
    photoBase64=_creativePhotoData;
  } else if(opt.type==='text'){
    const ta=document.getElementById('cm-text-input');
    textContent=(ta?.value||'').trim();
    if(textContent.length<5){
      toast('\u26a0\ufe0f Please write something first!');
      if(btn){btn.disabled=false;btn.textContent='\U0001f4be Save My '+opt.title;}
      return;
    }
  } else if(opt.type==='journal'){
    const g1=(document.getElementById('cm-grateful-1')?.value||'').trim();
    const g2=(document.getElementById('cm-grateful-2')?.value||'').trim();
    const happy=(document.getElementById('cm-happy')?.value||'').trim();
    const learning=(document.getElementById('cm-learning')?.value||'').trim();
    const strength=(document.getElementById('cm-strength')?.value||'').trim();
    if(!g1&&!g2&&!happy){
      toast('⚠️ Please fill in at least one prompt to save your journal!');
      if(btn){btn.disabled=false;btn.textContent='💾 Save My Journal Entry';}
      return;
    }
    const parts=[];
    if(g1) parts.push('Grateful #1: '+g1);
    if(g2) parts.push('Grateful #2: '+g2);
    if(happy) parts.push('Happy Moment: '+happy);
    if(learning) parts.push("Today's Learning: "+learning);
    if(strength) parts.push('Inner Growth: '+strength);
    textContent=parts.join('\n\n');
    extra={grateful1:g1, grateful2:g2, happyMoment:happy, learning, innerGrowth:strength};
  }

  // Save to vaanya_creative_works table
  let cloudOk=false;
  if(_supabase){
    try{
      // Store full photo data (base64) — no truncation
      const photoStore = photoBase64 || null;
      const {error}=await _supabase.from('vaanya_creative_works').insert([{
        date,
        activity_key: key,
        activity_name: opt.title,
        text_content: textContent||null,
        photo_data: photoStore,
        extra_json: Object.keys(extra).length>0 ? JSON.stringify(extra) : null,
        created_at: new Date().toISOString(),
      }]);
      if(error){
        console.warn('Creative save error:',error);
        if(error.code==='42P01'){
          toast('\u26a0\ufe0f Creative works table not found — see console for setup SQL');
          console.info('%cRun this SQL in Supabase SQL Editor:\n\ncreate table vaanya_creative_works (\n  id bigint generated always as identity primary key,\n  date date not null,\n  activity_key text not null,\n  activity_name text not null,\n  text_content text,\n  photo_data text,\n  extra_json text,\n  created_at timestamptz default now()\n);\nalter table vaanya_creative_works enable row level security;\ncreate policy "allow all" on vaanya_creative_works for all using (true) with check (true);','color:orange;font-size:13px');
        }
      } else {
        cloudOk=true;
      }
    }catch(e){console.warn('Creative save exception:',e);}
  }

  // Also save into the main daily report draft for parent review display
  if(opt.type==='photo') creativeImgData=photoBase64;
  const cDesc=document.getElementById('creative-desc');if(cDesc)cDesc.value=textContent;
  await saveCreativeDraft();

  // Visual feedback
  _creativeSaved=true;
  if(status){
    status.innerHTML=cloudOk
      ?'<span style="color:#10B981;font-size:13px">\u2705 Saved! Mamma &amp; Papa can now see your beautiful work \U0001f3a8</span>'
      :'<span style="color:#F59E0B">\U0001f4be Saved locally! (Cloud sync pending)</span>';
  }
  if(btn){btn.disabled=false;btn.textContent='\u2705 Saved!';}
  toast('Your '+opt.title+' is saved! \U0001f929');
  calcDayPts();
}

// Legacy wrappers
async function saveCreativeDraft(){
  const date=document.getElementById('rpt-date')?.value;
  if(!date){toast('Please set a date on the Daily Report tab first!');return;}
  const ex=savedDays.find(d=>d.date===date);
  if(ex&&ex.approved===true){toast('\u2705 Report already approved — creative work is locked in!');return;}
  const pts=calcDayPts();
  const data=collectFormData(date,pts);
  const idx=savedDays.findIndex(d=>d.date===date);
  if(idx>=0){savedDays[idx]={...savedDays[idx],...data};}else{savedDays.unshift(data);}
  await saveToSupabase(data);
  updateTopBar();
  const msg=document.getElementById('creative-save-msg');
  if(msg)msg.textContent='';
}

function clearCreativeImg(){ onCreativePhotoChosen(null); }

function buildCreativeOptions(){
  const sel=document.getElementById('creative-activity-select');
  if(!sel)return;
  if(creativeChosen){
    const key=Object.keys(_CREATIVE_MAP).find(k=>_CREATIVE_MAP[k].title===creativeChosen);
    if(key){sel.value=key;_creativeRestoredText='';onCreativeSelect(key);}
  }
  const c=document.getElementById('creative-options');if(!c)return;
  c.innerHTML='';
  CREATIVE_OPTIONS.forEach(opt=>{
    const div=document.createElement('div');div.className='creative-option';
    div.style.display='none';
    div.innerHTML=`<div class="co-icon">${opt.icon}</div><div class="co-title">${opt.title}</div>`;
    c.appendChild(div);
  });
}


let geetaProgress    = {};
let geetaActiveGroup = null;
let geetaSceneOpen   = false;

function _geetaLoadProgress(){
  try{
    // ── Step 1: Build cumulative map from ALL approved days ───────────────────
    const cumulative = {};
    savedDays
      .filter(d => d.approved === true)
      .sort((a,b) => new Date(a.date) - new Date(b.date))
      .forEach(d => {
        try{
          const prog = d.geetaProgress ? JSON.parse(d.geetaProgress) : {};
          Object.entries(prog).forEach(([id, val]) => {
            const cur = cumulative[id];
            // Priority: mastered > relearning > inprogress > new
            // Once mastered, only relearning or mastered can replace it
            if(!cur){
              cumulative[id] = val;
            } else if(cur.status === 'inprogress' && (val.status === 'mastered' || val.status === 'relearning')){
              cumulative[id] = val;
            } else if(cur.status === 'relearning' && val.status === 'mastered'){
              cumulative[id] = val;
            } else if(cur.status === 'mastered' && val.status === 'relearning'){
              cumulative[id] = val; // parent explicitly demoted it
            }
          });
        }catch(e){}
      });

    // ── Step 2: Today's unapproved draft may have inprogress/relearning ──────
    const todayStr = (document.getElementById('rpt-date')?.value) ||
      new Date(Date.now()+5.5*60*60000).toISOString().split('T')[0];
    const todayDraft = savedDays.find(x => x.date === todayStr && x.approved !== true);
    const fromToday = todayDraft && todayDraft.geetaProgress
      ? JSON.parse(todayDraft.geetaProgress) : {};

    // ── Step 3: localStorage for mid-session changes ──────────────────────────
    let fromLocal = {};
    try{
      const raw = localStorage.getItem('vaanya_geeta_progress');
      if(raw) fromLocal = JSON.parse(raw) || {};
    }catch(e){}

    // Merge — cumulative approved wins over local/today for mastered/relearning
    const merged = {...fromLocal, ...fromToday, ...cumulative};
    // Final pass: mastered/relearning from cumulative always wins
    Object.entries(cumulative).forEach(([id, val]) => {
      if(val.status === 'mastered' || val.status === 'relearning') merged[id] = val;
    });
    geetaProgress = merged;

    // ── One-time cloud repair: remove s13 if wrongly mastered ──────────────
    // This was incorrectly approved via the generic fallback button.
    if(geetaProgress['s13'] && geetaProgress['s13'].status === 'mastered'){
      if(!localStorage.getItem('vaanya_s13_cloud_repair_v1')){
        delete geetaProgress['s13'];
        localStorage.setItem('vaanya_s13_cloud_repair_v1','done');
        // Patch will be pushed to Supabase on next saveGeetaDraft or approveReport
        _persistGeetaToLocalStorage();
      }
    }

  }catch(e){
    try{
      const raw = localStorage.getItem('vaanya_geeta_progress');
      geetaProgress = raw ? JSON.parse(raw) : {};
    }catch(e2){ geetaProgress = {}; }
  }
}
function _geetaTotalPts(){
  return Object.values(geetaProgress).reduce((s,v)=>
    s+(v.status==='mastered'?25:v.status==='inprogress'?10:v.status==='relearning'?10:0),0);
}
function _geetaInProgressId(){
  // Returns shlokaId where status === 'inprogress' (the one NEW shloka being learned)
  const e=Object.entries(geetaProgress).find(([,v])=>v.status==='inprogress');
  return e?e[0]:null;
}
function _geetaReLearningIds(){
  // Returns all shlokaIds where status === 'relearning'
  return Object.entries(geetaProgress).filter(([,v])=>v.status==='relearning').map(([id])=>id);
}

function buildShlokaDisplay(){
  _geetaLoadProgress();
  // Merge permanent mastered store — but NEVER overwrite a 'relearning' status
  // (parent intentionally demoted it; don't let the permanent store undo that)
  try{
    const mastered = JSON.parse(localStorage.getItem('vaanya_geeta_mastered')||'{}');
    Object.entries(mastered).forEach(([id, val]) => {
      const cur = geetaProgress[id];
      // Only apply if not already tracked, or if current is just 'inprogress' from today
      // Never overwrite 'relearning' — that's an intentional parent demotion
      if(!cur){
        geetaProgress[id] = val;
      } else if(cur.status === 'inprogress' && val.status === 'mastered'){
        // Approved day record wins over a stale inprogress draft
        geetaProgress[id] = val;
      }
      // relearning and mastered from cumulative already handled in _geetaLoadProgress
    });
  }catch(e){}
  _buildGroupFilterBtns();
  _renderBrowseGrid();
  _updateGeetaHeader();
  _updateMasteredList();
  const el=document.getElementById('geeta-scene-text');
  if(el&&GITA_CHAPTER_SCENE[0])el.innerHTML=GITA_CHAPTER_SCENE[0];
}

function _updateGeetaHeader(){
  const mastered=Object.values(geetaProgress).filter(v=>v.status==='mastered').length;
  const bar=document.getElementById('geeta-master-bar');
  if(bar)bar.style.width=Math.round(mastered/30*100)+'%';
  const lbl=document.getElementById('geeta-master-lbl');
  if(lbl)lbl.textContent=mastered+' / 30 shlokas mastered';
  const badge=document.getElementById('geeta-pts-badge');
  if(badge)badge.textContent=_geetaTotalPts();
}

function _buildGroupFilterBtns(){
  const c=document.getElementById('geeta-group-filters');
  if(!c||c.children.length>1)return;
  GITA_GROUPS.forEach(g=>{
    const btn=document.createElement('button');
    btn.id='gfbtn-'+g.id;
    btn.onclick=()=>filterGeetaGroup(g.id,btn);
    btn.style.cssText='text-align:left;padding:5px 8px;border-radius:7px;border:1.5px solid '+g.border+';background:'+g.light+';font-size:10px;font-weight:800;color:'+g.color+';cursor:pointer;width:100%';
    btn.textContent=g.icon+' '+g.name;
    c.appendChild(btn);
  });
}

function filterGeetaGroup(groupId,btn){
  geetaActiveGroup=groupId;
  if(groupId){
    const gi=GITA_GROUPS.findIndex(g=>g.id===groupId);
    const el=document.getElementById('geeta-scene-text');
    if(el&&GITA_CHAPTER_SCENE[gi])el.innerHTML=GITA_CHAPTER_SCENE[gi];
    const body=document.getElementById('geeta-scene-body');
    const arrow=document.getElementById('geeta-scene-arrow');
    if(body&&body.style.display==='none'){body.style.display='block';geetaSceneOpen=true;if(arrow)arrow.style.transform='rotate(180deg)';}
  }
  const lbl=document.getElementById('geeta-filter-lbl');
  if(lbl){
    if(groupId){const g=GITA_GROUPS.find(x=>x.id===groupId);lbl.textContent=(g?g.icon:'')+' '+SHLOKAS.filter(s=>s.group===groupId).length+' shlokas';}
    else lbl.textContent='All 30';
  }
  _renderBrowseGrid();
}

function _geetaActiveInProgressId(){
  // Returns inprogress shlokaId ONLY if it's from today or an unapproved day
  // Ignores ghost inprogress entries left over from old approved days
  const e=Object.entries(geetaProgress).find(([,v])=>{
    if(v.status!=='inprogress') return false;
    if(!v.date) return true; // no date — assume active
    // Check if the day it was started is already approved
    const dayRec=savedDays.find(d=>d.date===v.date);
    if(dayRec && dayRec.approved===true){
      // Day is approved — this is a ghost. Only keep it if it was explicitly mastered
      // (which would have changed status). Since it's still inprogress, it's stale.
      return false;
    }
    return true;
  });
  return e?e[0]:null;
}

function _renderBrowseGrid(){
  const grid=document.getElementById('shloka-browse-grid');
  if(!grid)return;
  const inProgressId=_geetaActiveInProgressId();  // only non-stale inprogress
  const relearningIds=_geetaReLearningIds();
  const hasBlocker=inProgressId||relearningIds.length>0; // any active shloka blocks new ones
  const groups=geetaActiveGroup?[GITA_GROUPS.find(g=>g.id===geetaActiveGroup)].filter(Boolean):GITA_GROUPS;
  let html='';
  groups.forEach(function(g){
    const list=SHLOKAS.filter(s=>s.group===g.id);
    html+='<div style="margin-bottom:8px"><div style="font-size:10px;font-weight:900;color:'+g.color+';text-transform:uppercase;letter-spacing:.07em;padding:4px 8px;background:'+g.light+';border-radius:7px;margin-bottom:4px;border:1px solid '+g.border+'">'+g.icon+' '+g.name+' <span style="font-weight:600;opacity:.7">'+g.chapters+'</span></div>';
    list.forEach(function(s){
      const prog=geetaProgress[s.id];
      const status=prog?prog.status:'new';
      const isRelearning=status==='relearning';
      const isInProgress=status==='inprogress';
      const isMastered=status==='mastered';
      // Lock new shlokas if any shloka is in learning or relearning
      const isLocked=(status==='new')&&hasBlocker&&inProgressId!==s.id&&!relearningIds.includes(s.id);

      let icon,sc,sb,bord,lbl,cur,op;
      if(isMastered){
        icon='&#x2705;';sc='#065F46';sb='#ECFDF5';bord='#6EE7B7';lbl='MASTERED';cur='cursor:pointer;';op='';
      }else if(isRelearning){
        icon='&#x1F504;';sc='#1D4ED8';sb='#EFF6FF';bord='#93C5FD';lbl='RELEARNING';cur='cursor:pointer;';op='';
      }else if(isInProgress){
        icon='&#x1F4D6;';sc='#92400E';sb='#FFFBEB';bord='#FCD34D';lbl='LEARNING';cur='cursor:pointer;';op='';
      }else if(isLocked){
        icon='&#x1F512;';sc='#9CA3AF';sb='#F9FAFB';bord='#E5E7EB';lbl='LOCKED';cur='cursor:not-allowed;';op='opacity:.5;';
      }else{
        icon='&#x1F513;';sc='#6B7280';sb='#F9FAFB';bord='#E5E7EB';lbl='TAP TO START';cur='cursor:pointer;';op='';
      }
      const nameTxt=isLocked?'#9CA3AF':g.color;
      const titleTxt=isLocked?'#9CA3AF':'#1F2937';
      const lessonPreview=(s.lesson||'').substring(0,72)+(s.lesson&&s.lesson.length>72?'…':'');
      if(isLocked){
        html+='<div onclick="_showLockedMsg()" style="'+cur+op+'background:#fff;border-radius:10px;border:1.5px solid '+bord+';padding:9px 12px;margin-bottom:4px;display:flex;align-items:center;gap:9px;transition:all .18s"><div style="font-size:18px">'+icon+'</div><div style="flex:1;min-width:0"><div style="font-size:10px;font-weight:900;color:'+nameTxt+'">'+s.chapter+'</div><div style="font-size:11px;font-weight:800;color:'+titleTxt+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+s.chapterMeaning+'</div><div style="font-size:10px;color:#9CA3AF;line-height:1.4;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+lessonPreview+'</div></div><div style="font-size:9px;font-weight:900;padding:2px 7px;border-radius:50px;background:'+sb+';color:'+sc+';white-space:nowrap;flex-shrink:0">'+lbl+'</div></div>';
      }else{
        html+='<div onclick="_openShloka(\''+s.id+'\')" onmouseover="this.style.borderColor=\''+g.color+'\';this.style.transform=\'translateX(2px)\'" onmouseout="this.style.borderColor=\''+bord+'\';this.style.transform=\'\'" style="'+cur+'background:#fff;border-radius:10px;border:1.5px solid '+bord+';padding:9px 12px;margin-bottom:4px;display:flex;align-items:center;gap:9px;transition:all .18s"><div style="font-size:18px">'+icon+'</div><div style="flex:1;min-width:0"><div style="font-size:10px;font-weight:900;color:'+nameTxt+'">'+s.chapter+'</div><div style="font-size:11px;font-weight:800;color:'+titleTxt+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+s.chapterMeaning+'</div><div style="font-size:10px;color:#6B7280;line-height:1.4;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+lessonPreview+'</div></div><div style="font-size:9px;font-weight:900;padding:2px 7px;border-radius:50px;background:'+sb+';color:'+sc+';white-space:nowrap;flex-shrink:0">'+lbl+'</div></div>';
      }
    });
    html+='</div>';
  });
  grid.innerHTML=html;
}

function _showLockedMsg(){
  const relearningIds=_geetaReLearningIds();
  const activeId=_geetaActiveInProgressId();
  if(relearningIds.length>0){
    toast('🔒 Re-master your Relearning shloka(s) first before starting a new one! Ask Mamma or Papa to approve. 🙏');
  }else if(activeId){
    toast('🔒 Finish your current shloka first! Recite it to Mamma or Papa to unlock the next one. 🙏');
  }else{
    toast('🔒 Complete your current shloka to unlock the next one. 🙏');
  }
}

function _openShloka(shlokaId){
  const s=SHLOKAS.find(x=>x.id===shlokaId);if(!s)return;
  const prog=geetaProgress[s.id];
  const status=prog?prog.status:'new';
  const g=GITA_GROUPS.find(x=>x.id===s.group)||{color:'#065F46',light:'#ECFDF5',icon:'\uD83D\uDE4F',border:'#6EE7B7',name:'',chapters:''};
  const wordRows=(s.wordMeaning||[]).map(function(w){return '<tr><td style="padding:3px 8px;font-weight:800;color:#1F2937;font-size:12px;white-space:nowrap;font-style:italic">'+w.w+'</td><td style="padding:3px 8px;color:#4B5563;font-size:12px">'+w.m+'</td></tr>';}).join('');
  const inProgressId=_geetaActiveInProgressId();
  const relearningIds=_geetaReLearningIds();
  const hasBlocker=inProgressId||relearningIds.length>0;
  // Locked if new and any shloka is active (learning or relearning)
  if(status==='new'&&hasBlocker&&inProgressId!==s.id&&!relearningIds.includes(s.id)){_showLockedMsg();return;}
  // Auto-start learning if new — no prompt needed
  if(status==='new'&&!hasBlocker){ _geetaStartLearn(s.id,true); }
  let actionHtml='';
  if(status==='new'){
    actionHtml='<div style="background:#FFFBEB;border:1.5px solid #FCD34D;border-radius:14px;padding:14px;margin-top:20px;text-align:center"><div style="font-size:14px;font-weight:900;color:#92400E">📖 You are now learning this shloka!</div><div style="font-size:12px;color:#78350F;margin-top:6px;line-height:1.6">Recite it to Mamma or Papa. When they approve → Mastered! Earning 10 pts now ✨</div></div>';
  }else if(status==='inprogress'){
    actionHtml='<div style="background:#FFFBEB;border:1.5px solid #FCD34D;border-radius:14px;padding:14px;margin-top:20px;text-align:center"><div style="font-size:14px;font-weight:900;color:#92400E">📖 You are learning this shloka!</div><div style="font-size:12px;color:#78350F;margin-top:6px;line-height:1.6">Recite it to Mamma or Papa. When they approve → Mastered! Earning 10 pts now ✨</div></div>';
  }else if(status==='relearning'){
    actionHtml='<div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:14px;padding:14px;margin-top:20px;text-align:center"><div style="font-size:14px;font-weight:900;color:#1D4ED8">🔄 You are re-learning this shloka!</div><div style="font-size:12px;color:#1E3A8A;margin-top:6px;line-height:1.6">Mamma or Papa moved this back for practice. Recite it to them again. When they approve → Re-Mastered! ✨</div></div>';
  }else{
    actionHtml='<div style="background:#ECFDF5;border:1.5px solid #6EE7B7;border-radius:14px;padding:14px;margin-top:20px;text-align:center"><div style="font-size:14px;font-weight:900;color:#065F46">✅ You have mastered this shloka!</div><div style="font-size:12px;color:#047857;margin-top:4px">Mastered on '+(prog?prog.date:'')+'. You earned 25 pts! 🎉</div></div>';
  }
  const san=(s.sanskrit||'').replace(/\n/g,'<br>');
  const trl=(s.transliteration||'').replace(/\n/g,'<br>');
  document.getElementById('shloka-overlay-content').innerHTML=
    '<div style="background:linear-gradient(135deg,'+g.color+','+g.color+'CC);padding:18px 22px"><div style="display:flex;align-items:center;gap:10px"><div style="font-size:26px">'+g.icon+'</div><div><div style="font-size:11px;font-weight:900;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.08em">'+g.name+' \u00B7 '+g.chapters+'</div><div style="font-size:16px;font-weight:900;color:#fff">'+s.chapter+'</div><div style="font-size:11px;color:rgba(255,255,255,.85);margin-top:2px">'+s.chapterName+' \u2014 <i>'+s.chapterMeaning+'</i></div></div></div></div>'+
    '<div style="padding:18px 22px">'+
    '<div style="background:#FFF7ED;border-left:4px solid #F97316;border-radius:0 12px 12px 0;padding:12px 14px;margin-bottom:16px"><div style="font-size:10px;font-weight:900;color:#C2410C;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">\uD83C\uDFF9 What Was Happening</div><div style="font-size:13px;color:#374151;line-height:1.85">'+s.moment+'</div></div>'+
    '<div style="background:linear-gradient(135deg,#F5F3FF,#EFF6FF);border:2px solid #C4B5FD;border-radius:16px;padding:16px;margin-bottom:14px;text-align:center"><div style="font-size:10px;font-weight:900;color:#4C1D95;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">\uD83D\uDE4F The Shloka</div><div style="font-size:17px;font-weight:900;color:#1F2937;line-height:2.1;font-family:serif">'+san+'</div><div style="height:1px;background:#C4B5FD;margin:11px 0"></div><div style="font-size:12px;color:#4C1D95;font-style:italic;line-height:1.8">'+trl+'</div></div>'+
    '<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:900;color:#065F46;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px">\uD83D\uDCD6 Word by Word</div><table style="width:100%;border-collapse:collapse;background:#F0FDF4;border-radius:11px;overflow:hidden"><tr style="background:#065F46"><th style="padding:5px 8px;text-align:left;font-size:10px;color:#fff;font-weight:800">Sanskrit</th><th style="padding:5px 8px;text-align:left;font-size:10px;color:#fff;font-weight:800">Meaning</th></tr>'+wordRows+'</table></div>'+
    '<div style="background:#F0FDF4;border:1.5px solid #6EE7B7;border-radius:13px;padding:12px 14px;margin-bottom:13px"><div style="font-size:10px;font-weight:900;color:#065F46;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">\uD83D\uDCAC The Meaning</div><div style="font-size:13px;color:#064E3B;line-height:1.85;font-style:italic">&ldquo;'+s.meaning+'&rdquo;</div></div>'+
    '<div style="background:linear-gradient(135deg,#EFF6FF,#F5F3FF);border:1.5px solid #93C5FD;border-radius:13px;padding:12px 14px;margin-bottom:13px"><div style="font-size:10px;font-weight:900;color:#1D4ED8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">\uD83D\uDD35 What Krishna Is Really Saying</div><div style="font-size:13px;color:#1E3A8A;line-height:1.85">'+s.krishnaSays+'</div></div>'+
    '<div style="background:#fff;border:2px solid #FDE68A;border-radius:15px;padding:14px;margin-bottom:13px"><div style="font-size:10px;font-weight:900;color:#92400E;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px">\uD83D\uDCDA The Story</div><div style="font-size:13px;color:#374151;line-height:1.9">'+s.story+'</div></div>'+
    '<div style="background:linear-gradient(135deg,#065F46,#047857);border-radius:13px;padding:12px 14px;margin-bottom:12px"><div style="font-size:10px;font-weight:900;color:rgba(167,243,208,.9);text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">\u2B50 The Lesson</div><div style="font-size:14px;font-weight:800;color:#fff;line-height:1.6">'+s.lesson+'</div></div>'+
    '<div style="background:#FFFBEB;border:1.5px solid #FCD34D;border-radius:13px;padding:12px 14px;margin-bottom:4px"><div style="font-size:10px;font-weight:900;color:#92400E;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">\uD83C\uDF1F Vaanya&#39;s Life</div><div style="font-size:13px;color:#78350F;line-height:1.85">'+s.lifeConnect+'</div></div>'+
    actionHtml+
    '</div>';
  document.getElementById('shloka-overlay').style.display='block';
  document.body.style.overflow='hidden';
}

function _geetaStartLearn(shlokaId, silent){
  const today=new Date(Date.now()+5.5*60*60000).toISOString().split('T')[0];
  geetaProgress[shlokaId]={status:'inprogress',date:today,pts:10};
  _saveGeetaProgress();
  _persistGeetaToLocalStorage();
  if(!silent){
    closeShloka(null,true);
    toast('\uD83D\uDCD6 Learning started! Recite to Mamma or Papa for 25 pts! \uD83D\uDE4F');
  }
}

// Persist geetaProgress to localStorage so it survives page refresh.
// Mastered shlokas go into a SEPARATE permanent key — they are never re-promoted
// if the parent has since demoted them to relearning.
function _persistGeetaToLocalStorage(){
  try{
    localStorage.setItem('vaanya_geeta_progress', JSON.stringify(geetaProgress));
    // Permanent mastered store — only write status=mastered, never relearning/inprogress
    const existingMastered = JSON.parse(localStorage.getItem('vaanya_geeta_mastered')||'{}');
    Object.entries(geetaProgress).forEach(([id, val]) => {
      if(val.status === 'mastered'){
        existingMastered[id] = val;
      } else {
        // Explicitly remove from permanent store if demoted
        delete existingMastered[id];
      }
    });
    localStorage.setItem('vaanya_geeta_mastered', JSON.stringify(existingMastered));
  }catch(e){}
}

// Load geetaProgress from localStorage as fallback, merging permanent mastered store
function _loadGeetaFromLocalStorage(){
  try{
    const raw = localStorage.getItem('vaanya_geeta_progress');
    const progress = raw ? JSON.parse(raw) : {};
    const mastered = JSON.parse(localStorage.getItem('vaanya_geeta_mastered')||'{}');
    // Mastered always wins
    geetaProgress = {...progress, ...mastered};
  }catch(e){}
}

function closeShloka(event,force){
  if(!force&&event&&event.target!==document.getElementById('shloka-overlay'))return;
  document.getElementById('shloka-overlay').style.display='none';
  document.body.style.overflow='';
  _renderBrowseGrid();_updateGeetaHeader();
}

function _saveGeetaProgress(){
  calcDayPts();_updateGeetaHeader();_updateMasteredList();
}

function _updateMasteredList(){
  const masteredList=SHLOKAS.filter(s=>geetaProgress[s.id]&&geetaProgress[s.id].status==='mastered');
  const relearningList=SHLOKAS.filter(s=>geetaProgress[s.id]&&geetaProgress[s.id].status==='relearning');
  const badge=document.getElementById('mastered-count-badge');
  if(badge)badge.textContent=masteredList.length+'/30';
  const inner=document.getElementById('mastered-list-inner');
  if(!inner)return;
  if(!masteredList.length&&!relearningList.length){
    inner.innerHTML='<div style="text-align:center;padding:14px;font-size:11px;color:#9CA3AF">No shlokas mastered yet. Start learning!</div>';
    return;
  }
  let html='';
  if(masteredList.length){
    html+='<div style="font-size:10px;font-weight:900;color:#065F46;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">✅ Mastered ('+masteredList.length+')</div>';
    html+=masteredList.map(function(s){
      const g=GITA_GROUPS.find(x=>x.id===s.group)||{color:'#065F46'};
      return '<div style="display:flex;align-items:center;gap:7px;padding:7px;background:#ECFDF5;border-radius:9px;margin-bottom:4px;border:1px solid #A7F3D0">'
        +'<div onclick="_openShloka(\''+s.id+'\')" style="display:flex;align-items:center;gap:7px;flex:1;min-width:0;cursor:pointer">'
        +'<div style="font-size:14px">✅</div>'
        +'<div style="flex:1;min-width:0"><div style="font-size:10px;font-weight:900;color:'+g.color+'">'+s.chapter+'</div>'
        +'<div style="font-size:10px;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+s.lesson.substring(0,50)+'...</div></div>'
        +'<div style="font-size:9px;color:#065F46;font-weight:800;flex-shrink:0">+25</div></div>'
        +(parentUnlocked?'<button onclick="event.stopPropagation();_moveToRelearning(\''+s.id+'\')" title="Move to Relearning" '
          +'style="background:#EFF6FF;border:1px solid #93C5FD;border-radius:6px;font-size:9px;cursor:pointer;color:#1D4ED8;padding:3px 7px;flex-shrink:0;font-weight:900;font-family:\'Nunito\',sans-serif">🔄 Relearn</button>':'')
        +'</div>';
    }).join('');
  }
  if(relearningList.length){
    html+='<div style="font-size:10px;font-weight:900;color:#1D4ED8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;'+(masteredList.length?'margin-top:10px;':'')+'">🔄 Relearning ('+relearningList.length+')</div>';
    html+=relearningList.map(function(s){
      const g=GITA_GROUPS.find(x=>x.id===s.group)||{color:'#1D4ED8'};
      return '<div style="display:flex;align-items:center;gap:7px;padding:7px;background:#EFF6FF;border-radius:9px;margin-bottom:4px;border:1px solid #93C5FD">'
        +'<div onclick="_openShloka(\''+s.id+'\')" style="display:flex;align-items:center;gap:7px;flex:1;min-width:0;cursor:pointer">'
        +'<div style="font-size:14px">🔄</div>'
        +'<div style="flex:1;min-width:0"><div style="font-size:10px;font-weight:900;color:'+g.color+'">'+s.chapter+'</div>'
        +'<div style="font-size:10px;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+s.lesson.substring(0,50)+'...</div></div>'
        +'<div style="font-size:9px;color:#1D4ED8;font-weight:800;flex-shrink:0">10 pts</div></div>'
        +'</div>';
    }).join('');
  }
  inner.innerHTML=html;
}

// Move a mastered shloka to Relearning (parent action only)
async function _moveToRelearning(shlokaId){
  if(!parentUnlocked){ toast('PIN required.'); return; }
  const shloka=SHLOKAS.find(s=>s.id===shlokaId);
  const name=shloka?shloka.chapter+' — '+shloka.chapterName:shlokaId;
  const confirmed=window.confirm('Move "'+name+'" to Relearning?\n\n• Vaanya will need to recite it again\n• 10 pts will be deducted\n• You can Re-Master it after she recites correctly');
  if(!confirmed) return;

  const today=new Date(Date.now()+5.5*60*60000).toISOString().split('T')[0];
  geetaProgress[shlokaId]={status:'relearning', date:today, pts:10, demotedFrom:'mastered'};
  _saveGeetaProgress();
  _persistGeetaToLocalStorage(); // removes from permanent mastered store

  // Patch all savedDays records
  savedDays.forEach(d=>{
    try{
      const prog=d.geetaProgress?JSON.parse(d.geetaProgress):{};
      if(prog[shlokaId]){
        prog[shlokaId]={status:'relearning', date:today, pts:10, demotedFrom:'mastered'};
        d.geetaProgress=JSON.stringify(prog);
      }
    }catch(e){}
  });
  // Also patch most recent approved record
  const mostRecent=savedDays.find(d=>d.approved===true);
  if(mostRecent){
    try{
      const prog=mostRecent.geetaProgress?JSON.parse(mostRecent.geetaProgress):{};
      prog[shlokaId]={status:'relearning', date:today, pts:10, demotedFrom:'mastered'};
      mostRecent.geetaProgress=JSON.stringify(prog);
      await saveToSupabase({...mostRecent});
    }catch(e){}
  }
  localStorage.setItem('vaanya_days', JSON.stringify(savedDays));
  calcDayPts();
  _renderBrowseGrid();
  renderParentShlokaMgmt();
  toast('🔄 Moved to Relearning! 10 pts deducted. Ask Vaanya to recite again when ready.');
}

function toggleMasteredList(){
  const body=document.getElementById('mastered-list-body');
  const arrow=document.getElementById('mastered-arrow');
  if(!body)return;
  const open=body.style.display!=='none';
  body.style.display=open?'none':'block';
  if(arrow)arrow.style.transform=open?'':'rotate(180deg)';
  if(!open)_updateMasteredList();
}

function toggleGeetaScene(){
  const body=document.getElementById('geeta-scene-body');
  const arrow=document.getElementById('geeta-scene-arrow');
  if(!body)return;
  geetaSceneOpen=!geetaSceneOpen;
  body.style.display=geetaSceneOpen?'block':'none';
  if(arrow)arrow.style.transform=geetaSceneOpen?'rotate(180deg)':'';
}

function renderParentShlokaApproval(){
  const container=document.getElementById('parent-shloka-approval-section');
  if(!container)return;

  // Use the already-loaded geetaProgress directly — it's been correctly built
  // by _geetaLoadProgress() which handles all the cumulative merging.
  // Looking for inprogress OR relearning shlokas.
  const pending=SHLOKAS.filter(s=>
    geetaProgress[s.id] &&
    (geetaProgress[s.id].status==='inprogress' || geetaProgress[s.id].status==='relearning')
  );

  // If in-memory has nothing, also check the currently loaded day's raw record
  // (handles case where report was reopened for edit and geetaProgress wasn't refreshed)
  if(!pending.length){
    const loadedDate=document.getElementById('rpt-date')?.value;
    if(loadedDate){
      const rec=savedDays.find(d=>d.date===loadedDate);
      if(rec&&rec.geetaProgress){
        try{
          const prog=JSON.parse(rec.geetaProgress);
          const entry=Object.entries(prog).find(([,v])=>v.status==='inprogress'||v.status==='relearning');
          if(entry){
            // Found it in the cloud record — merge into geetaProgress and re-render
            geetaProgress[entry[0]]=entry[1];
            renderParentShlokaApproval();
            return;
          }
        }catch(e){}
      }
    }
  }

  // Dropdown check — if parent has set 25 pts but no shloka found
  const dropdownVal=parseInt(document.getElementById('shloka-pts-award')?.value||0)||0;

  if(!pending.length){
    if(dropdownVal>=25){
      // Show a clear message instead of a blind approve button
      container.innerHTML='<div style="background:#FFF7ED;border:1.5px solid #FCD34D;border-radius:12px;padding:12px 14px;font-size:12px;color:#92400E;font-weight:700;line-height:1.6">'
        +'⚠️ No shloka found in <b>Learning</b> or <b>Relearning</b> status.<br>'
        +'Please go to the <b>Geeta — Soul Work</b> tab, have Vaanya tap on a shloka to start learning it first, then come back here to approve.</div>';
      return;
    }
    container.innerHTML='<div style="font-size:12px;color:#9CA3AF;text-align:center;padding:12px">No shlokas awaiting approval. Vaanya needs to start learning one first.</div>';
    return;
  }

  container.innerHTML=pending.map(function(s){
    const prog=geetaProgress[s.id]||{};
    const isRelearning=prog.status==='relearning';
    const since=prog.date?' · '+(isRelearning?'relearning since ':'learning since ')+fmtDate(prog.date):'';
    const btnLabel=isRelearning?'✅ Re-Master — Mark as Mastered Again':'✅ Approve — Mark as Mastered & Unlock Next Shloka';
    const cardBg=isRelearning?'#EFF6FF':'#FFFBEB';
    const cardBord=isRelearning?'#93C5FD':'#FCD34D';
    const headerCol=isRelearning?'#1D4ED8':'#92400E';
    const subCol=isRelearning?'#1E3A8A':'#78350F';
    const noteText=isRelearning
      ?'Vaanya has been re-practising this shloka. If she recites it correctly — tap Re-Master below.'
      :'Ask Vaanya to recite this shloka. If correct — tap Approve below.';
    return '<div style="background:'+cardBg+';border:2px solid '+cardBord+';border-radius:13px;padding:14px;margin-bottom:9px">'
      +'<div style="font-size:13px;font-weight:900;color:'+headerCol+';margin-bottom:2px">'+s.chapter+since+'</div>'
      +'<div style="font-size:12px;font-weight:800;color:'+subCol+';margin-bottom:6px">'+s.chapterName+' — <i>'+s.chapterMeaning+'</i></div>'
      +'<div style="font-size:12px;color:#374151;margin-bottom:6px;font-style:italic">&ldquo;'+s.meaning.substring(0,120)+'...&rdquo;</div>'
      +'<div style="font-size:11px;color:'+subCol+';margin-bottom:12px;line-height:1.6">'+noteText+'</div>'
      +'<button onclick="_parentApproveShloka(\''+s.id+'\')" '
      +'style="width:100%;background:linear-gradient(135deg,#065F46,#10B981);color:#fff;border:none;'
      +'padding:13px 22px;border-radius:12px;font-size:14px;font-weight:900;cursor:pointer;'
      +'font-family:\'Nunito\',sans-serif;box-shadow:0 4px 14px rgba(16,185,129,.35);letter-spacing:.03em">'
      +btnLabel+'</button>'
      +'</div>';
  }).join('');
}

// Fallback: called when dropdown=25 but shloka can't be identified from scan.
// Shows which shloka will be approved and requires explicit confirm.
async function _parentApproveCurrentShloka(){
  // Try in-memory geetaProgress first
  let id = _geetaInProgressId();

  // If not in memory, scan the loaded day's cloud record directly
  if(!id){
    const loadedDate = document.getElementById('rpt-date')?.value;
    if(loadedDate){
      const rec = savedDays.find(d=>d.date===loadedDate);
      if(rec && rec.geetaProgress){
        try{
          const prog = JSON.parse(rec.geetaProgress);
          const entry = Object.entries(prog).find(([,v])=>v.status==='inprogress');
          if(entry) id = entry[0];
        }catch(e){}
      }
    }
  }

  // Also check vaanya_geeta_progress localStorage
  if(!id){
    try{
      const local = JSON.parse(localStorage.getItem('vaanya_geeta_progress')||'{}');
      const entry = Object.entries(local).find(([,v])=>v.status==='inprogress');
      if(entry) id = entry[0];
    }catch(e){}
  }

  if(!id){
    toast('⚠️ Could not find the shloka in learning. Please scroll to the Shloka Mastery Approval section above and use the Approve button there.');
    return;
  }

  // Find the shloka details so parent can confirm the right one
  const shloka = SHLOKAS.find(s=>s.id===id);
  const name = shloka ? shloka.chapter + ' — ' + shloka.chapterName : id;
  const confirmed = window.confirm('✅ Approve this shloka as MASTERED?\n\n' + name + '\n\nThis will unlock the next shloka for Vaanya.');
  if(!confirmed) return;

  await _parentApproveShloka(id);
}

async function _parentApproveShloka(shlokaId){
  const today=new Date(Date.now()+5.5*60*60000).toISOString().split('T')[0];
  const existingProg=geetaProgress[shlokaId]||{};
  const wasRelearning=existingProg.status==='relearning';

  // Re-mastering a relearning shloka: restore pts (net 0 change, not +25 again)
  // Mastering a new inprogress shloka: +25 pts
  const masteredEntry={status:'mastered', date:today, pts:25,
    remastered: wasRelearning ? true : undefined};

  geetaProgress[shlokaId]=masteredEntry;
  _saveGeetaProgress();
  _persistGeetaToLocalStorage();

  // Patch all savedDays records that reference this shlokaId
  const patched=[];
  savedDays.forEach(d=>{
    try{
      const prog=d.geetaProgress?JSON.parse(d.geetaProgress):{};
      if(prog[shlokaId]){
        prog[shlokaId]=masteredEntry;
        d.geetaProgress=JSON.stringify(prog);
        patched.push(d);
      }
    }catch(e){}
  });

  // Also patch the currently loaded date (rpt-date) even if empty there
  const loadedDate=document.getElementById('rpt-date')?.value||today;
  let loadedRec=savedDays.find(d=>d.date===loadedDate);
  if(!patched.find(d=>d.date===loadedDate)){
    if(loadedRec){
      try{
        const prog=loadedRec.geetaProgress?JSON.parse(loadedRec.geetaProgress):{};
        prog[shlokaId]=masteredEntry;
        loadedRec.geetaProgress=JSON.stringify(prog);
        patched.push(loadedRec);
      }catch(e){}
    }
  }
  localStorage.setItem('vaanya_days', JSON.stringify(savedDays));

  // Push to Supabase
  for(const d of patched){
    try{ await saveToSupabase({...d}); }catch(e){ console.warn('Shloka patch failed',d.date,e); }
  }

  // Update dropdown + pts
  const awd=document.getElementById('shloka-pts-award');
  if(awd) awd.value='25';
  calcDayPts();

  // Refresh Geeta tab
  buildShlokaDisplay();
  renderParentShlokaApproval();
  renderParentShlokaMgmt();

  if(wasRelearning){
    toast('✅ Re-Mastered! '+SHLOKAS.find(s=>s.id===shlokaId)?.chapter+' — pts restored 🎉');
  }else{
    toast('✅ Shloka Mastered! Cloud updated. New shlokas now unlocked in Geeta tab 🎉');
  }
}

function buildEarnGuide(){
  const tb=document.getElementById('earn-guide');if(!tb)return;
  tb.innerHTML=EARN_GUIDE.map(([act,pts,note])=>`
    <tr>
      <td style="font-weight:700${act.includes('MANDATORY')?';color:var(--rd)':''}">${act}</td>
      <td style="font-weight:900;color:var(--g)">${pts}</td>
      <td style="color:var(--muted)">${note}</td>
    </tr>`).join('');
}

