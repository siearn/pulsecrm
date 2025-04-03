import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { Users, Building, CreditCard, TrendingUp } from "lucide-react"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminOverview } from "@/components/admin/admin-overview"
import { RecentCompanies } from "@/components/admin/recent-companies"

export const metadata: Metadata = {
  title: "Admin Dashboard | PulseCRM",
  description: "Admin dashboard for PulseCRM",
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only super admins can access the admin panel
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  // Get counts
  const companiesCount = await db.company.count()
  const usersCount = await db.user.count()
  const activeSubscriptionsCount = await db.company.count({
    where: {
      stripeSubscriptionId: {
        not: null,
      },
    },
  })

  // Get companies by plan type
  const companiesByPlan = await db.company.groupBy({
    by: ["planType"],
    _count: true,
  })

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companiesCount}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
            <p className="text-xs text-muted-foreground">+7% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptionsCount}</div>
            <p className="text-xs text-muted-foreground">
              {((activeSubscriptionsCount / companiesCount) * 100).toFixed(1)}% of companies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,500</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <AdminOverview />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Companies</CardTitle>
            <CardDescription>Recently registered companies</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentCompanies />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Companies by Plan</CardTitle>
            <CardDescription>Distribution of companies by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companiesByPlan.map((plan) => (
                <div key={plan.planType} className="flex items-center">
                  <div className="w-1/3 text-sm font-medium">
                    {plan.planType.charAt(0) + plan.planType.slice(1).toLowerCase().replace("_", " ")}
                  </div>
                  <div className="flex w-2/3 items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(plan._count / companiesCount) * 100}%`,
                      }}
                    />
                    <div className="text-sm text-muted-foreground">
                      {plan._count} ({((plan._count / companiesCount) * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart will be displayed here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

