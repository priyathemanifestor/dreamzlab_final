// Client-side calendar export — no backend needed.
//
// buildICSForDream(): generates a real .ics (iCalendar) file with one
// all-day VEVENT per milestone that has a due date. Works with Google
// Calendar (File > Import), Apple Calendar, Outlook, and any other
// calendar app that supports the standard iCalendar format.
//
// googleCalendarQuickAddUrl(): builds a "create event" deep link for a
// single milestone, for one-off adds without downloading a file.

function icsDateFromYMD(ymd) {
  // 'YYYY-MM-DD' -> 'YYYYMMDD' (all-day event date format in iCalendar)
  return ymd.replace(/-/g, '');
}

function nextDay(ymd) {
  const d = new Date(ymd + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function escapeICSText(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function nowStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function buildICSForDream(dream) {
  const withDates = dream.milestones.filter((m) => m.dueDate);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DreamzLab//Milestones//EN', 'CALSCALE:GREGORIAN'];

  withDates.forEach((m) => {
    const start = icsDateFromYMD(m.dueDate);
    const end = nextDay(m.dueDate); // DTEND is exclusive for all-day events
    lines.push(
      'BEGIN:VEVENT',
      `UID:${m.id}@dreamzlab`,
      `DTSTAMP:${nowStamp()}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeICSText(m.text)}`,
      `DESCRIPTION:${escapeICSText('Milestone for dream: ' + dream.title)}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(dream) {
  const ics = buildICSForDream(dream);
  const withDates = dream.milestones.filter((m) => m.dueDate);
  if (withDates.length === 0) return false;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${dream.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-milestones.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
  return true;
}

export function googleCalendarQuickAddUrl(milestone, dreamTitle) {
  const start = icsDateFromYMD(milestone.dueDate);
  const end = nextDay(milestone.dueDate);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: milestone.text,
    dates: `${start}/${end}`,
    details: `Milestone for dream: ${dreamTitle}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
