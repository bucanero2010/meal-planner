import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// PUT /api/ingredients/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { error } = await supabase
    .from("ingredients")
    .update({ name: body.name, category: body.category, unit: body.unit })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/ingredients/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Remove from recipe_ingredients first
  await supabase.from("recipe_ingredients").delete().eq("ingredient_id", id);

  const { error } = await supabase.from("ingredients").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
