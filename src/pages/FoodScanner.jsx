import { useMemo, useRef, useState } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { translateMealLabel } from "../i18n/nutritionTranslations";
import { useToast } from "../components/common/Toast";
import { getUserPlanSummary } from "../utils/planEngine";
import { analyzeFood } from "../services/geminiService";
import PremiumGate from "../components/common/PremiumGate";
import RecipeVisual from "../components/nutrition/RecipeVisual";
import RecipeDetailModal from "../components/nutrition/RecipeDetailModal";
import { splitAiRecipes, toDetailFood } from "../utils/aiRecipes";
import { HiCamera, HiPhoto, HiArrowPath, HiPlus, HiChevronDown, HiPencilSquare } from "react-icons/hi2";
import { format } from "date-fns";
import { fileToOptimizedJpegDataUrl } from "../utils/imageCompress";

const MEAL_KEYS = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function FoodScanner({
  embedded = false,
  onAddToToday = null,
  canAdd = true,
}) {
  const { t, language } = useTranslation();
  const { userGoal } = useAuth();
  const { addToast } = useToast();
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [resultFromPhoto, setResultFromPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualIngredients, setManualIngredients] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [scanMeal, setScanMeal] = useState("Lunch");
  const [adding, setAdding] = useState(false);
  const [addingName, setAddingName] = useState(null);
  const [detailRecipe, setDetailRecipe] = useState(null);

  const summary = getUserPlanSummary(userGoal);
  const hasManualIngredients = manualIngredients.trim().length > 0;
  const canAnalyze = Boolean(preview || hasManualIngredients);
  const recipeSplit = useMemo(() => splitAiRecipes(result?.recipes), [result]);
  const completeRecipes = recipeSplit.complete;
  const hasIncomplete = recipeSplit.incomplete.length > 0;
  const hasResult = Boolean(result);
  const analyzeLabel = preview && hasManualIngredients
    ? t("scanner.generateFromIngredients")
    : preview
      ? t("scanner.analyzeFood")
      : t("scanner.generateFromIngredients");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setResult(null);
    try {
      const dataUrl = await fileToOptimizedJpegDataUrl(file);
      setPreview(dataUrl);
    } catch (err) {
      console.error("Food image compress:", err);
      addToast(t("scanner.imageLoadFailed"), "error");
    }
  };

  const analyze = async () => {
    const trimmedIngredients = manualIngredients.trim();
    if (!preview && !trimmedIngredients) return;
    let base64 = "";
    if (preview) {
      const comma = preview.indexOf(",");
      base64 = comma >= 0 ? preview.slice(comma + 1) : "";
      if (!base64 && !trimmedIngredients) {
        addToast(t("scanner.imageLoadFailed"), "error");
        return;
      }
    }
    setLoading(true);
    try {
      const data = await analyzeFood(base64, preview ? "image/jpeg" : null, {
        goal: userGoal?.goal || "only_training",
        targetCalories: summary?.calories || 2000,
        manualIngredients: trimmedIngredients,
        language,
      });
      setResult(data);
      setResultFromPhoto(Boolean(preview));
    } catch (err) {
      const code = err?.code || "";
      const rawMsg = err?.message || "";
      const reason = err?.clientReason || "";
      let msg = rawMsg || t("scanner.failedAnalyze");
      if (reason === "premium_required" || code === "functions/permission-denied") {
        msg = t("premium.required");
      } else if (reason === "ai_busy" || code === "functions/unavailable" || rawMsg.includes("AI_TEMPORARILY_UNAVAILABLE")) {
        msg = language === "hr"
          ? "AI je trenutno zauzet. Pokušaj ponovo za trenutak."
          : "AI is temporarily busy. Please try again in a moment.";
      } else if (
        reason === "ai_misconfigured"
        || rawMsg.includes("GEMINI_API_KEY_MISSING")
        || rawMsg.includes("misconfigured")
        || code === "functions/failed-precondition"
      ) {
        msg = t("scanner.aiNotConfigured") !== "scanner.aiNotConfigured"
          ? t("scanner.aiNotConfigured")
          : "AI analiza jos nije postavljena. Treba postaviti GEMINI_API_KEY u Cloud Functions.";
      } else if (
        reason === "analysis_failed"
        || rawMsg.includes("ANALYSIS_FAILED")
        || code === "functions/internal"
      ) {
        msg = t("scanner.failedAnalyze");
      } else if (
        rawMsg.toLowerCase().includes("api key") ||
        rawMsg.toLowerCase().includes("unregistered callers") ||
        rawMsg.toLowerCase().includes("403 forbidden")
      ) {
        msg = "AI analiza jos nije postavljena. Treba postaviti GEMINI_API_KEY u Cloud Functions.";
      } else if (
        rawMsg.toLowerCase().includes("failed to fetch") ||
        rawMsg.toLowerCase().includes("networkerror") ||
        rawMsg.toLowerCase().includes("cors")
      ) {
        msg = t("scanner.networkError") !== "scanner.networkError"
          ? t("scanner.networkError")
          : "Mrezna greska. Provjeri internet vezu i pokusaj ponovo.";
      } else if (/^[A-Z0-9_]+$/.test(rawMsg.trim()) || rawMsg.includes("Firebase:")) {
        // Never surface raw Cloud Function codes like ANALYSIS_FAILED.
        msg = t("scanner.failedAnalyze");
      }
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const addToMealsLegacy = async (recipe) => {
    const user = auth.currentUser;
    if (!user) return false;
    const dateKey = format(new Date(), "yyyy-MM-dd");
    try {
      const progressRef = doc(db, "progress", user.uid, "daily", dateKey);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(progressRef);
        const prev = snap.exists() ? snap.data() : {};
        const prevScanned = Array.isArray(prev?.meals?.scanned) ? prev.meals.scanned : [];
        const scannedEntry = {
          name: recipe.name,
          calories: Number(recipe.calories) || 0,
          protein: Number(recipe.protein) || 0,
          carbs: Number(recipe.carbs) || 0,
          fat: Number(recipe.fat) || 0,
          addedAt: new Date().toISOString(),
        };
        tx.set(
          progressRef,
          {
            meals: {
              ...(prev?.meals || {}),
              scanned: [...prevScanned, scannedEntry],
            },
            caloriesConsumed: (Number(prev?.caloriesConsumed) || 0) + scannedEntry.calories,
            date: dateKey,
          },
          { merge: true },
        );
      });
      addToast(`"${recipe.name}" ${t("scanner.addedMeals")}`);
      return true;
    } catch {
      addToast(t("scanner.failedAdd"), "error");
      return false;
    }
  };

  const commitAddToToday = async (recipe) => {
    if (!recipe?.name || adding) return;
    if (!canAdd) {
      addToast(t("premium.required"), "error");
      return;
    }
    setAdding(true);
    setAddingName(recipe.name);
    try {
      const payload = {
        meal: MEAL_KEYS.includes(scanMeal) ? scanMeal : "Lunch",
        name: recipe.name,
        cal: recipe.calories,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        prep: recipe.prep,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        source: "scan",
        imageUrl: resultFromPhoto ? preview : null,
        emoji: recipe.emoji || null,
      };

      if (typeof onAddToToday === "function") {
        const ok = onAddToToday(payload);
        if (ok) addToast(`"${payload.name}" ${t("scanner.addedMeals")}`);
        return;
      }

      await addToMealsLegacy(payload);
    } finally {
      setAdding(false);
      setAddingName(null);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setResultFromPhoto(false);
    setManualIngredients("");
    setManualOpen(false);
    setAdding(false);
    setAddingName(null);
    setDetailRecipe(null);
    if (galleryRef.current) galleryRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  return (
    <div className={embedded ? "np-scan-embed" : "p-4 sm:p-6 max-w-3xl mx-auto np-scan-embed"}>
      {!embedded ? (
        <div className="np-scan-standalone-head">
          <h1>{t("scanner.title")}</h1>
          <p>{t("scanner.desc")}</p>
        </div>
      ) : null}

      <PremiumGate feature="aiScanner">
        <div className="np-scan-stack">
          <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

          {!preview ? (
            <section className="np-scan-hero">
              <span className="np-scan-hero-icon" aria-hidden>
                <HiCamera />
              </span>
              <h2 className="np-scan-hero-title">{t("scanner.scanYourMeal")}</h2>
              <p className="np-scan-hero-hint">{t("scanner.scanHelper")}</p>
              <div className="np-scan-hero-actions">
                <button
                  type="button"
                  className="np-scan-btn-primary"
                  onClick={() => cameraRef.current?.click()}
                >
                  <HiCamera aria-hidden /> {t("scanner.takePhoto")}
                </button>
                <button
                  type="button"
                  className="np-scan-btn-secondary"
                  onClick={() => galleryRef.current?.click()}
                >
                  <HiPhoto aria-hidden /> {t("scanner.fromGallery")}
                </button>
              </div>
            </section>
          ) : (
            <section className="np-scan-preview-card">
              <div className="np-scan-preview-frame">
                <img src={preview} alt={t("scanner.foodPreviewAlt")} className="np-scan-preview-img" />
              </div>
              <div className="np-scan-preview-actions">
                <button
                  type="button"
                  className="np-scan-btn-secondary"
                  onClick={() => galleryRef.current?.click()}
                >
                  <HiArrowPath aria-hidden /> {t("scanner.changePhoto")}
                </button>
                <button
                  type="button"
                  className="np-scan-btn-primary"
                  onClick={analyze}
                  disabled={loading || !canAnalyze}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <span className="np-scan-spin" aria-hidden />
                      {t("scanner.analyzing")}
                    </>
                  ) : (
                    <>
                      <HiPhoto aria-hidden /> {analyzeLabel}
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          <div className={`np-scan-manual${manualOpen || hasManualIngredients ? " is-open" : ""}`}>
            <button
              type="button"
              className="np-scan-manual-toggle"
              onClick={() => setManualOpen((v) => !v)}
              aria-expanded={manualOpen || hasManualIngredients}
            >
              <span className="np-scan-manual-label">
                <span className="np-scan-manual-icon" aria-hidden>
                  <HiPencilSquare />
                </span>
                <span>{t("scanner.manualTitle")}</span>
              </span>
              <HiChevronDown aria-hidden />
            </button>
            {(manualOpen || hasManualIngredients) && (
              <div className="np-scan-manual-body">
                <textarea
                  rows={3}
                  value={manualIngredients}
                  onChange={(e) => {
                    setManualIngredients(e.target.value);
                    setResult(null);
                  }}
                  placeholder={t("scanner.manualPlaceholder")}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                  className="np-scan-manual-input"
                />
                {!preview && (
                  <button
                    type="button"
                    className="np-scan-btn-primary"
                    onClick={analyze}
                    disabled={loading || !canAnalyze}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <>
                        <span className="np-scan-spin" aria-hidden />
                        {t("scanner.analyzing")}
                      </>
                    ) : (
                      analyzeLabel
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {hasResult ? (
            <section className="np-scan-result-list">
              {resultFromPhoto && preview ? (
                <div className="np-scan-photo-thumb-wrap">
                  <img src={preview} alt={t("scanner.foodPreviewAlt")} className="np-scan-photo-thumb" />
                </div>
              ) : null}

              {completeRecipes.length > 0 ? (
                <>
                  <p className="np-scan-result-badge">✨ {t("scanner.aiRecipeBadge")}</p>
                  <h3 className="np-scan-result-heading">{t("nutrition.recipeSuggestions")}</h3>
                  <label className="np-scan-meal">
                    <span>{t("nutrition.customRecipeMeal")}</span>
                    <select
                      value={scanMeal}
                      onChange={(e) => setScanMeal(e.target.value)}
                      className="np-scan-meal-select"
                    >
                      {MEAL_KEYS.map((meal) => (
                        <option key={meal} value={meal}>{translateMealLabel(meal, language)}</option>
                      ))}
                    </select>
                  </label>
                  {completeRecipes.map((recipe) => (
                    <article key={recipe.id} className="np-scan-result np-ai-recipe-card">
                      <RecipeVisual
                        recipe={{ ...recipe, source: resultFromPhoto ? "scan" : "custom" }}
                        imageUrl={null}
                        emoji={recipe.emoji}
                        forceEmoji
                        preferCatalog={false}
                        className="np-scan-result-visual"
                        size="hero"
                        alt={recipe.name || ""}
                      />
                      <p className="np-scan-result-name">{recipe.name}</p>
                      {recipe.description ? (
                        <p className="np-scan-result-desc">{recipe.description}</p>
                      ) : null}
                      <p className="np-scan-result-meta">
                        {recipe.prep} {t("common.min")} · {recipe.servings} {t("nutrition.servings")}
                      </p>
                      <div className="np-scan-macros" role="group" aria-label={recipe.name}>
                        <div className="np-scan-macro">
                          <span className="np-scan-macro-val">{recipe.calories}</span>
                          <span className="np-scan-macro-lbl">{t("common.kcal")}</span>
                        </div>
                        <div className="np-scan-macro">
                          <span className="np-scan-macro-val">{recipe.protein}g</span>
                          <span className="np-scan-macro-lbl">{t("common.protein")}</span>
                        </div>
                        <div className="np-scan-macro">
                          <span className="np-scan-macro-val">{recipe.carbs}g</span>
                          <span className="np-scan-macro-lbl">{t("common.carbs")}</span>
                        </div>
                        <div className="np-scan-macro">
                          <span className="np-scan-macro-val">{recipe.fat}g</span>
                          <span className="np-scan-macro-lbl">{t("common.fat")}</span>
                        </div>
                      </div>
                      <div className="np-ai-card-actions">
                        <button
                          type="button"
                          className="np-scan-btn-secondary"
                          onClick={() => setDetailRecipe({
                            food: toDetailFood(recipe, { source: "scan" }),
                            englishName: recipe.name,
                            originalIngredients: recipe.ingredientsRaw,
                          })}
                        >
                          {t("nutrition.viewRecipe")}
                        </button>
                        <button
                          type="button"
                          className="np-scan-btn-primary np-scan-add-today"
                          onClick={() => commitAddToToday(recipe)}
                          disabled={adding || !canAdd}
                        >
                          <HiPlus aria-hidden /> {adding && addingName === recipe.name ? t("common.save") : t("nutrition.addToToday")}
                        </button>
                      </div>
                    </article>
                  ))}
                </>
              ) : (
                <div className="np-scan-result np-scan-incomplete">
                  <p className="np-scan-result-name">{t("nutrition.incompleteRecipes")}</p>
                  <button
                    type="button"
                    className="np-scan-btn-primary"
                    onClick={analyze}
                    disabled={loading}
                  >
                    <HiArrowPath aria-hidden /> {t("scanner.regenerateRecipes")}
                  </button>
                </div>
              )}

              {completeRecipes.length > 0 && hasIncomplete ? (
                <p className="np-scan-incomplete-note">
                  {t("nutrition.incompleteRecipes")}
                  {" "}
                  <button type="button" className="np-scan-reset-link" onClick={analyze} disabled={loading}>
                    {t("scanner.regenerateRecipes")}
                  </button>
                </p>
              ) : null}

              <button type="button" className="np-scan-reset-link" onClick={reset}>
                <HiArrowPath aria-hidden style={{ width: 14, height: 14 }} />
                {" "}
                {resultFromPhoto ? t("scanner.scanAnother") : t("scanner.tryOtherIngredients")}
              </button>
            </section>
          ) : null}
        </div>
      </PremiumGate>
      <RecipeDetailModal
        t={t}
        recipe={detailRecipe}
        onClose={() => setDetailRecipe(null)}
      />
    </div>
  );
}
