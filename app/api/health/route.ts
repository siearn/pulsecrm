import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET() {
  const startTime = Date.now()

  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`

    // Get system info
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()

    const responseTime = Date.now() - startTime

    return NextResponse.json(
      {
        status: "healthy",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 60)} minutes, ${Math.floor(uptime % 60)} seconds`,
        database: "connected",
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        },
        responseTime: `${responseTime}ms`,
      },
      { status: 200 },
    )
  } catch (error) {
    logger.error({
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    )
  }
}

