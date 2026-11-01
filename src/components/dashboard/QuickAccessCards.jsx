import { Link } from "react-router-dom";
import {
  HiCalendarDays,
  HiUserCircle,
  HiBolt,
  HiMusicalNote,
  HiChatBubbleLeftRight,
} from "react-icons/hi2";

const ICON_TONE = {
  pink: "dashboard-quick-icon--pink",
  orange: "dashboard-quick-icon--orange",
  purple: "dashboard-quick-icon--purple",
  blue: "dashboard-quick-icon--blue",
};

function getQuickAccessItems(isHr) {
  return [
    {
      id: "workout",
      to: "/workout",
      title: isHr ? "Plan treninga" : "Workout plan",
      description: isHr ? "Pogledaj plan" : "View plan",
      icon: HiCalendarDays,
      tone: "pink",
    },
    {
      id: "nutrition",
      to: "/nutrition",
      title: isHr ? "Prehrana" : "Nutrition",
      description: isHr ? "Bilježi unos" : "Log intake",
      emoji: "🍎",
      tone: "orange",
    },
    {
      id: "body",
      to: "/body",
      title: isHr ? "Analiza tijela" : "Body analysis",
      description: isHr ? "Mjerenja tijela" : "Body measurements",
      icon: HiUserCircle,
      tone: "purple",
    },
    {
      id: "activities",
      to: "/activities",
      title: isHr ? "Dodatne aktivnosti" : "Extra activities",
      description: isHr ? "Brze ideje" : "Quick ideas",
      icon: HiBolt,
      tone: "blue",
    },
    {
      id: "music",
      to: "/music",
      title: isHr ? "Glazba" : "Music",
      description: isHr ? "Tvoja playlista" : "Your playlist",
      icon: HiMusicalNote,
      tone: "blue",
    },
    {
      id: "support",
      to: "/support",
      title: isHr ? "Podrška" : "Support",
      description: isHr ? "Pomoć & chat" : "Help & chat",
      icon: HiChatBubbleLeftRight,
      tone: "orange",
    },
  ];
}

export default function QuickAccessCards({ isHr = false, className = "" }) {
  const items = getQuickAccessItems(isHr);

  return (
    <nav
      className={`dashboard-quick-grid ${className}`}
      aria-label={isHr ? "Brzi pristup" : "Quick access"}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const toneClass = ICON_TONE[item.tone] || ICON_TONE.pink;

        return (
          <Link key={item.id} to={item.to} className="dashboard-quick-card">
            <span className={`dashboard-quick-icon ${toneClass}`}>
              {item.emoji ? (
                <span className="dashboard-quick-emoji" aria-hidden>
                  {item.emoji}
                </span>
              ) : (
                <Icon className="h-5 w-5" aria-hidden />
              )}
            </span>
            <span className="dashboard-quick-title">{item.title}</span>
            <span className="dashboard-quick-desc">{item.description}</span>
          </Link>
        );
      })}
    </nav>
  );
}
