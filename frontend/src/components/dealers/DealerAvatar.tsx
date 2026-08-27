/**
 * A dealer's real logo when we have one, or an honest generic placeholder
 * when we don't — a colored circle with the dealer's initials, the same
 * pattern Gmail/Slack/GitHub use for accounts without a photo. It never
 * claims to be the dealer's actual branding, just a stand-in until a real
 * logo is found.
 */

// A small curated palette (not a random hash-to-hue) so avatars look like
// one cohesive set rather than a rainbow — each tone dark enough for white
// text to stay readable.
const PALETTE = [
  "#0F4C81", // navy (echoes the site's primary brand color)
  "#2D6A4F", // deep green
  "#7C3AED", // violet
  "#B45309", // amber-brown
  "#0E7490", // teal
  "#9D174D", // plum
  "#4338CA", // indigo
  "#B91C1C", // brick red
];

const FILLER_WORDS = new Set([
  "the",
  "of",
  "and",
  "&",
  "inc",
  "llc",
  "corp",
  "corporation",
  "co",
]);

function initialsFor(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((w) => w.length > 0 && !FILLER_WORDS.has(w.toLowerCase()));

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

interface DealerAvatarProps {
  name: string;
  logo?: string | null;
  className?: string;
  textClassName?: string;
}

export function DealerAvatar({
  name,
  logo,
  className = "h-16 w-16",
  textClassName = "text-lg",
}: DealerAvatarProps) {
  if (logo) {
    return (
      // Dealer logos come from arbitrary external sources (Auto.dev,
      // dealer websites, etc.) — too varied to enumerate as next.config
      // remotePatterns, so a plain <img> instead of next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={`${name} logo`}
        className={`shrink-0 rounded-lg border border-border/70 bg-white object-contain p-1.5 ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold text-white ${className} ${textClassName}`}
      style={{ backgroundColor: colorFor(name) }}
      aria-label={`${name} (no logo on file)`}
    >
      {initialsFor(name)}
    </span>
  );
}
