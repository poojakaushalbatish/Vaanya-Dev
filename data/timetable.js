const TT_WEEKDAY = [

  // ── 6:00 AM – 3:00 PM — SCHOOL ──────────────────────────────
  {
    id:'wd-school', time:'6:00 AM – 3:00 PM', name:'School Time', icon:'🏫',
    iconBg:'#EEF2FF', iconColor:'#4F46E5', color:'#4F46E5', lightBg:'#EEF2FF',
    type:'locked-until-3pm', maxPts:0,
    activities:[]
  },

  // ── 3:00 PM – 3:30 PM — LUNCH + SCREEN ──────────────────────
  {
    id:'wd-lunch', time:'3:00 PM – 3:30 PM', name:'Lunch & Screen Time', icon:'🍱',
    iconBg:'#F9FAFB', iconColor:'#6B7280', color:'#6B7280', lightBg:'#F9FAFB',
    type:'break', maxPts:0, unlockHour:15.0,
    activities:[]
  },

  // ── 3:30 PM – 4:00 PM — BOOK READING + WORDBOOK ─────────────
  {
    id:'wd-reading', time:'3:30 PM – 4:00 PM', name:'Book Reading + New Words', icon:'📚',
    iconBg:'#ECFDF5', iconColor:'#059669', color:'#059669', lightBg:'#ECFDF5',
    type:'wordbook-inline', maxPts:10, unlockHour:15.5,
    activities:[
      {id:'wd-rd1', name:'Book Reading + Add 3 new words to Wordbook', pts:10, type:'wordbook', note:'10 pts when all 3 words are added with meaning & sentence'},
    ]
  },

  // ── 4:00 PM – 6:00 PM — HOMEWORK + STUDY ────────────────────
  {
    id:'wd-study', time:'4:00 PM – 6:00 PM', name:'Homework & Self Study', icon:'✏️',
    iconBg:'#EFF6FF', iconColor:'#2563EB', color:'#2563EB', lightBg:'#EFF6FF',
    type:'normal', maxPts:62, unlockHour:16.0,
    activities:[
      {id:'wd-st1', name:'Homework',                      pts:0,  type:'self',   note:'No pts — must be done every day 📚'},
      {id:'wd-st2', name:'Brain Lab — Maths Sprint',      pts:0,  type:'link',   tab:'brain', note:'→ Brain Lab · pts pulled from there'},
      {id:'wd-st3', name:'Brain Lab — Logic',             pts:0,  type:'link',   tab:'brain', note:'→ Brain Lab · pts pulled from there'},
      {id:'wd-st4', name:'Brain Lab — Sudoku',            pts:0,  type:'link',   tab:'brain', note:'→ Brain Lab · pts pulled from there'},
      {id:'wd-st5', name:'Self Study',                    pts:7,  type:'self'},
      {id:'wd-st6', name:'Olympiad Practice & Papers',    pts:0,  type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts'},
      {id:'wd-ws1', name:'Worksheet 1',                   pts:0,  type:'pct-calc', maxCalcPts:10, note:'App calculates pts from % — max 10 pts'},
      {id:'wd-ws2', name:'Worksheet 2',                   pts:0,  type:'pct-calc', maxCalcPts:10, note:'App calculates pts from % — max 10 pts'},
    ]
  },

  // ── 6:00 PM – 6:45 PM — OUTDOOR ─────────────────────────────
  {
    id:'wd-outdoor', time:'6:00 PM – 6:45 PM', name:'Outdoor Playing with Kinnu', icon:'⚽',
    iconBg:'#ECFDF5', iconColor:'#059669', color:'#059669', lightBg:'#ECFDF5',
    type:'normal', maxPts:7, unlockHour:18.0,
    activities:[
      {id:'wd-ou1', name:'Outdoor playing with Kinnu', pts:7, type:'self'},
    ]
  },

  // ── 6:50 PM – 8:00 PM — ODDA ────────────────────────────────
  {
    id:'wd-odda', time:'6:50 PM – 8:00 PM', name:'Odda Class + Dinner', icon:'💻',
    iconBg:'#F3EFFE', iconColor:'#7C3AED', color:'#7C3AED', lightBg:'#F3EFFE',
    type:'normal', maxPts:20, unlockHour:18.83,
    activities:[
      {id:'wd-od1', name:'Odda Class + Assignment',                        pts:10, type:'self'},
      {id:'wd-od5', name:'Dinner',                                         pts:0,  type:'self', note:'No pts — nourish yourself! 🍽️'},
      {id:'wd-od2', name:'No Odda — Read about AI and make notes',         pts:5,  type:'text-entry', entryKey:'ai_notes', saveTo:'gallery', galleryKey:'ai_notes', note:'Write your AI learning notes here'},
      {id:'wd-od3', name:'No Odda — Read about Ayurvedic herbs + notes',   pts:5,  type:'text-entry', entryKey:'ayurvedic_notes', saveTo:'gallery', galleryKey:'ayurvedic_notes', note:'Write your Ayurvedic herbs notes here'},
      {id:'wd-od4', name:'No Odda — Read about Vedas and make notes',      pts:5,  type:'text-entry', entryKey:'vedas_notes', saveTo:'gallery', galleryKey:'vedas_notes', note:'Write your Vedas learning notes here'},
    ]
  },

  // ── 8:00 PM – 9:00 PM — EVENING ENRICHMENT ──────────────────
  {
    id:'wd-enrich', time:'8:00 PM – 9:00 PM', name:'Evening Enrichment', icon:'⭐',
    iconBg:'#FDF2F8', iconColor:'#DB2777', color:'#DB2777', lightBg:'#FDF2F8',
    type:'normal', maxPts:55, unlockHour:20.0,
    activities:[
      {id:'wd-e1', name:'Kathak class',                                         pts:10, type:'self'},
      {id:'wd-e2', name:'Maths Practice — Solve 10 complex questions',          pts:0,  type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts'},
      {id:'wd-e5', name:'Questionnaire — 10 Questions',                         pts:0,  type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts'},
      {id:'wd-e3', name:'Odda class + make notes',                              pts:5,  type:'self'},
      {id:'wd-e6', name:'Learn one FACT from Indian History and make notes',    pts:10, type:'text-entry', entryKey:'indian_history', saveTo:'gallery', galleryKey:'interesting_facts', note:'Write the historical fact and what you learned'},
      {id:'wd-e4', name:'Any school activity / preparation',                    pts:0,  type:'self', note:'No pts — but important! ✅'},
      {id:'wd-e7', name:'Creative Task',                                          pts:0,  type:'parent-select', maxCalcPts:20, note:'Parents award up to 20 pts on review · No points added from this page'},
    ]
  },

  // ── 9:00 PM – 9:15 PM — VALUES & REFLECTION ─────────────────
  {
    id:'wd-values', time:'9:00 PM – 9:15 PM', name:'Values & Reflection', icon:'📿',
    iconBg:'#F0FDF4', iconColor:'#065F46', color:'#065F46', lightBg:'#F0FDF4',
    type:'normal', maxPts:10, unlockHour:21.0,
    activities:[
      {id:'wd-v1', name:'Read Moral Values Book — 1 chapter + explain', pts:5, type:'text-entry', entryKey:'moral_values', saveTo:'gallery', galleryKey:'moral_values', note:'Write what you learned from this chapter'},
      {id:'wd-v2', name:'Solve questionnaire by parents',                pts:0, type:'pct-calc', maxCalcPts:10, note:'App calculates pts from % — max 10 pts'},
    ]
  },

  // ── 9:15 PM – 9:30 PM — WIND-DOWN ───────────────────────────
  {
    id:'wd-wind', time:'9:15 PM – 9:30 PM', name:'Wind-Down Routine', icon:'🌙',
    iconBg:'#F0F4FF', iconColor:'#4F46E5', color:'#4F46E5', lightBg:'#F0F4FF',
    type:'normal', maxPts:27, unlockHour:21.25,
    activities:[
      {id:'wd-w1', name:'Shloka reciting to parents',  pts:0,  type:'parent', note:'⏳ Parents award pts on review'},
      {id:'wd-w2', name:'Daily gratitude journal',     pts:5,  type:'self'},
      {id:'wd-w3', name:'Everything done on time',     pts:7,  type:'self'},
      {id:'wd-w4', name:'Night Routine completed',     pts:8,  type:'self'},
    ]
  },

  // ── 9:30 PM — SLEEP ─────────────────────────────────────────
  {
    id:'wd-sleep', time:'9:30 PM', name:'Sleep', icon:'😴',
    iconBg:'#F9FAFB', iconColor:'#6B7280', color:'#6B7280', lightBg:'#F9FAFB',
    type:'break', maxPts:0, unlockHour:21.5,
    activities:[]
  },
];

const TT_WEEKEND = [

  // ── 7:00 AM – 9:00 AM ───────────────────────────────────────
  {
    id:'we-morning', time:'7:00 AM – 9:00 AM', name:'Rise & Morning Routine', icon:'🌅',
    iconBg:'#FFFBEB', iconColor:'#D97706', color:'#D97706', lightBg:'#FFFBEB',
    type:'normal', maxPts:15, unlockHour:7,
    activities:[
      {id:'we-m1', name:'Rise on time',                           pts:5,  type:'self'},
      {id:'we-m2', name:'Outdoor + RSS Shaka',                    pts:5,  type:'self'},
      {id:'we-m3', name:'Get Ready',                              pts:0,  type:'self', note:'No pts — just do it! 💪'},
    ]
  },

  // ── 9:00 AM – 10:00 AM ──────────────────────────────────────
  {
    id:'we-puja', time:'9:00 AM – 10:00 AM', name:'Morning Puja & Wellness', icon:'🪔',
    iconBg:'#FFF7ED', iconColor:'#EA580C', color:'#EA580C', lightBg:'#FFF7ED',
    type:'normal', maxPts:20, unlockHour:9,
    activities:[
      {id:'we-p1', name:'Puja + Mandir + Surya Jal Arpan + Yoga Asana', pts:10, type:'self'},
      {id:'we-p2', name:'Set your Almirah',                              pts:5,  type:'self'},
      {id:'we-p3', name:'Set your Room',                                 pts:5,  type:'self'},
      {id:'we-p4', name:'Breakfast',                                     pts:0,  type:'self', note:'No pts — nourish yourself! 🍽️'},
    ]
  },

  // ── 10:00 AM – 12:00 PM ─────────────────────────────────────
  {
    id:'we-maths', time:'10:00 AM – 12:00 PM', name:'Maths Deep Practice', icon:'📐',
    iconBg:'#EFF6FF', iconColor:'#2563EB', color:'#2563EB', lightBg:'#EFF6FF',
    type:'normal', maxPts:30, unlockHour:10,
    activities:[
      {id:'we-ma1', name:'Practice Maths',                pts:10, type:'self'},
      {id:'we-ma2', name:'Maths Olympiad questions',      pts:0,  type:'pct-calc', maxCalcPts:10,  note:'App calculates pts from % — max 10 pts'},
      {id:'we-ma3', name:'Brain Lab — Maths Sprint',      pts:0,  type:'link',   tab:'brain', note:'→ Brain Lab · pts pulled from there'},
      {id:'we-ma4', name:'Brain Lab — Logic puzzles',     pts:0,  type:'link',   tab:'brain', note:'→ Brain Lab · pts pulled from there'},
      {id:'we-ma5', name:'Complex maths practice',        pts:0,  type:'pct-calc', maxCalcPts:15,  note:'App calculates pts from % — max 15 pts'},
    ]
  },

  // ── 12:00 PM – 12:30 PM — BREAK ─────────────────────────────
  {
    id:'we-break1', time:'12:00 PM – 12:30 PM', name:'Break', icon:'☕',
    iconBg:'#F9FAFB', iconColor:'#6B7280', color:'#6B7280', lightBg:'#F9FAFB',
    type:'break', maxPts:0, unlockHour:12, activities:[]
  },

  // ── 12:30 PM – 2:00 PM ──────────────────────────────────────
  {
    id:'we-study1', time:'12:30 PM – 2:00 PM', name:'Self Study Block', icon:'📖',
    iconBg:'#F0FDF4', iconColor:'#059669', color:'#059669', lightBg:'#F0FDF4',
    type:'normal', maxPts:80, unlockHour:12.5,
    activities:[
      {id:'we-ss1', name:'Self Study — Maths',   pts:10, type:'self'},
      {id:'we-ss2', name:'Self Study — English', pts:10, type:'self'},
      {id:'we-ss3', name:'Self Study — Science', pts:10, type:'self'},
      {id:'we-ss4', name:'Self Study — Hindi',   pts:10, type:'self'},
      {id:'we-ss5', name:'Self Study — SST',     pts:10, type:'self'},
      {id:'we-ws1', name:'Worksheet 1',          pts:0,  type:'pct-calc', maxCalcPts:10, note:'App calculates pts from % — max 10 pts'},
      {id:'we-ws2', name:'Worksheet 2',          pts:0,  type:'pct-calc', maxCalcPts:10, note:'App calculates pts from % — max 10 pts'},
      {id:'we-ws3', name:'Worksheet 3',          pts:0,  type:'pct-calc', maxCalcPts:10, note:'App calculates pts from % — max 10 pts'},
    ]
  },

  // ── 2:00 PM – 2:30 PM — BREAK + LUNCH ──────────────────────
  {
    id:'we-lunch', time:'2:00 PM – 2:30 PM', name:'Break + Lunch Time', icon:'🍱',
    iconBg:'#F9FAFB', iconColor:'#6B7280', color:'#6B7280', lightBg:'#F9FAFB',
    type:'break', maxPts:0, unlockHour:14.0, activities:[]
  },

  // ── 2:30 PM – 4:00 PM ───────────────────────────────────────
  {
    id:'we-papers', time:'2:30 PM – 4:00 PM', name:'Practice Papers & Writing', icon:'✍️',
    iconBg:'#F5F3FF', iconColor:'#7C3AED', color:'#7C3AED', lightBg:'#F5F3FF',
    type:'normal', maxPts:45, unlockHour:14.5,
    activities:[
      {id:'we-pp1', name:'Practice Papers — Any Subject',     pts:0, type:'pct-calc', maxCalcPts:10, note:'App calculates pts from % — max 10 pts'},
      {id:'we-pp2', name:'Olympiad Papers solve',             pts:0, type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts'},
      {id:'we-pp3', name:'English Paragraph / Story Writing', pts:0, type:'dropdown', options:[3,5,7,10], note:'Select points based on quality'},
      {id:'we-pp4', name:'Spoken English & Debate Practice',  pts:0, type:'dropdown', options:[3,5,7,10], note:'Select points based on quality'},
    ]
  },

  // ── 4:00 PM – 4:30 PM — BOOK READING + WORDBOOK ────────────
  {
    id:'we-reading', time:'4:00 PM – 4:30 PM', name:'Book Reading + New Words', icon:'📚',
    iconBg:'#ECFDF5', iconColor:'#059669', color:'#059669', lightBg:'#ECFDF5',
    type:'wordbook-inline', maxPts:10, unlockHour:16.0,
    activities:[
      {id:'we-rd1', name:'Book Reading + Add 3 new words to Wordbook', pts:10, type:'wordbook', note:'10 pts when all 3 words are added with meaning & sentence'},
    ]
  },

  // ── 4:30 PM – 5:00 PM — SHLOKA & PROVERB ───────────────────
  {
    id:'we-shloka', time:'4:30 PM – 5:00 PM', name:'Shloka & Wisdom', icon:'🕉️',
    iconBg:'#F0FDF4', iconColor:'#065F46', color:'#065F46', lightBg:'#F0FDF4',
    type:'normal', maxPts:35, unlockHour:16.5,
    activities:[
      {id:'we-sh1', name:'Shloka learning & writing in copy',              pts:25, type:'parent', note:'⏳ Parents award pts on Parents Review · 25 pts for full mastery'},
      {id:'we-sh2', name:'Learn a proverb by a famous writer',             pts:10, type:'text-entry', entryKey:'proverb', saveTo:'gallery', galleryKey:'proverb', note:'Write the proverb and what it means to you'},
    ]
  },

  // ── 5:00 PM – 6:00 PM — BRAIN + FOCUS ──────────────────────
  {
    id:'we-brain', time:'5:00 PM – 6:00 PM', name:'Brain Lab + Focus Time', icon:'🧠',
    iconBg:'#FFFBEB', iconColor:'#D97706', color:'#D97706', lightBg:'#FFFBEB',
    type:'normal', maxPts:21, unlockHour:17,
    activities:[
      {id:'we-br1', name:'Brain Lab — Sudoku',                    pts:0,  type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there'},
      {id:'we-br2', name:'Brain Lab — Riddles',                   pts:0,  type:'link', tab:'brain', note:'→ Brain Lab · pts pulled from there'},
      {id:'we-br3', name:'Silence of 7 mins — Focus on thoughts', pts:7,  type:'self'},
      {id:'we-br4', name:'Make Kinnu learn a new thing',           pts:7,  type:'self'},
      {id:'we-br5', name:'Worksheet solve',                        pts:0,  type:'pct-calc', maxCalcPts:15, note:'App calculates pts from % — max 15 pts'},
    ]
  },

  // ── 6:00 PM – 6:50 PM — OUTDOOR ─────────────────────────────
  {
    id:'we-outdoor', time:'6:00 PM – 6:50 PM', name:'Outdoor Playing', icon:'🌳',
    iconBg:'#ECFDF5', iconColor:'#059669', color:'#059669', lightBg:'#ECFDF5',
    type:'normal', maxPts:7, unlockHour:18.0,
    activities:[
      {id:'we-ou1', name:'Outdoor playing', pts:7, type:'self'},
    ]
  },

  // ── 6:50 PM – 8:00 PM — ODDA ────────────────────────────────
  {
    id:'we-odda', time:'6:50 PM – 8:00 PM', name:'Odda Class + Dinner', icon:'💻',
    iconBg:'#F3EFFE', iconColor:'#7C3AED', color:'#7C3AED', lightBg:'#F3EFFE',
    type:'normal', maxPts:20, unlockHour:18.83,
    activities:[
      {id:'we-od1', name:'Odda Class + Assignment',                        pts:10, type:'self'},
      {id:'we-od5', name:'Dinner',                                         pts:0,  type:'self', note:'No pts — nourish yourself!'},
      {id:'we-od2', name:'No Odda — Read about AI and make notes',         pts:5,  type:'text-entry', entryKey:'ai_notes', saveTo:'gallery', galleryKey:'ai_notes', note:'Write your AI learning notes here'},
      {id:'we-od3', name:'No Odda — Read about Ayurvedic herbs + notes',   pts:5,  type:'text-entry', entryKey:'ayurvedic_notes', saveTo:'gallery', galleryKey:'ayurvedic_notes', note:'Write your Ayurvedic herbs notes here'},
      {id:'we-od4', name:'No Odda — Read about Vedas and make notes',      pts:5,  type:'text-entry', entryKey:'vedas_notes', saveTo:'gallery', galleryKey:'vedas_notes', note:'Write your Vedas learning notes here'},
    ]
  },

  // ── 8:00 PM – 9:00 PM — EVENING ENRICHMENT ──────────────────
  {
    id:'we-enrich', time:'8:00 PM – 9:00 PM', name:'Evening Enrichment', icon:'⭐',
    iconBg:'#FDF2F8', iconColor:'#DB2777', color:'#DB2777', lightBg:'#FDF2F8',
    type:'normal', maxPts:25, unlockHour:20,
    activities:[
      {id:'we-en1', name:'Kathak class',                                      pts:10, type:'self'},
      {id:'we-en2', name:'Maths Practice — Solve 10 complex questions',       pts:0,  type:'pct-calc', maxCalcPts:20, note:'App calculates pts from % — max 20 pts'},
      {id:'we-en3', name:'Odda class + make notes',                           pts:5,  type:'self'},
      {id:'we-en4', name:'Learn one FACT from Indian History and make notes',  pts:10, type:'text-entry', entryKey:'indian_history', saveTo:'gallery', galleryKey:'interesting_facts', note:'Write the historical fact and what you learned'},
      {id:'we-en5', name:'Creative Task',                                         pts:0,  type:'parent-select', maxCalcPts:20, note:'Parents award up to 20 pts on review · No points added from this page'},
    ]
  },

  // ── 9:00 PM – 9:15 PM — EVENING WIND DOWN ───────────────────
  {
    id:'we-values', time:'9:00 PM – 9:15 PM', name:'Values & Reflection', icon:'📿',
    iconBg:'#F0FDF4', iconColor:'#065F46', color:'#065F46', lightBg:'#F0FDF4',
    type:'normal', maxPts:10, unlockHour:21.0,
    activities:[
      {id:'we-v1', name:'Read Moral Values Book — 1 chapter + explain', pts:5, type:'text-entry', entryKey:'moral_values', saveTo:'gallery', galleryKey:'moral_values', note:'Write what you learned from this chapter'},
      {id:'we-v2', name:'Solve questionnaire by parents',                pts:0, type:'pct-calc', maxCalcPts:10, note:'App calculates pts from % — max 10 pts'},
    ]
  },

  // ── 9:15 PM – 9:30 PM — WIND-DOWN ──────────────────────────
  {
    id:'we-wind', time:'9:15 PM – 9:30 PM', name:'Wind-Down Routine', icon:'🌙',
    iconBg:'#F0F4FF', iconColor:'#4F46E5', color:'#4F46E5', lightBg:'#F0F4FF',
    type:'normal', maxPts:27, unlockHour:21.25,
    activities:[
      {id:'we-w1', name:'Shloka reciting to parents',  pts:0,  type:'parent', note:'⏳ Parents award pts on review'},
      {id:'we-w2', name:'Daily gratitude journal',     pts:5,  type:'self'},
      {id:'we-w3', name:'Everything done on time',     pts:7,  type:'self'},
      {id:'we-w4', name:'Night Routine completed',     pts:8,  type:'self'},
    ]
  },

  // ── 9:30 PM — SLEEP ─────────────────────────────────────────
  {
    id:'we-sleep', time:'9:30 PM', name:'Sleep', icon:'😴',
    iconBg:'#F9FAFB', iconColor:'#6B7280', color:'#6B7280', lightBg:'#F9FAFB',
    type:'break', maxPts:0, unlockHour:21,
    activities:[]
  },
];
