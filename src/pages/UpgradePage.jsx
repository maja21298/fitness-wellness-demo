import { useState, useId, createElement } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { useNavigate } from "react-router-dom";
import {
  HiSparkles,
  HiCheck,
  HiCamera,
  HiCpuChip,
  HiChartBar,
  HiAdjustmentsHorizontal,
  HiArrowPath,
  HiShieldCheck,
  HiBolt,
  HiUsers,
  HiChevronDown,
  HiTableCells,
} from "react-icons/hi2";

const FEATURE_KEYS = ["aiScanner", "aiBody", "focusPlans", "unlimitedRegen", "advancedStats", "priority"];

const FEATURE_ICONS = {
  aiScanner: { icon: HiCamera, color: "text-violet-600 bg-violet-100" },
  aiBody: { icon: HiCpuChip, color: "text-indigo-600 bg-indigo-100" },
  focusPlans: { icon: HiAdjustmentsHorizontal, color: "text-pink-600 bg-pink-100" },
  unlimitedRegen: { icon: HiArrowPath, color: "text-emerald-600 bg-emerald-100" },
  advancedStats: { icon: HiChartBar, color: "text-sky-600 bg-sky-100" },
  priority: { icon: HiShieldCheck, color: "text-amber-600 bg-amber-100" },
};

function getCopy(language) {
  if (language === "hr") {
    return {
      compareTitle: "Odaberi paket koji odgovara tvojem cilju",
      compareDesc: "Kreni besplatno, otkljucaj napredne AI alate ili odaberi coaching paket s vecom vrijednosti.",
      compareAccordionTitle: "Usporedba paketa",
      tableFeature: "Funkcija",
      tableFree: "Free",
      tablePremium: "Premium",
      tableCoach: "Coach",
      free: {
        id: "free",
        name: "Free",
        price: "0 EUR",
        note: "osnovni / demo pristup",
        cta: "Trenutno aktivno",
        points: [
          "Demo rezim — uvid u aplikaciju bez punog treninga i AI alata",
          "Ograniceno pracenje napretka i osnovni recepti",
          "Glazba, skener i osnovni dashboard — samo u demo okviru (bez vise treninga i dodatnog workout sadrzaja)",
        ],
      },
      premium: {
        id: "premium",
        name: "Premium",
        badge: "Najbolja vrijednost",
        price: "9,99 EUR/mj",
        note: "iskljucivo mjesečno placanje — godisnjeg plana nema",
        cta: "Premium uskoro stize",
        points: [
          "Više treninga",
          "Dodatni workout sadržaj",
          "Osnovni workout i nutrition planovi",
          "AI Food Scanner i Body Analysis",
          "Neograniceno generiranje planova i planovi prema fokusu",
          "Napredna statistika i brza podrska",
        ],
      },
      coach: {
        id: "coach",
        name: "Coach",
        badge: "Najnaprednije",
        price: "19,99 EUR/mj",
        note: "ili 200 EUR/god. — jedina godisnja opcija u aplikaciji",
        cta: "Coach paket uskoro",
        points: [
          "AI coach chat i tjedne preporuke",
          "Pametne zamjene vjezbi i obroka",
          "Izazovi, pracenje odgovornosti i coach mode",
        ],
      },
      matrixTitle: "Sto korisnik otkljucava po paketu",
      matrixRows: [
        ["Planovi treninga i prehrane", true, true, true],
        ["AI skener i analiza tijela", false, true, true],
        ["Neograniceno generiranje planova", false, true, true],
        ["AI coach chat i pracenje napretka", false, false, true],
      ],
    };
  }

  return {
    compareTitle: "Choose the plan that matches your goal",
    compareDesc: "Start free, unlock advanced AI tools, or move to a coaching tier with more value.",
    compareAccordionTitle: "Package comparison",
    tableFeature: "Feature",
    tableFree: "Free",
    tablePremium: "Premium",
    tableCoach: "Coach",
    free: {
      id: "free",
      name: "Free",
      price: "$0",
      note: "Basic / demo access",
      cta: "Current plan",
      points: [
        "Demo mode — explore the app without full training or AI features",
        "Limited progress tracking and basic saved recipes",
        "Music, scanner, and starter dashboard (no extra training or extended workout content)",
      ],
    },
    premium: {
      id: "premium",
      name: "Premium",
      badge: "Best value",
      price: "9.99 EUR/mo",
      note: "Monthly billing only — no annual subscription",
      cta: "Premium coming soon",
      points: [
        "More training sessions",
        "Extra workout content",
        "Core workout and nutrition plans",
        "AI Food Scanner and Body Analysis",
        "Unlimited plan regeneration and focus plans",
        "Advanced stats and priority support",
      ],
    },
    coach: {
      id: "coach",
      name: "Coach",
      badge: "Most advanced",
      price: "19.99 EUR/mo",
      note: "or 200 EUR/year — the only annual plan in the app",
      cta: "Coach tier coming soon",
      points: [
        "AI coach chat and weekly guidance",
        "Smart exercise and meal substitutions",
        "Challenges, accountability, and coach mode",
      ],
    },
    matrixTitle: "What users unlock in each tier",
    matrixRows: [
      ["Workout and nutrition plans", true, true, true],
      ["AI scanner and body analysis", false, true, true],
      ["Unlimited regeneration", false, true, true],
      ["AI coach chat and accountability", false, false, true],
    ],
  };
}

