# Minka — progress

Plan: `/Users/hussien/.claude/plans/i-think-minka-nested-taco.md`
Approved design prototype: https://claude.ai/artifact/UN75rfwhNvEiEwQ9kErpbT

## Decisions
- Supabase deferred by the user → data is local (Zustand + localStorage). Schema ready in `supabase/migrations/0001_init.sql`, not applied. Do not create a Supabase project without asking.
- Language is a store setting (no `/ar` `/en` routes) because pages are client-rendered; `dir` and theme are applied before paint by an inline script in `src/app/layout.tsx`.
- Pages set `export const instant = false` (client-only rendering).
- Avoid CSS class names that collide with Tailwind utilities (e.g. `ring` → `prog-ring`).

## Done (2026-10-18, first session)
- Scaffold (Next 16.4, React 19.3, Tailwind 4, Zustand 5, lucide-react, Vitest 5).
- Logic + 14 passing tests: recurrence, streaks, best streak, rates, tap-to-log values, goal progress roll-up.
- Welcome screen: start with sample data (a year of history) or from scratch (8 blank areas).
- Today: Gregorian + Hijri date, progress ring, habits grouped by prayer-anchored time slots with one-tap logging, today's tasks, review priorities, schedule timeline, next deadline goal.
- Life areas: wheel-of-life radar (now vs 3 months ago), lowest-area insight, area detail with editable vision, rating slider, goals and habits.
- Goals: area filter, collapsible tree (sub-goals + tasks), numeric metric editing, two-step delete, yearly timeline (Gantt).
- Habits: list with last-7-days dots, detail with stats, 12-month heatmap, linked goal, two-step delete.
- Planner: day / week / month, Hijri day numbers, drag-and-drop or tap-to-schedule tasks, remove a slot, now line.
- Weekly review: 4-step wizard (numbers, ratings, reflection, 3 priorities), saved reviews history.
- Quick add modal (habit / goal / task), toasts, settings menu (export JSON, reset), language and theme toggles.
- Web app manifest + icons (installable). Verified in browser: Arabic RTL dark desktop, English light 375px mobile, no horizontal overflow.

## Done (2026-10-18, same session, second pass)
- Offline: hand-written `public/sw.js` (network-first pages, cache-first static assets), registered in production only. Verified on `next start`: worker activated, all six pages cached.
- Edit habits and goals from their detail / tree (same form as Add, pre-filled; edits only change the current language's text). Icon picker for habits. A goal cannot be moved under itself.
- "3 months ago" on the wheel of life now comes from saved reviews when one is 90+ days old (`src/lib/ratings.ts`, tested). 16 tests pass.

## Next
1. Edit tasks (title, goal, due date) — tasks are create / toggle / schedule only.
2. Habit reminders (service worker is in place; needs notification permission + a time per habit).
3. Full onboarding flow for "start from scratch" (rate wheel → write vision per area → pick habit templates).
4. Insights screen (completion by area, trends, best weekdays).
5. Resize scheduled blocks (duration is fixed at 1 hour).
6. When the user agrees: Supabase auth + sync (apply the migration, swap the store's persistence).

## Known issues
- Data entered in one language is saved as the same text for both languages.
- Drag-and-drop uses HTML5 DnD (desktop); on touch devices use tap-to-schedule.
