import { test, expect } from "@playwright/test";
import { LoginPage } from "../../src/pages/LoginPage";

const VALID_USER = "standard_user";
const VALID_PASS = "secret_sauce";

test.describe("Login", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open();
  });

  test("logs in with valid credentials", async ({ page }) => {
    await loginPage.login(VALID_USER, VALID_PASS);

    await expect(page).toHaveURL(/inventory/);
  });

  test("shows an error for a wrong password", async () => {
    await loginPage.login(VALID_USER, "wrong-password");

    expect(await loginPage.errorMessage.contains("do not match any user")).toBe(
      true,
    );
  });

  test("shows an error for a locked-out user", async () => {
    await loginPage.login("locked_out_user", VALID_PASS);

    expect(await loginPage.errorMessage.contains("locked out")).toBe(true);
  });

  test("reads element state without acting on it", async () => {
    expect(await loginPage.usernameInput.isVisible()).toBe(true);
    expect(await loginPage.loginButton.isEnabled()).toBe(true);
    expect(await loginPage.errorMessage.exists()).toBe(false);

    await loginPage.usernameInput.fill("typed-value");
    expect(await loginPage.usernameInput.getValue()).toBe("typed-value");

    await loginPage.usernameInput.clear();
    expect(await loginPage.usernameInput.getValue()).toBe("");
  });
});
