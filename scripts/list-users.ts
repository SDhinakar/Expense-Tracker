import { PrismaClient } from "@prisma/client"
import * as fs from "fs"

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany()
    fs.writeFileSync("users-list.json", JSON.stringify(users, null, 2))
    console.log("Success! Found users:", users.length)
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
