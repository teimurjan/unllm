import { expect, test } from "bun:test";
import {
  clean,
  cleanWith,
  normalize,
  findIssues,
  isClean,
  inspect,
  presets,
  type PresetName,
} from "./index";

test("clean removes invisible characters by default", () => {
  const input = "Hello\u0000World\u200B";
  const result = clean(input);
  expect(result).toBe("HelloWorld");
});

test("clean normalizes unicode spaces to ASCII", () => {
  const input = "Hello\u00A0World\u2003Test";
  const result = clean(input);
  expect(result).toBe("Hello World Test");
});

test("clean normalizes unicode quotes to ASCII", () => {
  const input = "\u2018Hello\u2019 \u201CWorld\u201D";
  const result = clean(input);
  expect(result).toBe("'Hello' \"World\"");
});

test("clean normalizes single angle quotes correctly", () => {
  const input = "\u2039single\u203A";
  const result = clean(input);
  expect(result).toBe("'single'");
});

test("clean normalizes double angle quotes to double quotes", () => {
  const input = "\u00ABdouble\u00BB";
  const result = clean(input);
  expect(result).toBe('"double"');
});

test("clean normalizes unicode dashes to ASCII hyphen", () => {
  const input = "test\u2013dash\u2014another\u2212minus";
  const result = clean(input);
  expect(result).toBe("test-dash-another-minus");
});

test("clean normalizes ellipsis to three dots", () => {
  const input = "Wait\u2026";
  const result = clean(input);
  expect(result).toBe("Wait...");
});

test("clean preserves line breaks by default", () => {
  const input = "Line1\nLine2\rLine3";
  const result = clean(input);
  expect(result).toBe("Line1\nLine2\rLine3");
});

test("clean removes tabs by default", () => {
  const input = "Hello\tWorld";
  const result = clean(input);
  expect(result).toBe("HelloWorld");
});

test("clean trims whitespace by default", () => {
  const input = "  Hello World  ";
  const result = clean(input);
  expect(result).toBe("Hello World");
});

test("clean with custom options preserves tabs", () => {
  const input = "Hello\tWorld";
  const result = clean(input, { preserveTabs: true });
  expect(result).toBe("Hello\tWorld");
});

test("clean with custom options removes line breaks", () => {
  const input = "Line1\nLine2";
  const result = clean(input, { preserveLineBreaks: false });
  expect(result).toBe("Line1Line2");
});

test("clean with custom options collapses whitespace", () => {
  const input = "Hello    World";
  const result = clean(input, { collapseWhitespace: true });
  expect(result).toBe("Hello World");
});

test("clean with custom options disables trimming", () => {
  const input = "  Hello  ";
  const result = clean(input, { trim: false });
  expect(result).toBe("  Hello  ");
});

test("clean with custom options disables normalization", () => {
  const input = "\u2018Hello\u2019";
  const result = clean(input, { normalizeQuotes: false });
  expect(result).toBe("Hello");
});

test("cleanWith strict preset removes all formatting", () => {
  const input = "  Hello\nWorld\t\u2018test\u2019  ";
  const result = cleanWith(input, "strict");
  expect(result).toBe("HelloWorld'test'");
});

test("cleanWith standard preset preserves line breaks", () => {
  const input = "Hello\nWorld";
  const result = cleanWith(input, "standard");
  expect(result).toBe("Hello\nWorld");
});

test("cleanWith lenient preset preserves tabs and line breaks", () => {
  const input = "Hello\t\nWorld";
  const result = cleanWith(input, "lenient");
  expect(result).toBe("Hello\t\nWorld");
});

test("cleanWith llm preset collapses whitespace", () => {
  const input = "Hello    World";
  const result = cleanWith(input, "llm");
  expect(result).toBe("Hello World");
});

test("cleanWith throws error for unknown preset", () => {
  expect(() => cleanWith("test", "unknown" as PresetName)).toThrow(
    "Unknown preset: unknown"
  );
});

test("normalize applies all normalizations without filtering", () => {
  const input = "Hello\u00A0\u2018World\u2019\u2014Test\u2026";
  const result = normalize(input);
  expect(result).toBe("Hello 'World'-Test...");
});

