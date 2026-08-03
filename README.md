# NyumbaHub Kenya

Premium real estate marketplace for Kenya — buy, rent, sell land, commercial, and holiday homes. Built with Next.js 15, Prisma, Auth.js, and a Stripe + M-Pesa ready payments layer.

## Features

- **Marketplace** — search by Buy / Rent / Land / Commercial / Holiday with county, town, estate, price, beds/baths, and amenity filters
- **Property detail** — gallery, video tour slot, map placeholder, amenities, nearby places, WhatsApp contact, viewing booking, mortgage calculator
- **Auth & roles** — Buyer, Seller, Agent, Admin (email + optional Google OAuth)
- **Seller dashboard** — listings, leads, promote, analytics, AI description & price suggestion
- **Agent dashboard** — CRM, clients, viewings, reports, subscriptions
- **Admin panel** — users, properties, agents, payments, ads, blog, moderation, verification
- **AI** — description generation, smart pricing, recommendations, chat assistant, duplicate detection
- **Payments** — Stripe checkout + M-Pesa STK Push stubs
- **SEO** — dynamic metadata, Open Graph, Twitter cards, JSON-LD, sitemap, robots.txt
- **UX** — dark/light mode, glassmorphism UI, responsive layout, wishlist & compare

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js / NextAuth v5 |
| Media | Cloudinary |
| Maps | Google Maps API (client key) |
| Payments | Stripe + Safaricom Daraja (M-Pesa) |
| Tests | Vitest |

## Quick start

### Prerequisites

- Node.js 20+
- Docker (recommended for PostgreSQL) **or** a local Postgres instance

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Start Postgres

```bash
docker compose up -d db
```

### 3. Database

```bash
npm run db:push
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seed accounts

Password for all: `Password123!`

| Role | Email |
|------|-------|
| Admin | `admin@nyumbahub.co.ke` |
| Seller | `seller@nyumbahub.co.ke` |
| Agent | `agent@nyumbahub.co.ke` |
| Buyer | `buyer@nyumbahub.co.ke` |

## Environment variables

See `.env.example` for the full list. Minimum for local UI:

```env
DATABASE_URL=postgresql://nyumbahub:nyumbahub@localhost:5432/nyumbahub?schema=public
AUTH_SECRET=generate-a-long-random-string
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional integrations:

- `CLOUDINARY_*` — image/video uploads
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — maps on property pages
- `STRIPE_*` — card payments
- `MPESA_*` — Daraja STK Push
- `OPENAI_API_KEY` — AI description / pricing (falls back to templates if unset)

## Docker (full stack)

```bash
docker compose up --build
```

App: `http://localhost:3000` · DB: `localhost:5432`

## Deploy on Railway (site + admin)

The public marketplace and admin panel are **one Next.js app**. Railway hosts both:

| Surface | URL |
|---------|-----|
| Website | `https://YOUR-APP.up.railway.app/` |
| Admin | `https://YOUR-APP.up.railway.app/dashboard/admin` |
| Health | `https://YOUR-APP.up.railway.app/api/health` |

### 1. Push this repo to GitHub

Railway deploys from GitHub. Create a repo and push the project.

### 2. Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. **Add PostgreSQL** (New → Database → PostgreSQL)
3. **Deploy from GitHub** — select this repository (builds with the included `Dockerfile`)

### 3. Variables (web service)

In the Next.js service → **Variables**, set:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
AUTH_SECRET=<long-random-string>
AUTH_TRUST_HOST=true
AUTH_URL=https://YOUR-APP.up.railway.app
NEXTAUTH_URL=https://YOUR-APP.up.railway.app
NEXT_PUBLIC_APP_URL=https://YOUR-APP.up.railway.app
NEXT_PUBLIC_APP_NAME=NyumbaHub Kenya
```

Optional but recommended for production uploads:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 4. Public domain

Railway → your web service → **Settings** → **Networking** → **Generate Domain**.

Then update `AUTH_URL`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL` to that HTTPS URL and redeploy.

### 5. Seed demo accounts (once)

```bash
railway run npm run db:seed
```

Or from Railway shell / one-off command after the first successful deploy.

Demo admin: `admin@nyumbahub.co.ke` / `Password123!`

### How deploys work

- `railway.toml` builds with Docker
- On start: `prisma migrate deploy` then Next.js (`npm run start:railway`)
- Health check: `GET /api/health`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Production server (standalone `server.js`) |
| `npm run start:railway` | Migrate DB + start (Railway) |
| `npm run start:local` | `next start` (local) |
| `npm test` | Run unit tests |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Prisma schema |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

## Project structure

```text
src/
  app/
    (marketing)/     # Home, search, property detail, blog, agents
    (auth)/          # Login, register, verify
    dashboard/       # Seller, agent, admin
    api/             # REST APIs (auth, properties, AI, payments)
  components/        # UI, layout, home, property, dashboard, AI
  lib/               # prisma, auth, ai, mpesa, stripe, seo, validations
  data/mock.ts       # Offline/demo data fallback
prisma/
  schema.prisma
  seed.ts
```

## API overview

- `POST /api/auth/register` — create account
- `GET|POST /api/properties` — list / create
- `GET|PATCH|DELETE /api/properties/[id]`
- `POST /api/properties/[id]/leads`
- `GET|POST|DELETE /api/favorites`
- `POST /api/ai/generate-description`
- `POST /api/ai/suggest-price`
- `POST /api/ai/chat`
- `POST /api/payments/stripe/checkout`
- `POST /api/payments/mpesa/stk`
- `POST /api/upload`

When the database is unavailable, marketplace reads fall back to rich Kenyan mock data so the UI stays demoable.

## Testing

```bash
npm test
```

## Performance & accessibility

- Next.js Image with remote patterns (Unsplash, Cloudinary)
- Font display swap (Fraunces + DM Sans)
- Skip-to-content link, semantic landmarks, labelled controls
- Skeleton loaders and lazy sections on the marketing surface
- Target Lighthouse ≥ 90 on production builds with CDN images and caching headers

## License

Private / proprietary — NyumbaHub Kenya.
