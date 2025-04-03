import { Webhook } from "svix"
import { headers } from "next/headers"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { webhookLimiter, withRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  // Apply rate limiting
  const rateLimitResult = await withRateLimit(webhookLimiter)(req)
  if (rateLimitResult) return rateLimitResult

  try {
    // Get the headers
    const headerPayload = headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      logger.error({ message: "Missing svix headers" })
      return new NextResponse("Error: Missing svix headers", {
        status: 400,
      })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "")

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent
    } catch (err) {
      logger.error({
        message: "Error verifying webhook",
        error: err instanceof Error ? err.message : "Unknown error",
      })
      return new NextResponse("Error verifying webhook", {
        status: 400,
      })
    }

    // Handle the webhook
    const eventType = evt.type

    logger.info({
      message: "Received Clerk webhook",
      eventType,
      userId: evt.data.id,
    })

    if (eventType === "user.created") {
      // A new user was created in Clerk
      const { id, email_addresses, first_name, last_name } = evt.data

      // Get the primary email
      const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id)

      if (primaryEmail) {
        try {
          // Check if user already exists in our database
          const existingUser = await db.user.findUnique({
            where: {
              email: primaryEmail.email_address,
            },
          })

          if (!existingUser) {
            // Create user in our database
            await db.user.create({
              data: {
                clerkId: id,
                email: primaryEmail.email_address,
                name: `${first_name || ""} ${last_name || ""}`.trim() || null,
              },
            })

            logger.info({
              message: "Created new user in database",
              clerkId: id,
              email: primaryEmail.email_address,
            })
          } else {
            // Update existing user with Clerk ID
            await db.user.update({
              where: {
                email: primaryEmail.email_address,
              },
              data: {
                clerkId: id,
              },
            })

            logger.info({
              message: "Updated existing user with Clerk ID",
              clerkId: id,
              email: primaryEmail.email_address,
            })
          }
        } catch (error) {
          logger.error({
            message: "Error creating/updating user in database",
            error: error instanceof Error ? error.message : "Unknown error",
            clerkId: id,
            email: primaryEmail.email_address,
          })
        }
      }
    } else if (eventType === "user.updated") {
      // User was updated in Clerk
      const { id, email_addresses, first_name, last_name } = evt.data

      // Get the primary email
      const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id)

      if (primaryEmail) {
        try {
          // Find user by Clerk ID
          const existingUser = await db.user.findFirst({
            where: {
              clerkId: id,
            },
          })

          if (existingUser) {
            // Update user in our database
            await db.user.update({
              where: {
                id: existingUser.id,
              },
              data: {
                email: primaryEmail.email_address,
                name: `${first_name || ""} ${last_name || ""}`.trim() || null,
              },
            })

            logger.info({
              message: "Updated user in database",
              clerkId: id,
              email: primaryEmail.email_address,
            })
          }
        } catch (error) {
          logger.error({
            message: "Error updating user in database",
            error: error instanceof Error ? error.message : "Unknown error",
            clerkId: id,
          })
        }
      }
    } else if (eventType === "user.deleted") {
      // User was deleted in Clerk
      const { id } = evt.data

      try {
        // Find user by Clerk ID
        const existingUser = await db.user.findFirst({
          where: {
            clerkId: id,
          },
        })

        if (existingUser) {
          // Update user in our database (remove Clerk ID)
          await db.user.update({
            where: {
              id: existingUser.id,
            },
            data: {
              clerkId: null,
            },
          })

          logger.info({
            message: "Removed Clerk ID from user in database",
            clerkId: id,
          })
        }
      } catch (error) {
        logger.error({
          message: "Error updating user in database after deletion",
          error: error instanceof Error ? error.message : "Unknown error",
          clerkId: id,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({
      message: "Error processing Clerk webhook",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

