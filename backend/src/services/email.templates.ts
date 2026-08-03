/** Brand colors aligned with frontend globals.css */
const BRAND = {
  navy: "#003087",
  gold: "#E8A400",
  goldDark: "#B87A00",
  bg: "#F8F9FA",
  card: "#FFFFFF",
  text: "#1C2430",
  muted: "#4F5B6B",
  border: "#DCE3EB",
  success: "#24966A",
  warning: "#C47A00",
} as const;

export interface EmailLayoutOptions {
  preheader: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
  footerNote?: string;
  siteUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML wordmark matching site BrandLogo (no external image — better deliverability). */
function brandHeader(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="vertical-align:middle;padding-right:12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="40" height="40" align="center" valign="middle" style="width:40px;height:40px;background-color:${BRAND.navy};border-radius:8px;">
                <span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;line-height:40px;color:#ffffff;letter-spacing:-0.5px;">ASR</span>
              </td>
            </tr>
          </table>
        </td>
        <td style="vertical-align:middle;">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.3px;color:${BRAND.navy};">
            AutoSales<span style="color:${BRAND.goldDark};">Reviews</span>
          </span>
        </td>
      </tr>
    </table>
  `;
}

export function renderBrandedEmail(options: EmailLayoutOptions): string {
  const ctaHtml = options.cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
        <tr>
          <td align="center" bgcolor="${BRAND.navy}" style="border-radius:8px;background-color:${BRAND.navy};">
            <a href="${escapeHtml(options.cta.url)}"
               style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
              ${escapeHtml(options.cta.label)}
            </a>
          </td>
        </tr>
      </table>
    `
    : "";

  const footerNote = options.footerNote
    ? `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};">${options.footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${BRAND.bg};">
    ${escapeHtml(options.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td align="center" style="padding:0 0 24px;">
              ${brandHeader()}
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg, ${BRAND.navy} 0%, ${BRAND.gold} 100%);background-color:${BRAND.navy};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 28px 28px;">
                    <h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.navy};">
                      ${escapeHtml(options.title)}
                    </h1>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${BRAND.text};">
                      ${options.bodyHtml}
                    </div>
                    ${ctaHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 8px 0;">
              ${footerNote}
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};">
                © ${new Date().getFullYear()} AutoSalesReviews · Trusted dealer reviews nationwide
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;">
                <a href="${escapeHtml(options.siteUrl)}" style="color:${BRAND.navy};text-decoration:underline;">Visit AutoSalesReviews</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function detailList(
  rows: Array<{ label: string; value: string }>
): string {
  const items = rows
    .map(
      (row) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${BRAND.muted};width:120px;vertical-align:top;">
          ${escapeHtml(row.label)}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.text};vertical-align:top;">
          ${escapeHtml(row.value)}
        </td>
      </tr>`
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
      ${items}
    </table>
  `;
}

export function statusPill(
  label: string,
  tone: "pending" | "success" | "alert" = "pending"
): string {
  const colors =
    tone === "success"
      ? { bg: "#E8F7F0", fg: BRAND.success }
      : tone === "alert"
        ? { bg: "#FFF4E5", fg: BRAND.warning }
        : { bg: "#EEF3FB", fg: BRAND.navy };

  return `<span style="display:inline-block;margin:0 0 16px;padding:6px 12px;border-radius:999px;background-color:${colors.bg};color:${colors.fg};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.02em;">${escapeHtml(label)}</span>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;">${escapeHtml(text)}</p>`;
}

export function richParagraph(html: string): string {
  return `<p style="margin:0 0 14px;">${html}</p>`;
}

export { escapeHtml, BRAND };
