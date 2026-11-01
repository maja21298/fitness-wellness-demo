import { EXERCISE_DB } from "../../data/exercises";
import { shuffleWithRng } from "./rng";
import { scoreExerciseForExperience } from "./scoring";

export function pickExercises(
  group,
  count,
  {
    usedNames = new Set(),
    homeOnly = false,
    rng = Math.random,
    experience = "beginner",
    goal = "only_training",
    existingExercises = [],
  } = {},
) {
  let pool = (EXERCISE_DB[group] || []).filter((exercise) => !usedNames.has(exercise.name));
  if (homeOnly) pool = pool.filter((exercise) => exercise.home);

  const picked = [];

  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const ranked = shuffleWithRng(pool, rng).sort(
      (a, b) => scoreExerciseForExperience(
        b,
        group,
        experience,
        i,
        [...existingExercises, ...picked],
        homeOnly,
        goal,
      ) - scoreExerciseForExperience(
        a,
        group,
        experience,
        i,
        [...existingExercises, ...picked],
        homeOnly,
        goal,
      ),
    );

    const choice = ranked[0];
    if (!choice) break;

    picked.push({ ...choice, muscle: group });
    usedNames.add(choice.name);
    pool = pool.filter((exercise) => exercise.name !== choice.name);
  }

  return picked;
}
