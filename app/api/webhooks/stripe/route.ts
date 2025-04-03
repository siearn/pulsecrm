import { NextResponse } from "next/server"
import { headers } from "next/headers"
import type Stripe from "stripe"

import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { logger } from "@/lib/logger"
import { webhookLimiter, withRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  // Apply rate limiting
  const rateLimitResult = await withRateLimit(webhookLimiter)(req)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await req.text()
    const signature = headers().get("Stripe-Signature") as string

    if (!signature) {
      logger.error({ message: "Missing Stripe signature" })
      return new NextResponse("Missing Stripe signature", { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error({ message: "Missing Stripe webhook secret" })
      return new NextResponse("Stripe webhook secret is not configured", { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error: any) {
      logger.error({
        message: "Invalid Stripe webhook signature",
        error: error.message,
      })
      return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    logger.info({
      message: "Received Stripe webhook",
      event: event.type,
      id: event.id,
    })

    const session = event.data.object as Stripe.Checkout.Session
    const subscription = event.data.object as Stripe.Subscription

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        if (!session?.metadata?.companyId) {
          logger.error({ message: "Missing companyId in session metadata", session })
          return new NextResponse("Company ID is required", { status: 400 })
        }

        try {
          // Update the company with the subscription ID
          await db.company.update({
            where: {
              id: session.metadata.companyId,
            },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              planType: session.metadata.planType as "STARTER" | "PRO" | "ENTERPRISE",
              maxSeats: Number.parseInt(session.metadata.maxSeats || "5"),
            },
          })

          logger.info({
            message: "Company subscription updated from checkout",
            companyId: session.metadata.companyId,
            planType: session.metadata.planType,
          })
        } catch (error) {
          logger.error({
            message: "Error updating company from checkout session",
            error: error instanceof Error ? error.message : "Unknown error",
            companyId: session.metadata.companyId,
          })
          // We don't want to return an error response here as Stripe will retry
        }
        break

      case "customer.subscription.updated":
        try {
          // Find the company with this subscription
          const company = await db.company.findFirst({
            where: {
              stripeSubscriptionId: subscription.id,
            },
          })

          if (!company) {
            logger.error({
              message: "Company not found for subscription",
              subscriptionId: subscription.id,
            })
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

          logger.info({
            message: "Company subscription updated",
            companyId: company.id,
            planType: subscription.metadata.planType,
          })
        } catch (error) {
          logger.error({
            message: "Error updating company from subscription update",
            error: error instanceof Error ? error.message : "Unknown error",
            subscriptionId: subscription.id,
          })
        }
        break

      case "customer.subscription.deleted":
        try {
          // Find the company with this subscription
          const companyToUpdate = await db.company.findFirst({
            where: {
              stripeSubscriptionId: subscription.id,
            },
          })

          if (!companyToUpdate) {
            logger.error({
              message: "Company not found for deleted subscription",
              subscriptionId: subscription.id,
            })
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
              stripeSubscriptionId: null,
            },
          })

          logger.info({
            message: "Company subscription deleted",
            companyId: companyToUpdate.id,
          })
        } catch (error) {
          logger.error({
            message: "Error updating company from subscription deletion",
            error: error instanceof Error ? error.message : "Unknown error",
            subscriptionId: subscription.id,
          })
        }
        break

      default:
        logger.info({
          message: `Unhandled event type ${event.type}`,
        })
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    logger.error({
      message: "Error processing Stripe webhook",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

