import useWorkoutPlayback, { getExerciseDuration } from "../hooks/useWorkoutPlayback";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useMusic } from "../contexts/MusicContext";
import { PLAYLIST_ITEMS, flattenPlaylistItems } from "../data/musicPlaylists";
import { useToast } from "../components/common/Toast";
import { useTranslation } from "../i18n/useTranslation";
import { translateFocus } from "../i18n/workoutTranslations";
import {
  generateWorkoutPlan,
  generateFocusedPlan,
  resolveWorkoutDayForDate,
} from "../lib/workout/generators";
import { hydrateWeeklyPlanFromDb } from "../lib/workout/hydrateExercisesFromDb";
import { preloadExerciseImages } from "../services/exerciseImages";
import ExerciseDetailPanel from "../components/exercise/ExerciseDetail";
import WorkoutDayLayouts from "../components/workout/WorkoutDayLayouts";
import WorkoutDayHeader from "../components/workout/WorkoutDayHeader";
import ActiveWorkoutFocus, { WorkoutCompleteCard } from "../components/workout/ActiveWorkoutFocus";
import {
  HiArrowLeft,
  HiCheck,
  HiXMark,
  HiMusicalNote,
} from "react-icons/hi2";
import { format, parseISO, isValid } from "date-fns";
import { enUS, hr } from "date-fns/locale";

const WATER_INTERVAL_MS = 15 * 60 * 1000;

const PINK = {
  deep: "#F0518B",
  base: "#FF6B8A",
  soft: "#FFE4EC",
  softer: "#FFF1F5",
  peach: "#FFE9D6",
  text: "#3A2A3F",
  muted: "#9A8AA0",
};
const CARD_BG = "#FFFCFA";
const CARD_BORDER = "1px solid rgba(240,81,139,0.08)";
const MUSIC_FILTERS = [
  { id: "all", label: "All" },
  { id: "cardio", label: "Cardio" },
  { id: "strength", label: "Strength" },
  { id: "yoga", label: "Yoga" },
  { id: "focus", label: "Focus" },
  { id: "calm", label: "Calm" },
];

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
  return stripped
    ? stripped.charAt(0).toUpperCase() + stripped.slice(1)
    : key;
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
  if (/(cardio|hiit|run|running|endurance|sweat|energy|tempo|miles)/.test(text)) return "cardio";
  if (/(strength|gym|lift|lifting|powerlifting|iron|pump|beast|heavy|push|muscle)/.test(text)) return "strength";
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

  if (/(cardio|hiit|run|running|endurance|sweat|energy|tempo|miles)/.test(text)) tags.add("cardio");
  if (/(strength|gym|lift|lifting|powerlifting|iron|pump|beast|heavy|push|muscle)/.test(text)) tags.add("strength");
  if (/(yoga|stretch|mobility|pilates|barre)/.test(text)) tags.add("yoga");
  if (/(focus|lo-fi|lofi|study|chill|ambient)/.test(text)) tags.add("focus");
  if (/(calm|recovery|breath|meditation|relax|unwind|gentle|cool down|soft|quiet)/.test(text)) tags.add("calm");

  return Array.from(tags);
}

function getWorkoutProfile(text) {
  const normalized = normalizeMusicText(text);
  if (/(legs?|glutes?|booty|squat|lower body)/.test(normalized)) return ["strength", "cardio", "calm"];
  if (/(cardio|hiit|run|running|endurance|sweat|energy|tempo|miles)/.test(normalized)) return ["cardio", "strength", "focus"];
  if (/(yoga|stretch|mobility|calm|recovery|breath|meditation|relax|unwind)/.test(normalized)) return ["calm", "yoga", "focus"];
  if (/(strength|gym|lift|lifting|powerlifting|iron|pump|beast|heavy|push|muscle)/.test(normalized)) return ["strength", "cardio", "focus"];
  if (/(home)/.test(normalized)) return ["focus", "calm", "cardio"];
  return ["strength", "cardio", "focus"];
}

