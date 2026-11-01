import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiXMark,
  HiListBullet,
  HiInformationCircle,
  HiClock,
  HiCube,
  HiBars3BottomLeft,
  HiFire,
} from "react-icons/hi2";
import { getWorkoutStepImages } from "../../utils/workoutExerciseVisual.js";
import { MUSCLE_META } from "../../metadata/muscleMeta";
import { translateMuscle } from "../../i18n/workoutTranslations";
import { splitEquipmentTokens } from "../../utils/equipment";
import ExerciseInstructions from "./ExerciseInstructions";
import ExerciseImage from "./ExerciseImage";

const EQUIP_LABELS = {
  none: { en: "No equipment", hr: "Bez opreme" },
  mat: { en: "Mat", hr: "Prostirka" },
  band: { en: "Resistance band", hr: "Elastična guma" },
  bench: { en: "Bench", hr: "Klupa" },
  wall: { en: "Wall", hr: "Zid" },
  "bench/wall": { en: "Bench or wall", hr: "Klupa ili zid" },
  "chair/bench": { en: "Chair or bench", hr: "Stolica ili klupa" },
  barbell: { en: "Barbell", hr: "Šipka" },
  dumbbell: { en: "Dumbbells", hr: "Bučice" },
  dumbbells: { en: "Dumbbells", hr: "Bučice" },
  cable: { en: "Cable", hr: "Kabel/sajla" },
  kettlebell: { en: "Kettlebell", hr: "Kettlebell" },
  chair: { en: "Chair", hr: "Stolica" },
};

const KNOWN_MUSCLE_TAGS = new Set([
  "chest", "back", "shoulders", "legs", "core", "arms", "cardio", "flexibility", "glutes",
]);

function getEquipParts(exercise, language) {
  const lang = language === "hr" ? "hr" : "en";
  const tokens = splitEquipmentTokens(exercise?.equipment || exercise?.equip || "none");
  const parts = (tokens.length ? tokens : ["none"]).map((token) => {
    const map = EQUIP_LABELS[token];
    return map ? map[lang] : token.charAt(0).toUpperCase() + token.slice(1);
  });
  return parts;
}

function stepTitle(index, t) {
  if (index === 0) return t("workoutDay.startPos");
  if (index === 2) return t("workoutDay.endPos");
  return t("workoutDay.movement");
}

function collectMuscleChips(exercise, language) {
  const chips = [];
  const seen = new Set();
  const push = (raw) => {
    if (!raw) return;
    const normalized = String(raw).trim();
    if (!normalized) return;
    const label = translateMuscle(
      normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase(),
      language,
    ) || normalized;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    chips.push(label);
  };

  const primary = exercise?.muscleGroup || exercise?.muscle;
  if (primary) push(primary);

  const extras = [
    ...(Array.isArray(exercise?.secondaryMuscles) ? exercise.secondaryMuscles : []),
    ...(Array.isArray(exercise?.muscles) ? exercise.muscles : []),
    ...(Array.isArray(exercise?.tags) ? exercise.tags : []),
  ];

  extras.forEach((item) => {
    const token = String(item || "").trim().toLowerCase();
    if (!KNOWN_MUSCLE_TAGS.has(token)) return;
    if (primary && token === String(primary).toLowerCase()) return;
    push(token);
  });

  return chips;
}

