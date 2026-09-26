# Chipsklubben

A members-only site for cataloguing potato crisps (chips): brand, country,
tasting notes and a 1–5 rating. Every crisp is shared across the club, but
each member keeps their own rating and tasting notes on it — adding a review
to a crisp someone else added never overwrites theirs.

## Stack

- [Next.js](https://nextjs.org) (App Router, Server Actions) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) with Postgres for storage
- Custom invite-only auth: password login with `bcryptjs`, signed session cookies via `jose`

## Getting started

You need a Postgres database to develop against — the easiest options are a
free [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres)
database (or point `DATABASE_URL` at the same database your Vercel deployment
uses).

```bash
npm install
cp .env.example .env   # set DATABASE_URL to your Postgres connection string, and a real SESSION_SECRET
npm run db:push        # syncs prisma/schema.prisma to the database
npm run db:seed        # prints a one-time invite code and seeds sample crisps
npm run dev
```

Open http://localhost:3000, then go to `/register` with the invite code the
seed script printed to create the first account. Once logged in, visit
`/invites` to generate codes for other members.

## How membership & reviews work

- **Invite-only accounts.** Signing up requires a valid, unused invite code.
  Any logged-in member can generate new codes from `/invites` to bring in
  new members.
- **Shared crisp listing.** Adding a crisp (`/crisps/new`) requires a name,
  brand, country, and your own rating + tasting notes — the crisp appears in
  the shared listing for everyone from then on.
- **Per-member reviews.** From a crisp's page, any member can add their own
  rating and tasting notes to a crisp — including ones added by other
  members. Each member has exactly one review per crisp; submitting again
  updates their existing review rather than creating a duplicate.
- **Photos.** A crisp can have a photo, shown as a thumbnail in the listing
  and larger on its own page. It's optional when adding a new crisp, and any
  member can add or replace it later from the crisp's page. Photos are
  stored in [Vercel Blob](https://vercel.com/storage/blob).

## Useful scripts

| Script            | Purpose                                   |
| ------------------ | ------------------------------------------ |
| `npm run dev`       | Start the dev server                       |
| `npm run build`     | Production build                           |
| `npm run vercel-build` | Build command used on Vercel (schema sync + seed + build) |
| `npm run start`     | Run the production build                   |
| `npm run lint`      | Lint the codebase                          |
| `npm run db:push`   | Sync `prisma/schema.prisma` to the database |
| `npm run db:seed`   | Create a bootstrap invite code             |
| `npm run db:studio` | Browse the database in Prisma Studio       |

## Deploying (Vercel)

The app reads `DATABASE_URL`, `SESSION_SECRET` and `BLOB_READ_WRITE_TOKEN`
from the environment — all three must be set as real values in your Vercel
project's environment variables. `BLOB_READ_WRITE_TOKEN` is set automatically
once you connect a [Vercel Blob](https://vercel.com/storage/blob) store to
the project (Storage → Create Database → Blob → Connect). Without it, crisp
photo uploads fail with a friendly error but the rest of the app keeps
working.

Set the project's **Build Command** (Project Settings → Build & Development
Settings) to:

```
npm run vercel-build
```

That script runs `prisma generate`, syncs the schema to `DATABASE_URL` with
`prisma db push`, runs the (idempotent) seed script, then builds the app —
so every deploy keeps the database schema and sample data in sync
automatically, with no manual database commands required.
