
# Dealer Review and Inventory Platform

A dealer review and inventory platform. **PostgreSQL is the source of truth** for dealers, vehicles, reviews, blog, and ratings. Live Bergen Car inventory comes from Auto.dev; listing order is `Dealer.featured`, not a hardcoded slug.

## Tech Stack

| Layer | Technology |
|----------|-------------------------------------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Backend  | Node.js, Express                    |
| Database | PostgreSQL, Prisma ORM              |
| Photos   | Cloudinary (preferred) or local `/uploads` on Railway |
| Frontend hosting | Vercel                      |
| Backend + DB hosting | Railway                 |

## Project Structure

```
├── backend/          # Express REST API + Prisma
├── frontend/         # Next.js 14 App Router
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL (local or Neon/Railway)
- npm

## Local Setup

### 1. Database

Create a PostgreSQL database and note the connection string.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — DATABASE_URL is required. Add Auto.dev / Places / Cloudinary / CRON_SECRET when ready.

npm install
npm run db:generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

The API runs at **http://localhost:4000**.

If this database was previously created with `prisma db push` (no `_prisma_migrations` table), baseline then push any missing columns:

```bash
npx prisma migrate resolve --applied 20260813160000_milestone_3_inventory_blog
npx prisma db push
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000
# NEXT_PUBLIC_SITE_URL=http://localhost:3000

npm install
npm run dev
```

The app runs at **http://localhost:3000**.

## Environment Variables

Secrets belong in **backend `.env` only**. Never put Auto.dev, Google Places, Cloudinary, or cron tokens in `NEXT_PUBLIC_*`.

### Backend (`backend/.env`)

| Variable | Description |
|----------------|--------------------------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port (default: 4000) |
| `CORS_ORIGIN` | Allowed frontend origin(s) |
| `SITE_URL` | Public site URL used in emails |
| `AUTODEV_API_KEY` | Auto.dev listings API key |
| `AUTODEV_PHOTO_BASE_URL` | Optional photo URL prefix (default `https://images.auto.dev`) |
| `GOOGLE_PLACES_API_KEY` | Places Details for Google ratings |
| `CLOUDINARY_URL` | Optional. If set, vehicle photos upload here |
| `CRON_SECRET` | Bearer token for HTTP job triggers |
| `EMAIL_*` / `ADMIN_EMAIL` | SMTP for review notifications |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|------------------------|--------------------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Optional gtag measurement ID (e.g. `G-XXXXXXXX`) |

## API Endpoints

| Method | Endpoint | Description |
|--------|-----------------------|--------------------------------------|
| GET | `/api/dealers` | List dealers |
| GET | `/api/dealers/:slug` | Single dealer by slug |
| GET | `/api/vehicles` | Live inventory (Postgres). Empty dealer stock returns **200** `{ data: [] }` |
| GET | `/api/vehicles/:id` | Vehicle detail + similar |
| GET | `/api/blog` | Published posts |
| GET | `/health` | Health check |
| POST | `/api/internal/jobs/inventory-sync` | Auto.dev sync (Bearer `CRON_SECRET`) |
| POST | `/api/internal/jobs/ratings-sync` | Google Places ratings sync (Bearer `CRON_SECRET`) |

Each dealer response includes combined rating fields and `vehicleCount` from active inventory.

## Cron jobs

`node-cron` inside the Railway Node process (not Vercel Cron):

- Inventory sync: `0 2 * * *`
- Google ratings sync: `0 3 * * *`

Manual trigger (same service functions):