export default function ExerciseDetail({
  exercise,
  onClose,
  t = (key: string) => key,
  language = "en",
  gender = "female",
}: {
  exercise?: any;
  onClose?: () => void;
  t?: (key: string) => string;
  language?: string;
  gender?: string;
}) {
  const panelRef = useRef(null);
  const [step, setStep] = useState(0);
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    setStep(0);
    setOpenSection(null);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [exercise?.name, exercise?.id]);

  const images = useMemo(() => getWorkoutStepImages(exercise, gender), [exercise, gender]);

  const safeStep = images.length ? Math.min(step, images.length - 1) : 0;
  const currentImage = images[safeStep] || null;
  const muscleGroup = exercise?.muscleGroup || exercise?.muscle || "core";
  const meta = MUSCLE_META[muscleGroup as keyof typeof MUSCLE_META] || MUSCLE_META.core;
  const description = exercise?.text?.en?.description || "";
  const name = exercise?.text?.en?.name || exercise?.name || "";
  const muscleChips = collectMuscleChips(exercise, language);
  const equipParts = getEquipParts(exercise, language);
  const equipLabel = equipParts.join(" + ");
  const setsReps = exercise?.sets && exercise?.reps
    ? `${exercise.sets} × ${exercise.reps}`
    : (exercise?.note || "—");
  const hasDuration = Boolean(exercise?.duration);
  const durationLabel = language === "hr" ? "Trajanje" : "Duration";
  const durationValue = hasDuration
    ? `${exercise.duration} ${t("common.min")}`
    : "—";
  // Image phases and written instruction lists can have different lengths.
  // Keep the full explanation here; the ordered instructions remain below.
  const instructionText = description;
  const multiStep = images.length > 1;

  const goStep = (next: number) => {
    if (!images.length) return;
    setStep((next + images.length) % images.length);
  };

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  if (!exercise) return null;

  return (
    <section ref={panelRef} className="ex-detail">
      <header className="ex-detail-head">
        <div className="ex-detail-head-copy">
          <h3>{name}</h3>
          {muscleChips.length > 0 ? (
            <div className="ex-detail-chips">
              {muscleChips.map((chip) => (
                <span key={chip} className="ex-detail-chip">{chip}</span>
              ))}
            </div>
          ) : null}
        </div>
        {onClose ? (
          <button type="button" className="ex-detail-close" onClick={onClose} aria-label={t("common.close")}>
            <HiXMark />
          </button>
        ) : null}
      </header>

      <div className="ex-detail-stage">
        {currentImage ? (
          <div className="ex-detail-frame">
            <ExerciseImage
              src={currentImage}
              alt={stepTitle(safeStep, t)}
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div className="ex-detail-placeholder">
            <span aria-hidden>{meta.emoji}</span>
          </div>
        )}
      </div>

      <div className="ex-detail-stats">
        <div className="ex-detail-stat">
          <span className="ex-detail-stat-icon" aria-hidden>
            <HiBars3BottomLeft />
          </span>
          <strong>{setsReps}</strong>
          <span>{`${t("common.sets")} / ${t("common.reps")}`}</span>
        </div>
        <div className="ex-detail-stat">
          <span className="ex-detail-stat-icon" aria-hidden>
            <HiClock />
          </span>
          <strong>{durationValue}</strong>
          <span>{durationLabel}</span>
        </div>
        <div className="ex-detail-stat">
          <span className="ex-detail-stat-icon" aria-hidden>
            <HiCube />
          </span>
          <strong>{equipLabel}</strong>
          <span>{t("workout.equipment")}</span>
        </div>
      </div>

      {multiStep ? (
        <div className="ex-detail-steps">
          <p className="ex-detail-kicker">{t("workoutDay.stepByStep")}</p>
          <div className="ex-detail-dots" role="tablist" aria-label={t("workoutDay.stepByStep")}>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safeStep}
                className={`ex-detail-dot${i === safeStep ? " is-active" : ""}`}
                onClick={() => setStep(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="ex-detail-step-meta">
            {t("workoutDay.step")} {safeStep + 1} {t("workoutDay.of")} {images.length}
          </p>
          <p className="ex-detail-step-title">{stepTitle(safeStep, t)}</p>
          {instructionText ? (
            <p className="ex-detail-step-copy">{instructionText}</p>
          ) : null}
          <div className="ex-detail-nav">
            <button
              type="button"
              className="ex-detail-nav-prev"
              onClick={() => goStep(safeStep - 1)}
            >
              <HiChevronLeft aria-hidden /> {t("workoutDay.previous")}
            </button>
            <button
              type="button"
              className="ex-detail-nav-next"
              onClick={() => goStep(safeStep + 1)}
            >
              {t("common.next")} <HiChevronRight aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        instructionText ? (
          <div className="ex-detail-steps ex-detail-steps--single">
            <p className="ex-detail-kicker">{t("workoutDay.stepByStep")}</p>
            <p className="ex-detail-step-copy">{instructionText}</p>
          </div>
        ) : null
      )}

      <div className="ex-detail-accords">
        <Accordion
          open={openSection === "how"}
          onToggle={() => toggleSection("how")}
          title={t("workoutDay.howTo")}
          icon={<HiListBullet />}
        >
          <ExerciseInstructions exercise={exercise} section="how" t={t} language={language} />
        </Accordion>
        <Accordion
          open={openSection === "mistakes"}
          onToggle={() => toggleSection("mistakes")}
          title={t("workoutDay.commonMistakes")}
          icon={<HiInformationCircle />}
        >
          <ExerciseInstructions exercise={exercise} section="mistakes" t={t} language={language} />
        </Accordion>
        <Accordion
          open={openSection === "equip"}
          onToggle={() => toggleSection("equip")}
          title={t("workout.equipment")}
          icon={<HiFire />}
        >
          <ExerciseInstructions exercise={exercise} section="equip" t={t} language={language} equipParts={equipParts} />
        </Accordion>
      </div>
    </section>
  );
}

function Accordion({ open, onToggle, title, icon, children }) {
  return (
    <div className={`ex-accord${open ? " is-open" : ""}`}>
      <button type="button" className="ex-accord-btn" onClick={onToggle} aria-expanded={open}>
        <span className="ex-accord-label">
          {icon ? <span className="ex-accord-icon" aria-hidden>{icon}</span> : null}
          <span>{title}</span>
        </span>
        <HiChevronDown aria-hidden />
      </button>
      {open ? <div className="ex-accord-body">{children}</div> : null}
    </div>
  );
}
