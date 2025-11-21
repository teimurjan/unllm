/**
 * Options for text cleaning
 */
export interface CleanOptions {
  /** Preserve line breaks (\\n) */
  preserveLineBreaks?: boolean;
  /** Preserve tabs (\\t) */
  preserveTabs?: boolean;
  /** Normalize Unicode spaces to ASCII space */
  normalizeSpaces?: boolean;
  /** Normalize Unicode quotes to ASCII quotes */
  normalizeQuotes?: boolean;
  /** Normalize Unicode dashes (em dash, en dash) to ASCII hyphen */
  normalizeDashes?: boolean;
  /** Normalize Unicode ellipsis (…) to three dots */
  normalizeEllipsis?: boolean;
  /** Collapse multiple whitespace into single space */
  collapseWhitespace?: boolean;
  /** Trim leading and trailing whitespace */
  trim?: boolean;
}

/**
 * Information about a non-keyboard character found in text
 */
export interface Issue {
  /** The character itself */
  char: string;
  /** Unicode code point */
  code: number;
  /** Unicode code point in hexadecimal */
  codeHex: string;
  /** Position in the original string */
  position: number;
  /** Human-readable name of the character */
  name: string;
}

/**
 * Detailed inspection report
 */
export interface InspectionReport {
  /** Whether the text is clean (no issues found) */
  clean: boolean;
  /** Total number of issues found */
  issueCount: number;
  /** Array of all issues found */
  issues: Issue[];
  /** Summary grouped by character name */
  summary: Record<string, { count: number; code: string }>;
}

/**
 * Preset name type
 */
export type PresetName = 'strict' | 'standard' | 'lenient' | 'llm';

/**
 * Preset configurations optimized for different use cases
 */
export const presets: Record<PresetName, CleanOptions> = {
  // Only printable ASCII, no line breaks
  strict: {
    preserveLineBreaks: false,
    preserveTabs: false,
    normalizeSpaces: true,
    normalizeQuotes: true,
    normalizeDashes: true,
    normalizeEllipsis: true,
    collapseWhitespace: true,
    trim: true,
  },

  // Balanced: preserve structure, normalize Unicode
  standard: {
    preserveLineBreaks: true,
    preserveTabs: false,
    normalizeSpaces: true,
    normalizeQuotes: true,
    normalizeDashes: true,
    normalizeEllipsis: true,
    collapseWhitespace: false,
    trim: true,
  },

  // Minimal cleaning, preserve formatting
  lenient: {
    preserveLineBreaks: true,
    preserveTabs: true,
    normalizeSpaces: true,
    normalizeQuotes: false,
    normalizeDashes: false,
    normalizeEllipsis: false,
    collapseWhitespace: false,
    trim: false,
  },

  // Optimized for LLM output (common issues)
  llm: {
    preserveLineBreaks: true,
    preserveTabs: false,
    normalizeSpaces: true,
    normalizeQuotes: true,
    normalizeDashes: true,
    normalizeEllipsis: true,
    collapseWhitespace: true,
    trim: true,
  },
};

/**
 * Default options for cleaning
 */
const defaultOptions: Required<CleanOptions> = {
  preserveLineBreaks: true,
  preserveTabs: false,
  normalizeSpaces: true,
  normalizeQuotes: true,
  normalizeDashes: true,
  normalizeEllipsis: true,
  collapseWhitespace: false,
  trim: true,
};

/**
 * Character mappings (immutable)
 */
const UNICODE_SPACES = [
  '\u00A0', // NBSP
  '\u1680', // OGHAM_SPACE_MARK
  '\u2000', // EN_QUAD
  '\u2001', // EM_QUAD
  '\u2002', // EN_SPACE
  '\u2003', // EM_SPACE
  '\u2004', // THREE_PER_EM_SPACE
  '\u2005', // FOUR_PER_EM_SPACE
  '\u2006', // SIX_PER_EM_SPACE
  '\u2007', // FIGURE_SPACE
  '\u2008', // PUNCTUATION_SPACE
  '\u2009', // THIN_SPACE
  '\u200A', // HAIR_SPACE
  '\u202F', // NARROW_NO_BREAK_SPACE
  '\u205F', // MEDIUM_MATHEMATICAL_SPACE
  '\u3000', // IDEOGRAPHIC_SPACE
] as const;

