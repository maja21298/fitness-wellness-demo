/**
 * getDashboardSummary
 *
 * Returns demo/fallback values for the Dashboard.
 * All numbers and raw strings are centralised here so they can be replaced
 * with real Firebase / workout-log reads in one place without touching layout.
 *
 * Labels (e.g. "Aktivne kalorije" vs "Active calories") stay in the
 * component because they need the `isHr` language flag.
 */
export function getDashboardSummary() {
  return {
    /** Ring in the hero card. 0–100. */
    dailyProgressPct: 72,

    /** Today's workout info shown in the hero card. */
    todayWorkout: {
      title: "Upper Body + Core",
      titleHr: "Upper Body + Core",
      description: "Strength, stability and definition.",
      descriptionHr: "Snaga, stabilnost i definicija.",
      durationMin: 45,
      /** Estimated calories for the hero chip (demo, swap with real value later). */
      kcal: 320,
    },

    /** Active-calories metric card. */
    calories: {
      value: "1,842",
      unit: "kcal",
      sparkline: [12, 16, 14, 20, 18, 24, 22],
    },

    /** Total-time metric card. */
    totalTime: {
      value: "5h 48m",
      sparkline: [42, 48, 45, 58, 52, 64, 60],
    },

    /** Weekly workout sessions metric card. */
    weeklyWorkouts: {
      current: 4,
      target: 6,
      progressPct: 67,
    },

    /** Bonus streak days metric card. */
    bonusDays: {
      value: 12,
    },

    /** Weekly progress area chart (kcal per day). */
    progressChart: {
      weekly: [
        { calories: 420 },
        { calories: 485 },
        { calories: 512 },
        { calories: 445 },
        { calories: 568 },
        { calories: 390 },
        { calories: 620 },
      ],
      daysHr: ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"],
      daysEn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },

    /** Muscle-group focus donut chart. */
    muscleFocus: {
      centerPct: 46,
      segments: [
        {
          id: "upper",
          labelHr: "Gornji dio tijela",
          labelEn: "Upper body",
          value: 48,
          color: "#7c3aed",
        },
        {
          id: "lower",
          labelHr: "Donji dio tijela",
          labelEn: "Lower body",
          value: 24,
          color: "#8b5cf6",
        },
        {
          id: "core",
          labelHr: "Core",
          labelEn: "Core",
          value: 12,
          color: "#3b82f6",
        },
        {
          id: "cardio",
          labelHr: "Cardio",
          labelEn: "Cardio",
          value: 8,
          color: "#f97316",
        },
      ],
    },

    /** AI wellness analysis card. */
    aiAnalysis: {
      score: 82,
      scoreLabelHr: "Odlično! 💗",
      scoreLabelEn: "Excellent! 💗",
      insights: [
        {
          id: "trend",
          type: "trend",
          textHr: "Trend: tvoja aktivnost i kalorije rastu u odnosu na prošli tjedan.",
          textEn: "Trend: your activity and calories are up compared to last week.",
        },
        {
          id: "strength",
          type: "strength",
          textHr: "Snaga: gornji dio tijela je u fokusu — nastavi s progresivnim opterećenjem.",
          textEn: "Strength: upper body is in focus — keep progressive overload going.",
        },
        {
          id: "recovery",
          type: "recovery",
          textHr: "Oporavak: dobro se oporavljaš, ali pazi na kvalitetu sna između treninga.",
          textEn: "Recovery: you're recovering well, but watch sleep quality between sessions.",
        },
      ],
    },

    /** Recommended direction checklist card. */
    recommendedDirection: {
      descriptionHr:
        "Na temelju tvog napretka, ciljeva i AI analize, ovo su ključni koraci za ovaj tjedan.",
      descriptionEn:
        "Based on your progress, goals, and AI analysis, these are the key steps for this week.",
      items: [
        {
          id: "upper-body",
          labelHr: "Fokus na gornji dio tijela",
          labelEn: "Focus on upper body",
        },
        {
          id: "protein",
          labelHr: "Povećaj unos proteina",
          labelEn: "Increase protein intake",
        },
        {
          id: "hiit",
          labelHr: "Uključi 2x tjedno HIIT trening",
          labelEn: "Include HIIT training 2x per week",
        },
        {
          id: "hydration",
          labelHr: "Hidracija & istezanje svaki dan",
          labelEn: "Hydration & stretching every day",
        },
      ],
    },
  };
}
