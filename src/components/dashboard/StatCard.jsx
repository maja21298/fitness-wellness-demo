const BADGE_MAP = {
  pink: "app-icon-badge--pink",
  purple: "app-icon-badge--purple",
  amber: "app-icon-badge--orange",
  blue: "app-icon-badge--blue",
};

const SPARK_COLOR = {
  pink: "var(--color-brand)",
  purple: "var(--color-brand-secondary)",
};

function DumbbellIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="2.5" y="8.5" width="3.5" height="7" rx="1.25" />
      <rect x="18" y="8.5" width="3.5" height="7" rx="1.25" />
      <rect x="6.5" y="10.75" width="11" height="2.5" rx="0.75" />
    </svg>
  );
}

export { DumbbellIcon };

export default function StatCard({
  icon,
  label,
  value,
  unit,
  changeLabel,
  sparkline,
  progress,
  color = "pink",
}) {
  const StatIcon = icon;
  const badgeClass = BADGE_MAP[color] || BADGE_MAP.pink;
  const sparkColor = SPARK_COLOR[color] || SPARK_COLOR.pink;
  const hasFooter = Boolean(
    (sparkline && sparkline.length > 1) || progress !== undefined,
  );

  return (
    <article className="app-card dashboard-stat-card flex h-full flex-col !p-3.5 sm:!p-4">
      <div className={`app-icon-badge ${badgeClass}`}>
        <StatIcon className="h-4 w-4" aria-hidden />
      </div>

      <p className="dashboard-stat-label mt-2.5">{label}</p>

      <div className="mt-1 flex items-baseline gap-1">
        <p className="dashboard-stat-value">{value}</p>
        {unit && <span className="dashboard-stat-unit">{unit}</span>}
      </div>

      {changeLabel && (
        <p className="dashboard-stat-change mt-1">{changeLabel}</p>
      )}

      <div className={`dashboard-stat-footer mt-auto ${hasFooter ? "pt-2.5" : "pt-1"}`}>
        {sparkline && sparkline.length > 1 && (
          <div className="dashboard-stat-sparkline" aria-hidden>
            <svg className="h-full w-full" viewBox="0 0 100 24" preserveAspectRatio="none">
              <polyline
                points={sparkline
                  .map((val, i) => {
                    const max = Math.max(...sparkline, 1);
                    return `${(i / (sparkline.length - 1)) * 100},${24 - (val / max) * 20}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={sparkColor}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {progress !== undefined && (
          <div
            className="dashboard-stat-progress"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="dashboard-stat-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
