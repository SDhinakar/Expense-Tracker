import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export function createPrismaClient() {
  let dbUrl = process.env.DATABASE_URL || ""
  if (dbUrl && !dbUrl.includes("pgbouncer=")) {
    dbUrl += dbUrl.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true"
  }
  if (dbUrl && !dbUrl.includes("connection_limit=")) {
    dbUrl += dbUrl.includes("?") ? "&connection_limit=1" : "?connection_limit=1"
  }
  return new PrismaClient({
    datasources: {
      db: {
        url: dbUrl
      }
    }
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

// Cache globally in both dev and production to reuse open DB connections on warm serverless functions
globalForPrisma.prisma = prisma
