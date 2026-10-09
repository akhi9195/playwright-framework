import { ErrorCategory } from "./type";

/** One matching rule: if the error text matches, it is this category. */
interface Rule {
  pattern: RegExp;
  category: ErrorCategory;
  rootCause: string;
}

/**
 * Works out what kind of problem an error represents.
 *
 * Why this exists: every failure arriving as "TimeoutError" tells nobody
 * anything. The same message can mean a bad locator, a dead service, or
 * missing test data - three different people fix those. Naming the
 * category in the error saves the first ten minutes of every triage.
 */
export class ErrorMapper {
  /**
   * Checked in order, first match wins. The order is the whole point:
   *
   *   1. environment - a dead service looks exactly like a slow element,
   *                    so rule it out BEFORE blaming the locator
   *   2. defect      - real app errors before data problems, since a 500
   *                    response can also mention "not found"
   *   3. data        - missing or conflicting records
   *   4. script      - last, because its patterns are the broadest
   */
  private static readonly RULES: Rule[] = [
    // ---------- ENVIRONMENT ----------
    {
      pattern: /ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|net::ERR_/i,
      category: ErrorCategory.EnvironmentIssue,
      rootCause: "Service unreachable - connection refused or DNS failed",
    },
    {
      pattern: /\b50[234]\b|Bad Gateway|Service Unavailable|Gateway Timeout/i,
      category: ErrorCategory.EnvironmentIssue,
      rootCause: "Service is up but not responding properly",
    },
    {
      pattern: /browser has been closed|Target page.*closed|crashed/i,
      category: ErrorCategory.EnvironmentIssue,
      rootCause: "Browser or page died mid-test",
    },

    // ---------- DEFECT ----------
    {
      pattern: /\b500\b|Internal Server Error/i,
      category: ErrorCategory.Defect,
      rootCause: "Application threw a server error",
    },
    {
      pattern: /Uncaught.*Error|ReferenceError|is not a function/i,
      category: ErrorCategory.Defect,
      rootCause: "Application JavaScript crashed",
    },

    // ---------- DATA ----------
    {
      pattern: /\b404\b|not found|does not exist/i,
      category: ErrorCategory.DataIssue,
      rootCause: "Test data missing from the environment",
    },
    {
      pattern: /duplicate|already exists|constraint violation/i,
      category: ErrorCategory.DataIssue,
      rootCause: "Test data left over from an earlier run",
    },
    {
      pattern: /locked out|account.*disabled|expired/i,
      category: ErrorCategory.DataIssue,
      rootCause: "Test account is not in a usable state",
    },

    // ---------- SCRIPT ----------
    {
      pattern: /strict mode violation|resolved to \d+ elements/i,
      category: ErrorCategory.ScriptIssue,
      rootCause: "Locator matches more than one element",
    },
    {
      pattern:
        /waiting for locator|not visible|not enabled|intercepts pointer/i,
      category: ErrorCategory.ScriptIssue,
      rootCause: "Element never became ready to act on",
    },
    {
      pattern: /expect\(|AssertionError/i,
      category: ErrorCategory.ScriptIssue,
      rootCause: "Assertion did not hold",
    },
  ];

  /**
   * Categorize one error.
   *
   * Anything unmatched falls back to SCRIPT_ISSUE, not DEFECT. Guessing
   * "app bug" floods developers with false reports and the framework loses
   * credibility fast. Default to whoever can triage it.
   */
  static analyze(error: Error | string): {
    category: ErrorCategory;
    rootCause: string;
  } {
    const text =
      error instanceof Error
        ? `${error.message}\n${(error as any).cause?.message ?? ""}`
        : String(error);

    for (const rule of ErrorMapper.RULES) {
      if (rule.pattern.test(text)) {
        return { category: rule.category, rootCause: rule.rootCause };
      }
    }

    return {
      category: ErrorCategory.ScriptIssue,
      rootCause: "Unrecognized error - needs manual triage",
    };
  }
}
