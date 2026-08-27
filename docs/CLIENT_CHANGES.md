# Client Change Requests — Richie (2026-08-25)

Source: WhatsApp messages, 2026-08-25 (4:33 AM – 10:10 AM). Tracked here so we work through them one at a time instead of losing track mid-conversation.

Status legend: `Not started` / `In progress` / `Done`

---

## 1. Homepage — browse by category
**Status:** Done

Replaced the old `BrowseByType` tile-grid (which only linked out to `/vehicles?bodyStyle=X`) with a real interactive version: category pills that filter vehicle cards live on the homepage itself, no navigation — matching the cars.com screenshot, confirmed as the intended behavior before building.

**Source quotes:**
> "For home page. Need to do by category" — 4:33 AM
> "Search by category on thy top" — 4:37 AM (same request, placement detail)

**Verified reference:** Checked cars.com directly — confirmed this exact pattern exists there (Popular categories pills → expanded category sections below).

**Real bug found and fixed along the way:** "Luxury" was listed as a homepage category but isn't a valid `bodyStyle` value in the vehicle schema — clicking it (or, now, selecting its pill) would always return 0 results. Backend now supports filtering by a comma-separated list of makes (`make=BMW,Mercedes-Benz,...`), and "Luxury" is filtered by a real luxury-make list instead of a nonexistent body style. Verified live: 13 real vehicles now return for Luxury (previously 0).

