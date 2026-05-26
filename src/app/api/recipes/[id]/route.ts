import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/recipes/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { include: { ingredient: true } },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(recipe);
}

// PUT /api/recipes/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Delete existing ingredients and recreate
  await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      name: body.name,
      cookedBy: body.cookedBy,
      meals: body.meals,
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

  return NextResponse.json(recipe);
}

// DELETE /api/recipes/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
