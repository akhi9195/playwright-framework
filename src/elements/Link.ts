import { BaseElement } from "./BaseElement";
import { MouseButton } from "@utils/type";
import type { Page } from "@playwright/test";
/**
 * A hyperlink.
 *
 * Covers <a href="..."> and anything with role="link".
 *
 * Inherits from BaseElement: isVisible, isEnabled, isDisabled, count,
 * exists, getAttribute, getCssValue, hover, waitForState.
 */
export class Link extends BaseElement {
  /**
   * Click the link.
   *
   * Pass MouseButton.Right to open the context menu instead.
   * Possibe options: MouseButton.Right , MouseButton.Left , MouseButton.Middle
   */
  async click(button: MouseButton = MouseButton.Left): Promise<void> {
    if (button === MouseButton.Right) {
      return this.base.rightClick(this.locator);
    }
    return this.base.clickElement(this.locator);
  }

  /** The link's visible text. */
  async getText(): Promise<string> {
    return this.base.getText(this.locator);
  }

  /**
   * Where the link points.
   *
   * Lets you check the destination without navigating away - far faster
   * than clicking through and coming back, and it keeps the test on one
   * page. Returns null if the <a> has no href.
   */
  async getHref(): Promise<string | null> {
    return this.getAttribute("href");
  }

  /**
   * Not a Playwright method. Does this link open in a new tab?
   *
   * Worth knowing before you click: a target="_blank" link opens a new
   * page object, so the test has to switch to it rather than staying put.
   */
  async opensInNewTab(): Promise<boolean> {
    return (await this.getAttribute("target")) === "_blank";
  }

  /**
   * Click a link that opens in a new tab, and return that tab.
   *
   * Use this instead of click() when opensInNewTab() is true - a plain
   * click() would appear to do nothing, since the current page never
   * navigates.
   *
   *   const tab = await homePage.docsLink.clickAndOpenNewTab();
   *   const docsPage = new DocsPage(tab);
   *   ...
   *   await tab.close();
   */
  async clickAndOpenNewTab(timeout?: number): Promise<Page> {
    return this.base.clickAndWaitForNewTab(this.locator, timeout);
  }
}
