import { createExercise } from "../../utils/text";

/**
 * Kanonski oblik vježbe za prsa (izvor istine u ovom fileu).
 * Polja `name`, `desc`, `equip`, `rest`, `duration` ne koriste se u literalima —
 * createExercise i dalje zahtijeva engleski `name` i `desc` za unutarnju logiku;
 * ta se polja dodaju u `toCreateExerciseInput`.
 */
type ChestExerciseCanonical = {
  id: string;
  muscleGroup: "chest";
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
  "bench-press": "Bench Press",
  "incline-dumbbell-press": "Incline Dumbbell Press",
  "dumbbell-bench-press": "Dumbbell Bench Press",
  "push-ups": "Push-ups",
  "incline-push-ups": "Incline Push-ups",
  "close-grip-push-ups": "Close-grip Push-ups",
  "chest-flyes": "Chest Flyes",
  dips: "Dips",
  "decline-push-ups": "Decline Push-ups",
  "cable-crossover": "Cable Crossover",
  "chest-press-machine": "Chest Press Machine",
  "svend-press": "Svend Press",
  "wide-push-ups": "Wide Push-ups",
  "archer-push-ups": "Archer Push-ups",
};

function toCreateExerciseInput(raw: ChestExerciseCanonical) {
  const name = LEGACY_NAME_BY_ID[raw.id];
  if (!name) {
    throw new Error(`[chest.ts] Nedostaje LEGACY_NAME_BY_ID za id: ${raw.id}`);
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

const rawChest: ChestExerciseCanonical[] = [
  {
    id: "bench-press",
    muscleGroup: "chest",
    home: false,
    gym: true,
    equipment: "barbell+bench",
    sets: 4,
    reps: 10,
    durationMin: 8,
    holdSeconds: 0,
    restSeconds: 90,
    difficulty: "beginner",
    tags: ["chest", "gym", "barbell", "compound", "bench"],
    animation: { key: "chest-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Bench press",
        description:
          "Klasicni potisak s ravne klupe razvija snagu prsa, tricepsa i prednjeg ramena uz kontrolirani opseg.",
        instructions: [
          "Legni na klupu, stopala cvrsto na podu.",
          "Zahvati sipku malo sire od ramena.",
          "Spusti kontrolirano prema sredini prsa.",
          "Potisni sipku gore uz istu putanju.",
        ],
        commonMistakes: [
          "Nemoj odskakivati sipkom s prsa.",
          "Nemoj podizati kukove s klupe.",
          "Nemoj rusiti laktove prema van prejako.",
        ],
        equipmentGuide: "Trebas sipku, klupe i rack; koristi sigurne kuke ili spottera.",
      },
    },
    image: "/exercises/bench-press-step1.webp",
    instructionStepImages: [
      "/exercises/bench-press-step1.webp",
      "/exercises/bench-press-step2.webp",
      "/exercises/bench-press-step3.webp",
    ],
  },
  {
    id: "incline-dumbbell-press",
    muscleGroup: "chest",
    home: false,
    gym: true,
    equipment: "dumbbells+bench",
    sets: 3,
    reps: 12,
    durationMin: 7,
    holdSeconds: 0,
    restSeconds: 75,
    difficulty: "beginner",
    tags: ["chest", "gym", "dumbbells", "incline"],
    animation: { key: "chest-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Kosi potisak s bucicama",
        description:
          "Kosi potisak naglasava gornji dio prsa uz kontrolu bucica i stabilan klin klupa.",
        instructions: [
          "Postavi klupu na 30-45 stupnjeva.",
          "Drzi bucice u visini prsa, laktovi blago pod kutom.",
          "Potisni prema gore dok ruke nisu gotovo ispruzene.",
          "Spusti polako do istog opsega.",
        ],
        commonMistakes: [
          "Nemoj prejako razvajati laktove.",
          "Nemoj gubiti kontakt stopala s podom.",
          "Nemoj trzati bucicama na dnu pokreta.",
        ],
        equipmentGuide: "Koristi podesivu klupu i par bucica odgovarajuce tezine.",
      },
    },
    image: "/exercises/incline-dumbbell-press-step1.webp",
    instructionStepImages: [
      "/exercises/incline-dumbbell-press-step1.webp",
      "/exercises/incline-dumbbell-press-step2.webp",
      "/exercises/incline-dumbbell-press-step3.webp",
    ],
  },
  {
    id: "dumbbell-bench-press",
    muscleGroup: "chest",
    home: true,
    gym: true,
    equipment: "dumbbells+bench",
    sets: 3,
    reps: 10,
    durationMin: 7,
    holdSeconds: 0,
    restSeconds: 75,
    difficulty: "beginner",
    tags: ["chest", "home", "gym", "dumbbells", "bench"],
    animation: { key: "chest-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Potisak s bucicama na klupi",
        description:
          "Potisak s bucicama omogucuje veci opseg i nezavisnu kontrolu koje ruke na klupi ili podu.",
        instructions: [
          "Legni na klupu ili pod s bucicama u visini prsa.",
          "Potisni prema gore dok zglobovi ne budu stabilni.",
          "Drzi laktove pod blagim kutom prema stranama.",
          "Spusti kontrolirano uz istu putanju.",
        ],
        commonMistakes: [
          "Nemoj spustiti bucice prenisoko prema trbuhu.",
          "Nemoj gubiti ravnotezu na klupi.",
          "Nemoj rusiti ramena prema naprijed.",
        ],
        equipmentGuide: "Koristi klupu ili podlogu; bucice ili zamjene za slobodne utege.",
      },
    },
    image: "/exercises/dumbbell-bench-press-step1.webp",
    instructionStepImages: [
      "/exercises/dumbbell-bench-press-step1.webp",
      "/exercises/dumbbell-bench-press-step2.webp",
      "/exercises/dumbbell-bench-press-step3.webp",
    ],
    homeImage: "/exercises/dumbbell-bench-press-home-step1.webp",
    homeInstructionStepImages: [
      "/exercises/dumbbell-bench-press-home-step1.webp",
      "/exercises/dumbbell-bench-press-home-step2.webp",
      "/exercises/dumbbell-bench-press-home-step3.webp",
    ],
  },
  {
    id: "push-ups",
    muscleGroup: "chest",
    home: true,
    gym: true,
    equipment: "none",
    sets: 4,
    reps: 12,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "beginner",
    tags: ["chest", "home", "gym", "bodyweight", "push-up"],
    animation: { key: "push-up-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Sklekovi",
        description:
          "Sklekovi jaćaju prsa, triceps i prednji dio ramena uz tijelo u ravnoj liniji.",
        instructions: [
          "Postavi sake u sirini ramena.",
          "Spusti prsa prema podu uz kontrolu.",
          "Drzi trup stabilnim od glave do pete.",
          "Guraj se gore kroz cijelo dlan.",
        ],
        commonMistakes: [
          "Nemoj propadati kukovima prema gore.",
          "Nemoj skracivati opseg pokreta.",
          "Nemoj drzati glavu prenisko.",
        ],
        equipmentGuide: "Ne treba oprema; dovoljna je prostirka ili neskliska podloga.",
      },
    },
    image: "/exercises/push-ups-step1.webp",
    instructionStepImages: [
      "/exercises/push-ups-step1.webp",
      "/exercises/push-ups-step2.webp",
      "/exercises/push-ups-step3.webp",
    ],
  },
  {
    id: "incline-push-ups",
    muscleGroup: "chest",
    home: true,
    gym: true,
    equipment: "bench+chair",
    sets: 3,
    reps: 15,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["chest", "home", "gym", "bodyweight", "push-up"],
    animation: { key: "push-up-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Sklekovi na povisenju",
        description:
          "Sklekovi s rukama na klupi ili stolici olaksavaju pokret i naglasavaju donji dio prsa.",
        instructions: [
          "Postavi sake na cvrstu klupu u visini prsa.",
          "Drzi tijelo ravno od glave do pete.",
          "Spusti prsa prema rubu klupe.",
          "Potisni se gore bez ljuljanja kukova.",
        ],
        commonMistakes: [
          "Nemoj dizati kukove previsoko.",
          "Nemoj koristiti nestabilnu platformu.",
          "Nemoj gubiti kontakt sake s podlogom.",
        ],
        equipmentGuide: "Treba klupa ili cvrsta stolica koja ne klizi.",
      },
    },
    image: "/exercises/incline-push-ups-step1.webp",
    instructionStepImages: [
      "/exercises/incline-push-ups-step1.webp",
      "/exercises/incline-push-ups-step2.webp",
      "/exercises/incline-push-ups-step3.webp",
    ],
  },
  {
    id: "close-grip-push-ups",
    muscleGroup: "chest",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "intermediate",
    tags: ["chest", "home", "gym", "bodyweight", "push-up", "triceps"],
    animation: { key: "push-up-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Uski sklekovi",
        description:
          "Uski sklekovi vise naglasavaju triceps i unutrasnji dio prsa uz kontrolirano savijanje lakta.",
        instructions: [
          "Postavi sake uzu pod grudima.",
          "Drzi laktove uz tijelo tijekom pokreta.",
          "Spusti se u ravnoj liniji.",
          "Guraj se gore kroz sake i podlaktice.",
        ],
        commonMistakes: [
          "Nemoj sirati laktove prema stranama.",
          "Nemoj gubiti ravnu liniju trupa.",
          "Nemoj zuriti kroz ponavljanja.",
        ],
        equipmentGuide: "Bez opreme; prostirka je dovoljna.",
      },
    },
    image: "/exercises/close-grip-push-ups-step1.webp",
    instructionStepImages: [
      "/exercises/close-grip-push-ups-step1.webp",
      "/exercises/close-grip-push-ups-step2.webp",
      "/exercises/close-grip-push-ups-step3.webp",
    ],
  },
  {
    id: "chest-flyes",
    muscleGroup: "chest",
    home: false,
    gym: true,
    equipment: "dumbbells+bench",
    sets: 3,
    reps: 12,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "beginner",
    tags: ["chest", "gym", "dumbbells", "isolation"],
    animation: { key: "chest-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Razvlacenje za prsa",
        description:
          "Razvlacenje za prsa izolira prsa kroz sirok luk s blago savijenim laktovima.",
        instructions: [
          "Legni na klupu s bucicama iznad prsa.",
          "Otvori ruke u luku dok osjetis istezanje u prsima.",
          "Vrati se u zatvor uz stisak prsa.",
          "Drzi laktove pod blagim kutom cijelo vrijeme.",
        ],
        commonMistakes: [
          "Nemoj prenisko spustiti ruke ispod razine tijela.",
          "Nemoj prejako savijati laktove.",
          "Nemoj trzati tezinom na dnu.",
        ],
        equipmentGuide: "Treba klupa i par bucica; lagana je kontrola bitna.",
      },
    },
    image: "/exercises/chest-fly-step1.webp",
    instructionStepImages: [
      "/exercises/chest-fly-step1.webp",
      "/exercises/chest-fly-step2.webp",
      "/exercises/chest-fly-step3.webp",
    ],
  },
  {
    id: "dips",
    muscleGroup: "chest",
    home: true,
    gym: true,
    equipment: "dip+bars",
    sets: 4,
    reps: 10,
    durationMin: 7,
    holdSeconds: 0,
    restSeconds: 75,
    difficulty: "intermediate",
    tags: ["chest", "home", "gym", "bodyweight", "compound"],
    animation: { key: "chest-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Propadanja",
        description:
          "Propadanja na sipkama jaćaju donji dio prsa, triceps i prednji dio ramena uz kontrolirani opseg.",
        instructions: [
          "Zahvati paralelne sipke ili cvrste stolice.",
          "Blago se nagni naprijed.",
          "Spusti se dok koljena ne budu oko 90 stupnjeva.",
          "Potisni se gore bez trzaja.",
        ],
        commonMistakes: [
          "Nemoj prejako razvajati laktove.",
          "Nemoj skracivati opseg pokreta.",
          "Nemoj drzati ramena prema usima.",
        ],
        equipmentGuide: "Treba dip stolica ili par paralelnih sipki; kod kucne varijante cvrste stolice.",
      },
    },
    image: "/exercises/dips-step1.webp",
    instructionStepImages: [
      "/exercises/dips-step1.webp",
      "/exercises/dips-step2.webp",
      "/exercises/dips-step3.webp",
    ],
    homeImage: "/exercises/dips-home-step1.webp",
    homeInstructionStepImages: [
      "/exercises/dips-home-step1.webp",
      "/exercises/dips-home-step2.webp",
      "/exercises/dips-home-step3.webp",
    ],
  },
  {
    id: "decline-push-ups",
    muscleGroup: "chest",
    home: true,
    gym: true,
    equipment: "bench+chair",
    sets: 3,
    reps: 12,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "intermediate",
    tags: ["chest", "home", "gym", "bodyweight", "push-up"],
    animation: { key: "push-up-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Sklekovi s nogama na povisenju",
        description:
          "Sklekovi s nogama na klupi povecavaju opterecenje gornjeg dijela prsa i ramena.",
        instructions: [
          "Postavi stopala na klupu, sake na podu.",
          "Drzi tijelo ravno od glave do pete.",
          "Spusti prsa prema podu uz kontrolu.",
          "Potisni se gore bez ljuljanja kukova.",
        ],
        commonMistakes: [
          "Nemoj dizati kukove prema stropu.",
          "Nemoj gubiti ravnu liniju trupa.",
          "Nemoj koristiti nestabilnu klupu.",
        ],
        equipmentGuide: "Treba cvrsta klupa ili stolica za stopala.",
      },
    },
    image: "/exercises/decline-push-ups-step1.webp",
    instructionStepImages: [
      "/exercises/decline-push-ups-step1.webp",
      "/exercises/decline-push-ups-step2.webp",
      "/exercises/decline-push-ups-step3.webp",
    ],
  },
  {
    id: "cable-crossover",
    muscleGroup: "chest",
    home: false,
    gym: true,
    equipment: "cable+machine",
    sets: 3,
    reps: 12,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "beginner",
    tags: ["chest", "gym", "cable", "isolation"],
    animation: { key: "chest-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Cable crossover",
        description:
          "Cable crossover omogucuje konstantan otpor kroz cijeli luk pokreta prema ispred prsa.",
        instructions: [
          "Postavi kolice na odgovarajucu visinu.",
          "Korakni naprijed u blagom koraku.",
          "Povuci ruke prema sredini i prema dolje.",
          "Vrati se polako kontrolirano.",
        ],
        commonMistakes: [
          "Nemoj prejako razvajati laktove.",
          "Nemoj gubiti napetost u trupu.",
          "Nemoj trzati ruckama.",
        ],
        equipmentGuide: "Treba cable stanicu s odgovarajucim ruckama.",
      },
    },
    image: "/exercises/cable-crossover-step1.webp",
    instructionStepImages: [
      "/exercises/cable-crossover-step1.webp",
      "/exercises/cable-crossover-step2.webp",
      "/exercises/cable-crossover-step3.webp",
    ],
  },
  {
    id: "chest-press-machine",
    muscleGroup: "chest",
    home: false,
    gym: true,
    equipment: "machine",
    sets: 3,
    reps: 12,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "beginner",
    tags: ["chest", "gym", "machine", "compound"],
    animation: { key: "chest-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Chest press sprava",
        description:
          "Potisak na spravi pruza stabilnu putanju i jednostavno prilagodavanje opterecenja.",
        instructions: [
          "Sjedi s ledjima uz naslon.",
          "Drzi ruckama u visini prsa.",
          "Potisni naprijed dok ruke ne budu gotovo ispruzene.",
          "Vrati se polako u kontrolu.",
        ],
        commonMistakes: [
          "Nemoj odskakivati tezinom od rucki.",
          "Nemoj rusiti ramena prema naprijed.",
          "Nemoj prekidati opseg pokreta.",
        ],
        equipmentGuide: "Koristi chest press spravu u teretani; prilagodi sjedalo.",
      },
    },
    image: "/exercises/chest-press-machine-step1.webp",
    instructionStepImages: [
      "/exercises/chest-press-machine-step1.webp",
      "/exercises/chest-press-machine-step2.webp",
      "/exercises/chest-press-machine-step3.webp",
    ],
  },
  {
    id: "svend-press",
    muscleGroup: "chest",
    home: true,
    gym: true,
    equipment: "plate+book",
    sets: 3,
    reps: 15,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["chest", "home", "gym", "isolation"],
    animation: { key: "chest-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Svend potisak",
        description:
          "Svend potisak koristi stisak predmeta ispred prsa za aktivaciju unutrasnjeg dijela prsa.",
        instructions: [
          "Drzi dva diska ili tezak predmet uz prsa.",
          "Stisni predmete jedan prema drugom.",
          "Izvedi potisak ravno naprijed.",
          "Vrati se polako uz isti pritisak.",
        ],
        commonMistakes: [
          "Nemoj pustiti laktove da padaju prema dolje.",
          "Nemoj gubiti ravnotezu stoja.",
          "Nemoj trzati predmetima.",
        ],
        equipmentGuide: "Treba par diskova ili tezak predmet; mozes koristiti i knjigu.",
      },
    },
    image: "/exercises/svend-press-step1.webp",
    instructionStepImages: [
      "/exercises/svend-press-step1.webp",
      "/exercises/svend-press-step2.webp",
      "/exercises/svend-press-step3.webp",
    ],
  },
  {
    id: "wide-push-ups",
    muscleGroup: "chest",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 15,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "beginner",
    tags: ["chest", "home", "gym", "bodyweight", "push-up"],
    animation: { key: "push-up-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Siroki sklekovi",
        description:
          "Siroki sklekovi naglasavaju vanjski dio prsa uz veci opseg u horizontalnoj ravnini.",
        instructions: [
          "Postavi sake sire od ramena.",
          "Spusti prsa prema podu uz kontrolu.",
          "Drzi trup stabilnim od glave do pete.",
          "Guraj se gore kroz cijelo dlan.",
        ],
        commonMistakes: [
          "Nemoj propadati kukovima.",
          "Nemoj preuzak korak koji remeti ramena.",
          "Nemoj skracivati dubinu.",
        ],
        equipmentGuide: "Bez opreme; prostirka je dovoljna.",
      },
    },
    image: "/exercises/wide-push-ups-step1.webp",
    instructionStepImages: [
      "/exercises/wide-push-ups-step1.webp",
      "/exercises/wide-push-ups-step2.webp",
      "/exercises/wide-push-ups-step3.webp",
    ],
  },
  {
    id: "archer-push-ups",
    muscleGroup: "chest",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 8,
    durationMin: 7,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "advanced",
    tags: ["chest", "home", "gym", "bodyweight", "unilateral"],
    animation: { key: "chest-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Archer sklekovi",
        description:
          "Archer sklekovi zahtijevaju snagu jedne strane i izdrzljivost uz sirok hvat i pomak tijela.",
        instructions: [
          "Postavi sake u sirokom polozaju.",
          "Pomakni tijelo prema jednoj ruci dok druga ostaje ispruzena.",
          "Drzi trup sto ravniji.",
          "Izmjenjuj strane u setu.",
        ],
        commonMistakes: [
          "Nemoj rotirati kukove prejako.",
          "Nemoj gubiti kontrolu u donjem dijelu pokreta.",
          "Nemoj zuriti bez pripreme ramena.",
        ],
        equipmentGuide: "Bez opreme; radite na neskliskoj podlozi.",
      },
    },
    image: "/exercises/archer-push-ups-step1.webp",
    instructionStepImages: [
      "/exercises/archer-push-ups-step1.webp",
      "/exercises/archer-push-ups-step2.webp",
      "/exercises/archer-push-ups-step3.webp",
    ],
  },
];

export const chestExercises = rawChest.map((exercise) => createExercise("chest", toCreateExerciseInput(exercise)));
