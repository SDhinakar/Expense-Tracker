import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

// Disable prepared statements for connection pooling environments
const dbUrl = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL + (process.env.DATABASE_URL.includes("?") ? "&" : "?") + "pgbouncer=true&connection_limit=1"
  : undefined

const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
})

async function main() {
  console.log("Starting local project backup before boot...")
  try {
    const [users, categories, expenses, friendNotes, budgets, personalGoals] = await Promise.all([
      prisma.user.findMany(),
      prisma.category.findMany(),
      prisma.expense.findMany(),
      prisma.friendNote.findMany(),
      prisma.budget.findMany(),
      prisma.personalGoal.findMany(),
    ])

    const backupDir = path.join(process.cwd(), "backups")
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    const backupPath = path.join(backupDir, filename)

    fs.writeFileSync(
      backupPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          users,
          categories,
          expenses,
          friendNotes,
          budgets,
          personalGoals,
        },
        null,
        2
      )
    )

    console.log(` Backup successful! Saved to local file: backups/${filename}`)

    // Optional: Only keep the latest 10 backups
    const files = fs.readdirSync(backupDir)
      .filter((file) => file.startsWith("backup-") && file.endsWith(".json"))
      .map((file) => ({
        name: file,
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time)

    if (files.length > 10) {
      for (let i = 10; i < files.length; i++) {
        fs.unlinkSync(path.join(backupDir, files[i].name))
        console.log(` Pruned old backup file: ${files[i].name}`)
      }
    }
  } catch (error) {
    console.error(" Backup failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
