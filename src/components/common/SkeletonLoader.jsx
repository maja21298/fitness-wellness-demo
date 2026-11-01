/**
 * Skeleton loading primitives — use SkeletonGroup once per pulse region,
 * Skeleton children without their own animate-pulse.
 */
export function SkeletonGroup({ children, className = "" }) {
  return <div className={`animate-pulse ${className}`}>{children}</div>;
}

/** @param {object} props
 * @param {string} [props.className]
 * @param {boolean} [props.circle]
 * @param {boolean} [props.shimmer] — adds global .shimmer for larger premium blocks */
export function Skeleton({ className = "", circle = false, shimmer = false }) {
  return (
    <div
      aria-hidden
      className={`bg-gray-200/65 dark:bg-gray-700/40 ${
        circle ? "rounded-full" : "rounded-xl"
      } ${shimmer ? "shimmer bg-primary-100/35 dark:bg-primary-900/20" : ""} ${className}`}
    />
  );
}
