
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
    bedtime: 21,                // 9:00 PM
    weekendStart: 7,            // 7:00 AM
    weekendBedtime: 21,         // 9:00 PM
    weekday: [
      { key:'lunch', name:'Lunch & Rest', icon:'🍱', mins:45, type:'break', pal:'grey',
        about:'Eat your lunch, rest and relax after school. No tasks in this block.', acts:[] },
      { key:'homework', name:'Homework', icon:'✏️', mins:75, type:'normal', pal:'blue',
        about:'Finish today’s school homework first, then spend a little time on self-study.', acts:[
        { name:'Finish today’s school homework', pts:15, type:'self' },
        { name:'Self-study: read over today’s lessons', pts:10, type:'self' }
      ]},
      { key:'reading', name:'Book Reading + New Words', icon:'📚', mins:30, type:'wordbook-inline', pal:'green',
        about:'Read any book you like, then add 3 new words you found to your WordBook — with the meaning and a sentence.', acts:[
        { name:'Read a book and add 3 new words to your WordBook', pts:20, type:'wordbook',
          note:'20 pts when all 3 words have a meaning and a sentence' }
      ]},
      { key:'play', name:'Outdoor Play', icon:'⚽', mins:60, type:'normal', pal:'green',
        about:'Time outdoors — a sport, cycling or running around. Moving your body keeps your mind fresh.', acts:[
        { name:'Play outside or a sport for 30 minutes', pts:10, type:'self' }
      ]},
      { key:'brain', name:'Brain Lab', icon:'🧠', mins:30, type:'normal', pal:'violet',
        about:'Short puzzles in the Brain Lab tab. The points come from there automatically.', acts:[
        { name:'Brain Lab — Riddle of the day', pts:0, type:'link', tab:'brain', note:'Play it in the Brain Lab tab' },
        { name:'Brain Lab — Maths Sprint', pts:0, type:'link', tab:'brain', note:'Play it in the Brain Lab tab' }
      ]},
      { key:'shloka', name:'Geeta — Shloka & Meaning', icon:'🕉️', mins:30, type:'normal', pal:'amber',
        about:'Learn one Geeta shloka and what it means, then say it to a parent. Your parent gives the points.', acts:[
        { name:'Learn a shloka and its meaning, then say it to a parent', pts:15, type:'parent',
          note:'Your parent gives the points' }
      ]},
      { key:'help', name:'Help at Home', icon:'🏠', mins:15, type:'normal', pal:'green',
        about:'Do one job at home without being asked — lay the table, fold clothes, water the plants.', acts:[
        { name:'Do one job at home without being asked', pts:10, type:'self' }
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
        about:'Puzzles in the Brain Lab tab. The points come from there automatically.', acts:[
        { name:'Brain Lab — Riddle of the day', pts:0, type:'link', tab:'brain', note:'Play it in the Brain Lab tab' },
        { name:'Brain Lab — Logic puzzles', pts:0, type:'link', tab:'brain', note:'Play it in the Brain Lab tab' },
        { name:'Brain Lab — Maths Sprint', pts:0, type:'link', tab:'brain', note:'Play it in the Brain Lab tab' },
        { name:'Brain Lab — Sudoku', pts:0, type:'link', tab:'brain', note:'Play it in the Brain Lab tab' }
      ]},
      { key:'wlunch', name:'Lunch', icon:'🍱', mins:30, type:'normal', pal:'grey',
        about:'Lunch time. When you finish, put your plate away and clean your table.', acts:[
        { name:'Finish your lunch, put your plate away and clean your table', pts:20, type:'self' }
      ]},
      { key:'reading', name:'Book Reading + New Words', icon:'📚', mins:45, type:'wordbook-inline', pal:'green',
        about:'Read any book you like, then add 3 new words you found to your WordBook — with the meaning and a sentence.', acts:[
        { name:'Read a book and add 3 new words to your WordBook', pts:20, type:'wordbook',
          note:'20 pts when all 3 words have a meaning and a sentence' }
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
        about:'Learn one Geeta shloka and what it means, then say it to a parent. Your parent gives the points.', acts:[
        { name:'Learn a shloka and its meaning, then say it to a parent', pts:15, type:'parent',
          note:'Your parent gives the points' },
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
