import { FileUtils } from "../utils/FileUtils";
import { JsonUtils } from "../utils/JsonUtils";
import { TestFailure } from "./types";

/**
 * Pulls failures out of Playwright's JSON report.
 *
 * Reads the report file rather than hooking into the framework, so this
 * works on any Playwright project - not only one built on this framework.
 * It also means no API call happens while tests are running.
 */
export class ReportParser {
  static parse(reportPath = "test-results/results.json"): TestFailure[] {
    if (!FileUtils.exists(reportPath)) {
      throw new Error(
        `No report at ${reportPath}.\n\n` +
          `Add the json reporter to playwright.config.ts:\n` +
          `  reporter: [["html"], ["json", { outputFile: "test-results/results.json" }]]`,
      );
    }

    const report = JsonUtils.readFile(reportPath);
    const failures: TestFailure[] = [];

    // Suites nest inside suites, so walk the tree rather than looping once.
    const walk = (suites: any[] = []) => {
      for (const suite of suites) {
        for (const spec of suite.specs ?? []) {
          for (const testCase of spec.tests ?? []) {
            // Only the last result matters - the earlier ones were retries,
            // and a test that passed on retry is not a failure to analyze.
            const result = testCase.results?.[testCase.results.length - 1];
            if (!result) continue;
            if (result.status !== "failed" && result.status !== "timedOut")
              continue;

            const message = ReportParser.clean(
              result.error?.message ??
                result.errors?.[0]?.message ??
                "Unknown error",
            );

            failures.push({
              title: spec.title,
              file: suite.file ?? spec.file ?? "unknown",
              line: spec.line ?? 0,
              project: testCase.projectName ?? "unknown",
              durationMs: result.duration ?? 0,
              errorMessage: message,
              framework: ReportParser.extractFrameworkFields(message),
            });
          }
        }

        walk(suite.suites);
      }
    };

    walk(report.suites);
    return failures;
  }

  /**
   * Read the fields this framework's errors print.
   *
   * This is where the framework's error format pays off a second time.
   * Knowing the element was a Button on LoginPage, with the exact locator,
   * and that it waited the full timeout, is most of the diagnosis - far
   * more than a stack trace gives.
   */
  private static extractFrameworkFields(
    message: string,
  ): TestFailure["framework"] {
    const field = (name: string) =>
      message.match(new RegExp(`^\\s*${name}\\s*:\\s*(.+)$`, "m"))?.[1]?.trim();

    // No Category line means this is an ordinary Playwright error.
    const category = field("Category");
    if (!category) return undefined;

    return {
      category,
      page: field("Page"),
      element: field("Element"),
      target: field("Target"),
      elapsedMs: Number(field("Elapsed")?.replace(/\D/g, "")) || undefined,
    };
  }

  /**
   * Trim the message down to what is useful.
   *
   * Three things go: terminal colour codes, which are unreadable noise;
   * absolute paths, which differ per machine and say nothing; and anything
   * past 2000 characters, since a long stack trace costs tokens without
   * adding information the model can use.
   */
  private static clean(text: string): string {
    return text
      .replace(/\u001b\[[0-9;]*m/g, "") // ANSI colour codes
      .replace(/[A-Z]:[\\/][\w\\/.-]*[\\/]/g, "") // Windows absolute paths
      .replace(/\/(?:home|Users)\/[\w/.-]*\//g, "") // Unix absolute paths
      .trim()
      .slice(0, 2000);
  }
}
