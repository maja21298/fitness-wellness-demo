import { getEnglishExerciseCopy } from "../i18n/exerciseEnglish";
import { buildGenericGymGuide, splitEquipmentTokens } from "./equipment";

const HR_NAME_MAP = {
  "Bench Press": "Bench press",
  "Incline Dumbbell Press": "Kosi potisak s bucicama",
  "Dumbbell Bench Press": "Potisak s bucicama na klupi",
  "Push-ups": "Sklekovi",
  "Incline Push-ups": "Sklekovi na povisenju",
  "Close-grip Push-ups": "Uski sklekovi",
  "Chest Flyes": "Razvlacenje za prsa",
  Dips: "Propadanja",
  "Decline Push-ups": "Sklekovi s nogama na povisenju",
  "Cable Crossover": "Cable crossover",
  "Chest Press Machine": "Chest press sprava",
  "Svend Press": "Svend potisak",
  "Wide Push-ups": "Siroki sklekovi",
  "Archer Push-ups": "Archer sklekovi",
  "Pull-ups": "Zgibovi",
  "Dumbbell Rows": "Veslanje s bucicom",
  "Lat Pulldowns": "Lat pulldown",
  "Seated Cable Rows": "Sjedece veslanje na sajli",
  "Resistance Band Rows": "Veslanje s gumom",
  "Superman Hold": "Superman zadrzaj",
  "Barbell Rows": "Veslanje sa sipkom",
  "Chin-ups": "Zgibovi pothvatom",
  "Reverse Flyes": "Obrnuto razvlacenje",
  "Inverted Rows": "Australski zgibovi",
  "Towel Rows": "Veslanje rucnikom",
  "Straight-arm Pulldown": "Povlacenje ravnim rukama",
  "Overhead Press": "Potisak iznad glave",
  "Lateral Raises": "Odručenje s bucicama",
  "Front Raises": "Prednje podizanje ruku",
  "Face Pulls": "Face pull",
  "Arnold Press": "Arnold potisak",
  "Upright Rows": "Uspravno veslanje",
  Shrugs: "Sleganje ramenima",
  "Pike Push-ups": "Pike sklekovi",
  "Wall Handstand Hold": "Stoj na rukama uz zid",
  "Rear Delt Rows": "Veslanje za straznje rame",
  Squat: "Cucanj",
  Deadlift: "Mrtvo dizanje",
  "Romanian Deadlift": "Rumunjsko mrtvo dizanje",
  Lunges: "Iskorak",
  "Lateral Lunges": "Bocni iskorak",
  "Leg Press": "Leg press",
  "Leg Curls": "Nozna fleksija",
  "Calf Raises": "Podizanje na prste",
  "Bulgarian Split Squat": "Bugarski split cucanj",
  "Wall Sit": "Izdrzaj uz zid",
  "Goblet Squat": "Goblet cucanj",
  "Step-ups": "Step-up",
  "Bodyweight Squats": "Cucnjevi s vlastitom tezinom",
  "Jump Squats": "Skok cucnjevi",
  "Glute Bridge": "Glute bridge",
  "Hip Thrust": "Hip thrust",
  "Single-leg Deadlift": "Jednonozno mrtvo dizanje",
  "Sumo Squat": "Sumo cucanj",
  Crunches: "Trbusnjaci",
  Plank: "Plank",
  "Russian Twists": "Ruski twist",
  "Leg Raises": "Podizanje nogu",
  "Mountain Climbers": "Mountain climbers",
  "Bicycle Crunches": "Bicikl trbusnjaci",
  "Dead Bug": "Dead bug",
  "Side Plank": "Bocni plank",
  "Flutter Kicks": "Flutter kicks",
  "Hollow Hold": "Hollow hold",
  "Heel Taps": "Dodiri pete",
  "Bear Crawl": "Bear crawl",
  "Bicep Curls": "Pregib za biceps",
  "Triceps Dips": "Propadanja za triceps",
  "Hammer Curls": "Hammer pregib",
  "Overhead Triceps Extension": "Triceps ekstenzija iznad glave",
  "Concentration Curls": "Koncentracijski pregib",
  "Triceps Kickbacks": "Triceps kickback",
  "Reverse Curls": "Obrnuti pregib",
  "Diamond Push-ups": "Diamond sklekovi",
  "Skull Crushers": "Skull crushers",
  "Cross-body Hammer Curls": "Hammer pregib preko tijela",
  Running: "Trcanje",
  "Jump Rope": "Preskakanje vijace",
  Burpees: "Burpee",
  Cycling: "Bicikl",
  "High Knees": "Visoka koljena",
  "Jumping Jacks": "Jumping jack",
  "Box Jumps": "Skok na kutiju",
  "Rowing Machine": "Veslacki ergometar",
  "Stair Climbing": "Penjanje stepenicama",
  "Shadow Boxing": "Boksanje u zraku",
  "Skater Hops": "Skater skokovi",
  "Butt Kicks": "Butt kicks",
  "Stretching / Yoga": "Istezanje i joga",
  "Foam Rolling": "Foam rolling",
  "Dynamic Stretching": "Dinamicno istezanje",
  "Mobility Flow": "Mobility flow",
  "Hip Flexor Stretch": "Istezanje pregibaca kuka",
};

