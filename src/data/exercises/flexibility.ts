import { createExercise } from "../../utils/text";

/**
 * Kanonski oblik vježbe za fleksibilnost (izvor istine u ovom fileu).
 * Polja `name`, `desc`, `equip`, `rest`, `duration` ne koriste se u literalima —
 * createExercise i dalje zahtijeva engleski `name` i `desc` za unutarnju logiku;
 * ta se polja dodaju u `toCreateExerciseInput`.
 */
type FlexibilityExerciseCanonical = {
  id: string;
  muscleGroup: "flexibility";
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
  /** Napomena za createExercise `note` (npr. fokus sesije); ako prazno, koristi holdSeconds. */
  exerciseNote?: string;
};

/** Engleski ključ vježbe (za createExercise / pickExercises) — mapiran iz `id`. */
const LEGACY_NAME_BY_ID: Record<string, string> = {
  "stretching-yoga": "Stretching / Yoga",
  "foam-rolling": "Foam Rolling",
  "dynamic-stretching": "Dynamic Stretching",
  "mobility-flow": "Mobility Flow",
  "hip-flexor-stretch": "Hip Flexor Stretch",
};

function toCreateExerciseInput(raw: FlexibilityExerciseCanonical) {
  const name = LEGACY_NAME_BY_ID[raw.id];
  if (!name) {
    throw new Error(`[flexibility.ts] Nedostaje LEGACY_NAME_BY_ID za id: ${raw.id}`);
  }
  const { exerciseNote, ...rest } = raw;
  return {
    ...rest,
    name,
    desc: raw.text.hr.description,
    durationMin: raw.durationMin,
    restSeconds: raw.restSeconds,
    equipment: raw.equipment,
    note: exerciseNote ?? (raw.holdSeconds > 0 ? `${raw.holdSeconds} sec hold` : ""),
  };
}

