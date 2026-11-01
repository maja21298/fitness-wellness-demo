import { TEMPLATES, FOCUS_MAP } from "../../data/plans/templates";
import { createWorkoutRng } from "./rng";
import { pickExercises } from "./selectors";
import { applyWorkoutAdjustments, enrichExercisesForLocation } from "./adjustments";

export function generateWorkoutPlan({ goal = "only_training", experience = "beginner", location = "gym", seed = null } = {}) {
  const template = TEMPLATES[goal]?.[experience] || TEMPLATES.only_training.beginner;
  const homeOnly = location === "home";
  const plan = {};

  for (const dayTemplate of template) {
    const rng = seed != null ? createWorkoutRng(`${seed}:${dayTemplate.day}`) : Math.random;
    const usedNames = new Set();
    const exercises = [];

    for (let i = 0; i < dayTemplate.groups.length; i += 1) {
      exercises.push(
        ...pickExercises(dayTemplate.groups[i], dayTemplate.count[i], {
          usedNames,
          homeOnly,
          rng,
          experience,
          goal,
          existingExercises: exercises,
        }),
      );
    }

    plan[dayTemplate.day] = {
      focus: dayTemplate.focus,
      exercises: enrichExercisesForLocation(exercises, location),
    };
  }

  return plan;
}

export function generateDayPlan({ goal = "only_training", experience = "beginner", location = "gym", dayName, seed = "day" }) {
  const template = TEMPLATES[goal]?.[experience] || TEMPLATES.only_training.beginner;
  const dayTemplate = template.find((day) => day.day === dayName);
  if (!dayTemplate) return { focus: "Rest Day", exercises: [] };

  const homeOnly = location === "home";
  const rng = createWorkoutRng(`${seed}|${dayName}|${location}`);
  const usedNames = new Set();
  const exercises = [];

  for (let i = 0; i < dayTemplate.groups.length; i += 1) {
    exercises.push(
      ...pickExercises(dayTemplate.groups[i], dayTemplate.count[i], {
        usedNames,
        homeOnly,
        rng,
        experience,
        goal,
        existingExercises: exercises,
      }),
    );
  }

  return {
    focus: dayTemplate.focus,
    exercises: enrichExercisesForLocation(exercises, location),
  };
}

export function resolveWorkoutDayForDate({
  dayName,
  isoDate,
  weeklyPlan,
  planLocation = "gym",
  dayLocations = {},
  dayAdjustments = {},
  pauseWindow = null,
  goal = "only_training",
  experience = "beginner",
  focusAreas = null,
  seedPrefix = "p",
}) {
  const effectiveLoc = dayLocations[isoDate] ?? planLocation ?? "gym";
  const baseLoc = planLocation || "gym";
  const savedDay = weeklyPlan?.[dayName];
  const useSaved = savedDay && effectiveLoc === baseLoc;

  if (useSaved) {
    return applyWorkoutAdjustments({ ...savedDay }, {
      isoDate,
      effectiveLoc,
      dayAdjustments,
      pauseWindow,
    });
  }

  const seed = `${seedPrefix}|${isoDate}|${effectiveLoc}`;
  if (focusAreas?.length) {
    const full = generateFocusedPlan({ goal, experience, location: effectiveLoc, focusAreas, seed });
    return applyWorkoutAdjustments({ ...full[dayName] }, {
      isoDate,
      effectiveLoc,
      dayAdjustments,
      pauseWindow,
    });
  }

  const generated = generateDayPlan({ goal, experience, location: effectiveLoc, dayName, seed });
  return applyWorkoutAdjustments({ ...generated }, {
    isoDate,
    effectiveLoc,
    dayAdjustments,
    pauseWindow,
  });
}

export function generateFocusedPlan({ goal = "only_training", experience = "beginner", location = "gym", focusAreas = [], seed = null } = {}) {
  if (!focusAreas.length) return generateWorkoutPlan({ goal, experience, location, seed });

  const homeOnly = location === "home";
  const focusGroups = [...new Set(focusAreas.flatMap((area) => FOCUS_MAP[area] || [area]))];
  const allGroups = [...new Set([...focusGroups, "cardio", "core"])];
  const plan = {};
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const trainingDays = experience === "beginner" ? 4 : experience === "intermediate" ? 5 : 6;
  const restDays = new Set();
  if (trainingDays <= 4) {
    restDays.add("Wednesday");
    restDays.add("Sunday");
    if (trainingDays === 4) restDays.add("Saturday");
  } else if (trainingDays === 5) {
    restDays.add("Sunday");
    restDays.add("Wednesday");
  } else {
    restDays.add("Sunday");
  }

  let dayIdx = 0;
  for (const day of days) {
    if (restDays.has(day)) {
      plan[day] = { focus: "Rest Day", exercises: [] };
      continue;
    }

    const rng = seed != null ? createWorkoutRng(`${seed}:${day}`) : Math.random;
    const usedNames = new Set();
    const exercises = [];
    const mainGroup = focusGroups[dayIdx % focusGroups.length];
    const focusLabel = mainGroup.charAt(0).toUpperCase() + mainGroup.slice(1);

    exercises.push(...pickExercises(mainGroup, experience === "beginner" ? 3 : 4, {
      usedNames,
      homeOnly,
      rng,
      experience,
      goal,
      existingExercises: exercises,
    }));

    const secondaryOptions = allGroups.filter((group) => group !== mainGroup);
    const secondaryGroup = secondaryOptions[dayIdx % secondaryOptions.length] || "core";
    exercises.push(...pickExercises(secondaryGroup, 2, {
      usedNames,
      homeOnly,
      rng,
      experience,
      goal,
      existingExercises: exercises,
    }));

    if (goal === "lose") {
      exercises.push(...pickExercises("cardio", 1, {
        usedNames,
        homeOnly,
        rng,
        experience,
        goal,
        existingExercises: exercises,
      }));
    }

    plan[day] = {
      focus: `${focusLabel} Focus`,
      exercises: enrichExercisesForLocation(exercises, location),
    };
    dayIdx += 1;
  }

  return plan;
}

export function redistributeSkippedDay(plan, skippedDay) {
  const skippedData = plan[skippedDay];
  if (!skippedData || skippedData.exercises.length === 0) return plan;

  const days = Object.keys(plan);
  const skippedIdx = days.indexOf(skippedDay);
  if (skippedIdx === -1) return plan;

  const targetDays = [];
  for (let offset = 1; offset <= 3; offset += 1) {
    const idx = (skippedIdx + offset) % days.length;
    const dayName = days[idx];
    if (plan[dayName].exercises.length > 0) targetDays.push(dayName);
    if (targetDays.length >= 2) break;
  }

  if (targetDays.length === 0) return plan;

  const newPlan = JSON.parse(JSON.stringify(plan));
  const skippedExercises = skippedData.exercises;

  skippedExercises.forEach((exercise, index) => {
    const target = targetDays[index % targetDays.length];
    const alreadyHas = newPlan[target].exercises.some((picked) => picked.name === exercise.name);
    if (!alreadyHas) {
      newPlan[target].exercises.push({
        ...exercise,
        note: exercise.note ? `${exercise.note} (from ${skippedDay})` : `(from ${skippedDay})`,
      });
    }
  });

  newPlan[skippedDay] = {
    focus: `${skippedData.focus} (Skipped)`,
    exercises: [],
  };

  return newPlan;
}
