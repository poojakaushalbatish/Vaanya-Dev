// ════════════════════════════════════════════
// GRAPHS / PROGRESS TAB — fix #1 + #2
// ════════════════════════════════════════════
// ════════════════════════════════════════════
// VICTORY CUPS — thresholds out of 515 pts
// ════════════════════════════════════════════
const CUPS = [
  {
    id:'bronze', name:'Bronze', icon:'🥉', threshold:200,
    bg:'linear-gradient(135deg,#92400E,#B45309,#D97706)',
    border:'#D97706', glow:'rgba(217,119,6,.6)',
    desc:'Good start! Earn 200+ pts in a day.',
    expert:'You showed up and did your part — that is the first step to greatness!'
  },
  {
    id:'silver', name:'Silver', icon:'🥈', threshold:320,
    bg:'linear-gradient(135deg,#374151,#6B7280,#9CA3AF)',
    border:'#9CA3AF', glow:'rgba(156,163,175,.7)',
    desc:'Solid effort! Earn 320+ pts in a day.',
    expert:'You completed most tasks with focus. Now push past your comfort zone!'
  },
  {
    id:'gold', name:'Gold', icon:'🥇', threshold:420,
    bg:'linear-gradient(135deg,#78350F,#B45309,#F59E0B)',
    border:'#F59E0B', glow:'rgba(245,158,11,.8)',
    desc:'Excellent! Earn 420+ pts in a day.',
    expert:'Outstanding discipline today! This is what champions are made of!'
  },
  {
    id:'diamond', name:'Diamond', icon:'💎', threshold:490,
    bg:'linear-gradient(135deg,#1E3A8A,#2563EB,#06B6D4)',
    border:'#06B6D4', glow:'rgba(6,182,212,.9)',
    desc:'Elite! Earn 490+ pts — near perfect day!',
    expert:'PHENOMENAL! You have achieved near-perfection. Vaanya, you are extraordinary!'
  },
];

function getDayCup(pts){
  let cup = null;
  for(const cu of CUPS){ if(pts >= cu.threshold) cup = cu; }
  return cup;
}

function renderGraphs(){
  const days=[...savedDays]
    .filter(d=>d.approved===true)
    .sort((a,b)=>new Date(a.date)-new Date(b.date))
    .slice(-30);

  const pc=document.getElementById('perf-card');
  if(days.length<1){
    if(pc)pc.innerHTML=`<div style="text-align:center;padding:30px;color:var(--muted)">
      <div style="font-size:48px;margin-bottom:10px">🏆</div>
      <div style="font-size:16px;font-weight:800">No approved days yet!</div>
      <div style="font-size:12px;margin-top:6px">Get your first report approved by Parents Review to see your progress!</div>
    </div>`;
    document.getElementById('cups-grid').innerHTML='<div style="grid-column:1/-1;text-align:center;color:var(--muted);font-size:12px;padding:20px">Earn your first approved report to unlock Victory Cups! 🏆</div>';
    return;
  }

  renderPerfCard(days);
  renderCups(days);
  renderCumulativeChart(days);
  renderStatStrip(days);
  renderParentComments(days);
}

// Canonical "today's points" — the SAME number shown in the header's
// TODAY'S PTS chip, so the Progress cups and the overlay can never disagree
// with the top bar. Prefers today's saved/approved record, then the live form.
function todaysPoints(){
  const t = new Date(Date.now()+5.5*60*60*1000).toISOString().split('T')[0];
  const rec = savedDays.find(d => d.date === t);
  if(rec) return parseInt(rec.pts)||0;
  const live = document.getElementById('day-pts-live');
  return live ? (parseInt(live.textContent)||0) : 0;
}

function renderCups(days){
  const grid=document.getElementById('cups-grid');if(!grid)return;
  const todayPts=todaysPoints();
  const todayCup=getDayCup(todayPts);
  const nextCup=CUPS.find(cu=>cu.threshold>todayPts);

  // Show/hide no-cup banner
  const noBanner=document.getElementById('no-cup-banner');
  if(noBanner){
    if(!todayCup){
      noBanner.style.display='flex';
      const ptsNeeded=200-todayPts;
      const el1=document.getElementById('no-cup-pts-needed');if(el1)el1.textContent=ptsNeeded;
      const el2=document.getElementById('no-cup-pts-today');if(el2)el2.textContent=todayPts;
    } else {
      noBanner.style.display='none';
    }
  }

  grid.innerHTML=CUPS.map(cu=>{
    const achieved=todayPts>=cu.threshold;
    const isNext=nextCup&&nextCup.id===cu.id;
    const pct=Math.min(100,Math.round(todayPts/cu.threshold*100));
    const ptsNeed=Math.max(0,cu.threshold-todayPts);
    return `<div class="cup-card ${achieved?'achieved':''} ${isNext&&!achieved?'next-target':''}"
      style="background:${cu.bg};border-color:${achieved?cu.border:'rgba(209,213,219,.4)'};
      ${achieved?'box-shadow:0 8px 32px '+cu.glow:''};cursor:pointer"
      onclick="cupSoundAndOverlay('${cu.id}')">
      <span class="cup-icon">${cu.icon}</span>
      <div class="cup-name" style="color:#fff">${cu.name}</div>
      <div class="cup-pts" style="color:rgba(255,255,255,.85)">${cu.threshold}+ pts</div>
      <div class="cup-desc" style="color:rgba(255,255,255,.75)">${achieved?cu.expert:isNext?'Need '+ptsNeed+' more pts!':cu.desc}</div>
      ${achieved?'<div class="cup-achieved-tag" style="color:#fff">✅ ACHIEVED TODAY!</div>':''}
      ${!achieved?`<div style="background:rgba(0,0,0,.25);border-radius:5px;height:5px;overflow:hidden;margin-top:7px">
        <div style="width:${pct}%;height:100%;background:rgba(255,255,255,.55);border-radius:5px;transition:width .8s"></div>
      </div>
      <div style="font-size:9px;color:rgba(255,255,255,.65);margin-top:3px;font-weight:700">${pct}% there</div>`:''}
    </div>`;
  }).join('');

  // Auto-trigger: play sound + overlay after render
  setTimeout(()=>{
    if(todayCup){
      cupSoundAndOverlay(todayCup.id);
    } else {
      cupSoundAndOverlay('none');
    }
  }, 600);
}

// ════════════════════════════════════════════
// AUDIO ENGINE
// ════════════════════════════════════════════
let _audioCtx = null;
function getAudioCtx(){
  if(!_audioCtx) _audioCtx = new(window.AudioContext||window.webkitAudioContext)();
  if(_audioCtx.state==='suspended') _audioCtx.resume();
  return _audioCtx;
}
function _osc(ac,type,freq,startT,dur,vol,endVol=0.001){
  const o=ac.createOscillator(), g=ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type=type; o.frequency.setValueAtTime(freq,startT);
  g.gain.setValueAtTime(vol,startT);
  g.gain.exponentialRampToValueAtTime(endVol,startT+dur);
  o.start(startT); o.stop(startT+dur+0.05);
}
function _glide(ac,type,f1,f2,startT,dur,vol){
  const o=ac.createOscillator(), g=ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type=type;
  o.frequency.setValueAtTime(f1,startT);
  o.frequency.exponentialRampToValueAtTime(f2,startT+dur);
  g.gain.setValueAtTime(vol,startT);
  g.gain.exponentialRampToValueAtTime(0.001,startT+dur);
  o.start(startT); o.stop(startT+dur+0.05);
}
function _noise(ac,startT,dur,vol){
  const buf=ac.createBuffer(1,Math.ceil(ac.sampleRate*dur),ac.sampleRate);
  const d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
  const src=ac.createBufferSource(); src.buffer=buf;
  const g=ac.createGain(), bpf=ac.createBiquadFilter();
  bpf.type='bandpass'; bpf.frequency.value=180; bpf.Q.value=0.5;
  src.connect(bpf); bpf.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(vol,startT);
  g.gain.exponentialRampToValueAtTime(0.001,startT+dur);
  src.start(startT); src.stop(startT+dur+0.05);
}

