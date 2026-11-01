import { HiBell } from "react-icons/hi2";
import { useAuth } from "../../contexts/AuthContext";

const PINK_DEEP = "#F0518B";

export default function MobilePageHeader({ title, subtitle, emoji }) {
  const { user } = useAuth();
  const firstName = (user?.displayName || user?.email?.split("@")[0] || "Maja").split(" ")[0] || "Maja";
  const letter = (firstName[0] || "M").toUpperCase();

  return (
    <header className="app-mobile-header">
      <div className="app-mobile-header-row">
        <h1 className="app-mobile-header-title">
          <span className="app-mobile-header-title-text">{title}</span>
          {emoji ? (
            <span className="app-mobile-header-emoji" aria-hidden>
              {emoji}
            </span>
          ) : null}
        </h1>
        <div className="app-mobile-header-actions">
          <span className="app-mobile-header-bell" aria-hidden>
            <HiBell style={{ width: 18, height: 18, color: PINK_DEEP }} />
            <span className="app-mobile-header-bell-dot" />
          </span>
          <div className="app-mobile-header-avatar" aria-hidden>
            {letter}
          </div>
        </div>
      </div>
      {subtitle ? <p className="app-mobile-header-subtitle">{subtitle}</p> : null}
    </header>
  );
}
