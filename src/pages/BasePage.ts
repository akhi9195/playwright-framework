import { Page, Locator, BrowserContext } from "@playwright/test";
import { ElementActionError } from "../utils/errors/ElementActionError";
import { ElementState } from "@utils/type";
import { ElementType } from "@utils/type";

import { Input } from "../elements/Input";
import { Button } from "../elements/Button";
import { Link } from "../elements/Link";
import { Text } from "../elements/Text";
import { Checkbox } from "../elements/Checkbox";
import { Radio } from "../elements/Radio";
import { Dropdown } from "../elements/Dropdown";
import { Container } from "../elements/Container";
import { Iframe } from "../elements/Iframe";
import { ErrorMapper } from "../utils/errors/ErrorMapper";

export abstract class BasePage {
  readonly page: Page;
  protected readonly pageName: string;
  /**
   * The browser context this page belongs to - think of it as the browser
   * window holding all the tabs. Needed to catch new tabs as they open.
   */
  readonly context: BrowserContext;

  constructor(page: Page) {
    this.page = page;
    this.context = page.context();
    this.pageName = this.constructor.name; // "LoginPage", "HomePage"
  }

  // ============================================================
  // INPUT ACTIONS - typing into text fields
  // ============================================================

  /**
   * Replace the field's contents with `value`.
   * Sets the value in one shot - no keystrokes are fired.
   */
  async fillInput(locator: Locator, value: string): Promise<void> {
    const t = Date.now();
    try {
      await locator.fill(value);
    } catch (e) {
      this.fail("fill", locator, "TextInput", e, t);
    }
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
  async slowType(locator: Locator, value: string, delayMs = 50): Promise<void> {
    const t = Date.now();
    try {
      // pressSequentially(), not type() - type() is deprecated since v1.38.
      await locator.pressSequentially(value, { delay: delayMs });
    } catch (e) {
      this.fail("slowType", locator, "TextInput", e, t);
    }
  }

  /** Empty the field. */
  async clear(locator: Locator): Promise<void> {
    const t = Date.now();
    try {
      await locator.clear();
    } catch (e) {
      this.fail("clear", locator, "TextInput", e, t);
    }
  }

  // ============================================================
  // MOUSE ACTIONS - clicking and hovering
  // ============================================================

  /** Left-click. Waits for the element to be visible, enabled and unobstructed. */
  async clickElement(locator: Locator): Promise<void> {
    const t = Date.now();
    try {
      await locator.click();
    } catch (e) {
      this.fail("click", locator, "Button", e, t);
    }
  }

  /** Double-click. */
  async doubleClick(locator: Locator): Promise<void> {
    const t = Date.now();
    try {
      await locator.dblclick();
    } catch (e) {
      this.fail("doubleClick", locator, "Button", e, t);
    }
  }

  /** Right-click - opens a context menu. */
  async rightClick(locator: Locator): Promise<void> {
    const t = Date.now();
    try {
      await locator.click({ button: "right" });
    } catch (e) {
      this.fail("rightClick", locator, "Button", e, t);
    }
  }

  /**
   * Click something that opens a new tab, and return that new tab.
   *
   * A target="_blank" link does not navigate the current page - it opens a
   * second one. Playwright does not follow it automatically, so the new tab
   * has to be caught as it appears.
   *
   * Both calls go inside Promise.all on purpose. The tab can open before
   * the click() promise settles, so listening only after the click would
   * miss the event and hang until timeout.
   *
   *   const newTab = await this.clickAndWaitForNewTab(this.helpLink.locator);
   *   const helpPage = new HelpPage(newTab);
   *
   * The caller owns the returned page, including closing it.
   */
  async clickAndWaitForNewTab(
    locator: Locator,
    timeout = 10000,
  ): Promise<Page> {
    const t = Date.now();
    try {
      const [newPage] = await Promise.all([
        this.context.waitForEvent("page", { timeout }),
        locator.click(),
      ]);

      // The new tab exists but may still be blank - wait for its first paint.
      await newPage.waitForLoadState("domcontentloaded");
      return newPage;
    } catch (e) {
      this.fail("clickAndWaitForNewTab", locator, "Link", e, t);
    }
  }

  /** Move the mouse over the element - used to reveal tooltips and submenus. */
  async hover(locator: Locator): Promise<void> {
    const t = Date.now();
    try {
      await locator.hover();
    } catch (e) {
      this.fail("hover", locator, "Any", e, t);
    }
  }

  /** Drag one element onto another. */
  async dragAndDrop(source: Locator, target: Locator): Promise<void> {
    const t = Date.now();
    try {
      await source.dragTo(target);
    } catch (e) {
      this.fail("dragAndDrop", source, "Any", e, t);
    }
  }

  // ============================================================
  // KEYBOARD ACTIONS
  // ============================================================

  /** Press a single key while the element is focused, e.g. "Enter", "Tab", "Escape". */
  async press(locator: Locator, key: string): Promise<void> {
    const t = Date.now();
    try {
      await locator.press(key);
    } catch (e) {
      this.fail(`press:${key}`, locator, "Any", e, t);
    }
  }

  // ============================================================
  // CHECKBOX AND RADIO ACTIONS
  // ============================================================

  /**
   * Tick a checkbox or select a radio button.
   * Does nothing if it is already ticked - safe to call twice.
   */
  async check(locator: Locator): Promise<void> {
    const t = Date.now();
    try {
      await locator.check();
    } catch (e) {
      this.fail("check", locator, "Checkbox", e, t);
    }
  }

  /** Untick a checkbox. Does nothing if it is already unticked. */
  async uncheck(locator: Locator): Promise<void> {
    const t = Date.now();
    try {
      await locator.uncheck();
    } catch (e) {
      this.fail("uncheck", locator, "Checkbox", e, t);
    }
  }

  // ============================================================
  // DROPDOWN ACTIONS
  // ============================================================

  /** Select an option by its `value` attribute. */
  async selectOption(locator: Locator, value: string): Promise<void> {
    const t = Date.now();
    try {
      await locator.selectOption(value);
    } catch (e) {
      this.fail("select", locator, "Dropdown", e, t);
    }
  }

  /** Select an option by its visible text. */
  async selectOptionByLabel(locator: Locator, label: string): Promise<void> {
    const t = Date.now();
    try {
      await locator.selectOption({ label });
    } catch (e) {
      this.fail("selectByLabel", locator, "Dropdown", e, t);
    }
  }

  /** Read the visible text of every option in the dropdown. */
  async getOptions(locator: Locator): Promise<string[]> {
    const t = Date.now();
    try {
      // NOT selectOption() - that DESELECTS. Read the <option> children.
      return await locator.locator("option").allTextContents();
    } catch (e) {
      this.fail("getOptions", locator, "Dropdown", e, t);
    }
  }

  // ============================================================
  // READ ACTIONS - pulling values out of the page
  // ============================================================

  /** Read the element's text. Returns "" rather than null so callers need no null check. */
  async getText(locator: Locator): Promise<string> {
    const t = Date.now();
    try {
      return (await locator.textContent()) ?? "";
    } catch (e) {
      this.fail("getText", locator, "Text", e, t);
    }
  }

  /** Read the current value of an input, textarea or select. */
  async getInputValue(locator: Locator): Promise<string> {
    const t = Date.now();
    try {
      return await locator.inputValue();
    } catch (e) {
      this.fail("getInputValue", locator, "TextInput", e, t);
    }
  }

  /** Read an HTML attribute, e.g. "href", "placeholder", "data-id". */
  async getAttribute(locator: Locator, name: string): Promise<string | null> {
    const t = Date.now();
    try {
      return await locator.getAttribute(name);
    } catch (e) {
      this.fail(`getAttribute:${name}`, locator, "Any", e, t);
    }
  }

  /** Read a computed CSS value, e.g. "color", "display", "border-color". */
  async getCssValue(locator: Locator, property: string): Promise<string> {
    const t = Date.now();
    try {
      return await locator.evaluate(
        (el, prop) => window.getComputedStyle(el).getPropertyValue(prop),
        property,
      );
    } catch (e) {
      this.fail(`getCssValue:${property}`, locator, "Any", e, t);
    }
  }

  // ============================================================
  // WAIT STATES (attached / detached / visible / hidden)

  /**
   * Wait until the element reaches a given state.
   *
   * Rarely needed - click, fill and check already wait on their own. Use
   * this only to confirm a state without acting on it, such as a success
   * banner appearing or a spinner disappearing.
   */
  async waitForState(
    locator: Locator,
    state: ElementState = ElementState.Visible,
    timeout = 10000,
  ): Promise<void> {
    const t = Date.now();
    try {
      // waitFor(), not waitForSelector() - no deprecated ElementHandle returned.
      await locator.waitFor({ state, timeout });
    } catch (e) {
      this.fail(`waitFor:${state}`, locator, "Container", e, t);
    }
  }

  // ============================================================
  // PAGE-LEVEL ACTIONS - whole page, no element involved
  // ============================================================

  /** Open a URL. */
  // async goto(url: string): Promise<void> {
  //   const t = Date.now();
  //   try {
  //     await this.page.goto(url);
  //   } catch (e) {
  //     // No Locator here, so build the error directly instead of via fail().
  //     if (e instanceof ElementActionError) throw e;
  //     throw new ElementActionError("goto", url, "Any", e, {
  //       pageName: this.pageName,
  //       url,
  //       elapsedMs: Date.now() - t,
  //     });
  //   }
  // }

  async goto(url: string, timeout = 30000): Promise<void> {
    const t = Date.now();
    try {
      await this.page.goto(url, { waitUntil: "domcontentloaded", timeout });
    } catch (e) {
      // No Locator here, so build the error directly instead of via fail().
      if (e instanceof ElementActionError) throw e;
      throw new ElementActionError("goto", url, "Any", e, {
        pageName: this.pageName,
        url,
        elapsedMs: Date.now() - t,
      });
    }
  }

  /** Reload the current page. */
  async reload(): Promise<void> {
    const t = Date.now();
    const current = this.safeUrl();
    try {
      await this.page.reload();
    } catch (e) {
      if (e instanceof ElementActionError) throw e;
      throw new ElementActionError("reload", current, "Any", e, {
        pageName: this.pageName,
        url: current,
        elapsedMs: Date.now() - t,
      });
    }
  }

  /** Save a screenshot to screenshots/<name>.png. */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  // ============================================================
  // PREDICATES - questions, not commands
  // ============================================================
  // These return false instead of throwing. "Is it visible?" has a valid
  // answer of "no", so an absent element is not a failure. Throwing here
  // would make `if (await this.isVisible(x))` impossible to write.

  /** Is the element on screen? */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /** Can the element be interacted with? */
  async isEnabled(locator: Locator): Promise<boolean> {
    try {
      return await locator.isEnabled();
    } catch {
      return false;
    }
  }

  /** Is the element greyed out or blocked? */
  async isDisabled(locator: Locator): Promise<boolean> {
    return !(await this.isEnabled(locator));
  }

  /** Is the checkbox or radio ticked? */
  async isChecked(locator: Locator): Promise<boolean> {
    try {
      return await locator.isChecked();
    } catch {
      return false;
    }
  }

  /** How many elements match this locator? */
  async getCount(locator: Locator): Promise<number> {
    try {
      return await locator.count();
    } catch {
      return 0;
    }
  }

  /** Is there at least one match in the DOM? */
  async exists(locator: Locator): Promise<boolean> {
    return (await this.getCount(locator)) > 0;
  }

  // ============================================================
  // ELEMENT FACTORIES
  // ============================================================
  // Build a typed element and hand it a reference back to this page, so
  // its actions route through this class's error handling.
  //
  //   this.loginBtn = this.button(
  //     page.getByRole("button", { name: /log in/i }),
  //     "Login button",
  //   );

  /** A text field or textarea. */
  protected input(locator: Locator, description: string): Input {
    return new Input(locator, this, description);
  }

  /** A clickable button. */
  protected button(locator: Locator, description: string): Button {
    return new Button(locator, this, description);
  }

  /** A hyperlink. */
  protected link(locator: Locator, description: string): Link {
    return new Link(locator, this, description);
  }

  /** Read-only text: labels, headings, error messages. */
  protected text(locator: Locator, description: string): Text {
    return new Text(locator, this, description);
  }

  /** A checkbox. */
  protected checkbox(locator: Locator, description: string): Checkbox {
    return new Checkbox(locator, this, description);
  }

  /** A radio button. */
  protected radio(locator: Locator, description: string): Radio {
    return new Radio(locator, this, description);
  }

  /** A native <select> dropdown. */
  protected dropdown(locator: Locator, description: string): Dropdown {
    return new Dropdown(locator, this, description);
  }

  /** A section holding other elements - a table row, a card, a modal. */
  protected container(locator: Locator, description: string): Container {
    return new Container(locator, this, description);
  }

  /** An embedded page. Pass the locator for the <iframe> tag itself. */
  protected iframe(locator: Locator, description: string): Iframe {
    return new Iframe(locator, this, description);
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  /**
   * The one place where every failed action turns into a readable error.
   *
   * Every command method (click, fill, select...) calls this from its catch
   * block instead of throwing on its own. That gives us two things:
   *
   * 1. One format for all failures. Change the message here and every error
   *    in the framework changes with it.
   *
   * 2. The original error survives. If the error we caught was already built
   *    by a deeper method, we pass it straight through instead of wrapping it
   *    again. Without this, an outer method would relabel the failure with its
   *    own arguments and point at the wrong element.
   *
   * The `never` return type tells TypeScript "this function always throws, it
   * never comes back". That is why a method like getText() can end with a
   * catch block and still compile - TypeScript knows the catch cannot fall
   * through without returning a value.
   */
  protected fail(
    action: string,
    locator: Locator,
    elementType: ElementType,
    error: unknown,
    startedAt: number,
  ): never {
    if (error instanceof ElementActionError) throw error; // don't double-wrap

    const { category, rootCause } = ErrorMapper.analyze(error as Error);

    throw new ElementActionError(
      action,
      locator.toString(),
      elementType,
      error,
      {
        pageName: this.pageName,
        url: this.safeUrl(),
        elapsedMs: Date.now() - startedAt,
        category,
        rootCause,
      },
    );
  }

  /**
   * Returns the current URL, or "n/a" if the page is already closed.
   *
   * page.url() throws on a closed page or browser - which is exactly the
   * situation we are usually in when building an error message. Without this
   * guard, the reporter would throw its own error and replace the real
   * failure with "Target page, context or browser has been closed".
   *
   * Use it only inside error handling. Normal code should call page.url()
   * directly - a closed page there is a real problem worth failing on.
   */
  private safeUrl(): string {
    try {
      return this.page.url();
    } catch {
      return "n/a";
    }
  }
}
