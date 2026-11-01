import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi2";

const INSIGHT_EMOJI = {
  trend: "📈",
  strength: "💪",
  recovery: "🌙",
};

const INSIGHT_BADGE = {
  trend: "trend",
  strength: "strength",
  recovery: "recovery",
};

export default function AiCoachMergedCard({
  score = 82,
  insights = [],
  firstName = "Maja",
  detailHref = "/body",
  isHr = false,
  className = "",
}) {
  return (
    <section
      className={`dashboard-ai-coach-merged ${className}`}
      aria-label={isHr ? "AI Coach sažetak" : "AI Coach summary"}
    >
      <div className="dashboard-ai-coach-top">
        <div className="dashboard-ai-coach-lead">
          <div className="dashboard-ai-coach-brand">
            <span className="dashboard-ai-coach-brand-icon" aria-hidden>✦</span>
            <span className="dashboard-ai-coach-eyebrow">AI Coach</span>
          </div>
          <div className="dashboard-ai-coach-headline-wrap">
            <p className="dashboard-ai-coach-headline">
              {isHr ? `Odlično ti ide, ${firstName}! 💕` : `You're doing great, ${firstName}! 💕`}
            </p>
            <p className="dashboard-ai-coach-summary">
              {isHr
                ? "Tvoj wellness rezultat raste ovaj tjedan — nastavi dosljedno."
                : "Your wellness score is rising this week — keep showing up consistently."}
            </p>
          </div>
        </div>
        <div className="dashboard-ai-coach-score-pill">
          <p className="dashboard-ai-coach-score-value">
            {score}
            <span>/100</span>
          </p>
          <p className="dashboard-ai-coach-score-label">
            {isHr ? "Wellness rezultat" : "Wellness score"}
          </p>
        </div>
        <Link
          to={detailHref}
          className="dashboard-ai-coach-cta"
          aria-label={isHr ? "Detaljnija analiza" : "Detailed analysis"}
        >
          <HiArrowRight aria-hidden />
        </Link>
      </div>

      <ul className="dashboard-ai-coach-insights">
        {insights.slice(0, 3).map((insight) => {
          const badge = INSIGHT_BADGE[insight.type] || "trend";
          const emoji = INSIGHT_EMOJI[insight.type] || "📈";

          return (
            <li key={insight.id} className="dashboard-ai-coach-insight">
              <span className={`dashboard-ai-coach-insight-badge dashboard-ai-coach-insight-badge--${badge}`}>
                {emoji}
              </span>
              <p className="dashboard-ai-coach-insight-text">
                {isHr
                  ? (insight.shortHr || insight.textHr)
                  : (insight.shortEn || insight.textEn)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
