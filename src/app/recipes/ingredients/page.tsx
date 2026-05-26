"use client";

import { useEffect, useState } from "react";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
}

const CATEGORIES = [
  "PRODUCE",
  "DAIRY",
  "PROTEIN",
  "GRAINS",
  "PANTRY",
  "FROZEN",
  "SPICES",
  "OTHER",
];

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", unit: "" });

  useEffect(() => {
    loadIngredients();
  }, []);

  async function loadIngredients() {
    const res = await fetch("/api/ingredients");
    const data = await res.json();
    setIngredients(data);
  }

  function startEdit(ing: Ingredient) {
    setEditingId(ing.id);
    setEditForm({ name: ing.name, category: ing.category, unit: ing.unit });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", category: "", unit: "" });
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/ingredients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      setEditingId(null);
      loadIngredients();
    } else {
      alert("Error saving ingredient");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ingredient? It will be removed from all recipes that use it.")) return;

    const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadIngredients();
    } else {
      const data = await res.json();
      alert(data.error || "Error deleting ingredient");
    }
  }

  return (
    <div className="pb-28">
      <h2 className="text-xl font-bold mb-4">Ingredients</h2>

      {ingredients.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No ingredients yet. They get created when you add them to recipes.
        </p>
      )}

      <div className="space-y-2">
        {ingredients.map((ing) =>
          editingId === ing.id ? (
            <div key={ing.id} className="border border-gray-300 rounded-lg p-3 space-y-2">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={editForm.unit}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                  placeholder="Unit"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(ing.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-gray-600 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={ing.id}
              className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2"
            >
              <div>
                <span className="text-sm font-medium">{ing.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {ing.category.toLowerCase()} · {ing.unit}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(ing)}
                  className="text-sm text-green-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(ing.id)}
                  className="text-sm text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
