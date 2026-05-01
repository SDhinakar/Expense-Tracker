import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const clientId = (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "")
  .replace(/^["']|["']$/g, "")
  .trim()

const clientSecret = (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "")
  .replace(/^["']|["']$/g, "")
  .trim()

const secret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "ZbcJc1VpG/DD7qX6a+xRPosn2aRjfqBIron0gvPyI1w=")
  .replace(/^["']|["']$/g, "")
  .trim()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId,
      clientSecret,
    }),
  ],
  secret,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  debug: true,
  trustHost: true,
})
