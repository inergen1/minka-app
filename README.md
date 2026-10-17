# Minka · منكا

A bilingual (Arabic RTL / English) life planner: life areas and the wheel of life, goals with sub-goals and tasks, daily and recurring habits with streaks and a yearly heatmap, a day/week/month planner with drag-to-schedule, and a weekly review.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # logic tests (streaks, recurrence, goal progress)
npm run build
```

## How it is built

- Next.js 16 (App Router) + TypeScript + Tailwind v4. Styles live in `src/app/globals.css` (tokens + components, light and dark).
- All data is stored in the browser (`localStorage`, via Zustand persist in `src/store/minka.ts`). The UI renders on the client only (`src/components/app-frame.tsx`).
- Pure logic with tests: `src/lib/habits.ts`, `src/lib/goals.ts`, `src/lib/dates.ts`.
- Screens: `src/views/*` mounted by `src/app/<route>/page.tsx`.
- Strings: `src/lib/i18n.ts` (ar + en). Hijri dates use `Intl` with the Umm al-Qura calendar.
- `supabase/migrations/0001_init.sql` is the schema for moving to Supabase later (not applied).
