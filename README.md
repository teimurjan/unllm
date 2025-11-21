# unllm

[![npm version](https://badge.fury.io/js/unllm.svg)](https://www.npmjs.com/package/unllm)
[![Test](https://github.com/teimurjan/unllm/actions/workflows/test.yml/badge.svg)](https://github.com/teimurjan/unllm/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Convert LLM output to clean, human-like text by removing AI artifacts and normalizing typography.

```typescript
import { clean } from 'unllm';

const llmOutput = "Hey there! 👋 This\u00A0message uses\u2014fancy chars\u2026 🚀";
const result = clean(llmOutput);
// → "Hey there! 👋 This message uses-fancy chars... 🚀"
```

## Why?

LLMs (ChatGPT, Claude, etc.) often generate text with problematic Unicode characters that make output look artificial:

- **Control characters**: NULL (`\u0000`), invisible formatting marks
- **Typographic Unicode**: Em dashes (`\u2014`), fancy spaces (`\u00A0`), ellipsis
- **Invisible chars**: Zero-width spaces, byte order marks (BOM), direction marks

This library normalizes LLM output to look natural while preserving emojis, quotes, and international text (Arabic, Chinese, Cyrillic, etc.).

## What it does

| Input | Output | Type |
|-------|--------|------|
| `"Hello\u0000World"` | `"HelloWorld"` | Removes NULL |
| `"Hello\u00A0World"` | `"Hello World"` | NBSP → space |
| `"foo\u2014bar"` | `"foo-bar"` | Em dash → hyphen |
| `"Wait\u2026"` | `"Wait..."` | Ellipsis → dots |
| `"Hi 👋 مرحبا"` | `"Hi 👋 مرحبا"` | Preserves emojis & international text |
| `"C'est génial!"` | `"C'est génial!"` | Preserves quotes |

## Installation

```bash
npm install unllm
# or
pnpm add unllm
# or
bun add unllm
```

## API

### `clean(text: string): string`

Removes LLM artifacts and normalizes typography to clean, human-like text.

**What it does:**
- Removes control characters (NULL, etc.)
- Removes invisible formatting characters (ZWJ outside emojis, BOM, etc.)
- Converts Unicode spaces to regular spaces
- Converts em/en dashes to hyphens (`-`)
- Converts ellipsis to three dots (`...`)

**What it preserves:**
- Emojis (including multi-part with ZWJ: 👨‍👩‍👧‍👦)
- International text (Arabic, Chinese, Cyrillic, etc.)
- Quotes (both straight and smart quotes)
- Line breaks and tabs
- Regular punctuation and symbols

```typescript
import { clean } from 'unllm';

// Basic usage
clean("Hello\u00A0World");
// → "Hello World"

// Preserves emojis
clean("Great work! 🎉\u00A0Let's celebrate");
// → "Great work! 🎉 Let's celebrate"

// Preserves international text and quotes
clean("C'est génial\u00A0!");
// → "C'est génial !"

// Handles mixed content
clean("Text\u0000with\u00A0fancy\u2014chars\u2026");
// → "Textwith fancy-chars..."
```

### `inspect(text: string): InspectionReport`

Analyzes text and reports all LLM artifacts and typographic characters that need cleaning.

**Returns:**
```typescript
interface InspectionReport {
  needsCleaning: boolean;        // true if any issues found
  issueCount: number;             // Total number of issues
  issues: Issue[];                // Detailed issue list
}

interface Issue {
  char: string;                   // The problematic character
  code: number;                   // Unicode code point
  codeHex: string;                // Hex representation (e.g., "U+00A0")
  position: number;               // Position in string
  type: 'control' | 'invisible' | 'typography';
  name: string;                   // Human-readable name
}
```

**Usage:**
```typescript
import { inspect } from 'unllm';

const report = inspect("Hello\u00A0World\u2019s text");

console.log(report);
// {
//   needsCleaning: true,
//   issueCount: 2,
//   issues: [
//     {
//       char: '\u00A0',
//       code: 160,
//       codeHex: 'U+00A0',
//       position: 5,
//       type: 'typography',
//       name: 'NO-BREAK SPACE'
//     },
//     {
//       char: '\u2019',
//       code: 8217,
//       codeHex: 'U+2019',
//       position: 11,
//       type: 'typography',
//       name: 'SMART QUOTE'
//     }
//   ]
// }

// Quick check
if (report.needsCleaning) {
  const cleaned = clean(text);
}
```

## Use Cases

- **LLM output normalization**: Clean ChatGPT/Claude responses for consistent formatting
- **Translation quality**: Normalize AI-translated text to remove artifacts
- **Database storage**: Ensure clean text before storing LLM output
- **API responses**: Remove problematic characters that break JSON/XML
- **Content moderation**: Detect and fix LLM-generated formatting issues
- **Text comparison**: Normalize before diffing or deduplication

## Character Categories

### Control Characters (removed)
- NULL (`\u0000`)
- Other C0/C1 control characters
- Backspace, vertical tab, form feed, etc.

### Invisible Characters (removed)
- Zero-width space (`\u200B`)
- Zero-width non-joiner (`\u200C`)
- Left-to-right/right-to-left marks
- Word joiner, invisible operators
- Byte order mark (BOM) (`\uFEFF`)

### Typography (normalized)
- Unicode spaces: NBSP (`\u00A0`), em space, en space, etc. → regular space
- Dashes: em dash (`\u2014`), en dash (`\u2013`), minus (`\u2212`) → `-`
- Ellipsis: `\u2026` → `...`
- Soft hyphen: `\u00AD` → removed
- **Quotes preserved**: Smart quotes and all other quotation marks are kept as-is

## Design Principles

- **Simple API**: Just two functions (`clean` and `inspect`)
- **Zero configuration**: Works out of the box with sensible defaults
- **International-friendly**: Preserves all legitimate text (Arabic, Chinese, etc.)
- **Emoji-aware**: Intelligently handles complex emoji sequences
- **Zero dependencies**: Lightweight and secure
- **Type-safe**: Full TypeScript support

## License

MIT © [Teimur Gasanov](https://github.com/teimurjan)
