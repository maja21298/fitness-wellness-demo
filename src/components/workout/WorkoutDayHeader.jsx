import { HiArrowLeft, HiArrowRight, HiMusicalNote } from "react-icons/hi2";

export default function WorkoutDayHeader({
  started, dateHeading, focus, exerciseCount, duration, location,
  showMusic, onBack, onMusic, onStart, t,
}) {
  return (
    <header className={`wd-day-header${started ? " wd-day-header--active" : ""}`}>
      <div className="wd-day-toolbar">
        <button type="button" className="wd-back" onClick={onBack}>
          <HiArrowLeft aria-hidden="true" /> {t("workoutDay.backToPlan")}
        </button>
        {showMusic && (
          <button type="button" className="wd-music" onClick={onMusic}>
            <HiMusicalNote aria-hidden="true" /> {t("workoutDay.playMusic")}
          </button>
        )}
      </div>
      <div className="wd-day-heading">
        <p className="wd-day-date">{dateHeading}</p>
        <h1>{focus}</h1>
        <p className="wd-day-summary">
          {exerciseCount} {t("common.exercises")} · {duration} {t("common.min")}
          {location && <> · {location}</>}
        </p>
        {!started && (
          <button type="button" className="wd-start" onClick={onStart}>
            {t("workoutDay.startWorkout")} <HiArrowRight aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
