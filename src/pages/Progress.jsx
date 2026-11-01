import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/common/Toast";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, startOfWeek, addDays } from "date-fns";
import { hr, it, es, de, fr, pt } from "date-fns/locale";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { HiScale, HiChevronLeft, HiChevronRight, HiUser } from "react-icons/hi2";
import { useTranslation } from "../i18n/useTranslation";
import { Skeleton, SkeletonGroup } from "../components/common/SkeletonLoader";
import { EmptyState, ErrorState } from "../components/common/EmptyState";
import MobilePageHeader from "../components/layout/MobilePageHeader";

function ProgressSkeleton() {
  return (
    <SkeletonGroup className="space-y-6">
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 sm:gap-4 min-[480px]:[&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="app-card flex items-center gap-3 min-w-0 sm:items-start !p-3.5 sm:!p-4"
          >
            <Skeleton circle className="w-10 h-10 sm:w-9 shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-3 w-28 max-w-[80%]" />
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="app-card !p-4">
        <Skeleton className="h-5 w-36 mb-3" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2">
          <Skeleton className="h-11 flex-1 w-full rounded-xl" />
          <Skeleton className="h-11 w-full sm:w-32 shrink-0 rounded-xl" />
        </div>
      </div>

      <div className="app-card !p-4">
        <Skeleton className="h-5 w-44 mb-4" />
        <Skeleton className="h-[220px] w-full rounded-xl shimmer" />
      </div>

      <div className="app-card !p-4">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-[200px] w-full sm:h-[180px] rounded-xl shimmer" />
      </div>

      <div className="app-card !p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton circle className="w-8 h-8 shrink-0" />
          <Skeleton className="h-6 w-40" />
          <Skeleton circle className="w-8 h-8 shrink-0" />
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`psk-wd-${i}`} className="h-3 w-full max-w-8 mx-auto" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={`psk-d-${i}`} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </SkeletonGroup>
  );
}

function parseExtraActivityDuration(duration) {
  if (typeof duration === "number" && Number.isFinite(duration)) return duration;
  const match = String(duration || "").match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) return 0;
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  return Math.round((start + end) / 2);
}

function sumEstimatedCalories(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + getActivityCalories(item), 0);
}

function getActivityCalories(item) {
  if (!item) return 0;
  if (typeof item.estimatedCalories === "number" && Number.isFinite(item.estimatedCalories)) {
    return item.estimatedCalories;
  }
  const minutes = parseExtraActivityDuration(item.duration);
  return minutes > 0 ? minutes * 5 : 0;
}

function getWorkoutStatusLabel(entry, t) {
  if (entry?.workoutCompleted) return t("progress.trainingDone");
  if (entry?.workoutSkipped) return t("progress.trainingSkipped");
  return t("progress.trainingNoData");
}

function sumPlannedAndConsumed(entry) {
  const planned = Number(entry?.plannedNutritionCalories) || 0;
  const consumed = Number(entry?.caloriesConsumed) || 0;
  return planned + consumed;
}

