import { expect, test } from "bun:test";
import { clean, inspect } from "./index";

// Core cleaning tests (default: invisible + spaces only)
test("clean removes NULL characters by default", () => {
  const input = "Hello\u0000World";
  const result = clean(input);
  expect(result).toBe("HelloWorld");
});

test("clean normalizes unicode spaces by default", () => {
  const input = "Hello\u00A0World";
  const result = clean(input);
  expect(result).toBe("Hello World");
});

test("clean does not normalize dashes by default", () => {
  const input = "test\u2013dash\u2014test";
  const result = clean(input);
  expect(result).toBe("test\u2013dash\u2014test");
});

test("clean normalizes dashes when enabled", () => {
  const input = "test\u2013dash\u2014test";
  const result = clean(input, { dashes: true });
  expect(result).toBe("test-dash-test");
});

test("clean does not normalize ellipsis by default", () => {
  const input = "Wait\u2026";
  const result = clean(input);
  expect(result).toBe("Wait\u2026");
});

test("clean normalizes ellipsis when enabled", () => {
  const input = "Wait\u2026";
  const result = clean(input, { ellipsis: true });
  expect(result).toBe("Wait...");
});

test("clean removes soft hyphen when dashes enabled", () => {
  const input = "soft\u00ADhyphen";
  const result = clean(input, { dashes: true });
  expect(result).toBe("softhyphen");
});

test("clean handles empty string", () => {
  const result = clean("");
  expect(result).toBe("");
});

test("clean preserves regular ASCII text", () => {
  const input = "Hello World! 123";
  const result = clean(input);
  expect(result).toBe("Hello World! 123");
});

test("clean preserves line breaks", () => {
  const input = "Hello\nWorld";
  const result = clean(input);
  expect(result).toBe("Hello\nWorld");
});

test("clean preserves tabs", () => {
  const input = "Hello\tWorld";
  const result = clean(input);
  expect(result).toBe("Hello\tWorld");
});

// Emoji tests
test("clean preserves basic emojis", () => {
  const input = "Hello 👋 World 🚀";
  const result = clean(input);
  expect(result).toBe("Hello 👋 World 🚀");
});

test("clean preserves emoji flags", () => {
  const input = "USA 🇺🇸 France 🇫🇷";
  const result = clean(input);
  expect(result).toBe("USA 🇺🇸 France 🇫🇷");
});

test("clean preserves multi-part emojis with ZWJ", () => {
  const input = "Family: 👨‍👩‍👧‍👦";
  const result = clean(input);
  expect(result).toBe("Family: 👨‍👩‍👧‍👦");
});

test("clean preserves emojis with skin tone modifiers", () => {
  const input = "👍🏽 👨🏾‍💻";
  const result = clean(input);
  expect(result).toBe("👍🏽 👨🏾‍💻");
});

test("clean removes LLM artifacts but preserves emojis", () => {
  const input = "Hello\u0000👋\u00A0World";
  const result = clean(input);
  expect(result).toBe("Hello👋 World");
});

test("clean preserves ZWJ in emoji context", () => {
  const withEmoji = "Family: 👨‍👩‍👧‍👦";
  const withoutEmoji = "Text\u200DWith\u200DZWJ";
  expect(clean(withEmoji)).toBe("Family: 👨‍👩‍👧‍👦");
  expect(clean(withoutEmoji)).toBe("TextWithZWJ");
});

// International text tests
test("clean preserves Arabic text", () => {
  const input = "الشراء بنقرة واحدة";
  const result = clean(input);
  expect(result).toBe("الشراء بنقرة واحدة");
});

test("clean preserves Cyrillic text", () => {
  const input = "Привет мир";
  const result = clean(input);
  expect(result).toBe("Привет мир");
});

test("clean preserves Chinese text", () => {
  const input = "你好世界";
  const result = clean(input);
  expect(result).toBe("你好世界");
});

test("clean preserves smart quotes", () => {
  const input = "\u2018Hello\u2019 \u201CWorld\u201D";
  const result = clean(input);
  expect(result).toBe("\u2018Hello\u2019 \u201CWorld\u201D");
});

test("clean preserves mixed international text with LLM artifacts", () => {
  const input = "Hello\u00A0مرحبا\u2018世界\u2019";
  const result = clean(input);
  expect(result).toBe("Hello مرحبا\u2018世界\u2019");
});

