import { APIRequestContext } from "@playwright/test";
import { BaseAPI, ApiResponse } from "./BaseApi";

/** Shape of a product from fakestoreapi.com. */
export interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  description: string;
}

/**
 * Service class for the products endpoints.
 *
 * Each method is one endpoint. No HTTP handling here - that all lives in
 * BaseAPI. This class only knows the paths and the response shapes.
 */
export class ProductAPI extends BaseAPI {
  constructor(request: APIRequestContext) {
    super(request, "https://fakestoreapi.com");
  }

  /** GET /products/{id} */
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.get<Product>(`/products/${id}`);
  }

  /** GET /products */
  async listProducts(limit?: number): Promise<ApiResponse<Product[]>> {
    return this.get<Product[]>(
      "/products",
      limit ? { params: { limit } } : undefined,
    );
  }

  /** POST /products */
  async createProduct(
    data: Omit<Product, "id">,
  ): Promise<ApiResponse<Product>> {
    return this.post<Product>("/products", data);
  }

  /** PUT /products/{id} */
  async updateProduct(
    id: number,
    data: Partial<Product>,
  ): Promise<ApiResponse<Product>> {
    return this.put<Product>(`/products/${id}`, data);
  }

  /** DELETE /products/{id} */
  async deleteProduct(id: number): Promise<ApiResponse<Product>> {
    return this.delete<Product>(`/products/${id}`);
  }
}
