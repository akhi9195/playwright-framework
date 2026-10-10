# Playwright AI Framework

Advanced test automation framework built with **Playwright**, **TypeScript**, and **AI Agents**.

[![npm version](https://img.shields.io/npm/v/playwright-ai-framework)](https://www.npmjs.com/package/playwright-ai-framework)
[![license](https://img.shields.io/npm/l/playwright-ai-framework)](./LICENSE)

---

## 🚀 Get Started

**Click [Use this template](https://github.com/akhi9195/playwright-framework/generate)**, or clone it:

```bash
git clone https://github.com/akhi9195/playwright-framework.git my-tests
cd my-tests
npm install
npx playwright install
npx playwright test
npx pw-analyze           # explain the failures
```

## 🚀 Core Innovation: Less Boilerplate

This framework removes the repetitive parts of test automation three ways:

### 1️⃣ Foundation Classes (BasePage.ts, BaseAPI.ts)

Packed with **all reusable methods** for:

- **UI interactions** - navigation, click, fill, text, visibility, keyboard and mouse
- **API calls** - all five verbs, auth, headers, status checks, response timing

No need to write common methods repeatedly.

### 2️⃣ Typed Elements - No Action Methods to Write

Declare a locator with its type and get every method for that element.
Thirteen methods from one line, none of them written by you.

### 3️⃣ Auto-Generated API Tests

Update a YAML endpoint contract → tests generate using **BaseAPI.ts**.
No test writing.

## 🎯 Other Features

- 📝 **Error Mapping** - every failure names its page, element, timing and category
- 🤖 **AI Agents** - further code generation and analysis (roadmap)
- ⚡ **Utilities** - File, JSON, Date, Random, Common, TestData

---

## 💡 Examples

### Page Object with Typed Elements

```typescript
// LoginPage.ts - declare elements, write only the business flow
import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Input, Button, Text } from "../elements";

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

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

`this.input()`, `this.button()` and the rest are factory methods on
`BasePage`. They hand the element a reference back to the page, which is
how errors pick up the page name.

**Every element method is already there** ✨

```typescript
await loginPage.usernameInput.fill("standard_user");
await loginPage.usernameInput.getValue();
await loginPage.usernameInput.clear();
await loginPage.usernameInput.slowType("typed slowly"); // for autocomplete fields
await loginPage.usernameInput.isVisible();
await loginPage.loginButton.click();
await loginPage.errorMessage.contains("do not match");
```

The type decides what you get. `usernameInput` is an `Input`, so the IDE
offers `fill` and `getValue` — and never `check` or `selectOption`. Wrong
calls fail at compile time instead of at 2am in CI.

| Class       | For                    | Key methods                                      |
| ----------- | ---------------------- | ------------------------------------------------ |
| `Input`     | Text fields, textareas | `fill`, `slowType`, `clear`, `getValue`, `press` |
| `Button`    | Buttons                | `click`, `doubleClick`, `getText`                |
| `Link`      | Hyperlinks             | `click`, `getHref`, `clickAndOpenNewTab`         |
| `Text`      | Labels, messages       | `getText`, `contains`, `matches`                 |
| `Checkbox`  | Checkboxes             | `check`, `uncheck`, `toggle`, `isChecked`        |
| `Radio`     | Radio buttons          | `select`, `isSelected`                           |
| `Dropdown`  | Native `<select>`      | `selectByValue`, `selectByLabel`, `getOptions`   |
| `Container` | Rows, cards, modals    | `find`, plus factories for nested elements       |
| `Iframe`    | Embedded documents     | `find`, `findByLabel`, plus factories            |

---

### API Tests from a YAML Contract

```yaml
# config/apis/product-api.yaml
name: ProductAPI
baseUrl: https://fakestoreapi.com

endpoints:
  - name: get_product
    description: Fetch a single product by id
    method: GET
    path: /products/{id}
    pathParams:
      id: 1
    expectStatus: 200
    validate:
      - path: id
        type: number
      - path: price
        greaterThan: 0

  - name: create_product
    method: POST
    path: /products
    body:
      title: Generated Test Product
      price: 499.99
      category: electronics
    expectStatus: 201
    validate:
      - path: id
        exists: true
```

```bash
npm run generate:api
```

Out comes `tests/api/generated/product-api.generated.spec.ts` ✨

```typescript
test("get_product - Fetch a single product by id", async () => {
  const res = await api.get("/products/1");

  api.expectStatus(res, 200);
  expect(typeof JsonUtils.get(res.body, "id")).toBe("number");
  expect(Number(JsonUtils.get(res.body, "price"))).toBeGreaterThan(0);
});
```

The generator writes **code, not a runtime interpreter** — so the output is
readable, debuggable, shows up in the HTML report, and can be reviewed in a
diff. It emits no HTTP of its own: every line calls `BaseAPI`, so generated
and hand-written tests share one HTTP path.

**Validation rules:** `type`, `equals`, `contains`, `matches`,
`greaterThan`, `lessThan`, `exists`. Paths use dot notation with array
indexes — `user.orders[0].total`.

### Authentication

Declare it once per contract and every endpoint in the file uses it:

```yaml
name: ProductAPI
baseUrl: https://api.example.com

auth:
  type: bearer
  token: ${API_TOKEN} # read from the environment at run time
```

| Type     | Fields                                             |
| -------- | -------------------------------------------------- |
| `bearer` | `token`                                            |
| `basic`  | `username`, `password`                             |
| `apikey` | `key`, optional `header` (defaults to `X-API-Key`) |
| `none`   | —                                                  |

**`${VAR}` keeps secrets out of the repo.** A credential written that way
becomes a `CommonUtils.env()` call in the generated test, so the real value
is read when the test runs and never appears in a committed file. A literal
value is used as-is, which is fine for a public test API and nothing else.

Contracts are checked at generation time — bearer without a token, or basic
without a password, fails with a clear message rather than producing a test
that silently sends no credentials.

---

## 📝 Error Mapping

Every action routes through one place, so a failure arrives like this:

```
Failed to click on Button
  Category: SCRIPT_ISSUE
  Reason  : Element never became ready to act on
  Page    : LoginPage
  Target  : getByRole('button', { name: /checkout/i })
  URL     : https://www.saucedemo.com/cart.html
  Elapsed : 30041ms
  Error   : locator.click: Timeout 30000ms exceeded.
```

Instead of:

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
```

Four rules make that work:

- **One chokepoint.** No framework method calls Playwright directly. Every
  command passes through `BasePage.fail()`, so the format is defined once.
- **Enriched, never swallowed.** `fail()` always rethrows. A catch block
  returning a default value produces green runs over broken apps.
- **The deepest failure wins.** An already-wrapped error passes through
  untouched, so an outer method cannot relabel a click failure as a fill
  failure and point at the wrong element.
- **Commands throw, predicates don't.** `click()` means to change state, so
  failing is exceptional. `isVisible()` asks a question, and "no" is a valid
  answer — which is what makes `if (await x.isVisible())` writable.

`ErrorMapper` names the kind of problem:

| Category            | Means                                   |
| ------------------- | --------------------------------------- |
| `SCRIPT_ISSUE`      | Locator or assertion problem            |
| `DATA_ISSUE`        | Test data missing, stale or conflicting |
| `ENVIRONMENT_ISSUE` | Service unreachable, browser crashed    |
| `DEFECT`            | A real application error                |

Rules are checked environment-first — a dead service produces the same
timeout as a slow element, so it has to be ruled out before the locator
gets blamed.

---

## ⚡ Utilities

| Class           | For                                                            |
| --------------- | -------------------------------------------------------------- |
| `FileUtils`     | Read/write with auto-created folders, listing, cleanup         |
| `JsonUtils`     | Safe parse, dot-path `get()`, deep `equals`, `merge`, `clone`  |
| `CommonUtils`   | `waitUntil`, `retry` with backoff, env readers, templating     |
| `RandomUtils`   | Collision-proof unique values, reserved test emails and phones |
| `DateUtils`     | UTC throughout, relative dates, month arithmetic that clamps   |
| `TestDataUtils` | Whole-object builders with overrides, boundary-value sets      |

---

## 🤖 AI Failure Analysis

**Setup:**

```typescript
// playwright.config.ts
reporter: [["html"], ["json", { outputFile: "test-results/results.json" }]],
```

```bash
export ANTHROPIC_API_KEY=sk-ant-...   # get one at platform.claude.com
npx playwright test
npx pw-analyze
```

It reads Playwright's JSON report, so it works on **any** Playwright
project, not only this framework. When this framework's error format is
present it picks up the extra fields and gives a sharper answer.

Defaults to `claude-haiku-5-5` — a run of 50 failures costs a few cents.

---

## 🗺️ Future Roadmap

### Phase 2: AI Agents 🤖

- **Test Generator Agent** - generate tests from written requirements
- **Code Generator Agent** - scaffold page objects from a live page's HTML
- **Locator Optimizer Agent** - suggest better locators
- **Documentation Generator Agent** - generate docs from the code
- **Test Data Generator Agent** - realistic data from a schema
- **Agent Integration** - orchestrate all of the above

## 📖 Quick Start

```bash
npm install
npx playwright install
npm run generate:api
npx playwright test
```

### Commands

```bash
npm run generate:api     # YAML contracts -> spec files
npm run test:ui          # UI tests
npm run test:api         # generate, then run API tests
npm run test:unit        # utility tests, no browser
npx playwright test      # everything
npx playwright show-report
npx pw-analyze           # explain the failures
```

---

## 📝 License

MIT

## 👤 Author

Akhilesh Bashettiwar