export default function Progress() {
  const { t, language } = useTranslation();
  const localeMap = { hr, it, es, de, fr, pt };
  const dateFnsLocale = localeMap[language] || undefined;
  const { user, userGoal } = useAuth();
  const { addToast } = useToast();
  const todayDateKey = format(new Date(), "yyyy-MM-dd");
  const [activeProgressView, setActiveProgressView] = useState("month");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(todayDateKey);
  const [dailyData, setDailyData] = useState([]);
  const [weight, setWeight] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const progressViewTabs = useMemo(() => ([
    { id: "week", label: t("progress.viewWeek") },
    { id: "month", label: t("progress.viewMonth") },
    { id: "weight", label: t("progress.viewWeight") },
    { id: "activity", label: t("progress.viewActivity") },
  ]), [t]);

  const loadDaily = useCallback(async () => {
    if (!user) return;
    setLoaded(false);
    setFetchError(false);
    try {
      const snap = await getDocs(collection(db, "progress", user.uid, "daily"));
      const data = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.id.localeCompare(b.id));
      setDailyData(data);
    } catch (err) {
      console.error(err);
      setFetchError(true);
      setDailyData([]);
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    loadDaily();
  }, [loadDaily]);

  const logWeight = async () => {
    const parsed = parseFloat(weight);
    if (!user || !weight || isNaN(parsed) || parsed <= 0 || parsed > 500) return;
    const dateKey = format(new Date(), "yyyy-MM-dd");
    try {
      await setDoc(doc(db, "progress", user.uid, "daily", dateKey), { weight: parsed, date: dateKey }, { merge: true });
      setDailyData((prev) => {
        const idx = prev.findIndex((d) => d.id === dateKey);
        if (idx >= 0) { const c = [...prev]; c[idx] = { ...c[idx], weight: Number(weight) }; return c; }
        return [...prev, { id: dateKey, weight: Number(weight), date: dateKey }];
      });
      addToast(t("progress.weightLogged"));
      setWeight("");
    } catch { addToast(t("progress.failedLog"), "error"); }
  };

  const weightData = dailyData.filter((d) => d.weight).map((d) => ({ date: d.id.slice(5), weight: d.weight }));

  const workoutData = [];
  for (let i = 6; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    const entry = dailyData.find((x) => x.id === d);
    workoutData.push({ day: format(subDays(new Date(), i), "EEE", { locale: dateFnsLocale }), completed: entry?.workoutCompleted ? 1 : 0, skipped: entry?.workoutSkipped ? 1 : 0 });
  }

  const totalWorkouts = dailyData.filter((d) => d.workoutCompleted).length;
  const totalSkipped = dailyData.filter((d) => d.workoutSkipped).length;
  const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : userGoal?.weight;
  const extraActivityEntries = dailyData.flatMap((d) => (d.extraActivities || []).map((item) => ({ ...item, dayId: d.id })));
  const totalExtraActivities = extraActivityEntries.length;
  const totalExtraDuration = extraActivityEntries.reduce((sum, item) => sum + parseExtraActivityDuration(item.duration), 0);
  const totalExtraCalories = sumEstimatedCalories(extraActivityEntries);
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weeklyCaloriesData = useMemo(() => weekDays.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const entry = dailyData.find((d) => d.id === key);
    const intake = sumPlannedAndConsumed(entry);
    const burn = sumEstimatedCalories(entry?.extraActivities || []);
    return {
      key,
      day,
      label: format(day, "EEE", { locale: dateFnsLocale }),
      intake,
      burn,
      net: intake - burn,
    };
  }), [dailyData, dateFnsLocale, weekDays]);
  const weeklyFoodTotal = weeklyCaloriesData.reduce((sum, item) => sum + item.intake, 0);
  const weeklyBurnTotal = weeklyCaloriesData.reduce((sum, item) => sum + item.burn, 0);
  const weeklyNetTotal = weeklyFoodTotal - weeklyBurnTotal;
  const selectedCalendarEntry = dailyData.find((d) => d.id === selectedCalendarDay);
  const selectedCalendarDate = new Date(`${selectedCalendarDay}T12:00:00`);
  const selectedPlannedCalories = Number(selectedCalendarEntry?.plannedNutritionCalories) || 0;
  const selectedExtraConsumed = Number(selectedCalendarEntry?.caloriesConsumed) || 0;
  const selectedCaloriesConsumed = selectedPlannedCalories + selectedExtraConsumed;
  const selectedFoodLog = Array.isArray(selectedCalendarEntry?.foodLog) ? selectedCalendarEntry.foodLog : [];
  const selectedFoodLogCalories = sumEstimatedCalories(selectedFoodLog);
  const selectedExtraActivities = Array.isArray(selectedCalendarEntry?.extraActivities) ? selectedCalendarEntry.extraActivities : [];
  const selectedActivityBurn = sumEstimatedCalories(selectedExtraActivities);
  const selectedNetCalories = selectedCaloriesConsumed - selectedActivityBurn;
  const selectedWorkoutStatus = getWorkoutStatusLabel(selectedCalendarEntry, t);
  const selectedWeight = Number(selectedCalendarEntry?.weight) || null;
  const hasSelectedDayDetails = Boolean(selectedCalendarEntry);
  const selectedDayLabel = selectedCalendarDay === todayDateKey ? t("progress.todaySummary") : t("progress.selectedDay");
  const moveSelectedDay = (offset) => {
    setSelectedCalendarDay((current) => format(addDays(new Date(`${current}T12:00:00`), offset), "yyyy-MM-dd"));
  };

  return (
    <div className="app-mobile-page mx-auto max-w-6xl space-y-4 p-4 sm:space-y-5 sm:p-6">
      <MobilePageHeader title={t("progress.title")} />
      <section className="app-card sm:!p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="app-hide-on-mobile-header text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{t("progress.title")}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">{t("progress.subtitle")}</p>
          </div>
          <Link
            to="/body"
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100/70"
          >
            <HiUser className="h-3.5 w-3.5" />
            {t("progress.bodyAnalysisLink")}
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {progressViewTabs.map((tab) => {
          const active = activeProgressView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveProgressView(tab.id)}
              className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors sm:text-sm ${
                active
                  ? "border-primary-300 bg-primary-50 text-primary-700 shadow-sm"
                  : "border-primary-100/70 bg-white text-gray-600 hover:bg-primary-50/50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className="app-card sm:!p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => moveSelectedDay(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-100/70 bg-white text-primary-600 transition-colors hover:bg-primary-50"
            aria-label={t("common.previous")}
          >
            <HiChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500">{selectedDayLabel}</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 sm:text-xl">
              {format(selectedCalendarDate, "EEEE, d. M.", { locale: dateFnsLocale })}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{format(selectedCalendarDate, "PPP", { locale: dateFnsLocale })}</p>
          </div>
          <button
            type="button"
            onClick={() => moveSelectedDay(1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-100/70 bg-white text-primary-600 transition-colors hover:bg-primary-50"
            aria-label={t("common.next")}
          >
            <HiChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ProgressChip label={`🥗 ${t("progress.foodConsumed")}`} value={`${selectedCaloriesConsumed} ${t("common.kcal")}`} />
          <ProgressChip label={`⚖️ ${t("progress.afterActivity")}`} value={`${selectedNetCalories} ${t("common.kcal")}`} />
          <ProgressChip label={`🏋️ ${t("progress.trainingStatus")}`} value={selectedWorkoutStatus} />
        </div>

        {!hasSelectedDayDetails ? (
          <p className="mt-3 text-sm text-gray-500">{t("progress.noDayDetails")}</p>
        ) : null}
      </section>

      {!loaded ? (
        <ProgressSkeleton />
      ) : fetchError ? (
        <ErrorState
          title={t("progress.fetchErrorTitle")}
          message={t("progress.fetchErrorHint")}
          onRetry={loadDaily}
          retryLabel={t("common.tryAgain")}
          className="p-5"
        />
      ) : (
        <>
          {activeProgressView === "week" ? (
            <>
              <section className="app-card sm:!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">{t("progress.weeklyCaloriesTitle")}</p>
                    <h2 className="mt-1 text-base font-semibold text-gray-900">{t("progress.weeklyCaloriesHint")}</h2>
                  </div>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                    {format(weekDays[0], "d.M.")}
                    {" "}
                    - {format(weekDays[6], "d.M.")}
                  </span>
                </div>

                <div className="mt-3.5 h-[210px] w-full min-w-0 overflow-hidden sm:h-[200px] lg:h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyCaloriesData} margin={{ top: 6, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} minTickGap={8} />
                      <YAxis tick={{ fontSize: 12 }} width={30} />
                      <Tooltip />
                      <Bar dataKey="intake" fill="#9333ea" name={t("progress.weeklyFoodIntake")} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="burn" fill="#fbbf24" name={t("progress.weeklyActivityBurn")} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <ProgressChip label={t("progress.weeklyTotalFood")} value={`~${weeklyFoodTotal} ${t("common.kcal")}`} />
                  <ProgressChip label={t("progress.weeklyTotalBurn")} value={`~${weeklyBurnTotal} ${t("common.kcal")}`} accent="gold" />
                  <ProgressChip label={t("progress.weeklyTotalNet")} value={`~${weeklyNetTotal} ${t("common.kcal")}`} />
                </div>
              </section>

              <section className="app-card sm:!p-4">
                <div className="mb-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-gray-900">{t("progress.activitySectionTitle")}</h2>
                    <p className="text-sm text-gray-500">{t("progress.activitySectionHint")}</p>
                  </div>
                  <div className="hidden rounded-2xl bg-gray-50 px-2.5 py-2 text-right sm:block">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{t("progress.extraActivitiesCount")}</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{totalExtraActivities}</p>
                  </div>
                </div>

                <div className="app-card !p-3">
                  <h3 className="mb-2.5 text-sm font-semibold text-gray-900">{t("progress.weekWorkouts")}</h3>
                  <div className="h-[200px] w-full min-w-0 overflow-hidden sm:h-[190px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workoutData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} interval={0} minTickGap={10} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={26} />
                        <Tooltip />
                        <Bar dataKey="completed" fill="#9333ea" name={t("common.completed")} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="skipped" fill="#fbbf24" name={t("common.skipped")} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {activeProgressView === "month" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
              <WorkoutCalendar
                dailyData={dailyData}
                t={t}
                dateFnsLocale={dateFnsLocale}
                selectedCalendarDay={selectedCalendarDay}
                setSelectedCalendarDay={setSelectedCalendarDay}
              />

              <section className="app-card sm:!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">{t("progress.dayDetails")}</p>
                    <h2 className="mt-1 text-base font-semibold text-gray-900">
                      {format(selectedCalendarDate, "EEEE, d. M.", { locale: dateFnsLocale })}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {t("progress.selectedDay")}: {format(selectedCalendarDate, "PPP", { locale: dateFnsLocale })}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                    {hasSelectedDayDetails ? selectedWorkoutStatus : t("progress.noDayDetails")}
                  </span>
                </div>

                {hasSelectedDayDetails ? (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <ProgressChip label={`📅 ${t("progress.selectedDay")}`} value={format(selectedCalendarDate, "d. M. yyyy", { locale: dateFnsLocale })} />
                    <ProgressChip label={`🥗 ${t("progress.foodConsumed")}`} value={`${selectedCaloriesConsumed} ${t("common.kcal")}`} />
                    <ProgressChip label={`📋 ${t("progress.plannedNutrition")}`} value={selectedPlannedCalories ? `~${selectedPlannedCalories} ${t("common.kcal")}` : "0 kcal"} />
                    <ProgressChip label={`➕ ${t("progress.extraConsumed")}`} value={selectedExtraConsumed ? `~${selectedExtraConsumed} ${t("common.kcal")}` : "0 kcal"} />
                    <ProgressChip
                      label={`📒 ${t("progress.foodLogItems")}`}
                      value={selectedFoodLog.length ? `${selectedFoodLog.length} · ~${selectedFoodLogCalories} ${t("common.kcal")}` : "0"}
                    />
                    <ProgressChip
                      label={`🔥 ${t("progress.activityBurn")}`}
                      value={selectedExtraActivities.length ? `~${selectedActivityBurn} ${t("common.kcal")}` : "—"}
                      accent="gold"
                    />
                    <ProgressChip label={`⚖️ ${t("progress.afterActivity")}`} value={`${selectedNetCalories} ${t("common.kcal")}`} />
                    <ProgressChip label={`🏋️ ${t("progress.trainingStatus")}`} value={selectedWorkoutStatus} />
                    <ProgressChip label={t("progress.extraActivitiesToday")} value={selectedExtraActivities.length} />
                    <ProgressChip
                      label={`⚖️ ${t("progress.weightForDay")}`}
                      value={selectedWeight ? `${selectedWeight} ${t("common.kg")}` : "—"}
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">{t("progress.noDayDetails")}</p>
                )}
              </section>
            </div>
          ) : null}

          {activeProgressView === "weight" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <section className="app-card sm:!p-4">
                <div className="mb-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-gray-900">{t("progress.logWeight")}</h2>
                    <p className="text-sm text-gray-500">{t("progress.weightSectionHint")}</p>
                  </div>
                  <div className="rounded-2xl bg-primary-50 px-2.5 py-2 text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-primary-600">{t("progress.currentWeight")}</p>
                    <p className="text-base font-semibold text-primary-900 tabular-nums">
                      {latestWeight ? `${latestWeight} ${t("common.kg")}` : "—"}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-primary-100/60 bg-primary-50/40 p-3">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder={t("progress.weightPlaceholder")}
                      className="input-field w-full min-w-0"
                    />
                    <button
                      type="button"
                      onClick={logWeight}
                      disabled={!weight}
                      className="w-full rounded-xl bg-linear-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto sm:min-w-24"
                    >
                      {t("progress.log")}
                    </button>
                  </div>
                </div>
              </section>

              <section className="app-card sm:!p-4">
                <h3 className="mb-2.5 text-sm font-semibold text-gray-900">{t("progress.weightTrend")}</h3>
                {weightData.length > 1 ? (
                  <div className="h-[220px] w-full min-w-0 overflow-hidden sm:h-[210px] lg:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightData} margin={{ top: 6, right: 8, left: 0, bottom: 6 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={0} minTickGap={14} tickMargin={8} />
                        <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 11 }} width={32} />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke="#9333ea" strokeWidth={2} dot={{ r: 3, fill: "#9333ea" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    className="border-0 bg-transparent py-5"
                    icon={<HiScale className="w-8 h-8" />}
                    title={t("progress.weightTrendEmptyTitle")}
                    description={t("progress.weightTrendEmptyHint")}
                  />
                )}
              </section>
            </div>
          ) : null}

          {activeProgressView === "activity" ? (
            <div className="space-y-4">
              <section className="app-card sm:!p-4">
                <div className="mb-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-gray-900">{t("progress.activitySectionTitle")}</h2>
                    <p className="text-sm text-gray-500">{t("progress.activitySectionHint")}</p>
                  </div>
                  <div className="hidden rounded-2xl bg-gray-50 px-2.5 py-2 text-right sm:block">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{t("progress.extraActivitiesCount")}</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{totalExtraActivities}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <ProgressChip label={t("progress.workoutsDone")} value={totalWorkouts} />
                  <ProgressChip label={t("progress.skipped")} value={totalSkipped} />
                  <ProgressChip label={t("progress.estimatedCalories")} value={totalExtraCalories > 0 ? `~${totalExtraCalories} ${t("common.kcal")}` : "—"} accent="gold" />
                </div>
              </section>

              <section className="app-card sm:!p-4">
                <div className="app-card !p-3">
                  <h3 className="mb-2.5 text-sm font-semibold text-gray-900">{t("progress.weekWorkouts")}</h3>
                  <div className="h-[200px] w-full min-w-0 overflow-hidden sm:h-[190px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workoutData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} interval={0} minTickGap={10} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={26} />
                        <Tooltip />
                        <Bar dataKey="completed" fill="#9333ea" name={t("common.completed")} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="skipped" fill="#fbbf24" name={t("common.skipped")} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-primary-100/60 bg-primary-50/30 p-3">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{t("progress.extraActivitiesTitle")}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-primary-700">
                      {totalExtraActivities}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <ProgressChip label={t("progress.extraActivitiesCount")} value={totalExtraActivities} />
                    <ProgressChip label={t("progress.extraActivitiesHint")} value={`${totalExtraDuration} ${t("common.min")}`} />
                    {totalExtraCalories > 0 ? (
                      <ProgressChip label={t("progress.estimatedCalories")} value={`~${totalExtraCalories} ${t("common.kcal")}`} accent="gold" />
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function WorkoutCalendar({ dailyData, t, dateFnsLocale, selectedCalendarDay, setSelectedCalendarDay }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const dataMap = useMemo(() => {
    const map = {};
    dailyData.forEach((d) => { map[d.id] = d; });
    return map;
  }, [dailyData]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const weekDayLabels = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, i) =>
      format(new Date(base.getTime() + i * 86400000), "EEEEEE", { locale: dateFnsLocale })
    );
  }, [dateFnsLocale]);

  const prev = () => setCurrentMonth((m) => subMonths(m, 1));
  const next = () => setCurrentMonth((m) => addMonths(m, 1));

  return (
    <div className="w-full rounded-3xl border border-primary-100/60 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button onClick={prev} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100">
          <HiChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-gray-900 capitalize sm:text-base">
          {format(currentMonth, "LLLL yyyy", { locale: dateFnsLocale })}
        </h2>
        <button onClick={next} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100">
          <HiChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {weekDayLabels.map((wd) => (
          <div key={wd} className="py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-gray-400 sm:text-[10px]">
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startDay }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const entry = dataMap[key];
          const completed = entry?.workoutCompleted;
          const skipped = entry?.workoutSkipped;
          const hasWeight = entry?.weight;
          const today = isToday(day);
          const selected = key === selectedCalendarDay;

          let bg = "bg-gray-50";
          let textColor = "text-gray-600";
          let ring = "";

          if (completed) {
            bg = "bg-emerald-100";
            textColor = "text-emerald-800";
          } else if (skipped) {
            bg = "bg-amber-100";
            textColor = "text-amber-800";
          }

          if (today) {
            ring = "ring-2 ring-primary-400";
          }

          if (selected) {
            ring = "ring-2 ring-primary-500 ring-offset-2 ring-offset-white shadow-sm";
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCalendarDay(key)}
              aria-label={`${format(day, "PPP", { locale: dateFnsLocale })}${completed ? `, ${t("common.completed")}` : ""}${skipped ? `, ${t("common.skipped")}` : ""}`}
              className={`relative aspect-square min-h-10 rounded-lg ${bg} ${ring} flex flex-col items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:min-h-11`}
            >
              <span className={`text-[10px] font-medium leading-none ${textColor} sm:text-xs`}>
                {format(day, "d")}
              </span>
              <div className="mt-0.5 flex gap-0.5">
                {completed && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                {skipped && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                {hasWeight && <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[9px] text-gray-500 sm:text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t("common.completed")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {t("common.skipped")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
          {t("progress.weightLog")}
        </div>
      </div>
    </div>
  );
}

function ProgressChip({ label, value, accent = "primary" }) {
  const styles = {
    primary: "bg-white border-primary-100/70 text-gray-900",
    gold: "bg-white border-gold-200/60 text-gray-900",
  };

  return (
    <div className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 ${styles[accent]}`}>
      <span className="min-w-0 text-[11px] leading-tight text-gray-500">{label}</span>
      <span className="shrink-0 text-xs font-semibold tabular-nums sm:text-sm">{value}</span>
    </div>
  );
}
