-- Meal Planner Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Ingredients table
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'OTHER',
  unit TEXT NOT NULL DEFAULT 'units',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cooked_by TEXT NOT NULL DEFAULT 'BOTH',
  meals INTEGER NOT NULL DEFAULT 1,
  prep_time INTEGER NOT NULL DEFAULT 30,
  difficulty TEXT NOT NULL DEFAULT 'EASY',
  cost TEXT NOT NULL DEFAULT 'CHEAP',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recipe ingredients (join table)
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  quantity REAL NOT NULL DEFAULT 1,
  UNIQUE(recipe_id, ingredient_id)
);

-- Weekly plans
CREATE TABLE weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plan slots
CREATE TABLE plan_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  meal TEXT NOT NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  cooked_by TEXT NOT NULL DEFAULT 'BOTH',
  UNIQUE(plan_id, day, meal)
);

-- Pantry staples (ingredients you always have)
CREATE TABLE pantry_staples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL UNIQUE REFERENCES ingredients(id)
);

-- Enable Row Level Security (open for now — no auth)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_staples ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth — just you and your partner)
CREATE POLICY "Allow all" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON recipe_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON weekly_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON plan_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON pantry_staples FOR ALL USING (true) WITH CHECK (true);
