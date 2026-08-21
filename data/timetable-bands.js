// ============================================================================
// NIYAM — data/timetable-bands.js
// Class-based starter timetables. Band A = Class 1–3, B = Class 4–5, C = Class 6–8.
//
// Blocks are defined COMPACTLY here (name, minutes, tasks) and expanded at load
// time into the exact block shape the app already renders — same keys as
// data/timetable.js: id, time, name, icon, iconBg, iconColor, color, lightBg,
// type, maxPts, unlockHour, activities[].
//
// Weekday blocks are positioned RELATIVE to the family's chosen start time
// (S5 in onboarding), so a child home at 1 PM and one home at 4 PM both get a
// sensible day. Weekend blocks use fixed morning times per band.
//
// Activities carrying premium:true are the ones that need photo storage
// (Creative / Gallery). Filtering them out later is a one-line change.
//
// Load AFTER data/timetable.js, BEFORE js/00-shell.js.
// ============================================================================

var NIYAM_PAL = {
  indigo: { iconBg:'#EEF2FF', iconColor:'#4F46E5', color:'#4F46E5', lightBg:'#EEF2FF' },
  grey:   { iconBg:'#F9FAFB', iconColor:'#6B7280', color:'#6B7280', lightBg:'#F9FAFB' },
  green:  { iconBg:'#ECFDF5', iconColor:'#059669', color:'#059669', lightBg:'#ECFDF5' },
  blue:   { iconBg:'#EFF6FF', iconColor:'#2563EB', color:'#2563EB', lightBg:'#EFF6FF' },
  violet: { iconBg:'#F3EFFE', iconColor:'#7C3AED', color:'#7C3AED', lightBg:'#F3EFFE' },
  amber:  { iconBg:'#FFF7ED', iconColor:'#EA580C', color:'#EA580C', lightBg:'#FFF7ED' },
  rose:   { iconBg:'#FFF1F2', iconColor:'#E11D48', color:'#E11D48', lightBg:'#FFF1F2' },
  teal:   { iconBg:'#F0FDFA', iconColor:'#0D9488', color:'#0D9488', lightBg:'#F0FDFA' }
};

