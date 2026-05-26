import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateGroceryList } from "@/lib/grocery";

// GET /api/grocery?week=2026-05-25 — generate grocery list for a week's plan
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get("week");

  if (!weekParam) {
    return NextResponse.json(
      { error: "week parameter required (YYYY-MM-DD of Monday)" },
      { status: 400 }
    );
  }

  const weekStart = new Date(weekParam);

  const plan = await prisma.weeklyPlan.findUnique({
    where: { weekStart },
    include: {
      slots: {
        include: {
          recipe: {
            include: {
              ingredients: {
                include: { ingredient: true },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return NextResponse.json(
      { error: "No plan found for this week" },
      { status: 404 }
    );
  }

  // Get pantry staples
  const staples = await prisma.pantryStaple.findMany();
  const stapleIds = new Set(staples.map((s) => s.ingredientId));

  // Collect all recipe ingredients from the plan (deduplicate by recipe)
  const seenRecipes = new Set<string>();
  const allIngredients = [];

  for (const slot of plan.slots) {
    if (seenRecipes.has(slot.recipeId)) continue;
    seenRecipes.add(slot.recipeId);

    for (const ri of slot.recipe.ingredients) {
      allIngredients.push({
        ingredientId: ri.ingredientId,
        ingredientName: ri.ingredient.name,
        category: ri.ingredient.category,
        quantity: ri.quantity,
        unit: ri.ingredient.unit,
      });
    }
  }

  const groceryList = generateGroceryList(allIngredients, stapleIds);

  return NextResponse.json(groceryList);
}
