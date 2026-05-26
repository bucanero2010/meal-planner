import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// GET /api/recipes/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PUT /api/recipes/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Update recipe
  const { error: recipeError } = await supabase
    .from("recipes")
    .update({
      name: body.name,
      cooked_by: body.cookedBy,
      meals: body.meals,
      prep_time: body.prepTime,
      difficulty: body.difficulty,
      cost: body.cost,
      tags: body.tags ?? [],
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (recipeError) return NextResponse.json({ error: recipeError.message }, { status: 500 });

  // Replace ingredients
  await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);

  if (body.ingredients && body.ingredients.length > 0) {
    const recipeIngredients = body.ingredients.map(
      (ing: { ingredientId: string; quantity: number }) => ({
        recipe_id: id,
        ingredient_id: ing.ingredientId,
        quantity: ing.quantity,
      })
    );

    await supabase.from("recipe_ingredients").insert(recipeIngredients);
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/recipes/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from("recipes").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
