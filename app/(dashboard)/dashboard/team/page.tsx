import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { Suspense } from "react"
import { auth, currentUser } from "@clerk/nextjs/server"

import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { TeamTable } from "@/components/dashboard/team/team-table"
import { InviteUserDialog } from "@/components/dashboard/team/invite-user-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { PendingInvitesTable } from "@/components/dashboard/team/pending-invites-table"

export const metadata: Metadata = {
  title: "Team | PulseCRM",
  description: "Manage your team members",
}

async function TeamContent({ companyId }: { companyId: string }) {
  // Get current user
  const user = await currentUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin or manager
  const isAdmin = user.publicMetadata.role === "ADMIN" || user.publicMetadata.role === "SUPER_ADMIN"
  const isManager = user.publicMetadata.role === "MANAGER"
  const canManageTeam = isAdmin || isManager

  // Get company data
  const company = await db.company.findUnique({
    where: {
      id: companyId,
    },
  })

  if (!company) {
    redirect("/dashboard")
  }

  // Get team members
  const teamMembers = await db.user.findMany({
    where: {
      companyId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Get pending invites
  const pendingInvites = await db.invite.findMany({
    where: {
      companyId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Calculate seats information
  const usedSeats = teamMembers.length
  const pendingSeats = pendingInvites.length
  const availableSeats = company.maxSeats - usedSeats - pendingSeats

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
        {canManageTeam && (
          <InviteUserDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            }
            company={company}
            teamMembers={teamMembers}
            pendingInvites={pendingInvites}
          />
        )}
      </div>

      <div className="space-y-4">
        {/* Seats information */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-medium">Team Seats</h3>
              <p className="text-sm text-muted-foreground">
                {usedSeats} active {usedSeats === 1 ? "user" : "users"} • {pendingSeats} pending{" "}
                {pendingSeats === 1 ? "invitation" : "invitations"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">
                {usedSeats + pendingSeats} of {company.maxSeats} seats used
              </div>
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${((usedSeats + pendingSeats) / company.maxSeats) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active team members */}
        <div className="rounded-md border">
          <TeamTable teamMembers={teamMembers} isAdmin={isAdmin} currentUserId={user.id} />
        </div>

        {/* Pending invitations */}
        {pendingInvites.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Pending Invitations</h3>
            <div className="rounded-md border">
              <PendingInvitesTable invites={pendingInvites} canManage={canManageTeam} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default async function TeamPage() {
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
      <TeamContent companyId={companyId} />
    </Suspense>
  )
}

