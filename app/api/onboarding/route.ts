import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { createCompanyForUser } from "@/lib/clerk"

const onboardingSchema = z.object({
  companyName: z.string().min(2),
  industry: z.string().optional(),
  size: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    // Get the authenticated user
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate the request body
    const json = await req.json()
    const body = onboardingSchema.parse(json)

    // Create a company for the user
    const company = await createCompanyForUser(userId, body.companyName)

    // Return the company data
    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    console.error(error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 })
  }
}

