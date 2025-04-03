"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    month: "Jan",
    revenue: 4000,
  },
  {
    month: "Feb",
    revenue: 5000,
  },
  {
    month: "Mar",
    revenue: 7000,
  },
  {
    month: "Apr",
    revenue: 6500,
  },
  {
    month: "May",
    revenue: 8000,
  },
  {
    month: "Jun",
    revenue: 9500,
  },
  {
    month: "Jul",
    revenue: 11000,
  },
  {
    month: "Aug",
    revenue: 12500,
  },
  {
    month: "Sep",
    revenue: 14000,
  },
  {
    month: "Oct",
    revenue: 15500,
  },
  {
    month: "Nov",
    revenue: 17000,
  },
  {
    month: "Dec",
    revenue: 19000,
  },
]

export function AdminOverview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

