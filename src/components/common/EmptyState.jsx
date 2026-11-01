import { Link } from "react-router-dom";
import { HiArrowPath } from "react-icons/hi2";

/**
 * Soft empty-state panel for “no content yet” flows.
 */
export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-primary-200/70 bg-primary-50/35 px-5 py-8 text-center ${className}`}
    >
      {icon ? <div className="mb-3 flex justify-center text-primary-500">{icon}</div> : null}
      {title ? (
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      ) : null}
      {description ? (
        <p className={`text-sm text-gray-600 leading-relaxed max-w-md mx-auto ${title ? "mt-2" : ""}`}>
          {description}
        </p>
      ) : null}
      {(primaryAction || secondaryAction) ? (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {primaryAction?.to ? (
            <Link
              to={primaryAction.to}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90"
            >
              {primaryAction.label}
            </Link>
          ) : primaryAction?.onClick ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90"
            >
              {primaryAction.label}
            </button>
          ) : null}
          {secondaryAction?.onClick ? (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-primary-200 bg-white text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-50"
            >
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Inline recoverable error (network / config). Not for React crashes.
 */
export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  className = "",
  children,
}) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-amber-300/70 bg-amber-50/90 px-4 py-3.5 shadow-sm ${className}`}
    >
      <p className="text-sm font-semibold text-amber-950">{title}</p>
      {message ? <p className="text-sm text-amber-900/85 mt-1 leading-relaxed">{message}</p> : null}
      {onRetry && retryLabel ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-amber-200 text-amber-900 text-sm font-semibold hover:bg-amber-100/70 transition-colors"
        >
          <HiArrowPath className="w-4 h-4 shrink-0" aria-hidden />
          {retryLabel}
        </button>
      ) : null}
      {children}
    </div>
  );
}
