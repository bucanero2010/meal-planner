import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/recipes — list all recipes
export async function GET() {
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(recipes);
}

// POST /api/recipes — create a recipe
export async function POST(request: NextRequest) {
  const body = await request.json();

  const recipe = await prisma.recipe.create({
    data: {
      name: body.name,
      cookedBy: body.cookedBy,
      meals: body.meals ?? 1,
      prepTime: body.prepTime,
      difficulty: body.difficulty,
      cost: body.cost,
      tags: body.tags ?? [],
      notes: body.notes ?? null,
      ingredients: {
        create: (body.ingredients ?? []).map(
          (ing: { ingredientId: string; quantity: number }) => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
          })
        ),
      },
    },
    include: {
      ingredients: { include: { ingredient: true } },
    },
  });

  return NextResponse.json(recipe, { status: 201 });
}
