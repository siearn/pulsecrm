"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "Jan",
    leads: 40,
    customers: 24,
  },
  {
    name: "Feb",
    leads: 30,
    customers: 13,
  },
  {
    name: "Mar",
    leads: 45,
    customers: 28,
  },
  {
    name: "Apr",
    leads: 50,
    customers: 22,
  },
  {
    name: "May",
    leads: 65,
    customers: 30,
  },
  {
    name: "Jun",
    leads: 48,
    customers: 25,
  },
  {
    name: "Jul",
    leads: 70,
    customers: 32,
  },
  {
    name: "Aug",
    leads: 75,
    customers: 35,
  },
  {
    name: "Sep",
    leads: 60,
    customers: 28,
  },
  {
    name: "Oct",
    leads: 55,
    customers: 30,
  },
  {
    name: "Nov",
    leads: 80,
    customers: 40,
  },
  {
    name: "Dec",
    leads: 65,
    customers: 35,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} className="fill-primary" />
        <Bar dataKey="customers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.5} />
      </BarChart>
    </ResponsiveContainer>
  )
}

