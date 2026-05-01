import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  const testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:oRyr0Dhw8JiCwk42@db.wbbgqyhueoubcgcvedbi.supabase.co:5432/postgres"
      }
    }
  });

  try {
    const users = await testPrisma.user.findMany();
    return NextResponse.json({
      DATABASE_CONNECTED: true,
      USERS_COUNT: users.length,
      MESSAGE: "Direct connection on port 5432 succeeded!"
    });
  } catch (error: any) {
    return NextResponse.json({
      DATABASE_CONNECTED: false,
      ERROR_MESSAGE: error?.message || "Unknown error"
    });
  } finally {
    await testPrisma.$disconnect();
  }
}
