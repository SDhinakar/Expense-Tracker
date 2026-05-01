import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  // Use the exact database URL from the Vercel environment variables!
  const testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    const users = await testPrisma.user.findMany();
    return NextResponse.json({
      DATABASE_CONNECTED: true,
      USERS_COUNT: users.length,
      MESSAGE: "Congratulations! Connection using your Vercel DATABASE_URL succeeded!"
    });
  } catch (error: any) {
    return NextResponse.json({
      DATABASE_CONNECTED: false,
      ERROR_MESSAGE: error?.message || "Unknown error",
      DATABASE_URL_USED: !!process.env.DATABASE_URL
    });
  } finally {
    await testPrisma.$disconnect();
  }
}
