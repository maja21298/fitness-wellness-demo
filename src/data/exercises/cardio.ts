import { createExercise } from "../../utils/text";

/**
 * Kanonski oblik vježbe za cardio (izvor istine u ovom fileu).
 * Polja `name`, `desc`, `equip`, `rest`, `duration` ne koriste se u literalima —
 * createExercise i dalje zahtijeva engleski `name` i `desc` za unutarnju logiku;
 * ta se polja dodaju u `toCreateExerciseInput`.
 */
type CardioExerciseCanonical = {
  id: string;
  muscleGroup: "cardio";
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
  /** Napomena za createExercise `note` (npr. tempo); ako prazno, koristi holdSeconds. */
  exerciseNote?: string;
};

/** Engleski ključ vježbe (za createExercise / pickExercises) — mapiran iz `id`. */
const LEGACY_NAME_BY_ID: Record<string, string> = {
  running: "Running",
  "jump-rope": "Jump Rope",
  burpees: "Burpees",
  cycling: "Cycling",
  "high-knees": "High Knees",
  "jumping-jacks": "Jumping Jacks",
  "box-jumps": "Box Jumps",
  "rowing-machine": "Rowing Machine",
  "stair-climbing": "Stair Climbing",
  "shadow-boxing": "Shadow Boxing",
  "skater-hops": "Skater Hops",
  "butt-kicks": "Butt Kicks",
};

