/**
 * Builds one placeholder crest/badge SVG for a dealer that has no real logo
 * on file — an honest stand-in (like DealerAvatar.tsx), not a claim to the
 * dealer's real branding. Reuses the same curated palette + initials rules,
 * wrapped in a deterministic badge (shield / disc / hex / tile + motif +
 * name ribbon) so a wall of them reads as one set while every dealer still
 * gets a distinct mark.
 *
 * Pure + dependency-free so both the frontend asset script and the backend
 * DB-backfill script can import it.
 */

// Kept in sync with frontend/src/components/dealers/DealerAvatar.tsx
export const PALETTE = [
  "#0F4C81", // navy (echoes the site's primary brand color)
  "#2D6A4F", // deep green
  "#7C3AED", // violet
  "#B45309", // amber-brown
  "#0E7490", // teal
  "#9D174D", // plum
  "#4338CA", // indigo
  "#B91C1C", // brick red
];

const ACCENTS = ["#F2C14E", "#EAD8B1", "#9AD1D4", "#F4A9A8", "#CDE7B0", "#F6C6EA"];

const FILLER_WORDS = new Set([
  "the", "of", "and", "&", "inc", "llc", "corp", "corporation", "co",
]);

const FONT = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SHAPES = ["shield", "circle", "hexagon", "roundrect"];
const MOTIF_KEYS = [
  "mountains", "star", "wheel", "wings", "road",
  "sunburst", "bolt", "diamond", "wave", "laurel",
];

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pick(arr, seed) {
  return arr[hashCode(seed) % arr.length];
}

