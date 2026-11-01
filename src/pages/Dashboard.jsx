import { useState, useMemo, useId, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { getUserPlanSummary } from "../utils/planEngine";
import { getDashboardSummary } from "../utils/dashboardSummary";
import { useDashboardData } from "../hooks/useDashboardData";
import { useLayoutBreakpoint } from "../hooks/useLayoutBreakpoint";
import { ProgressChart, MuscleFocusCard } from "../components/dashboard";
import DashboardQuickSearch from "../components/dashboard/DashboardQuickSearch";
import MobilePageHeader from "../components/layout/MobilePageHeader";
import {
  HiBell, HiArrowRight, HiPlus,
  HiClock, HiFire, HiSignal,
} from "react-icons/hi2";
import { translateExperience } from "../i18n/workoutTranslations";
import { getRecipeImageSrc, getRecipeImagePlaceholder } from "../data/recipeImageMap";
import workoutHeroImg from "../assets/dashboard/workout-hero.webp";

/** Distinct existing food photo — not taken from today's meal thumbnails. */
const DASHBOARD_NUTRITION_FOOD_SRC = "/assets/nutrition/recipes/granola-bowl-with-fruit.webp";
const PLAN_DAY_KEYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PLAN_MEAL_KEYS = ["Breakfast", "Lunch", "Dinner", "Snack"];

function pickTodayMealThumbs(planData) {
  const day = PLAN_DAY_KEYS[(new Date().getDay() + 6) % 7];
  const meals = planData?.nutrition?.meals?.[day] || {};
  const selections = planData?.nutrition?.selections?.[day] || {};
  const thumbs = [];
  for (const meal of PLAN_MEAL_KEYS) {
    const options = Array.isArray(meals[meal]) ? meals[meal] : [];
    const raw = selections[meal];
    if (raw === null || raw === undefined) continue;
    const items = Array.isArray(raw)
      ? raw
      : Number.isInteger(raw)
        ? (() => {
          if (!options.length) return [];
          const index = Math.min(Math.max(0, raw), options.length - 1);
          const food = options[index];
          return food ? [food] : [];
        })()
        : [];
    for (const food of items) {
      if (!food?.name) continue;
      thumbs.push({
        name: food.name,
        src: food.imageUrl || getRecipeImageSrc(food.name),
      });
      if (thumbs.length === 3) return thumbs;
    }
  }
  return thumbs;
}
import { format } from "date-fns";
import {
  hr as hrLocale, it as itLocale, es as esLocale,
  de as deLocale, fr as frLocale, pt as ptLocale,
} from "date-fns/locale";

/* ─── copy ───────────────────────────────────────────────────── */
const MOTIVATION_HR = [
  "Svaki trening te čini jačom! 💪",
  "Ti si svoja vlastita superheroja! ⚡",
  "Konzistentnost je tvoja supermoc! ✨",
  "Mali koraci, veliki rezultati! 🌟",
  "Daj sve od sebe danas i tijelo će te nagraditi! 🔥",
];
const MOTIVATION_EN = [
  "Every workout makes you stronger! 💪",
  "You are your own superhero! ⚡",
  "Consistency is your superpower! ✨",
  "Small steps, big results! 🌟",
  "Give it your all today and your body will thank you! 🔥",
];
const TIPS_HR = [
  "Mali koraci danas — veliki rezultati sutra. 💜",
  "Popij čašu vode prije svakog treninga za bolji učinak! 💧",
  "Odmor je dio treninga — tijelo raste dok se oporavlja. 😴",
  "Protein nakon treninga pomaže regeneraciji mišića. 🥩",
  "Spavanje 7–9 sati poboljšava performanse za do 30%. 🌙",
];
const TIPS_EN = [
  "Small steps today, big results tomorrow. 💜",
  "Drink a glass of water before every workout! 💧",
  "Rest is part of training — your body grows while recovering. 😴",
  "Protein after training helps muscle recovery. 🥩",
  "Sleeping 7–9 hours improves performance by up to 30%. 🌙",
];
const DAY_HR = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];
const DAY_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── Local pink wellness palette (Dashboard-only, does NOT touch global theme) ─── */
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
const HERO_SHADOW = "0 8px 24px rgba(240,81,139,0.10), 0 20px 48px rgba(240,81,139,0.11)";
const PINK_CARD_SHADOW = "0 4px 18px rgba(240,81,139,0.06), 0 14px 36px rgba(240,81,139,0.08)";
const CARD_BG = "#FFFCFA";
const CARD_RADIUS = 28;

