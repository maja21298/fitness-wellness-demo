import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiSparkles, HiChevronDown, HiChevronUp, HiPlay, HiXMark } from "react-icons/hi2";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import ExerciseDetailPanel from "../components/exercise/ExerciseDetail";
import ExerciseAnimation from "../components/exercise/ExerciseAnimation";
import MobilePageHeader from "../components/layout/MobilePageHeader";
import {
  getOptionalActivityLibrary,
} from "../lib/workout/adjustments";
import { hydrateExercisesFromDb } from "../lib/workout/hydrateExercisesFromDb";

function formatExerciseMeta(exercise, t) {
  return exercise?.note || `${exercise?.sets} x ${exercise?.reps} ${t("common.reps")}`;
}

function getActivityChips(item, t, isHr) {
  const chips = [];
  const location = item.locations?.includes("home")
    ? t("workout.locationHome")
    : item.locations?.includes("gym")
      ? t("workout.locationGym")
      : item.locations?.[0];
  if (location) chips.push(location);
  const goal = item.goals?.[0];
  if (goal) {
    const goalLabels = {
      lose: isHr ? "Mršavljenje" : "Fat loss",
      gain: isHr ? "Masa" : "Muscle gain",
      only_training: isHr ? "Samo trening" : "Training only",
    };
    chips.push(goalLabels[goal] || goal);
  }
  return chips.slice(0, 2);
}

function getBestVariant(item, selectedVariantId) {
  if (!item?.variants?.length) return null;
  return item.variants.find((v) => v.id === selectedVariantId) || item.variants[0];
}

function ActivityCard({
  item,
  isHr,
  onOpen,
}) {
  const title = isHr ? item.titleHr : item.title;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group app-card w-full text-left transition-all hover:-translate-y-0.5 hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200 !p-3.5"
    >
      <div className="flex items-start gap-3">
        <p className="text-3xl leading-none select-none shrink-0 sm:text-2xl">{item.emoji}</p>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-gray-900 truncate">{title}</h3>
        </div>
      </div>
    </button>
  );
}

