import { createExercise } from "../../utils/text";
import { OPTIONAL_ACTIVITY_LIBRARY } from "../../data/plans/optionalActivities";
import { CASUAL_MOVEMENT_IDEAS } from "../../data/plans/casualMovementIdeas";
import { buildGenericGymGuide } from "../../utils/equipment";

const WELLNESS_RECOVERY_EXERCISES = {
  home: [
    createExercise("flexibility", {
      name: "Breathing Reset",
      sets: 1,
      reps: 1,
      duration: 5,
      rest: 0,
      note: "5 min easy pace",
      equip: "none",
      home: true,
      desc: "Sit or lie in a comfortable position and take slow nasal breaths, keeping the shoulders relaxed and the exhale slightly longer than the inhale.",
      text: {
        hr: {
          description: "Smjesti se u udoban polozaj i disi polako kroz nos. Ramena neka budu opustena, a izdah malo duzi od udaha.",
          instructions: [
            "Namjesti udoban polozaj sjede ili leze.",
            "Udahni kroz nos polako i mirno.",
            "Izdah produzi malo vise od udaha.",
          ],
          commonMistakes: [
            "Nemoj dizati ramena prema usima.",
            "Nemoj ubrzavati disanje.",
            "Nemoj sjediti u neudobnom polozaju.",
          ],
          equipmentGuide: "Ne treba ti nikakva oprema, samo mirno mjesto i nekoliko minuta bez zurbe.",
        },
      },
    }),
    createExercise("flexibility", {
      name: "Child's Pose Flow",
      sets: 1,
      reps: 1,
      duration: 8,
      rest: 0,
      note: "easy pace",
      equip: "mat",
      home: true,
      desc: "Move between tabletop and child's pose, reaching arms long to open the back, shoulders and hips.",
      text: {
        hr: {
          description: "Polako prelazi iz tabletop polozaja u child's pose i izduzi ruke kako bi opustila ledja, ramena i kukove.",
          instructions: [
            "Dodji na sve cetiri.",
            "Spusti kukove prema petama.",
            "Izduzi ruke daleko naprijed i mirno disi.",
          ],
          commonMistakes: [
            "Nemoj forsirati dubinu pokreta.",
            "Nemoj zadrzavati dah.",
            "Nemoj dizati ramena prema usima.",
          ],
          equipmentGuide: "Radi na podu ili prostirci, bez forsiranja dubine pokreta.",
        },
      },
    }),
    createExercise("flexibility", {
      name: "Hip Flexor Stretch",
      sets: 1,
      reps: 1,
      duration: 8,
      rest: 0,
      note: "each side",
      equip: "mat",
      home: true,
      desc: "Step into a half-kneeling lunge, tuck pelvis under slightly, shift forward until you feel a stretch in the front hip.",
    }),
    createExercise("cardio", {
      name: "Gentle Walk",
      sets: 1,
      reps: 1,
      duration: 15,
      rest: 0,
      note: "easy recovery pace",
      equip: "none",
      home: true,
      desc: "Walk at a relaxed pace, keep your breath easy, and use the time to loosen up without raising effort too much.",
      text: {
        hr: {
          description: "Hodaj laganim tempom i iskoristi to vrijeme za opustanje tijela bez podizanja intenziteta.",
          instructions: [
            "Kreni sporim i ugodnim tempom.",
            "Drzi disanje mirnim.",
            "Opusti ramena i kukove tijekom hoda.",
          ],
          commonMistakes: [
            "Nemoj ubrzati vise nego sto ti odgovara.",
            "Nemoj zaboraviti na mirno disanje.",
            "Nemoj pretvoriti oporavak u naporan kardio.",
          ],
          equipmentGuide: "Moze lagana setnja po stanu, vani ili na vrlo mirnoj ruti.",
        },
      },
    }),
  ],
  gym: [
    createExercise("flexibility", {
      name: "Breathing Reset",
      sets: 1,
      reps: 1,
      duration: 5,
      rest: 0,
      note: "5 min easy pace",
      equip: "none",
      home: true,
      desc: "Sit or lie in a comfortable position and take slow nasal breaths, keeping the shoulders relaxed and the exhale slightly longer than the inhale.",
      text: {
        hr: {
          description: "Smjesti se u udoban polozaj i disi polako kroz nos. Ramena neka budu opustena, a izdah malo duzi od udaha.",
          instructions: [
            "Pronadi miran kutak.",
            "Diši polako kroz nos.",
            "Smiri puls i otpusti napetost u ramenima.",
          ],
          commonMistakes: [
            "Nemoj zuriti kroz disanje.",
            "Nemoj zatezati vrat i ramena.",
            "Nemoj raditi pokret ako ti smeta polozaj.",
          ],
          equipmentGuide: "Pronadi miran kutak u teretani ili svlacionici i uzmi nekoliko minuta za oporavak.",
        },
      },
    }),
    createExercise("cardio", {
      name: "Treadmill Walk",
      sets: 1,
      reps: 1,
      duration: 15,
      rest: 0,
      note: "easy incline optional",
      equip: "treadmill",
      home: false,
      desc: "Walk easily on the treadmill, keep the speed comfortable, and focus on breathing and circulation rather than effort.",
      imageLookupName: "Running",
      text: {
        hr: {
          description: "Na traci hodaj laganim tempom, bez forsiranja brzine, i fokusiraj se na disanje i laganu cirkulaciju.",
          instructions: [
            "Postavi laganu brzinu.",
            "Hodaj opusteno i ravnomjerno.",
            "Po zelji dodaj vrlo blag nagib.",
          ],
          commonMistakes: [
            "Nemoj odabrati previsok tempo.",
            "Nemoj se grciti u ramenima.",
            "Nemoj se previse oslanjati na rukohvate.",
          ],
          equipmentGuide: "Koristi traku za hodanje na laganoj brzini, po zelji s vrlo blagim nagibom.",
        },
      },
    }),
    createExercise("flexibility", {
      name: "Child's Pose Flow",
      sets: 1,
      reps: 1,
      duration: 8,
      rest: 0,
      note: "easy pace",
      equip: "mat",
      home: true,
      desc: "Move between tabletop and child's pose, reaching arms long to open the back, shoulders and hips.",
      text: {
        hr: {
          description: "Polako prelazi iz tabletop polozaja u child's pose i izduzi ruke kako bi opustila ledja, ramena i kukove.",
          instructions: [
            "Kreni na prostirci iz tabletop polozaja.",
            "Spusti kukove prema petama.",
            "Izduzi ruke i produbi izdah.",
          ],
          commonMistakes: [
            "Nemoj gurati kukove silom prema dolje.",
            "Nemoj zadrzavati dah.",
            "Nemoj stvarati napetost u vratu.",
          ],
          equipmentGuide: "Uzmi prostirku u zoni za istezanje i radi pokret bez zurbe.",
        },
      },
    }),
  ],
};

