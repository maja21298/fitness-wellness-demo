// A sprite keeps both avatars and all movement phases in one cached image.
// Each cell is framed independently, so no neighbouring pose can spill into it.
export default function ExerciseImage({ src, alt = "", className = "", onLoad, onError, ...props }) {
  const [url, fragment = ""] = (src || "").split("#");
  const match = fragment.match(/^avatar=(female|male)&frame=([012])$/);
  if (!match) {
    return <img src={src} alt={alt} className={className} onLoad={onLoad} onError={onError} {...props} />;
  }
  const row = match[1] === "male" ? 1 : 0;
  const column = Number(match[2]);
  // SVG crops the original asset without creating duplicated image files.
  const { loading: _loading, decoding: _decoding, ...svgProps } = props;
  return (
    <svg viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet"
      className={`exercise-avatar-image ${className}`} role="img" aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true} focusable="false"
      {...svgProps}>
      <image href={url} x={-column} y={-row} width="3" height="2"
        preserveAspectRatio="none" onLoad={onLoad} onError={onError} />
    </svg>
  );
}
