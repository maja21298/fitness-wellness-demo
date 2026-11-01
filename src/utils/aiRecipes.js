import { resolveRecipeEmoji } from "./recipeVisual";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatIngredientLabel(ingredient) {
  if (ingredient == null) return "";
  if (typeof ingredient === "string") return ingredient.replace(/\s+/g, " ").trim();
  const name = String(ingredient.name || ingredient.label || "").trim();
  const amount = ingredient.amount ?? ingredient.qty ?? ingredient.quantity;
  const unit = String(ingredient.unit || "").trim();
  if (amount == null || amount === "") return name;
  const amountText = String(amount).trim();
  return [amountText, unit, name].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function ingredientHasQuantity(ingredient) {
  const label = formatIngredientLabel(ingredient);
  if (!label) return false;
  if (typeof ingredient === "object" && ingredient && (ingredient.amount != null || ingredient.qty != null || ingredient.quantity != null)) {
    return String(ingredient.amount ?? ingredient.qty ?? ingredient.quantity).trim().length > 0;
  }
  return /\d/.test(label);
}

export function pickIngredientList(translated = [], original = []) {
  const translatedList = Array.isArray(translated) ? translated : [];
  const originalList = Array.isArray(original) ? original : [];
  const translatedHasQty = translatedList.some(ingredientHasQuantity);
  if (translatedHasQty || !originalList.length) {
    return translatedList.map(formatIngredientLabel).filter(Boolean);
  }
  if (translatedList.length === originalList.length) {
    return translatedList.map((item, index) => {
      const hrLabel = formatIngredientLabel(item);
      const enLabel = formatIngredientLabel(originalList[index]);
      if (ingredientHasQuantity(item)) return hrLabel;
      const qtyMatch = String(enLabel).match(/^(\d[\d.,/]*\s*(?:g|kg|ml|l|tbsp|tsp|cup|kom|x|žlica|žličica)?)\b/i);
      if (qtyMatch && hrLabel) return `${qtyMatch[1]} ${hrLabel}`.replace(/\s+/g, " ").trim();
      return enLabel || hrLabel;
    }).filter(Boolean);
  }
  return originalList.map(formatIngredientLabel).filter(Boolean);
}

function fillPrepMinutes(prep, steps) {
  const parsed = toNumber(prep, 0);
  if (parsed > 0) return Math.round(parsed);
  const count = Array.isArray(steps) ? steps.filter((step) => String(step || "").trim().length > 8).length : 0;
  if (!count) return 0;
  return Math.min(40, Math.max(8, count * 5));
}

export function normalizeAiRecipe(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.name || raw.recipeName || "").trim();
  const steps = (Array.isArray(raw.steps) ? raw.steps : [])
    .map((step) => String(step || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const ingredientsRaw = Array.isArray(raw.ingredients) ? raw.ingredients : [];
  const ingredients = ingredientsRaw.map(formatIngredientLabel).filter(Boolean);
  const calories = Math.round(toNumber(raw.calories ?? raw.cal ?? raw.estimatedCalories));
  const protein = Math.round(toNumber(raw.protein ?? raw.estimatedProtein));
  const carbs = Math.round(toNumber(raw.carbs ?? raw.estimatedCarbs));
  const fat = Math.round(toNumber(raw.fat ?? raw.estimatedFat));
  const servings = Math.max(1, Math.round(toNumber(raw.servings ?? raw.serves ?? raw.portions, 1)));
  const prep = fillPrepMinutes(raw.prep ?? raw.prepTime ?? raw.time, steps);
  const description = String(raw.summary || raw.description || "").trim();
  const emoji = resolveRecipeEmoji({ name, emoji: raw.emoji }, raw.emoji);
  const quantityCount = ingredientsRaw.filter(ingredientHasQuantity).length;

  const recipe = {
    id: raw.id || `ai-${index}-${name.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
    name: name || `Recipe ${index + 1}`,
    description,
    emoji,
    cal: calories,
    calories,
    protein,
    carbs,
    fat,
    prep,
    servings,
    ingredients,
    ingredientsRaw,
    steps,
    source: raw.source || "custom",
  };

  const complete = Boolean(
    name.length > 2
    && calories > 0
    && ingredients.length >= 2
    && quantityCount >= Math.min(2, ingredients.length)
    && steps.length >= 2
    && steps.every((step) => step.length >= 8)
    && prep > 0
    && servings > 0,
  );

  return { ...recipe, complete };
}

export function splitAiRecipes(recipes) {
  const normalized = (Array.isArray(recipes) ? recipes : [])
    .map((recipe, index) => normalizeAiRecipe(recipe, index))
    .filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const recipe of normalized) {
    const key = recipe.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(recipe);
  }
  return {
    complete: unique.filter((recipe) => recipe.complete).slice(0, 6),
    incomplete: unique.filter((recipe) => !recipe.complete),
  };
}

export function toDetailFood(recipe, extras = {}) {
  if (!recipe) return null;
  return {
    ...recipe,
    cal: recipe.cal ?? recipe.calories,
    imageUrl: extras.imageUrl || recipe.imageUrl || null,
    source: recipe.source || extras.source || "custom",
  };
}

// Older API responses provide ingredient names and cooking steps without amounts.
// Keep those suggestions visible while still rejecting empty or unusable recipes.
export function getGeneratedRecipeSuggestions(recipes) {
  const namedRecipes = (Array.isArray(recipes) ? recipes : []).filter((recipe) => (
    recipe && String(recipe.name || recipe.recipeName || "").trim().length > 2
  ));
  const { complete, incomplete } = splitAiRecipes(namedRecipes);
  const usable = incomplete.filter((recipe) => (
    recipe.cal > 0
    && recipe.ingredients.length >= 2
    && recipe.steps.length > 0
    && recipe.steps.every((step) => step.length >= 8)
  ));
  return [...complete, ...usable].slice(0, 6);
}
