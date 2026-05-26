"use client";

import { useEffect, useState } from "react";

interface PlanSlot {
  day: number;
  meal: "LUNCH" | "DINNER";
  recipeId: string;
  recipeName: string;
  cookedBy: "ME" | "PARTNER" | "BOTH";
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PlanPage() {
  const [slots, setSlots] = useState<PlanSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/plan/generate", { method: "POST" });
      const data = await res.json();
      if (data.slots) {
        setSlots(data.slots);
        setGenerated(true);
      } else {
        alert(data.error || "Could not generate plan");
      }
    } catch (err) {
      alert("Error generating plan");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    // Get current Monday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const weekStart = monday.toISOString().split("T")[0];

    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart, slots }),
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

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Weekly Plan</h2>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Generating..." : "✨ Generate"}
        </button>
      </div>

      {slots.length === 0 && !generated && (
        <p className="text-gray-500 text-center py-8">
          Add some recipes, then hit Generate to create your weekly plan.
        </p>
      )}

      {slots.length > 0 && (
        <>
          <div className="space-y-3">
            {DAYS.map((dayName, dayIdx) => (
              <div key={dayIdx} className="bg-white rounded-lg shadow-sm p-3">
                <h3 className="font-semibold text-sm text-gray-600 mb-2">{dayName}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["LUNCH", "DINNER"] as const).map((meal) => {
                    const slot = getSlot(dayIdx, meal);
                    return (
                      <div key={meal} className="text-sm">
                        <span className="text-xs text-gray-400 uppercase">{meal}</span>
                        {slot ? (
                          <div className="mt-0.5">
                            <span className="font-medium">{slot.recipeName}</span>
                            <span className="text-xs text-gray-400 ml-1">
                              ({slot.cookedBy === "ME" ? "👨‍🍳" : slot.cookedBy === "PARTNER" ? "👩‍🍳" : "👫"})
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
