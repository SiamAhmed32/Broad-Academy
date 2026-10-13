const TIME_ZONE = "Asia/Dhaka";

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TIME_ZONE,
});

/** e.g. "Sat, 12 Oct 2026, 7:00 pm" in Bangladesh time, or null when not scheduled. */
export function formatSessionDateTime(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateTimeFormatter.format(date);
}

/** Phrase for messages: "on Sat, 12 Oct 2026, 7:00 pm", or "" when not scheduled yet. */
export function sessionTimePhrase(value: Date | string | null | undefined) {
  const formatted = formatSessionDateTime(value);
  return formatted ? `on ${formatted}` : "";
}

/** Value for an <input type="datetime-local"> showing Bangladesh time. */
export function toDhakaDateTimeInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Converts a datetime-local value entered as Bangladesh time (UTC+6, no DST) to ISO. */
export function fromDhakaDateTimeInput(value: string) {
  if (!value) return null;
  const date = new Date(`${value}:00+06:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
