/** Which mouse button to click with. */
export enum MouseButton {
  Left = "left",
  Right = "right",
  Middle = "middle",
}

/** Element states you can wait for. Mirrors Playwright's waitFor states. */
export enum ElementState {
  /** In the DOM. Does not have to be visible. */
  Attached = "attached",
  /** Gone from the DOM entirely. */
  Detached = "detached",
  /** In the DOM and on screen. */
  Visible = "visible",
  /** Either not in the DOM, or in it but hidden by CSS. */
  Hidden = "hidden",
}

export type ElementType =
  | "TextInput"
  | "Button"
  | "Checkbox"
  | "Dropdown"
  | "Text"
  | "Link"
  | "Container"
  | "Any";

/** What kind of problem caused a failure. */
export enum ErrorCategory {
  /** Test code or locator problem. */
  ScriptIssue = "SCRIPT_ISSUE",
  /** Test data missing, stale or conflicting. */
  DataIssue = "DATA_ISSUE",
  /** Infrastructure down or unreachable. */
  EnvironmentIssue = "ENVIRONMENT_ISSUE",
  /** A real bug in the application. */
  Defect = "DEFECT",
}
