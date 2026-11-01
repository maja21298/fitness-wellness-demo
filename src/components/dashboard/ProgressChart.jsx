import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function SizedResponsiveContainer({ children }) {
  const hostRef = useRef(null);
  const [box, setBox] = useState(null);

  useLayoutEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;

    const sync = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      setBox((prev) => (
        prev && prev.width === width && prev.height === height ? prev : { width, height }
      ));
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="dashboard-chart-size-host">
      {box ? (
        <ResponsiveContainer width="100%" height="100%" initialDimension={box}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

const PINK = {
  deep: "#F0518B",
  base: "#FF6B8A",
  mid: "#FFA5BD",
  muted: "#9A8AA0",
};

const MUSCLE_COLORS = {
  upper: PINK.deep,
  lower: PINK.base,
  core: PINK.mid,
  cardio: "#FFE9D6",
};

function muscleColor(segment) {
  return MUSCLE_COLORS[segment.id] || segment.color;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  if (value == null) return null;

  return (
    <div className="dashboard-chart-tooltip">
      {Number(value).toLocaleString("en-US")}kcal
    </div>
  );
}

function MuscleLegend({ segments, isHr }) {
  return (
    <ul className="dashboard-muscle-legend">
      {segments.map((segment) => (
        <li key={segment.id} className="dashboard-muscle-legend-item">
          <span
            className="dashboard-muscle-legend-dot"
            style={{
              backgroundColor: muscleColor(segment),
              border: segment.id === "cardio" ? "1px solid #FFD0B0" : "none",
            }}
            aria-hidden
          />
          <span className="dashboard-muscle-legend-label">
            {isHr ? segment.labelHr : segment.labelEn}
          </span>
          <span className="dashboard-muscle-legend-value">{segment.value}%</span>
        </li>
      ))}
    </ul>
  );
}

export function MuscleFocusCard({ isHr = false, muscleFocus, className = "" }) {
  const muscleSegments = muscleFocus?.segments || [];
  const centerPct = muscleFocus?.centerPct ?? 0;

  return (
    <section className={`app-card dashboard-progress-card dashboard-muscle-card ${className}`}>
      <h3 className="dashboard-progress-card-title">
        {isHr ? "Mišićna skupina fokus" : "Muscle group focus"}
      </h3>
      <div className="dashboard-muscle-layout">
        <div className="dashboard-muscle-donut-wrap">
          <SizedResponsiveContainer>
            <PieChart>
              <Pie
                data={muscleSegments}
                dataKey="value"
                nameKey="id"
                cx="50%"
                cy="50%"
                innerRadius="68%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="none"
              >
                {muscleSegments.map((segment) => (
                  <Cell key={segment.id} fill={muscleColor(segment)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => [
                  `${value}%`,
                  isHr ? item.payload.labelHr : item.payload.labelEn,
                ]}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(240, 81, 139, 0.12)",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </SizedResponsiveContainer>
          <div className="dashboard-muscle-center" aria-hidden>
            <span className="dashboard-muscle-center-value">{centerPct}%</span>
          </div>
        </div>
        <MuscleLegend segments={muscleSegments} isHr={isHr} />
      </div>
    </section>
  );
}

export default function ProgressChart({
  title,
  isHr = false,
  weeklyData = [],
  dayLabels = [],
  className = "",
}) {
  const chartData = useMemo(
    () =>
      weeklyData.map((point, index) => ({
        ...point,
        day: dayLabels[index] || point.day || "",
      })),
    [weeklyData, dayLabels],
  );

  const chartYMax = useMemo(() => {
    const maxVal = chartData.reduce((m, d) => Math.max(m, Number(d.calories) || 0), 0);
    if (maxVal <= 0) return 800;
    return Math.ceil(maxVal * 1.15);
  }, [chartData]);

  const isQuietChart = useMemo(
    () => chartData.every((d) => !Number(d.calories)),
    [chartData],
  );

  return (
    <section className={`app-card dashboard-progress-card ${className}`}>
      <div className="dashboard-progress-card-header">
        <div className="dashboard-progress-title-wrap">
          <span className="dashboard-progress-title-icon" aria-hidden>📈</span>
          {title && <h3 className="dashboard-progress-card-title">{title}</h3>}
        </div>
        <span className="dashboard-chart-period-chip">
          {isHr ? "Ovaj tjedan" : "This week"}
        </span>
      </div>

      <div className={`dashboard-progress-area-wrap${isQuietChart ? " dashboard-progress-area-wrap--quiet" : ""}`}>
        {isQuietChart ? (
          <>
            <div className="dashboard-progress-empty" role="status">
              <div className="dashboard-progress-empty-glow" aria-hidden />
              <p className="dashboard-progress-empty-msg">
                {isHr
                  ? "Tvoj napredak će se pojaviti nakon prvih aktivnosti 🌸"
                  : "Your progress will appear after your first activities 🌸"}
              </p>
            </div>
            <div className="dashboard-progress-empty-days" aria-hidden>
              {chartData.map((d) => (
                <span key={d.day}>{d.day}</span>
              ))}
            </div>
          </>
        ) : (
          <SizedResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardProgressFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PINK.mid} stopOpacity={0.58} />
                  <stop offset="55%" stopColor={PINK.base} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={PINK.mid} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="rgba(240, 81, 139, 0.05)"
                strokeDasharray="4 8"
              />
              <YAxis hide width={0} domain={[0, chartYMax]} tick={false} axisLine={false} tickLine={false} />
              <XAxis
                dataKey="day"
                type="category"
                axisLine={false}
                tickLine={false}
                interval={0}
                minTickGap={0}
                padding={{ left: 18, right: 18 }}
                tickMargin={8}
                tick={{ fill: PINK.muted, fontSize: 11, fontWeight: 600 }}
                dy={2}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(240, 81, 139, 0.18)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="calories"
                stroke={PINK.base}
                strokeWidth={3}
                fill="url(#dashboardProgressFill)"
                dot={{
                  r: 5,
                  fill: PINK.deep,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 7,
                  fill: PINK.deep,
                  stroke: "#fff",
                  strokeWidth: 2.5,
                }}
              />
            </AreaChart>
          </SizedResponsiveContainer>
        )}
      </div>
    </section>
  );
}
