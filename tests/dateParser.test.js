const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { parseDueDate, formatDueDate } = require("../dateParser");

// Pin "today" so date-relative tests are deterministic.
// We mock Date globally before each test group.
const FIXED_DATE = new Date("2026-04-02T00:00:00"); // Thursday

function withFixedDate(fn) {
  const RealDate = Date;
  class MockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(FIXED_DATE);
      else super(...args);
    }
    static now() { return FIXED_DATE.getTime(); }
  }
  global.Date = MockDate;
  try { fn(); } finally { global.Date = RealDate; }
}

// ─── parseDueDate ─────────────────────────────────────────────────────────────

describe("parseDueDate — no date in text", () => {
  test("returns original text and null dueDate", () => {
    const { cleanText, dueDate } = parseDueDate("buy groceries");
    assert.equal(cleanText, "buy groceries");
    assert.equal(dueDate, null);
  });
});

describe("parseDueDate — relative keywords", () => {
  test('"today" → today\'s ISO date', () => {
    withFixedDate(() => {
      const { dueDate } = parseDueDate("finish report today");
      assert.equal(dueDate, "2026-04-02");
    });
  });

  test('"tomorrow" → next day\'s ISO date', () => {
    withFixedDate(() => {
      const { dueDate } = parseDueDate("dentist tomorrow");
      assert.equal(dueDate, "2026-04-03");
    });
  });

  test('"this weekend" → next Saturday', () => {
    withFixedDate(() => {
      // 2026-04-02 is Thursday → next Saturday is 2026-04-04
      const { dueDate } = parseDueDate("run 5 miles this weekend");
      assert.equal(dueDate, "2026-04-04");
    });
  });

  test('"this weekend" strips phrase from text', () => {
    withFixedDate(() => {
      const { cleanText } = parseDueDate("run 5 miles this weekend");
      assert.equal(cleanText, "run 5 miles");
    });
  });
});

describe("parseDueDate — named weekdays", () => {
  test('"by Friday" → next Friday', () => {
    withFixedDate(() => {
      // 2026-04-02 Thursday → next Friday 2026-04-03
      const { dueDate } = parseDueDate("submit report by Friday");
      assert.equal(dueDate, "2026-04-03");
    });
  });

  test('"by Friday" strips phrase from text', () => {
    withFixedDate(() => {
      const { cleanText } = parseDueDate("submit report by Friday");
      assert.equal(cleanText, "submit report");
    });
  });

  test('"next Monday" → Monday of week after next', () => {
    withFixedDate(() => {
      // 2026-04-02 Thursday → next Monday is 2026-04-06, "next Monday" skips to 2026-04-13
      const { dueDate } = parseDueDate("next Monday standup");
      assert.equal(dueDate, "2026-04-13");
    });
  });
});

describe("parseDueDate — absolute month/day", () => {
  test('"by April 6th"', () => {
    withFixedDate(() => {
      const { dueDate, cleanText } = parseDueDate("call AT&T by April 6th");
      assert.equal(dueDate, "2026-04-06");
      assert.equal(cleanText, "call AT&T");
    });
  });

  test('"April 6" without ordinal', () => {
    withFixedDate(() => {
      const { dueDate } = parseDueDate("call AT&T April 6");
      assert.equal(dueDate, "2026-04-06");
    });
  });

  test("wraps to next year if date has passed", () => {
    withFixedDate(() => {
      // Jan 1 has already passed in 2026 (fixed date is April 2)
      const { dueDate } = parseDueDate("party January 1st");
      assert.equal(dueDate, "2027-01-01");
    });
  });
});

// ─── formatDueDate ────────────────────────────────────────────────────────────

describe("formatDueDate", () => {
  test("formats ISO date as DD/MM", () => {
    assert.equal(formatDueDate("2026-04-06"), "06/04");
  });

  test("pads single-digit day and month", () => {
    assert.equal(formatDueDate("2026-01-03"), "03/01");
  });

  test("returns empty string for null", () => {
    assert.equal(formatDueDate(null), "");
  });
});
