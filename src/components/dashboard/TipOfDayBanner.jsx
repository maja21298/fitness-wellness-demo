import { useId } from "react";

const DESKTOP_SPARKS = [
  { top: "12%", right: "8%", size: 15, opacity: 0.55 },
  { top: "6%", right: "20%", size: 10, opacity: 0.38 },
  { bottom: "18%", right: "5%", size: 11, opacity: 0.42 },
  { top: "48%", right: "2%", size: 8, opacity: 0.28 },
];

function BannerSvg({ gradId, grad2Id, className }) {
  return (
    <svg className={className} viewBox="0 0 400 108" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff8f2" />
          <stop offset="52%" stopColor="#ffeee0" />
          <stop offset="100%" stopColor="#ffe4d4" />
        </linearGradient>
        <linearGradient id={grad2Id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffdecb" />
          <stop offset="100%" stopColor="#ffc9b5" />
        </linearGradient>
      </defs>
      <path
        d="M18 22 C18 11 28 6 44 6 L292 6 C312 6 326 11 332 20 L358 54 L332 88 C326 97 312 102 292 102 L44 102 C28 102 18 97 18 86 Z"
        fill={`url(#${gradId})`}
        stroke="rgba(240,150,120,0.16)"
        strokeWidth="1"
      />
      <path
        d="M332 20 L358 54 L332 88 L312 74 C322 64 326 58 328 54 C326 50 322 44 312 34 Z"
        fill={`url(#${grad2Id})`}
        stroke="rgba(220,120,100,0.1)"
        strokeWidth="1"
      />
      <path
        d="M18 22 C12 26 10 34 11 42 C10 50 12 60 18 64"
        fill="none"
        stroke="rgba(200,140,110,0.14)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TipBannerScene({ tipText, gradId, grad2Id }) {
  return (
    <div className="dashboard-tip-scene">
      <div className="dashboard-tip-scene-group">
        <div className="dashboard-tip-banner">
          <BannerSvg gradId={gradId} grad2Id={grad2Id} className="dashboard-tip-banner-shape" />
          <p className="dashboard-tip-text">{tipText}</p>
        </div>
      </div>
    </div>
  );
}

export default function TipOfDayBanner({ tipText, onNextTip, isHr }) {
  const desktopGradId = useId();
  const desktopGrad2Id = useId();

  const ctaLabel = isHr ? "Sljedeći savjet →" : "Next tip →";

  return (
    <div className="dashboard-tip-card">
      {/* ── Desktop ── */}
      <div className="dashboard-tip-desktop">
        {DESKTOP_SPARKS.map((s, i) => (
          <span
            key={i}
            className="dashboard-tip-spark-dot"
            aria-hidden
            style={{
              position: "absolute",
              pointerEvents: "none",
              zIndex: 1,
              fontSize: s.size,
              opacity: s.opacity,
              color: "#f5a623",
              lineHeight: 1,
              top: s.top,
              right: s.right,
              bottom: s.bottom,
              left: s.left,
              fontWeight: 900,
            }}
          >
            ✦
          </span>
        ))}
        <span
          className="dashboard-tip-spark-dot dashboard-tip-spark-dot--extra"
          aria-hidden
          style={{
            position: "absolute",
            top: "16%",
            left: "38%",
            fontSize: 9,
            color: "#f5a623",
            opacity: 0.32,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          ✦
        </span>

        <div className="dashboard-tip-composition">
          <TipBannerScene
            tipText={tipText}
            gradId={desktopGradId}
            grad2Id={desktopGrad2Id}
          />
          <div className="dashboard-tip-footer">
            <button type="button" className="dashboard-tip-cta" onClick={onNextTip}>
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile: clean inline tip with lightbulb ── */}
      <div className="dashboard-tip-mobile-banner">
        <div className="dashboard-tip-mobile-illustration">
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "linear-gradient(135deg, #fffaf7 0%, #fff2eb 50%, #fdeef4 100%)", borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(240,81,139,0.06)" }}>
            <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.3 }}>💡</span>
            <div style={{ minWidth: 0 }}>
              <p className="dashboard-tip-mobile-text">{tipText}</p>
              <button type="button" className="dashboard-tip-cta" onClick={onNextTip} style={{ marginTop: 6 }}>
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
