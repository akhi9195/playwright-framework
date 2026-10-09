import { Locator } from "@playwright/test";
import { BaseElement } from "./BaseElement";
import { Input } from "./Input";
import { Button } from "./Button";
import { Link } from "./Link";
import { Text } from "./Text";
import { Checkbox } from "./Checkbox";
import { Radio } from "./Radio";
import { Dropdown } from "./Dropdown";

/**
 * A section of the page that holds other elements - a table row, a product
 * card, a modal, a nav bar, a list item.
 *
 * Not tied to one HTML tag. What makes something a Container is that you
 * search inside it rather than acting on it directly.
 *
 * Why it exists: when a page repeats the same structure many times, no
 * page-level locator can pick out "the Cancel button in the ORD-99 row" -
 * every row has an identical button, and Playwright refuses a locator that
 * matches more than one element. Scoping to the row first makes the button
 * unique.
 *
 *   const row = this.container(
 *     page.getByRole("row").filter({ hasText: "ORD-99" }),
 *     "Order row ORD-99",
 *   );
 *   await row.button(row.find("button.cancel"), "Cancel button").click();
 *
 * Inherits from BaseElement: isVisible, isEnabled, isDisabled, count,
 * exists, getAttribute, getCssValue, hover, waitForState.
 */
export class Container extends BaseElement {
  // ============================================================
  // FINDING RAW LOCATORS INSIDE THIS CONTAINER
  // ============================================================

  /** Find by CSS selector inside this container. */
  find(selector: string): Locator {
    return this.locator.locator(selector);
  }

  /** Find by visible text inside this container. */
  findByText(text: string | RegExp): Locator {
    return this.locator.getByText(text);
  }

  /** Find a form field by its label inside this container. */
  findByLabel(label: string | RegExp): Locator {
    return this.locator.getByLabel(label);
  }

  /** Find by test id inside this container. */
  findByTestId(testId: string): Locator {
    return this.locator.getByTestId(testId);
  }

  // ============================================================
  // BUILDING TYPED ELEMENTS FROM THIS CONTAINER
  // ============================================================
  // These wrap a locator found inside the container in the right element
  // class, so the result has the same methods and error handling as an
  // element declared on the page.

  /** Wrap a locator inside this container as an Input. */
  input(locator: Locator, description: string): Input {
    return new Input(locator, this.base, description);
  }

  /** Wrap a locator inside this container as a Button. */
  button(locator: Locator, description: string): Button {
    return new Button(locator, this.base, description);
  }

  /** Wrap a locator inside this container as a Link. */
  link(locator: Locator, description: string): Link {
    return new Link(locator, this.base, description);
  }

  /** Wrap a locator inside this container as Text. */
  text(locator: Locator, description: string): Text {
    return new Text(locator, this.base, description);
  }

  /** Wrap a locator inside this container as a Checkbox. */
  checkbox(locator: Locator, description: string): Checkbox {
    return new Checkbox(locator, this.base, description);
  }

  /** Wrap a locator inside this container as a Radio. */
  radio(locator: Locator, description: string): Radio {
    return new Radio(locator, this.base, description);
  }

  /** Wrap a locator inside this container as a Dropdown. */
  dropdown(locator: Locator, description: string): Dropdown {
    return new Dropdown(locator, this.base, description);
  }

  // ============================================================
  // READING THE CONTAINER ITSELF
  // ============================================================

  /** All the text inside this container, including its children. */
  async getText(): Promise<string> {
    return this.base.getText(this.locator);
  }

  /** Does the container hold this text anywhere inside it? */
  async contains(substring: string): Promise<boolean> {
    return (await this.getText()).includes(substring);
  }

  /** Click the container itself - for cards and rows that are clickable. */
  async click(): Promise<void> {
    return this.base.clickElement(this.locator);
  }
}
