import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Users, UserPlus, Clock, DollarSign } from "lucide-react"
import { Suspense } from "react"
import { auth, currentUser } from "@clerk/nextjs/server"

import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/dashboard/overview"
import { RecentLeads } from "@/components/dashboard/recent-leads"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export const metadata: Metadata = {
  title: "Dashboard | PulseCRM",
  description: "CRM dashboard overview",
}

async function DashboardContent({ companyId }: { companyId: string }) {
  // Get company data
  const company = await db.company.findUnique({
    where: {
      id: companyId,
    },
  })

  // Get counts
  const [leadsCount, customersCount, tasksCount, pendingTasksCount, leadsByStatus, pipelineValue] = await Promise.all([
    db.lead.count({
      where: {
        companyId,
      },
    }),
    db.customer.count({
      where: {
        companyId,
      },
    }),
    db.task.count({
      where: {
        companyId,
      },
    }),
    db.task.count({
      where: {
        companyId,
        status: "PENDING",
      },
    }),
    db.lead.groupBy({
      by: ["status"],
      where: {
        companyId,
      },
      _count: true,
    }),
    db.lead.aggregate({
      where: {
        companyId,
        status: {
          notIn: ["WON", "LOST"],
        },
      },
      _sum: {
        value: true,
      },
    }),
  ])

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">Dashboard</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Welcome back!</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{leadsCount}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{customersCount}</div>
            <p className="text-xs text-muted-foreground">+7% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              ${pipelineValue._sum.value?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{pendingTasksCount}</div>
            <p className="text-xs text-muted-foreground">{tasksCount - pendingTasksCount} completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-soft">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-soft">
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Recently added leads in your pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentLeads />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-soft">
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
                      className="h-2 rounded-full bg-blue-600 dark:bg-blue-500"
                      style={{
                        width: `${(status._count / (leadsCount || 1)) * 100}%`,
                      }}
                    />
                    <div className="text-sm text-muted-foreground">{status._count}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-soft">
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

export default async function DashboardPage() {
  const { userId } = auth()

  if (!userId) {
    redirect("/login")
  }

  // Get the user's company ID from metadata
  const user = await currentUser()
  const companyId = user?.publicMetadata?.companyId as string | undefined

  if (!companyId) {
    redirect("/onboarding")
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <LoadingSpinner size={40} />
        </div>
      }
    >
      <DashboardContent companyId={companyId} />
    </Suspense>
  )
}

