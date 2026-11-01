import { EXERCISE_IMAGE_MAP } from "../data/exerciseImageMap.js";
import { filenameMatchScore, resolveWgerExerciseImages } from "../utils/wgerExerciseResolve.js";
import { getWorkoutStepImages } from "../utils/workoutExerciseVisual.js";

const cache = new Map();
const multiCache = new Map();

/** Neutral bodyweight illustration when wger returns nothing (avoids empty thumbnails). */
const PLACEHOLDER_EXERCISE_IMAGE =
  "https://wger.de/media/exercise-images/1551/a6a9e561-3965-45c6-9f2b-ee671e1a3a45.png";

const MIN_CURATED_WGER_SCORE = 18;
const SAFE_NON_WGER_CURATED = new Set([
  "Running",
  "Cycling",
  "Rowing Machine",
  "Shadow Boxing",
  "Stretching / Yoga",
  "Dynamic Stretching",
]);

function getExerciseName(exerciseOrName) {
  if (typeof exerciseOrName === "string") return exerciseOrName;
  return exerciseOrName?.name || "";
}

function getLookupName(exerciseOrName) {
  if (typeof exerciseOrName === "string") return exerciseOrName;
  return exerciseOrName?.imageLookupName || exerciseOrName?.name || "";
}

function getCacheKey(exerciseOrName) {
  if (typeof exerciseOrName === "string") return exerciseOrName;
  return exerciseOrName?.imageLookupName || exerciseOrName?.name || "";
}

function keepCuratedImage(exerciseName, imageUrl) {
  // Keep non-wger only for a small set of safer cardio / wellness fallbacks.
  if (!imageUrl?.includes("wger.de")) return SAFE_NON_WGER_CURATED.has(exerciseName);
  return filenameMatchScore(exerciseName, imageUrl) >= MIN_CURATED_WGER_SCORE;
}

async function fetchExerciseData(exerciseOrName) {
  const local = getWorkoutStepImages(typeof exerciseOrName === "string" ? { name: exerciseOrName } : exerciseOrName)
    .filter((src) => src.startsWith("/"));
  if (local.length) return local;
  const exerciseName = getExerciseName(exerciseOrName);
  const lookupName = getLookupName(exerciseOrName);
  const mapped = EXERCISE_IMAGE_MAP[lookupName] || EXERCISE_IMAGE_MAP[exerciseName];
  if (Array.isArray(mapped) && mapped.length > 0) {
    const vettedMapped = mapped.filter((url) => keepCuratedImage(lookupName || exerciseName, url));
    if (vettedMapped.length > 0) return vettedMapped;
  }
  const resolved = await resolveWgerExerciseImages(lookupName || exerciseName);
  if (resolved.length > 0) return resolved;
  return [PLACEHOLDER_EXERCISE_IMAGE];
}

export async function getExerciseImage(exerciseOrName) {
  const cacheKey = getCacheKey(exerciseOrName);
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const images = await getExerciseImages(exerciseOrName);
  const first = images[0] || null;
  cache.set(cacheKey, first);
  return first;
}

export async function getExerciseImages(exerciseOrName) {
  const cacheKey = getCacheKey(exerciseOrName);
  if (multiCache.has(cacheKey)) return multiCache.get(cacheKey);

  const images = await fetchExerciseData(exerciseOrName);
  multiCache.set(cacheKey, images);
  if (images.length > 0) cache.set(cacheKey, images[0]);
  else cache.set(cacheKey, null);
  return images;
}

export async function preloadExerciseImages(exercises) {
  const unique = [...new Map(exercises.map((exercise) => [getCacheKey(exercise), exercise])).values()];
  await Promise.allSettled(unique.map((exercise) => getExerciseImages(exercise)));
}

export function getCachedImage(exerciseOrName) {
  return cache.get(getCacheKey(exerciseOrName)) ?? null;
}

export function getCachedImages(exerciseOrName) {
  return multiCache.get(getCacheKey(exerciseOrName)) ?? [];
}
