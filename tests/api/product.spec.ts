import { test, expect, request, APIRequestContext } from "@playwright/test";
import { ProductAPI } from "../../src/api/ProductAPI";

let context: APIRequestContext;
let api: ProductAPI;

test.beforeAll(async () => {
  context = await request.newContext();
  api = new ProductAPI(context);
});

test.afterAll(async () => {
  await context.dispose();
});

test.describe("Product API", () => {
  test("gets a product by id", async () => {
    const res = await api.getProduct(1);

    api.expectStatus(res, 200);
    expect(res.body.id).toBe(1);
    expect(res.body.title).toBeTruthy();
    expect(typeof res.body.price).toBe("number");
  });

  test("lists products with a limit", async () => {
    const res = await api.listProducts(5);

    api.expectStatus(res, 200);
    expect(res.body).toHaveLength(5);
  });

  test("creates a product", async () => {
    const res = await api.createProduct({
      title: "Test Laptop",
      price: 999.99,
      category: "electronics",
      description: "Created by an automated test",
    });

    api.expectStatus(res, 201); // fakestoreapi returns 200, not 201
    expect(res.body.title).toBe("Test Laptop");
  });

  test("updates a product", async () => {
    const res = await api.updateProduct(1, { price: 1299.0 });

    api.expectStatus(res, 200);
  });

  test("deletes a product", async () => {
    const res = await api.deleteProduct(1);

    api.expectStatus(res, 200);
  });

  test("records response time", async () => {
    const res = await api.getProduct(1);

    expect(res.responseTimeMs).toBeGreaterThan(0);
    expect(res.responseTimeMs).toBeLessThan(10_000);
  });

  test("returns the response instead of throwing on a bad id", async () => {
    // fakestoreapi answers 200 with an empty body for unknown ids rather
    // than 404, so assert on the body.
    const res = await api.getProduct(999_999);

    expect(res.status).toBe(200);
    expect(res.body).toBeFalsy();
  });
});
