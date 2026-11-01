import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import {
  HiArrowLeft,
  HiPlay,
  HiPause,
  HiForward,
  HiCheck,
  HiInformationCircle,
  HiMusicalNote,
  HiXMark,
} from "react-icons/hi2";
import { format } from "date-fns";
import { auth, db } from "../firebase";
import { useMusic } from "../contexts/MusicContext";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { useToast } from "../components/common/Toast";
import ExerciseAnimation from "../components/exercise/ExerciseAnimation";
import ExerciseStepAnimation from "../components/workout/ExerciseStepAnimation";
import { getWorkoutPlaybackImages } from "../utils/workoutExerciseVisual.js";
import { preloadExerciseImages } from "../services/exerciseImages";
import { MUSCLE_META } from "../metadata/muscleMeta";
import { getOptionalActivityLibrary } from "../lib/workout/adjustments";
import { hydrateExercisesFromDb } from "../lib/workout/hydrateExercisesFromDb";
import { PLAYLIST_ITEMS, flattenPlaylistItems } from "../data/musicPlaylists";

function getExerciseDuration(exercise) {
  if (!exercise) return 60;
  if (exercise.sets === 1) return (exercise.duration || 1) * 60;
  return Math.max(Math.floor(((exercise.duration || 1) * 60) / (exercise.sets || 1)), 20);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function formatExercisePrescription(exercise, t) {
  return exercise?.note || `${exercise?.sets} ${t("common.sets")} x ${exercise?.reps} ${t("common.reps")}`;
}

function getBestVariant(item, selectedVariantId) {
  if (!item?.variants?.length) return null;
  return item.variants.find((v) => v.id === selectedVariantId) || item.variants[0];
}

function getExerciseDisplayName(exercise) {
  return exercise?.text?.en?.name || exercise?.name || exercise?.title || exercise?.label || "";
}

function getExerciseDisplayDescription(exercise, language) {
  if (!exercise) return "";
  if (language === "hr") {
    return exercise?.text?.hr?.description || exercise?.contextDescHr || exercise?.desc || exercise?.description || "";
  }
  return exercise?.text?.en?.description || exercise?.desc || exercise?.contextDescHr || exercise?.description || "";
}

function getExerciseSteps(exercise, language) {
  if (!exercise) return [];
  if (language === "hr") {
    return exercise?.text?.hr?.instructions || exercise?.instructions || exercise?.steps || [];
  }
  return exercise?.text?.en?.instructions || exercise?.instructions || exercise?.steps || [];
}

function getExerciseYoutubeUrl(exercise) {
  const name = getExerciseDisplayName(exercise);
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form`)}`;
}

function parseDurationMinutes(duration) {
  if (typeof duration === "number" && Number.isFinite(duration)) return duration;
  const match = String(duration || "").match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) return 0;
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  return Math.round((start + end) / 2);
}

function estimateCaloriesFromDuration(duration) {
  const minutes = parseDurationMinutes(duration);
  return minutes > 0 ? minutes * 5 : 0;
}

