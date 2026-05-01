import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json({
      DATABASE_CONNECTED: true,
      USERS_COUNT: users.length,
      AUTH_SECRET_EXISTS: !!process.env.AUTH_SECRET,
      AUTH_GOOGLE_ID_EXISTS: !!process.env.AUTH_GOOGLE_ID,
      AUTH_GOOGLE_SECRET_EXISTS: !!process.env.AUTH_GOOGLE_SECRET,
    });
  } catch (error: any) {
    return NextResponse.json({
      DATABASE_CONNECTED: false,
      ERROR_MESSAGE: error?.message || "Unknown error",
      ERROR_DETAILS: JSON.stringify(error),
    });
  }
}
