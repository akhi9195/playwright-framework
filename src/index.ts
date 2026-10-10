// ============================================================
// PUBLIC API
//
// Everything consumers can import. Anything not exported here is
// internal and can change without a major version bump.
// ============================================================

// ---------- Pages ----------
export { BasePage } from "./pages/BasePage";

// ---------- Elements ----------
export { BaseElement } from "./elements/BaseElement";
export { Input } from "./elements/Input";
export { Button } from "./elements/Button";
export { Link } from "./elements/Link";
export { Text } from "./elements/Text";
export { Checkbox } from "./elements/Checkbox";
export { Radio } from "./elements/Radio";
export { Dropdown } from "./elements/Dropdown";
export { Container } from "./elements/Container";
export { Iframe } from "./elements/Iframe";

// ---------- API ----------
export { BaseAPI } from "./api/BaseApi";
export { GenericAPI } from "./api/GenericAPI";
export type { ApiResponse, RequestOptions } from "./api/BaseApi";

// ---------- Errors ----------
export { ElementActionError } from "./utils/errors/ElementActionError";
export { ApiRequestError } from "./utils/errors/ApiRequestError";
export { ErrorMapper, ErrorCategory } from "./utils/errors/ErrorMapper";

// ---------- Utilities ----------
export { FileUtils } from "./utils/FileUtils";
export { JsonUtils } from "./utils/JsonUtils";
export { CommonUtils } from "./utils/CommonUtils";
export { RandomUtils } from "./utils/RandomUtils";
export { DateUtils } from "./utils/DateUtils";
export { TestDataUtils } from "./utils/TestDataUtils";
export type { TestUser, TestProduct, TestOrder } from "./utils/TestDataUtils";

// ---------- Code generation ----------
export { ApiTestGenerator } from "./utils/codegen/ApiTestGenerator";
export type {
  ApiContract,
  EndpointContract,
  ValidationRule,
  AuthConfig,
} from "./utils/codegen/ContractTypes";

// ---------- AI agents ----------
export { FailureAnalyzerAgent } from "./agents/FailureAnalyzerAgent";
export { ReportParser } from "./agents/ReportParser";
export type { TestFailure, FailureAnalysis } from "./agents/types";

// ---------- Shared types ----------
export { ElementType, ElementState, MouseButton } from "./utils/type";
