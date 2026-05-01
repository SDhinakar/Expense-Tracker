import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
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
    async signIn({ user }) {
      if (user.email) {
        // Upsert the user into the database manually
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
          },
          create: {
            id: user.id || undefined,
            email: user.email,
            name: user.name,
            image: user.image,
          },
        })
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && session.user.email) {
        // Find the user ID by email to ensure it matches
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        })
        if (dbUser) {
          session.user.id = dbUser.id
        } else if (token.sub) {
          session.user.id = token.sub
        }
      }
      return session
    },
  },
  debug: true,
  trustHost: true,
})
