import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { TeamTable } from "@/components/dashboard/team/team-table"
import { InviteUserDialog } from "@/components/dashboard/team/invite-user-dialog"

export const metadata: Metadata = {
  title: "Team | PulseCRM",
  description: "Manage your team members",
}

export default async function TeamPage() {
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

  // Get team members
  const teamMembers = await db.user.findMany({
    where: {
      companyId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Team</h2>
        <InviteUserDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          }
          company={company}
          teamMembers={teamMembers}
        />
      </div>
      <div className="space-y-4">
        <div className="rounded-md border">
          <TeamTable teamMembers={teamMembers} />
        </div>
      </div>
    </div>
  )
}