function toCreateExerciseInput(raw: CardioExerciseCanonical) {
  const name = LEGACY_NAME_BY_ID[raw.id];
  if (!name) {
    throw new Error(`[cardio.ts] Nedostaje LEGACY_NAME_BY_ID za id: ${raw.id}`);
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

const rawCardio: CardioExerciseCanonical[] = [
  {
    id: "running",
    muscleGroup: "cardio",
    home: true,
    gym: false,
    equipment: "none",
    sets: 1,
    reps: 1,
    durationMin: 30,
    holdSeconds: 0,
    restSeconds: 0,
    difficulty: "beginner",
    tags: ["cardio", "home", "running", "bodyweight"],
    animation: { key: "cardio-basic", type: "component", loop: true },
    exerciseNote: "moderate pace",
    text: {
      hr: {
        name: "Trcanje",
        description:
          "Trcanje u umjerenom tempu razvija izdrzljivost, snagu nogu i kontrolu disanja; mozes trcati napolju ili u mjestu.",
        instructions: [
          "Zagrij se laganim hodom ili laganim trcanjem.",
          "Odrzi udoban, stabilan tempo i ritam disanja.",
          "Slijetaj na srednji dio stopala, ne na petu.",
          "Drzi trup stabilnim, pogled naprijed.",
        ],
        commonMistakes: [
          "Nemoj prebrzo prekinuti zagrijavanje ili naglo ubrzati.",
          "Nemoj udarati petom prejako u pod.",
          "Nemoj zadrzavati dah tijekom duzih intervala.",
        ],
        equipmentGuide: "Ne treba oprema; dovoljne su patike i sigurna podloga.",
      },
    },
    image: "/exercises/running-step1.webp",
    instructionStepImages: [
      "/exercises/running-step1.webp",
      "/exercises/running-step2.webp",
      "/exercises/running-step3.webp",
    ],
  },
  {
    id: "jump-rope",
    muscleGroup: "cardio",
    home: true,
    gym: true,
    equipment: "jump rope",
    sets: 3,
    reps: 1,
    durationMin: 3,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["cardio", "home", "gym", "jump rope", "coordination"],
    animation: { key: "cardio-fallback", type: "component", loop: false },
    exerciseNote: "2 min rounds",
    text: {
      hr: {
        name: "Preskakanje vijace",
        description:
          "Preskakanje vijace poboljsava koordinaciju, ritam i rad srca uz male skokove na prednjem dijelu stopala.",
        instructions: [
          "Drzi ruke blizu tijela i okreci uze zglobovima ruku.",
          "Skaci s malim odskokom, blago savijena koljena.",
          "Drzi trup stabilnim i pogled naprijed.",
          "Pronadi ritam koji mozes odrzati bez gubitka forme.",
        ],
        commonMistakes: [
          "Nemoj preskakati previsoko — dovoljan je mali skok.",
          "Nemoj udarati petom u pod.",
          "Nemoj zategnuti ramena i ruke.",
        ],
        equipmentGuide: "Potrebna je vija odgovarajuce duljine i prostor bez prepreka.",
      },
    },
    image: "/exercises/jump-rope-step1.webp",
    instructionStepImages: [
      "/exercises/jump-rope-step1.webp",
      "/exercises/jump-rope-step2.webp",
      "/exercises/jump-rope-step3.webp",
    ],
  },
  {
    id: "burpees",
    muscleGroup: "cardio",
    home: true,
    gym: false,
    equipment: "none",
    sets: 3,
    reps: 10,
    durationMin: 8,
    holdSeconds: 0,
    restSeconds: 60,
    difficulty: "advanced",
    tags: ["cardio", "home", "full-body", "plyometric", "bodyweight"],
    animation: { key: "cardio-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Burpee",
        description:
          "Burpee kombinira cucanj, sklek i skok u jedan intenzivan pokret za snagu i kondiciju cijelog tijela.",
        instructions: [
          "Postavi se uspravno, spusti se u cucanj i polozi sake na pod.",
          "Odskoci nogama natrag u plank, spusti se kontrolirano do poda.",
          "Gurni se sklekom, zatim skokom donesi stopala u cucanj.",
          "Skoci gore s rukama iznad glave i ponovi.",
        ],
        commonMistakes: [
          "Nemoj propadati u donjim ledima tijekom skleka.",
          "Nemoj preskakati kontrolu u donjem dijelu pokreta.",
          "Nemoj zuriti bez kontrole disanja.",
        ],
        equipmentGuide: "Ne treba oprema; potrebna je sigurna povrsina.",
      },
    },
    image: "/exercises/burpees-step1.webp",
    instructionStepImages: [
      "/exercises/burpees-step1.webp",
      "/exercises/burpees-step2.webp",
      "/exercises/burpees-step3.webp",
    ],
  },
  {
    id: "cycling",
    muscleGroup: "cardio",
    home: false,
    gym: true,
    equipment: "bike/stationary",
    sets: 1,
    reps: 1,
    durationMin: 25,
    holdSeconds: 0,
    restSeconds: 0,
    difficulty: "beginner",
    tags: ["cardio", "gym", "cycling", "low-impact"],
    animation: { key: "cardio-fallback", type: "component", loop: false },
    exerciseNote: "moderate intensity",
    text: {
      hr: {
        name: "Bicikl",
        description:
          "Bicikl u umjerenom intenzitetu razvija izdrzljivost nogu i kardiovaskularni sustav uz nizak udarni teret.",
        instructions: [
          "Podesi visinu sjedala i polozaj stopala.",
          "Odrzi ujednacen ritam pedalanja.",
          "Povecaj otpor ako trebas umjereni napor.",
          "Drzi lagano savijen lakta i opustena ramena.",
        ],
        commonMistakes: [
          "Nemoj savijati koljena preblizu podu u donjem polozaju.",
          "Nemoj gurati samo prstima — koristi cijelo stopalo.",
          "Nemoj zaboraviti disanje pri duzem trajanju.",
        ],
        equipmentGuide: "Potreban je bicikl ili sobni bicikl; podesi ga prema svojoj velicini.",
      },
    },
    image: "/exercises/cycling-step1.webp",
    instructionStepImages: [
      "/exercises/cycling-step1.webp",
      "/exercises/cycling-step2.webp",
      "/exercises/cycling-step3.webp",
    ],
  },
  {
    id: "high-knees",
    muscleGroup: "cardio",
    home: true,
    gym: false,
    equipment: "none",
    sets: 3,
    reps: 30,
    durationMin: 4,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["cardio", "home", "bodyweight", "running"],
    animation: { key: "cardio-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Visoka koljena",
        description:
          "Visoka koljena u mjestu aktiviraju kukove, kvadriceps i rad srca uz brz ritam i podizanje koljena.",
        instructions: [
          "Stani uspravno, zapocni lagano trcanje u mjestu.",
          "Podizaj koljena prema visini kukova ili malo visoke.",
          "Pomazi rukama u ritmu kao pri trcanju.",
          "Ostani na prednjem dijelu stopala.",
        ],
        commonMistakes: [
          "Nemoj naginjati trup jako unatrag.",
          "Nemoj udarati petom u pod.",
          "Nemoj zaboraviti aktivirati trup.",
        ],
        equipmentGuide: "Ne treba oprema; dovoljna je prostorija ili prostirka.",
      },
    },
    image: "/exercises/high-knees-step1.webp",
    instructionStepImages: [
      "/exercises/high-knees-step1.webp",
      "/exercises/high-knees-step2.webp",
      "/exercises/high-knees-step3.webp",
    ],
  },
  {
    id: "jumping-jacks",
    muscleGroup: "cardio",
    home: true,
    gym: false,
    equipment: "none",
    sets: 3,
    reps: 30,
    durationMin: 4,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["cardio", "home", "bodyweight", "warm-up"],
    animation: { key: "cardio-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Jumping jack",
        description:
          "Jumping jack je klasicna vjezba za zagrijavanje koja ubrzava puls i aktivira ramena i noge.",
        instructions: [
          "Stani uspravno, stopala uz tijelo, ruke uz strane.",
          "Odskoci i razdvoji stopala dok ruke idu iznad glave.",
          "Odskoci natrag u pocetni polozaj.",
          "Nastavi ubrzano, ali kontrolirano.",
        ],
        commonMistakes: [
          "Nemoj prebrzo prekinuti ako osjetis bol u gleznjevima.",
          "Nemoj udarati petom prejako u pod.",
          "Nemoj zadrzavati dah tijekom serije.",
        ],
        equipmentGuide: "Ne treba oprema; izbjegavaj klizavu podlogu.",
      },
    },
    image: "/exercises/jumping-jacks-step1.webp",
    instructionStepImages: [
      "/exercises/jumping-jacks-step1.webp",
      "/exercises/jumping-jacks-step2.webp",
      "/exercises/jumping-jacks-step3.webp",
    ],
  },
  {
    id: "box-jumps",
    muscleGroup: "cardio",
    home: true,
    gym: true,
    equipment: "box/step",
    sets: 3,
    reps: 10,
    durationMin: 6,
    holdSeconds: 0,
    restSeconds: 45,
    difficulty: "advanced",
    tags: ["cardio", "home", "gym", "plyometric", "plyo box"],
    animation: { key: "cardio-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Skok na kutiju",
        description:
          "Skok na kutiju razvija eksplozivnu snagu nogu i koordinaciju uz meko slijetanje na stabilnu platformu.",
        instructions: [
          "Stani ispred cvrste kutije ili stepenice.",
          "Zamahni rukama i skoci gore na platformu.",
          "Slijetaj na cijelo stopalo, koljena blago savijena.",
          "Siidi kontrolirano ili odskoci natrag i ponovi.",
        ],
        commonMistakes: [
          "Nemoj skakati na nestabilnu ili plesnajući podlogu.",
          "Nemoj slijetati u potpuno ispravljena koljena.",
          "Nemoj zuriti bez kontrole gleznjeva.",
        ],
        equipmentGuide: "Potrebna je cvrsta kutija ili stepenica odgovarajuce visine.",
      },
    },
    image: "/exercises/box-jumps-step1.webp",
    instructionStepImages: [
      "/exercises/box-jumps-step1.webp",
      "/exercises/box-jumps-step2.webp",
      "/exercises/box-jumps-step3.webp",
    ],
    homeImage: "/exercises/box-jumps-home-step1.webp",
    homeInstructionStepImages: [
      "/exercises/box-jumps-home-step1.webp",
      "/exercises/box-jumps-home-step2.webp",
      "/exercises/box-jumps-home-step3.webp",
    ],
  },
  {
    id: "rowing-machine",
    muscleGroup: "cardio",
    home: false,
    gym: true,
    equipment: "rowing machine",
    sets: 1,
    reps: 1,
    durationMin: 20,
    holdSeconds: 0,
    restSeconds: 0,
    difficulty: "beginner",
    tags: ["cardio", "gym", "rowing", "full-body"],
    animation: { key: "cardio-fallback", type: "component", loop: false },
    exerciseNote: "steady pace",
    text: {
      hr: {
        name: "Veslacki ergometar",
        description:
          "Veslanje na ergometru kombinira noge, trup i ruke uz kontinuirani ritam i dobro disanje.",
        instructions: [
          "Sjedi s ravnim ledima, stopala u remenima.",
          "Gurni nogama, zatim povuci rucicu prema prsima.",
          "Vrati se kontrolirano u produzeno tijelo.",
          "Odrzi ujednacen broj udaraca.",
        ],
        commonMistakes: [
          "Nemoj vući rukama prije nego što nogu potpuno gurnes.",
          "Nemoj zaobljavati donja ledja prejako.",
          "Nemoj drzati uze prejako ili prelabavo.",
        ],
        equipmentGuide: "Potreban je veslacki ergometar u teretani.",
      },
    },
    image: "/exercises/rowing-machine-step1.webp",
    instructionStepImages: [
      "/exercises/rowing-machine-step1.webp",
      "/exercises/rowing-machine-step2.webp",
      "/exercises/rowing-machine-step3.webp",
    ],
  },
  {
    id: "stair-climbing",
    muscleGroup: "cardio",
    home: true,
    gym: true,
    equipment: "stairs",
    sets: 1,
    reps: 1,
    durationMin: 15,
    holdSeconds: 0,
    restSeconds: 0,
    difficulty: "beginner",
    tags: ["cardio", "home", "gym", "stairs", "legs"],
    animation: { key: "cardio-fallback", type: "component", loop: false },
    exerciseNote: "moderate pace",
    text: {
      hr: {
        name: "Penjanje stepenicama",
        description:
          "Penjanje stepenicama u umjerenom tempu jaća noge i gluteuse uz visok rad srca.",
        instructions: [
          "Postavi stopalo cijelim na prvu stepenicu.",
          "Guraj kroz petu i prednji dio stopala.",
          "Koristi rukohvat ako trebas ravnotezu.",
          "Odrzi uspravan trup i ritam udisaja.",
        ],
        commonMistakes: [
          "Nemoj samo micati prstima na rubu stepenice.",
          "Nemoj naginjati trup prejako naprijed.",
          "Nemoj zanemariti sigurnost na klizavim povrsinama.",
        ],
        equipmentGuide: "Potrebne su unutarnje ili vanjske stepenice; pazi na sigurnost.",
      },
    },
    image: "/exercises/stair-climbing-step1.webp",
    instructionStepImages: [
      "/exercises/stair-climbing-step1.webp",
      "/exercises/stair-climbing-step2.webp",
      "/exercises/stair-climbing-step3.webp",
    ],
    gymImage: "/exercises/stair-climbing-gym-step1.webp",
    gymInstructionStepImages: [
      "/exercises/stair-climbing-gym-step1.webp",
      "/exercises/stair-climbing-gym-step2.webp",
      "/exercises/stair-climbing-gym-step3.webp",
    ],
  },
  {
    id: "shadow-boxing",
    muscleGroup: "cardio",
    home: true,
    gym: false,
    equipment: "none",
    sets: 3,
    reps: 1,
    durationMin: 3,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["cardio", "home", "boxing", "coordination"],
    animation: { key: "cardio-fallback", type: "component", loop: false },
    exerciseNote: "3 min rounds",
    text: {
      hr: {
        name: "Boksanje u zraku",
        description:
          "Boksanje u zraku razvija koordinaciju, brzinu ruku i izdrzljivost uz lagane korake i obranu.",
        instructions: [
          "Postavi se u blagi bokserki stav, koljena savijena.",
          "Bacaj udarce u kombinacijama, drzi sake uz lice.",
          "Micaj stopala lagano i u ritmu.",
          "Drzi ramena opustena i disi mirno.",
        ],
        commonMistakes: [
          "Nemoj zaboraviti obranu i pokret stopala.",
          "Nemoj zategnuti ramena i vrat.",
          "Nemoj udarati s punom snagom u zglobovima ruku.",
        ],
        equipmentGuide: "Ne treba oprema; dovoljan je mali prostor.",
      },
    },
    image: "/exercises/shadow-boxing-step1.webp",
    instructionStepImages: [
      "/exercises/shadow-boxing-step1.webp",
      "/exercises/shadow-boxing-step2.webp",
      "/exercises/shadow-boxing-step3.webp",
    ],
  },
  {
    id: "skater-hops",
    muscleGroup: "cardio",
    home: true,
    gym: false,
    equipment: "none",
    sets: 3,
    reps: 20,
    durationMin: 5,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["cardio", "home", "bodyweight", "lateral", "plyometric"],
    animation: { key: "cardio-fallback", type: "component", loop: false },
    text: {
      hr: {
        name: "Skater skokovi",
        description:
          "Skater skokovi razvijaju lateralnu snagu, ravnotezu i brzinu uz skokove u stranu s jednom noge.",
        instructions: [
          "Stani u blagi polozaj, zapocni skok u stranu.",
          "Slijetaj na jednu nogu, druga noga ide u stranu.",
          "Drzi trup stabilnim, ruke za ravnotezu.",
          "Ubrzaj tempo kad savladas formu.",
        ],
        commonMistakes: [
          "Nemoj slijetati u potpuno ispravljeno koljeno.",
          "Nemoj gubiti kontrolu gleznja.",
          "Nemoj preskakati zagrijavanje.",
        ],
        equipmentGuide: "Ne treba oprema; potrebna je sigurna povrsina.",
      },
    },
    image: "/exercises/skater-hops-step1.webp",
    instructionStepImages: [
      "/exercises/skater-hops-step1.webp",
      "/exercises/skater-hops-step2.webp",
      "/exercises/skater-hops-step3.webp",
    ],
  },
  {
    id: "butt-kicks",
    muscleGroup: "cardio",
    home: true,
    gym: false,
    equipment: "none",
    sets: 3,
    reps: 30,
    durationMin: 4,
    holdSeconds: 0,
    restSeconds: 30,
    difficulty: "beginner",
    tags: ["cardio", "home", "bodyweight", "running", "warm-up"],
    animation: { key: "cardio-basic", type: "component", loop: true },
    text: {
      hr: {
        name: "Butt kicks",
        description:
          "Butt kicks u mjestu aktiviraju hamstringe i rad srca uz podizanje peti prema sjedalu.",
        instructions: [
          "Postavi se uspravno, zapocni lagano trcanje u mjestu.",
          "Podizaj pete prema gluteusima.",
          "Pomazi rukama u ritmu trcanja.",
          "Drzi prsa otvorena i pogled naprijed.",
        ],
        commonMistakes: [
          "Nemoj prejako naginjati trup unatrag.",
          "Nemoj udarati petom u pod.",
          "Nemoj zaboraviti aktivirati trup.",
        ],
        equipmentGuide: "Ne treba oprema; izbjegavaj klizavu podlogu.",
      },
    },
    image: "/exercises/butt-kicks-step1.webp",
    instructionStepImages: [
      "/exercises/butt-kicks-step1.webp",
      "/exercises/butt-kicks-step2.webp",
      "/exercises/butt-kicks-step3.webp",
    ],
  },
];

export const cardioExercises = rawCardio.map((exercise) => createExercise("cardio", toCreateExerciseInput(exercise)));
