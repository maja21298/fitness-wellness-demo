const SHAPE_IMAGES = {
  female: {
    hourglass: "/body-shapes/body-shape-female-hourglass.png",
    athletic: "/body-shapes/body-shape-female-athletic.png",
    slim: "/body-shapes/body-shape-female-slim.png",
    toned: "/body-shapes/body-shape-female-toned.png",
    curvy: "/body-shapes/body-shape-female-curvy.png",
  },
  male: {
    athletic: "/body-shapes/body-shape-male-athletic.png",
    muscular: "/body-shapes/body-shape-male-muscular.png",
    lean: "/body-shapes/body-shape-male-lean.png",
    average: "/body-shapes/body-shape-male-average.png",
    bulky: "/body-shapes/body-shape-male-bulky.png",
  },
};

const VARIANT_COLORS = {
  hourglass: { ring: "#ef5d86", bg: "#fff0f4" },
  athletic: { ring: "#5b7cfa", bg: "#eef3ff" },
  slim: { ring: "#8fa1b5", bg: "#f4f7fb" },
  toned: { ring: "#24b3a7", bg: "#ecfbf7" },
  curvy: { ring: "#f38d5f", bg: "#fff3eb" },
  muscular: { ring: "#6f57e8", bg: "#f1edff" },
  lean: { ring: "#8fa1b5", bg: "#f4f7fb" },
  average: { ring: "#6f8499", bg: "#eff4f8" },
  bulky: { ring: "#ef7b3c", bg: "#fff3eb" },
};

const FEMALE_VARIANTS = {
  hourglass: { shoulders: 0.96, waist: 0.48, hips: 1.18, bust: 1.04, thighs: 1.04, color: "#ef5d86", panel: "#fff0f4" },
  athletic: { shoulders: 1.06, waist: 0.62, hips: 0.88, bust: 0.92, thighs: 0.9, color: "#5b7cfa", panel: "#eef3ff" },
  slim: { shoulders: 0.76, waist: 0.52, hips: 0.78, bust: 0.82, thighs: 0.78, color: "#8fa1b5", panel: "#f4f7fb" },
  toned: { shoulders: 1.0, waist: 0.56, hips: 0.9, bust: 0.92, thighs: 0.92, color: "#24b3a7", panel: "#ecfbf7" },
  curvy: { shoulders: 0.86, waist: 0.7, hips: 1.26, bust: 1.02, thighs: 1.12, color: "#f38d5f", panel: "#fff3eb" },
};

const MALE_VARIANTS = {
  athletic: { shoulders: 1.12, waist: 0.68, hips: 0.82, chest: 1.06, thighs: 0.9, color: "#4e77ff", panel: "#edf2ff" },
  muscular: { shoulders: 1.22, waist: 0.74, hips: 0.86, chest: 1.16, thighs: 0.98, color: "#6f57e8", panel: "#f1edff" },
  lean: { shoulders: 0.82, waist: 0.62, hips: 0.76, chest: 0.84, thighs: 0.78, color: "#8fa1b5", panel: "#f4f7fb" },
  average: { shoulders: 0.96, waist: 0.8, hips: 0.88, chest: 0.94, thighs: 0.9, color: "#6f8499", panel: "#eff4f8" },
  bulky: { shoulders: 1.24, waist: 1.0, hips: 0.98, chest: 1.14, thighs: 1.08, color: "#ef7b3c", panel: "#fff3eb" },
};

