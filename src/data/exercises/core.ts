import { createExercise } from "../../utils/text";

/**
 * Kanonski oblik vježbe za trup (izvor istine u ovom fileu).
 * Polja `name`, `desc`, `equip`, `rest`, `duration` ne koriste se u literalima —
 * createExercise i dalje zahtijeva engleski `name` i `desc` za unutarnju logiku;
 * ta se polja dodaju u `toCreateExerciseInput`.
 */
type CoreExerciseCanonical = {
  id: string;
  muscleGroup: "core";
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
  crunches: "Crunches",
  plank: "Plank",
  "russian-twists": "Russian Twists",
  "leg-raises": "Leg Raises",
  "mountain-climbers": "Mountain Climbers",
  "bicycle-crunches": "Bicycle Crunches",
  "dead-bug": "Dead Bug",
  "side-plank": "Side Plank",
  "flutter-kicks": "Flutter Kicks",
  "hollow-hold": "Hollow Hold",
  "heel-taps": "Heel Taps",
  "bear-crawl": "Bear Crawl",
};

function toCreateExerciseInput(raw: CoreExerciseCanonical) {
  const name = LEGACY_NAME_BY_ID[raw.id];
  if (!name) {
    throw new Error(`[core.ts] Nedostaje LEGACY_NAME_BY_ID za id: ${raw.id}`);
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

const rawCore: CoreExerciseCanonical[] = [
  {
    id: "crunches",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 4,
    reps: 15,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["core", "home", "gym", "bodyweight", "abs"],
    animation: { key: "core-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Trbusnjaci",
        description:
          "Trbusnjaci aktiviraju rectus abdominis uz savijanje trupa prema preponama uz kontrolirani opseg.",
        instructions: [
          "Legni na ledja, koljena savijena, stopala uz pod.",
          "Stisni trbuh i podigni ramena malo s poda.",
          "Kratko zadrzi vrhunac bez trzaja vrata.",
          "Polako se spusti i ponovi ritmicki.",
        ],
        commonMistakes: [
          "Nemoj vući rukama vrat prema prsima.",
          "Nemoj dizati donja ledja s poda.",
          "Nemoj koristiti zamah trupom.",
        ],
        equipmentGuide: "Ne treba oprema; dovoljna je prostirka.",
      },
    },
    image: "/exercises/crunches-step1.webp",
    instructionStepImages: [
      "/exercises/crunches-step1.webp",
      "/exercises/crunches-step2.webp",
      "/exercises/crunches-step3.webp",
    ],
  },
  {
    id: "plank",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 1,
    durationMin: 3,
    holdSeconds: 30,
    restSeconds: 45,
    difficulty: "beginner",
    tags: ["core", "home", "gym", "isometric", "plank"],
    animation: { key: "plank-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Plank",
        description:
          "Plank je osnovna vjezba za snazan trup, bolju stabilnost i kontrolu drzanja.",
        instructions: [
          "Postavi podlaktice ispod ramena.",
          "Ispruzi noge i slozi tijelo u ravnu liniju.",
          "Stisni trbuh i gluteuse.",
          "Zadrzi polozaj uz mirno disanje.",
        ],
        commonMistakes: [
          "Nemoj propadati u donjim ledima.",
          "Nemoj dizati kukove previsoko.",
          "Nemoj zadrzavati dah tijekom izdrzaja.",
        ],
        equipmentGuide: "Ne treba ti oprema, samo stabilna podloga ili prostirka.",
      },
    },
    image: "/exercises/plank-step1.webp",
    instructionStepImages: [
      "/exercises/plank-step1.webp",
      "/exercises/plank-step2.webp",
      "/exercises/plank-step3.webp",
    ],
  },
  {
    id: "russian-twists",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 20,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["core", "home", "gym", "rotation", "obliques"],
    animation: { key: "core-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Ruski twist",
        description:
          "Ruski twist razvija rotaciju trupa i snagu obliqua uz kontrolirano okretanje.",
        instructions: [
          "Sjedi s koljenima savijenima i blago zabacenim trupom.",
          "Drzi ruke ispred ili uteg uz tijelo.",
          "Okreci trup lijevo-desno uz stabilan kuk.",
          "Drzi ritam ujednacen bez trzaja.",
        ],
        commonMistakes: [
          "Nemoj samo micati rukama bez trupa.",
          "Nemoj zaobljavati donja ledja prejako.",
          "Nemoj gubiti kontakt stopala s podom ako je cilj stabilnost.",
        ],
        equipmentGuide: "Mozes raditi bez opreme ili s bucicom / medicinkom.",
      },
    },
    image: "/exercises/russian-twists-step1.webp",
    instructionStepImages: [
      "/exercises/russian-twists-step1.webp",
      "/exercises/russian-twists-step2.webp",
      "/exercises/russian-twists-step3.webp",
    ],
  },
  {
    id: "leg-raises",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["core", "home", "gym", "hip-flexors", "abs"],
    animation: { key: "core-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Podizanje nogu",
        description:
          "Podizanje ravnih nogu jaća donji dio trupa i pregibace kuka uz kontrolirani opseg.",
        instructions: [
          "Legni na ledja, ruke ispod kukova za podrsku.",
          "Podigni ravne noge prema 90 stupnjeva.",
          "Spusti noge polako bez udaranja u pod.",
          "Drzi donja ledja sto mirnija uz pod.",
        ],
        commonMistakes: [
          "Nemoj savijati koljena previsoko.",
          "Nemoj dizati glavu prejako prema naprijed.",
          "Nemoj gubiti kontrolu donjeg dijela ledja.",
        ],
        equipmentGuide: "Bez opreme; prostirka je dovoljna.",
      },
    },
    image: "/exercises/leg-raises-step1.webp",
    instructionStepImages: [
      "/exercises/leg-raises-step1.webp",
      "/exercises/leg-raises-step2.webp",
      "/exercises/leg-raises-step3.webp",
    ],
  },
  {
    id: "mountain-climbers",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 20,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "intermediate",
    tags: ["core", "home", "gym", "cardio-core", "plank"],
    animation: { key: "core-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Mountain climbers",
        description:
          "Dinamicni plank s izmjenicnim koljenima prema prsima za kondiciju i stabilnost trupa.",
        instructions: [
          "Postavi se u plank na rukama ili podlakticama.",
          "Povuci jedno koljeno prema prsima uz stabilan trup.",
          "Brzo izmjenjuj noge u ritmu koji mozes kontrolirati.",
          "Drzi kukove stabilne bez velikog podizanja.",
        ],
        commonMistakes: [
          "Nemoj dizati kukove previsoko prema stropu.",
          "Nemoj gubiti ravnu liniju trupa.",
          "Nemoj ubrzati tempo na racun forme.",
        ],
        equipmentGuide: "Ne treba oprema; neskliska podloga je bitna.",
      },
    },
    image: "/exercises/mountain-climbers-step1.webp",
    instructionStepImages: [
      "/exercises/mountain-climbers-step1.webp",
      "/exercises/mountain-climbers-step2.webp",
      "/exercises/mountain-climbers-step3.webp",
    ],
  },
  {
    id: "bicycle-crunches",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 20,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["core", "home", "gym", "abs", "rotation"],
    animation: { key: "core-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Bicikl trbusnjaci",
        description:
          "Bicikl trbusnjaci kombiniraju savijanje i rotaciju za cijeli prednji trup.",
        instructions: [
          "Legni na ledja, ruke lagano iza glave ili uz usi.",
          "Podigni ramena i donja koljena od poda.",
          "Izmenjuj lakat prema suprotnom koljenu u pedalanju.",
          "Drzi donja ledja uz pod koliko god mozes.",
        ],
        commonMistakes: [
          "Nemoj trzati vrat rukama.",
          "Nemoj prebrzo pedalisati bez kontrole.",
          "Nemoj podizati donja ledja s poda.",
        ],
        equipmentGuide: "Bez opreme; prostirka je dovoljna.",
      },
    },
    image: "/exercises/bicycle-crunches-step1.webp",
    instructionStepImages: [
      "/exercises/bicycle-crunches-step1.webp",
      "/exercises/bicycle-crunches-step2.webp",
      "/exercises/bicycle-crunches-step3.webp",
    ],
  },
  {
    id: "dead-bug",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 12,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["core", "home", "gym", "stability", "anti-extension"],
    animation: { key: "core-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Dead bug",
        description:
          "Dead bug razvija kontrolu trupa uz suprotne pokrete ruke i noge u mirnom tempu.",
        instructions: [
          "Legni na ledja, ruke prema stropu, koljena iznad kukova.",
          "Ispruzi suprotnu ruku i nogu uz stabilan donji dio ledja.",
          "Vrati se u polazni polozaj i izmjenjuj strane.",
          "Disi mirno i bez zurbe.",
        ],
        commonMistakes: [
          "Nemoj odvajati donja ledja od poda.",
          "Nemoj drzati dah tijekom ponavljanja.",
          "Nemoj prevelikom brzinom gubiti oblik.",
        ],
        equipmentGuide: "Ne treba oprema; prostirka je preporucena.",
      },
    },
    image: "/exercises/dead-bug-step1.webp",
    instructionStepImages: [
      "/exercises/dead-bug-step1.webp",
      "/exercises/dead-bug-step2.webp",
      "/exercises/dead-bug-step3.webp",
    ],
  },
  {
    id: "side-plank",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 1,
    durationMin: 3,
    holdSeconds: 20,
    restSeconds: 30,
    difficulty: "intermediate",
    tags: ["core", "home", "gym", "isometric", "obliques", "plank"],
    animation: { key: "plank-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Bocni plank",
        description:
          "Bocni plank jaća oblique i stabilnost bocnog lanca uz izdrzaj u ravnoj liniji.",
        instructions: [
          "Legni na bok i postavi podlakticu ispod ramena.",
          "Podigni kukove dok tijelo pravi ravnu liniju.",
          "Drzi glavu u produzetku kraljeznice.",
          "Zadrzi polozaj, zatim promijeni stranu.",
        ],
        commonMistakes: [
          "Nemoj pustiti kukove da padaju prema podu.",
          "Nemoj rotirati gornji trup prema naprijed.",
          "Nemoj zadrzavati dah.",
        ],
        equipmentGuide: "Bez opreme; prostirka smanjuje tlak na lakat.",
      },
    },
    image: "/exercises/side-plank-step1.webp",
    instructionStepImages: [
      "/exercises/side-plank-step1.webp",
      "/exercises/side-plank-step2.webp",
      "/exercises/side-plank-step3.webp",
    ],
  },
  {
    id: "flutter-kicks",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 20,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["core", "home", "gym", "abs", "endurance"],
    animation: { key: "core-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Flutter kicks",
        description:
          "Mali ritmicki udari nogama u zraku uz aktiviranje donjeg trupa.",
        instructions: [
          "Legni na ledja, donja ledja uz pod.",
          "Podigni noge malo iznad poda.",
          "Izmenjuj kratke pokrete gore-dolje uz kontrolu.",
          "Drzi vrat opusten i trbuh aktivan.",
        ],
        commonMistakes: [
          "Nemoj podizati donja ledja s poda.",
          "Nemoj previsoko dizati noge ako gubis kontrolu.",
          "Nemoj drzati dah.",
        ],
        equipmentGuide: "Bez opreme; podloga treba biti ravna.",
      },
    },
    image: "/exercises/flutter-kicks-step1.webp",
    instructionStepImages: [
      "/exercises/flutter-kicks-step1.webp",
      "/exercises/flutter-kicks-step2.webp",
      "/exercises/flutter-kicks-step3.webp",
    ],
  },
  {
    id: "hollow-hold",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 1,
    durationMin: 3,
    holdSeconds: 20,
    restSeconds: 30,
    difficulty: "intermediate",
    tags: ["core", "home", "gym", "isometric", "anti-extension"],
    animation: { key: "core-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Hollow hold",
        description:
          "Hollow drzanje naglasava prednji trup uz pritisak donjeg dijela ledja prema podu.",
        instructions: [
          "Legni na ledja, ruke uz tijelo ili iznad glave.",
          "Podigni ramena i noge malo od poda.",
          "Drzi donja ledja aktivno uz pod.",
          "Disi mirno i drzi napetost zadanih sekundi.",
        ],
        commonMistakes: [
          "Nemoj odvajati donja ledja od poda.",
          "Nemoj dizati noge previsoko ako gubis oblik.",
          "Nemoj zadrzavati dah.",
        ],
        equipmentGuide: "Bez opreme; prostirka je dovoljna.",
      },
    },
    image: "/exercises/hollow-hold-step1.webp",
    instructionStepImages: [
      "/exercises/hollow-hold-step1.webp",
      "/exercises/hollow-hold-step2.webp",
      "/exercises/hollow-hold-step3.webp",
    ],
  },
  {
    id: "heel-taps",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 20,
    durationMin: 4,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["core", "home", "gym", "obliques"],
    animation: { key: "core-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Dodiri pete",
        description:
          "Lagani crunch uz dodir pete u stranu za aktivaciju obliqua uz kontrolirani opseg.",
        instructions: [
          "Legni na ledja, koljena savijena, stopala uz pod.",
          "Blago podigni ramena od poda.",
          "Dodiruj petu lijevu pa desnu stranu uz rotaciju trupa.",
          "Drzi donji dio ledja stabilan.",
        ],
        commonMistakes: [
          "Nemoj trzati vrat prema naprijed.",
          "Nemoj dizati cijela leda s poda.",
          "Nemoj zuriti bez kontrole trupa.",
        ],
        equipmentGuide: "Bez opreme; dovoljna je prostorija.",
      },
    },
    image: "/exercises/heel-taps-step1.webp",
    instructionStepImages: [
      "/exercises/heel-taps-step1.webp",
      "/exercises/heel-taps-step2.webp",
      "/exercises/heel-taps-step3.webp",
    ],
  },
  {
    id: "bear-crawl",
    muscleGroup: "core",
    home: true,
    gym: true,
    equipment: "none",
    sets: 3,
    reps: 1,
    durationMin: 4,
    holdSeconds: 30,
    restSeconds: 30,
    difficulty: "intermediate",
    tags: ["core", "home", "gym", "coordination", "full-body"],
    animation: { key: "core-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Bear crawl",
        description:
          "Puzanje u medvjedjem polozaju razvija koordinaciju, trup i ramena uz mali razmak koljena od poda.",
        instructions: [
          "Postavi se na sve cetiri, koljena malo iznad poda.",
          "Kreci suprotne ruke i noge naprijed ili u stranu.",
          "Drzi trup stabilnim bez ljuljanja kukova.",
          "Kontroliraj tempo i disanje.",
        ],
        commonMistakes: [
          "Nemoj spustiti koljena na pod ako je cilj medvjedji polozaj.",
          "Nemoj ljuljati kukove iz strane u stranu.",
          "Nemoj saginjati donja ledja prejako.",
        ],
        equipmentGuide: "Ne treba oprema; potrebna je sigurna povrsina.",
      },
    },
    image: "/exercises/bear-crawl-step1.webp",
    instructionStepImages: [
      "/exercises/bear-crawl-step1.webp",
      "/exercises/bear-crawl-step2.webp",
      "/exercises/bear-crawl-step3.webp",
    ],
  },
];

export const coreExercises = rawCore.map((exercise) => createExercise("core", toCreateExerciseInput(exercise)));
