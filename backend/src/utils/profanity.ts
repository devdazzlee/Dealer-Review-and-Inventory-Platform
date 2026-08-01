/**
 * Basic word-boundary profanity check for review title/comment.
 * Intentionally small list — blocks obvious terms without over-filtering.
 */
const BLOCKED_PATTERNS: RegExp[] = [
  /\b(fuck|fucking|fucker)\b/i,
  /\b(shit|shitty)\b/i,
  /\b(asshole|bastard)\b/i,
  /\b(bitch)\b/i,
  /\b(cunt)\b/i,
  /\b(nigger|nigga)\b/i,
  /\b(retard|retarded)\b/i,
  /\b(whore|slut)\b/i,
];

export function containsProfanity(text: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

export function assertCleanText(text: string, fieldLabel: string): void {
  if (containsProfanity(text)) {
    throw Object.assign(
      new Error(
        `${fieldLabel} contains language that is not allowed. Please revise and try again.`
      ),
      { statusCode: 400, code: "PROFANITY" }
    );
  }
}
