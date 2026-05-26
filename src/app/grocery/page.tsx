"use client";

import { useEffect, useState } from "react";

interface GroceryItem {
  ingredientId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
}

interface GroceryList {
  items: GroceryItem[];
  byCategory: Record<string, GroceryItem[]>;
}

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCE: "🥬 Produce",
  DAIRY: "🧀 Dairy",
  PROTEIN: "🥩 Protein",
  GRAINS: "🌾 Grains",
  PANTRY: "🥫 Pantry",
  FROZEN: "🧊 Frozen",
  SPICES: "🧂 Spices",
  OTHER: "📦 Other",
};

export default function GroceryPage() {
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get current Monday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const weekStart = monday.toISOString().split("T")[0];

    fetch(`/api/grocery?week=${weekStart}`)
      .then((r) => {
        if (!r.ok) throw new Error("No plan for this week");
        return r.json();
      })
      .then(setGroceryList)
      .catch((e) => setError(e.message));
  }, []);

  function toggleItem(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (error) {
    return (
      <div className="pb-20">
        <h2 className="text-xl font-bold mb-4">Grocery List</h2>
        <p className="text-gray-500 text-center py-8">
          Save a weekly plan first to see your grocery list.
        </p>
      </div>
    );
  }

  if (!groceryList) {
    return (
      <div className="pb-20">
        <h2 className="text-xl font-bold mb-4">Grocery List</h2>
        <p className="text-gray-500 text-center py-8">Loading...</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <h2 className="text-xl font-bold mb-4">Grocery List</h2>

      {groceryList.items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No ingredients needed (or all are pantry staples).
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groceryList.byCategory).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                {CATEGORY_LABELS[category] || category}
              </h3>
              <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
                {items.map((item) => (
                  <label
                    key={item.ingredientId}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(item.ingredientId)}
                      onChange={() => toggleItem(item.ingredientId)}
                      className="rounded text-green-600"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        checked.has(item.ingredientId)
                          ? "line-through text-gray-400"
                          : ""
                      }`}
                    >
                      {item.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.quantity} {item.unit}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