**Implementation:** `frontend/src/components/home/BrowseByCategory.tsx` (server component, fetches all 6 categories' cards up front — no client-side loading spinner per click), `BrowseByCategoryClient.tsx` (pill UI + toggle), `backend/src/repositories/vehicle.repository.ts` (multi-make filter), `frontend/src/config/vehicle.ts` (`LUXURY_MAKES`). Old `BrowseByType.tsx` removed, not left as dead code.

---

## 2. Homepage — zip code search
**Status:** Done

Added a Zip Code field to the existing hero search bar (`VehicleSearchBar`). Resolves the entered zip to a state using a static USPS ZIP3-prefix table (no external geocoding API — this mapping is stable, well-documented public data, not something that needs a live service or API key), then reuses the `state` filter that already exists end-to-end on the `/vehicles` results page, including the "showing vehicles in {state}" heading it already displays. Invalid/unrecognized zips show an inline error instead of silently failing or blocking the rest of the search.

**Source quote:**
> "Search cars by zipcode" — 4:36 AM

**Verified reference:** cars.com's hero section has a state dropdown + license plate/VIN/address fields — manual entry, not auto-detected.

**Verified:** ZIP-to-state table tested against 14 real ZIP codes across the country (all correct) plus invalid-input handling — 16/16. Confirmed the destination `/vehicles?state=XX` page loads correctly and already surfaces the active state filter to the visitor. Also updated `HeroSearchSkeleton` to match the new 5-field layout — it's a dimension-matched loading placeholder (the real search bar is intentionally client-only/lazy-loaded), so leaving it at the old 4-field width would have caused a layout shift the moment the real component mounted.

**Implementation:** `frontend/src/lib/location/zip-to-state.ts` (new), `frontend/src/components/vehicles/VehicleSearchBar.tsx`, `frontend/src/components/home/HeroSearchSkeleton.tsx`.

---

## 3. Homepage — IP-based dealer personalization
**Status:** Done

**Key discovery before building anything:** the display/filtering logic already existed and worked (`TopRatedDealers.tsx` already accepted a `location`, filtered by state, sorted local-city matches first, changed its heading dynamically) — the `UserLocation` type even had an unused `source: "geolocation"` value already defined, suggesting this was designed for and never finished. The only missing piece was actually *acquiring* a location automatically, without asking the visitor to click anything.

**Revision:** the first version of this used Vercel's edge-network geo headers (`x-vercel-ip-city`, etc.) as a zero-dependency shortcut. The client asked for this to be custom instead of tied to Vercel specifically, so it was rebuilt to be host-agnostic: Next.js Middleware (`frontend/src/middleware.ts`) now reads the visitor's IP from the standard `x-forwarded-for` proxy header (not a Vercel-specific header — works the same on any host that sits behind a proxy) and resolves it via `ipwho.is`, a free IP-geolocation API (no API key, HTTPS, 1,000 requests/day on the free tier). This runs **once per visitor**: the result is written into the same `asr_location` cookie the location-prompt modal already uses, so on every later request the page just reads the cookie — no repeat lookups, no per-request dependency on the external API. An explicit choice from the location-prompt modal still always takes priority (middleware only acts when that cookie is absent).

Also added, since middleware runs server-side on every qualifying request: a bot/crawler check (skips the lookup for Googlebot, Bingbot, and similar, so search engines see the canonical unpersonalized page and API quota isn't spent on them), a private/loopback IP check (skips local dev addresses like `127.0.0.1`), and a 1.5s timeout on the external call so a slow or failed lookup degrades silently to no personalization rather than delaying or breaking the page load.

**Source quotes:**
> "Top rated dealership should be by the person IP" — 4:39 AM
> "For example somebody from California should not see dealers here Its 3000 miles away" — 4:41 AM
> "Need to know the visitor IP" — 4:47 AM
> "can we not make this our custom insted of vercel free ege function?" — follow-up, requesting the host-agnostic rework

**Considered and ruled out:** `geoip-lite` (self-contained offline IP database) — checked first since it would avoid an external API call entirely, but its unpacked package size is ~153MB, which risks blowing serverless function size limits, and IP-block-to-location ownership changes often enough that a live queryable service is more appropriate than a database that would go stale between deploys anyway.

**Verified live (local dev server, real requests):**
- Public IP via simulated `X-Forwarded-For: 8.8.8.8` → real `ipwho.is` lookup returned San Jose, CA; cookie was set; a follow-up request with that cookie rendered the homepage's "Near San Jose" dealer heading — confirming the full acquire-then-consume path works end to end.
- Bot user agent (Googlebot) with a public IP → no cookie set, lookup skipped.
- Loopback IP (`127.0.0.1`) → no cookie set, lookup skipped.
- Request that already carries the location cookie → middleware short-circuits, no redundant lookup.
- Request with no `X-Forwarded-For` header at all → page still returns 200, degrades cleanly to the nationwide default.

**Implementation:** `frontend/src/middleware.ts` (new — acquisition), `frontend/src/app/page.tsx` (reverted to plain cookie read now that middleware guarantees it's set first), `frontend/src/lib/location/geo-headers.ts` (deleted — superseded).

**Note:** confirmed this is *not* how cars.com actually works (no real IP-based dealer personalization found there) — this was Richie's own requirement on top of the cars.com-inspired layout.

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

**Bug found and fixed after the initial import:** the first version of this migration only kept each post's single featured image — every image *inside* the article body (WordPress emits each as its own `<figure><img/></figure>`) was intentionally dropped, because the platform's article format only supported one image per post at the time. This wasn't clearly flagged to the client and was caught when they compared a migrated article against the original and noticed most of its images were missing. Fixed properly:
- Added real support for images inside article bodies (new `image` block type, rendered in `ArticleBody.tsx`)
- Closed a data-loss risk this created in the admin panel: before this fix, opening and re-saving any post there would have silently stripped its images (the admin editor didn't know about the new block type). Fixed so images round-trip safely — viewable, editable alt/caption, reorderable, removable — even though there's no "add a new inline image" flow yet.
- Rewrote the migration script to actually pull in-body images and re-upload them to Cloudinary (same approach as the featured image)
- Backfilled all 55 already-imported posts: verified against the real WordPress source first (709 images across 56 posts, 100% following the same `<figure>` pattern — confirmed before writing any parsing logic), tested end-to-end against 2 real images before running anything at scale, then ran on 1 real article and had the client confirm it looked right before running the remaining 54. Result: 55/55 backfilled, 0 failures. A handful of individual images (not whole posts) were skipped for legitimate reasons — 2 were hotlinked from a third-party site that returned 403, 1 was a GIF (outside the JPEG/PNG/WebP/AVIF the uploader accepts) — everything else on those posts imported fine.

**How it was done:**
- Fetched via the WordPress REST API (`autosalesreviews.com/?rest_route=/wp/v2/posts&per_page=100&_embed=1` — the standard `/wp-json/` path 404s, this fallback route works)
- Full HTML content converted to this platform's structured block format (`p`/`h2`/`h3`/`ul`/`quote`) using `cheerio`, not dumped as raw HTML — including merging WordPress's oddly-fragmented numbered lists (one `<ol>` per item) back into single list blocks
- Featured images downloaded and re-uploaded to Cloudinary (not hotlinked to the old WordPress site)
- No FAQs fabricated for migrated posts — left as an empty array, honest about what wasn't authored
- Existing 21 buyer-facing demo posts were **kept**, not replaced — both audiences are now served, per the confirmed decision
- Script: `backend/src/scripts/migrate-wp-blog.ts` — one-time, run locally only, not part of the deployed app (`cheerio` was installed with `--no-save` and removed after running, so it never touched `package.json` — avoids repeating the earlier `playwright`/Node-version build break)
- Image-support additions (for the body-image bug fix above): `frontend/src/config/blog/types.ts`, `frontend/src/config/blog/utils.ts`, `frontend/src/components/blog/ArticleBody.tsx`, `frontend/src/components/admin/AdminBlogSection.tsx`, `backend/src/services/image-upload.service.ts`

**Verified live:** category filter page and a migrated article page both confirmed rendering correctly (real title, real body text, Cloudinary-hosted image) before considering this done.

---

## Status: all 6 items done, not yet pushed
All 6 changes are implemented, typechecked (backend + frontend, clean), and verified locally per the notes above. **Not committed or pushed to git yet** — held back for review, per explicit instruction.
