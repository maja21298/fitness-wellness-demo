import { Link, useLocation } from "react-router-dom";
import { HiMusicalNote } from "react-icons/hi2";
import { useTranslation } from "../../i18n/useTranslation";

export default function FloatingMusicButton() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  if (pathname === "/music") return null;

  return (
    <Link
      to="/music"
      aria-label={t("dashboard.musicTitle")}
      className="fixed z-32 flex h-14 w-14 shrink-0 items-center justify-center rounded-full gradient-bg text-white shadow-lg shadow-primary-200/40 transition-transform hover:opacity-95 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white touch-manipulation md:z-38 max-md:left-[max(1rem,var(--safe-left))] max-md:bottom-[calc(var(--layout-mobile-nav-h)+0.75rem)] md:bottom-8 md:right-[max(1.25rem,var(--safe-right))] md:left-auto"
    >
      <HiMusicalNote className="h-7 w-7 shrink-0" aria-hidden />
    </Link>
  );
}
