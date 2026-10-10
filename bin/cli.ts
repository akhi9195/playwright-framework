#!/usr/bin/env node

import { ReportParser } from "../src/agents/ReportParser";
import { FailureAnalyzerAgent } from "../src/agents/FailureAnalyzerAgent";
import { FailureAnalysis } from "../src/agents/types";

/** Read a --flag value from argv. */
function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
};

/** Colour by who owns the fix, so the report can be scanned at a glance. */
const CATEGORY_COLOR: Record<string, string> = {
  SCRIPT_ISSUE: C.yellow,
  DATA_ISSUE: C.cyan,
  ENVIRONMENT_ISSUE: C.cyan,
  DEFECT: C.red,
};

const HELP = `
${C.bold}pw-analyze${C.reset} - explain why your Playwright tests failed

  npx pw-analyze [options]

  --report <path>   Playwright JSON report
                    (default: test-results/results.json)
  --model <id>      claude-haiku-5-5 (default) or claude-sonnet-5-5
  --api-key <key>   or set ANTHROPIC_API_KEY
  --json            machine-readable output, for CI
  --help            this

First add the json reporter to playwright.config.ts:

  reporter: [["html"], ["json", { outputFile: "test-results/results.json" }]]
`;

function print(analyses: FailureAnalysis[]): void {
  console.log(`\n${C.bold}Failure Analysis${C.reset}\n`);

  for (const a of analyses) {
    const color = CATEGORY_COLOR[a.category] ?? C.reset;

    console.log(`${color}${C.bold}${a.category}${C.reset}  ${a.title}`);
    console.log(`  ${C.dim}${a.file} · confidence: ${a.confidence}${C.reset}`);
    console.log(`  ${C.bold}Why${C.reset}  ${a.rootCause}`);
    console.log(`  ${C.bold}Fix${C.reset}  ${a.suggestedFix}`);

    if (a.codeChange) {
      console.log(`       ${C.green}${a.codeChange}${C.reset}`);
    }
    if (a.sharedCause) {
      console.log(`  ${C.dim}Shared: ${a.sharedCause}${C.reset}`);
    }
    console.log();
  }

  // The grouping is often the real finding - five failures, one cause.
  const counts = analyses.reduce<Record<string, number>>((acc, a) => {
    acc[a.category] = (acc[a.category] ?? 0) + 1;
    return acc;
  }, {});

  const summary = Object.entries(counts)
    .map(([category, n]) => `${n} ${category}`)
    .join(", ");

  console.log(`${C.dim}${analyses.length} failure(s): ${summary}${C.reset}\n`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--help")) {
    console.log(HELP);
    return;
  }

  const failures = ReportParser.parse(arg("--report"));

  if (failures.length === 0) {
    console.log(`${C.green}No failures to analyze.${C.reset}`);
    return;
  }

  console.log(`${C.dim}Analyzing ${failures.length} failure(s)...${C.reset}`);

  const agent = new FailureAnalyzerAgent(arg("--api-key"), arg("--model"));
  const analyses = await agent.analyze(failures);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(analyses, null, 2));
  } else {
    print(analyses);
  }
}

main().catch((e) => {
  console.error(`\n${C.red}${e.message}${C.reset}\n`);
  // Exit 1 so CI can tell the analysis itself failed. Successfully
  // analyzing failures is a success, so a clean run exits 0 even though
  // the tests it describes did not pass.
  process.exit(1);
});
