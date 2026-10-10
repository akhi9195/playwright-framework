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