test("normalize preserves line breaks and tabs", () => {
  const input = "Hello\n\tWorld";
  const result = normalize(input);
  expect(result).toBe("Hello\n\tWorld");
});

test("normalize does not trim", () => {
  const input = "  Hello  ";
  const result = normalize(input);
  expect(result).toBe("  Hello  ");
});

test("findIssues detects invisible characters", () => {
  const input = "Hello\u0000World";
  const issues = findIssues(input);
  expect(issues).toHaveLength(1);
  expect(issues[0]?.char).toBe("\u0000");
  expect(issues[0]?.code).toBe(0);
  expect(issues[0]?.name).toBe("NUL");
  expect(issues[0]?.position).toBe(5);
});

test("findIssues detects unicode spaces", () => {
  const input = "Hello\u00A0World";
  const issues = findIssues(input);
  expect(issues).toHaveLength(1);
  expect(issues[0]?.char).toBe("\u00A0");
  expect(issues[0]?.name).toBe("NBSP");
});

test("findIssues detects unicode quotes", () => {
  const input = "\u2018test\u2019";
  const issues = findIssues(input);
  expect(issues).toHaveLength(2);
  expect(issues[0]?.name).toBe("LEFT_SINGLE_QUOTATION_MARK");
  expect(issues[1]?.name).toBe("RIGHT_SINGLE_QUOTATION_MARK");
});

test("findIssues detects unicode dashes", () => {
  const input = "test\u2013dash";
  const issues = findIssues(input);
  expect(issues).toHaveLength(1);
  expect(issues[0]?.name).toBe("EN_DASH");
});

test("findIssues detects ellipsis", () => {
  const input = "Wait\u2026";
  const issues = findIssues(input);
  expect(issues).toHaveLength(1);
  expect(issues[0]?.name).toBe("HORIZONTAL_ELLIPSIS");
});

test("findIssues returns empty array for clean text", () => {
  const input = "Hello World";
  const issues = findIssues(input);
  expect(issues).toHaveLength(0);
});

test("findIssues includes correct position", () => {
  const input = "abc\u0000def";
  const issues = findIssues(input);
  expect(issues[0]?.position).toBe(3);
});

test("findIssues includes hex code", () => {
  const input = "\u00A0";
  const issues = findIssues(input);
  expect(issues[0]?.codeHex).toBe("U+00A0");
});

test("findIssues handles unknown characters", () => {
  const input = "\u9999";
  const issues = findIssues(input);
  expect(issues[0]?.name).toBe("U+9999");
});

test("isClean returns true for clean text", () => {
  const input = "Hello World";
  expect(isClean(input)).toBe(true);
});

test("isClean returns false for text with invisible characters", () => {
  const input = "Hello\u0000World";
  expect(isClean(input)).toBe(false);
});

test("isClean returns false for text with unicode spaces", () => {
  const input = "Hello\u00A0World";
  expect(isClean(input)).toBe(false);
});

test("isClean returns false for text with unicode quotes", () => {
  const input = "\u2018Hello\u2019";
  expect(isClean(input)).toBe(false);
});

test("isClean returns true for line breaks and tabs", () => {
  const input = "Hello\nWorld\tTest";
  expect(isClean(input)).toBe(true);
});

test("inspect returns clean status for clean text", () => {
  const input = "Hello World";
  const report = inspect(input);
  expect(report.clean).toBe(true);
  expect(report.issueCount).toBe(0);
  expect(report.issues).toHaveLength(0);
  expect(Object.keys(report.summary)).toHaveLength(0);
});

test("inspect returns correct issue count", () => {
  const input = "Hello\u0000World\u00A0Test";
  const report = inspect(input);
  expect(report.clean).toBe(false);
  expect(report.issueCount).toBe(2);
  expect(report.issues).toHaveLength(2);
});

test("inspect creates summary grouped by character name", () => {
  const input = "Hello\u00A0World\u00A0Test\u0000End";
  const report = inspect(input);
  expect(report.summary.NBSP?.count).toBe(2);
  expect(report.summary.NUL?.count).toBe(1);
});

