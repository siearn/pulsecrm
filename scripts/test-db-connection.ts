import { PrismaClient } from "@prisma/client"

async function testConnection() {
  const prisma = new PrismaClient()

  try {
    console.log("Testing database connection...")

    // Test raw query
    const result = await prisma.$queryRaw`SELECT 1 as result`
    console.log("Raw query result:", result)

    // Test model query
    const userCount = await prisma.user.count()
    console.log("User count:", userCount)

    console.log("Database connection successful!")
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
  .then((success) => {
    if (!success) {
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error("Script error:", error)
    process.exit(1)
  })

