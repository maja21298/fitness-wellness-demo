import { useMemo, useState } from "react";
import {
  HiArrowLeft,
  HiArrowRight,
  HiCheck,
  HiChevronDown,
  HiClock,
  HiPause,
  HiPlay,
  HiArrowRightCircle,
  HiSparkles,
} from "react-icons/hi2";
import { getWorkoutPlaybackImages } from "../../utils/workoutExerciseVisual.js";
import { splitEquipmentTokens } from "../../utils/equipment";
import ExerciseAnimation from "../exercise/ExerciseAnimation";
import ExerciseInstructions from "../exercise/ExerciseInstructions";
import ExerciseStepAnimation from "./ExerciseStepAnimation";

const EQUIP_LABELS = {
  none: { en: "No equipment", hr: "Bez opreme" },
  mat: { en: "Mat", hr: "Prostirka" },
  band: { en: "Resistance band", hr: "Elastična guma" },
  bench: { en: "Bench", hr: "Klupa" },
  wall: { en: "Wall", hr: "Zid" },
  barbell: { en: "Barbell", hr: "Šipka" },
  dumbbell: { en: "Dumbbells", hr: "Bučice" },
  dumbbells: { en: "Dumbbells", hr: "Bučice" },
  cable: { en: "Cable", hr: "Kabel" },
  kettlebell: { en: "Kettlebell", hr: "Kettlebell" },
  chair: { en: "Chair", hr: "Stolica" },
};

const PINK = {
  deep: "#F0518B",
  track: "#FCE0E9",
};

function getEquipLabel(exercise, language) {
  const lang = language === "hr" ? "hr" : "en";
  const tokens = splitEquipmentTokens(exercise?.equipment || exercise?.equip || "none");
  const parts = (tokens.length ? tokens : ["none"]).map((token) => {
    const map = EQUIP_LABELS[token];
    return map ? map[lang] : token.charAt(0).toUpperCase() + token.slice(1);
  });
  return parts.join(" · ");
}

function getExerciseCopy(exercise, language) {
  const pack = exercise?.text?.en;
  const steps = pack?.instructions || exercise?.instructions || exercise?.steps || [];
  return pack?.description
    || exercise?.contextDesc
    || steps.filter((step) => typeof step === "string").join(" ");
}

function TimerRing({ timer, maxTimer, label, formatTime }) {
  const pct = maxTimer > 0 ? Math.min(1, Math.max(0, timer / maxTimer)) : 0;
  const r = 42;
  const circ = 2 * Math.PI * r;
  return (
    <div className="aw-timer" aria-live="polite">
      <svg viewBox="0 0 100 100" className="aw-timer-svg">
        <circle cx="50" cy="50" r={r} fill="none" stroke={PINK.track} strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={PINK.deep}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.5s linear" }}
        />
      </svg>
      <div className="aw-timer-center">
        <span className="aw-timer-value">{formatTime(timer)}</span>
        <span className="aw-timer-label">{label}</span>
      </div>
    </div>
  );
}

function DotRow({ total, active }) {
  if (!total || total < 1) return null;
  return (
    <div className="aw-dots" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`aw-dot${i === active ? " is-active" : i < active ? " is-done" : ""}`} />
      ))}
    </div>
  );
}

