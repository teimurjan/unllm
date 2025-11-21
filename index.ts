/**
 * Options for cleaning and inspection
 */
export interface CleanOptions {
  /** Remove/detect control and invisible characters (default: true) */
  invisible?: boolean;
  /** Normalize/detect Unicode spaces to regular spaces (default: true) */
  spaces?: boolean;
  /** Normalize/detect em/en dashes to hyphens (default: false) */
  dashes?: boolean;
  /** Normalize/detect ellipsis to three dots (default: false) */
  ellipsis?: boolean;
}

/**
 * Information about an LLM artifact or typographic character found in text
 */
export interface Issue {
  /** The character itself */
  char: string;
  /** Unicode code point */
  code: number;
  /** Unicode code point in hexadecimal */
  hex: string;
  /** Position in the original string */
  position: number;
  /** Human-readable description */
  type: "control" | "invisible" | "typography";
  /** Character name */
  name: string;
}

/**
 * Default options
 */
const defaultOptions: Required<CleanOptions> = {
  invisible: true,
  spaces: true,
  dashes: false,
  ellipsis: false,
};

/**
 * Character mappings for normalization
 */
const UNICODE_SPACES = [
  "\u00A0", // NO-BREAK SPACE
  "\u1680", // OGHAM SPACE MARK
  "\u2000", // EN QUAD
  "\u2001", // EM QUAD
  "\u2002", // EN SPACE
  "\u2003", // EM SPACE
  "\u2004", // THREE-PER-EM SPACE
  "\u2005", // FOUR-PER-EM SPACE
  "\u2006", // SIX-PER-EM SPACE
  "\u2007", // FIGURE SPACE
  "\u2008", // PUNCTUATION SPACE
  "\u2009", // THIN SPACE
  "\u200A", // HAIR SPACE
  "\u202F", // NARROW NO-BREAK SPACE
  "\u205F", // MEDIUM MATHEMATICAL SPACE
  "\u3000", // IDEOGRAPHIC SPACE
] as const;

const DASH_MAP: Record<string, string> = {
  "\u2013": "-", // EN DASH
  "\u2014": "-", // EM DASH
  "\u2212": "-", // MINUS SIGN
  "\u00AD": "", // SOFT HYPHEN (remove completely)
};

// Invisible/control characters that LLMs incorrectly insert
const INVISIBLE_CHARS = [
  0x0000, // NULL
  0x0001,
  0x0002,
  0x0003,
  0x0004,
  0x0005,
  0x0006,
  0x0007, // Control chars
  0x0008, // BACKSPACE
  0x000b, // VERTICAL TAB
  0x000c, // FORM FEED
  0x000e,
  0x000f,
  0x0010,
  0x0011,
  0x0012,
  0x0013,
  0x0014,
  0x0015,
  0x0016,
  0x0017,
  0x0018,
  0x0019,
  0x001a,
  0x001b,
  0x001c,
  0x001d,
  0x001e,
  0x001f,
  0x007f, // DELETE
  0x0080,
  0x0081,
  0x0082,
  0x0083,
  0x0084,
  0x0085,
  0x0086,
  0x0087,
  0x0088,
  0x0089,
  0x008a,
  0x008b,
  0x008c,
  0x008d,
  0x008e,
  0x008f,
  0x0090,
  0x0091,
  0x0092,
  0x0093,
  0x0094,
  0x0095,
  0x0096,
  0x0097,
  0x0098,
  0x0099,
  0x009a,
  0x009b,
  0x009c,
  0x009d,
  0x009e,
  0x009f,
  0x200b, // ZERO WIDTH SPACE
  0x200c, // ZERO WIDTH NON-JOINER
  0x200e, // LEFT-TO-RIGHT MARK
  0x200f, // RIGHT-TO-LEFT MARK
  0x2060, // WORD JOINER
  0x2061, // FUNCTION APPLICATION
  0x2062, // INVISIBLE TIMES
  0x2063, // INVISIBLE SEPARATOR
  0x2064, // INVISIBLE PLUS
  0xfeff, // ZERO WIDTH NO-BREAK SPACE (BOM)
];

