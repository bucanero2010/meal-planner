"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Recipe {
  id: string;
  name: string;
  cookedBy: string;
  meals: number;
  prepTime: number;
  difficulty: string;
  cost: string;
  tags: string[];
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then(setRecipes);
  }, []);

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recipes</h2>
        <Link
          href="/recipes/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Recipe
        </Link>
      </div>

      {recipes.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No recipes yet. Add your first one!
        </p>
      )}

      <div className="space-y-2">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="block bg-white rounded-lg shadow-sm p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{recipe.name}</h3>
                <div className="text-xs text-gray-500 mt-0.5 flex gap-2">
                  <span>{recipe.prepTime} min</span>
                  <span>•</span>
                  <span>{recipe.meals === 2 ? "2 meals" : "1 meal"}</span>
                  <span>•</span>
                  <span>{recipe.difficulty.toLowerCase()}</span>
                </div>
              </div>
              <div className="text-sm">
                {recipe.cookedBy === "ME"
                  ? "👨‍🍳"
                  : recipe.cookedBy === "PARTNER"
                  ? "👩‍🍳"
                  : "👫"}
              </div>
            </div>
            {recipe.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