function normalizeMusicText(...values) {
  return values
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

function prettifyMusicKey(key) {
  if (typeof key !== "string" || !key) return "";
  const suffix = key.split(".").pop() || key;
  const stripped = suffix
    .replace(/^playlist/i, "")
    .replace(/^filter/i, "")
    .replace(/^music/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return stripped ? stripped.charAt(0).toUpperCase() + stripped.slice(1) : key;
}

function getMusicLabel(item, t) {
  const candidates = [item?.titleKey, item?.title, item?.name];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue;
    const translated = t(candidate);
    if (translated && translated !== candidate) return translated;
    if (!candidate.includes(".")) return candidate;
    const prettified = prettifyMusicKey(candidate);
    if (prettified && prettified !== candidate) return prettified;
  }
  return prettifyMusicKey(item?.title || item?.name || "");
}

function getMusicCategory(item) {
  const tags = Array.isArray(item?.tags) ? item.tags : [];
  const priority = ["cardio", "strength", "yoga", "focus", "calm"];
  const fromTags = priority.find((tag) => tags.includes(tag));
  if (fromTags) return fromTags;

  const text = normalizeMusicText(item?.title, item?.titleKey, item?.name, item?.categoryKey);
  if (/(cardio|hiit|run|running|endurance|sweat|energy|tempo|miles|dance)/.test(text)) return "cardio";
  if (/(strength|gym|lift|lifting|powerlifting|iron|pump|beast|heavy|push|muscle|legs|glutes|booty)/.test(text)) {
    return "strength";
  }
  if (/(yoga|stretch|mobility|pilates|barre)/.test(text)) return "yoga";
  if (/(focus|lo-fi|lofi|study|chill|ambient)/.test(text)) return "focus";
  if (/(calm|recovery|breath|meditation|relax|unwind|gentle|cool down|soft|quiet)/.test(text)) return "calm";
  return "workout";
}

function getMusicCategoryLabel(category) {
  const labels = {
    cardio: "Cardio",
    strength: "Strength",
    yoga: "Yoga",
    focus: "Focus",
    calm: "Calm",
    workout: "Workout",
  };
  return labels[category] || labels.workout;
}

function getMusicCategoryStyles(category) {
  const styles = {
    cardio: {
      card: "border-orange-100/80 bg-orange-50/70 hover:bg-orange-50",
      chip: "border-orange-200 bg-orange-100 text-orange-700",
      dot: "bg-orange-400",
    },
    strength: {
      card: "border-fuchsia-100/80 bg-fuchsia-50/70 hover:bg-fuchsia-50",
      chip: "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700",
      dot: "bg-fuchsia-400",
    },
    yoga: {
      card: "border-emerald-100/80 bg-emerald-50/70 hover:bg-emerald-50",
      chip: "border-emerald-200 bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-400",
    },
    focus: {
      card: "border-sky-100/80 bg-sky-50/70 hover:bg-sky-50",
      chip: "border-sky-200 bg-sky-100 text-sky-700",
      dot: "bg-sky-400",
    },
    calm: {
      card: "border-violet-100/80 bg-violet-50/70 hover:bg-violet-50",
      chip: "border-violet-200 bg-violet-100 text-violet-700",
      dot: "bg-violet-400",
    },
    workout: {
      card: "border-slate-100/80 bg-slate-50/70 hover:bg-slate-50",
      chip: "border-slate-200 bg-slate-100 text-slate-700",
      dot: "bg-slate-400",
    },
  };

  return styles[category] || styles.workout;
}

function getPlaylistTags(item) {
  const text = normalizeMusicText(item.title, item.titleKey, item.categoryKey);
  const tags = new Set(["all"]);

  if (/(cardio|hiit|run|running|endurance|sweat|energy|tempo|miles|dance)/.test(text)) tags.add("cardio");
  if (/(strength|gym|lift|lifting|powerlifting|iron|pump|beast|heavy|push|muscle|legs|glutes|booty)/.test(text)) {
    tags.add("strength");
  }
  if (/(yoga|stretch|mobility|pilates|barre)/.test(text)) tags.add("yoga");
  if (/(focus|lo-fi|lofi|study|chill|ambient)/.test(text)) tags.add("focus");
  if (/(calm|recovery|breath|meditation|relax|unwind|gentle|cool down|soft|quiet)/.test(text)) tags.add("calm");

  return Array.from(tags);
}

function getActivityMusicProfile(text) {
  const normalized = normalizeMusicText(text);
  if (/(dance|cardio|hiit|run|running|endurance|sweat|energy|tempo|miles)/.test(normalized)) {
    return ["cardio", "strength", "focus"];
  }
  if (/(strength|gym|lift|lifting|powerlifting|iron|pump|beast|heavy|push|muscle|legs|glutes|booty)/.test(normalized)) {
    return ["strength", "cardio", "focus"];
  }
  if (/(yoga|stretch|mobility|breath|breathing|calm|recovery|meditation|relax|unwind|soft|quiet)/.test(normalized)) {
    return ["calm", "yoga", "focus"];
  }
  return ["strength", "cardio", "focus"];
}

function selectRecommendedPlaylists(items, profile, limit = 6) {
  const profileTerms = {
    cardio: /(cardio|hiit|run|running|endurance|sweat|energy|tempo|miles|dance)/,
    strength: /(strength|gym|lift|lifting|powerlifting|iron|pump|beast|heavy|push|muscle|legs|glutes|booty)/,
    yoga: /(yoga|stretch|mobility|pilates|barre)/,
    calm: /(calm|recovery|breath|breathing|meditation|relax|unwind|gentle|cool down|soft|quiet)/,
    focus: /(focus|lo-fi|lofi|study|chill|ambient)/,
  };

  return items
    .map((item) => {
      const text = normalizeMusicText(item.title, item.titleKey, item.categoryKey);
      let score = 0;
      profile.forEach((tag, index) => {
        if (profileTerms[tag]?.test(text)) score += 100 - index * 10;
      });
      if (/(workout|training|mix|session|boost|motivation|energy|push|flow)/.test(text)) score += 5;
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

const MUSIC_FILTERS = [
  { id: "all", label: "All" },
  { id: "cardio", label: "Cardio" },
  { id: "strength", label: "Strength" },
  { id: "yoga", label: "Yoga" },
  { id: "focus", label: "Focus" },
  { id: "calm", label: "Calm" },
];

function ActivityMusicModal({
  isHr,
  t,
  onClose,
  recommendedItems,
  otherItems,
  activeFilter,
  onSetActiveFilter,
  onPickItem,
}) {
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
              {isHr ? "Glazba za aktivnost" : "Activity music"}
            </p>
            <h3 className="mt-1 text-xl font-bold text-gray-900">
              {isHr ? "Odaberi glazbu za ovu sesiju" : "Pick music for this session"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            aria-label={t("common.close")}
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-4.5rem)] overflow-y-auto px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          <div className="space-y-5">
            <section className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  {isHr ? "Preporučeno za ovu aktivnost" : "Recommended for this activity"}
                </h4>
                <p className="text-xs text-gray-500">
                  {isHr
                    ? "Automatski odabrane YouTube opcije prema tipu aktivnosti."
                    : "Auto-picked YouTube options based on the activity type."}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {recommendedItems.map((item) => (
                  (() => {
                    const category = item.category || getMusicCategory(item);
                    const styles = getMusicCategoryStyles(category);
                    return (
                      <button
                        key={item.videoId}
                        type="button"
                        onClick={() => onPickItem(item)}
                        className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${styles.card}`}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${styles.chip}`}>
                          <HiMusicalNote className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900">{item.displayTitle}</p>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${styles.chip}`}
                            >
                              {getMusicCategoryLabel(category)}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-gray-500">{isHr ? "YouTube mix" : "YouTube mix"}</p>
                        </div>
                      </button>
                    );
                  })()
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {isHr ? "Izaberi iz ostalih" : "Choose from the rest"}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {isHr
                      ? "Ostale opcije iz istog kataloga, uz brze filtere."
                      : "More options from the same catalog, with quick filters."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => onSetActiveFilter(filter.id)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                        activeFilter === filter.id
                          ? "border-primary-200 bg-primary-50 text-primary-700"
                          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {otherItems.map((item) => (
                    (() => {
                      const category = item.category || getMusicCategory(item);
                      const styles = getMusicCategoryStyles(category);
                      return (
                        <button
                          key={item.videoId}
                          type="button"
                          onClick={() => onPickItem(item)}
                          className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${styles.card}`}
                        >
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${styles.chip}`}>
                            <HiMusicalNote className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-sm text-gray-900">{item.displayTitle}</p>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${styles.chip}`}
                              >
                                {getMusicCategoryLabel(category)}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500">
                              {isHr ? "YouTube katalog" : "YouTube catalog"}
                            </p>
                          </div>
                        </button>
                      );
                    })()
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="border-t border-primary-100/60 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-50"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityExerciseDetailPanel({ exercise, gender, language, t, onClose }) {
  if (!exercise) return null;

  const name = getExerciseDisplayName(exercise);
  const description = getExerciseDisplayDescription(exercise, language);
  const steps = getExerciseSteps(exercise, language);
  const youtubeUrl = getExerciseYoutubeUrl(exercise);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 p-3 sm:p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-[var(--color-border)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500">
              {t("workoutDay.detail")}
            </p>
            <h3 className="mt-1 text-xl font-bold text-gray-900">{name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="px-4 sm:px-5 pb-5 pt-4 space-y-4">
          <ExerciseAnimation exercise={exercise} gender={gender} size="lg" />
          <div className="flex flex-wrap gap-2">
            {exercise.duration ? (
              <span className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
                ~{exercise.duration} {t("common.min")}
              </span>
            ) : null}
            {exercise.sets && exercise.reps ? (
              <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                {exercise.sets} x {exercise.reps} {t("common.reps")}
              </span>
            ) : null}
          </div>

          {description ? (
            <p className="text-sm leading-6 text-gray-600">{description}</p>
          ) : null}

          {steps.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                {t("workoutDay.howTo")}
              </p>
              <ol className="space-y-2">
                {steps.map((step, index) => (
                  <li key={`${name}-step-${index}`} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-bg text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
            >
              {t("workoutDay.watchVideo")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivitySession() {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const [searchParams] = useSearchParams();
  const { t, language } = useTranslation();
  const { addToast } = useToast();
  const { playVideo } = useMusic();
  const { userGoal } = useAuth();

  const isHr = language === "hr";
  const variantId = searchParams.get("variant") || "";
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [activeMusicFilter, setActiveMusicFilter] = useState("all");

  const library = useMemo(() => getOptionalActivityLibrary(), []);
  const activity = useMemo(() => library.find((x) => x.id === activityId) || null, [library, activityId]);
  const chosenVariant = useMemo(() => getBestVariant(activity, variantId), [activity, variantId]);

  const exercises = useMemo(() => {
    const raw = chosenVariant?.exercises || [];
    // Treat these as "home" style exercises unless stated otherwise.
    const withLoc = raw.map((ex) => ({ ...ex, trainingLocation: ex.trainingLocation || "home" }));
    return hydrateExercisesFromDb(withLoc) || [];
  }, [chosenVariant]);

  const totalDuration = useMemo(() => exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0), [exercises]);
  const sharedPlaylistItems = useMemo(
    () =>
      flattenPlaylistItems(PLAYLIST_ITEMS).map((item) => ({
        ...item,
        displayTitle: getMusicLabel(item, t),
        category: getMusicCategory(item),
        tags: getPlaylistTags(item),
      })),
    [t],
  );

  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState("exercise");
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState([]);
  const [detailExercise, setDetailExercise] = useState(null);
  const [activityLogged, setActivityLogged] = useState(false);

  const intervalRef = useRef(null);
  const handleTimerEndRef = useRef(null);

  useEffect(() => {
    if (exercises.length > 0) preloadExerciseImages(exercises);
  }, [exercises]);

  const allDone = completed.length === exercises.length && exercises.length > 0;
  const currentExercise = exercises[currentExIdx];
  const currentDateKey = format(new Date(), "yyyy-MM-dd");
  const activityTitle = isHr ? (chosenVariant?.titleHr || chosenVariant?.title || activity.titleHr) : (chosenVariant?.title || chosenVariant?.titleHr || activity.title);
  const activityDuration = chosenVariant?.duration || activity.duration || "";
  const estimatedCalories = estimateCaloriesFromDuration(activityDuration);
  const activityMusicProfile = useMemo(() => {
    const sourceText = [
      activity?.title,
      activity?.titleHr,
      activity?.desc,
      activity?.descHr,
      chosenVariant?.title,
      chosenVariant?.titleHr,
      chosenVariant?.desc,
      chosenVariant?.descHr,
      activity?.tagsHr?.join(" "),
      activity?.goals?.join(" "),
      activity?.locations?.join(" "),
    ]
      .filter(Boolean)
      .join(" ");
    return getActivityMusicProfile(sourceText);
  }, [activity, chosenVariant]);

  const recommendedPlaylistItems = useMemo(
    () => selectRecommendedPlaylists(sharedPlaylistItems, activityMusicProfile, 6),
    [sharedPlaylistItems, activityMusicProfile],
  );

  const recommendedPlaylistIds = useMemo(
    () => new Set(recommendedPlaylistItems.map((item) => item.videoId)),
    [recommendedPlaylistItems],
  );

  const otherPlaylistItems = useMemo(
    () =>
      sharedPlaylistItems.filter((item) => {
        if (recommendedPlaylistIds.has(item.videoId)) return false;
        if (activeMusicFilter === "all") return true;
        return item.tags.includes(activeMusicFilter);
      }),
    [activeMusicFilter, recommendedPlaylistIds, sharedPlaylistItems],
  );

  const openMusicModal = useCallback(() => {
    setActiveMusicFilter("all");
    setIsMusicModalOpen(true);
  }, []);

  const closeMusicModal = useCallback(() => {
    setIsMusicModalOpen(false);
  }, []);

  const handlePickMusic = useCallback(
    (item) => {
      playVideo(item.videoId || item.id, item.displayTitle || getMusicLabel(item, t));
      setIsMusicModalOpen(false);
    },
    [playVideo, t],
  );

  const moveToNextExercise = useCallback(() => {
    setCompleted((prev) => [...new Set([...prev, currentExIdx])]);
    if (currentExIdx < exercises.length - 1) {
      const nextIdx = currentExIdx + 1;
      setCurrentExIdx(nextIdx);
      setCurrentSet(1);
      setPhase("transition");
      setTimer(5);
      setRunning(true);
      return;
    }

    setCompleted(exercises.map((_, idx) => idx));
    setRunning(false);
    setPhase("exercise");
    addToast(isHr ? "Bravo! Gotovo." : `${t("workoutDay.done")}!`);
  }, [addToast, currentExIdx, exercises, isHr, t]);

  const handleTimerEnd = useCallback(() => {
    setRunning(false);

    if (phase === "transition") {
      setPhase("exercise");
      setTimer(getExerciseDuration(currentExercise));
      setRunning(true);
      return;
    }

    if (phase === "exercise") {
      if (currentSet < (currentExercise?.sets || 1)) {
        setPhase("rest");
        setTimer(currentExercise?.rest || 60);
        setRunning(true);
      } else {
        moveToNextExercise();
      }
      return;
    }

    if (phase === "rest") {
      setCurrentSet((s) => s + 1);
      setPhase("exercise");
      setTimer(getExerciseDuration(currentExercise));
      setRunning(true);
    }
  }, [currentExercise, currentSet, moveToNextExercise, phase]);

  useEffect(() => { handleTimerEndRef.current = handleTimerEnd; }, [handleTimerEnd]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimer((value) => {
        if (value <= 1) {
          handleTimerEndRef.current?.();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const startWorkout = () => {
    if (!exercises[0]) return;
    setWorkoutStarted(true);
    setCurrentExIdx(0);
    setCurrentSet(1);
    setPhase("exercise");
    setTimer(getExerciseDuration(exercises[0]));
    setRunning(true);
  };

  const toggleTimer = () => setRunning((value) => !value);

  const skipExercise = () => {
    setRunning(false);
    moveToNextExercise();
  };

  const jumpToExercise = (idx) => {
    setCurrentExIdx(idx);
    setCurrentSet(1);
    setPhase("exercise");
    setTimer(getExerciseDuration(exercises[idx]));
    setRunning(true);
  };

  const saveActivityToProgress = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || activityLogged) return;

    try {
      await setDoc(
        doc(db, "progress", user.uid, "daily", currentDateKey),
        {
          date: currentDateKey,
          extraActivities: arrayUnion({
            id: activity.id,
            title: activityTitle,
            duration: activityDuration,
            estimatedCalories,
            completedAt: new Date().toISOString(),
            source: "ideas",
          }),
        },
        { merge: true },
      );
      setActivityLogged(true);
      addToast(t("extraActivities.savedToStats"), "success");
    } catch (error) {
      console.error(error);
      addToast(t("extraActivities.saveFailed"), "error");
    }
  }, [activity.id, activityDuration, activityLogged, activityTitle, addToast, currentDateKey, estimatedCalories, t]);

  if (!activity || exercises.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4 pb-28">
        <button
          type="button"
          onClick={() => navigate("/activities")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <HiArrowLeft className="w-4 h-4" /> {isHr ? "Natrag" : "Back"}
        </button>
        <div className="rounded-2xl border border-primary-100/60 bg-white p-5">
          <p className="text-gray-700 font-semibold">{isHr ? "Nema plana za ovu aktivnost." : "No plan found for this activity."}</p>
          <p className="text-sm text-gray-500 mt-1">{isHr ? "Probaj odabrati drugu opciju." : "Try choosing a different option."}</p>
        </div>
      </div>
    );
  }

  const headerDesc = isHr ? (chosenVariant?.descHr || chosenVariant?.desc || activity.descHr) : (chosenVariant?.desc || chosenVariant?.descHr || activity.desc);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 pb-28">
      <button
        type="button"
        onClick={() => navigate("/activities")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <HiArrowLeft className="w-4 h-4" /> {isHr ? "Natrag na aktivnosti" : "Back to activities"}
      </button>

      <div className="app-card space-y-4 sm:!p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{activityTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {headerDesc} {" "}
              <span className="text-gray-400">
                · ~{totalDuration} {t("common.min")} · {exercises.length} {t("common.exercises")}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            <button
              type="button"
              onClick={openMusicModal}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-100 bg-primary-50 text-primary-600 hover:bg-primary-100"
              aria-label={isHr ? "Glazba" : "Music"}
              title={isHr ? "Glazba" : "Music"}
            >
              <HiMusicalNote className="h-4 w-4" />
            </button>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-100 shrink-0">
              {activity.duration}
            </span>
          </div>
        </div>

        {workoutStarted && !allDone && currentExercise && (
          <div className="rounded-2xl border border-primary-100/60 bg-primary-50/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-primary-500">
                {phase === "rest" || phase === "transition" ? t("workoutDay.rest") : t("workoutDay.exercise")} {currentExIdx + 1}/{exercises.length}
              </p>
              <span className="text-xs font-semibold text-gray-600">
                {t("workoutDay.set")} {currentSet}/{currentExercise.sets || 1}
              </span>
            </div>

            <div className="activity-exercise-preview">
              <ExerciseStepAnimation
                key={`${currentExercise.id || currentExercise.name}-${userGoal?.gender || "female"}`}
                images={getWorkoutPlaybackImages(currentExercise, userGoal?.gender)}
                running={running && phase === "exercise"}
                label={getExerciseDisplayName(currentExercise)}
                fallback={<ExerciseAnimation exercise={currentExercise} gender={userGoal?.gender} size="lg" />}
              />
            </div>

            <p className="text-center text-xl font-bold text-gray-900">{formatTime(timer)}</p>
            <p className="text-center text-sm text-gray-600">
                {phase === "rest" || phase === "transition"
                ? (phase === "transition"
                    ? (isHr ? `sljedeca: ${currentExercise.name}` : `next: ${currentExercise.name}`)
                    : t("workoutDay.rest").toLowerCase())
                : currentExercise.name}
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={toggleTimer}
                className="w-14 h-14 rounded-full gradient-bg text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
              >
                {running ? <HiPause className="w-6 h-6" /> : <HiPlay className="w-6 h-6 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={skipExercise}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
                title={isHr ? "Preskoci" : "Skip"}
              >
                <HiForward className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => setDetailExercise(currentExercise)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
              >
                {t("workoutDay.viewInstructions")}
              </button>
              <a
                href={getExerciseYoutubeUrl(currentExercise)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
              >
                {t("workoutDay.watchVideo")}
              </a>
            </div>
          </div>
        )}

        {workoutStarted && allDone && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
              ✅
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">{t("extraActivities.doneTitle")}</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto">{t("extraActivities.doneHint")}</p>
            </div>
            <button
              type="button"
              onClick={saveActivityToProgress}
              disabled={activityLogged}
              className="inline-flex items-center justify-center gap-2 rounded-xl gradient-bg px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {activityLogged ? t("extraActivities.savedToStats") : t("extraActivities.markDone")}
            </button>
          </div>
        )}

        {!workoutStarted && (
          <button
            type="button"
            onClick={startWorkout}
            className="w-full py-4 gradient-bg text-white font-semibold rounded-2xl text-lg shadow-lg shadow-primary-200/30 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <HiPlay className="w-6 h-6" /> {t("workoutDay.startWorkout")}
          </button>
        )}
      </div>

      {isMusicModalOpen && (
        <ActivityMusicModal
          isHr={isHr}
          t={t}
          onClose={closeMusicModal}
          recommendedItems={recommendedPlaylistItems}
          otherItems={otherPlaylistItems}
          activeFilter={activeMusicFilter}
          onSetActiveFilter={setActiveMusicFilter}
          onPickItem={handlePickMusic}
        />
      )}

      {detailExercise && (
        <ActivityExerciseDetailPanel
          exercise={detailExercise}
          gender={userGoal?.gender}
          language={language}
          t={t}
          onClose={() => setDetailExercise(null)}
        />
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {t("workoutDay.exercises")}
        </h3>
        {exercises.map((exercise, idx) => {
          const done = completed.includes(idx);
          const active = workoutStarted && idx === currentExIdx && !allDone;
          const meta = MUSCLE_META[exercise.muscle] || {};
          const rowClass = `w-full flex items-stretch rounded-2xl border transition-all overflow-hidden ${
            active
              ? "bg-primary-50 border-primary-300 shadow-md shadow-primary-100/30 ring-2 ring-primary-200"
              : done
                ? "bg-emerald-50 border-emerald-200"
                : "bg-white border-primary-100/60 holo-border hover:shadow-sm"
          }`;

          return (
            <div key={`${exercise.name}-${idx}`} className={rowClass}>
              <button
                type="button"
                onClick={() => setDetailExercise(detailExercise?.name === exercise.name ? null : exercise)}
                className="flex-1 flex items-start gap-4 p-4 text-left min-w-0"
              >
                {done ? (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500 text-white">
                    <HiCheck className="w-5 h-5" />
                  </div>
                ) : (
                  <ExerciseAnimation exercise={exercise} gender={userGoal?.gender} size="sm" highlight={active} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${done ? "text-emerald-800 line-through" : "text-gray-900"}`}>
                        {exercise.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {formatExercisePrescription(exercise, t)} · {exercise.duration} {t("common.min")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        active
                          ? "bg-primary-100 text-primary-700"
                          : done
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {done ? t("common.done") : `${idx + 1}`}
                    </span>
                  </div>
                  {exercise.muscle && meta.label && (
                    <p className="text-[11px] text-gray-400 mt-2 capitalize">{meta.label}</p>
                  )}
                </div>
              </button>

              {workoutStarted && !done && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    jumpToExercise(idx);
                  }}
                  className="shrink-0 px-3 flex items-center justify-center text-primary-600 hover:text-primary-700 hover:bg-primary-50/80 transition-colors border-l border-primary-100/40"
                  aria-label={t("workoutDay.goToExercise")}
                  title={t("workoutDay.goToExercise")}
                >
                  <HiPlay className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setDetailExercise(detailExercise?.name === exercise.name ? null : exercise);
                }}
                className="shrink-0 px-3 flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50/80 transition-colors border-l border-primary-100/40"
                aria-label={t("workoutDay.detail")}
              >
                <HiInformationCircle className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
