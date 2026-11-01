import { useEffect, useState } from "react";
import ExerciseImage from "../exercise/ExerciseImage";

const FRAME_DURATION_MS = 650;

// All frames stay mounted so the next movement is decoded before it is shown.
export default function ExerciseStepAnimation({ images, running, label, fallback }) {
  const [loaded, setLoaded] = useState([]);
  const [failed, setFailed] = useState([]);
  const [frame, setFrame] = useState(0);
  const available = images.map((_, index) => index).filter((index) => loaded.includes(index));
  const count = available.length;
  const cycleLength = Math.max(1, count * 2 - 2);
  const position = frame % cycleLength;
  const active = count ? available[position < count ? position : cycleLength - position] : 0;

  useEffect(() => {
    if (!running || count < 2) return;
    let interval;
    const syncPlayback = () => {
      window.clearInterval(interval);
      if (document.visibilityState === "visible") {
        interval = window.setInterval(() => setFrame((value) => (value + 1) % cycleLength), FRAME_DURATION_MS);
      }
    };
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, [running, count, cycleLength]);

  if (failed.length === images.length) return fallback;

  return (
    <div className="aw-frame aw-frame--sequence" role="img" aria-label={label}>
      {images.map((src, index) => (
        <ExerciseImage key={`${index}-${src}`} src={src} alt="" aria-hidden="true"
          className={index === active ? "is-active" : ""}
          loading="eager" decoding="async"
          onLoad={() => setLoaded((previous) => previous.includes(index) ? previous : [...previous, index])}
          onError={() => setFailed((previous) => previous.includes(index) ? previous : [...previous, index])}
        />
      ))}
    </div>
  );
}
