// ============================================================================
// NIYAM — data/timetable.js
// The built-in timetable: what a child sees when the family has no saved
// timetable, and what "Use suggested timetable" in Timetable Setup goes back to.
//
// It used to hold one family's own day (the first test family's).
// That is gone (15 Oct 2026). The two lists start empty:
//   * data/timetable-bands.js fills them with a general Class 6 day, and
//   * js/00-shell.js refills them with the child's own class timetable as soon
//     as the family's profile is loaded.
// Other files only ever read these lists, so they always get the child's class.
// ============================================================================
const TT_WEEKDAY = [];
const TT_WEEKEND = [];
