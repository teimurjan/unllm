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
 * Inspect text for LLM artifacts and typographic characters
 * @param text - Text to inspect
 * @param options - What to detect (default: invisible and spaces only)
 * @returns Array of issues found
 */
export declare const inspect: (text: string, options?: CleanOptions) => Issue[];
/**
 * Clean LLM output by removing artifacts and normalizing typography
 * @param text - Text to clean
 * @param options - What to clean (default: invisible and spaces only)
 * @returns Cleaned text
 */
export declare const clean: (text: string, options?: CleanOptions) => string;
