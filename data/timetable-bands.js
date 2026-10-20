// ============================================================================
// NIYAM — data/timetable-bands.js
// Class-based starter timetables. Band A = Class 1–3, B = Class 4–5, C = Class 6–8.
// A class with its own timetable in NIYAM_CLASS_DEFS (below the bands) uses
// that instead of its band — Class 4 from 20 Oct 2026.
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
        { name:'Homework done (with a parent)', pts:15, type:'self' },
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
        { name:'Book reading + new words in your WordBook', pts:10, type:'wordbook',
          note:'10 pts for every 3 words, up to 9 words a day' }
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
        { name:'Book reading + new words in your WordBook', pts:10, type:'wordbook',
          note:'10 pts for every 3 words, up to 9 words a day' }
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
        { name:'Book reading + new words in your WordBook', pts:10, type:'wordbook',
          note:'10 pts for every 3 words, up to 9 words a day' }
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
        { name:'Book reading + new words in your WordBook', pts:10, type:'wordbook',
          note:'10 pts for every 3 words, up to 9 words a day' }
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
// CLASS TIMETABLES — one per class, written with Pooja (Class 4 agreed 20 Oct
// 2026; the other classes still use the bands above until theirs are agreed).
// Same compact shape as the bands. `about` = the line parents and the child
// see for the block. A day written to fit exactly (Class 4: 3:00 PM to
// 9:00 PM) keeps exactly these times; a later or earlier school end shifts it.
// ---------------------------------------------------------------------------
var NIYAM_CLASS_DEFS = {
  4: {
    label: 'Class 4',
    defaultStart: 15,           // school ends 3:00 PM (the parent's choice moves it)
    lunchUntil: 15.75,          // Lunch & Rest runs from school end until 3:45 PM
    bedtime: 21,                // 9:00 PM
    lateFrom: 15.5,             // school ending at 3:30 PM or later…
    lateBedtime: 21.5,          // …moves bedtime to 9:30 PM, never later (Pooja, 21 Oct 2026)
    weekendStart: 7,            // 7:00 AM
    weekendBedtime: 21,         // 9:00 PM
    weekday: [
      { key:'lunch', name:'Lunch & Rest', icon:'🍱', mins:45, type:'break', pal:'grey',
        about:'Eat your lunch, rest and relax after school. No tasks in this block.', acts:[] },
      { key:'homework', name:'Homework', icon:'✏️', mins:75, min:60, type:'normal', pal:'blue',
        about:'Finish today’s school homework first, then spend a little time on self-study.', acts:[
        { name:'Finish today’s school homework', pts:15, type:'self' },
        { name:'Self-study: read over today’s lessons', pts:10, type:'self' }
      ]},
      { key:'reading', name:'Book Reading + New Words', icon:'📚', mins:30, min:20, type:'wordbook-inline', pal:'green',
        about:'Read any book you like and add the new words you find to your WordBook — with the meaning and a sentence. You can add words any time of the day: every 3 words earn 10 points.', acts:[
        { name:'Read a book and add new words to your WordBook', pts:10, type:'wordbook',
          note:'10 pts for every 3 words, up to 9 words a day' }
      ]},
      { key:'play', name:'Outdoor Play', icon:'⚽', mins:60, min:30, type:'normal', pal:'green',
        about:'Time outdoors — a sport, cycling or running around. Moving your body keeps your mind fresh.', acts:[
        { name:'Play outside or a sport for 30 minutes', pts:10, type:'self' }
      ]},
      { key:'brain', name:'Brain Lab', icon:'🧠', mins:30, min:20, type:'normal', pal:'violet',
        about:'The puzzles are in the Brain Lab tab of this app. Tap a task below to open it — the points come in automatically.', acts:[
        { name:'Brain Lab — Riddle of the day', pts:0, type:'link', tab:'brain', note:'Tap to open the Brain Lab tab' },
        { name:'Brain Lab — Maths Sprint', pts:0, type:'link', tab:'brain', note:'Tap to open the Brain Lab tab' }
      ]},
      { key:'shloka', name:'Geeta — Shloka & Meaning', icon:'🕉️', mins:30, min:20, type:'normal', pal:'amber',
        about:'Your shlokas are in the Geeta — Soul Work tab of this app. Learn one and what it means, then say it to a parent. Your parent gives the points.', acts:[
        { name:'Learn a shloka and its meaning, then say it to a parent', pts:15, type:'parent',
          note:'Find it in the Geeta — Soul Work tab · your parent gives the points' }
      ]},
      { key:'help', name:'Help at Home', icon:'🏠', mins:15, type:'normal', pal:'green',
        about:'Do one job at home without being asked — lay the table, fold clothes, water the plants.', acts:[
        { name:'Do one job at home without being asked', pts:10, type:'self' }
      ]},
      { key:'dinner', name:'Dinner', icon:'🍽️', mins:30, type:'normal', pal:'grey',
        about:'Family dinner. When you finish, put your plate away and clean your place at the table.', acts:[
        { name:'Finish your dinner, put your plate away and clean your table', pts:10, type:'self' }
      ]},
      { key:'values', name:'Values & Family Talk', icon:'📿', mins:30, min:15, type:'normal', pal:'violet',
        about:'Time with a parent: share one good thing from your day and talk about one good value.', acts:[
        { name:'Tell a parent one good thing you did today', pts:5, type:'self' },
        { name:'Talk about one good value — honesty, kindness or patience', pts:5, type:'self' }
      ]},
      { key:'wind', name:'Get Ready for Bed', icon:'🌙', mins:15, type:'normal', pal:'violet',
        about:'Do your night routine and get ready for bed. End the day by saying “Thank you God” and thanking your parents.', acts:[
        { name:'Keep your uniform, shoes and school bag ready for tomorrow', pts:5, type:'self' },
        { name:'Brush your teeth and wash up', pts:5, type:'self' },
        { name:'Say “Thank you God” and “Thank you” to your parents for today', pts:5, type:'self' }
      ]},
      { key:'sleep', name:'Sleep', icon:'😴', mins:0, type:'break', pal:'grey',
        about:'Lights out. Good sleep helps you grow and remember what you learned.', acts:[] }
    ],
    weekend: [
      { key:'rise', name:'Wake Up & Get Ready', icon:'🌅', mins:60, type:'normal', pal:'amber',
        about:'Wake up, freshen up, make your bed and get ready for the day.', acts:[
        { name:'Wake up on time', pts:5, type:'self' },
        { name:'Make your bed and get ready by yourself', pts:5, type:'self' }
      ]},
      { key:'puja', name:'Prayer, Yoga & Breakfast', icon:'🪔', mins:60, type:'normal', pal:'amber',
        about:'Morning prayer, a few yoga asanas, and a healthy breakfast.', acts:[
        { name:'Pray and do a few yoga asanas', pts:10, type:'self' },
        { name:'After breakfast, put your plate away and clean your table', pts:10, type:'self' }
      ]},
      { key:'tidy', name:'Tidy Your Shelf & Cupboard', icon:'🧺', mins:30, type:'normal', pal:'teal',
        about:'Set your bookshelf and wardrobe in order — everything back in its place.', acts:[
        { name:'Tidy your bookshelf and wardrobe', pts:20, type:'self' }
      ]},
      { key:'art', name:'Creative Work', icon:'🎨', mins:30, type:'normal', pal:'rose',
        about:'Drawing, painting, or anything creative you like to make.', acts:[
        { name:'Draw, paint or make something creative of your choice', pts:10, type:'self' }
      ]},
      { key:'wstudy', name:'Weekend Study', icon:'📖', mins:120, type:'normal', pal:'blue',
        about:'Finish any pending school work, revise this week’s lessons and prepare for the weekly test.', acts:[
        { name:'Finish any pending school work', pts:10, type:'self' },
        { name:'Revise this week’s lessons', pts:15, type:'self' },
        { name:'Practise for the weekly test — enter your marks', pts:0, type:'pct-calc', maxCalcPts:15,
          note:'Enter your marks; the app works out the points (up to 15)' }
      ]},
      { key:'snack1', name:'Fruit, Snacks & Relax', icon:'🍎', mins:60, type:'break', pal:'grey',
        about:'Have some fruit or a snack and relax as you like — you can watch your favourite cartoons.', acts:[] },
      { key:'brain', name:'Brain Lab', icon:'🧠', mins:60, type:'normal', pal:'violet',
        about:'The puzzles are in the Brain Lab tab of this app. Tap a task below to open it — the points come in automatically.', acts:[
        { name:'Brain Lab — Riddle of the day', pts:0, type:'link', tab:'brain', note:'Tap to open the Brain Lab tab' },
        { name:'Brain Lab — Logic puzzles', pts:0, type:'link', tab:'brain', note:'Tap to open the Brain Lab tab' },
        { name:'Brain Lab — Maths Sprint', pts:0, type:'link', tab:'brain', note:'Tap to open the Brain Lab tab' },
        { name:'Brain Lab — Sudoku', pts:0, type:'link', tab:'brain', note:'Tap to open the Brain Lab tab' }
      ]},
      { key:'wlunch', name:'Lunch', icon:'🍱', mins:30, type:'normal', pal:'grey',
        about:'Lunch time. When you finish, put your plate away and clean your table.', acts:[
        { name:'Finish your lunch, put your plate away and clean your table', pts:20, type:'self' }
      ]},
      { key:'reading', name:'Book Reading + New Words', icon:'📚', mins:45, type:'wordbook-inline', pal:'green',
        about:'Read any book you like and add the new words you find to your WordBook — with the meaning and a sentence. You can add words any time of the day: every 3 words earn 10 points.', acts:[
        { name:'Read a book and add new words to your WordBook', pts:10, type:'wordbook',
          note:'10 pts for every 3 words, up to 9 words a day' }
      ]},
      { key:'olympiad', name:'Study Time / Olympiad Practice', icon:'🏅', mins:75, type:'normal', pal:'indigo',
        about:'Go a step beyond school: solve Olympiad practice questions or study something more advanced.', acts:[
        { name:'Solve Olympiad practice questions — enter your marks', pts:0, type:'pct-calc', maxCalcPts:15,
          note:'Enter your marks; the app works out the points (up to 15)' }
      ]},
      { key:'family', name:'Grandparents & Family Time', icon:'👨‍👩‍👧', mins:45, type:'normal', pal:'teal',
        about:'Time with grandparents and family — talk, play a game, or practise a hobby.', acts:[
        { name:'Spend time with your grandparents, or call them', pts:10, type:'self' },
        { name:'Play a game or do something together as a family', pts:10, type:'self' },
        { name:'Practise a hobby — music, dance, art, sport or coding', pts:10, type:'self' }
      ]},
      { key:'snack2', name:'Evening Snack / Milkshake', icon:'🥤', mins:15, type:'break', pal:'grey',
        about:'Have your evening snack or milkshake. No tasks in this block.', acts:[] },
      { key:'play', name:'Outdoor Play', icon:'⚽', mins:90, type:'normal', pal:'green',
        about:'Time outdoors — a sport, cycling or running around. Moving your body keeps your mind fresh.', acts:[
        { name:'Play outside or a sport for 45 minutes', pts:15, type:'self' }
      ]},
      { key:'shloka', name:'Geeta — Shloka & Wisdom', icon:'🕉️', mins:30, type:'normal', pal:'amber',
        about:'Your shlokas are in the Geeta — Soul Work tab of this app. Learn one and what it means, then say it to a parent. Your parent gives the points.', acts:[
        { name:'Learn a shloka and its meaning, then say it to a parent', pts:15, type:'parent',
          note:'Find it in the Geeta — Soul Work tab · your parent gives the points' },
        { name:'Say an old shloka again from memory', pts:5, type:'self' }
      ]},
      { key:'help', name:'Help at Home', icon:'🏠', mins:15, type:'normal', pal:'green',
        about:'Help with a bigger job at home, and tidy your room.', acts:[
        { name:'Help with a bigger job — cleaning, shopping or cooking', pts:15, type:'self' },
        { name:'Tidy your room', pts:10, type:'self' }
      ]},
      { key:'dinner', name:'Dinner', icon:'🍽️', mins:30, type:'normal', pal:'grey',
        about:'Family dinner. When you finish, put your plate away and clean your place at the table.', acts:[
        { name:'Finish your dinner, put your plate away and clean your table', pts:10, type:'self' }
      ]},
      { key:'values', name:'Values & Family Talk', icon:'📿', mins:30, type:'normal', pal:'violet',
        about:'Time with a parent: share one good thing from your day and talk about one good value.', acts:[
        { name:'Tell a parent one good thing you did today', pts:5, type:'self' },
        { name:'Talk about one good value — honesty, kindness or patience', pts:5, type:'self' }
      ]},
      { key:'wind', name:'Get Ready for Bed', icon:'🌙', mins:15, type:'normal', pal:'violet',
        about:'Do your night routine and get ready for bed. End the day by saying “Thank you God” and thanking your parents.', acts:[
        { name:'Keep your uniform, shoes and school bag ready for tomorrow', pts:5, type:'self' },
        { name:'Brush your teeth and wash up', pts:5, type:'self' },
        { name:'Say “Thank you God” and “Thank you” to your parents for today', pts:5, type:'self' }
      ]},
      { key:'sleep', name:'Sleep', icon:'😴', mins:0, type:'break', pal:'grey',
        about:'Lights out. Good sleep helps you grow and remember what you learned.', acts:[] }
    ]
  }
};

