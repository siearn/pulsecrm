import { NextResponse } from "next/server"
import { z } from "zod"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "USER"]),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // Get the authenticated user
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get the user from Clerk
    const currentUser = await clerkClient.users.getUser(userId)

    // Get company ID from user metadata
    const companyId = currentUser.publicMetadata.companyId as string | undefined
    const userRole = currentUser.publicMetadata.role as string

    if (!companyId) {
      return NextResponse.json({ message: "User does not belong to a company" }, { status: 400 })
    }

    // Check if user is admin
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Only admins can change user roles" }, { status: 403 })
    }

    // Get the user to update
    const userToUpdate = await db.user.findUnique({
      where: { id: params.id },
    })

    if (!userToUpdate) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Verify the user belongs to the same company
    if (userToUpdate.companyId !== companyId) {
      return NextResponse.json({ message: "User does not belong to your company" }, { status: 403 })
    }

    // Parse and validate the request body
    const json = await req.json()
    const body = updateRoleSchema.parse(json)

    // Update the user's role in our database
    await db.user.update({
      where: { id: params.id },
      data: { role: body.role },
    })

    // If the user has a Clerk ID, update their metadata
    if (userToUpdate.clerkId) {
      await clerkClient.users.updateUser(userToUpdate.clerkId, {
        publicMetadata: {
          ...currentUser.publicMetadata,
          role: body.role,
        },
      })
    }

    return NextResponse.json(
      {
        message: "User role updated successfully",
        role: body.role,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating user role:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ message: "Failed to update user role" }, { status: 500 })
  }
}

