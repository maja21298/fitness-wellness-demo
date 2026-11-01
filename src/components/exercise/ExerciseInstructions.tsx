function exerciseUsesNonNoneEquipment(exercise) {
  const raw = exercise?.equipment;
  const tokens = Array.isArray(raw)
    ? raw.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
    : String(exercise?.equip || "none")
        .split(/[+/]/)
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean);
  return tokens.some((token) => token !== "none");
}

export default function ExerciseInstructions({ exercise, section, t, language, equipParts = [] }) {
  const english = exercise?.text?.en;
  if (!english && section !== "equip") return null;

  if (section === "how") {
    const steps = english?.instructions || [];
    if (!steps.length) return null;
    return (
      <ol className="ex-how">
        {steps.map((step, index) => (
          <li key={`${exercise.id}-step-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    );
  }

  if (section === "mistakes") {
    const items = english?.commonMistakes || [];
    if (!items.length) return null;
    return (
      <ul className="ex-mistakes">
        {items.map((item, index) => (
          <li key={`${exercise.id}-mistake-${index}`}>
            <span aria-hidden>⚠</span>
            <p>{item}</p>
          </li>
        ))}
      </ul>
    );
  }

  const showHomeAlternativesHint = exerciseUsesNonNoneEquipment(exercise);
  const labels = equipParts.length ? equipParts : [];

  return (
    <div className="ex-equip">
      {labels.map((label) => (
        <p key={label}>{label}</p>
      ))}
      {english?.equipmentGuide ? <p>{english.equipmentGuide}</p> : null}
      {showHomeAlternativesHint ? (
        <p className="ex-equip-alt">
          {t
            ? t("workoutDay.noEquipmentAlt")
            : "No equipment? Use a lighter variation."}
        </p>
      ) : null}
    </div>
  );
}
