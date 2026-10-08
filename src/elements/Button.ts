import { BaseElement } from "./BaseElement";
import { MouseButton } from "@utils/type";

/**
 * A clickable button.
 *
 * Covers <button>, <input type="submit|button|reset">, and anything with
 * role="button".
 *
 * Inherits from BaseElement: isVisible, isEnabled, isDisabled, count,
 * exists, getAttribute, getCssValue, hover, waitForState.
 */
export class Button extends BaseElement {
  /**
   * Click the button.
   *
   * Waits on its own for the button to be visible, enabled and not covered
   * by anything else - no wait is needed before calling this.
   *
   * Pass MouseButton.Right to open a context menu instead of a normal click.
   * Possibe options: MouseButton.Right , MouseButton.Left , MouseButton.Middle
   */
  async click(button: MouseButton = MouseButton.Left): Promise<void> {
    if (button === MouseButton.Right) {
      return this.base.rightClick(this.locator);
    }
    return this.base.clickElement(this.locator);
  }

  /** Double-click. */
  async doubleClick(): Promise<void> {
    return this.base.doubleClick(this.locator);
  }

  /** The button's visible label. */
  async getText(): Promise<string> {
    return this.base.getText(this.locator);
  }
}
