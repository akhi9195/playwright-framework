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
  api.setBasicAuth("testuser", "testpass");
});

test.afterAll(async () => {
  await context.dispose();
});

test.describe("HttpBinBasicAuth (generated)", () => {

  test("basic_auth_accepted - The endpoint accepts the configured credentials", async () => {
    const res = await api.get("/basic-auth/testuser/testpass");

    api.expectStatus(res, 200);
    expect(JsonUtils.get(res.body, "authenticated")).toBe(true);
    expect(JsonUtils.get(res.body, "user")).toBe("testuser");  });
});
