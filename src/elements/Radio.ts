import { BaseElement } from "./BaseElement";

/**
 * A radio button.
 *
 * Covers <input type="radio"> and anything with role="radio".
 *
 * There is no uncheck() on purpose. A radio is only deselected by picking
 * a different one in the same group, so an uncheck() call could never
 * succeed - leaving it off means the compiler catches the mistake instead
 * of the test failing at runtime.
 *
 * Inherits from BaseElement: isVisible, isEnabled, isDisabled, count,
 * exists, getAttribute, getCssValue, hover, waitForState.
 */
export class Radio extends BaseElement {
  /**
   * Select this radio button.
   *
   * Does nothing if it is already selected, so calling it twice is safe.
   * Selecting it automatically deselects whichever one in the group was
   * chosen before.
   */
  async select(): Promise<void> {
    return this.base.check(this.locator);
  }

  /** Is this radio button the one selected in its group? */
  async isSelected(): Promise<boolean> {
    return this.base.isChecked(this.locator);
  }

  /**
   * Not a Playwright method. Which group this radio belongs to.
   *
   * Radios are grouped by a shared `name` attribute - that is what makes
   * selecting one deselect the others. Useful when verifying the markup
   * actually groups them, since a typo in `name` silently breaks the
   * mutual exclusion and every radio becomes independently selectable.
   */
  async getGroupName(): Promise<string | null> {
    return this.getAttribute("name");
  }

  /**
   * Not a Playwright method. The value this radio submits when chosen.
   *
   * Reads the `value` attribute - what the form actually sends, which is
   * often different from the label the user sees.
   */
  async getValue(): Promise<string | null> {
    return this.getAttribute("value");
  }
}
