import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calendarDays,
  calendarMonthRange,
  dhakaDateKey,
  formatHourLabel,
  getDhakaTimeParts,
  getWeekDaysForDate,
  shiftCalendarMonth,
  shiftDateKey,
} from "./calendar";

test("an evening UTC session appears on the following Bangladesh date", () => {
  assert.equal(dhakaDateKey("2026-10-31T19:30:00Z"), "2026-11-01");
});

test("a month range starts and ends at Bangladesh midnight", () => {
  const range = calendarMonthRange("2026-10");
  assert.equal(range.start.toISOString(), "2026-09-30T18:00:00.000Z");
  assert.equal(range.end.toISOString(), "2026-10-31T18:00:00.000Z");
});

test("December rolls into January of the following year", () => {
  assert.equal(shiftCalendarMonth("2026-12", 1), "2027-01");
  assert.equal(shiftCalendarMonth("2027-01", -1), "2026-12");
  assert.equal(
    calendarMonthRange("2026-12").end.toISOString(),
    "2026-12-31T18:00:00.000Z",
  );
});

test("calendar contains complete Sunday-to-Saturday weeks with every month date once", () => {
  for (const month of ["2026-02", "2026-10", "2026-12", "2028-02"]) {
    const days = calendarDays(month);
    assert.equal(days.length % 7, 0);
    assert.equal(new Date(`${days[0].key}T12:00:00Z`).getUTCDay(), 0);
    const inMonth = days.filter((day) => day.inMonth);
    assert.equal(inMonth[0].day, 1);
    assert.equal(new Set(inMonth.map((day) => day.key)).size, inMonth.length);
    assert.equal(
      inMonth.at(-1)?.day,
      month === "2028-02" ? 29 : month.endsWith("02") ? 28 : 31,
    );
  }
});

test("shiftDateKey shifts forwards and backwards correctly", () => {
  assert.equal(shiftDateKey("2026-10-30", 1), "2026-10-31");
  assert.equal(shiftDateKey("2026-10-31", 1), "2026-11-01");
  assert.equal(shiftDateKey("2026-11-01", -1), "2026-10-31");
  assert.equal(shiftDateKey("2026-10-30", 7), "2026-11-06");
  assert.equal(shiftDateKey("2026-10-30", -7), "2026-10-23");
});

test("getWeekDaysForDate returns 7 days starting Sunday", () => {
  // 2026-10-30 is a Friday
  const week = getWeekDaysForDate("2026-10-30");
  assert.equal(week.length, 7);
  assert.equal(week[0].key, "2026-10-25"); // Sunday
  assert.equal(week[0].dayOfWeek, 0);
  assert.equal(week[5].key, "2026-10-30"); // Friday
  assert.equal(week[6].key, "2026-10-31"); // Saturday
});

test("getDhakaTimeParts extracts 24h hour and minute in BST", () => {
  // 04:30 UTC is 10:30 BST
  const parts = getDhakaTimeParts("2026-10-30T04:30:00Z");
  assert.equal(parts.hour, 10);
  assert.equal(parts.minute, 30);
});

test("formatHourLabel formats 12-hour labels", () => {
  assert.equal(formatHourLabel(0), "12 AM");
  assert.equal(formatHourLabel(1), "1 AM");
  assert.equal(formatHourLabel(12), "12 PM");
  assert.equal(formatHourLabel(13), "1 PM");
  assert.equal(formatHourLabel(23), "11 PM");
});

