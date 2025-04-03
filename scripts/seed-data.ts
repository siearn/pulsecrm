import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Create a super admin company
  const adminCompany = await prisma.company.upsert({
    where: { name: "PulseCRM Admin" },
    update: {},
    create: {
      name: "PulseCRM Admin",
      planType: "ENTERPRISE",
      maxSeats: 999,
      usedSeats: 1,
    },
  })

  console.log(`Created admin company: ${adminCompany.name}`)

  // Create super admin user
  const hashedPassword = await hash("admin123", 10)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pulsecrm.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@pulsecrm.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      companyId: adminCompany.id,
    },
  })

  console.log(`Created super admin user: ${adminUser.email}`)
  console.log("IMPORTANT: Update the Clerk user metadata to include:")
  console.log(
    JSON.stringify(
      {
        role: "SUPER_ADMIN",
        companyId: adminCompany.id,
      },
      null,
      2,
    ),
  )

  // Create a demo company
  const demoCompany = await prisma.company.upsert({
    where: { name: "Demo Company" },
    update: {},
    create: {
      name: "Demo Company",
      stripeCustomerId: "cus_demo",
      planType: "PRO",
      maxSeats: 10,
      usedSeats: 3,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  })

  console.log(`Created demo company: ${demoCompany.name}`)

  // Create demo admin user
  const demoAdminUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@example.com",
      password: hashedPassword,
      role: "ADMIN",
      companyId: demoCompany.id,
    },
  })

  console.log(`Created demo admin user: ${demoAdminUser.email}`)

  // Create team members
  const teamMembers = [
    { name: "John Doe", email: "john@example.com", role: "MANAGER" },
    { name: "Jane Smith", email: "jane@example.com", role: "USER" },
  ]

  for (const member of teamMembers) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: {
        name: member.name,
        email: member.email,
        password: hashedPassword,
        role: member.role as "MANAGER" | "USER",
        companyId: demoCompany.id,
      },
    })
    console.log(`Created team member: ${user.email}`)
  }

  // Create leads
  const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]
  const companies = ["Acme Inc", "Globex Corp", "Initech", "Umbrella Corp", "Stark Industries"]

  for (let i = 0; i < 20; i++) {
    const lead = await prisma.lead.create({
      data: {
        name: `Lead ${i + 1}`,
        email: `lead${i + 1}@example.com`,
        company: companies[Math.floor(Math.random() * companies.length)],
        status: leadStatuses[Math.floor(Math.random() * leadStatuses.length)] as any,
        value: Math.floor(Math.random() * 50000) + 5000,
        companyId: demoCompany.id,
        assignedToId: i % 3 === 0 ? demoAdminUser.id : null,
      },
    })
    console.log(`Created lead: ${lead.name}`)
  }

  // Create customers
  for (let i = 0; i < 10; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        company: companies[Math.floor(Math.random() * companies.length)],
        companyId: demoCompany.id,
      },
    })
    console.log(`Created customer: ${customer.name}`)
  }

  // Create tasks
  const taskStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED"]
  const taskTypes = ["CALL", "EMAIL", "MEETING", "FOLLOW_UP"]

  for (let i = 0; i < 15; i++) {
    const task = await prisma.task.create({
      data: {
        title: `Task ${i + 1}`,
        description: `Description for task ${i + 1}`,
        status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)] as any,
        type: taskTypes[Math.floor(Math.random() * taskTypes.length)] as any,
        dueDate: new Date(Date.now() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
        companyId: demoCompany.id,
        assignedToId: i % 3 === 0 ? demoAdminUser.id : null,
      },
    })
    console.log(`Created task: ${task.title}`)
  }

  console.log("Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

