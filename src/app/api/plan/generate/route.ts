import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateWeeklyPlan, SchedulableRecipe } from "@/lib/scheduler";

// POST /api/plan/generate — generate a new weekly plan suggestion
export async function POST() {
  const recipes = await prisma.recipe.findMany();

  if (recipes.length === 0) {
    return NextResponse.json(
      { error: "No recipes found. Add some recipes first." },
      { status: 400 }
    );
  }

  const schedulable: SchedulableRecipe[] = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    cookedBy: r.cookedBy,
    meals: r.meals,
    prepTime: r.prepTime,
    difficulty: r.difficulty,
    cost: r.cost,
    tags: r.tags,
  }));

  const plan = generateWeeklyPlan(schedulable);

  return NextResponse.json({ slots: plan });
}
