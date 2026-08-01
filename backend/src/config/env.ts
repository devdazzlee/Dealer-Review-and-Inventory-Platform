function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export const env = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  adminPassword: optional(process.env.ADMIN_PASSWORD) ?? "admin",
  siteUrl: optional(process.env.SITE_URL) ?? "http://localhost:3000",
  email: {
    from: optional(process.env.EMAIL_FROM) ?? "noreply@autosalesreviews.com",
    host: optional(process.env.EMAIL_HOST),
    port: parseInt(process.env.EMAIL_PORT ?? "587", 10),
    user: optional(process.env.EMAIL_USER),
    pass: optional(process.env.EMAIL_PASS),
    adminTo: optional(process.env.ADMIN_EMAIL) ?? "admin@autosalesreviews.com",
  },
} as const;

export function isEmailConfigured(): boolean {
  return Boolean(env.email.host && env.email.user && env.email.pass);
}
