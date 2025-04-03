import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"

import { db } from "@/lib/db"
import { createStripeCustomer } from "@/lib/stripe"

const registerSchema = z.object({
  name: z.string().min(2),
  companyName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const body = registerSchema.parse(json)

    const existingUser = await db.user.findUnique({
      where: {
        email: body.email,
      },
    })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    const hashedPassword = await hash(body.password, 10)

    // Create Stripe customer if Stripe is configured
    let stripeCustomerId = null
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripeCustomer = await createStripeCustomer(body.email, body.companyName)
        stripeCustomerId = stripeCustomer.id
      } catch (error) {
        console.error("Failed to create Stripe customer:", error)
        // Continue without Stripe customer - we'll create it later if needed
      }
    }

    // Create company
    const company = await db.company.create({
      data: {
        name: body.companyName,
        stripeCustomerId,
        planType: "FREE_TRIAL",
        maxSeats: 5,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    })

    // Create user
    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: "ADMIN", // First user is admin
        companyId: company.id,
      },
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 })
  }
}

