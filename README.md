# Playwright Framework

Advanced test automation framework built with **Playwright**, **TypeScript**, and **AI Agents**.

## 🚀 Core Innovation: Auto-Generation

This framework **eliminates boilerplate** through intelligent auto-generation:

### 1️⃣ Auto-Generated Page Action Methods

Declare locators → Methods auto-generate. No manual method writing!

### 2️⃣ Auto-Generated API Tests

Update YAML endpoint contracts → Tests auto-generate. No test writing!

## 🎯 Other Features

- 📝 **Error Mapping** - Intelligent error categorization
- 🤖 **AI Agents** - Further code generation and analysis
- ⚡ **Utilities** - Comprehensive helpers (File, JSON, Date, Random, etc.)

## 💡 Examples

### Page Object with Auto-Generated Methods

```typescript
// LoginPage.ts - Just declare locators
import { BasePage } from "@/pages/BasePage";

export class LoginPage extends BasePage {
  emailInput = this.page.locator('[data-testid="email"]');
  passwordInput = this.page.locator('[data-testid="password"]');
  loginBtn = this.page.locator('button[type="submit"]');
}

// Usage - All methods auto-available! ✨
await loginPage.emailInput.fill("test@example.com");
await loginPage.passwordInput.fill("password");
await loginPage.loginBtn.click();
await loginPage.emailInput.getText();
await loginPage.emailInput.isVisible();
```

### API Tests from YAML Contract

```yaml
# config/api-endpoints.yaml
apis:
  user_api:
    baseUrl: "https://api.example.com"
    endpoints:
      - method: POST
        path: "/users"
        name: "createUser"
        request:
          body:
            name: string
            email: string
        response:
          status: 201
          schema:
            id: number
            name: string
            email: string
```

```bash
# Auto-generates: tests/api/user.test.ts ✨
# Includes:
# ✓ POST /users validation
# ✓ Request schema validation
# ✓ Response schema validation
# ✓ Error handling
# ✓ Status code checks
```

## 🗺️ Future Roadmap

### Phase 2: AI Agents 🤖

Test Generator Agent - Generate tests from requirements
Failure Analyzer Agent - Auto-analyze test failures
Code Generator Agent - Generate page objects + API classes
Locator Optimizer Agent - Suggest better locators
Documentation Generator Agent - Auto-generate docs
Test Data Generator Agent - Generate realistic test data
Agent Integration - Orchestrate all agents

## 📖 Quick Start

### Install

```bash
npm install
```

### Run Tests

```bash
npm test
```

## 📚 Documentation

See `docs/` folder for detailed guides.

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev)
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)

## 📝 License

## 👤 Author

Your Name (Akhilesh Bashettiwar)
