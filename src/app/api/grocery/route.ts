import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { generateGroceryList } from "@/lib/grocery";

// GET /api/grocery?week=2026-05-25
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get("week");

  if (!weekParam) {
    return NextResponse.json(
      { error: "week parameter required (YYYY-MM-DD of Monday)" },
      { status: 400 }
    );
  }

  // Get the plan
  const { data: plan, error: planError } = await supabase
    .from("weekly_plans")
    .select("id")
    .eq("week_start", weekParam)
    .single();

  if (planError || !plan) {
    return NextResponse.json(
      { error: "No plan found for this week" },
      { status: 404 }
    );
  }

  // Get plan slots with recipe IDs
  const { data: slots } = await supabase
    .from("plan_slots")
    .select("recipe_id")
    .eq("plan_id", plan.id);

  if (!slots || slots.length === 0) {
    return NextResponse.json({ items: [], byCategory: {} });
  }

  // Get unique recipe IDs
  const recipeIds = [...new Set(slots.map((s) => s.recipe_id))];

  // Get recipe ingredients
  const { data: recipeIngredients } = await supabase
    .from("recipe_ingredients")
    .select(`
      quantity,
      ingredient_id,
      ingredients (id, name, category, unit)
    `)
    .in("recipe_id", recipeIds);

  if (!recipeIngredients) {
    return NextResponse.json({ items: [], byCategory: {} });
  }

  // Get pantry staples
  const { data: staples } = await supabase
    .from("pantry_staples")
    .select("ingredient_id");

  const stapleIds = new Set((staples || []).map((s) => s.ingredient_id));

  const allIngredients = recipeIngredients.map((ri: any) => ({
    ingredientId: ri.ingredient_id,
    ingredientName: ri.ingredients.name,
    category: ri.ingredients.category,
    quantity: ri.quantity,
    unit: ri.ingredients.unit,
  }));

  const groceryList = generateGroceryList(allIngredients, stapleIds);

  return NextResponse.json(groceryList);
}
