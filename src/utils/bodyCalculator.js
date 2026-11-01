/**
 * Body analysis calculations based on anthropometric data.
 * Uses BMI, body fat estimation (U.S. Navy / BMI-based), somatotype
 * classification, and ideal weight ranges.
 */

export function calculateBMI(weight, height) {
  if (!height || !weight || height <= 0) return 0;
  const h = height / 100;
  return weight / (h * h);
}

export function getBMICategory(bmi) {
  if (bmi < 16) return { key: "severeThin", color: "#ef4444" };
  if (bmi < 18.5) return { key: "underweight", color: "#f59e0b" };
  if (bmi < 25) return { key: "normal", color: "#22c55e" };
  if (bmi < 30) return { key: "overweight", color: "#f59e0b" };
  if (bmi < 35) return { key: "obese1", color: "#ef4444" };
  if (bmi < 40) return { key: "obese2", color: "#dc2626" };
  return { key: "obese3", color: "#991b1b" };
}

export function estimateBodyFat({ weight, height, age, gender }) {
  const bmi = calculateBMI(weight, height);
  if (gender === "male") {
    return Math.max(0, Math.min(60, 1.20 * bmi + 0.23 * age - 16.2));
  }
  return Math.max(0, Math.min(60, 1.20 * bmi + 0.23 * age - 5.4));
}

export function getSomatotype({ weight, height, gender, bodyFat }) {
  const bmi = calculateBMI(weight, height);

  const endo = bodyFat > (gender === "male" ? 25 : 32) ? "high" : bodyFat > (gender === "male" ? 15 : 22) ? "mid" : "low";
  const meso = bmi >= 22 && bmi <= 27 && endo !== "high" ? "high" : bmi >= 20 ? "mid" : "low";
  const ecto = bmi < 20 ? "high" : bmi < 23 ? "mid" : "low";

  if (endo === "high") return "endomorph";
  if (ecto === "high" && meso !== "high") return "ectomorph";
  if (meso === "high") return "mesomorph";
  if (ecto === "mid" && meso === "mid") return "ecto-mesomorph";
  if (endo === "mid" && meso === "mid") return "endo-mesomorph";
  return "mesomorph";
}

export function getIdealWeightRange(height, gender) {
  const h = height / 100;
  const low = gender === "male" ? 20 * h * h : 19 * h * h;
  const high = gender === "male" ? 25 * h * h : 24 * h * h;
  return { min: Math.round(low), max: Math.round(high) };
}

export function getLeanMassAndFatMass(weight, bodyFat) {
  const fatMass = weight * (bodyFat / 100);
  const leanMass = weight - fatMass;
  return { leanMass: Math.round(leanMass * 10) / 10, fatMass: Math.round(fatMass * 10) / 10 };
}

export function getWaistToHeightRatio(waist, height) {
  if (!waist || !height) return null;
  return waist / height;
}

const BODY_SHAPES = {
  female: [
    { id: "hourglass", labelKey: "body.hourglass", desc: "body.hourglassDesc", targetBF: [18, 24], silhouette: "hourglass" },
    { id: "athletic", labelKey: "body.athletic", desc: "body.athleticDesc", targetBF: [16, 22], silhouette: "athletic" },
    { id: "slim", labelKey: "body.slim", desc: "body.slimDesc", targetBF: [18, 22], silhouette: "slim" },
    { id: "toned", labelKey: "body.toned", desc: "body.tonedDesc", targetBF: [20, 25], silhouette: "toned" },
    { id: "curvy", labelKey: "body.curvy", desc: "body.curvyDesc", targetBF: [24, 30], silhouette: "curvy" },
  ],
  male: [
    { id: "athletic", labelKey: "body.athletic", desc: "body.athleticDesc", targetBF: [8, 14], silhouette: "athletic" },
    { id: "muscular", labelKey: "body.muscular", desc: "body.muscularDesc", targetBF: [10, 16], silhouette: "muscular" },
    { id: "lean", labelKey: "body.lean", desc: "body.leanDesc", targetBF: [8, 12], silhouette: "lean" },
    { id: "average", labelKey: "body.average", desc: "body.averageDesc", targetBF: [14, 20], silhouette: "average" },
    { id: "bulky", labelKey: "body.bulky", desc: "body.bulkyDesc", targetBF: [16, 22], silhouette: "bulky" },
  ],
};

