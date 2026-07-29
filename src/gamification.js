// Streak tracking logic. Pure functions so they're easy to test and reason
// about; App.jsx wires this into state.

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, local calendar day is close enough here
}

function daysBetween(a, b) {
  const d1 = new Date(a + 'T00:00:00');
  const d2 = new Date(b + 'T00:00:00');
  return Math.round((d2 - d1) / 86400000);
}

// Call once on app load with the persisted streak object ({ count, lastActiveDate } | null).
// Returns { streak: {count, lastActiveDate}, streakEvent } where streakEvent
// is 'continued' | 'started' | 'broken' | 'same-day'.
export function updateStreakOnVisit(prevStreak) {
  const today = todayStr();

  if (!prevStreak || !prevStreak.lastActiveDate) {
    return { streak: { count: 1, lastActiveDate: today }, streakEvent: 'started' };
  }

  const gap = daysBetween(prevStreak.lastActiveDate, today);

  if (gap === 0) {
    // Already counted today
    return { streak: prevStreak, streakEvent: 'same-day' };
  }

  if (gap === 1) {
    return { streak: { count: prevStreak.count + 1, lastActiveDate: today }, streakEvent: 'continued' };
  }

  // Missed a day or more — streak resets
  return { streak: { count: 1, lastActiveDate: today }, streakEvent: 'broken' };
}
