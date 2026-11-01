import { createExercise } from "../../utils/text";

/**
 * Kanonski oblik vježbe za ramena (izvor istine u ovom fileu).
 * Polja `name`, `desc`, `equip`, `rest`, `duration` ne koriste se u literalima —
 * createExercise i dalje zahtijeva engleski `name` i `desc` za unutarnju logiku;
 * ta se polja dodaju u `toCreateExerciseInput`.
 */
type ShoulderExerciseCanonical = {
  id: string;
  muscleGroup: "shoulders";
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
  "overhead-press": "Overhead Press",
  "lateral-raises": "Lateral Raises",
  "front-raises": "Front Raises",
  "face-pulls": "Face Pulls",
  "arnold-press": "Arnold Press",
  "upright-rows": "Upright Rows",
  shrugs: "Shrugs",
  "pike-push-ups": "Pike Push-ups",
  "wall-handstand-hold": "Wall Handstand Hold",
  "rear-delt-rows": "Rear Delt Rows",
};

function toCreateExerciseInput(raw: ShoulderExerciseCanonical) {
  const name = LEGACY_NAME_BY_ID[raw.id];
  if (!name) {
    throw new Error(`[shoulders.ts] Nedostaje LEGACY_NAME_BY_ID za id: ${raw.id}`);
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

const rawShoulders: ShoulderExerciseCanonical[] = [
  {
    id: "overhead-press",
    muscleGroup: "shoulders",
    home: false,
    gym: true,
    equipment: "barbell+dumbbells",
    sets: 4,
    reps: 10,
    durationMin: 8,
    holdSeconds: 0,
    restSeconds: 75,
    difficulty: "intermediate",
    tags: ["shoulders", "gym", "barbell", "compound", "overhead"],
    animation: { key: "press-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Potisak iznad glave",
        description:
          "Potisak iznad glave razvija prednje rame, triceps i gornji dio prsa uz vertikalnu putanju.",
        instructions: [
          "Drzi sipku ili bucice u visini ramena.",
          "Stisni trup i gluteuse prije potiska.",
          "Potisni ravno iznad glave bez ljuljanja.",
          "Spusti kontrolirano do iste visine.",
        ],
        commonMistakes: [
          "Nemoj prejako savijati donja ledja.",
          "Nemoj potiskivati ispred linije lica.",
          "Nemoj trzati sipkom s ramena.",
        ],
        equipmentGuide: "Mozes koristiti sipku u racku ili par bucica; treba siguran prostor iznad glave.",
      },
    },
    image: "/exercises/overhead-press-step1.webp",
    instructionStepImages: [
      "/exercises/overhead-press-step1.webp",
      "/exercises/overhead-press-step2.webp",
      "/exercises/overhead-press-step3.webp",
    ],
  },
  {
    id: "lateral-raises",
    muscleGroup: "shoulders",
    home: true,
    gym: true,
    equipment: "dumbbells",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["shoulders", "home", "gym", "dumbbells", "isolation"],
    animation: { key: "raise-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Odručenje s bucicama",
        description:
          "Odručenje u stranu izolira srednji dio ramena uz kontrolirano podizanje ruku do razine ramena.",
        instructions: [
          "Stani uspravno, bucice uz bokove.",
          "Podigni ruke u stranu s blago savijenim laktovima.",
          "Zaustavi na visini ramena ili malo ispod.",
          "Spusti polako bez ljuljanja trupa.",
        ],
        commonMistakes: [
          "Nemoj dizati laktove iznad visine ramena.",
          "Nemoj trzati tezinom gore.",
          "Nemoj naginjati trup prema naprijed.",
        ],
        equipmentGuide: "Koristi bucice ili zamjene; lagana do umjerena tezina.",
      },
    },
    image: "/exercises/lateral-raises-step1.webp",
    instructionStepImages: [
      "/exercises/lateral-raises-step1.webp",
      "/exercises/lateral-raises-step2.webp",
      "/exercises/lateral-raises-step3.webp",
    ],
  },
  {
    id: "front-raises",
    muscleGroup: "shoulders",
    home: true,
    gym: true,
    equipment: "dumbbells",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["shoulders", "home", "gym", "dumbbells", "isolation"],
    animation: { key: "raise-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Prednje podizanje ruku",
        description:
          "Prednje podizanje naglasava prednji dio ramena uz kontrolirano podizanje ruku ispred tijela.",
        instructions: [
          "Drzi bucice ispred bedara.",
          "Podigni jednu ili obje ruke prema visini ramena.",
          "Drzi blagi savijaj u laktovima.",
          "Spusti polako do iste putanje.",
        ],
        commonMistakes: [
          "Nemoj ljuljati se trupom naprijed-nazad.",
          "Nemoj dizati ramena prema usima.",
          "Nemoj koristiti preveliku tezinu uz trzaj.",
        ],
        equipmentGuide: "Bucice ili zamjene; lagana kontrola je vaznija od tezine.",
      },
    },
    image: "/exercises/front-raises-step1.webp",
    instructionStepImages: [
      "/exercises/front-raises-step1.webp",
      "/exercises/front-raises-step2.webp",
      "/exercises/front-raises-step3.webp",
    ],
  },
  {
    id: "face-pulls",
    muscleGroup: "shoulders",
    home: true,
    gym: true,
    equipment: "band+cable",
    sets: 3,
    reps: 15,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["shoulders", "home", "gym", "rear-delts", "posture"],
    animation: { key: "face-pull-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Face pull",
        description:
          "Face pull povlaci ruke prema licu uz visoke laktove i aktivaciju straznjeg ramena i rotatora.",
        instructions: [
          "Postavi sajlu ili gumu u visini lica.",
          "Drzi laktove visoko i sire od ramena.",
          "Povuci rucku prema nosu ili malo iznad.",
          "Vrati se polako uz kontrolu.",
        ],
        commonMistakes: [
          "Nemoj vuci rucke prema bradi nisko.",
          "Nemoj rusiti laktove prema podu.",
          "Nemoj trzati se cijelim tijelom.",
        ],
        equipmentGuide: "Cable stacija ili guma ukotvana na vrata; podesi visinu.",
      },
    },
    image: "/exercises/face-pulls-step1.webp",
    instructionStepImages: [
      "/exercises/face-pulls-step1.webp",
      "/exercises/face-pulls-step2.webp",
      "/exercises/face-pulls-step3.webp",
    ],
    homeImage: "/exercises/face-pulls-home-step1.webp",
    homeInstructionStepImages: [
      "/exercises/face-pulls-home-step1.webp",
      "/exercises/face-pulls-home-step2.webp",
      "/exercises/face-pulls-home-step3.webp",
    ],
  },
  {
    id: "arnold-press",
    muscleGroup: "shoulders",
    home: true,
    gym: true,
    equipment: "dumbbells",
    sets: 3,
    reps: 10,
    durationMin: 7,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "intermediate",
    tags: ["shoulders", "home", "gym", "dumbbells", "compound"],
    animation: { key: "press-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Arnold potisak",
        description:
          "Arnold potisak kombinira rotaciju i potisak iznad glave za cjelokupno rame.",
        instructions: [
          "Sjedi ili stani s bucicama ispred prsa, dlanovi prema tebi.",
          "Rotiraj dlanove prema naprijed tijekom potiska.",
          "Zavrsi potisak iznad glave uz izravne ruke.",
          "Spusti polako uz obrnutu rotaciju.",
        ],
        commonMistakes: [
          "Nemoj prejako razvajati laktove u stranu.",
          "Nemoj zaobljavati donja ledja.",
          "Nemoj trzati tezinom na dnu.",
        ],
        equipmentGuide: "Par bucica ili zamjene; klupa ili stolac za sjedece izvedbe.",
      },
    },
    image: "/exercises/arnold-press-step1.webp",
    instructionStepImages: [
      "/exercises/arnold-press-step1.webp",
      "/exercises/arnold-press-step2.webp",
      "/exercises/arnold-press-step3.webp",
    ],
  },
  {
    id: "upright-rows",
    muscleGroup: "shoulders",
    home: true,
    gym: true,
    equipment: "barbell+dumbbells",
    sets: 3,
    reps: 12,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "intermediate",
    tags: ["shoulders", "home", "gym", "barbell", "dumbbells"],
    animation: { key: "shoulders-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Uspravno veslanje",
        description:
          "Uspravno veslanje podize laktove uz tijelo i naglasava gornji dio trapeza i prednje rame.",
        instructions: [
          "Drzi utege ispred bedara u uskom hvatu.",
          "Vuci laktove visoko uz strane.",
          "Zaustavi kad je tezina na visini prsa.",
          "Spusti polako do iste putanje.",
        ],
        commonMistakes: [
          "Nemoj dizati laktove previsoko ako bol u ramenu.",
          "Nemoj trzati sipkom gore.",
          "Nemoj ljuljati se trupom.",
        ],
        equipmentGuide: "Sipka ili bucice; koristi umjerenu tezinu.",
      },
    },
    image: "/exercises/upright-rows-step1.webp",
    instructionStepImages: [
      "/exercises/upright-rows-step1.webp",
      "/exercises/upright-rows-step2.webp",
      "/exercises/upright-rows-step3.webp",
    ],
  },
  {
    id: "shrugs",
    muscleGroup: "shoulders",
    home: true,
    gym: true,
    equipment: "dumbbells",
    sets: 3,
    reps: 15,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["shoulders", "home", "gym", "dumbbells", "traps"],
    animation: { key: "shoulders-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Sleganje ramenima",
        description:
          "Sleganje ramenima izolira gornji trapez uz vertikalno podizanje ramena prema usima.",
        instructions: [
          "Drzi utege uz bokove.",
          "Podigni ramena ravno gore uz kratki zastoj.",
          "Spusti polako bez trzaja.",
          "Drzi ruke ispruzene, bez savijanja laktova.",
        ],
        commonMistakes: [
          "Nemoj kotrljati ramena prema naprijed.",
          "Nemoj koristiti preveliku tezinu uz trzaj.",
          "Nemoj savijati ruke kao kod pregiba.",
        ],
        equipmentGuide: "Bucice ili torbice s tezinom; kontrolirani opseg.",
      },
    },
    image: "/exercises/shrugs-step1.webp",
    instructionStepImages: [
      "/exercises/shrugs-step1.webp",
      "/exercises/shrugs-step2.webp",
      "/exercises/shrugs-step3.webp",
    ],
  },
  {
    id: "pike-push-ups",
    muscleGroup: "shoulders",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 10,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "advanced",
    tags: ["shoulders", "home", "gym", "bodyweight", "push"],
    animation: { key: "shoulders-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Pike sklekovi",
        description:
          "Pike sklekovi s visokim kukovima naglasavaju rame i gornji dio leda uz kontrolirani potisak.",
        instructions: [
          "Postavi se u obrnuti V, sake ispod ramena.",
          "Spusti glavu prema podu uz ravne noge.",
          "Potisni se gore bez gubitka ravnoteze.",
          "Drzi trup stabilnim.",
        ],
        commonMistakes: [
          "Nemoj prejako savijati koljena.",
          "Nemoj gubiti kontrolu u donjem dijelu pokreta.",
          "Nemoj zuriti bez zagrijavanja ramena.",
        ],
        equipmentGuide: "Bez opreme; prostirka je dovoljna.",
      },
    },
    image: "/exercises/pike-push-ups-step1.webp",
    instructionStepImages: [
      "/exercises/pike-push-ups-step1.webp",
      "/exercises/pike-push-ups-step2.webp",
      "/exercises/pike-push-ups-step3.webp",
    ],
  },
  {
    id: "wall-handstand-hold",
    muscleGroup: "shoulders",
    home: true,
    gym: true,
    equipment: "wall",
    sets: 3,
    reps: 1,
    durationMin: 3,
    holdSeconds: 15,
    restSeconds: 60,
    difficulty: "advanced",
    tags: ["shoulders", "home", "gym", "isometric", "handstand"],
    animation: { key: "shoulders-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Stoj na rukama uz zid",
        description:
          "Izdrzaj u stoju na rukama uz zid razvija snagu ramena i stabilnost tijela uz kontrolu kukova.",
        instructions: [
          "Postavi sake u udaljenosti od zida.",
          "Zbaci noge uz zid u ravnu liniju.",
          "Drzi glavu u neutralnom polozaju.",
          "Zadrzi polozaj uz mirno disanje.",
        ],
        commonMistakes: [
          "Nemoj propadati u donjim ledima.",
          "Nemoj dizati glavu prejako prema naprijed.",
          "Nemoj raditi bez sigurnog prostora oko sebe.",
        ],
        equipmentGuide: "Treba cist zid i zatvorena obuca; radite uz podlogu.",
      },
    },
    image: "/exercises/wall-handstand-hold-step1.webp",
    instructionStepImages: [
      "/exercises/wall-handstand-hold-step1.webp",
      "/exercises/wall-handstand-hold-step2.webp",
      "/exercises/wall-handstand-hold-step3.webp",
    ],
  },
  {
    id: "rear-delt-rows",
    muscleGroup: "shoulders",
    home: true,
    gym: true,
    equipment: "dumbbells+band",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["shoulders", "home", "gym", "rear-delts", "rows"],
    animation: { key: "shoulders-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Veslanje za straznje rame",
        description:
          "Veslanje s sirokim laktovima cilja straznje rame i gornji dio leda uz kontrolirano povlacenje.",
        instructions: [
          "Savini kukove naprijed, leda ravna.",
          "Drzi laktove sire od trupa.",
          "Povuci utege prema gornjim rebrima.",
          "Stisni lopatice na vrhu pokreta.",
        ],
        commonMistakes: [
          "Nemoj vuci ruke uz tijelo kao u klasicnom veslanju.",
          "Nemoj zaobljavati donja ledja.",
          "Nemoj trzati tezinom na dnu.",
        ],
        equipmentGuide: "Bucice ili guma; lagana do umjerena tezina.",
      },
    },
    image: "/exercises/rear-delt-rows-step1.webp",
    instructionStepImages: [
      "/exercises/rear-delt-rows-step1.webp",
      "/exercises/rear-delt-rows-step2.webp",
      "/exercises/rear-delt-rows-step3.webp",
    ],
  },
];

export const shoulderExercises = rawShoulders.map((exercise) => createExercise("shoulders", toCreateExerciseInput(exercise)));
