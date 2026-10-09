import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Input } from "../elements/Input";
import { Button } from "../elements/Button";
import { Text } from "../elements/Text";

/**
 * Login page for saucedemo.com.
 *
 * Shows the standard shape of a page object:
 *   1. Declare elements as readonly fields
 *   2. Build them in the constructor with the factory methods
 *   3. Add business methods built from the element methods
 */
export class LoginPage extends BasePage {
  readonly usernameInput: Input;
  readonly passwordInput: Input;
  readonly loginButton: Button;
  readonly errorMessage: Text;

  constructor(page: Page) {
    super(page);

    this.usernameInput = this.input(
      page.getByPlaceholder("Username"),
      "Username field",
    );
    this.passwordInput = this.input(
      page.getByPlaceholder("Password"),
      "Password field",
    );
    this.loginButton = this.button(
      page.getByRole("button", { name: /login/i }),
      "Login button",
    );
    this.errorMessage = this.text(
      page.locator("[data-test='error']"),
      "Login error message",
    );
  }

  /** Open the login page. */
  async open(): Promise<void> {
    await this.goto("https://www.saucedemo.com/");
  }

  /** Fill both fields and submit. */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
