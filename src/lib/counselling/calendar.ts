/** Calendar dates are always Bangladesh dates, independent of the browser zone. */
export function dhakaDateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function calendarMonthRange(month: string) {
  const [year, number] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, number, 1));
  return {
    start: new Date(`${month}-01T00:00:00+06:00`),
    end: new Date(`${next.toISOString().slice(0, 7)}-01T00:00:00+06:00`),
  };
}

export function shiftCalendarMonth(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + offset, 1))
    .toISOString()
    .slice(0, 7);
}

export function calendarDays(month: string) {
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const length = Math.ceil((first.getUTCDay() + count) / 7) * 7;
  return Array.from({ length }, (_, index) => {
    const date = new Date(
      Date.UTC(year, number - 1, index - first.getUTCDay() + 1),
    );
    return {
      key: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === number - 1,
    };
  });
}

export function shiftDateKey(dateKey: string, offsetDays: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return date.toISOString().slice(0, 10);
}

export function getWeekDaysForDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1, day - dayOfWeek + i));
    return {
      key: d.toISOString().slice(0, 10),
      day: d.getUTCDate(),
      month: d.getUTCMonth() + 1,
      dayOfWeek: i,
    };
  });
}

export function getDhakaTimeParts(isoString: string) {
  const date = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute };
}

export function formatHourLabel(hour24: number) {
  if (hour24 === 0) return "12 AM";
  if (hour24 < 12) return `${hour24} AM`;
  if (hour24 === 12) return "12 PM";
  return `${hour24 - 12} PM`;
}

