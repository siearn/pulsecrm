import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma, createApiResponse, createErrorResponse, withErrorHandling } from "@/lib/db-utils"

// Schema for lead creation
const createLeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]),
  value: z.number().optional().nullable(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  companyId: z.string(),
})

// GET all leads for a company
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    const companyId = session.user.companyId

    if (!companyId) {
      return createErrorResponse("Company not found", 404)
    }

    const leads = await withErrorHandling(
      () =>
        prisma.lead.findMany({
          where: {
            companyId,
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
      "Failed to fetch leads",
    )

    return createApiResponse({ leads })
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : "Failed to fetch leads")
  }
}

// POST create a new lead
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    const json = await req.json()
    const body = createLeadSchema.parse(json)

    // Verify the user belongs to the company
    if (session.user.companyId !== body.companyId) {
      return createErrorResponse("Unauthorized", 403)
    }

    const lead = await withErrorHandling(
      () =>
        prisma.lead.create({
          data: {
            name: body.name,
            email: body.email,
            phone: body.phone,
            company: body.company,
            status: body.status,
            value: body.value,
            source: body.source,
            notes: body.notes,
            assignedToId: body.assignedToId,
            companyId: body.companyId,
          },
        }),
      "Failed to create lead",
    )

    return createApiResponse({ lead }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors[0].message, 400)
    }
    return createErrorResponse(error instanceof Error ? error.message : "Failed to create lead")
  }
}

