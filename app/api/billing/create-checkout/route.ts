import { NextResponse } from "next/server"
import { z } from "zod"
import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { createStripeCustomer, createStripeCheckoutSession } from "@/lib/stripe"

const checkoutSchema = z.object({
  planType: z.enum(["STARTER", "PRO", "ENTERPRISE"]),
  quantity: z.number().int().min(1).optional(),
})

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

    // Parse and validate the request body
    const json = await req.json()
    const body = checkoutSchema.parse(json)

    // Set the price ID based on the plan type
    let priceId: string
    switch (body.planType) {
      case "STARTER":
        priceId = process.env.STRIPE_PRICE_STARTER!
        break
      case "PRO":
        priceId = process.env.STRIPE_PRICE_PRO!
        break
      case "ENTERPRISE":
        priceId = process.env.STRIPE_PRICE_ENTERPRISE!
        break
      default:
        return NextResponse.json({ message: "Invalid plan type" }, { status: 400 })
    }

    // Get or create Stripe customer
    let customerId = company.stripeCustomerId
    if (!customerId) {
      const customer = await createStripeCustomer(user.emailAddresses[0].emailAddress, company.name)
      customerId = customer.id

      // Update company with Stripe customer ID
      await db.company.update({
        where: { id: companyId },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create Stripe checkout session
    const quantity = body.quantity || company.usedSeats || 1
    const session = await createStripeCheckoutSession(
      customerId,
      priceId,
      quantity,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing&success=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing&canceled=true`,
      {
        companyId,
        planType: body.planType,
        maxSeats: quantity,
      },
    )

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error("Error creating checkout session:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ message: "Failed to create checkout session" }, { status: 500 })
  }
}

