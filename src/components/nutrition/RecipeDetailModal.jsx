import { useEffect, useState } from "react";
import { HiXMark } from "react-icons/hi2";
import RecipeVisual from "./RecipeVisual";
import { pickIngredientList } from "../../utils/aiRecipes";

export default function RecipeDetailModal({ t, recipe, onClose }) {
  const [tab, setTab] = useState("ingredients");
  const food = recipe?.food;
  const englishName = recipe?.englishName;
  const originalIngredients = recipe?.originalIngredients;

  useEffect(() => {
    if (!food) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [food, onClose]);

  if (!food) return null;

  const ingredients = pickIngredientList(food.ingredients, originalIngredients);
  const steps = Array.isArray(food.steps) ? food.steps.filter(Boolean) : [];
  const servings = Math.max(1, Number(food.servings) || 1);
  const chips = [
    food.cal != null ? { key: "cal", emoji: "🔥", label: `${food.cal} kcal` } : null,
    food.protein != null ? { key: "protein", emoji: "💪", label: `${food.protein} g ${t("common.protein")}` } : null,
    food.carbs != null ? { key: "carbs", emoji: "🌾", label: `${food.carbs} g ${t("common.carbs")}` } : null,
    food.fat != null ? { key: "fat", emoji: "🥑", label: `${food.fat} g ${t("common.fat")}` } : null,
    food.prep > 0 ? { key: "prep", emoji: "⏱", label: `${food.prep} ${t("common.min")}` } : null,
    { key: "servings", emoji: "🍽️", label: `${servings} ${t("nutrition.servings")}` },
  ].filter(Boolean);

  return (
    <div className="np-detail-overlay" onClick={onClose} role="presentation">
      <div
        className="np-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="np-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="np-detail-close"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <HiXMark style={{ width: 18, height: 18 }} />
        </button>
        <RecipeVisual
          englishName={englishName || food.name}
          recipe={food}
          imageUrl={food.imageUrl}
          emoji={food.emoji}
          alt=""
          className="np-detail-hero"
          size="hero"
        />
        <div className="np-detail-body">
          <h2 id="np-detail-title">{food.name}</h2>
          {food.description ? <p className="np-detail-desc">{food.description}</p> : null}
          {chips.length > 0 && (
            <div className="np-detail-chips">
              {chips.map((chip) => (
                <span key={chip.key} className="np-detail-chip">
                  <span aria-hidden>{chip.emoji}</span>
                  {chip.label}
                </span>
              ))}
            </div>
          )}
          <div className="np-detail-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "ingredients"}
              className={`np-detail-tab${tab === "ingredients" ? " is-active" : ""}`}
              onClick={() => setTab("ingredients")}
            >
              {t("nutrition.ingredients")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "steps"}
              className={`np-detail-tab${tab === "steps" ? " is-active" : ""}`}
              onClick={() => setTab("steps")}
            >
              {t("nutrition.steps")}
            </button>
          </div>
          {tab === "ingredients" ? (
            ingredients.length ? (
              <ul className="np-detail-list">
                {ingredients.map((ing, i) => (
                  <li key={`${ing}-${i}`}>{ing}</li>
                ))}
              </ul>
            ) : (
              <p className="np-detail-empty">{t("nutrition.recipeDetailsMissing")}</p>
            )
          ) : steps.length ? (
            <ol className="np-detail-steps">
              {steps.map((step, i) => (
                <li key={`${i}-${step}`}>
                  <span className="np-detail-step-num" aria-hidden>{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="np-detail-empty">{t("nutrition.recipeDetailsMissing")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
