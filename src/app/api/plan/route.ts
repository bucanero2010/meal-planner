import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// GET /api/plan?week=2026-05-25
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get("week");

  if (!weekParam) {
    return NextResponse.json(
      { error: "week parameter required (YYYY-MM-DD of Monday)" },
      { status: 400 }
    );
  }

  const { data: plan, error } = await supabase
    .from("weekly_plans")
    .select(`
      *,
      plan_slots (
        id, day, meal, cooked_by, recipe_id,
        recipes (id, name, cooked_by, meals, prep_time, difficulty, cost, tags)
      )
    `)
    .eq("week_start", weekParam)
    .single();

  if (error) return NextResponse.json({ plan: null });
  return NextResponse.json({ plan });
}

// POST /api/plan
export async function POST(request: NextRequest) {
  const body = await request.json();
  const weekStart = body.weekStart;

  // Delete existing plan for this week
  const { data: existing } = await supabase
    .from("weekly_plans")
    .select("id")
    .eq("week_start", weekStart)
    .single();

  if (existing) {
    await supabase.from("plan_slots").delete().eq("plan_id", existing.id);
    await supabase.from("weekly_plans").delete().eq("id", existing.id);
  }

  // Create new plan
  const { data: plan, error: planError } = await supabase
    .from("weekly_plans")
    .insert({ week_start: weekStart })
    .select()
    .single();

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 });

  // Insert slots
  const slots = body.slots.map(
    (slot: { day: number; meal: string; recipeId: string; cookedBy: string }) => ({
      plan_id: plan.id,
      day: slot.day,
      meal: slot.meal,
      recipe_id: slot.recipeId,
      cooked_by: slot.cookedBy,
    })
  );

  const { error: slotsError } = await supabase.from("plan_slots").insert(slots);

  if (slotsError) return NextResponse.json({ error: slotsError.message }, { status: 500 });

  return NextResponse.json({ plan }, { status: 201 });
}