test("inspect includes code in summary", () => {
  const input = "\u00A0";
  const report = inspect(input);
  expect(report.summary.NBSP?.code).toBe("U+00A0");
});

test("inspect handles multiple different characters", () => {
  const input = "\u0000\u00A0\u2018\u2019\u2013\u2026";
  const report = inspect(input);
  expect(report.issueCount).toBe(6);
  expect(Object.keys(report.summary)).toHaveLength(6);
});

test("presets object contains all preset names", () => {
  expect(presets).toHaveProperty("strict");
  expect(presets).toHaveProperty("standard");
  expect(presets).toHaveProperty("lenient");
  expect(presets).toHaveProperty("llm");
});

test("strict preset configuration", () => {
  expect(presets.strict.preserveLineBreaks).toBe(false);
  expect(presets.strict.preserveTabs).toBe(false);
  expect(presets.strict.collapseWhitespace).toBe(true);
  expect(presets.strict.trim).toBe(true);
});

test("standard preset configuration", () => {
  expect(presets.standard.preserveLineBreaks).toBe(true);
  expect(presets.standard.preserveTabs).toBe(false);
  expect(presets.standard.collapseWhitespace).toBe(false);
  expect(presets.standard.trim).toBe(true);
});

test("lenient preset configuration", () => {
  expect(presets.lenient.preserveLineBreaks).toBe(true);
  expect(presets.lenient.preserveTabs).toBe(true);
  expect(presets.lenient.normalizeQuotes).toBe(false);
  expect(presets.lenient.trim).toBe(false);
});

test("llm preset configuration", () => {
  expect(presets.llm.preserveLineBreaks).toBe(true);
  expect(presets.llm.collapseWhitespace).toBe(true);
  expect(presets.llm.normalizeQuotes).toBe(true);
  expect(presets.llm.trim).toBe(true);
});

test("clean handles empty string", () => {
  expect(clean("")).toBe("");
});

test("clean handles string with only invisible characters", () => {
  const input = "\u0000\u200B\u200C";
  const result = clean(input);
  expect(result).toBe("");
});

test("clean handles string with only whitespace", () => {
  const input = "   \n   ";
  const result = clean(input);
  expect(result).toBe("");
});

test("clean preserves printable ASCII", () => {
  const input =
    " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
  const result = clean(input);
  expect(result).toBe(
    "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
  );
});

test("clean handles mixed content", () => {
  const input = "Hello\u0000\u00A0World\u2018test\u2019\u2014example\u2026";
  const result = clean(input);
  expect(result).toBe("Hello World'test'-example...");
});

test("collapseWhitespace with preserveLineBreaks keeps newlines", () => {
  const input = "Hello    World\n\nTest";
  const result = clean(input, {
    collapseWhitespace: true,
    preserveLineBreaks: true,
  });
  expect(result).toBe("Hello World\n\nTest");
});

test("collapseWhitespace with preserveTabs collapses multiple tabs to single space", () => {
  const input = "Hello\t\tWorld";
  const result = clean(input, { collapseWhitespace: true, preserveTabs: true });
  expect(result).toBe("Hello World");
});

test("collapseWhitespace without preserveLineBreaks collapses to single space", () => {
  const input = "Hello \n\n World";
  const result = clean(input, {
    collapseWhitespace: true,
    preserveLineBreaks: false,
  });
  expect(result).toBe("Hello World");
});

test("clean handles CR LF line endings", () => {
  const input = "Line1\r\nLine2";
  const result = clean(input);
  expect(result).toBe("Line1\r\nLine2");
});

test("clean handles only CR", () => {
  const input = "Line1\rLine2";
  const result = clean(input);
  expect(result).toBe("Line1\rLine2");
});

test("clean handles only LF", () => {
  const input = "Line1\nLine2";
  const result = clean(input);
  expect(result).toBe("Line1\nLine2");
});

test("normalize does not collapse whitespace", () => {
  const input = "Hello    World";
  const result = normalize(input);
  expect(result).toBe("Hello    World");
});

test("clean pipeline applies transformations in correct order", () => {
  const input = "\u0000Hello\u00A0\u2018World\u2019  ";
  const result = clean(input);
  expect(result).toBe("Hello 'World'");
});

