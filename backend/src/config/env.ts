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
  email: {
    from: optional(process.env.EMAIL_FROM) ?? "noreply@autosalesreviews.com",
    host: optional(process.env.EMAIL_HOST),
    port: parseInt(process.env.EMAIL_PORT ?? "587", 10),
    user: optional(process.env.EMAIL_USER),
    pass: optional(process.env.EMAIL_PASS),
    /** Admin notification recipients (never the SMTP login unless listed here). */
    adminRecipients: parseEmailList(process.env.ADMIN_EMAIL, [
      "zoyamuhammad8295@gmail.com",
      "bhaia9036@gmail.com",
    ]),
  },
} as const;

export function isEmailConfigured(): boolean {
  return Boolean(env.email.host && env.email.user && env.email.pass);
}
