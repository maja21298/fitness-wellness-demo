import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { translateFood } from "../i18n/nutritionTranslations";
import { useToast } from "../components/common/Toast";
import { getRecipeSearchUrl } from "../utils/nutritionGenerator";
import {
  HiArrowLeft,
  HiTrash,
  HiArrowTopRightOnSquare,
  HiChevronDown,
  HiChevronUp,
  HiBookmark,
} from "react-icons/hi2";

export default function SavedRecipes() {
  const { t, language } = useTranslation();
  const { savedRecipes, removeRecipe } = useAuth();
  const { addToast } = useToast();

  const handleRemove = async (name) => {
    await removeRecipe(name);
    addToast(t("recipes.removed"));
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/nutrition"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <HiArrowLeft className="w-4 h-4" /> {t("recipes.back")}
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <HiBookmark className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t("recipes.title")}</h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {savedRecipes?.length || 0}{" "}
          {savedRecipes?.length === 1
            ? t("recipes.recipeSaved")
            : t("recipes.recipesSaved")}{" "}
          {t("recipes.saved")}
        </p>
      </div>

      {!savedRecipes || savedRecipes.length === 0 ? (
        <div className="app-card p-8 text-center">
          <span className="text-4xl block mb-3">📖</span>
          <p className="text-gray-500 font-medium">{t("recipes.noRecipes")}</p>
          <p className="text-sm text-gray-400 mt-1">
            {t("recipes.noRecipesDesc")}
          </p>
          <Link
            to="/nutrition"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90"
          >
            {t("recipes.goToNutrition")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedRecipes.map((food) => (
            <SavedCard
              key={food.name}
              t={t}
              language={language}
              food={translateFood(food, language)}
              originalName={food.name}
              onRemove={() => handleRemove(food.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedCard({ t, language, food, originalName, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="holo-border app-card !p-4">
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0">{food.emoji || "🍽️"}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{food.name}</h3>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-1">
            <span className="font-medium text-gray-600">{food.cal} kcal</span>
            <span>P:{food.protein}g</span>
            <span>C:{food.carbs}g</span>
            <span>F:{food.fat}g</span>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0 p-1"
          title={t("common.remove")}
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 mt-3"
      >
        {expanded ? (
          <>
            {t("recipes.hideDetails")} <HiChevronUp className="w-3 h-3" />
          </>
        ) : (
          <>
            {t("recipes.showDetails")} <HiChevronDown className="w-3 h-3" />
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-primary-100/40 space-y-3">
          {food.ingredients && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">
                {t("nutrition.ingredients")}
              </p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                {food.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-primary-300 mt-0.5">•</span>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {food.steps && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">{t("nutrition.steps")}</p>
              <ol className="text-xs text-gray-500 space-y-1">
                {food.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-400 font-bold shrink-0">
                      {i + 1}.
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <a
            href={getRecipeSearchUrl(originalName || food.name, language)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            {t("recipes.findOnline")}
            <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
