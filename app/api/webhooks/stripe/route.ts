import { NextResponse } from "next/server"
import { headers } from "next/headers"
import type Stripe from "stripe"

import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      if (!session?.metadata?.companyId) {
        return new NextResponse("Company ID is required", { status: 400 })
      }

      // Update the company with the subscription ID
      await db.company.update({
        where: {
          id: session.metadata.companyId,
        },
        data: {
          stripeSubscriptionId: session.subscription as string,
          planType: session.metadata.planType as "STARTER" | "PRO" | "ENTERPRISE",
          maxSeats: Number.parseInt(session.metadata.maxSeats || "5"),
        },
      })

      break
    case "customer.subscription.updated":
      const subscription = event.data.object as Stripe.Subscription

      // Find the company with this subscription
      const company = await db.company.findFirst({
        where: {
          stripeSubscriptionId: subscription.id,
        },
      })

      if (!company) {
        return new NextResponse("Company not found", { status: 404 })
      }

      // Update the company with the new subscription status
      await db.company.update({
        where: {
          id: company.id,
        },
        data: {
          planType: subscription.metadata.planType as "STARTER" | "PRO" | "ENTERPRISE",
          maxSeats: Number.parseInt(subscription.metadata.maxSeats || "5"),
        },
      })

      break
    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object as Stripe.Subscription

      // Find the company with this subscription
      const companyToUpdate = await db.company.findFirst({
        where: {
          stripeSubscriptionId: deletedSubscription.id,
        },
      })

      if (!companyToUpdate) {
        return new NextResponse("Company not found", { status: 404 })
      }

      // Update the company to free plan
      await db.company.update({
        where: {
          id: companyToUpdate.id,
        },
        data: {
          planType: "FREE_TRIAL",
          maxSeats: 5,
        },
      })

      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return new NextResponse(null, { status: 200 })
}