const SINGLE_QUOTE_MAP: Record<string, string> = {
  '\u2018': "'", // LEFT_SINGLE_QUOTATION_MARK
  '\u2019': "'", // RIGHT_SINGLE_QUOTATION_MARK
  '\u201A': "'", // SINGLE_LOW_9_QUOTATION_MARK
  '\u201B': "'", // SINGLE_HIGH_REVERSED_9_QUOTATION_MARK
  '\u2039': "'", // SINGLE_LEFT_POINTING_ANGLE_QUOTATION_MARK (fixed)
  '\u203A': "'", // SINGLE_RIGHT_POINTING_ANGLE_QUOTATION_MARK (fixed)
};

const DOUBLE_QUOTE_MAP: Record<string, string> = {
  '\u201C': '"', // LEFT_DOUBLE_QUOTATION_MARK
  '\u201D': '"', // RIGHT_DOUBLE_QUOTATION_MARK
  '\u201E': '"', // DOUBLE_LOW_9_QUOTATION_MARK
  '\u201F': '"', // DOUBLE_HIGH_REVERSED_9_QUOTATION_MARK
  '\u00AB': '"', // LEFT_POINTING_DOUBLE_ANGLE_QUOTATION_MARK
  '\u00BB': '"', // RIGHT_POINTING_DOUBLE_ANGLE_QUOTATION_MARK
};

const DASH_MAP: Record<string, string> = {
  '\u2013': '-', // EN_DASH
  '\u2014': '-', // EM_DASH
  '\u2015': '-', // HORIZONTAL_BAR
  '\u2212': '-', // MINUS_SIGN (mathematical minus)
  '\uFE58': '-', // SMALL_EM_DASH
  '\uFE63': '-', // SMALL_HYPHEN_MINUS
};

const INVISIBLE_CHARS = [
  '\u0000', // NUL
  '\u00AD', // Soft hyphen
  '\u200B', // Zero-width space
  '\u200C', // Zero-width non-joiner
  '\u200D', // Zero-width joiner (used in emoji, but invisible otherwise)
  '\u200E', // Left-to-right mark
  '\u200F', // Right-to-left mark
  '\u202A', // Left-to-right embedding
  '\u202B', // Right-to-left embedding
  '\u202C', // Pop directional formatting
  '\u202D', // Left-to-right override
  '\u202E', // Right-to-left override
  '\u2060', // Word joiner
  '\u2061', // Function application
  '\u2062', // Invisible times
  '\u2063', // Invisible separator
  '\u2064', // Invisible plus
  '\u2066', // Left-to-right isolate
  '\u2067', // Right-to-left isolate
  '\u2068', // First strong isolate
  '\u2069', // Pop directional isolate
  '\uFEFF', // Zero-width no-break space (BOM)
  '\uFFFC', // Object replacement character
  '\uFFFD', // Replacement character
] as const;

const EMOJI_INVISIBLE_CHARS = [
  '\u200D', // Zero-width joiner (used in multi-part emojis)
] as const;

const VARIATION_SELECTORS_REGEX = /[\uFE00-\uFE0F]/g;

