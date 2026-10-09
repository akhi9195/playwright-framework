/**
 * Thrown when a request fails at the network level, or when expectStatus()
 * sees a status it did not want.
 *
 * Carries the method, URL, timing and - for a status failure - the status
 * and body that came back, which is usually where the real explanation is.
 */
export class ApiRequestError extends Error {
  readonly method: string;
  readonly url: string;
  readonly apiName: string;
  readonly elapsedMs: number;
  readonly status?: number;
  readonly originalError: Error;

  constructor(
    method: string,
    url: string,
    originalError: unknown,
    context: {
      apiName?: string;
      elapsedMs?: number;
      status?: number;
      body?: unknown;
    } = {},
  ) {
    const err = originalError as Error;
    const apiName = context.apiName ?? "UnknownAPI";
    const elapsedMs = context.elapsedMs ?? 0;

    const message = [
      ``,
      `Failed ${method} request`,
      `  API     : ${apiName}`,
      `  URL     : ${url}`,
      ...(context.status !== undefined
        ? [`  Status  : ${context.status}`]
        : []),
      `  Elapsed : ${elapsedMs}ms`,
      `  Error   : ${err?.message?.split("\n")[0] ?? String(originalError)}`,
      ...(context.body
        ? [`  Body    : ${JSON.stringify(context.body).slice(0, 300)}`]
        : []),
    ].join("\n");

    super(message, { cause: err });

    this.name = "ApiRequestError";
    this.method = method;
    this.url = url;
    this.apiName = apiName;
    this.elapsedMs = elapsedMs;
    this.status = context.status;
    this.originalError = err;
    this.stack = `${message}\n\nOriginal:\n${err?.stack ?? ""}`;
  }
}
