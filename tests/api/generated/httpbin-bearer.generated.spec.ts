// ============================================================
// GENERATED FILE - DO NOT EDIT
//
// Written by TestGenerator from a YAML contract.
// Edit the contract and re-run `npm run generate:api` instead; any
// change made here is lost on the next generation.
// ============================================================

import { test, expect, request, APIRequestContext } from "@playwright/test";
import { GenericAPI } from "../../../src/api/GenericAPI";
import { JsonUtils } from "../../../src/utils/JsonUtils";
import { CommonUtils } from "../../../src/utils/CommonUtils";

let context: APIRequestContext;
let api: GenericAPI;

test.beforeAll(async () => {
  context = await request.newContext();
  api = new GenericAPI(context, "https://httpbin.org");
  api.setBearerToken("demo-token-12345");
});

test.afterAll(async () => {
  await context.dispose();
});

test.describe("HttpBinBearer (generated)", () => {

  test("bearer_token_accepted - The endpoint accepts the bearer token", async () => {
    const res = await api.get("/bearer");

    api.expectStatus(res, 200);
    expect(JsonUtils.get(res.body, "authenticated")).toBe(true);
    expect(JsonUtils.get(res.body, "token")).toBe("demo-token-12345");  });


  test("headers_carry_authorization - The Authorization header reaches the server", async () => {
    const res = await api.get("/headers");

    api.expectStatus(res, 200);
    expect(String(JsonUtils.get(res.body, "headers.Authorization"))).toContain("Bearer");  });
});
