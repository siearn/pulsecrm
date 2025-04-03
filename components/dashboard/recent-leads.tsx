"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const recentLeads = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    company: "Acme Inc",
    status: "NEW",
    value: 5000,
    date: "2 hours ago",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    company: "Globex Corp",
    status: "CONTACTED",
    value: 7500,
    date: "5 hours ago",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael@example.com",
    company: "Initech",
    status: "QUALIFIED",
    value: 10000,
    date: "1 day ago",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@example.com",
    company: "Umbrella Corp",
    status: "PROPOSAL",
    value: 15000,
    date: "2 days ago",
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david@example.com",
    company: "Stark Industries",
    status: "NEGOTIATION",
    value: 25000,
    date: "3 days ago",
  },
]

const statusColors = {
  NEW: "bg-blue-500",
  CONTACTED: "bg-yellow-500",
  QUALIFIED: "bg-green-500",
  PROPOSAL: "bg-purple-500",
  NEGOTIATION: "bg-orange-500",
  WON: "bg-emerald-500",
  LOST: "bg-red-500",
}

export function RecentLeads() {
  return (
    <div className="space-y-8">
      {recentLeads.map((lead) => (
        <div key={lead.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {lead.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{lead.name}</p>
            <p className="text-sm text-muted-foreground">{lead.company}</p>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <Badge variant="outline" className={`${statusColors[lead.status as keyof typeof statusColors]} text-white`}>
              {lead.status.charAt(0) + lead.status.slice(1).toLowerCase().replace("_", " ")}
            </Badge>
            <p className="text-sm text-muted-foreground">${lead.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