const CHAR_NAMES: Record<number, string> = {
  0x0000: 'NUL',
  0x0009: 'TAB',
  0x000A: 'LF',
  0x000D: 'CR',
  0x00A0: 'NBSP',
  0x1680: 'OGHAM_SPACE_MARK',
  0x2000: 'EN_QUAD',
  0x2001: 'EM_QUAD',
  0x2002: 'EN_SPACE',
  0x2003: 'EM_SPACE',
  0x2004: 'THREE_PER_EM_SPACE',
  0x2005: 'FOUR_PER_EM_SPACE',
  0x2006: 'SIX_PER_EM_SPACE',
  0x2007: 'FIGURE_SPACE',
  0x2008: 'PUNCTUATION_SPACE',
  0x2009: 'THIN_SPACE',
  0x200A: 'HAIR_SPACE',
  0x200B: 'ZERO_WIDTH_SPACE',
  0x200C: 'ZERO_WIDTH_NON_JOINER',
  0x200D: 'ZERO_WIDTH_JOINER',
  0x202F: 'NARROW_NO_BREAK_SPACE',
  0x205F: 'MEDIUM_MATHEMATICAL_SPACE',
  0x2060: 'WORD_JOINER',
  0x3000: 'IDEOGRAPHIC_SPACE',
  0xFEFF: 'ZERO_WIDTH_NO_BREAK_SPACE',
  0x2018: 'LEFT_SINGLE_QUOTATION_MARK',
  0x2019: 'RIGHT_SINGLE_QUOTATION_MARK',
  0x201A: 'SINGLE_LOW_9_QUOTATION_MARK',
  0x201B: 'SINGLE_HIGH_REVERSED_9_QUOTATION_MARK',
  0x201C: 'LEFT_DOUBLE_QUOTATION_MARK',
  0x201D: 'RIGHT_DOUBLE_QUOTATION_MARK',
  0x201E: 'DOUBLE_LOW_9_QUOTATION_MARK',
  0x201F: 'DOUBLE_HIGH_REVERSED_9_QUOTATION_MARK',
  0x2039: 'SINGLE_LEFT_POINTING_ANGLE_QUOTATION_MARK',
  0x203A: 'SINGLE_RIGHT_POINTING_ANGLE_QUOTATION_MARK',
  0x00AB: 'LEFT_POINTING_DOUBLE_ANGLE_QUOTATION_MARK',
  0x00BB: 'RIGHT_POINTING_DOUBLE_ANGLE_QUOTATION_MARK',
  0x2013: 'EN_DASH',
  0x2014: 'EM_DASH',
  0x2015: 'HORIZONTAL_BAR',
  0x2016: 'DOUBLE_VERTICAL_LINE',
  0x2026: 'HORIZONTAL_ELLIPSIS',
  0x00AD: 'SOFT_HYPHEN',
  0x200E: 'LEFT_TO_RIGHT_MARK',
  0x200F: 'RIGHT_TO_LEFT_MARK',
  0x202A: 'LEFT_TO_RIGHT_EMBEDDING',
  0x202B: 'RIGHT_TO_LEFT_EMBEDDING',
  0x202C: 'POP_DIRECTIONAL_FORMATTING',
  0x202D: 'LEFT_TO_RIGHT_OVERRIDE',
  0x202E: 'RIGHT_TO_LEFT_OVERRIDE',
  0x2061: 'FUNCTION_APPLICATION',
  0x2062: 'INVISIBLE_TIMES',
  0x2063: 'INVISIBLE_SEPARATOR',
  0x2064: 'INVISIBLE_PLUS',
  0x2066: 'LEFT_TO_RIGHT_ISOLATE',
  0x2067: 'RIGHT_TO_LEFT_ISOLATE',
  0x2068: 'FIRST_STRONG_ISOLATE',
  0x2069: 'POP_DIRECTIONAL_ISOLATE',
  0x2212: 'MINUS_SIGN',
  0xFE58: 'SMALL_EM_DASH',
  0xFE63: 'SMALL_HYPHEN_MINUS',
  0xFFFC: 'OBJECT_REPLACEMENT_CHARACTER',
  0xFFFD: 'REPLACEMENT_CHARACTER',
};

/**
 * Pure function: Check if a character is an emoji (excluding emoji modifiers)
 */
const isActualEmoji = (char: string): boolean => {
  const code = char.codePointAt(0);
  if (!code) return false;

  // Actual emoji ranges (excluding modifiers like ZWJ and variation selectors)
  return (
    (code >= 0x1F600 && code <= 0x1F64F) || // Emoticons
    (code >= 0x1F300 && code <= 0x1F5FF) || // Misc Symbols and Pictographs
    (code >= 0x1F680 && code <= 0x1F6FF) || // Transport and Map
    (code >= 0x1F700 && code <= 0x1F77F) || // Alchemical Symbols
    (code >= 0x1F780 && code <= 0x1F7FF) || // Geometric Shapes Extended
    (code >= 0x1F800 && code <= 0x1F8FF) || // Supplemental Arrows-C
    (code >= 0x1F900 && code <= 0x1F9FF) || // Supplemental Symbols and Pictographs
    (code >= 0x1FA00 && code <= 0x1FA6F) || // Chess Symbols
    (code >= 0x1FA70 && code <= 0x1FAFF) || // Symbols and Pictographs Extended-A
    (code >= 0x2600 && code <= 0x26FF) ||   // Misc symbols
    (code >= 0x2700 && code <= 0x27BF) ||   // Dingbats
    (code >= 0x1F1E6 && code <= 0x1F1FF) || // Regional Indicator Symbols (flags)
    (code >= 0x1F191 && code <= 0x1F251) || // Enclosed characters
    (code >= 0x1F100 && code <= 0x1F1FF) || // Enclosed Alphanumeric Supplement
    (code >= 0x2300 && code <= 0x23FF) ||   // Miscellaneous Technical
    (code >= 0x2B50 && code <= 0x2B55)      // Stars
  );
};

