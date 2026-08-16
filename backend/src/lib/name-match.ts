const GENERIC_DEALER_WORDS = new Set([
  "auto", "autos", "car", "cars", "motor", "motors", "dealership", "dealer",
  "group", "inc", "llc", "co", "company", "of", "the", "and", "&", "sales",
]);

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function significantWords(name: string): Set<string> {
  return new Set(
    tokenize(name).filter((w) => w.length > 1 && !GENERIC_DEALER_WORDS.has(w))
  );
}

/**
 * Non-generic tokens joined with no separator. Catches formatting variants a
 * whitespace-tokenized word-overlap check misses — "RT28" vs "RT 28",
 * "Allryde" vs "All Ryde", "MW" vs "M W" — without weakening protection
 * against genuinely different businesses: two unrelated names essentially
 * never collapse to the identical compact string by chance.
 */
function compactSignificantName(name: string): string {
  return tokenize(name)
    .filter((w) => !GENERIC_DEALER_WORDS.has(w))
    .join("");
}

/**
 * Guards against a fuzzy text-search match landing on an unrelated business —
 * requires either a shared distinctive (non-generic) word, or an identical
 * compact form once spacing/hyphens/case and generic dealer words are
 * stripped out. Shared by both the Google Places and Yelp Fusion lookup
 * clients.
 */
export function isPlausibleNameMatch(dealerName: string, matchedName: string): boolean {
  const dealerWords = significantWords(dealerName);
  const matchWords = significantWords(matchedName);

  if (dealerWords.size > 0 && matchWords.size > 0) {
    for (const word of dealerWords) {
      if (matchWords.has(word)) return true;
    }
  }

  // Non-empty guard avoids trivial collisions between fully-generic names
  // (e.g. two different one-word generic-heavy names both reducing to "").
  const dealerCompact = compactSignificantName(dealerName);
  if (dealerCompact.length > 0 && dealerCompact === compactSignificantName(matchedName)) {
    return true;
  }

  return false;
}
