/**
 * SSC batch = the year a student sits (or sat) the SSC exam, e.g. 2027 for
 * the "SSC 2027 batch". It is stored next to the student ID rather than
 * inside it: IDs never change, while a batch can need correcting.
 */

const MIN_BATCH = 2000;
const MAX_BATCH = 2100;

function dhakaYearMonth(at: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
  }).formatToParts(at);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month") };
}

/**
 * Best guess from the student's class. The school year runs January–December
 * (SSC is taken early in the year after Class 10); the HSC session starts
 * around July, so Class 11–12 depend on the month. Admins can correct it.
 */
export function sscBatchFromClass(classLevel: number | null | undefined, at = new Date()) {
  if (!classLevel || classLevel < 1 || classLevel > 12) return null;
  const { year, month } = dhakaYearMonth(at);
  if (classLevel <= 10) return year + 11 - classLevel;
  const hscStarted = month >= 7;
  return classLevel === 11 ? year - (hscStarted ? 0 : 1) : year - (hscStarted ? 1 : 2);
}

export function isValidSscBatch(value: number) {
  return Number.isInteger(value) && value >= MIN_BATCH && value <= MAX_BATCH;
}

export function formatSscBatch(batch: number | null | undefined) {
  return batch ? `SSC ${batch}` : null;
}