const rawFlexibility: FlexibilityExerciseCanonical[] = [
  {
    id: "stretching-yoga",
    muscleGroup: "flexibility",
    home: true,
    gym: false,
    equipment: "none",
    sets: 1,
    reps: 1,
    durationMin: 30,
    holdSeconds: 0,
    restSeconds: 0,
    difficulty: "beginner",
    tags: ["flexibility", "home", "yoga", "stretching", "full-body"],
    animation: { key: "flexibility-fallback", type: "component", loop: false },
    exerciseNote: "full body",
    text: {
      hr: {
        name: "Istezanje i joga",
        description:
          "Lagani tijek istezanja cijelog tijela za hamstringe, kvadriceps, kukove, ramena i ledja uz mirno disanje.",
        instructions: [
          "Odaberi niz istezanja za glavne misicne skupine.",
          "Drzi svako istezanje do ugodnog osjecaja, ne bol.",
          "Disi duboko i izbjegavaj trzaje.",
          "Zavrsi s blagim zatvaranjem ili kratkim sjedenjem.",
        ],
        commonMistakes: [
          "Nemoj forsirati bolan opseg pokreta.",
          "Nemoj zadrzavati dah tijekom istezanja.",
          "Nemoj zuriti kroz serije bez kontrole.",
        ],
        equipmentGuide: "Ne treba oprema; dovoljna je prostirka ili meka podloga.",
      },
    },
    image: "/exercises/stretching-yoga-step1.webp",
    instructionStepImages: [
      "/exercises/stretching-yoga-step1.webp",
      "/exercises/stretching-yoga-step2.webp",
      "/exercises/stretching-yoga-step3.webp",
    ],
  },
  {
    id: "foam-rolling",
    muscleGroup: "flexibility",
    home: true,
    gym: true,
    equipment: "foam roller",
    sets: 1,
    reps: 1,
    durationMin: 15,
    holdSeconds: 0,
    restSeconds: 0,
    difficulty: "beginner",
    tags: ["flexibility", "home", "gym", "foam roller", "recovery"],
    animation: { key: "flexibility-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Foam rolling",
        description:
          "Foam rolling pomaze opustiti misice polaganim valjanjem; zadrzi na zategnutim tockama 20–30 sekundi.",
        instructions: [
          "Postavi valjak ispod ciljanog misica.",
          "Valjaj se polako, kontrolirano, uz disanje.",
          "Zadrzi 20–30 sekundi na osjetljivim tockama.",
          "Pokrij glavne skupine: noge, kuk, donja leda, gornja leda.",
        ],
        commonMistakes: [
          "Nemoj valjati prebrzo preko bolnih triggera.",
          "Nemoj stavljati punu tezinu na vrat ili donja leda bez znanja.",
          "Nemoj zaboraviti hidrataciju nakon dulje sesije.",
        ],
        equipmentGuide: "Potreban je foam roller odgovarajuce gustoce.",
      },
    },
    image: "/exercises/foam-rolling-step1.webp",
    instructionStepImages: [
      "/exercises/foam-rolling-step1.webp",
      "/exercises/foam-rolling-step2.webp",
      "/exercises/foam-rolling-step3.webp",
    ],
  },
  {
    id: "dynamic-stretching",
    muscleGroup: "flexibility",
    home: true,
    gym: false,
    equipment: "none",
    sets: 1,
    reps: 1,
    durationMin: 10,
    holdSeconds: 0,
    restSeconds: 0,
    difficulty: "beginner",
    tags: ["flexibility", "home", "warm-up", "dynamic"],
    animation: { key: "flexibility-fallback", type: "component", loop: false },
    exerciseNote: "warm-up",
    text: {
      hr: {
        name: "Dinamicno istezanje",
        description:
          "Dinamicno istezanje priprema zglobove i misice kratkim kontroliranim pokretima prije treninga.",
        instructions: [
          "Zapocni s kratkim nihanjem nogu i ruku.",
          "Dodaj kruzne pokrete kukova i ramena.",
          "Ukljuci hodanje u iskoraku za mobilnost kukova.",
          "Povecaj opseg postupno bez trzaja.",
        ],
        commonMistakes: [
          "Nemoj raditi staticko istezanje do otkaza prije intenzivnog treninga.",
          "Nemoj prebrzo zamahivati bez kontrole.",
          "Nemoj ignorirati bol u zglobovima.",
        ],
        equipmentGuide: "Ne treba oprema; dovoljan je mali siguran prostor.",
      },
    },
    image: "/exercises/dynamic-stretching-step1.webp",
    instructionStepImages: [
      "/exercises/dynamic-stretching-step1.webp",
      "/exercises/dynamic-stretching-step2.webp",
      "/exercises/dynamic-stretching-step3.webp",
    ],
  },
  {
    id: "mobility-flow",
    muscleGroup: "flexibility",
    home: true,
    gym: false,
    equipment: "none",
    sets: 1,
    reps: 1,
    durationMin: 20,
    holdSeconds: 0,
    restSeconds: 0,
    difficulty: "beginner",
    tags: ["flexibility", "home", "mobility", "joints"],
    animation: { key: "flexibility-fallback", type: "component", loop: false },
    exerciseNote: "joint focus",
    text: {
      hr: {
        name: "Mobility flow",
        description:
          "Mobility flow povezuje macku-kravu, world's greatest stretch, 90/90 kuk i rotacije grudnog dijela za pokretljivost zglobova.",
        instructions: [
          "Zapocni s mackom-kravom za kraljeznicu.",
          "Prijeđi u world's greatest stretch uz kontrolu kuka.",
          "Radi 90/90 istezanje kukova na obje strane.",
          "Zavrsi blagim rotacijama gornjeg dijela leda.",
        ],
        commonMistakes: [
          "Nemoj forsirati rotacije ako osjetis ostar bol.",
          "Nemoj ubrzavati tijek bez kontrole disanja.",
          "Nemoj zanemariti simetriju lijevo-desno.",
        ],
        equipmentGuide: "Ne treba oprema; prostirka je dobrodosla.",
      },
    },
    image: "/exercises/mobility-flow-step1.webp",
    instructionStepImages: [
      "/exercises/mobility-flow-step1.webp",
      "/exercises/mobility-flow-step2.webp",
      "/exercises/mobility-flow-step3.webp",
    ],
  },
  {
    id: "hip-flexor-stretch",
    muscleGroup: "flexibility",
    home: true,
    gym: false,
    equipment: "none",
    sets: 1,
    reps: 1,
    durationMin: 8,
    holdSeconds: 0,
    restSeconds: 0,
    difficulty: "beginner",
    tags: ["flexibility", "home", "hips", "stretching"],
    animation: { key: "flexibility-fallback", type: "component", loop: false },
    exerciseNote: "each side",
    text: {
      hr: {
        name: "Istezanje pregibaca kuka",
        description:
          "U poluklececem iskoraku s blago uvucenim karlicom naprijed osjecas istezanje u prednjem kuku.",
        instructions: [
          "Postavi se u poluklececi iskorak, zadnje koljeno na podu.",
          "Blago uvuci karlicu i uspravi trup.",
          "Pomakni kuk naprijed dok osjecas istezanje u prednjem kuku.",
          "Ponovi na drugoj strani jednako dugo.",
        ],
        commonMistakes: [
          "Nemoj prekomjerno saginjati donja leda.",
          "Nemoj pustati prednje koljeno da pada unutra.",
          "Nemoj zaboraviti drugu stranu.",
        ],
        equipmentGuide: "Ne treba oprema; prostirka olaksava koljeno ispod.",
      },
    },
    image: "/exercises/hip-flexor-stretch-step1.webp",
    instructionStepImages: [
      "/exercises/hip-flexor-stretch-step1.webp",
      "/exercises/hip-flexor-stretch-step2.webp",
      "/exercises/hip-flexor-stretch-step3.webp",
    ],
  },
];

export const flexibilityExercises = rawFlexibility.map((exercise) =>
  createExercise("flexibility", toCreateExerciseInput(exercise)),
);
