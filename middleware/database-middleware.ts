import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db-utils"

export async function databaseMiddleware(req: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.next()
  } catch (error) {
    console.error("Database connection error:", error)
    return new NextResponse(
      JSON.stringify({
        error: "Database connection failed",
        message: "We're experiencing technical difficulties. Please try again later.",
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

