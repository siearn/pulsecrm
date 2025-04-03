import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { createStripeBillingPortalSession } from "@/lib/stripe"

export async function POST(req: Request) {
  try {
    // Get the authenticated user
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get the user
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get company ID from user metadata
    const companyId = user.publicMetadata.companyId as string | undefined
    const userRole = user.publicMetadata.role as string

    if (!companyId) {
      return NextResponse.json({ message: "User does not belong to a company" }, { status: 400 })
    }

    // Check if user is admin
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Only admins can manage billing" }, { status: 403 })
    }

    // Get the company
    const company = await db.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 })
    }

    // Check if company has a Stripe customer ID
    if (!company.stripeCustomerId) {
      return NextResponse.json({ message: "No billing information found" }, { status: 400 })
    }

    // Create Stripe billing portal session
    const session = await createStripeBillingPortalSession(
      company.stripeCustomerId,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing`,
    )

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error("Error creating billing portal session:", error)
    return NextResponse.json({ message: "Failed to create billing portal session" }, { status: 500 })
  }
}

