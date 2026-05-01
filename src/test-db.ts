import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany()
    console.log("SUCCESS! Users count:", users.length)
  } catch (error) {
    console.error("PRISMA ERROR connecting to Supabase:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
