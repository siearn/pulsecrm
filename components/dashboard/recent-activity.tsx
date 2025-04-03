"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const recentActivity = [
  {
    id: "1",
    type: "LEAD_CREATED",
    user: "John Doe",
    target: "Acme Inc",
    date: "2 hours ago",
  },
  {
    id: "2",
    type: "TASK_COMPLETED",
    user: "Sarah Johnson",
    target: "Follow up call",
    date: "3 hours ago",
  },
  {
    id: "3",
    type: "LEAD_STATUS_CHANGED",
    user: "Michael Brown",
    target: "Globex Corp",
    status: "QUALIFIED",
    date: "5 hours ago",
  },
  {
    id: "4",
    type: "NOTE",
    user: "Emily Davis",
    target: "Discussed pricing options",
    date: "1 day ago",
  },
  {
    id: "5",
    type: "FILE_UPLOADED",
    user: "David Wilson",
    target: "Contract.pdf",
    date: "2 days ago",
  },
]

const activityMessages = {
  LEAD_CREATED: "created a new lead",
  TASK_COMPLETED: "completed task",
  LEAD_STATUS_CHANGED: "changed lead status to",
  NOTE: "added note",
  FILE_UPLOADED: "uploaded file",
  CUSTOMER_CREATED: "added a new customer",
  EMAIL: "sent an email to",
  CALL: "logged a call with",
}

export function RecentActivity() {
  return (
    <div className="space-y-8">
      {recentActivity.map((activity) => (
        <div key={activity.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {activity.user
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {activity.user}{" "}
              <span className="text-muted-foreground">
                {activityMessages[activity.type as keyof typeof activityMessages]}{" "}
                {activity.status ? activity.status.toLowerCase() : ""}
              </span>{" "}
              <span className="font-medium">{activity.target}</span>
            </p>
            <p className="text-sm text-muted-foreground">{activity.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

