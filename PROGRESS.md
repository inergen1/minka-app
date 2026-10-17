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

## Next
1. Service worker for offline use (see `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`).
2. Edit existing habits / goals / tasks (currently create + delete only); pick an icon for a new habit (`ICON_CHOICES` in `src/components/icon.tsx`).
3. Store a rating history (`area_ratings`) so "3 months ago" comes from real data; snapshot `before` when a review is saved.
4. Habit reminders (needs service worker + notifications permission).
5. Full onboarding flow (rate wheel → write vision per area → pick habit templates) for the "start from scratch" path.
6. Insights screen (completion by area, trends, best days).
7. When the user agrees: Supabase auth + sync (apply the migration, swap the store's persistence).

## Known issues
- Data entered in one language is saved as the same text for both languages.
- Drag-and-drop uses HTML5 DnD (desktop); on touch devices use tap-to-schedule.
