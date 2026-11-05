# Collexus Events

A Next.js App Router project for browsing verified Ramachandra College of Engineering event records.

## Start locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local`, then add values from Supabase, your PostgreSQL connection, Upstash, and Sentry as needed. Never commit `.env.local`; its database and service credentials must stay server-side. The `NEXT_PUBLIC_*` Supabase and Turnstile values are public browser configuration.

Open http://localhost:3000. Build for production with `npm run build`, then serve it with `npm start`. The app requires a Node.js Next.js host such as Vercel; GitHub Pages cannot run its authenticated API routes or Server Actions. The workflow in `.github/workflows/pages.yml` now validates the app without publishing a static export.

### Backend setup

1. Apply the existing Supabase migrations in `supabase/migrations` to the project. This includes the event submission base table and the existing profile and profile photo setup noted below.
2. Apply `prisma/migrations/20261104000000_backend_core/migration.sql` to the same PostgreSQL database, or run `npm run db:migrate:deploy` with `DIRECT_URL` configured. This creates the private event review table, server-managed roles, and private poster storage bucket. It is additive and does not delete existing event submissions.
3. Set `DATABASE_URL` to the server-only runtime PostgreSQL connection and `DIRECT_URL` to the direct migration connection. Set both Upstash REST variables together to enable production rate limiting. Production writes fail closed if Upstash is not configured.
4. Configure Supabase Auth redirect URLs for the deployed site and local development. Assign admin roles only through trusted database administration; users cannot grant themselves a role.

Event form writes now go through the authenticated Server Action, and the REST endpoint is available at `POST /api/events`. Posters are restricted to JPG, PNG, and WebP files up to 5 MB, stored in the private `event-posters` bucket, and attached only by the user who uploaded them. Submissions remain pending review and are not published automatically.

`npm run db:generate`, `npm run db:migrate:deploy`, `npm run typecheck`, `npm run lint`, and `npm test` provide the common backend and quality workflows. `npm run build` generates the Prisma client before building Next.js.

Profile contact fields and photo uploads also need their database setup applied to the same Supabase project, in order: `supabase/migrations/20261031000000_profile_contact_fields.sql`, then `supabase/migrations/20261101000000_profile_photo_storage.sql`. These add profile columns and the private `profile-photos` bucket with per-user storage policies.

## Structure

- `app/` contains the home page, shared layout, global theme styles, and the `/events/[slug]` event detail route.
- `components/original-event-cards.tsx` renders the event archive using the supplied visual theme.
- `components/original-interactions.tsx` connects the menu, category search, filters, calendar and local pass demo.
- `components/original-timetable.tsx` displays only events with a date in their public RCEE source.
- `data/events.ts` is the typed source of event descriptions, dates, details and official links.
- `public/assets/` contains the local image assets used by the interface.

Event dates and facts follow the linked college reports. When the source did not state an exact date, the listing says “Dates not listed.”

## UI stack

The app uses Next.js App Router, React, TypeScript and Tailwind CSS v4. Its Vivid Nightfall palette uses `#10002B`, `#240046`, `#3C096C`, `#5A189A`, `#7B2CBF`, `#9D4EDD`, `#C77DFF` and `#E0AAFF`. The Collexus logo keeps its original colors. Plus Jakarta Sans and Space Grotesk provide the interface typography, and Lucide React is used for event icons. RCEE event records link to their public source pages; local pass previews are a UI demo and do not submit event registrations.
