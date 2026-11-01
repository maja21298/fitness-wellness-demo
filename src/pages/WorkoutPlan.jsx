import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { useToast } from "../components/common/Toast";
import { useDashboardData } from "../hooks/useDashboardData";
import { Skeleton, SkeletonGroup } from "../components/common/SkeletonLoader";
import ExerciseDetailPanel from "../components/exercise/ExerciseDetail";
import { getWorkoutThumbnail } from "../utils/workoutExerciseVisual.js";
import ExerciseImage from "../components/exercise/ExerciseImage";
import {
  generateWorkoutPlan,
  generateFocusedPlan,
  resolveWorkoutDayForDate,
} from "../lib/workout/generators";
import { hydrateWeeklyPlanFromDb } from "../lib/workout/hydrateExercisesFromDb";
import { translateFocus, translateExperience, translateMuscle } from "../i18n/workoutTranslations";
import MobilePageHeader from "../components/layout/MobilePageHeader";
import workoutPlanHeroImg from "../assets/workout/workout-plan-hero.webp?url";
import {
  HiCheck,
  HiArrowRight,
  HiArrowPath,
  HiHome,
  HiBuildingOffice2,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown,
  HiHeart,
  HiCalendarDays,
  HiCog6Tooth,
  HiBell,
  HiPause,
  HiOutlinePhoto,
} from "react-icons/hi2";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isValid,
} from "date-fns";
import { enUS, hr } from "date-fns/locale";

const DAY_ABBR_HR = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];
const DAY_ABBR_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── Pink wellness palette (matches Dashboard.jsx) ─── */
const PINK = {
  deep: "#F0518B",
  base: "#FF6B8A",
  mid: "#FFA5BD",
  soft: "#FFE4EC",
  softer: "#FFF1F5",
  peach: "#FFE9D6",
  text: "#3A2A3F",
  muted: "#9A8AA0",
  track: "#FCE0E9",
};
const PINK_CARD_SHADOW = "0 4px 18px rgba(240,81,139,0.06), 0 14px 36px rgba(240,81,139,0.08)";
const CARD_BG = "#FFFCFA";
const PINK_GRADIENT_BTN = "linear-gradient(135deg, #FF6B8A 0%, #F0518B 100%)";
const CARD_BORDER = "1px solid rgba(240,81,139,0.08)";

function exerciseThumbSrc(ex, gender) {
  return getWorkoutThumbnail(ex, gender);
}

