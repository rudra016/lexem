"use client";

import {
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  id: string;
  score: number;
  commitMessage: string;
  createdAt: string;
  regression: boolean;
};

const TICK = { fontSize: 10, fill: "#737373" };

export function ScoreChart({ points }: { points: Point[] }) {
  if (points.length === 0) {
    return (
      <p className="text-xs text-neutral-500 italic px-1">No score history yet.</p>
    );
  }

  const data = points.map((p, i) => ({
    ...p,
    idx: i + 1,
  }));

  return (
    <div className="w-full h-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
        >
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="2 3" vertical={false} />
          <XAxis
            dataKey="idx"
            tick={TICK}
            stroke="#d4d4d4"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tick={TICK}
            stroke="#d4d4d4"
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#a3a3a3", strokeDasharray: "3 3" }} />
          <Line
            type="linear"
            dataKey="score"
            stroke="#000"
            strokeWidth={1.5}
            dot={<CustomDot />}
            activeDot={<CustomDot active />}
            isAnimationActive
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: Point;
  active?: boolean;
};

function CustomDot({ cx, cy, payload, active }: DotProps) {
  if (cx == null || cy == null || !payload) return null;
  const r = active ? 5 : payload.regression ? 4 : 3;
  const fill = payload.regression ? "#dc2626" : "#000";
  return <Dot cx={cx} cy={cy} r={r} fill={fill} stroke="#fff" strokeWidth={1} />;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload as Point;
  return (
    <div className="bg-white border border-black/20 shadow-[3px_3px_0px_#000] px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-black text-sm tabular-nums">{p.score.toFixed(1)}</span>
        {p.regression && (
          <span className="bg-red-50 text-red-800 border border-red-200 px-1 py-0">
            regression
          </span>
        )}
      </div>
      <div className="text-neutral-700 mt-1 max-w-[240px] truncate">{p.commitMessage}</div>
      <div className="text-neutral-500 mt-0.5">
        {new Date(p.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
