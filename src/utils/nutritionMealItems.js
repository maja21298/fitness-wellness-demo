/** Normalize Nutrition plan meal selections to multi-item lists. */

export function foodToMealItem(food, extras = {}) {
  if (!food?.name) return null;
  const cal = Number(food.cal ?? food.calories ?? food.estimatedCalories) || 0;
  return {
    id: extras.id || `recipe-${String(food.name).toLowerCase().replace(/\s+/g, "-")}`,
    name: food.name,
    cal,
    calories: cal,
    protein: Number(food.protein) || 0,
    carbs: Number(food.carbs) || 0,
    fat: Number(food.fat) || 0,
    prep: Number(food.prep ?? food.prepTime) || 0,
    servings: Number(food.servings) > 0 ? Number(food.servings) : 1,
    emoji: food.emoji || food.icon || "🍽️",
    ingredients: Array.isArray(food.ingredients) ? food.ingredients : [],
    steps: Array.isArray(food.steps) ? food.steps : [],
    source: food.source || extras.source || "catalog",
    imageUrl: food.imageUrl || extras.imageUrl || null,
    inputText: food.inputText || extras.inputText || null,
    ...extras,
  };
}

function coerceStoredItem(item) {
  if (!item) return null;
  if (typeof item === "string") {
    return foodToMealItem({ name: item, source: "catalog" });
  }
  if (typeof item !== "object") return null;
  return foodToMealItem(item, {
    id: item.id,
    source: item.source,
    imageUrl: item.imageUrl,
    inputText: item.inputText,
  });
}

/**
 * Legacy:
 * - null → cleared (no items)
 * - integer index → single option at that index
 * - undefined / missing → empty (do not invent option[0]; avoids phantom macros
 *   and accidental persistence when the first real item is added)
 * New:
 * - array of meal item objects
 */
export function normalizeMealItems(raw, options = []) {
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw)) {
    return raw.map(coerceStoredItem).filter(Boolean);
  }
  if (Number.isInteger(raw)) {
    const arr = Array.isArray(options) ? options : [];
    if (!arr.length) return [];
    const safeIdx = Math.min(Math.max(0, raw), arr.length - 1);
    const food = arr[safeIdx];
    return food ? [foodToMealItem(food)].filter(Boolean) : [];
  }
  return [];
}

export function mealItemsIncludeName(items, name) {
  if (!name) return false;
  return (items || []).some((item) => item?.name === name);
}

export function canAddMealItem(items, nextItem) {
  if (!nextItem?.name) return false;
  if (nextItem.source === "quick-add" || nextItem.source === "scan") return true;
  return !mealItemsIncludeName(items, nextItem.name);
}

export function sumMealItems(items) {
  return (items || []).reduce(
    (acc, food) => ({
      cal: acc.cal + (Number(food?.cal ?? food?.calories ?? food?.estimatedCalories) || 0),
      protein: acc.protein + (Number(food?.protein) || 0),
      carbs: acc.carbs + (Number(food?.carbs) || 0),
      fat: acc.fat + (Number(food?.fat) || 0),
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function flattenDayMealItems(selections, day, planDay) {
  const meals = planDay && typeof planDay === "object" ? planDay : {};
  const out = [];
  for (const meal of Object.keys(meals)) {
    const options = Array.isArray(meals[meal]) ? meals[meal] : [];
    const items = normalizeMealItems(selections?.[day]?.[meal], options);
    for (const item of items) {
      out.push({ meal, item });
    }
  }
  // Also surface meals that only exist in selections (e.g. after options emptied)
  const daySel = selections?.[day] || {};
  for (const meal of Object.keys(daySel)) {
    if (meals[meal]) continue;
    const items = normalizeMealItems(daySel[meal], []);
    for (const item of items) out.push({ meal, item });
  }
  return out;
}