test("findIssues detects all unicode space types", () => {
  const input = "\u00A0\u1680\u2000\u2001\u2002\u2003\u3000";
  const issues = findIssues(input);
  expect(issues).toHaveLength(7);
});

test("findIssues detects soft hyphen", () => {
  const input = "soft\u00ADhyphen";
  const issues = findIssues(input);
  expect(issues[0]?.name).toBe("SOFT_HYPHEN");
});

test("findIssues detects word joiner", () => {
  const input = "word\u2060joiner";
  const issues = findIssues(input);
  expect(issues[0]?.name).toBe("WORD_JOINER");
});

test("findIssues detects mathematical minus", () => {
  const input = "5\u22123";
  const issues = findIssues(input);
  expect(issues[0]?.name).toBe("MINUS_SIGN");
});

test("findIssues detects replacement character", () => {
  const input = "text\uFFFD";
  const issues = findIssues(input);
  expect(issues[0]?.name).toBe("REPLACEMENT_CHARACTER");
});

test("clean handles very long strings", () => {
  const input = "a".repeat(10000) + "\u0000" + "b".repeat(10000);
  const result = clean(input);
  expect(result.length).toBe(20000);
  expect(result.includes("\u0000")).toBe(false);
});

test("clean is idempotent", () => {
  const input = "Hello\u00A0\u2018World\u2019";
  const result1 = clean(input);
  const result2 = clean(result1);
  expect(result1).toBe(result2);
});

test("isClean returns true after cleaning", () => {
  const input = "Hello\u00A0\u2018World\u2019";
  const cleaned = clean(input);
  expect(isClean(cleaned)).toBe(true);
});

test("inspect after clean shows no issues", () => {
  const input = "Hello\u00A0\u2018World\u2019";
  const cleaned = clean(input);
  const report = inspect(cleaned);
  expect(report.clean).toBe(true);
  expect(report.issueCount).toBe(0);
});

test("clean preserves basic emojis", () => {
  const input = "Hello 👋 World 😀";
  const result = clean(input);
  expect(result).toBe("Hello 👋 World 😀");
});

test("clean preserves emoji flags", () => {
  const input = "Flags: 🇺🇸🇬🇧🇯🇵";
  const result = clean(input);
  expect(result).toBe("Flags: 🇺🇸🇬🇧🇯🇵");
});

test("clean preserves multi-part emojis with ZWJ", () => {
  const input = "Family: 👨‍👩‍👧‍👦";
  const result = clean(input);
  expect(result).toBe("Family: 👨‍👩‍👧‍👦");
});

test("clean preserves emojis with skin tone modifiers", () => {
  const input = "Thumbs: 👍🏻👍🏼👍🏽";
  const result = clean(input);
  expect(result).toBe("Thumbs: 👍🏻👍🏼👍🏽");
});

test("clean removes LLM artifacts but preserves emojis", () => {
  const input = "Hello\u00A0World 👋\u2018test\u2019";
  const result = clean(input);
  expect(result).toBe("Hello World 👋'test'");
});

test("isClean returns true for text with emojis", () => {
  const input = "Hello 👋 World";
  expect(isClean(input)).toBe(true);
});

test("findIssues ignores emojis", () => {
  const input = "Test 😀 emoji 🚀";
  const issues = findIssues(input);
  expect(issues).toHaveLength(0);
});

test("inspect treats emojis as clean", () => {
  const input = "Emoji test: 🎨🎭🎪";
  const report = inspect(input);
  expect(report.clean).toBe(true);
  expect(report.issueCount).toBe(0);
});

test("clean preserves ZWJ in emoji context", () => {
  const withEmoji = "Family: 👨‍👩‍👧‍👦";
  const withoutEmoji = "Text\u200DWith\u200DZWJ";

  expect(clean(withEmoji)).toBe("Family: 👨‍👩‍👧‍👦");
  expect(clean(withoutEmoji)).toBe("TextWithZWJ");
});

test("clean removes standalone invisible chars even with emojis present", () => {
  const input = "Hello\u0000World 👋 Test\u200B";
  const result = clean(input);
  expect(result).toBe("HelloWorld 👋 Test");
});
