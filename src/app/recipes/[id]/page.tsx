"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface RecipeIngredient {
  ingredientId: string;
  name: string;
  quantity: string;
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

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

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
  const [loading, setLoading] = useState(true);

  // Ingredients state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [showNewIngredient, setShowNewIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    category: "OTHER",
    unit: "units",
  });

  useEffect(() => {
    // Load recipe
    fetch(`/api/recipes/${id}`)
      .then((r) => r.json())
      .then((recipe) => {
        setForm({
          name: recipe.name,
          cookedBy: recipe.cooked_by,
          meals: recipe.meals,
          prepTime: recipe.prep_time,
          difficulty: recipe.difficulty,
          cost: recipe.cost,
          tags: (recipe.tags || []).join(", "),
          notes: recipe.notes || "",
        });
        setRecipeIngredients(
          (recipe.recipe_ingredients || []).map((ri: any) => ({
            ingredientId: ri.ingredient_id,
            name: ri.ingredients?.name || "",
            quantity: String(ri.quantity),
            unit: ri.ingredients?.unit || "",
          }))
        );
        setLoading(false);
      });

    // Load all ingredients
    fetch("/api/ingredients")
      .then((r) => r.json())
      .then(setIngredients);
  }, [id]);

  async function handleAddNewIngredient() {
    if (!newIngredient.name.trim()) return;

    const res = await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIngredient),
    });

    if (res.ok) {
      const created = await res.json();
      setIngredients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setRecipeIngredients((prev) => [
        ...prev,
        { ingredientId: created.id, name: created.name, quantity: "1", unit: created.unit },
      ]);
      setNewIngredient({ name: "", category: "OTHER", unit: "units" });
      setShowNewIngredient(false);
    } else {
      alert("Error creating ingredient");
    }
  }

  function handleAddExistingIngredient(ing: Ingredient) {
    if (recipeIngredients.some((ri) => ri.ingredientId === ing.id)) return;
    setRecipeIngredients((prev) => [
      ...prev,
      { ingredientId: ing.id, name: ing.name, quantity: "1", unit: ing.unit },
    ]);
  }

  function handleRemoveIngredient(ingredientId: string) {
    setRecipeIngredients((prev) => prev.filter((ri) => ri.ingredientId !== ingredientId));
  }

  function handleQuantityChange(ingredientId: string, quantity: string) {
    setRecipeIngredients((prev) =>
      prev.map((ri) => (ri.ingredientId === ingredientId ? { ...ri, quantity } : ri))
    );
  }

  async function handleSubmit() {
    setSaving(true);

    const res = await fetch(`/api/recipes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cookedBy: form.cookedBy,
        prepTime: form.prepTime,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: form.notes || null,
        ingredients: recipeIngredients.map((ri) => ({
          ingredientId: ri.ingredientId,
          quantity: parseFloat(ri.quantity) || 0,
        })),
      }),
    });

    if (res.ok) {
      router.push("/recipes");
    } else {
      alert("Error saving recipe");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this recipe?")) return;

    const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/recipes");
    } else {
      alert("Error deleting recipe");
    }
  }

  const availableIngredients = ingredients.filter(
    (ing) => !recipeIngredients.some((ri) => ri.ingredientId === ing.id)
  );

  if (loading) {
    return <div className="pb-28"><p className="text-gray-500 text-center py-8">Loading...</p></div>;
  }

  return (
    <div className="pb-28 space-y-4">
      <h2 className="text-xl font-bold">Edit Recipe</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Who cooks</label>
          <select
            value={form.cookedBy}
            onChange={(e) => setForm({ ...form, cookedBy: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="ME">Seb</option>
            <option value="PARTNER">Alyssa</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meals</label>
          <select
            value={form.meals}
            onChange={(e) => setForm({ ...form, meals: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value={1}>1 meal</option>
            <option value={2}>2 meals</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prep time</label>
          <input
            type="number"
            min={5}
            step={5}
            value={form.prepTime}
            onChange={(e) => setForm({ ...form, prepTime: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Ingredients Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>

        {recipeIngredients.length > 0 && (
          <div className="space-y-2 mb-3">
            {recipeIngredients.map((ri) => (
              <div
                key={ri.ingredientId}
                className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2"
              >
                <span className="flex-1 text-sm font-medium">{ri.name}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={ri.quantity}
                  onChange={(e) => handleQuantityChange(ri.ingredientId, e.target.value)}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                />
                <span className="text-xs text-gray-600 w-12">{ri.unit}</span>
                <button
                  onClick={() => handleRemoveIngredient(ri.ingredientId)}
                  className="text-red-500 hover:text-red-700 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {availableIngredients.length > 0 && (
          <div className="mb-2">
            <select
              onChange={(e) => {
                const ing = ingredients.find((i) => i.id === e.target.value);
                if (ing) handleAddExistingIngredient(ing);
                e.target.value = "";
              }}
              defaultValue=""
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="" disabled>
                + Add existing ingredient...
              </option>
              {availableIngredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.unit})
                </option>
              ))}
            </select>
          </div>
        )}

        {!showNewIngredient ? (
          <button
            onClick={() => setShowNewIngredient(true)}
            className="text-sm text-green-600 font-medium"
          >
            + Create new ingredient
          </button>
        ) : (
          <div className="border border-gray-300 rounded-lg p-3 space-y-2">
            <input
              type="text"
              placeholder="Ingredient name"
              value={newIngredient.name}
              onChange={(e) =>
                setNewIngredient({ ...newIngredient, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newIngredient.category}
                onChange={(e) =>
                  setNewIngredient({ ...newIngredient, category: e.target.value })
                }
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
                placeholder="Unit (g, ml, pieces...)"
                value={newIngredient.unit}
                onChange={(e) =>
                  setNewIngredient({ ...newIngredient, unit: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAddNewIngredient}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Add
              </button>
              <button
                onClick={() => setShowNewIngredient(false)}
                className="text-gray-600 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      {/* Actions */}
      <button
        onClick={handleSubmit}
        disabled={saving || !form.name.trim()}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      <button
        onClick={handleDelete}
        className="w-full border border-red-300 text-red-600 py-3 rounded-lg font-medium"
      >
        Delete Recipe
      </button>
    </div>
  );
}
