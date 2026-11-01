import { useState, useEffect } from "react";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { format, addDays } from "date-fns";
import { db } from "../firebase";
import { getStreak } from "../utils/progressCalculator";

function computeDayPct(entry) {
  if (!entry) return 0;
  const workoutScore = entry.workoutCompleted ? 50 : 0;
  const planned = entry.plannedNutritionCalories ?? 0;
  const consumed = entry.caloriesConsumed ?? 0;
  let nutritionScore = 0;
  if (planned > 0 && consumed > 0) {
    const ratio = consumed / planned;
    nutritionScore = ratio >= 0.8 ? 50 : Math.round((ratio / 0.8) * 50);
  }
  return Math.min(100, planned > 0 ? workoutScore + nutritionScore : entry.workoutCompleted ? 100 : 0);
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useDashboardData(uid) {
  const [streak, setStreak] = useState(0);
  const [dailyProgressPct, setDailyProgressPct] = useState(0);
  const [caloriesToday, setCaloriesToday] = useState(0);
  const [weeklyDays, setWeeklyDays] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      key: format(addDays(getMonday(new Date()), i), "yyyy-MM-dd"),
      date: addDays(getMonday(new Date()), i),
      pct: 0,
      completed: false,
      isToday: false,
      isFuture: addDays(getMonday(new Date()), i) > new Date(),
      hasData: false,
    })),
  );
  const [weeklyChartData, setWeeklyChartData] = useState(
    Array.from({ length: 7 }, () => ({ calories: 0 })),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const today = new Date();
        const todayKey = format(today, "yyyy-MM-dd");
        const monday = getMonday(today);
        const sixtyDaysAgo = format(addDays(today, -60), "yyyy-MM-dd");
        const dailyRef = collection(db, "progress", uid, "daily");
        const q = query(dailyRef, where(documentId(), ">=", sixtyDaysAgo));
        const snap = await getDocs(q);
        const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setStreak(getStreak(entries));

        const todayEntry = entries.find((e) => e.id === todayKey);
        setDailyProgressPct(computeDayPct(todayEntry));
        // Prefer meal-plan totals written by Nutrition Save; fall back to legacy foodLog path.
        setCaloriesToday(
          todayEntry?.plannedNutritionCalories != null
            ? todayEntry.plannedNutritionCalories
            : (todayEntry?.caloriesConsumed ?? 0),
        );

        const days = Array.from({ length: 7 }, (_, i) => {
          const date = addDays(monday, i);
          const key = format(date, "yyyy-MM-dd");
          const isFuture = date > today;
          const entry = entries.find((e) => e.id === key);
          return {
            key,
            date,
            pct: isFuture ? 0 : computeDayPct(entry),
            completed: Boolean(entry?.workoutCompleted),
            isToday: key === todayKey,
            isFuture,
            hasData: Boolean(entry),
          };
        });
        setWeeklyDays(days);

        setWeeklyChartData(
          days.map((day) => ({
            calories: day.isFuture ? 0 : entries.find((e) => e.id === day.key)?.caloriesConsumed ?? 0,
          })),
        );
      } catch (err) {
        console.error("useDashboardData:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [uid]);

  return {
    streak,
    dailyProgressPct,
    caloriesToday,
    weeklyDays,
    weeklyChartData,
    loading,
  };
}
