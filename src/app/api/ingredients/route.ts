import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// GET /api/ingredients
export async function GET() {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/ingredients
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("ingredients")
    .insert({ name: body.name, category: body.category, unit: body.unit })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
