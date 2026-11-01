import { useEffect, useState } from "react";

const QUERIES = {
  tablet: "(min-width: 40rem)",
  desktop: "(min-width: 64rem)",
};

function getBreakpoint() {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia(QUERIES.desktop).matches) return "desktop";
  if (window.matchMedia(QUERIES.tablet).matches) return "tablet";
  return "mobile";
}

/**
 * Layout tiers aligned with Tailwind sm (640px) and lg (1024px):
 * - mobile: <640px — bottom nav
 * - tablet: 640–1023px — icon-only sidebar
 * - desktop: ≥1024px — full sidebar (user may collapse)
 */
export function useLayoutBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(getBreakpoint);

  useEffect(() => {
    const tabletMq = window.matchMedia(QUERIES.tablet);
    const desktopMq = window.matchMedia(QUERIES.desktop);

    const sync = () => setBreakpoint(getBreakpoint());

    tabletMq.addEventListener("change", sync);
    desktopMq.addEventListener("change", sync);
    return () => {
      tabletMq.removeEventListener("change", sync);
      desktopMq.removeEventListener("change", sync);
    };
  }, []);

  return breakpoint;
}