// Emoji detection
const isEmoji = (char: string): boolean => {
  const code = char.codePointAt(0);
  if (!code) return false;

  return (
    (code >= 0x1f600 && code <= 0x1f64f) || // Emoticons
    (code >= 0x1f300 && code <= 0x1f5ff) || // Misc Symbols and Pictographs
    (code >= 0x1f680 && code <= 0x1f6ff) || // Transport and Map
    (code >= 0x1f700 && code <= 0x1f77f) || // Alchemical Symbols
    (code >= 0x1f780 && code <= 0x1f7ff) || // Geometric Shapes Extended
    (code >= 0x1f800 && code <= 0x1f8ff) || // Supplemental Arrows-C
    (code >= 0x1f900 && code <= 0x1f9ff) || // Supplemental Symbols and Pictographs
    (code >= 0x1fa00 && code <= 0x1fa6f) || // Chess Symbols
    (code >= 0x1fa70 && code <= 0x1faff) || // Symbols and Pictographs Extended-A
    (code >= 0x2600 && code <= 0x26ff) || // Miscellaneous Symbols
    (code >= 0x2700 && code <= 0x27bf) || // Dingbats
    (code >= 0xfe00 && code <= 0xfe0f) || // Variation Selectors
    (code >= 0x1f1e6 && code <= 0x1f1ff) || // Regional Indicator Symbols (flags)
    (code >= 0x1f3fb && code <= 0x1f3ff) // Emoji skin tone modifiers
  );
};

// Check if text contains actual emojis (not just modifiers)
const containsEmoji = (text: string): boolean =>
  Array.from(text).some((char) => {
    const code = char.codePointAt(0);
    if (!code) return false;
    // Check for actual emojis, not just modifiers
    return (
      (code >= 0x1f600 && code <= 0x1f64f) ||
      (code >= 0x1f300 && code <= 0x1f5ff) ||
      (code >= 0x1f680 && code <= 0x1f6ff) ||
      (code >= 0x1f700 && code <= 0x1f77f) ||
      (code >= 0x1f780 && code <= 0x1f7ff) ||
      (code >= 0x1f800 && code <= 0x1f8ff) ||
      (code >= 0x1f900 && code <= 0x1f9ff) ||
      (code >= 0x1fa00 && code <= 0x1fa6f) ||
      (code >= 0x1fa70 && code <= 0x1faff) ||
      (code >= 0x2600 && code <= 0x26ff) ||
      (code >= 0x2700 && code <= 0x27bf) ||
      (code >= 0x1f1e6 && code <= 0x1f1ff)
    );
  });

// Check if character should be cleaned (control, invisible, or typography)
const needsCleaning = (char: string, options: Required<CleanOptions>): boolean => {
  const code = char.codePointAt(0);
  if (code === undefined) return false;

  // Allow emojis
  if (isEmoji(char)) return false;

  // Control and invisible characters
  if (options.invisible) {
    if (INVISIBLE_CHARS.includes(code)) return true;
    // ZWJ is only allowed in emoji context
    if (code === 0x200d) return !isEmoji(char);
  }

  // Typographic characters that should be normalized
  if (options.spaces && UNICODE_SPACES.includes(char as any)) return true;
  if (options.dashes && char in DASH_MAP) return true;
  if (options.ellipsis && code === 0x2026) return true;

  return false;
};