function SettingsAccordion({ open, onToggle, title, icon, children }) {
  return (
    <div className={`wp-config-accord${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="wp-config-accord-btn"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="wp-config-accord-label">
          {icon ? <span className="wp-config-accord-icon" aria-hidden>{icon}</span> : null}
          <span>{title}</span>
        </span>
        <HiChevronDown className="wp-config-accord-chevron" aria-hidden />
      </button>
      {open ? <div className="wp-config-accord-body">{children}</div> : null}
    </div>
  );
}

function getInitialLocation(userGoal) {
  try {
    return localStorage.getItem("workout_location") || userGoal?.location || "gym";
  } catch {
    return userGoal?.location || "gym";
  }
}

function normalizeDayLocations(raw, baseLoc) {
  if (!raw || typeof raw !== "object") return {};
  const cleaned = {};
  for (const [iso, loc] of Object.entries(raw)) {
    if (!iso || (loc !== "home" && loc !== "gym")) continue;
    if (loc !== baseLoc) cleaned[iso] = loc;
  }
  return cleaned;
}

function WorkoutSkeleton() {
  return (
    <SkeletonGroup className="space-y-2">
      <Skeleton className="h-20 w-full rounded-3xl" />
      <div className="grid gap-2 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="space-y-2 rounded-3xl p-3" style={{ background: CARD_BG, border: CARD_BORDER }}>
          <Skeleton className="h-14 w-full rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`ex-sk-${i}`} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </SkeletonGroup>
  );
}

export default function WorkoutPlan() {
  const { user, userGoal } = useAuth();
  const { t, language } = useTranslation();
  const { addToast } = useToast();
  const { streak, caloriesToday, weeklyDays } = useDashboardData(user?.uid);
  const [savedPlan, setSavedPlan] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSpecial, setShowSpecial] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showDayLoc, setShowDayLoc] = useState(false);

  const goalType = userGoal?.goal || "only_training";
  const experience = userGoal?.experience || "beginner";
  const gender = userGoal?.gender || "female";
  const focusAreas = savedPlan?.workout?.focusAreas;

  const [location, setLocation] = useState(() => getInitialLocation(userGoal));

  const [dayLocations, setDayLocations] = useState({});
  const [dayAdjustments, setDayAdjustments] = useState({});
  const [pauseWindow, setPauseWindow] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedIso, setSelectedIso] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [pauseReason, setPauseReason] = useState("illness");
  const [pauseEndDate, setPauseEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [detailExercise, setDetailExercise] = useState(null);

  const dfLocale = language === "hr" ? hr : enUS;
  const isHr = language === "hr";
  const firstName = (user?.displayName || user?.email?.split("@")[0] || "Maja").split(" ")[0] || "Maja";
  const heroImageSrc = [workoutPlanHeroImg, workoutPlanHeroImg?.src, workoutPlanHeroImg?.default]
    .find((value) => typeof value === "string" && value.length > 0) || "";
  const avatarLetter = (firstName[0] || "M").toUpperCase();

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
          const data = snap.data();
          setSavedPlan(data);
          const baseLoc = data?.workout?.location || getInitialLocation(null);
          if (data?.workout?.location) setLocation(data.workout.location);
          if (data?.workout?.dayLocations && typeof data.workout.dayLocations === "object") {
            setDayLocations(normalizeDayLocations(data.workout.dayLocations, baseLoc));
          }
          if (data?.workout?.dayAdjustments && typeof data.workout.dayAdjustments === "object") {
            setDayAdjustments(data.workout.dayAdjustments);
          }
          if (data?.workout?.pauseWindow) {
            setPauseWindow(data.workout.pauseWindow);
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoaded(true);
    })();
  }, []);

  const planSeed = auth.currentUser?.uid || "guest";

  const weeklyPlan = useMemo(() => {
    if (!loaded) return {};
    let raw;
    if (savedPlan?.workout?.weeklyPlan) raw = savedPlan.workout.weeklyPlan;
    else if (focusAreas?.length) {
      raw = generateFocusedPlan({
        goal: goalType,
        experience,
        location,
        focusAreas,
        seed: planSeed,
      });
    } else {
      raw = generateWorkoutPlan({ goal: goalType, experience, location, seed: planSeed });
    }
    return hydrateWeeklyPlanFromDb(raw);
  }, [savedPlan, loaded, goalType, experience, location, focusAreas, planSeed]);

  const persistDayLocations = useCallback(async (next) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "plans", user.uid), { workout: { dayLocations: next } }, { merge: true });
    } catch {
      addToast(t("workout.failedSave"), "error");
    }
  }, [addToast, t]);

  const persistLocation = useCallback(async (nextLoc) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "plans", user.uid), { workout: { location: nextLoc } }, { merge: true });
    } catch {
      addToast(t("workout.failedSave"), "error");
    }
  }, [addToast, t]);

  const setBaseLocation = useCallback((nextLoc) => {
    if (nextLoc !== "home" && nextLoc !== "gym") return;
    setLocation(nextLoc);
    try {
      localStorage.setItem("workout_location", nextLoc);
    } catch {
      // ignore
    }

    setDayLocations((prev) => {
      const cleaned = normalizeDayLocations(prev, nextLoc);
      const changed =
        Object.keys(cleaned).length !== Object.keys(prev || {}).length ||
        Object.entries(prev || {}).some(([k, v]) => cleaned[k] !== v);
      if (changed) persistDayLocations(cleaned);
      return cleaned;
    });

    persistLocation(nextLoc);
    setSavedPlan((p) => ({
      ...p,
      workout: {
        ...p?.workout,
        location: nextLoc,
      },
    }));
  }, [persistDayLocations, persistLocation]);

  const persistDayAdjustments = useCallback(async (next) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "plans", user.uid), { workout: { dayAdjustments: next } }, { merge: true });
    } catch {
      addToast(t("workout.failedSave"), "error");
    }
  }, [addToast, t]);

  const persistPauseWindow = useCallback(async (next) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "plans", user.uid), { workout: { pauseWindow: next } }, { merge: true });
    } catch {
      addToast(t("workout.failedSave"), "error");
    }
  }, [addToast, t]);

  const setLocationForSelected = useCallback(
    (iso, loc) => {
      const next = { ...dayLocations, [iso]: loc };
      setDayLocations(next);
      persistDayLocations(next);
    },
    [dayLocations, persistDayLocations],
  );

  const togglePeriodDayOne = useCallback((iso) => {
    const next = { ...dayAdjustments };
    if (next[iso] === "period_day_1") delete next[iso];
    else next[iso] = "period_day_1";
    setDayAdjustments(next);
    persistDayAdjustments(next);
  }, [dayAdjustments, persistDayAdjustments]);

  const clearAdjustmentForSelected = useCallback((iso) => {
    if (!dayAdjustments[iso]) return;
    const next = { ...dayAdjustments };
    delete next[iso];
    setDayAdjustments(next);
    persistDayAdjustments(next);
  }, [dayAdjustments, persistDayAdjustments]);

  const savePauseFromSelected = useCallback((reason, endDate) => {
    const next = {
      active: true,
      reason,
      startDate: selectedIso,
      endDate,
    };
    setPauseWindow(next);
    persistPauseWindow(next);
  }, [persistPauseWindow, selectedIso]);

  const clearPauseWindow = useCallback(() => {
    setPauseWindow(null);
    persistPauseWindow(null);
  }, [persistPauseWindow]);

  const savePlan = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const gen = focusAreas?.length
        ? generateFocusedPlan({
            goal: goalType,
            experience,
            location,
            focusAreas,
            seed: user.uid,
          })
        : generateWorkoutPlan({ goal: goalType, experience, location, seed: user.uid });
      const nextDayLocs = {};
      await setDoc(
        doc(db, "plans", user.uid),
        {
          workout: {
            goal: goalType,
            experience,
            location,
            focusAreas: focusAreas?.length ? focusAreas : null,
            weeklyPlan: gen,
            dayLocations: nextDayLocs,
            dayAdjustments,
            pauseWindow,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { merge: true },
      );
      setSavedPlan((p) => ({
        ...p,
        workout: {
          ...p?.workout,
          weeklyPlan: gen,
          location,
          dayLocations: nextDayLocs,
          dayAdjustments,
          pauseWindow,
          focusAreas: focusAreas || null,
        },
      }));
      setDayLocations(nextDayLocs);
      addToast(t("workout.planSaved"));
    } catch {
      addToast(t("workout.failedSave"), "error");
    }
  };

  const regenerate = async () => {
    const seed = String(Date.now());
    const gen = focusAreas?.length
      ? generateFocusedPlan({
          goal: goalType,
          experience,
          location,
          focusAreas,
          seed,
        })
      : generateWorkoutPlan({ goal: goalType, experience, location, seed });
    const user = auth.currentUser;
    const nextDayLocs = {};
    if (user) {
      try {
        await setDoc(
          doc(db, "plans", user.uid),
          {
            workout: {
              goal: goalType,
              experience,
              location,
              focusAreas: focusAreas?.length ? focusAreas : null,
            weeklyPlan: gen,
            dayLocations: nextDayLocs,
            dayAdjustments,
            pauseWindow,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          },
          { merge: true },
        );
      } catch {
        // Best-effort persistence; the local state already updated.
      }
    }
    setSavedPlan((p) => ({
      ...p,
      workout: {
        ...p?.workout,
        weeklyPlan: gen,
        location,
        dayLocations: nextDayLocs,
        dayAdjustments,
        pauseWindow,
        focusAreas: focusAreas || null,
      },
    }));
    setDayLocations(nextDayLocs);
    addToast(t("workout.newPlan"));
  };

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const selectedDayName =
    selectedIso && isValid(parseISO(selectedIso))
      ? format(parseISO(selectedIso), "EEEE", { locale: enUS })
      : null;

  const selectedDayData = useMemo(() => {
    if (!selectedDayName || !selectedIso) return null;
      return resolveWorkoutDayForDate({
        dayName: selectedDayName,
        isoDate: selectedIso,
        weeklyPlan,
        planLocation: location,
        dayLocations,
        dayAdjustments,
        pauseWindow,
        goal: goalType,
        experience,
        focusAreas,
        seedPrefix: planSeed,
    });
  }, [
    selectedDayName,
    selectedIso,
    weeklyPlan,
    location,
    dayLocations,
    dayAdjustments,
    pauseWindow,
    goalType,
    experience,
    focusAreas,
    planSeed,
  ]);

  const selectedIsRest = !selectedDayData?.exercises?.length;
  const effectiveLocForSelected = selectedDayData?.trainingLocation ?? location;
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const selectedIsToday = selectedIso === todayIso;
  const selectedExercises = selectedDayData?.exercises || [];
  const selectedTotalMinutes = selectedExercises.reduce((sum, exercise) => sum + (exercise.duration || 0), 0);
  const selectedAdjustment = dayAdjustments[selectedIso] || null;
  const effectivePauseEndDate = pauseEndDate < selectedIso ? selectedIso : pauseEndDate;
  const pauseActiveForSelected =
    pauseWindow?.active &&
    pauseWindow?.startDate &&
    pauseWindow?.endDate &&
    selectedIso >= pauseWindow.startDate &&
    selectedIso <= pauseWindow.endDate;

  const dayAbbr = isHr ? DAY_ABBR_HR : DAY_ABBR_EN;
  const difficultyLabel = translateExperience(experience, language);

  /* Current week (Mon–Sun) with resolved focus for the weekly-plan row */
  const weekPlanDays = useMemo(() => {
    if (!loaded) return [];
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const iso = format(date, "yyyy-MM-dd");
      const dayName = format(date, "EEEE", { locale: enUS });
      const data = resolveWorkoutDayForDate({
        dayName,
        isoDate: iso,
        weeklyPlan,
        planLocation: location,
        dayLocations,
        dayAdjustments,
        pauseWindow,
        goal: goalType,
        experience,
        focusAreas,
        seedPrefix: planSeed,
      });
      const rest = !data?.exercises?.length;
      return {
        iso,
        label: dayAbbr[i],
        focus: rest ? null : translateFocus(data.focus, language),
        rest,
        isToday: iso === todayIso,
        isSelected: iso === selectedIso,
      };
    });
  }, [loaded, weeklyPlan, location, dayLocations, dayAdjustments, pauseWindow, goalType, experience, focusAreas, planSeed, todayIso, selectedIso, language, dayAbbr]);

  /* Metrics (real data from useDashboardData) */
  const WEEKLY_GOAL = 3;
  const completedThisWeek = weeklyDays.filter((d) => d.completed).length;
  const weeklyGoalPct = Math.min(100, Math.round((completedThisWeek / WEEKLY_GOAL) * 100));
  const metrics = [
    { icon: "🔥", value: caloriesToday > 0 ? caloriesToday.toLocaleString() : "0", unit: "kcal", label: isHr ? "Kalorije" : "Calories" },
    { icon: "✨", value: streak, unit: isHr ? "dana" : "days", label: "Streak" },
    { icon: "🎯", value: `${weeklyGoalPct}%`, unit: "", label: isHr ? "Cilj" : "Goal" },
  ];

  /* Today's workout summary for the dominant card */
  const heroFocus = selectedIsRest
    ? (isHr ? "Dan odmora" : "Rest day")
    : translateFocus(selectedDayData?.focus, language);
  const heroChips = selectedIsRest
    ? []
    : [`${selectedTotalMinutes} min`, difficultyLabel].filter(Boolean);

  return (
    <div className="workout-plan-page app-mobile-page">

      <div
        className="wp-top-block"
        style={heroImageSrc ? { "--wp-hero-image": `url(${JSON.stringify(heroImageSrc)})` } : undefined}
      >
      {heroImageSrc ? (
        <div className="wp-top-visual" aria-hidden="true">
          <img src={heroImageSrc} alt="" className="wp-top-visual-photo" />
          <div className="wp-top-visual-fade" />
        </div>
      ) : null}
      <MobilePageHeader title={t("workout.title")} />
      <header className="wp-header">
        <h1 className="wp-header-title">
          {t("workout.title")}
        </h1>
        <div className="wp-header-actions">
          <span className="wp-header-bell" aria-hidden>
            <HiBell style={{ width: 18, height: 18, color: PINK.deep }} />
            <span className="wp-header-bell-dot" />
          </span>
          <div className="wp-header-avatar" aria-hidden>
            {avatarLetter}
          </div>
        </div>
      </header>

      <div className="wp-main-grid">
        <div className={`wp-hero${selectedIsRest ? " wp-hero--rest" : ""}`}>
          <div className="wp-hero-mist" aria-hidden="true" />
          <div className="wp-hero-copy">
            <p className="wp-hero-eyebrow">
              {selectedIsToday ? (isHr ? "Današnji trening" : "Today's workout") : (format(parseISO(selectedIso), "EEEE", { locale: dfLocale }).charAt(0).toUpperCase() + format(parseISO(selectedIso), "EEEE", { locale: dfLocale }).slice(1))}
            </p>
            <h2 className="wp-hero-title">
              {heroFocus}
            </h2>
            {selectedIsRest ? (
              <p className="wp-hero-meta">{t("workout.restDay")}</p>
            ) : (
              <p className="wp-hero-meta">
                {heroChips.join(" • ")}
              </p>
            )}
            {!selectedIsRest ? (
              <Link
                to={`/workout/day/${selectedIso}`}
                className="dashboard-hero-cta wp-hero-cta"
              >
                {isHr ? "Započni trening" : "Start workout"}
                <HiArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            ) : null}
          </div>
        </div>

        <aside className="wp-summary-card">
          <div className="wp-summary-days">
            {weeklyDays.map((day, i) => {
              const rest = weekPlanDays[i]?.rest;
              const selected = weekPlanDays.length ? !!weekPlanDays[i]?.isSelected : day.isToday;
              const done = day.completed || (day.isToday && day.pct > 0);
              let tone = "future";
              let mark = "";
              if (selected) {
                tone = "today";
                mark = "●";
              } else if (day.isFuture) {
                tone = "future";
              } else if (done) {
                tone = "done";
                mark = "✓";
              } else if (rest) {
                tone = "rest";
                mark = "–";
              }
              return (
                <div key={day.key} className="wp-summary-day">
                  <div className={`wp-summary-dot wp-summary-dot--${tone}`}>
                    {mark}
                  </div>
                  <span className="wp-summary-day-label">{dayAbbr[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="wp-summary-metrics">
            {metrics.map((m) => (
              <div key={m.label} className="wp-summary-metric">
                <p className="wp-summary-metric-icon">{m.icon}</p>
                <p className="wp-summary-metric-value">
                  {m.value}{m.unit ? <span className="wp-summary-metric-unit">{m.unit}</span> : null}
                </p>
                <p className="wp-summary-metric-label">{m.label}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: PINK.text, margin: 0 }}>{isHr ? "Tjedni plan" : "Weekly plan"}</h2>
        <div className="wp-week-row">
          {weekPlanDays.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => { setSelectedIso(d.iso); setDetailExercise(null); }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                borderRadius: 18, padding: "14px 8px", cursor: "pointer", minWidth: 0,
                transition: "all 0.15s",
                border: "none",
                background: d.isSelected ? PINK_GRADIENT_BTN : (d.rest ? "#F6F2F0" : "#fff"),
                boxShadow: d.isSelected ? "0 8px 18px rgba(240,81,139,0.22)" : "none",
                outline: d.isToday && !d.isSelected ? `2px solid ${PINK.mid}` : "none",
                outlineOffset: 0,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: d.isSelected ? "#fff" : PINK.text }}>{d.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: d.isSelected ? "rgba(255,255,255,0.92)" : PINK.muted, lineHeight: 1.25, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                {d.rest ? (isHr ? "Odmor" : "Rest") : d.focus}
              </span>
            </button>
          ))}
        </div>
      </section>

      {!loaded ? (
        <WorkoutSkeleton />
      ) : (
        <>
          {/* ── EXERCISES for selected day ── */}
          {selectedIsRest ? (
            <section className="wp-day-panel wp-day-panel--rest">
              <div className="wp-day-panel-head">
                <h3 className="wp-day-panel-date">
                  {selectedIso
                    ? format(parseISO(selectedIso), "EEEE, d MMMM", { locale: dfLocale })
                    : (isHr ? "Dan odmora" : "Rest day")}
                </h3>
                <span className="wp-day-panel-meta">{isHr ? "Dan odmora" : "Rest day"}</span>
              </div>
              <div className="wp-day-rest-body">
                <span aria-hidden className="wp-day-rest-icon">💗</span>
                <p className="wp-day-rest-copy">{t("workout.restDay")}</p>
              </div>
            </section>
          ) : (
          <section className="wp-day-panel">
            <div className="wp-day-panel-head">
              <h3 className="wp-day-panel-date">
                {format(parseISO(selectedIso), "EEEE, d MMMM", { locale: dfLocale })}
              </h3>
              <span className="wp-day-panel-meta">
                {selectedExercises.length} {t("common.exercises")} • ~{selectedTotalMinutes} {t("common.min")}
              </span>
            </div>

            {detailExercise && (
              <div className="wp-day-detail">
                <ExerciseDetailPanel
                  exercise={detailExercise}
                  gender={gender}
                  t={t}
                  language={language}
                  onClose={() => setDetailExercise(null)}
                />
              </div>
            )}

            <div className="wp-ex-list">
              {selectedExercises.map((ex, index) => {
                const name = ex.text?.en?.name || ex.name;
                const setsReps = ex.sets && ex.reps
                  ? `${ex.sets} × ${ex.reps}`
                  : (ex.note || (ex.duration ? `${ex.duration} ${t("common.min")}` : ""));
                const muscleRaw = ex.muscleGroup || ex.muscle || "";
                const muscleLabel = muscleRaw ? translateMuscle(muscleRaw, language) : "";
                const thumb = exerciseThumbSrc(ex, gender);
                const num = String(index + 1).padStart(2, "0");
                const isOpen = detailExercise
                  && ((detailExercise.id && detailExercise.id === ex.id)
                    || detailExercise.name === ex.name);
                return (
                  <button
                    key={`${ex.id || ex.name}-${index}`}
                    type="button"
                    className={`wp-ex-row${isOpen ? " is-open" : ""}`}
                    onClick={() => setDetailExercise(ex)}
                  >
                    <span className="wp-ex-num">{num}</span>
                    {thumb ? (
                      <ExerciseImage src={thumb} alt="" width={42} height={42} className="wp-ex-thumb" />
                    ) : (
                      <span className="wp-ex-thumb wp-ex-thumb--empty" aria-hidden><HiOutlinePhoto /></span>
                    )}
                    <span className="wp-ex-copy">
                      <span className="wp-ex-name">{name}</span>
                      {muscleLabel ? <span className="wp-ex-sub">{muscleLabel}</span> : null}
                    </span>
                    {setsReps ? <span className="wp-ex-sets">{setsReps}</span> : null}
                    <HiChevronRight className="wp-ex-chevron" aria-hidden />
                  </button>
                );
              })}
            </div>
          </section>
          )}

          {/* ── CALENDAR SECTION (collapsible) ── */}
          <div className={`wp-config-card wp-cal-card${showCalendar ? " is-open" : ""}`}>
            <button
              type="button"
              className="wp-config-accord-btn"
              onClick={() => setShowCalendar((v) => !v)}
              aria-expanded={showCalendar}
            >
              <span className="wp-config-accord-label">
                <span className="wp-config-accord-icon" aria-hidden>
                  <HiCalendarDays />
                </span>
                <span>{isHr ? "Kalendar treninga" : "Workout calendar"}</span>
              </span>
              <HiChevronDown className="wp-config-accord-chevron" aria-hidden />
            </button>

            {showCalendar && (
            <div className="wp-cal-body">
            {/* Month navigation */}
            <div className="wp-cal-nav">
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                className="wp-cal-nav-btn"
                aria-label={t("workout.prevMonth")}
              >
                <HiChevronLeft />
              </button>
              <h2 className="wp-cal-month">
                {format(calendarMonth, "LLLL yyyy", { locale: dfLocale })}
              </h2>
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                className="wp-cal-nav-btn"
                aria-label={t("workout.nextMonth")}
              >
                <HiChevronRight />
              </button>
            </div>

            {/* Day header labels */}
            <div className="wp-cal-dow">
              {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((k) => (
                <div key={k} className="wp-cal-dow-cell">
                  {t(`workout.cal.${k}`)}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="wp-cal-grid">
              {calendarDays.map((d) => {
                const iso = format(d, "yyyy-MM-dd");
                const inMonth = isSameMonth(d, calendarMonth);
                const dayName = format(d, "EEEE", { locale: enUS });
                const cellData = resolveWorkoutDayForDate({
                  dayName,
                  isoDate: iso,
                  weeklyPlan,
                  planLocation: location,
                  dayLocations,
                  dayAdjustments,
                  pauseWindow,
                  goal: goalType,
                  experience,
                  focusAreas,
                  seedPrefix: planSeed,
                });
                const rest = !cellData?.exercises?.length;
                const isSel = iso === selectedIso;
                const today = isToday(d);

                const cellClass = [
                  "wp-cal-cell",
                  !inMonth ? "is-out" : "",
                  isSel ? "is-selected" : "",
                  today && !isSel ? "is-today" : "",
                  inMonth && rest && !isSel && !today ? "is-rest" : "",
                  inMonth && !rest && !isSel && !today ? "is-workout" : "",
                ].filter(Boolean).join(" ");

                return (
                  <button
                    key={iso}
                    type="button"
                    className={cellClass}
                    onClick={() => {
                      setSelectedIso(iso);
                      setDetailExercise(null);
                    }}
                  >
                    {format(d, "d")}
                  </button>
                );
              })}
            </div>

            <div className="wp-cal-legend" aria-hidden="true">
              <span className="wp-cal-legend-item">
                <span className="wp-cal-legend-dot is-selected" />
                {t("workout.legendSelected")}
              </span>
              <span className="wp-cal-legend-item">
                <span className="wp-cal-legend-dot is-today" />
                {t("workout.legendToday")}
              </span>
              <span className="wp-cal-legend-item">
                <span className="wp-cal-legend-dot is-other" />
                {t("workout.legendOtherDays")}
              </span>
            </div>
            </div>
            )}
          </div>

          {/* ── PLAN SETTINGS ── */}
          {selectedDayData && selectedIso && (
            <div className="wp-config-card wp-settings-card">
              <div className="wp-settings-head">
                <HiCog6Tooth aria-hidden />
                <h2>{isHr ? "Postavke plana" : "Plan settings"}</h2>
              </div>

              <div className="wp-settings-primary">
                <div>
                  <p className="wp-settings-label">{isHr ? "Lokacija" : "Location"}</p>
                  <div className="wp-seg" role="group" aria-label={isHr ? "Lokacija" : "Location"}>
                    <button
                      type="button"
                      onClick={() => setBaseLocation("gym")}
                      className={`wp-seg-btn${location === "gym" ? " is-on" : ""}`}
                    >
                      <HiBuildingOffice2 aria-hidden /> {t("workout.locationGym")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBaseLocation("home")}
                      className={`wp-seg-btn${location === "home" ? " is-on" : ""}`}
                    >
                      <HiHome aria-hidden /> {t("workout.locationHome")}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="wp-settings-label">{isHr ? "Plan" : "Plan"}</p>
                  <div className="wp-plan-actions">
                    <button type="button" onClick={regenerate} className="wp-btn-secondary">
                      <HiArrowPath aria-hidden /> {t("workout.regenerate")}
                    </button>
                    <button type="button" onClick={savePlan} className="wp-btn-primary wp-save-btn">
                      <HiCheck aria-hidden /> {t("workout.savePlan")}
                    </button>
                  </div>
                </div>
              </div>

              {gender !== "male" && (
                <SettingsAccordion
                  open={showSpecial}
                  onToggle={() => setShowSpecial((v) => !v)}
                  title={t("workout.specialNeeds")}
                  icon={<HiHeart />}
                >
                  <p className="wp-config-hint">
                    {isHr
                      ? "Ako je prvi dan menstruacije, plan ce se prebaciti na laganiji oporavak i njeznije vjezbe."
                      : "If this is the first day of your period, the plan shifts to a gentler recovery session."}
                  </p>
                  <button
                    type="button"
                    onClick={() => togglePeriodDayOne(selectedIso)}
                    className={`wp-btn-block${selectedAdjustment === "period_day_1" ? " is-active" : ""}`}
                  >
                    <HiHeart aria-hidden />
                    {selectedAdjustment === "period_day_1"
                      ? t("workout.periodMarked")
                      : t("workout.markPeriod")}
                  </button>
                  {selectedAdjustment && (
                    <button
                      type="button"
                      onClick={() => clearAdjustmentForSelected(selectedIso)}
                      className="wp-link-action"
                    >
                      {t("workout.removeAdjustment")}
                    </button>
                  )}
                </SettingsAccordion>
              )}

              <SettingsAccordion
                open={showPause}
                onToggle={() => setShowPause((v) => !v)}
                title={t("workout.trainingPause")}
                icon={<HiPause />}
              >
                <p className="wp-config-hint">
                  {isHr
                    ? "Oznaci pauzu zbog bolesti, ozljede ili drugih razloga i plan ce te dane pretvoriti u oporavak."
                    : "Mark a pause for illness, injury, or another reason and those days will switch to recovery."}
                </p>
                <div className="wp-pause-fields">
                  <select
                    value={pauseReason}
                    onChange={(event) => setPauseReason(event.target.value)}
                    className="wp-field"
                  >
                    <option value="illness">{t("workout.pauseReasonIllness")}</option>
                    <option value="injury">{t("workout.pauseReasonInjury")}</option>
                    <option value="travel">{t("workout.pauseReasonTravel")}</option>
                    <option value="other">{t("workout.pauseReasonOther")}</option>
                  </select>
                  <input
                    type="date"
                    min={selectedIso}
                    value={effectivePauseEndDate}
                    onChange={(event) => setPauseEndDate(event.target.value)}
                    className="wp-field"
                  />
                </div>
                <div className="wp-pause-actions">
                  <button
                    type="button"
                    onClick={() => savePauseFromSelected(pauseReason, effectivePauseEndDate)}
                    className="wp-btn-primary"
                  >
                    {t("workout.savePause")}
                  </button>
                  {pauseWindow?.active && (
                    <button
                      type="button"
                      onClick={clearPauseWindow}
                      className="wp-btn-secondary"
                    >
                      {t("workout.clearPause")}
                    </button>
                  )}
                </div>
                {pauseWindow?.active && (
                  <p className="wp-config-status">
                    {isHr
                      ? `Pauza je aktivna od ${pauseWindow.startDate} do ${pauseWindow.endDate}.`
                      : `Pause is active from ${pauseWindow.startDate} to ${pauseWindow.endDate}.`}
                  </p>
                )}
              </SettingsAccordion>

              <SettingsAccordion
                open={showDayLoc}
                onToggle={() => setShowDayLoc((v) => !v)}
                title={isHr ? "Ostale postavke" : "Other plan settings"}
                icon={<HiCog6Tooth />}
              >
                <p className="wp-settings-label">{t("workout.dayLocationLabel")}</p>
                <div className="wp-seg" role="group" aria-label={t("workout.dayLocationLabel")}>
                  <button
                    type="button"
                    onClick={() => setLocationForSelected(selectedIso, "gym")}
                    className={`wp-seg-btn${effectiveLocForSelected === "gym" ? " is-on" : ""}`}
                  >
                    <HiBuildingOffice2 aria-hidden /> {t("workout.locationGym")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationForSelected(selectedIso, "home")}
                    className={`wp-seg-btn${effectiveLocForSelected === "home" ? " is-on" : ""}`}
                  >
                    <HiHome aria-hidden /> {t("workout.locationHome")}
                  </button>
                </div>
                <p className="wp-config-hint wp-config-hint--tight">{t("workout.dayLocationHint")}</p>
              </SettingsAccordion>

              {!selectedIsRest && (selectedDayData?.statusMessageHr || selectedDayData?.statusMessage) && (
                <div className={`wp-day-status${pauseActiveForSelected ? " is-pause" : ""}`}>
                  <span>
                    {pauseActiveForSelected
                      ? t("workout.pauseAdjusted")
                      : t("workout.easierDayAdjusted")}
                  </span>{" "}
                  {isHr ? selectedDayData.statusMessageHr || selectedDayData.statusMessage : selectedDayData.statusMessage}
                </div>
              )}
            </div>
          )}


          {/*
            Blok "Extra ideas" / Dodatne aktivnosti uklonjen — ista funkcionalnost
            zivi u src/pages/ExtraActivities.jsx. Ovdje se stanja za taj panel
            (activitySuggestions, openActivityId, activityVariantById,
            activityDetailExercise) vise ne drze.
          */}
        </>
      )}
    </div>
  );
}


