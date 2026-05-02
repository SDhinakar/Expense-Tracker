"use client"

import { memo } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

interface OverviewChartProps {
  data?: { name: string; total: number }[]
}

export const OverviewChart = memo(function OverviewChart({ data = [] }: OverviewChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[320px] w-full flex items-center justify-center text-muted-foreground bg-white/5 rounded-xl border border-dashed border-white/10 text-sm">
        No data available for the selected range.
      </div>
    )
  }

  return (
    <div className="h-[320px] min-h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={60}
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15,23,42,0.92)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              backdropFilter: "blur(8px)",
            }}
            itemStyle={{ color: "#fff", fontSize: "12px" }}
            formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Total"]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorTotal)"
            activeDot={{ r: 5, strokeWidth: 0, fill: "var(--primary)" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})
