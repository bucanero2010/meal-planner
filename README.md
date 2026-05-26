# 🍳 Meal Planner

Weekly meal planning app for two people. Manages recipes, generates balanced weekly plans, and creates grocery lists.

## Features

- **Recipe management** — add recipes with who cooks, prep time, cost, difficulty, tags, ingredients
- **Auto-scheduling** — generates a 14-slot weekly plan (lunch + dinner × 7 days) balancing cook assignments, cost, time, and variety
- **Grocery list** — aggregates ingredients from the plan, grouped by category, with pantry staple exclusion
- **PWA** — installable on phones, works like a native app

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL
- next-pwa for installability
- Deployed on Vercel

## Getting Started

### 1. Database Setup

You need a PostgreSQL database. Options:

- **Vercel Postgres** (recommended for deployment): create one in your Vercel dashboard
- **Supabase** (free tier): create a project at supabase.com
- **Local**: `createdb mealplanner`

### 2. Environment

Copy `.env` and set your database URL:

```bash
DATABASE_URL="postgresql://user:password@host:5432/mealplanner"
```

### 3. Install & Migrate

```bash
npm install
npx prisma migrate dev --name init
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

### 5. Deploy to Vercel

```bash
npx vercel
```

Add your `DATABASE_URL` as an environment variable in Vercel's dashboard.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Weekly plan view (home)
│   ├── recipes/
│   │   ├── page.tsx          # Recipe list
│   │   └── new/page.tsx      # Add recipe form
│   ├── grocery/page.tsx      # Grocery list
│   └── api/
│       ├── recipes/          # CRUD
│       ├── ingredients/      # CRUD
│       ├── plan/             # Save/load plans
│       │   └── generate/     # Auto-schedule
│       └── grocery/          # Generate grocery list
├── lib/
│   ├── db.ts                 # Prisma client singleton
│   ├── scheduler.ts          # Scheduling algorithm
│   └── grocery.ts            # Grocery list aggregation
└── types/
    └── next-pwa.d.ts
prisma/
└── schema.prisma             # Data model
```

## Scheduling Algorithm

The scheduler:
1. Shuffles the recipe pool for variety between runs
2. Fills 14 slots sequentially (Mon lunch → Sun dinner)
3. Each recipe can only be placed once per week (one cooking event)
4. 2-meal recipes cover 2 consecutive slots
5. Scores candidates per slot based on: time fit (quick on weekdays), cook balance, tag diversity, cost balance
6. Picks the highest-scoring candidate for each slot

## Next Steps (v2)

- [ ] Ingredient management UI (currently API-only)
- [ ] Edit/delete recipes from the UI
- [ ] Swap individual slots in the generated plan
- [ ] Pantry staples configuration
- [ ] Share grocery list (copy to clipboard / share API)
- [ ] History view of past weeks
