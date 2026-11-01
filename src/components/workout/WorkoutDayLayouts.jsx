import { HiChevronRight, HiClock, HiOutlinePhoto } from "react-icons/hi2";
import { getWorkoutThumbnail } from "../../utils/workoutExerciseVisual.js";
import ExerciseImage from "../exercise/ExerciseImage";

export default function WorkoutDayLayouts({ exercises, onOpen, t, language = "en", gender = "female" }) {
  return (
    <div className="wd-cards-grid wd-cards-grid--illustrated">
      {exercises.map((exercise, index) => {
        const name = exercise?.text?.[language]?.name || exercise?.text?.en?.name || exercise?.name || "";
        const image = getWorkoutThumbnail(exercise, gender);
        return (
          <button key={`${exercise.id || exercise.name}-${index}`} type="button" className="wd-exercise-card"
            onClick={() => onOpen(exercise)}>
            <span className="wd-exercise-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="wd-exercise-thumbnail" aria-hidden="true">
              {image ? <ExerciseImage src={image} alt="" loading="lazy" decoding="async"
                onError={(event) => { event.currentTarget.hidden = true; }} /> : <HiOutlinePhoto />}
            </span>
            <span className="wd-exercise-copy">
              <span className="wd-exercise-name">{name}</span>
              <span className="wd-exercise-meta">
                {exercise.duration > 0
                  ? <><HiClock aria-hidden="true" /> {exercise.duration} {t("common.min")}</>
                  : <>{exercise.sets || 1} {t("common.sets")} × {exercise.reps || 1}</>}
              </span>
            </span>
            <HiChevronRight className="wd-exercise-chevron" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
