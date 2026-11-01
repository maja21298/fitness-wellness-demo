import { Link } from "react-router-dom";
import { HiPlay } from "react-icons/hi2";

export default function HeroCard({
  eyebrow,
  title,
  description,
  durationMin,
  ctaLabel,
  ctaTo = "/workout",
  progressPct = 0,
  progressLabel,
  icon: Icon,
}) {
  const fraction = Math.min(100, Math.max(0, progressPct)) / 100;
  const circumference = 2 * Math.PI * 42;

  return (
    <section className="app-card dashboard-hero-card overflow-hidden !p-3 sm:!p-4 lg:!p-5">
      <div className="dashboard-hero-card-grid">
        {Icon && (
          <div className="dashboard-hero-icon app-icon-badge app-icon-badge--pink h-11 w-11 rounded-full sm:h-12 sm:w-12 lg:h-14 lg:w-14">
            <Icon className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden />
          </div>
        )}

        <div className="dashboard-hero-copy min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand)]">{eyebrow}</p>
          )}
          <h2 className="mt-0.5 text-base font-bold leading-tight tracking-tight text-gray-950 sm:text-lg lg:text-xl">
            {title}
          </h2>
          {durationMin != null && (
            <p className="mt-0.5 text-xs font-medium text-[var(--color-muted)]">{durationMin} min</p>
          )}
          {description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-muted)]">{description}</p>
          )}
        </div>

        <div className="dashboard-hero-ring shrink-0">
          <div className="relative inline-flex h-14 w-14 items-center justify-center lg:h-16 lg:w-16">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96" aria-hidden>
              <circle cx="48" cy="48" r="42" stroke="var(--color-brand-soft)" strokeWidth="7" fill="none" />
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="var(--color-brand)"
                strokeWidth="7"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - fraction)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-sm font-bold text-gray-900 lg:text-base">{progressPct}%</span>
          </div>
          {progressLabel && (
            <p className="mt-0.5 text-center text-[9px] text-[var(--color-muted)] lg:text-[10px]">{progressLabel}</p>
          )}
        </div>

        <Link
          to={ctaTo}
          className="app-btn-primary dashboard-hero-cta-cell min-h-11 w-full sm:min-h-0 sm:w-auto"
        >
          <HiPlay className="h-4 w-4" aria-hidden />
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
