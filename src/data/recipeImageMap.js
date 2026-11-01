import { ALL_RECIPE_NAMES, RECIPE_CATALOG } from "./recipeCatalog";

/** Public folder for final recipe food photos. */
export const RECIPE_IMAGE_DIR = "/assets/nutrition/recipes";

/** Shared placeholder until real images are added. */
export const PLACEHOLDER = "/assets/nutrition/_placeholder.svg";

export function recipeImageSlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getRecipeImageFilename(recipeName) {
  const slug = recipeImageSlug(recipeName);
  return slug ? `${slug}.webp` : null;
}

export function getRecipeImagePath(recipeName) {
  const filename = getRecipeImageFilename(recipeName);
  return filename ? `${RECIPE_IMAGE_DIR}/${filename}` : PLACEHOLDER;
}

/** Canonical English recipe name → public image path. */
export const RECIPE_IMAGE_MAP = Object.fromEntries(
  ALL_RECIPE_NAMES.map((name) => [name, getRecipeImagePath(name)]),
);

/**
 * Resolve image src from canonical English recipe name.
 * HR/EN display names must not be used here — pass food.name from the database.
 */
export function getRecipeImageSrc(recipeName) {
  const englishName = String(recipeName || "").trim();
  if (!englishName) return PLACEHOLDER;
  if (RECIPE_IMAGE_MAP[englishName]) return RECIPE_IMAGE_MAP[englishName];
  return getRecipeImagePath(englishName);
}

export function getRecipeImagePlaceholder() {
  return PLACEHOLDER;
}

/** Inventory helper: grouped checklist for asset creation. */
export function getRecipeImageInventory() {
  const unique = ALL_RECIPE_NAMES.map((name) => ({
    name,
    filename: getRecipeImageFilename(name),
    path: getRecipeImagePath(name),
  }));

  const byMeal = Object.fromEntries(
    Object.entries(RECIPE_CATALOG).map(([meal, names]) => [
      meal,
      names.map((name) => ({
        name,
        filename: getRecipeImageFilename(name),
      })),
    ]),
  );

  return { totalUnique: unique.length, unique, byMeal };
}

export { ALL_RECIPE_NAMES, RECIPE_CATALOG };
