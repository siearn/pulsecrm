import { NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const token = params.token

    // Find the invite
    const invite = await db.invite.findUnique({
      where: { token },
      include: { company: true },
    })

    if (!invite) {
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 })
    }

    // Check if invitation has expired
    if (new Date() > invite.expires) {
      return NextResponse.json({ message: "Invitation has expired" }, { status: 400 })
    }

    // Return invite details (for the frontend to display)
    return NextResponse.json(
      {
        invite: {
          email: invite.email,
          name: invite.name,
          role: invite.role,
          companyName: invite.company.name,
          expires: invite.expires,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching invite:", error)
    return NextResponse.json({ message: "Failed to fetch invitation" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const token = params.token
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    // Find the invite
    const invite = await db.invite.findUnique({
      where: { token },
      include: { company: true },
    })

    if (!invite) {
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 })
    }

    // Check if invitation has expired
    if (new Date() > invite.expires) {
      return NextResponse.json({ message: "Invitation has expired" }, { status: 400 })
    }

    // Get the user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId)

    // Verify the user's email matches the invite
    const userEmail = clerkUser.emailAddresses.find(
      (email) => email.emailAddress.toLowerCase() === invite.email.toLowerCase(),
    )

    if (!userEmail) {
      return NextResponse.json(
        {
          message: "Your email address doesn't match the invitation",
        },
        { status: 400 },
      )
    }

    // Update the user's metadata in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        companyId: invite.companyId,
        role: invite.role,
      },
    })

    // Create or update the user in our database
    const user = await db.user.upsert({
      where: { email: invite.email },
      update: {
        clerkId: userId,
        companyId: invite.companyId,
        role: invite.role,
        name: invite.name || clerkUser.firstName || null,
      },
      create: {
        clerkId: userId,
        email: invite.email,
        companyId: invite.companyId,
        role: invite.role,
        name: invite.name || clerkUser.firstName || null,
      },
    })

    // Update company's used seats count
    await db.company.update({
      where: { id: invite.companyId },
      data: {
        usedSeats: {
          increment: 1,
        },
      },
    })

    // Delete the invite
    await db.invite.delete({
      where: { id: invite.id },
    })

    return NextResponse.json(
      {
        message: "Invitation accepted successfully",
        companyId: invite.companyId,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error accepting invite:", error)
    return NextResponse.json({ message: "Failed to accept invitation" }, { status: 500 })
  }
}

// Allow admins to delete/cancel invites
export async function DELETE(req: Request, { params }: { params: { token: string } }) {
  try {
    const { userId } = await req.json()
    const token = params.token

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get the user from Clerk
    const user = await clerkClient.users.getUser(userId)

    // Get company ID from user metadata
    const companyId = user.publicMetadata.companyId as string | undefined
    const userRole = user.publicMetadata.role as string

    if (!companyId) {
      return NextResponse.json({ message: "User does not belong to a company" }, { status: 400 })
    }

    // Check if user is admin or manager
    if (userRole !== "ADMIN" && userRole !== "MANAGER" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Only admins and managers can cancel invites" }, { status: 403 })
    }

    // Find the invite
    const invite = await db.invite.findUnique({
      where: { token },
    })

    if (!invite) {
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 })
    }

    // Verify the invite belongs to the user's company
    if (invite.companyId !== companyId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Delete the invite
    await db.invite.delete({
      where: { id: invite.id },
    })

    return NextResponse.json({ message: "Invitation cancelled successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error cancelling invite:", error)
    return NextResponse.json({ message: "Failed to cancel invitation" }, { status: 500 })
  }
}

