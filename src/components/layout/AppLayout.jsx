import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useA11y } from "../../contexts/AccessibilityContext";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import MiniPlayer from "../music/MiniPlayer";
import { useLayoutBreakpoint } from "../../hooks/useLayoutBreakpoint";

export default function AppLayout() {
  const { userGoal, saveGoal } = useAuth();
  const breakpoint = useLayoutBreakpoint();
  const [userSidebarCollapsed, setUserSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const isTablet = breakpoint === "tablet";
  const isMobile = breakpoint === "mobile";
  const isDesktop = breakpoint === "desktop";
  const sidebarCollapsed = isTablet || (isDesktop && userSidebarCollapsed);

  useEffect(() => {
    if (!isDesktop) return;
    try {
      localStorage.setItem("sidebar_collapsed", String(userSidebarCollapsed));
    } catch {
      // Ignore storage errors so layout remains usable in private/restricted contexts.
    }
  }, [userSidebarCollapsed, isDesktop]);

  const mainMarginClass = isMobile
    ? ""
    : isDesktop && !sidebarCollapsed
      ? "sm:ml-[var(--layout-sidebar-w-collapsed)] lg:ml-[var(--layout-sidebar-w)]"
      : "sm:ml-[var(--layout-sidebar-w-collapsed)]";

  const mainPaddingClass = isMobile
    ? "pb-[max(5.25rem,calc(var(--layout-mobile-nav-h)+0.75rem))]"
    : "sm:pb-5 lg:pb-6";

  return (
    <div className="min-h-screen min-h-[100dvh] overflow-x-hidden bg-surface selection:bg-primary-100 selection:text-primary-900">
      {!isMobile && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={isDesktop ? () => setUserSidebarCollapsed((value) => !value) : undefined}
        />
      )}

      <main
        className={`pt-1.5 sm:pt-2 md:pt-3 lg:pt-4 safe-top transition-[margin] duration-300 ${mainPaddingClass} ${mainMarginClass}`}
      >
        <div className="app-shell-inner py-2 sm:py-3 md:py-4 lg:py-5">
          <div className="demo-preview-ribbon" role="note">
            <span className="demo-preview-dot" /> INTERACTIVE PREVIEW
            <span className="demo-preview-sep">·</span> Sample data only
            <span className="demo-preview-sep">·</span> No account required
            <div className="demo-preview-controls">
              <label htmlFor="demo-avatar-choice">Avatar</label>
              <select id="demo-avatar-choice" value={userGoal?.gender === 'male' ? 'male' : 'female'} onChange={(event) => saveGoal({...userGoal,gender:event.target.value})}>
                <option value="female">Female</option><option value="male">Male</option>
              </select>
            </div>
          </div>
          <Outlet />
        </div>
      </main>

      <MiniPlayer />
      {isMobile && <BottomNav />}
    </div>
  );
}