const CUP_SOUNDS = {
  bronze(ac,t){
    for(let i=0;i<8;i++) _noise(ac,t+i*0.04,0.05,0.3-i*0.01);
    [330,392,440,523,587,659].forEach((f,i)=>_osc(ac,'square',f,t+0.32+i*0.09,0.12,0.22));
    _osc(ac,'triangle',784,t+0.32+6*0.09,0.4,0.3);
  },
  silver(ac,t){
    [523,659,784,1047].forEach(f=>_osc(ac,'square',f,t,0.15,0.18));
    [784,880,988,1175,1319,1568].forEach((f,i)=>_osc(ac,'triangle',f,t+0.18+i*0.07,0.1,0.25));
    [2093,2349,2637,3136].forEach((f,i)=>_osc(ac,'sine',f,t+0.6+i*0.06,0.08,0.12));
  },
  gold(ac,t){
    [523,523,523,415,523,0,659,523].forEach((f,i)=>{
      if(f===0)return; _osc(ac,'square',f,t+i*0.12,0.1,0.28);
    });
    [523,587,659,698,784,880,988,1047].forEach((f,i)=>_osc(ac,'square',f,t+1.0+i*0.08,0.1,0.3));
    [523,659,784,1047].forEach(f=>_osc(ac,'triangle',f,t+1.7,0.6,0.25,0.001));
  },
  diamond(ac,t){
    for(let i=0;i<4;i++) _noise(ac,t+i*0.15,0.1,0.5);
    [392,523,659,784].forEach((f,i)=>_osc(ac,'sawtooth',f,t+0.6+i*0.18,0.2,0.35));
    [523,659,784,1047,1319].forEach(f=>_osc(ac,'square',f,t+1.35,0.4,0.28,0.001));
    [1047,1175,1319,1480,1568,1760,2093,2349,2637,3136].forEach((f,i)=>
      _osc(ac,'sine',f,t+1.8+i*0.06,0.1,0.2));
    [1047,1319,1568].forEach(f=>_osc(ac,'triangle',f,t+2.4,0.8,0.25,0.001));
  },
  none(ac,t){
    _glide(ac,'sawtooth',440,220,t,0.25,0.35);
    _glide(ac,'sawtooth',330,165,t+0.28,0.25,0.3);
    _glide(ac,'sawtooth',262,110,t+0.56,0.3,0.3);
    _glide(ac,'sine',800,200,t+0.9,0.3,0.25);
    _osc(ac,'sine',523,t+1.3,0.08,0.2);
    _osc(ac,'sine',587,t+1.4,0.08,0.2);
    _osc(ac,'sine',494,t+1.5,0.2,0.2);
  }
};

function playByCupId(id){
  try{
    const ac=getAudioCtx();
    const fn=CUP_SOUNDS[id]||CUP_SOUNDS.none;
    fn(ac,ac.currentTime);
  }catch(e){console.warn('Audio error:',e);}
}

function cupSoundAndOverlay(idOrCup){
  const id = typeof idOrCup==='string' ? idOrCup : (idOrCup?.id||'none');
  playByCupId(id);
  setTimeout(()=>showCupOverlay(id), 300);
}

function showCupOverlay(id){
  const pts = todaysPoints();
  const cup = CUPS.find(c=>c.id===id);
  const overlay=document.getElementById('rank-overlay');
  const box=document.getElementById('rank-overlay-box');
  if(!overlay||!box)return;

  if(id==='none'||!cup){
    box.innerHTML=`
      <div style="font-size:100px;line-height:1;margin-bottom:12px">😤</div>
      <div style="font-size:32px;font-weight:900;color:#F472B6;letter-spacing:.06em;margin-bottom:10px">NOT YET!</div>
      <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:8px">${pts} pts today</div>
      <div style="font-size:14px;color:rgba(255,255,255,.85);max-width:300px;line-height:1.6;margin-bottom:20px">
        Need ${200-pts} more pts for Bronze! Come on Vaanya — every single task counts. Tomorrow is your chance to shine!
      </div>
      <div style="font-size:13px;color:rgba(255,255,255,.5)">Tap anywhere to continue</div>`;
  } else {
    box.innerHTML=`
      <div style="font-size:120px;line-height:1;margin-bottom:14px;animation:cupShake .6s ease .3s">${cup.icon}</div>
      <div style="font-size:38px;font-weight:900;color:#FCD34D;letter-spacing:.08em;margin-bottom:8px">${cup.name.toUpperCase()} CUP!</div>
      <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:8px">${pts} pts earned!</div>
      <div style="font-size:14px;color:rgba(255,255,255,.85);max-width:320px;line-height:1.6;margin-bottom:20px">${cup.expert}</div>
      <div style="font-size:13px;color:rgba(255,255,255,.5)">Tap anywhere to continue</div>`;
  }

  let count=0;
  const blink=()=>{
    overlay.classList.add('show');
    setTimeout(()=>{
      count++;
      if(count<3){overlay.classList.remove('show');setTimeout(blink,220);}
    }, count<2?500:1400);
  };
  blink();
}
function closeRankOverlay(){
  document.getElementById('rank-overlay').classList.remove('show');
}
// legacy alias
function showRankOverlay(){ cupSoundAndOverlay('none'); }

function renderCumulativeChart(days){
  const labels=days.map(d=>new Date(d.date+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}));
  const pts=days.map(d=>d.pts||0);
  const avg=pts.length?Math.round(pts.reduce((a,b)=>a+b,0)/pts.length):0;

  const avgBadge=document.getElementById('prog-avg-badge');
  if(avgBadge)avgBadge.textContent='Avg: '+avg+' pts/day';

  // Colour each bar based on cup level
  const barColors=pts.map(p=>{
    if(p>=490)return'#06B6D4'; // diamond
    if(p>=420)return'#F59E0B'; // gold
    if(p>=320)return'#9CA3AF'; // silver
    if(p>=200)return'#D97706'; // bronze
    return'#EF4444';
  });

  const el=document.getElementById('ch-cumulative');if(!el)return;
  el.style.width='100%';el.style.display='block';
  // Force the canvas to have explicit pixel dimensions so Chart.js can render
  // even if the parent was recently display:none
  const parentW = el.parentElement ? el.parentElement.offsetWidth : 600;
  if(parentW > 0){ el.width = parentW; el.height = 200; }
  else { el.width = 600; el.height = 200; }
  if(charts['cumulative'])charts['cumulative'].destroy();

  // Add cup threshold lines
  const plugins=[{
    id:'cupLines',
    afterDraw(chart){
      const{ctx,chartArea,scales}=chart;
      const thresholds=[
        {val:200,col:'#D97706',label:'Bronze'},
        {val:320,col:'#9CA3AF',label:'Silver'},
        {val:420,col:'#F59E0B',label:'Gold'},
        {val:490,col:'#06B6D4',label:'Diamond'},
      ];
      thresholds.forEach(t=>{
        if(t.val>scales.y.max)return;
        const y=scales.y.getPixelForValue(t.val);
        ctx.save();
        ctx.strokeStyle=t.col;
        ctx.lineWidth=1.5;
        ctx.setLineDash([6,4]);
        ctx.beginPath();ctx.moveTo(chartArea.left,y);ctx.lineTo(chartArea.right,y);ctx.stroke();
        ctx.fillStyle=t.col;ctx.font='bold 9px Nunito,sans-serif';ctx.textAlign='right';
        ctx.fillText(t.label,chartArea.right-4,y-4);
        ctx.restore();
      });
    }
  }];

  charts['cumulative']=new Chart(el,{
    type:'bar',
    data:{labels,datasets:[{
      label:'Points',data:pts,
      backgroundColor:barColors,
      borderColor:barColors.map(c=>c+'CC'),
      borderWidth:2,borderRadius:10,borderSkipped:false
    },{
      type:'line',label:'Trend',data:pts,
      borderColor:'#10B981',borderWidth:2.5,
      backgroundColor:'rgba(16,185,129,.08)',
      fill:true,tension:.4,
      pointBackgroundColor:'#10B981',pointRadius:4,pointHoverRadius:7,
      pointBorderColor:'#fff',pointBorderWidth:2
    }]},
    options:{
      responsive:true,
      animation:{duration:1000,easing:'easeOutQuart'},
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:'rgba(6,95,70,.92)',
          titleFont:{size:12,weight:'bold'},
          bodyFont:{size:13,weight:'bold'},
          padding:12,cornerRadius:12,
          callbacks:{
            label:ctx=>' '+ctx.parsed.y+' pts'+
              (ctx.parsed.y>=490?' 💎'
              :ctx.parsed.y>=420?' 🥇'
              :ctx.parsed.y>=320?' 🥈'
              :ctx.parsed.y>=200?' 🥉':'')
          }
        }
      },
      scales:{
        y:{beginAtZero:true,max:520,
          grid:{color:'rgba(16,185,129,.08)'},
          ticks:{font:{size:10},color:'#065F46',
            callback:v=>v===0?'0':v+'pts'}},
        x:{grid:{display:false},
          ticks:{font:{size:10},color:'#065F46',maxRotation:0}}
      }
    },
    plugins
  });
}