```bash
curl -X POST "$API_URL/api/internal/jobs/inventory-sync" \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST "$API_URL/api/internal/jobs/ratings-sync" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Seed Data

The seed script creates:

- **Bergen Car Company** (Paramus, NJ 07652, slug `bergen-car`) — `featured: true` so it sorts first
- Additional dealers across target cities (`featured: false`)
- Catalog vehicles (`source: catalog`) for non-Auto.dev dealers
- Blog posts in Postgres
- Sample platform reviews (Google/Yelp/Carfax left null until admin or Places sync)

```bash
cd backend
npm run db:seed
```

Seed is destructive (dealers, reviews, vehicles, blog).

## Deployment

Do not put Auto.dev / Places / Cloudinary keys on Vercel. Backend is Node.js on Railway; database is PostgreSQL only — no Vercel Blob, no Vercel Cron.

### Railway (Backend + PostgreSQL)

1. Create a Railway project and add PostgreSQL.
2. Deploy the `backend/` directory as a Node service.
3. Set these environment variables in the Railway dashboard:

   ```
   DATABASE_URL=
   AUTODEV_API_KEY=
   CLOUDINARY_URL=
   GOOGLE_PLACES_API_KEY=
   CRON_SECRET=
   ```

   `ADMIN_PASSWORD` is **not** an env var the app reads — the admin password lives hashed in the `AdminAccount` table only (set by `npm run db:seed`, changeable from `/admin`). Do not add it to Railway; it would be ignored.
4. Build command: `npm install && npm run build` (runs `prisma generate && tsc` — see `backend/railway.toml`).
5. Release command: `npx prisma migrate deploy`
6. Start command: `npm run start` (runs `node dist/index.js`).
7. The web process schedules the inventory sync (02:00) and ratings sync (03:00) internally via `node-cron` — no separate Railway Cron service is required. Optionally add Railway Cron to POST the job URLs on a schedule as a redundant trigger.
8. After first deploy: run `npm run db:seed` once from a Railway shell, then trigger the inventory sync manually:

   ```bash
   curl -X POST https://your-railway-url/api/internal/jobs/inventory-sync \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### Vercel (Frontend)

1. Import the `frontend/` directory.
2. Set only:
   - `NEXT_PUBLIC_API_URL` — Railway backend URL
   - `NEXT_PUBLIC_SITE_URL` — production site URL (e.g. `https://dealer-review-and-inventory-platfor-smoky.vercel.app`)
   - `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` — optional
3. Deploy: `vercel --prod` (or push to the connected branch).

## Post-deploy checklist

- [ ] `GET /health` on Railway
- [ ] `npx prisma migrate deploy` succeeded
- [ ] Seed ran once; Bergen Car is Paramus NJ 07652
- [ ] `POST /api/internal/jobs/inventory-sync` with `CRON_SECRET` succeeds (needs `AUTODEV_API_KEY`)
- [ ] Bergen Car inventory visible on its dealer profile page
- [ ] `/vehicles` shows live cars with featured dealers (Bergen Car) first
- [ ] Vehicle photos load from Cloudinary (`res.cloudinary.com`), never hotlinked from Auto.dev; 0 photos shows a car-icon placeholder
- [ ] EMI calculator uses 6.25% APR / 10% down / 60 months by default
- [ ] Blog listing and post pages render and are readable; newsletter signup works
- [ ] Admin panel is reachable at `/admin` and login works
- [ ] Admin dealer form accepts a Google Place ID, validates it on save, and shows the synced rating
- [ ] `POST /api/internal/jobs/ratings-sync` with `CRON_SECRET` succeeds (needs `GOOGLE_PLACES_API_KEY`)
- [ ] Review submission, and admin approve/reject, still work
- [ ] Combined rating breakdown calculates correctly from enabled sources
- [ ] `/sitemap.xml` includes live API vehicles + DB blog slugs
- [ ] `/robots.txt` is accessible and blocks `/admin`
- [ ] Google PageSpeed: 85+ mobile, 95+ desktop on the homepage

## Pages

| Route | Description |
|---------------|----------------------------|
| `/` | Homepage with hero, featured vehicles, dealers |
| `/vehicles` | Inventory search |
| `/vehicles/[id]` | Vehicle PDP |
| `/dealers` | Dealer listings |
| `/dealers/[slug]` | Dealer profile (inventory default) |
| `/blog` | Blog CMS listing |
| `/blog/[slug]` | Article |
| `/admin` | Admin (reviews, dealers, blog, ratings) |
