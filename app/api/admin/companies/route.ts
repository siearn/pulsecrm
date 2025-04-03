import { NextResponse } from "next/server"
import { z } from "zod"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { randomUUID } from "crypto"
import { sendInviteEmail } from "@/lib/email"

// Schema for company creation
const createCompanySchema = z.object({
  name: z.string().min(2),
  adminEmail: z.string().email(),
  planType: z.enum(["FREE_TRIAL", "STARTER", "PRO", "ENTERPRISE"]),
  maxSeats: z.number().int().min(1),
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

    // Check if user is super admin
    const userRole = user.publicMetadata.role as string
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Only super admins can create companies" }, { status: 403 })
    }

    // Parse and validate the request body
    const json = await req.json()
    const body = createCompanySchema.parse(json)

    // Check if admin email already exists
    const existingUser = await db.user.findUnique({
      where: { email: body.adminEmail },
    })

    if (existingUser && existingUser.companyId) {
      return NextResponse.json(
        {
          message: "This email is already associated with a company",
        },
        { status: 400 },
      )
    }

    // Create the company
    const company = await db.company.create({
      data: {
        name: body.name,
        planType: body.planType,
        maxSeats: body.maxSeats,
        usedSeats: 0, // Will be incremented when admin accepts invite
        trialEndsAt:
          body.planType === "FREE_TRIAL"
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
            : null,
      },
    })

    // Create an invitation for the admin
    const token = randomUUID()
    const expires = new Date()
    expires.setHours(expires.getHours() + 72) // 72 hours expiration

    const invite = await db.invite.create({
      data: {
        email: body.adminEmail,
        role: "ADMIN",
        token: token,
        expires: expires,
        companyId: company.id,
        invitedById: userId,
      },
    })

    // Send invitation email
    await sendInviteEmail({
      email: body.adminEmail,
      name: body.adminEmail,
      companyName: body.name,
      inviterName: "PulseCRM Admin",
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
      expiresIn: "72 hours",
    })

    return NextResponse.json(
      {
        message: "Company created successfully",
        company: {
          id: company.id,
          name: company.name,
          planType: company.planType,
          maxSeats: company.maxSeats,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating company:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ message: "Failed to create company" }, { status: 500 })
  }
}

// Get all companies (admin only)
export async function GET(req: Request) {
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
      return NextResponse.json({ message: "Only super admins can view all companies" }, { status: 403 })
    }

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

    return NextResponse.json({ companies }, { status: 200 })
  } catch (error) {
    console.error("Error fetching companies:", error)
    return NextResponse.json({ message: "Failed to fetch companies" }, { status: 500 })
  }
}

