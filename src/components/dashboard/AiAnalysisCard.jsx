import { useId } from "react";
import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi2";

const INSIGHT_EMOJI = {
  trend: "📈",
  strength: "💪",
  recovery: "💗",
};

const INSIGHT_BADGE = {
  trend: "trend",
  strength: "strength",
  recovery: "recovery",
};

function ScoreGauge({ score, gradientId, sizeClass = "" }) {
  const fraction = Math.min(100, Math.max(0, score)) / 100;
  const circumference = 2 * Math.PI * 36;

  return (
    <div className={`dashboard-ai-gauge ${sizeClass}`}>
      <svg className="dashboard-ai-gauge-svg" viewBox="0 0 88 88" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA5BD" />
            <stop offset="100%" stopColor="#F0518B" />
          </linearGradient>
        </defs>
        <circle cx="44" cy="44" r="36" className="dashboard-ai-gauge-track" strokeWidth="9" fill="none" />
        <circle
          cx="44"
          cy="44"
          r="36"
          stroke={`url(#${gradientId})`}
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="dashboard-ai-gauge-progress"
        />
      </svg>
      <div className="dashboard-ai-gauge-center">
        <span className="dashboard-ai-gauge-value">{score}</span>
        <span className="dashboard-ai-gauge-sub">/100</span>
      </div>
    </div>
  );
}

export default function AiAnalysisCard({
  score = 82,
  scoreLabel,
  insights = [],
  detailHref = "/body",
  detailLabel,
  isHr = false,
  className = "",
}) {
  const gradientId = useId();

  return (
    <section className={`app-card dashboard-ai-card ${className}`}>
      <div className="dashboard-ai-header">
        <h3 className="dashboard-ai-title">{isHr ? "AI analiza" : "AI analysis"}</h3>
        <span className="dashboard-ai-beta">BETA</span>
      </div>

      <div
        className="dashboard-ai-score-desktop"
        role="img"
        aria-label={
          isHr
            ? `AI wellness rezultat ${score} od 100. ${scoreLabel || ""}`
            : `AI wellness score ${score} out of 100. ${scoreLabel || ""}`
        }
      >
        <ScoreGauge score={score} gradientId={gradientId} sizeClass="dashboard-ai-gauge--desktop" />
        {scoreLabel && <p className="dashboard-ai-gauge-label">{scoreLabel}</p>}
      </div>

      <div className="dashboard-ai-score-mobile">
        <ScoreGauge score={score} gradientId={`${gradientId}-mobile`} />
        <div className="dashboard-ai-score-mobile-text">
          <p className="dashboard-ai-score-mobile-label">{scoreLabel}</p>
          <p className="dashboard-ai-score-mobile-sub">
            {isHr ? "wellness rezultat" : "wellness score"}
          </p>
        </div>
      </div>

      <ul className="dashboard-ai-insights">
        {insights.map((insight) => {
          const badge = INSIGHT_BADGE[insight.type] || "trend";
          const emoji = INSIGHT_EMOJI[insight.type] || "📈";

          return (
            <li key={insight.id} className="dashboard-ai-insight">
              <span className={`dashboard-ai-insight-badge dashboard-ai-insight-badge--${badge}`}>
                {emoji}
              </span>
              <p className="dashboard-ai-insight-text">
                {isHr ? insight.textHr : insight.textEn}
              </p>
            </li>
          );
        })}
      </ul>

      <Link to={detailHref} className="dashboard-ai-link">
        {detailLabel || (isHr ? "Detaljnija analiza" : "Detailed analysis")}
        <HiArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  );
}
