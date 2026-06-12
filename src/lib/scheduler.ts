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
 *
 * Fixed constraints:
 * - Monday: always lentils (both lunch and dinner)
 * - Wednesday lunch: Seb cooks
 * - Friday (both meals): Alyssa cooks
 */

export type CookedBy = "ME" | "PARTNER" | "BOTH";
export type Difficulty = "EASY" | "MEDIUM" | "INVOLVED";
export type Cost = "CHEAP" | "MODERATE" | "EXPENSIVE";

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

// Day indices: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
const MONDAY = 0;
const WEDNESDAY = 2;
const FRIDAY = 4;

/**
 * Generate a weekly meal plan.
 * @param slotsToSkip - Set of "day-meal" keys to leave empty (e.g. "4-DINNER")
 */
export function generateWeeklyPlan(
  recipes: SchedulableRecipe[],
  slotsToSkip: Set<string> = new Set()
): PlannedSlot[] {
  if (recipes.length === 0) return [];

  const plan: (PlannedSlot | null)[] = new Array(14).fill(null);
  const usedRecipeIds = new Set<string>();
  let meCookCount = 0;
  let partnerCookCount = 0;
  const usedTags = new Map<string, number>();
  let totalCost = 0;

  // --- Apply fixed constraints first ---

  // Monday: lentils (find a recipe with "lentils" or "lentejas" in name or tags)
  const lentilRecipe = recipes.find(
    (r) =>
      r.name.toLowerCase().includes("lentil") ||
      r.name.toLowerCase().includes("lenteja") ||
      r.tags.some((t) => t.toLowerCase().includes("lentil") || t.toLowerCase().includes("lenteja"))
  );

  if (lentilRecipe) {
    const monLunchSkipped = slotsToSkip.has(`${MONDAY}-LUNCH`);
    const monDinnerSkipped = slotsToSkip.has(`${MONDAY}-DINNER`);

    if (!monLunchSkipped) {
      plan[0] = {
        day: MONDAY,
        meal: "LUNCH",
        recipeId: lentilRecipe.id,
        recipeName: lentilRecipe.name,
        cookedBy: assignCook(lentilRecipe.cookedBy, meCookCount, partnerCookCount),
      };
    }
    if (!monDinnerSkipped) {
      plan[1] = {
        day: MONDAY,
        meal: "DINNER",
        recipeId: lentilRecipe.id,
        recipeName: lentilRecipe.name,
        cookedBy: plan[0]?.cookedBy || assignCook(lentilRecipe.cookedBy, meCookCount, partnerCookCount),
      };
    }

    if (!monLunchSkipped || !monDinnerSkipped) {
      usedRecipeIds.add(lentilRecipe.id);
      const cook = plan[0]?.cookedBy || plan[1]?.cookedBy;
      if (cook === "ME") meCookCount++;
      else if (cook === "PARTNER") partnerCookCount++;
      else { meCookCount += 0.5; partnerCookCount += 0.5; }
      for (const tag of lentilRecipe.tags) {
        usedTags.set(tag, (usedTags.get(tag) || 0) + 1);
      }
      totalCost += COST_SCORE[lentilRecipe.cost];
    }
  }

  // --- Fill remaining slots ---

  // Shuffle recipes for variety between runs
  const shuffled = [...recipes].sort(() => Math.random() - 0.5);

  for (let slotIdx = 0; slotIdx < 14; slotIdx++) {
    if (plan[slotIdx] !== null) continue; // already filled

    const slot = ALL_SLOTS[slotIdx];

    // Skip slots marked as eating out or locked
    if (slotsToSkip.has(`${slot.day}-${slot.meal}`)) continue;

    const isWeekend = WEEKEND_DAYS.includes(slot.day);

    // Determine cook constraint for this slot
    const cookConstraint = getSlotCookConstraint(slot.day, slot.meal);

    // Score each candidate recipe for this slot
    const candidates = shuffled
      .filter((r) => !usedRecipeIds.has(r.id))
      .filter((r) => {
        // If it's a 2-meal recipe, check that the next slot is available
        if (r.meals === 2) {
          if (slotIdx + 1 >= 14) return false;
          if (plan[slotIdx + 1] !== null) return false;
          // 2-meal recipes must be cooked at LUNCH (leftovers for same-day dinner).
          // Lunch slots are even indices (0, 2, 4, ...), dinner slots are odd.
          if (slot.meal !== "LUNCH") return false;
        }
        return true;
      })
      .filter((r) => {
        // Respect cook constraint: recipe must be cookable by the required person
        if (!cookConstraint) return true;
        return r.cookedBy === cookConstraint || r.cookedBy === "BOTH";
      })
      .map((r) => ({
        recipe: r,
        score: scoreRecipe(r, isWeekend, slot.meal === "DINNER", meCookCount, partnerCookCount, usedTags, totalCost),
      }))
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) break; // not enough recipes to fill the week

    const chosen = candidates[0].recipe;
    usedRecipeIds.add(chosen.id);

    // Determine who cooks (respect constraint)
    const cookedBy = cookConstraint || assignCook(chosen.cookedBy, meCookCount, partnerCookCount);

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

/**
 * Returns a forced cook assignment for specific slots, or null if no constraint.
 */
function getSlotCookConstraint(day: number, meal: string): CookedBy | null {
  // Wednesday lunch: Seb cooks
  if (day === WEDNESDAY && meal === "LUNCH") return "ME";

  // Friday: Alyssa cooks (both meals)
  if (day === FRIDAY) return "PARTNER";

  return null;
}

function scoreRecipe(
  recipe: SchedulableRecipe,
  isWeekend: boolean,
  isDinner: boolean,
  meCookCount: number,
  partnerCookCount: number,
  usedTags: Map<string, number>,
  totalCost: number
): number {
  let score = 0;

  // Time fit: most recipes are 30-45 min which is normal.
  // Only penalize truly long recipes (>45 min) on weekday lunches.
  // On weekends, longer recipes are welcome.
  if (!isWeekend && recipe.prepTime <= 15) score += 2; // very quick (e.g. frozen lasagna)
  if (isWeekend && recipe.prepTime >= 45) score += 2; // use weekends for longer recipes
  if (isWeekend) score += 1;

  // Dinner simplicity: prefer easy/quick recipes at dinner.
  // The idea: you don't want to start something complex at night.
  // 2-meal recipes at dinner are great (cook once, leftover for next lunch).
  if (isDinner) {
    if (recipe.difficulty === "EASY") score += 3;
    if (recipe.difficulty === "MEDIUM") score += 0; // neutral — most of your recipes
    if (recipe.difficulty === "INVOLVED") score -= 4;
    if (recipe.prepTime <= 15) score += 2;
    if (recipe.prepTime >= 60) score -= 2;
    // 2-meal recipes at dinner = cook now, leftover for tomorrow's lunch
    if (recipe.meals === 2) score += 2;
  }

  // Cook balance: prefer recipes that help balance the split
  if (recipe.cookedBy === "ME" && meCookCount <= partnerCookCount) score += 2;
  if (recipe.cookedBy === "PARTNER" && partnerCookCount <= meCookCount) score += 2;
  if (recipe.cookedBy === "BOTH") score += 1;

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