// ---------------------------------------------------------------------------
// What each block is for, in one line. Shown to the parent in Timetable Setup
// and to the child under the block's name. A block definition can carry its
// own `about`; otherwise the line for its key is used.
// ---------------------------------------------------------------------------
var NIYAM_BLOCK_ABOUT = {
  school:   'School hours. Nothing to tick here \u2014 the tasks begin after school.',
  lunch:    'Eat, rest and relax after school. No tasks in this block.',
  break1:   'A short break. No tasks.',
  reading:  'Read any book and add the new words you find to your WordBook \u2014 with the meaning and a sentence. You can add words any time of the day: every 3 words earn 10 points.',
  study:    'Finish today\u2019s homework first, then revise what was taught in class.',
  hw:       'Homework, with a parent close by to help.',
  play:     'Time outdoors \u2014 a sport, cycling or running around. Moving the body keeps the mind fresh.',
  play1:    'Time outdoors \u2014 a sport, cycling or running around. Moving the body keeps the mind fresh.',
  brain:    'The puzzles are in the Brain Lab tab of this app. Tap a task below to open it — the points come in automatically.',
  sudoku:   'Sudoku in the Brain Lab, plus a little maths practice from the school book.',
  maths:    'Longer maths practice on a holiday \u2014 chapter questions and Olympiad-style problems.',
  papers:   'Practice papers and writing, to build exam confidence.',
  shloka:   'Your shlokas are in the Geeta — Soul Work tab of this app. Learn one and what it means, then say it to a parent. Your parent gives the points.',
  creative: 'Make something with your own hands \u2014 drawing, craft or music.',
  enrich:   'Learn one new thing beyond school and write a line about it.',
  help:     'Do one job at home without being asked \u2014 lay the table, fold clothes, water the plants.',
  dinner:   'Family dinner. No tasks \u2014 just eat together.',
  values:   'A few quiet minutes on good values: read or talk about one, and think about your day.',
  wind:     'Get ready for bed: pack your bag for tomorrow, brush your teeth, and say \u201cThank you God\u201d for the day.',
  sleep:    'Lights out. Good sleep helps you grow and remember what you learned.',
  rise:     'Wake up, freshen up, make your bed and get ready for the day.',
  puja:     'Morning prayer, a little yoga or stretching, and a healthy breakfast.',
  family:   'Time with family or grandparents \u2014 talk, play a game, or listen to a story.',
  story:    'A parent reads a story, or the child reads one aloud.',
  learn:    'Fun learning \u2014 letters, numbers, or a game that teaches.'
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
    if(a.type === 'wordbook') return s + (parseInt(a.pts) || 0) * 3;   // per 3 words, up to 9 words
    return s + (parseInt(a.pts) || 0) + (parseInt(a.maxCalcPts) || 0);
  }, 0);
}

