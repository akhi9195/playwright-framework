import { RandomUtils } from "./RandomUtils";
import { DateUtils } from "./DateUtils";

/** A user for registration and login tests. */
export interface TestUser {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
}

/** A product for catalogue and cart tests. */
export interface TestProduct {
  title: string;
  price: number;
  category: string;
  description: string;
  sku: string;
}

/** An order for checkout tests. */
export interface TestOrder {
  orderNumber: string;
  items: Array<{ sku: string; quantity: number; price: number }>;
  total: number;
  orderDate: string;
  deliveryDate: string;
}

/**
 * Builds whole objects of test data, rather than single values.
 *
 * RandomUtils gives you a random email; this gives you a complete user
 * whose fields hang together - the full name matches the first and last
 * name, the date of birth makes them an adult, the delivery date is after
 * the order date. Data that contradicts itself causes failures that look
 * like app bugs.
 *
 * Every builder takes an `overrides` argument, so a test can pin the one
 * field it cares about and let the rest be generated:
 *
 *   TestDataUtils.user({ email: "locked@example.com" })
 *
 * That keeps the test readable - the only thing written down is the thing
 * the test is actually about.
 */
export class TestDataUtils {
  private static readonly CATEGORIES = [
    "electronics",
    "jewelery",
    "men's clothing",
    "women's clothing",
    "books",
  ];

  // ============================================================
  // USERS
  // ============================================================

  /** A valid adult user. */
  static user(overrides: Partial<TestUser> = {}): TestUser {
    const firstName = overrides.firstName ?? RandomUtils.firstName();
    const lastName = overrides.lastName ?? RandomUtils.lastName();

    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: RandomUtils.email(),
      password: RandomUtils.password(),
      phone: RandomUtils.phone(),
      // Between 18 and 65, so age checks always pass.
      dateOfBirth: DateUtils.daysFromToday(-RandomUtils.number(18, 65) * 365),
      ...overrides,
    };
  }

  /**
   * A user who is too young to register.
   *
   * For testing that an age gate actually blocks them - the common bug is
   * an off-by-one at exactly 18, so this lands clearly inside the boundary.
   */
  static underageUser(overrides: Partial<TestUser> = {}): TestUser {
    return TestDataUtils.user({
      dateOfBirth: DateUtils.daysFromToday(-15 * 365),
      ...overrides,
    });
  }

  /**
   * A user with every field wrong, for validation tests.
   *
   * Each field breaks a different rule: empty name, malformed email, a
   * password below any sane minimum, letters in a phone number.
   */
  static invalidUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      firstName: "",
      lastName: "",
      fullName: "",
      email: "not-an-email",
      password: "123",
      phone: "abc",
      dateOfBirth: "not-a-date",
      ...overrides,
    };
  }

  // ============================================================
  // PRODUCTS
  // ============================================================

  /** A valid product. */
  static product(overrides: Partial<TestProduct> = {}): TestProduct {
    return {
      title: RandomUtils.unique("Product"),
      price: RandomUtils.decimal(10, 1000),
      category: RandomUtils.pick(TestDataUtils.CATEGORIES),
      description: RandomUtils.sentence(10),
      sku: RandomUtils.unique("SKU").toUpperCase(),
      ...overrides,
    };
  }

  // ============================================================
  // ORDERS
  // ============================================================

  /**
   * An order whose total actually matches its items.
   *
   * The total is calculated, never generated. A hardcoded total that does
   * not match the line items produces a checkout failure that looks like
   * an application bug and wastes an afternoon.
   */
  static order(overrides: Partial<TestOrder> = {}): TestOrder {
    const items =
      overrides.items ??
      Array.from({ length: RandomUtils.number(1, 4) }, () => ({
        sku: RandomUtils.unique("SKU").toUpperCase(),
        quantity: RandomUtils.number(1, 5),
        price: RandomUtils.decimal(10, 500),
      }));

    const total = Number(
      items
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2),
    );

    return {
      orderNumber: RandomUtils.unique("ORD").toUpperCase(),
      items,
      total,
      orderDate: DateUtils.today(),
      // Always after the order date - an earlier delivery is nonsense data.
      deliveryDate: DateUtils.daysFromToday(RandomUtils.number(2, 10)),
      ...overrides,
    };
  }

  // ============================================================
  // BULK
  // ============================================================

  /**
   * Several of something.
   *
   * Takes the builder itself, so it works with any of them:
   *
   *   TestDataUtils.many(TestDataUtils.user, 10)
   *   TestDataUtils.many(TestDataUtils.product, 5, { category: "books" })
   */
  static many<T>(
    builder: (overrides?: Partial<T>) => T,
    count: number,
    overrides: Partial<T> = {},
  ): T[] {
    return Array.from({ length: count }, () => builder(overrides));
  }

  // ============================================================
  // BOUNDARY VALUES
  // ============================================================

  /**
   * Strings that break input handling.
   *
   * Most field-validation bugs are found by one of these rather than by
   * another ordinary name. Loop over them against a single field.
   */
  static edgeCaseStrings(): Record<string, string> {
    return {
      empty: "",
      whitespace: "   ",
      singleChar: "a",
      veryLong: "a".repeat(500),
      sqlLike: "Robert'); DROP TABLE users;--",
      htmlLike: "<script>alert(1)</script>",
      unicode: "名前テスト",
      emoji: "test 🎉 data",
      leadingSpace: " leading",
      trailingSpace: "trailing ",
      newline: "line1\nline2",
    };
  }

  /** Numbers that break numeric input handling. */
  static edgeCaseNumbers(): Record<string, number> {
    return {
      zero: 0,
      negative: -1,
      veryLarge: Number.MAX_SAFE_INTEGER,
      verySmall: Number.MIN_SAFE_INTEGER,
      decimal: 0.1 + 0.2, // 0.30000000000000004 - floating point rounding
      tinyFraction: 0.001,
    };
  }
}