export function enrichExerciseForLocation(exercise, location) {
  const trainingLocation = location || "gym";
  const isHome = trainingLocation === "home";

  const locationImage = isHome
    ? (exercise.homeImage || exercise.image)
    : (exercise.gymImage || exercise.image);
  const locationStepImages = isHome
    ? (exercise.homeInstructionStepImages || exercise.instructionStepImages)
    : (exercise.gymInstructionStepImages || exercise.instructionStepImages);

  if (isHome) {
    return {
      ...exercise,
      trainingLocation,
      imageLookupName: exercise.imageLookupName || exercise.name,
      image: locationImage,
      instructionStepImages: locationStepImages,
    };
  }

  return {
    ...exercise,
    trainingLocation,
    contextDescHr: exercise.contextDescHr || exercise.text?.hr?.description,
    equipmentGuideHr: exercise.equipmentGuideHr || buildGenericGymGuide(exercise.equipment || exercise.equip),
    imageLookupName: exercise.imageLookupName || exercise.name,
    image: locationImage,
    instructionStepImages: locationStepImages,
  };
}

export function enrichExercisesForLocation(exercises, location) {
  return (exercises || []).map((exercise) => enrichExerciseForLocation(exercise, location));
}

function isIsoWithinPause(isoDate, pauseWindow) {
  if (!pauseWindow?.active || !pauseWindow?.startDate || !pauseWindow?.endDate || !isoDate) return false;
  return isoDate >= pauseWindow.startDate && isoDate <= pauseWindow.endDate;
}

function buildPauseDay(effectiveLoc, pauseWindow) {
  const reason = pauseWindow?.reason || "recovery";
  const reasonMap = {
    illness: { en: "Illness recovery", hr: "Pauza zbog bolesti" },
    injury: { en: "Injury recovery", hr: "Pauza zbog ozljede" },
    travel: { en: "Travel / life pause", hr: "Pauza zbog puta ili obveza" },
    other: { en: "Planned training pause", hr: "Planirana pauza od treninga" },
    recovery: { en: "Recovery pause", hr: "Pauza za oporavak" },
  };
  const text = reasonMap[reason] || reasonMap.recovery;
  return {
    focus: text.en,
    exercises: [],
    trainingLocation: effectiveLoc,
    statusTag: "pause",
    statusMessage: text.en,
    statusMessageHr: `${text.hr} do ${pauseWindow?.endDate || ""}.`,
  };
}

function buildPeriodDayOnePlan(effectiveLoc) {
  const recoveryExercises = WELLNESS_RECOVERY_EXERCISES[effectiveLoc] || WELLNESS_RECOVERY_EXERCISES.home;
  return {
    focus: "Cycle recovery",
    exercises: enrichExercisesForLocation(recoveryExercises, effectiveLoc),
    trainingLocation: effectiveLoc,
    statusTag: "cycle_day_one",
    statusMessage: "First-day period recovery session",
    statusMessageHr: "Prvi dan menstruacije - laganiji plan oporavka.",
  };
}

export function applyWorkoutAdjustments(baseDay, { isoDate, effectiveLoc, dayAdjustments, pauseWindow }) {
  if (isIsoWithinPause(isoDate, pauseWindow)) {
    return buildPauseDay(effectiveLoc, pauseWindow);
  }

  if (dayAdjustments?.[isoDate] === "period_day_1") {
    return buildPeriodDayOnePlan(effectiveLoc);
  }

  return {
    ...baseDay,
    exercises: enrichExercisesForLocation(baseDay?.exercises || [], effectiveLoc),
    trainingLocation: effectiveLoc,
  };
}

export function getAdaptiveActivitySuggestions({
  goal = "only_training",
  location = "gym",
  focusAreas = [],
} = {}) {
  const locationTags = new Set([location, location === "gym" ? "outdoor" : "park"]);
  return OPTIONAL_ACTIVITY_LIBRARY
    .filter((item) => item.goals.includes(goal) || item.goals.includes("only_training"))
    .filter((item) => item.locations.some((tag) => locationTags.has(tag)))
    .sort((a, b) => {
      const aFocus = a.focusAreas?.some((area) => focusAreas?.includes(area)) ? 1 : 0;
      const bFocus = b.focusAreas?.some((area) => focusAreas?.includes(area)) ? 1 : 0;
      return bFocus - aFocus;
    })
    .slice(0, 9);
}

export function getOptionalActivityLibrary() {
  return [...OPTIONAL_ACTIVITY_LIBRARY, ...CASUAL_MOVEMENT_IDEAS];
}
