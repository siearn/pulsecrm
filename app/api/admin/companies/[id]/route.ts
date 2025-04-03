import { NextResponse } from "next/server"
import { z } from "zod"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

// Schema for company update
const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  planType: z.enum(["FREE_TRIAL", "STARTER", "PRO", "ENTERPRISE"]).optional(),
  maxSeats: z.number().int().min(1).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // Get the authenticated user
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get the user from Clerk
    const user = await clerkClient.users.getUser(userId)

    // Check if user is super admin
    const userRole = user.publicMetadata.role as string
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Only super admins can update companies" }, { status: 403 })
    }

    // Parse and validate the request body
    const json = await req.json()
    const body = updateCompanySchema.parse(json)

    // Get the company
    const company = await db.company.findUnique({
      where: { id: params.id },
    })

    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 })
    }

    // Update the company
    const updatedCompany = await db.company.update({
      where: { id: params.id },
      data: {
        name: body.name,
        planType: body.planType,
        maxSeats: body.maxSeats,
      },
    })

    return NextResponse.json(
      {
        message: "Company updated successfully",
        company: updatedCompany,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating company:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ message: "Failed to update company" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Get the authenticated user
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get the user from Clerk
    const user = await clerkClient.users.getUser(userId)

    // Check if user is super admin
    const userRole = user.publicMetadata.role as string
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Only super admins can delete companies" }, { status: 403 })
    }

    // Get the company
    const company = await db.company.findUnique({
      where: { id: params.id },
      include: {
        users: true,
      },
    })

    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 })
    }

    // Update all users to remove company association
    for (const user of company.users) {
      // Update user in database
      await db.user.update({
        where: { id: user.id },
        data: {
          companyId: null,
          role: "USER", // Reset to basic role
        },
      })

      // If user has a Clerk ID, update their metadata
      if (user.clerkId) {
        try {
          await clerkClient.users.updateUser(user.clerkId, {
            publicMetadata: {
              companyId: null,
              role: "USER",
            },
          })
        } catch (error) {
          console.error(`Error updating Clerk user ${user.clerkId}:`, error)
          // Continue with deletion even if Clerk update fails
        }
      }
    }

    // Delete the company
    await db.company.delete({
      where: { id: params.id },
    })

    return NextResponse.json(
      {
        message: "Company deleted successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error deleting company:", error)
    return NextResponse.json({ message: "Failed to delete company" }, { status: 500 })
  }
}

