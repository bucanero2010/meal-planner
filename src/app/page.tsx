"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PlanSlot {
  day: number;
  meal: "LUNCH" | "DINNER";
  recipeId: string | null; // null = eating out
  recipeName: string | null;
  cookedBy: "ME" | "PARTNER" | "BOTH" | null;
}

interface LockedSlot {
  day: number;
  meal: "LUNCH" | "DINNER";
  type: "eating_out" | "recipe";
  recipeId?: string;
  recipeName?: string;
  cookedBy?: string;
}

interface Recipe {
  id: string;
  name: string;
  cooked_by: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PlanPage() {
  const [slots, setSlots] = useState<PlanSlot[]>([]);
  const [lockedSlots, setLockedSlots] = useState<LockedSlot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [swapping, setSwapping] = useState<{ day: number; meal: "LUNCH" | "DINNER" } | null>(null);

  useEffect(() => {
    fetch("/api/recipes").then((r) => r.json()).then(setRecipes);
    loadCurrentPlan();
  }, []);

  async function loadCurrentPlan() {
    const monday = getCurrentMonday();
    const res = await fetch(`/api/plan?week=${monday}`);
    const data = await res.json();
    if (data.plan && data.plan.plan_slots) {
      const loaded: PlanSlot[] = data.plan.plan_slots.map((s: any) => ({
        day: s.day,
        meal: s.meal,
        recipeId: s.recipe_id,
        recipeName: s.recipes?.name || null,
        cookedBy: s.cooked_by,
      }));
      setSlots(loaded);
      setGenerated(true);
    }
  }

  function getCurrentMonday() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    return monday.toISOString().split("T")[0];
  }

