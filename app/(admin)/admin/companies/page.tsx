import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { auth, currentUser } from "@clerk/nextjs/server"
import { Plus } from "lucide-react"

import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { CompaniesTable } from "@/components/admin/companies-table"
import { CreateCompanyDialog } from "@/components/admin/create-company-dialog"

export const metadata: Metadata = {
  title: "Companies | Admin Dashboard",
  description: "Manage all companies in the system",
}

async function CompaniesContent() {
  // Get all companies
  const companies = await db.company.findMany({
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
        <CreateCompanyDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Company
            </Button>
          }
        />
      </div>

      <div className="rounded-md border">
        <CompaniesTable companies={companies} />
      </div>
    </div>
  )
}

export default async function CompaniesPage() {
  const { userId } = auth()

  if (!userId) {
    redirect("/login")
  }

  // Get the user's role from metadata
  const user = await currentUser()
  const userRole = user?.publicMetadata?.role as string | undefined

  // Only super admins can access this page
  if (userRole !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <LoadingSpinner size={40} />
        </div>
      }
    >
      <CompaniesContent />
    </Suspense>
  )
}

