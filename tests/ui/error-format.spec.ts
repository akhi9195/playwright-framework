import { test } from "@playwright/test";
import { LoginPage } from "../../src/pages/LoginPage";
import { Button } from "../../src/elements/Button";

/**
 * Deliberately fails. Two uses:
 *
 *   1. See what a framework error looks like in the terminal.
 *   2. Produce a real failure in the JSON report for the failure
 *      analyzer agent to read.
 *
 * Run it on its own:
 *   npx playwright test tests/ui/error-format.spec.ts --project=chromium
 *
 * Expected output:
 *
 *   Failed to click on Button
 *     Category: SCRIPT_ISSUE
 *     Reason  : Element never became ready to act on
 *     Page    : LoginPage
 *     Target  : getByRole('button', { name: /does-not-exist/i })
 *     URL     : https://www.saucedemo.com/
 *     Elapsed : 10041ms
 *     Error   : locator.click: Timeout 10000ms exceeded.
 */
test("@manual shows the framework error format", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();

  // A button that is not on the page. Built directly rather than through
  // the factory, because factories are protected - a test should not
  // normally be constructing elements at all.
  const ghost = new Button(
    page.getByRole("button", { name: /does-not-exist/i }),
    loginPage,
    "Ghost button",
  );

  await ghost.click();
});
