import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { Users, UserPlus, Clock, DollarSign } from "lucide-react"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/dashboard/overview"
import { RecentLeads } from "@/components/dashboard/recent-leads"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export const metadata: Metadata = {
  title: "Dashboard | PulseCRM",
  description: "CRM dashboard overview",
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const companyId = session.user.companyId

  if (!companyId) {
    redirect("/onboarding")
  }

  // Get company data
  const company = await db.company.findUnique({
    where: {
      id: companyId,
    },
  })

  // Get counts
  const leadsCount = await db.lead.count({
    where: {
      companyId,
    },
  })

  const customersCount = await db.customer.count({
    where: {
      companyId,
    },
  })

  const tasksCount = await db.task.count({
    where: {
      companyId,
    },
  })

  const pendingTasksCount = await db.task.count({
    where: {
      companyId,
      status: "PENDING",
    },
  })

  // Get leads by status for pipeline overview
  const leadsByStatus = await db.lead.groupBy({
    by: ["status"],
    where: {
      companyId,
    },
    _count: true,
  })

  // Calculate pipeline value
  const pipelineValue = await db.lead.aggregate({
    where: {
      companyId,
      status: {
        notIn: ["WON", "LOST"],
      },
    },
    _sum: {
      value: true,
    },
  })

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsCount}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersCount}</div>
            <p className="text-xs text-muted-foreground">+7% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pipelineValue._sum.value?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasksCount}</div>
            <p className="text-xs text-muted-foreground">{tasksCount - pendingTasksCount} completed</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Recently added leads in your pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentLeads />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Pipeline Status</CardTitle>
            <CardDescription>Current distribution of leads by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadsByStatus.map((status) => (
                <div key={status.status} className="flex items-center">
                  <div className="w-1/3 text-sm font-medium">
                    {status.status.charAt(0) + status.status.slice(1).toLowerCase().replace("_", " ")}
                  </div>
                  <div className="flex w-2/3 items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(status._count / leadsCount) * 100}%`,
                      }}
                    />
                    <div className="text-sm text-muted-foreground">{status._count}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

