# Kiro Session Summary — Meal Planner

This document captures the full context of the meal planner project so another AI agent (or developer) can pick up where we left off. Read this first before making changes.

---

## 1. What This Project Is

A weekly meal planning **PWA** for two people (Seb and Alyssa), who are remote workers cooking lunch + dinner at home daily. The app:

- Stores recipes (who can cook, prep time, cost, difficulty, tags, ingredients)
- Auto-generates a balanced weekly meal plan (14 slots = 7 days × lunch + dinner)
- Generates an aggregated grocery list from the plan
- Is installable on phones (Android primary, iOS supported)

**Repo**: https://github.com/bucanero2010/meal-planner
**Hosting**: Vercel (auto-deploys on push to `main`)
**Local path**: `weekly-cooking-planner/meal-planner`

---

## 2. Key Product Decisions (from conversation)

These were decided through discussion — respect them unless the user changes their mind:

- **14 meal slots per week**: lunch + dinner, 7 days. Both are remote workers eating at home.
- **No seasonal preferences.**
- **Repeat policy**: A recipe can repeat across consecutive weeks, but NOT appear twice in the same week. EXCEPTION: a "2-meal" recipe covers 2 consecutive slots (one cooking event) — that's fine.
- **Leftovers are flexible**: a 2-meal recipe can cover lunch+dinner same day, OR dinner + next day's lunch. (But see constraint update in §4 — 2-meal recipes are now forced to lunch.)
- **Small recipe pool** (~13 recipes), so repetition across weeks is expected and acceptable.
- **No auth** — it's a private app for two people. Single shared "household", open RLS policies.
- **Two cooks**: "Seb" (stored as `ME`), "Alyssa" (stored as `PARTNER`), or "Both" (`BOTH`).

---

## 3. Tech Stack

- **Next.js 16** (App Router), TypeScript, Tailwind CSS v4
- **Supabase** (PostgreSQL + `@supabase/supabase-js` client) — NOT Prisma (see §6 for why)
- **next-pwa** for installability
- **Build command**: `next build --webpack` (next-pwa needs webpack, not Turbopack — set in package.json)
- **Deployed on Vercel**

### Environment variables (set in `.env` locally and in Vercel dashboard)
```
NEXT_PUBLIC_SUPABASE_URL=https://vrsmocfyprbiedwvoodx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
```
Note: the key is a Supabase "publishable" key (`sb_publishable_...`), used client-side. RLS is open (allow-all policies) since there's no auth.

---

## 4. Scheduling Algorithm (`src/lib/scheduler.ts`)

Greedy slot-filling algorithm. Walks 14 slots in order (Mon lunch → Sun dinner). For each empty slot:

1. Filter out used recipes
2. Filter by 2-meal availability + **2-meal recipes MUST be at LUNCH** (cook once at lunch, leftovers for same-day dinner)
3. Filter by cook constraint (see fixed constraints below)
4. Score each candidate, pick highest

### Fixed constraints (hardcoded)
- **Monday** (lunch + dinner): always **lentils** (matched by name/tag containing "lentil" or "lenteja")
- **Wednesday lunch**: Seb cooks (`ME`)
- **Friday** (both meals): Alyssa cooks (`PARTNER`)

### Scoring factors
- **Dinner simplicity**: easy +3, involved -4, quick (≤15min) +2, long (≥60min) -2, 2-meal +2 at dinner
- **Weekday/weekend time fit**: ≤15min quick bonus on weekdays; ≥45min recipes favored on weekends
- **Cook balance**: favors whoever has cooked less
- **Tag diversity**: -2 per repeated tag (avoids 4 pasta nights)
- **Cost balance**: favors cheap if week's been expensive
- **2-meal efficiency**: +1 bonus

### Locking / regeneration
- Slots can be locked: either "eating out" (left empty) or a manually-swapped recipe.
- `generateWeeklyPlan(recipes, slotsToSkip)` — `slotsToSkip` is a `Set<"day-meal">` (e.g. `"4-DINNER"`).
- The generate API (`/api/plan/generate`) accepts `{ skipSlots, lockedRecipes }`; locked recipes are removed from the pool so they aren't duplicated.

---

## 5. Data Model (Supabase — `supabase-schema.sql`)

Tables (snake_case columns — IMPORTANT, see §7):
- `ingredients` (id, name, category, unit)
- `recipes` (id, name, cooked_by, meals, prep_time, difficulty, cost, tags[], notes)
- `recipe_ingredients` (recipe_id, ingredient_id, quantity)
- `weekly_plans` (id, week_start, ...)
- `plan_slots` (plan_id, day, meal, recipe_id, cooked_by)
- `pantry_staples` (ingredient_id) — table exists but UI not built yet

