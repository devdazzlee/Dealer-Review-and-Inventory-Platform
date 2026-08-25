# Client Change Requests — Richie (2026-08-25)

Source: WhatsApp messages, 2026-08-25 (4:33 AM – 10:10 AM). Tracked here so we work through them one at a time instead of losing track mid-conversation.

Status legend: `Not started` / `In progress` / `Done`

---

## 1. Homepage — browse by category
**Status:** Not started

Redesign the homepage inventory section to browse "by category," matching cars.com's pattern: a row of pill-style category buttons (Trucks, SUVs, Electric Cars, Hybrid Cars, Sedan, Cheap Cars, etc.) with filtered vehicle cards displayed underneath, positioned near the top of the page below the hero/search area.

**Source quotes:**
> "For home page. Need to do by category" — 4:33 AM
> "Search by category on thy top" — 4:37 AM (same request, placement detail)

**Verified reference:** Checked cars.com directly — confirmed this exact pattern exists there (Popular categories pills → expanded category sections below).

---

## 2. Homepage — zip code search
**Status:** Not started

Add a manual zip-code (or address/state) search input near the top of the homepage, matching cars.com's location search field.

**Source quote:**
> "Search cars by zipcode" — 4:36 AM

**Verified reference:** cars.com's hero section has a state dropdown + license plate/VIN/address fields — manual entry, not auto-detected.

---

## 3. Homepage — IP-based dealer personalization
**Status:** Not started

"Top Rated Dealerships" section should be filtered to dealers near the visitor's actual location, detected automatically via their IP address — not a nationwide/random list. Example given: a visitor from California shouldn't see dealers 3,000 miles away in New Jersey.

**Source quotes:**
> "Top rated dealership should be by the person IP" — 4:39 AM
> "For example somebody from California should not see dealers here Its 3000 miles away" — 4:41 AM
> "Need to know the visitor IP" — 4:47 AM

**Note:** Verified this is *not* how cars.com actually works (no real IP-based dealer personalization found there) — this is Richie's own requirement, a genuine custom build: needs an IP geolocation service + distance-based dealer filtering.

---

## 4. Blog page — move categories section up
**Status:** Done

Replaced the sidebar "Categories" list with a horizontal pill-style filter bar above the blog cards grid (matching the cars.com pattern used for #1), rather than just repositioning the old vertical list.

**Source quote:**
> "we should shift the categories section to the top of the blog cards" — 9:49 AM

**Implementation:** `frontend/src/app/blog/page.tsx`

---

## 5. Blog page — remove Recent Posts section
**Status:** Done

Removed the "Recent Posts" sidebar section and its now-unused `getRecentBlogPosts` frontend helper (the backend `/api/blog/recent` endpoint was left in place — removing a working endpoint wasn't part of this request).

**Source quote:**
> "recent posts section isn't needed" — 9:49 AM

**Implementation:** `frontend/src/app/blog/page.tsx`, `frontend/src/lib/api/blog.ts`

---

## 6. Content migration — transfer existing blog posts
**Status:** Done

Imported 55 of the 56 real posts from `autosalesreviews.com/blog` (WordPress) via its REST API. One post ("Test Post for Ad test") was excluded — it was internal WordPress test content, not a real article.

**Source quotes:**
> "https://dealer-review-and-inventory-platfor-smoky.vercel.app/ Need to have the current blogs transferred too." — 10:10 AM
> "https://autosalesreviews.com/blog" — 10:10 AM

**Important finding, flagged and confirmed with the user before importing:** these 56 posts are written for dealership owners/operators ("Car Dealership Business Plan," "Car Dealership Employee Discount"), not car buyers — the opposite audience from the rest of this platform's blog. Imported under a new **"Dealer Resources"** category, kept separate from the buyer-facing categories, rather than mixed in or silently skipped.

**How it was done:**
- Fetched via the WordPress REST API (`autosalesreviews.com/?rest_route=/wp/v2/posts&per_page=100&_embed=1` — the standard `/wp-json/` path 404s, this fallback route works)
- Full HTML content converted to this platform's structured block format (`p`/`h2`/`h3`/`ul`/`quote`) using `cheerio`, not dumped as raw HTML — including merging WordPress's oddly-fragmented numbered lists (one `<ol>` per item) back into single list blocks
- Featured images downloaded and re-uploaded to Cloudinary (not hotlinked to the old WordPress site)
- No FAQs fabricated for migrated posts — left as an empty array, honest about what wasn't authored
- Existing 21 buyer-facing demo posts were **kept**, not replaced — both audiences are now served, per the confirmed decision
- Script: `backend/src/scripts/migrate-wp-blog.ts` — one-time, run locally only, not part of the deployed app (`cheerio` was installed with `--no-save` and removed after running, so it never touched `package.json` — avoids repeating the earlier `playwright`/Node-version build break)

**Verified live:** category filter page and a migrated article page both confirmed rendering correctly (real title, real body text, Cloudinary-hosted image) before considering this done.

---

## Suggested order (remaining)
1. **#1 homepage categories** — the main homepage build
2. **#2 zip search** — pairs naturally with #1 since both live in the same hero/search area
3. **#3 IP personalization** — most technically involved (new geolocation dependency), do last
