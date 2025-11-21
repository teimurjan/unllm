# unllm

[![npm version](https://badge.fury.io/js/unllm.svg)](https://www.npmjs.com/package/unllm)
[![Test](https://github.com/teimurjan/unllm/actions/workflows/test.yml/badge.svg)](https://github.com/teimurjan/unllm/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Clean LLM output to keyboard-printable text while preserving emojis and semantic meaning.

```typescript
import { clean } from 'unllm';

const llmOutput = "Hey there! 👋 This \u2018message\u2019 uses—fancy chars\u2026 🚀";
const cleaned = clean(llmOutput);
// → "Hey there! 👋 This 'message' uses-fancy chars... 🚀"
```

## Why?

LLMs often generate text with problematic Unicode characters that break APIs, databases, or user interfaces:

- **Invisible characters**: NUL (`\u0000`), zero-width joiners, byte order marks
- **Typographic variants**: Non-breaking spaces (`\u00A0`), smart quotes (`\u2018\u2019`), em dashes (`\u2014`)
- **Normalization issues**: Incompatible Unicode forms (NFC vs NFD)

This library converts LLM output to clean, keyboard-printable ASCII while intelligently preserving emojis and their modifiers.

## What it fixes

| Character Type | Example | Cleaned |
|---------------|---------|---------|
| Smart quotes | `\u2018text\u2019` | `'text'` |
| Em/en dashes | `foo\u2014bar` | `foo-bar` |
| Ellipsis | `Wait\u2026` | `Wait...` |
| Non-breaking spaces | `Hello\u00A0World` | `Hello World` |
| Invisible chars | `Text\u0000\u200B` | `Text` |

## What it preserves

- ✅ Emojis (single and multi-part): `👋`, `👨‍👩‍👧‍👦`, `🇺🇸`
- ✅ Emoji modifiers (skin tones, gender): `👍🏽`, `👨‍💻`
- ✅ Context-aware ZWJ handling: Preserves zero-width joiners only when actual emojis are present

## Installation

```bash
bun add unllm
# or
npm install unllm
# or
pnpm add unllm
```

## Usage

### Basic cleaning

```typescript
import { clean } from 'unllm';

// Default: Normalizes typography, preserves formatting, keeps emojis
const result = clean("Smart 'quotes' and fancy—dashes 👋");
// → "Smart 'quotes' and fancy-dashes 👋"
```

### Presets

```typescript
import { cleanWith } from 'unllm';

// Strict: Remove all whitespace and formatting
cleanWith("  Hello\n\nWorld  ", 'strict');
// → "HelloWorld"

// Standard (default): Preserve readability
cleanWith("  Hello\n\nWorld  ", 'standard');
// → "Hello World"
```

### Custom options

```typescript
import { clean } from 'unllm';

clean(text, {
  normalizeSpaces: true,      // NBSP → regular space
  normalizeQuotes: true,      // Smart quotes → ASCII quotes
  normalizeDashes: true,      // Em/en dashes → hyphens
  normalizeEllipsis: true,    // … → ...
  collapseWhitespace: true,   // Multiple spaces → single
  trimWhitespace: true,       // Remove leading/trailing
  preserveLineBreaks: true,   // Keep \n
  preserveTabs: false,        // Convert tabs to spaces
});
```

### Inspection and validation

```typescript
import { inspect, findIssues, isClean } from 'unllm';

const report = inspect("Text with\u00A0issues");
console.log(report);
// {
//   clean: false,
//   issueCount: 1,
//   hasInvisibleChars: true,
//   hasNonAsciiTypography: true,
//   issues: [{ char: '\u00A0', codePoint: 'U+00A0', description: 'NBSP' }]
// }

// Quick validation
if (!isClean(userInput)) {
  const issues = findIssues(userInput);
  console.warn('Found problematic characters:', issues);
}
```

### Unicode normalization only

```typescript
import { normalize } from 'unllm';

// Context-aware invisible char removal + NFC normalization
// Does NOT convert typography (preserves smart quotes, em dashes, etc.)
const normalized = normalize("é");  // NFD → NFC
```

## API

| Function | Purpose |
|----------|---------|
| `clean(text, options?)` | Main cleaning function with customizable options |
| `cleanWith(text, preset)` | Clean using preset: `'strict'` or `'standard'` |
| `normalize(text)` | Unicode normalization + context-aware invisible char removal |
| `inspect(text)` | Detailed analysis report with all issues |
| `findIssues(text)` | Array of problematic characters found |
| `isClean(text)` | Boolean check if text is already clean |

## Common Use Cases

- **LLM output sanitization**: Clean ChatGPT/Claude responses before storage
- **Database normalization**: Ensure consistent Unicode representation
- **API response cleaning**: Remove invisible characters that break JSON parsers
- **User input validation**: Detect and fix problematic characters
- **Text comparison**: Normalize before diffing or deduplication

## Publishing

This package uses [release-please](https://github.com/googleapis/release-please) for automated releases. Releases are triggered by conventional commits:

- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `feat!:` or `fix!:` - Breaking change (major version bump)
- `docs:`, `refactor:`, `test:`, `ci:`, etc. - Non-version bump commits

## License

MIT © [Teimur Gasanov](https://github.com/teimurjan)