// Inspect tests
test("inspect detects NULL character", () => {
  const input = "Hello\u0000World";
  const issues = inspect(input);
  expect(issues.length).toBe(1);
  expect(issues[0]?.type).toBe("control");
  expect(issues[0]?.name).toBe("NULL");
  expect(issues[0]?.position).toBe(5);
});

test("inspect detects unicode spaces", () => {
  const input = "Hello\u00A0World";
  const issues = inspect(input);
  expect(issues.length).toBe(1);
  expect(issues[0]?.type).toBe("typography");
  expect(issues[0]?.name).toBe("NO-BREAK SPACE");
});

test("inspect does not flag smart quotes", () => {
  const input = "\u2018test\u2019";
  const issues = inspect(input);
  expect(issues.length).toBe(0);
});

test("inspect does not detect dashes by default", () => {
  const input = "test\u2013dash";
  const issues = inspect(input);
  expect(issues.length).toBe(0);
});

test("inspect detects dashes when enabled", () => {
  const input = "test\u2013dash";
  const issues = inspect(input, { dashes: true });
  expect(issues.length).toBe(1);
  expect(issues[0]?.name).toBe("EN DASH");
});

test("inspect does not detect ellipsis by default", () => {
  const input = "Wait\u2026";
  const issues = inspect(input);
  expect(issues.length).toBe(0);
});

test("inspect detects ellipsis when enabled", () => {
  const input = "Wait\u2026";
  const issues = inspect(input, { ellipsis: true });
  expect(issues.length).toBe(1);
});

test("inspect returns empty array for clean text", () => {
  const input = "Hello World";
  const issues = inspect(input);
  expect(issues.length).toBe(0);
});

test("inspect does not flag emojis", () => {
  const input = "Hello 👋 World";
  const issues = inspect(input);
  expect(issues.length).toBe(0);
});

test("inspect does not flag international text", () => {
  const input = "Hello مرحبا 你好";
  const issues = inspect(input);
  expect(issues.length).toBe(0);
});

test("inspect detects mixed artifacts and typography", () => {
  const input = "\u0000Hello\u00A0World";
  const issues = inspect(input);
  expect(issues.length).toBe(2);
  expect(issues[0]?.type).toBe("control");
  expect(issues[1]?.type).toBe("typography");
});

test("inspect includes correct hex codes", () => {
  const input = "\u00A0";
  const issues = inspect(input);
  expect(issues[0]?.hex).toBe("U+00A0");
});

test("inspect detects invisible characters", () => {
  const input = "text\u200Bwith\u200Czwsp";
  const issues = inspect(input);
  expect(issues.length).toBe(2);
  expect(issues[0]?.type).toBe("invisible");
  expect(issues[1]?.type).toBe("invisible");
});

test("inspect detects BOM", () => {
  const input = "\uFEFFHello";
  const issues = inspect(input);
  expect(issues.length).toBe(1);
  expect(issues[0]?.name).toBe("ZERO WIDTH NO-BREAK SPACE (BOM)");
});

test("inspect can be disabled with all options false", () => {
  const input = "Hello\u0000\u00A0\u2013\u2026World";
  const issues = inspect(input, { invisible: false, spaces: false, dashes: false, ellipsis: false });
  expect(issues.length).toBe(0);
});

test("inspect with only spaces disabled", () => {
  const input = "Hello\u0000\u00A0World";
  const issues = inspect(input, { spaces: false });
  expect(issues.length).toBe(1); // Only NULL
  expect(issues[0]?.type).toBe("control");
});

// Edge cases
test("clean handles mixed content with all options", () => {
  const input = "Test\u0000with\u00A0\u2018quotes\u2019\u2014dash\u2026";
  const result = clean(input, { invisible: true, spaces: true, dashes: true, ellipsis: true });
  expect(result).toBe("Testwith \u2018quotes\u2019-dash...");
});

test("clean is idempotent", () => {
  const input = "Hello\u00A0World";
  const once = clean(input);
  const twice = clean(once);
  expect(once).toBe(twice);
});

test("clean handles very long strings", () => {
  const input = "a\u00A0".repeat(10000);
  const result = clean(input);
  expect(result).toBe("a ".repeat(10000));
});

test("inspect after clean shows no issues", () => {
  const input = "Hello\u0000\u00A0World";
  const cleaned = clean(input);
  const issues = inspect(cleaned);
  expect(issues.length).toBe(0);
});

test("clean with no options uses defaults", () => {
  const input = "Hello\u0000\u00A0\u2013World";
  const result = clean(input, {});
  expect(result).toBe("Hello \u2013World"); // invisible + spaces, but not dashes
});
