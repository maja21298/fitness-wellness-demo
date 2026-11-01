import { HiCheckCircle, HiMap } from "react-icons/hi2";

export default function RecommendedDirectionCard({
  description,
  items = [],
  ctaLabel,
  onSubmit,
  isHr = false,
  className = "",
}) {
  return (
    <section className={`app-card dashboard-direction-card !p-3.5 sm:!p-4 ${className}`}>
      <div className="dashboard-direction-header">
        <h3 className="dashboard-direction-title">
          {isHr ? "Preporučeni smjer" : "Recommended direction"}
        </h3>
        <span className="dashboard-direction-icon" aria-hidden>
          <HiMap className="h-4 w-4" />
        </span>
      </div>

      {description && <p className="dashboard-direction-desc">{description}</p>}

      <ul className="dashboard-direction-list">
        {items.map((item) => (
          <li key={item.id} className="dashboard-direction-item">
            <HiCheckCircle className="dashboard-direction-check" aria-hidden />
            <span>{isHr ? item.labelHr : item.labelEn}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSubmit}
        className="app-btn-primary dashboard-direction-cta w-full sm:w-auto"
      >
        {ctaLabel || (isHr ? "Pošalji plan" : "Send plan")}
      </button>
    </section>
  );
}
