import { PrismaClient } from "@prisma/client"
import { logger } from "./logger"

// Define global type for PrismaClient
declare global {
  var prisma: PrismaClient | undefined
}

// Connection options
const connectionOptions = {
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
}

// Create a new PrismaClient instance
function createPrismaClient() {
  const client = new PrismaClient(connectionOptions)

  // Log queries in development
  if (process.env.NODE_ENV === "development") {
    client.$on("query", (e: any) => {
      logger.debug({
        message: "Prisma Query",
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      })
    })
  }

  // Log errors
  client.$on("error", (e: any) => {
    logger.error({
      message: "Prisma Error",
      error: e.message,
      target: e.target,
    })
  })

  return client
}

// Use existing PrismaClient in development to prevent too many connections
export const db = globalThis.prisma || createPrismaClient()

// In development, attach to global object to reuse connection across hot reloads
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db
}

// Helper function to handle database errors
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage = "Database operation failed",
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    logger.error({
      message: errorMessage,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw new Error(errorMessage)
  }
}

// Helper function to safely disconnect from the database
export async function disconnect() {
  try {
    await db.$disconnect()
  } catch (error) {
    logger.error({
      message: "Error disconnecting from database",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