// Expands compact defs into the block shape the app renders.
// Blocks never run back-to-back: leftover time between the start and the band's
// bedtime is shared out evenly as breathing room, so the last block (Sleep)
// lands on the bedtime the band was designed around.
// exact = true for the class timetables: spare time is shared out evenly
// (times rounded to 5 minutes) and Sleep always sits on the bedtime, so a day
// written to fit, like Class 4's, keeps exactly its written times.
function _niyamExpand(defs, startHour, prefix, bedtime, exact){
  var totalMins = defs.reduce(function(s, d){ return s + (d.mins || 0); }, 0);
  var gaps = Math.max(defs.length - 1, 1);
  var slack = 0;
  if(typeof bedtime === 'number'){
    var spareMins = (bedtime - startHour) * 60 - totalMins;
    slack = Math.max(0, Math.min(exact ? 30 : 20, spareMins / gaps));   // per gap
    if(!exact) slack = Math.floor(slack / 5) * 5;          // keep times on tidy 5-min marks
  }
  var r5 = function(h){ return exact ? Math.round(h * 12) / 12 : h; };
  var cursor = startHour, out = [];
  defs.forEach(function(d, i){
    if(exact && d.key === 'sleep' && typeof bedtime === 'number' && bedtime > cursor) cursor = bedtime;
    var pal = NIYAM_PAL[d.pal] || NIYAM_PAL.grey;
    var acts = (d.acts || []).map(function(a, j){
      var act = { id: prefix + '-' + d.key + (j + 1) };
      for(var k in a) if(Object.prototype.hasOwnProperty.call(a, k)) act[k] = a[k];
      return act;
    });
    var timeTxt = d.mins > 0
      ? _niyamFmt(r5(cursor)) + ' – ' + _niyamFmt(r5(cursor + d.mins / 60))
      : _niyamFmt(r5(cursor));
    out.push({
      id: prefix + '-' + d.key,
      time: timeTxt,
      name: d.name,
      about: d.about || NIYAM_BLOCK_ABOUT[d.key] || '',
      icon: d.icon,
      iconBg: pal.iconBg, iconColor: pal.iconColor, color: pal.color, lightBg: pal.lightBg,
      type: d.type,
      maxPts: _niyamBlockMax(acts),
      unlockHour: Math.round(r5(cursor) * 100) / 100,
      activities: acts
    });
    cursor += (d.mins || 0) / 60 + (d.gap || 0) / 60;
    if(i < defs.length - 1) cursor += slack / 60;
  });
  return out;
}

