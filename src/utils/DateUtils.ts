/**
 * Date handling for tests.
 *
 * The reason this exists rather than using Date directly: a test that
 * hardcodes "2026-10-09" passes today and fails tomorrow. Dates in tests
 * should almost always be relative to now - "tomorrow", "30 days ago" -
 * so the suite keeps working next month.
 *
 * Everything here is UTC unless stated. Mixing local and UTC is the usual
 * source of off-by-one-day failures in CI, where the machine's timezone
 * rarely matches the developer's.
 *
 * Every method is static - there is no state to hold.
 */
export class DateUtils {
  // ============================================================
  // GETTING A DATE
  // ============================================================

  /** Right now. */
  static now(): Date {
    return new Date();
  }

  /** Today as YYYY-MM-DD. */
  static today(): string {
    return DateUtils.format(new Date());
  }

  /** Tomorrow as YYYY-MM-DD. */
  static tomorrow(): string {
    return DateUtils.format(DateUtils.addDays(new Date(), 1));
  }

  /** Yesterday as YYYY-MM-DD. */
  static yesterday(): string {
    return DateUtils.format(DateUtils.addDays(new Date(), -1));
  }

  /**
   * A date relative to today, as YYYY-MM-DD.
   *
   * The one to reach for in test data. Negative goes backwards:
   *
   *   DateUtils.daysFromToday(30)   // a future expiry date
   *   DateUtils.daysFromToday(-18 * 365)  // an adult date of birth
   */
  static daysFromToday(days: number): string {
    return DateUtils.format(DateUtils.addDays(new Date(), days));
  }

  // ============================================================
  // FORMATTING
  // ============================================================

  /**
   * Format a date as YYYY-MM-DD.
   *
   * Uses the UTC parts, not the local ones. new Date().getDate() returns
   * the day in the machine's timezone, so a test run late at night in
   * Asia/Calcutta produces tomorrow's date on a UTC CI runner.
   */
  static format(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /** Format as YYYY-MM-DD HH:mm:ss, in UTC. */
  static formatDateTime(date: Date): string {
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    return `${DateUtils.format(date)} ${hours}:${minutes}:${seconds}`;
  }

  /** ISO 8601, what most APIs expect: 2026-10-09T11:20:00.000Z */
  static toISO(date: Date): string {
    return date.toISOString();
  }

  /**
   * A timestamp safe to use in a file name - 20261009-112000.
   *
   * Colons from the usual time format are not allowed in Windows file
   * names, which is why this exists separately.
   */
  static timestamp(date: Date = new Date()): string {
    return DateUtils.formatDateTime(date)
      .replace(/[-: ]/g, "")
      .replace(/(\d{8})(\d{6})/, "$1-$2");
  }

  // ============================================================
  // PARSING
  // ============================================================

  /**
   * Turn a date string into a Date.
   *
   * Throws on anything unparseable. new Date("not a date") silently gives
   * back an Invalid Date that spreads NaN through every later calculation,
   * and the eventual failure points nowhere near the bad input.
   */
  static parse(text: string): Date {
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Cannot parse as a date: "${text}"`);
    }
    return date;
  }

  /** Is this string a valid date? */
  static isValid(text: string): boolean {
    return !Number.isNaN(new Date(text).getTime());
  }

  // ============================================================
  // ARITHMETIC
  // ============================================================

  /** A new Date, `days` later. Negative goes backwards. The original is left alone. */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  /** A new Date, `hours` later. */
  static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setUTCHours(result.getUTCHours() + hours);
    return result;
  }

  /** A new Date, `minutes` later. */
  static addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setUTCMinutes(result.getUTCMinutes() + minutes);
    return result;
  }

  /**
   * A new Date, `months` later.
   *
   * Clamps to the end of the month, so 31 January plus one month is 28 or
   * 29 February, not 3 March. The built-in setMonth rolls over instead,
   * which is almost never what a test meant.
   */
  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    const dayOfMonth = result.getUTCDate();

    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);

    const lastDay = new Date(
      Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
    ).getUTCDate();

    result.setUTCDate(Math.min(dayOfMonth, lastDay));
    return result;
  }

  /** A new Date, `years` later. */
  static addYears(date: Date, years: number): Date {
    return DateUtils.addMonths(date, years * 12);
  }

  // ============================================================
  // COMPARING
  // ============================================================

  /** Whole days between two dates. Always positive. */
  static daysBetween(a: Date, b: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor(Math.abs(a.getTime() - b.getTime()) / msPerDay);
  }

  /** Is `date` earlier than `other`? */
  static isBefore(date: Date, other: Date): boolean {
    return date.getTime() < other.getTime();
  }

  /** Is `date` later than `other`? */
  static isAfter(date: Date, other: Date): boolean {
    return date.getTime() > other.getTime();
  }

  /** Are these two the same calendar day, ignoring the time? */
  static isSameDay(a: Date, b: Date): boolean {
    return DateUtils.format(a) === DateUtils.format(b);
  }

  /** Is this date in the past? */
  static isPast(date: Date): boolean {
    return DateUtils.isBefore(date, new Date());
  }

  /** Is this date in the future? */
  static isFuture(date: Date): boolean {
    return DateUtils.isAfter(date, new Date());
  }

  /**
   * Is this date between the other two? Both ends included.
   *
   * Useful for asserting a response's createdAt falls inside the window
   * the test was running, without pinning an exact timestamp.
   */
  static isBetween(date: Date, start: Date, end: Date): boolean {
    const time = date.getTime();
    return time >= start.getTime() && time <= end.getTime();
  }

  // ============================================================
  // DURATIONS
  // ============================================================

  /**
   * Milliseconds as something readable - "1m 23s", "450ms".
   *
   * For reporting how long something took, where "83451ms" makes a reader
   * do arithmetic.
   */
  static humanize(ms: number): string {
    if (ms < 1000) return `${ms}ms`;

    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60_000) % 60;
    const hours = Math.floor(ms / 3_600_000);

    const parts: string[] = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(" ");
  }
}
