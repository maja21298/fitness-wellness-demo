import { EXERCISE_DB } from "../../data/exercises";

type DbExercise = (typeof EXERCISE_DB)[keyof typeof EXERCISE_DB][number];

/** Snapshot exercise shape from Firestore / generators — kept loose on purpose. */
type SnapshotExercise = {
  name?: string;
  muscle?: string;
  muscleGroup?: string;
  image?: string;
  animation?: DbExercise["animation"];
  text?: DbExercise["text"];
  [key: string]: unknown;
};

function findCanonicalExercise(exercise: SnapshotExercise): DbExercise | null {
  const name = exercise?.name;
  if (!name || typeof name !== "string") return null;

  const nameLower = name.toLowerCase();

  const group = exercise.muscleGroup || exercise.muscle;
  if (group && typeof group === "string") {
    const pool = EXERCISE_DB[group as keyof typeof EXERCISE_DB];
    if (Array.isArray(pool)) {
      const found = pool.find((e) => e.name === name) || pool.find((e) => e.name.toLowerCase() === nameLower);
      if (found) return found;
    }
  }

  for (const pool of Object.values(EXERCISE_DB)) {
    const found = pool.find((e) => e.name === name) || pool.find((e) => e.name.toLowerCase() === nameLower);
    if (found) return found;
  }

  return null;
}

/** Ključevi pod `text.hr` koje hydratacija puni iz kanona (hrvatski UI). */
const HR_TEXT_KEYS = ["name", "description", "instructions", "commonMistakes", "equipmentGuide"] as const;

type HrShape = NonNullable<DbExercise["text"]>["hr"];

function mergeTextHrFromCanonical(
  snapshotText: DbExercise["text"] | undefined,
  canonicalText: DbExercise["text"] | undefined,
): DbExercise["text"] | undefined {
  const canonHr = canonicalText?.hr;
  if (!canonHr) {
    return snapshotText ?? canonicalText;
  }

  const snapHr = (snapshotText?.hr || {}) as Partial<HrShape>;
  const mergedHr: Partial<HrShape> = { ...snapHr };
  for (const k of HR_TEXT_KEYS) {
    const v = canonHr[k];
    if (v !== undefined && v !== null) {
      mergedHr[k] = v;
    }
  }

  return {
    ...(snapshotText || {}),
    hr: mergedHr as HrShape,
    en: canonicalText?.en ?? snapshotText?.en,
  } as DbExercise["text"];
}

/**
 * Dopunjava stare snapshot vježbe poljima iz aktualne EXERCISE_DB (image, animation, text).
 * Ne dira sets, reps, note, trainingLocation — ostaju iz `exercise`.
 */
export function hydrateExercisesFromDb<T extends SnapshotExercise>(exercises: T[] | undefined | null): T[] | undefined {
  if (exercises == null) return exercises;
  if (!Array.isArray(exercises)) return exercises as unknown as T[];
  return exercises.map((exercise) => {
    const canonical = findCanonicalExercise(exercise);
    if (!canonical) return exercise;

    const image = exercise.image ?? canonical.image;
    const instructionStepImages =
      (exercise as any).instructionStepImages ?? (canonical as any).instructionStepImages;
    const homeImage = (exercise as any).homeImage ?? (canonical as any).homeImage;
    const homeInstructionStepImages =
      (exercise as any).homeInstructionStepImages ?? (canonical as any).homeInstructionStepImages;
    const gymImage = (exercise as any).gymImage ?? (canonical as any).gymImage;
    const gymInstructionStepImages =
      (exercise as any).gymInstructionStepImages ?? (canonical as any).gymInstructionStepImages;

    const animation =
      exercise.animation != null && canonical.animation != null
        ? ({ ...canonical.animation, ...exercise.animation } as typeof canonical.animation)
        : exercise.animation ?? canonical.animation;

    const text = mergeTextHrFromCanonical(exercise.text, canonical.text);

    return {
      ...exercise,
      image,
      instructionStepImages,
      homeImage,
      homeInstructionStepImages,
      gymImage,
      gymInstructionStepImages,
      animation,
      text,
    };
  });
}

/** Hydratira sve `exercises` nizove unutar tjednog plana (dan → { focus, exercises }). */
export function hydrateWeeklyPlanFromDb(weeklyPlan: Record<string, unknown> | null | undefined) {
  if (!weeklyPlan || typeof weeklyPlan !== "object") return weeklyPlan;
  const out: Record<string, unknown> = {};
  for (const [day, dayData] of Object.entries(weeklyPlan)) {
    if (!dayData || typeof dayData !== "object" || Array.isArray(dayData)) {
      out[day] = dayData;
      continue;
    }
    const d = dayData as { exercises?: SnapshotExercise[]; [key: string]: unknown };
    out[day] = {
      ...d,
      exercises: hydrateExercisesFromDb(d.exercises),
    };
  }
  return out;
}
