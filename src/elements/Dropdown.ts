import { BaseElement } from "./BaseElement";

/**
 * A native <select> dropdown.
 *
 * Only for real <select> elements. Custom dropdowns built from <div> and
 * <ul> - the kind most component libraries ship - do not respond to
 * selectOption() at all. Model those as a Button that opens a Container,
 * and click the option inside it.
 *
 * Inherits from BaseElement: isVisible, isEnabled, isDisabled, count,
 * exists, getAttribute, getCssValue, hover, waitForState.
 */
export class Dropdown extends BaseElement {
  /**
   * Pick an option by its `value` attribute - what the form submits.
   *
   *   <option value="in">India</option>
   *   await country.selectByValue("in");
   */
  async selectByValue(value: string): Promise<void> {
    return this.base.selectOption(this.locator, value);
  }

  /**
   * Pick an option by the text the user sees.
   *
   *   await country.selectByLabel("India");
   *
   * Prefer this in tests: it matches what a real user does, and it keeps
   * reading correctly if the underlying values change.
   *
   * Ex:
   * checkoutPage.countryDropdown.selectByLabel("India");
   */
  async selectByLabel(label: string): Promise<void> {
    return this.base.selectOptionByLabel(this.locator, label);
  }

  /**
   * The value of the selected option - not its label.
   *
   * For <option value="in">India</option> this returns "in", not "India".
   *
   * Ex:
   * checkoutPage.quantityDropdown.selectByValue("3")
   */
  async getSelectedValue(): Promise<string> {
    return this.base.getInputValue(this.locator);
  }

  /**
   * Not a Playwright method. The visible text of every option.
   *
   * Useful for checking the list is complete and correctly ordered before
   * picking from it.
   */
  async getOptions(): Promise<string[]> {
    return this.base.getOptions(this.locator);
  }

  /** Not a Playwright method. How many options the dropdown holds. */
  async getOptionCount(): Promise<number> {
    return (await this.getOptions()).length;
  }

  /**
   * Not a Playwright method. Is this option in the list?
   *
   * Checks by visible label. Matches after trimming, since HTML
   * indentation often leaves whitespace around option text.
   */
  async hasOption(label: string): Promise<boolean> {
    const options = await this.getOptions();
    return options.some((o) => o.trim() === label.trim());
  }
}
