import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"
import { logger } from "@/lib/logger"

export async function errorHandler(error: unknown) {
  // Log all errors
  logger.error({
    message: error instanceof Error ? error.message : "Unknown error occurred",
    error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    timestamp: new Date().toISOString(),
  })

  // Handle specific error types
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation error",
        details: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 400 },
    )
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle database errors
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A record with this information already exists." }, { status: 409 })
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Record not found." }, { status: 404 })
    }

    return NextResponse.json({ error: "Database error occurred." }, { status: 500 })
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json({ error: "Invalid data provided to database." }, { status: 400 })
  }

  // Generic error handler
  return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
}

