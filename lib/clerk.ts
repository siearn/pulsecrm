import { clerkClient } from "@clerk/nextjs"
import { db } from "./db"

// Function to create a company for a new user
export async function createCompanyForUser(userId: string, companyName: string) {
  try {
    // Create company in database
    const company = await db.company.create({
      data: {
        name: companyName,
        planType: "FREE_TRIAL",
        maxSeats: 5,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    })

    // Update user metadata in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        companyId: company.id,
        role: "ADMIN", // First user is admin
      },
    })

    return company
  } catch (error) {
    console.error("Error creating company:", error)
    throw new Error("Failed to create company")
  }
}

// Function to get a user's company
export async function getUserCompany(userId: string) {
  try {
    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId)

    // Get company ID from user metadata
    const companyId = user.publicMetadata.companyId as string | undefined

    if (!companyId) {
      return null
    }

    // Get company from database
    const company = await db.company.findUnique({
      where: {
        id: companyId,
      },
    })

    return company
  } catch (error) {
    console.error("Error getting user company:", error)
    throw new Error("Failed to get user company")
  }
}

// Function to check if a user is an admin
export async function isUserAdmin(userId: string) {
  try {
    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId)

    // Check if user is an admin
    return user.publicMetadata.role === "ADMIN" || user.publicMetadata.role === "SUPER_ADMIN"
  } catch (error) {
    console.error("Error checking if user is admin:", error)
    return false
  }
}