// ---------------------------------------------------------------------------
// BAND DEFINITIONS
// mins  = length of the block
// gap   = minutes of slack before this block starts (default 0)
// pal   = colour key · type = block type · acts = activities
// ---------------------------------------------------------------------------
var NIYAM_BAND_DEFS = {

  // ======================= BAND A · Class 1–3 · "Little Steps" ==============
  A: {
    label: 'Little Steps', classes: [1,2,3],
    defaultStart: 14,           // 2:00 PM
    weekendStart: 8,            // 8:00 AM
    bedtime: 20.5,              // 8:30 PM — ages 6–8 need 9–12 hrs sleep
    weekendBedtime: 21,
    weekday: [
      { key:'lunch', name:'Lunch & Rest', icon:'🍱', mins:45, type:'break', pal:'grey', acts:[] },
      { key:'play', name:'Outdoor Play', icon:'⚽', mins:45, type:'normal', pal:'green', acts:[
        { name:'Went outside and played', pts:10, type:'self' }
      ]},
      { key:'hw', name:'Homework with a Parent', icon:'✏️', mins:30, type:'normal', pal:'blue', acts:[
        { name:'Homework done (with Mumma or Papa)', pts:15, type:'self' },
        { name:'Packed the school bag for tomorrow', pts:5, type:'self' }
      ]},
      { key:'story', name:'Story Time', icon:'📖', mins:20, type:'normal', pal:'teal', acts:[
        { name:'Read a story (or listened to one)', pts:10, type:'self' },
        { name:'Told the story back in my own words', pts:5, type:'parent', note:'⏳ Parents award pts on review' }
      ]},
      { key:'shloka', name:'Shloka & Meaning', icon:'🕉️', mins:15, type:'normal', pal:'amber', acts:[
        { name:"Learned today's shloka and what it means", pts:15, type:'parent', note:'⏳ Parents award pts on review' }
      ]},
      { key:'creative', name:'Creative Moment', icon:'🎨', mins:20, type:'normal', pal:'rose', acts:[
        { name:'Drawing / colouring / building', pts:0, type:'parent-select', maxCalcPts:15, premium:true,
          note:'Parents award up to 15 pts on review' }
      ]},
      { key:'brain', name:'Brain Play', icon:'🧠', mins:15, type:'normal', pal:'violet', acts:[
        { name:'Brain Lab — picture & pattern puzzles', pts:0, type:'link', tab:'brain',
          note:'→ Brain Lab · pts pulled from there' }
      ]},
      { key:'help', name:'One Little Help at Home', icon:'🏠', mins:15, type:'normal', pal:'green', acts:[
        { name:'Helped at home (toys away, table laid, plant watered)', pts:10, type:'self' }
      ]},
      { key:'dinner', name:'Dinner', icon:'🍽️', mins:30, type:'break', pal:'grey', acts:[] },
      { key:'wind', name:'Cuddle & Gratitude', icon:'🌙', mins:15, type:'normal', pal:'violet', acts:[
        { name:'One good thing that happened today', pts:10, type:'self' },
        { name:'Brushed teeth and got ready for bed', pts:5, type:'self' }
      ]},
      { key:'sleep', name:'Sleep', icon:'😴', mins:0, type:'break', pal:'grey', acts:[] }
    ],
    weekend: [
      { key:'rise', name:'Rise & Get Ready', icon:'🌅', mins:60, type:'normal', pal:'amber', acts:[
        { name:'Woke up on time', pts:5, type:'self' },
        { name:'Brushed, bathed, dressed by myself', pts:10, type:'self' }
      ]},
      { key:'puja', name:'Prayer & Breakfast', icon:'🪔', mins:60, type:'normal', pal:'amber', acts:[
        { name:'Prayer with the family', pts:10, type:'self' },
        { name:'Breakfast', pts:0, type:'self', note:'No pts — nourish yourself! 🍽️' }
      ]},
      { key:'play1', name:'Outdoor Play', icon:'⚽', mins:60, type:'normal', pal:'green', acts:[
        { name:'Played outside', pts:10, type:'self' }
      ]},
      { key:'learn', name:'Fun Learning', icon:'🔤', mins:45, type:'normal', pal:'blue', acts:[
        { name:'Practised reading or writing', pts:10, type:'self' },
        { name:'Counting or number game', pts:10, type:'self' }
      ]},
      { key:'lunch', name:'Lunch & Rest', icon:'🍱', mins:90, type:'break', pal:'grey', acts:[] },
      { key:'creative', name:'Big Creative Time', icon:'🎨', mins:60, type:'normal', pal:'rose', acts:[
        { name:'Drawing, craft or building something', pts:0, type:'parent-select', maxCalcPts:20, premium:true,
          note:'Parents award up to 20 pts on review' }
      ]},
      { key:'family', name:'Family & Grandparents Time', icon:'👴', mins:60, type:'normal', pal:'teal', acts:[
        { name:'Spent time with grandparents (or called them)', pts:15, type:'self' },
        { name:'Listened to a story from an elder', pts:10, type:'self' }
      ]},
      { key:'shloka', name:'Shloka & Meaning', icon:'🕉️', mins:20, type:'normal', pal:'amber', acts:[
        { name:'Learned a shloka and its meaning', pts:15, type:'parent', note:'⏳ Parents award pts on review' }
      ]},
      { key:'help', name:'Help at Home', icon:'🏠', mins:20, type:'normal', pal:'green', acts:[
        { name:'Helped with one job at home', pts:10, type:'self' }
      ]},
      { key:'dinner', name:'Dinner', icon:'🍽️', mins:45, type:'break', pal:'grey', acts:[] },
      { key:'wind', name:'Cuddle & Gratitude', icon:'🌙', mins:15, type:'normal', pal:'violet', acts:[
        { name:'One good thing that happened today', pts:10, type:'self' }
      ]},
      { key:'sleep', name:'Sleep', icon:'😴', mins:0, type:'break', pal:'grey', acts:[] }
    ]
  },

  // ======================= BAND B · Class 4–5 · "Growing Strong" ============
  B: {
    label: 'Growing Strong', classes: [4,5],
    defaultStart: 15,           // 3:00 PM
    weekendStart: 7.5,          // 7:30 AM
    bedtime: 21,                // 9:00 PM
    weekendBedtime: 21.5,
    weekday: [
      { key:'lunch', name:'Lunch & Screen Time', icon:'🍱', mins:30, type:'break', pal:'grey', acts:[] },
      { key:'reading', name:'Book Reading + New Words', icon:'📚', mins:30, type:'wordbook-inline', pal:'green', acts:[
        { name:'Book reading + add 3 new words to WordBook', pts:20, type:'wordbook',
          note:'20 pts when all 3 words are added with meaning & sentence' }
      ]},
      { key:'study', name:'Homework & Self Study', icon:'✏️', mins:60, type:'normal', pal:'blue', acts:[
        { name:'Homework', pts:0, type:'self', note:'No pts — must be done every day 📚' },
        { name:'Self study', pts:15, type:'self' },
        { name:'Worksheet', pts:0, type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts' },
        { name:'Packed the school bag for tomorrow', pts:10, type:'self' }
      ]},
      { key:'play', name:'Outdoor Play', icon:'⚽', mins:45, type:'normal', pal:'green', acts:[
        { name:'Outdoor playing', pts:15, type:'self' }
      ]},
      { key:'brain', name:'Brain Lab', icon:'🧠', mins:20, type:'normal', pal:'violet', acts:[
        { name:'Brain Lab — Logic', pts:0, type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there' },
        { name:'Brain Lab — Maths Sprint', pts:0, type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there' }
      ]},
      { key:'sudoku', name:'Sudoku & Maths Practice', icon:'🔢', mins:15, type:'normal', pal:'indigo', acts:[
        { name:'Brain Lab — Sudoku', pts:0, type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there' },
        { name:'Maths practice questions', pts:0, type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts' }
      ]},
      { key:'shloka', name:'Geeta — Shloka & Meaning', icon:'🕉️', mins:15, type:'normal', pal:'amber', acts:[
        { name:'Shloka learning + meaning in own words', pts:20, type:'parent',
          note:'⏳ Parents award pts on review' }
      ]},
      { key:'creative', name:'Creative Moments', icon:'🎨', mins:30, type:'normal', pal:'rose', acts:[
        { name:'Creative Task', pts:0, type:'parent-select', maxCalcPts:25, premium:true,
          note:'Parents award up to 25 pts on review' }
      ]},
      { key:'help', name:'Help at Home', icon:'🏠', mins:15, type:'normal', pal:'green', acts:[
        { name:'Helped at home with one job', pts:10, type:'self' }
      ]},
      { key:'dinner', name:'Dinner', icon:'🍽️', mins:30, type:'break', pal:'grey', acts:[] },
      { key:'values', name:'Values & Reflection', icon:'📿', mins:15, type:'normal', pal:'violet', acts:[
        { name:'One good habit I kept today', pts:5, type:'self' },
        { name:'Daily gratitude journal', pts:5, type:'self' },
        { name:'Everything done on time', pts:5, type:'self' }
      ]},
      { key:'wind', name:'Wind-Down Routine', icon:'🌙', mins:15, type:'normal', pal:'violet', acts:[
        { name:'Night routine completed', pts:10, type:'self' }
      ]},
      { key:'sleep', name:'Sleep', icon:'😴', mins:0, type:'break', pal:'grey', acts:[] }
    ],
    weekend: [
      { key:'rise', name:'Rise & Morning Routine', icon:'🌅', mins:60, type:'normal', pal:'amber', acts:[
        { name:'Rise on time', pts:5, type:'self' },
        { name:'Get ready by myself', pts:10, type:'self' }
      ]},
      { key:'puja', name:'Prayer, Yoga & Breakfast', icon:'🪔', mins:60, type:'normal', pal:'amber', acts:[
        { name:'Prayer + a few yoga asanas', pts:15, type:'self' },
        { name:'Tidied my room and almirah', pts:10, type:'self' },
        { name:'Breakfast', pts:0, type:'self', note:'No pts — nourish yourself! 🍽️' }
      ]},
      { key:'study', name:'Self Study Block', icon:'📖', mins:90, type:'normal', pal:'blue', acts:[
        { name:'Self study — Maths', pts:10, type:'self' },
        { name:'Self study — English', pts:10, type:'self' },
        { name:'Self study — Science', pts:10, type:'self' },
        { name:'Worksheet', pts:0, type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts' }
      ]},
      { key:'play1', name:'Outdoor Play', icon:'⚽', mins:60, type:'normal', pal:'green', acts:[
        { name:'Outdoor playing', pts:15, type:'self' }
      ]},
      { key:'lunch', name:'Lunch & Rest', icon:'🍱', mins:75, type:'break', pal:'grey', acts:[] },
      { key:'creative', name:'Big Creative Time', icon:'🎨', mins:60, type:'normal', pal:'rose', acts:[
        { name:'Creative Task', pts:0, type:'parent-select', maxCalcPts:30, premium:true,
          note:'Parents award up to 30 pts on review' }
      ]},
      { key:'reading', name:'Book Reading + New Words', icon:'📚', mins:30, type:'wordbook-inline', pal:'green', acts:[
        { name:'Book reading + add 3 new words to WordBook', pts:20, type:'wordbook',
          note:'20 pts when all 3 words are added with meaning & sentence' }
      ]},
      { key:'family', name:'Family & Grandparents Time', icon:'👴', mins:60, type:'normal', pal:'teal', acts:[
        { name:'Spent time with grandparents (or called them)', pts:15, type:'self' },
        { name:'Learned something from an elder', pts:10, type:'self' }
      ]},
      { key:'shloka', name:'Geeta — Shloka & Wisdom', icon:'🕉️', mins:30, type:'normal', pal:'amber', acts:[
        { name:'Shloka learning + writing in copy', pts:25, type:'parent',
          note:'⏳ Parents award pts on review' }
      ]},
      { key:'brain', name:'Brain Lab + Focus Time', icon:'🧠', mins:45, type:'normal', pal:'violet', acts:[
        { name:'Brain Lab — Sudoku', pts:0, type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there' },
        { name:'Brain Lab — Riddles', pts:0, type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there' },
        { name:'Silence of 5 minutes — focus on my thoughts', pts:10, type:'self' }
      ]},
      { key:'dinner', name:'Dinner', icon:'🍽️', mins:45, type:'break', pal:'grey', acts:[] },
      { key:'values', name:'Values & Reflection', icon:'📿', mins:15, type:'normal', pal:'violet', acts:[
        { name:'Daily gratitude journal', pts:10, type:'self' },
        { name:'Everything done on time', pts:10, type:'self' }
      ]},
      { key:'sleep', name:'Sleep', icon:'😴', mins:0, type:'break', pal:'grey', acts:[] }
    ]
  },

  // ======================= BAND C · Class 6–8 · "Full NIYAM" ================
  C: {
    label: 'Full NIYAM', classes: [6,7,8],
    defaultStart: 15,           // 3:00 PM
    weekendStart: 7,            // 7:00 AM
    bedtime: 21.75,             // 9:45 PM
    weekendBedtime: 22,
    weekday: [
      { key:'lunch', name:'Lunch & Screen Time', icon:'🍱', mins:30, type:'break', pal:'grey', acts:[] },
      { key:'reading', name:'Book Reading + New Words', icon:'📚', mins:30, type:'wordbook-inline', pal:'green', acts:[
        { name:'Book reading + add 3 new words to WordBook', pts:25, type:'wordbook',
          note:'25 pts when all 3 words are added with meaning & sentence' }
      ]},
      { key:'study', name:'Homework & Self Study', icon:'✏️', mins:120, type:'normal', pal:'blue', acts:[
        { name:'Homework', pts:0, type:'self', note:'No pts — must be done every day 📚' },
        { name:'Self study', pts:15, type:'self' },
        { name:'Olympiad / competitive practice', pts:0, type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts' },
        { name:'Worksheet 1', pts:0, type:'pct-calc', maxCalcPts:10, note:'App calculates pts from % — max 10 pts' },
        { name:'Worksheet 2', pts:0, type:'pct-calc', maxCalcPts:10, note:'App calculates pts from % — max 10 pts' },
        { name:'Packed the school bag for tomorrow', pts:10, type:'self' }
      ]},
      { key:'play', name:'Outdoor / Sports', icon:'⚽', mins:45, type:'normal', pal:'green', acts:[
        { name:'Outdoor playing or sports practice', pts:15, type:'self' }
      ]},
      { key:'brain', name:'Brain Lab', icon:'🧠', mins:30, type:'normal', pal:'violet', acts:[
        { name:'Brain Lab — Logic', pts:0, type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there' },
        { name:'Brain Lab — Maths Sprint', pts:0, type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there' },
        { name:'Brain Lab — Riddles', pts:0, type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there' }
      ]},
      { key:'sudoku', name:'Sudoku & Maths Practice', icon:'🔢', mins:15, type:'normal', pal:'indigo', acts:[
        { name:'Brain Lab — Sudoku', pts:0, type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there' },
        { name:'Complex maths practice', pts:0, type:'pct-calc', maxCalcPts:25, note:'App calculates pts from % — max 25 pts' }
      ]},
      { key:'shloka', name:'Geeta — Shloka & Meaning', icon:'🕉️', mins:20, type:'normal', pal:'amber', acts:[
        { name:'Shloka learning + meaning explained in own words', pts:25, type:'parent',
          note:'⏳ Parents award pts on review' }
      ]},
      { key:'creative', name:'Creative Moments', icon:'🎨', mins:30, type:'normal', pal:'rose', acts:[
        { name:'Creative Task', pts:0, type:'parent-select', maxCalcPts:30, premium:true,
          note:'Parents award up to 30 pts on review' }
      ]},
      { key:'enrich', name:'Evening Enrichment', icon:'⭐', mins:30, type:'normal', pal:'violet', acts:[
        { name:'Hobby / music / dance / coding class', pts:15, type:'self' },
        { name:'Learn one fact from Indian history and make notes', pts:10, type:'text-entry',
          entryKey:'indian_history', saveTo:'gallery', galleryKey:'interesting_facts', premium:true,
          note:'Write the historical fact and what you learned' }
      ]},
      { key:'help', name:'Help at Home', icon:'🏠', mins:10, type:'normal', pal:'green', acts:[
        { name:'Helped at home with one job', pts:10, type:'self' }
      ]},
      { key:'dinner', name:'Dinner', icon:'🍽️', mins:30, type:'break', pal:'grey', acts:[] },
      { key:'values', name:'Values & Reflection', icon:'📿', mins:15, type:'normal', pal:'violet', acts:[
        { name:'Read moral values book — 1 chapter + explain', pts:5, type:'text-entry',
          entryKey:'moral_values', saveTo:'gallery', galleryKey:'moral_values', premium:true,
          note:'Write what you learned from this chapter' },
        { name:'Daily gratitude journal', pts:5, type:'self' }
      ]},
      { key:'wind', name:'Wind-Down Routine', icon:'🌙', mins:15, type:'normal', pal:'violet', acts:[
        { name:'Everything done on time', pts:5, type:'self' },
        { name:'Night routine completed', pts:10, type:'self' }
      ]},
      { key:'sleep', name:'Sleep', icon:'😴', mins:0, type:'break', pal:'grey', acts:[] }
    ],
    weekend: [
      { key:'rise', name:'Rise & Morning Routine', icon:'🌅', mins:60, type:'normal', pal:'amber', acts:[
        { name:'Rise on time', pts:5, type:'self' },
        { name:'Outdoor / morning exercise', pts:10, type:'self' },
        { name:'Get ready', pts:0, type:'self', note:'No pts — just do it! 💪' }
      ]},
      { key:'puja', name:'Prayer, Yoga & Wellness', icon:'🪔', mins:60, type:'normal', pal:'amber', acts:[
        { name:'Prayer + yoga asanas', pts:15, type:'self' },
        { name:'Set my room and almirah', pts:10, type:'self' },
        { name:'Breakfast', pts:0, type:'self', note:'No pts — nourish yourself! 🍽️' }
      ]},
      { key:'maths', name:'Maths Deep Practice', icon:'📐', mins:105, type:'normal', pal:'indigo', acts:[
        { name:'Practice maths', pts:15, type:'self' },
        { name:'Maths Olympiad questions', pts:0, type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts' },
        { name:'Brain Lab — Maths Sprint', pts:0, type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there' }
      ]},
      { key:'break1', name:'Break', icon:'☕', mins:30, type:'break', pal:'grey', acts:[] },
      { key:'study', name:'Self Study Block', icon:'📖', mins:90, type:'normal', pal:'blue', acts:[
        { name:'Self study — Maths', pts:10, type:'self' },
        { name:'Self study — English', pts:10, type:'self' },
        { name:'Self study — Science', pts:10, type:'self' },
        { name:'Self study — Hindi', pts:10, type:'self' },
        { name:'Self study — SST', pts:10, type:'self' },
        { name:'Worksheet', pts:0, type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts' }
      ]},
      { key:'lunch', name:'Break + Lunch Time', icon:'🍱', mins:60, type:'break', pal:'grey', acts:[] },
      { key:'papers', name:'Practice Papers & Writing', icon:'✍️', mins:90, type:'normal', pal:'blue', acts:[
        { name:'Practice papers — any subject', pts:0, type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts' },
        { name:'Paragraph / story writing', pts:0, type:'dropdown', options:[3,5,7,10], note:'Select points based on quality' },
        { name:'Spoken English & debate practice', pts:0, type:'dropdown', options:[3,5,7,10], note:'Select points based on quality' }
      ]},
      { key:'reading', name:'Book Reading + New Words', icon:'📚', mins:30, type:'wordbook-inline', pal:'green', acts:[
        { name:'Book reading + add 3 new words to WordBook', pts:25, type:'wordbook',
          note:'25 pts when all 3 words are added with meaning & sentence' }
      ]},
      { key:'shloka', name:'Geeta — Shloka & Wisdom', icon:'🕉️', mins:30, type:'normal', pal:'amber', acts:[
        { name:'Shloka learning & writing in copy', pts:25, type:'parent',
          note:'⏳ Parents award pts on review · full marks for full mastery' },
        { name:'Learn a proverb and what it means to you', pts:10, type:'text-entry',
          entryKey:'proverb', saveTo:'gallery', galleryKey:'proverb', premium:true,
          note:'Write the proverb and what it means to you' }
      ]},
      { key:'family', name:'Family & Grandparents Time', icon:'👴', mins:60, type:'normal', pal:'teal', acts:[
        { name:'Spent time with grandparents (or called them)', pts:15, type:'self' },
        { name:'Learned something from an elder and noted it', pts:10, type:'self' }
      ]},
      { key:'creative', name:'Big Creative Time', icon:'🎨', mins:60, type:'normal', pal:'rose', acts:[
        { name:'Creative Task', pts:0, type:'parent-select', maxCalcPts:30, premium:true,
          note:'Parents award up to 30 pts on review' }
      ]},
      { key:'dinner', name:'Dinner', icon:'🍽️', mins:45, type:'break', pal:'grey', acts:[] },
      { key:'values', name:'Values & Reflection', icon:'📿', mins:15, type:'normal', pal:'violet', acts:[
        { name:'Daily gratitude journal', pts:10, type:'self' },
        { name:'Everything done on time', pts:10, type:'self' }
      ]},
      { key:'sleep', name:'Sleep', icon:'😴', mins:0, type:'break', pal:'grey', acts:[] }
    ]
  }
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function niyamBandForClass(cls){
  var n = parseInt(String(cls).replace(/\D/g,''), 10);
  if(!n || n < 1) n = 5;
  if(n <= 3) return 'A';
  if(n <= 5) return 'B';
  return 'C';                       // Class 6–8 (NIYAM supports Classes 1–8)
}

function _niyamFmt(dec){
  while(dec >= 24) dec -= 24;
  var h = Math.floor(dec), mi = Math.round((dec - h) * 60);
  if(mi === 60){ h += 1; mi = 0; }
  var ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12; if(h12 === 0) h12 = 12;
  return h12 + ':' + ('0' + mi).slice(-2) + ' ' + ap;
}

function _niyamBlockMax(acts){
  return (acts || []).reduce(function(s, a){
    return s + (parseInt(a.pts) || 0) + (parseInt(a.maxCalcPts) || 0);
  }, 0);
}

// Expands compact defs into the block shape the app renders.
// Blocks never run back-to-back: leftover time between the start and the band's
// bedtime is shared out evenly as breathing room, so the last block (Sleep)
// lands on the bedtime the band was designed around.
function _niyamExpand(defs, startHour, prefix, bedtime){
  var totalMins = defs.reduce(function(s, d){ return s + (d.mins || 0); }, 0);
  var gaps = Math.max(defs.length - 1, 1);
  var slack = 0;
  if(typeof bedtime === 'number'){
    var spareMins = (bedtime - startHour) * 60 - totalMins;
    slack = Math.max(0, Math.min(20, spareMins / gaps));   // up to 20 min per gap
    slack = Math.floor(slack / 5) * 5;                     // keep times on tidy 5-min marks
  }
  var cursor = startHour, out = [];
  defs.forEach(function(d, i){
    var pal = NIYAM_PAL[d.pal] || NIYAM_PAL.grey;
    var acts = (d.acts || []).map(function(a, j){
      var act = { id: prefix + '-' + d.key + (j + 1) };
      for(var k in a) if(Object.prototype.hasOwnProperty.call(a, k)) act[k] = a[k];
      return act;
    });
    var timeTxt = d.mins > 0
      ? _niyamFmt(cursor) + ' – ' + _niyamFmt(cursor + d.mins / 60)
      : _niyamFmt(cursor);
    out.push({
      id: prefix + '-' + d.key,
      time: timeTxt,
      name: d.name,
      icon: d.icon,
      iconBg: pal.iconBg, iconColor: pal.iconColor, color: pal.color, lightBg: pal.lightBg,
      type: d.type,
      maxPts: _niyamBlockMax(acts),
      unlockHour: Math.round(cursor * 100) / 100,
      activities: acts
    });
    cursor += (d.mins || 0) / 60 + (d.gap || 0) / 60;
    if(i < defs.length - 1) cursor += slack / 60;
  });
  return out;
}

/**
 * Build a family's starting timetable.
 * @param {number|string} cls        child's class, 1–8
 * @param {number} [startHour]       when the school-day timetable opens (decimal 24h)
 * @returns {{weekday:Array, weekend:Array, band:string, label:string}}
 */
function niyamBuildTimetable(cls, startHour){
  var bandKey = niyamBandForClass(cls);
  var band = NIYAM_BAND_DEFS[bandKey];
  var start = (typeof startHour === 'number' && !isNaN(startHour)) ? startHour : band.defaultStart;

  // School block runs from the morning up to the family's chosen start time.
  var school = {
    id: 'wd-school', time: '6:00 AM – ' + _niyamFmt(start), name: 'School Time', icon: '🏫',
    iconBg: NIYAM_PAL.indigo.iconBg, iconColor: NIYAM_PAL.indigo.iconColor,
    color: NIYAM_PAL.indigo.color, lightBg: NIYAM_PAL.indigo.lightBg,
    type: 'locked-until-3pm', maxPts: 0, unlockHour: 6, activities: []
  };

  return {
    band: bandKey,
    label: band.label,
    weekday: [school].concat(_niyamExpand(band.weekday, start, 'wd', band.bedtime)),
    weekend: _niyamExpand(band.weekend, band.weekendStart, 'we', band.weekendBedtime)
  };
}

// Total points a perfect day is worth — used by the preview screen.
function niyamDayMax(blocks){
  return (blocks || []).reduce(function(s, b){ return s + (parseInt(b.maxPts) || 0); }, 0);
}

if(typeof window !== 'undefined'){
  window.NIYAM_BAND_DEFS      = NIYAM_BAND_DEFS;
  window.niyamBandForClass    = niyamBandForClass;
  window.niyamBuildTimetable  = niyamBuildTimetable;
  window.niyamDayMax          = niyamDayMax;
}
