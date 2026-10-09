/**
 * Random values for test data.
 *
 * Why generate instead of hardcoding: a test that registers
 * "test@example.com" passes once and fails on every run after, because the
 * account now exists. Unique data per run makes tests repeatable without a
 * database reset between them.
 *
 * Not cryptographically secure - Math.random is fine for test data and is
 * not used for anything that needs real randomness.
 *
 * Every method is static - there is no state to hold.
 */
export class RandomUtils {
  private static readonly LETTERS = "abcdefghijklmnopqrstuvwxyz";
  private static readonly DIGITS = "0123456789";

  private static readonly FIRST_NAMES = [
    "James",
    "Mary",
    "Robert",
    "Patricia",
    "John",
    "Jennifer",
    "Michael",
    "Linda",
    "David",
    "Elizabeth",
    "Priya",
    "Arjun",
    "Ananya",
    "Rohan",
    "Chen",
    "Wei",
    "Yuki",
    "Hiroshi",
    "Sofia",
    "Mateo",
  ];

  private static readonly LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Sharma",
    "Patel",
    "Reddy",
    "Kumar",
    "Wang",
    "Tanaka",
    "Silva",
    "Rossi",
    "Mueller",
    "Novak",
    "Okafor",
    "Haddad",
  ];

  private static readonly WORDS = [
    "alpha",
    "bravo",
    "charlie",
    "delta",
    "echo",
    "foxtrot",
    "golf",
    "hotel",
    "india",
    "juliet",
    "kilo",
    "lima",
    "mike",
    "november",
  ];

  // ============================================================
  // PRIMITIVES
  // ============================================================

  /** A whole number from min to max, both included. */
  static number(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** A decimal number from min to max, rounded to `decimals` places. */
  static decimal(min: number, max: number, decimals = 2): number {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
  }

  /** True or false. */
  static boolean(): boolean {
    return Math.random() < 0.5;
  }

  /** Lowercase letters only. */
  static string(length = 8): string {
    return RandomUtils.fromCharset(RandomUtils.LETTERS, length);
  }

  /** Letters and digits. */
  static alphanumeric(length = 8): string {
    return RandomUtils.fromCharset(
      RandomUtils.LETTERS + RandomUtils.DIGITS,
      length,
    );
  }

  /** Digits only, as a string - keeps any leading zeros. */
  static digits(length = 6): string {
    return RandomUtils.fromCharset(RandomUtils.DIGITS, length);
  }

  /** Pick one item from a list. */
  static pick<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty array");
    }
    return items[RandomUtils.number(0, items.length - 1)];
  }

  /** Pick several distinct items from a list. */
  static pickMany<T>(items: T[], count: number): T[] {
    if (count > items.length) {
      throw new Error(
        `Cannot pick ${count} distinct items from ${items.length}`,
      );
    }
    return RandomUtils.shuffle(items).slice(0, count);
  }

  /** A copy of the list in a random order. The original is left alone. */
  static shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = RandomUtils.number(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // ============================================================
  // IDENTIFIERS
  // ============================================================

  /**
   * A value that will not collide with another run.
   *
   * Combines the current time with a random suffix. The timestamp alone is
   * not enough - parallel workers can start within the same millisecond,
   * which is exactly when a duplicate would break a test.
   *
   *   RandomUtils.unique("order")  ->  "order-1760012345678-x7k2"
   */
  static unique(prefix = "test"): string {
    return `${prefix}-${Date.now()}-${RandomUtils.alphanumeric(4)}`;
  }

  /** A UUID v4. */
  static uuid(): string {
    return crypto.randomUUID();
  }

  // ============================================================
  // PEOPLE
  // ============================================================

  static firstName(): string {
    return RandomUtils.pick(RandomUtils.FIRST_NAMES);
  }

  static lastName(): string {
    return RandomUtils.pick(RandomUtils.LAST_NAMES);
  }

  static fullName(): string {
    return `${RandomUtils.firstName()} ${RandomUtils.lastName()}`;
  }

  /**
   * An email address that is unique per run.
   *
   * Uses example.com, which is reserved by the IETF for exactly this and
   * can never be registered - so a test can never accidentally send mail
   * to a real person.
   */
  static email(domain = "example.com"): string {
    return `${RandomUtils.string(6)}.${Date.now()}@${domain}`;
  }

  /**
   * A phone number in the 555 range.
   *
   * 555-01xx is reserved in North America for fiction and testing, so
   * these numbers are guaranteed not to reach anyone.
   */
  static phone(): string {
    return `555-01${RandomUtils.digits(2)}`;
  }

  /**
   * A password that satisfies the usual rules - upper, lower, digit,
   * symbol, and long enough.
   */
  static password(length = 12): string {
    const required = [
      RandomUtils.pick("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")),
      RandomUtils.pick(RandomUtils.LETTERS.split("")),
      RandomUtils.pick(RandomUtils.DIGITS.split("")),
      RandomUtils.pick("!@#$%^&*".split("")),
    ];
    const rest = RandomUtils.alphanumeric(
      Math.max(0, length - required.length),
    );
    return RandomUtils.shuffle([...required, ...rest.split("")]).join("");
  }

  // ============================================================
  // TEXT
  // ============================================================

  /** A few words, for a title or a name field. */
  static words(count = 3): string {
    return Array.from({ length: count }, () =>
      RandomUtils.pick(RandomUtils.WORDS),
    ).join(" ");
  }

  /** A sentence, capitalised and ending in a full stop. */
  static sentence(wordCount = 8): string {
    const text = RandomUtils.words(wordCount);
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private static fromCharset(charset: string, length: number): string {
    let out = "";
    for (let i = 0; i < length; i++) {
      out += charset.charAt(RandomUtils.number(0, charset.length - 1));
    }
    return out;
  }
}
