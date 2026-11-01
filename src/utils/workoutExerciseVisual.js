import { EXERCISE_IMAGE_MAP } from "../data/exerciseImageMap.js";
import { EXERCISE_DB } from "../data/exercises/index.ts";
import avatarManifest from "../data/exerciseAvatarManifest.json";

const canonicalExercises = new Map(
  Object.values(EXERCISE_DB).flat().map((exercise) => [exercise.name.toLowerCase(), exercise]),
);

function ownImages(exercise) {
  const steps = Array.isArray(exercise?.instructionStepImages)
    ? exercise.instructionStepImages.filter((src) => typeof src === "string" && src.trim())
    : [];
  if (steps.length) return steps.slice(0, 3);
  for (const src of [exercise?.instructionImage, exercise?.image]) {
    if (typeof src === "string" && src.trim()) return [src.trim()];
  }
  return [];
}

const RECOVERY_IMAGES = {
  "Breathing Reset": ["/exercises/box-breathing.webp"],
  "Gentle Walk": ["/exercises/brisk-walk.webp"],
};

const RECOVERY_AVATAR_IDS = {
  "breathing reset": "breathing-reset",
  "child's pose flow": "childs-pose-flow",
  "gentle walk": "gentle-walk",
  "treadmill walk": "treadmill-walk",
};

const SOURCE_AVATAR_IDS = {
  "box-breathing": "breathing-reset",
  "brisk-walk": "gentle-walk",
  "bench-step-ups": "step-ups",
  "run-walk": "running",
  "stretch-hips": "hip-flexor-stretch",
  "band-rows": "resistance-band-rows-home",
};

const HOLD_FRAME = {
  plank: 1,
  "side plank": 1,
  "side plank (knees)": 1,
  "hollow hold": 2,
  "wall sit": 2,
  "wall handstand hold": 2,
  "superman hold": 2,
};

export function getWorkoutStepImages(exercise, gender = "female") {
  const name = (exercise?.imageLookupName || exercise?.name || "").trim();
  const canonical = canonicalExercises.get(name.toLowerCase())
    || canonicalExercises.get(exercise?.name?.trim().toLowerCase());
  const sourceId = typeof exercise?.image === "string"
    ? exercise.image.split("/").at(-1)?.replace(/\.(?:png|webp)$/, "")
    : null;
  const alias = RECOVERY_AVATAR_IDS[name.toLowerCase()] || SOURCE_AVATAR_IDS[sourceId] || sourceId;
  const avatarId = canonical?.id || alias;
  const location = exercise?.trainingLocation;
  const sprite = avatarManifest[`${avatarId}-${location}`] || avatarManifest[avatarId];
  if (sprite) {
    const avatar = gender === "male" ? "male" : "female";
    return [0, 1, 2].map((frame) => `${sprite}#avatar=${avatar}&frame=${frame}`);
  }
  const explicit = ownImages(exercise);
  if (explicit.length) return explicit;
  if (canonical) {
    const location = exercise?.trainingLocation;
    const scoped = location === "home" || location === "gym"
      ? ownImages({
        image: canonical[`${location}Image`],
        instructionStepImages: canonical[`${location}InstructionStepImages`],
      })
      : [];
    const images = scoped.length ? scoped : ownImages(canonical);
    if (images.length) return images;
  }
  const mapped = EXERCISE_IMAGE_MAP[name] || EXERCISE_IMAGE_MAP[exercise?.name];
  if (Array.isArray(mapped)) {
    const images = mapped.filter((src) => typeof src === "string" && src.trim());
    if (images.length) return images.slice(0, 3);
  }
  return RECOVERY_IMAGES[name] || [];
}

export function getWorkoutThumbnail(exercise, gender = "female") {
  const frames = getWorkoutStepImages(exercise, gender);
  if (!frames[0]?.includes("#avatar=")) return frames[0] || null;
  const name = (exercise?.name || "").trim().toLowerCase();
  const frame = HOLD_FRAME[name] ?? (name === "child's pose flow" ? 2
    : ["breathing reset", "gentle walk", "treadmill walk"].includes(name) ? 0 : 1);
  return frames[frame] || frames[0];
}

export function getWorkoutPlaybackImages(exercise, gender = "female") {
  const frames = getWorkoutStepImages(exercise, gender);
  const hold = HOLD_FRAME[(exercise?.name || "").trim().toLowerCase()];
  // Hold exercises stay in their working position instead of repeatedly
  // demonstrating the setup. The full three steps remain in the detail view.
  return hold !== undefined && frames[hold]?.includes("#avatar=") ? [frames[hold]] : frames;
}
