/** One rule checked against a response body. */
export interface ValidationRule {
  /** Dot path into the body - "id", "user.email", "[0].title", "length". */
  path: string;
  equals?: string | number | boolean;
  contains?: string;
  matches?: string;
  type?: "string" | "number" | "boolean" | "object" | "array";
  greaterThan?: number;
  lessThan?: number;
  exists?: boolean;
}

/** One endpoint, which becomes one generated test. */
export interface EndpointContract {
  name: string;
  description?: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, string | number | boolean>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  expectStatus: number;
  validate?: ValidationRule[];
}

/** How requests to this API are authenticated. */
export interface AuthConfig {
  type: "bearer" | "basic" | "apikey" | "none";

  /** bearer: the token. Use ${ENV_VAR} to read it from the environment. */
  token?: string;

  /** basic: the credentials. Use ${ENV_VAR} for both. */
  username?: string;
  password?: string;

  /** apikey: the key, and which header carries it. */
  key?: string;
  header?: string;
}

/** A whole YAML file - one API service. */
export interface ApiContract {
  name: string;
  baseUrl: string;
  auth?: AuthConfig;
  endpoints: EndpointContract[];
}
