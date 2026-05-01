import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    AUTH_SECRET_EXISTS: !!process.env.AUTH_SECRET,
    AUTH_SECRET_FALLBACK_EXISTS: !!process.env.NEXTAUTH_SECRET,
    AUTH_GOOGLE_ID_EXISTS: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET_EXISTS: !!process.env.AUTH_GOOGLE_SECRET,
    GOOGLE_CLIENT_ID_EXISTS: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET_EXISTS: !!process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DIRECT_URL_EXISTS: !!process.env.DIRECT_URL,
  });
}