// ---------------------------------------------------------------------------
// A4.5 — Feature filtering
// Drops activities (and any block left with none) that belong to a feature
// the family switched off on the "What's included" screen. Runs at LOAD time
// (called from ttGetSchedule / Tomorrow's Plan) rather than only once at
// generation time, so a feature toggled off after setup takes effect on the
// very next render — no need to regenerate or resave the timetable.
// ---------------------------------------------------------------------------

// Which feature key (if any) gates a single activity. Returns null for
// activities that are never feature-gated (self, parent/Geeta, pct-calc…).
function niyamActivityFeature(act){
  if(!act) return null;
  // photo/gallery work. A written task (text-entry) stays even without the
  // Gallery: what the child writes is kept with the day for the parent to read.
  if(act.premium === true && act.type !== 'text-entry') return 'creative';
  if(act.type === 'link' && act.tab === 'brain') return 'brainlab';  // covers Sudoku too — same tab
  return null;
}

/**
 * Filter a weekday/weekend block list down to what this family's feature
 * toggles allow. Never mutates the input. A block that started with tasks
 * but has none left after filtering (every task belonged to an off feature)
 * is dropped entirely — there is nothing left in it for the child to do.
 * Blocks with no tasks to begin with (break, school) are always kept.
 * @param {Array} blocks
 * @param {Object} [features]  profile_data.features — missing/undefined key = on
 */