function getSize(size) {
  if (size === "sm") return { w: 88, h: 138 };
  if (size === "lg") return { w: 136, h: 212 };
  return { w: 108, h: 170 };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getSomatotypeProfile(gender, bodyFat, somatotype) {
  const fatFactor = clamp(((bodyFat || 20) - 10) / 25, 0, 1);

  if (gender === "female") {
    if (somatotype === "ectomorph") {
      return { shoulders: 0.78, waist: 0.5 + fatFactor * 0.08, hips: 0.82, bust: 0.84, thighs: 0.8, color: "#97a7ba", panel: "#f4f7fb" };
    }
    if (somatotype === "mesomorph") {
      return { shoulders: 1.02, waist: 0.58 + fatFactor * 0.05, hips: 0.92, bust: 0.95, thighs: 0.92, color: "#7a69f2", panel: "#f1edff" };
    }
    return { shoulders: 0.9, waist: 0.72 + fatFactor * 0.08, hips: 1.14, bust: 0.98, thighs: 1.06, color: "#f28b5d", panel: "#fff3eb" };
  }

  if (somatotype === "ectomorph") {
    return { shoulders: 0.82, waist: 0.62 + fatFactor * 0.05, hips: 0.78, chest: 0.86, thighs: 0.8, color: "#97a7ba", panel: "#f4f7fb" };
  }
  if (somatotype === "mesomorph") {
    return { shoulders: 1.1, waist: 0.74 + fatFactor * 0.04, hips: 0.84, chest: 1.04, thighs: 0.94, color: "#5777ff", panel: "#edf2ff" };
  }
  return { shoulders: 1.0, waist: 0.9 + fatFactor * 0.06, hips: 0.92, chest: 0.98, thighs: 1.0, color: "#f07a43", panel: "#fff3eb" };
}

function getProfile(gender, bodyFat, somatotype, shapeVariant) {
  const table = gender === "female" ? FEMALE_VARIANTS : MALE_VARIANTS;
  return table[shapeVariant] || getSomatotypeProfile(gender, bodyFat, somatotype);
}

function withAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  const normalized = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildTorsoPath({ w, h, gender, profile }) {
  const cx = w / 2;
  const shoulderY = h * 0.24;
  const bustY = h * (gender === "female" ? 0.34 : 0.33);
  const waistY = h * 0.5;
  const hipY = h * 0.65;
  const crotchY = h * 0.79;

  const shoulderHalf = w * 0.22 * profile.shoulders;
  const chestScale = gender === "female" ? profile.bust : profile.chest;
  const bustHalf = w * 0.18 * (chestScale || 1);
  const waistHalf = w * 0.12 * profile.waist;
  const hipHalf = w * 0.18 * profile.hips;

  return [
    `M ${cx - shoulderHalf} ${shoulderY}`,
    `C ${cx - shoulderHalf + w * 0.02} ${bustY - h * 0.02} ${cx - bustHalf - w * 0.05} ${bustY} ${cx - bustHalf} ${bustY}`,
    `C ${cx - waistHalf - w * 0.03} ${waistY - h * 0.02} ${cx - waistHalf} ${waistY} ${cx - waistHalf} ${waistY}`,
    `C ${cx - hipHalf - w * 0.01} ${hipY - h * 0.015} ${cx - hipHalf + w * 0.01} ${hipY} ${cx - hipHalf + w * 0.02} ${crotchY}`,
    `L ${cx - w * 0.04} ${crotchY}`,
    `Q ${cx} ${h * 0.74} ${cx + w * 0.04} ${crotchY}`,
    `L ${cx + hipHalf - w * 0.02} ${crotchY}`,
    `C ${cx + hipHalf - w * 0.01} ${hipY} ${cx + hipHalf + w * 0.01} ${hipY - h * 0.015} ${cx + waistHalf} ${waistY}`,
    `C ${cx + waistHalf} ${waistY} ${cx + waistHalf + w * 0.03} ${waistY - h * 0.02} ${cx + bustHalf} ${bustY}`,
    `C ${cx + bustHalf + w * 0.05} ${bustY} ${cx + shoulderHalf - w * 0.02} ${bustY - h * 0.02} ${cx + shoulderHalf} ${shoulderY}`,
    "Z",
  ].join(" ");
}

function buildArmPath({ w, h, side, profile }) {
  const cx = w / 2;
  const direction = side === "left" ? -1 : 1;
  const x = cx + direction * w * 0.19 * profile.shoulders;
  const y = h * 0.255;
  const elbowX = cx + direction * w * 0.25;
  const elbowY = h * 0.48;
  const handX = cx + direction * w * 0.2;
  const handY = h * 0.75;

  return `M ${x} ${y} Q ${elbowX} ${elbowY} ${handX} ${handY}`;
}

function buildLegPath({ w, h, side, profile }) {
  const cx = w / 2;
  const direction = side === "left" ? -1 : 1;
  const thighOffset = w * 0.065 * profile.thighs;
  const startX = cx + direction * thighOffset;
  const startY = h * 0.79;
  const kneeX = cx + direction * w * 0.09 * profile.thighs;
  const kneeY = h * 0.92;
  const footX = cx + direction * w * 0.08;
  const footY = h * 1.08;

  return `M ${startX} ${startY} Q ${kneeX} ${kneeY} ${footX} ${footY}`;
}

export default function BodyShapeIllustration({
  gender,
  bodyFat,
  somatotype,
  shapeVariant,
  size = "md",
  label,
  highlight = false,
}) {
  const g = gender || "female";
  const imageSrc = shapeVariant ? SHAPE_IMAGES[g]?.[shapeVariant] : null;

  if (imageSrc) {
    const colors = VARIANT_COLORS[shapeVariant] || { ring: "#7c3aed", bg: "#f5f3ff" };
    const dimensions = size === "sm"
      ? { w: "88px", h: "138px", imgH: "120px", radius: "20px" }
      : size === "lg"
        ? { w: "136px", h: "212px", imgH: "194px", radius: "26px" }
        : { w: "108px", h: "170px", imgH: "152px", radius: "22px" };

    const ringColor = highlight ? "#7c3aed" : colors.ring;
    const bgColor = highlight ? "rgba(124, 58, 237, 0.08)" : colors.bg;
    const labelBg = highlight ? "rgba(124, 58, 237, 0.12)" : "rgba(15, 23, 42, 0.05)";

    return (
      <div className="flex flex-col items-center gap-1.5">
        <div
          style={{
            width: dimensions.w,
            height: dimensions.h,
            borderRadius: dimensions.radius,
            border: highlight ? `2px solid ${ringColor}` : `1px solid ${withAlpha(ringColor, 0.2)}`,
            backgroundColor: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: highlight ? `0 0 0 3px ${withAlpha(ringColor, 0.15)}` : "none",
          }}
        >
          <img
            src={imageSrc}
            alt=""
            style={{
              height: dimensions.imgH,
              width: "100%",
              objectFit: "contain",
              objectPosition: "center",
            }}
            decoding="async"
            loading="lazy"
          />
        </div>
        {label ? (
          <p
            className="text-[10px] font-semibold px-3 py-1 rounded-full tracking-[0.06em] uppercase"
            style={{ backgroundColor: labelBg, color: highlight ? "#6d28d9" : "#475569" }}
          >
            {label}
          </p>
        ) : null}
      </div>
    );
  }

  const { w, h } = getSize(size);
  const profile = getProfile(gender, bodyFat, somatotype, shapeVariant);
  const baseColor = highlight ? "#7c3aed" : profile.color;
  const skinColor = highlight ? "#f4d2cf" : "#f3cfc8";
  const strokeColor = highlight ? "#5b21b6" : "#324154";
  const cardFill = highlight ? "rgba(124, 58, 237, 0.1)" : profile.panel || "rgba(255,255,255,0.92)";
  const guideColor = withAlpha(baseColor, highlight ? 0.35 : 0.24);
  const torsoPath = buildTorsoPath({ w, h, gender, profile });
  const leftArm = buildArmPath({ w, h, side: "left", profile });
  const rightArm = buildArmPath({ w, h, side: "right", profile });
  const leftLeg = buildLegPath({ w, h, side: "left", profile });
  const rightLeg = buildLegPath({ w, h, side: "right", profile });
  const cx = w / 2;
  const headR = h * 0.08;
  const headY = h * 0.115;
  const hairColor = highlight ? withAlpha(baseColor, 0.92) : "#394a5f";
  const labelBg = highlight ? withAlpha(baseColor, 0.12) : "rgba(15, 23, 42, 0.05)";

  const shoulderWidth = w * 0.44 * profile.shoulders;
  const waistWidth = w * 0.24 * profile.waist;
  const hipWidth = w * 0.36 * profile.hips;
  const bustWidth = w * 0.36 * (gender === "female" ? profile.bust : profile.chest || 1);
  const shoulderY = h * 0.24;
  const waistY = h * 0.5;
  const hipY = h * 0.65;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-hidden="true">
        <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx={size === "sm" ? 20 : 26} fill={cardFill} stroke={withAlpha(baseColor, highlight ? 0.34 : 0.16)} />
        <rect x={w * 0.13} y={h * 0.12} width={w * 0.74} height={h * 0.82} rx={size === "sm" ? 18 : 22} fill="rgba(255,255,255,0.74)" />
        <ellipse cx={cx} cy={h * 1.08} rx={w * 0.23} ry={h * 0.03} fill={withAlpha("#0f172a", 0.08)} />

        <line x1={cx - shoulderWidth / 2} y1={shoulderY} x2={cx + shoulderWidth / 2} y2={shoulderY} stroke={guideColor} strokeWidth="1.6" strokeDasharray="3 3" strokeLinecap="round" />
        <line x1={cx - bustWidth / 2} y1={h * 0.34} x2={cx + bustWidth / 2} y2={h * 0.34} stroke={guideColor} strokeWidth="1.4" strokeDasharray="3 3" strokeLinecap="round" />
        <line x1={cx - waistWidth / 2} y1={waistY} x2={cx + waistWidth / 2} y2={waistY} stroke={guideColor} strokeWidth="1.4" strokeDasharray="3 3" strokeLinecap="round" />
        <line x1={cx - hipWidth / 2} y1={hipY} x2={cx + hipWidth / 2} y2={hipY} stroke={guideColor} strokeWidth="1.4" strokeDasharray="3 3" strokeLinecap="round" />

        <path d={leftArm} fill="none" stroke={skinColor} strokeWidth={size === "sm" ? 8 : 10} strokeLinecap="round" />
        <path d={rightArm} fill="none" stroke={skinColor} strokeWidth={size === "sm" ? 8 : 10} strokeLinecap="round" />

        <circle cx={cx} cy={headY} r={headR} fill={skinColor} stroke={strokeColor} strokeWidth="1.4" />
        <path
          d={`M ${cx - headR * 1.05} ${headY - headR * 0.15} Q ${cx} ${headY - headR * 1.35} ${cx + headR * 1.05} ${headY - headR * 0.15} L ${cx + headR * 0.92} ${headY + headR * 0.12} Q ${cx} ${headY - headR * 0.62} ${cx - headR * 0.92} ${headY + headR * 0.12} Z`}
          fill={hairColor}
          opacity="0.95"
        />

        <path d={torsoPath} fill={baseColor} stroke={strokeColor} strokeWidth="1.5" />

        <path d={leftLeg} fill="none" stroke={skinColor} strokeWidth={size === "sm" ? 8.5 : 10.5} strokeLinecap="round" />
        <path d={rightLeg} fill="none" stroke={skinColor} strokeWidth={size === "sm" ? 8.5 : 10.5} strokeLinecap="round" />

        <line x1={cx} y1={headY + headR} x2={cx} y2={h * 0.24} stroke={strokeColor} strokeWidth="1.2" opacity="0.45" />
      </svg>

      {label ? (
        <p
          className="text-[10px] font-semibold px-3 py-1 rounded-full tracking-[0.06em] uppercase"
          style={{ backgroundColor: labelBg, color: highlight ? "#6d28d9" : "#475569" }}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}
