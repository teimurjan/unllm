/**
 * Information about an LLM artifact or typographic character found in text
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
  /** Human-readable description */
  type: 'control' | 'invisible' | 'typography';
  /** Character name */
  name: string;
}

/**
 * Detailed inspection report
 */
export interface InspectionReport {
  /** Whether the text needs cleaning */
  needsCleaning: boolean;
  /** Total number of issues found */
  issueCount: number;
  /** Array of all issues found */
  issues: Issue[];
}

/**
 * Character mappings for normalization
 */
const UNICODE_SPACES = [
  '\u00A0', // NO-BREAK SPACE
  '\u1680', // OGHAM SPACE MARK
  '\u2000', // EN QUAD
  '\u2001', // EM QUAD
  '\u2002', // EN SPACE
  '\u2003', // EM SPACE
  '\u2004', // THREE-PER-EM SPACE
  '\u2005', // FOUR-PER-EM SPACE
  '\u2006', // SIX-PER-EM SPACE
  '\u2007', // FIGURE SPACE
  '\u2008', // PUNCTUATION SPACE
  '\u2009', // THIN SPACE
  '\u200A', // HAIR SPACE
  '\u202F', // NARROW NO-BREAK SPACE
  '\u205F', // MEDIUM MATHEMATICAL SPACE
  '\u3000', // IDEOGRAPHIC SPACE
] as const;

const DASH_MAP: Record<string, string> = {
  '\u2013': '-', // EN DASH
  '\u2014': '-', // EM DASH
  '\u2212': '-', // MINUS SIGN
  '\u00AD': '',  // SOFT HYPHEN (remove completely)
};

const ELLIPSIS_MAP: Record<string, string> = {
  '\u2026': '...', // HORIZONTAL ELLIPSIS
};

// Invisible/control characters that LLMs incorrectly insert
const INVISIBLE_CHARS = [
  0x0000, // NULL
  0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007, // Control chars
  0x0008, // BACKSPACE
  0x000B, // VERTICAL TAB
  0x000C, // FORM FEED
  0x000E, 0x000F, 0x0010, 0x0011, 0x0012, 0x0013, 0x0014, 0x0015,
  0x0016, 0x0017, 0x0018, 0x0019, 0x001A, 0x001B, 0x001C, 0x001D, 0x001E, 0x001F,
  0x007F, // DELETE
  0x0080, 0x0081, 0x0082, 0x0083, 0x0084, 0x0085, 0x0086, 0x0087, 0x0088, 0x0089,
  0x008A, 0x008B, 0x008C, 0x008D, 0x008E, 0x008F, 0x0090, 0x0091, 0x0092, 0x0093,
  0x0094, 0x0095, 0x0096, 0x0097, 0x0098, 0x0099, 0x009A, 0x009B, 0x009C, 0x009D,
  0x009E, 0x009F,
  0x200B, // ZERO WIDTH SPACE
  0x200C, // ZERO WIDTH NON-JOINER
  0x200E, // LEFT-TO-RIGHT MARK
  0x200F, // RIGHT-TO-LEFT MARK
  0x2060, // WORD JOINER
  0x2061, // FUNCTION APPLICATION
  0x2062, // INVISIBLE TIMES
  0x2063, // INVISIBLE SEPARATOR
  0x2064, // INVISIBLE PLUS
  0xFEFF, // ZERO WIDTH NO-BREAK SPACE (BOM)
];

// Emoji detection
const isEmoji = (char: string): boolean => {
  const code = char.codePointAt(0);
  if (!code) return false;

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
    (code >= 0x2600 && code <= 0x26FF) ||   // Miscellaneous Symbols
    (code >= 0x2700 && code <= 0x27BF) ||   // Dingbats
    (code >= 0xFE00 && code <= 0xFE0F) ||   // Variation Selectors
    (code >= 0x1F1E6 && code <= 0x1F1FF) || // Regional Indicator Symbols (flags)
    (code >= 0x1F3FB && code <= 0x1F3FF)    // Emoji skin tone modifiers
  );
};

// Check if text contains actual emojis (not just modifiers)
const containsEmoji = (text: string): boolean =>
  Array.from(text).some(char => {
    const code = char.codePointAt(0);
    if (!code) return false;
    // Check for actual emojis, not just modifiers
    return (
      (code >= 0x1F600 && code <= 0x1F64F) ||
      (code >= 0x1F300 && code <= 0x1F5FF) ||
      (code >= 0x1F680 && code <= 0x1F6FF) ||
      (code >= 0x1F700 && code <= 0x1F77F) ||
      (code >= 0x1F780 && code <= 0x1F7FF) ||
      (code >= 0x1F800 && code <= 0x1F8FF) ||
      (code >= 0x1F900 && code <= 0x1F9FF) ||
      (code >= 0x1FA00 && code <= 0x1FA6F) ||
      (code >= 0x1FA70 && code <= 0x1FAFF) ||
      (code >= 0x2600 && code <= 0x26FF) ||
      (code >= 0x2700 && code <= 0x27BF) ||
      (code >= 0x1F1E6 && code <= 0x1F1FF)
    );
  });

