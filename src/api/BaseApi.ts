import {
  APIRequestContext,
  APIResponse as PlaywrightResponse,
} from "@playwright/test";
import { ApiRequestError } from "@utils/errors/ApiRequestError";

/** What every request returns. */
export interface ApiResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: T;
  responseTimeMs: number;
  ok: boolean;
}

/** Options accepted by every verb. */
export interface RequestOptions {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Foundation for all API service classes, the way BasePage is for pages.
 *
 * Unlike the UI side, a failed HTTP call does not throw - a 404 or a 500
 * is a perfectly successful promise carrying a bad status code. So these
 * methods return the response either way and let the test decide what
 * counts as a failure, which is what makes negative tests possible:
 *
 *   const res = await api.getProduct(999);
 *   expect(res.status).toBe(404);        // asserting the 404 is the point
 *
 * Only genuine network failures throw - DNS, refused connection, timeout.
 */
export abstract class BaseAPI {
  protected readonly request: APIRequestContext;
  protected readonly baseURL: string;
  protected readonly apiName: string;

  /** Sent on every request unless a call overrides them. */
  protected defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request;
    this.baseURL = baseURL.replace(/\/$/, ""); // drop any trailing slash
    this.apiName = this.constructor.name; // "ProductAPI", "UserAPI"
  }

  // ============================================================
  // HTTP VERBS
  // ============================================================

  async get<T = any>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.send<T>("GET", endpoint, undefined, options);
  }

  async post<T = any>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.send<T>("POST", endpoint, data, options);
  }

  async put<T = any>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.send<T>("PUT", endpoint, data, options);
  }

  async patch<T = any>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.send<T>("PATCH", endpoint, data, options);
  }

  async delete<T = any>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.send<T>("DELETE", endpoint, undefined, options);
  }

  // ============================================================
  // THE ONE PLACE EVERY REQUEST GOES THROUGH
  // ============================================================

  /**
   * Sends the request, times it, and normalises the response.
   *
   * The API counterpart to BasePage.fail(): one chokepoint, so timing,
   * default headers and error shape are handled once instead of being
   * copied into five near-identical verb methods.
   */
  protected async send<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const started = Date.now();

    try {
      const response: PlaywrightResponse = await this.request.fetch(url, {
        method,
        data: data as any,
        params: options?.params,
        headers: { ...this.defaultHeaders, ...options?.headers },
        timeout: options?.timeout,
      });

      return {
        status: response.status(),
        statusText: response.statusText(),
        headers: await response.headers(),
        body: await BaseAPI.parseBody<T>(response),
        responseTimeMs: Date.now() - started,
        ok: response.ok(),
      };
    } catch (e) {
      // Only network-level failures land here - DNS, refused, timeout.
      // A 404 or 500 arrives as a normal response, not an exception.
      throw new ApiRequestError(method, url, e, {
        apiName: this.apiName,
        elapsedMs: Date.now() - started,
      });
    }
  }

  /**
   * Reads the body without assuming it is JSON.
   *
   * A 204 has no body at all, and an error page is often HTML even from a
   * JSON API. Calling .json() blindly throws a parse error that hides the
   * status code you actually needed to see.
   */
  private static async parseBody<T>(response: PlaywrightResponse): Promise<T> {
    if (response.status() === 204) return null as T;

    const contentType = response.headers()["content-type"] ?? "";
    if (contentType.includes("application/json")) {
      try {
        return (await response.json()) as T;
      } catch {
        return (await response.text()) as unknown as T;
      }
    }
    return (await response.text()) as unknown as T;
  }

  // ============================================================
  // ASSERTION HELPER
  // ============================================================

  /**
   * Fail the test unless the status matches.
   *
   * Use it when a wrong status means the test is over. Leave it out when
   * the test is deliberately checking an error response.
   */
  expectStatus(response: ApiResponse, expected: number): void {
    if (response.status !== expected) {
      throw new ApiRequestError(
        "statusCheck",
        this.baseURL,
        new Error(
          `Expected ${expected}, got ${response.status} ${response.statusText}`,
        ),
        {
          apiName: this.apiName,
          elapsedMs: response.responseTimeMs,
          status: response.status,
          body: response.body,
        },
      );
    }
  }

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  /** Authorization: Bearer <token> on every later request. */
  setBearerToken(token: string): void {
    this.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  /** Authorization: Basic <base64> on every later request. */
  setBasicAuth(username: string, password: string): void {
    const encoded = Buffer.from(`${username}:${password}`).toString("base64");
    this.defaultHeaders["Authorization"] = `Basic ${encoded}`;
  }

  /** An API key header. Defaults to X-API-Key. */
  setApiKey(key: string, headerName = "X-API-Key"): void {
    this.defaultHeaders[headerName] = key;
  }

  /** Any other header that should go on every request. */
  setHeader(name: string, value: string): void {
    this.defaultHeaders[name] = value;
  }

  /** Drop all auth - for testing that an endpoint rejects anonymous calls. */
  clearAuth(): void {
    delete this.defaultHeaders["Authorization"];
  }
}
