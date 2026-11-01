const ICON_COLOR_MAP = {
  pink: "text-[var(--color-brand)]",
  purple: "text-[var(--color-brand-secondary)]",
  blue: "text-blue-500",
  orange: "text-orange-500",
};

export default function WellnessPills({ items, className = "", ariaLabel }) {
  return (
    <div
      className={`dashboard-wellness-pills ${className}`}
      role="list"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.active;
        const iconColor = ICON_COLOR_MAP[item.color] || ICON_COLOR_MAP.pink;

        return (
          <div
            key={item.id || item.label}
            role="listitem"
            className={`app-pill min-h-9 w-full justify-center sm:min-h-0 sm:w-auto sm:justify-start ${
              isActive ? "app-pill--active" : ""
            }`}
            aria-label={item.ariaLabel || item.label}
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-white" : iconColor}`}
              aria-hidden
            />
            <span className="truncate">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
