const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateBMR({ weight, height, age, gender }) {
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calculateTDEE(bmr, activityLevel = "moderate") {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.55));
}

export function getDailyCalorieTarget(tdee, goal) {
  if (goal === "lose") return Math.round(tdee - 500);
  if (goal === "gain") return Math.round(tdee + 400);
  return tdee;
}

export function getMacroSplit(calories, goal) {
  if (goal === "lose") {
    return {
      protein: Math.round((calories * 0.35) / 4),
      carbs: Math.round((calories * 0.35) / 4),
      fat: Math.round((calories * 0.30) / 9),
    };
  }
  if (goal === "gain") {
    return {
      protein: Math.round((calories * 0.30) / 4),
      carbs: Math.round((calories * 0.45) / 4),
      fat: Math.round((calories * 0.25) / 9),
    };
  }
  return {
    protein: Math.round((calories * 0.30) / 4),
    carbs: Math.round((calories * 0.40) / 4),
    fat: Math.round((calories * 0.30) / 9),
  };
}

export function checkGoalRealism({ goal, period }) {
  if (goal === "only_training") {
    return { realistic: true, messageKey: "realism.train", params: {} };
  }

  const weeks = period * 4.33;

  if (goal === "lose") {
    const maxSafeLoss = weeks * 1;
    const minSafeLoss = weeks * 0.5;
    return {
      realistic: true,
      safeRange: { min: Math.round(minSafeLoss), max: Math.round(maxSafeLoss) },
      messageKey: "realism.lose",
      params: { period, min: Math.round(minSafeLoss), max: Math.round(maxSafeLoss), rec: Math.round((minSafeLoss + maxSafeLoss) / 2) },
    };
  }

  if (goal === "gain") {
    const maxMuscle = weeks * 0.125;
    return {
      realistic: true,
      safeRange: { min: 0, max: Math.round(maxMuscle * 10) / 10 },
      messageKey: "realism.gain",
      params: { period, amount: Math.round(maxMuscle * 10) / 10 },
    };
  }

  return { realistic: true, messageKey: "", params: {} };
}

export function getUserPlanSummary(userGoal) {
  if (!userGoal) return null;

  const bmr = calculateBMR(userGoal);
  const tdee = calculateTDEE(bmr, userGoal.activityLevel);
  const calories = getDailyCalorieTarget(tdee, userGoal.goal);
  const macros = getMacroSplit(calories, userGoal.goal);
  const realism = checkGoalRealism(userGoal);

  return { bmr: Math.round(bmr), tdee, calories, macros, realism };
}
