import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDays, format, startOfWeek } from "date-fns";
import { auth, db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { translateFood, translateMealLabel } from "../i18n/nutritionTranslations";
import { translateDiet, translateAllergy } from "../i18n/workoutTranslations";
import { useToast } from "../components/common/Toast";
import PremiumGate from "../components/common/PremiumGate";
import MobilePageHeader from "../components/layout/MobilePageHeader";
import { Skeleton, SkeletonGroup } from "../components/common/SkeletonLoader";
import { getUserPlanSummary } from "../utils/planEngine";
import {
  generateDayMeals,
  generateWeeklyMeals,
  generateMealOptions,
  isFoodAllowedByDietary,
  getMealRecipePool,
  DEFAULT_RECIPES_PER_MEAL,
} from "../utils/nutritionGenerator";
import {
  foodToMealItem,
  normalizeMealItems,
  canAddMealItem,
  mealItemsIncludeName,
  sumMealItems,
} from "../utils/nutritionMealItems";
import { analyzeCustomRecipe, analyzeFood } from "../services/geminiService";
import RecipeVisual from "../components/nutrition/RecipeVisual";
import RecipeDetailModal from "../components/nutrition/RecipeDetailModal";
import MealPicker from "../components/nutrition/MealPicker";
import {
  FOOD_EMOJI_WHITELIST,
  DEFAULT_FOOD_EMOJI,
  resolveRecipeEmoji,
  sanitizeFoodEmoji,
  isValidRecipeImageUrl,
} from "../utils/recipeVisual";
import { getGeneratedRecipeSuggestions, toDetailFood } from "../utils/aiRecipes";
import { fileToOptimizedJpegDataUrl } from "../utils/imageCompress";
import FoodScanner from "./FoodScanner";
import {
  HiCheck,
  HiArrowPath,
  HiSparkles,
  HiChevronDown,
  HiBookmark,
  HiOutlineBookmark,
  HiPencilSquare,
  HiTrash,
  HiXMark,
  HiArrowRight,
  HiChevronRight,
  HiChevronLeft,
  HiPlus,
  HiCamera,
} from "react-icons/hi2";

const MEAL_KEYS_ORDER = ["Breakfast", "Lunch", "Dinner", "Snack"];
const CUSTOM_EMOJI_OPTIONS = FOOD_EMOJI_WHITELIST;
const ORDERED_DAY_KEYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const NP = {
  deep: "#F0518B",
  base: "#FF6B8A",
  mid: "#FFA5BD",
  soft: "#FFE4EC",
  softer: "#FFF1F5",
  peach: "#FFE9D6",
  text: "#3A2A3F",
  muted: "#9A8AA0",
};
const NP_MAX = 1380;



const MEAL_EMOJI = { Breakfast: "☀️", Lunch: "🍽️", Dinner: "🌙", Snack: "🍓" };
const SHOP_CATS = [
  { id: "produce", emoji: "🥬" },
  { id: "protein", emoji: "🥩" },
  { id: "carbs", emoji: "🌾" },
  { id: "pantry", emoji: "🥣" },
  { id: "other", emoji: "🧺" },
];

function categorizeIngredient(name) {
  const text = String(name || "").toLowerCase();
  const rules = [
    { id: "produce", keys: ["tomato", "spinach", "banana", "berry", "apple", "avocado", "broccoli", "cucumber", "lettuce", "onion", "carrot", "pepper", "kiwi", "fruit", "veg", "salata", "rajc", "spinat", "jabuk", "krastav", "luk", "mrkv", "paprik", "voce", "povrce", "asparagus", "mushroom", "gljiv", "kivi"] },
    { id: "protein", keys: ["chicken", "egg", "yogurt", "tuna", "salmon", "beef", "turkey", "tofu", "protein", "sir", "jaja", "jaje", "pilet", "jogurt", "tuna", "losos", "steak", "fish", "shrimp", "turkey", "cottage"] },
    { id: "carbs", keys: ["oat", "rice", "pasta", "bread", "quinoa", "noodle", "tortilla", "granola", "zob", "riz", "kruh", "tjesten", "bagel", "wrap"] },
    { id: "pantry", keys: ["oil", "honey", "sauce", "salt", "pepper", "milk", "butter", "tahini", "soy", "ulje", "med", "umak", "sol", "mlijeko", "maslac"] },
  ];
  for (const rule of rules) {
    if (rule.keys.some((key) => text.includes(key))) return rule.id;
  }
  return "other";
}

function balanceShopColumns(cats, buckets) {
  const left = [];
  const right = [];
  let leftH = 0;
  let rightH = 0;
  for (const cat of cats) {
    const estimate = 56 + ((buckets[cat.id] || []).length * 42);
    if (leftH <= rightH) {
      leftH += (left.length ? 14 : 0) + estimate;
      left.push(cat);
    } else {
      rightH += (right.length ? 14 : 0) + estimate;
      right.push(cat);
    }
  }
  return { left, right };
}

function ShopGroup({ t, cat, items, shoppingChecks, onToggle }) {
  if (!items?.length) return null;
  return (
    <div className="np-shop-group">
      <p className="np-shop-group-title">
        <span className="np-shop-group-name">
          <span aria-hidden>{cat.emoji}</span>
          {t(`nutrition.categories.${cat.id}`)}
        </span>
        <span className="np-shop-group-count">{items.length}</span>
      </p>
      {items.map((ingredient) => {
        const on = Boolean(shoppingChecks[ingredient.key]);
        return (
          <button
            key={ingredient.key}
            type="button"
            className={`np-check${on ? " is-on" : ""}`}
            onClick={() => onToggle(ingredient.key)}
          >
            <span className="np-check-box">{on ? "✓" : ""}</span>
            <span className="np-check-label">{ingredient.label || ingredient.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function RecipePhoto({ englishName, recipe, imageUrl, emoji, alt = "", className = "np-recipe-photo", size = "md" }) {
  return (
    <RecipeVisual
      recipe={recipe}
      englishName={englishName || recipe?.name}
      imageUrl={imageUrl ?? recipe?.imageUrl}
      emoji={emoji ?? recipe?.emoji}
      alt={alt}
      className={className}
      size={size}
    />
  );
}

function MacroCard({ emoji, value, unit, label, hint, pct, accent }) {
  return (
    <article className="np-macro">
      <p className="np-macro-icon" aria-hidden>{emoji}</p>
      <p className="np-macro-val">
        {value}
        {unit === "g" && value !== "—" ? <span className="np-macro-unit"> g</span> : null}
      </p>
      <p className="np-macro-label">{label}</p>
      <p className="np-macro-hint">{hint}</p>
      <div className="np-macro-bar" aria-hidden>
        <span style={{ width: `${Math.max(0, Math.min(100, pct || 0))}%`, background: accent }} />
      </div>
    </article>
  );
}

function DayPicker({ days, value, todayKey, t, onChange }) {
  const options = days?.length ? days : ORDERED_DAY_KEYS;
  return (
    <label className="np-day-select">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={t("nutrition.selectedDay")}
      >
        {options.map((day) => {
          const name = t(`common.days.${day}`);
          return (
            <option key={day} value={day}>
              {day === todayKey ? `${t("common.today")}, ${name}` : name}
            </option>
          );
        })}
      </select>
      <HiChevronDown aria-hidden className="np-day-select-icon" />
    </label>
  );
}

function RecipeCardSkeleton() {
  return (
    <div className="np-recipe" style={{ boxShadow: "none" }}>
      <div className="np-recipe-media">
        <Skeleton className="np-recipe-photo" />
      </div>
      <div className="np-recipe-body">
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-3 w-[55%]" />
      </div>
    </div>
  );
}

function NutritionSkeleton() {
  return (
    <SkeletonGroup className="space-y-4">
      {MEAL_KEYS_ORDER.map((mealKey) => (
        <div key={mealKey} className="np-meal" style={{ background: "#fff" }}>
          <Skeleton className="h-5 w-28 mb-3" />
          <div className="np-recipes">
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}

export default function NutritionPlan() {
  const { t, language } = useTranslation();
  const { userGoal, dietary, savedRecipes, saveRecipe, removeRecipe, upsertRecipe, nutritionRecipeSlotsPerMeal, canChangeNutritionRecipes } = useAuth();
  const { addToast } = useToast();
  const [savedPlan, setSavedPlan] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [selections, setSelections] = useState({});
  const [shoppingChecks, setShoppingChecks] = useState({});
  const [selectedDay, setSelectedDay] = useState(() => {
    const orderedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const idx = (new Date().getDay() + 6) % 7; // Monday = 0
    return orderedDays[idx] || "Monday";
  });
  const [regenerationSeed, setRegenerationSeed] = useState(() => Date.now());
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [customRecipeName, setCustomRecipeName] = useState("");
  const [customRecipeIngredients, setCustomRecipeIngredients] = useState("");
  const [customRecipeMeal, setCustomRecipeMeal] = useState("Breakfast");
  const [customRecipeEmoji, setCustomRecipeEmoji] = useState(DEFAULT_FOOD_EMOJI);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [customRecipeLoading, setCustomRecipeLoading] = useState(false);
  const [customRecipeResult, setCustomRecipeResult] = useState(null);
  const [generatedRecipeLoading, setGeneratedRecipeLoading] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState(null);
  const [recipeGenerationError, setRecipeGenerationError] = useState("");
  const [extraFoodInput, setExtraFoodInput] = useState("");
  const [extraFoodLoading, setExtraFoodLoading] = useState(false);
  const [extraFoodLog, setExtraFoodLog] = useState([]);
  const [editingFoodLogId, setEditingFoodLogId] = useState(null);
  const [quickAddEstimate, setQuickAddEstimate] = useState(null);
  const [activeNutritionView, setActiveNutritionView] = useState("plan");
  const [addMode, setAddMode] = useState("quick");
  const [quickAddMeal, setQuickAddMeal] = useState("Snack");
  const [dishPhotoFile, setDishPhotoFile] = useState(null);
  const [dishPhotoPreview, setDishPhotoPreview] = useState(null);
  const [editingDishName, setEditingDishName] = useState(null);
  const [dishSaving, setDishSaving] = useState(false);
  const dishPhotoInputRef = useRef(null);

  const goalType = userGoal?.goal || "only_training";
  const summary = getUserPlanSummary(userGoal);
  const targetCal = summary?.calories || 2000;
  const currentWeekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const todayKey = useMemo(() => {
    const orderedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const idx = (new Date().getDay() + 6) % 7;
    return orderedDays[idx] || "Monday";
  }, []);
  const todayDateKey = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const workoutAdjustments = useMemo(() => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayIsoMap = Object.fromEntries(
      days.map((day, index) => [day, format(addDays(currentWeekStart, index), "yyyy-MM-dd")]),
    );
    return {
      dayIsoMap,
      dayAdjustments: savedPlan?.workout?.dayAdjustments || {},
      pauseWindow: savedPlan?.workout?.pauseWindow || null,
    };
  }, [currentWeekStart, savedPlan?.workout?.dayAdjustments, savedPlan?.workout?.pauseWindow]);

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoaded(true);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "plans", user.uid));
        if (snap.exists()) {
          const planData = snap.data();
          setSavedPlan(planData);
          setSelections(planData?.nutrition?.selections || {});
          setShoppingChecks(planData?.nutrition?.shoppingChecks || {});
        }
      } catch (err) {
        console.error(err);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setExtraFoodLog([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "progress", user.uid, "daily", todayDateKey));
        if (cancelled) return;
        const items = Array.isArray(snap.data()?.foodLog) ? snap.data().foodLog : [];
        setExtraFoodLog(items);
      } catch {
        if (!cancelled) setExtraFoodLog([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [todayDateKey]);

  const plan = useMemo(() => {
    if (!loaded) return {};
    if (savedPlan?.nutrition?.meals) {
      const normalized = normalizeNutritionPlan(
        sanitizeNutritionMeals(savedPlan.nutrition.meals),
        targetCal,
        goalType,
        dietary,
        savedPlan?.workout?.weeklyPlan,
        workoutAdjustments,
        nutritionRecipeSlotsPerMeal,
      );
      return normalized;
    }
    return generateWeeklyMeals(targetCal, goalType, dietary, savedPlan?.workout?.weeklyPlan, workoutAdjustments, {
      randomSeed: regenerationSeed,
      recipesPerMeal: nutritionRecipeSlotsPerMeal,
    });
  }, [savedPlan, loaded, targetCal, goalType, dietary, workoutAdjustments, regenerationSeed, nutritionRecipeSlotsPerMeal]);

  const displayPlan = useMemo(() => {
    if (!plan || typeof plan !== "object") return plan;
    const slots = nutritionRecipeSlotsPerMeal;
    const out = {};
    for (const [day, meals] of Object.entries(plan)) {
      if (!meals || typeof meals !== "object") {
        out[day] = meals;
        continue;
      }
      const dayOut = {};
      for (const [meal, foods] of Object.entries(meals)) {
        const arr = Array.isArray(foods) ? foods : [];
        dayOut[meal] = arr.filter((food) => isFoodAllowedByDietary(food, dietary)).slice(0, slots);
      }
      out[day] = dayOut;
    }
    return out;
  }, [plan, nutritionRecipeSlotsPerMeal, dietary]);
  const nutritionAdjustmentsSignature = useMemo(
    () => JSON.stringify({
      pauseWindow: workoutAdjustments.pauseWindow || null,
      dayAdjustments: workoutAdjustments.dayAdjustments || {},
    }),
    [workoutAdjustments.pauseWindow, workoutAdjustments.dayAdjustments],
  );

  useEffect(() => {
    if (!loaded) return;
    const pauseActive = Boolean(workoutAdjustments.pauseWindow?.active);
    const adjustmentCount = Object.keys(workoutAdjustments.dayAdjustments || {}).length;
    if (!pauseActive && adjustmentCount === 0) return;

    const prevSig = savedPlan?.nutrition?.adjustmentSignature || "";
    if (prevSig === nutritionAdjustmentsSignature) return;

    const adjusted = generateWeeklyMeals(
      targetCal,
      goalType,
      dietary,
      savedPlan?.workout?.weeklyPlan,
      workoutAdjustments,
      { randomSeed: regenerationSeed, recipesPerMeal: nutritionRecipeSlotsPerMeal },
    );

    const isAdjustedDay = (day) => {
      const isoDate = workoutAdjustments.dayIsoMap?.[day];
      const pause = workoutAdjustments.pauseWindow;
      if (pause?.active && isoDate && pause.startDate && pause.endDate) {
        if (isoDate >= pause.startDate && isoDate <= pause.endDate) return true;
      }
      if (isoDate && workoutAdjustments.dayAdjustments?.[isoDate] === "period_day_1") return true;
      return false;
    };

    setSavedPlan((prev) => {
      const baseMeals = sanitizeNutritionMeals(prev?.nutrition?.meals || plan || adjusted);
      const nextMeals = { ...baseMeals };
      for (const day of ORDERED_DAY_KEYS) {
        if (!isAdjustedDay(day)) continue;
        if (adjusted?.[day]) nextMeals[day] = adjusted[day];
      }

      return {
        ...(prev || {}),
        nutrition: {
          ...(prev?.nutrition || {}),
          meals: nextMeals,
          adjustmentSignature: nutritionAdjustmentsSignature,
        },
      };
    });
  }, [
    loaded,
    targetCal,
    goalType,
    dietary,
    workoutAdjustments,
    regenerationSeed,
    nutritionAdjustmentsSignature,
    savedPlan?.nutrition?.adjustmentSignature,
    savedPlan?.workout?.weeklyPlan,
    plan,
    nutritionRecipeSlotsPerMeal,
  ]);

  const dayKeys = useMemo(() => ORDERED_DAY_KEYS.filter((day) => plan?.[day]), [plan]);
  const activeDay = !loaded
    ? selectedDay
    : dayKeys.includes(selectedDay)
      ? selectedDay
      : (dayKeys.includes(todayKey) ? todayKey : dayKeys[0] || "Monday");
  const activeMeals = displayPlan?.[activeDay] || {};
  const mealRecipePools = useMemo(() => ({
    Breakfast: getMealRecipePool("breakfast", dietary),
    Lunch: getMealRecipePool("lunch", dietary),
    Dinner: getMealRecipePool("dinner", dietary),
    Snack: getMealRecipePool("snack", dietary),
  }), [dietary]);

  useEffect(() => {
    if (!loaded) return;
    if (activeDay && activeDay !== selectedDay) setSelectedDay(activeDay);
  }, [activeDay, loaded, selectedDay]);

  const weeklyShoppingList = useMemo(
    () => buildWeeklyShoppingList(displayPlan, selections, language),
    [displayPlan, selections, language],
  );

  const activeDayIngredients = weeklyShoppingList.byDay[activeDay] || [];
  const nutritionViewTabs = useMemo(() => ([
    { id: "plan", label: t("nutrition.viewPlan") },
    { id: "ingredients", label: t("nutrition.viewIngredients") },

  ]), [t]);

  const getMealItems = useCallback((day, meal) => {
    const options = displayPlan?.[day]?.[meal] || plan?.[day]?.[meal] || [];
    return normalizeMealItems(selections?.[day]?.[meal], options);
  }, [displayPlan, plan, selections]);

  const savePlan = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const meals = plan && Object.keys(plan || {}).length > 0
        ? sanitizeNutritionMeals(plan)
        : generateWeeklyMeals(targetCal, goalType, dietary, savedPlan?.workout?.weeklyPlan, workoutAdjustments, {
          randomSeed: regenerationSeed,
          recipesPerMeal: nutritionRecipeSlotsPerMeal,
        });
      // Always stamp today's progress from TODAY's weekday meals (not whatever day is open).
      const todayMealFoods = MEAL_KEYS_ORDER.flatMap((meal) => getMealItems(todayKey, meal));
      const todaySelectedTotals = sumMealItems(todayMealFoods);
      const todayFoodLogTotals = extraFoodLog.reduce(
        (acc, item) => ({
          cal: acc.cal + (Number(item?.estimatedCalories) || 0),
          protein: acc.protein + (Number(item?.protein) || 0),
          carbs: acc.carbs + (Number(item?.carbs) || 0),
          fat: acc.fat + (Number(item?.fat) || 0),
        }),
        { cal: 0, protein: 0, carbs: 0, fat: 0 },
      );
      const todayNutritionTotals = {
        cal: todaySelectedTotals.cal + todayFoodLogTotals.cal,
        protein: todaySelectedTotals.protein + todayFoodLogTotals.protein,
        carbs: todaySelectedTotals.carbs + todayFoodLogTotals.carbs,
        fat: todaySelectedTotals.fat + todayFoodLogTotals.fat,
      };
      await setDoc(
        doc(db, "plans", user.uid),
        {
          nutrition: {
            goal: goalType,
            meals,
            selections,
            shoppingChecks,
            dailyCalorieTarget: targetCal,
            macros: summary?.macros,
            adjustmentSignature: savedPlan?.nutrition?.adjustmentSignature || nutritionAdjustmentsSignature,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { merge: true },
      );
      await setDoc(
        doc(db, "progress", user.uid, "daily", todayDateKey),
        {
          date: todayDateKey,
          plannedNutritionCalories: Math.round(todayNutritionTotals.cal || 0),
          plannedNutritionProtein: Math.round(todayNutritionTotals.protein || 0),
          plannedNutritionCarbs: Math.round(todayNutritionTotals.carbs || 0),
          plannedNutritionFat: Math.round(todayNutritionTotals.fat || 0),
        },
        { merge: true },
      );
      setSavedPlan((p) => ({
        ...p,
        nutrition: {
          ...(p?.nutrition || {}),
          meals,
          selections,
          shoppingChecks,
          adjustmentSignature: savedPlan?.nutrition?.adjustmentSignature || nutritionAdjustmentsSignature,
        },
      }));
      addToast(t("nutrition.planSaved"));
    } catch {
      addToast(t("nutrition.failedSave"), "error");
    }
  };

  const setMealItems = (day, meal, nextItems) => {
    setSelections((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || {}), [meal]: nextItems },
    }));
  };

  const addMealItem = (day, meal, foodOrItem, extras = {}) => {
    if (!canChangeNutritionRecipes) return false;
    const item = foodToMealItem(foodOrItem, extras);
    if (!item) return false;
    const current = getMealItems(day, meal);
    if (!canAddMealItem(current, item)) {
      addToast(t("nutrition.alreadyInMeal"), "error");
      return false;
    }
    setMealItems(day, meal, [...current, item]);
    return true;
  };

  const commitScanToToday = (payload) => {
    if (!payload?.name) return false;
    const mealKey = MEAL_KEYS_ORDER.includes(payload.meal) ? payload.meal : "Lunch";
    const photoUrl = isValidRecipeImageUrl(payload.imageUrl) ? payload.imageUrl : null;
    const emoji = photoUrl
      ? (sanitizeFoodEmoji(payload.emoji) || DEFAULT_FOOD_EMOJI)
      : resolveRecipeEmoji(payload);
    return addMealItem(activeDay, mealKey, {
      name: payload.name,
      cal: payload.cal ?? payload.calories,
      calories: payload.calories ?? payload.cal,
      protein: payload.protein,
      carbs: payload.carbs,
      fat: payload.fat,
      ingredients: Array.isArray(payload.ingredients) ? payload.ingredients : [],
      steps: Array.isArray(payload.steps) ? payload.steps : [],
      prep: payload.prep,
      servings: payload.servings,
      emoji,
      imageUrl: photoUrl,
      source: "scan",
    }, {
      id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: "scan",
      imageUrl: photoUrl,
    });
  };

  const removeMealItem = (day, meal, target) => {
    if (!canChangeNutritionRecipes) return;
    const current = getMealItems(day, meal);
    const next = current.filter((item) => {
      if (!target) return true;
      if (typeof target === "string") return item.name !== target && item.id !== target;
      if (target.id) return item.id !== target.id;
      if (target.name) return item.name !== target.name;
      return true;
    });
    setMealItems(day, meal, next);
  };

  const selectOption = (day, meal, index) => {
    const options = displayPlan?.[day]?.[meal] || [];
    const food = options[index];
    if (food) addMealItem(day, meal, food);
  };

  const selectFromPool = (day, meal, food) => {
    if (!canChangeNutritionRecipes || !food?.name) return;
    addMealItem(day, meal, food, { source: food.source || "catalog" });
  };

  const toggleShoppingCheck = (key) => {
    if (!key) return;
    setShoppingChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveRecipe = async (food) => {
    const result = await saveRecipe(food);
    if (result?.ok) {
      addToast(`"${food.name}" ${t("nutrition.savedToRecipes")}`);
      return;
    }
    if (result?.reason === "exists") {
      addToast(t("nutrition.recipeAlreadySaved"), "error");
      return;
    }
    addToast(t("nutrition.recipeSaveFailed"), "error");
  };

  const isRecipeSaved = (name) => savedRecipes?.some((r) => r.name === name);
  const openRecipeDetail = useCallback((food, englishName, originalIngredients) => {
    setDetailRecipe({ food, englishName, originalIngredients });
  }, []);
  const closeRecipeDetail = useCallback(() => {
    setDetailRecipe(null);
  }, []);

  const customRecipeNamesInPlay = useMemo(() => {
    const trimmed = customRecipeName.trim();
    if (!trimmed) return [];
    return [trimmed, `${trimmed} ${t("nutrition.adaptedRecipeSuffix")}`.trim()];
  }, [customRecipeName, t]);

  const isCurrentCustomRecipeInPlan = useMemo(() => {
    const mealKey = MEAL_KEYS_ORDER.includes(customRecipeMeal) ? customRecipeMeal : "Breakfast";
    if (!customRecipeNamesInPlay.length) return false;
    const items = getMealItems(activeDay, mealKey);
    return customRecipeNamesInPlay.some((name) => mealItemsIncludeName(items, name));
  }, [getMealItems, activeDay, customRecipeMeal, customRecipeNamesInPlay]);

  const addCustomRecipeToPlan = () => {
    const customFood = buildCustomRecipeFood({ adapted: false });
    if (!customFood) return;
    addRecipeToDay(customFood);
  };

  const removeCustomRecipeFromPlan = () => {
    const mealKey = MEAL_KEYS_ORDER.includes(customRecipeMeal) ? customRecipeMeal : "Breakfast";
    if (!customRecipeNamesInPlay.length) return;
    for (const name of customRecipeNamesInPlay) {
      removeMealItem(activeDay, mealKey, name);
    }
    addToast(t("nutrition.customRecipeRemoved"));
  };

  const analyzeExtraFoodInput = async (inputText) => {
    const data = await analyzeFood("", null, {
      goal: goalType,
      targetCalories: targetCal,
      manualIngredients: inputText,
      estimateOnly: true,
    });
    const analyzed = Array.isArray(data?.identifiedItems) && data.identifiedItems.length
      ? data.identifiedItems[0]
      : Array.isArray(data?.recipes) && data.recipes.length
        ? data.recipes[0]
        : data || {};
    const estimatedCaloriesRaw = Number(analyzed?.estimatedCalories ?? analyzed?.calories ?? analyzed?.cal ?? 0);
    const estimatedCalories = Number.isFinite(estimatedCaloriesRaw) && estimatedCaloriesRaw > 0
      ? estimatedCaloriesRaw
      : null;
    return {
      name: String(analyzed?.name || inputText).trim(),
      estimatedCalories,
      protein: Number(analyzed?.estimatedProtein ?? analyzed?.protein ?? 0) || 0,
      carbs: Number(analyzed?.estimatedCarbs ?? analyzed?.carbs ?? 0) || 0,
      fat: Number(analyzed?.estimatedFat ?? analyzed?.fat ?? 0) || 0,
    };
  };

  const persistFoodLog = async (nextLog, nextCalories) => {
    const user = auth.currentUser;
    if (!user) return false;
    await setDoc(
      doc(db, "progress", user.uid, "daily", todayDateKey),
      {
        foodLog: nextLog,
        caloriesConsumed: Math.max(0, Math.round(nextCalories || 0)),
        date: todayDateKey,
      },
      { merge: true },
    );
    setExtraFoodLog(nextLog);
    return true;
  };

  const resetFoodLogEdit = () => {
    setEditingFoodLogId(null);
    setExtraFoodInput("");
    setQuickAddEstimate(null);
  };

  const handleFoodLogEdit = (entry) => {
    setEditingFoodLogId(entry.id);
    setExtraFoodInput(entry.inputText || "");
    setQuickAddEstimate(null);
  };

  const handleFoodLogDelete = async (entry) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "progress", user.uid, "daily", todayDateKey));
      const prev = snap.exists() ? snap.data() : {};
      const prevLog = Array.isArray(prev?.foodLog) ? prev.foodLog : extraFoodLog;
      const nextLog = prevLog.filter((item) => item.id !== entry.id);
      const nextCalories = Math.max(0, (Number(prev?.caloriesConsumed) || 0) - (Number(entry.estimatedCalories) || 0));
      await persistFoodLog(nextLog, nextCalories);
      if (editingFoodLogId === entry.id) resetFoodLogEdit();
      addToast(t("nutrition.foodLogDeleted"));
    } catch {
      addToast(t("nutrition.extraFoodFailed"), "error");
    }
  };

  const estimateQuickAdd = async () => {
    const inputText = extraFoodInput.trim();
    if (!inputText) {
      addToast(t("nutrition.extraFoodEmpty"), "error");
      return;
    }

    if (editingFoodLogId) {
      const user = auth.currentUser;
      if (!user) return;
      setExtraFoodLoading(true);
      try {
        const analyzed = await analyzeExtraFoodInput(inputText);
        const existingEntry = extraFoodLog.find((item) => item.id === editingFoodLogId);
        const newEntry = {
          id: existingEntry?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          inputText,
          name: analyzed.name,
          estimatedCalories: analyzed.estimatedCalories,
          protein: analyzed.protein,
          carbs: analyzed.carbs,
          fat: analyzed.fat,
          addedAt: existingEntry?.addedAt || new Date().toISOString(),
          source: "nutrition-manual",
        };
        const snap = await getDoc(doc(db, "progress", user.uid, "daily", todayDateKey));
        const prev = snap.exists() ? snap.data() : {};
        const prevLog = Array.isArray(prev?.foodLog) ? prev.foodLog : extraFoodLog;
        const prevCalories = Number(prev?.caloriesConsumed) || 0;
        const nextLog = prevLog.map((item) => (item.id === editingFoodLogId ? newEntry : item));
        const nextCalories = Math.max(
          0,
          prevCalories - (Number(existingEntry?.estimatedCalories) || 0) + (Number(newEntry.estimatedCalories) || 0),
        );
        await persistFoodLog(nextLog, nextCalories);
        resetFoodLogEdit();
        addToast(t("nutrition.foodLogUpdated"));
      } catch {
        addToast(t("nutrition.extraFoodFailed"), "error");
      } finally {
        setExtraFoodLoading(false);
      }
      return;
    }

    setExtraFoodLoading(true);
    try {
      const analyzed = await analyzeExtraFoodInput(inputText);
      setQuickAddEstimate({
        inputText,
        name: analyzed.name || inputText,
        estimatedCalories: analyzed.estimatedCalories || 0,
        protein: analyzed.protein,
        carbs: analyzed.carbs,
        fat: analyzed.fat,
      });
    } catch (err) {
      setQuickAddEstimate(null);
      const reason = err?.clientReason || "";
      const code = String(err?.code || "");
      const raw = String(err?.message || "");
      let msg = t("nutrition.extraFoodFailed");
      if (reason === "premium_required" || code === "functions/permission-denied") {
        msg = t("premium.required");
      } else if (reason === "ai_busy" || code === "functions/unavailable" || raw.includes("AI_TEMPORARILY_UNAVAILABLE")) {
        msg = language === "hr"
          ? "AI je trenutno zauzet. Pokušaj ponovo za trenutak."
          : "AI is temporarily busy. Please try again in a moment.";
      } else if (
        reason === "ai_misconfigured"
        || code === "functions/failed-precondition"
        || raw.includes("GEMINI_API_KEY_MISSING")
      ) {
        msg = language === "hr"
          ? "AI analiza nije ispravno postavljena. Provjeri GEMINI_API_KEY u Cloud Functions."
          : "AI analysis is not configured. Check GEMINI_API_KEY in Cloud Functions.";
      }
      addToast(msg, "error");
    } finally {
      setExtraFoodLoading(false);
    }
  };

  const commitQuickAddToToday = () => {
    if (!quickAddEstimate) return;
    const mealKey = MEAL_KEYS_ORDER.includes(quickAddMeal) ? quickAddMeal : "Snack";
    const ok = addMealItem(activeDay, mealKey, {
      name: quickAddEstimate.name || quickAddEstimate.inputText,
      cal: quickAddEstimate.estimatedCalories || 0,
      protein: quickAddEstimate.protein,
      carbs: quickAddEstimate.carbs,
      fat: quickAddEstimate.fat,
      ingredients: [],
      source: "quick-add",
      inputText: quickAddEstimate.inputText,
    }, {
      id: `quick-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: "quick-add",
      inputText: quickAddEstimate.inputText,
    });
    if (ok) {
      setExtraFoodInput("");
      setQuickAddEstimate(null);
      addToast(t("nutrition.extraFoodAdded"));
    }
  };

  const addAdaptedRecipeToPlan = () => {
    if (!customRecipeResult) {
      addToast(t("nutrition.noRecommendationsToApply"), "error");
      return;
    }
    const customFood = buildCustomRecipeFood({ adapted: true });
    if (!customFood) return;
    addRecipeToDay(customFood, t("nutrition.adaptedRecipeAdded"));
  };

  const addRecipeToDay = (customFood, successMessage = t("nutrition.customRecipeAdded")) => {
    const mealKey = MEAL_KEYS_ORDER.includes(customRecipeMeal) ? customRecipeMeal : "Breakfast";
    const ok = addMealItem(activeDay, mealKey, customFood, {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: customFood.source || "custom",
      imageUrl: customFood.imageUrl
        || (isValidRecipeImageUrl(dishPhotoPreview) ? dishPhotoPreview : null),
      isMyDish: true,
    });
    if (ok) addToast(successMessage);
  };

  const clearDishPhoto = () => {
    setDishPhotoFile(null);
    setDishPhotoPreview(null);
    if (dishPhotoInputRef.current) dishPhotoInputRef.current.value = "";
  };

  const handleDishPhotoPick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToOptimizedJpegDataUrl(file, { maxDim: 960 });
      setDishPhotoFile(file);
      setDishPhotoPreview(dataUrl);
    } catch {
      addToast(t("scanner.imageLoadFailed"), "error");
    }
  };

  const uploadDishPhotoIfNeeded = async () => {
    if (!dishPhotoFile || !auth.currentUser) return dishPhotoPreview?.startsWith("http") ? dishPhotoPreview : null;
    const user = auth.currentUser;
    const ts = Date.now();
    const path = `dishPhotos/${user.uid}/${ts}.jpg`;
    const refS = storageRef(storage, path);
    let blob = dishPhotoFile;
    if (dishPhotoPreview?.startsWith("data:")) {
      const res = await fetch(dishPhotoPreview);
      blob = await res.blob();
    }
    await uploadBytes(refS, blob, { contentType: "image/jpeg" });
    return getDownloadURL(refS);
  };

  const saveDishToMyDishes = async () => {
    const customFood = buildCustomRecipeFood({ adapted: false });
    if (!customFood) return;
    if (!hasDishNutrition) {
      addToast(t("nutrition.analyzeBeforeSave"), "error");
      return;
    }
    setDishSaving(true);
    try {
      let imageUrl = null;
      if (dishPhotoFile) {
        imageUrl = await uploadDishPhotoIfNeeded();
      } else if (dishPhotoPreview?.startsWith("http")) {
        imageUrl = dishPhotoPreview;
      }
      const payload = {
        ...customFood,
        imageUrl: imageUrl || null,
        isMyDish: true,
        source: "custom",
        meal: customRecipeMeal,
      };
      // Rename path: if editing and name changed, remove old entry after upserting new.
      const result = await upsertRecipe(payload);
      if (result?.ok && editingDishName && editingDishName !== payload.name) {
        await removeRecipe(editingDishName);
      }
      if (result?.ok) {
        setEditingDishName(payload.name);
        setDishPhotoFile(null);
        if (imageUrl) setDishPhotoPreview(imageUrl);
        addToast(t("nutrition.savedToMyDishes"));
        return;
      }
      addToast(t("nutrition.recipeSaveFailed"), "error");
    } catch (err) {
      console.error(err);
      if (String(err?.code || "").startsWith("storage/")) {
        addToast(t("nutrition.dishPhotoUploadFailed"), "error");
        return;
      }
      addToast(t("nutrition.recipeSaveFailed"), "error");
    } finally {
      setDishSaving(false);
    }
  };

  const addSavedDishToToday = (dish) => {
    const mealKey = MEAL_KEYS_ORDER.includes(customRecipeMeal)
      ? customRecipeMeal
      : (MEAL_KEYS_ORDER.includes(dish?.meal) ? dish.meal : "Dinner");
    const ok = addMealItem(activeDay, mealKey, dish, {
      id: `saved-${dish.name}-${Date.now()}`,
      source: dish.source || "custom",
      imageUrl: dish.imageUrl || null,
      isMyDish: true,
    });
    if (ok) addToast(t("nutrition.customRecipeAdded"));
  };

  const editSavedDish = (dish) => {
    setAddMode("dish");
    setEditingDishName(dish.name || null);
    setCustomRecipeName(dish.name || "");
    setCustomRecipeIngredients(
      Array.isArray(dish.ingredients)
        ? dish.ingredients.map((ing) => (typeof ing === "string" ? ing : (ing?.name || ing?.label || ""))).filter(Boolean).join("\n")
        : "",
    );
    setCustomRecipeMeal(MEAL_KEYS_ORDER.includes(dish.meal) ? dish.meal : "Dinner");
    setCustomRecipeEmoji(resolveRecipeEmoji(dish));
    setDishPhotoPreview(isValidRecipeImageUrl(dish.imageUrl) ? dish.imageUrl : null);
    setDishPhotoFile(null);
    const cal = Number(dish.cal ?? dish.calories ?? dish.estimatedCalories);
    if (Number.isFinite(cal) && cal > 0) {
      setCustomRecipeResult({
        estimatedCalories: cal,
        estimatedProtein: Number(dish.protein) || 0,
        estimatedCarbs: Number(dish.carbs) || 0,
        estimatedFat: Number(dish.fat) || 0,
        recipeName: dish.name,
      });
    } else {
      setCustomRecipeResult(null);
    }
  };

  const deleteSavedDish = async (dish) => {
    const result = await removeRecipe?.(dish.name);
    if (result?.ok === false) {
      addToast(t("nutrition.recipeSaveFailed"), "error");
      return;
    }
    if (editingDishName === dish.name) setEditingDishName(null);
    addToast(t("nutrition.myDishDeleted"));
  };

  const buildCustomRecipeFood = ({ adapted = false } = {}) => {
    const name = customRecipeName.trim();
    const ingredients = parseCustomIngredientsText(customRecipeIngredients);
    if (!name || ingredients.length === 0) {
      addToast(t("nutrition.customRecipeMissingFields"), "error");
      return null;
    }

    const parsedCalories = Number(customRecipeResult?.estimatedCalories ?? customRecipeResult?.calories ?? customRecipeResult?.cal ?? 0);
    const parsedProtein = Number(customRecipeResult?.estimatedProtein ?? customRecipeResult?.protein ?? 0);
    const parsedCarbs = Number(customRecipeResult?.estimatedCarbs ?? customRecipeResult?.carbs ?? 0);
    const parsedFat = Number(customRecipeResult?.estimatedFat ?? customRecipeResult?.fat ?? 0);
    const parsedPrep = Number(customRecipeResult?.prep ?? customRecipeResult?.prepTime ?? 0);
    const recipeSteps = normalizeCustomRecipeSteps(customRecipeResult);
    const recipeIngredients = normalizeCustomRecipeIngredients(customRecipeResult, ingredients);
    const emoji = resolveRecipeEmoji(
      { name, emoji: customRecipeEmoji, icon: customRecipeResult?.emoji },
      customRecipeResult?.emoji,
    );
    const photo = isValidRecipeImageUrl(dishPhotoPreview) ? dishPhotoPreview : null;
    const recommendationNotes = [
      ...(Array.isArray(customRecipeResult?.swapSuggestions) ? customRecipeResult.swapSuggestions : []),
      ...(customRecipeResult?.betterForGoal ? [customRecipeResult.betterForGoal] : []),
      ...(Array.isArray(customRecipeResult?.coachTips) ? customRecipeResult.coachTips : []),
    ].filter(Boolean);
    const adaptedSteps = adapted && recommendationNotes.length
      ? [...recipeSteps, `${t("nutrition.appliedRecommendationStep")}: ${recommendationNotes[0]}`]
      : recipeSteps;
    const customFood = {
      name: adapted ? `${name} ${t("nutrition.adaptedRecipeSuffix")}` : name,
      cal: Number.isFinite(parsedCalories) ? parsedCalories : 0,
      calories: Number.isFinite(parsedCalories) ? parsedCalories : 0,
      protein: Number.isFinite(parsedProtein) ? parsedProtein : 0,
      carbs: Number.isFinite(parsedCarbs) ? parsedCarbs : 0,
      fat: Number.isFinite(parsedFat) ? parsedFat : 0,
      prep: Number.isFinite(parsedPrep) ? parsedPrep : 0,
      prepTime: Number.isFinite(parsedPrep) ? parsedPrep : 0,
      emoji,
      icon: emoji,
      imageUrl: photo,
      ingredients: recipeIngredients,
      steps: adaptedSteps.length ? adaptedSteps : [t("nutrition.customRecipeDefaultStep")],
      source: adapted ? "custom-adapted" : "custom",
    };
    return customFood;
  };

  const regenerateMealOptions = (day, meal) => {
    if (!canChangeNutritionRecipes) return;
    const currentFoods = plan?.[day]?.[meal] || [];
    const currentNames = currentFoods.map((f) => f?.name).filter(Boolean);
    const currentNameSet = new Set(currentNames);

    const mealType = String(meal || "").toLowerCase();
    let nextFoods = null;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const seed = `${Date.now()}-${Math.random()}-${attempt}-${day}-${meal}`;
      const proposed = generateMealOptions(mealType, targetCal, goalType, dietary, {
        excludeNames: attempt < 8 ? currentNameSet : undefined,
        randomSeed: seed,
        varietyBoost: 60 + attempt * 15,
        recipesPerMeal: nutritionRecipeSlotsPerMeal,
      });
      if (!proposed?.length) continue;
      const hasNewItem = proposed.some((f) => f?.name && !currentNameSet.has(f.name));
      if (hasNewItem) {
        nextFoods = proposed;
        break;
      }
    }

    if (!nextFoods || nextFoods.length === 0) {
      addToast(t("nutrition.noOtherRecipesForFilters"), "error");
      return;
    }

    setSavedPlan((prev) => {
      const existingMeals = prev?.nutrition?.meals || {};
      const normalized = normalizeNutritionPlan(
        existingMeals,
        targetCal,
        goalType,
        dietary,
        prev?.workout?.weeklyPlan,
        workoutAdjustments,
        nutritionRecipeSlotsPerMeal,
      );
      const dayMeals = normalized?.[day] || {};
      const newPlan = {
        ...(prev || {}),
        nutrition: {
          ...(prev?.nutrition || {}),
          meals: {
            ...normalized,
            [day]: {
              ...dayMeals,
              [meal]: nextFoods,
            },
          },
        },
      };
      return newPlan;
    });

    setRegenerationSeed(Date.now());
    addToast(t("nutrition.mealUpdated"));
  };

  const analyzeRecipe = async () => {
    if (!customRecipeName.trim() || !customRecipeIngredients.trim()) return;
    setCustomRecipeLoading(true);
    setCustomRecipeResult(null);
    setGeneratedRecipes(null);
    try {
      const data = await analyzeCustomRecipe({
        goal: goalType,
        targetCalories: targetCal,
        recipeName: customRecipeName.trim(),
        ingredients: customRecipeIngredients.trim(),
        language,
      });
      setCustomRecipeResult(data);
      const aiEmoji = resolveRecipeEmoji(
        { name: customRecipeName.trim(), emoji: data?.emoji },
        data?.emoji,
      );
      setCustomRecipeEmoji(aiEmoji);
    } catch (err) {
      const code = err?.code || "";
      const rawMessage = String(err?.message || "");
      let msg = t("nutrition.customRecipeFailed");
      if (code === "functions/permission-denied") msg = t("premium.required");
      else if (code === "functions/unavailable" || rawMessage.includes("AI_TEMPORARILY_UNAVAILABLE")) {
        msg = language === "hr"
          ? "AI je trenutno zauzet. Pokušaj ponovo za trenutak."
          : "AI is temporarily busy. Please try again in a moment.";
      }
      else if (
        code === "functions/failed-precondition" ||
        rawMessage.includes("GEMINI_API_KEY") ||
        rawMessage.toLowerCase().includes("misconfigured") ||
        rawMessage.toLowerCase().includes("unregistered callers") ||
        rawMessage.toLowerCase().includes("403 forbidden")
      ) {
        msg = t("nutrition.recipeAnalysisNotConfigured");
      }
      else if (
        rawMessage.includes("Access-Control-Allow-Origin") ||
        rawMessage.toLowerCase().includes("cors") ||
        rawMessage.toLowerCase().includes("failed to fetch") ||
        rawMessage.toLowerCase().includes("networkerror")
      ) {
        msg = t("nutrition.customRecipeNetworkError");
      }
      addToast(msg, "error");
    } finally {
      setCustomRecipeLoading(false);
    }
  };

  const generateRecipeFromIngredients = async () => {
    if (generatedRecipeLoading || customRecipeLoading || !customRecipeIngredients.trim()) return;
    setGeneratedRecipeLoading(true);
    setRecipeGenerationError("");
    try {
      const data = await analyzeFood("", null, {
        goal: goalType,
        targetCalories: targetCal,
        manualIngredients: customRecipeIngredients.trim(),
        language,
      });
      const suggestions = getGeneratedRecipeSuggestions(data?.recipes);
      if (!suggestions.length) {
        setRecipeGenerationError(t("nutrition.incompleteRecipes"));
        return;
      }
      setGeneratedRecipes(suggestions);
      setCustomRecipeResult(null);
    } catch (err) {
      const code = err?.code || "";
      const rawMessage = String(err?.message || "");
      let msg = t("nutrition.recipeGenerationFailed");
      if (code === "functions/permission-denied") msg = t("premium.required");
      else if (code === "functions/unavailable" || rawMessage.includes("AI_TEMPORARILY_UNAVAILABLE")) {
        msg = language === "hr"
          ? "AI je trenutno zauzet. Pokušaj ponovo za trenutak."
          : "AI is temporarily busy. Please try again in a moment.";
      }
      else if (
        code === "functions/failed-precondition" ||
        rawMessage.includes("GEMINI_API_KEY") ||
        rawMessage.toLowerCase().includes("misconfigured") ||
        rawMessage.toLowerCase().includes("unregistered callers") ||
        rawMessage.toLowerCase().includes("403 forbidden")
      ) {
        msg = t("nutrition.recipeGeneratorNotConfigured");
      }
      setRecipeGenerationError(msg);
    } finally {
      setGeneratedRecipeLoading(false);
    }
  };

  const selectedMealEntries = MEAL_KEYS_ORDER.flatMap((meal) => (
    getMealItems(activeDay, meal).map((item) => ({ meal, item }))
  ));
  const selectedFoods = selectedMealEntries.map((entry) => entry.item);
  // Legacy Extra foodLog entries (pre-meal Quick add) still count on today only.
  const activeFoodLogTotals = activeDay === todayKey
    ? extraFoodLog.reduce(
      (acc, item) => ({
        cal: acc.cal + (Number(item?.estimatedCalories) || 0),
        protein: acc.protein + (Number(item?.protein) || 0),
        carbs: acc.carbs + (Number(item?.carbs) || 0),
        fat: acc.fat + (Number(item?.fat) || 0),
      }),
      { cal: 0, protein: 0, carbs: 0, fat: 0 },
    )
    : { cal: 0, protein: 0, carbs: 0, fat: 0 };
  const selectedTotals = sumMealItems(selectedFoods);
  const totalCal = selectedTotals.cal + activeFoodLogTotals.cal;
  const totalProtein = selectedTotals.protein + activeFoodLogTotals.protein;
  const totalCarbs = selectedTotals.carbs + activeFoodLogTotals.carbs;
  const totalFat = selectedTotals.fat + activeFoodLogTotals.fat;
  const activeDayIso = workoutAdjustments.dayIsoMap?.[activeDay];
  const activePause = Boolean(
    workoutAdjustments.pauseWindow?.active &&
    activeDayIso &&
    activeDayIso >= workoutAdjustments.pauseWindow?.startDate &&
    activeDayIso <= workoutAdjustments.pauseWindow?.endDate,
  );
  const activePeriodDayOne = workoutAdjustments.dayAdjustments?.[activeDayIso] === "period_day_1";

  const myDishes = useMemo(
    () => (Array.isArray(savedRecipes) ? savedRecipes.filter((r) => r?.source === "custom" || r?.source === "custom-adapted" || r?.isMyDish) : []),
    [savedRecipes],
  );
  const hasDishNutrition = Number(
    customRecipeResult?.estimatedCalories
      ?? customRecipeResult?.calories
      ?? customRecipeResult?.cal
      ?? 0,
  ) > 0;

  const calPct = targetCal > 0 ? Math.min(100, Math.round((totalCal / targetCal) * 100)) : 0;
  const proteinGoal = summary?.macros?.protein || 0;
  const carbsGoal = summary?.macros?.carbs || 0;
  const fatGoal = summary?.macros?.fat || 0;
  const proteinPct = proteinGoal > 0 ? Math.min(100, Math.round((totalProtein / proteinGoal) * 100)) : 0;
  const carbsPct = carbsGoal > 0 ? Math.min(100, Math.round((totalCarbs / carbsGoal) * 100)) : 0;
  const fatPct = fatGoal > 0 ? Math.min(100, Math.round((totalFat / fatGoal) * 100)) : 0;
  const shoppingFlat = (activeDayIngredients || []).flatMap((group) => group.ingredients || []);
  const shoppingUnique = [];
  const shoppingSeen = new Set();
  for (const item of shoppingFlat) {
    if (!item?.key || shoppingSeen.has(item.key)) continue;
    shoppingSeen.add(item.key);
    shoppingUnique.push(item);
  }
  const shoppingBuckets = { produce: [], protein: [], carbs: [], pantry: [], other: [] };
  for (const item of shoppingUnique) {
    shoppingBuckets[categorizeIngredient(item.name)].push(item);
  }
  const shoppingHaveCount = shoppingUnique.filter((item) => shoppingChecks[item.key]).length;
  const shoppingVisibleCats = SHOP_CATS.filter((cat) => (shoppingBuckets[cat.id] || []).length > 0);
  const shoppingColumns = balanceShopColumns(shoppingVisibleCats, shoppingBuckets);

  return (
    <div className="nutrition-page app-mobile-page" style={{ maxWidth: NP_MAX }}>
      <MobilePageHeader
        title={t("nutrition.todayHeading")}
        subtitle={t("nutrition.todaySupport")}
      />
      <header className="np-header">
        <div className="np-header-copy">
          <h1 className="app-hide-on-mobile-header">{t("nutrition.todayHeading")}</h1>
          <p>{t("nutrition.todaySupport")}</p>
        </div>
        <div className="np-header-side">
          <div className="np-header-actions">

            <button type="button" onClick={savePlan} className="np-btn-ghost">
              <HiCheck style={{ width: 15, height: 15 }} /> {t("common.save")}
            </button>
          </div>

        </div>
      </header>

      <section className="np-macros" aria-label={t("nutrition.todayHeading")}>
        <MacroCard
          emoji="🔥"
          value={loaded ? Math.round(totalCal).toLocaleString() : "—"}
          unit="kcal"
          label={t("common.kcal") || "kcal"}
          hint={loaded ? `${calPct}% ${t("common.of")} ${targetCal.toLocaleString()} kcal` : "—"}
          pct={calPct}
          accent="#F0518B"
        />
        <MacroCard
          emoji="🥩"
          value={loaded ? Math.round(totalProtein) : "—"}
          unit="g"
          label={t("common.protein")}
          hint={proteinGoal ? `${proteinPct}% ${t("common.of")} ${proteinGoal} g` : "—"}
          pct={proteinPct}
          accent="#FF6B8A"
        />
        <MacroCard
          emoji="🌾"
          value={loaded ? Math.round(totalCarbs) : "—"}
          unit="g"
          label={t("common.carbs")}
          hint={carbsGoal ? `${carbsPct}% ${t("common.of")} ${carbsGoal} g` : "—"}
          pct={carbsPct}
          accent="#E8A07A"
        />
        <MacroCard
          emoji="🥑"
          value={loaded ? Math.round(totalFat) : "—"}
          unit="g"
          label={t("common.fat")}
          hint={fatGoal ? `${fatPct}% ${t("common.of")} ${fatGoal} g` : "—"}
          pct={fatPct}
          accent="#D4A574"
        />
      </section>

      {dietary && (dietary.allergies?.length > 0 || dietary.dislikes?.length > 0 || dietary.diet !== "none") && (
        <p style={{ margin: 0, fontSize: 13, color: NP.muted }}>
          {t("nutrition.activeFilters")}: {dietary.diet !== "none" && <span style={{ fontWeight: 700, color: NP.text }}>{translateDiet(dietary.diet, language)}</span>}
          {dietary.allergies?.length > 0 && <> · {t("nutrition.no")} {dietary.allergies.map((a) => translateAllergy(a.charAt(0).toUpperCase() + a.slice(1), language)).join(", ")}</>}
          {dietary.dislikes?.length > 0 && <> · {t("nutrition.excluding")}: {dietary.dislikes.join(", ")}</>}
        </p>
      )}

      {!canChangeNutritionRecipes && (
        <p className="np-card" style={{ margin: 0, padding: "12px 16px", fontSize: 13, color: NP.muted, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <HiSparkles style={{ width: 16, height: 16, color: NP.deep }} />
          <span>{t("nutrition.freeTierRecipeHint")}</span>
          <Link to="/upgrade" style={{ fontWeight: 700, color: NP.deep }}>{t("nutrition.upgradeForRecipes")}</Link>
        </p>
      )}

      <nav className="np-tabs" aria-label={t("nutrition.title")}>
        {nutritionViewTabs.map((view) => (
          <button
            key={view.id}
            type="button"
            className={`np-tab${activeNutritionView === view.id ? " is-active" : ""}`}
            onClick={() => setActiveNutritionView(view.id)}
          >
            {view.label}
          </button>
        ))}
      </nav>

      {!loaded ? (
        <div className="np-plan-surface">
          <NutritionSkeleton />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {activeNutritionView === "plan" && (activePause || activePeriodDayOne) && (
            <div className="np-card" style={{ padding: "12px 16px", fontSize: 13, color: NP.deep, background: activePause ? NP.peach : NP.softer }}>
              <span style={{ fontWeight: 700 }}>
                {activePause ? t("nutrition.recoverySoftened") : t("nutrition.periodAdjusted")}
              </span>
            </div>
          )}

          {activeNutritionView === "plan" && (
            <div className="np-plan-surface">
              <div className="np-plan-head">
                <h2>{t("nutrition.planTitle")}</h2>
                <DayPicker
                  days={dayKeys}
                  value={activeDay}
                  todayKey={todayKey}
                  t={t}
                  onChange={setSelectedDay}
                />
              </div>
              {MEAL_KEYS_ORDER.map((meal) => (
                <MealSection
                  key={`${activeDay}-${meal}`}
                  t={t}
                  language={language}
                  meal={meal}
                  foods={Array.isArray(activeMeals[meal]) ? activeMeals[meal] : []}
                  browseFoods={mealRecipePools[meal] || []}
                  selectedItems={getMealItems(activeDay, meal)}
                  selectionEnabled={canChangeNutritionRecipes}
                  onSelect={(i) => selectOption(activeDay, meal, i)}
                  onSelectFood={(food) => selectFromPool(activeDay, meal, food)}
                  onRemoveItem={(item) => removeMealItem(activeDay, meal, item)}
                  onRegenerate={canChangeNutritionRecipes ? () => regenerateMealOptions(activeDay, meal) : undefined}
                  onSaveRecipe={handleSaveRecipe}
                  isRecipeSaved={isRecipeSaved}
                  onOpenDetails={openRecipeDetail}
                />
              ))}
            </div>
          )}

          {activeNutritionView === "scan" && (
            <div className="np-scan-surface">
              <FoodScanner
                embedded
                canAdd={canChangeNutritionRecipes}
                onAddToToday={commitScanToToday}
              />
            </div>
          )}

          {activeNutritionView === "ingredients" && (
            <div className="np-card np-shop-card">
              <div className="np-shop-head">
                <div>
                  <h2>{t("nutrition.shoppingTitle")}</h2>
                  <p className="np-shop-count">
                    <strong>{shoppingHaveCount}</strong>
                    <span> / {shoppingUnique.length}</span>
                    {" "}{t("nutrition.itemsLabel")}
                  </p>
                </div>
                <DayPicker
                  days={dayKeys}
                  value={activeDay}
                  todayKey={todayKey}
                  t={t}
                  onChange={setSelectedDay}
                />
              </div>
              {shoppingUnique.length > 0 && (
                <div className="np-progress np-shop-progress" aria-hidden>
                  <span style={{ width: `${Math.round((shoppingHaveCount / shoppingUnique.length) * 100)}%` }} />
                </div>
              )}
              <div className="np-shop-stack">
                {shoppingVisibleCats.map((cat) => (
                  <ShopGroup
                    key={cat.id}
                    t={t}
                    cat={cat}
                    items={shoppingBuckets[cat.id]}
                    shoppingChecks={shoppingChecks}
                    onToggle={toggleShoppingCheck}
                  />
                ))}
              </div>
              <div className="np-shop-grid">
                <div className="np-shop-col">
                  {shoppingColumns.left.map((cat) => (
                    <ShopGroup
                      key={cat.id}
                      t={t}
                      cat={cat}
                      items={shoppingBuckets[cat.id]}
                      shoppingChecks={shoppingChecks}
                      onToggle={toggleShoppingCheck}
                    />
                  ))}
                </div>
                {shoppingColumns.right.length > 0 && (
                  <div className="np-shop-col">
                    {shoppingColumns.right.map((cat) => (
                      <ShopGroup
                        key={cat.id}
                        t={t}
                        cat={cat}
                        items={shoppingBuckets[cat.id]}
                        shoppingChecks={shoppingChecks}
                        onToggle={toggleShoppingCheck}
                      />
                    ))}
                  </div>
                )}
              </div>
              {shoppingUnique.length === 0 && (
                <div className="np-shop-empty">
                  <p className="np-shop-empty-title">{t("nutrition.shoppingEmpty")}</p>
                  <p className="np-shop-empty-hint">{t("nutrition.dayIngredientsDesc")}</p>
                </div>
              )}
            </div>
          )}

          {activeNutritionView === "add" && (
            <div className="np-add">
              <div className="np-add-switch" role="tablist" aria-label={t("nutrition.viewAdd")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={addMode === "quick"}
                  className={`np-add-switch-btn${addMode === "quick" ? " is-active" : ""}`}
                  onClick={() => setAddMode("quick")}
                >
                  {t("nutrition.addModeQuick", "Quick add")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={addMode === "dish"}
                  className={`np-add-switch-btn${addMode === "dish" ? " is-active" : ""}`}
                  onClick={() => setAddMode("dish")}
                >
                  {t("nutrition.addModeDish", "My dish")}
                </button>
              </div>

              {addMode === "quick" && (
                <div className="np-extra">
                  <section className="np-card np-extra-entry">
                    <div className="np-extra-entry-head">
                      <div>
                        <h2>{t("nutrition.extraFoodTitle")}</h2>
                        <p>{t("nutrition.extraFoodHint")}</p>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={extraFoodInput}
                      onChange={(e) => {
                        setExtraFoodInput(e.target.value);
                        setQuickAddEstimate(null);
                        const el = e.currentTarget;
                        el.style.height = "64px";
                        el.style.height = `${Math.min(148, Math.max(64, el.scrollHeight))}px`;
                      }}
                      placeholder={t("nutrition.extraFoodPlaceholder")}
                      data-gramm="false"
                      data-gramm_editor="false"
                      data-enable-grammarly="false"
                      className="np-form-field np-extra-input"
                      disabled={extraFoodLoading}
                    />
                    <MealPicker value={quickAddMeal} onChange={setQuickAddMeal}
                      label={t("nutrition.customRecipeMeal")} language={language} />

                    {!editingFoodLogId && quickAddEstimate ? (
                      <div className="np-add-estimate">
                        <p className="np-add-estimate-name">{quickAddEstimate.name}</p>
                        <div className="np-add-estimate-macros" role="group" aria-label={t("nutrition.extraFoodEstimate")}>
                          <div className="np-add-macro">
                            <span className="np-add-macro-val">{Math.round(Number(quickAddEstimate.estimatedCalories) || 0)}</span>
                            <span className="np-add-macro-lbl">{t("common.kcal")}</span>
                          </div>
                          <div className="np-add-macro">
                            <span className="np-add-macro-val">{Math.round(Number(quickAddEstimate.protein) || 0)}g</span>
                            <span className="np-add-macro-lbl">{t("common.protein")}</span>
                          </div>
                          <div className="np-add-macro">
                            <span className="np-add-macro-val">{Math.round(Number(quickAddEstimate.carbs) || 0)}g</span>
                            <span className="np-add-macro-lbl">{t("common.carbs")}</span>
                          </div>
                          <div className="np-add-macro">
                            <span className="np-add-macro-val">{Math.round(Number(quickAddEstimate.fat) || 0)}g</span>
                            <span className="np-add-macro-lbl">{t("common.fat")}</span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="np-extra-submit-row">
                      {editingFoodLogId && (
                        <button type="button" onClick={resetFoodLogEdit} className="np-btn-ghost np-extra-cancel" disabled={extraFoodLoading}>
                          <HiXMark style={{ width: 16, height: 16 }} />
                          {t("nutrition.cancelFoodLogEdit")}
                        </button>
                      )}
                      {editingFoodLogId || !quickAddEstimate ? (
                        <button
                          type="button"
                          onClick={estimateQuickAdd}
                          disabled={extraFoodLoading || !extraFoodInput.trim()}
                          className="np-btn-primary np-extra-submit"
                          aria-busy={extraFoodLoading}
                        >
                          {extraFoodLoading ? <span className="np-spin" aria-hidden /> : null}
                          {editingFoodLogId ? t("nutrition.saveFoodLogEdit") : t("nutrition.extraFoodEstimate")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={commitQuickAddToToday}
                          disabled={!canChangeNutritionRecipes}
                          className="np-btn-primary np-extra-submit"
                        >
                          <HiPlus style={{ width: 16, height: 16 }} />
                          {t("nutrition.addToToday")}
                        </button>
                      )}
                    </div>
                    {!editingFoodLogId && quickAddEstimate ? (
                      <button
                        type="button"
                        className="np-add-reestimate"
                        onClick={() => { setQuickAddEstimate(null); estimateQuickAdd(); }}
                        disabled={extraFoodLoading}
                      >
                        {t("nutrition.extraFoodEstimate")}
                      </button>
                    ) : null}

                    <div className="np-add-quick-list">
                      {selectedMealEntries
                        .filter(({ item }) => item?.source === "quick-add")
                        .map(({ meal, item }) => (
                          <div key={item.id || `${meal}-${item.name}`} className="np-add-quick-row">
                            <span>
                              ✓ {item.name || item.inputText}
                              {" · "}
                              {Math.round(Number(item.cal ?? item.calories ?? item.estimatedCalories) || 0)} kcal
                              {" · "}
                              {translateMealLabel(meal, language)}
                            </span>
                            <button
                              type="button"
                              className="np-extra-action is-danger"
                              onClick={() => removeMealItem(activeDay, meal, item)}
                              aria-label={t("nutrition.removeChip")}
                            >
                              <HiTrash style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        ))}
                    </div>
                    {extraFoodLog.length > 0 && (
                      <div className="np-extra-log np-extra-log--legacy">
                        <p className="np-extra-legacy-label">{t("nutrition.legacyExtraLog")}</p>
                        {extraFoodLog.slice().reverse().map((entry) => {
                          const isEditing = entry.id === editingFoodLogId;
                          return (
                            <article
                              key={entry.id || `${entry.addedAt}-${entry.inputText}`}
                              className={`np-extra-item${isEditing ? " is-editing" : ""}`}
                            >
                              <div className="np-extra-item-main">
                                <p className="np-extra-item-name">{entry.name || entry.inputText}</p>
                                <div className="np-extra-item-macros">
                                  {Number(entry.estimatedCalories) > 0 && (
                                    <span>{`~${Math.round(Number(entry.estimatedCalories))} kcal`}</span>
                                  )}
                                  {Number(entry.protein) > 0 && (
                                    <span>{`${Math.round(Number(entry.protein))}g ${t("common.protein")}`}</span>
                                  )}
                                  {Number(entry.carbs) > 0 && (
                                    <span>{`${Math.round(Number(entry.carbs))}g ${t("common.carbs")}`}</span>
                                  )}
                                  {Number(entry.fat) > 0 && (
                                    <span>{`${Math.round(Number(entry.fat))}g ${t("common.fat")}`}</span>
                                  )}
                                </div>
                              </div>
                              <div className="np-extra-item-aside">
                                <span className="np-extra-item-time">{entry.addedAt ? format(new Date(entry.addedAt), "HH:mm") : ""}</span>
                                <div className="np-extra-item-actions">
                                  <button type="button" onClick={() => handleFoodLogEdit(entry)} className="np-extra-action">
                                    <HiPencilSquare style={{ width: 14, height: 14 }} /> {t("nutrition.editFoodLog")}
                                  </button>
                                  <button type="button" onClick={() => handleFoodLogDelete(entry)} className="np-extra-action is-danger">
                                    <HiTrash style={{ width: 14, height: 14 }} /> {t("nutrition.deleteFoodLog")}
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {addMode === "dish" && (
                <PremiumGate>
                  <div className="np-custom-wrap">
                    <div className="np-card np-custom-card np-custom-card--studio">
                      <div className="np-custom-head">
                        <span className="np-custom-head-icon" aria-hidden="true"><HiSparkles /></span>
                        <div>
                          <h2>{t("nutrition.customRecipeTitle")}</h2>
                          <p>{t("nutrition.customRecipeSubtitle")}</p>
                        </div>
                      </div>

                      <div className="np-dish-photo">
                        <span className="np-dish-photo-label">{t("nutrition.dishPhotoOptional")}</span>
                        <input
                          ref={dishPhotoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleDishPhotoPick}
                          hidden
                        />
                        {dishPhotoPreview ? (
                          <div className="np-dish-photo-preview-wrap">
                            <button
                              type="button"
                              className="np-dish-photo-frame"
                              onClick={() => dishPhotoInputRef.current?.click()}
                              aria-label={t("nutrition.dishPhotoPick")}
                            >
                              <img src={dishPhotoPreview} alt="" className="np-dish-photo-preview" />
                            </button>
                            <div className="np-dish-photo-actions">
                              <button type="button" className="np-btn-ghost np-btn-compact" onClick={() => dishPhotoInputRef.current?.click()}>
                                <HiCamera style={{ width: 14, height: 14 }} /> {t("nutrition.dishPhotoPick")}
                              </button>
                              <button type="button" className="np-extra-action is-danger" onClick={clearDishPhoto}>
                                <HiXMark style={{ width: 14, height: 14 }} /> {t("nutrition.dishPhotoClear")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="np-dish-photo-empty"
                            onClick={() => dishPhotoInputRef.current?.click()}
                          >
                            <span className="np-dish-photo-empty-icon" aria-hidden>
                              <HiCamera style={{ width: 22, height: 22 }} />
                            </span>
                            <span className="np-dish-photo-empty-copy">
                              <span className="np-dish-photo-empty-title">{t("nutrition.dishPhotoPick")}</span>
                              <span className="np-dish-photo-empty-hint">{t("nutrition.dishPhotoOptional")}</span>
                            </span>
                            <HiPlus className="np-dish-photo-add" aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      <label className="np-form-group np-custom-field">
                        <span>{t("nutrition.customRecipeNameLabel")}</span>
                        <input
                          value={customRecipeName}
                          onChange={(e) => setCustomRecipeName(e.target.value)}
                          placeholder={t("nutrition.customRecipeNamePlaceholder")}
                          data-gramm="false"
                          data-gramm_editor="false"
                          data-enable-grammarly="false"
                          className="np-form-field np-custom-input"
                        />
                      </label>
                      <label className="np-form-group np-custom-field np-custom-field--ingredients">
                        <span>{t("nutrition.ingredients")}</span>
                        <textarea
                          rows={3}
                          value={customRecipeIngredients}
                          onChange={(e) => setCustomRecipeIngredients(e.target.value)}
                          placeholder={t("nutrition.customRecipeIngredientsPlaceholder")}
                          data-gramm="false"
                          data-gramm_editor="false"
                          data-enable-grammarly="false"
                          className="np-form-field np-custom-input np-custom-textarea"
                        />
                      </label>
                      <div className="np-form-grid np-custom-split">
                        <MealPicker value={customRecipeMeal} onChange={setCustomRecipeMeal}
                          label={t("nutrition.customRecipeMeal")} language={language} />
                        <label className="np-form-group np-custom-field">
                          <span>{t("nutrition.customRecipeEmoji")}</span>
                          <div className="np-custom-emoji-wrap">
                            <button type="button" onClick={() => setEmojiPickerOpen((v) => !v)} className="np-form-field np-custom-input np-custom-emoji-btn">
                              <span>{customRecipeEmoji || "🍽️"} {t("nutrition.chooseEmoji")}</span>
                              <HiChevronDown style={{ width: 16, height: 16 }} />
                            </button>
                            <div className={`np-custom-emoji-pop ${emojiPickerOpen ? "" : "hidden"}`}>
                              <div className="np-custom-emoji-grid">
                                {CUSTOM_EMOJI_OPTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => { setCustomRecipeEmoji(emoji); setEmojiPickerOpen(false); }}
                                    className={`np-custom-emoji-opt${customRecipeEmoji === emoji ? " is-active" : ""}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>

                      <div className="np-custom-actions np-custom-actions--primary-row">
                        <button
                          type="button"
                          onClick={analyzeRecipe}
                          disabled={customRecipeLoading || generatedRecipeLoading || !customRecipeName.trim() || !customRecipeIngredients.trim()}
                          className="np-custom-btn np-custom-btn--primary"
                          aria-busy={customRecipeLoading}
                        >
                          <HiSparkles style={{ width: 16, height: 16 }} /> {customRecipeLoading ? t("scanner.analyzing") : t("nutrition.customRecipeAnalyze")}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={generateRecipeFromIngredients}
                        disabled={generatedRecipeLoading || customRecipeLoading || !customRecipeIngredients.trim()}
                        className="np-add-generate-link"
                        aria-busy={generatedRecipeLoading}
                      >
                        <HiArrowPath style={{ width: 14, height: 14 }} /> {generatedRecipeLoading ? t("nutrition.generatingRecipe") : t("nutrition.generateRecipe")}
                      </button>

                      {recipeGenerationError && <p className="np-recipe-generation-error" role="alert">{recipeGenerationError}</p>}

                      {hasDishNutrition ? (
                        <div className="np-add-estimate np-add-estimate--dish">
                          <RecipeVisual
                            recipe={{
                              name: customRecipeName.trim(),
                              emoji: customRecipeEmoji,
                              imageUrl: dishPhotoPreview,
                            }}
                            imageUrl={dishPhotoPreview}
                            emoji={customRecipeEmoji}
                            forceEmoji={!isValidRecipeImageUrl(dishPhotoPreview)}
                            preferCatalog={false}
                            className="np-add-estimate-visual"
                            size="hero"
                            alt=""
                          />
                          <p className="np-add-estimate-name">{customRecipeName.trim() || t("nutrition.customRecipeResult")}</p>
                          <div className="np-add-estimate-macros" role="group" aria-label={t("nutrition.customRecipeResult")}>
                            <div className="np-add-macro">
                              <span className="np-add-macro-val">{Math.round(Number(customRecipeResult?.estimatedCalories ?? customRecipeResult?.calories ?? customRecipeResult?.cal) || 0)}</span>
                              <span className="np-add-macro-lbl">{t("common.kcal")}</span>
                            </div>
                            <div className="np-add-macro">
                              <span className="np-add-macro-val">{Math.round(Number(customRecipeResult?.estimatedProtein ?? customRecipeResult?.protein) || 0)}g</span>
                              <span className="np-add-macro-lbl">{t("common.protein")}</span>
                            </div>
                            <div className="np-add-macro">
                              <span className="np-add-macro-val">{Math.round(Number(customRecipeResult?.estimatedCarbs ?? customRecipeResult?.carbs) || 0)}g</span>
                              <span className="np-add-macro-lbl">{t("common.carbs")}</span>
                            </div>
                            <div className="np-add-macro">
                              <span className="np-add-macro-val">{Math.round(Number(customRecipeResult?.estimatedFat ?? customRecipeResult?.fat) || 0)}g</span>
                              <span className="np-add-macro-lbl">{t("common.fat")}</span>
                            </div>
                          </div>
                          <div className="np-dish-after-actions">
                            <button
                              type="button"
                              onClick={saveDishToMyDishes}
                              className="np-custom-btn np-custom-btn--secondary"
                              disabled={dishSaving || !customRecipeName.trim() || !customRecipeIngredients.trim()}
                            >
                              <HiBookmark style={{ width: 16, height: 16 }} /> {dishSaving ? t("common.save") : t("nutrition.saveToMyDishes")}
                            </button>
                            {isCurrentCustomRecipeInPlan ? (
                              <button type="button" onClick={removeCustomRecipeFromPlan} className="np-custom-btn np-custom-btn--danger">
                                <HiXMark style={{ width: 16, height: 16 }} /> {t("nutrition.removeCustomFromDay")}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={addCustomRecipeToPlan}
                                className="np-custom-btn np-custom-btn--primary"
                                disabled={!canChangeNutritionRecipes || !customRecipeName.trim()}
                              >
                                <HiPlus style={{ width: 16, height: 16 }} /> {t("nutrition.addToToday")}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {generatedRecipes?.length > 0 && (
                        <div className="np-custom-suggest">
                          <p className="np-custom-suggest-title">{t("nutrition.recipeSuggestions")}</p>
                          {generatedRecipes.map((mapped, idx) => (
                            <div key={`${mapped.name}-${idx}`} className="np-custom-suggest-card">
                              <div className="np-custom-suggest-row">
                                <RecipeVisual
                                  recipe={mapped}
                                  forceEmoji
                                  preferCatalog={false}
                                  className="np-custom-suggest-visual"
                                  size="md"
                                  alt=""
                                />
                                <div>
                                  <h3>{mapped.name}</h3>
                                  <p>{mapped.cal} kcal · {mapped.protein}g {t("common.protein")} · {mapped.prep} {t("common.min")}</p>
                                </div>
                              </div>
                              <div className="np-ai-card-actions">
                                <button
                                  type="button"
                                  className="np-btn-ghost np-btn-compact"
                                  onClick={() => openRecipeDetail(toDetailFood(mapped), mapped.name, mapped.ingredientsRaw)}
                                >
                                  {t("nutrition.viewRecipe")}
                                </button>
                                <button type="button" onClick={() => handleSaveRecipe({ ...mapped, isMyDish: true, source: "custom" })} className="np-btn-primary np-btn-compact">
                                  <HiBookmark style={{ width: 14, height: 14 }} /> {t("common.save")}
                                </button>
                                <button
                                  type="button"
                                  className="np-btn-primary np-btn-compact"
                                  disabled={!canChangeNutritionRecipes}
                                  onClick={() => addRecipeToDay({ ...mapped, source: "custom" })}
                                >
                                  <HiPlus style={{ width: 14, height: 14 }} /> {t("nutrition.addToToday")}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {customRecipeResult ? (
                        <CustomRecipeAnalysisPreview
                          key={`${customRecipeResult.recipeName || customRecipeName}-${customRecipeResult.estimatedCalories}`}
                          t={t}
                          result={customRecipeResult}
                          recipeName={customRecipeName}
                          mealLabel={translateMealLabel(customRecipeMeal, language)}
                          emoji={resolveRecipeEmoji(
                            { name: customRecipeName, emoji: customRecipeEmoji },
                            customRecipeResult?.emoji,
                          )}
                          imageUrl={isValidRecipeImageUrl(dishPhotoPreview) ? dishPhotoPreview : null}
                          onApply={addAdaptedRecipeToPlan}
                        />
                      ) : null}
                    </div>

                    <section className="np-card np-my-dishes">
                      <h3>{t("nutrition.myDishesTitle")}</h3>
                      {myDishes.length === 0 ? (
                        <p className="np-extra-empty">{t("nutrition.myDishesEmpty")}</p>
                      ) : (
                        myDishes.map((dish) => (
                          <div key={dish.name || dish.id} className="np-my-dish-row">
                            <div className="np-my-dish-copy">
                              <RecipeVisual
                                recipe={dish}
                                imageUrl={dish.imageUrl}
                                forceEmoji={!isValidRecipeImageUrl(dish.imageUrl)}
                                preferCatalog={false}
                                className="np-my-dish-visual"
                                size="sm"
                                alt=""
                              />
                              <div>
                                <p className="np-my-dish-name">{dish.name}</p>
                                <p className="np-my-dish-meta">
                                  {Math.round(Number(dish.cal ?? dish.calories) || 0)} kcal
                                  {" · "}
                                  {Math.round(Number(dish.protein) || 0)}g {t("common.protein")}
                                  {dish.meal ? ` · ${translateMealLabel(dish.meal, language)}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="np-my-dish-actions">
                              <button type="button" className="np-btn-primary np-btn-compact" onClick={() => addSavedDishToToday(dish)}>
                                <HiPlus style={{ width: 14, height: 14 }} /> {t("nutrition.addToToday")}
                              </button>
                              <button type="button" className="np-extra-action" onClick={() => editSavedDish(dish)}>
                                <HiPencilSquare style={{ width: 14, height: 14 }} /> {t("common.edit")}
                              </button>
                              <button type="button" className="np-extra-action is-danger" onClick={() => deleteSavedDish(dish)}>
                                <HiTrash style={{ width: 14, height: 14 }} /> {t("nutrition.deleteFoodLog")}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </section>
                  </div>
                </PremiumGate>
              )}
            </div>
          )}
        </div>
      )}

      <RecipeDetailModal
        key={detailRecipe ? (detailRecipe.englishName || detailRecipe.food?.name || "recipe") : "closed"}
        t={t}
        recipe={detailRecipe}
        onClose={closeRecipeDetail}
      />
    </div>
  );
}

function normalizeNutritionPlan(
  meals,
  targetCal,
  goalType,
  dietary,
  workoutWeeklyPlan,
  workoutAdjustments,
  recipesPerMeal = DEFAULT_RECIPES_PER_MEAL,
) {
  if (!meals) {
    return generateWeeklyMeals(targetCal, goalType, dietary, workoutWeeklyPlan, workoutAdjustments, {
      recipesPerMeal,
    });
  }

  const firstValue = meals && typeof meals === "object" ? Object.values(meals)[0] : null;
  const isWeekly = firstValue && !Array.isArray(firstValue) && typeof firstValue === "object";
  if (isWeekly) return { ...meals };

  const weekly = generateWeeklyMeals(targetCal, goalType, dietary, workoutWeeklyPlan, workoutAdjustments, {
    recipesPerMeal,
  });
  weekly.Monday = meals || generateDayMeals(targetCal, goalType, dietary, { recipesPerMeal });
  return weekly;
}

function sanitizeNutritionMeals(meals) {
  const out = {};
  for (const day of ORDERED_DAY_KEYS) {
    if (meals?.[day]) out[day] = meals[day];
  }
  return out;
}

function parseCustomIngredientsText(value) {
  return String(value || "")
    .split(/[\n,]/)
    .map((item) => item.replace(/^[•*-]\s*/, "").trim())
    .filter(Boolean);
}

function normalizeCustomRecipeSteps(customRecipeResult) {
  const source = customRecipeResult?.steps
    ?? customRecipeResult?.instructions
    ?? customRecipeResult?.preparation
    ?? customRecipeResult?.method;

  if (!source) return [];
  if (Array.isArray(source)) {
    return source
      .flatMap((item) => {
        if (typeof item === "string") return item.split(/\n+/);
        if (item && typeof item === "object") return [item.text || item.step || item.instruction || item.value || ""];
        return [String(item || "")];
      })
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return String(source)
    .split(/\n+|(?:\s*\d+[.)]\s*)/g)
    .map((item) => item.replace(/^[-•*\s]+/, "").trim())
    .filter(Boolean);
}

function normalizeCustomRecipeIngredients(customRecipeResult, fallbackIngredients) {
  const source = customRecipeResult?.ingredients;
  if (!source) return fallbackIngredients;
  if (Array.isArray(source)) {
    const items = source
      .flatMap((item) => {
        if (typeof item === "string") return item.split(/[\n,]/);
        if (item && typeof item === "object") return [item.label || item.name || item.text || ""];
        return [String(item || "")];
      })
      .map((item) => String(item || "").replace(/^[•*-]\s*/, "").trim())
      .filter(Boolean);
    return items.length ? items : fallbackIngredients;
  }

  const items = String(source)
    .split(/[\n,]/)
    .map((item) => item.replace(/^[•*-]\s*/, "").trim())
    .filter(Boolean);
  return items.length ? items : fallbackIngredients;
}

function buildWeeklyShoppingList(plan, selections, language) {
  const itemsMap = new Map();
  const byDay = {};

  for (const [day, meals] of Object.entries(plan || {})) {
    byDay[day] = [];
    for (const [meal, foods] of Object.entries(meals || {})) {
      const foodsArr = Array.isArray(foods) ? foods : [];
      const mealItems = normalizeMealItems(selections?.[day]?.[meal], foodsArr);
      const mealIngredients = [];

      for (const selectedFood of mealItems) {
        if (!selectedFood || selectedFood.source === "quick-add" || selectedFood.source === "scan") continue;
        const originalIngredients = Array.isArray(selectedFood.ingredients) ? selectedFood.ingredients : [];
        if (!originalIngredients.length) continue;

        const translatedFood = translateFood(selectedFood, language);
        const translatedIngredients = Array.isArray(translatedFood.ingredients) ? translatedFood.ingredients : [];
        const sourceIngredients = originalIngredients.length > 0 ? originalIngredients : translatedIngredients;
        const displayIngredients = translatedIngredients.length > 0 ? translatedIngredients : originalIngredients;
        const itemIngredients = sourceIngredients
          .map((ingredient, index) => mergeIngredientLabel(ingredient, displayIngredients[index]))
          .filter(Boolean);

        mealIngredients.push(...itemIngredients);

        for (const ingredient of itemIngredients) {
          const current = itemsMap.get(ingredient.key);
          if (current) {
            current.uses += 1;
            if (ingredient.amount != null && ingredient.unit) {
              current.qty[ingredient.unit] = (current.qty[ingredient.unit] || 0) + ingredient.amount;
            }
            current.days.add(day);
            current.meals.add(meal);
          } else {
            itemsMap.set(ingredient.key, {
              key: ingredient.key,
              name: ingredient.name,
              uses: 1,
              qty: ingredient.amount != null && ingredient.unit ? { [ingredient.unit]: ingredient.amount } : {},
              days: new Set([day]),
              meals: new Set([meal]),
            });
          }
        }
      }

      if (mealIngredients.length) {
        byDay[day].push({
          meal,
          ingredients: mealIngredients,
        });
      }
    }
  }

  const items = Array.from(itemsMap.values())
    .map((item) => ({
      ...item,
      days: Array.from(item.days),
      meals: Array.from(item.meals),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { items, byDay };
}

function parseIngredientLabel(ingredient) {
  if (!ingredient || typeof ingredient !== "string") return null;

  const cleaned = ingredient.replace(/\s+/g, " ").trim();
  const withoutParens = cleaned
    .replace(/^\((.*?)\)\s*/, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .trim();

  const base = withoutParens || cleaned;
  const parsed = parseIngredientAmount(base);
  if (!parsed) return null;

  const canonicalName = canonicalizeIngredientName(parsed.name);
  const key = canonicalName
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!key) return null;
  return {
    key,
    name: canonicalName,
    amount: parsed.amount,
    unit: parsed.unit,
    label: parsed.label,
  };
}

function mergeIngredientLabel(sourceIngredient, displayIngredient) {
  const sourceParsed = parseIngredientLabel(sourceIngredient);
  if (!sourceParsed) return null;

  const displayName = getIngredientDisplayName(displayIngredient) || sourceParsed.name;
  return {
    ...sourceParsed,
    name: displayName,
    label: formatIngredientLabel(sourceParsed.amount, sourceParsed.unit, displayName),
  };
}

function getIngredientDisplayName(ingredient) {
  if (!ingredient || typeof ingredient !== "string") return "";
  const parsed = parseIngredientLabel(ingredient);
  if (parsed?.name) return parsed.name;
  return ingredient
    .replace(/^\s*\d+(?:[.,]\d+)?\s*(?:kg|g|mg|ml|l|tbsp|tsp|cup|slice|clove|can|piece|x)?\s*/i, "")
    .trim();
}

function formatIngredientLabel(amount, unit, name) {
  if (amount == null) return name;
  const unitText = unit && unit !== "count" ? `${unit} ` : "";
  return `${formatAmount(amount)} ${unitText}${name}`.replace(/\s+/g, " ").trim();
}

function canonicalizeIngredientName(name) {
  const cleaned = String(name || "").trim();
  const lower = cleaned.toLowerCase();
  if (lower === "egg" || lower === "eggs") return "eggs";
  if (lower === "jaje" || lower === "jaja") return "jaja";
  return cleaned;
}

function parseIngredientAmount(input) {
  const cleaned = String(input || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  // 80g oats, 250ml milk
  const attached = cleaned.match(/^(\d+(?:[.,]\d+)?)(kg|g|mg|ml|l)\b\s*(.*)$/i);
  if (attached) {
    const amount = Number.parseFloat(attached[1].replace(",", "."));
    const unit = attached[2].toLowerCase();
    const name = String(attached[3] || "").trim() || cleaned;
    return {
      amount: Number.isFinite(amount) ? amount : null,
      unit: Number.isFinite(amount) ? unit : null,
      name,
      label: Number.isFinite(amount) ? `${formatAmount(amount)} ${unit} ${name}`.trim() : cleaned,
    };
  }

  const wordAmount = parseLeadingWordAmount(cleaned);
  if (wordAmount) {
    return wordAmount;
  }

  // 2 eggs, 1 tbsp honey
  const separated = cleaned.match(/^(\d+(?:[.,]\d+)?)(?:\s+)(.+)$/);
  if (separated) {
    const amount = Number.parseFloat(separated[1].replace(",", "."));
    const tail = String(separated[2] || "").trim();
    if (!Number.isFinite(amount)) return { amount: null, unit: null, name: cleaned, label: cleaned };

    const [maybeUnitRaw, ...restTokens] = tail.split(" ");
    const maybeUnit = normalizeUnitToken(maybeUnitRaw);
    if (maybeUnit) {
      const name = restTokens.join(" ").trim() || tail;
      return {
        amount,
        unit: maybeUnit,
        name,
        label: `${formatAmount(amount)} ${maybeUnit === "count" ? "" : maybeUnit} ${name}`.replace(/\s+/g, " ").trim(),
      };
    }

    return {
      amount,
      unit: "count",
      name: tail,
      label: `${formatAmount(amount)} ${tail}`.trim(),
    };
  }

  return { amount: null, unit: null, name: cleaned, label: cleaned };
}

function parseLeadingWordAmount(cleaned) {
  const first = cleaned.split(" ")[0]?.toLowerCase();
  if (!first) return null;
  const map = {
    half: 0.5,
    quarter: 0.25,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    pola: 0.5,
    cetvrt: 0.25,
    jedan: 1,
    jedna: 1,
    dva: 2,
    dvije: 2,
    tri: 3,
    cetiri: 4,
    pet: 5,
    sest: 6,
    sedam: 7,
    osam: 8,
    devet: 9,
    deset: 10,
  };
  if (!(first in map)) return null;

  const amount = map[first];
  const name = cleaned.split(" ").slice(1).join(" ").trim() || cleaned;
  return {
    amount,
    unit: "count",
    name,
    label: `${formatAmount(amount)} ${name}`.trim(),
  };
}

function normalizeUnitToken(token) {
  const raw = String(token || "").toLowerCase().replace(/[.,:;)]/g, "").trim();
  if (!raw) return null;

  const units = {
    kg: ["kg", "kilogram", "kilograms"],
    g: ["g", "gr", "gram", "grams"],
    mg: ["mg", "milligram", "milligrams"],
    ml: ["ml", "milliliter", "milliliters"],
    l: ["l", "lt", "liter", "liters"],
    tbsp: ["tbsp", "tablespoon", "tablespoons", "zlica", "zlice"],
    tsp: ["tsp", "teaspoon", "teaspoons", "zlicica", "zlicice"],
    cup: ["cup", "cups", "salica", "salice"],
    slice: ["slice", "slices", "kriska", "kriske"],
    clove: ["clove", "cloves", "cesanj", "cesnja"],
    can: ["can", "cans", "konzerva", "konzerve"],
    piece: ["piece", "pieces", "komad", "komada", "kom", "pcs"],
    count: ["x"],
  };

  for (const [canonical, aliases] of Object.entries(units)) {
    if (aliases.includes(raw)) return canonical;
  }
  return null;
}

function formatAmount(value) {
  if (!Number.isFinite(value)) return "";
  if (Number.isInteger(value)) return String(value);
  const rounded = Math.round(value * 10) / 10;
  return String(rounded);
}

function MealSection({ t, language, meal, foods, browseFoods, selectedItems = [], selectionEnabled = true, onSelect, onSelectFood, onRemoveItem, onRegenerate, onSaveRecipe, isRecipeSaved, onOpenDetails }) {
  const items = Array.isArray(selectedItems) ? selectedItems : [];
  const hasSelection = items.length > 0;
  const mealKcal = items.reduce((sum, item) => sum + (Number(item?.cal ?? item?.calories ?? item?.estimatedCalories) || 0), 0);
  const browseList = useMemo(() => {
    const pool = Array.isArray(browseFoods) && browseFoods.length
      ? browseFoods
      : (Array.isArray(foods) ? foods : []);
    return pool;
  }, [browseFoods, foods]);
  const count = browseList.length;
  const preferredBrowseIndex = (() => {
    if (!items.length || !count) return 0;
    const idx = browseList.findIndex((food) => mealItemsIncludeName(items, food?.name));
    return idx >= 0 ? idx : 0;
  })();
  const [browseIndex, setBrowseIndex] = useState(null);
  const previewIndex = browseIndex == null
    ? preferredBrowseIndex
    : (count ? Math.min(Math.max(0, browseIndex), count - 1) : 0);

  const previewFood = browseList[previewIndex] || browseList[0];
  const mealLabel = translateMealLabel(meal, language);
  const featured = previewFood ? translateFood(previewFood, language) : null;
  const isCommitted = Boolean(previewFood?.name && mealItemsIncludeName(items, previewFood.name));
  const matchingSelected = isCommitted
    ? (items.find((item) => item?.name === previewFood.name) || previewFood)
    : null;
  const swipeX = useRef(null);

  const goTo = (index) => {
    if (!count) return;
    setBrowseIndex(((index % count) + count) % count);
  };

  const commitPreview = () => {
    if (!selectionEnabled || !previewFood) return;
    if (onSelectFood) onSelectFood(previewFood);
    else onSelect?.(previewIndex);
  };

  const onSwipeStart = (event) => {
    swipeX.current = event.changedTouches?.[0]?.clientX ?? null;
  };

  const onSwipeEnd = (event) => {
    if (swipeX.current == null || count < 2) {
      swipeX.current = null;
      return;
    }
    const endX = event.changedTouches?.[0]?.clientX;
    const dx = (endX ?? swipeX.current) - swipeX.current;
    swipeX.current = null;
    if (dx <= -40) goTo(previewIndex + 1);
    else if (dx >= 40) goTo(previewIndex - 1);
  };

  if ((!foods || foods.length === 0) && count === 0 && !hasSelection) {
    return (
      <section className="np-meal">
        <div className="np-meal-head">
          <h3>
            <span aria-hidden>{MEAL_EMOJI[meal] || "🍽️"}</span>
            {mealLabel}
          </h3>
        </div>
        <p className="np-meal-empty">{t("nutrition.noRecipesForFilters")}</p>
      </section>
    );
  }

  return (
    <section className="np-meal">
      <div className="np-meal-head">
        <h3>
          <span aria-hidden>{MEAL_EMOJI[meal] || "🍽️"}</span>
          {mealLabel}
        </h3>
        <div className="np-meal-head-meta">
          {count > 0 && <span className="np-meal-count">{previewIndex + 1} / {count}</span>}
          {mealKcal > 0 && <span className="np-meal-kcal">{Math.round(mealKcal)} kcal</span>}
          {selectionEnabled && onRegenerate && (
            <button type="button" onClick={onRegenerate} className="np-meal-refresh" title={t("nutrition.changeMeal")}>
              <HiArrowPath style={{ width: 14, height: 14 }} />
              <span>{t("nutrition.changeMeal")}</span>
            </button>
          )}
        </div>
      </div>
      {!hasSelection ? (
        <p className="np-meal-empty-slot">{t("nutrition.noMealSelected")}</p>
      ) : null}

      {count > 0 && previewFood ? (
        <div className="np-meal-carousel">
          <article className="np-featured">
            <div
              className="np-featured-media"
              onTouchStart={onSwipeStart}
              onTouchEnd={onSwipeEnd}
            >
              <RecipePhoto
                englishName={previewFood?.name}
                recipe={previewFood}
                imageUrl={previewFood?.imageUrl}
                emoji={previewFood?.emoji}
                alt=""
                className="np-featured-photo"
                size="hero"
              />
              {isCommitted ? (
                <p className="np-featured-badge">✓ {t("nutrition.selectedTodayBadge")}</p>
              ) : null}
              {count > 1 ? (
                <>
                  <button
                    type="button"
                    className="np-featured-nav np-featured-nav--prev"
                    onClick={() => goTo(previewIndex - 1)}
                    aria-label={t("common.back") || "Previous"}
                  >
                    <HiChevronLeft style={{ width: 18, height: 18 }} />
                  </button>
                  <button
                    type="button"
                    className="np-featured-nav np-featured-nav--next"
                    onClick={() => goTo(previewIndex + 1)}
                    aria-label={t("common.next") || "Next"}
                  >
                    <HiChevronRight style={{ width: 18, height: 18 }} />
                  </button>
                </>
              ) : null}
            </div>
            <div className="np-featured-body">
              <button
                type="button"
                className="np-featured-save"
                onClick={() => onSaveRecipe(previewFood)}
                title={isRecipeSaved(previewFood.name) ? t("nutrition.saved") : t("common.save")}
                aria-label={isRecipeSaved(previewFood.name) ? t("nutrition.saved") : t("common.save")}
              >
                {isRecipeSaved(previewFood.name) ? <HiBookmark style={{ width: 16, height: 16 }} /> : <HiOutlineBookmark style={{ width: 16, height: 16 }} />}
              </button>
              <p className="np-featured-meal">{mealLabel}</p>
              <p className="np-featured-name">{featured?.name}</p>
              <p className="np-featured-meta">
                {featured?.cal} kcal • {featured?.protein} g {t("common.protein")}
                {featured?.prep > 0 ? ` • ${featured.prep} ${t("common.min")}` : ""}
              </p>
              <div className="np-featured-footer">
                <button
                  type="button"
                  className="np-featured-details"
                  onClick={() => onOpenDetails?.(featured, previewFood?.name, previewFood?.ingredients)}
                >
                  {t("common.details")}
                  <HiArrowRight style={{ width: 13, height: 13 }} />
                </button>
                {selectionEnabled && isCommitted ? (
                  <button
                    type="button"
                    className="np-featured-select np-featured-remove"
                    onClick={() => onRemoveItem?.(matchingSelected || previewFood)}
                  >
                    {t("nutrition.removeChip")}
                  </button>
                ) : selectionEnabled ? (
                  <button
                    type="button"
                    className="np-featured-select"
                    onClick={commitPreview}
                  >
                    {`+ ${t("nutrition.selectChip")}`}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
          {count > 1 && count <= 6 ? (
            <div className="np-featured-dots" aria-hidden>
              {browseList.map((food, i) => (
                <button
                  key={`${food?.name || "dot"}-${i}`}
                  type="button"
                  className={`np-featured-dot${i === previewIndex ? " is-on" : ""}`}
                  onClick={() => goTo(i)}
                  tabIndex={-1}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasSelection ? (
        <div className="np-meal-today">
          <p className="np-meal-today-label">{(t("nutrition.todaysMealList") || "Today's {meal}").replace("{meal}", mealLabel)}</p>
          <ul className="np-meal-today-list">
            {items.map((item) => {
              const kcal = Math.round(Number(item?.cal ?? item?.calories ?? item?.estimatedCalories) || 0);
              return (
                <li key={item.id || item.name} className="np-meal-today-row">
                  <span>✓ {item.name}{kcal > 0 ? ` · ${kcal} kcal` : ""}</span>
                  {selectionEnabled ? (
                    <button
                      type="button"
                      className="np-meal-today-remove"
                      onClick={() => onRemoveItem?.(item)}
                      aria-label={t("nutrition.removeChip")}
                    >
                      <HiXMark style={{ width: 14, height: 14 }} />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {selectionEnabled ? (
            <span className="np-meal-add-another">{t("nutrition.addAnother")}</span>
          ) : null}
        </div>
      ) : null}

      <div className="np-recipes">
        {(Array.isArray(foods) ? foods : []).map((food, i) => {
          const translated = translateFood(food, language);
          return (
            <RecipeCard
              key={`${food?.name || "recipe"}-${i}`}
              t={t}
              language={language}
              food={translated}
              englishName={food?.name}
              mealLabel={mealLabel}
              isSelected={mealItemsIncludeName(items, food.name)}
              selectionEnabled={selectionEnabled}
              onSelect={() => onSelect(i)}
              onSave={() => onSaveRecipe(food)}
              isSaved={isRecipeSaved(food.name)}
              onOpenDetails={() => onOpenDetails?.(translated, food?.name, food?.ingredients)}
            />
          );
        })}
      </div>
    </section>
  );
}

function RecipeCard({ t, food, englishName, mealLabel, isSelected, selectionEnabled = true, onSelect, onSave, isSaved, onOpenDetails }) {
  if (!food) return null;

  return (
    <article className={`np-recipe${isSelected ? " is-selected" : " np-recipe--alt"}`}>
      <div
        className="np-recipe-main"
        onClick={selectionEnabled ? onSelect : undefined}
        onKeyDown={selectionEnabled ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } } : undefined}
        role={selectionEnabled ? "button" : undefined}
        tabIndex={selectionEnabled ? 0 : undefined}
      >
        <div className="np-recipe-media">
          <RecipePhoto
            englishName={englishName || food.name}
            recipe={food}
            imageUrl={food.imageUrl}
            emoji={food.emoji}
            alt=""
          />
        </div>
        <div className="np-recipe-body">
          <button
            type="button"
            className="np-recipe-save"
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            title={isSaved ? t("nutrition.saved") : t("common.save")}
            aria-label={isSaved ? t("nutrition.saved") : t("common.save")}
          >
            {isSaved ? <HiBookmark style={{ width: 16, height: 16 }} /> : <HiOutlineBookmark style={{ width: 16, height: 16 }} />}
          </button>
          {mealLabel ? <p className="np-recipe-meal">{mealLabel}</p> : null}
          <p className="np-recipe-name">{food.name}</p>
          <p className="np-recipe-meta">
            {food.cal} kcal • {food.protein} g {t("common.protein")}
            {food.prep > 0 ? ` • ${food.prep} ${t("common.min")}` : ""}
          </p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenDetails?.(); }}
            className="np-recipe-more"
          >
            {t("common.details")}
            <HiArrowRight style={{ width: 13, height: 13 }} />
          </button>
        </div>
        <button
          type="button"
          className="np-recipe-chevron"
          onClick={(e) => { e.stopPropagation(); onOpenDetails?.(); }}
          aria-label={t("common.details")}
        >
          <HiChevronRight style={{ width: 20, height: 20 }} />
        </button>
      </div>
    </article>
  );
}

function analysisItemText(item) {
  if (item == null) return "";
  if (typeof item === "string") return item.trim();
  return String(item.suggestion || item.text || item.tip || item.ingredient || "").trim();
}

function firstSentence(text, maxChars = 88) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  const match = raw.match(/^(.+?[.!?])(?:\s|$)/);
  let sentence = (match ? match[1] : raw).trim();
  if (sentence.length > maxChars) {
    const cut = sentence.slice(0, maxChars - 1);
    const at = cut.lastIndexOf(" ");
    sentence = `${cut.slice(0, at > 50 ? at : maxChars - 1).trim()}…`;
  }
  return sentence;
}

function getDisplayInsights(result) {
  const strengths = Array.isArray(result?.strengths) ? result.strengths : [];
  const swaps = Array.isArray(result?.swapSuggestions) ? result.swapSuggestions : [];
  const reduce = Array.isArray(result?.removeOrReduce) ? result.removeOrReduce : [];
  const swapRaw = swaps[0];
  const swapText = typeof swapRaw === "string"
    ? swapRaw
    : (swapRaw?.suggestion || [swapRaw?.ingredient, swapRaw?.suggestion].filter(Boolean).join(" → "));
  return {
    good: firstSentence(analysisItemText(strengths[0]) || result?.summary),
    swap: firstSentence(swapText),
    watch: firstSentence(analysisItemText(reduce[0]) || result?.betterForGoal),
  };
}

function getDisplayCoachTip(result) {
  const tip = (Array.isArray(result?.coachTips) ? result.coachTips : [])
    .map((item) => firstSentence(analysisItemText(item)))
    .find(Boolean);
  return tip || firstSentence(result?.betterForGoal) || firstSentence(result?.summary);
}

function getFullAnalysisBullets(result, exclude = []) {
  const bullets = [];
  const excluded = new Set(exclude.filter(Boolean));
  const push = (text) => {
    const sentence = firstSentence(text, 88);
    if (sentence && !excluded.has(sentence) && !bullets.includes(sentence)) {
      bullets.push(sentence);
    }
  };
  const pushAll = (items) => {
    (Array.isArray(items) ? items : []).forEach((item) => {
      if (typeof item === "string") {
        push(item);
        return;
      }
      push(item?.suggestion || [item?.ingredient, item?.suggestion].filter(Boolean).join(" → "));
      if (item?.reason) push(item.reason);
      if (item?.text || item?.tip) push(item.text || item.tip);
    });
  };
  const summaryParts = String(result?.summary || "").replace(/\s+/g, " ").trim()
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  summaryParts.forEach((part) => push(part));
  pushAll(result?.strengths);
  pushAll(result?.swapSuggestions);
  pushAll(result?.removeOrReduce);
  pushAll(result?.coachTips);
  push(result?.betterForGoal);
  return bullets.slice(0, 5);
}

function CustomRecipeAnalysisPreview({ t, result, recipeName, mealLabel, emoji, imageUrl, onApply }) {
  const [showMore, setShowMore] = useState(false);
  const insights = getDisplayInsights(result);
  const coachTip = getDisplayCoachTip(result);
  const extraBullets = getFullAnalysisBullets(result, [
    insights.good,
    insights.swap,
    insights.watch,
    coachTip,
  ]);
  const hasMore = extraBullets.length > 0;
  const canApply = Boolean(result?.swapSuggestions?.length || result?.betterForGoal || result?.coachTips?.length);
  const cards = [
    { key: "good", tone: "good", icon: "✓", title: t("nutrition.analysisGood"), text: insights.good },
    { key: "swap", tone: "swap", icon: "↔", title: t("nutrition.analysisBestSwap"), text: insights.swap },
    { key: "watch", tone: "watch", icon: "!", title: t("nutrition.analysisImprove"), text: insights.watch },
  ];
  const displayEmoji = resolveRecipeEmoji(
    { name: result?.recipeName || recipeName, emoji },
    result?.emoji,
  );

  return (
    <div className="np-custom-preview">
      <RecipeVisual
        recipe={{ name: result?.recipeName || recipeName, emoji: displayEmoji, imageUrl }}
        imageUrl={imageUrl}
        emoji={displayEmoji}
        forceEmoji={!isValidRecipeImageUrl(imageUrl)}
        preferCatalog={false}
        className="np-ai-recipe-visual"
        size="hero"
        alt=""
      />
      <div className="np-custom-preview-head">
        <div>
          <h3>{result.recipeName || recipeName}</h3>
          <p>{mealLabel}</p>
        </div>
      </div>
      <div className="np-custom-chips">
        {result.estimatedCalories != null && result.estimatedCalories !== "" && (
          <span className="np-detail-chip">{result.estimatedCalories} {t("common.kcal")}</span>
        )}
        {result.estimatedProtein != null && result.estimatedProtein !== "" && (
          <span className="np-detail-chip">{result.estimatedProtein}g {t("common.protein")}</span>
        )}
        {result.estimatedCarbs != null && result.estimatedCarbs !== "" && (
          <span className="np-detail-chip">{result.estimatedCarbs}g {t("common.carbs")}</span>
        )}
        {result.estimatedFat != null && result.estimatedFat !== "" && (
          <span className="np-detail-chip">{result.estimatedFat}g {t("common.fat")}</span>
        )}
      </div>
      <div className="np-score-grid">
        {cards.map((card) => (
          <article key={card.key} className={`np-score-card np-score-card--${card.tone}`}>
            <span className="np-score-card-icon" aria-hidden>{card.icon}</span>
            <p className="np-score-card-title">{card.title}</p>
            <p className="np-score-card-text">{card.text || "—"}</p>
          </article>
        ))}
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={!canApply}
        title={!result ? t("nutrition.noRecommendationsToApply") : undefined}
        className="np-custom-btn np-custom-btn--apply"
      >
        {t("nutrition.applyRecommendations")}
      </button>
      {coachTip && (
        <div className="np-score-coach">
          <span className="np-score-coach-icon" aria-hidden>💡</span>
          <p>{coachTip}</p>
        </div>
      )}
      {hasMore && (
        <button
          type="button"
          className="np-custom-full-toggle"
          aria-expanded={showMore}
          onClick={() => setShowMore((open) => !open)}
        >
          {showMore ? t("nutrition.hideFullAnalysis") : t("nutrition.showFullAnalysis")}
        </button>
      )}
      {showMore && (
        <ul className="np-custom-full-list">
          {extraBullets.map((item, idx) => (
            <li key={`full-${idx}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

