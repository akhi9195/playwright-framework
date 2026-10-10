import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts", // the library
    cli: "bin/cli.ts", // the pw-analyze command
  },
  format: ["esm", "cjs"],
  // Generates .d.ts - this is what gives consumers autocomplete on the
  // typed elements.
  dts: true,
  clean: true,
  sourcemap: true,
  // Never bundle Playwright. The consumer's own copy must be used - two
  // instances in one project cause confusing failures.
  external: ["@playwright/test", "playwright", "playwright-core"],
});
