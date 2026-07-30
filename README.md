
# Dealer Review and Inventory Platform

A dealer review and inventory platform (similar to DealerRater) focused on dealerships in **NJ, NY, PA, and CT**.

**Milestone 1** includes dealer listings, profiles, ratings, search/filter, and seed data. Review submission and inventory integration come in later milestones.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Backend  | Node.js, Express                    |
| Database | PostgreSQL, Prisma ORM              |
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
- PostgreSQL (local or Railway)
- npm

## Local Setup

### 1. Database

Create a PostgreSQL database and note the connection string.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL

npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

The API runs at **http://localhost:4000**.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:4000

npm install
npm run dev
```

The app runs at **http://localhost:3000**.

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                    |
|----------------|--------------------------------|
| `DATABASE_URL` | PostgreSQL connection string   |
| `PORT`         | API port (default: 4000)       |

### Frontend (`frontend/.env.local`)

| Variable               | Description              |
|------------------------|--------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL     |

## API Endpoints

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/api/dealers`        | List dealers (filters: `state`, `city`, `minRating`, `search`) |
| GET    | `/api/dealers/:slug`  | Single dealer by slug                |
| POST   | `/api/dealers`        | Create dealer (admin, no auth yet)   |
| GET    | `/health`             | Health check                         |

Each dealer response includes `averageRating` and `totalReviews` calculated dynamically from reviews.

## Seed Data

The seed script creates:

- **Bergen Car** (NJ, Bergen) — pinned at top of listings
- 15 additional dealers across NJ, NY, PA, CT
- 3–5 random reviews per dealer

```bash
cd backend
npm run db:seed
```

## Deployment

### Railway (Backend + PostgreSQL)

1. Create a new Railway project.
2. Add a **PostgreSQL** service.
3. Add a **Node.js** service from the `backend/` directory.
4. Set environment variables:
   - `DATABASE_URL` — from the PostgreSQL service
   - `PORT` — Railway sets this automatically
5. Set build command: `npm install && npm run db:generate && npm run build`
6. Set start command: `npm start`
7. After deploy, run migrations and seed via Railway shell:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

### Vercel (Frontend)

1. Import the `frontend/` directory as a new Vercel project.
2. Set environment variable:
   - `NEXT_PUBLIC_API_URL` — your Railway backend URL (e.g. `https://your-app.up.railway.app`)
3. Deploy.

## Pages

| Route               | Description                    |
|---------------------|--------------------------------|
| `/`                 | Homepage with hero and search  |
| `/dealers`          | Dealer listings with filters   |
| `/dealers/[slug]`   | Dealer profile page            |

## Notes

- Average ratings are computed from reviews at query time, not stored.
- Dealer slugs are auto-generated from the name (lowercase, hyphenated).
- Bergen Car is always pinned first in dealer listings.
- Review submission (Milestone 2) and inventory (Milestone 3) are not included yet.
