import { createExercise } from "../../utils/text";

const rawLegs = [
  {
    name: "Squat",
    sets: 4,
    reps: 12,
    duration: 10,
    rest: 90,
    equip: "barbell",
    home: false,
    desc: "Bar on upper back, feet shoulder-width, lower until thighs are parallel, drive up.",
    text: {
      hr: {
        name: "Cucanj sa sipkom",
        description:
          "Sipka na gornjem dijelu ledja, stopala u sirini ramena. Spusti se dok bedra ne budu paralelna s podom, zatim se vrati gore.",
        instructions: [
          "Postavi sipku na gornji dio ledja i cvrsto je zahvati.",
          "Stopala postavi u sirini ramena, prsti lagano prema van.",
          "Spustaj se kontrolirano dok bedra ne budu paralelna s podom.",
          "Guraj kroz pete i vrati se u pocetni polozaj.",
        ],
        commonMistakes: [
          "Nemoj podizati pete s poda.",
          "Nemoj zaokruzivati ledja prilikom spustanja.",
          "Nemoj rusiti koljena prema unutra.",
        ],
        equipmentGuide:
          "Trebas sipku i rack. Koristi sigurne kuke ili spottera za teze serije.",
      },
    },
    image: "/exercises/squat-step1.webp",
    instructionStepImages: [
      "/exercises/squat-step1.webp",
      "/exercises/squat-step2.webp",
      "/exercises/squat-step3.webp",
    ],
  },
  {
    name: "Deadlift",
    sets: 4,
    reps: 8,
    duration: 10,
    rest: 120,
    equip: "barbell",
    home: false,
    desc: "Grip bar outside knees, keep back flat, drive through heels, stand tall, lower with control.",
    text: {
      hr: {
        name: "Mrtvo dizanje",
        description:
          "Zahvati sipku s vanjske strane koljena, drzi ledja ravnima, guraj kroz pete i ustani potpuno uspravno.",
        instructions: [
          "Stani blizu sipke, stopala u sirini kukova.",
          "Zahvati sipku s vanjske strane koljena, ledja ravna.",
          "Guraj kroz pete i podizi sipku duz nogu.",
          "Potpuno se ispravi u kukovima i ramenima.",
          "Spusti sipku kontrolirano natrag duz nogu.",
        ],
        commonMistakes: [
          "Nemoj zaokruzivati ledja prilikom podizanja.",
          "Nemoj vuciti sipku predalekov od tijela.",
          "Nemoj koristiti samo ledja umjesto nogu.",
        ],
        equipmentGuide:
          "Trebas sipku i ravnu podlogu. Koristi remene za teze serije ako je potrebno.",
      },
    },
    image: "/exercises/deadlift-step1.webp",
    instructionStepImages: [
      "/exercises/deadlift-step1.webp",
      "/exercises/deadlift-step2.webp",
      "/exercises/deadlift-step3.webp",
    ],
  },
  {
    name: "Romanian Deadlift",
    sets: 3,
    reps: 10,
    duration: 8,
    rest: 75,
    equip: "barbell/dumbbells",
    home: true,
    desc: "Hold weights in front of thighs, hinge hips back with slight knee bend, feel hamstring stretch, return tall.",
    text: {
      hr: {
        name: "Rumunjsko mrtvo dizanje",
        description:
          "Drzi utege ispred bedara, gurnni kukove unatrag uz lagano savijanje koljena i osjeti istezanje straznje loze.",
        instructions: [
          "Drzi utege ispred bedara s lagano savijenim koljenima.",
          "Gurni kukove unatrag i nagni trup prema naprijed.",
          "Spustaj utege duz nogu dok ne osjetis istezanje straznje loze.",
          "Vrati se u uspravni polozaj stezuci gluteuse.",
        ],
        commonMistakes: [
          "Nemoj zaokruzivati ledja tijekom spustanja.",
          "Nemoj previse savijati koljena — ovo nije cucanj.",
          "Nemoj zaboraviti aktivirati straznju lozu i gluteuse.",
        ],
        equipmentGuide:
          "Mozes koristiti sipku ili bucice. Kod kuce koristi bucice ili boce s vodom.",
      },
    },
    image: "/exercises/romanian-deadlift-step1.webp",
    instructionStepImages: [
      "/exercises/romanian-deadlift-step1.webp",
      "/exercises/romanian-deadlift-step2.webp",
      "/exercises/romanian-deadlift-step3.webp",
    ],
    gymImage: "/exercises/romanian-deadlift-gym-step1.webp",
    gymInstructionStepImages: [
      "/exercises/romanian-deadlift-gym-step1.webp",
      "/exercises/romanian-deadlift-gym-step2.webp",
      "/exercises/romanian-deadlift-gym-step3.webp",
    ],
  },
  {
    name: "Lunges",
    sets: 3,
    reps: 12,
    duration: 7,
    rest: 60,
    equip: "none",
    home: true,
    desc: "Step forward, lower back knee toward floor, front thigh parallel to ground, push back.",
    text: {
      hr: {
        name: "Iskoraci",
        description: "Iskorak je vjezba za noge i gluteuse koja razvija snagu, ravnotezu i stabilnost kukova.",
        instructions: [
          "Stani uspravno i aktiviraj trup.",
          "Iskoraci dovoljno dugo da prednja noga ostane stabilna.",
          "Spusti straznje koljeno prema podu uz kontrolu.",
          "Vrati se natrag gurajuci kroz prednje stopalo.",
        ],
        commonMistakes: [
          "Nemoj prekratko iskrociti.",
          "Nemoj rusiti prednje koljeno prema unutra.",
          "Nemoj gubiti ravnotezu zbog prebrzog tempa.",
        ],
        equipmentGuide: "Mozes ga raditi bez opreme, s bucicama uz tijelo ili u slobodnom prostoru teretane kao hodajuci iskorak.",
      },
    },
    animation: {
      key: "lunges-basic",
      type: "component",
    },
    image: "/exercises/lunges-step1.webp",
    instructionStepImages: [
      "/exercises/lunges-step1.webp",
      "/exercises/lunges-step2.webp",
      "/exercises/lunges-step3.webp",
    ],
  },
  {
    name: "Lateral Lunges",
    sets: 3,
    reps: 10,
    duration: 6,
    rest: 45,
    equip: "none",
    home: true,
    desc: "Step wide to the side, sit hips back into one leg, keep the other straight, push back to center and alternate.",
    text: {
      hr: {
        name: "Bocni iskoraci",
        description:
          "Iskoraci u stranu, spusti kukove prema jednoj nozi dok druga ostaje ispruena, vrati se u sredinu i zamijeni stranu.",
        instructions: [
          "Stani uspravno, stopala zajedno.",
          "Napravi sirok korak u stranu jednom nogom.",
          "Spusti kukove prema toj nozi uz savijanje koljena.",
          "Drzi drugu nogu ispruenu.",
          "Gurni se natrag u pocetni polozaj i zamijeni stranu.",
        ],
        commonMistakes: [
          "Nemoj savijati koljeno preko prstiju.",
          "Nemoj naginjati trup previse naprijed.",
          "Nemoj raditi prekratke korake u stranu.",
        ],
        equipmentGuide:
          "Mozes raditi bez opreme. Za dodatni otpor drzi bucicu ispred prsa.",
      },
    },
    image: "/exercises/lateral-lunges-step1.webp",
    instructionStepImages: [
      "/exercises/lateral-lunges-step1.webp",
      "/exercises/lateral-lunges-step2.webp",
      "/exercises/lateral-lunges-step3.webp",
    ],
  },
  {
    name: "Leg Press",
    sets: 3,
    reps: 12,
    duration: 7,
    rest: 75,
    equip: "machine",
    home: false,
    desc: "Feet shoulder-width on platform, lower until knees are at 90 degrees, press back up.",
    text: {
      hr: {
        name: "Potisak nogama",
        description:
          "Stopala u sirini ramena na platformi, spusti dok koljena ne budu pod kutom od 90 stupnjeva, pa potisni natrag gore.",
        instructions: [
          "Sjedi u spravu i postavi stopala u sirini ramena na platformu.",
          "Spusti platformu kontrolirano dok koljena ne budu pod 90 stupnjeva.",
          "Potisni natrag gore gurajuci kroz cijela stopala.",
          "Nemoj potpuno ispraviti koljena na vrhu pokreta.",
        ],
        commonMistakes: [
          "Nemoj potpuno zakljucavati koljena na vrhu.",
          "Nemoj podizati gluteuse s sjedista.",
          "Nemoj koristiti preveliku tezinu na ustrb forme.",
        ],
        equipmentGuide:
          "Trebas leg press spravu. Prilagodi tezinu da mozes kontrolirati pokret cijelim opsegom.",
      },
    },
    image: "/exercises/leg-press-step1.webp",
    instructionStepImages: [
      "/exercises/leg-press-step1.webp",
      "/exercises/leg-press-step2.webp",
      "/exercises/leg-press-step3.webp",
    ],
  },
  {
    name: "Leg Curls",
    sets: 3,
    reps: 12,
    duration: 6,
    rest: 60,
    equip: "machine",
    home: false,
    desc: "Lie face down on machine, curl heels toward glutes, squeeze hamstrings, lower slowly.",
    text: {
      hr: {
        name: "Pregib nogu na spravi",
        description:
          "Legni na spravu licem prema dolje, savijaj pete prema gluteusima i stisni straznju lozu, zatim polako spusti.",
        instructions: [
          "Legni na spravu licem prema dolje i podesi jastucic iznad peta.",
          "Savijaj pete prema gluteusima kontroliranim pokretom.",
          "Stisni straznju lozu na vrhu pokreta.",
          "Polako spusti tezinu natrag u pocetni polozaj.",
        ],
        commonMistakes: [
          "Nemoj podizati kukove s klupe tijekom pokreta.",
          "Nemoj koristiti zamah za podizanje tezine.",
          "Nemoj prespustati tezinu — kontroliraj negativnu fazu.",
        ],
        equipmentGuide:
          "Trebas spravu za pregibe nogu. Podesi tezinu tako da zadnja 2-3 ponavljanja budu zahtjevna.",
      },
    },
    image: "/exercises/leg-curls-step1.webp",
    instructionStepImages: [
      "/exercises/leg-curls-step1.webp",
      "/exercises/leg-curls-step2.webp",
      "/exercises/leg-curls-step3.webp",
    ],
  },
  {
    name: "Calf Raises",
    sets: 3,
    reps: 15,
    duration: 4,
    rest: 45,
    equip: "none",
    home: true,
    desc: "Stand on edge of a step, raise heels as high as possible, lower below step level.",
    text: {
      hr: {
        name: "Dizanje na prste",
        description:
          "Stani na rub stepenice, podigni pete sto vise, zatim spusti ispod razine stepenice za puni opseg pokreta.",
        instructions: [
          "Stani na rub stepenice s prednjim dijelom stopala.",
          "Podigni pete sto vise stezuci listove.",
          "Zadrzi kratko na vrhu.",
          "Polako spusti pete ispod razine stepenice.",
        ],
        commonMistakes: [
          "Nemoj raditi pokret prebrzo bez kontrole.",
          "Nemoj koristiti zamah tijela umjesto snage listova.",
          "Nemoj preskakati puno istezanje na dnu pokreta.",
        ],
        equipmentGuide:
          "Mozes raditi bez opreme na bilo kojoj stepenici. Za dodatni otpor drzi bucicu u ruci.",
      },
    },
    image: "/exercises/calf-raises-step1.webp",
    instructionStepImages: [
      "/exercises/calf-raises-step1.webp",
      "/exercises/calf-raises-step2.webp",
      "/exercises/calf-raises-step3.webp",
    ],
  },
  {
    name: "Bulgarian Split Squat",
    sets: 3,
    reps: 10,
    duration: 8,
    rest: 60,
    equip: "chair/bench",
    home: true,
    desc: "Rear foot on bench or chair, lower front leg to 90 degrees, drive up through front heel.",
    text: {
      hr: {
        name: "Bugarski cucanj",
        description:
          "Straznja noga na klupi ili stolici, spusti prednju nogu do 90 stupnjeva i vrati se gore gurajuci kroz prednju petu.",
        instructions: [
          "Postavi straznje stopalo na klupu ili stolicu iza sebe.",
          "Spusti se dok prednje koljeno ne bude pod 90 stupnjeva.",
          "Drzi trup uspravno i aktiviraj trbusne misice.",
          "Guraj kroz prednju petu i vrati se u pocetni polozaj.",
        ],
        commonMistakes: [
          "Nemoj naginjati trup previse naprijed.",
          "Nemoj dopustiti da prednje koljeno prelazi prste.",
          "Nemoj stajati preblizu klupi.",
        ],
        equipmentGuide:
          "Trebas klupu, stolicu ili stabilnu povrsinu. Kod kuce mozes koristiti krevet ili cvrst stolac.",
      },
    },
    image: "/exercises/bulgarian-split-squat-step1.webp",
    instructionStepImages: [
      "/exercises/bulgarian-split-squat-step1.webp",
      "/exercises/bulgarian-split-squat-step2.webp",
      "/exercises/bulgarian-split-squat-step3.webp",
    ],
  },
  {
    name: "Wall Sit",
    sets: 3,
    reps: 1,
    duration: 3,
    rest: 45,
    note: "30 sec hold",
    equip: "wall",
    home: true,
    desc: "Back against wall, slide down until thighs are parallel to floor, hold position.",
    text: {
      hr: {
        name: "Sjedenje uz zid",
        description:
          "Ledjima uza zid, klizni dolje dok bedra ne budu paralelna s podom i zadrzi polozaj.",
        instructions: [
          "Nasloni ledja ravno uza zid.",
          "Klizni dolje dok koljena ne budu pod 90 stupnjeva.",
          "Drzi bedra paralelno s podom.",
          "Zadrzi polozaj koliko mozes uz kontrolirano disanje.",
        ],
        commonMistakes: [
          "Nemoj dopustiti da koljena prelaze prste stopala.",
          "Nemoj podizati ramena od zida.",
          "Nemoj zadrzavati dah — disi mirno i kontrolirano.",
        ],
        equipmentGuide:
          "Trebas samo ravan zid. Cipele s dobrim prianjanjem pomazu da ne klizis.",
      },
    },
    image: "/exercises/wall-sit-step1.webp",
    instructionStepImages: [
      "/exercises/wall-sit-step1.webp",
      "/exercises/wall-sit-step2.webp",
      "/exercises/wall-sit-step3.webp",
    ],
  },
  {
    name: "Goblet Squat",
    sets: 3,
    reps: 12,
    duration: 7,
    rest: 60,
    equip: "dumbbell/jug",
    home: true,
    desc: "Hold dumbbell or heavy water jug at chest, squat deep with elbows inside knees, push up.",
    text: {
      hr: {
        name: "Goblet cucanj",
        description:
          "Drzi bucicu ili tesku bocu vode uz prsa, cucni duboko s laktovima izmedu koljena, pa se vrati gore.",
        instructions: [
          "Drzi bucicu ili bocu vode uz prsa s obje ruke.",
          "Stopala u sirini ramena, prsti lagano prema van.",
          "Spusti se duboko u cucanj s laktovima izmedu koljena.",
          "Guraj kroz pete i vrati se u uspravni polozaj.",
        ],
        commonMistakes: [
          "Nemoj zaokruzivati ledja prilikom spustanja.",
          "Nemoj podizati pete s poda.",
          "Nemoj naginjati trup previse naprijed.",
        ],
        equipmentGuide:
          "Mozes koristiti bucicu, kettlebell ili tesku bocu vode. Super za kucni trening.",
      },
    },
    animation: { key: "squat-basic", type: "component", loop: true },
    image: "/exercises/goblet-squat-step1.webp",
    instructionStepImages: [
      "/exercises/goblet-squat-step1.webp",
      "/exercises/goblet-squat-step2.webp",
      "/exercises/goblet-squat-step3.webp",
    ],
    homeImage: "/exercises/goblet-squat-home-step1.webp",
    homeInstructionStepImages: [
      "/exercises/goblet-squat-home-step1.webp",
      "/exercises/goblet-squat-home-step2.webp",
      "/exercises/goblet-squat-home-step3.webp",
    ],
  },
  {
    name: "Step-ups",
    sets: 3,
    reps: 12,
    duration: 7,
    rest: 60,
    equip: "chair/bench",
    home: true,
    desc: "Step onto a bench or sturdy chair with one foot, drive through heel to stand, step back down.",
    text: {
      hr: {
        name: "Step-up na klupu",
        description:
          "Popni se jednom nogom na klupu ili cvrst stolac, guraj kroz petu da ustanes, pa se spusti natrag.",
        instructions: [
          "Stani ispred klupe ili stabilne povrsine.",
          "Postavi jednu nogu na klupu i guraj kroz petu.",
          "Ustani potpuno na klupu bez odbijanja drugom nogom.",
          "Kontrolirano se spusti natrag i zamijeni nogu.",
        ],
        commonMistakes: [
          "Nemoj se odbijati donjom nogom prilikom uspona.",
          "Nemoj koristiti nestabilnu povrsinu.",
          "Nemoj naginjati tijelo u stranu tijekom pokreta.",
        ],
        equipmentGuide:
          "Trebas klupu, cvrst stolac ili kutiju. Kod kuce mozes koristiti stabilnu stepenicu.",
      },
    },
    image: "/exercises/step-ups-step1.webp",
    instructionStepImages: [
      "/exercises/step-ups-step1.webp",
      "/exercises/step-ups-step2.webp",
      "/exercises/step-ups-step3.webp",
    ],
  },
  {
    name: "Bodyweight Squats",
    sets: 4,
    reps: 20,
    duration: 8,
    rest: 60,
    equip: "none",
    home: true,
    desc: "Feet shoulder-width, arms forward for balance, lower until thighs parallel, drive up through heels.",
    text: {
      hr: {
        name: "Cucanj bez opreme",
        description:
          "Stopala u sirini ramena, ruke ispred sebe za ravnotezu. Spusti se dok bedra ne budu paralelna s podom i guraj gore kroz pete.",
        instructions: [
          "Stani sa stopalima u sirini ramena.",
          "Ispruzi ruke ispred sebe za ravnotezu.",
          "Spustaj se kontrolirano dok bedra ne budu paralelna s podom.",
          "Guraj kroz pete i vrati se u uspravni polozaj.",
        ],
        commonMistakes: [
          "Nemoj podizati pete s poda.",
          "Nemoj zaokruzivati ledja.",
          "Nemoj rusiti koljena prema unutra.",
        ],
        equipmentGuide:
          "Bez opreme. Mozes drzati bucicu ili bocu vode uz prsa za dodatni otpor.",
      },
    },
    image: "/exercises/bodyweight-squats-step1.webp",
    instructionStepImages: [
      "/exercises/bodyweight-squats-step1.webp",
      "/exercises/bodyweight-squats-step2.webp",
      "/exercises/bodyweight-squats-step3.webp",
    ],
  },
  {
    name: "Jump Squats",
    sets: 3,
    reps: 12,
    duration: 6,
    rest: 45,
    equip: "none",
    home: true,
    desc: "Squat down, explode upward into a jump, land softly on balls of feet, repeat immediately.",
    text: {
      hr: {
        name: "Cucanj sa skokom",
        description:
          "Spusti se u cucanj, eksplozivno skoci uvis, doskoci mekano na prednji dio stopala i odmah ponovi.",
        instructions: [
          "Spusti se u polucucanj s rukama iza sebe.",
          "Eksplozivno skoci uvis zamahujuci rukama.",
          "Doskoci mekano na prednji dio stopala.",
          "Odmah se spusti u sljedeci cucanj i ponovi.",
        ],
        commonMistakes: [
          "Nemoj doskaivati na ravna stopala — uvijek na prste pa pete.",
          "Nemoj rusiti koljena prema unutra prilikom doskoka.",
          "Nemoj preskakati cucanj prije skoka — spusti se dovoljno duboko.",
        ],
        equipmentGuide:
          "Bez opreme. Radi na mekijoj podlozi ako ti je ugodnije za zglobove.",
      },
    },
    image: "/exercises/jump-squats-step1.webp",
    instructionStepImages: [
      "/exercises/jump-squats-step1.webp",
      "/exercises/jump-squats-step2.webp",
      "/exercises/jump-squats-step3.webp",
    ],
  },
  {
    name: "Glute Bridge",
    sets: 3,
    reps: 15,
    duration: 5,
    rest: 30,
    equip: "none",
    home: true,
    desc: "Lie on back, knees bent, feet flat, drive hips up squeezing glutes, lower slowly.",
    text: {
      hr: {
        name: "Mostic za gluteuse",
        description:
          "Lezi na ledja s koljenima savijenim i stopalima ravno na podu. Podigni kukove prema gore stezuci gluteuse.",
        instructions: [
          "Lezi na ledja s koljenima savijenim i stopalima ravno na podu.",
          "Ruke polozi uz tijelo.",
          "Stisni gluteuse i podigni kukove prema gore.",
          "Zadrzi polozaj kratko na vrhu pokreta.",
          "Kontrolirano spusti kukove natrag prema podu.",
        ],
        commonMistakes: [
          "Nemoj pretjerano savijati donji dio ledja.",
          "Nemoj gurati kukove previsoko preko prirodnog polozaja.",
          "Nemoj zaboraviti stisnuti gluteuse na vrhu pokreta.",
        ],
        equipmentGuide:
          "Vjezbu mozes raditi bez opreme, a za veci otpor mozes staviti bucicu ili uteg preko kukova.",
      },
    },
    image: "/exercises/glute-bridge-step1.webp",
    instructionStepImages: [
      "/exercises/glute-bridge-step1.webp",
      "/exercises/glute-bridge-step2.webp",
      "/exercises/glute-bridge-step3.webp",
    ],
  },
  {
    name: "Hip Thrust",
    sets: 3,
    reps: 12,
    duration: 6,
    rest: 45,
    equip: "bench/dumbbell",
    home: true,
    desc: "Upper back on bench or sofa, feet planted, drive hips up until torso is parallel to floor, squeeze glutes hard.",
    text: {
      hr: {
        name: "Hip thrust",
        description:
          "Gornji dio ledja na klupi ili sofi, stopala cvrsto na podu. Podigni kukove dok trup ne bude paralelan s podom i jako stisni gluteuse.",
        instructions: [
          "Nasloni gornji dio ledja na klupu ili stabilnu sofu.",
          "Stopala postavi cvrsto na pod u sirini kukova.",
          "Podigni kukove dok trup ne bude paralelan s podom.",
          "Stisni gluteuse jako na vrhu pokreta.",
          "Polako spusti kukove natrag prema podu.",
        ],
        commonMistakes: [
          "Nemoj previse savijati donja ledja na vrhu pokreta.",
          "Nemoj postavljati stopala predaleko od tijela.",
          "Nemoj koristiti zamah umjesto kontroliranog pokreta.",
        ],
        equipmentGuide:
          "Mozes koristiti klupu ili stabilnu sofu. Za dodatni otpor stavi bucicu ili sipku na kukove.",
      },
    },
    image: "/exercises/hip-thrust-step1.webp",
    instructionStepImages: [
      "/exercises/hip-thrust-step1.webp",
      "/exercises/hip-thrust-step2.webp",
      "/exercises/hip-thrust-step3.webp",
    ],
    gymImage: "/exercises/hip-thrust-gym-step1.webp",
    gymInstructionStepImages: [
      "/exercises/hip-thrust-gym-step1.webp",
      "/exercises/hip-thrust-gym-step2.webp",
      "/exercises/hip-thrust-gym-step3.webp",
    ],
  },
  {
    name: "Single-leg Deadlift",
    sets: 3,
    reps: 10,
    duration: 7,
    rest: 60,
    equip: "none",
    home: true,
    desc: "Balance on one leg, hinge forward reaching toward floor, keep back straight, return to standing.",
    text: {
      hr: {
        name: "Jednonozno mrtvo dizanje",
        description:
          "Drzi ravnotezu na jednoj nozi, nagni se naprijed prema podu drzeci ledja ravnima, pa se vrati u uspravni polozaj.",
        instructions: [
          "Stani na jednu nogu s lagano savijenim koljenom.",
          "Nagni se naprijed iz kukova drzeci ledja ravnima.",
          "Ispruzi slobodnu nogu iza sebe za protutezuu.",
          "Spusti ruke prema podu koliko ti dopusta savitljivost.",
          "Vrati se u uspravni polozaj stezuci gluteuse i straznju lozu.",
        ],
        commonMistakes: [
          "Nemoj zaokruzivati ledja prilikom naginjanja.",
          "Nemoj otvarati kukove u stranu — drzi ih ravnima.",
          "Nemoj raditi pokret prebrzo — ravnoteza je kljucna.",
        ],
        equipmentGuide:
          "Mozes raditi bez opreme ili s bucicama u rukama za dodatni otpor.",
      },
    },
    image: "/exercises/single-leg-deadlift-step1.webp",
    instructionStepImages: [
      "/exercises/single-leg-deadlift-step1.webp",
      "/exercises/single-leg-deadlift-step2.webp",
      "/exercises/single-leg-deadlift-step3.webp",
    ],
  },
  {
    name: "Sumo Squat",
    sets: 3,
    reps: 15,
    duration: 7,
    rest: 45,
    equip: "none",
    home: true,
    desc: "Stand wide with toes slightly out, sit hips down between knees, keep chest up, drive back to standing.",
    text: {
      hr: {
        name: "Sumo cucanj",
        description:
          "Stani siroko s prstima lagano prema van, spusti kukove izmedu koljena drzeci prsa gore, pa se vrati u stojecu poziciju.",
        instructions: [
          "Stani sire od ramena s prstima lagano prema van.",
          "Spusti kukove prema dolje izmedu koljena.",
          "Drzi prsa gore i ledja ravnima.",
          "Guraj kroz pete i vrati se u uspravni polozaj.",
        ],
        commonMistakes: [
          "Nemoj rusiti koljena prema unutra.",
          "Nemoj naginjati trup previse naprijed.",
          "Nemoj stajati preusko — sumo cucanj zahtijeva sirok stav.",
        ],
        equipmentGuide:
          "Mozes raditi bez opreme. Za dodatni otpor drzi bucicu ili kettlebell ispred tijela.",
      },
    },
    image: "/exercises/sumo-squat-step1.webp",
    instructionStepImages: [
      "/exercises/sumo-squat-step1.webp",
      "/exercises/sumo-squat-step2.webp",
      "/exercises/sumo-squat-step3.webp",
    ],
  },
];

export const legExercises = rawLegs.map((exercise) => createExercise("legs", exercise));
