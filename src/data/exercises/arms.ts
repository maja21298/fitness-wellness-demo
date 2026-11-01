import { createExercise } from "../../utils/text";

/**
 * Kanonski oblik vježbe za ruke (izvor istine u ovom fileu).
 * Polja `name`, `desc`, `equip`, `rest`, `duration` ne koriste se u literalima —
 * createExercise i dalje zahtijeva engleski `name` i `desc` za unutarnju logiku;
 * ta se polja dodaju u `toCreateExerciseInput`.
 */
type ArmExerciseCanonical = {
  id: string;
  muscleGroup: "arms";
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
  "bicep-curls": "Bicep Curls",
  "triceps-dips": "Triceps Dips",
  "hammer-curls": "Hammer Curls",
  "overhead-triceps-extension": "Overhead Triceps Extension",
  "concentration-curls": "Concentration Curls",
  "triceps-kickbacks": "Triceps Kickbacks",
  "reverse-curls": "Reverse Curls",
  "diamond-push-ups": "Diamond Push-ups",
  "skull-crushers": "Skull Crushers",
  "cross-body-hammer-curls": "Cross-body Hammer Curls",
};

function toCreateExerciseInput(raw: ArmExerciseCanonical) {
  const name = LEGACY_NAME_BY_ID[raw.id];
  if (!name) {
    throw new Error(`[arms.ts] Nedostaje LEGACY_NAME_BY_ID za id: ${raw.id}`);
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

const rawArms: ArmExerciseCanonical[] = [
  {
    id: "bicep-curls",
    muscleGroup: "arms",
    home: true,
    gym: true,
    equipment: "dumbbells",
    sets: 4,
    reps: 12,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "beginner",
    tags: ["arms", "home", "gym", "biceps", "dumbbells"],
    animation: { key: "curl-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Pregib za biceps",
        description:
          "Klasicni pregib za biceps izolira biceps uz laktove uz tijelo i kontrolirani opseg.",
        instructions: [
          "Stani uspravno, bucice uz bokove dlanovi prema naprijed.",
          "Savini laktove i podigni utege prema ramenima.",
          "Zadrzi kratki vrhunac uz stisak bicepsa.",
          "Spusti polako do potpunog istezanja.",
        ],
        commonMistakes: [
          "Nemoj ljuljati trupom naprijed.",
          "Nemoj odvajati laktove od trupa.",
          "Nemoj trzati tezinom gore.",
        ],
        equipmentGuide: "Koristi bucice ili zamjene; lagana do umjerena tezina.",
      },
    },
    image: "/exercises/bicep-curls-step1.webp",
    instructionStepImages: [
      "/exercises/bicep-curls-step1.webp",
      "/exercises/bicep-curls-step2.webp",
      "/exercises/bicep-curls-step3.webp",
    ],
  },
  {
    id: "triceps-dips",
    muscleGroup: "arms",
    home: true,
    gym: true,
    equipment: "chair+bench",
    sets: 4,
    reps: 10,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "intermediate",
    tags: ["arms", "home", "gym", "triceps", "bodyweight"],
    animation: { key: "triceps-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Propadanja za triceps",
        description:
          "Propadanja s ruba klupe ili stolice jaćaju triceps i donji dio prsa uz savijanje u laktovima.",
        instructions: [
          "Postavi sake iza leda na cvrstu klupu.",
          "Spusti tijelo savijajuci laktove do oko 90 stupnjeva.",
          "Potisni se gore kroz dlanove.",
          "Drzi ramena stabilna bez podizanja prema usima.",
        ],
        commonMistakes: [
          "Nemoj prejako razvajati laktove.",
          "Nemoj spustiti ramena prema naprijed.",
          "Nemoj koristiti nestabilnu stolicu.",
        ],
        equipmentGuide: "Treba cvrsta klupa ili stolica koja ne klizi.",
      },
    },
    image: "/exercises/triceps-dips-step1.webp",
    instructionStepImages: [
      "/exercises/triceps-dips-step1.webp",
      "/exercises/triceps-dips-step2.webp",
      "/exercises/triceps-dips-step3.webp",
    ],
  },
  {
    id: "hammer-curls",
    muscleGroup: "arms",
    home: true,
    gym: true,
    equipment: "dumbbells",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["arms", "home", "gym", "biceps", "forearms"],
    animation: { key: "curl-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Hammer pregib",
        description:
          "Hammer pregib koristi neutralni hvat i naglasava biceps te dio podlaktice.",
        instructions: [
          "Drzi bucice uz tijelo s dlanovima jedan prema drugom.",
          "Savini laktove i podigni utege prema ramenima.",
          "Drzi laktove mirno uz trup.",
          "Spusti polako bez ljuljanja.",
        ],
        commonMistakes: [
          "Nemoj rotirati dlanove prema gore kao u klasicnom pregibu.",
          "Nemoj trzati tezinom.",
          "Nemoj dizati ramena prema usima.",
        ],
        equipmentGuide: "Bucice ili zamjene; lagana kontrola je vazna.",
      },
    },
    image: "/exercises/hammer-curls-step1.webp",
    instructionStepImages: [
      "/exercises/hammer-curls-step1.webp",
      "/exercises/hammer-curls-step2.webp",
      "/exercises/hammer-curls-step3.webp",
    ],
  },
  {
    id: "overhead-triceps-extension",
    muscleGroup: "arms",
    home: true,
    gym: true,
    equipment: "dumbbell+jug",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["arms", "home", "gym", "triceps", "dumbbell"],
    animation: { key: "triceps-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Triceps ekstenzija iznad glave",
        description:
          "Ekstenzija iznad glave izolira dugi dio tricepsa uz kontrolirano savijanje iznad glave.",
        instructions: [
          "Drzi jednu bucicu ili uteg iznad glave objema rukama.",
          "Spusti uteg iza glave drzeci laktove uz glavu.",
          "Ispruzi ruke prema gore uz stisak tricepsa.",
          "Drzi trup stabilnim bez ljuljanja.",
        ],
        commonMistakes: [
          "Nemoj razvajati laktove prema stranama.",
          "Nemoj zaobljavati donja ledja.",
          "Nemoj trzati tezinom iza glave.",
        ],
        equipmentGuide: "Jedna bucica ili tezak kanistar; sjede ili stojeci polozaj.",
      },
    },
    image: "/exercises/overhead-triceps-extension-step1.webp",
    instructionStepImages: [
      "/exercises/overhead-triceps-extension-step1.webp",
      "/exercises/overhead-triceps-extension-step2.webp",
      "/exercises/overhead-triceps-extension-step3.webp",
    ],
    homeImage: "/exercises/overhead-triceps-extension-home-step1.webp",
    homeInstructionStepImages: [
      "/exercises/overhead-triceps-extension-home-step1.webp",
      "/exercises/overhead-triceps-extension-home-step2.webp",
      "/exercises/overhead-triceps-extension-home-step3.webp",
    ],
  },
  {
    id: "concentration-curls",
    muscleGroup: "arms",
    home: true,
    gym: true,
    equipment: "dumbbell",
    sets: 3,
    reps: 10,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["arms", "home", "gym", "biceps", "isolation"],
    animation: { key: "curl-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Koncentracijski pregib",
        description:
          "Koncentracijski pregib izolira biceps uz oslon laktova na unutarnju stranu bedra.",
        instructions: [
          "Sjedi, osloni lakat na unutarnju stranu bedra.",
          "Spusti bucicu prema podu u punom opsegu.",
          "Savini lagano prema ramenu uz kontrolu.",
          "Drugi ruku drzi za stabilnost.",
        ],
        commonMistakes: [
          "Nemoj micati lakat s bedra.",
          "Nemoj trzati tezinom gore.",
          "Nemoj naginjati trup prema strani.",
        ],
        equipmentGuide: "Jedna bucica ili boca; cvrsta stolica.",
      },
    },
    image: "/exercises/concentration-curls-step1.webp",
    instructionStepImages: [
      "/exercises/concentration-curls-step1.webp",
      "/exercises/concentration-curls-step2.webp",
      "/exercises/concentration-curls-step3.webp",
    ],
  },
  {
    id: "triceps-kickbacks",
    muscleGroup: "arms",
    home: true,
    gym: true,
    equipment: "dumbbell",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["arms", "home", "gym", "triceps", "isolation"],
    animation: { key: "triceps-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Triceps kickback",
        description:
          "Kickback izolira triceps uz savijanje trupa naprijed i produzetak podlaktice natrag.",
        instructions: [
          "Savini kukove naprijed, drzi leda ravna.",
          "Drzi lakat uz tijelo pod pravim kutom.",
          "Ispruzi podlakticu natrag uz stisak tricepsa.",
          "Vrati polako u savijeni polozaj.",
        ],
        commonMistakes: [
          "Nemoj micati lakat gore-dolje.",
          "Nemoj ljuljati trupom.",
          "Nemoj koristiti preveliku tezinu.",
        ],
        equipmentGuide: "Jedna bucica; lagana do umjerena tezina.",
      },
    },
    image: "/exercises/triceps-kickbacks-step1.webp",
    instructionStepImages: [
      "/exercises/triceps-kickbacks-step1.webp",
      "/exercises/triceps-kickbacks-step2.webp",
      "/exercises/triceps-kickbacks-step3.webp",
    ],
  },
  {
    id: "reverse-curls",
    muscleGroup: "arms",
    home: false,
    gym: true,
    equipment: "barbell+dumbbells",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "intermediate",
    tags: ["arms", "gym", "biceps", "forearms", "brachialis"],
    animation: { key: "curl-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Obrnuti pregib",
        description:
          "Obrnuti pregib naglasava brachialis i podlakticu uz pothvat ili neutralni hvat.",
        instructions: [
          "Drži šipku ili bučice nathvatom, s dlanovima prema dolje, ispred bedara.",
          "Savini laktove i podigni utege prema prsima.",
          "Drzi laktove uz tijelo.",
          "Spusti polako do istezanja podlaktice.",
        ],
        commonMistakes: [
          "Nemoj ljuljati trupom.",
          "Nemoj trzati sipkom gore.",
          "Nemoj prejako savijati zglobove.",
        ],
        equipmentGuide: "Sipka EZ ili ravna, ili bucice; teretana ili kucni set.",
      },
    },
    image: "/exercises/reverse-curls-step1.webp",
    instructionStepImages: [
      "/exercises/reverse-curls-step1.webp",
      "/exercises/reverse-curls-step2.webp",
      "/exercises/reverse-curls-step3.webp",
    ],
  },
  {
    id: "diamond-push-ups",
    muscleGroup: "arms",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 10,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "intermediate",
    tags: ["arms", "home", "gym", "triceps", "bodyweight", "push-up"],
    animation: { key: "push-up-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Diamond sklekovi",
        description:
          "Uski sklekovi s rukama u obliku dijamanta jakno opterecuju triceps i unutrasnji dio prsa.",
        instructions: [
          "Postavi sake ispod prsa u obliku dijamanta.",
          "Drzi tijelo u ravnoj liniji.",
          "Spusti prsa prema rukama uz kontrolu.",
          "Potisni se gore kroz sake.",
        ],
        commonMistakes: [
          "Nemoj propadati kukovima.",
          "Nemoj sirati laktove prema stranama.",
          "Nemoj gubiti kontrolu u donjem dijelu pokreta.",
        ],
        equipmentGuide: "Bez opreme; neskliska podloga ili prostirka.",
      },
    },
    image: "/exercises/diamond-push-ups-step1.webp",
    instructionStepImages: [
      "/exercises/diamond-push-ups-step1.webp",
      "/exercises/diamond-push-ups-step2.webp",
      "/exercises/diamond-push-ups-step3.webp",
    ],
  },
  {
    id: "skull-crushers",
    muscleGroup: "arms",
    home: true,
    gym: true,
    equipment: "dumbbells+barbell",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "intermediate",
    tags: ["arms", "home", "gym", "triceps", "extension"],
    animation: { key: "triceps-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Skull crushers",
        description:
          "Skull crushers izoliraju triceps uz savijanje u laktovima prema liniji celjusti ili iznad glave.",
        instructions: [
          "Legni na klupu ili pod, ruke iznad prsa.",
          "Savini laktove i spusti utege prema celjusti uz kontrolu.",
          "Ispruzi ruke prema gore uz stisak tricepsa.",
          "Drzi laktove stabilne prema gore.",
        ],
        commonMistakes: [
          "Nemoj pomicati laktove prema nogama.",
          "Nemoj prejako razvajati laktove u stranu.",
          "Nemoj trzati tezinom prema licu.",
        ],
        equipmentGuide: "Sipka EZ ili bucice; klupa ili pod.",
      },
    },
    image: "/exercises/skull-crushers-step1.webp",
    instructionStepImages: [
      "/exercises/skull-crushers-step1.webp",
      "/exercises/skull-crushers-step2.webp",
      "/exercises/skull-crushers-step3.webp",
    ],
    homeImage: "/exercises/skull-crushers-home-step1.webp",
    homeInstructionStepImages: [
      "/exercises/skull-crushers-home-step1.webp",
      "/exercises/skull-crushers-home-step2.webp",
      "/exercises/skull-crushers-home-step3.webp",
    ],
  },
  {
    id: "cross-body-hammer-curls",
    muscleGroup: "arms",
    home: true,
    gym: true,
    equipment: "dumbbells",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["arms", "home", "gym", "biceps", "brachialis"],
    animation: { key: "curl-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Hammer pregib preko tijela",
        description:
          "Hammer pregib preko tijela dodaje blagu rotaciju i aktivira biceps te donji dio ramena.",
        instructions: [
          "Drzi bucice neutralnim hvatom uz bedra.",
          "Povuci jednu bucicu prema suprotnom ramenu.",
          "Vrati polako i izmjenjuj ruke.",
          "Drzi laktove blizu tijela.",
        ],
        commonMistakes: [
          "Nemoj ljuljati trupom u stranu.",
          "Nemoj dizati laktove od tijela.",
          "Nemoj trzati tezinom.",
        ],
        equipmentGuide: "Par bucica; lagana do umjerena tezina.",
      },
    },
    image: "/exercises/cross-body-hammer-curls-step1.webp",
    instructionStepImages: [
      "/exercises/cross-body-hammer-curls-step1.webp",
      "/exercises/cross-body-hammer-curls-step2.webp",
      "/exercises/cross-body-hammer-curls-step3.webp",
    ],
  },
];

export const armExercises = rawArms.map((exercise) => createExercise("arms", toCreateExerciseInput(exercise)));
