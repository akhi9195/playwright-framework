import { ElementType, ErrorCategory } from "./type";

export class ElementActionError extends Error {
  readonly action: string;
  readonly target: string;
  readonly elementType: ElementType;
  readonly pageName: string;
  readonly url: string;
  readonly elapsedMs: number;
  readonly originalError: Error;

  constructor(
    action: string,
    target: string,
    elementType: ElementType,
    originalError: unknown,
    context: {
      pageName?: string;
      url?: string;
      elapsedMs?: number;
      category?: ErrorCategory;
      rootCause?: string;
    } = {},
  ) {
    const err = originalError as Error;
    const pageName = context.pageName ?? "UnknownPage";
    const url = context.url ?? "n/a";
    const elapsedMs = context.elapsedMs ?? 0;

    const message = [
      ``,
      `Failed to ${action} on ${elementType}`,
      ...(context.category ? [`  Category: ${context.category}`] : []),
      ...(context.rootCause ? [`  Reason  : ${context.rootCause}`] : []),
      `  Page    : ${pageName}`,
      `  Target  : ${target}`,
      `  URL     : ${url}`,
      `  Elapsed : ${elapsedMs}ms`,
      `  Error   : ${err?.message?.split("\n")[0] ?? String(originalError)}`,
    ].join("\n");

    super(message, { cause: err });

    this.name = "ElementActionError";
    this.action = action;
    this.target = target;
    this.elementType = elementType;
    this.pageName = pageName;
    this.url = url;
    this.elapsedMs = elapsedMs;
    this.originalError = err;
    this.stack = `${message}\n\nOriginal:\n${err?.stack ?? ""}`;
  }
}
