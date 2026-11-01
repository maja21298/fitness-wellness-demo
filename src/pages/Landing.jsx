import { Link } from "react-router-dom";
import { HiFire, HiChartBar, HiCamera, HiMusicalNote } from "react-icons/hi2";
import { useTranslation } from "../i18n/useTranslation";

export default function Landing() {
  const { t } = useTranslation();

  const features = [
    {
      icon: HiFire,
      title: t("landing.f1Title"),
      desc: t("landing.f1Desc"),
    },
    {
      icon: HiChartBar,
      title: t("landing.f2Title"),
      desc: t("landing.f2Desc"),
    },
    {
      icon: HiCamera,
      title: t("landing.f3Title"),
      desc: t("landing.f3Desc"),
    },
    {
      icon: HiMusicalNote,
      title: t("landing.f4Title"),
      desc: t("landing.f4Desc"),
    },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-surface overflow-hidden pt-[var(--safe-top)]">
      {/* Subtle background gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-accent-300/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-gold-200/20 rounded-full blur-3xl" />
      </div>

      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold gradient-text tracking-tight">
          {t("nav.brand")}
        </h1>
        <Link
          to="/login"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          {t("landing.login")}
        </Link>
      </header>

      <section className="px-6 pt-20 pb-24 max-w-4xl mx-auto text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6">
          <Badge text={t("dashboard.todayWorkout")} />
          <Badge text={t("dashboard.mealPlan")} />
          <Badge text={t("dashboard.progressTitle")} />
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
          <span className="text-gray-900">{t("landing.hero1")}</span>
          <br />
          <span className="gradient-text">{t("landing.hero2")}</span>
        </h2>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
          {t("landing.desc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login?mode=register"
            className="px-8 py-3.5 gradient-bg text-white font-semibold rounded-xl shadow-lg shadow-primary-200/50 hover:shadow-xl hover:shadow-primary-300/50 transition-all text-center"
          >
            {t("landing.cta")}
          </Link>
          <Link
            to="/login"
            className="px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl border border-primary-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all text-center"
          >
            {t("landing.haveAccount")}
          </Link>
        </div>
      </section>

      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="holo-border bg-white rounded-2xl p-6 border border-primary-100/60 hover:shadow-lg hover:shadow-primary-100/30 transition-all duration-300"
            >
              <div className="w-10 h-10 gradient-bg-subtle rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-gray-400 space-y-2">
        <div>{t("nav.brand")} &copy; {new Date().getFullYear()}</div>
        <Link to="/privacy" className="block text-primary-600 hover:underline font-medium">
          {t("privacy.link")}
        </Link>
      </footer>
    </div>
  );
}

function Badge({ text }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary-100/80 bg-white/90 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
      {text}
    </span>
  );
}
