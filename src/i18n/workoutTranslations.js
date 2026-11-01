const FOCUS_LABELS = {
  hr: {
    "Chest + Triceps": "Prsa + Tricepsi",
    "Back + Biceps": "Leđa + Bicepsi",
    "Legs": "Noge",
    "Rest Day": "Dan odmora",
    "Shoulders + Core": "Ramena + Trbuh",
    "Cardio": "Kardio",
    "Chest": "Prsa",
    "Back": "Leđa",
    "Shoulders + Arms": "Ramena + Ruke",
    "Legs + Core": "Noge + Trbuh",
    "Full Body": "Cijelo tijelo",
    "Strength": "Snaga",
    "Active Recovery": "Aktivni odmor",
    "Cardio + Core": "Kardio + Trbuh",
    "Upper Body": "Gornji dio tijela",
    "Cardio + Arms": "Kardio + Ruke",
    "Flexibility": "Fleksibilnost",
    "Lower Body": "Donji dio tijela",
    "Full Body + Cardio": "Cijelo tijelo + Kardio",
    "Flexibility + Light Cardio": "Fleksibilnost + Lagani kardio",
    "Chest + Back": "Prsa + Leđa",
  },
  it: {
    "Chest + Triceps": "Petto + Tricipiti",
    "Back + Biceps": "Schiena + Bicipiti",
    "Legs": "Gambe",
    "Rest Day": "Giorno di riposo",
    "Shoulders + Core": "Spalle + Core",
    "Cardio": "Cardio",
    "Chest": "Petto",
    "Back": "Schiena",
    "Shoulders + Arms": "Spalle + Braccia",
    "Legs + Core": "Gambe + Core",
    "Full Body": "Tutto il corpo",
    "Strength": "Forza",
    "Active Recovery": "Recupero attivo",
    "Cardio + Core": "Cardio + Core",
    "Upper Body": "Parte superiore",
    "Cardio + Arms": "Cardio + Braccia",
    "Flexibility": "Flessibilità",
    "Lower Body": "Parte inferiore",
    "Full Body + Cardio": "Tutto il corpo + Cardio",
    "Flexibility + Light Cardio": "Flessibilità + Cardio leggero",
    "Chest + Back": "Petto + Schiena",
  },
  es: {
    "Chest + Triceps": "Pecho + Tríceps",
    "Back + Biceps": "Espalda + Bíceps",
    "Legs": "Piernas",
    "Rest Day": "Día de descanso",
    "Shoulders + Core": "Hombros + Core",
    "Cardio": "Cardio",
    "Chest": "Pecho",
    "Back": "Espalda",
    "Shoulders + Arms": "Hombros + Brazos",
    "Legs + Core": "Piernas + Core",
    "Full Body": "Cuerpo completo",
    "Strength": "Fuerza",
    "Active Recovery": "Recuperación activa",
    "Cardio + Core": "Cardio + Core",
    "Upper Body": "Tren superior",
    "Cardio + Arms": "Cardio + Brazos",
    "Flexibility": "Flexibilidad",
    "Lower Body": "Tren inferior",
    "Full Body + Cardio": "Cuerpo completo + Cardio",
    "Flexibility + Light Cardio": "Flexibilidad + Cardio ligero",
    "Chest + Back": "Pecho + Espalda",
  },
};

const MUSCLE_LABELS = {
  hr: { Chest: "Prsa", Back: "Leđa", Shoulders: "Ramena", Legs: "Noge", Core: "Trbuh", Arms: "Ruke", Cardio: "Kardio", Flexibility: "Fleksibilnost" },
  it: { Chest: "Petto", Back: "Schiena", Shoulders: "Spalle", Legs: "Gambe", Core: "Core", Arms: "Braccia", Cardio: "Cardio", Flexibility: "Flessibilità" },
  es: { Chest: "Pecho", Back: "Espalda", Shoulders: "Hombros", Legs: "Piernas", Core: "Core", Arms: "Brazos", Cardio: "Cardio", Flexibility: "Flexibilidad" },
};

const EXPERIENCE_LABELS = {
  hr: { beginner: "Početnik", intermediate: "Srednji", advanced: "Napredni" },
  it: { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzato" },
  es: { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" },
};

const ALLERGY_LABELS = {
  hr: { Gluten: "Gluten", Dairy: "Mliječni proizvodi", Nuts: "Orašasti plodovi", Eggs: "Jaja", Shellfish: "Školjke", Soy: "Soja", Fish: "Riba" },
  it: { Gluten: "Glutine", Dairy: "Latticini", Nuts: "Frutta secca", Eggs: "Uova", Shellfish: "Crostacei", Soy: "Soia", Fish: "Pesce" },
  es: { Gluten: "Gluten", Dairy: "Lácteos", Nuts: "Frutos secos", Eggs: "Huevos", Shellfish: "Mariscos", Soy: "Soja", Fish: "Pescado" },
};

const DIET_LABELS = {
  hr: { none: "Bez ograničenja", vegetarian: "Vegetarijanac", vegan: "Vegan", pescatarian: "Pescatarijanac" },
  it: { none: "Nessuna restrizione", vegetarian: "Vegetariano", vegan: "Vegano", pescatarian: "Pescatariano" },
  es: { none: "Sin restricción", vegetarian: "Vegetariano", vegan: "Vegano", pescatarian: "Pescatariano" },
};

export function translateFocus(focus, lang) {
  if (!lang || lang === "en") return focus;
  return FOCUS_LABELS[lang]?.[focus] || focus;
}

export function translateMuscle(label, lang) {
  if (!lang || lang === "en") return label;
  return MUSCLE_LABELS[lang]?.[label] || label;
}

export function translateExperience(exp, lang) {
  if (!lang || lang === "en") return exp;
  return EXPERIENCE_LABELS[lang]?.[exp] || exp;
}

export function translateAllergy(allergy, lang) {
  if (!lang || lang === "en") return allergy;
  return ALLERGY_LABELS[lang]?.[allergy] || allergy;
}

export function translateDiet(diet, lang) {
  if (!lang || lang === "en") return diet;
  return DIET_LABELS[lang]?.[diet] || diet;
}
