import { NextResponse } from "next/server"
import { z } from "zod"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { randomUUID } from "crypto"
import { sendInviteEmail } from "@/lib/email"

// Schema for invite creation
const createInviteSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["USER", "MANAGER", "ADMIN"]).default("USER"),
})

export async function POST(req: Request) {
  try {
    // Get the authenticated user
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get the user from Clerk
    const user = await clerkClient.users.getUser(userId)

    // Get company ID from user metadata
    const companyId = user.publicMetadata.companyId as string | undefined

    if (!companyId) {
      return NextResponse.json({ message: "User does not belong to a company" }, { status: 400 })
    }

    // Check if user is admin or manager
    const userRole = user.publicMetadata.role as string
    if (userRole !== "ADMIN" && userRole !== "MANAGER" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Only admins and managers can send invites" }, { status: 403 })
    }

    // Parse and validate the request body
    const json = await req.json()
    const body = createInviteSchema.parse(json)

    // Get company details
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { users: true, invites: true },
    })

    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 })
    }

    // Check if the company has reached its seat limit
    const activeUsers = company.users.length
    const pendingInvites = company.invites.length
    const totalSeats = activeUsers + pendingInvites

    if (totalSeats >= company.maxSeats) {
      return NextResponse.json(
        {
          message: "You have reached your plan's seat limit. Please upgrade your plan to invite more users.",
          currentSeats: activeUsers,
          pendingInvites: pendingInvites,
          maxSeats: company.maxSeats,
        },
        { status: 400 },
      )
    }

    // Check if user is already a member
    const existingUser = await db.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser && existingUser.companyId === companyId) {
      return NextResponse.json({ message: "User is already a member of your company" }, { status: 400 })
    }

    // Check if there's already a pending invite
    const existingInvite = await db.invite.findFirst({
      where: {
        email: body.email,
        companyId: companyId,
      },
    })

    if (existingInvite) {
      return NextResponse.json({ message: "An invitation has already been sent to this email" }, { status: 400 })
    }

    // Create a unique token and set expiration (48 hours from now)
    const token = randomUUID()
    const expires = new Date()
    expires.setHours(expires.getHours() + 48)

    // Create the invite
    const invite = await db.invite.create({
      data: {
        email: body.email,
        name: body.name,
        role: body.role,
        token: token,
        expires: expires,
        companyId: companyId,
        invitedById: userId,
      },
    })

    // Send invitation email
    await sendInviteEmail({
      email: body.email,
      name: body.name || body.email,
      companyName: company.name,
      inviterName: user.firstName || user.username || "A team member",
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
      expiresIn: "48 hours",
    })

    return NextResponse.json(
      {
        message: "Invitation sent successfully",
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expires: invite.expires,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error sending invite:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ message: "Failed to send invitation" }, { status: 500 })
  }
}

// Get all invites for a company
export async function GET(req: Request) {
  try {
    // Get the authenticated user
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get the user from Clerk
    const user = await clerkClient.users.getUser(userId)

    // Get company ID from user metadata
    const companyId = user.publicMetadata.companyId as string | undefined

    if (!companyId) {
      return NextResponse.json({ message: "User does not belong to a company" }, { status: 400 })
    }

    // Check if user is admin or manager
    const userRole = user.publicMetadata.role as string
    if (userRole !== "ADMIN" && userRole !== "MANAGER" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Only admins and managers can view invites" }, { status: 403 })
    }

    // Get all invites for the company
    const invites = await db.invite.findMany({
      where: {
        companyId: companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ invites }, { status: 200 })
  } catch (error) {
    console.error("Error fetching invites:", error)
    return NextResponse.json({ message: "Failed to fetch invitations" }, { status: 500 })
  }
}

