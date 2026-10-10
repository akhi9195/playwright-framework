import { ReportParser } from "../src/agents/ReportParser";

const failures = ReportParser.parse();

console.log(`Found ${failures.length} failure(s)\n`);
console.log(JSON.stringify(failures, null, 2));
