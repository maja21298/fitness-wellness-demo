import type { ReactNode } from "react";
import { getWorkoutThumbnail } from "../../utils/workoutExerciseVisual.js";
import ExerciseImage from "./ExerciseImage";
import { MUSCLE_META } from "../../metadata/muscleMeta";

/** Kanonski oblik animation polja (legacy; UI više ne renderira SVG animacije). */
export type ExerciseAnimationPayload = {
  key: string;
  type: string;
  loop?: boolean;
};

export type ExerciseAnimationExercise = {
  animation?: ExerciseAnimationPayload;
  muscleGroup?: string;
  muscle?: string;
  name?: string;
  imageLookupName?: string;
  text?: { en?: { name?: string }; hr?: { name?: string } };
  /** Lokalna ili apsolutna putanja do glavne slike vježbe. */
  image?: string;
};

export type ExerciseAnimationProps = {
  animation?: ExerciseAnimationPayload;
  exercise?: ExerciseAnimationExercise;
  size?: "sm" | "lg";
  highlight?: boolean;
  gender?: string;
};

export default function ExerciseAnimation({
  exercise,
  size = "sm",
  highlight = false,
  gender = "female",
}: ExerciseAnimationProps) {
  const muscleGroup = exercise?.muscleGroup || exercise?.muscle || "core";
  const meta = MUSCLE_META[muscleGroup] || MUSCLE_META.core;
  const imageSrc = getWorkoutThumbnail(exercise, gender);

  const containerClass =
    size === "lg"
      ? `w-full max-w-sm rounded-3xl bg-gradient-to-br ${meta.color} mx-auto flex items-center justify-center overflow-hidden shadow-lg ring-1 ring-white/40 p-4`
      : `w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-br ${
          highlight ? meta.color : "from-gray-100 to-gray-50"
        }`;

  if (!imageSrc) {
    const emojiSize = size === "lg" ? "text-5xl" : "text-lg";
    return (
      <div className={containerClass}>
        <span className={emojiSize} role="img" aria-hidden="true">{meta.emoji}</span>
      </div>
    );
  }

  const innerFrameClass = size === "lg" ? "w-full" : "h-9 w-9";

  const body: ReactNode = (
    <div className={`${innerFrameClass} max-h-full max-w-full`}>
      <ExerciseImage
        src={imageSrc}
        alt=""
        className={
          size === "lg"
            ? "w-full rounded-2xl object-contain object-center"
            : "h-full w-full max-h-full max-w-full object-contain object-center"
        }
        decoding="async"
        loading="lazy"
      />
    </div>
  );

  return <div className={containerClass}>{body}</div>;
}
