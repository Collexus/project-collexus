# Collexus Events

A Next.js App Router project for browsing verified Ramachandra College of Engineering event records.

## Start locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Build for production with `npm run build`, then serve it with `npm start`.

Organizer event submissions use the existing Supabase URL and publishable key. Apply `supabase/migrations/20261030000000_event_submissions.sql` to the Supabase project before accepting submissions. Row-level security restricts inserts to the signed-in organizer and keeps submissions private for review; submissions are not published automatically.

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
