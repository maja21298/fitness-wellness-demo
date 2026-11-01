import { HiCalendarDays, HiBell } from "react-icons/hi2";

export default function DashboardHeader({
  greeting,
  subtitle,
  date,
  notificationCount = 0,
  onNotificationsClick,
}) {
  const showBadge = notificationCount > 0;
  const badgeLabel =
    notificationCount > 99 ? "99+" : String(notificationCount);

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-copy min-w-0">
        <h1 className="dashboard-header-greeting">{greeting}</h1>
        {subtitle && <p className="dashboard-header-subtitle">{subtitle}</p>}
      </div>

      <div className="dashboard-header-actions shrink-0">
        {date && (
          <span className="dashboard-date-pill app-date-pill">
            <HiCalendarDays className="dashboard-date-pill-icon" aria-hidden />
            <span className="dashboard-date-pill-text">{date}</span>
          </span>
        )}

        <button
          type="button"
          className="dashboard-notify-btn touch-target"
          aria-label={
            showBadge
              ? `Notifications, ${notificationCount} unread`
              : "Notifications"
          }
          onClick={onNotificationsClick}
        >
          <HiBell className="dashboard-notify-icon" aria-hidden />
          {showBadge && (
            <span className="dashboard-notify-badge" aria-hidden>
              {badgeLabel}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
