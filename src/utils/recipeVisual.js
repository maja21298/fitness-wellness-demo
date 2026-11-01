/**
 * Scalable recipe visual resolution for catalog photos, user uploads, and AI recipes.
 * No external image search / generation — emoji fallback for generated dishes without photos.
 */

import { RECIPE_IMAGE_MAP, getRecipeImageSrc } from "../data/recipeImageMap";

/** Allowed food emojis for AI output and UI fallbacks. */
export const FOOD_EMOJI_WHITELIST = Object.freeze([
  "🥞", "🍳", "🥣", "🥗", "🍚", "🍝", "🌯", "🥪", "🍲", "🍛",
  "🥘", "🥩", "🍗", "🐟", "🥑", "🍌", "🍓", "🥤", "🧇", "🍕",
  "🥔", "🥦", "🌮", "🍔", "🧁", "🍎", "🍊", "🍇", "🥜", "🍽️",
]);

const FOOD_EMOJI_SET = new Set(FOOD_EMOJI_WHITELIST);

export const DEFAULT_FOOD_EMOJI = "🍽️";

/** Keyword → emoji (first match wins; order = specificity). */
const EMOJI_KEYWORD_RULES = [
  ["pancake", "🥞"],
  ["palačink", "🥞"],
  ["palacink", "🥞"],
  ["waffle", "🧇"],
  ["omelette", "🍳"],
  ["omelet", "🍳"],
  ["scramble", "🍳"],
  ["jaj", "🍳"],
  ["egg", "🍳"],
  ["smoothie", "🥤"],
  ["shake", "🥤"],
  ["oatmeal", "🥣"],
  ["oat meal", "🥣"],
  ["zobena", "🥣"],
  ["porridge", "🥣"],
  ["yogurt", "🥣"],
  ["yoghurt", "🥣"],
  ["skyr", "🥣"],
  ["oat", "🥣"],
  ["parfait", "🥣"],
  ["salata", "🥗"],
  ["salad", "🥗"],
  ["juha", "🍲"],
  ["soup", "🍲"],
  ["stew", "🍲"],
  ["curry", "🍛"],
  ["tjesten", "🍝"],
  ["pasta", "🍝"],
  ["noodle", "🍝"],
  ["spaghetti", "🍝"],
  ["bolognese", "🍝"],
  ["bolonjez", "🍝"],
  ["burrito", "🌯"],
  ["wrap", "🌯"],
  ["taco", "🌮"],
  ["sandwich", "🥪"],
  ["toast", "🥪"],
  ["burger", "🍔"],
  ["pizza", "🍕"],
  ["salmon", "🐟"],
  ["losos", "🐟"],
  ["tuna", "🐟"],
  ["fish", "🐟"],
  ["riba", "🐟"],
  ["cod", "🐟"],
  ["shrimp", "🐟"],
  ["pilet", "🍗"],
  ["chicken", "🍗"],
  ["turkey", "🍗"],
  ["steak", "🥩"],
  ["beef", "🥩"],
  ["meat", "🥩"],
  ["lamb", "🥩"],
  ["rice", "🍚"],
  ["riža", "🍚"],
  ["riza", "🍚"],
  ["quinoa", "🍚"],
  ["bowl", "🥣"],
  ["potato", "🥔"],
  ["broccoli", "🥦"],
  ["veggie", "🥦"],
  ["vegetable", "🥦"],
  ["avocado", "🥑"],
  ["banana", "🍌"],
  ["banan", "🍌"],
  ["berry", "🍓"],
  ["strawberry", "🍓"],
  ["jabuk", "🍎"],
  ["apple", "🍎"],
  ["orange", "🍊"],
  ["grape", "🍇"],
  ["nut", "🥜"],
  ["peanut", "🥜"],
  ["dessert", "🧁"],
  ["cupcake", "🧁"],
  ["muffin", "🧁"],
  ["cake", "🧁"],
];

export function isAllowedFoodEmoji(value) {
  if (value == null) return false;
  const trimmed = String(value).trim();
  if (!trimmed) return false;
  // Accept single emoji or emoji + optional variation selector / ZWJ sequences from whitelist exact match
  if (FOOD_EMOJI_SET.has(trimmed)) return true;
  // AI sometimes returns "🥞 Pancakes" — take first token if it's allowed
  const first = trimmed.split(/\s+/)[0];
  return FOOD_EMOJI_SET.has(first);
}

export function sanitizeFoodEmoji(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (FOOD_EMOJI_SET.has(trimmed)) return trimmed;
  const first = trimmed.split(/\s+/)[0];
  return FOOD_EMOJI_SET.has(first) ? first : null;
}

export function inferFoodEmojiFromName(name) {
  const text = String(name || "").toLowerCase();
  if (!text) return DEFAULT_FOOD_EMOJI;
  for (const [key, emoji] of EMOJI_KEYWORD_RULES) {
    if (text.includes(key)) return emoji;
  }
  return DEFAULT_FOOD_EMOJI;
}

/**
 * Resolve a display emoji for a recipe (never throws; always returns whitelist emoji).
 * Priority: valid stored/AI emoji → keyword inference → 🍽️
 */
export function resolveRecipeEmoji(recipeOrName, explicitEmoji) {
  const recipe = recipeOrName && typeof recipeOrName === "object" ? recipeOrName : null;
  const name = recipe
    ? (recipe.name || recipe.recipeName || "")
    : String(recipeOrName || "");
  const candidates = [
    explicitEmoji,
    recipe?.emoji,
    recipe?.icon,
  ];
  for (const candidate of candidates) {
    const ok = sanitizeFoodEmoji(candidate);
    if (ok) return ok;
  }
  return inferFoodEmojiFromName(name);
}

export function isValidRecipeImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const value = url.trim();
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;
  if (value.startsWith("https://") || value.startsWith("http://") || value.startsWith("blob:")) return true;
  // Firebase / app-relative uploaded paths
  if (value.startsWith("/") && !value.includes("_placeholder")) return true;
  return false;
}

export function hasCatalogRecipeImage(recipeName) {
  const key = String(recipeName || "").trim();
  return Boolean(key && RECIPE_IMAGE_MAP[key]);
}

/**
 * Rendering priority:
 * 1. user/photo imageUrl if valid
 * 2. catalog curated image (known recipe name)
 * 3. valid recipe emoji
 * 4. derived fallback emoji
 * 5. 🍽️
 *
 * @returns {{ kind: 'image', src: string } | { kind: 'emoji', emoji: string }}
 */
export function resolveRecipeVisual(recipe = {}, options = {}) {
  const imageUrl = options.imageUrl ?? recipe.imageUrl ?? recipe.photoUrl ?? null;
  if (isValidRecipeImageUrl(imageUrl)) {
    return { kind: "image", src: imageUrl.trim() };
  }

  const englishName = String(options.englishName || recipe.englishName || recipe.name || "").trim();
  const forceEmoji = Boolean(options.forceEmoji);
  const preferCatalog = options.preferCatalog !== false;
  const source = String(options.source || recipe.source || "catalog");
  const isNonCatalogSource = ["custom", "custom-adapted", "scan", "quick-add"].includes(source);

  // Catalog curated photos only for catalog recipes — never for AI/My Dish/scan without a real photo
  if (!forceEmoji && preferCatalog && !isNonCatalogSource && hasCatalogRecipeImage(englishName)) {
    return { kind: "image", src: getRecipeImageSrc(englishName) };
  }

  // Custom / AI / My Dish without photo — never invent a catalog slug photo
  const emoji = resolveRecipeEmoji(recipe, options.emoji);
  return { kind: "emoji", emoji };
}
