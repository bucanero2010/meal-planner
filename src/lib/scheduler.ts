/**
 * Weekly Meal Scheduler
 *
 * Fills 14 slots (7 days × 2 meals) with recipes from the pool.
 *
 * Rules:
 * - A recipe appears at most once per week (one cooking event).
 * - A "2-meal" recipe covers 2 consecutive slots (same day lunch+dinner,
 *   or dinner + next day's lunch).
 * - Balance who cooks across the week.
 * - Balance cost and difficulty across the week.
 * - Prefer ingredient variety (avoid stacking same tags).
 * - Respect time: prefer quick recipes on weekdays, allow longer on weekends.
 */

import { CookedBy, Cost, Difficulty } from "@prisma/client";

export interface SchedulableRecipe {
  id: string;
  name: string;
  cookedBy: CookedBy;
  meals: number; // 1 or 2
  prepTime: number;
  difficulty: Difficulty;
  cost: Cost;
  tags: string[];
}

export interface PlannedSlot {
  day: number; // 0=Monday, 6=Sunday
  meal: "LUNCH" | "DINNER";
  recipeId: string;
  recipeName: string;
  cookedBy: CookedBy;
}

interface SlotPosition {
  day: number;
  meal: "LUNCH" | "DINNER";
}

const ALL_SLOTS: SlotPosition[] = [];
for (let day = 0; day < 7; day++) {
  ALL_SLOTS.push({ day, meal: "LUNCH" });
  ALL_SLOTS.push({ day, meal: "DINNER" });
}

const WEEKEND_DAYS = [5, 6]; // Saturday, Sunday

const COST_SCORE: Record<Cost, number> = {
  CHEAP: 1,
  MODERATE: 2,
  EXPENSIVE: 3,
};

const DIFFICULTY_SCORE: Record<Difficulty, number> = {
  EASY: 1,
  MEDIUM: 2,
  INVOLVED: 3,
};

/**
 * Generate a weekly meal plan.
 */
export function generateWeeklyPlan(
  recipes: SchedulableRecipe[]
): PlannedSlot[] {
  if (recipes.length === 0) return [];

  const plan: (PlannedSlot | null)[] = new Array(14).fill(null);
  const usedRecipeIds = new Set<string>();
  let meCookCount = 0;
  let partnerCookCount = 0;
  const usedTags = new Map<string, number>();
  let totalCost = 0;

  // Shuffle recipes for variety between runs
  const shuffled = [...recipes].sort(() => Math.random() - 0.5);

  for (let slotIdx = 0; slotIdx < 14; slotIdx++) {
    if (plan[slotIdx] !== null) continue; // already filled by a 2-meal recipe

    const slot = ALL_SLOTS[slotIdx];
    const isWeekend = WEEKEND_DAYS.includes(slot.day);

    // Score each candidate recipe for this slot
    const candidates = shuffled
      .filter((r) => !usedRecipeIds.has(r.id))
      .filter((r) => {
        // If it's a 2-meal recipe, check that the next slot is available
        if (r.meals === 2) {
          if (slotIdx + 1 >= 14) return false;
          if (plan[slotIdx + 1] !== null) return false;
        }
        return true;
      })
      .map((r) => ({ recipe: r, score: scoreRecipe(r, slot, isWeekend, meCookCount, partnerCookCount, usedTags, totalCost) }))
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) break; // not enough recipes to fill the week

    const chosen = candidates[0].recipe;
    usedRecipeIds.add(chosen.id);

    // Determine who cooks
    const cookedBy = assignCook(chosen.cookedBy, meCookCount, partnerCookCount);

    // Place the recipe
    plan[slotIdx] = {
      day: slot.day,
      meal: slot.meal,
      recipeId: chosen.id,
      recipeName: chosen.name,
      cookedBy,
    };

    // If 2-meal, fill next slot too
    if (chosen.meals === 2 && slotIdx + 1 < 14) {
      const nextSlot = ALL_SLOTS[slotIdx + 1];
      plan[slotIdx + 1] = {
        day: nextSlot.day,
        meal: nextSlot.meal,
        recipeId: chosen.id,
        recipeName: chosen.name,
        cookedBy,
      };
    }

    // Update counters
    if (cookedBy === "ME") meCookCount++;
    else if (cookedBy === "PARTNER") partnerCookCount++;
    else {
      meCookCount += 0.5;
      partnerCookCount += 0.5;
    }

    for (const tag of chosen.tags) {
      usedTags.set(tag, (usedTags.get(tag) || 0) + 1);
    }
    totalCost += COST_SCORE[chosen.cost];
  }

  return plan.filter((s): s is PlannedSlot => s !== null);
}

function scoreRecipe(
  recipe: SchedulableRecipe,
  slot: SlotPosition,
  isWeekend: boolean,
  meCookCount: number,
  partnerCookCount: number,
  usedTags: Map<string, number>,
  totalCost: number
): number {
  let score = 0;

  // Time fit: prefer quick on weekdays, allow longer on weekends
  if (!isWeekend && recipe.prepTime <= 30) score += 3;
  if (!isWeekend && recipe.prepTime <= 45) score += 1;
  if (isWeekend && recipe.prepTime > 45) score += 2; // use weekends for longer recipes
  if (isWeekend) score += 1; // any recipe is fine on weekends

  // Cook balance: prefer recipes that help balance the split
  if (recipe.cookedBy === "ME" && meCookCount <= partnerCookCount) score += 2;
  if (recipe.cookedBy === "PARTNER" && partnerCookCount <= meCookCount) score += 2;
  if (recipe.cookedBy === "BOTH") score += 1; // neutral

  // Tag diversity: penalize if tags already heavily used
  for (const tag of recipe.tags) {
    const count = usedTags.get(tag) || 0;
    score -= count * 2;
  }

  // Cost balance: if we've been spending a lot, prefer cheap
  const avgCost = totalCost / Math.max(1, usedTags.size);
  if (avgCost > 2 && recipe.cost === "CHEAP") score += 2;
  if (avgCost < 1.5 && recipe.cost === "EXPENSIVE") score += 1;

  // 2-meal recipes are efficient — slight bonus
  if (recipe.meals === 2) score += 1;

  return score;
}

function assignCook(
  canCook: CookedBy,
  meCookCount: number,
  partnerCookCount: number
): CookedBy {
  if (canCook === "ME") return "ME";
  if (canCook === "PARTNER") return "PARTNER";
  // BOTH — assign to whoever has cooked less
  if (meCookCount <= partnerCookCount) return "ME";
  return "PARTNER";
}
