import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../i18n/useTranslation";
import { useNavigate } from "react-router-dom";
import { HiLockClosed, HiSparkles } from "react-icons/hi2";

export default function PremiumGate({ children, feature = "" }) {
  const { isPremium } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isPremium) return children;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 blur-[2px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-primary-200 p-6 max-w-sm mx-4 text-center space-y-4">
          <div className="w-14 h-14 rounded-full gradient-bg mx-auto flex items-center justify-center">
            <HiLockClosed className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t("premium.title")}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {feature ? t(`premium.features.${feature}`) : t("premium.desc")}
            </p>
          </div>
          <button
            onClick={() => navigate("/upgrade")}
            className="w-full py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <HiSparkles className="w-5 h-5" />
            {t("premium.upgrade")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PremiumBadge() {
  const { isPremium } = useAuth();
  const { t } = useTranslation();

  if (!isPremium) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">
      <HiSparkles className="w-3 h-3" />
      {t("premium.badge")}
    </span>
  );
}
