import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
import { HiArrowLeft } from "react-icons/hi2";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  const sections = [
    { titleKey: "privacy.s1Title", bodyKey: "privacy.s1Body" },
    { titleKey: "privacy.s2Title", bodyKey: "privacy.s2Body" },
    { titleKey: "privacy.s3Title", bodyKey: "privacy.s3Body" },
    { titleKey: "privacy.s4Title", bodyKey: "privacy.s4Body" },
    { titleKey: "privacy.s5Title", bodyKey: "privacy.s5Body" },
    { titleKey: "privacy.s6Title", bodyKey: "privacy.s6Body" },
    { titleKey: "privacy.s7Title", bodyKey: "privacy.s7Body" },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-surface">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-16 pt-[max(2rem,var(--safe-top))]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-800 mb-8"
        >
          <HiArrowLeft className="w-4 h-4" />
          {t("privacy.backHome")}
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t("privacy.title")}
        </h1>
        <p className="text-sm text-gray-400 mb-10">{t("privacy.updated")}</p>

        <p className="text-sm text-gray-600 leading-relaxed mb-10 whitespace-pre-line">
          {t("privacy.intro")}
        </p>

        <div className="space-y-8">
          {sections.map(({ titleKey, bodyKey }) => (
            <section key={titleKey}>
              <h2 className="text-base font-semibold text-gray-900 mb-2">
                {t(titleKey)}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {t(bodyKey)}
              </p>
            </section>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-12 border-t border-primary-100 pt-6">
          {t("privacy.disclaimer")}
        </p>
      </div>
    </div>
  );
}