export function getAvailableShapes(gender) {
  return BODY_SHAPES[gender] || BODY_SHAPES.female;
}

export function guessCurrentShape(gender, bodyFat, somatotype) {
  const shapes = getAvailableShapes(gender);
  let best = null;
  let bestDist = Infinity;
  for (const s of shapes) {
    const mid = (s.targetBF[0] + s.targetBF[1]) / 2;
    let dist = Math.abs((bodyFat || 22) - mid);
    if (somatotype === "ectomorph" && (s.id === "slim" || s.id === "lean")) dist -= 3;
    if (somatotype === "mesomorph" && (s.id === "athletic" || s.id === "toned" || s.id === "muscular")) dist -= 3;
    if (somatotype === "endomorph" && (s.id === "curvy" || s.id === "average" || s.id === "bulky")) dist -= 3;
    if (dist < bestDist) { bestDist = dist; best = s; }
  }
  return best?.silhouette || null;
}

export function assessGoalShape(currentStats, targetShapeId) {
  const shapes = getAvailableShapes(currentStats.gender);
  const target = shapes.find((s) => s.id === targetShapeId);
  if (!target) return null;

  const currentBF = estimateBodyFat(currentStats);
  const [targetBFLow, targetBFHigh] = target.targetBF;
  const targetBFMid = (targetBFLow + targetBFHigh) / 2;

  const bfDiff = currentBF - targetBFMid;
  const idealRange = getIdealWeightRange(currentStats.height, currentStats.gender);

  const currentLean = currentStats.weight * (1 - currentBF / 100);
  const targetWeight = currentLean / (1 - targetBFMid / 100);

  const weightChange = targetWeight - currentStats.weight;
  const weeksNeeded = Math.abs(weightChange) / (currentStats.gender === "male" ? 0.7 : 0.5);
  const monthsNeeded = Math.max(1, Math.ceil(weeksNeeded / 4.33));

  let difficulty;
  if (Math.abs(bfDiff) < 3) difficulty = "easy";
  else if (Math.abs(bfDiff) < 8) difficulty = "moderate";
  else if (Math.abs(bfDiff) < 15) difficulty = "challenging";
  else difficulty = "veryHard";

  return {
    targetShape: target,
    currentBodyFat: Math.round(currentBF * 10) / 10,
    targetBodyFat: targetBFMid,
    targetBodyFatRange: target.targetBF,
    estimatedTargetWeight: Math.round(targetWeight * 10) / 10,
    weightChange: Math.round(weightChange * 10) / 10,
    estimatedMonths: monthsNeeded,
    difficulty,
    withinIdealRange: targetWeight >= idealRange.min && targetWeight <= idealRange.max,
    idealRange,
  };
}

export function getFullBodyAnalysis(userGoal) {
  if (!userGoal) return null;
  const { weight, height, age, gender } = userGoal;
  if (!weight || !height || !age) return null;

  const bmi = calculateBMI(weight, height);
  const bmiCategory = getBMICategory(bmi);
  const bodyFat = estimateBodyFat({ weight, height, age, gender });
  const somatotype = getSomatotype({ weight, height, gender, bodyFat });
  const idealRange = getIdealWeightRange(height, gender);
  const { leanMass, fatMass } = getLeanMassAndFatMass(weight, bodyFat);

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmiCategory,
    bodyFat: Math.round(bodyFat * 10) / 10,
    somatotype,
    idealRange,
    leanMass,
    fatMass,
    height,
    weight,
    age,
    gender,
  };
}
