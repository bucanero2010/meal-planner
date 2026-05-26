import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { generateWeeklyPlan, SchedulableRecipe } from "@/lib/scheduler";

interface SkipSlot {
  day: number;
  meal: string;
}

interface LockedRecipe {
  day: number;
  meal: string;
  recipeId: string;
}

// POST /api/plan/generate
export async function POST(request: NextRequest) {
  let skipSlots: SkipSlot[] = [];
  let lockedRecipes: LockedRecipe[] = [];

  try {
    const body = await request.json();
    skipSlots = body.skipSlots || [];
    lockedRecipes = body.lockedRecipes || [];
  } catch {
    // No body = fresh generate with no constraints
  }

  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!recipes || recipes.length === 0) {
    return NextResponse.json(
      { error: "No recipes found. Add some recipes first." },
      { status: 400 }
    );
  }

  // Collect recipe IDs that are locked (so the algorithm won't reuse them)
  const lockedRecipeIds = new Set(lockedRecipes.map((l) => l.recipeId));

  // Build the set of slots to skip (eating out + locked recipe slots)
  const slotsToSkip = new Set<string>();
  for (const s of skipSlots) {
    slotsToSkip.add(`${s.day}-${s.meal}`);
  }
  for (const l of lockedRecipes) {
    slotsToSkip.add(`${l.day}-${l.meal}`);
  }

  const schedulable: SchedulableRecipe[] = recipes
    .filter((r) => !lockedRecipeIds.has(r.id)) // don't reuse locked recipes
    .map((r) => ({
      id: r.id,
      name: r.name,
      cookedBy: r.cooked_by,
      meals: r.meals,
      prepTime: r.prep_time,
      difficulty: r.difficulty,
      cost: r.cost,
      tags: r.tags || [],
    }));

  const plan = generateWeeklyPlan(schedulable, slotsToSkip);

  return NextResponse.json({ slots: plan });
}
