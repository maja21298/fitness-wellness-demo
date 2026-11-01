import { createExercise } from "../../utils/text";

/**
 * Kanonski oblik vježbe za leđa (izvor istine u ovom fileu).
 * Polja `name`, `desc`, `equip`, `rest`, `duration` ne koriste se u literalima —
 * createExercise i dalje zahtijeva engleski `name` i `desc` za unutarnju logiku;
 * ta se polja dodaju u `toCreateExerciseInput`.
 */
type BackExerciseCanonical = {
  id: string;
  muscleGroup: "back";
  home: boolean;
  gym: boolean;
  equipment: string;
  sets: number;
  reps: number;
  durationMin: number;
  holdSeconds: number;
  restSeconds: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  animation: {
    key: string;
    type: "component";
    loop: boolean;
  };
  text: {
    hr: {
      name: string;
      description: string;
      instructions: string[];
      commonMistakes: string[];
      equipmentGuide: string;
    };
  };
  image?: string;
  instructionStepImages?: string[];
  homeImage?: string;
  homeInstructionStepImages?: string[];
  gymImage?: string;
  gymInstructionStepImages?: string[];
};

/** Engleski ključ vježbe (za createExercise / pickExercises) — mapiran iz `id`. */
const LEGACY_NAME_BY_ID: Record<string, string> = {
  "pull-ups": "Pull-ups",
  "dumbbell-rows": "Dumbbell Rows",
  "lat-pulldowns": "Lat Pulldowns",
  "seated-cable-rows": "Seated Cable Rows",
  "resistance-band-rows": "Resistance Band Rows",
  "superman-hold": "Superman Hold",
  "barbell-rows": "Barbell Rows",
  "chin-ups": "Chin-ups",
  "reverse-flyes": "Reverse Flyes",
  "inverted-rows": "Inverted Rows",
  "towel-rows": "Towel Rows",
  "straight-arm-pulldown": "Straight-arm Pulldown",
};

function toCreateExerciseInput(raw: BackExerciseCanonical) {
  const name = LEGACY_NAME_BY_ID[raw.id];
  if (!name) {
    throw new Error(`[back.ts] Nedostaje LEGACY_NAME_BY_ID za id: ${raw.id}`);
  }
  return {
    ...raw,
    name,
    desc: raw.text.hr.description,
    durationMin: raw.durationMin,
    restSeconds: raw.restSeconds,
    equipment: raw.equipment,
    note: raw.holdSeconds > 0 ? `${raw.holdSeconds} sec hold` : "",
  };
}