// Get character type and name
const getCharInfo = (
  char: string,
  code: number
): { type: Issue["type"]; name: string } => {
  // Control characters
  if (code >= 0x0000 && code <= 0x001f) {
    if (code === 0x0000) return { type: "control", name: "NULL" };
    if (code === 0x0008) return { type: "control", name: "BACKSPACE" };
    if (code === 0x000b) return { type: "control", name: "VERTICAL TAB" };
    if (code === 0x000c) return { type: "control", name: "FORM FEED" };
    return {
      type: "control",
      name: `CONTROL_${code.toString(16).toUpperCase()}`,
    };
  }

  if (code >= 0x007f && code <= 0x009f) {
    if (code === 0x007f) return { type: "control", name: "DELETE" };
    return {
      type: "control",
      name: `CONTROL_${code.toString(16).toUpperCase()}`,
    };
  }

  // Invisible characters
  if (code === 0x200b) return { type: "invisible", name: "ZERO WIDTH SPACE" };
  if (code === 0x200c)
    return { type: "invisible", name: "ZERO WIDTH NON-JOINER" };
  if (code === 0x200d) return { type: "invisible", name: "ZERO WIDTH JOINER" };
  if (code === 0x200e) return { type: "invisible", name: "LEFT-TO-RIGHT MARK" };
  if (code === 0x200f) return { type: "invisible", name: "RIGHT-TO-LEFT MARK" };
  if (code === 0x2060) return { type: "invisible", name: "WORD JOINER" };
  if (code === 0x2061)
    return { type: "invisible", name: "FUNCTION APPLICATION" };
  if (code === 0x2062) return { type: "invisible", name: "INVISIBLE TIMES" };
  if (code === 0x2063)
    return { type: "invisible", name: "INVISIBLE SEPARATOR" };
  if (code === 0x2064) return { type: "invisible", name: "INVISIBLE PLUS" };
  if (code === 0xfeff)
    return { type: "invisible", name: "ZERO WIDTH NO-BREAK SPACE (BOM)" };

  // Typography
  if (UNICODE_SPACES.includes(char as any)) {
    if (code === 0x00a0) return { type: "typography", name: "NO-BREAK SPACE" };
    if (code === 0x202f)
      return { type: "typography", name: "NARROW NO-BREAK SPACE" };
    return { type: "typography", name: "UNICODE SPACE" };
  }

  if (char in DASH_MAP) {
    if (code === 0x2013) return { type: "typography", name: "EN DASH" };
    if (code === 0x2014) return { type: "typography", name: "EM DASH" };
    if (code === 0x2212) return { type: "typography", name: "MINUS SIGN" };
    if (code === 0x00ad) return { type: "typography", name: "SOFT HYPHEN" };
  }

  return {
    type: "typography",
    name: `U+${code.toString(16).toUpperCase().padStart(4, "0")}`,
  };
};

/**
 * Inspect text for LLM artifacts and typographic characters
 * @param text - Text to inspect
 * @param options - What to detect (default: invisible and spaces only)
 * @returns Array of issues found
 */
export const inspect = (text: string, options: CleanOptions = {}): Issue[] => {
  const opts: Required<CleanOptions> = { ...defaultOptions, ...options };
  const issues: Issue[] = [];

  Array.from(text).forEach((char, position) => {
    if (needsCleaning(char, opts)) {
      const code = char.codePointAt(0)!;
      const { type, name } = getCharInfo(char, code);

      issues.push({
        char,
        code,
        hex: `U+${code.toString(16).toUpperCase().padStart(4, "0")}`,
        position,
        type,
        name,
      });
    }
  });

  return issues;
};

/**
 * Clean LLM output by removing artifacts and normalizing typography
 * @param text - Text to clean
 * @param options - What to clean (default: invisible and spaces only)
 * @returns Cleaned text
 */
export const clean = (text: string, options: CleanOptions = {}): string => {
  const opts: Required<CleanOptions> = { ...defaultOptions, ...options };
  let result = text;

  const hasEmojis = containsEmoji(text);

  // Remove control and invisible characters
  if (opts.invisible) {
    INVISIBLE_CHARS.forEach((code) => {
      // Skip ZWJ if we have emojis
      if (code === 0x200d && hasEmojis) return;
      result = result.replaceAll(String.fromCodePoint(code), "");
    });

    // Remove standalone ZWJ (not in emoji context)
    if (!hasEmojis) {
      result = result.replaceAll("\u200D", "");
    }
  }

  // Normalize Unicode spaces to regular space
  if (opts.spaces) {
    UNICODE_SPACES.forEach((space) => {
      result = result.replaceAll(space, " ");
    });
  }

  // Normalize dashes
  if (opts.dashes) {
    Object.entries(DASH_MAP).forEach(([from, to]) => {
      result = result.replaceAll(from, to);
    });
  }

  // Normalize ellipsis
  if (opts.ellipsis) {
    result = result.replaceAll("\u2026", "...");
  }

  return result;
};
