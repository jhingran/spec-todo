/**
 * Due date parsing for free-form todo text.
 *
 * Handles patterns like:
 *   "call AT&T by April 6th"
 *   "run 5 miles this weekend"
 *   "dentist tomorrow"
 *   "groceries today"
 *   "meeting next Monday"
 *   "submit report by Friday"
 */

const MONTHS = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

const WEEKDAYS = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

/** Return a Date set to the start of today (local midnight). */
function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Add `n` days to a Date and return a new Date. */
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Return the next occurrence of `targetWeekday` (0=Sun) at or after `from`. */
function nextWeekday(from, targetWeekday) {
  const d = new Date(from);
  const diff = (targetWeekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
  return d;
}

/** Format a Date as ISO YYYY-MM-DD string. */
function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Attempt to parse a due date from a free-form string.
 * Returns { cleanText, dueDate } where:
 *   - cleanText: original text with date phrase stripped (or unchanged if no date found)
 *   - dueDate: ISO date string (YYYY-MM-DD) or null
 */
function parseDueDate(text) {
  const lower = text.toLowerCase();
  let dueDate = null;
  let matchedPhrase = null;

  // Helper: try a regex against lower, record matched phrase if found
  function tryMatch(pattern) {
    const m = lower.match(pattern);
    return m || null;
  }

  // ── Relative keywords ──────────────────────────────────────────────────────

  if (/\btoday\b/.test(lower)) {
    dueDate = toISODate(today());
    matchedPhrase = /\btoday\b/;
  } else if (/\btomorrow\b/.test(lower)) {
    dueDate = toISODate(addDays(today(), 1));
    matchedPhrase = /\btomorrow\b/;
  } else if (/\bthis\s+weekend\b/.test(lower)) {
    // "this weekend" → next Saturday
    dueDate = toISODate(nextWeekday(today(), 6));
    matchedPhrase = /\bthis\s+weekend\b/;
  } else if (/\bnext\s+weekend\b/.test(lower)) {
    // "next weekend" → Saturday of the week after next
    const nextSat = nextWeekday(today(), 6);
    dueDate = toISODate(addDays(nextSat, 7));
    matchedPhrase = /\bnext\s+weekend\b/;
  } else {
    // ── "next <weekday>" ──────────────────────────────────────────────────────
    const nextWdMatch = tryMatch(/\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/);
    if (nextWdMatch) {
      const wdName = nextWdMatch[1];
      const wdNum = WEEKDAYS[wdName];
      const nextOccurrence = nextWeekday(today(), wdNum);
      // "next Monday" should skip the immediate next occurrence and go a week further
      dueDate = toISODate(addDays(nextOccurrence, 7));
      matchedPhrase = new RegExp(`\\bnext\\s+${escapeRegex(nextWdMatch[1])}\\b`);
    } else {
      // ── "by/on <weekday>" or just "<weekday>" ─────────────────────────────
      const wdMatch = tryMatch(/\b(?:by\s+|on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/);
      if (wdMatch) {
        const wdName = wdMatch[1];
        const wdNum = WEEKDAYS[wdName];
        dueDate = toISODate(nextWeekday(today(), wdNum));
        matchedPhrase = new RegExp(`\\b(?:by\\s+|on\\s+)?${escapeRegex(wdMatch[1])}\\b`);
      } else {
        // ── "by/on <Month> <day>[st|nd|rd|th]" ────────────────────────────────
        const monthDayMatch = tryMatch(
          /\b(?:by\s+|on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/
        );
        if (monthDayMatch) {
          const monthNum = MONTHS[monthDayMatch[1]];
          const day = parseInt(monthDayMatch[2], 10);
          const t = today();
          let year = t.getFullYear();
          // If this month/day has already passed this year, use next year
          const candidate = new Date(year, monthNum, day);
          if (candidate < t) year += 1;
          dueDate = toISODate(new Date(year, monthNum, day));
          matchedPhrase = new RegExp(
            `\\b(?:by\\s+|on\\s+)?${escapeRegex(monthDayMatch[1])}\\s+${monthDayMatch[2]}(?:st|nd|rd|th)?\\b`
          );
        } else {
          // ── "<day>[st|nd|rd|th] <Month>" ──────────────────────────────────
          const dayMonthMatch = tryMatch(
            /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/
          );
          if (dayMonthMatch) {
            const day = parseInt(dayMonthMatch[1], 10);
            const monthNum = MONTHS[dayMonthMatch[2]];
            const t = today();
            let year = t.getFullYear();
            const candidate = new Date(year, monthNum, day);
            if (candidate < t) year += 1;
            dueDate = toISODate(new Date(year, monthNum, day));
            matchedPhrase = new RegExp(
              `\\b${dayMonthMatch[1]}(?:st|nd|rd|th)?\\s+${escapeRegex(dayMonthMatch[2])}\\b`
            );
          }
        }
      }
    }
  }

  // Strip matched phrase from the original text to get clean text
  let cleanText = text;
  if (matchedPhrase) {
    // Also strip a leading "by " or "on " before the phrase if not already included
    const stripped = text
      .replace(new RegExp(`(?:by\\s+|on\\s+)?${matchedPhrase.source}`, "i"), "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();
    cleanText = stripped || text;
  }

  return { cleanText, dueDate };
}

/** Format an ISO date string as DD/MM. */
function formatDueDate(isoDate) {
  if (!isoDate) return "";
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
