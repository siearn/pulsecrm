import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"
import * as readline from "readline"

const prisma = new PrismaClient()

// Create interface for readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Promisify the question function
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer)
    })
  })
}

async function setupAdmin() {
  console.log("=== PulseCRM Admin Setup ===")
  console.log("This script will create a super admin user and company.")
  console.log("The super admin will have access to all features and companies.")
  console.log("")

  try {
    // Get admin details
    const email = await question("Enter admin email: ")
    const name = await question("Enter admin name: ")
    const password = await question("Enter admin password (min 8 characters): ")

    if (password.length < 8) {
      console.error("Password must be at least 8 characters long.")
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log("User with this email already exists.")

      // Ask if we should update the existing user to super admin
      const update = await question("Do you want to make this user a super admin? (y/n): ")

      if (update.toLowerCase() === "y") {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: "SUPER_ADMIN" },
        })

        console.log(`User ${email} has been updated to SUPER_ADMIN.`)
        console.log("Please update the user's metadata in Clerk dashboard to include:")
        console.log('{ "role": "SUPER_ADMIN" }')
      }

      return
    }

    // Create admin company
    const company = await prisma.company.create({
      data: {
        name: "PulseCRM Admin",
        planType: "ENTERPRISE",
        maxSeats: 999,
        usedSeats: 1,
      },
    })

    console.log(`Created admin company: ${company.name}`)

    // Create admin user
    const hashedPassword = await hash(password, 10)
    const adminUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        companyId: company.id,
      },
    })

    console.log(`Created super admin user: ${adminUser.email}`)
    console.log("")
    console.log("IMPORTANT: You need to manually set the user's metadata in Clerk dashboard.")
    console.log("Add the following to the user's public metadata:")
    console.log(
      JSON.stringify(
        {
          role: "SUPER_ADMIN",
          companyId: company.id,
        },
        null,
        2,
      ),
    )
    console.log("")
    console.log("Admin setup complete! You can now log in with the provided credentials.")
  } catch (error) {
    console.error("Error setting up admin:", error)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

setupAdmin()

