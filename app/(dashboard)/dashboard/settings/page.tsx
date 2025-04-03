import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/dashboard/settings/profile-settings"
import { CompanySettings } from "@/components/dashboard/settings/company-settings"
import { BillingSettings } from "@/components/dashboard/settings/billing-settings"

export const metadata: Metadata = {
  title: "Settings | PulseCRM",
  description: "Manage your account and company settings",
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const companyId = session.user.companyId

  if (!companyId) {
    redirect("/onboarding")
  }

  // Get user data
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
  })

  // Get company data
  const company = await db.company.findUnique({
    where: {
      id: companyId,
    },
  })

  if (!user || !company) {
    redirect("/dashboard")
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and company settings</p>
      </div>
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings user={user} />
        </TabsContent>
        <TabsContent value="company" className="space-y-4">
          <CompanySettings company={company} isAdmin={user.role === "ADMIN"} />
        </TabsContent>
        <TabsContent value="billing" className="space-y-4">
          <BillingSettings company={company} isAdmin={user.role === "ADMIN"} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

