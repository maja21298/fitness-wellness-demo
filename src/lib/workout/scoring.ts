export const STRENGTH_GROUPS = new Set(["chest", "back", "shoulders", "legs", "arms"]);
export const COMPOUND_EXERCISES = new Set([
  "Bench Press", "Dumbbell Bench Press", "Incline Dumbbell Press", "Chest Press Machine", "Push-ups", "Incline Push-ups",
  "Decline Push-ups", "Wide Push-ups", "Dips", "Pull-ups", "Chin-ups", "Dumbbell Rows", "Barbell Rows",
  "Seated Cable Rows", "Resistance Band Rows", "Overhead Press", "Arnold Press", "Pike Push-ups", "Squat", "Deadlift",
  "Romanian Deadlift", "Goblet Squat", "Leg Press", "Lunges", "Bulgarian Split Squat", "Step-ups", "Hip Thrust",
  "Glute Bridge", "Diamond Push-ups", "Triceps Dips",
]);
export const ADVANCED_EXERCISES = new Set([
  "Archer Push-ups", "Pull-ups", "Chin-ups", "Wall Handstand Hold", "Pike Push-ups", "Bulgarian Split Squat",
  "Single-leg Deadlift", "Jump Squats", "Box Jumps", "Burpees", "Bear Crawl", "Hollow Hold", "Deadlift",
]);
export const BEGINNER_FRIENDLY_EXERCISES = new Set([
  "Push-ups", "Incline Push-ups", "Dumbbell Bench Press", "Chest Press Machine", "Resistance Band Rows", "Lat Pulldowns",
  "Seated Cable Rows", "Lateral Raises", "Front Raises", "Face Pulls", "Bodyweight Squats", "Goblet Squat",
  "Glute Bridge", "Hip Thrust", "Lunges", "Calf Raises", "Crunches", "Dead Bug", "Heel Taps", "Plank", "Bicep Curls",
  "Hammer Curls", "Overhead Triceps Extension", "Running", "Cycling", "Stretching / Yoga", "Dynamic Stretching",
  "Hip Flexor Stretch",
]);
export const PLYO_EXERCISES = new Set([
  "Jump Squats", "Box Jumps", "Burpees", "Skater Hops", "Mountain Climbers", "High Knees", "Jumping Jacks", "Butt Kicks",
]);

export function getExerciseTraits(exercise, group) {
  const note = String(exercise.note || "").toLowerCase();
  const equip = String(exercise.equip || "").toLowerCase();
  const isHold = note.includes("hold") || note.includes("sec") || exercise.reps === 1;
  return {
    compound: COMPOUND_EXERCISES.has(exercise.name),
    advanced: ADVANCED_EXERCISES.has(exercise.name),
    beginnerFriendly: BEGINNER_FRIENDLY_EXERCISES.has(exercise.name),
    plyo: PLYO_EXERCISES.has(exercise.name),
    hold: isHold,
    machineSupported: equip.includes("machine") || equip.includes("bench") || equip.includes("chair"),
    lowImpact: !PLYO_EXERCISES.has(exercise.name) && !ADVANCED_EXERCISES.has(exercise.name),
    strength: STRENGTH_GROUPS.has(group),
  };
}

function scoreExerciseForGoal(exercise, group, goal, selectedExercises) {
  const traits = getExerciseTraits(exercise, group);
  let score = 0;

  if (goal === "lose") {
    if (group === "cardio") score += traits.plyo ? 5 : 3;
    if (group === "core") score += traits.hold ? 1 : 2;
    if (group === "legs") score += traits.plyo ? 3 : traits.compound ? 2 : 0;
    if (group === "flexibility") score += 1;
    if (traits.machineSupported) score -= 1;
    if (traits.hold && selectedExercises.some((picked) => getExerciseTraits(picked, picked.muscle).hold)) score -= 2;
  } else if (goal === "gain") {
    if (traits.compound) score += 4;
    if (traits.machineSupported) score += 2;
    if (traits.strength) score += 2;
    if (group === "cardio") score += traits.lowImpact ? 1 : -2;
    if (group === "flexibility") score -= 1;
  } else {
    if (traits.compound) score += 2;
    if (group === "cardio" && traits.lowImpact) score += 1;
    if (group === "flexibility") score += 2;
    if (group === "core" && !traits.hold) score += 1;
  }

  return score;
}

export function scoreExerciseForExperience(exercise, group, experience, slotIndex, selectedExercises, homeOnly, goal) {
  const traits = getExerciseTraits(exercise, group);
  let score = scoreExerciseForGoal(exercise, group, goal, selectedExercises);

  if (traits.strength && slotIndex === 0 && traits.compound) score += 5;
  if (selectedExercises.some((picked) => getExerciseTraits(picked, group).hold) && traits.hold) score -= 3;
  if (selectedExercises.some((picked) => getExerciseTraits(picked, group).plyo) && traits.plyo) score -= 2;

  if (experience === "beginner") {
    if (traits.beginnerFriendly) score += 5;
    if (traits.lowImpact) score += 2;
    if (!homeOnly && traits.machineSupported) score += 2;
    if (traits.advanced) score -= 5;
    if (traits.plyo) score -= 5;
    if (traits.hold && slotIndex === 0) score -= 3;
  } else if (experience === "intermediate") {
    if (traits.compound) score += 3;
    if (traits.beginnerFriendly) score += 1;
    if (traits.advanced) score += 2;
    if (traits.plyo && (group === "cardio" || group === "legs")) score += 1;
  } else {
    if (traits.compound) score += 4;
    if (traits.advanced) score += 4;
    if (traits.plyo) score += 2;
    if (traits.hold && (group === "core" || group === "shoulders")) score += 1;
    if (traits.strength && slotIndex === 0 && !traits.compound) score -= 2;
  }

  return score;
}
