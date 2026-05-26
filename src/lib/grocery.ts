/**
 * Grocery List Generator
 *
 * Aggregates ingredients from a weekly plan, combines duplicates,
 * groups by category, and excludes pantry staples.
 */

import { IngredientCategory } from "@prisma/client";

export interface GroceryItem {
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
}

export interface GroceryList {
  items: GroceryItem[];
  byCategory: Record<string, GroceryItem[]>;
}

interface RecipeIngredientInput {
  ingredientId: string;
  ingredientName: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
}

/**
 * Generate a grocery list from planned recipes.
 * Combines duplicate ingredients and excludes pantry staples.
 */
export function generateGroceryList(
  recipeIngredients: RecipeIngredientInput[],
  pantryStapleIds: Set<string>
): GroceryList {
  // Aggregate quantities by ingredient
  const aggregated = new Map<string, GroceryItem>();

  for (const ri of recipeIngredients) {
    if (pantryStapleIds.has(ri.ingredientId)) continue;

    const existing = aggregated.get(ri.ingredientId);
    if (existing) {
      existing.quantity += ri.quantity;
    } else {
      aggregated.set(ri.ingredientId, {
        ingredientId: ri.ingredientId,
        name: ri.ingredientName,
        category: ri.category,
        quantity: ri.quantity,
        unit: ri.unit,
      });
    }
  }

  const items = Array.from(aggregated.values()).sort((a, b) =>
    a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );

  // Group by category
  const byCategory: Record<string, GroceryItem[]> = {};
  for (const item of items) {
    const cat = item.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }

  return { items, byCategory };
}
