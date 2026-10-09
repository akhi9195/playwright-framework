import { FileUtils } from "./FileUtils";

/**
 * JSON handling used across the framework.
 *
 * Mostly thin wrappers, but each one fixes a specific sharp edge in the
 * built-in JSON functions: parse() throws an unreadable error, there is no
 * way to reach a nested value by path, and comparing two objects with ===
 * compares references rather than contents.
 *
 * Every method is static - there is no state to hold.
 */
export class JsonUtils {
  /**
   * Parse a JSON string.
   *
   * JSON.parse's own error is "Unexpected token } in JSON at position 142",
   * which says nothing about which file or what was being read. This adds
   * that context and shows the text around the failure.
   */
  static parse<T = any>(text: string, source = "string"): T {
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      const message = (e as Error).message;
      const position = Number(message.match(/position (\d+)/)?.[1] ?? -1);
      const nearby =
        position >= 0
          ? `\n  Near: ...${text.slice(Math.max(0, position - 40), position + 40)}...`
          : "";

      throw new Error(`Invalid JSON in ${source}: ${message}${nearby}`);
    }
  }

  /** Read and parse a JSON file. */
  static readFile<T = any>(filePath: string): T {
    return JsonUtils.parse<T>(FileUtils.read(filePath), filePath);
  }

  /**
   * Write an object to a JSON file.
   *
   * Indented by default, because these files get read by people - test
   * fixtures, generated reports, saved responses.
   */
  static writeFile(filePath: string, data: unknown, indent = 2): void {
    FileUtils.write(filePath, JsonUtils.stringify(data, indent));
  }

  /** Turn an object into a JSON string. */
  static stringify(data: unknown, indent = 2): string {
    return JSON.stringify(data, null, indent);
  }

  /**
   * Read a nested value by dot path.
   *
   * Reaching into a response body with plain property access crashes the
   * moment one level is missing:
   *
   *   body.user.orders[0].total     // throws if `user` is undefined
   *   JsonUtils.get(body, "user.orders[0].total")   // returns undefined
   *
   * Returns undefined for any path that does not resolve, so a validation
   * check can report "field missing" instead of crashing the test.
   */
  static get<T = any>(obj: any, path: string): T | undefined {
    if (obj == null) return undefined;

    // "user.orders[0].total" -> ["user", "orders", "0", "total"]
    const keys = path
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".")
      .filter(Boolean);

    let current = obj;
    for (const key of keys) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current as T;
  }

  /** Does this path exist and hold something other than undefined? */
  static has(obj: any, path: string): boolean {
    return JsonUtils.get(obj, path) !== undefined;
  }

  /**
   * Compare two values by content, not by reference.
   *
   * `{a:1} === {a:1}` is false in JavaScript - the two objects are
   * different references. This walks both structures instead.
   *
   * Key order does not matter; array order does.
   */
  static equals(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    if (typeof a !== "object") return false;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => JsonUtils.equals(item, b[i]));
    }

    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) =>
      JsonUtils.equals((a as any)[key], (b as any)[key]),
    );
  }

  /**
   * Merge objects, left to right.
   *
   * Nested objects are merged rather than replaced, which is what you want
   * for config: a base file plus an environment override that only names
   * the few fields it changes.
   *
   * Arrays are replaced whole - merging them item by item is almost never
   * what the caller meant.
   */
  static merge<T = any>(...objects: any[]): T {
    const result: any = {};

    for (const obj of objects) {
      if (obj == null) continue;

      for (const [key, value] of Object.entries(obj)) {
        const isPlainObject =
          value != null && typeof value === "object" && !Array.isArray(value);

        result[key] =
          isPlainObject &&
          typeof result[key] === "object" &&
          !Array.isArray(result[key])
            ? JsonUtils.merge(result[key], value)
            : value;
      }
    }

    return result as T;
  }

  /**
   * A deep copy, with no shared references to the original.
   *
   * Needed whenever test data is reused: modifying a fixture object in one
   * test would otherwise change it for every later test in the same file.
   */
  static clone<T>(obj: T): T {
    return structuredClone(obj);
  }

  /** Is this text valid JSON? */
  static isValid(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }
}
