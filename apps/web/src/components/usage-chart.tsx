"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  date: string;
  tokensIn: number;
  tokensOut: number;
  events: number;
};

const TICK = { fontSize: 10, fill: "#737373" };

export function UsageChart({ points }: { points: Point[] }) {
  if (points.every((p) => p.events === 0)) {
    return (
      <p className="text-sm text-neutral-500 italic px-1 py-6">
        No usage events in this window yet.
      </p>
    );
  }

  const data = points.map((p) => ({
    ...p,
    label: p.date.slice(5), // MM-DD
  }));

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="2 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={TICK}
            stroke="#d4d4d4"
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={TICK}
            stroke="#d4d4d4"
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => formatCompact(v as number)}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #000",
              borderRadius: 0,
              padding: "8px 10px",
              fontSize: 12,
              boxShadow: "3px 3px 0 #000",
            }}
            labelFormatter={(label) => `Day: ${label}`}
            formatter={(value: number | string, name) => [
              typeof value === "number" ? value.toLocaleString() : value,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            iconType="plainline"
          />
          <Line
            name="Tokens in"
            type="monotone"
            dataKey="tokensIn"
            stroke="#171717"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            name="Tokens out"
            type="monotone"
            dataKey="tokensOut"
            stroke="#2563eb"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