export function initialsFor(name) {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((w) => w.length > 0 && !FILLER_WORDS.has(w.toLowerCase()));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function mix(hex, target, amt) {
  const n = parseInt(hex.slice(1), 16);
  const t = parseInt(target.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) + (((t >> 16) & 255) - ((n >> 16) & 255)) * amt);
  const g = Math.round(((n >> 8) & 255) + (((t >> 8) & 255) - ((n >> 8) & 255)) * amt);
  const b = Math.round((n & 255) + ((t & 255) - (n & 255)) * amt);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
const darken = (hex, amt) => mix(hex, "#000000", amt);
const lighten = (hex, amt) => mix(hex, "#ffffff", amt);

function starPath(cx, cy, ro, ri, points) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? ri : ro;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

function shapeElement(shape) {
  switch (shape) {
    case "circle":
      return `<circle id="s" cx="128" cy="128" r="110"/>`;
    case "hexagon":
      return `<path id="s" d="M128 14L226 71V185L128 242L30 185V71Z"/>`;
    case "roundrect":
      return `<rect id="s" x="22" y="22" width="212" height="212" rx="36"/>`;
    case "shield":
    default:
      return `<path id="s" d="M30 40L128 16L226 40V122C226 180 188 218 128 240C68 218 30 180 30 122Z"/>`;
  }
}

function motifElement(key, a, d) {
  switch (key) {
    case "mountains":
      return `<path d="M82 106L114 56L134 84L152 52L174 106Z" fill="${a}"/><circle cx="152" cy="50" r="8" fill="${a}"/>`;
    case "star":
      return `<path d="${starPath(128, 80, 27, 12, 5)}" fill="${a}"/>`;
    case "wheel":
      return `<g fill="none" stroke="${a}" stroke-width="7" stroke-linecap="round"><circle cx="128" cy="80" r="25"/><path d="M128 80V55M128 80L149 93M128 80L107 93"/></g><circle cx="128" cy="80" r="6" fill="${a}"/>`;
    case "wings":
      return `<path d="M128 96C106 66 84 62 70 66C90 72 104 84 112 100Z" fill="${a}"/><path d="M128 96C150 66 172 62 186 66C166 72 152 84 144 100Z" fill="${a}"/><circle cx="128" cy="82" r="7" fill="${a}"/>`;
    case "road":
      return `<path d="M104 108L120 52L136 52L152 108Z" fill="${a}"/><path d="M128 56V104" stroke="${d}" stroke-width="5" stroke-dasharray="7 8"/>`;
    case "sunburst":
      return `<path d="M100 100A28 28 0 0 1 156 100Z" fill="${a}"/><g stroke="${a}" stroke-width="6" stroke-linecap="round"><path d="M128 58V44"/><path d="M102 66L92 52"/><path d="M154 66L164 52"/></g>`;
    case "bolt":
      return `<path d="M138 46L104 90L124 90L116 114L152 68L132 68Z" fill="${a}"/>`;
    case "diamond":
      return `<path d="M128 50L154 80L128 110L102 80Z" fill="${a}"/><path d="M128 64L142 80L128 96L114 80Z" fill="${d}"/>`;
    case "wave":
      return `<g fill="none" stroke="${a}" stroke-width="8" stroke-linecap="round"><path d="M86 88C100 68 114 68 128 88C142 108 156 108 170 88"/><path d="M92 70C104 56 116 56 128 70" opacity="0.7"/></g>`;
    case "laurel":
      return `<g fill="none" stroke="${a}" stroke-width="7" stroke-linecap="round"><path d="M114 108C92 96 90 68 106 50"/><path d="M142 108C164 96 166 68 150 50"/></g><path d="${starPath(128, 66, 10, 5, 5)}" fill="${a}"/>`;
    default:
      return "";
  }
}

/** Returns a self-contained 256x256 SVG string for one dealer. */
export function buildDealerLogoSvg({ name, city }) {
  const seed = `${name}|${city || ""}`;
  const color = pick(PALETTE, name);
  const accent = pick(ACCENTS, `a:${name}`);
  const shape = pick(SHAPES, `s:${seed}`);
  const motif = pick(MOTIF_KEYS, `m:${seed}`);
  const initials = escapeXml(initialsFor(name));
  const dark = darken(color, 0.3);
  const label = escapeXml(name.toUpperCase());
  const cityLabel = city ? escapeXml(city.toUpperCase()) : "";

  const estWidth = name.length * 16 * 0.62;
  const labelFit =
    estWidth > 208 ? ' textLength="208" lengthAdjust="spacingAndGlyphs"' : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="${label} logo">`,
    `<title>${label}</title>`,
    `<defs>`,
    shapeElement(shape),
    `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(color, 0.16)}"/><stop offset="1" stop-color="${darken(color, 0.24)}"/></linearGradient>`,
    `<clipPath id="c"><use href="#s"/></clipPath>`,
    `</defs>`,
    `<use href="#s" fill="url(#g)"/>`,
    `<g clip-path="url(#c)"><ellipse cx="128" cy="60" rx="150" ry="92" fill="#ffffff" opacity="0.08"/></g>`,
    `<g transform="translate(128 128) scale(0.9) translate(-128 -128)"><use href="#s" fill="none" stroke="${accent}" stroke-width="2"/></g>`,
    `<use href="#s" fill="none" stroke="${dark}" stroke-width="4"/>`,
    motifElement(motif, accent, dark),
    `<text x="129" y="160" text-anchor="middle" font-family="${FONT}" font-size="58" font-weight="800" fill="${dark}" opacity="0.45">${initials}</text>`,
    `<text x="128" y="158" text-anchor="middle" font-family="${FONT}" font-size="58" font-weight="800" fill="#ffffff">${initials}</text>`,
    `<path d="M16 168l-8 12 8 12z" fill="${dark}"/>`,
    `<path d="M240 168l8 12-8 12z" fill="${dark}"/>`,
    `<rect x="16" y="168" width="224" height="36" fill="${accent}" stroke="${dark}" stroke-width="2"/>`,
    `<text x="128" y="192" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="700" fill="#1b1f24"${labelFit}>${label}</text>`,
    cityLabel
      ? `<text x="128" y="224" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="600" letter-spacing="2" fill="#ffffff" opacity="0.9">${cityLabel}</text>`
      : "",
    `</svg>`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Contact-sheet HTML for eyeballing a whole set at once. Not used by the app. */
export function buildPreviewHtml(entries, baseUrl = ".") {
  const cards = entries
    .map(
      (m) =>
        `<figure><img src="${baseUrl}/${m.slug}.svg" width="120" height="120" alt=""><figcaption>${escapeXml(
          m.state || ""
        )} &middot; ${escapeXml(m.name)}${m.city ? ` <span>(${escapeXml(m.city)})</span>` : ""}</figcaption></figure>`
    )
    .join("\n");
  return (
    `<!doctype html><meta charset="utf-8"><title>Dealer logo placeholders (${entries.length})</title>` +
    `<style>body{font:14px/1.4 system-ui,sans-serif;margin:24px;background:#f6f7f9}` +
    `h1{font-size:16px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:18px}` +
    `figure{margin:0;text-align:center}img{border-radius:12px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.12)}` +
    `figcaption{margin-top:6px;font-size:11px;color:#333}figcaption span{color:#888}</style>` +
    `<h1>${entries.length} dealer logo placeholders</h1><main>\n${cards}\n</main>\n`
  );
}
