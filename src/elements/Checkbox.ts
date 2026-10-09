import { BaseElement } from "./BaseElement";

/**
 * A checkbox.
 *
 * Covers <input type="checkbox"> and anything with role="checkbox".
 *
 * Inherits from BaseElement: isVisible, isEnabled, isDisabled, count,
 * exists, getAttribute, getCssValue, hover, waitForState.
 */
export class Checkbox extends BaseElement {
  /**
   * Tick the box.
   *
   * Does nothing if it is already ticked, so calling it twice is safe.
   * That matters because a test should end in a known state regardless of
   * what the previous test left behind - unlike click(), which would
   * untick an already-ticked box.
   */
  async check(): Promise<void> {
    return this.base.check(this.locator);
  }

  /** Untick the box. Does nothing if it is already unticked. */
  async uncheck(): Promise<void> {
    return this.base.uncheck(this.locator);
  }

  /** Is the box ticked? */
  async isChecked(): Promise<boolean> {
    return this.base.isChecked(this.locator);
  }

  /**
   * Not a Playwright method. Flip to the opposite state.
   *
   * Useful for testing that a setting can be turned off and back on.
   * Prefer check() or uncheck() when you know the state you want - toggle
   * depends on what the box was before, which makes the test harder to read.
   */
  async toggle(): Promise<void> {
    if (await this.isChecked()) {
      await this.uncheck();
    } else {
      await this.check();
    }
  }

  /**
   * Not a Playwright method. Set the box to a given state.
   *
   * Handy when the wanted state comes from test data:
   *   await marketingOptIn.setChecked(user.wantsEmails);
   */
  async setChecked(checked: boolean): Promise<void> {
    if (checked) {
      await this.check();
    } else {
      await this.uncheck();
    }
  }
}