function selectRecommendedPlaylists(items, profile, limit = 6) {
  const profileTerms = {
    cardio: /(cardio|hiit|run|running|endurance|sweat|energy|tempo|miles)/,
    strength: /(strength|gym|lift|lifting|powerlifting|iron|pump|beast|heavy|push|muscle)/,
    yoga: /(yoga|stretch|mobility|pilates|barre)/,
    calm: /(calm|recovery|breath|meditation|relax|unwind|gentle|cool down|soft|quiet)/,
    focus: /(focus|lo-fi|lofi|study|chill|ambient)/,
  };

  const scored = items
    .map((item) => {
      const text = normalizeMusicText(item.title, item.titleKey, item.categoryKey);
      let score = 0;
      profile.forEach((tag, index) => {
        if (profileTerms[tag]?.test(text)) score += 100 - index * 10;
      });
      if (/(workout|training|mix|session|boost|motivation|energy|push)/.test(text)) score += 5;
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return scored.slice(0, limit);
}

function normalizeDayLocations(raw, baseLoc) {
  if (!raw || typeof raw !== "object") return {};
  const cleaned = {};
  for (const [iso, loc] of Object.entries(raw)) {
    if (!iso || (loc !== "home" && loc !== "gym")) continue;
    // dayLocations should represent overrides only; older versions sometimes stored base location for every day.
    if (loc !== baseLoc) cleaned[iso] = loc;
  }
  return cleaned;
}

export default function WorkoutDay() {
  const { day: daySlug, dateKey } = useParams();
  const navigate = useNavigate();
  const { userGoal } = useAuth();
  const { currentVideo, playVideo, openEmbed, streamingEmbeds } = useMusic();
  const { addToast } = useToast();
  const { t, language } = useTranslation();
  const dfLocale = language === "hr" ? hr : enUS;

  const goalType = userGoal?.goal || "only_training";
  const experience = userGoal?.experience || "beginner";

  const [savedPlan, setSavedPlan] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [showWater, setShowWater] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [activeMusicFilter, setActiveMusicFilter] = useState("all");
  const workoutStartTime = useRef(null);
  const waterTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoaded(true);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "plans", user.uid));
        if (snap.exists()) setSavedPlan(snap.data());
      } catch (err) {
        console.error(err);
      }
      setLoaded(true);
    })();
  }, []);

  const planLocation = useMemo(() => {
    try {
      // Prefer explicit UI selection (localStorage), then saved plan default, then onboarding/settings.
      return (
        localStorage.getItem("workout_location") ||
        savedPlan?.workout?.location ||
        userGoal?.location ||
        "gym"
      );
    } catch {
      return savedPlan?.workout?.location || userGoal?.location || "gym";
    }
  }, [savedPlan?.workout?.location, userGoal?.location]);

  const weeklyPlan = useMemo(() => {
    if (!loaded) return null;
    let raw;
    if (savedPlan?.workout?.weeklyPlan) raw = savedPlan.workout.weeklyPlan;
    else {
      const fa = savedPlan?.workout?.focusAreas;
      const uid = auth.currentUser?.uid || "guest";
      if (fa?.length) {
        raw = generateFocusedPlan({
          goal: goalType,
          experience,
          location: planLocation,
          focusAreas: fa,
          seed: uid,
        });
      } else {
        raw = generateWorkoutPlan({ goal: goalType, experience, location: planLocation, seed: uid });
      }
    }
    return hydrateWeeklyPlanFromDb(raw);
  }, [savedPlan, loaded, goalType, experience, planLocation]);

  const dayLocations = useMemo(
    () => normalizeDayLocations(savedPlan?.workout?.dayLocations || {}, planLocation),
    [savedPlan?.workout?.dayLocations, planLocation],
  );
  const dayAdjustments = useMemo(
    () => savedPlan?.workout?.dayAdjustments || {},
    [savedPlan?.workout?.dayAdjustments],
  );
  const pauseWindow = useMemo(
    () => savedPlan?.workout?.pauseWindow || null,
    [savedPlan?.workout?.pauseWindow],
  );
  const focusAreas = savedPlan?.workout?.focusAreas;

  const dayKey = useMemo(() => {
    if (dateKey && isValid(parseISO(dateKey))) {
      return format(parseISO(dateKey), "EEEE", { locale: enUS });
    }
    if (daySlug) return daySlug.charAt(0).toUpperCase() + daySlug.slice(1).toLowerCase();
    return "";
  }, [dateKey, daySlug]);

  const planSeed = auth.currentUser?.uid || "p";

  const dayData = useMemo(() => {
    if (!weeklyPlan || !dayKey) return null;
    if (dateKey && isValid(parseISO(dateKey))) {
      return resolveWorkoutDayForDate({
        dayName: dayKey,
        isoDate: dateKey,
        weeklyPlan,
        planLocation,
        dayLocations,
        dayAdjustments,
        pauseWindow,
        goal: goalType,
        experience,
        focusAreas,
        seedPrefix: planSeed,
      });
    }
    return weeklyPlan[dayKey] || null;
  }, [
    weeklyPlan,
    dayKey,
    dateKey,
    planLocation,
    dayLocations,
    dayAdjustments,
    pauseWindow,
    goalType,
    experience,
    focusAreas,
    planSeed,
  ]);

  const progressDateKey =
    dateKey && isValid(parseISO(dateKey)) ? dateKey : format(new Date(), "yyyy-MM-dd");

  const exercises = useMemo(() => dayData?.exercises || [], [dayData?.exercises]);
  const { currentExIdx, currentSet, phase, timer, running, completed,
    startPlayback, toggleTimer, skipExercise, goToPreviousExercise } =
    useWorkoutPlayback(exercises);
  const currentEx = exercises[currentExIdx];
  const totalDuration = exercises.reduce((sum, exercise) => sum + (exercise.duration || 0), 0);
  const currentExName = currentEx?.text?.en?.name || currentEx?.name || "";
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

  const workoutMusicProfile = useMemo(() => {
    const focusText = [
      dayData?.focus,
      Array.isArray(focusAreas) ? focusAreas.join(" ") : focusAreas,
      currentEx?.muscle,
      currentEx?.trainingLocation,
      dayData?.trainingLocation,
      currentExName,
    ]
      .filter(Boolean)
      .join(" ");
    return getWorkoutProfile(focusText);
  }, [currentEx?.muscle, currentEx?.trainingLocation, currentExName, dayData?.focus, dayData?.trainingLocation, focusAreas]);

  const recommendedPlaylistOptions = useMemo(
    () => selectRecommendedPlaylists(sharedPlaylistItems, workoutMusicProfile, 6),
    [sharedPlaylistItems, workoutMusicProfile],
  );

  const recommendedPlaylistIds = useMemo(
    () => new Set(recommendedPlaylistOptions.map((item) => item.videoId)),
    [recommendedPlaylistOptions],
  );

  const otherPlaylistOptions = useMemo(
    () =>
      sharedPlaylistItems.filter((item) => {
        if (recommendedPlaylistIds.has(item.videoId)) return false;
        if (activeMusicFilter === "all") return true;
        return item.tags.includes(activeMusicFilter);
      }),
    [activeMusicFilter, recommendedPlaylistIds, sharedPlaylistItems],
  );

  const streamingPlaylistOptions = useMemo(
    () =>
      [
        { embedId: "spotify-workout", label: "Cardio", title: "Workout Hits" },
        { embedId: "spotify-power", label: "Strength", title: "Power Workout" },
        { embedId: "spotify-yoga", label: "Focus", title: "Yoga & Meditation" },
        { embedId: "apple-hiit", label: "Calm", title: "HIIT Workout" },
        { embedId: "apple-yoga", label: "Yoga", title: "Yoga & Chill" },
      ]
        .map((item) => {
          const embed = streamingEmbeds?.find((candidate) => candidate.id === item.embedId);
          if (!embed) return null;
          return {
            ...item,
            serviceLabel: embed.service === "apple" ? "Apple Music" : embed.service === "deezer" ? "Deezer" : "Spotify",
            embedName: embed.name || item.title,
          };
        })
        .filter(Boolean),
    [streamingEmbeds],
  );

  const openMusicModal = useCallback(() => {
    setIsMusicModalOpen(true);
    setActiveMusicFilter("all");
  }, []);

  const closeMusicModal = useCallback(() => {
    setIsMusicModalOpen(false);
  }, []);

  const handlePickPlaylist = useCallback(
    (embedId) => {
      openEmbed(embedId);
      setIsMusicModalOpen(false);
    },
    [openEmbed],
  );

  const handlePickSharedPlaylist = useCallback(
    (item) => {
      playVideo(item.videoId || item.id, item.displayTitle || getMusicLabel(item, t));
      setIsMusicModalOpen(false);
    },
    [playVideo, t],
  );

  useEffect(() => {
    if (exercises.length > 0) {
      preloadExerciseImages(exercises);
    }
  }, [exercises]);

  useEffect(() => {
    if (!workoutStarted) return;
    waterTimer.current = setInterval(() => {
      setShowWater(true);
      setTimeout(() => setShowWater(false), 8000);
    }, WATER_INTERVAL_MS);
    return () => clearInterval(waterTimer.current);
  }, [workoutStarted]);

  const startWorkout = () => {
    if (!exercises[0]) return;
    setWorkoutStarted(true);
    setDetailExercise(null);
    workoutStartTime.current = Date.now();
    startPlayback();
  };

  if (!loaded) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-400">{t("common.loading")}</p>
      </div>
    );
  }

  if (dateKey && !isValid(parseISO(dateKey))) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => navigate("/workout")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <HiArrowLeft className="w-4 h-4" /> {t("workoutDay.backToPlan")}
        </button>
        <p className="text-gray-600">{t("workout.invalidDate")}</p>
      </div>
    );
  }

  if (!dayData || exercises.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => navigate("/workout")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <HiArrowLeft className="w-4 h-4" /> {t("workoutDay.backToPlan")}
        </button>
        <p className="text-gray-400">
          {dayData?.statusMessageHr || dayData?.statusMessage ? (
            language === "hr" ? dayData.statusMessageHr || dayData.statusMessage : dayData.statusMessage
          ) : (
            <>
              {t("workoutDay.noWorkout")} <span className="font-medium capitalize">{daySlug || dayKey}</span>.{" "}
              {t("workoutDay.restRecover")}
            </>
          )}
        </p>
      </div>
    );
  }

  const allDone = completed.length === exercises.length;

  const markComplete = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(
        doc(db, "progress", user.uid, "daily", progressDateKey),
        {
          workoutCompleted: true,
          workoutSkipped: false,
          exercisesLogged: exercises.map((exercise, idx) => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            done: completed.includes(idx),
          })),
          date: progressDateKey,
        },
        { merge: true },
      );
      addToast(t("workoutDay.logged"));
      navigate("/workout");
    } catch {
      addToast(t("workoutDay.failedSave"), "error");
    }
  };

  const skipDay = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(
        doc(db, "progress", user.uid, "daily", progressDateKey),
        {
          workoutCompleted: false,
          workoutSkipped: true,
          skippedDay: dayKey,
          date: progressDateKey,
        },
        { merge: true },
      );
      addToast(t("workoutDay.daySkipped"), "warning");
      navigate("/workout");
    } catch {
      addToast(t("workoutDay.failedSave"), "error");
    }
  };

  const locationLabel = dayData.trainingLocation === "home" ? t("workout.locationHome") : t("workout.locationGym");
  const dateHeading =
    dateKey && isValid(parseISO(dateKey))
      ? format(parseISO(dateKey), "EEEE, d MMMM yyyy", { locale: dfLocale })
      : t(`common.days.${dayKey}`) !== `common.days.${dayKey}`
        ? t(`common.days.${dayKey}`)
        : daySlug;
  return (
    <div className={`workout-day-page workout-day-page--lake${workoutStarted ? " workout-day-page--focus" : ""}`}>
      <WorkoutDayHeader
        started={workoutStarted}
        dateHeading={dateHeading}
        focus={translateFocus(dayData.focus, language)}
        exerciseCount={exercises.length}
        duration={totalDuration}
        location={dayData.trainingLocation ? locationLabel : null}
        showMusic={!currentVideo}
        onBack={() => navigate("/workout")}
        onMusic={openMusicModal}
        onStart={startWorkout}
        t={t}
      />

      {isMusicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={closeMusicModal}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[28px] border border-primary-100/60 bg-white shadow-2xl max-h-[90vh]">
            <div className="flex items-start justify-between gap-3 border-b border-primary-100/60 px-4 pb-3 pt-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500">
                  {language === "hr" ? "Glazba za trening" : "Workout music"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {language === "hr"
                    ? "Odaberi preporučenu playlistu ili promijeni mood."
                    : "Pick a recommended playlist or switch the mood."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeMusicModal}
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
                    <h3 className="text-sm font-semibold text-gray-900">
                      {language === "hr" ? "Preporučeno za ovaj trening" : "Recommended for this workout"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {language === "hr"
                        ? "Automatski odabrane YouTube opcije prema tipu treninga."
                        : "Auto-picked YouTube options based on the workout type."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {recommendedPlaylistOptions.map((item) => (
                      (() => {
                        const category = item.category || getMusicCategory(item);
                        const styles = getMusicCategoryStyles(category);
                        return (
                      <button
                        key={item.videoId}
                        type="button"
                        onClick={() => handlePickSharedPlaylist(item)}
                        className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${styles.card}`}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${styles.chip}`}>
                          <HiMusicalNote className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900">{item.displayTitle}</p>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${styles.chip}`}>
                              {getMusicCategoryLabel(category)}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {language === "hr" ? "YouTube mix" : "YouTube mix"}
                          </p>
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
                      <h3 className="text-sm font-semibold text-gray-900">
                        {language === "hr" ? "Izaberi iz ostalih" : "Choose from the rest"}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {language === "hr"
                          ? "Ostale opcije iz istog kataloga, uz brze filtere."
                          : "More options from the same catalog, with quick filters."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {MUSIC_FILTERS.map((filter) => (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => setActiveMusicFilter(filter.id)}
                          className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                            activeMusicFilter === filter.id
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
                      {otherPlaylistOptions.map((item) => (
                        (() => {
                          const category = item.category || getMusicCategory(item);
                          const styles = getMusicCategoryStyles(category);
                          return (
                        <button
                          key={item.videoId}
                          type="button"
                          onClick={() => handlePickSharedPlaylist(item)}
                          className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${styles.card}`}
                        >
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${styles.chip}`}>
                            <HiMusicalNote className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-sm text-gray-900">{item.displayTitle}</p>
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${styles.chip}`}>
                                {getMusicCategoryLabel(category)}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500">
                              {language === "hr" ? "YouTube katalog" : "YouTube catalog"}
                            </p>
                          </div>
                        </button>
                          );
                        })()
                      ))}
                    </div>
                  </div>
                </section>

                {streamingPlaylistOptions.length > 0 && (
                  <section className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{language === "hr" ? "Mood playlist" : "Mood playlists"}</h3>
                      <p className="text-xs text-gray-500">
                        {language === "hr"
                          ? "Odaberi mood i otvori streaming playlistu."
                          : "Pick a mood and open a streaming playlist."}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {streamingPlaylistOptions.map((item) => (
                        <button
                          key={item.embedId}
                          type="button"
                          onClick={() => handlePickPlaylist(item.embedId)}
                          className="flex items-center gap-3 rounded-2xl border border-primary-100/60 bg-white p-3 text-left hover:bg-primary-50/40 transition-colors"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                            <HiMusicalNote className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                            <p className="text-[11px] text-gray-400">
                              {item.embedName} · {item.serviceLabel}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>

            <div className="border-t border-primary-100/60 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={closeMusicModal}
                className="w-full rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-50"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWater && (
        <div style={{ background: PINK.softer, border: CARD_BORDER, borderRadius: 20, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>💧</span>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: PINK.text, fontSize: 14 }}>{t("workoutDay.hydrate")}</p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: PINK.muted }}>{t("workoutDay.hydrateDesc")}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowWater(false)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: PINK.muted }}
          >
            <HiXMark style={{ width: 18, height: 18 }} />
          </button>
        </div>
      )}

      {workoutStarted && currentEx && !allDone && (
        <ActiveWorkoutFocus
          key={`${currentExIdx}-${currentEx?.id || currentEx?.name || "ex"}`}
          exercise={currentEx}
          gender={userGoal?.gender}
          currentExIdx={currentExIdx}
          exerciseCount={exercises.length}
          currentSet={currentSet}
          phase={phase}
          timer={timer}
          running={running}
          t={t}
          language={language}
          formatTime={formatTime}
          getMaxTimer={getMaxTimer}
          onToggleTimer={toggleTimer}
          onPreviousExercise={goToPreviousExercise}
          onNextExercise={skipExercise}
        />
      )}

      {workoutStarted && allDone && (
        <WorkoutCompleteCard
          durationMin={totalDuration}
          exerciseCount={exercises.length}
          t={t}
          language={language}
          onFinish={markComplete}
        />
      )}

      {!workoutStarted && detailExercise && (
        <ExerciseDetailPanel
          exercise={detailExercise}
          gender={userGoal?.gender}
          t={t}
          language={language}
          onClose={() => setDetailExercise(null)}
        />
      )}

      {!workoutStarted && (
        <WorkoutDayLayouts
          gender={userGoal?.gender}
          language={language}
          exercises={exercises}
          onOpen={(exercise) => setDetailExercise(detailExercise?.name === exercise.name ? null : exercise)}
          t={t}
        />
      )}

      {!workoutStarted && (
        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button
            type="button"
            onClick={markComplete}
            disabled={!allDone}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "14px 16px",
              color: PINK.deep,
              fontWeight: 800,
              fontSize: 15,
              borderRadius: 16,
              border: "1.5px solid rgba(240,81,139,0.28)",
              background: PINK.soft,
              cursor: allDone ? "pointer" : "not-allowed",
              opacity: allDone ? 1 : 0.4,
            }}
          >
            <HiCheck style={{ width: 18, height: 18 }} /> {t("workoutDay.complete")}
          </button>
          <button
            type="button"
            onClick={skipDay}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "14px 16px",
              background: CARD_BG,
              border: CARD_BORDER,
              color: PINK.muted,
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 16,
              cursor: "pointer",
            }}
          >
            <HiXMark style={{ width: 18, height: 18 }} /> {t("workoutDay.skip")}
          </button>
        </div>
      )}
    </div>
  );
}

function getMaxTimer(exercise, phase) {
  if (phase === "rest") return exercise?.rest || 60;
  return getExerciseDuration(exercise);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

