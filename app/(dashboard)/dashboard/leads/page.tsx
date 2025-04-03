import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { Suspense } from "react"

import { authOptions } from "@/lib/auth"
import { prisma, withErrorHandling } from "@/lib/db-utils"
import { Button } from "@/components/ui/button"
import { LeadsTable } from "@/components/dashboard/leads/leads-table"
import { LeadsPipeline } from "@/components/dashboard/leads/leads-pipeline"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AddLeadDialog } from "@/components/dashboard/leads/add-lead-dialog"

export const metadata: Metadata = {
  title: "Leads | PulseCRM",
  description: "Manage your leads and sales pipeline",
}

async function LeadsContent({ companyId }: { companyId: string }) {
  // Get leads with error handling
  const leads = await withErrorHandling(
    () =>
      prisma.lead.findMany({
        where: {
          companyId,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
    "Failed to fetch leads",
  )

  // Get team members for assignment
  const teamMembers = await withErrorHandling(
    () =>
      prisma.user.findMany({
        where: {
          companyId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      }),
    "Failed to fetch team members",
  )

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
        <AddLeadDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          }
          teamMembers={teamMembers}
          companyId={companyId}
        />
      </div>
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="space-y-4">
          <LeadsPipeline leads={leads} teamMembers={teamMembers} />
        </TabsContent>
        <TabsContent value="table" className="space-y-4">
          <LeadsTable leads={leads} teamMembers={teamMembers} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default async function LeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const companyId = session.user.companyId

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
      <LeadsContent companyId={companyId} />
    </Suspense>
  )
}

