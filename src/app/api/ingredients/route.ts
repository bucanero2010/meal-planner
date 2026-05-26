import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/ingredients — list all ingredients
export async function GET() {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(ingredients);
}

// POST /api/ingredients — create an ingredient
export async function POST(request: NextRequest) {
  const body = await request.json();

  const ingredient = await prisma.ingredient.create({
    data: {
      name: body.name,
      category: body.category,
      unit: body.unit,
    },
  });

  return NextResponse.json(ingredient, { status: 201 });
}
