import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, setDoc, getDoc, getDocs, deleteField, collection } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { useToast } from "../components/common/Toast";
import { generateWorkoutPlan, generateFocusedPlan } from "../lib/workout/generators";
import { getUserPlanSummary } from "../utils/planEngine";
import {
  getFullBodyAnalysis,
  assessGoalShape,
  guessCurrentShape,
} from "../utils/bodyCalculator";
import { analyzeBody } from "../services/geminiService";
import { fileToJpegBase64ForApi } from "../utils/imagePrepare";
import PremiumGate from "../components/common/PremiumGate";
import MobilePageHeader from "../components/layout/MobilePageHeader";
import BodyShapeIllustration from "../components/body/BodyShapeIllustration";
import {
  HiCamera,
  HiArrowPath,
  HiSparkles,
  HiFire,
  HiArrowTrendingUp,
  HiCheck,
  HiChevronRight,
  HiAdjustmentsHorizontal,
  HiBookmark,
  HiBeaker,
  HiCalendarDays,
  HiChartBar,
  HiInformationCircle,
  HiScale,
  HiUserCircle,
} from "react-icons/hi2";

const FOCUS_AREAS = [
  { id: "chest", icon: "\u{2764}\u{FE0F}", labelKey: "body.focus.chest" },
  { id: "back", icon: "\u{1F519}", labelKey: "body.focus.back" },
  { id: "shoulders", icon: "\u{1F7E6}", labelKey: "body.focus.shoulders" },
  { id: "arms", icon: "\u{1F4AA}", labelKey: "body.focus.arms" },
  { id: "legs", icon: "\u{1F9B5}", labelKey: "body.focus.legs" },
  { id: "glutes", icon: "\u{1F351}", labelKey: "body.focus.glutes" },
  { id: "core", icon: "\u{1F3AF}", labelKey: "body.focus.core" },
  { id: "fullBody", icon: "\u{1F9CD}", labelKey: "body.focus.fullBody" },
];

const PHYSIQUE_GOALS = [
  { id: "moreMuscle", icon: "\u{1F4AA}" },
  { id: "fullerFigure", icon: "\u{1F4C8}" },
  { id: "leanDefined", icon: "\u{2728}" },
  { id: "moreCurves", icon: "\u{1F351}" },
  { id: "biggerLowerBody", icon: "\u{1F9B5}" },
  { id: "strongUpperBody", icon: "\u{1F6E1}\u{FE0F}" },
  { id: "balancedShape", icon: "\u{2696}\u{FE0F}" },
];

const TRAINING_PRIORITY_IDS = [
  "massGain",
  "tooSkinny",
  "curvesShape",
  "lowerBody",
  "upperBody",
  "corePosture",
  "fatLoss",
  "definition",
  "recomposition",
  "generalBalance",
];

function resolveGoalTabMode({ customPlanChoice, selectedCustomPlanChoice, selectedCustomPlanPreset, goalAssessment }) {
  if (customPlanChoice && selectedCustomPlanChoice && selectedCustomPlanPreset) return "custom";
  if (goalAssessment) return "recommended";
  return "default";
}

function formatDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  if (!dateKey) return null;
  const d = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getStartOfWeekDate(date = new Date()) {
  const d = new Date(date);
  const dayIndex = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayIndex);
  d.setHours(12, 0, 0, 0);
  return d;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sumFoodLogTotals(foodLog) {
  return (Array.isArray(foodLog) ? foodLog : []).reduce((totals, item) => {
    totals.calories += Number(item?.calories ?? item?.estimatedCalories ?? item?.cal ?? 0) || 0;
    totals.protein += Number(item?.protein ?? item?.estimatedProtein ?? 0) || 0;
    totals.carbs += Number(item?.carbs ?? item?.estimatedCarbs ?? 0) || 0;
    totals.fat += Number(item?.fat ?? item?.estimatedFat ?? 0) || 0;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function countPlannedWorkoutDays(weeklyPlan) {
  if (!weeklyPlan || typeof weeklyPlan !== "object") return null;
  const plannedDays = Object.values(weeklyPlan).filter((dayPlan) => Array.isArray(dayPlan?.exercises) && dayPlan.exercises.length > 0);
  return plannedDays.length > 0 ? plannedDays.length : null;
}

function getFriendlyDaysAgoLabel(daysAgo, language) {
  if (daysAgo == null) return language === "hr" ? "Još nije napravljen" : "Not done yet";
  if (daysAgo <= 0) return language === "hr" ? "Danas" : "Today";
  if (daysAgo === 1) return language === "hr" ? "Prije 1 dan" : "1 day ago";
  return language === "hr" ? `Prije ${daysAgo} dana` : `${daysAgo} days ago`;
}

function isFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric);
}

function formatKgValue(value) {
  return isFiniteNumber(value) ? `${Math.round(value * 10) / 10} kg` : null;
}

function formatKgTrend(value) {
  if (!isFiniteNumber(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded} kg u 7 dana`;
}

function calculateGoalProgress({
  language,
  goalTabMode,
  userGoal,
  goalAssessment,
  savedAnalysisDoc,
  savedPlanDoc,
  progressDailyDocs,
  hasAiAnalysis,
  bodyTypeGuide,
  shapeDirectionGuide,
  selectedCustomPlanChoice,
  customizationPreview,
}) {
  const isHr = language === "hr";
  const normalizedGoal = normalizeGoalMode(userGoal?.goal);
  const planSummary = getUserPlanSummary(userGoal) || {};
  const todayKey = formatDateKey(new Date());
  const todayEntry = (Array.isArray(progressDailyDocs) ? progressDailyDocs : []).find((entry) => entry.id === todayKey) || null;
  const dailyEntries = (Array.isArray(progressDailyDocs) ? progressDailyDocs : [])
    .map((entry) => ({
      ...entry,
      parsedDate: parseDateKey(entry.id),
      weight: Number(entry?.weight),
      caloriesConsumed: Number(entry?.caloriesConsumed),
      plannedNutritionCalories: Number(entry?.plannedNutritionCalories),
      plannedNutritionProtein: Number(entry?.plannedNutritionProtein),
      workoutCompleted: Boolean(entry?.workoutCompleted),
      workoutSkipped: Boolean(entry?.workoutSkipped),
      foodTotals: sumFoodLogTotals(entry?.foodLog),
    }))
    .filter((entry) => entry.parsedDate);

  const weekStart = getStartOfWeekDate(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekEntries = dailyEntries.filter((entry) => entry.parsedDate >= weekStart && entry.parsedDate <= weekEnd);

  const weightEntries = dailyEntries
    .filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0)
    .sort((a, b) => a.parsedDate - b.parsedDate);
  const latestWeightEntry = weightEntries[weightEntries.length - 1] || null;
  const latestLoggedWeight = isFiniteNumber(latestWeightEntry?.weight) ? latestWeightEntry.weight : null;
  const hasLoggedWeight = latestLoggedWeight != null;
  const latestWeight = isFiniteNumber(latestWeightEntry?.weight)
    ? latestWeightEntry.weight
    : (isFiniteNumber(Number(userGoal?.weight)) ? Number(userGoal.weight) : null);
  const weightTrendWindow = weightEntries.slice(-7);
  const hasReliableWeightTrend = weightTrendWindow.length >= 3 && isFiniteNumber(weightTrendWindow[weightTrendWindow.length - 1]?.weight) && isFiniteNumber(weightTrendWindow[0]?.weight)
    && weightTrendWindow.every((entry) => isFiniteNumber(entry?.weight));
  const weightTrendKg = hasReliableWeightTrend
    ? Math.round((weightTrendWindow[weightTrendWindow.length - 1].weight - weightTrendWindow[0].weight) * 10) / 10
    : null;

  const todayCaloriesFromLog = todayEntry?.foodTotals?.calories || 0;
  const caloriesConsumedToday = Number.isFinite(todayEntry?.caloriesConsumed) && todayEntry.caloriesConsumed > 0
    ? Math.round(todayEntry.caloriesConsumed)
    : Math.round(todayCaloriesFromLog);
  const plannedCaloriesToday = Number.isFinite(todayEntry?.plannedNutritionCalories) && todayEntry.plannedNutritionCalories > 0
    ? Math.round(todayEntry.plannedNutritionCalories)
    : Number.isFinite(savedPlanDoc?.nutrition?.dailyCalorieTarget) && savedPlanDoc.nutrition.dailyCalorieTarget > 0
      ? Math.round(savedPlanDoc.nutrition.dailyCalorieTarget)
      : Number.isFinite(planSummary?.calories) && planSummary.calories > 0
        ? Math.round(planSummary.calories)
        : null;

  const actualProteinToday = Math.round(todayEntry?.foodTotals?.protein || 0);
  const plannedProteinToday = Number.isFinite(todayEntry?.plannedNutritionProtein) && todayEntry.plannedNutritionProtein > 0
    ? Math.round(todayEntry.plannedNutritionProtein)
    : Number.isFinite(savedPlanDoc?.nutrition?.macros?.protein) && savedPlanDoc.nutrition.macros.protein > 0
      ? Math.round(savedPlanDoc.nutrition.macros.protein)
      : Number.isFinite(planSummary?.macros?.protein) && planSummary.macros.protein > 0
        ? Math.round(planSummary.macros.protein)
        : null;

  const completedThisWeek = weekEntries.filter((entry) => entry.workoutCompleted).length;
  const skippedThisWeek = weekEntries.filter((entry) => entry.workoutSkipped).length;
  const plannedWorkoutsThisWeek = countPlannedWorkoutDays(savedPlanDoc?.workout?.weeklyPlan);

  const weeklyActivities = weekEntries.flatMap((entry) => (Array.isArray(entry.extraActivities) ? entry.extraActivities : []));
  const extraActivitiesCount = weeklyActivities.length;
  const extraActivitiesMinutes = weeklyActivities.reduce((sum, item) => {
    const duration = String(item?.duration || "");
    const match = duration.match(/(\d+)(?:\s*-\s*(\d+))?/);
    if (!match) return sum;
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    return sum + Math.round((start + end) / 2);
  }, 0);
  const extraActivitiesCalories = weeklyActivities.reduce((sum, item) => sum + Math.round(Number(item?.estimatedCalories) || 0), 0);

  const latestCheckInRaw = savedAnalysisDoc?.latest?.date || null;
  const latestCheckInDate = latestCheckInRaw ? new Date(latestCheckInRaw) : null;
  const checkInAgeDays = latestCheckInDate && !Number.isNaN(latestCheckInDate.getTime())
    ? Math.max(0, Math.floor((Date.now() - latestCheckInDate.getTime()) / 86400000))
    : null;

  const targetWeight = Number.isFinite(goalAssessment?.estimatedTargetWeight) && goalAssessment.estimatedTargetWeight > 0
    ? Number(goalAssessment.estimatedTargetWeight)
    : null;

  const enoughSignals = [
    hasLoggedWeight,
    caloriesConsumedToday > 0,
    actualProteinToday > 0,
    completedThisWeek > 0 || skippedThisWeek > 0,
    extraActivitiesCount > 0,
    checkInAgeDays != null,
  ].filter(Boolean).length;

  const weightScore = (() => {
    if (!hasLoggedWeight) return 0;
    if (!hasReliableWeightTrend) return 4;

    const trendGood = normalizedGoal === "gain"
      ? weightTrendKg > 0
      : normalizedGoal === "lose"
        ? weightTrendKg < 0
        : Math.abs(weightTrendKg) <= 0.5;
    const targetClose = targetWeight != null && Number.isFinite(targetWeight)
      ? Math.abs(latestLoggedWeight - targetWeight)
      : null;

    if (targetClose != null) {
      const closeness = targetClose <= 0.5 ? 14 : targetClose <= 1.5 ? 11 : targetClose <= 3 ? 8 : 4;
      const trendBonus = trendGood ? 7 : 2;
      return clampNumber(closeness + trendBonus, 0, 25);
    }

    if (normalizedGoal === "gain") return clampNumber(weightTrendKg > 0 ? 14 + Math.min(6, Math.abs(weightTrendKg) * 3) : 5, 0, 25);
    if (normalizedGoal === "lose") return clampNumber(weightTrendKg < 0 ? 14 + Math.min(6, Math.abs(weightTrendKg) * 3) : 5, 0, 25);
    return clampNumber(Math.abs(weightTrendKg) <= 0.5 ? 14 : Math.abs(weightTrendKg) <= 1.5 ? 10 : 6, 0, 25);
  })();

  const nutritionScore = (() => {
    if (plannedCaloriesToday == null && caloriesConsumedToday <= 0) return 0;
    if (plannedCaloriesToday == null || caloriesConsumedToday <= 0) return 8;
    const ratio = caloriesConsumedToday / plannedCaloriesToday;
    const deviation = Math.abs(1 - ratio);
    if (deviation <= 0.05) return 25;
    if (deviation <= 0.1) return 22;
    if (deviation <= 0.15) return 18;
    if (deviation <= 0.25) return 12;
    if (deviation <= 0.35) return 7;
    return 3;
  })();

  const proteinScore = (() => {
    if (plannedProteinToday == null && actualProteinToday <= 0) return 0;
    if (plannedProteinToday == null || actualProteinToday <= 0) return 5;
    const ratio = actualProteinToday / plannedProteinToday;
    if (ratio >= 0.95) return 15;
    if (ratio >= 0.85) return 13;
    if (ratio >= 0.7) return 10;
    if (ratio >= 0.5) return 7;
    return 3;
  })();

  const trainingScore = (() => {
    const trainingDataPresent = plannedWorkoutsThisWeek != null || completedThisWeek > 0 || skippedThisWeek > 0;
    if (!trainingDataPresent) return 0;
    if (plannedWorkoutsThisWeek != null && plannedWorkoutsThisWeek > 0) {
      const adherence = completedThisWeek / plannedWorkoutsThisWeek;
      const base = adherence >= 1 ? 20 : Math.round(adherence * 20);
      const skipPenalty = Math.min(6, skippedThisWeek * 2);
      return clampNumber(base - skipPenalty, 0, 20);
    }
    return clampNumber(completedThisWeek * 5 - skippedThisWeek * 3, 0, 20);
  })();

  const activityScore = (() => {
    if (!extraActivitiesCount && !extraActivitiesMinutes && !extraActivitiesCalories) return 0;
    let score = 0;
    score += Math.min(4, extraActivitiesCount * 2);
    score += Math.min(4, Math.round(extraActivitiesMinutes / 20));
    if (!extraActivitiesMinutes && extraActivitiesCalories > 0) {
      score += Math.min(4, Math.round(extraActivitiesCalories / 80));
    }
    return clampNumber(score, 0, 8);
  })();

  const checkInScore = (() => {
    if (checkInAgeDays == null) return 0;
    if (checkInAgeDays <= 3) return 7;
    if (checkInAgeDays <= 7) return 6;
    if (checkInAgeDays <= 14) return 5;
    if (checkInAgeDays <= 21) return 4;
    if (checkInAgeDays <= 30) return 2;
    return 1;
  })();

  const rawScore = weightScore + nutritionScore + proteinScore + trainingScore + activityScore + checkInScore;
  const sparseData = caloriesConsumedToday <= 0 && actualProteinToday <= 0 && completedThisWeek === 0 && extraActivitiesCount === 0;
  const insufficientData = enoughSignals < 2 || (!hasLoggedWeight && sparseData);
  const score = insufficientData
    ? clampNumber(15 + Math.min(10, (hasLoggedWeight ? 3 : 0) + (checkInAgeDays != null ? 2 : 0)), 15, 25)
    : clampNumber(Math.round(rawScore), 0, 100);

  const status = insufficientData
    ? "steady"
    : score >= 70
      ? "growing"
      : score < 40
        ? "needsAttention"
        : "steady";

  const statusMessage = insufficientData
    ? (isHr
      ? "Još skupljamo dovoljno podataka za precizniji prikaz."
      : "We are still collecting enough data for a clearer picture.")
    : sparseData
      ? (isHr
        ? "Dodaj obroke i odradi prvi trening da tracker može bolje procijeniti smjer."
        : "Add meals and complete your first workout so the tracker can judge the direction better.")
      : status === "growing"
      ? (normalizedGoal === "gain"
        ? (isHr ? "Smjer je dobar: unos, trening i trend težine rade za tvoj cilj." : "You are on a good track: intake, training, and weight trend are working for you.")
        : normalizedGoal === "lose"
          ? (isHr ? "Napredak ide u dobrom smjeru i trend podržava cilj." : "You are moving in the right direction and the trend supports the goal.")
          : (isHr ? "Ritam je stabilan i napredak izgleda dosljedno." : "Your rhythm is steady and progress looks consistent."))
      : status === "needsAttention"
        ? (isHr
          ? "Trenutno neki signali idu suprotno cilju, pa tracker mirno označava da treba malo pažnje."
          : "Some signals are currently going against the goal, so this tracker is gently flagging it for attention.")
        : (isHr
          ? "Napredak je stabilan, a tracker još čeka nekoliko podataka za precizniji prikaz."
          : "Progress is steady, and the tracker is waiting for a few more data points for a clearer picture.");

  const targetModeLabel = goalTabMode === "custom"
    ? (selectedCustomPlanChoice?.label || customizationPreview.desiredDirection || getGoalModeLabel(normalizedGoal, language))
    : goalTabMode === "recommended"
      ? (hasAiAnalysis
        ? (goalAssessment?.targetShape?.id ? shapeDirectionGuide.direction : shapeDirectionGuide.direction)
        : getGoalModeLabel(normalizedGoal, language))
      : getGoalModeLabel(normalizedGoal, language);

  const currentLabel = latestWeight != null
    ? `${Math.round(latestWeight * 10) / 10} kg`
    : (isHr ? "Profil" : "Profile");

  const currentMeta = hasAiAnalysis
    ? (goalAssessment?.targetShape?.id
      ? `${bodyTypeGuide.title} · ${shapeDirectionGuide.current}`
      : bodyTypeGuide.title)
    : (isHr
      ? `Visina ${userGoal?.height || "-"} cm · cilj ${getGoalModeLabel(normalizedGoal, language).toLowerCase()}`
      : `Height ${userGoal?.height || "-"} cm · goal ${getGoalModeLabel(normalizedGoal, language).toLowerCase()}`);

  const targetLabel = (() => {
    if (goalTabMode === "custom") return selectedCustomPlanChoice?.label || customizationPreview.desiredDirection;
    if (goalTabMode === "recommended" && hasAiAnalysis) {
      if (goalAssessment?.estimatedTargetWeight) {
        return `${Math.round(goalAssessment.estimatedTargetWeight * 10) / 10} kg`;
      }
      return shapeDirectionGuide.direction;
    }
    return getGoalModeLabel(normalizedGoal, language);
  })();

  const targetMeta = (() => {
    if (goalTabMode === "custom") return customizationPreview.desiredFocus;
    if (goalTabMode === "recommended" && hasAiAnalysis) {
      if (goalAssessment?.estimatedTargetWeight) {
        return isHr
          ? `Cilj prema zadnjoj analizi: ${Math.round(goalAssessment.estimatedTargetWeight * 10) / 10} kg`
          : `Target from the latest analysis: ${Math.round(goalAssessment.estimatedTargetWeight * 10) / 10} kg`;
      }
      return shapeDirectionGuide.focus;
    }
    return isHr
      ? "Plan ide prema tvojoj težini, visini, cilju i dnevnim unosima."
      : "The plan follows your weight, height, goal, and daily intake.";
  })();

  const metricCards = [
    {
      id: "weight",
      label: isHr ? "Težina" : "Weight",
      value: formatKgValue(latestWeight) || (isHr ? "Nema zapisa" : "No entries"),
      detail: weightTrendKg != null
        ? `${formatKgTrend(weightTrendKg)}${targetWeight != null && isFiniteNumber(targetWeight) ? ` · cilj ${Math.round(targetWeight * 10) / 10} kg` : ""}`
        : (isHr ? "Treba još nekoliko unosa za trend." : "We need a few more entries for a trend."),
      score: weightScore,
      tone: "violet",
      visible: true,
    },
    {
      id: "calories",
      label: isHr ? "Kalorije" : "Calories",
      value: caloriesConsumedToday > 0
        ? (plannedCaloriesToday
          ? `${caloriesConsumedToday} / ${plannedCaloriesToday} kcal`
          : `${caloriesConsumedToday} kcal`)
        : (isHr ? "Nema današnjeg unosa" : "No intake logged today"),
      detail: caloriesConsumedToday > 0 && plannedCaloriesToday
        ? (isHr ? "Danas si blizu kalorijskog cilja." : "You are close to the calorie target today.")
        : caloriesConsumedToday > 0
          ? (isHr ? "Danas imamo unos, a cilj kalorija još nije spremljen." : "Today’s intake is logged, but the calorie target has not been saved yet.")
          : (isHr ? "Dodaj obrok da tracker može usporediti unos s ciljem." : "Add a meal so the tracker can compare intake with the goal."),
      score: nutritionScore,
      tone: "rose",
      visible: true,
    },
    {
      id: "protein",
      label: isHr ? "Protein" : "Protein",
      value: actualProteinToday > 0
        ? (plannedProteinToday
          ? `${actualProteinToday} / ${plannedProteinToday} g`
          : `${actualProteinToday} g`)
        : (plannedProteinToday ? (isHr ? "Još nema potvrde" : "No confirmation yet") : null),
      detail: actualProteinToday > 0 && plannedProteinToday
        ? (isHr ? "Protein pomaže oporavku i gradnji." : "Protein helps with recovery and building.")
        : actualProteinToday > 0
          ? (isHr ? "Protein je zabilježen, a cilj još čekamo." : "Protein is logged, and we are still waiting for the target.")
          : (isHr ? "Dodaj obroke s makroima da tracker može pratiti protein." : "Add meals with macros so the tracker can follow protein."),
      score: proteinScore,
      tone: "amber",
      visible: Boolean(plannedProteinToday || actualProteinToday > 0),
    },
    {
      id: "training",
      label: isHr ? "Trening" : "Training",
      value: plannedWorkoutsThisWeek != null && plannedWorkoutsThisWeek > 0
        ? `${completedThisWeek} / ${plannedWorkoutsThisWeek}${skippedThisWeek > 0 ? ` · ${skippedThisWeek} ${isHr ? "preskočeno" : "skipped"}` : ""}`
        : completedThisWeek > 0 || skippedThisWeek > 0
          ? `${completedThisWeek} ${isHr ? "odrađeno" : "done"}${skippedThisWeek > 0 ? ` · ${skippedThisWeek} ${isHr ? "preskočeno" : "skipped"}` : ""}`
          : (isHr ? "Nema treninga" : "No workouts"),
      detail: plannedWorkoutsThisWeek != null && plannedWorkoutsThisWeek > 0
        ? (completedThisWeek === 0
          ? (isHr ? "Još nema odrađenih treninga ovaj tjedan." : "There are no completed workouts yet this week.")
          : plannedWorkoutsThisWeek - completedThisWeek <= 1
            ? (isHr ? "Trening ovaj tjedan ide u dobrom smjeru." : "Training this week is moving in a good direction.")
            : (isHr ? "Dobar početak, nastavi graditi ritam." : "A good start, keep building your rhythm."))
        : (completedThisWeek === 0
          ? (isHr ? "Još nema odrađenih treninga ovaj tjedan." : "There are no completed workouts yet this week.")
          : (isHr ? "Dobar početak, nastavi graditi ritam." : "A good start, keep building your rhythm.")),
      score: trainingScore,
      tone: "sky",
      visible: true,
    },
    {
      id: "activity",
      label: isHr ? "Aktivnosti" : "Activities",
      value: extraActivitiesCount > 0
        ? `${extraActivitiesCount}${extraActivitiesMinutes > 0 ? ` · ${extraActivitiesMinutes} min` : ""}`
        : (isHr ? "0 aktivnosti" : "0 activities"),
      detail: extraActivitiesCalories > 0
        ? `${extraActivitiesCalories} ${isHr ? "procj. kcal" : "est. kcal"}`
        : (isHr ? "Dodatne aktivnosti još nisu unesene." : "Extra activities are not logged yet."),
      score: activityScore,
      tone: "emerald",
      visible: true,
    },
    {
      id: "checkIn",
      label: isHr ? "Check-in" : "Check-in",
      value: getFriendlyDaysAgoLabel(checkInAgeDays, language),
      detail: checkInAgeDays != null
        ? (isHr ? "Check-in nam pomaže bolje prilagoditi plan." : "Check-ins help us adjust the plan better.")
        : (isHr ? "Check-in još nije napravljen." : "No check-in has been done yet."),
      score: checkInScore,
      tone: "violet",
      visible: true,
    },
  ].filter((card) => card.visible !== false);

  return {
    score,
    status,
    statusMessage,
    progressPercent: score,
    progressIcon: normalizedGoal === "gain"
      ? "💪"
      : normalizedGoal === "lose"
        ? "🌿"
        : "🎯",
    title: goalTabMode === "recommended"
      ? (isHr ? "Tvoj preporučeni put" : "Your recommended path")
      : goalTabMode === "custom"
        ? (isHr ? "Tvoj odabrani put" : "Your chosen path")
        : (isHr ? "Tvoj cilj" : "Your goal"),
    subtitle: goalTabMode === "recommended"
      ? (hasAiAnalysis
        ? (isHr ? "Plan prati zadnju analizu, a napredak gledamo kroz stvarne unose." : "The plan follows the latest analysis, while progress is tracked through real inputs.")
        : (isHr ? "Plan je vođen podacima iz profila i stvarnim dnevnim unosima." : "The plan is guided by profile data and real daily inputs."))
      : goalTabMode === "custom"
        ? (isHr ? "Plan prati tvoj odabrani smjer i stvarni napredak." : "The plan follows your chosen direction and real progress.")
        : (isHr ? "Plan se vodi prema tvojoj težini, visini, cilju i dnevnim unosima." : "The plan is guided by your weight, height, goal, and daily intake."),
    currentLabel,
    currentMeta,
    targetLabel,
    targetMeta,
    metricCards,
    progressBreakdown: {
      weight: weightScore,
      nutrition: nutritionScore,
      protein: proteinScore,
      training: trainingScore,
      activity: activityScore,
      checkIn: checkInScore,
    },
    enoughData: !insufficientData,
    weeklySummary: {
      completedThisWeek,
      skippedThisWeek,
      plannedWorkoutsThisWeek,
      extraActivitiesCount,
      extraActivitiesMinutes,
      extraActivitiesCalories,
      caloriesConsumedToday,
      plannedCaloriesToday,
      actualProteinToday,
      plannedProteinToday,
      latestCheckInDate,
      latestWeight,
      weightTrendKg,
    },
    guidanceTitle: isHr ? "Što utječe na napredak" : "What affects progress",
    guidanceBullets: [
      isHr ? "Težina i 7-dnevni trend pokazuju krećeš li se u pravom smjeru." : "Weight and the 7-day trend show whether you are moving the right way.",
      isHr ? "Kalorije i protein govore prati li unos plan." : "Calories and protein show whether intake is following the plan.",
      isHr ? "Trening i aktivnosti dižu ukupni score kad ih ima dovoljno." : "Training and activities lift the total score when they are consistent.",
      isHr ? "Check-in nam govori koliko su podaci svježi." : "Check-ins tell us how fresh the data is.",
    ],
    timelineTitle: isHr ? "Plan po tjednima" : "Plan by weeks",
    timeline: getGoalTimeline(normalizedGoal, language),
    currentHint: hasAiAnalysis
      ? (goalAssessment?.targetShape?.id ? shapeDirectionGuide.current : bodyTypeGuide.title)
      : (isHr ? "Profil + dnevni unosi" : "Profile + daily inputs"),
    targetHint: targetModeLabel,
    hasReliableWeightTrend,
  };
}

function getMetricHint(metric, language) {
  const hints = {
    bmi: {
      hr: "Brzi odnos visine i težine. Dobar je za orijentaciju, ali ne govori sve o građi tijela.",
      en: "A quick relationship between height and weight. Good for orientation, but it does not tell the whole body story.",
    },
    bodyFat: {
      hr: "Procjena udjela masnog tkiva. Korisna je uz težinu jer pokazuje više od same brojke na vagi.",
      en: "An estimate of body fat. Helpful together with weight because it shows more than the scale alone.",
    },
    bodyType: {
      hr: "Opis građe tijela. Nije stroga etiketa, nego smjernica za trening i prehranu.",
      en: "A description of your build. It is a guide for training and nutrition, not a strict label.",
    },
    idealWeight: {
      hr: "Procijenjeni raspon težine koji može biti zdrav cilj, ovisno o građi i cilju.",
      en: "An estimated weight range that can be a healthy target depending on your build and goal.",
    },
  };

  return hints[metric]?.[language === "hr" ? "hr" : "en"] || "";
}

function getBodyTypeGuide(somatotype, language) {
  const isHr = language === "hr";
  const guides = {
    ectomorph: {
      emoji: "🪶",
      title: isHr ? "Vitka, lakša građa" : "Lighter, leaner build",
      summary: isHr
        ? "Tvoja građa je obično lakša i vitkija. Često sporije gradi masu, ali može jako lijepo napredovati uz snagu i dobru prehranu."
        : "Your build is usually lighter and leaner. It may build mass more slowly, but it can still progress beautifully with strength and good nutrition.",
      highlights: isHr
        ? ["Vitka građa", "Snaga kao baza", "Lean hourglass / Athletic toned"]
        : ["Lean build", "Strength as base", "Lean hourglass / Athletic toned"],
      details: isHr
        ? "Vitka, lakša građa često teže gradi masu, ali može jako lijepo napredovati uz trening snage, dovoljno proteina i postepeno povećanje unosa hrane. To je opis građe, ne pravilo. Dobar smjer figure može biti Lean hourglass ili Athletic toned."
        : "A lighter, leaner build often builds mass more slowly, but it can still progress beautifully with strength training, enough protein, and a gradual increase in food intake. That describes your build, not a rule. A good shape direction can be Lean hourglass or Athletic toned.",
      learnMore: isHr ? "Saznaj više o svojoj građi" : "Learn more about your build",
      tips: isHr
        ? ["Građa je vitka i lakša, pa je snaga često najbolja baza.", "Dovoljno proteina i malo više hrane mogu pomoći rastu.", "Dobar smjer figure može biti Lean hourglass ili Athletic toned."]
        : ["The build is leaner and lighter, so strength is often the best base.", "Enough protein and a bit more food can support growth.", "A good shape direction can be Lean hourglass or Athletic toned."],
    },
    mesomorph: {
      emoji: "⚡",
      title: isHr ? "Uravnotežena, responzivna građa" : "Balanced, responsive build",
      summary: isHr
        ? "Tvoja građa često dobro reagira na trening i obično se lijepo oblikuje uz stabilnu rutinu."
        : "Your build often responds well to training and usually shapes nicely with a steady routine.",
      highlights: isHr
        ? ["Uravnotežena građa", "Rutina radi dobro", "Athletic toned / Defined"]
        : ["Balanced build", "Routine works well", "Athletic toned / Defined"],
      details: isHr
        ? "Atletska građa obično dobro reagira na trening i često se lijepo oblikuje bez velike drame. To je opis konstitucije, ne obaveza. Dobar smjer figure može biti Athletic toned, Defined ili Balanced shape."
        : "An athletic build usually responds well to training and often shapes nicely without much drama. That describes your constitution, not a rule. A good shape direction can be Athletic toned, Defined, or Balanced shape.",
      learnMore: isHr ? "Saznaj više o svojoj građi" : "Learn more about your build",
      tips: isHr
        ? ["Građa je responzivna, pa rutina može biti jednostavna i dosljedna.", "Snaga + kretanje često daju najbolji osjećaj oblika.", "Dobar smjer figure može biti Athletic toned, Defined ili Balanced shape."]
        : ["The build is responsive, so the routine can stay simple and steady.", "Strength plus movement often gives the best shaping effect.", "A good shape direction can be Athletic toned, Defined, or Balanced shape."],
    },
    endomorph: {
      emoji: "🌿",
      title: isHr ? "Stabilna, snažna građa" : "Stable, strong build",
      summary: isHr
        ? "Tvoja građa često lakše skladišti energiju i može lijepo napredovati kroz stabilnu rutinu."
        : "Your build may store energy more easily and can often progress nicely through a steady routine.",
      highlights: isHr
        ? ["Stabilna građa", "Snaga + kretanje", "Curvy fit / Balanced shape"]
        : ["Stable build", "Strength + movement", "Curvy fit / Balanced shape"],
      details: isHr
        ? "Zaobljenija građa često dobro napreduje kroz kombinaciju snage, kretanja i stabilne prehrane. To je građa/konstitucija, a ne etiketa. Dobar smjer figure može biti Curvy fit ili Balanced shape - cilj nije mršavljenje pod svaku cijenu, nego oblikovanje."
        : "A more rounded build often progresses well with a mix of strength, movement, and steady nutrition. That is your build/constitution, not a label. A good shape direction can be Curvy fit or Balanced shape - the goal is shaping, not shrinking at any cost.",
      learnMore: isHr ? "Saznaj više o svojoj građi" : "Learn more about your build",
      tips: isHr
        ? ["Stabilna rutina i snaga često rade najbolje.", "Kretanje i prehrana u malim koracima daju dobar osjećaj kontrole.", "Dobar smjer figure može biti Curvy fit ili Balanced shape."]
        : ["A steady routine and strength often work best.", "Movement and small nutrition steps help keep control without pressure.", "A good shape direction can be Curvy fit or Balanced shape."],
    },
  };

  return guides[somatotype] || {
    emoji: "🧭",
    title: isHr ? "Uravnotežena građa" : "Balanced build",
    summary: isHr
      ? "Tvoja građa može biti mješavina više tipova. Najvažnije je pratiti kako tijelo reagira na trening i prehranu."
      : "Your build may be a mix of more than one type. The key is watching how your body responds to training and nutrition.",
    highlights: isHr
      ? ["Prati reakciju tijela", "Drži plan jednostavnim", "Balanced shape / Defined"]
      : ["Watch body response", "Keep it simple", "Balanced shape / Defined"],
    details: isHr
      ? "Ako tvoj tip nije jasan, koristi ovo kao smjernicu, a ne kao pravilo. Građa govori o konstituciji, a shape direction o smjeru figure. Dobar smjer figure najčešće je Balanced shape ili Defined, ovisno o tome kako želiš da tijelo izgleda i radi."
      : "If your type is not clear, use this as guidance, not a rule. Body type describes your constitution, while shape direction describes where your figure can go. A good shape direction is often Balanced shape or Defined, depending on how you want your body to look and feel.",
    learnMore: isHr ? "Saznaj više o svojoj građi" : "Learn more about your build",
    tips: isHr
      ? ["Prati energiju i oporavak.", "Drži program jednostavnim i dosljednim.", "Prilagođavaj korake po osjećaju i trendu."]
      : ["Watch energy and recovery.", "Keep the plan simple and consistent.", "Adjust steps based on the trend and how you feel."],
  };
}

function getSomatotypeLabel(somatotype) {
  const labels = {
    ectomorph: "Ectomorph",
    mesomorph: "Mesomorph",
    endomorph: "Endomorph",
  };

  return labels[somatotype] || "Unknown";
}

function resolveShapeDirectionFromText(text, language, somatotype) {
  const isHr = language === "hr";
  const normalized = String(text || "").toLowerCase();
  const directionMap = {
    hourglass: {
      direction: "Lean hourglass",
      focus: isHr ? "gluteusi, ramena i ravnoteža struka" : "glutes, shoulders, and waist balance",
    },
    curvy: {
      direction: "Curvy fit",
      focus: isHr ? "gluteusi, donji dio tijela i mekša definicija" : "glutes, lower body, and softer definition",
    },
    athletic: {
      direction: "Athletic toned",
      focus: isHr ? "snaga cijelog tijela, držanje i definicija" : "full-body strength, posture, and definition",
    },
    toned: {
      direction: "Defined",
      focus: isHr ? "snaga, oporavak i čista definicija" : "strength, recovery, and clean definition",
    },
    slim: {
      direction: "Slim fit",
      focus: isHr ? "postura, snaga i stabilan unos hrane" : "posture, strength, and steady fuel",
    },
    lean: {
      direction: "Lean toned",
      focus: isHr ? "postura, snaga i dovoljno proteina" : "posture, strength, and enough protein",
    },
    balanced: {
      direction: "Balanced shape",
      focus: isHr ? "dosljedna snaga, kretanje i proporcije" : "steady strength, movement, and proportion",
    },
    glutes: {
      direction: "Strong glutes focus",
      focus: isHr ? "gluteusi, noge i donji dio tijela" : "glutes, legs, and lower-body strength",
    },
    defined: {
      direction: "Defined",
      focus: isHr ? "snaga, oporavak i progresivno opterećenje" : "strength, recovery, and progressive overload",
    },
  };

  if (/hourglass/.test(normalized)) return directionMap.hourglass;
  if (/strongglutesfocus|glutes|biggerlowerbody/.test(normalized)) return directionMap.glutes;
  if (/curvy|pear|morecurves/.test(normalized)) return directionMap.curvy;
  if (/athletic|strongupperbody|moremuscle/.test(normalized)) return directionMap.athletic;
  if (/toned|leandefined/.test(normalized)) return directionMap.toned;
  if (/slim/.test(normalized)) return directionMap.slim;
  if (/lean/.test(normalized)) return directionMap.lean;
  if (/balancedshape|generalbalance|average/.test(normalized)) return directionMap.balanced;
  if (/strongglutesfocus|glutes/.test(normalized)) return directionMap.glutes;
  if (/defined|muscular/.test(normalized)) return directionMap.defined;

  if (somatotype === "ectomorph") return { direction: "Lean hourglass", focus: isHr ? "postepeno jačanje, gluteusi i ramena" : "gradual strength, glutes, and shoulders" };
  if (somatotype === "mesomorph") return { direction: "Athletic toned", focus: isHr ? "snaga, definicija i balans" : "strength, definition, and balance" };
  if (somatotype === "endomorph") return { direction: "Curvy fit", focus: isHr ? "snaga, kretanje i stabilna prehrana" : "strength, movement, and steady nutrition" };

  return { direction: "Balanced shape", focus: isHr ? "jednostavna rutina i dosljednost" : "simple routine and consistency" };
}

function getShapeDirectionGuide({ analysis, bodyTypeGuide, selectedShape, goalAssessment, physiqueGoals, focusAreas, userGoal }, language) {
  const isHr = language === "hr";
  const explicitShape = goalAssessment?.targetShape?.id || selectedShape || "";
  const signalText = [
    explicitShape,
    goalAssessment?.targetShape?.silhouette,
    ...(Array.isArray(physiqueGoals) ? physiqueGoals : []),
    ...(Array.isArray(focusAreas) ? focusAreas : []),
    userGoal?.goal,
  ]
    .filter(Boolean)
    .join(" ");

  const explicitDirection = resolveShapeDirectionFromText(signalText, language, analysis?.somatotype);
  const currentLabel = `${bodyTypeGuide?.title || ""} / ${getSomatotypeLabel(analysis?.somatotype)}`.replace(/^ \/ /, "");
  const hasSignals = Boolean(String(signalText).trim());

  return {
    title: isHr ? "Smjer figure" : "Shape direction",
    current: currentLabel || (isHr ? "Uravnotežena građa / Unknown" : "Balanced build / Unknown"),
    direction: explicitDirection.direction,
    focus: explicitDirection.focus,
    note: hasSignals
      ? (isHr ? "Smjernica prema trenutnim podacima." : "A guide based on the current data.")
      : (isHr ? "Smjer će biti precizniji nakon nekoliko check-inova." : "The direction becomes clearer after a few check-ins."),
  };
}

function getCustomPlanChoices(language) {
  const isHr = language === "hr";
  return [
    { id: "lose", label: isHr ? "Mršavljenje" : "Fat loss" },
    { id: "gain", label: isHr ? "Zdravo dobivanje mase" : "Healthy mass gain" },
    { id: "recomp", label: "Recomposition" },
    { id: "hourglass", label: "Hourglass" },
    { id: "curvy", label: "Curvy fit" },
    { id: "athletic", label: "Athletic toned" },
    { id: "glutes", label: isHr ? "Glutes focus" : "Glutes focus" },
    { id: "leanToned", label: "Lean toned" },
    { id: "strength", label: isHr ? "Snaga" : "Strength" },
    { id: "conditioning", label: isHr ? "Kondicija" : "Conditioning" },
  ];
}

function getCustomPlanPreset(choice, userGoal) {
  const keepCurrentGoal = userGoal?.goal || "only_training";
  const presets = {
    lose: { goalOverride: "lose", focusAreasOverride: ["core", "legs", "fullBody"] },
    gain: { goalOverride: "gain", focusAreasOverride: ["fullBody", "shoulders", "arms"] },
    recomp: { goalOverride: "only_training", focusAreasOverride: ["fullBody", "core", "shoulders"] },
    hourglass: { goalOverride: keepCurrentGoal, focusAreasOverride: ["glutes", "shoulders", "core"] },
    curvy: { goalOverride: keepCurrentGoal, focusAreasOverride: ["glutes", "legs", "core"] },
    athletic: { goalOverride: keepCurrentGoal, focusAreasOverride: ["fullBody", "shoulders", "arms"] },
    glutes: { goalOverride: keepCurrentGoal, focusAreasOverride: ["glutes", "legs", "core"] },
    leanToned: { goalOverride: keepCurrentGoal, focusAreasOverride: ["core", "shoulders", "fullBody"] },
    strength: { goalOverride: "only_training", focusAreasOverride: ["fullBody", "back", "arms"] },
    conditioning: { goalOverride: "only_training", focusAreasOverride: ["fullBody", "legs", "core"] },
  };

  return presets[choice] || { goalOverride: keepCurrentGoal, focusAreasOverride: [] };
}

function cleanForFirestore(value) {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && typeof value.toDate === "function") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => cleanForFirestore(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, cleanForFirestore(item)])
        .filter(([, item]) => item !== undefined),
    );
  }

  if (typeof value === "number" && Number.isNaN(value)) return null;
  if (value === undefined) return undefined;
  return value;
}

function getCustomizationPreview(choiceId, language, analysis, bodyTypeGuide, shapeDirectionGuide) {
  const isHr = language === "hr";
  const somatotypeLabel = `${bodyTypeGuide?.title || ""} / ${getSomatotypeLabel(analysis?.somatotype)}`.replace(/^ \/ /, "");

  const previewMap = {
    lose: {
      direction: isHr ? "Mršavljenje" : "Fat loss",
      focus: isHr ? "Trening, kretanje i mali kalorijski deficit" : "Training, movement, and a small calorie deficit",
      note: isHr ? "Ovo je cilj usmjeren na postupno smanjenje masnog tkiva i lakši osjećaj strukture." : "This goal is aimed at gradual fat loss and a lighter, more structured feel.",
    },
    gain: {
      direction: isHr ? "Zdravo dobivanje mase" : "Healthy mass gain",
      focus: isHr ? "Snaga, proteini i stabilan energijski unos" : "Strength, protein, and steady energy intake",
      note: isHr ? "Ovo je cilj usmjeren na postepeno jačanje i izgradnju baze." : "This goal supports gradual strength and building a base.",
    },
    recomp: {
      direction: "Recomposition",
      focus: isHr ? "Snaga, kretanje i balans tijela" : "Strength, movement, and body balance",
      note: isHr ? "Ovo je smjer za oblikovanje i stabilan napredak bez naglih promjena." : "This is a shaping direction with steady progress and fewer extremes.",
    },
    hourglass: {
      direction: "Lean hourglass",
      focus: isHr ? "Gluteusi, ramena i balans struka" : "Glutes, shoulders, and waist balance",
      note: isHr ? "Dobar izbor ako želiš naglasiti proporcije i mekanu liniju." : "A good pick if you want to emphasize proportions and a softer line.",
    },
    curvy: {
      direction: "Curvy fit",
      focus: isHr ? "Gluteusi, donji dio tijela i nježna definicija" : "Glutes, lower body, and gentle definition",
      note: isHr ? "Dobar izbor za zaobljeniju i skladnu siluetu." : "A good pick for a fuller, balanced silhouette.",
    },
    athletic: {
      direction: "Athletic toned",
      focus: isHr ? "Snaga cijelog tijela i čista definicija" : "Full-body strength and clean definition",
      note: isHr ? "Dobar izbor ako želiš sportski, čvršći dojam." : "A good pick if you want a sporty, firmer look.",
    },
    glutes: {
      direction: "Strong glutes focus",
      focus: isHr ? "Gluteusi, noge i donji dio tijela" : "Glutes, legs, and the lower body",
      note: isHr ? "Dobar izbor kada želiš naglasiti donju polovicu." : "A good pick when you want to emphasize the lower half.",
    },
    leanToned: {
      direction: "Lean toned",
      focus: isHr ? "Postura, snaga i lagana definicija" : "Posture, strength, and light definition",
      note: isHr ? "Dobar izbor za čistiji, vitkiji dojam bez pretjerivanja." : "A good pick for a cleaner, leaner look without overdoing it.",
    },
    strength: {
      direction: isHr ? "Snaga" : "Strength",
      focus: isHr ? "Postupno jačanje i stabilna rutina" : "Gradual strength and a steady routine",
      note: isHr ? "Dobar izbor ako ti je primarni cilj osjećaj snage i kontrole." : "A good pick if your main priority is strength and control.",
    },
    conditioning: {
      direction: isHr ? "Kondicija" : "Conditioning",
      focus: isHr ? "Kretanje, izdržljivost i ritam" : "Movement, endurance, and rhythm",
      note: isHr ? "Dobar izbor ako želiš više energije i lakši osjećaj u tijelu." : "A good pick if you want more energy and an easier feel in your body.",
    },
  };

  const selected = previewMap[choiceId];
  const fallback = {
    direction: shapeDirectionGuide.direction,
    focus: shapeDirectionGuide.focus,
    note: isHr
      ? "Ako još nema odabira, trenutni preporučeni smjer i dalje je dobra smjernica."
      : "If there is no choice yet, the current recommended direction is still a good guide.",
  };

  return {
    current: somatotypeLabel || (isHr ? "Uravnotežena građa / Unknown" : "Balanced build / Unknown"),
    currentCaption: isHr
      ? "Građa / body type opisuje konstituciju."
      : "Body type describes your constitution.",
    desiredDirection: (selected || fallback).direction,
    desiredFocus: (selected || fallback).focus,
    note: (selected || fallback).note,
  };
}

function normalizeGoalMode(goal) {
  if (goal === "gain") return "gain";
  if (goal === "lose") return "lose";
  return "maintenance";
}

function getGoalModeLabel(mode, language) {
  const isHr = language === "hr";
  const labels = {
    gain: isHr ? "Zdravo dobivanje mase" : "Healthy mass gain",
    lose: isHr ? "Lagano mršavljenje / recomposition" : "Gentle fat loss / recomposition",
    maintenance: isHr ? "Održavanje i oblikovanje" : "Maintenance and shaping",
  };

  return labels[mode] || labels.maintenance;
}

function getGoalSteps(mode, language) {
  const isHr = language === "hr";
  const guides = {
    lose: isHr
      ? [
          { title: "Snaga 3–4x tjedno", desc: "Drži fokus na osnovnim vježbama i postupnom napretku." },
          { title: "Svako dnevno kretanje", desc: "Više hodanja i laganog kretanja pomaže bez pritiska." },
          { title: "Protein u većim obrocima", desc: "To pomaže sitosti i očuvanju mišića." },
          { title: "Prati trend 2–4 tjedna", desc: "Gledaj prosjek, ne samo jedan unos ili jedan dan." },
          { title: "Male kalorijske prilagodbe", desc: "Radi male korake umjesto velikih rezova." },
        ]
      : [
          { title: "Strength 3–4x weekly", desc: "Keep the focus on core lifts and gradual progress." },
          { title: "Daily movement", desc: "More walking and light activity helps without pressure." },
          { title: "Protein in bigger meals", desc: "This helps fullness and muscle retention." },
          { title: "Track the trend for 2–4 weeks", desc: "Look at the average, not just one day or one weigh-in." },
          { title: "Small calorie adjustments", desc: "Make tiny changes instead of big cuts." },
        ],
    gain: isHr
      ? [
          { title: "Snaga 3–4x tjedno", desc: "Najviše koristi donosi dosljedan trening i progresija." },
          { title: "Blagi kalorijski suficit", desc: "Mali višak energije pomaže gradnji mase bez pretjerivanja." },
          { title: "Protein u svakom većem obroku", desc: "To podržava oporavak i rast." },
          { title: "Progresivno opterećenje", desc: "Dodaj ponavljanje, seriju ili malo težine kroz vrijeme." },
          { title: "Prati težinu i oporavak", desc: "Trend je važniji od jednog dana." },
        ]
      : [
          { title: "Strength 3–4x weekly", desc: "Consistency and gradual progression matter most." },
          { title: "A slight calorie surplus", desc: "A small energy extra helps build mass without rushing." },
          { title: "Protein in every bigger meal", desc: "This supports recovery and muscle growth." },
          { title: "Progressive overload", desc: "Add a rep, a set, or a little weight over time." },
          { title: "Watch weight and recovery", desc: "The trend matters more than one single day." },
        ],
    maintenance: isHr
      ? [
          { title: "Stabilna rutina snage", desc: "Dosljednost je sada jača od velikih promjena." },
          { title: "Dnevno kretanje", desc: "Šetnja i lagano kretanje pomažu držati ritam." },
          { title: "Protein i jednostavni obroci", desc: "Održava energiju i pomaže oporavku." },
          { title: "Trend težine i mjere", desc: "Prati kako se tijelo mijenja kroz nekoliko tjedana." },
          { title: "Male korekcije po potrebi", desc: "Podešavaj sitno, tek kad trend pokaže da treba." },
        ]
      : [
          { title: "A stable strength routine", desc: "Consistency matters more than big changes right now." },
          { title: "Daily movement", desc: "Walking and light activity help keep the rhythm." },
          { title: "Protein and simple meals", desc: "This supports energy and recovery." },
          { title: "Track weight trend and measurements", desc: "Watch how your body changes over a few weeks." },
          { title: "Small corrections when needed", desc: "Adjust only a little when the trend says so." },
        ],
  };

  return guides[mode] || guides.maintenance;
}

function getGoalTimeline(mode, language) {
  const isHr = language === "hr";
  const timelines = {
    lose: isHr
      ? [
          { title: "Tjedan 1–2", desc: "Posloži rutinu, snagu i lagani kalorijski deficit." },
          { title: "Tjedan 3–4", desc: "Prati trend težine, korake i energiju." },
          { title: "Tjedan 5–8", desc: "Drži snagu, hodanje i male prehrambene prilagodbe." },
          { title: "Nakon 8 tjedana", desc: "Napravi novi check-in i po potrebi doradi plan." },
        ]
      : [
          { title: "Weeks 1–2", desc: "Settle the routine, strength work, and a gentle calorie deficit." },
          { title: "Weeks 3–4", desc: "Watch the weight trend, steps, and energy." },
          { title: "Weeks 5–8", desc: "Keep the strength work, walking, and small nutrition adjustments going." },
          { title: "After 8 weeks", desc: "Do a new check-in and fine-tune the plan if needed." },
        ],
    gain: isHr
      ? [
          { title: "Tjedan 1–2", desc: "Uredi rutinu i napravi mali kalorijski suficit." },
          { title: "Tjedan 3–4", desc: "Prati težinu, oporavak i kako ide trening." },
          { title: "Tjedan 5–8", desc: "Pojačaj progresivno opterećenje i drži protein visoko." },
          { title: "Nakon 8 tjedana", desc: "Ponovno provjeri smjer i po potrebi prilagodi cilj." },
        ]
      : [
          { title: "Weeks 1–2", desc: "Settle the routine and add a small calorie surplus." },
          { title: "Weeks 3–4", desc: "Watch bodyweight, recovery, and how training feels." },
          { title: "Weeks 5–8", desc: "Push progressive overload and keep protein high." },
          { title: "After 8 weeks", desc: "Re-check the direction and adjust the goal if needed." },
        ],
    maintenance: isHr
      ? [
          { title: "Tjedan 1–2", desc: "Stabiliziraj rutinu i održaj navike jednostavnima." },
          { title: "Tjedan 3–4", desc: "Prati trend težine i energije bez žurbe." },
          { title: "Tjedan 5–8", desc: "Pojačaj snagu i ostani dosljedan u kretanju." },
          { title: "Nakon 8 tjedana", desc: "Napravi novi check-in i odluči treba li lagana korekcija." },
        ]
      : [
          { title: "Weeks 1–2", desc: "Stabilize the routine and keep habits simple." },
          { title: "Weeks 3–4", desc: "Watch the weight trend and energy without rushing." },
          { title: "Weeks 5–8", desc: "Increase strength focus and stay consistent with movement." },
          { title: "After 8 weeks", desc: "Do a new check-in and decide if any light adjustment is needed." },
        ],
  };

  return timelines[mode] || timelines.maintenance;
}

function getGoalMismatchMessage({ selectedGoal, recommendedMode, language }) {
  const isHr = language === "hr";
  if (!selectedGoal || selectedGoal === recommendedMode) return "";

  if (isHr) {
    if (selectedGoal === "gain" && recommendedMode === "lose") {
      return "Vidim da želiš dobivanje mase, ali prema trenutnim podacima možda bi ti prvo više koristilo postupno oblikovanje tijela i smanjenje masnog tkiva. Nakon toga dobivanje mase može biti lakše i zdravije.";
    }
    if (selectedGoal === "gain" && recommendedMode === "maintenance") {
      return "Vidim da želiš dobivanje mase, ali prema trenutnim podacima možda bi ti prvo više koristilo stabilizirati rutinu i malo se više fokusirati na oblikovanje tijela. Nakon toga dobivanje mase može biti lakše i zdravije.";
    }
    if (selectedGoal === "lose" && recommendedMode === "gain") {
      return "Vidim da želiš smanjiti težinu, ali prema trenutnim podacima možda bi ti prvo više koristilo zdravo dobivanje mase i jačanje baze. Nakon toga smanjenje masnog tkiva može biti lakše i održivije.";
    }
    if (selectedGoal === "maintenance" && recommendedMode === "gain") {
      return "Trenutno održavanje je u redu, ali analiza ipak više naginje laganom dobivanju mase i snage. Možeš krenuti polako, bez pritiska.";
    }
    if (selectedGoal === "maintenance" && recommendedMode === "lose") {
      return "Trenutno održavanje je u redu, ali analiza ipak više naginje laganom smanjenju masnog tkiva i boljeg oblikovanja. Mali koraci su sasvim dovoljni.";
    }
    return `Tvoj odabrani cilj i trenutna analiza nisu sasvim isti, pa bi ti možda najviše koristilo ${getGoalModeLabel(recommendedMode, language).toLowerCase()}.`;
  }

  if (selectedGoal === "gain" && recommendedMode === "lose") {
    return "You want to gain weight, but based on the current data it may help more to first focus on gradual shaping and lowering body fat. After that, gaining mass can feel easier and healthier.";
  }
  if (selectedGoal === "gain" && recommendedMode === "maintenance") {
    return "You want to gain weight, but based on the current data it may help more to first stabilize your routine and focus a bit on body shaping. After that, gaining mass can feel easier and healthier.";
  }
  if (selectedGoal === "lose" && recommendedMode === "gain") {
    return "You want to lose weight, but based on the current data it may help more to first build a healthier base and gain a bit of mass. After that, fat loss can feel easier and more sustainable.";
  }
  if (selectedGoal === "maintenance" && recommendedMode === "gain") {
    return "Maintenance is fine, but the current analysis leans a bit more toward gaining mass and strength. You can still keep it gentle and gradual.";
  }
  if (selectedGoal === "maintenance" && recommendedMode === "lose") {
    return "Maintenance is fine, but the current analysis leans a bit more toward gentle fat loss and shaping. Small steps are enough.";
  }

  return `Your chosen goal and the current analysis are not fully aligned, so the best next step may be ${getGoalModeLabel(recommendedMode, language).toLowerCase()}.`;
}

function getGoalGuidance({ analysis, userGoal, goalAssessment, language }) {
  const isHr = language === "hr";
  const currentWeight = Number(analysis?.weight);
  const min = Number(analysis?.idealRange?.min);
  const max = Number(analysis?.idealRange?.max);
  const bmi = Number(analysis?.bmi);
  const bodyFat = Number(analysis?.bodyFat);
  const hasRange = Number.isFinite(currentWeight) && Number.isFinite(min) && Number.isFinite(max) && min <= max;
  const hasExtraSignals = Number.isFinite(bmi) || Number.isFinite(bodyFat);
  const selectedGoal = goalAssessment
    ? (goalAssessment.weightChange < 0 ? "lose" : goalAssessment.weightChange > 2 ? "gain" : normalizeGoalMode(userGoal?.goal))
    : normalizeGoalMode(userGoal?.goal);

  let recommendedMode = "maintenance";
  let recommendationLabel = getGoalModeLabel("maintenance", language);
  let icon = "✨";
  let summary = isHr
    ? "Za precizniji smjer prati promjene kroz nekoliko check-inova."
    : "For a more precise direction, watch the changes across a few check-ins.";

  if (hasRange) {
    if (currentWeight > max + 0.5) {
      recommendedMode = "lose";
      recommendationLabel = getGoalModeLabel("lose", language);
      icon = "🌿";
      summary = isHr
        ? "Prema trenutnim podacima najviše bi ti moglo pomoći lagano smanjivanje masnog tkiva uz trening snage."
        : "Based on the current data, gentle fat loss with strength training may help the most right now.";
    } else if (currentWeight < min - 0.5) {
      recommendedMode = "gain";
      recommendationLabel = getGoalModeLabel("gain", language);
      icon = "💪";
      summary = isHr
        ? "Prema trenutnim podacima zdravo dobivanje mase i snage djeluje kao najmirniji sljedeći korak."
        : "Based on the current data, healthy mass and strength gain looks like the calmest next step.";
    } else {
      recommendedMode = "maintenance";
      recommendationLabel = getGoalModeLabel("maintenance", language);
      icon = "✨";
      summary = isHr
        ? "Izgleda da si već blizu idealnog raspona, pa su održavanje rutine, snaga i malo oblikovanja dobar smjer."
        : "You look close to the ideal range already, so keeping the routine steady, building strength, and shaping gradually is a good direction.";
    }
  } else if (Number.isFinite(bmi) || Number.isFinite(bodyFat)) {
    if (Number.isFinite(bmi) && bmi < 18.5) {
      recommendedMode = "gain";
      recommendationLabel = getGoalModeLabel("gain", language);
      icon = "💪";
      summary = isHr
        ? "BMI i postojeći podaci blago naginju prema mirnom dobivanju mase i snage."
        : "BMI and the available data gently lean toward calm mass and strength gain.";
    } else if (Number.isFinite(bmi) && bmi >= 25) {
      recommendedMode = "lose";
      recommendationLabel = getGoalModeLabel("lose", language);
      icon = "🌿";
      summary = isHr
        ? "BMI i postojeći podaci blago naginju prema laganom mršavljenju i boljoj kompoziciji tijela."
        : "BMI and the available data gently lean toward light fat loss and better body composition.";
    } else if (Number.isFinite(bodyFat) && bodyFat > 30) {
      recommendedMode = "lose";
      recommendationLabel = getGoalModeLabel("lose", language);
      icon = "🌿";
      summary = isHr
        ? "Procjena body fata govori da bi ti lagano smanjenje masnog tkiva moglo biti korisno."
        : "The body-fat estimate suggests that gentle fat loss could be useful.";
    } else if (Number.isFinite(bodyFat) && bodyFat < 15) {
      recommendedMode = "gain";
      recommendationLabel = getGoalModeLabel("gain", language);
      icon = "💪";
      summary = isHr
        ? "Procjena body fata govori da bi ti više odgovaralo postupno dobivanje mase i snage."
        : "The body-fat estimate suggests that gradual mass and strength gain may suit you better.";
    }
  }

  const guidanceMode = recommendedMode === "gain" ? "gain" : recommendedMode === "lose" ? "lose" : "maintenance";
  const chips = hasRange
    ? [
      isHr ? `Težina: ${currentWeight} kg` : `Weight: ${currentWeight} kg`,
      isHr ? `Idealno: ${min}-${max} kg` : `Ideal: ${min}-${max} kg`,
      recommendationLabel,
    ]
    : [
      Number.isFinite(bmi) ? `BMI ${bmi}` : null,
      Number.isFinite(bodyFat) ? (isHr ? `Body fat ${bodyFat}%` : `${bodyFat}% body fat`) : null,
      recommendationLabel,
    ].filter(Boolean);

  return {
    title: isHr ? "Što bi ti sada najviše pomoglo?" : "What would help you most right now?",
    summary,
    recommendationLabel,
    icon,
    mismatch: getGoalMismatchMessage({ selectedGoal, recommendedMode, language }),
    neutral: !hasRange && !hasExtraSignals,
    chips,
    steps: getGoalSteps(guidanceMode, language),
    timeline: getGoalTimeline(guidanceMode, language),
  };
}

function InfoBadge({ label, hint }) {
  return (
    <span className="relative inline-flex shrink-0 group/info">
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-500 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
      >
        <HiInformationCircle className="h-3.5 w-3.5" aria-hidden />
      </button>
      {hint ? (
        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-[16rem] max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-2xl bg-slate-900 px-3 py-2 text-left text-xs leading-5 text-white shadow-xl sm:w-72 group-hover/info:block group-focus-within/info:block">
          {hint}
        </span>
      ) : null}
    </span>
  );
}

export default function BodyAnalysis() {
  const { userGoal, saveGoal, user } = useAuth();
  const { t, language } = useTranslation();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const analysis = useMemo(() => getFullBodyAnalysis(userGoal), [userGoal]);
  const currentShapeVariant = useMemo(
    () => analysis ? guessCurrentShape(analysis.gender, analysis.bodyFat, analysis.somatotype) : null,
    [analysis],
  );
  const bodyTypeGuide = useMemo(
    () => getBodyTypeGuide(analysis?.somatotype || "ectomorph", language),
    [analysis?.somatotype, language],
  );
  const [selectedShape, setSelectedShape] = useState(null);
  const [goalAssessment, setGoalAssessment] = useState(null);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focusAreas, setFocusAreas] = useState([]);
  const [analysisAnswers, setAnalysisAnswers] = useState({
    fatStorage: "",
    postureIssue: "",
    trainingPriority: [],
    smoking: "",
    medication: "",
    alcohol: "",
    sweets: "",
    saltyFood: "",
    notes: "",
  });
  const [physiqueGoals, setPhysiqueGoals] = useState([]);
  const [savedAnalysisDoc, setSavedAnalysisDoc] = useState(null);
  const [deletingSnapshotTs, setDeletingSnapshotTs] = useState(null);
  const [activeBodyView, setActiveBodyView] = useState("overview");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const fileRef = useRef(null);
  const blobPreviewRef = useRef(null);
  const lastPhotoFileRef = useRef(null);
  const [customPlanChoice, setCustomPlanChoice] = useState("");
  const [savedPlanDoc, setSavedPlanDoc] = useState(null);
  const [progressDailyDocs, setProgressDailyDocs] = useState([]);
  const goalGuidance = useMemo(
    () => getGoalGuidance({ analysis, userGoal, goalAssessment, language }),
    [analysis, goalAssessment, language, userGoal],
  );
  const shapeDirectionGuide = useMemo(
    () => getShapeDirectionGuide({
      analysis,
      bodyTypeGuide,
      selectedShape,
      goalAssessment,
      physiqueGoals,
      focusAreas,
      userGoal,
    }, language),
    [analysis, bodyTypeGuide, focusAreas, goalAssessment, language, physiqueGoals, selectedShape, userGoal],
  );
  const customPlanChoices = useMemo(
    () => getCustomPlanChoices(language),
    [language],
  );
  const selectedCustomPlanChoice = useMemo(
    () => customPlanChoices.find((choice) => choice.id === customPlanChoice) || null,
    [customPlanChoice, customPlanChoices],
  );
  const selectedCustomPlanPreset = useMemo(
    () => (customPlanChoice ? getCustomPlanPreset(customPlanChoice, userGoal) : null),
    [customPlanChoice, userGoal],
  );
  const customizationPreview = useMemo(
    () => getCustomizationPreview(customPlanChoice, language, analysis, bodyTypeGuide, shapeDirectionGuide),
    [analysis, bodyTypeGuide, customPlanChoice, language, shapeDirectionGuide],
  );

  useEffect(() => {
    return () => {
      if (blobPreviewRef.current) {
        URL.revokeObjectURL(blobPreviewRef.current);
        blobPreviewRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "bodyAnalysis", user.uid));
        if (snap.exists()) setSavedAnalysisDoc(snap.data());
      } catch (e) {
        console.error("Load bodyAnalysis:", e);
      }
    })();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setSavedPlanDoc(null);
      setProgressDailyDocs([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [planSnap, progressSnap] = await Promise.all([
          getDoc(doc(db, "plans", user.uid)),
          getDocs(collection(db, "progress", user.uid, "daily")),
        ]);

        if (cancelled) return;

        setSavedPlanDoc(planSnap.exists() ? planSnap.data() : null);
        const nextProgress = progressSnap.docs
          .map((dailyDoc) => ({ id: dailyDoc.id, ...dailyDoc.data() }))
          .sort((a, b) => a.id.localeCompare(b.id));
        setProgressDailyDocs(nextProgress);
      } catch (err) {
        console.error("Load goal tracker data:", err);
        if (!cancelled) {
          setSavedPlanDoc(null);
          setProgressDailyDocs([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const historyEntries = useMemo(() => {
    const h = savedAnalysisDoc?.history;
    if (!h || typeof h !== "object") return [];
    return Object.entries(h)
      .map(([k, v]) => ({ ts: Number(k), data: v }))
      .filter((x) => !Number.isNaN(x.ts) && x.data)
      .sort((a, b) => b.ts - a.ts);
  }, [savedAnalysisDoc]);

  const olderHistoryEntries = useMemo(() => historyEntries.slice(1), [historyEntries]);
  const bodyViewTabs = useMemo(() => ([
    { id: "overview", label: t("bodyAnalysis.viewOverview") },
    { id: "goal", label: t("bodyAnalysis.viewGoal") },
    { id: "focus", label: t("bodyAnalysis.viewFocus") },
    { id: "ai", label: t("bodyAnalysis.viewAi") },
    { id: "history", label: t("bodyAnalysis.viewHistory") },
  ]), [t]);

  const fatStorageQuestionKey = useMemo(() => {
    if (userGoal?.goal === "lose") return "body.fatStorageQuestionLose";
    if (userGoal?.goal === "gain") return "body.fatStorageQuestionGain";
    return "body.fatStorageQuestionTrain";
  }, [userGoal?.goal]);

  const fatStorageOptionKeys = useMemo(() => {
    if (userGoal?.goal === "gain") {
      return [
        "body.fatStorageGain.upperBody",
        "body.fatStorageGain.glutesLegs",
        "body.fatStorageGain.fullBody",
        "body.fatStorageGain.noSpecificArea",
      ];
    }

    if (userGoal?.goal === "lose") {
      return [
        "body.fatStorage.belly",
        "body.fatStorage.hipsThighs",
        "body.fatStorage.upperBody",
        "body.fatStorage.evenly",
      ];
    }

    return [
      "body.fatStorageTrain.midsection",
      "body.fatStorageTrain.lowerBody",
      "body.fatStorageTrain.upperBody",
      "body.fatStorageTrain.evenly",
    ];
  }, [userGoal?.goal]);

  const focusAreaTextKeys = useMemo(() => {
    if (userGoal?.goal === "lose") {
      return {
        title: "body.focusAreasTitleLose",
        desc: "body.focusAreasDescLose",
        selected: "body.focusSelectedLose",
      };
    }

    if (userGoal?.goal === "gain") {
      return {
        title: "body.focusAreasTitleGain",
        desc: "body.focusAreasDescGain",
        selected: "body.focusSelectedGain",
      };
    }

    return {
      title: "body.focusAreasTitleTrain",
      desc: "body.focusAreasDescTrain",
      selected: "body.focusSelectedTrain",
    };
  }, [userGoal?.goal]);

  const physiqueGoalTextKeys = useMemo(() => {
    if (userGoal?.goal === "lose") {
      return {
        title: "body.lookGoalsTitleLose",
        desc: "body.lookGoalsDescLose",
        selected: "body.lookGoalsSelectedLose",
        variant: "body.lookLose",
      };
    }

    if (userGoal?.goal === "gain") {
      return {
        title: "body.lookGoalsTitleGain",
        desc: "body.lookGoalsDescGain",
        selected: "body.lookGoalsSelectedGain",
        variant: "body.lookGain",
      };
    }

    return {
      title: "body.lookGoalsTitleTrain",
      desc: "body.lookGoalsDescTrain",
      selected: "body.lookGoalsSelectedTrain",
      variant: "body.lookTrain",
    };
  }, [userGoal?.goal]);

  const answeredQuestionCount = useMemo(() => {
    const answered = [
      analysisAnswers.fatStorage,
      analysisAnswers.postureIssue,
      analysisAnswers.smoking,
      analysisAnswers.alcohol,
      analysisAnswers.sweets,
      analysisAnswers.saltyFood,
      analysisAnswers.medication,
      analysisAnswers.notes,
    ].filter(Boolean).length;

    return answered + (Array.isArray(analysisAnswers.trainingPriority) ? analysisAnswers.trainingPriority.length : 0);
  }, [analysisAnswers]);

  const getPhysiqueGoalLabel = useCallback((goalId) => {
    const variantKey = `${physiqueGoalTextKeys.variant}.${goalId}`;
    const variantValue = t(variantKey);
    if (variantValue !== variantKey) return variantValue;
    return t(`body.look.${goalId}`);
  }, [physiqueGoalTextKeys.variant, t]);

  const applySavedSnapshot = useCallback(
    (data) => {
      if (!data) return;
      if (blobPreviewRef.current) {
        URL.revokeObjectURL(blobPreviewRef.current);
        blobPreviewRef.current = null;
      }
      lastPhotoFileRef.current = null;
      if (data.photoUrl) setPhotoPreviewUrl(data.photoUrl);
      else setPhotoPreviewUrl(null);
      if (data.photoAnalysis) setPhotoAnalysis(data.photoAnalysis);
      if (data.selectedShape) setSelectedShape(data.selectedShape);
      if (data.goalAssessment) setGoalAssessment(data.goalAssessment);
      if (Array.isArray(data.focusAreas)) setFocusAreas(data.focusAreas);
      if (Array.isArray(data.physiqueGoals)) setPhysiqueGoals(data.physiqueGoals);
      if (data.analysisAnswers) setAnalysisAnswers((prev) => ({
        ...prev,
        ...data.analysisAnswers,
        trainingPriority: Array.isArray(data.analysisAnswers.trainingPriority) ? data.analysisAnswers.trainingPriority : [],
      }));
      addToast(t("body.savedLoaded"));
    },
    [addToast, t],
  );

  const toggleFocus = (id) => {
    if (id === "fullBody") {
      setFocusAreas((prev) => prev.includes("fullBody") ? [] : ["fullBody"]);
      return;
    }
    setFocusAreas((prev) => {
      const next = prev.filter((f) => f !== "fullBody");
      return next.includes(id) ? next.filter((f) => f !== id) : [...next, id];
    });
  };

  const updateAnalysisAnswer = (key, value) => {
    setAnalysisAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleAnalysisChoice = (key, value) => {
    setAnalysisAnswers((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((entry) => entry !== value)
          : [...current, value],
      };
    });
  };

  const togglePhysiqueGoal = (id) => {
    setPhysiqueGoals((prev) => (
      prev.includes(id)
        ? prev.filter((goal) => goal !== id)
        : [...prev, id]
    ));
  };

  const handleSelectShape = (shapeId) => {
    setSelectedShape(shapeId);
    if (analysis) {
      const assessment = assessGoalShape(
        { weight: analysis.weight, height: analysis.height, age: analysis.age, gender: analysis.gender },
        shapeId,
      );
      setGoalAssessment(assessment);
    }
  };

  const handlePhotoUpload = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast(t("body.fileTooLarge"), "error");
      input.value = "";
      return;
    }

    setAnalyzing(true);
    setPhotoAnalysis(null);
    if (blobPreviewRef.current) {
      URL.revokeObjectURL(blobPreviewRef.current);
      blobPreviewRef.current = null;
    }
    lastPhotoFileRef.current = null;

    try {
      let base64;
      let mimeType;
      let fileForSave;
      try {
        const prepared = await fileToJpegBase64ForApi(file);
        base64 = prepared.base64;
        mimeType = prepared.mimeType;
        fileForSave = new File([prepared.blob], "body-analysis.jpg", { type: "image/jpeg" });
      } catch (prepErr) {
        console.warn("JPEG resize failed:", prepErr);
        const rawOk = /^image\/(jpeg|jpg|pjpeg|png|webp)$/i.test(file.type || "");
        if (!rawOk) {
          addToast(t("body.imagePrepareFailed"), "error");
          return;
        }
        const reader = new FileReader();
        base64 = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const res = reader.result;
            const part = typeof res === "string" ? res.split(",")[1] : null;
            if (part) resolve(part);
            else reject(new Error("READ_FAIL"));
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        mimeType = file.type || "image/jpeg";
        fileForSave = file;
      }

      const userInfo = analysis
        ? `The person reports: height ${analysis.height}cm, weight ${analysis.weight}kg, age ${analysis.age}, gender ${analysis.gender}.`
        : "";

      const goalInfo = userGoal?.goal
        ? `Their fitness goal is: ${userGoal.goal === "lose" ? "lose weight" : userGoal.goal === "gain" ? "build muscle" : "general fitness"}.`
        : "";

      const focusInfo = focusAreas.length > 0
        ? `They want to especially improve these body areas: ${focusAreas.join(", ")}.`
        : "";

      const selectedPriorities = Array.isArray(analysisAnswers.trainingPriority)
        ? analysisAnswers.trainingPriority.join(", ")
        : "";
      const selectedPhysiqueGoals = physiqueGoals.length > 0
        ? physiqueGoals.map((goal) => getPhysiqueGoalLabel(goal)).join(", ")
        : "";

      const fatStorageInfo = analysisAnswers.fatStorage
        ? userGoal?.goal === "gain"
          ? `They report they notice the least fullness, volume, or body mass around: ${analysisAnswers.fatStorage}.`
          : userGoal?.goal === "lose"
            ? `They report that fat tends to accumulate most around: ${analysisAnswers.fatStorage}.`
            : `They notice body composition changes most around: ${analysisAnswers.fatStorage}.`
        : "";

      const questionnaireInfo = [
        fatStorageInfo,
        analysisAnswers.postureIssue ? `They feel this posture or movement issue is most noticeable: ${analysisAnswers.postureIssue}.` : "",
        selectedPriorities ? `Their current training priorities are: ${selectedPriorities}.` : "",
        selectedPhysiqueGoals ? `They would like their physique to move in this direction: ${selectedPhysiqueGoals}.` : "",
        analysisAnswers.smoking ? `Smoking habit: ${analysisAnswers.smoking}.` : "",
        analysisAnswers.medication ? `Medication or supplements mentioned by the user: ${analysisAnswers.medication}.` : "",
        analysisAnswers.alcohol ? `Alcohol intake pattern: ${analysisAnswers.alcohol}.` : "",
        analysisAnswers.sweets ? `They describe their sweets / sugar intake like this: ${analysisAnswers.sweets}.` : "",
        analysisAnswers.saltyFood ? `They describe their salty / snack food intake like this: ${analysisAnswers.saltyFood}.` : "",
        analysisAnswers.notes ? `Additional notes from the user: ${analysisAnswers.notes}.` : "",
      ].filter(Boolean).join(" ");

      const result = await analyzeBody(base64, mimeType, { userInfo, goalInfo, focusInfo, questionnaireInfo, language });
      setPhotoAnalysis(result);
      const blobUrl = URL.createObjectURL(fileForSave);
      blobPreviewRef.current = blobUrl;
      setPhotoPreviewUrl(blobUrl);
      lastPhotoFileRef.current = fileForSave;
      addToast(t("body.analysisComplete"));
    } catch (err) {
      console.error("Photo analysis error:", err);
      let msg = t("body.analysisFailed");
      const code = err?.code;
      const rawMessage = String(err?.message || "");
      if (code === "functions/permission-denied") msg = t("premium.required");
      else if (code === "functions/unauthenticated") msg = t("body.analysisLoginRequired");
      else if (code === "functions/deadline-exceeded") msg = t("body.analysisTimeout");
      else if (code === "functions/resource-exhausted") msg = t("body.analysisBusy");
      else if (code === "functions/invalid-argument") msg = t("body.analysisInvalidImage");
      else if (code === "functions/failed-precondition") msg = t("body.analysisSafety");
      else if (code === "functions/internal" && rawMessage.includes("PREMIUM")) msg = t("premium.required");
      else if (code === "functions/internal" && (rawMessage.includes("GEMINI_API_KEY") || rawMessage.toLowerCase().includes("misconfigured"))) {
        msg = t("body.analysisMisconfigured");
      } else if (code === "functions/internal" && rawMessage.toLowerCase().includes("safety")) msg = t("body.analysisSafety");

      // Helpful hint while developing locally.
      if (import.meta.env.DEV && code) {
        msg = `${msg} (${code})`;
      }
      addToast(msg, "error");
    } finally {
      setAnalyzing(false);
      input.value = "";
    }
  };

  const handleSaveAnalysis = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const ts = Date.now();
      let photoUrl = null;
      if (lastPhotoFileRef.current) {
        const file = lastPhotoFileRef.current;
        const ext = file.type.includes("png")
          ? "png"
          : file.type.includes("webp")
            ? "webp"
            : "jpg";
        const path = `bodyPhotos/${user.uid}/${ts}.${ext}`;
        const refS = storageRef(storage, path);
        await uploadBytes(refS, file, { contentType: file.type || "image/jpeg" });
        photoUrl = await getDownloadURL(refS);
        lastPhotoFileRef.current = null;
        if (blobPreviewRef.current) {
          URL.revokeObjectURL(blobPreviewRef.current);
          blobPreviewRef.current = null;
        }
        setPhotoPreviewUrl(photoUrl);
      } else if (photoPreviewUrl?.startsWith("http")) {
        photoUrl = photoPreviewUrl;
      }

      const data = {
        date: new Date().toISOString(),
        calculatedAnalysis: analysis ? { bmi: analysis.bmi, bodyFat: analysis.bodyFat, somatotype: analysis.somatotype, idealRange: analysis.idealRange } : null,
        photoAnalysis: photoAnalysis || null,
        photoUrl,
        selectedShape: selectedShape || null,
        goalAssessment: goalAssessment || null,
        focusAreas: focusAreas.length > 0 ? focusAreas : null,
        physiqueGoals: physiqueGoals.length > 0 ? physiqueGoals : null,
        analysisAnswers,
      };

      await setDoc(
        doc(db, "bodyAnalysis", user.uid),
        { latest: data, history: { [String(ts)]: data } },
        { merge: true },
      );

      const snap = await getDoc(doc(db, "bodyAnalysis", user.uid));
      if (snap.exists()) setSavedAnalysisDoc(snap.data());
      addToast(t("body.saved"));
    } catch (err) {
      console.error("Save analysis error:", err);
      const code = err?.code || "";
      if (code.startsWith("storage/")) addToast(t("body.storageFailed"), "error");
      else addToast(t("body.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSavedSnapshot = async (ts) => {
    if (!user?.uid || !ts) return;

    setDeletingSnapshotTs(ts);
    try {
      await setDoc(
        doc(db, "bodyAnalysis", user.uid),
        { history: { [String(ts)]: deleteField() } },
        { merge: true },
      );

      setSavedAnalysisDoc((prev) => {
        if (!prev?.history) return prev;
        const nextHistory = { ...prev.history };
        delete nextHistory[String(ts)];
        return {
          ...prev,
          history: nextHistory,
        };
      });

      addToast(t("body.snapshotDeleted"));
    } catch (err) {
      console.error("Delete snapshot error:", err);
      addToast(t("body.deleteSnapshotFailed"), "error");
    } finally {
      setDeletingSnapshotTs(null);
    }
  };

  const handleAdaptPlan = async (overrides = {}) => {
    setAdapting(true);
    try {
      const newGoal = overrides.goalOverride
        || (goalAssessment
          ? goalAssessment.weightChange < 0 ? "lose" : goalAssessment.weightChange > 2 ? "gain" : userGoal?.goal || "only_training"
          : userGoal?.goal || "only_training");

      const newPeriod = goalAssessment?.estimatedMonths || userGoal?.period || 3;
      const location = localStorage.getItem("workout_location") || userGoal?.location || "gym";
      const experience = userGoal?.experience || "beginner";
      const nextFocusAreas = Array.isArray(overrides.focusAreasOverride)
        ? overrides.focusAreasOverride
        : focusAreas;

      const updatedGoal = cleanForFirestore({
        ...(userGoal || {}),
        goal: newGoal,
        period: newPeriod,
        focusAreas: nextFocusAreas.length > 0 ? nextFocusAreas : undefined,
      });
      const goalSaveResult = await saveGoal(updatedGoal);
      if (!goalSaveResult?.ok) {
        throw new Error("GOAL_SAVE_FAILED");
      }

      const user = auth.currentUser;
      const planSeed = user?.uid || "local";
      const gen = nextFocusAreas.length > 0
        ? generateFocusedPlan({ goal: newGoal, experience, location, focusAreas: nextFocusAreas, seed: planSeed })
        : generateWorkoutPlan({ goal: newGoal, experience, location, seed: planSeed });

      if (user) {
        const workoutPayload = cleanForFirestore({
          workout: {
            goal: newGoal,
            experience,
            location,
            focusAreas: nextFocusAreas.length > 0 ? nextFocusAreas : null,
            weeklyPlan: gen,
            dayLocations: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        await setDoc(
          doc(db, "plans", user.uid),
          workoutPayload,
          { merge: true },
        );
      }
      addToast(t("body.planAdapted"));
      navigate("/workout");
    } catch (err) {
      console.error("Failed to adapt plan from BodyAnalysis:", err);
      addToast(t("workout.failedSave"), "error");
    } finally {
      setAdapting(false);
    }
  };

  if (!analysis) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#fcf6fa] via-violet-50/65 to-[#fdeef4]/95">
        <div className="p-8 max-w-2xl mx-auto text-center">
          <p className="text-violet-950/35">{t("body.needsProfile")}</p>
        </div>
      </div>
    );
  }

  const handleAcceptRecommendedPlan = () => {
    handleAdaptPlan();
  };

  const handleOpenCustomization = () => {
    setCustomPlanChoice("");
    setActiveBodyView("customization");
  };

  const handleBackToOverview = () => {
    setActiveBodyView("overview");
  };

  const handleCustomPlanSubmit = () => {
    if (!selectedCustomPlanChoice || !selectedCustomPlanPreset) return;
    handleAdaptPlan({
      goalOverride: selectedCustomPlanPreset.goalOverride,
      focusAreasOverride: selectedCustomPlanPreset.focusAreasOverride,
    });
  };

  const goalTabMode = resolveGoalTabMode({
    customPlanChoice,
    selectedCustomPlanChoice,
    selectedCustomPlanPreset,
    goalAssessment,
  });
  const latestAnalysisSnapshot = savedAnalysisDoc?.latest || null;
  const hasAiAnalysis = Boolean(photoAnalysis || latestAnalysisSnapshot?.photoAnalysis || latestAnalysisSnapshot?.calculatedAnalysis);
  const goalTracker = calculateGoalProgress({
    language,
    goalTabMode,
    userGoal,
    goalAssessment,
    savedAnalysisDoc,
    savedPlanDoc,
    progressDailyDocs,
    hasAiAnalysis,
    bodyTypeGuide,
    shapeDirectionGuide,
    selectedCustomPlanChoice,
    customizationPreview,
  });
  const goalJourneyInfo = goalTracker;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#fcf6fa] via-violet-50/65 to-[#fdeef4]/95">
      <div className="app-mobile-page mx-auto max-w-[72rem] space-y-6 px-4 py-7 sm:px-6 sm:py-8 md:space-y-8 pb-28">
      <MobilePageHeader title={t("body.title")} />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-100 to-[#f6e4ff] text-violet-500 shadow-[0_8px_22px_-10px_rgba(147,90,200,0.4)] ring-1 ring-white/85 sm:h-11 sm:w-11">
            <HiSparkles className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="app-hide-on-mobile-header font-bold tracking-tight text-[#2c1d3a] text-[1.55rem] sm:text-[1.75rem]">{t("body.title")}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-violet-950/48">{t("body.subtitle")}</p>
          </div>
        </div>
        <a
          href="#ai-body-analysis"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-violet-100/85 bg-white/90 px-4 py-2 text-xs font-semibold text-violet-700 shadow-[0_6px_18px_-10px_rgba(124,58,237,0.35)] transition hover:border-violet-200 hover:bg-white sm:self-center sm:px-5 sm:py-2.5 sm:text-sm"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-500">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" /></svg>
          </span>
          {t("body.howItWorks")}
        </a>
      </header>

      <section className="rounded-[1.2rem] border border-white/85 bg-white/90 p-1 shadow-[0_14px_30px_-22px_rgba(109,40,150,0.16)] backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-5">
          {bodyViewTabs.map((tab) => {
            const active = activeBodyView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveBodyView(tab.id)}
                className={`rounded-lg px-2.5 py-2 text-[0.72rem] font-semibold transition sm:rounded-xl sm:text-sm ${
                  active
                    ? "bg-linear-to-r from-[#a855f7] to-[#ec4899] text-white shadow-[0_10px_24px_-14px_rgba(168,85,247,0.6)]"
                    : "bg-white/80 text-violet-700 hover:bg-violet-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeBodyView === "overview" && savedAnalysisDoc?.latest && (
        <section
          className="rounded-[1.4rem] border border-white/90 bg-linear-to-br from-[#fff7fb] via-[#faf6ff]/95 to-[#eef2ff]/90 p-3.5 sm:p-4 shadow-[0_18px_42px_-20px_rgba(109,40,150,0.16)]"
          aria-labelledby="latest-check-in-heading"
        >
          <div className="grid items-center gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-4">
            {savedAnalysisDoc.latest.photoUrl ? (
              <div className="relative shrink-0 justify-self-center lg:justify-self-start">
                <img
                  src={savedAnalysisDoc.latest.photoUrl}
                  alt={t("body.latestPhotoPreview")}
                  className="h-24 w-24 rounded-[1rem] object-cover shadow-[0_12px_28px_-12px_rgba(91,70,122,0.35)] ring-4 ring-white/95 sm:h-28 sm:w-28"
                />
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg ring-[3px] ring-white">
                  <span className="flex h-[1.25rem] w-[1.25rem] items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-[#da6fd5]">
                    <HiCheck className="h-3.5 w-3.5 text-white" strokeWidth={2.8} aria-hidden />
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative shrink-0 justify-self-center lg:justify-self-start">
                <div className="flex h-24 w-24 items-center justify-center rounded-[1rem] bg-linear-to-br from-violet-200/95 to-[#fdd8ea]/96 text-violet-700 shadow-inner sm:h-28 sm:w-28">
                  <HiBookmark className="h-7 w-7 opacity-90 sm:h-8 sm:w-8" aria-hidden />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg ring-[3px] ring-white">
                  <span className="flex h-[1.25rem] w-[1.25rem] items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-[#da6fd5]">
                    <HiCheck className="h-3.5 w-3.5 text-white" strokeWidth={2.8} aria-hidden />
                  </span>
                </div>
              </div>
            )}

            <div className="min-w-0 space-y-1.5 text-center lg:text-left">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <h2 id="latest-check-in-heading" className="text-lg font-bold tracking-tight text-[#9333ea] sm:text-[1.1rem]">
                {t("body.latestCheckInHeading")}
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveBodyView("history")}
                  className="inline-flex items-center justify-center gap-1 rounded-full border border-violet-100/80 bg-white/85 px-3 py-1 text-[0.72rem] font-semibold text-violet-700 transition hover:border-violet-200 hover:bg-white sm:text-xs"
                >
                  {language === "hr" ? "Povijest" : "History"}
                </button>
              </div>
              {savedAnalysisDoc.latest.date && (
                <p className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-violet-950/62 sm:text-sm lg:justify-start">
                  <HiCalendarDays className="h-[1.05rem] w-[1.05rem] shrink-0 text-violet-400" aria-hidden />
                  <span>
                    <span className="font-medium">{t("body.savedOn")}</span>
                    {" "}
                    {new Date(savedAnalysisDoc.latest.date).toLocaleString()}
                  </span>
                </p>
              )}
              <p className="text-xs leading-relaxed text-violet-950/55 sm:text-sm">{t("body.latestCheckInMotivation")}</p>
            </div>

            <div className="flex w-full max-w-xs flex-col items-center gap-2 justify-self-center lg:max-w-none lg:justify-self-end lg:items-end">
              <button
                type="button"
                onClick={() => applySavedSnapshot(savedAnalysisDoc.latest)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#ec4899] via-[#d946ef] to-[#a855f7] px-4.5 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_-8px_rgba(217,70,239,0.48)] transition hover:opacity-[0.97] sm:px-5 sm:text-sm"
              >
                {t("body.ctaSeeAnalysis")}
                <HiChevronRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
              </button>
            </div>
          </div>
        </section>
      )}

      {activeBodyView === "overview" && (
      <section className="rounded-[1.5rem] border border-white/85 bg-white/95 p-4 shadow-[0_20px_46px_-22px_rgba(112,71,148,0.16)] backdrop-blur-sm sm:p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-100 to-[#f6e4ff] text-violet-500 ring-1 ring-white/95 sm:h-8 sm:w-8">
            <HiSparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-[#2c1d3a] sm:text-lg">{t("body.bodyOverviewTitle")}</h2>
            <p className="text-xs leading-relaxed text-violet-950/50 sm:text-sm">{t("body.savedAnalysesHint")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex shrink-0 justify-center lg:justify-start">
            <BodyShapeIllustration
              gender={analysis.gender}
              bodyFat={analysis.bodyFat}
              somatotype={analysis.somatotype}
              shapeVariant={currentShapeVariant}
              label={t("body.you")}
            />
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            <StatCard icon={<HiChartBar className="h-[1.05rem] w-[1.05rem]" />} tone="lavender" label="BMI" value={analysis.bmi} color="#7c3aed" sub={t(`body.bmi.${analysis.bmiCategory.key}`)} hint={getMetricHint("bmi", language)} />
            <StatCard icon={<HiBeaker className="h-[1.05rem] w-[1.05rem]" />} tone="rose" label={t("body.bodyFat")} value={`${analysis.bodyFat}%`} color="#db2777" sub={`${analysis.leanMass} kg ${t("body.leanLabel")} / ${analysis.fatMass} kg ${t("body.fat")}`} hint={getMetricHint("bodyFat", language)} />
            <StatCard icon={<HiUserCircle className="h-[1.05rem] w-[1.05rem]" />} tone="violet" label={t("body.bodyType")} value={t(`body.type.${analysis.somatotype}`)} color="#7c3aed" hint={getMetricHint("bodyType", language)} />
            <StatCard icon={<HiScale className="h-[1.05rem] w-[1.05rem]" />} tone="blush" label={t("body.idealWeight")} value={`${analysis.idealRange.min}-${analysis.idealRange.max} kg`} color="#be185d" hint={getMetricHint("idealWeight", language)} />
          </div>
        </div>

        <div className="space-y-2 pt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-900/42">{t("body.bmiScale")}</p>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-white/60 shadow-inner ring-1 ring-violet-100/60">
            <div className="min-w-[8%] flex-1 bg-sky-200/90" aria-hidden />
            <div className="min-w-[14%] flex-[1.65] bg-emerald-200/90" aria-hidden />
            <div className="min-w-[8%] flex-1 bg-amber-200/85" aria-hidden />
            <div className="min-w-[8%] flex-1 bg-orange-200/80" aria-hidden />
            <div className="min-w-[8%] flex-1 bg-rose-200/88" aria-hidden />
          </div>
          <div className="relative h-5 pt-1">
            <div
              className="absolute -translate-x-1/2 whitespace-nowrap text-xs font-semibold tabular-nums text-violet-800/92"
              style={{ left: `${Math.min(100, Math.max(0, ((analysis.bmi - 15) / 25) * 100))}%` }}
            >
              ↑ {analysis.bmi}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-900/42">{t("body.composition")}</p>
          <div className="flex h-[1.875rem] overflow-hidden rounded-full border border-white/96 bg-white/75 shadow-inner">
            <div
              className="flex items-center justify-center bg-linear-to-br from-indigo-200/92 via-violet-200/85 to-purple-50/95 text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-violet-950/88"
              style={{ width: `${100 - analysis.bodyFat}%` }}
            >
              {t("body.leanLabel")} ~{Math.round(100 - analysis.bodyFat)}%
            </div>
            <div
              className="flex items-center justify-center bg-linear-to-br from-rose-200/72 via-[#fcd5e6]/92 to-orange-50/90 text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-rose-950/85"
              style={{ width: `${analysis.bodyFat}%` }}
            >
              {t("body.fat")} ~{analysis.bodyFat}%
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <section className="rounded-[1.55rem] border border-violet-100/70 bg-linear-to-br from-violet-50/75 via-white to-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">{language === "hr" ? "Tvoja građa i smjer" : "Your build and direction"}</p>
                <h3 className="mt-1 text-sm font-semibold text-[#2c1d3a]">{bodyTypeGuide.title}</h3>
              </div>
              <span className="text-lg" aria-hidden>{bodyTypeGuide.emoji}</span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/90 bg-white/92 px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">{t("body.bodyType")}</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#2c1d3a]">{bodyTypeGuide.title}</p>
              </div>
              <div className="rounded-2xl border border-white/90 bg-white/92 px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">{language === "hr" ? "Smjer figure" : "Shape direction"}</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#2c1d3a]">{shapeDirectionGuide.direction}</p>
              </div>
              <div className="rounded-2xl border border-white/90 bg-white/92 px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">{language === "hr" ? "Glavni fokus" : "Main focus"}</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#2c1d3a]">{shapeDirectionGuide.focus}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {bodyTypeGuide.highlights.slice(0, 2).map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full border border-violet-100/80 bg-white px-3 py-1 text-[11px] font-semibold text-violet-700 shadow-sm"
                >
                  {chip}
                </span>
              ))}
            </div>

            <details className="mt-3 rounded-[1rem] border border-violet-100/70 bg-violet-50/45 p-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-violet-700">
                <span className="flex items-center justify-between gap-3">
                  <span>{bodyTypeGuide.learnMore}</span>
                  <span className="text-xs font-bold text-violet-400">+</span>
                </span>
              </summary>
              <div className="mt-3 space-y-2.5">
                <p className="text-sm leading-6 text-gray-700">{bodyTypeGuide.details}</p>
                <ul className="space-y-1.5">
                  {bodyTypeGuide.tips.map((tip, index) => (
                    <li key={`${analysis.somatotype}-tip-${index}`} className="flex items-start gap-2 rounded-2xl bg-white/80 px-3 py-2 text-sm leading-6 text-gray-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-violet-700 ring-1 ring-violet-100">
                        {index + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            <details className="mt-3 rounded-[1rem] border border-violet-100/70 bg-linear-to-br from-white via-white to-violet-50/35 p-3 shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-semibold text-violet-700">
                <span className="flex items-center justify-between gap-3">
                  <span>{language === "hr" ? "Kako do cilja?" : "How to reach the goal?"}</span>
                  <span className="text-xs font-bold text-violet-400">+</span>
                </span>
              </summary>
              <div className="mt-3 space-y-3">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <div className="rounded-[1rem] border border-pink-100/70 bg-white/90 p-3 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-pink-500">
                      {language === "hr" ? "Preporučeni raspon težine" : "Recommended weight range"}
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#2c1d3a]">{analysis.idealRange.min}-{analysis.idealRange.max} kg</p>
                    <p className="mt-1 text-xs leading-5 text-pink-950/60">
                      {language === "hr"
                        ? "Ovaj raspon je samo orijentir. Najviše pomažu male, održive promjene kroz vrijeme."
                        : "This range is only a guide. Small, sustainable changes over time help the most."}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-violet-100/70 bg-white/90 p-3 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">
                      {language === "hr" ? "Smjer cilja" : "Goal guidance"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#2c1d3a]">{goalGuidance.title}</p>
                    <p className="mt-1 text-xs leading-5 text-violet-950/60">{goalGuidance.summary}</p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { icon: '\u{1F4C8}', title: language === 'hr' ? 'Prati trend' : 'Track the trend', text: language === 'hr' ? 'Gledaj trend, ne samo jedan unos.' : 'Watch the trend, not just one weigh-in.' },
                    { icon: '\u{1F3CB}️', title: language === 'hr' ? 'Snaga i kretanje' : 'Strength and movement', text: language === 'hr' ? 'Kombiniraj trening snage i kretanje.' : 'Combine strength training with movement.' },
                    { icon: '\u{1F957}', title: language === 'hr' ? 'Mali koraci' : 'Small steps', text: language === 'hr' ? 'Prilagodi prehranu malim koracima.' : 'Adjust nutrition in small steps.' },
                  ].map((step) => (
                    <article key={step.title} className="rounded-[1rem] border border-white/90 bg-white/92 p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-base" aria-hidden>{step.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#2c1d3a]">{step.title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-violet-950/60">{step.text}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <details className="rounded-[1rem] border border-white/90 bg-white/92 p-3 shadow-sm">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-violet-700">
                    <span className="flex items-center justify-between gap-3">
                      <span>{language === "hr" ? "Kako ostvariti cilj" : "How to achieve the goal"}</span>
                      <span className="text-xs font-bold text-violet-400">+</span>
                    </span>
                  </summary>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      { icon: '\u{1F4AA}', title: language === 'hr' ? 'Snaga 3–4x tjedno' : 'Strength 3–4x/week', text: language === 'hr' ? 'Najviše koristi donosi dosljedan trening i progresija.' : 'Consistency and progression bring the most benefit.' },
                      { icon: '\u{1F37D}', title: language === 'hr' ? 'Blagi kalorijski suficit' : 'Mild calorie surplus', text: language === 'hr' ? 'Mali višak energije pomaže gradnji mase bez pretjerivanja.' : 'A small energy surplus supports mass gain without overdoing it.' },
                    { icon: '\u{1F95A}', title: language === 'hr' ? 'Protein u većem obroku' : 'Protein in each big meal', text: language === 'hr' ? 'To podržava oporavak i rast.' : 'This supports recovery and growth.' },
                    { icon: '\u{1F4C8}', title: language === 'hr' ? 'Progresivno opterećenje' : 'Progressive overload', text: language === 'hr' ? 'Dodaj ponavljanje, seriju ili malo težine kroz vrijeme.' : 'Add reps, a set, or a little weight over time.' },
                    { icon: '\u{1F634}', title: language === 'hr' ? 'Prati težinu i oporavak' : 'Track weight and recovery', text: language === 'hr' ? 'Trend je važniji od jednog dana.' : 'The trend matters more than one day.' },
                    ].map((item) => (
                      <article key={item.title} className="rounded-[1rem] border border-violet-100/70 bg-violet-50/55 p-3 shadow-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-base" aria-hidden>{item.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#2c1d3a]">{item.title}</p>
                            <p className="mt-0.5 text-xs leading-5 text-violet-950/60">{item.text}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </details>

                <details className="rounded-[1rem] border border-white/90 bg-white/92 p-3 shadow-sm">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-violet-700">
                    <span className="flex items-center justify-between gap-3">
                      <span>{language === "hr" ? "Plan po tjednima" : "Plan by weeks"}</span>
                      <span className="text-xs font-bold text-violet-400">+</span>
                    </span>
                  </summary>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      { range: '1–2', title: language === 'hr' ? 'Uredi rutinu' : 'Set the routine', text: language === 'hr' ? 'Uredi rutinu i napravi mali kalorijski suficit.' : 'Set your routine and add a small calorie surplus.' },
                      { range: '3–4', title: language === 'hr' ? 'Prati odgovor' : 'Watch the response', text: language === 'hr' ? 'Prati težinu, oporavak i kako ide trening.' : 'Track weight, recovery, and training quality.' },
                      { range: '5–8', title: language === 'hr' ? 'Pojačaj progres' : 'Push progression', text: language === 'hr' ? 'Pojačaj progresivno opterećenje i drži protein visoko.' : 'Increase progressive overload and keep protein high.' },
                      { range: language === 'hr' ? 'Nakon 8 tjedana' : 'After 8 weeks', title: language === 'hr' ? 'Ponovni check-in' : 'Re-check', text: language === 'hr' ? 'Ponovno provjeri smjer i po potrebi prilagodi cilj.' : 'Recheck the direction and adjust the goal if needed.' },
                    ].map((item) => (
                      <article key={item.range} className="rounded-[1rem] border border-pink-100/70 bg-white/92 p-3 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-500">{item.range}</p>
                        <p className="mt-1 text-sm font-semibold text-[#2c1d3a]">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-pink-950/60">{item.text}</p>
                      </article>
                    ))}
                  </div>
                </details>
              </div>
            </details>

            <section className="mt-4 rounded-[1.35rem] border border-white/88 bg-white/92 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
                    {language === "hr" ? "Želiš li da plan prati ovaj smjer?" : "Want your plan to follow this direction?"}
                  </p>
                  <h3 className="text-sm font-semibold text-[#2c1d3a]">
                    {language === "hr"
                      ? "Možeš prihvatiti preporučeni smjer ili prilagoditi cilj prema svojim željama."
                      : "You can accept the recommended direction or customize the goal to fit your preferences."}
                  </h3>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAcceptRecommendedPlan}
                  disabled={adapting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#a855f7] to-[#ec4899] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_26px_-10px_rgba(168,85,247,0.45)] transition hover:opacity-95 disabled:opacity-60"
                >
                  {adapting
                    ? (language === "hr" ? "Spremanje..." : "Saving...")
                    : (language === "hr" ? "Da, prilagodi moj plan" : "Yes, adapt my plan")}
                </button>
                <button
                  type="button"
                  onClick={handleOpenCustomization}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-100/85 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:border-violet-200 hover:bg-violet-50/40"
                >
                  {language === "hr" ? "Ne, želim prilagoditi" : "No, I want to customize"}
                </button>
              </div>
            </section>
          </section>
        </div>
      </section>
      )}

      {activeBodyView === "customization" && (
        <section className="space-y-5 rounded-[1.75rem] border border-white/90 bg-white/95 p-4 shadow-[0_20px_46px_-22px_rgba(112,71,148,0.16)] backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
                {language === "hr" ? "Prilagodba plana" : "Plan customization"}
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-[#2c1d3a] sm:text-lg">
                {language === "hr" ? "Odaberi smjer koji najbolje odgovara tvom cilju." : "Choose the direction that best matches your goal."}
              </h2>
              <p className="mt-1 text-sm leading-6 text-violet-950/60">
                {language === "hr"
                  ? "Spremanje se događa tek kada potvrdiš plan."
                  : "Saving only happens when you confirm the plan."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackToOverview}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-100/85 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-200 hover:bg-violet-50/40"
            >
              {language === "hr" ? "Natrag na analizu" : "Back to analysis"}
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <article className="rounded-2xl border border-violet-100/70 bg-linear-to-br from-violet-50/90 to-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
                {language === "hr" ? "Tvoja građa sada" : "Your build now"}
              </p>
              <p className="mt-2 text-base font-semibold text-[#2c1d3a]">{customizationPreview.current}</p>
              <p className="mt-1 text-xs leading-5 text-violet-950/55">{customizationPreview.currentCaption}</p>
            </article>
            <div className="flex justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-100/85 bg-white text-violet-500 shadow-sm" aria-hidden>
                →
              </span>
            </div>
            <article className="rounded-2xl border border-rose-100/70 bg-linear-to-br from-rose-50/85 to-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-500">
                {language === "hr" ? "Smjer kojem ideš" : "Direction you're heading"}
              </p>
              <p className="mt-2 text-base font-semibold text-[#2c1d3a]">
                {selectedCustomPlanChoice ? selectedCustomPlanChoice.label : customizationPreview.desiredDirection}
              </p>
              <p className="mt-1 text-xs leading-5 text-rose-950/60">{customizationPreview.desiredFocus}</p>
            </article>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <article className="rounded-2xl border border-violet-100/70 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">
                {language === "hr" ? "Trening" : "Training"}
              </p>
              <p className="mt-1 text-xs leading-5 text-violet-950/60">
                {language === "hr"
                  ? "Prilagodba koristi postojeći adapt flow i zadržava fokus na treningu."
                  : "This uses the existing adapt flow and keeps the focus on training."}
              </p>
            </article>
            <article className="rounded-2xl border border-violet-100/70 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">
                {language === "hr" ? "Prehrana" : "Nutrition"}
              </p>
              <p className="mt-1 text-xs leading-5 text-violet-950/60">
                {language === "hr"
                  ? "Prehranu možeš dodatno urediti u Nutrition dijelu ako želiš više kontrole."
                  : "You can fine-tune nutrition in the Nutrition section if you want more control."}
              </p>
            </article>
            <article className="rounded-2xl border border-violet-100/70 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">
                {language === "hr" ? "Ideje / aktivnosti" : "Ideas / activities"}
              </p>
              <p className="mt-1 text-xs leading-5 text-violet-950/60">
                {language === "hr"
                  ? "Dodatne aktivnosti mogu se uskladiti s fokusom i željenim smjerom figure."
                  : "Extra activities can be aligned with the focus and desired figure direction."}
              </p>
            </article>
          </div>

          <div className="rounded-2xl border border-violet-100/70 bg-white/90 p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
              {language === "hr" ? "Putanja" : "Path"}
            </p>
            <div className="mt-3 grid grid-cols-[repeat(5,minmax(0,1fr))] gap-2 text-center text-[10px] font-semibold sm:text-xs">
              {[
                language === "hr" ? "Start" : "Start",
                language === "hr" ? "Rutina" : "Routine",
                language === "hr" ? "Prilagodba" : "Adjust",
                language === "hr" ? "Cilj" : "Goal",
                language === "hr" ? "Novi check-in" : "New check-in",
              ].map((step, index) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full border ${index === 0 ? "border-violet-300 bg-violet-100 text-violet-900" : "border-violet-100 bg-white text-violet-700"}`}>
                    {index + 1}
                  </span>
                  <span className="leading-tight text-violet-950/65">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100/70 bg-white/90 p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
              {language === "hr" ? "Odabir cilja" : "Goal choice"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {customPlanChoices.map((choice) => {
                const active = customPlanChoice === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => setCustomPlanChoice(choice.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-violet-300 bg-violet-100 text-violet-900 shadow-sm"
                        : "border-violet-100/85 bg-white text-violet-700 hover:border-violet-200 hover:bg-violet-50/50"
                    }`}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-violet-950/55">
              {selectedCustomPlanChoice
                ? (language === "hr"
                  ? `Odabrano: ${selectedCustomPlanChoice.label}`
                  : `Selected: ${selectedCustomPlanChoice.label}`)
                : (language === "hr"
                  ? "Odaberi jedan chip da bi prilagodio plan."
                  : "Pick one chip to adapt the plan.")}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100/70 bg-white/90 p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
              {language === "hr" ? "Fokus zone" : "Focus zones"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => {
                const active = focusAreas.includes(area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleFocus(area.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-violet-300 bg-violet-100 text-violet-900 shadow-sm"
                        : "border-violet-100/85 bg-white text-violet-700 hover:border-violet-200 hover:bg-violet-50/50"
                    }`}
                  >
                    <span aria-hidden>{area.icon}</span>
                    <span>{t(area.labelKey)}</span>
                  </button>
                );
              })}
            </div>
            {focusAreas.length > 0 ? (
              <p className="mt-3 text-xs leading-5 text-violet-950/55">
                {language === "hr" ? "Odabrano:" : "Selected:"} {focusAreas.map((f) => t(`body.focus.${f}`)).join(", ")}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-violet-100/70 bg-white/90 p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
              {language === "hr" ? "Look goals" : "Look goals"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PHYSIQUE_GOALS.map((goal) => {
                const active = physiqueGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => togglePhysiqueGoal(goal.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-rose-300 bg-rose-100 text-rose-900 shadow-sm"
                        : "border-violet-100/85 bg-white text-violet-700 hover:border-violet-200 hover:bg-violet-50/50"
                    }`}
                  >
                    <span aria-hidden>{goal.icon}</span>
                    <span>{getPhysiqueGoalLabel(goal.id)}</span>
                  </button>
                );
              })}
            </div>
            {physiqueGoals.length > 0 ? (
              <p className="mt-3 text-xs leading-5 text-violet-950/55">
                {language === "hr" ? "Odabrano:" : "Selected:"} {physiqueGoals.map((goal) => getPhysiqueGoalLabel(goal)).join(", ")}
              </p>
            ) : null}
          </div>

          <p className="text-xs leading-5 text-violet-950/55">
            {customizationPreview.note}{" "}
            {language === "hr"
              ? "Spremanje se događa tek kada potvrdiš plan."
              : "Saving happens only when you confirm the plan."}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleCustomPlanSubmit}
              disabled={!selectedCustomPlanChoice || adapting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#a855f7] via-[#c084fc] to-[#ec4899] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(168,85,247,0.45)] transition hover:opacity-95 disabled:opacity-45"
            >
              {adapting
                ? (language === "hr" ? "Prilagođavam..." : "Adapting...")
                : (language === "hr" ? "Spremi i prilagodi plan" : "Save and adapt plan")}
            </button>
            <button
              type="button"
              onClick={handleBackToOverview}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-100/85 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:border-violet-200 hover:bg-violet-50/40"
            >
              {language === "hr" ? "Natrag na analizu" : "Back to analysis"}
            </button>
          </div>
        </section>
      )}

      {activeBodyView === "goal" && (
        <div className="space-y-5">
          <section className="rounded-[2rem] border border-white/90 bg-white/95 p-4 sm:p-5 shadow-[0_22px_50px_-22px_rgba(112,71,148,0.18)] backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-500">
                  {goalJourneyInfo.title}
                </p>
                <h2 className="text-lg font-semibold tracking-tight text-[#2c1d3a] sm:text-xl">
                  {goalJourneyInfo.subtitle}
                </h2>
                <p className="text-sm leading-6 text-violet-950/60">
                  {goalJourneyInfo.statusMessage}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-violet-100/80 bg-white px-3 py-2 text-sm font-semibold text-violet-700 shadow-sm">
                <span aria-hidden>{goalJourneyInfo.progressIcon}</span>
                <span>{goalJourneyInfo.score}/100</span>
              </div>
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-violet-100/70 bg-linear-to-br from-white via-white to-violet-50/35 p-3 shadow-sm sm:p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                <div className="min-w-0" title={goalJourneyInfo.currentMeta}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">Sada</p>
                  <p className="mt-1 text-lg font-semibold leading-6 text-[#2c1d3a]">{goalJourneyInfo.currentLabel}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-100/80 bg-white text-violet-500 shadow-sm sm:h-12 sm:w-12">
                  <HiChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                </div>
                <div className="min-w-0 text-right" title={goalJourneyInfo.targetMeta}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">Cilj</p>
                  <p className="mt-1 text-lg font-semibold leading-6 text-[#2c1d3a]">{goalJourneyInfo.targetLabel}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-[1.2rem] border border-white/90 bg-white/92 p-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
                  {language === "hr" ? "Napredak prema cilju" : "Progress toward the goal"}
                </p>
                <span className="text-xs font-semibold text-violet-500">{goalTracker.enoughData ? `${Math.round(goalTracker.score)}%` : "15%"}</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-violet-50">
                <div
                  className="relative h-full rounded-full bg-linear-to-r from-[#a855f7] via-[#c084fc] to-[#ec4899]"
                  style={{ width: `${goalJourneyInfo.progressPercent}%` }}
                >
                  <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(236,72,153,0.12),0_0_18px_rgba(236,72,153,0.5)]" aria-hidden />
                </div>
              </div>
              <div className="flex flex-col gap-1 text-[11px] leading-4 text-violet-950/60 sm:flex-row sm:items-center sm:justify-between">
                <span>{formatKgValue(goalTracker.weeklySummary.latestWeight) ? `${language === "hr" ? "Sada: " : "Now: "}${formatKgValue(goalTracker.weeklySummary.latestWeight)}` : (language === "hr" ? "Sada: nema mjerenja" : "Now: no weigh-in yet")}</span>
                <span>
                  {goalAssessment?.estimatedTargetWeight
                    ? `${language === "hr" ? "Cilj: " : "Target: "}${Math.round(goalAssessment.estimatedTargetWeight * 10) / 10} kg`
                    : (goalAssessment?.idealRange?.min && goalAssessment?.idealRange?.max
                      ? `${language === "hr" ? "Raspon: " : "Range: "}${Math.round(goalAssessment.idealRange.min * 10) / 10}-${Math.round(goalAssessment.idealRange.max * 10) / 10} kg`
                      : (language === "hr" ? "Cilj se još precizira" : "Goal is still being refined"))}
                </span>
              </div>
              {!goalTracker.enoughData ? (
                <p className="text-[11px] leading-4 text-violet-950/55">
                  {language === "hr" ? "Još skupljamo podatke." : "We are still collecting data."}
                </p>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {goalTracker.metricCards.map((card) => (
                <div key={card.id} className="rounded-[1rem] border border-violet-100/75 bg-white px-2.5 py-2 shadow-sm sm:px-3 sm:py-2">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-violet-500">{card.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-[#2c1d3a]">{card.value}</p>
                  <p className="mt-0.5 text-[11px] font-medium leading-4 text-violet-700">
                    {card.id === "weight"
                      ? (goalTracker.hasReliableWeightTrend ? (language === "hr" ? "Trend spreman" : "Trend ready") : (language === "hr" ? "Trend se čeka" : "Trend pending"))
                      : card.id === "calories"
                        ? (goalTracker.weeklySummary.caloriesConsumedToday > 0 ? (goalTracker.weeklySummary.plannedCaloriesToday ? (language === "hr" ? "Blizu cilja" : "Close to goal") : (language === "hr" ? "Unos zapisan" : "Logged")) : (language === "hr" ? "Dodaj obrok" : "Add meal"))
                        : card.id === "protein"
                          ? (goalTracker.weeklySummary.actualProteinToday > 0 ? (goalTracker.weeklySummary.plannedProteinToday ? (language === "hr" ? "Usklađeno" : "Matched") : (language === "hr" ? "Zabilježeno" : "Logged")) : (language === "hr" ? "Čeka makroe" : "Waiting macros"))
                          : card.id === "training"
                            ? (goalTracker.weeklySummary.completedThisWeek === 0 ? (language === "hr" ? "Kreni prvi" : "Start first") : (goalTracker.weeklySummary.plannedWorkoutsThisWeek != null && goalTracker.weeklySummary.plannedWorkoutsThisWeek - goalTracker.weeklySummary.completedThisWeek <= 1 ? (language === "hr" ? "Dobar ritam" : "Good rhythm") : (language === "hr" ? "Sustižeš plan" : "Catching up")))
                            : card.id === "activity"
                              ? (goalTracker.weeklySummary.extraActivitiesCount > 0 ? (language === "hr" ? "Aktivno" : "Active") : (language === "hr" ? "Dodaj aktivnost" : "Add activity"))
                              : (goalTracker.weeklySummary.latestCheckInDate != null ? ((Math.max(0, Math.floor((Date.now() - goalTracker.weeklySummary.latestCheckInDate.getTime()) / 86400000)) <= 3) ? (language === "hr" ? "Svježe" : "Fresh") : (language === "hr" ? "Stariji" : "Older")) : (language === "hr" ? "Nema check-ina" : "No check-in"))}
                  </p>
                </div>
              ))}
            </div>

            <details className="mt-4 rounded-[1rem] border border-violet-100/75 bg-linear-to-br from-white via-white to-violet-50/35 p-3.5 shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-semibold text-violet-700">
                <span className="flex items-center justify-between gap-3">
                  <span>{goalTracker.guidanceTitle}</span>
                  <span className="text-xs font-bold text-violet-400">+</span>
                </span>
              </summary>
              <ul className="mt-3 grid gap-2">
                {goalTracker.guidanceBullets.map((step) => (
                  <li key={step} className="flex items-start gap-2 rounded-2xl border border-white/90 bg-white/92 px-3 py-2 text-sm leading-5 text-[#2c1d3a] shadow-sm">
                    <span className="mt-0.5 text-sm leading-none text-violet-500" aria-hidden>•</span>
                    <span className="text-xs leading-5 text-violet-950/65">
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </details>

            <details className="mt-3 rounded-[1rem] border border-violet-100/75 bg-linear-to-br from-white via-white to-violet-50/35 p-3.5 shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-semibold text-violet-700">
                <span className="flex items-center justify-between gap-3">
                  <span>{goalTracker.timelineTitle}</span>
                  <span className="text-xs font-bold text-violet-400">+</span>
                </span>
              </summary>
              <div className="mt-3 grid gap-2">
                {goalTracker.timeline.map((item) => (
                  <article key={item.title} className="flex items-start gap-2 rounded-[1rem] border border-white/90 bg-white/92 px-3 py-2.5 shadow-sm">
                    <span className="mt-0.5 text-sm leading-none text-violet-500" aria-hidden>•</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-[#2c1d3a]">{item.desc.split(".")[0]}</p>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          </section>
        </div>
      )}

      {activeBodyView === "focus" && (
        <div className="space-y-5">
          <section className="rounded-[2rem] border border-white/90 bg-white/95 p-5 sm:p-6 space-y-4 shadow-[0_22px_50px_-22px_rgba(112,71,148,0.18)] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[1.05rem] w-[1.05rem]"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /></svg>
              </span>
              <h2 className="font-semibold text-[#2c1d3a] text-lg tracking-tight">{t("body.focusAreasShortTitle")}</h2>
            </div>
            <p className="text-sm leading-relaxed text-violet-950/55">{t("body.focusAreasShortDesc")}</p>

            <div className="grid grid-cols-2 gap-2">
              {FOCUS_AREAS.map((area) => {
                const active = focusAreas.includes(area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleFocus(area.id)}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                      active
                        ? "border-violet-300 bg-violet-50/85 text-violet-900 ring-2 ring-violet-200/80"
                        : "border-violet-100/85 bg-white text-violet-950/75 hover:border-violet-200 hover:bg-violet-50/40"
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base ${active ? "bg-white shadow-sm" : "bg-violet-50/85"}`} aria-hidden>
                      {area.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{t(area.labelKey)}</span>
                  </button>
                );
              })}
            </div>

            <a
              href="#look-goals"
              className="block text-center text-sm font-semibold text-violet-700 transition hover:text-violet-900"
            >
              {t("body.customizeFocus")} <span aria-hidden>→</span>
            </a>
          </section>

          <section id="look-goals" className="scroll-mt-24 rounded-[2rem] border border-white/88 bg-white/95 p-6 sm:p-7 space-y-5 shadow-[0_22px_50px_-22px_rgba(112,71,148,0.15)] backdrop-blur-sm">
            <div>
              <p className="text-[0.625rem] uppercase tracking-[0.28em] font-semibold text-violet-500/78">{t("body.focusZonesAccent")}</p>
              <h2 className="font-semibold text-[#2c1d3a] text-xl mt-2.5 tracking-tight">{t(physiqueGoalTextKeys.title)}</h2>
              <p className="text-sm text-violet-950/55 mt-2 leading-relaxed max-w-2xl">{t(physiqueGoalTextKeys.desc)}</p>
            </div>

            {focusAreas.length > 0 && (
              <p className="rounded-[1rem] bg-violet-50/82 px-4 py-2.5 text-xs leading-relaxed text-violet-900/76 ring-1 ring-violet-100/70">
                {t(focusAreaTextKeys.selected)}: {focusAreas.map((f) => t(`body.focus.${f}`)).join(", ")}
              </p>
            )}

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {PHYSIQUE_GOALS.map((goal) => {
                const active = physiqueGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => togglePhysiqueGoal(goal.id)}
                    className={`relative flex items-center gap-3 rounded-[1.15rem] border px-3.5 py-3 text-sm font-medium transition-all ${
                      active
                        ? "border-rose-200/92 bg-linear-to-br from-rose-50/95 to-[#fff5f9]/95 text-rose-900 ring-[3px] ring-rose-100/95 shadow-sm"
                        : "border-violet-100/88 bg-white text-violet-950/68 hover:bg-rose-50/48"
                    }`}
                  >
                    <span
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl leading-none ${
                        active ? "bg-white shadow-sm ring-1 ring-rose-100/80" : "bg-violet-50/70"
                      }`}
                      aria-hidden="true"
                    >
                      {goal.icon}
                    </span>
                    <span className="text-left leading-snug">{getPhysiqueGoalLabel(goal.id)}</span>
                    {active ? <HiCheck className="ml-auto h-4 w-4 shrink-0 text-rose-600" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
            {physiqueGoals.length > 0 && (
              <p className="rounded-[1rem] bg-rose-50/88 px-4 py-2.5 text-xs leading-relaxed text-rose-950/78 ring-1 ring-rose-100/75">
                {t(physiqueGoalTextKeys.selected)}: {physiqueGoals.map((goal) => getPhysiqueGoalLabel(goal)).join(", ")}
              </p>
            )}
          </section>
        </div>
      )}

      {activeBodyView === "ai" && (
      <>
      <PremiumGate feature="aiBody">
      <div id="ai-body-analysis" className="scroll-mt-24 rounded-[2rem] border border-violet-100/55 bg-linear-to-b from-white via-[#fefbfd] to-violet-50/20 p-5 sm:p-7 space-y-6 shadow-[0_22px_50px_-22px_rgba(90,55,120,0.15)]">
        <div className="relative overflow-hidden rounded-[30px] border border-primary-100 bg-linear-to-br from-primary-50 via-white to-rose-50/70 p-5 sm:p-6 shadow-sm">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-rose-100/50 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-primary-100/60 blur-3xl" />
          <div className="relative grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_420px] gap-5 xl:gap-6 items-start">
            <div className="max-w-2xl space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700">
                <HiSparkles className="w-3.5 h-3.5" />
                {t("body.aiAnalysis")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-3 leading-tight">
                {t("body.aiHeroTitle")}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-3 leading-7">
                {t("body.aiHeroDesc")}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-primary-700 border border-primary-100 shadow-sm">
                  {t("body.ai3StepsTag")}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-rose-700 border border-rose-100 shadow-sm">
                  {t("body.aiDetailedTag")}
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/80 backdrop-blur-sm p-3 sm:p-4 shadow-[0_14px_40px_rgba(123,97,255,0.08)]">
              <div className="flex items-center justify-between gap-3 mb-3 px-1">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-primary-500">{t("body.aiHowItGoesLabel")}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{t("body.aiMiniFlowTitle")}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 border border-primary-100">
                  {t("body.ai1To2Min")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-3">
                <IntroStepCard number="1" title={t("body.aiUploadPhotoTitle")} text={t("body.aiUploadPhotoText")} />
                <IntroStepCard number="2" title={t("body.aiAnswerQuestionsTitle")} text={t("body.aiAnswerQuestionsText")} />
                <IntroStepCard number="3" title={t("body.aiGetResultsTitle")} text={t("body.aiGetResultsText")} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-primary-100 bg-linear-to-br from-primary-50 via-white to-sky-50/60 p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-primary-500 mb-2">1. KRATKA PITANJA</p>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700">
                <HiSparkles className="w-3.5 h-3.5" />
                {t("body.questionnaireTitle")}
              </p>
              <p className="text-sm text-primary-800 mt-3 font-medium">{t("body.questionnaireDesc")}</p>
            </div>
            <div className="rounded-2xl border border-primary-200 bg-white/90 px-4 py-3 text-center shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.22em] text-primary-500 font-semibold">AI</p>
              <p className="text-2xl font-bold text-primary-800">{answeredQuestionCount}</p>
              <p className="text-xs text-primary-600">{t("body.aiAnswersAndNotes")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.08fr,0.92fr] gap-4">
            <QuestionSectionCard
              eyebrow="01"
              icon="🎯"
              title={t("body.trainingPriorityQuestion")}
              description={t(fatStorageQuestionKey)}
              tone="violet"
            >
              <FormField label={t(fatStorageQuestionKey)}>
                <select
                  value={analysisAnswers.fatStorage}
                  onChange={(e) => updateAnalysisAnswer("fatStorage", e.target.value)}
                  className="w-full rounded-2xl border border-primary-100 bg-white px-3.5 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                >
                  <option value="">{t("body.selectPlaceholder")}</option>
                  {fatStorageOptionKeys.map((optionKey) => (
                    <option key={optionKey} value={t(optionKey)}>
                      {t(optionKey)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label={t("body.trainingPriorityQuestion")}
                helper={analysisAnswers.trainingPriority.length > 0 ? t("body.selectedCount", { count: analysisAnswers.trainingPriority.length }) : null}
              >
                <div className="flex flex-wrap gap-2.5">
                  {TRAINING_PRIORITY_IDS.map((priority) => {
                    const label = t(`body.trainingPriority.${priority}`);
                    const active = analysisAnswers.trainingPriority.includes(label);
                    return (
                      <ChoiceChip
                        key={priority}
                        active={active}
                        onClick={() => toggleAnalysisChoice("trainingPriority", label)}
                      >
                        {label}
                      </ChoiceChip>
                    );
                  })}
                </div>
              </FormField>
            </QuestionSectionCard>

            <QuestionSectionCard
              eyebrow="02"
              icon="🧍"
              title={t("body.postureIssueQuestion")}
              description={t("body.questionnaireDesc")}
              tone="sky"
            >
              <FormField label={t("body.postureIssueQuestion")}>
                <input
                  type="text"
                  value={analysisAnswers.postureIssue}
                  onChange={(e) => updateAnalysisAnswer("postureIssue", e.target.value)}
                  placeholder={t("body.postureIssuePlaceholder")}
                  className="w-full rounded-2xl border border-primary-100 bg-white px-3.5 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                />
              </FormField>

              <div className="grid grid-cols-1 gap-3">
                <FormField label={t("body.smokingQuestion")}>
                  <select
                    value={analysisAnswers.smoking}
                    onChange={(e) => updateAnalysisAnswer("smoking", e.target.value)}
                    className="w-full rounded-2xl border border-primary-100 bg-white px-3.5 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  >
                    <option value="">{t("body.selectPlaceholder")}</option>
                    {["none", "occasionally", "regularly", "tryingToQuit"].map((option) => (
                      <option key={option} value={t(`body.smoking.${option}`)}>
                        {t(`body.smoking.${option}`)}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={t("body.alcoholQuestion")}>
                    <select
                      value={analysisAnswers.alcohol}
                      onChange={(e) => updateAnalysisAnswer("alcohol", e.target.value)}
                      className="w-full rounded-2xl border border-primary-100 bg-white px-3.5 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                    >
                      <option value="">{t("body.selectPlaceholder")}</option>
                      {["none", "rarely", "weekly", "frequently"].map((option) => (
                        <option key={option} value={t(`body.alcohol.${option}`)}>
                          {t(`body.alcohol.${option}`)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label={t("body.sweetsQuestion")}>
                    <select
                      value={analysisAnswers.sweets}
                      onChange={(e) => updateAnalysisAnswer("sweets", e.target.value)}
                      className="w-full rounded-2xl border border-primary-100 bg-white px-3.5 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                    >
                      <option value="">{t("body.selectPlaceholder")}</option>
                      {["rarely", "sometimes", "often", "daily"].map((option) => (
                        <option key={option} value={t(`body.sweets.${option}`)}>
                          {t(`body.sweets.${option}`)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label={t("body.saltyFoodQuestion")}>
                  <select
                    value={analysisAnswers.saltyFood}
                    onChange={(e) => updateAnalysisAnswer("saltyFood", e.target.value)}
                    className="w-full rounded-2xl border border-primary-100 bg-white px-3.5 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  >
                    <option value="">{t("body.selectPlaceholder")}</option>
                    {["rarely", "sometimes", "often", "daily"].map((option) => (
                      <option key={option} value={t(`body.saltyFood.${option}`)}>
                        {t(`body.saltyFood.${option}`)}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </QuestionSectionCard>
          </div>

          <QuestionSectionCard
            eyebrow="03"
            icon="📝"
            title={t("body.notesQuestion")}
            description={t("body.medicationQuestion")}
            tone="rose"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr,1.1fr] gap-4">
              <FormField label={t("body.medicationQuestion")}>
                <input
                  type="text"
                  value={analysisAnswers.medication}
                  onChange={(e) => updateAnalysisAnswer("medication", e.target.value)}
                  placeholder={t("body.medicationPlaceholder")}
                  className="w-full rounded-2xl border border-primary-100 bg-white px-3.5 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                />
              </FormField>

              <FormField label={t("body.notesQuestion")}>
                <textarea
                  rows={4}
                  value={analysisAnswers.notes}
                  onChange={(e) => updateAnalysisAnswer("notes", e.target.value)}
                  placeholder={t("body.notesPlaceholder")}
                  className="w-full rounded-2xl border border-primary-100 bg-white px-3.5 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 resize-none"
                />
              </FormField>
            </div>
          </QuestionSectionCard>
        </div>

        <div className="rounded-[28px] border border-violet-100 bg-linear-to-br from-violet-50 via-white to-primary-50/70 p-4 sm:p-5 shadow-sm space-y-4">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={analyzing}
          className="w-full rounded-[30px] border border-primary-200 bg-linear-to-br from-primary-600 via-primary-500 to-violet-500 px-5 py-6 text-left shadow-lg shadow-primary-200/50 transition-transform hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {analyzing ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center text-white min-h-[180px]">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/80 border-t-transparent" />
              <span className="text-base font-semibold">{t("body.analyzing")}</span>
              <span className="text-sm text-white/80">{t("body.photoHint")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-6 items-center min-h-[180px]">
              <div className="space-y-4 text-white">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
                    <HiSparkles className="w-3.5 h-3.5" />
                    {t("body.aiStep3UploadLabel")}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                    {t("body.aiYourAnalysis")}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl sm:text-3xl font-bold leading-tight">{t("body.aiUploadHeroTitle")}</p>
                  <p className="text-sm sm:text-base text-white/85 max-w-xl">
                    {t("body.aiUploadHeroDesc")}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white text-primary-700 px-4 py-2.5 text-sm font-semibold shadow-sm">
                  <HiCamera className="w-5 h-5" />
                  {t("body.uploadPhoto")}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UploadFeatureCard icon={<span aria-hidden="true">{`\u{2728}`}</span>} text={t("body.photoHint")} />
                <UploadFeatureCard icon={<span aria-hidden="true">{`\u{1F4A1}`}</span>} text={t("body.photoGuide2")} />
                <UploadFeatureCard icon={<span aria-hidden="true">{`\u{1F4CF}`}</span>} text={t("body.photoGuide1")} />
                <UploadFeatureCard icon={<span aria-hidden="true">{`\u{1F31E}`}</span>} text={t("body.photoGuide4")} />
              </div>
            </div>
          )}
        </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* Photo Analysis Results */}
        {photoAnalysis && (
          <div className="space-y-4 pt-2">
            <div className="app-card overflow-hidden !p-0">
              <div className="bg-linear-to-br from-primary-50 via-white to-rose-50 px-5 py-5 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-5 items-start">
                  <div className="space-y-3">
                    {photoPreviewUrl ? (
                      <div className="rounded-3xl overflow-hidden border border-white/80 bg-white shadow-sm">
                        <img
                          src={photoPreviewUrl}
                          alt=""
                          className="w-full h-72 object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div className="rounded-3xl h-72 bg-linear-to-br from-primary-100 to-rose-100 flex items-center justify-center">
                        <HiSparkles className="w-14 h-14 text-primary-500" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <AIStatCard label={t("body.bodyType")} value={t(`body.type.${photoAnalysis.bodyType}`)} tone="violet" />
                      <AIStatCard label={t("body.postureLabel")} value={t(`body.posture.${photoAnalysis.posture}`) || photoAnalysis.posture} tone="sky" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700 border border-primary-100">
                        <HiSparkles className="w-3.5 h-3.5" />
                        {t("body.aiResult")}
                      </span>
                      {photoAnalysis.recommendedGoalShapes?.slice(0, 2).map((shape) => (
                        <span
                          key={shape}
                          className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 border border-rose-100"
                        >
                          {t(`body.${shape}`)}
                        </span>
                      ))}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-primary-700">
                        {t("body.aiFriendlyOverview")}
                      </p>
                      <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                        {photoAnalysis.prioritySummary || photoAnalysis.overallAssessment}
                      </h3>
                      {photoAnalysis.prioritySummary && photoAnalysis.overallAssessment && (
                        <p className="text-sm text-gray-600 mt-3 leading-6">
                          {photoAnalysis.overallAssessment}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <HighlightMetric
                        label={t("body.bodyFat")}
                        value={`${photoAnalysis.estimatedBodyFatRange?.[0]}-${photoAnalysis.estimatedBodyFatRange?.[1]}%`}
                        helper={t("body.shape")}
                        subValue={photoAnalysis.bodyShape}
                        tone="rose"
                      />
                      <HighlightMetric
                        label={t("body.bodyType")}
                        value={t(`body.type.${photoAnalysis.bodyType}`)}
                        helper={t("body.postureLabel")}
                        subValue={t(`body.posture.${photoAnalysis.posture}`) || photoAnalysis.posture}
                        tone="violet"
                      />
                      <HighlightMetric
                        label={t("body.trainingImplications")}
                        value={photoAnalysis.trainingImplications || "-"}
                        tone="sky"
                        compact
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {photoAnalysis.bodyTypeMeaning && (
                        <NarrativePanel title={t("body.bodyTypeMeaning")} body={photoAnalysis.bodyTypeMeaning} tone="violet" />
                      )}
                      {(photoAnalysis.postureNotes || photoAnalysis.postureTrainingImpact) && (
                        <NarrativePanel
                          title={t("body.postureTrainingImpact")}
                          body={[photoAnalysis.postureNotes, photoAnalysis.postureTrainingImpact].filter(Boolean).join(" ")}
                          tone="sky"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {(photoAnalysis.strengths?.length > 0 || photoAnalysis.areasToWork?.length > 0) && (
                  <div className="space-y-3">
                    <SectionIntro
                      eyebrow={t("body.aiEyebrowStrengths")}
                      title={t("body.aiTitleKeyPoints")}
                      description={t("body.aiDescKeyPoints")}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {photoAnalysis.strengths?.length > 0 && (
                      <TagPanel title={t("body.strengths")} items={photoAnalysis.strengths} tone="emerald" />
                    )}
                    {photoAnalysis.areasToWork?.length > 0 && (
                      <TagPanel title={t("body.areasToImprove")} items={photoAnalysis.areasToWork} tone="amber" />
                    )}
                    </div>
                  </div>
                )}

                {photoAnalysis.focusAdvice?.length > 0 && (
                  <div className="space-y-3">
                    <SectionIntro
                      eyebrow={t("body.aiEyebrowTrainingDirection")}
                      title={t("body.aiTitleTrainingDirection")}
                      description={t("body.aiDescTrainingDirection")}
                    />
                    <AdvicePanel title={t("body.focusAdvice")} items={photoAnalysis.focusAdvice} tone="indigo" />
                  </div>
                )}

                {(photoAnalysis.lifestyleImpact || photoAnalysis.lifestyleAdvice?.length > 0) && (
                  <div className="space-y-3">
                    <SectionIntro
                      eyebrow={t("body.aiEyebrowDailyHabits")}
                      title={t("body.aiTitleDailyHabits")}
                      description={t("body.aiDescDailyHabits")}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-[0.95fr,1.05fr] gap-4">
                    {photoAnalysis.lifestyleImpact && (
                      <NarrativePanel title={t("body.lifestyleImpact")} body={photoAnalysis.lifestyleImpact} tone="amber" />
                    )}
                    {photoAnalysis.lifestyleAdvice?.length > 0 && (
                      <AdvicePanel title={t("body.lifestyleAdvice")} items={photoAnalysis.lifestyleAdvice} tone="rose" />
                    )}
                    </div>
                  </div>
                )}

                {photoAnalysis.proportions && (
                  <div className="space-y-3">
                    <SectionIntro
                      eyebrow={t("body.aiEyebrowProportions")}
                      title={t("body.aiTitleProportions")}
                      description={t("body.aiDescProportions")}
                    />
                    <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-[0.18em]">{t("body.proportions")}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(photoAnalysis.proportions).map(([key, val]) => (
                        <div key={key} className="rounded-2xl bg-white border border-gray-100 px-3 py-3">
                          <p className="text-[11px] text-gray-400 uppercase font-semibold">{t(`body.prop.${key}`)}</p>
                          <p className="text-sm font-semibold text-gray-800 mt-1">{t(`body.propVal.${val}`)}</p>
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>
                )}

                {photoAnalysis.recommendedGoalShapes?.length > 0 && (
                  <div className="space-y-3">
                    <SectionIntro
                      eyebrow={t("body.aiEyebrowNextStep")}
                      title={t("body.aiTitleNextStep")}
                      description={t("body.aiDescNextStep")}
                    />
                    <div className="rounded-3xl border border-primary-100 bg-primary-50/30 p-4">
                    <p className="text-xs font-semibold text-primary-600 mb-3 uppercase tracking-[0.18em]">{t("body.recommendedShapes")}</p>
                    <div className="flex flex-wrap gap-2">
                      {photoAnalysis.recommendedGoalShapes.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSelectShape(s)}
                          className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-white text-primary-700 rounded-full font-medium border border-primary-100 hover:bg-primary-100 transition-colors"
                        >
                          {t(`body.${s}`)}
                          <HiChevronRight className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Analysis */}
            <button
              onClick={handleSaveAnalysis}
              disabled={saving}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <HiBookmark className="w-5 h-5" />
              {saving ? t("common.saving") : t("body.saveAnalysis")}
            </button>

            {/* Adapt Plan */}
            <button
              onClick={handleAdaptPlan}
              disabled={adapting}
              className="w-full py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <HiAdjustmentsHorizontal className="w-5 h-5" />
              {adapting ? t("common.saving") : t("body.adaptPlan")}
            </button>
            <p className="text-xs text-gray-400 text-center">{t("body.adaptPlanDesc")}</p>

            <button
              type="button"
              onClick={() => {
                if (blobPreviewRef.current) {
                  URL.revokeObjectURL(blobPreviewRef.current);
                  blobPreviewRef.current = null;
                }
                lastPhotoFileRef.current = null;
                setPhotoPreviewUrl(null);
                setPhotoAnalysis(null);
                fileRef.current?.click();
              }}
              className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-800"
            >
              <HiArrowPath className="w-4 h-4" /> {t("body.analyzeAnother")}
            </button>
          </div>
        )}
      </div>

      <section className="rounded-[2rem] border border-white/90 bg-linear-to-br from-white/94 via-[#fef8fb]/96 to-[#f3efff]/90 p-6 sm:p-7 shadow-[0_18px_48px_-24px_rgba(90,60,140,0.16)] backdrop-blur-sm">
        <h3 className="text-base font-semibold tracking-tight text-[#392f40]/95 sm:text-[1.05rem]">{t("body.moreInsightsTitle")}</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Link
            to="/workout"
            className="group flex items-start gap-3 rounded-[1.25rem] border border-violet-100/85 bg-white/88 p-4 shadow-sm transition hover:border-violet-200/95 hover:bg-violet-50/45"
          >
            <span className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
              <HiFire className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2">
                <span className="font-semibold text-[#392f40]/93">{t("body.moreInsightWorkoutTitle")}</span>
                <HiChevronRight className="h-5 w-5 shrink-0 text-violet-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500" aria-hidden />
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-violet-950/52">{t("body.moreInsightWorkoutDesc")}</span>
            </span>
          </Link>
          <Link
            to="/progress"
            className="group flex items-start gap-3 rounded-[1.25rem] border border-violet-100/85 bg-white/88 p-4 shadow-sm transition hover:border-violet-200/95 hover:bg-violet-50/45"
          >
            <span className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
              <HiArrowTrendingUp className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2">
                <span className="font-semibold text-[#392f40]/93">{t("body.moreInsightProgressTitle")}</span>
                <HiChevronRight className="h-5 w-5 shrink-0 text-violet-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500" aria-hidden />
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-violet-950/52">{t("body.moreInsightProgressDesc")}</span>
            </span>
          </Link>
          <Link
            to="/nutrition"
            className="group flex items-start gap-3 rounded-[1.25rem] border border-violet-100/85 bg-white/88 p-4 shadow-sm transition hover:border-violet-200/95 hover:bg-violet-50/45"
          >
            <span className="rounded-xl bg-fuchsia-50 p-2.5 text-fuchsia-600">
              <HiSparkles className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2">
                <span className="font-semibold text-[#392f40]/93">{t("body.moreInsightNutritionTitle")}</span>
                <HiChevronRight className="h-5 w-5 shrink-0 text-violet-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500" aria-hidden />
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-violet-950/52">{t("body.moreInsightNutritionDesc")}</span>
            </span>
          </Link>
        </div>
      </section>

      {/* Standalone Adapt Plan (when goalAssessment from shape selector, without photo) */}
      {goalAssessment && !photoAnalysis && (
        <div className="rounded-[2rem] border border-violet-100/60 bg-linear-to-br from-white/95 to-violet-50/30 p-6 space-y-3 shadow-[0_16px_42px_-22px_rgba(90,60,120,0.2)]">
          <button
            type="button"
            onClick={handleAdaptPlan}
            disabled={adapting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#a855f7]/95 to-[#e879f9]/90 py-3.5 font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-45"
          >
            <HiAdjustmentsHorizontal className="h-5 w-5" />
            {adapting ? t("common.saving") : t("body.adaptPlan")}
          </button>
          <p className="text-center text-[0.8125rem] text-violet-950/42">{t("body.adaptPlanDesc")}</p>
        </div>
      )}
      </PremiumGate>
      </>
      )}

      {activeBodyView === "history" && (
        <section className="rounded-[2rem] border border-white/90 bg-white/95 p-5 sm:p-6 space-y-5 shadow-[0_22px_50px_-22px_rgba(112,71,148,0.18)] backdrop-blur-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#2c1d3a]">{t("body.historyTitle")}</h2>
              <p className="text-sm leading-relaxed text-violet-950/55">{t("body.savedAnalysesHint")}</p>
            </div>
            {savedAnalysisDoc?.latest && (
              <button
                type="button"
                onClick={() => applySavedSnapshot(savedAnalysisDoc.latest)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#ec4899] via-[#d946ef] to-[#a855f7] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_32px_-6px_rgba(217,70,239,0.45)] transition hover:opacity-[0.97]"
              >
                {t("body.openSnapshot")}
                <HiChevronRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>

          {savedAnalysisDoc?.latest && (
            <div className="rounded-[1.4rem] border border-violet-100/70 bg-linear-to-br from-[#fff5fb] via-white to-[#f7f3ff]/90 p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-500">{t("body.latestCheckInTitle")}</p>
              <p className="mt-2 text-sm font-medium text-violet-950/70">
                {new Date(savedAnalysisDoc.latest.date || Date.now()).toLocaleString()}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-violet-950/55">{t("body.latestCheckInMotivation")}</p>
            </div>
          )}

          {olderHistoryEntries.length > 0 ? (
            <ul className="space-y-2.5">
              {olderHistoryEntries.map(({ ts, data }) => (
                <li key={ts}>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-violet-100/60 bg-white/80 px-3.5 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => applySavedSnapshot(data)}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1 text-left text-violet-950/66 transition hover:bg-violet-50/95 hover:text-violet-900"
                    >
                      {data.photoUrl && (
                        <img src={data.photoUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl border border-white/96 object-cover" />
                      )}
                      <span className="truncate text-xs">{new Date(ts).toLocaleString()}</span>
                    </button>
                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => applySavedSnapshot(data)}
                        className="font-semibold text-violet-900/95 underline-offset-4 hover:underline"
                      >
                        {t("body.openSnapshot")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedSnapshot(ts)}
                        disabled={deletingSnapshotTs === ts}
                        className="rounded-lg px-2 py-1 text-[0.8125rem] text-rose-600 transition hover:bg-rose-50/96 disabled:opacity-60"
                      >
                        {deletingSnapshotTs === ts ? t("common.loading") : t("body.deleteSnapshot")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}
      </div>
    </div>
  );
}

function AICompactStep({ number, icon, title, desc, tone = "violet" }) {
  const tones = {
    violet: "bg-violet-50 text-violet-500",
    rose: "bg-rose-50 text-rose-500",
    fuchsia: "bg-fuchsia-50 text-fuchsia-500",
  };
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[0.75rem] font-bold text-violet-500 ring-1 ring-violet-100/85">
        {number}
      </span>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tones[tone] || tones.violet}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#2c1d3a]">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-violet-950/52">{desc}</span>
      </span>
    </li>
  );
}

function StatCard({ icon, label, value, color, sub, tone = "lavender", hint }) {
  const tones = {
    lavender: "bg-violet-50 text-violet-500",
    rose: "bg-rose-50 text-rose-500",
    violet: "bg-fuchsia-50 text-fuchsia-500",
    blush: "bg-pink-50 text-pink-500",
  };
  return (
    <div className="space-y-2 rounded-[1.15rem] border border-violet-100/55 bg-white px-3.5 py-3.5 shadow-[0_8px_26px_-18px_rgba(95,60,130,0.25)] sm:px-4 sm:py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="text-xs font-medium leading-tight tracking-tight text-violet-950/55">{label}</p>
          {hint ? <InfoBadge label={label} hint={hint} /> : null}
        </div>
        {icon ? (
          <span className={`inline-flex rounded-lg p-1.5 ring-1 ring-white [&>svg]:block ${tones[tone] || tones.lavender}`}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="text-xl font-bold tracking-tight tabular-nums" style={{ color }}>{value}</p>
      {sub ? <p className="text-[0.75rem] leading-snug text-violet-950/45">{sub}</p> : null}
    </div>
  );
}

function AIStatCard({ label, value, tone = "violet" }) {
  const tones = {
    violet: "bg-violet-50/80 border-violet-100 text-violet-800",
    sky: "bg-sky-50/80 border-sky-100 text-sky-800",
    rose: "bg-rose-50/80 border-rose-100 text-rose-800",
  };

  return (
    <div className={`rounded-2xl border p-3 space-y-1 ${tones[tone] || tones.violet}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function HighlightMetric({ label, value, helper, subValue, tone = "violet", compact = false }) {
  const tones = {
    violet: "from-violet-50 to-white border-violet-100 text-violet-900",
    sky: "from-sky-50 to-white border-sky-100 text-sky-900",
    rose: "from-rose-50 to-white border-rose-100 text-rose-900",
  };

  return (
    <div className={`rounded-3xl border bg-linear-to-br p-4 space-y-2 ${tones[tone] || tones.violet}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className={`${compact ? "text-sm leading-6" : "text-xl"} font-bold`}>{value}</p>
      {(helper || subValue) && (
        <p className="text-xs opacity-75">
          {helper}{helper && subValue ? ": " : ""}{subValue}
        </p>
      )}
    </div>
  );
}

function InsightCard({ title, body, tone = "violet" }) {
  const tones = {
    violet: "bg-violet-50 border-violet-100 text-violet-800",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    sky: "bg-sky-50 border-sky-100 text-sky-800",
    rose: "bg-rose-50 border-rose-100 text-rose-800",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
  };

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${tones[tone] || tones.violet}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">{title}</p>
      <p className="text-sm leading-6">{body}</p>
    </div>
  );
}

function NarrativePanel({ title, body, tone = "violet" }) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 p-4 shadow-sm">
      <InsightCard title={title} body={body} tone={tone} />
    </div>
  );
}

function TagPanel({ title, items, tone = "emerald" }) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span key={`${title}-${index}`} className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium border ${toneMap[tone] || toneMap.emerald}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function AdvicePanel({ title, items, tone = "indigo" }) {
  const toneMap = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">{title}</p>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className={`flex items-start gap-3 rounded-2xl border px-3 py-3 text-sm ${toneMap[tone] || toneMap.indigo}`}>
            <span className="w-6 h-6 rounded-full bg-white/90 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {index + 1}
            </span>
            <span className="leading-6">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuestionSectionCard({ eyebrow, icon, title, description, children, tone = "violet" }) {
  const toneMap = {
    violet: "from-violet-50 via-white to-primary-50/60 border-violet-100",
    sky: "from-sky-50 via-white to-cyan-50/60 border-sky-100",
    rose: "from-rose-50 via-white to-amber-50/40 border-rose-100",
  };

  return (
    <div className={`rounded-[26px] border bg-linear-to-br p-4 sm:p-5 space-y-4 shadow-sm ${toneMap[tone] || toneMap.violet}`}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white/90 border border-white shadow-sm flex items-center justify-center text-lg shrink-0">
          <span aria-hidden="true">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-gray-400">{eyebrow}</p>
          <h3 className="text-base font-semibold text-gray-900 mt-1">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-1 leading-6">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function FormField({ label, helper, children }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {helper && <span className="text-xs font-medium text-primary-600 shrink-0">{helper}</span>}
      </span>
      {children}
    </label>
  );
}

function ChoiceChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm text-left transition-all ${
        active
          ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200/60"
          : "bg-white/95 border-primary-100 text-gray-700 hover:border-primary-200 hover:bg-primary-50"
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 ${
          active
            ? "border-white/70 bg-white/15 text-white"
            : "border-primary-200 bg-primary-50 text-primary-500 group-hover:border-primary-300"
        }`}
      >
        {active ? <HiCheck className="w-3 h-3" /> : "+"}
      </span>
      <span className="leading-5">{children}</span>
    </button>
  );
}

function GuideTipCard({ index, text }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 text-sm font-bold flex items-center justify-center shrink-0">
          {index}
        </span>
        <p className="text-sm text-gray-700 leading-6">{text}</p>
      </div>
    </div>
  );
}

function UploadFeatureCard({ icon, text }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/12 backdrop-blur-sm p-3.5 text-white">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-base shrink-0">
          {icon}
        </span>
        <p className="text-sm leading-6 text-white/90">{text}</p>
      </div>
    </div>
  );
}

function IntroStepCard({ number, title, text }) {
  const { t } = useTranslation();
  return (
    <div className="group rounded-[24px] border border-primary-100/70 bg-linear-to-br from-white to-primary-50/40 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-2xl bg-linear-to-br from-primary-500 to-violet-500 text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm">
          {number}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-primary-500">{t("body.aiStepLabel", { number })}</p>
          <p className="text-sm font-semibold text-gray-900 mt-1 leading-5">{title}</p>
          <p className="text-xs text-gray-600 leading-5 mt-1.5">{text}</p>
        </div>
      </div>
    </div>
  );
}

function SectionIntro({ eyebrow, title, description }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-gray-400">{eyebrow}</p>
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 leading-6">{description}</p>
    </div>
  );
}