function ActivityModal({
  item,
  gender,
  isHr,
  language,
  t,
  selectedVariantId,
  onSelectVariant,
  detailExercise,
  onOpenExercise,
  onCloseExercise,
  onStart,
  onClose,
}) {
  const [showExercises, setShowExercises] = useState(false);
  const variants = item.variants || [];
  const chosen = getBestVariant(item, selectedVariantId);
  const chosenDesc = chosen ? (isHr ? (chosen.descHr || chosen.desc) : (chosen.desc || chosen.descHr)) : "";
  const chosenTitle = chosen ? (isHr ? (chosen.titleHr || chosen.title) : (chosen.title || chosen.titleHr)) : "";
  const chips = getActivityChips(item, t, isHr);
  const exercises = useMemo(() => {
    const raw = (chosen?.exercises || []).map((exercise) => ({
      ...exercise, trainingLocation: exercise.trainingLocation || "home",
    }));
    return hydrateExercisesFromDb(raw) || [];
  }, [chosen]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t("common.close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-xl max-h-[90vh]">
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500">
              {isHr ? "Detalji aktivnosti" : "Activity details"}
            </p>
            <h3 className="mt-1 text-xl font-bold text-gray-900 truncate">{isHr ? item.titleHr : item.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <HiXMark className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-4rem)] overflow-y-auto px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700">
                {item.duration}
              </span>
              {chips.map((chip) => (
                <span
                  key={`${item.id}-${chip}`}
                  className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700"
                >
                  {chip}
                </span>
              ))}
            </div>

            {chosenDesc ? <p className="text-sm leading-6 text-gray-600">{chosenDesc}</p> : null}

            {variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
                  {isHr ? "Varijante" : "Variants"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const selected = selectedVariantId === v.id || (!selectedVariantId && variants[0]?.id === v.id);
                    return (
                      <button
                        key={`${item.id}-${v.id}`}
                        type="button"
                        onClick={() => onSelectVariant(v.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          selected
                            ? "gradient-bg border-transparent text-white"
                            : "border-primary-100 bg-white text-gray-600 hover:bg-primary-50"
                        }`}
                      >
                        {isHr ? (v.titleHr || v.title) : (v.title || v.titleHr)}
                        {v.duration ? ` · ${v.duration}` : ""}
                      </button>
                    );
                  })}
                </div>
                {chosenTitle ? <p className="text-sm font-semibold text-gray-900">{chosenTitle}</p> : null}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => onStart?.(item, chosen)}
                disabled={!exercises.length}
                className="app-btn-primary px-4 py-3 disabled:pointer-events-none disabled:opacity-40"
              >
                <HiPlay className="w-4 h-4" />
                {t("extraActivities.start")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                {t("common.close")}
              </button>
            </div>

            <div className="rounded-2xl border border-primary-100/60 bg-slate-50/80 p-3">
              <button
                type="button"
                onClick={() => setShowExercises((value) => !value)}
                className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-primary-700"
              >
                <span>{showExercises ? t("extraActivities.hideExercises") : t("extraActivities.showExercises")}</span>
                {showExercises ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
              </button>

              {showExercises && (
                <div className="mt-3 space-y-2">
                  {exercises.map((ex, idx) => (
                    <button
                      key={`${item.id}-${chosen?.id || "v"}-${ex.name}-${idx}`}
                      type="button"
                      onClick={() => onOpenExercise({ ...ex, trainingLocation: "home" })}
                      className="w-full rounded-2xl border border-primary-100/60 bg-white p-3 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                    >
                      <div className="flex items-start gap-3">
                        <ExerciseAnimation exercise={ex} gender={gender} size="sm" highlight />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-gray-900 truncate">{ex.text?.hr?.name || ex.name}</p>
                            <span className="shrink-0 rounded-full bg-primary-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-700 border border-primary-100">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                              {formatExerciseMeta(ex, t)}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                              {ex.duration} {t("common.min")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {detailExercise && (
            <ExerciseDetailPanel
              exercise={detailExercise}
              gender={gender}
              t={t}
              language={language}
              onClose={onCloseExercise}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExtraActivities() {
  const { userGoal } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const isHr = language === "hr";

  const all = useMemo(() => getOptionalActivityLibrary(), []);

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [variantById, setVariantById] = useState({});
  const [detailExercise, setDetailExercise] = useState(null);

  const pageTitle = isHr ? "Dodatne ideje" : "Extra ideas";
  const pageSub = isHr
    ? "Odaberi dodatne aktivnosti (ples, pilates, disanje, park, trcanje) i dobij tocan mini plan kao i kod treninga."
    : "Pick extra activities (dance, pilates, breathwork, park, running) and get a mini plan just like your workouts.";

  const sharedHandlers = {
    variantById,
    setVariantById,
    detailExercise,
    setDetailExercise,
    onStart: (activity, variant) => {
      if (!activity?.id) return;
      const variantId = variant?.id || variantById[activity.id] || "";
      navigate(`/activities/${activity.id}${variantId ? `?variant=${encodeURIComponent(variantId)}` : ""}`);
    },
  };

  return (
    <div className="app-mobile-page p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-28">
      <MobilePageHeader title={pageTitle} />
      <section className="app-card bg-linear-to-br from-[var(--color-brand-soft)] via-white to-purple-50/40 sm:!p-5">
        <div className="flex items-start gap-3">
          <div className="app-icon-badge app-icon-badge--pink h-10 w-10">
            <HiSparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-500">
              {isHr ? "Nesto dodatno" : "Extra movement"}
            </p>
            <h1 className="app-hide-on-mobile-header text-2xl sm:text-[2rem] font-bold tracking-tight text-gray-900 mt-1">{pageTitle}</h1>
            <p className="text-sm text-gray-600 mt-1.5 leading-6 max-w-2xl">{pageSub}</p>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {isHr ? "Sve aktivnosti" : "All activities"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {all.map((item) => (
            <ActivityCard
              key={`all-${item.id}`}
              item={item}
              isHr={isHr}
              onOpen={(activity) => {
                setSelectedActivity(activity);
                setDetailExercise(null);
              }}
            />
          ))}
        </div>
      </div>

      {selectedActivity && (
        <ActivityModal
          key={selectedActivity.id}
          item={selectedActivity}
          gender={userGoal?.gender}
          isHr={isHr}
          language={language}
          t={t}
          selectedVariantId={variantById[selectedActivity.id]}
          onSelectVariant={(variantId) => {
            setVariantById((prev) => ({ ...(prev || {}), [selectedActivity.id]: variantId }));
            setDetailExercise(null);
          }}
          detailExercise={detailExercise}
          onOpenExercise={(ex) => setDetailExercise(ex)}
          onCloseExercise={() => setDetailExercise(null)}
          onStart={sharedHandlers.onStart}
          onClose={() => {
            setSelectedActivity(null);
            setDetailExercise(null);
          }}
        />
      )}
    </div>
  );
}
