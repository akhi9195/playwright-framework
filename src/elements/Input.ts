import { BaseElement } from "./BaseElement";

/**
 * A text field or textarea.
 *
 * Covers <input type="text|email|password|search|tel|url|number">
 * and <textarea>.
 *
 * Inherits from BaseElement: isVisible, isEnabled, isDisabled, count,
 * exists, getAttribute, hover, waitForState.
 */
export class Input extends BaseElement {
  /**
   * Replace the field's contents with `value`.
   *
   * Sets the value in one shot - no keystrokes are fired. Clears whatever
   * was there first, so there is no need to call clear() before it.
   */
  async fill(value: string): Promise<void> {
    return this.base.fillInput(this.locator, value);
  }

  /**
   * Type character by character, firing a real key event for each one.
   *
   * Use this only when fill() does not work: autocomplete dropdowns,
   * search-as-you-type, masked inputs, and fields whose JS listens for
   * keydown/keyup. fill() sets the value directly and those listeners
   * never fire, so the UI does not react.
   *
   * Note: this does NOT clear the field first - call clear() if needed.
   */
  async slowType(value: string, delayMs = 50): Promise<void> {
    return this.base.slowType(this.locator, value, delayMs);
  }

  /** Empty the field. */
  async clear(): Promise<void> {
    return this.base.clear(this.locator);
  }

  /** Read what is currently typed in. */
  async getValue(): Promise<string> {
    return this.base.getInputValue(this.locator);
  }

  /**
   * Press a key while this field is focused, e.g. "Enter", "Tab", "Escape".
   *
   * Common use: submitting a form without clicking a button.
   *   await searchBox.fill("playwright");
   *   await searchBox.press("Enter");
   */
  async press(key: string): Promise<void> {
    return this.base.press(this.locator, key);
  }

  /** Not a Playwright method. Shorthand for getAttribute("placeholder"). */
  async getPlaceholder(): Promise<string | null> {
    return this.getAttribute("placeholder");
  }

  /**
   * Not a Playwright method. Shorthand for getAttribute("maxlength").
   *
   * Returns null when the field has no limit. Useful for checking a field
   * enforces the length the spec says it should.
   */
  async getMaxLength(): Promise<string | null> {
    return this.getAttribute("maxlength");
  }

  /** Not a Playwright method. Is the field read-only? */
  async isReadOnly(): Promise<boolean> {
    return (await this.getAttribute("readonly")) !== null;
  }

  /** Not a Playwright method. Is the field required? */
  async isRequired(): Promise<boolean> {
    return (await this.getAttribute("required")) !== null;
  }
}
