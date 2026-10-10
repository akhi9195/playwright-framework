import { ReportParser } from "../src/agents/ReportParser";
import { FailureAnalyzerAgent } from "../src/agents/FailureAnalyzerAgent";

async function main() {
  const failures = ReportParser.parse();
  console.log(`Analyzing ${failures.length} failure(s)...\n`);

  const agent = new FailureAnalyzerAgent();
  const analyses = await agent.analyze(failures);

  console.log(JSON.stringify(analyses, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
