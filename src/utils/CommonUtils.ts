/**
 * General helpers that do not belong to files, JSON or dates.
 *
 * A note on waiting: none of this replaces Playwright's auto-wait. Use
 * these for things outside the browser - a background job finishing, a
 * message landing in a queue, a database row appearing. Inside the
 * browser, click() and fill() already wait on their own, and adding a
 * sleep in front of them only makes the suite slower and no more reliable.
 *
 * Every method is static - there is no state to hold.
 */
export class CommonUtils {
  /**
   * Pause for a fixed time.
   *
   * A blunt instrument. Prefer waitUntil() whenever there is a condition
   * to poll, because a fixed sleep is either too short (flaky) or too long
   * (slow), and usually both on different machines.
   *
   * Legitimate uses: rate-limiting between API calls, letting an animation
   * settle before a screenshot.
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Poll a condition until it is true or the timeout runs out.
   *
   * Use this for anything outside the browser that takes an unknown amount
   * of time:
   *
   *   await CommonUtils.waitUntil(
   *     async () => (await api.getOrder(id)).body.status === "SHIPPED",
   *     { timeout: 30_000, message: "order never shipped" },
   *   );
   *
   * Throws when the time runs out, so a test does not carry on against a
   * state that never arrived.
   */
  static async waitUntil(
    condition: () => boolean | Promise<boolean>,
    options: { timeout?: number; interval?: number; message?: string } = {},
  ): Promise<void> {
    const timeout = options.timeout ?? 10_000;
    const interval = options.interval ?? 500;
    const deadline = Date.now() + timeout;

    let lastError: Error | undefined;

    while (Date.now() < deadline) {
      try {
        if (await condition()) return;
      } catch (e) {
        // A condition that throws is treated as "not yet" - the thing being
        // polled may not exist at all for the first few attempts. The last
        // error is kept so the timeout message can explain what went wrong.
        lastError = e as Error;
      }
      await CommonUtils.sleep(interval);
    }

    const reason = options.message ?? "condition was never met";
    const cause = lastError ? ` Last error: ${lastError.message}` : "";
    throw new Error(`Timed out after ${timeout}ms - ${reason}.${cause}`);
  }

  /**
   * Run something again if it fails, backing off a little longer each time.
   *
   * For genuinely flaky operations outside your control - a third-party
   * API that occasionally 503s, a service still warming up.
   *
   * Do NOT wrap test assertions in this. A retried assertion hides a real
   * bug behind a green run; that is what Playwright's `retries` config is
   * for, at the test level where the failure is still visible in the report.
   *
   * Delays grow as interval, interval*2, interval*4 - so 1s, 2s, 4s by
   * default. Backing off matters: hammering a struggling service every
   * 100ms makes its recovery slower, not faster.
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: { attempts?: number; interval?: number; message?: string } = {},
  ): Promise<T> {
    const attempts = options.attempts ?? 3;
    const interval = options.interval ?? 1000;

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn();
      } catch (e) {
        lastError = e as Error;

        if (attempt < attempts) {
          await CommonUtils.sleep(interval * Math.pow(2, attempt - 1));
        }
      }
    }

    const what = options.message ?? "operation";
    throw new Error(
      `${what} failed after ${attempts} attempts. Last error: ${lastError?.message}`,
      { cause: lastError },
    );
  }

  /**
   * Fail if something takes too long.
   *
   * Wraps a promise that has no timeout of its own. The original promise
   * keeps running in the background - JavaScript cannot cancel it - so use
   * this to stop a test hanging, not to stop the work.
   */
  static async withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    message = "operation",
  ): Promise<T> {
    let timer: NodeJS.Timeout;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${message} timed out after ${ms}ms`)),
        ms,
      );
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timer!);
    }
  }

  /**
   * Read an environment variable.
   *
   * Throws when a variable with no default is missing. That is deliberate:
   * a missing API token should stop the run immediately with a clear
   * message, not produce "Bearer undefined" and a confusing 401 later.
   */
  static env(name: string, fallback?: string): string {
    const value = process.env[name];

    if (value === undefined || value === "") {
      if (fallback !== undefined) return fallback;
      throw new Error(
        `Missing environment variable: ${name}. Add it to your .env file or CI secrets.`,
      );
    }
    return value;
  }

  /** Read an environment variable as a boolean. "true", "1" and "yes" count as true. */
  static envBool(name: string, fallback = false): boolean {
    const value = process.env[name];
    if (value === undefined || value === "") return fallback;
    return ["true", "1", "yes"].includes(value.toLowerCase());
  }

  /** Read an environment variable as a number. */
  static envNumber(name: string, fallback?: number): number {
    const value = process.env[name];

    if (value === undefined || value === "") {
      if (fallback !== undefined) return fallback;
      throw new Error(`Missing environment variable: ${name}`);
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(
        `Environment variable ${name} is not a number: "${value}"`,
      );
    }
    return parsed;
  }

  /** Are we running in CI? Set by GitHub Actions, GitLab, Jenkins and the rest. */
  static isCI(): boolean {
    return CommonUtils.envBool("CI");
  }

  /**
   * Put a value into a template string.
   *
   *   CommonUtils.template("/products/{id}", { id: 42 })  ->  "/products/42"
   *
   * This is what the test generator uses to turn a YAML path with
   * placeholders into a real URL.
   */
  static template(
    text: string,
    values: Record<string, string | number>,
  ): string {
    return text.replace(/\{(\w+)\}/g, (match, key) =>
      key in values ? String(values[key]) : match,
    );
  }
}
