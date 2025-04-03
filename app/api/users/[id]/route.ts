import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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
      return NextResponse.json({ message: "Only admins can remove users" }, { status: 403 })
    }

    // Get the user to remove
    const userToRemove = await db.user.findUnique({
      where: { id: params.id },
    })

    if (!userToRemove) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Verify the user belongs to the same company
    if (userToRemove.companyId !== companyId) {
      return NextResponse.json({ message: "User does not belong to your company" }, { status: 403 })
    }

    // Prevent removing yourself
    if (userToRemove.clerkId === userId) {
      return NextResponse.json({ message: "You cannot remove yourself" }, { status: 400 })
    }

    // Update the user in our database (remove company association)
    await db.user.update({
      where: { id: params.id },
      data: {
        companyId: null,
        role: "USER", // Reset to basic role
      },
    })

    // Update company's used seats count
    await db.company.update({
      where: { id: companyId },
      data: {
        usedSeats: {
          decrement: 1,
        },
      },
    })

    // If the user has a Clerk ID, update their metadata
    if (userToRemove.clerkId) {
      try {
        await clerkClient.users.updateUser(userToRemove.clerkId, {
          publicMetadata: {
            companyId: null,
            role: "USER",
          },
        })
      } catch (error) {
        console.error("Error updating Clerk user metadata:", error)
        // Continue with the removal even if Clerk update fails
      }
    }

    return NextResponse.json(
      {
        message: "User removed successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error removing user:", error)
    return NextResponse.json({ message: "Failed to remove user" }, { status: 500 })
  }
}

