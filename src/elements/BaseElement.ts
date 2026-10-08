import { Locator, FrameLocator } from "@playwright/test";
// Type-only import: erased at compile time, so no circular dependency at runtime.
import type { BasePage } from "../pages/BasePage";
import { ElementState } from "@utils/type";

/**
 * Shared parent for every UI element.
 *
 * Method names match Playwright's Locator API, so anything you know from
 * playwright.dev works here. A few extra helpers exist on top - those are
 * marked in their comments.
 *
 * Every method forwards to BasePage. No element calls Playwright directly,
 * which keeps all error handling in one place (BasePage.fail).
 */
export abstract class BaseElement {
  readonly locator: Locator;
  readonly description: string;
  protected readonly base: BasePage;

  constructor(locator: Locator, base: BasePage, description: string) {
    this.locator = locator;
    this.base = base;
    this.description = description;
  }

  /** locator.isVisible() */
  async isVisible(): Promise<boolean> {
    return this.base.isVisible(this.locator);
  }

  /** locator.isEnabled() */
  async isEnabled(): Promise<boolean> {
    return this.base.isEnabled(this.locator);
  }

  /** locator.isDisabled() */
  async isDisabled(): Promise<boolean> {
    return this.base.isDisabled(this.locator);
  }

  /** locator.count() */
  async count(): Promise<number> {
    return this.base.getCount(this.locator);
  }

  /** locator.getAttribute() */
  async getAttribute(name: string): Promise<string | null> {
    return this.base.getAttribute(this.locator, name);
  }

  /**
   * Not a Playwright method. Reads a computed CSS value.
   *
   * Computed means the value the browser actually applied, after all
   * stylesheets - not what is written in the HTML style attribute.
   *
   * Colors come back as "rgb(220, 53, 69)", never as "#dc3545" or "red".
   */
  async getCssValue(property: string): Promise<string> {
    return this.base.getCssValue(this.locator, property);
  }

  /** locator.hover() */
  async hover(): Promise<void> {
    return this.base.hover(this.locator);
  }

  /**
   * Wait until the element reaches a given state.
   *
   * Rarely needed - click, fill and check already wait on their own. Use
   * this only to confirm a state without acting on it, such as a success
   * banner appearing or a spinner disappearing.
   */
  async waitForState(
    state: ElementState = ElementState.Visible,
    timeout?: number,
  ): Promise<void> {
    return this.base.waitForState(this.locator, state, timeout);
  }

  /** Not a Playwright method. Shorthand for count() > 0. */
  async exists(): Promise<boolean> {
    return (await this.count()) > 0;
  }
}
