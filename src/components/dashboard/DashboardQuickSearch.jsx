import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { useTranslation } from "../../i18n/useTranslation";

const MAX_RESULTS = 6;

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSearchDestinations(todayKey, t) {
  return [
    {
      id: "dashboard",
      to: "/dashboard",
      emoji: "🏠",
      label: t("nav.dashboard"),
      aliases: ["dashboard", "home", "pocetna", "početna"],
    },
    {
      id: "workout",
      to: "/workout",
      emoji: "🏋️",
      label: t("dashboard.searchWorkoutPlan"),
      aliases: ["plan treninga", "workout", "trening", t("nav.workout")],
    },
    {
      id: "today",
      to: todayKey ? `/workout/day/${todayKey}` : "/workout",
      emoji: "⚡",
      label: t("dashboard.searchTodayWorkout"),
      aliases: ["danasnji trening", "današnji trening", "today", "today's workout", t("dashboard.todayWorkout")],
    },
    {
      id: "nutrition",
      to: "/nutrition",
      emoji: "🥗",
      label: t("nav.nutrition"),
      aliases: ["prehrana", "nutrition", "meals", "obroci"],
    },
    {
      id: "progress",
      to: "/progress",
      emoji: "📈",
      label: t("nav.progress"),
      aliases: ["progress", "napredak", t("nav.progress")],
    },
    {
      id: "body",
      to: "/body",
      emoji: "💧",
      label: t("nav.body"),
      aliases: ["analiza tijela", "body", "body analysis"],
    },
    {
      id: "activities",
      to: "/activities",
      emoji: "🌿",
      label: t("dashboard.searchExtraActivities"),
      aliases: ["dodatne aktivnosti", "activities", "extra", t("nav.activities")],
    },
    {
      id: "music",
      to: "/music",
      emoji: "🎵",
      label: t("nav.music"),
      aliases: ["glazba", "music"],
    },
    {
      id: "support",
      to: "/support",
      emoji: "💬",
      label: t("nav.support"),
      aliases: ["podrska", "podrška", "support"],
    },
    {
      id: "settings",
      to: "/settings",
      emoji: "⚙️",
      label: t("nav.settings"),
      aliases: ["postavke", "settings"],
    },
  ];
}

function matchesQuery(item, query) {
  if (!query) return true;
  const haystack = normalize([item.label, ...(item.aliases || [])].join(" "));
  return haystack.includes(query);
}

export default function DashboardQuickSearch({ todayDateKey }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const destinations = useMemo(
    () => getSearchDestinations(todayDateKey, t),
    [todayDateKey, t],
  );
  const normalizedQuery = normalize(query.trim());

  const results = useMemo(() => {
    return destinations.filter((item) => matchesQuery(item, normalizedQuery)).slice(0, MAX_RESULTS);
  }, [destinations, normalizedQuery]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function goTo(item) {
    if (!item) return;
    navigate(item.to);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      goTo(results[0]);
    }
  }

  return (
    <div className="dashboard-desktop-search-wrap" ref={wrapRef}>
      <label className="dashboard-desktop-search">
        <HiMagnifyingGlass aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("dashboard.searchPlaceholder")}
          autoComplete="off"
          aria-label={t("dashboard.searchPlaceholder")}
          aria-expanded={open}
          aria-controls="dashboard-quick-search-results"
        />
      </label>

      {open && (
        <ul
          id="dashboard-quick-search-results"
          className="dashboard-desktop-search-menu"
          role="listbox"
        >
          {results.length === 0 ? (
            <li className="dashboard-desktop-search-empty">{t("dashboard.searchNoResults")}</li>
          ) : (
            results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="dashboard-desktop-search-item"
                  onClick={() => goTo(item)}
                >
                  <span className="dashboard-desktop-search-item-title">
                    <span aria-hidden>{item.emoji}</span>
                    {item.label}
                  </span>
                  <span className="dashboard-desktop-search-item-hint">
                    {t("dashboard.searchOpen").replace("{name}", item.label)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
