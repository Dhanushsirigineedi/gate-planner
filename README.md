# GATE CSE planner

## Unit rule (read before touching the schema)
- `Topic.lectureHrs` and all `LECTURE` type allocations/progress are in **lecture-time** (nominal, e.g. "1.5 hrs lecture").
- `Topic.pyqHrs` / `Topic.revisionHrs` and `PYQ`/`REVISION` allocations are already **real-time**.
- Conversion happens in exactly one place: `lib/time.ts` — `allocationRealDuration()` — called only when a `DailyBlock` is created from a drag-and-drop drop event, to size the calendar slot.
- Never store or display real-time for lecture hours outside the daily grid. Progress, remaining hours, and weekly totals for lectures are always lecture-time.

## End-of-week reschedule
`lib/reschedule.ts` exposes:
- `previewWeekReschedule(weeklyPlanId)` — returns the delta (shortfall or surplus) per open allocation. Call this to render the confirmation prompt. Nothing is written.
- `confirmWeekReschedule(weeklyPlanId, nextWeeklyPlanId, items)` — only called after the user clicks confirm. Closes this week's allocations, adjusts (or creates) next week's.

## Setup
```bash
npm install
cp .env.example .env   # fill in DATABASE_URL (Neon/Vercel Postgres)
npx prisma migrate dev --name init
npm run dev
```

## Deploy to Vercel
1. Push this repo to GitHub.
2. Import into Vercel, set the `DATABASE_URL` env var (Neon or Vercel Postgres works well).
3. Vercel runs `next build` automatically. Add a `postinstall` script (`prisma generate`) if the client isn't found at build time.

## Still to build
- `/syllabus` — CRUD for Subject/Topic (build first — no dependencies on anything else).
- `/weekly` — nominated hours, disturbances, dnd-kit list-based allocation from syllabus.
- `/daily` — FullCalendar timeGrid view, external drag from weekly allocations, template blocks pre-seeded per day-of-week with per-date override on delete.
- API routes under `app/api/` for each of the above (not scaffolded yet — build alongside each page).
- Seed script for `GlobalSettings` (speedFactor, examDate) and recurring `TemplateBlock`s (class/gym timetable).
