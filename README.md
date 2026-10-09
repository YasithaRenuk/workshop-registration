# Workshop Registrations

A Next.js application for managing workshops and attendee registrations. Staff can register attendees, managers create and manage workshops, and admins control user accounts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | better-auth (email + password, no public sign-up) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL |
| UI | Tailwind CSS v4 + shadcn/ui |

---

## 1 — Clone & Install

```bash
git clone <your-repo-url>
cd workshop-registrations
npm install
```

> `postinstall` runs `prisma generate` automatically.

---

## 2 — Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/workshop_registrations?schema=public"

# Auth secret — generate one with:  openssl rand -base64 32
BETTER_AUTH_SECRET="<paste output here>"

# Must match where you run the dev server
BETTER_AUTH_URL="http://localhost:3000"

# Credentials used by `npm run db:seed` to create the Admin account
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="Admin1234"
```
---

## 3 — Create the Database

Create the database in PostgreSQL before running migrations (skip if it already exists):

```bash
# psql example — adjust user/host as needed
psql -U postgres -c "CREATE DATABASE workshop_registrations;"
```

---

## 4 — Run Migrations

```bash
npx prisma migrate deploy
```

This applies every migration in `prisma/migrations/` in order.

---

## 5 — Seed the Database

```bash
npm run db:seed
```

This creates the following accounts and sample workshops:

### Seeded Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@example.com` *(or your `SEED_ADMIN_EMAIL`)* | `Admin1234` *(or your `SEED_ADMIN_PASSWORD`)* |
| **Manager** | `manager@example.com` | `manager1234` |
| **Staff** | `staff@example.com` | `staff1234` |

> [!NOTE]
> These are **dev-only** credentials included here for convenience. Do **not** use them in production.

### Seeded Workshops

| Code | Title | Status | Starts |
|---|---|---|---|
| `WS-REACT-101` | React Fundamentals | OPEN | +7 days |
| `WS-NODE-201` | Node.js & REST APIs | OPEN | +14 days |
| `WS-DOCKER-301` | Docker & Containerisation | OPEN | +21 days |
| `WS-AGILE-DFT` | Agile for Developers | DRAFT | +30 days |

> Dates are calculated relative to when you run the seed, so they're always in the future. The DRAFT workshop is only visible to Managers.

---

## 6 — Run the Dev Server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

You'll be redirected to the login page. Sign in with any of the seeded accounts above.

---
