import { execSync } from "child_process"

function runMigration() {
  try {
    console.log("Running database migration...")

    // Generate Prisma client
    execSync("npx prisma generate", { stdio: "inherit" })

    // Push schema to database
    execSync("npx prisma db push", { stdio: "inherit" })

    console.log("Migration completed successfully!")
    return true
  } catch (error) {
    console.error("Migration failed:", error)
    return false
  }
}

runMigration()
  .then((success) => {
    if (!success) {
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error("Script error:", error)
    process.exit(1)
  })