Enums stored as TEXT: cooked_by (`ME`/`PARTNER`/`BOTH`), difficulty (`EASY`/`MEDIUM`/`INVOLVED`), cost (`CHEAP`/`MODERATE`/`EXPENSIVE`), meal (`LUNCH`/`DINNER`), category (`PRODUCE`/`DAIRY`/`PROTEIN`/`GRAINS`/`PANTRY`/`FROZEN`/`SPICES`/`OTHER`).

`day`: 0=Monday … 6=Sunday.

---

## 6. History / Gotchas (things that already bit us)

- **Prisma was removed.** We started with Prisma 7 but hit repeated config issues (Prisma 7 moved the DB URL to `prisma.config.ts`, removed `datasources`/`url` from schema and client constructor). Switched to `@supabase/supabase-js` to match the user's other project (expense-tracker). Don't reintroduce Prisma.
- **snake_case vs camelCase**: Supabase returns snake_case (`cooked_by`, `prep_time`). A bug where the recipe list always showed "Both" was caused by reading `recipe.cookedBy` instead of `recipe.cooked_by`. Always use snake_case when reading Supabase rows directly.
- **Dark mode**: the user's phone uses dark mode. Avoid hardcoded `bg-white`/light backgrounds — use borders (`border-gray-300`) and `dark:` variants. Several pages were fixed for this.
- **Decimal quantity input**: ingredient quantities are stored as strings in component state (not numbers) so users can type a decimal point ("0.5") without React reparsing it to "0". Converted to float only on save.
- **Form button issue**: the "Add ingredient" button didn't work inside a `<form>` (native validation interference). The new/edit recipe pages do NOT use `<form>` — they're controlled inputs with a plain Save button.
- **PWA install**: requires valid icons (`public/icon-192.png`, `icon-512.png`) + `manifest.json` + HTTPS + service worker. Icons are generated by `scripts/generate-icons.js` (cooking pot on green). Icons use `"purpose": "any maskable"` and full-bleed (no rounded corners) so Android's circle crop doesn't shrink them.

---

## 7. Current App Structure

```
src/
├── app/
│   ├── page.tsx                 # Weekly plan (home) — generate, swap, lock, save
│   ├── plan/history/page.tsx    # Past saved plans
│   ├── recipes/
│   │   ├── page.tsx             # Recipe list
│   │   ├── new/page.tsx         # Add recipe (with inline ingredient creation)
│   │   ├── [id]/page.tsx        # Edit/delete recipe
│   │   └── ingredients/page.tsx # Manage ingredients (edit/delete)
│   ├── grocery/page.tsx         # Grocery list (grouped by category, checkable)
│   └── api/
│       ├── recipes/route.ts + [id]/route.ts
│       ├── ingredients/route.ts + [id]/route.ts
│       ├── plan/route.ts (save/load) + generate/route.ts + history/route.ts
│       └── grocery/route.ts
├── components/BottomNav.tsx     # Active-tab-aware bottom navigation
└── lib/
    ├── db.ts                    # Supabase client singleton
    ├── scheduler.ts             # Scheduling algorithm
    └── grocery.ts               # Grocery list aggregation
```

---

## 8. Done So Far

- [x] Recipe CRUD (list, add, edit, delete) with ingredients + decimal quantities
- [x] Ingredient management page
- [x] Weekly plan generation with fixed constraints (Monday lentils, Wed lunch=Seb, Fri=Alyssa)
- [x] Dinner simplicity scoring
- [x] 2-meal recipes forced to lunch
- [x] Swap individual slots / mark "eating out"
- [x] Locked slots survive regeneration
- [x] Grocery list aggregation (excludes pantry staples)
- [x] Plan history view
- [x] Auto-load current week's plan
- [x] PWA (manifest, maskable icons, service worker)
- [x] Dark mode compatible
- [x] Deployed to Vercel, installed on phone

---

## 9. Possible Next Steps (discussed but NOT built)

- **Pantry staples UI** — the `pantry_staples` table exists and the grocery generator already excludes them, but there's no UI to mark ingredients as staples.
- **Share grocery list** — copy to clipboard / Web Share API.
- **Rating/feedback after cooking** ("loved it" / "meh" / "never again") to influence scheduling.
- **Calendar integration** — auto-skip nights eating out.
- **Smarter algorithm tuning** based on feedback over time.

---

## 10. User Context / Preferences

- The user (Seb) is the developer. Alyssa is his partner.
- Recipes lean Filipino + Western (Caldereta, Sinigang, Pancit Canton, pasta, steak, etc.), heavy on rice.
- The user is mildly tuning the app around a personal fitness/diet goal (reduce belly, recomp). Relevant nutrition discussion happened but is NOT part of the app — the "cook 2-meal recipes at lunch" constraint was partly motivated by eating the carb-heavy meal earlier in the day.
- Verification: the user validates in the browser. After code changes, run `npx tsc --noEmit` to typecheck. Don't run the dev server (long-running). Commit + push when the user asks.
- Git: commits use conventional commit style. Push to `main` (this is a personal repo; the user explicitly wants pushes here).
