"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewRecipePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    cookedBy: "BOTH",
    meals: 1,
    prepTime: 30,
    difficulty: "EASY",
    cost: "CHEAP",
    tags: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: form.notes || null,
      }),
    });

    if (res.ok) {
      router.push("/recipes");
    } else {
      alert("Error saving recipe");
      setSaving(false);
    }
  }

  return (
    <div className="pb-20">
      <h2 className="text-xl font-bold mb-4">New Recipe</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. Lentil Soup"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Who cooks
            </label>
            <select
              value={form.cookedBy}
              onChange={(e) => setForm({ ...form, cookedBy: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="ME">Me</option>
              <option value="PARTNER">Partner</option>
              <option value="BOTH">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meals
            </label>
            <select
              value={form.meals}
              onChange={(e) =>
                setForm({ ...form, meals: parseInt(e.target.value) })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value={1}>1 meal</option>
              <option value={2}>2 meals</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prep time
            </label>
            <input
              type="number"
              min={5}
              step={5}
              value={form.prepTime}
              onChange={(e) =>
                setForm({ ...form, prepTime: parseInt(e.target.value) })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="INVOLVED">Involved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost
            </label>
            <select
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="CHEAP">Cheap</option>
              <option value="MODERATE">Moderate</option>
              <option value="EXPENSIVE">Expensive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. soup, legumes, vegetarian"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={3}
            placeholder="Optional notes, tips, variations..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Recipe"}
        </button>
      </form>
    </div>
  );
}
