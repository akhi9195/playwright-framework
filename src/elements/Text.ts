import { BaseElement } from "./BaseElement";

/**
 * Read-only text: labels, headings, error messages, totals, badges.
 *
 * Covers any element you read from but never type into - <p>, <span>,
 * <h1>, <div>, <label>, and anything with role="alert" or role="status".
 *
 * Inherits from BaseElement: isVisible, isEnabled, isDisabled, count,
 * exists, getAttribute, getCssValue, hover, waitForState.
 */
export class Text extends BaseElement {
  /**
   * Read the element's text.
   *
   * Returns everything in the DOM, including text hidden by CSS. Returns
   * "" rather than null, so there is no need to null-check every read.
   */
  async getText(): Promise<string> {
    return this.base.getText(this.locator);
  }

  /**
   * Not a Playwright method. Does the text contain this substring?
   *
   * Case-sensitive. Useful when only part of the message matters:
   *   await errorMessage.contains("Invalid credentials")
   * matches "Error: Invalid credentials. Please try again."
   */
  async contains(substring: string): Promise<boolean> {
    return (await this.getText()).includes(substring);
  }

  /**
   * Not a Playwright method. Is the text exactly this, ignoring
   * surrounding whitespace?
   *
   * HTML indentation often leaves newlines and spaces around text, so a
   * raw === comparison fails on markup that looks correct. This trims both
   * sides before comparing.
   */
  async equals(expected: string): Promise<boolean> {
    return (await this.getText()).trim() === expected.trim();
  }

  /**
   * Not a Playwright method. Does the text match this pattern?
   *
   * For text with values that change between runs - an order number, a
   * timestamp, a total:
   *   await confirmation.matches(/Order #\d+ confirmed/)
   */
  async matches(pattern: RegExp): Promise<boolean> {
    return pattern.test(await this.getText());
  }

  /**
   * Not a Playwright method. Is the element present but showing nothing?
   *
   * An empty container and a missing one are different bugs: empty usually
   * means the data never arrived, missing means the component never
   * rendered. Use exists() from BaseElement to tell them apart.
   */
  async isEmpty(): Promise<boolean> {
    return (await this.getText()).trim() === "";
  }
}