/**
 * Pure function: Check if a character is an emoji or emoji modifier
 */
const isEmoji = (char: string): boolean => {
  const code = char.codePointAt(0);
  if (!code) return false;

  return (
    isActualEmoji(char) ||
    (code >= 0xFE00 && code <= 0xFE0F) ||   // Variation Selectors
    code === 0x200D ||                       // Zero Width Joiner (used in emoji sequences)
    (code >= 0x1F3FB && code <= 0x1F3FF)    // Emoji skin tone modifiers
  );
};

/**
 * Pure function: Check if a character is keyboard-printable or emoji
 */
const isKeyboardChar = (char: string): boolean => {
  if (char.length === 0) return false;
  const code = char.charCodeAt(0);

  // Printable ASCII (32-126) + TAB (9) + LF (10) + CR (13)
  if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
    return true;
  }

  // Allow emojis
  if (isEmoji(char)) {
    return true;
  }

  return false;
};

/**
 * Pure function: Get character name for a Unicode code point
 */
const getCharName = (code: number): string =>
  CHAR_NAMES[code] ?? `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;

/**
 * Pure function: Normalize Unicode spaces to ASCII space
 */
const normalizeSpaces = (text: string): string =>
  UNICODE_SPACES.reduce(
    (result, space) => result.replaceAll(space, ' '),
    text
  );

/**
 * Pure function: Normalize Unicode quotes to ASCII quotes
 */
const normalizeQuotes = (text: string): string =>
  Object.entries({ ...SINGLE_QUOTE_MAP, ...DOUBLE_QUOTE_MAP }).reduce(
    (result, [unicode, ascii]) => result.replaceAll(unicode, ascii),
    text
  );

/**
 * Pure function: Normalize Unicode dashes to ASCII hyphen
 */
const normalizeDashes = (text: string): string =>
  Object.entries(DASH_MAP).reduce(
    (result, [unicode, ascii]) => result.replaceAll(unicode, ascii),
    text
  );

/**
 * Pure function: Normalize Unicode ellipsis to three dots
 */
const normalizeEllipsis = (text: string): string =>
  text.replaceAll('\u2026', '...');

/**
 * Pure function: Check if a string contains any actual emojis (not just modifiers)
 */
const containsEmoji = (text: string): boolean =>
  Array.from(text).some(isActualEmoji);

/**
 * Pure function: Remove all invisible characters (strict mode)
 */
const removeInvisibleChars = (text: string): string =>
  INVISIBLE_CHARS.reduce(
    (result, char) => result.replaceAll(char, ''),
    text.replace(VARIATION_SELECTORS_REGEX, '')
  );

/**
 * Pure function: Remove invisible characters but preserve emoji components
 */
const removeInvisibleCharsExceptEmoji = (text: string): string => {
  // If no emojis present, do strict removal
  if (!containsEmoji(text)) {
    return removeInvisibleChars(text);
  }

  // If emojis present, preserve ZWJ and variation selectors
  const charsToRemove = INVISIBLE_CHARS.filter(
    char => !EMOJI_INVISIBLE_CHARS.includes(char as typeof EMOJI_INVISIBLE_CHARS[number])
  );

  return charsToRemove.reduce(
    (result, char) => result.replaceAll(char, ''),
    text
    // Keep variation selectors when emojis are present
  );
};

/**
 * Pure function: Filter characters based on preservation rules
 */
const filterChars = (
  text: string,
  preserveLineBreaks: boolean,
  preserveTabs: boolean
): string =>
  Array.from(text)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return (
        (code >= 32 && code <= 126) || // Printable ASCII
        (preserveLineBreaks && (code === 10 || code === 13)) || // LF or CR
        (preserveTabs && code === 9) || // TAB
        isEmoji(char) // Preserve emojis
      );
    })
    .join('');

/**
 * Pure function: Collapse whitespace
 */
const collapseWhitespace = (
  text: string,
  preserveLineBreaks: boolean,
  preserveTabs: boolean
): string => {
  if (preserveLineBreaks && preserveTabs) {
    return text.replace(/[ \t]+/g, ' ');
  }
  if (preserveLineBreaks) {
    return text.replace(/ +/g, ' ');
  }
  if (preserveTabs) {
    return text.replace(/[ \n\r]+/g, ' ');
  }
  return text.replace(/\s+/g, ' ');
};

/**
 * Pure function: Detect non-keyboard characters in text
 */
const detectNonKeyboardChars = (text: string): Issue[] =>
  Array.from(text)
    .map((char, position) => ({ char, position }))
    .filter(({ char }) => !isKeyboardChar(char))
    .map(({ char, position }) => {
      const code = char.charCodeAt(0);
      return {
        char,
        code,
        codeHex: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        position,
        name: getCharName(code),
      };
    });

/**
 * Pure function: Create summary from issues
 */
const createSummary = (
  issues: Issue[]
): Record<string, { count: number; code: string }> =>
  issues.reduce((summary, issue) => {
    const existing = summary[issue.name];
    return {
      ...summary,
      [issue.name]: {
        count: existing ? existing.count + 1 : 1,
        code: issue.codeHex,
      },
    };
  }, {} as Record<string, { count: number; code: string }>);

/**
 * Pure function: Apply transformations as a pipeline
 */
const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduce((acc, fn) => fn(acc), value);

/**
 * Pure function: Core sanitization logic
 */
const sanitize = (text: string, options: CleanOptions): string => {
  const opts = { ...defaultOptions, ...options };

  const transformations = [
    removeInvisibleCharsExceptEmoji, // Smart removal that preserves emoji components
    opts.normalizeSpaces ? normalizeSpaces : (t: string) => t,
    opts.normalizeQuotes ? normalizeQuotes : (t: string) => t,
    opts.normalizeDashes ? normalizeDashes : (t: string) => t,
    opts.normalizeEllipsis ? normalizeEllipsis : (t: string) => t,
    (t: string) => filterChars(t, opts.preserveLineBreaks, opts.preserveTabs),
    opts.collapseWhitespace
      ? (t: string) => collapseWhitespace(t, opts.preserveLineBreaks, opts.preserveTabs)
      : (t: string) => t,
    opts.trim ? (t: string) => t.trim() : (t: string) => t,
  ];

  return pipe(...transformations)(text);
};

/**
 * Clean LLM output to keyboard characters only
 * @param text - Text to clean
 * @param options - Cleaning options
 * @returns Cleaned text
 */
export const clean = (text: string, options: CleanOptions = {}): string =>
  sanitize(text, { ...presets.standard, ...options });

/**
 * Clean with preset configuration
 * @param text - Text to clean
 * @param preset - 'strict' | 'standard' | 'lenient' | 'llm'
 * @returns Cleaned text
 */
export const cleanWith = (text: string, preset: PresetName = 'standard'): string => {
  if (!presets[preset]) {
    throw new Error(`Unknown preset: ${preset}. Available: ${Object.keys(presets).join(', ')}`);
  }
  return sanitize(text, presets[preset]);
};


/**
 * Normalize Unicode spaces, quotes, dashes, and ellipsis to ASCII equivalents
 * @param text - Text to normalize
 * @returns Normalized text
 */
export const normalize = (text: string): string =>
  sanitize(text, {
    preserveLineBreaks: true,
    preserveTabs: true,
    normalizeSpaces: true,
    normalizeQuotes: true,
    normalizeDashes: true,
    normalizeEllipsis: true,
    collapseWhitespace: false,
    trim: false,
  });

/**
 * Find non-keyboard characters in text
 * @param text - Text to analyze
 * @returns Array of issues found
 */
export const findIssues = (text: string): Issue[] =>
  detectNonKeyboardChars(text);

/**
 * Check if text contains only keyboard characters
 * @param text - Text to check
 * @returns true if text is clean
 */
export const isClean = (text: string): boolean =>
  detectNonKeyboardChars(text).length === 0;

/**
 * Get detailed report about non-keyboard characters
 * @param text - Text to analyze
 * @returns Report with issues and statistics
 */
export const inspect = (text: string): InspectionReport => {
  const issues = detectNonKeyboardChars(text);
  return {
    clean: issues.length === 0,
    issueCount: issues.length,
    issues,
    summary: createSummary(issues),
  };
};

export default {
  clean,
  cleanWith,
  normalize,
  findIssues,
  isClean,
  inspect,
  presets,
};
