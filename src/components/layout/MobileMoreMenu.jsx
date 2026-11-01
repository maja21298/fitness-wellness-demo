import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiMusicalNote,
  HiChatBubbleLeftRight,
  HiCog6Tooth,
  HiShieldCheck,
  HiXMark,
} from "react-icons/hi2";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../i18n/useTranslation";

export default function MobileMoreMenu({ open, onClose }) {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();

  const items = [
    { to: "/music", labelKey: "nav.music", icon: HiMusicalNote },
    { to: "/support", labelKey: "nav.support", icon: HiChatBubbleLeftRight },
    { to: "/settings", labelKey: "nav.settings", icon: HiCog6Tooth },
    ...(isAdmin ? [{ to: "/admin", labelKey: "nav.admin", icon: HiShieldCheck }] : []),
  ];

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="mobile-more-menu" role="presentation">
      <button
        type="button"
        className="mobile-more-menu-backdrop"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div
        className="mobile-more-menu-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-more-menu-title"
      >
        <div className="mobile-more-menu-header">
          <h2 id="mobile-more-menu-title" className="mobile-more-menu-title">
            {t("nav.moreOptions")}
          </h2>
          <button
            type="button"
            className="mobile-more-menu-close"
            aria-label={t("common.close")}
            onClick={onClose}
          >
            <HiXMark className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mobile-more-menu-list">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="mobile-more-menu-item"
                onClick={onClose}
              >
                <span className="mobile-more-menu-item-icon" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mobile-more-menu-item-label">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
