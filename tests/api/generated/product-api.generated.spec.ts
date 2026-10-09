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

let context: APIRequestContext;
let api: GenericAPI;

test.beforeAll(async () => {
  context = await request.newContext();
  api = new GenericAPI(context, "https://fakestoreapi.com");
});

test.afterAll(async () => {
  await context.dispose();
});

test.describe("ProductAPI (generated)", () => {
  test("get_product - Fetch a single product by id", async () => {
    const res = await api.get("/products/1");

    api.expectStatus(res, 200);
    expect(typeof JsonUtils.get(res.body, "id")).toBe("number");
    expect(typeof JsonUtils.get(res.body, "title")).toBe("string");
    expect(Number(JsonUtils.get(res.body, "price"))).toBeGreaterThan(0);
  });

  test("list_products - Fetch a limited list of products", async () => {
    const res = await api.get("/products", { params: { limit: 5 } });

    api.expectStatus(res, 200);
    expect(JsonUtils.get(res.body, "length")).toBe(5);
    expect(typeof JsonUtils.get(res.body, "[0].id")).toBe("number");
  });

  test("create_product - Create a new product", async () => {
    const res = await api.post("/products", {
      title: "Generated Test Product",
      price: 499.99,
      category: "electronics",
      description: "Created by a generated test",
    });

    api.expectStatus(res, 201);
    expect(JsonUtils.get(res.body, "id")).toBeDefined();
    expect(JsonUtils.get(res.body, "title")).toBe("Generated Test Product");
  });

  test("update_product - Update an existing product", async () => {
    const res = await api.put("/products/1", { price: 1299 });

    api.expectStatus(res, 200);
  });

  test("delete_product - Delete a product", async () => {
    const res = await api.delete("/products/1");

    api.expectStatus(res, 200);
  });
});