function niyamFilterSchedule(blocks, features){
  if(!Array.isArray(blocks)) return blocks;
  var feats = features || {};
  var out = [];
  blocks.forEach(function(b){
    var before = (b.activities || []);
    var acts = before.filter(function(a){
      var f = niyamActivityFeature(a);
      return !f || feats[f] !== false;   // keep unless the feature is explicitly off
    });
    if(before.length && !acts.length) return;   // nothing left in this block — drop it
    var copy = {};
    for(var k in b) if(Object.prototype.hasOwnProperty.call(b, k)) copy[k] = b[k];
    copy.activities = acts;
    copy.maxPts = _niyamBlockMax(acts);
    out.push(copy);
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
  var n = parseInt(String(cls).replace(/\D/g,''), 10);
  var own = NIYAM_CLASS_DEFS[n];               // a timetable written for this class
  var band = own || NIYAM_BAND_DEFS[bandKey];
  var start = (typeof startHour === 'number' && !isNaN(startHour)) ? startHour : band.defaultStart;

  // School block runs from the morning up to the family's chosen start time.
  var school = {
    id: 'wd-school', time: '6:00 AM – ' + _niyamFmt(start), name: 'School Time', icon: '🏫',
    about: NIYAM_BLOCK_ABOUT.school,
    iconBg: NIYAM_PAL.indigo.iconBg, iconColor: NIYAM_PAL.indigo.iconColor,
    color: NIYAM_PAL.indigo.color, lightBg: NIYAM_PAL.indigo.lightBg,
    type: 'locked-until-3pm', maxPts: 0, unlockHour: 6, activities: []
  };

  return {
    band: own ? ('class' + n) : bandKey,
    label: band.label,
    weekday: [school].concat(own
      ? _niyamExpand(_niyamFitDay(_niyamLunchToAnchor(band, start), start, _niyamWeekdayBedtime(band, start)),
                     start, 'wd', _niyamWeekdayBedtime(band, start), true)
      : _niyamExpand(band.weekday, start, 'wd', band.bedtime)),
    weekend: _niyamExpand(band.weekend, band.weekendStart, 'we', band.weekendBedtime, !!own)
  };
}

// Whatever time school ends, Lunch & Rest lasts until the class's lunchUntil
// time (3:45 PM for Class 4), so the rest of the afternoon keeps its times
// (Pooja, 20 Oct 2026). It is never shorter than 30 minutes: a later school
// end shifts the rest of the day instead.
function _niyamLunchToAnchor(def, start){
  var list = def.weekday || [];
  if(typeof def.lunchUntil !== 'number' || !list.length || list[0].key !== 'lunch') return list;
  var mins = Math.max(30, Math.round((def.lunchUntil - start) * 60));
  var copy = list.slice();
  copy[0] = Object.assign({}, list[0], { mins: mins });
  return copy;
}

// When the day after school is longer than the time to bedtime, shorten the
// blocks that can be shorter (those with a `min`), five minutes at a time from
// the one with most room, until it fits. Blocks without a `min` never shrink.
function _niyamFitDay(list, start, bedtime){
  var avail = Math.round((bedtime - start) * 60);
  var copy = list.map(function(d){ return Object.assign({}, d); });
  var total = function(){ return copy.reduce(function(s, d){ return s + (d.mins || 0); }, 0); };
  var guard = 500;
  while(total() > avail && guard-- > 0){
    var best = null;
    copy.forEach(function(d){
      if(typeof d.min !== 'number' || d.mins - 5 < d.min) return;
      if(!best || (d.mins - d.min) > (best.mins - best.min)) best = d;
    });
    if(!best) break;                             // nothing left to shorten
    best.mins -= 5;
  }
  return copy;
}
// Bedtime for a school day: later (never beyond lateBedtime) when school ends late.
function _niyamWeekdayBedtime(def, start){
  if(typeof def.lateFrom === 'number' && typeof def.lateBedtime === 'number' && start >= def.lateFrom) return def.lateBedtime;
  return def.bedtime;
}

// Total points a perfect day is worth — used by the preview screen.
function niyamDayMax(blocks){
  return (blocks || []).reduce(function(s, b){ return s + (parseInt(b.maxPts) || 0); }, 0);
}

// The built-in timetable (data/timetable.js) starts empty. Until the family's
// profile is loaded, it holds a general Class 6 day; js/00-shell.js then
// replaces it with the child's own class.
if(typeof TT_WEEKDAY !== 'undefined' && !TT_WEEKDAY.length){
  (function(){
    var g = niyamBuildTimetable('Class 6', 15);
    Array.prototype.push.apply(TT_WEEKDAY, g.weekday);
    Array.prototype.push.apply(TT_WEEKEND, g.weekend);
  })();
}

if(typeof window !== 'undefined'){
  window.NIYAM_BAND_DEFS      = NIYAM_BAND_DEFS;
  window.NIYAM_CLASS_DEFS     = NIYAM_CLASS_DEFS;
  window.niyamBandForClass    = niyamBandForClass;
  window.niyamBuildTimetable  = niyamBuildTimetable;
  window.niyamDayMax          = niyamDayMax;
  window.niyamFilterSchedule  = niyamFilterSchedule;
}
