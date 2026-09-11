function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function parseEmailList(value: string | undefined, fallback: string[]): string[] {
  const raw = optional(value);
  if (!raw) return fallback;
  const list = raw
    .split(/[,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
  return list.length > 0 ? list : fallback;
}

export const env = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  siteUrl: optional(process.env.SITE_URL) ?? "http://localhost:3000",
  autoDevApiKey:
    optional(process.env.AUTODEV_API_KEY) ??
    optional(process.env.AUTO_DEV_API_KEY),
  /**
   * Bergen Car's own Auto.dev key. The Bergen storefront syncs every 30 min
   * during business hours, so it runs on a dedicated key/quota rather than
   * draining the platform-wide AUTODEV_API_KEY monthly budget.
   */
  bergenAutoDevApiKey: optional(process.env.BERGEN_AUTODEV_API_KEY),
  autoDevPhotoBaseUrl:
    optional(process.env.AUTODEV_PHOTO_BASE_URL) ?? "https://images.auto.dev",
  googlePlacesApiKey: optional(process.env.GOOGLE_PLACES_API_KEY),
  yelpApiKey: optional(process.env.YELP_API_KEY),
  yelp: {
    /**
     * Re-check a dealer that came back not-found or low-confidence only if
     * the last check is older than this many days. Without this a permanent
     * no-match gets re-queried and re-fails every single run forever.
     */
    refreshDays: parseInt(process.env.YELP_REFRESH_DAYS ?? "14", 10),
  },
  carfax: {
    /** Master switch for the Carfax rating scraper job. Set CARFAX_LOOKUP_ENABLED=false to skip it entirely. */
    lookupEnabled: optional(process.env.CARFAX_LOOKUP_ENABLED) !== "false",
    /**
     * Re-scrape a dealer's Carfax rating only if the last successful scrape is
     * older than this many days. Keeps a nightly run from re-hammering every
     * dealer page each time.
     */
    refreshDays: parseInt(process.env.CARFAX_REFRESH_DAYS ?? "30", 10),
    /** Pause between dealer page requests, in ms — Carfax blocks fast bursts hard. */
    requestDelayMs: parseInt(process.env.CARFAX_REQUEST_DELAY_MS ?? "4000", 10),
    /** Ignore a Carfax rating backed by fewer than this many reviews (too thin to trust). */
    minReviewCount: parseInt(process.env.CARFAX_MIN_REVIEW_COUNT ?? "3", 10),
  },
  cloudinaryUrl: optional(process.env.CLOUDINARY_URL),
  cronSecret: optional(process.env.CRON_SECRET),
  internalApiKey: optional(process.env.INTERNAL_API_KEY),
  email: {
    from: optional(process.env.EMAIL_FROM) ?? "noreply@autosalesreviews.com",
    host: optional(process.env.EMAIL_HOST),
    port: parseInt(process.env.EMAIL_PORT ?? "587", 10),
    user: optional(process.env.EMAIL_USER),
    pass: optional(process.env.EMAIL_PASS),
    adminRecipients: parseEmailList(process.env.ADMIN_EMAIL, [
      "zoyamuhammad8295@gmail.com",
      "bhaia9036@gmail.com",
    ]),
  },
} as const;

export function isEmailConfigured(): boolean {
  return Boolean(env.email.host && env.email.user && env.email.pass);
}
