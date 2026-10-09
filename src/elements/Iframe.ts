import { Locator, FrameLocator } from "@playwright/test";
import type { BasePage } from "../pages/BasePage";
import { Input } from "./Input";
import { Button } from "./Button";
import { Link } from "./Link";
import { Text } from "./Text";
import { Checkbox } from "./Checkbox";
import { Radio } from "./Radio";
import { Dropdown } from "./Dropdown";

/**
 * An iframe - a separate web page embedded inside this one.
 *
 * Common cases: payment forms from Stripe or PayPal, cookie banners,
 * embedded videos, legacy screens kept inside a newer app.
 *
 * Does NOT extend BaseElement, on purpose. An iframe is a document, not a
 * control - you never click or type into the frame itself, only into the
 * elements inside it. Giving it click() and fill() would just invite
 * mistakes.
 *
 * Why it needs its own class: a page-level locator cannot see inside a
 * frame at all. page.getByLabel("Card number") finds nothing when the
 * field lives in a payment iframe, because the browser treats the frame as
 * a separate document. Every search has to start from the frame.
 *
 *   const payment = this.iframe(page.locator("#stripe-frame"), "Payment frame");
 *   const cardNumber = payment.input(
 *     payment.findByLabel("Card number"),
 *     "Card number field",
 *   );
 *   await cardNumber.fill("4242424242424242");
 */
export class Iframe {
  /** Playwright's handle on the frame's document. */
  readonly frame: FrameLocator;

  /** Human-readable name, used when describing elements found inside. */
  readonly description: string;

  private readonly base: BasePage;

  constructor(iframeLocator: Locator, base: BasePage, description: string) {
    this.frame = iframeLocator.contentFrame();
    this.base = base;
    this.description = description;
  }

  // ============================================================
  // FINDING RAW LOCATORS INSIDE THE FRAME
  // ============================================================

  /** Find by CSS selector inside the frame. */
  find(selector: string): Locator {
    return this.frame.locator(selector);
  }

  /** Find a form field by its label inside the frame. */
  findByLabel(label: string | RegExp): Locator {
    return this.frame.getByLabel(label);
  }

  /** Find by visible text inside the frame. */
  findByText(text: string | RegExp): Locator {
    return this.frame.getByText(text);
  }

  /** Find by test id inside the frame. */
  findByTestId(testId: string): Locator {
    return this.frame.getByTestId(testId);
  }

  // ============================================================
  // BUILDING TYPED ELEMENTS FROM THE FRAME
  // ============================================================
  // Elements inside a frame behave exactly like elements on the page once
  // you have a locator for them, so they get the same classes and the same
  // error handling.

  /** Wrap a locator inside the frame as an Input. */
  input(locator: Locator, description: string): Input {
    return new Input(locator, this.base, description);
  }

  /** Wrap a locator inside the frame as a Button. */
  button(locator: Locator, description: string): Button {
    return new Button(locator, this.base, description);
  }

  /** Wrap a locator inside the frame as a Link. */
  link(locator: Locator, description: string): Link {
    return new Link(locator, this.base, description);
  }

  /** Wrap a locator inside the frame as Text. */
  text(locator: Locator, description: string): Text {
    return new Text(locator, this.base, description);
  }

  /** Wrap a locator inside the frame as a Checkbox. */
  checkbox(locator: Locator, description: string): Checkbox {
    return new Checkbox(locator, this.base, description);
  }

  /** Wrap a locator inside the frame as a Radio. */
  radio(locator: Locator, description: string): Radio {
    return new Radio(locator, this.base, description);
  }

  /** Wrap a locator inside the frame as a Dropdown. */
  dropdown(locator: Locator, description: string): Dropdown {
    return new Dropdown(locator, this.base, description);
  }

  // ============================================================
  // NESTED FRAMES
  // ============================================================

  /**
   * A frame inside this frame.
   *
   * Rare, but real - some payment providers put the card field in a frame
   * within their own frame. Each level has to be stepped through; there is
   * no way to jump straight to the innermost one.
   */
  childFrame(selector: string, description: string): Iframe {
    return new Iframe(this.find(selector), this.base, description);
  }
}