const rawBack: BackExerciseCanonical[] = [
  {
    id: "pull-ups",
    muscleGroup: "back",
    home: true,
    gym: true,
    equipment: "pull-up bar",
    sets: 4,
    reps: 5,
    durationMin: 8,
    holdSeconds: 0,
    restSeconds: 90,
    difficulty: "advanced",
    tags: ["back", "home", "gym", "bodyweight", "pull-up", "lats"],
    animation: { key: "pull-up-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Zgibovi",
        description:
          "Zgibovi nathvatom razvijaju sirinu leda i snagu lata uz kontrolirano dizanje tijela prema sipci.",
        instructions: [
          "Zahvati sipku s rukama malo sire od ramena.",
          "Visi s potpuno ispruzenim rukama.",
          "Povuci se dok brada ne prede sipku.",
          "Spusti se polako u punom nadzoru.",
        ],
        commonMistakes: [
          "Nemoj trzati se kukovima prema gore.",
          "Nemoj prekidati opseg pri dnu.",
          "Nemoj gubiti aktivaciju lopatica.",
        ],
        equipmentGuide: "Treba sigurna zgibna sipka ili ram; koristi step ako treba.",
      },
    },
    image: "/exercises/pull-ups-step1.webp",
    instructionStepImages: [
      "/exercises/pull-ups-step1.webp",
      "/exercises/pull-ups-step2.webp",
      "/exercises/pull-ups-step3.webp",
    ],
  },
  {
    id: "dumbbell-rows",
    muscleGroup: "back",
    home: true,
    gym: true,
    equipment: "dumbbell",
    sets: 3,
    reps: 10,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 75,
    difficulty: "beginner",
    tags: ["back", "home", "gym", "dumbbells", "rows"],
    animation: { key: "row-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Veslanje s bucicom",
        description:
          "Jednorucno veslanje naglasava lat i srednji trap uz stabilan trup u blagom nagibu.",
        instructions: [
          "Postavi jedno koljeno i ruku na klupu.",
          "Drzi bucicu u ruci, leda ravna.",
          "Povuci bucicu prema kuku uz blizu lopaticu.",
          "Spusti polako bez ljuljanja trupa.",
        ],
        commonMistakes: [
          "Nemoj rotirati kukove prema strani.",
          "Nemoj trzati tezinom gore.",
          "Nemoj zaobljavati donja ledja.",
        ],
        equipmentGuide: "Treba bucica ili zamjena tezinom; klupa ili stolica za oslonac.",
      },
    },
    image: "/exercises/dumbbell-rows-step1.webp",
    instructionStepImages: [
      "/exercises/dumbbell-rows-step1.webp",
      "/exercises/dumbbell-rows-step2.webp",
      "/exercises/dumbbell-rows-step3.webp",
    ],
  },
  {
    id: "lat-pulldowns",
    muscleGroup: "back",
    home: false,
    gym: true,
    equipment: "cable+machine",
    sets: 3,
    reps: 12,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "beginner",
    tags: ["back", "gym", "cable", "lats"],
    animation: { key: "back-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Lat pulldown",
        description:
          "Lat pulldown cilja gornji dio leda uz kontroliranu putanju sipke prema prsima.",
        instructions: [
          "Sjedi uz klin i zahvati sipku sirokim hvatom.",
          "Povuci sipku prema gornjem dijelu prsa.",
          "Drzi trup stabilnim bez ljuljanja.",
          "Vrati sipku polako u puni opseg.",
        ],
        commonMistakes: [
          "Nemoj trzati sipkom gore.",
          "Nemoj prejako naginjati trupom unazad.",
          "Nemoj pustiti ramena da se podizu prema usima.",
        ],
        equipmentGuide: "Koristi lat pulldown spravu u teretani; prilagodi tezinu i sjedalo.",
      },
    },
    image: "/exercises/lat-pulldowns-step1.webp",
    instructionStepImages: [
      "/exercises/lat-pulldowns-step1.webp",
      "/exercises/lat-pulldowns-step2.webp",
      "/exercises/lat-pulldowns-step3.webp",
    ],
  },
  {
    id: "seated-cable-rows",
    muscleGroup: "back",
    home: false,
    gym: true,
    equipment: "cable+machine",
    sets: 3,
    reps: 12,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "beginner",
    tags: ["back", "gym", "cable", "rows", "compound"],
    animation: { key: "row-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Sjedece veslanje na sajli",
        description:
          "Sjedece veslanje razvija srednji dio leda i lopatice uz horizontalno povlacenje.",
        instructions: [
          "Sjedi uspravno, stopala na platformi.",
          "Drzi rucku ili sipku uz trup.",
          "Povuci prema stomaku uz stisak lopatica.",
          "Vrati se polako bez gubitka postave.",
        ],
        commonMistakes: [
          "Nemoj ljuljati se trupom naprijed-nazad.",
          "Nemoj dizati ramena prema usima.",
          "Nemoj prekidati opseg u prednjem polozaju.",
        ],
        equipmentGuide: "Treba veslacka stanica ili sjedece veslanje na sajli.",
      },
    },
    image: "/exercises/seated-cable-rows-step1.webp",
    instructionStepImages: [
      "/exercises/seated-cable-rows-step1.webp",
      "/exercises/seated-cable-rows-step2.webp",
      "/exercises/seated-cable-rows-step3.webp",
    ],
  },
  {
    id: "resistance-band-rows",
    muscleGroup: "back",
    home: true,
    gym: true,
    equipment: "resistance+band",
    sets: 3,
    reps: 15,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["back", "home", "gym", "band", "rows"],
    animation: { key: "row-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Veslanje s gumom",
        description:
          "Veslanje s otporom gume jaća lopatice i donje trapeze uz sigurno sidriste sprijeda.",
        instructions: [
          "Ukotvaj gumu na sigurnu tocku ispred sebe.",
          "Drzi laktove blizu tijela.",
          "Povuci ruke prema bokovima uz stisak lopatica.",
          "Vrati se polako u istezanje gume.",
        ],
        commonMistakes: [
          "Nemoj pustiti laktove da idu prema van.",
          "Nemoj trzati gumenim zamahom.",
          "Nemoj gubiti neutralan donji dio ledja.",
        ],
        equipmentGuide: "Treba otporna guma i cvrsto sidriste (vrata, stup, klin).",
      },
    },
    image: "/exercises/band-rows-step1.webp",
    instructionStepImages: [
      "/exercises/band-rows-step1.webp",
      "/exercises/band-rows-step2.webp",
      "/exercises/band-rows-step3.webp",
    ],
    homeImage: "/exercises/band-rows-home-step1.webp",
    homeInstructionStepImages: [
      "/exercises/band-rows-home-step1.webp",
      "/exercises/band-rows-home-step2.webp",
      "/exercises/band-rows-home-step3.webp",
    ],
  },
  {
    id: "superman-hold",
    muscleGroup: "back",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 1,
    durationMin: 3,
    holdSeconds: 20,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["back", "home", "gym", "isometric", "lower-back"],
    animation: { key: "back-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Superman zadrzaj",
        description:
          "Superman zadrzaj jaća donja ledja i gluteuse uz istovremeno podizanje ruku i nogu od poda.",
        instructions: [
          "Legni licem prema dolje, ruke ispred sebe.",
          "Podigni grudi, ruke i noge od poda.",
          "Drzi pogled prema podu da vrat ostane neutralan.",
          "Zadrzi polozaj zadanih sekundi uz mirno disanje.",
        ],
        commonMistakes: [
          "Nemoj pretjerivati savijanje u donjim ledjima.",
          "Nemoj zadrzavati dah.",
          "Nemoj dizati samo vrat bez ostalog tijela.",
        ],
        equipmentGuide: "Ne treba oprema; prostirka je dovoljna.",
      },
    },
    image: "/exercises/superman-hold-step1.webp",
    instructionStepImages: [
      "/exercises/superman-hold-step1.webp",
      "/exercises/superman-hold-step2.webp",
      "/exercises/superman-hold-step3.webp",
    ],
  },
  {
    id: "barbell-rows",
    muscleGroup: "back",
    home: false,
    gym: true,
    equipment: "barbell",
    sets: 4,
    reps: 10,
    durationMin: 7,
    holdSeconds: 0,
    restSeconds: 75,
    difficulty: "intermediate",
    tags: ["back", "gym", "barbell", "compound", "rows"],
    animation: { key: "back-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Veslanje sa sipkom",
        description:
          "Veslanje u savijenom kuku razvija debljinu leda i snagu hvata uz kontrolirano povlacenje sipke.",
        instructions: [
          "Postavi stopala u sirini kukova, kuk natrag.",
          "Drzi sipku ispod koljena u neutralnom donjem dijelu ledja.",
          "Povuci sipku prema donjem dijelu prsa.",
          "Spusti kontrolirano bez ljuljanja.",
        ],
        commonMistakes: [
          "Nemoj zaobljavati donja ledja.",
          "Nemoj trzati sipkom gore.",
          "Nemoj dizati kukove previsoko prema gore.",
        ],
        equipmentGuide: "Treba olimpijska sipka i kolutovi; radite u slobodnoj zoni.",
      },
    },
    image: "/exercises/barbell-rows-step1.webp",
    instructionStepImages: [
      "/exercises/barbell-rows-step1.webp",
      "/exercises/barbell-rows-step2.webp",
      "/exercises/barbell-rows-step3.webp",
    ],
  },
  {
    id: "chin-ups",
    muscleGroup: "back",
    home: true,
    gym: true,
    equipment: "pull-up bar",
    sets: 3,
    reps: 6,
    durationMin: 7,
    holdSeconds: 0,
    restSeconds: 90,
    difficulty: "advanced",
    tags: ["back", "home", "gym", "bodyweight", "chin-up", "biceps"],
    animation: { key: "pull-up-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Zgibovi pothvatom",
        description:
          "Zgibovi pothvatom naglasavaju biceps i donji dio lata uz povlacenje prema sipci.",
        instructions: [
          "Zahvati sipku podhvatom u sirini ramena.",
          "Visi s ispruzenim rukama.",
          "Povuci se dok brada ne prede sipku.",
          "Spusti se polako u punom opsegu.",
        ],
        commonMistakes: [
          "Nemoj trzati se kukovima.",
          "Nemoj skracivati opseg u donjem polozaju.",
          "Nemoj gubiti aktivaciju trupa.",
        ],
        equipmentGuide: "Treba zgibna sipka; moguce je koristiti assisted spravu.",
      },
    },
    image: "/exercises/chin-ups-step1.webp",
    instructionStepImages: [
      "/exercises/chin-ups-step1.webp",
      "/exercises/chin-ups-step2.webp",
      "/exercises/chin-ups-step3.webp",
    ],
  },
  {
    id: "reverse-flyes",
    muscleGroup: "back",
    home: true,
    gym: true,
    equipment: "dumbbells",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["back", "home", "gym", "dumbbells", "rear-delts", "posture"],
    animation: { key: "back-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Obrnuto razvlacenje",
        description:
          "Obrnuto razvlacenje cilja straznje rame i gornji dio leda uz kontrolirani luk ruku.",
        instructions: [
          "Savini kukove naprijed, leda ravna.",
          "Podigni ruke u stranu s blago savijenim laktovima.",
          "Stisni lopatice na vrhu pokreta.",
          "Spusti polako u istezanje.",
        ],
        commonMistakes: [
          "Nemoj dizati glavu prema gore.",
          "Nemoj koristiti preveliku tezinu uz trzaj.",
          "Nemoj savijati ruke kao kod pregiba.",
        ],
        equipmentGuide: "Koristi bucice ili zamjene; lagana do umjerena tezina.",
      },
    },
    image: "/exercises/reverse-flyes-step1.webp",
    instructionStepImages: [
      "/exercises/reverse-flyes-step1.webp",
      "/exercises/reverse-flyes-step2.webp",
      "/exercises/reverse-flyes-step3.webp",
    ],
  },
  {
    id: "inverted-rows",
    muscleGroup: "back",
    home: true,
    gym: true,
    equipment: "table+bar",
    sets: 3,
    reps: 10,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "intermediate",
    tags: ["back", "home", "gym", "bodyweight", "rows"],
    animation: { key: "row-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Australski zgibovi",
        description:
          "Australski zgibovi jaćaju gornji dio leda uz horizontalno povlacenje ispod cvrste povrsine.",
        instructions: [
          "Legni ispod stola ili sipke u visini prsa.",
          "Zahvati rub i visi s ispruzenim rukama.",
          "Povuci prsa prema rubu uz ravnu liniju tijela.",
          "Spusti se polako u puni opseg.",
        ],
        commonMistakes: [
          "Nemoj propadati kukovima prema podu.",
          "Nemoj trzati se prema gore.",
          "Nemoj koristiti nestabilan stol.",
        ],
        equipmentGuide: "Treba cvrst stol ili niska sipka; provjeri stabilnost prije treninga.",
      },
    },
    image: "/exercises/inverted-rows-step1.webp",
    instructionStepImages: [
      "/exercises/inverted-rows-step1.webp",
      "/exercises/inverted-rows-step2.webp",
      "/exercises/inverted-rows-step3.webp",
    ],
  },
  {
    id: "towel-rows",
    muscleGroup: "back",
    home: true,
    gym: true,
    equipment: "towel+door",
    sets: 3,
    reps: 12,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "beginner",
    tags: ["back", "home", "gym", "bodyweight", "rows"],
    animation: { key: "back-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Veslanje rucnikom",
        description:
          "Veslanje uz rucnik na vratima aktivira lopatice i donji dio leda uz kontrolirano povlacenje.",
        instructions: [
          "Provjeri da je vrata sigurno zatvorena i zakljucana.",
          "Uhvati rucnik uz trup, nagni se unatrag.",
          "Povuci se prema vratima uz stisak lopatica.",
          "Vrati se polako u istezanje.",
        ],
        commonMistakes: [
          "Nemoj koristiti klizna vrata.",
          "Nemoj pustiti laktove prema van.",
          "Nemoj gubiti kontrolu u donjem dijelu ledja.",
        ],
        equipmentGuide: "Treba cvrst rucnik i sigurna vrata s kukom koja ne klizi.",
      },
    },
    image: "/exercises/towel-rows-step1.webp",
    instructionStepImages: [
      "/exercises/towel-rows-step1.webp",
      "/exercises/towel-rows-step2.webp",
      "/exercises/towel-rows-step3.webp",
    ],
  },
  {
    id: "straight-arm-pulldown",
    muscleGroup: "back",
    home: true,
    gym: true,
    equipment: "cable+band",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "intermediate",
    tags: ["back", "home", "gym", "cable", "band", "lats"],
    animation: { key: "back-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Povlacenje ravnim rukama",
        description:
          "Povlacenje s ispruzenim rukama izolira latove kroz vertikalnu putanju prema kukovima.",
        instructions: [
          "Stani uz stanicu ili ukotvi gumu iznad glave.",
          "Drzi ruke gotovo ispruzene uz blago savijene laktove.",
          "Povuci rucku prema bedrima uz aktivne latove.",
          "Vrati se polako u gornji polozaj.",
        ],
        commonMistakes: [
          "Nemoj prejako savijati laktove.",
          "Nemoj trzati ruckom.",
          "Nemoj gubiti stabilnost trupa.",
        ],
        equipmentGuide: "Koristi cable stanicu ili otpornu gumu s visokim sidristem.",
      },
    },
    image: "/exercises/straight-arm-pulldown-step1.webp",
    instructionStepImages: [
      "/exercises/straight-arm-pulldown-step1.webp",
      "/exercises/straight-arm-pulldown-step2.webp",
      "/exercises/straight-arm-pulldown-step3.webp",
    ],
    homeImage: "/exercises/straight-arm-pulldown-home-step1.webp",
    homeInstructionStepImages: [
      "/exercises/straight-arm-pulldown-home-step1.webp",
      "/exercises/straight-arm-pulldown-home-step2.webp",
      "/exercises/straight-arm-pulldown-home-step3.webp",
    ],
  },
];

export const backExercises = rawBack.map((exercise) => createExercise("back", toCreateExerciseInput(exercise)));
