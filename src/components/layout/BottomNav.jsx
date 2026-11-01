import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HiHome,
  HiFire,
  HiClipboardDocumentList,
  HiChartBar,
  HiEllipsisHorizontal,
} from "react-icons/hi2";
import { useTranslation } from "../../i18n/useTranslation";
import MobileMoreMenu from "./MobileMoreMenu";

const PRIMARY_TABS = [
  { to: "/dashboard", labelKey: "nav.home", icon: HiHome, end: true },
  { to: "/workout", labelKey: "nav.workout", icon: HiFire, end: true },
  { to: "/nutrition", labelKey: "nav.nutrition", icon: HiClipboardDocumentList },
  { to: "/progress", labelKey: "nav.progress", icon: HiChartBar },
];

const MORE_ACTIVE_PREFIXES = ["/music", "/support", "/settings", "/admin", "/upgrade", "/activities", "/body"];

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_ACTIVE_PREFIXES.some(
    (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`),
  );

  return (
    <>
      <nav className="bottom-nav md:hidden" aria-label={t("nav.mainNavigation")}>
        <div className="bottom-nav-shell">
          <div className="bottom-nav-grid bottom-nav-grid--five">
            {PRIMARY_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    [
                      "bottom-nav-item touch-manipulation",
                      isActive ? "bottom-nav-item--active" : "bottom-nav-item--default",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={isActive ? "bottom-nav-icon bottom-nav-icon--active" : "bottom-nav-icon"}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="bottom-nav-label">{t(tab.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              );
            })}

            <button
              type="button"
              className={[
                "bottom-nav-item touch-manipulation",
                moreOpen || isMoreActive ? "bottom-nav-item--active" : "bottom-nav-item--default",
              ].join(" ")}
              aria-label={t("nav.more")}
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
            >
              <span className={moreOpen || isMoreActive ? "bottom-nav-icon bottom-nav-icon--active" : "bottom-nav-icon"}>
                <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
              </span>
              <span className="bottom-nav-label">{t("nav.more")}</span>
            </button>
          </div>
        </div>
      </nav>

      <MobileMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
