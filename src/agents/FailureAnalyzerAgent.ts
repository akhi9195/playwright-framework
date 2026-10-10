import Anthropic from "@anthropic-ai/sdk";
import { TestFailure, FailureAnalysis } from "./types";
import { FAILURE_ANALYSIS_PROMPT } from "./prompts";

/**
 * Explains why tests failed and what to change.
 *
 * ErrorMapper already categorizes a failure from its text, but a regex can
 * only match words. This reads the locator, the element type and the
 * timing together - so it can say "the button exists but reads 'Place
 * order', not 'Submit'", which no pattern list can reach.
 *
 * Every failure goes in one request rather than one each. Failures in a
 * single run usually share a cause, and a model that sees all of them at
 * once can say so. It is also cheaper and faster.
 */
export class FailureAnalyzerAgent {
  private readonly client: Anthropic;
  private readonly model: string;

  /**
   * claude-haiku-5-5 by default: this is classification work, which is
   * what Haiku is built for, and it costs a fraction of the larger models.
   * Pass claude-sonnet-5-5 when the failures are subtle enough to need it.
   */
  constructor(apiKey?: string, model = "claude-haiku-5-5") {
    const key = apiKey ?? process.env.ANTHROPIC_API_KEY;

    if (!key) {
      throw new Error(
        "No API key.\n\n" +
          "Set ANTHROPIC_API_KEY in your environment, or pass --api-key.\n" +
          "Get one at https://platform.claude.com",
      );
    }

    this.client = new Anthropic({ apiKey: key });
    this.model = model;
  }

  /** Analyze every failure in one request. */
  async analyze(failures: TestFailure[]): Promise<FailureAnalysis[]> {
    if (failures.length === 0) return [];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: FAILURE_ANALYSIS_PROMPT,
      messages: [
        { role: "user", content: FailureAnalyzerAgent.buildMessage(failures) },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("The model returned no text.");
    }

    return FailureAnalyzerAgent.parse(block.text, failures);
  }

  /**
   * Lay the failures out for the model.
   *
   * Numbered, because the response refers back to them by index. The
   * framework's own fields are included when present - they are the
   * difference between guessing from a stack trace and reading the actual
   * locator that failed.
   */
  private static buildMessage(failures: TestFailure[]): string {
    const blocks = failures.map((f, i) => {
      const frameworkFields = f.framework
        ? [
            `Framework category: ${f.framework.category}`,
            f.framework.page && `Page object: ${f.framework.page}`,
            f.framework.element && `Element: ${f.framework.element}`,
            f.framework.target && `Locator: ${f.framework.target}`,
            f.framework.elapsedMs && `Waited: ${f.framework.elapsedMs}ms`,
          ]
            .filter(Boolean)
            .join("\n")
        : "";

      return [
        `### Failure ${i}`,
        `Test: ${f.title}`,
        `File: ${f.file}:${f.line}`,
        `Browser: ${f.project}`,
        `Test duration: ${f.durationMs}ms`,
        frameworkFields,
        ``,
        `Error:`,
        f.errorMessage,
      ]
        .filter(Boolean)
        .join("\n");
    });

    return [
      `${failures.length} test${failures.length === 1 ? "" : "s"} failed in one run.`,
      ``,
      blocks.join("\n\n"),
    ].join("\n");
  }

  /**
   * Read the JSON out of the response.
   *
   * The prompt asks for bare JSON, but models sometimes wrap it in a code
   * fence or add a sentence before it. Matching the array rather than
   * parsing the whole string handles both without complaint.
   */
  private static parse(
    text: string,
    failures: TestFailure[],
  ): FailureAnalysis[] {
    const json = text.match(/\[[\s\S]*\]/)?.[0];

    if (!json) {
      throw new Error(
        `Could not find JSON in the model's response.\n\n${text.slice(0, 400)}`,
      );
    }

    let items: any[];
    try {
      items = JSON.parse(json);
    } catch (e) {
      throw new Error(
        `The model returned malformed JSON: ${(e as Error).message}`,
      );
    }

    return items.map((item) => ({
      // Map the index back to the real test, so the output names the test
      // rather than a number.
      title: failures[item.index]?.title ?? "unknown test",
      file: failures[item.index]?.file ?? "",
      category: item.category ?? "SCRIPT_ISSUE",
      confidence: item.confidence ?? "low",
      rootCause: item.rootCause ?? "No cause given",
      suggestedFix: item.suggestedFix ?? "",
      codeChange: item.codeChange,
      sharedCause: item.sharedCause,
    }));
  }
}
