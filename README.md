# 🍳 Meal Planner

Weekly meal planning app for two. Manages recipes, generates balanced weekly plans, and creates grocery lists.

## Features

- **Recipe management** — add/edit/delete recipes with who cooks (Seb, Alyssa, Both), prep time, cost, difficulty, tags, and ingredients
- **Ingredient management** — create, edit, and reuse ingredients across recipes
- **Auto-scheduling** — generates a 14-slot weekly plan (lunch + dinner × 7 days) balancing cook assignments, cost, time, and variety
- **Slot swapping** — tap any slot to pick a different recipe or mark as "eating out"
- **Locked slots** — manual changes survive regeneration (🔒 icon, tap to unlock)
- **Grocery list** — aggregates ingredients from the plan, grouped by category
- **Plan history** — view past saved weekly plans
- **PWA** — installable on Android/iOS, works like a native app

## Scheduling Constraints

- **Monday**: always lentils (lunch + dinner)
- **Wednesday lunch**: Seb cooks
- **Friday** (both meals): Alyssa cooks
- **Dinners**: prefer easy/quick recipes or 2-meal leftovers (complex cooking pushed to lunch/weekends)
- **No same recipe twice** in a week (except 2-meal recipes covering 2 consecutive slots)
- **Balance**: cook assignments, cost, ingredient variety (tag diversity)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + JS client)
- next-pwa for installability
- Deployed on Vercel

## Getting Started

### 1. Clone

```bash
git clone https://github.com/bucanero2010/meal-planner.git
cd meal-planner
npm install
```

### 2. Supabase Setup

Create a project at [supabase.com](https://supabase.com), then:

1. Go to **SQL Editor** → paste and run `supabase-schema.sql`
2. Go to **Connect** → copy your URL and publishable key

### 3. Environment

Create `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

### 5. Deploy to Vercel

1. Import the repo at [vercel.com](https://vercel.com)
2. Add the two env vars above
3. Deploy

### 6. Install on Phone

- **Android**: Open the Vercel URL in Chrome → three dots → "Install app"
- **iPhone**: Open in Safari → Share → "Add to Home Screen"

## Project Structure

```
src/
├── app/
│   ├── page.tsx                # Weekly plan (home)
│   ├── plan/history/page.tsx   # Past plans
│   ├── recipes/
│   │   ├── page.tsx            # Recipe list
│   │   ├── new/page.tsx        # Add recipe
│   │   ├── [id]/page.tsx       # Edit recipe
│   │   └── ingredients/page.tsx # Manage ingredients
│   ├── grocery/page.tsx        # Grocery list
│   └── api/
│       ├── recipes/            # CRUD
│       ├── ingredients/        # CRUD
│       ├── plan/               # Save/load/generate/history
│       └── grocery/            # Generate grocery list
├── components/
│   └── BottomNav.tsx           # Active-tab-aware navigation
└── lib/
    ├── db.ts                   # Supabase client
    ├── scheduler.ts            # Scheduling algorithm
    └── grocery.ts              # Grocery list aggregation
```

## Scheduling Algorithm

1. Apply fixed constraints (Monday lentils, cook assignments)
2. Walk 14 slots sequentially, skipping locked/eating-out slots
3. For each empty slot, score all unused recipes based on:
   - Dinner simplicity (easy/quick preferred at night)
   - Weekend allowance (longer recipes OK on Sat/Sun)
   - Cook balance (equalize Seb vs Alyssa cooking days)
   - Tag diversity (avoid repeating same cuisine/protein)
   - Cost balance (mix cheap and moderate)
   - 2-meal efficiency bonus
4. Pick highest-scoring recipe, mark as used
5. Shuffle recipe pool each run for variety
