import { expect, test } from "bun:test";
import { clean, inspect } from "./index";

// Core cleaning tests
test("clean removes NULL characters", () => {
  const input = "Hello\u0000World";
  const result = clean(input);
  expect(result).toBe("HelloWorld");
});

test("clean normalizes unicode spaces to ASCII", () => {
  const input = "Hello\u00A0World";
  const result = clean(input);
  expect(result).toBe("Hello World");
});

test("clean preserves smart quotes", () => {
  const input = "\u2018Hello\u2019 \u201CWorld\u201D";
  const result = clean(input);
  expect(result).toBe("\u2018Hello\u2019 \u201CWorld\u201D");
});

test("clean preserves angle quotes", () => {
  const input = "\u2039single\u203A \u00ABdouble\u00BB";
  const result = clean(input);
  expect(result).toBe("\u2039single\u203A \u00ABdouble\u00BB");
});

test("clean normalizes dashes to ASCII hyphen", () => {
  const input = "test\u2013dash\u2014test";
  const result = clean(input);
  expect(result).toBe("test-dash-test");
});

test("clean normalizes ellipsis to three dots", () => {
  const input = "Wait\u2026";
  const result = clean(input);
  expect(result).toBe("Wait...");
});

test("clean removes soft hyphen completely", () => {
  const input = "soft\u00ADhyphen";
  const result = clean(input);
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

test("clean preserves mixed international text with LLM artifacts", () => {
  const input = "Hello\u00A0مرحبا\u2018世界\u2019";
  const result = clean(input);
  expect(result).toBe("Hello مرحبا\u2018世界\u2019");
});

// Inspect tests
test("inspect detects NULL character", () => {
  const input = "Hello\u0000World";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(true);
  expect(report.issueCount).toBe(1);
  expect(report.issues[0]?.type).toBe("control");
  expect(report.issues[0]?.name).toBe("NULL");
  expect(report.issues[0]?.position).toBe(5);
});

test("inspect detects unicode spaces", () => {
  const input = "Hello\u00A0World";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(true);
  expect(report.issueCount).toBe(1);
  expect(report.issues[0]?.type).toBe("typography");
  expect(report.issues[0]?.name).toBe("NO-BREAK SPACE");
});

test("inspect does not flag smart quotes", () => {
  const input = "\u2018test\u2019";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(false);
  expect(report.issueCount).toBe(0);
});

test("inspect detects dashes", () => {
  const input = "test\u2013dash";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(true);
  expect(report.issueCount).toBe(1);
  expect(report.issues[0]?.name).toBe("EN DASH");
});

test("inspect detects ellipsis", () => {
  const input = "Wait\u2026";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(true);
  expect(report.issueCount).toBe(1);
  expect(report.issues[0]?.name).toBe("HORIZONTAL ELLIPSIS");
});

test("inspect returns clean report for ASCII text", () => {
  const input = "Hello World";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(false);
  expect(report.issueCount).toBe(0);
  expect(report.issues).toHaveLength(0);
});

test("inspect does not flag emojis", () => {
  const input = "Hello 👋 World";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(false);
  expect(report.issueCount).toBe(0);
});

test("inspect does not flag international text", () => {
  const input = "Hello مرحبا 你好";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(false);
  expect(report.issueCount).toBe(0);
});

test("inspect detects mixed artifacts and typography", () => {
  const input = "\u0000Hello\u00A0World";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(true);
  expect(report.issueCount).toBe(2);
  expect(report.issues[0]?.type).toBe("control");
  expect(report.issues[1]?.type).toBe("typography");
});

test("inspect includes correct hex codes", () => {
  const input = "\u00A0";
  const report = inspect(input);
  expect(report.issues[0]?.codeHex).toBe("U+00A0");
});

test("inspect detects invisible characters", () => {
  const input = "text\u200Bwith\u200Czwsp";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(true);
  expect(report.issueCount).toBe(2);
  expect(report.issues[0]?.type).toBe("invisible");
  expect(report.issues[1]?.type).toBe("invisible");
});

test("inspect detects BOM", () => {
  const input = "\uFEFFHello";
  const report = inspect(input);
  expect(report.needsCleaning).toBe(true);
  expect(report.issueCount).toBe(1);
  expect(report.issues[0]?.name).toBe("ZERO WIDTH NO-BREAK SPACE (BOM)");
});

// Edge cases
test("clean handles mixed content", () => {
  const input = "Test\u0000with\u00A0\u2018quotes\u2019\u2026";
  const result = clean(input);
  expect(result).toBe("Testwith \u2018quotes\u2019...");
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
  const report = inspect(cleaned);
  expect(report.needsCleaning).toBe(false);
  expect(report.issueCount).toBe(0);
});