export default function ActiveWorkoutFocus({
  exercise,
  gender = "female",
  currentExIdx,
  exerciseCount,
  currentSet,
  phase,
  timer,
  running,
  t,
  language,
  formatTime,
  getMaxTimer,
  onToggleTimer,
  onPreviousExercise,
  onNextExercise,
}) {
  const isHr = language === "hr";
  const [tipsOpen, setTipsOpen] = useState(false);

  const images = useMemo(() => getWorkoutPlaybackImages(exercise, gender), [exercise, gender]);
  const sets = exercise?.sets || 1;
  const name = isHr
    ? (exercise?.text?.en?.name || exercise?.name || "")
    : (exercise?.text?.en?.name || exercise?.name || "");
  const equipLabel = getEquipLabel(exercise, language);
  const instruction = getExerciseCopy(exercise, language);
  const equipParts = useMemo(() => {
    const tokens = splitEquipmentTokens(exercise?.equipment || exercise?.equip || "none");
    const lang = isHr ? "hr" : "en";
    return (tokens.length ? tokens : ["none"]).map((token) => {
      const map = EQUIP_LABELS[token];
      return map ? map[lang] : token.charAt(0).toUpperCase() + token.slice(1);
    });
  }, [exercise, isHr]);

  const hasHow = Boolean(exercise?.text?.en?.instructions?.length || exercise?.instructions?.length);
  const hasMistakes = Boolean(exercise?.text?.en?.commonMistakes?.length);
  const showTips = hasHow || hasMistakes || equipParts.length > 0;

  const isRest = phase === "rest";
  const remainingLabel = isRest
    ? t("workoutDay.restRemaining")
    : isHr
      ? "preostalo"
      : "remaining";

  return (
    <section className={`aw-focus aw-focus--spacious${isRest ? " aw-focus--rest" : ""}`} aria-label={isHr ? "Aktivni trening" : "Active workout"}>
      <header className="aw-focus-top">
        <p className="aw-kicker">
          {isRest ? t("workoutDay.rest") : t("workoutDay.exercise")} {currentExIdx + 1} / {exerciseCount}
        </p>
        <DotRow total={exerciseCount} active={currentExIdx} />
        <p className="aw-kicker aw-kicker--set">
          {t("workoutDay.set")} {isRest ? "—" : `${currentSet} / ${sets}`}
        </p>
      </header>


      {isRest ? (
        <div className="aw-rest">
          <h2 className="aw-rest-title">{t("workoutDay.rest")}</h2>
          <p className="aw-rest-copy">{t("workoutDay.restHint")}</p>
          <div className="aw-rest-next">
            <span>{t("workoutDay.nextExercise")}</span>
            <strong>{name}</strong>
          </div>
          <TimerRing
            timer={timer}
            maxTimer={getMaxTimer(exercise, phase)}
            label={remainingLabel}
            formatTime={formatTime}
          />
          <button type="button" className="aw-btn-primary" onClick={onToggleTimer}>
            {running ? <HiPause /> : <HiPlay />}
            {running ? (isHr ? "Pauza" : "Pause") : (isHr ? "Nastavi" : "Resume")}
          </button>
        </div>
      ) : (
        <>
          <div className="aw-title-block">
            <h2 className="aw-title">{name}</h2>
            <p className="aw-meta">
              <span>{sets} × {exercise?.reps || 1}</span>
              {exercise?.duration ? (
                <span><HiClock /> {exercise.duration} {t("common.min")}</span>
              ) : null}
              {equipLabel ? <span>{equipLabel}</span> : null}
            </p>
            <DotRow total={sets} active={currentSet - 1} />
          </div>

          <div className="aw-focus-body">
            <div className="aw-visual">
              {images.length ? (
                <ExerciseStepAnimation
                  key={images.join("|")}
                  images={images}
                  running={running}
                  label={`${name} — ${t("workoutDay.stepByStep")}`}
                  fallback={<div className="aw-frame aw-frame--fallback"><ExerciseAnimation exercise={exercise} gender={gender} size="lg" /></div>}
                />
              ) : (
                <div className="aw-frame aw-frame--fallback">
                  <ExerciseAnimation exercise={exercise} gender={gender} size="lg" />
                </div>
              )}

            </div>

            <div className="aw-side">
              <div className="aw-control-row">
                <button type="button" className="aw-control-nav" onClick={onPreviousExercise} disabled={currentExIdx <= 0}
                  aria-label={isHr ? "Prethodna vježba" : "Previous exercise"}>
                  <span className="aw-control-icon"><HiArrowLeft aria-hidden="true" /></span>
                  <span>{isHr ? "Prethodna" : "Previous"}</span>
                </button>
              <TimerRing
                timer={timer}
                maxTimer={getMaxTimer(exercise, phase)}
                label={remainingLabel}
                formatTime={formatTime}
              />
                <button type="button" className="aw-control-nav" onClick={onNextExercise}
                  aria-label={currentExIdx >= exerciseCount - 1 ? t("common.finish") : (isHr ? "Sljedeća vježba" : "Next exercise")}>
                  <span className="aw-control-icon">{currentExIdx >= exerciseCount - 1 ? <HiCheck aria-hidden="true" /> : <HiArrowRight aria-hidden="true" />}</span>
                  <span>{currentExIdx >= exerciseCount - 1 ? t("common.finish") : (isHr ? "Sljedeća" : "Next")}</span>
                </button>
              </div>
              <button type="button" className="aw-btn-primary" onClick={onToggleTimer}>
                {running ? <HiPause /> : <HiPlay />}
                {running ? (isHr ? "Pauza" : "Pause") : (isHr ? "Nastavi" : "Resume")}
              </button>
            </div>
          </div>

          {instruction && (
            <div className="aw-instruction">
              <p className="aw-instruction-kicker">
                {t("workoutDay.howTo")}
              </p>
              <p className="aw-instruction-copy">{instruction}</p>
            </div>
          )}
        </>
      )}

      {isRest && <div className="aw-ex-nav">
        <button
          type="button"
          className="aw-btn-ghost"
          onClick={onPreviousExercise}
          disabled={currentExIdx <= 0}
          aria-label={isHr ? "Prethodna vježba" : "Previous exercise"}
        >
          <HiArrowLeft aria-hidden="true" /> <span>{isHr ? "Prethodna" : "Previous"}</span>
        </button>
        <button type="button" className="aw-btn-ghost" onClick={onNextExercise}
          aria-label={isHr ? "Preskoči odmor" : "Skip rest"}>
          <span>{isHr ? "Preskoči odmor" : "Skip rest"}</span>
          <HiArrowRight aria-hidden="true" />
        </button>
      </div>}

      {!isRest && showTips && (
        <div className={`aw-tips${tipsOpen ? " is-open" : ""}`}>
          <button
            type="button"
            className="aw-tips-toggle"
            onClick={() => setTipsOpen((open) => !open)}
            aria-expanded={tipsOpen}
          >
            <span>ⓘ {isHr ? "Tehnika i savjeti" : "Technique & tips"}</span>
            <HiChevronDown />
          </button>
          {tipsOpen && (
            <div className="aw-tips-body">
              {hasHow && (
                <>
                  <p className="aw-tips-heading">{t("workoutDay.howTo")}</p>
                  <ExerciseInstructions exercise={exercise} section="how" t={t} language={language} />
                </>
              )}
              {hasMistakes && (
                <>
                  <p className="aw-tips-heading">{t("workoutDay.commonMistakes")}</p>
                  <ExerciseInstructions exercise={exercise} section="mistakes" t={t} language={language} />
                </>
              )}
              {equipParts.length > 0 && (
                <>
                  <p className="aw-tips-heading">{t("workout.equipment")}</p>
                  <ExerciseInstructions
                    exercise={exercise}
                    section="equip"
                    t={t}
                    language={language}
                    equipParts={equipParts}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function WorkoutCompleteCard({
  durationMin,
  exerciseCount,
  t,
  language,
  onFinish,
}) {
  const isHr = language === "hr";
  const [saving, setSaving] = useState(false);
  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    try { await onFinish(); }
    finally { setSaving(false); }
  };
  return (
    <section className="aw-complete aw-complete--premium" aria-labelledby="workout-complete-title" aria-live="polite">
      <div className="aw-complete-art" aria-hidden="true">
        <HiSparkles className="aw-complete-sparkle" />
        <span className="aw-complete-seal"><HiCheck /></span>
        <span className="aw-complete-dot" />
      </div>
      <div className="aw-complete-copy">
        <span className="aw-complete-eyebrow">{isHr ? "Trening završen" : "Workout complete"}</span>
        <h2 id="workout-complete-title">{isHr ? "Odlično odrađeno!" : "You did it!"}</h2>
        <p>{isHr ? "Još jedan korak prema tvom cilju. Odvoji trenutak za sebe i udahni." : "Another step towards your goal. Take a moment for yourself and catch your breath."}</p>
      </div>
      <dl className="aw-complete-stats">
        <div><dt><HiCheck aria-hidden="true" /> {isHr ? "Odrađene vježbe" : "Exercises completed"}</dt><dd>{exerciseCount}<span> / {exerciseCount}</span></dd></div>
        <div><dt><HiClock aria-hidden="true" /> {isHr ? "Trajanje plana" : "Planned duration"}</dt><dd>{durationMin}<span> {t("common.min")}</span></dd></div>
      </dl>
      <button type="button" className="aw-btn-primary aw-complete-save" onClick={handleFinish} disabled={saving} aria-busy={saving}>
        {saving ? (isHr ? "Spremanje…" : "Saving…") : (isHr ? "Spremi trening" : "Save workout")}
        {!saving && <HiArrowRightCircle aria-hidden="true" />}
      </button>
      <p className="aw-complete-note">{isHr ? "Spremi trening kako bi se zabilježio u tvom napretku." : "Save your workout to add it to your progress."}</p>
    </section>
  );
}
