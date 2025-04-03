"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const recentCompanies = [
  {
    id: "1",
    name: "Acme Inc",
    plan: "PRO",
    users: 12,
    date: "2 hours ago",
  },
  {
    id: "2",
    name: "Globex Corp",
    plan: "ENTERPRISE",
    users: 25,
    date: "5 hours ago",
  },
  {
    id: "3",
    name: "Initech",
    plan: "STARTER",
    users: 5,
    date: "1 day ago",
  },
  {
    id: "4",
    name: "Umbrella Corp",
    plan: "FREE_TRIAL",
    users: 3,
    date: "2 days ago",
  },
  {
    id: "5",
    name: "Stark Industries",
    plan: "PRO",
    users: 8,
    date: "3 days ago",
  },
]

const planColors = {
  FREE_TRIAL: "bg-blue-500",
  STARTER: "bg-green-500",
  PRO: "bg-purple-500",
  ENTERPRISE: "bg-orange-500",
}

export function RecentCompanies() {
  return (
    <div className="space-y-8">
      {recentCompanies.map((company) => (
        <div key={company.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {company.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{company.name}</p>
            <p className="text-sm text-muted-foreground">{company.users} users</p>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <Badge variant="outline" className={`${planColors[company.plan as keyof typeof planColors]} text-white`}>
              {company.plan.charAt(0) + company.plan.slice(1).toLowerCase().replace("_", " ")}
            </Badge>
            <p className="text-sm text-muted-foreground">{company.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