// Check if character should be cleaned (control, invisible, or typography)
const needsCleaning = (char: string): boolean => {
  const code = char.codePointAt(0);
  if (code === undefined) return false;

  // Allow emojis
  if (isEmoji(char)) return false;

  // Control and invisible characters
  if (INVISIBLE_CHARS.includes(code)) return true;

  // ZWJ is only allowed in emoji context
  if (code === 0x200D) return !isEmoji(char);

  // Typographic characters that should be normalized
  if (UNICODE_SPACES.includes(char as any)) return true;
  if (char in DASH_MAP) return true;
  if (char in ELLIPSIS_MAP) return true;

  return false;
};

// Get character type and name
const getCharInfo = (char: string, code: number): { type: Issue['type'], name: string } => {
  // Control characters
  if (code >= 0x0000 && code <= 0x001F) {
    if (code === 0x0000) return { type: 'control', name: 'NULL' };
    if (code === 0x0008) return { type: 'control', name: 'BACKSPACE' };
    if (code === 0x000B) return { type: 'control', name: 'VERTICAL TAB' };
    if (code === 0x000C) return { type: 'control', name: 'FORM FEED' };
    return { type: 'control', name: `CONTROL_${code.toString(16).toUpperCase()}` };
  }

  if (code >= 0x007F && code <= 0x009F) {
    if (code === 0x007F) return { type: 'control', name: 'DELETE' };
    return { type: 'control', name: `CONTROL_${code.toString(16).toUpperCase()}` };
  }

  // Invisible characters
  if (code === 0x200B) return { type: 'invisible', name: 'ZERO WIDTH SPACE' };
  if (code === 0x200C) return { type: 'invisible', name: 'ZERO WIDTH NON-JOINER' };
  if (code === 0x200D) return { type: 'invisible', name: 'ZERO WIDTH JOINER' };
  if (code === 0x200E) return { type: 'invisible', name: 'LEFT-TO-RIGHT MARK' };
  if (code === 0x200F) return { type: 'invisible', name: 'RIGHT-TO-LEFT MARK' };
  if (code === 0x2060) return { type: 'invisible', name: 'WORD JOINER' };
  if (code === 0x2061) return { type: 'invisible', name: 'FUNCTION APPLICATION' };
  if (code === 0x2062) return { type: 'invisible', name: 'INVISIBLE TIMES' };
  if (code === 0x2063) return { type: 'invisible', name: 'INVISIBLE SEPARATOR' };
  if (code === 0x2064) return { type: 'invisible', name: 'INVISIBLE PLUS' };
  if (code === 0xFEFF) return { type: 'invisible', name: 'ZERO WIDTH NO-BREAK SPACE (BOM)' };

  // Typography
  if (UNICODE_SPACES.includes(char as any)) {
    if (code === 0x00A0) return { type: 'typography', name: 'NO-BREAK SPACE' };
    if (code === 0x202F) return { type: 'typography', name: 'NARROW NO-BREAK SPACE' };
    return { type: 'typography', name: 'UNICODE SPACE' };
  }

  if (char in DASH_MAP) {
    if (code === 0x2013) return { type: 'typography', name: 'EN DASH' };
    if (code === 0x2014) return { type: 'typography', name: 'EM DASH' };
    if (code === 0x2212) return { type: 'typography', name: 'MINUS SIGN' };
    if (code === 0x00AD) return { type: 'typography', name: 'SOFT HYPHEN' };
  }

  if (code === 0x2026) return { type: 'typography', name: 'HORIZONTAL ELLIPSIS' };

  return { type: 'typography', name: `U+${code.toString(16).toUpperCase().padStart(4, '0')}` };
};

/**
 * Inspect text for LLM artifacts and typographic characters
 * @param text - Text to inspect
 * @returns Detailed report of issues found
 */
export const inspect = (text: string): InspectionReport => {
  const issues: Issue[] = [];

  Array.from(text).forEach((char, position) => {
    if (needsCleaning(char)) {
      const code = char.codePointAt(0)!;
      const { type, name } = getCharInfo(char, code);

      issues.push({
        char,
        code,
        codeHex: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        position,
        type,
        name,
      });
    }
  });

  return {
    needsCleaning: issues.length > 0,
    issueCount: issues.length,
    issues,
  };
};

/**
 * Clean LLM output by removing artifacts and normalizing typography
 * - Removes control characters and invisible formatting
 * - Converts Unicode spaces to regular spaces
 * - Converts em/en dashes to hyphens
 * - Converts ellipsis to three dots
 * - Preserves emojis and international text (Arabic, Cyrillic, Chinese, etc.)
 * - Preserves quotes (removed from normalization)
 *
 * @param text - Text to clean
 * @returns Cleaned text
 */
export const clean = (text: string): string => {
  // Remove invisible characters (context-aware for emojis)
  let result = text;

  const hasEmojis = containsEmoji(text);

  // Remove control and invisible characters
  INVISIBLE_CHARS.forEach(code => {
    // Skip ZWJ if we have emojis
    if (code === 0x200D && hasEmojis) return;
    result = result.replaceAll(String.fromCodePoint(code), '');
  });

  // Remove standalone ZWJ (not in emoji context)
  if (!hasEmojis) {
    result = result.replaceAll('\u200D', '');
  }

  // Normalize Unicode spaces to regular space
  UNICODE_SPACES.forEach(space => {
    result = result.replaceAll(space, ' ');
  });

  // Normalize dashes
  Object.entries(DASH_MAP).forEach(([from, to]) => {
    result = result.replaceAll(from, to);
  });

  // Normalize ellipsis
  Object.entries(ELLIPSIS_MAP).forEach(([from, to]) => {
    result = result.replaceAll(from, to);
  });

  return result;
};