const ANIMATION_BY_NAME = {
  Lunges: { key: "lunges-basic", type: "component", loop: true },
  "Lateral Lunges": { key: "lunges-basic", type: "component", loop: true },
  Squat: { key: "squat-basic", type: "component", loop: true },
  "Bodyweight Squats": { key: "squat-basic", type: "component", loop: true },
  "Goblet Squat": { key: "squat-basic", type: "component", loop: true },
  "Jump Squats": { key: "squat-basic", type: "component", loop: true },
  "Sumo Squat": { key: "squat-basic", type: "component", loop: true },
  Plank: { key: "plank-basic", type: "component", loop: true },
  "Side Plank": { key: "plank-basic", type: "component", loop: true },
};

const DIFFICULTY_BY_NAME = {
  "Archer Push-ups": "advanced",
  "Pull-ups": "advanced",
  "Chin-ups": "advanced",
  "Wall Handstand Hold": "advanced",
  "Pike Push-ups": "advanced",
  "Bulgarian Split Squat": "intermediate",
  "Single-leg Deadlift": "intermediate",
  "Jump Squats": "intermediate",
  "Box Jumps": "advanced",
  Burpees: "advanced",
  "Bear Crawl": "intermediate",
  Deadlift: "advanced",
};

const COMMON_MISTAKES = {
  default: [
    "Nemoj zuriti kroz ponavljanja.",
    "Ne gubi stabilnost trupa tijekom pokreta.",
    "Ne skracuj opseg pokreta bez potrebe.",
  ],
  squat: [
    "Nemoj rusiti koljena prema unutra.",
    "Nemoj zaokruzivati ledja pri spustanju.",
    "Nemoj podizati pete od poda.",
  ],
  plank: [
    "Nemoj propadati u donjim ledima.",
    "Nemoj dizati kukove previsoko.",
    "Nemoj zadrzavati dah.",
  ],
  lunges: [
    "Nemoj gurati prednje koljeno predaleko prema unutra.",
    "Nemoj prekratko iskrociti.",
    "Nemoj se odbacivati trupom prema naprijed.",
  ],
};

