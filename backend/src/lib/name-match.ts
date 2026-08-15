const GENERIC_DEALER_WORDS = new Set([
  "auto", "autos", "car", "cars", "motor", "motors", "dealership", "dealer",
  "group", "inc", "llc", "co", "company", "of", "the", "and", "&", "sales",
]);

function significantWords(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !GENERIC_DEALER_WORDS.has(w))
  );
}

/**
 * Guards against a fuzzy text-search match landing on an unrelated business —
 * requires at least one distinctive (non-generic) word shared between the
 * dealer's real name and the matched listing's name. Shared by both the
 * Google Places and Yelp Fusion lookup clients.
 */
export function isPlausibleNameMatch(dealerName: string, matchedName: string): boolean {
  const dealerWords = significantWords(dealerName);
  const matchWords = significantWords(matchedName);
  if (dealerWords.size === 0 || matchWords.size === 0) return false;
  for (const word of dealerWords) {
    if (matchWords.has(word)) return true;
  }
  return false;
}