/* ─── Week dots ─────────────────────────────────────────────── */
function WeekRow({ weeklyDays, dayLabels, accent = "var(--color-brand)", accentSoft = "var(--color-brand-soft)", dotSize = 36 }) {
  return (
    <div className="dashboard-week-row">
      {weeklyDays.map((day, i) => {
        const done = day.completed || (day.isToday && day.pct > 0);
        return (
          <div key={day.key} className="dashboard-week-dot" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: dotSize, height: dotSize, borderRadius: "50%", transition: "all .25s",
              background: day.isFuture ? "#f6eef2" : done ? accent : day.isToday ? accentSoft : "#f6eef2",
              border: day.isToday && !done ? `2.5px solid ${accent}` : "2.5px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700,
              color: day.isFuture ? "#d7c4ce" : done ? "#fff" : day.isToday ? accent : "#b9a7b1",
            }}>
              {!day.isFuture && (done ? "✓" : day.isToday ? "●" : "")}
            </div>
            <span style={{ fontSize: 9, fontWeight: day.isToday ? 700 : 500, color: day.isToday ? accent : "#a9989f" }}>
              {dayLabels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Soft progress ring with a warm pink gradient stroke ─────── */
function Ring({ size = 116, stroke = 11, pct = 0, track = PINK.track, label, sub }) {
  const gradId = useId();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }} aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PINK.mid} />
            <stop offset="100%" stopColor={PINK.deep} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={`url(#${gradId})`} strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - clamped / 100)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.27, fontWeight: 900, color: PINK.text, lineHeight: 1, letterSpacing: "-0.02em" }}>{label}</span>
        {sub && <span style={{ fontSize: 10, fontWeight: 600, color: PINK.muted, marginTop: 4 }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [tipIndex, setTipIndex] = useState(0);
  const [mealThumbs, setMealThumbs] = useState([]);

  const { user, userGoal } = useAuth();
  const { streak, caloriesToday, weeklyDays, weeklyChartData } = useDashboardData(user?.uid);
  const { t, language } = useTranslation();
  const layoutBreakpoint = useLayoutBreakpoint();
  const isPhoneLayout = layoutBreakpoint === "mobile";

  useEffect(() => {
    if (!user?.uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "plans", user.uid));
        if (!cancelled) setMealThumbs(pickTodayMealThumbs(snap.exists() ? snap.data() : null));
      } catch {
        if (!cancelled) setMealThumbs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const isHr = false; // English-only public demo
  const localeMap = { hr: hrLocale, it: itLocale, es: esLocale, de: deLocale, fr: frLocale, pt: ptLocale };
  const rawDate = format(new Date(), "EEEE, MMM d, yyyy");
  const dateDisplay = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  const firstName = (user?.displayName || user?.email?.split("@")[0] || "Maja").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = isHr
    ? hour < 12 ? "Dobro jutro" : hour < 18 ? "Dobar dan" : "Dobra večer"
    : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greetingEmoji = hour < 12 ? "🌸" : hour < 18 ? "☀️" : "💜";

  const todayDateKey = format(new Date(), "yyyy-MM-dd");
  const tips = isHr ? TIPS_HR : TIPS_EN;
  const dayLabels = isHr ? DAY_HR : DAY_EN;
  const motivations = isHr ? MOTIVATION_HR : MOTIVATION_EN;

  const completedThisWeek = weeklyDays.filter((d) => d.completed).length;
  const nonFutureDays = Math.max(1, weeklyDays.filter((d) => !d.isFuture).length);
  const CALORIE_GOAL = 500;
  const calPct = Math.min(100, Math.round((caloriesToday / CALORIE_GOAL) * 100));
  const WEEKLY_GOAL = 3;
  const weeklyGoalPct = Math.min(100, Math.round((completedThisWeek / WEEKLY_GOAL) * 100));
  const remainingToGoal = Math.max(0, WEEKLY_GOAL - completedThisWeek);

  const todayIndex = useMemo(() => new Date().getDay(), []);
  const motivationText = motivations[todayIndex % motivations.length];

  /* ── onboarding guard ── */
  if (!userGoal) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
        <div style={{ maxWidth: 400, background: "#fff", borderRadius: 28, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", padding: 36, textAlign: "center" }}>
          
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", margin: "0 0 10px" }}>{t("dashboard.welcome")} 💪</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>{t("dashboard.setupDesc")}</p>
          <Link to="/onboarding" className="app-btn-primary">
            {t("dashboard.completeSetup")} <HiArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </div>
    );
  }

  const planSummary = getUserPlanSummary(userGoal);
  const targetCal = Number(planSummary?.calories) || 0;
  const nutritionPct = targetCal > 0 ? Math.min(100, Math.round((caloriesToday / targetCal) * 100)) : 0;
  const summary = getDashboardSummary();
  const visibleMealThumbs = user?.uid ? mealThumbs : [];
  const nutritionFoodSrc = DASHBOARD_NUTRITION_FOOD_SRC || visibleMealThumbs[0]?.src || getRecipeImagePlaceholder();
  const nutritionThumbs = visibleMealThumbs.length
    ? visibleMealThumbs
    : Array.from({ length: 3 }, (_, i) => ({ name: `meal-${i}`, src: getRecipeImagePlaceholder() }));
  const workout = summary.todayWorkout;
  const experienceKey = userGoal?.experience || "beginner";
  const experienceLabel = language === "en"
    ? experienceKey.charAt(0).toUpperCase() + experienceKey.slice(1)
    : translateExperience(experienceKey, language);

  /* ─────────────────────────────────────────────────────────────
     BLOCKS — each is a JSX fragment reused in both mobile & desktop
  ───────────────────────────────────────────────────────────── */

  /* ── 1. HERO — original premium pink/peach workout card ── */
  const greetingHeader = (
    <div className="dashboard-desktop-greeting" style={{ minWidth: 0 }}>
      <p className="dashboard-desktop-date" style={{ color: PINK.muted, fontWeight: 600, margin: "0 0 2px", letterSpacing: "0.01em" }}>
        {dateDisplay}
      </p>
      <h1 className="dashboard-desktop-title" style={{ fontWeight: 800, color: PINK.text, margin: "0 0 2px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
        {greeting}, {firstName}! {greetingEmoji}
      </h1>
      <p className="dashboard-desktop-motivation" style={{ color: PINK.muted, margin: 0, lineHeight: 1.35 }}>
        {motivationText}
      </p>
    </div>
  );

  const heroCard = ({ minHeight }) => (
    <div
      className="dashboard-hero-card"
      style={{
        borderRadius: CARD_RADIUS,
        border: "none",
        boxShadow: HERO_SHADOW,
        position: "relative",
        overflow: "hidden",
        height: "100%",
        minHeight,
      }}
    >
      <img
        src={workoutHeroImg}
        alt=""
        className="dashboard-hero-photo"
      />
      <div className="dashboard-hero-overlay" aria-hidden />

      <div className="dashboard-hero-layout">
        <div className="dashboard-hero-copy">
          <p className="dashboard-hero-eyebrow" style={{ color: PINK.deep, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", margin: "0 0 8px" }}>
            {isHr ? "Današnji trening" : "Today's Workout"}
          </p>
          <h2 className="dashboard-hero-title" style={{ fontWeight: 900, color: PINK.text, margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.12 }}>
            {isHr ? workout.titleHr : workout.title}
          </h2>

          <div className="dashboard-hero-meta dashboard-hero-meta-full">
            <span>
              <HiClock />
              {workout.durationMin} min
            </span>
            <span>
              <HiFire />
              {workout.kcal} kcal
            </span>
            <span>
              <HiSignal />
              {experienceLabel}
            </span>
          </div>
          <div className="dashboard-hero-meta dashboard-hero-meta-phone">
            <p className="dashboard-hero-meta-line">
              {workout.durationMin} min • {workout.kcal} kcal
            </p>
            <span className="dashboard-hero-level">{experienceLabel}</span>
          </div>

          <div className="dashboard-hero-actions">
            <Link
              to={`/workout/day/${todayDateKey}`}
              className="dashboard-hero-cta"
            >
              {isHr ? "Kreni s treningom" : "Start workout"}
              <HiArrowRight />
            </Link>
            <Link to="/workout" className="dashboard-hero-plan">
              {isHr ? "Pregledaj plan" : "View plan"}
            </Link>
          </div>
        </div>
        <p className="dashboard-hero-script" aria-hidden>
          Stronger<br />Healthier<br />Happier<br />You ♥
        </p>
      </div>
    </div>
  );

  /* ── 3. WEEKLY PROGRESS — compact reference card ── */
  const weeklyCard = (
    <div className="dashboard-weekly-card">
      <p className="dashboard-weekly-title">
        {isHr ? "Tjedni napredak" : "Weekly progress"}
      </p>

      <div className="dashboard-weekly-main">
        <Ring
          size={96}
          stroke={10}
          pct={weeklyGoalPct}
          label={`${weeklyGoalPct}%`}
          sub={isHr ? "ovog tjedna" : "this week"}
        />
        <div className="dashboard-weekly-goal">
          <p>{isHr ? "Tvoj cilj" : "Your goal"} 💕</p>
          <p>
            {WEEKLY_GOAL} {isHr ? "treninga tjedno" : "workouts per week"}
          </p>
        </div>
      </div>

      <WeekRow
        weeklyDays={weeklyDays}
        dayLabels={dayLabels}
        accent={PINK.base}
        accentSoft={PINK.soft}
        dotSize={26}
      />

      <p className="dashboard-weekly-foot">
        {remainingToGoal > 0
          ? isHr
            ? `Još ${remainingToGoal} ${remainingToGoal === 1 ? "trening" : "treninga"} do cilja 💪`
            : `${remainingToGoal} more to reach your goal 💪`
          : isHr
            ? "Cilj ostvaren! 🎉"
            : "Goal reached! 🎉"}
      </p>
    </div>
  );

  const muscleCard = (
    <MuscleFocusCard isHr={isHr} muscleFocus={summary.muscleFocus} />
  );

  const progressCard = (
    <ProgressChart
      title={isHr ? "Napredak" : "Progress"}
      isHr={isHr}
      weeklyData={weeklyChartData}
      dayLabels={dayLabels}
    />
  );

  const aiCoachMergedBlock = (
    <Link to="/body" className="demo-ai-coming">
      <span className="demo-ai-pill">✦ COMING SOON</span>
      <span className="demo-ai-copy"><strong>AI Wellness Coach</strong><small>Personal insights, made just for you — coming soon.</small></span>
      <HiArrowRight aria-hidden />
    </Link>
  );

  const motivationCard = (
    <div className="dashboard-motivate-card">
      <span className="dashboard-motivate-icon" aria-hidden>🌱</span>
      <p className="dashboard-motivate-text">
        {tips[tipIndex % tips.length]}
      </p>
      <button
        type="button"
        className="dashboard-motivate-next"
        aria-label={isHr ? "Sljedeći savjet" : "Next tip"}
        onClick={() => setTipIndex((x) => x + 1)}
      >
        <HiArrowRight />
      </button>
    </div>
  );

  /* ── 3. ACTIVITY STATS — shared data ── */
  const statItems = [
    {
      icon: "🔥",
      label: isHr ? "Kalorije" : "Calories",
      value: caloriesToday > 0 ? caloriesToday.toLocaleString() : "0",
      sub: "kcal",
      pct: calPct,
      badgeBg: PINK.soft,
      accent: PINK.base,
    },
    {
      icon: "✨",
      label: "Streak",
      value: streak,
      sub: isHr ? "dana" : "days",
      pct: Math.min(100, streak * 7),
      badgeBg: PINK.peach,
      accent: "#F39B7A",
    },
    {
      icon: "🎯",
      label: isHr ? "Tjedni cilj" : "Weekly goal",
      value: `${completedThisWeek}/${nonFutureDays}`,
      sub: isHr ? "treninga" : "workouts",
      pct: (completedThisWeek / nonFutureDays) * 100,
      badgeBg: PINK.softer,
      accent: PINK.deep,
    },
  ];

  /* DESKTOP metric cards — compact, readable, secondary to the hero */
  const statsBlock = (
    <div className="dashboard-metric-grid">
      {statItems.map((s) => (
        <div
          key={s.label}
          className="dashboard-metric-card"
          style={{
            background: CARD_BG,
            boxShadow: PINK_CARD_SHADOW,
          }}
        >
          <span className="dashboard-metric-icon" style={{ background: s.badgeBg }}>
            {s.icon}
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="dashboard-metric-value">
              {s.value}
              <span className="dashboard-metric-unit">{s.sub}</span>
            </p>
            <p className="dashboard-metric-label">{s.label}</p>
          </div>
          <div className="dashboard-metric-track">
            <div style={{ height: "100%", width: `${Math.min(100, s.pct)}%`, background: s.accent, borderRadius: 999, transition: "width .6s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );

  /* ── 4. TODAY'S NUTRITION — reference horizontal strip ── */
  const nutritionFood = (
    <span className="dashboard-nutrition-food">
      <img
        src={nutritionFoodSrc}
        alt=""
        onError={(event) => {
          const el = event.currentTarget;
          if (el.dataset.fallback === "1") return;
          el.dataset.fallback = "1";
          el.src = getRecipeImagePlaceholder();
        }}
      />
    </span>
  );

  const nutritionBlock = (
    <section className="dashboard-nutrition-strip" aria-label={isHr ? "Prehrana danas" : "Today's Nutrition"}>
      {nutritionFood}
      <div className="dashboard-nutrition-copy">
        <p className="dashboard-nutrition-label">{isHr ? "Prehrana danas" : "Today's Nutrition"}</p>
        <p className="dashboard-nutrition-kcal-row">
          <span className="dashboard-nutrition-kcal">{caloriesToday.toLocaleString()} kcal</span>
          {targetCal > 0 && (
            <span className="dashboard-nutrition-target">{t("common.of")} {targetCal.toLocaleString()} kcal</span>
          )}
        </p>
      </div>
      <div className="dashboard-nutrition-bar" aria-hidden>
        <span style={{ width: `${nutritionPct}%` }} />
      </div>
      <Link to="/nutrition" className="dashboard-nutrition-view">
        {isHr ? "Pogledaj obroke" : "View meals"}
        <HiArrowRight />
      </Link>
      <div className="dashboard-nutrition-thumbs">
        {nutritionThumbs.map((meal, idx) => (
          <img
            key={`${meal.name}-${idx}`}
            src={meal.src}
            alt=""
            className="dashboard-nutrition-thumb"
            onError={(event) => {
              const el = event.currentTarget;
              if (el.dataset.fallback === "1") return;
              el.dataset.fallback = "1";
              el.src = getRecipeImagePlaceholder();
            }}
          />
        ))}
      </div>
      <Link to="/nutrition/scan" className="dashboard-nutrition-add" aria-label={isHr ? "Dodaj obrok" : "Add meal"}>
        <HiPlus />
      </Link>
    </section>
  );

  const mobileHeaderBlock = (
    <MobilePageHeader
      title={`${greeting}, ${firstName}!`}
      subtitle={t("dashboard.heroLine")}
      emoji={greetingEmoji}
    />
  );

  /* ════════════════════════════════════════════════════════════
     MOBILE VIEW — single-column, phone-first
  ════════════════════════════════════════════════════════════ */
  const mobileView = (
    <div className="sm:hidden dashboard-mobile-view">
      {mobileHeaderBlock}
      <div className="dashboard-mobile-stack">
        {heroCard({ minHeight: 262 })}
        {statsBlock}
        {motivationCard}
        {nutritionBlock}
        {weeklyCard}
        {progressCard}
        {muscleCard}
        {aiCoachMergedBlock}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     DESKTOP VIEW — 2-column layout
  ════════════════════════════════════════════════════════════ */
  const desktopView = (
    <div
      className="hidden sm:block dashboard-desktop-view"
      style={{
        background: "var(--color-surface, #faf7f5)",
        minHeight: "100%",
      }}
    >
      <div className="dashboard-desktop-inner">
        <header className="dashboard-desktop-header">
          {greetingHeader}
          <div className="dashboard-desktop-tools">
            <DashboardQuickSearch todayDateKey={todayDateKey} />
            <div className="dashboard-desktop-tool-row">
              <span className="dashboard-desktop-tool-btn" aria-hidden>
                <HiBell />
                <span className="dashboard-desktop-tool-dot" />
              </span>
              <div className="dashboard-desktop-avatar" aria-hidden>
                {firstName[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-desktop-row-hero">
          {heroCard({ minHeight: 266 })}
          <div className="dashboard-desktop-hero-side">
            {statsBlock}
            {motivationCard}
          </div>
        </div>

        {nutritionBlock}

        <div className="dashboard-desktop-row-progress">
          {weeklyCard}
          {progressCard}
          {muscleCard}
        </div>

        {aiCoachMergedBlock}
      </div>
    </div>
  );

  return (
    <div className="dashboard-page app-mobile-page">
      {isPhoneLayout ? mobileView : desktopView}
    </div>
  );
}
