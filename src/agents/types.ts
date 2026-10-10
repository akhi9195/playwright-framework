/** One failure, pulled out of the Playwright JSON report. */
export interface TestFailure {
  title: string;
  file: string;
  line: number;
  project: string;
  durationMs: number;
  errorMessage: string;

  /**
   * Fields from this framework's own error format.
   *
   * Absent when the failure came from a plain Playwright error or a bare
   * expect(), which is the normal case on any other project. The agent
   * works either way - these just give it much more to go on.
   */
  framework?: {
    category?: string;
    page?: string;
    element?: string;
    target?: string;
    elapsedMs?: number;
  };
}

/** What the agent concluded about one failure. */
export interface FailureAnalysis {
  title: string;
  file: string;
  category: string;
  confidence: "high" | "medium" | "low";
  rootCause: string;
  suggestedFix: string;
  /** A single replacement line, when there is one. */
  codeChange?: string;
  /** Set when this failure shares a cause with others in the same run. */
  sharedCause?: string;
}
