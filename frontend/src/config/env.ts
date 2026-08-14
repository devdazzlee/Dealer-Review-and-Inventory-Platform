/**
 * Public env vars must use static `process.env.NEXT_PUBLIC_*` access so Next.js
 * can inline them in the client bundle. Dynamic lookup via process.env[name]
 * is not replaced and resolves to undefined in the browser.
 */
function requirePublicEnv(
  value: string | undefined,
  name: "NEXT_PUBLIC_API_URL" | "NEXT_PUBLIC_SITE_URL"
): string {
  if (!value?.trim()) {
    throw new Error(`${name} environment variable is not defined`);
  }

  return value.replace(/\/$/, "");
}

export const env = {
  apiBaseUrl: requirePublicEnv(
    process.env.NEXT_PUBLIC_API_URL,
    "NEXT_PUBLIC_API_URL"
  ),
  siteUrl: requirePublicEnv(
    process.env.NEXT_PUBLIC_SITE_URL,
    "NEXT_PUBLIC_SITE_URL"
  ),
  googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() || "",
} as const;
