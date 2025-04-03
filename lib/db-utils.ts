import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

// Error handling wrapper for database operations
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage = "Database operation failed",
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`)
    throw new Error(errorMessage)
  }
}

// Response helper for API routes
export function createApiResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

// Error response helper
export function createErrorResponse(message: string, status = 500) {
  console.error(`API Error: ${message}`)
  return NextResponse.json({ error: message }, { status })
}

// Connection management
let prisma: PrismaClient

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient()
} else {
  // Prevent multiple instances during development
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

export { prisma }