/** Collapsible panel with smooth height animation (grid-rows). */
function Collapse({ open, children }) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export default function UpgradePage() {
  const { isPremium } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const copy = getCopy(language);

  const [openPlan, setOpenPlan] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [openFeature, setOpenFeature] = useState(null);

  const baseId = useId();

  const plans = [
    {
      ...copy.free,
      style: "border-primary-100/60 bg-white",
      icon: HiBolt,
      iconClass: "bg-gray-100 text-gray-600",
    },
    {
      ...copy.premium,
      style: "border-primary-300 bg-primary-50/40 shadow-lg shadow-primary-100/50",
      icon: HiSparkles,
      iconClass: "gradient-bg text-white",
      featured: true,
    },
    {
      ...copy.coach,
      style: "border-amber-200 bg-amber-50/50",
      icon: HiUsers,
      iconClass: "bg-amber-100 text-amber-700",
    },
  ];

  const togglePlan = (id) => {
    setOpenPlan((prev) => (prev === id ? null : id));
  };

  const toggleFeature = (key) => {
    setOpenFeature((prev) => (prev === key ? null : key));
  };

  if (isPremium) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto text-center space-y-6 py-16">
        <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto flex items-center justify-center">
          <HiCheck className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t("premium.alreadyPremium")}</h1>
        <p className="text-gray-500">{t("premium.alreadyDesc")}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90"
        >
          {t("premium.goToDashboard")}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      <div className="text-center space-y-2 pt-1 sm:pt-2">
        <div className="w-14 h-14 rounded-full gradient-bg mx-auto flex items-center justify-center shadow-sm">
          <HiSparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{t("premium.upgradeTitle")}</h1>
        <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto leading-relaxed">{t("premium.upgradeDesc")}</p>
      </div>

      <div className="app-card space-y-3 sm:!p-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{copy.compareTitle}</h2>
          <p className="text-sm text-gray-500 mt-1.5">{copy.compareDesc}</p>
        </div>

        <div className="flex flex-col gap-2.5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isOpen = openPlan === plan.id;
            const headerId = `${baseId}-plan-${plan.id}-header`;
            const panelId = `${baseId}-plan-${plan.id}-panel`;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border overflow-hidden transition-shadow duration-300 ${plan.style} ${
                  isOpen ? "shadow-md shadow-primary-100/30" : ""
                }`}
              >
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => togglePlan(plan.id)}
                  className={`flex w-full items-center gap-3 sm:gap-4 p-3.5 sm:p-4 text-left min-h-[52px] touch-manipulation hover:bg-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 rounded-2xl transition-colors ${
                    plan.featured ? "ring-1 ring-primary-200/80" : ""
                  }`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${plan.iconClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 gap-y-0">
                      <span className={`font-bold ${plan.featured ? "text-primary-800" : "text-gray-900"}`}>{plan.name}</span>
                      {plan.badge ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${
                          plan.featured
                            ? "bg-primary-600 text-white border-primary-600"
                            : "bg-white/90 text-primary-700 border-primary-100"
                        }`}>
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className={`text-lg sm:text-xl font-bold mt-0.5 ${plan.featured ? "text-primary-700" : "text-gray-900"}`}>{plan.price}</p>
                  </div>
                  <HiChevronDown
                    className={`w-6 h-6 shrink-0 text-gray-400 transition-transform duration-300 ease-out ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>

                <Collapse open={isOpen}>
                  <div id={panelId} role="region" aria-labelledby={headerId} className="px-4 pb-4 sm:px-5 pt-0 border-t border-black/4 bg-white/30">
                    <p className="text-xs text-gray-400 mt-3.5 mb-2.5">{plan.note}</p>
                    <ul className="space-y-1.5 text-sm text-gray-600 mb-4">
                      {plan.points.map((point) => (
                        <li key={point} className="flex items-start gap-2">
                          <HiCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled
                      className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm ${
                        plan.featured
                          ? "gradient-bg text-white opacity-80 cursor-not-allowed"
                          : "bg-white text-gray-500 border border-gray-200 opacity-80 cursor-not-allowed"
                      }`}
                    >
                      <HiSparkles className="w-4 h-4" />
                      {plan.cta}
                    </button>
                  </div>
                </Collapse>
              </div>
            );
          })}
        </div>
      </div>

      <div className="app-card overflow-hidden !p-0">
        <button
          type="button"
          aria-expanded={compareOpen}
          aria-controls={`${baseId}-compare-panel`}
          onClick={() => setCompareOpen((v) => !v)}
          className="flex w-full items-center gap-3 sm:gap-4 p-4 sm:p-5 text-left hover:bg-primary-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 min-h-[52px] touch-manipulation transition-colors"
        >
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center">
            <HiTableCells className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">{copy.compareAccordionTitle}</h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{copy.matrixTitle}</p>
          </div>
          <HiChevronDown
            className={`w-6 h-6 shrink-0 text-gray-400 transition-transform duration-300 ease-out ${
              compareOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        <Collapse open={compareOpen}>
          <div id={`${baseId}-compare-panel`} className="px-3.5 pb-4 sm:px-5 border-t border-gray-100">
            <div className="overflow-x-auto mt-3 -mx-1 px-1">
              <table className="w-full text-sm min-w-[280px]">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-2.5 pr-3 font-semibold">{copy.tableFeature}</th>
                    <th className="py-2.5 px-2 sm:px-3 font-semibold">{copy.tableFree}</th>
                    <th className="py-2.5 px-2 sm:px-3 font-semibold">{copy.tablePremium}</th>
                    <th className="py-2.5 pl-2 sm:pl-3 font-semibold">{copy.tableCoach}</th>
                  </tr>
                </thead>
                <tbody>
                  {copy.matrixRows.map(([label, free, premium, coach]) => (
                    <tr key={label} className="border-b border-gray-50">
                      <td className="py-2.5 pr-3 text-gray-700">{label}</td>
                      <td className="py-2.5 px-2 sm:px-3">
                        {free ? <HiCheck className="w-4 h-4 text-emerald-500" /> : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-2.5 px-2 sm:px-3">
                        {premium ? <HiCheck className="w-4 h-4 text-emerald-500" /> : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-2.5 pl-2 sm:pl-3">
                        {coach ? <HiCheck className="w-4 h-4 text-emerald-500" /> : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Collapse>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 px-1">{t("premium.title")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-6">
          {FEATURE_KEYS.map((key) => {
            const meta = FEATURE_ICONS[key];
            const Icon = meta.icon;
            const selected = openFeature === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                aria-expanded={selected}
                aria-controls={`${baseId}-feat-${key}`}
                onClick={() => toggleFeature(key)}
                className={`flex w-full flex-col items-center text-center gap-2.5 rounded-2xl border px-3.5 py-4 sm:gap-2 sm:min-h-[92px] sm:justify-center sm:py-4 transition-all duration-300 touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${
                  selected
                    ? "border-primary-400 bg-primary-50/80 shadow-md shadow-primary-100/40 sm:scale-[1.02]"
                    : "border-primary-100/60 bg-white hover:border-primary-200 hover:shadow-sm active:scale-[0.98]"
                }`}
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12 sm:rounded-xl ${meta.color} transition-transform duration-300 ${
                    selected ? "sm:scale-110" : ""
                  }`}
                >
                  <Icon className="h-7 w-7 sm:h-6 sm:w-6" />
                </div>
                <span className="w-full text-sm font-semibold leading-snug text-gray-900 sm:text-xs sm:line-clamp-2 sm:px-0.5">
                  {t(`premium.features.${key}`)}
                </span>
                <span className="w-full text-[11px] leading-snug text-gray-500 sm:hidden line-clamp-1 px-1">
                  {t(`premium.featuresDesc.${key}`)}
                </span>
              </button>
            );
          })}
        </div>

        <Collapse open={openFeature !== null}>
          <div className="app-card sm:!p-5">
            {openFeature ? (
              <div id={`${baseId}-feat-${openFeature}`} className="transition-opacity duration-300">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl shrink-0 ${FEATURE_ICONS[openFeature].color} flex items-center justify-center`}
                  >
                    {openFeature &&
                      createElement(FEATURE_ICONS[openFeature].icon, {
                        className: "w-5 h-5",
                      })}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{t(`premium.features.${openFeature}`)}</h3>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{t(`premium.featuresDesc.${openFeature}`)}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </Collapse>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-gray-600 font-medium"
        >
          {t("common.back")}
        </button>
      </div>
    </div>
  );
}
