import { NavLink } from "react-router-dom";
import { format } from "date-fns";
import {
  HiHome,
  HiCalendarDays,
  HiBolt,
  HiClipboardDocumentList,
  HiChartBar,
  HiCog6Tooth,
  HiArrowRightOnRectangle,
  HiUserCircle,
  HiShieldCheck,
  HiLightBulb,
  HiChatBubbleLeftRight,
  HiMusicalNote,
  HiMegaphone,
  HiSparkles,
} from "react-icons/hi2";
import { useAuth } from "../../contexts/AuthContext";

const XP_CURRENT = 1840;
const XP_MAX = 3000;
const XP_LEVEL = 8;

export default function Sidebar({ collapsed = false, onToggle }) {
  const { user, isAdmin, isPremium } = useAuth();
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const displayName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Alex";
  const xpPercent = Math.min(100, Math.round((XP_CURRENT / XP_MAX) * 100));

  const sidebarWidth = collapsed ? "sidebar-nav--collapsed" : "sidebar-nav--expanded";

  const primaryLinks = [
    { to: "/dashboard", label: "Dashboard", icon: HiHome, end: true },
    { to: "/workout", label: "Workout Plan", icon: HiCalendarDays, end: true },
    { to: `/workout/day/${todayIso}`, label: "Today’s Workout", icon: HiBolt },
    { to: "/nutrition", label: "Nutrition", icon: HiClipboardDocumentList },
    { to: "/progress", label: "Progress", icon: HiChartBar },
    { to: "/body", label: "Body Analysis", icon: HiUserCircle },
    { to: "/activities", label: "Extra Activities", icon: HiLightBulb },
    { to: "/music", label: "Music", icon: HiMusicalNote },
  ];

  const utilityLinks = [
    { to: "/support", label: "Support", icon: HiChatBubbleLeftRight },
    ...(isAdmin ? [{ to: "/admin", label: "Admin panel", icon: HiShieldCheck }] : []),
    { to: "/settings", label: "Settings", icon: HiCog6Tooth },
    ...(!isPremium ? [{ to: "/upgrade", label: "Premium", icon: HiMegaphone }] : []),
  ];

  return (
    <aside className={`sidebar-nav hidden md:flex ${sidebarWidth} fixed left-0 top-0 z-30 h-dvh flex-col overflow-hidden transition-[width] duration-300`}>
      <div className="flex h-full flex-col px-3 py-4">

        <div className={`sidebar-nav-brand mb-4 flex items-center ${collapsed ? "justify-center" : "gap-3 px-1"}`}>
          <span className="sidebar-nav-brand-icon" aria-hidden>
            <HiSparkles className="h-[18px] w-[18px]" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold uppercase leading-none text-[#3a2a3f]">MAJA</p>
              <p className="mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.28em] text-[#9a8aa0]">FITNESS</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav-scroll scrollbar-none min-h-0 flex-1 overflow-x-hidden" aria-label="Main navigation">
          <div className="space-y-1">
            {primaryLinks.map((item) => (
              <SidebarLink key={`${item.to}-${item.label}`} item={item} collapsed={collapsed} />
            ))}
          </div>

          <div className="sidebar-nav-divider my-2.5" aria-hidden />

          <div className="space-y-1">
            {utilityLinks.map((item) => (
              <SidebarLink key={`${item.to}-${item.label}`} item={item} collapsed={collapsed} utility />
            ))}
          </div>
        </nav>

        <div className="sidebar-nav-footer mt-3 space-y-1">
          {!collapsed && (
            <div className="sidebar-nav-profile">
              <div className="flex items-center gap-2.5">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="sidebar-nav-profile-avatar">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-[#3a2a3f]">{displayName}</p>
                  <p className="text-[10px] font-semibold text-[#f0518b]">Level {XP_LEVEL}</p>
                </div>
              </div>
              <div className="sidebar-nav-profile-track">
                <div className="sidebar-nav-profile-fill" style={{ width: `${xpPercent}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-[#9a8aa0]">
                {XP_CURRENT.toLocaleString("en-US")} / {XP_MAX.toLocaleString("en-US")} XP
              </p>
            </div>
          )}

          <button
            disabled
            type="button"
            className={`sidebar-nav-logout ${collapsed ? "justify-center px-2" : "gap-2.5 px-2.5"}`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              <HiArrowRightOnRectangle className="h-4 w-4" />
            </span>
            {!collapsed && <span>Demo Mode</span>}
          </button>
        </div>
      </div>

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="sidebar-nav-toggle"
        >
          <span className="h-2 w-2 rounded-full bg-current" />
        </button>
      )}
    </aside>
  );
}

function SidebarLink({ item, collapsed = false, utility = false }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "sidebar-nav-link",
          collapsed ? "sidebar-nav-link--collapsed" : "",
          isActive ? "sidebar-nav-link--active" : utility ? "sidebar-nav-link--utility" : "",
        ].join(" ")
      }
    >
      <span className="sidebar-nav-link-icon">
        <Icon className="h-4 w-4" />
      </span>
      {!collapsed && <span className="sidebar-nav-link-label">{item.label}</span>}
    </NavLink>
  );
}
