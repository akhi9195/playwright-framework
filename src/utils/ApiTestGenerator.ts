import yaml from "js-yaml";
import { FileUtils } from "./FileUtils";
import { CommonUtils } from "./CommonUtils";
import { ApiContract, EndpointContract, ValidationRule } from "./ContractTypes";

/**
 * Turns a YAML contract into a runnable .spec.ts file.
 *
 * Generates code rather than running tests itself. The output is an
 * ordinary Playwright spec calling BaseAPI, which means you can read it,
 * set a breakpoint in it, and see it in the HTML report like any other
 * test. A runtime-driven approach would be shorter but leaves nothing to
 * inspect when something fails.
 *
 * The generator never writes HTTP code - every line it emits is a call
 * into BaseAPI, so there is only one place HTTP is actually handled.
 */
export class ApiTestGenerator {
  /**
   * Read one YAML file and write the matching spec.
   *
   * Returns the path it wrote, so a caller can report it.
   */
  static generateFromFile(contractPath: string, outputDir: string): string {
    const contract = ApiTestGenerator.readContract(contractPath);
    const code = ApiTestGenerator.buildSpec(contract);

    const fileName = `${FileUtils.fileNameWithoutExtension(contractPath)}.generated.spec.ts`;
    const outputPath = `${outputDir}/${fileName}`;

    FileUtils.write(outputPath, code);
    return outputPath;
  }

  /** Read every .yaml in a folder and generate a spec for each. */
  static generateAll(contractsDir: string, outputDir: string): string[] {
    // Clear old output first, so a deleted contract does not leave a
    // stale spec behind that still runs in CI.
    FileUtils.deleteDir(outputDir);

    return FileUtils.listFiles(contractsDir, ".yaml").map((file) =>
      ApiTestGenerator.generateFromFile(file, outputDir),
    );
  }

  // ============================================================
  // READING
  // ============================================================

  private static readContract(filePath: string): ApiContract {
    const parsed = yaml.load(FileUtils.read(filePath)) as ApiContract;

    // Fail here with a useful message rather than generating broken code
    // that only fails when someone runs it.
    if (!parsed?.name) throw new Error(`${filePath}: missing "name"`);
    if (!parsed.baseUrl) throw new Error(`${filePath}: missing "baseUrl"`);
    if (!parsed.endpoints?.length)
      throw new Error(`${filePath}: no endpoints defined`);

    for (const ep of parsed.endpoints) {
      if (!ep.name) throw new Error(`${filePath}: an endpoint has no "name"`);
      if (!ep.method)
        throw new Error(`${filePath}: "${ep.name}" has no "method"`);
      if (!ep.path) throw new Error(`${filePath}: "${ep.name}" has no "path"`);
      if (ep.expectStatus === undefined) {
        throw new Error(`${filePath}: "${ep.name}" has no "expectStatus"`);
      }
    }

    return parsed;
  }

  // ============================================================
  // WRITING
  // ============================================================

  private static buildSpec(contract: ApiContract): string {
    const tests = contract.endpoints
      .map((ep) => ApiTestGenerator.buildTest(ep))
      .join("\n");

    return `${ApiTestGenerator.header(contract)}

test.describe("${contract.name} (generated)", () => {
${tests}});
`;
  }

  private static header(contract: ApiContract): string {
    return `// ============================================================
// GENERATED FILE - DO NOT EDIT
//
// Written by TestGenerator from a YAML contract.
// Edit the contract and re-run \`npm run generate:api\` instead; any
// change made here is lost on the next generation.
// ============================================================

import { test, expect, request, APIRequestContext } from "@playwright/test";
import { GenericAPI } from "../../../src/api/GenericAPI";
import { JsonUtils } from "../../../src/utils/JsonUtils";

let context: APIRequestContext;
let api: GenericAPI;

test.beforeAll(async () => {
  context = await request.newContext();
  api = new GenericAPI(context, "${contract.baseUrl}");${ApiTestGenerator.authSetup(contract)}
});

test.afterAll(async () => {
  await context.dispose();
});`;
  }

  private static authSetup(contract: ApiContract): string {
    if (!contract.auth) return "";

    const token = contract.auth.token ?? "";
    // ${VAR} in the YAML means "read this from the environment", so a real
    // token is never written into a committed file.
    const value = token.startsWith("${")
      ? `CommonUtils.env("${token.slice(2, -1)}")`
      : `"${token}"`;

    switch (contract.auth.type) {
      case "bearer":
        return `\n  api.setBearerToken(${value});`;
      case "apikey":
        return `\n  api.setApiKey(${value}, "${contract.auth.header ?? "X-API-Key"}");`;
      default:
        return "";
    }
  }

  private static buildTest(ep: EndpointContract): string {
    const path = ep.pathParams
      ? CommonUtils.template(ep.path, ep.pathParams)
      : ep.path;

    const options: string[] = [];
    if (ep.queryParams)
      options.push(`params: ${JSON.stringify(ep.queryParams)}`);
    if (ep.headers) options.push(`headers: ${JSON.stringify(ep.headers)}`);
    const optionsArg = options.length ? `{ ${options.join(", ")} }` : "";

    // GET and DELETE take no body, so their argument lists differ.
    const takesBody = ["POST", "PUT", "PATCH"].includes(ep.method);
    const args = takesBody
      ? [
          `"${path}"`,
          ep.body ? JSON.stringify(ep.body) : "undefined",
          optionsArg,
        ]
      : [`"${path}"`, optionsArg];

    const call = `api.${ep.method.toLowerCase()}(${args.filter(Boolean).join(", ")})`;

    const assertions = (ep.validate ?? [])
      .map((rule) => `    ${ApiTestGenerator.buildAssertion(rule)}`)
      .join("\n");

    return `
  test("${ep.name}${ep.description ? ` - ${ep.description}` : ""}", async () => {
    const res = await ${call};

    api.expectStatus(res, ${ep.expectStatus});
${assertions}  });
`;
  }

  /**
   * Turn one validation rule into one expect().
   *
   * Reads the value through JsonUtils.get, so a missing field produces a
   * clear assertion failure rather than a crash on undefined.
   */
  private static buildAssertion(rule: ValidationRule): string {
    const value = `JsonUtils.get(res.body, "${rule.path}")`;

    if (rule.equals !== undefined) {
      return `expect(${value}).toBe(${JSON.stringify(rule.equals)});`;
    }
    if (rule.contains !== undefined) {
      return `expect(String(${value})).toContain(${JSON.stringify(rule.contains)});`;
    }
    if (rule.matches !== undefined) {
      return `expect(String(${value})).toMatch(/${rule.matches}/);`;
    }
    if (rule.type !== undefined) {
      return rule.type === "array"
        ? `expect(Array.isArray(${value})).toBe(true);`
        : `expect(typeof ${value}).toBe("${rule.type}");`;
    }
    if (rule.greaterThan !== undefined) {
      return `expect(Number(${value})).toBeGreaterThan(${rule.greaterThan});`;
    }
    if (rule.lessThan !== undefined) {
      return `expect(Number(${value})).toBeLessThan(${rule.lessThan});`;
    }
    if (rule.exists !== undefined) {
      return rule.exists
        ? `expect(${value}).toBeDefined();`
        : `expect(${value}).toBeUndefined();`;
    }

    return `// unrecognised rule for path "${rule.path}"`;
  }
}