export function slugifyExerciseId(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cleanBrokenText(value) {
  return String(value || "")
    .replace(/45Â°/g, "45 stupnjeva")
    .replace(/Â·/g, " - ")
    .replace(/â€˘/g, " - ")
    .replace(/ÄŤ/g, "c")
    .replace(/Ä‡/g, "c")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d")
    .replace(/Ĺˇ/g, "s")
    .replace(/ď¸Ź/g, "")
    .replace(/đź[^\s"]+/g, "")
    .trim();
}

export function getHrExerciseName(name) {
  return HR_NAME_MAP[name] || cleanBrokenText(name);
}

export function getAnimationForExercise(name, muscleGroup) {
  if (ANIMATION_BY_NAME[name]) return ANIMATION_BY_NAME[name];
  return {
    key: `${muscleGroup}-fallback`,
    type: "component",
  };
}

function buildGenericHrDescription(name, desc) {
  if (name === "Lunges") {
    return "Iskorak je vjezba za noge i gluteuse koja razvija snagu, stabilnost i bolju kontrolu kukova i koljena.";
  }
  if (name === "Squat") {
    return "Cucanj je osnovna vjezba za snagu nogu, gluteusa i stabilnost trupa.";
  }
  if (name === "Plank") {
    return "Plank jača trup, stabilnost ramena i kontrolu cijelog tijela.";
  }
  return cleanBrokenText(desc) || `${getHrExerciseName(name)} izvodi se kontrolirano i uskladeno s disanjem.`;
}

function buildInstructions(name, desc) {
  if (name === "Lunges") {
    return [
      "Stani uspravno, stopala u sirini kukova, trup stabilan.",
      "Iskoraci dovoljno dugo prema naprijed ili unazad.",
      "Spusti straznje koljeno prema podu dok je prednja noga stabilna.",
      "Guraj kroz prednje stopalo i vrati se u pocetni polozaj.",
    ];
  }
  if (name === "Squat") {
    return [
      "Postavi stopala malo sire od kukova.",
      "Spusti kukove prema dolje i natrag.",
      "Drzi prsa otvorena i tezinu ravnomjerno na stopalima.",
      "Podigni se gore gurajuci kroz cijelo stopalo.",
    ];
  }
  if (name === "Plank") {
    return [
      "Postavi podlaktice ili sake ispod ramena.",
      "Ispruzi tijelo u ravnu liniju od glave do peta.",
      "Stisni trbuh i gluteuse.",
      "Disi mirno i zadrzi stabilan polozaj bez propadanja kukova.",
    ];
  }

  const cleaned = cleanBrokenText(desc);
  if (!cleaned) {
    return [
      "Namjesti se stabilno prije pocetka.",
      "Izvedi pokret kontrolirano.",
      "Vrati se u pocetni polozaj bez zurbe.",
    ];
  }

  return cleaned
    .split(/,| then | and /i)
    .map((part) => cleanBrokenText(part))
    .filter(Boolean)
    .slice(0, 4);
}

function getMistakeProfile(name) {
  if (/Lunge/i.test(name)) return COMMON_MISTAKES.lunges;
  if (/Squat/i.test(name)) return COMMON_MISTAKES.squat;
  if (/Plank/i.test(name)) return COMMON_MISTAKES.plank;
  return COMMON_MISTAKES.default;
}

function normalizeEquipment(equipment) {
  return splitEquipmentTokens(equipment);
}

export function createExercise(muscleGroup, raw) {
  const equipment = normalizeEquipment(raw.equip || raw.equipment || "none");
  const holdSeconds = raw.note && /(\d+)\s*sec/i.test(raw.note)
    ? Number(raw.note.match(/(\d+)\s*sec/i)?.[1] || 0)
    : 0;
  const durationMin = Number(raw.durationMin || raw.duration || 0);
  const restSeconds = Number(raw.restSeconds || raw.rest || 0);
  const home = Boolean(raw.home);
  const gym = raw.gym != null ? Boolean(raw.gym) : !home || equipment.some((item) => item !== "none");
  const enCopy = getEnglishExerciseCopy(raw.name, muscleGroup, equipment);
  const hrName = getHrExerciseName(raw.name);
  const hrDescription = cleanBrokenText(raw.text?.hr?.description || raw.contextDescHr || raw.descHr || buildGenericHrDescription(raw.name, raw.desc));
  const hrInstructions = raw.text?.hr?.instructions || buildInstructions(raw.name, raw.desc);
  const hrMistakes = raw.text?.hr?.commonMistakes || getMistakeProfile(raw.name);
  const equipmentGuide = cleanBrokenText(raw.text?.hr?.equipmentGuide || raw.equipmentGuideHr || buildGenericGymGuide(equipment));
  const animation = raw.animation || getAnimationForExercise(raw.name, muscleGroup);
  const difficulty = raw.difficulty || DIFFICULTY_BY_NAME[raw.name] || "beginner";
  const tags = raw.tags || [muscleGroup, ...(home ? ["home"] : []), ...(gym ? ["gym"] : [])];

  return {
    id: raw.id || slugifyExerciseId(raw.name),
    muscleGroup,
    muscle: muscleGroup,
    home,
    gym,
    equipment,
    equip: equipment.join("+") || "none",
    sets: raw.sets || 1,
    reps: raw.reps || 1,
    durationMin,
    duration: durationMin,
    holdSeconds,
    restSeconds,
    rest: restSeconds,
    difficulty,
    tags,
    animation,
    note: raw.note || "",
    text: {
      en: enCopy,
      hr: {
        name: hrName,
        description: hrDescription,
        instructions: hrInstructions,
        commonMistakes: hrMistakes,
        equipmentGuide,
      },
    },
    name: raw.name,
    desc: cleanBrokenText(raw.desc),
    contextDescHr: hrDescription,
    equipmentGuideHr: equipmentGuide,
    imageLookupName: raw.imageLookupName || raw.name,
    trainingLocation: raw.trainingLocation,
    image: raw.image,
    instructionStepImages: raw.instructionStepImages,
    homeImage: raw.homeImage,
    homeInstructionStepImages: raw.homeInstructionStepImages,
    gymImage: raw.gymImage,
    gymInstructionStepImages: raw.gymInstructionStepImages,
  };
}
