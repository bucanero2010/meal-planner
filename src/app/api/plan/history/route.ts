import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// GET /api/plan/history — list all saved plans
export async function GET() {
  const { data, error } = await supabase
    .from("weekly_plans")
    .select(`
      id,
      week_start,
      created_at,
      plan_slots (
        day, meal, cooked_by,
        recipes (name)
      )
    `)
    .order("week_start", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
