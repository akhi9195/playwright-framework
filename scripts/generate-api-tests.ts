import { ApiTestGenerator } from "../src/utils/codegen/ApiTestGenerator";

const CONTRACTS = "config/apis";
const OUTPUT = "tests/api/generated";

const written = ApiTestGenerator.generateAll(CONTRACTS, OUTPUT);

console.log(`Generated ${written.length} spec file(s) from ${CONTRACTS}:`);
written.forEach((path) => console.log(`  ${path}`));
