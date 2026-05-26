import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// GET /api/recipes
export async function GET() {
  const { data, error } = await supabase
    .from("recipes")
    .select(`
      *,
      recipe_ingredients (
        id,
        quantity,
        ingredient_id,
        ingredients (id, name, category, unit)
      )
    `)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/recipes
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Create recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      name: body.name,
      cooked_by: body.cookedBy,
      meals: body.meals ?? 1,
      prep_time: body.prepTime,
      difficulty: body.difficulty,
      cost: body.cost,
      tags: body.tags ?? [],
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (recipeError) return NextResponse.json({ error: recipeError.message }, { status: 500 });

  // Add ingredients if provided
  if (body.ingredients && body.ingredients.length > 0) {
    const recipeIngredients = body.ingredients.map(
      (ing: { ingredientId: string; quantity: number }) => ({
        recipe_id: recipe.id,
        ingredient_id: ing.ingredientId,
        quantity: ing.quantity,
      })
    );

    const { error: ingError } = await supabase
      .from("recipe_ingredients")
      .insert(recipeIngredients);

    if (ingError) return NextResponse.json({ error: ingError.message }, { status: 500 });
  }

  return NextResponse.json(recipe, { status: 201 });
}
