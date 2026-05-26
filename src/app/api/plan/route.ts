import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/plan?week=2026-05-25 — get plan for a specific week
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get("week");

  if (!weekParam) {
    return NextResponse.json(
      { error: "week parameter required (YYYY-MM-DD of Monday)" },
      { status: 400 }
    );
  }

  const weekStart = new Date(weekParam);

  const plan = await prisma.weeklyPlan.findUnique({
    where: { weekStart },
    include: {
      slots: {
        include: { recipe: true },
        orderBy: [{ day: "asc" }, { meal: "asc" }],
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ plan: null });
  }

  return NextResponse.json({ plan });
}

// POST /api/plan — save a weekly plan
export async function POST(request: NextRequest) {
  const body = await request.json();
  const weekStart = new Date(body.weekStart);

  // Upsert: delete existing plan for this week, create new one
  await prisma.weeklyPlan.deleteMany({ where: { weekStart } });

  const plan = await prisma.weeklyPlan.create({
    data: {
      weekStart,
      slots: {
        create: body.slots.map(
          (slot: {
            day: number;
            meal: string;
            recipeId: string;
            cookedBy: string;
          }) => ({
            day: slot.day,
            meal: slot.meal,
            recipeId: slot.recipeId,
            cookedBy: slot.cookedBy,
          })
        ),
      },
    },
    include: {
      slots: {
        include: { recipe: true },
        orderBy: [{ day: "asc" }, { meal: "asc" }],
      },
    },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
