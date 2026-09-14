# Chipsklubben

A members-only site for cataloguing potato crisps (chips): brand, country,
tasting notes and a 1–5 rating. Every crisp is shared across the club, but
each member keeps their own rating and tasting notes on it — adding a review
to a crisp someone else added never overwrites theirs.

## Stack

- [Next.js](https://nextjs.org) (App Router, Server Actions) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) with SQLite for storage
- Custom invite-only auth: password login with `bcryptjs`, signed session cookies via `jose`

## Getting started

```bash
npm install
cp .env.example .env   # then set a real SESSION_SECRET
npm run db:push        # creates prisma/dev.db from the schema
npm run db:seed        # prints a one-time invite code for the first member
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

## Useful scripts

| Script            | Purpose                                   |
| ------------------ | ------------------------------------------ |
| `npm run dev`       | Start the dev server                       |
| `npm run build`     | Production build                           |
| `npm run start`     | Run the production build                   |
| `npm run lint`      | Lint the codebase                          |
| `npm run db:push`   | Sync `prisma/schema.prisma` to the database |
| `npm run db:seed`   | Create a bootstrap invite code             |
| `npm run db:studio` | Browse the database in Prisma Studio       |

## Deploying

The app reads `DATABASE_URL` (a SQLite file path by default) and
`SESSION_SECRET` from the environment — set real values for both in
production. SQLite is fine for a small club; swap the Prisma datasource
provider for Postgres/MySQL if you outgrow it.