  function isSlotLocked(day: number, meal: "LUNCH" | "DINNER") {
    return lockedSlots.some((l) => l.day === day && l.meal === meal);
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skipSlots: lockedSlots.filter((l) => l.type === "eating_out").map((l) => ({ day: l.day, meal: l.meal })),
          lockedRecipes: lockedSlots.filter((l) => l.type === "recipe").map((l) => ({
            day: l.day,
            meal: l.meal,
            recipeId: l.recipeId,
            recipeName: l.recipeName,
            cookedBy: l.cookedBy,
          })),
        }),
      });
      const data = await res.json();
      if (data.slots) {
        // Merge: keep locked slots, replace the rest
        const newSlots: PlanSlot[] = [];

        // Add locked recipe slots
        for (const locked of lockedSlots) {
          if (locked.type === "recipe") {
            newSlots.push({
              day: locked.day,
              meal: locked.meal,
              recipeId: locked.recipeId!,
              recipeName: locked.recipeName!,
              cookedBy: locked.cookedBy as "ME" | "PARTNER" | "BOTH",
            });
          }
          // eating_out slots are intentionally not added (they stay empty)
        }

        // Add generated slots (only for non-locked positions)
        for (const slot of data.slots) {
          const isLocked = lockedSlots.some((l) => l.day === slot.day && l.meal === slot.meal);
          if (!isLocked) {
            newSlots.push(slot);
          }
        }

        setSlots(newSlots);
        setGenerated(true);
      } else {
        alert(data.error || "Could not generate plan");
      }
    } catch {
      alert("Error generating plan");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const weekStart = getCurrentMonday();
    const filledSlots = slots.filter((s) => s.recipeId);

    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart, slots: filledSlots }),
    });

    if (res.ok) {
      alert("Plan saved!");
    } else {
      alert("Error saving plan");
    }
  }

  function getSlot(day: number, meal: "LUNCH" | "DINNER") {
    return slots.find((s) => s.day === day && s.meal === meal);
  }

  function handleSlotTap(day: number, meal: "LUNCH" | "DINNER") {
    if (!generated) return;
    setSwapping({ day, meal });
  }

  function handleSwapRecipe(recipeId: string | null) {
    if (!swapping) return;
    const { day, meal } = swapping;

    if (recipeId === null) {
      // Mark as eating out — remove from slots, add to locked
      setSlots((prev) => prev.filter((s) => !(s.day === day && s.meal === meal)));
      setLockedSlots((prev) => [
        ...prev.filter((l) => !(l.day === day && l.meal === meal)),
        { day, meal, type: "eating_out" },
      ]);
    } else {
      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) return;

      const newSlot: PlanSlot = {
        day,
        meal,
        recipeId: recipe.id,
        recipeName: recipe.name,
        cookedBy: recipe.cooked_by as "ME" | "PARTNER" | "BOTH",
      };

      setSlots((prev) => {
        const filtered = prev.filter((s) => !(s.day === day && s.meal === meal));
        return [...filtered, newSlot];
      });

      // Lock this manual swap
      setLockedSlots((prev) => [
        ...prev.filter((l) => !(l.day === day && l.meal === meal)),
        { day, meal, type: "recipe", recipeId: recipe.id, recipeName: recipe.name, cookedBy: recipe.cooked_by },
      ]);
    }

    setSwapping(null);
  }

  function handleUnlock(day: number, meal: "LUNCH" | "DINNER") {
    setLockedSlots((prev) => prev.filter((l) => !(l.day === day && l.meal === meal)));
  }

  return (
    <div className="pb-28">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Weekly Plan</h2>
        <div className="flex gap-2">
          <Link
            href="/plan/history"
            className="border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm"
          >
            History
          </Link>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? "..." : "✨ Generate"}
          </button>
        </div>
      </div>

      {slots.length === 0 && !generated && (
        <p className="text-gray-500 text-center py-8">
          Add some recipes, then hit Generate to create your weekly plan.
        </p>
      )}

      {generated && (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Tap a slot to swap or mark as eating out. 🔒 = kept on regenerate.
          </p>
          <div className="space-y-3">
            {DAYS.map((dayName, dayIdx) => (
              <div key={dayIdx} className="border border-gray-300 rounded-lg p-3">
                <h3 className="font-semibold text-sm text-gray-600 mb-2">{dayName}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["LUNCH", "DINNER"] as const).map((meal) => {
                    const slot = getSlot(dayIdx, meal);
                    const locked = isSlotLocked(dayIdx, meal);
                    const isEatingOut = !slot && lockedSlots.some(
                      (l) => l.day === dayIdx && l.meal === meal && l.type === "eating_out"
                    );
                    const isSwapping2 = swapping?.day === dayIdx && swapping?.meal === meal;
                    return (
                      <div
                        key={meal}
                        className={`text-sm cursor-pointer rounded p-1.5 -m-1.5 ${
                          isSwapping2 ? "ring-2 ring-green-500" : ""
                        }`}
                        onClick={() => handleSlotTap(dayIdx, meal)}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400 uppercase">{meal}</span>
                          {locked && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUnlock(dayIdx, meal); }}
                              className="text-[10px] text-gray-400"
                              title="Unlock (allow regeneration)"
                            >
                              🔒
                            </button>
                          )}
                        </div>
                        {isEatingOut ? (
                          <div className="mt-0.5 text-gray-400 italic">Eating out 🍽️</div>
                        ) : slot ? (
                          <div className="mt-0.5">
                            <span className="font-medium">{slot.recipeName}</span>
                            <span className="text-xs text-gray-400 ml-1">
                              ({slot.cookedBy === "ME" ? "Seb" : slot.cookedBy === "PARTNER" ? "Aly" : "Both"})
                            </span>
                          </div>
                        ) : (
                          <div className="mt-0.5 text-gray-300">—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Swap picker */}
          {swapping && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
              <div className="bg-gray-50 dark:bg-gray-900 w-full rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">
                    {DAYS[swapping.day]} {swapping.meal.toLowerCase()}
                  </h3>
                  <button
                    onClick={() => setSwapping(null)}
                    className="text-gray-500 text-lg"
                  >
                    ✕
                  </button>
                </div>

                <button
                  onClick={() => handleSwapRecipe(null)}
                  className="w-full text-left border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm italic text-gray-500"
                >
                  🍽️ Eating out (leave empty)
                </button>

                <div className="space-y-1">
                  {recipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleSwapRecipe(recipe.id)}
                      className="w-full text-left border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      {recipe.name}
                      <span className="text-xs text-gray-400 ml-2">
                        ({recipe.cooked_by === "ME" ? "Seb" : recipe.cooked_by === "PARTNER" ? "Aly" : "Both"})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleGenerate}
              className="flex-1 border border-green-600 text-green-600 px-4 py-2 rounded-lg text-sm font-medium"
            >
              🔄 Regenerate
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              ✅ Save Plan
            </button>
          </div>
        </>
      )}
    </div>
  );
}
