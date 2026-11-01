import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

export function getWeekId(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return format(start, "yyyy-'W'II");
}

export function getWeekDates(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

export function calculateWeeklySummary(dailyEntries) {
  const weights = dailyEntries
    .filter((d) => d.weight != null)
    .map((d) => d.weight);

  const totalWorkouts = dailyEntries.filter((d) => d.workoutCompleted).length;
  const totalSkipped = dailyEntries.filter((d) => d.workoutSkipped).length;

  const avgWeight =
    weights.length > 0
      ? Math.round((weights.reduce((s, w) => s + w, 0) / weights.length) * 10) / 10
      : null;

  const totalCalories = dailyEntries.reduce(
    (s, d) => s + (d.caloriesConsumed || 0),
    0
  );
  const avgCalories =
    dailyEntries.length > 0 ? Math.round(totalCalories / dailyEntries.length) : 0;

  return {
    avgWeight,
    totalWorkouts,
    totalSkipped,
    avgCalories,
    daysTracked: dailyEntries.length,
  };
}

export function getStreak(dailyEntries) {
  const sorted = [...dailyEntries]
    .filter((d) => d.workoutCompleted)
    .sort((a, b) => b.id.localeCompare(a.id));

  let streak = 0;
  const today = format(new Date(), "yyyy-MM-dd");

  for (let i = 0; i < sorted.length; i++) {
    const expected = format(
      new Date(new Date(today).getTime() - i * 86400000),
      "yyyy-MM-dd"
    );
    if (sorted.find((d) => d.id === expected)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