function renderStatStrip(days){
  const strip=document.getElementById('prog-strip');if(!strip)return;
  const streak=getStreak();
  const bestDay=days.reduce((best,d)=>(d.pts||0)>(best.pts||0)?d:best,days[0]);
  const stats=[
    {icon:'🔥',label:'Current Streak',val:streak+' days',col:'#EA580C',bg:'#FFF7ED',border:'#FDBA74'},
    {icon:'🏆',label:'Best Day Ever',val:(bestDay?.pts||0)+' pts',col:'#F59E0B',bg:'#FFFBEB',border:'#FCD34D'},
  ];
  strip.innerHTML=stats.map(s=>`
    <div style="background:${s.bg};border:2px solid ${s.border};border-radius:16px;padding:16px;text-align:center">
      <div style="font-size:28px;margin-bottom:4px">${s.icon}</div>
      <div style="font-size:24px;font-weight:900;color:${s.col};line-height:1">${s.val}</div>
      <div style="font-size:10px;font-weight:800;color:${s.col};text-transform:uppercase;letter-spacing:.06em;margin-top:5px">${s.label}</div>
    </div>`).join('');
}

function renderPerfCard(days){
  const el=document.getElementById('perf-card');if(!el)return;
  const recent=days.slice(-7);
  const avgPts=recent.length?Math.round(recent.reduce((a,d)=>a+d.pts,0)/recent.length):0;
  const mandPct=recent.length?Math.round(recent.reduce((a,d)=>a+(d.shlokaD&&d.creativeD&&d.brainD?1:0),0)/recent.length*100):0;
  const streak=getStreak();
  const cup=getDayCup(avgPts);

  let rank,emoji,msg,col;
  if(avgPts>=420){rank='S';emoji='👑';msg='LEGENDARY! Vaanya is absolutely unstoppable!';col='#047857';}
  else if(avgPts>=300){rank='A';emoji='🌟';msg='Outstanding performance! You are a true star!';col='#1D4ED8';}
  else if(avgPts>=180){rank='B';emoji='💪';msg='Great effort! One more push and you hit S-rank!';col='#D97706';}
  else if(avgPts>=100){rank='C';emoji='🙂';msg='You are building momentum — keep going!';col='#EA580C';}
  else{rank='D';emoji='😤';msg='Come on Vaanya — your best days are ahead of you!';col='#B91C1C';}

  el.innerHTML=`
  <div style="background:linear-gradient(135deg,#065F46,#0F766E,#1D4ED8);border-radius:18px;padding:18px 20px;color:#fff;cursor:pointer" onclick="cupSoundAndOverlay(getDayCup(([...savedDays].filter(d=>d.approved).sort((a,b)=>new Date(b.date)-new Date(a.date))[0]?.pts||0))?.id||'none')">
    <div style="font-size:10px;font-weight:800;color:#A7F3D0;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">⭐ Last 7 days · Tap to replay cup reveal</div>
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div style="font-size:64px;line-height:1;filter:drop-shadow(0 0 16px rgba(252,211,77,.8))">${cup?cup.icon:'📊'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:17px;font-weight:900;margin-bottom:8px">${msg}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="background:rgba(255,255,255,.18);border-radius:10px;padding:4px 12px;font-size:12px;font-weight:800">⭐ Avg: ${avgPts} pts</span>
          <span style="background:rgba(255,255,255,.18);border-radius:10px;padding:4px 12px;font-size:12px;font-weight:800">✅ Tasks: ${mandPct}%</span>
          <span style="background:rgba(255,255,255,.18);border-radius:10px;padding:4px 12px;font-size:12px;font-weight:800">🔥 Streak: ${streak}</span>
        </div>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <div style="font-size:52px;font-weight:900;line-height:1;color:#FCD34D;text-shadow:0 0 20px rgba(252,211,77,.6)">${rank}</div>
        <div style="font-size:10px;color:#A7F3D0;font-weight:800;text-transform:uppercase;letter-spacing:.06em">RANK</div>
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════════
// CLEAR
// ════════════════════════════════════════════
function clearDay(){
  if(!confirm('Clear all entries for today? Saved history is kept.'))return;
  document.querySelectorAll('input[type=text],input[type=number],textarea').forEach(e=>e.value='');
  document.querySelectorAll('input[type=checkbox]').forEach(e=>e.checked=false);
  document.querySelectorAll('select').forEach(e=>e.selectedIndex=0);
  PCLS.forEach(c=>document.querySelectorAll('.'+c).forEach(e=>e.classList.remove(c)));
  document.querySelectorAll('.star').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.creative-option').forEach(o=>o.classList.remove('chosen'));
  document.getElementById('creative-detail').style.display='none';
  const oaDet=document.getElementById('odda-assign-detail');if(oaDet)oaDet.style.display='none';
  const oaRes=document.getElementById('odda-assign-result');if(oaRes)oaRes.innerHTML='';
  document.querySelectorAll('#odda-time .pill, #gym-time .pill').forEach(p=>{p.classList.remove('pg','pr','pa','pb','pt');});
  const tcBox=document.getElementById('test-chapters-box');if(tcBox)tcBox.style.display='none';
  const wBox=document.getElementById('word-boxes');if(wBox)wBox.style.display='none';
  ['word1','mean1','exam1','word2','mean2','exam2','word3','mean3','exam3'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  const wpMsg=document.getElementById('word-pts-msg');if(wpMsg)wpMsg.textContent='';
  const btEl=document.getElementById('book-type');if(btEl)btEl.value='0';
  const prPend=document.getElementById('parent-pending-section');if(prPend)prPend.style.display='none'; /* always hidden */
  const prAct=document.getElementById('parent-action-section');if(prAct)prAct.style.display='block';
  const prApp=document.getElementById('approved-section');if(prApp)prApp.style.display='none';
  const freeMsg=document.getElementById('free-act-msg');if(freeMsg)freeMsg.innerHTML='';
  const prRatRes=document.getElementById('parent-rating-result');if(prRatRes)prRatRes.innerHTML='';
  creativeChosen=null;brainPtsToday=0;sudokuPts=0;logicPtsTotal=0;riddlePtsTotal=0;mathsPtsToday=0;worksheetPts=0;geetaProgress={};todayApproved=false;
  sudokuFrozen=false;logicFrozen=false;logicCurrentPuzzles=[];mathsFrozen=false;mathsChecked=false;mathsSelected=[];
  genSudoku('easy');genLogicPuzzles();initMathsSprint();
  const sAwd=document.getElementById('shloka-pts-award');if(sAwd)sAwd.value='0';
  const cAwd=document.getElementById('creative-pts-award');if(cAwd)cAwd.value='0';
  const sRes2=document.getElementById('shloka-pts-result');if(sRes2)sRes2.textContent='';
  const cRes2=document.getElementById('creative-pts-result');if(cRes2)cRes2.textContent='';
  const gMsg=document.getElementById('geeta-save-msg');if(gMsg)gMsg.textContent='';
  const crMsg=document.getElementById('creative-save-msg');if(crMsg)crMsg.textContent='';
  buildSS();
  updateSS();
  calcDayPts();setTodayDate();
}

// ════════════════════════════════════════════
// POPUP / TOAST
// ════════════════════════════════════════════
function showPop(icon,title,msg){
  document.getElementById('pop-icon').textContent=icon;
  document.getElementById('pop-title').textContent=title;
  document.getElementById('pop-msg').textContent=msg;
  document.getElementById('pop').classList.add('show');
}
function closePop(){document.getElementById('pop').classList.remove('show');}
function toast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3200);
}

// ════════════════════════════════════════════
// SUDOKU ENGINE
// ════════════════════════════════════════════
function genSudoku(diff){
  if(sudokuFrozen){ toast('🔒 Sudoku is locked for today! Ask Mamma or Papa to unlock one more attempt.'); return; }
  sudokuDifficulty=diff;
  document.getElementById('sudoku-msg').textContent='';
  const base=generateSudokuPuzzle(diff);
  sudokuGrid=base.puzzle;sudokuSolution=base.solution;selectedCell=null;
  renderSudokuGrid();renderNumpad();
}
function generateSudokuPuzzle(diff){
  const solution=solveSudoku(createBase());
  const puzzle=solution.map(r=>[...r]);
  const removes={easy:35,medium:45,hard:52}[diff]||35;
  let removed=0;
  const cells=[];for(let r=0;r<9;r++)for(let c=0;c<9;c++)cells.push([r,c]);
  cells.sort(()=>Math.random()-.5);
  for(const[r,c]of cells){
    if(removed>=removes)break;
    const bk=puzzle[r][c];puzzle[r][c]=0;removed++;
    if(!hasUniqueSolution(puzzle)){puzzle[r][c]=bk;removed--;}
  }
  return{puzzle,solution};
}
function createBase(){
  const g=Array.from({length:9},()=>Array(9).fill(0));
  for(let b=0;b<9;b+=3){const n=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-.5);for(let r=0;r<3;r++)for(let c=0;c<3;c++)g[b+r][b+c]=n[r*3+c];}
  return g;
}
function solveSudoku(grid){
  const g=grid.map(r=>[...r]);
  const valid=(g,r,c,n)=>{
    for(let i=0;i<9;i++){if(g[r][i]===n||g[i][c]===n)return false;}
    const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(g[br+i][bc+j]===n)return false;
    return true;
  };
  const solve=g=>{
    for(let r=0;r<9;r++)for(let c=0;c<9;c++){
      if(g[r][c]===0){
        const nums=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-.5);
        for(const n of nums){if(valid(g,r,c,n)){g[r][c]=n;if(solve(g))return true;g[r][c]=0;}}
        return false;
      }
    }return true;
  };
  solve(g);return g;
}
function hasUniqueSolution(puzzle){
  let count=0;
  const isV=(g,r,c,n)=>{
    for(let i=0;i<9;i++){if(g[r][i]===n||g[i][c]===n)return false;}
    const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(g[br+i][bc+j]===n)return false;
    return true;
  };
  const cnt=g=>{
    if(count>1)return;
    for(let r=0;r<9;r++)for(let c=0;c<9;c++){
      if(g[r][c]===0){for(let n=1;n<=9;n++){if(isV(g,r,c,n)){g[r][c]=n;cnt(g);g[r][c]=0;}}return;}
    }count++;
  };
  cnt(puzzle.map(r=>[...r]));return count===1;
}
function renderSudokuGrid(){
  const container=document.getElementById('sudoku-grid');container.innerHTML='';
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const cell=document.createElement('div');
    const given=sudokuGrid[r][c]!==0;
    let cls='sc-cell'+(given?' given':'');
    if(c===2||c===5)cls+=' bb';if(r===2||r===5)cls+=' bt';
    cell.className=cls;cell.textContent=sudokuGrid[r][c]||'';
    cell.dataset.r=r;cell.dataset.c=c;
    if(!given)cell.onclick=()=>selectSudokuCell(r,c);
    container.appendChild(cell);
  }
}
function renderNumpad(){
  const np=document.getElementById('numpad');np.innerHTML='';
  for(let n=1;n<=9;n++){
    const btn=document.createElement('button');btn.className='npbtn';
    btn.textContent=n;btn.onclick=()=>enterSudokuNum(n);np.appendChild(btn);
  }
  const er=document.createElement('button');er.className='npbtn erase';er.textContent='✕';er.onclick=()=>enterSudokuNum(0);np.appendChild(er);
}
function selectSudokuCell(r,c){
  selectedCell={r,c};
  document.querySelectorAll('.sc-cell').forEach(el=>el.classList.remove('selected'));
  const cells=document.querySelectorAll('.sc-cell');
  if(cells[r*9+c])cells[r*9+c].classList.add('selected');
}
function enterSudokuNum(n){
  if(!selectedCell)return;
  const{r,c}=selectedCell;
  const cells=document.querySelectorAll('.sc-cell');
  if(cells[r*9+c]?.classList.contains('given'))return;
  sudokuGrid[r][c]=n;
  const cell=cells[r*9+c];
  cell.textContent=n||'';
  // No live highlighting — only show neutral entered style
  cell.classList.remove('correct','wrong');
  if(n>0) cell.classList.add('entered');
  else cell.classList.remove('entered');
}
function checkSudoku(){
  if(sudokuFrozen){ toast('🔒 Sudoku is locked for today!'); return; }
  let allCorrect=true,allFilled=true;
  const cells=document.querySelectorAll('.sc-cell');
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const cell=cells[r*9+c];
    if(sudokuGrid[r][c]===0){allFilled=false;allCorrect=false;}
    else if(sudokuGrid[r][c]!==sudokuSolution[r][c]){allCorrect=false;cell.classList.remove('entered');cell.classList.add('wrong');}
    else {cell.classList.remove('entered');cell.classList.add('correct');}
  }
  const msg=document.getElementById('sudoku-msg');
  if(allCorrect&&allFilled){
    const bonus={easy:0,medium:5,hard:10}[sudokuDifficulty]||0;
    sudokuPts=Math.max(sudokuPts,30+bonus);
    brainPtsToday=sudokuPts+logicPtsTotal+riddlePtsTotal+mathsPtsToday+worksheetPts;
  if(typeof ttSyncBrainLabPts==='function') ttSyncBrainLabPts();
    msg.innerHTML=`<span style="color:#10B981;font-size:16px">🎉 PERFECT! +${30+bonus} pts!</span>`;
    toast('Sudoku solved! +'+(30+bonus)+' brain pts!');
    updateBrainDisplay();if(typeof ttSyncBrainLabPts==='function') ttSyncBrainLabPts();calcDayPts();
  } else if(!allFilled){
    msg.innerHTML='<span style="color:#F97316">Some cells are empty — sudoku checked & locked now! 🔒</span>';
  } else {
    msg.innerHTML='<span style="color:#EF4444">Some cells have errors — sudoku checked & locked now! 🔒</span>';
  }
  // Always freeze after Check, regardless of result
  freezeSudoku();
  // Persist freeze state immediately
  saveBrainDraft();
}
function revealSudokuHint(){
  sudokuPts=Math.max(0,sudokuPts-5);
  brainPtsToday=sudokuPts+logicPtsTotal+riddlePtsTotal+mathsPtsToday+worksheetPts;
  if(typeof ttSyncBrainLabPts==='function') ttSyncBrainLabPts();
  updateBrainDisplay();if(typeof ttSyncBrainLabPts==='function') ttSyncBrainLabPts();calcDayPts();
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    if(sudokuGrid[r][c]===0){
      sudokuGrid[r][c]=sudokuSolution[r][c];
      const cells=document.querySelectorAll('.sc-cell');
      cells[r*9+c].textContent=sudokuSolution[r][c];
      cells[r*9+c].classList.remove('entered');
      cells[r*9+c].classList.add('correct');
      toast('Hint revealed! −5 pts');return;
    }
  }
}

// ════════════════════════════════════════════
// LOGIC PUZZLES

// ════════════════════════════════════════════
// RIDDLES
// ════════════════════════════════════════════
function genRiddles(){
  riddleAnswered=[];riddlePts=0;
  const shuffled=[...RIDDLES].sort(()=>Math.random()-.5).slice(0,3);
  const c=document.getElementById('riddle-section');if(!c)return;c.innerHTML='';
  shuffled.forEach((r,i)=>{
    const div=document.createElement('div');
    div.style.cssText='background:var(--pkl);border-radius:var(--rads);border:2px solid var(--pkm);padding:14px;margin-bottom:10px';
    div.innerHTML=`<div style="font-size:14px;font-weight:800;color:var(--pkd);margin-bottom:10px">Riddle ${i+1}: ${r.q}</div>
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
        <input type="text" id="rid-ans-${i}" placeholder="Your answer..." style="flex:1;border-color:var(--pkm)">
        <button class="btn btn-p" style="font-size:12px;padding:7px 14px;background:linear-gradient(135deg,var(--pk),var(--pkd));border:none" onclick="checkRiddle(${i},'${r.a.replace(/'/g,"\\'")}','${r.hint.replace(/'/g,"\\'")}')">Check!</button>
      </div>
      <div id="rid-hint-${i}" style="font-size:11px;color:var(--pkd);cursor:pointer;text-decoration:underline" onclick="document.getElementById('rid-hint-${i}').textContent='Hint: ${r.hint}'">Show hint</div>
      <div id="rid-result-${i}" style="margin-top:6px"></div>`;
    c.appendChild(div);
  });
}
function checkRiddle(i,correct,hint){
  if(riddleAnswered.includes(i))return;
  const ans=(document.getElementById('rid-ans-'+i)?.value||'').trim().toLowerCase();
  const isRight=ans===correct.toLowerCase()||correct.toLowerCase().includes(ans)&&ans.length>2;
  riddleAnswered.push(i);
  if(isRight){
    riddlePts+=10;riddlePtsTotal+=10;brainPtsToday=sudokuPts+logicPtsTotal+riddlePtsTotal+mathsPtsToday+worksheetPts;
  if(typeof ttSyncBrainLabPts==='function') ttSyncBrainLabPts();
    document.getElementById('rid-result-'+i).innerHTML='<span style="color:#10B981;font-weight:800">🎉 Correct! +10 pts! Answer: '+correct+'</span>';
    toast('Riddle solved! +10 brain pts!');
    updateBrainDisplay();if(typeof ttSyncBrainLabPts==='function') ttSyncBrainLabPts();calcDayPts();
  }else{
    document.getElementById('rid-result-'+i).innerHTML='<span style="color:#EF4444;font-weight:800">❌ Not quite! Answer: '+correct+'</span>';
  }
}

// ════════════════════════════════════════════
// ════════════════════════════════════════════
// SKILL BUILDER — simple self-assessment
// ════════════════════════════════════════════
function handleSkillSelect(){
  const val = document.getElementById('skill-did')?.value;
  document.getElementById('skill-yes-box').style.display = val==='yes' ? 'block' : 'none';
  document.getElementById('skill-no-msg').style.display  = val==='no'  ? 'block' : 'none';
  document.getElementById('skill-pts-final').style.display = 'none';
  // Reset pts select when toggling
  const sel = document.getElementById('skill-pts-select');
  if(sel) sel.value = '';
  aiSkillPts = 0;
  calcDayPts();
}

function handleSkillPtsSelect(){
  const val = parseInt(document.getElementById('skill-pts-select')?.value || 0);
  aiSkillPts = val || 0;
  const ptsEl = document.getElementById('skill-pts-final');
  if(ptsEl){
    if(val){
      ptsEl.style.display = 'block';
      const col = val===10 ? 'var(--gd)' : 'var(--bd)';
      const icon = val===10 ? '🌟' : '👍';
      ptsEl.innerHTML = `<span style="font-size:12px;font-weight:800;color:${col}">${icon} +${val} skill pts added!</span>`;
    } else {
      ptsEl.style.display = 'none';
    }
  }
  calcDayPts();
}

// ════════════════════════════════════════════
// BACKUP EXPORT
// ════════════════════════════════════════════
function exportBackup() {
  const backup = {
    exportDate: new Date().toISOString(),
    savedDays, spendHist, totalSpent
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vaanya-backup-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  toast('✅ Backup downloaded to your PC!');
}

// ════════════════════════════════════════════
// BRAIN LAB DISPLAY
// ════════════════════════════════════════════
// ════════════════════════════════════════════
// MENTAL MATHS SPRINT — Class 6 CBSE Olympiad
// ════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// MATHS SPRINT — v4
// • Start button triggers sprint — timer does NOT start on tab open
// • Submit anytime OR auto-submits when timer hits 0
// • On refresh mid-sprint: same questions restored, timer resets to 3min
// • On refresh after submit: frozen state shown with correct/wrong highlights
// ════════════════════════════════════════════════════════════════

let mathsPtsToday  = 0;
let mathsFrozen    = false;   // true once sprint is submitted for today
let mathsChecked   = false;   // true once answers are checked
let mathsSelected  = [];      // chosen option index per question (null = unanswered)
let mathsQuestions = [];      // 5 selected questions for this sprint
let mathsTimerVal  = 180;     // countdown seconds
let mathsTimerInt  = null;    // setInterval handle
let mathsStarted   = false;   // true once Start Sprint clicked

// Session key for maths sprint state
const MATHS_SESSION_KEY = 'vaanya_maths_sprint';


// ── Save sprint state to sessionStorage ──────────────────────────
function _mathsSaveSession(){
  try {
    const istDate = new Date(Date.now()+5.5*60*60000).toISOString().split('T')[0];
    sessionStorage.setItem(MATHS_SESSION_KEY, JSON.stringify({
      date: istDate,
      questions: mathsQuestions,
      selected:  mathsSelected,
      checked:   mathsChecked,
      frozen:    mathsFrozen,
      pts:       mathsPtsToday,
    }));
  } catch(e){}
}

// ── Load sprint state from sessionStorage ─────────────────────────
function _mathsLoadSession(){
  try {
    const raw = sessionStorage.getItem(MATHS_SESSION_KEY);
    if(!raw) return null;
    const s = JSON.parse(raw);
    const istDate = new Date(Date.now()+5.5*60*60000).toISOString().split('T')[0];
    if(s.date !== istDate) { sessionStorage.removeItem(MATHS_SESSION_KEY); return null; }
    return s;
  } catch(e){ return null; }
}

// ── Called when Maths Sprint tab is opened ───────────────────────
function initMathsSprint(){
  clearInterval(mathsTimerInt);

  // Check if frozen from savedDays (already submitted today)
  if(mathsFrozen && mathsChecked && mathsQuestions.length > 0){
    _mathsShowFrozenState();
    return;
  }

  // Check sessionStorage for in-progress or completed sprint
  const sess = _mathsLoadSession();
  if(sess){
    mathsQuestions = sess.questions || [];
    mathsSelected  = sess.selected  || Array(5).fill(null);
    mathsChecked   = sess.checked   || false;
    mathsFrozen    = sess.frozen    || false;
    mathsPtsToday  = sess.pts       || 0;
    brainPtsToday  = sudokuPts+logicPtsTotal+riddlePtsTotal+mathsPtsToday+worksheetPts;
    updateBrainDisplay();

    if(mathsFrozen && mathsChecked){
      // Sprint was completed — show frozen results
      _mathsShowFrozenState();
      return;
    } else {
      // Sprint was in progress — restore questions, reset timer to 3 min fresh
      _mathsShowSprintArea();
      renderMathsQuestions();
      buildMathsProgress();
      _restoreSelections();
      _mathsStartTimer(); // timer always resets to 3:00 on refresh (as per requirement)
      return;
    }
  }

  // No session — show start screen
  _mathsShowStartScreen();
}

function _mathsShowStartScreen(){
  document.getElementById('maths-start-screen').style.display = 'block';
  document.getElementById('maths-sprint-area').style.display  = 'none';
  document.getElementById('maths-score-display').style.display= 'none';
  document.getElementById('maths-timer-wrap').style.display   = 'none';
  document.getElementById('maths-score-chip').textContent     = '0';
  document.getElementById('maths-answered-chip').textContent  = '0/5';
}

function _mathsShowSprintArea(){
  document.getElementById('maths-start-screen').style.display = 'none';
  document.getElementById('maths-sprint-area').style.display  = 'block';
  document.getElementById('maths-score-display').style.display= 'none';
  document.getElementById('maths-timer-wrap').style.display   = 'flex';
}

function _mathsShowFrozenState(){
  document.getElementById('maths-start-screen').style.display = 'none';
  document.getElementById('maths-sprint-area').style.display  = 'block';
  document.getElementById('maths-score-display').style.display= 'block';
  document.getElementById('maths-timer-wrap').style.display   = 'none';
  document.getElementById('maths-check-btn').style.display    = 'none';
  document.getElementById('maths-score-chip').textContent     = mathsPtsToday;
  renderMathsQuestions(); // re-render in frozen state
  _mathsShowScoreCard();
}

// ── Start Sprint button clicked ──────────────────────────────────
function startMathsSprint(){
  // Pick 5 random questions
  const shuffled = [...MATHS_BANK].sort(()=>Math.random()-.5);
  mathsQuestions = shuffled.slice(0, 5);
  mathsSelected  = Array(5).fill(null);
  mathsChecked   = false;
  mathsFrozen    = false;
  mathsPtsToday  = 0;
  mathsStarted   = true;

  _mathsShowSprintArea();
  renderMathsQuestions();
  buildMathsProgress();
  _mathsStartTimer();
  _mathsSaveSession(); // save questions so refresh restores them
}

// ── Timer ────────────────────────────────────────────────────────
function _mathsStartTimer(){
  clearInterval(mathsTimerInt);
  mathsTimerVal = 180; // always reset to 3:00 (as per requirement)
  updateMathsTimer();
  mathsTimerInt = setInterval(()=>{
    mathsTimerVal--;
    updateMathsTimer();
    if(mathsTimerVal <= 0){
      clearInterval(mathsTimerInt);
      if(!mathsChecked) checkMathsSprint(true); // auto-submit
    }
  }, 1000);
}

function buildMathsProgress(){
  const el = document.getElementById('maths-prog-dots');
  if(!el) return;
  el.innerHTML = mathsQuestions.map((_,i)=>
    `<div id="mpd-${i}" style="height:6px;width:28px;border-radius:3px;background:rgba(255,255,255,.25);transition:background .3s"></div>`
  ).join('');
}

function updateMathsProgress(){
  mathsQuestions.forEach((_,i)=>{
    const d = document.getElementById('mpd-'+i); if(!d) return;
    d.style.background = mathsSelected[i] !== null ? '#fff' : 'rgba(255,255,255,.25)';
  });
}

function updateMathsTimer(){
  const m = Math.floor(mathsTimerVal/60), s = mathsTimerVal%60;
  const el = document.getElementById('maths-timer-txt');
  if(el) el.textContent = m+':'+(s<10?'0':'')+s;
  const arc = document.getElementById('maths-timer-arc');
  if(!arc) return;
  const pct = mathsTimerVal/180;
  arc.style.strokeDashoffset = 138.2*(1-pct);
  arc.style.stroke = pct>0.4?'#fff':pct>0.2?'#FCD34D':'#FCA5A5';
}

// ── Render questions ─────────────────────────────────────────────
function renderMathsQuestions(){
  const wrap = document.getElementById('maths-questions');
  if(!wrap) return;
  const diffStyle = {Easy:'background:#ECFDF5;color:#065F46',Medium:'background:#FFFBEB;color:#92400E',Hard:'background:#FEF2F2;color:#B91C1C'};
  wrap.innerHTML = mathsQuestions.map((q,i)=>`
    <div style="background:#fff;border-radius:var(--rads);border:2px solid #FED7AA;margin-bottom:10px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#FFF7ED,#FFEDD5);padding:9px 14px;display:flex;align-items:center;gap:8px;border-bottom:1.5px solid #FED7AA">
        <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#F97316,#C2410C);color:#fff;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div>
        <span style="font-size:11px;font-weight:800;color:#92400E">${q.topic}</span>
        <span style="font-size:9px;font-weight:900;padding:2px 7px;border-radius:8px;margin-left:auto;${diffStyle[q.diff]||''}">${q.diff}</span>
      </div>
      <div style="padding:13px 14px">
        <div style="font-size:13px;font-weight:800;color:var(--ink);line-height:1.6;margin-bottom:11px">${q.q}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          ${q.opts.map((o,oi)=>{
            let cls='opt-btn', bg='', bc='', co='';
            if(mathsChecked){
              if(oi===q.ans){ cls='opt-btn correct'; }
              else if(mathsSelected[i]===oi && oi!==q.ans){ cls='opt-btn wrong'; }
            } else if(mathsSelected[i]===oi){
              bg='var(--tl)'; bc='var(--t)'; co='var(--td)';
            }
            const dis = mathsChecked ? 'disabled style="cursor:default"' : `onclick="selectMathsOpt(${i},${oi})"`;
            return `<button id="mopt-${i}-${oi}" class="${cls}" ${dis} style="text-align:left;font-size:12px;padding:8px 11px;background:${bg};border-color:${bc};color:${co}">${String.fromCharCode(65+oi)}) ${o}</button>`;
          }).join('')}
        </div>
        <div id="mexpl-${i}" style="display:${mathsChecked?'block':'none'};margin-top:8px;font-size:11px;background:#ECFDF5;border-radius:6px;padding:8px 10px;color:#065F46;font-weight:700;line-height:1.5">💡 ${q.exp}</div>
      </div>
    </div>`).join('');
}

// ── Restore previously chosen selections after refresh ────────────
function _restoreSelections(){
  mathsSelected.forEach((sel, i) => {
    if(sel === null) return;
    const btn = document.getElementById(`mopt-${i}-${sel}`);
    if(btn){
      btn.style.background = 'var(--tl)';
      btn.style.borderColor = 'var(--t)';
      btn.style.color = 'var(--td)';
    }
  });
  const answered = mathsSelected.filter(x=>x!==null).length;
  document.getElementById('maths-answered-chip').textContent = answered+'/5';
  updateMathsProgress();
}

// ── Option selection ─────────────────────────────────────────────
function selectMathsOpt(qi, oi){
  if(mathsChecked || mathsFrozen) return;
  mathsSelected[qi] = oi;
  for(let j=0;j<4;j++){
    const b = document.getElementById(`mopt-${qi}-${j}`); if(!b) continue;
    b.className = 'opt-btn';
    b.style.background  = j===oi ? 'var(--tl)' : '';
    b.style.borderColor = j===oi ? 'var(--t)'  : '';
    b.style.color       = j===oi ? 'var(--td)' : '';
  }
  const answered = mathsSelected.filter(x=>x!==null).length;
  document.getElementById('maths-answered-chip').textContent = answered+'/5';
  updateMathsProgress();
  _mathsSaveSession(); // save selection immediately
}

// ── Check/Submit sprint (timerExpired=true means auto-submit) ─────
function checkMathsSprint(timerExpired = false){
  if(mathsChecked || mathsFrozen) return;
  mathsChecked = true;
  mathsFrozen  = true;
  clearInterval(mathsTimerInt);

  let correct = 0;
  mathsQuestions.forEach((q,i) => {
    if(mathsSelected[i] === q.ans) correct++;
    // Colour correct/wrong
    for(let j=0;j<4;j++){
      const b = document.getElementById(`mopt-${i}-${j}`); if(!b) continue;
      b.disabled = true; b.style.cursor = 'default';
      b.style.background=''; b.style.borderColor=''; b.style.color='';
      if(j===q.ans)         b.className = 'opt-btn correct';
      else if(j===mathsSelected[i] && j!==q.ans) b.className = 'opt-btn wrong';
      else                  b.className = 'opt-btn';
    }
    const expl = document.getElementById(`mexpl-${i}`);
    if(expl) expl.style.display = 'block';
  });

  // Score: 0=0, 1=3, 2=8, 3=14, 4=20, 5=25
  const scoreMap = [0,3,8,14,20,25];
  const pts = scoreMap[correct] || 0;
  mathsPtsToday  = pts;
  brainPtsToday  = sudokuPts+logicPtsTotal+riddlePtsTotal+mathsPtsToday+worksheetPts;
  updateBrainDisplay();
  calcDayPts();

  _mathsShowScoreCard();
  _mathsSaveSession();

  const suffix = timerExpired ? '⏰ Time up! ' : '';
  toast(`${suffix}⚡ Sprint done! ${correct}/5 correct — +${pts} pts!`);

  // Immediately save to Supabase
  saveBrainDraft().catch(e=>console.warn('Sprint save failed:',e));
}

function _mathsShowScoreCard(){
  const correct = mathsQuestions.filter((q,i)=>mathsSelected[i]===q.ans).length;
  const pts = mathsPtsToday;

  document.getElementById('maths-score-chip').textContent = pts;
  document.getElementById('maths-score-big').textContent  = pts;
  const msgs = ['Keep going — practice makes perfect! 💪','Good try! 1 correct — keep warming up! 🙂','Nice effort! 2/5 — keep pushing! 😊','Well done! 3/5 — solid maths brain! 😄','Excellent! 4/5 — almost perfect! 🤩','PERFECT SCORE! Olympiad champion! 🥳🧠'];
  document.getElementById('maths-score-msg').textContent = msgs[correct]||'';

  const bdEl = document.getElementById('maths-score-breakdown');
  if(bdEl){
    bdEl.innerHTML = mathsQuestions.map((q,i)=>{
      const right = mathsSelected[i]===q.ans;
      const skipped = mathsSelected[i]===null;
      const bg = right ? 'background:#ECFDF5;color:#065F46;border:1.5px solid #6EE7B7'
                       : skipped ? 'background:#F3F4F6;color:#6B7280;border:1.5px solid #D1D5DB'
                       : 'background:#FEF2F2;color:#B91C1C;border:1.5px solid #FCA5A5';
      const icon = right ? '✅' : skipped ? '⬜' : '❌';
      return `<span style="${bg};border-radius:20px;padding:4px 11px;font-size:11px;font-weight:800">${icon} Q${i+1}: ${q.topic}</span>`;
    }).join('');
  }

  document.getElementById('maths-score-display').style.display = 'block';
  document.getElementById('maths-check-btn').style.display     = 'none';
  document.getElementById('maths-timer-wrap').style.display    = 'none';

  // Answered chip shows final count
  const answeredCount = mathsSelected.filter(x=>x!==null).length;
  document.getElementById('maths-answered-chip').textContent   = answeredCount+'/5';
}

function updateBrainDisplay(){
  const pts = brainPtsToday;
  const disp = document.getElementById('brain-pts-disp');
  if(disp) disp.textContent = pts;
  const big = document.getElementById('brain-pts-big');
  if(big) big.textContent = pts;
  // Breakdown chips
  const bs = document.getElementById('bb-sudoku');if(bs)bs.textContent=sudokuPts;
  const bl = document.getElementById('bb-logic');if(bl)bl.textContent=logicPtsTotal;
  const bm = document.getElementById('bb-maths');if(bm)bm.textContent=mathsPtsToday;
  const br = document.getElementById('bb-riddle');if(br)br.textContent=riddlePtsTotal;
  const bw = document.getElementById('bb-worksheet');if(bw)bw.textContent=worksheetPts;
  // Mood emoji + message
  const moodEl = document.getElementById('brain-mood-emoji');
  const msgEl  = document.getElementById('brain-pts-msg');
  let emoji, msg;
  if(pts === 0){emoji='😴';msg='Complete puzzles above to earn points!';}
  else if(pts < 20){emoji='🙂';msg='Good start! Keep going, more pts await!';}
  else if(pts < 40){emoji='😊';msg='Nice work! You are warming up!';}
  else if(pts < 60){emoji='😄';msg='Brilliant brain work, Vaanya! 💪';}
  else if(pts < 70){emoji='🤩';msg='Outstanding!! Your brain is on fire! 🔥';}
  else{emoji='🥳';msg='GENIUS MODE!! Maximum brain pts! 🧠👑';}
  if(moodEl) moodEl.textContent = emoji;
  if(msgEl)  msgEl.textContent  = msg;
}

// ════════════════════════════════════════════
// ONCE-A-DAY FREEZE — SUDOKU & LOGIC
// ════════════════════════════════════════════
function freezeSudoku(){
  if(sudokuFrozen) return;
  sudokuFrozen = true;
  // Disable all numpad buttons and cells
  document.querySelectorAll('.npbtn').forEach(b=>{b.disabled=true;b.style.opacity='.4';b.style.cursor='not-allowed';});
  document.querySelectorAll('.sc-cell:not(.given)').forEach(c=>{c.onclick=null;c.style.cursor='default';});
  // Disable difficulty + action buttons inside puzzle-sudoku
  document.querySelectorAll('#puzzle-sudoku .btn').forEach(b=>{b.disabled=true;b.style.opacity='.4';b.style.cursor='not-allowed';});
  // Show frozen badge + parent unlock hint
  const msg=document.getElementById('sudoku-msg');
  const diff=sudokuDifficulty||'easy';
  const diffLabel={easy:'Easy',medium:'Medium',hard:'Hard'}[diff]||diff;
  if(msg) msg.innerHTML=`
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
      <span style="background:#ECFDF5;color:#065F46;border:1.5px solid #6EE7B7;border-radius:10px;
        padding:8px 14px;font-size:13px;font-weight:800;display:inline-block">
        ✅ Sudoku (${diffLabel}) checked &amp; locked for today! ${sudokuPts>0?'🏆 '+sudokuPts+' pts earned!':'Come back tomorrow!'} 🔒
      </span>
      <span style="color:#9CA3AF;font-size:11px;font-weight:700">
        🔐 Mamma or Papa can unlock one more attempt from the Parents Review tab.
      </span>
    </div>`;
}

function unfreezeSudoku(){
  sudokuFrozen = false;
  sudokuPts = 0; // reset pts so the fresh attempt can earn full points
  brainPtsToday = sudokuPts + logicPtsTotal + riddlePtsTotal + mathsPtsToday + worksheetPts;
  // Re-enable all buttons and cells
  document.querySelectorAll('.npbtn').forEach(b=>{b.disabled=false;b.style.opacity='';b.style.cursor='';});
  document.querySelectorAll('#puzzle-sudoku .btn').forEach(b=>{b.disabled=false;b.style.opacity='';b.style.cursor='';});
  // Generate a fresh puzzle at easy (parent can pick difficulty after)
  genSudoku('easy');
  updateBrainDisplay(); calcDayPts();
  toast('🔓 Sudoku unlocked! Vaanya gets one more attempt. It will lock again after she checks.');
}

function freezeLogic(){
  if(logicFrozen) return;
  logicFrozen = true;
  // Disable all option buttons and check button
  document.querySelectorAll('#logic-puzzles .opt-btn').forEach(b=>{b.disabled=true;b.style.cursor='default';});
  const checkBtn=document.getElementById('logic-check-btn');
  if(checkBtn){checkBtn.disabled=true;checkBtn.style.opacity='.4';checkBtn.style.cursor='not-allowed';}
  // Add frozen notice
  const c=document.getElementById('logic-puzzles');
  if(c){
    const old=c.querySelector('.logic-frozen-notice');if(old)return;
    const notice=document.createElement('div');
    notice.className='logic-frozen-notice';
    notice.style.cssText='background:#ECFDF5;border:1.5px solid #6EE7B7;border-radius:10px;padding:10px 14px;margin-top:10px;font-size:13px;font-weight:800;color:#065F46;text-align:center';
    notice.textContent='✅ Logic puzzles done for today! Come back tomorrow for new ones! 🔒';
    c.appendChild(notice);
  }
}

// ════════════════════════════════════════════
// SAVE BRAIN LAB DRAFT
// ════════════════════════════════════════════
async function saveBrainDraft(){
  // Use IST date as fallback if rpt-date input is empty (e.g. called from Brain Lab tab)
  const istNow = new Date(Date.now() + 5.5 * 60 * 60000);
  const istToday = istNow.toISOString().split('T')[0];
  let date = document.getElementById('rpt-date')?.value || istToday;
  if(!date) date = istToday;
  // GUARD: never overwrite an approved report from a sub-tab save
  const _existingB = savedDays.find(d => d.date === date);
  if(_existingB && _existingB.approved === true){
    toast('✅ Report already approved — brain pts are locked in!');
    return;
  }
  const pts=calcDayPts();
  const data = collectFormData(date, pts);
  // Upsert into savedDays
  const idx = savedDays.findIndex(d=>d.date===date);
  if(idx>=0){ savedDays[idx]={...savedDays[idx],...data}; }
  else { savedDays.unshift(data); }
  savedDays.sort((a,b)=>new Date(b.date)-new Date(a.date));
  await saveToSupabase(data);
  updateTopBar();
  const msgEl=document.getElementById('brain-save-msg');
  if(msgEl){msgEl.textContent='✅ Brain Lab progress saved to today\'s report! ('+brainPtsToday+' brain pts)';
    setTimeout(()=>{if(msgEl)msgEl.textContent='';},4000);}
  toast('💾 Brain Lab saved! '+brainPtsToday+' brain pts recorded.');
}

// showSoulTab removed — now two separate tabs

// ════════════════════════════════════════════
// CREATIVE IMAGE UPLOAD
// ════════════════════════════════════════════
let creativeImgData = null; // base64 string stored here

function previewCreativeImg(input){
  if(!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function(e){
    creativeImgData = e.target.result;
    const img = document.getElementById('creative-img-show');
    const preview = document.getElementById('creative-img-preview');
    if(img) img.src = creativeImgData;
    if(preview) preview.style.display='block';
    toast('✅ Photo uploaded! Parents will see it in their review.');
  };
  reader.readAsDataURL(file);
}

function clearCreativeImg(){
  creativeImgData = null;
  const img = document.getElementById('creative-img-show');
  const preview = document.getElementById('creative-img-preview');
  const input = document.getElementById('creative-img-upload');
  if(img) img.src='';
  if(preview) preview.style.display='none';
  if(input) input.value='';
}

// ════════════════════════════════════════════
// GEETA IMAGE SLIDER — auto-only, no wallpaper
// ════════════════════════════════════════════
let geetaImgCurrent = 1;
const GEETA_IMG_TOTAL = 4;
let geetaAutoInterval = null;
let geetaAutoOn = true;

function geetaImgGo(n){
  for(let i=1;i<=GEETA_IMG_TOTAL;i++){
    const img = document.getElementById('gimg-'+i);
    const dot = document.getElementById('gdot-'+i);
    if(img){
      img.style.opacity = '0';
      img.style.position = 'absolute';
      img.style.zIndex = '1';
    }
    if(dot){
      dot.style.background='#A7F3D0';
      dot.style.boxShadow='none';
      dot.style.transform='scale(1)';
    }
  }
  geetaImgCurrent = ((n-1+GEETA_IMG_TOTAL)%GEETA_IMG_TOTAL)+1;
  const cur = document.getElementById('gimg-'+geetaImgCurrent);
  const curDot = document.getElementById('gdot-'+geetaImgCurrent);
  if(cur){
    // If image failed to load (SSL/local), skip to next
    if(cur.naturalWidth===0 && cur.complete){
      // Image broken — try next one
      setTimeout(()=>geetaImgGo(geetaImgCurrent+1), 100);
      return;
    }
    cur.style.opacity='1';
    cur.style.position='relative';
    cur.style.zIndex='2';
  }
  if(curDot){
    curDot.style.background='linear-gradient(135deg,#10B981,#3B82F6)';
    curDot.style.boxShadow='0 0 8px rgba(16,185,129,.6)';
    curDot.style.transform='scale(1.35)';
  }
}

function geetaImgNext(){ geetaImgGo(geetaImgCurrent+1); }

function geetaStartAuto(){
  if(geetaAutoInterval) clearInterval(geetaAutoInterval);
  geetaAutoInterval = setInterval(geetaImgNext, 5000);
}
function geetaStopAuto(){
  if(geetaAutoInterval){ clearInterval(geetaAutoInterval); geetaAutoInterval=null; }
}

// ════════════════════════════════════════════
// GEETA & CREATIVE DRAFT SAVES
// ════════════════════════════════════════════
function checkGeetaSaveReady(){
  const val = (document.getElementById('past-shlokas')?.value||'').trim();
  const btn = document.getElementById('geeta-save-btn');
  const req = document.getElementById('past-shlokas-required');
  if(val.length > 0){
    if(btn){
      btn.disabled = false;
      btn.style.background = 'linear-gradient(135deg,#10B981,#059669)';
      btn.style.cursor = 'pointer';
      btn.style.opacity = '1';
      btn.style.boxShadow = '0 4px 16px rgba(16,185,129,.35)';
    }
    if(req) req.style.display = 'none';
  } else {
    if(btn){
      btn.disabled = true;
      btn.style.background = 'linear-gradient(135deg,#9CA3AF,#6B7280)';
      btn.style.cursor = 'not-allowed';
      btn.style.opacity = '.5';
      btn.style.boxShadow = 'none';
    }
    if(req) req.style.display = 'flex';
  }
}

async function saveGeetaDraft(){
  const date = document.getElementById('rpt-date')?.value;
  if(!date){ toast('Please set a date on the Daily Report tab first!'); return; }
  // GUARD: never overwrite an approved report
  const _existingG = savedDays.find(d => d.date === date);
  if(_existingG && _existingG.approved === true){
    toast('✅ Report already approved — shloka work is locked in!');
    return;
  }
  // Guard: past-shlokas is mandatory
  const pastVal = (document.getElementById('past-shlokas')?.value||'').trim();
  if(!pastVal){ toast('✍️ Please write at least one past shloka first!'); return; }
  const pts = calcDayPts();
  const data = collectFormData(date, pts);
  const idx = savedDays.findIndex(d=>d.date===date);
  if(idx>=0){ savedDays[idx]={...savedDays[idx],...data}; }
  else { savedDays.unshift(data); }
  await saveToSupabase(data);
  updateTopBar();
  const msg = document.getElementById('geeta-save-msg');
  if(msg){ msg.textContent='✅ Shloka reflection saved! Parents can now see it.'; }
  toast('💾 Shloka work saved!');
}

// saveCreativeDraft — defined in creative section above

