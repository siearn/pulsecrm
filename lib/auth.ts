import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { compare, hash } from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

import { db } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "USER",
        }
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          throw new Error("User not found")
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Invalid password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          companyId: user.companyId,
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string | null
      }

      return session
    },
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (account && user) {
        // If signing in with OAuth
        if (account.provider === "google") {
          // Check if user exists in database
          const dbUser = await db.user.findUnique({
            where: {
              email: user.email!,
            },
          })

          // If user doesn't exist, create a new one
          if (!dbUser) {
            const newUser = await db.user.create({
              data: {
                name: user.name,
                email: user.email!,
                image: user.image,
                role: "USER",
              },
            })

            token.id = newUser.id
            token.role = newUser.role
            token.companyId = newUser.companyId
            return token
          }

          // If user exists, update token
          token.id = dbUser.id
          token.role = dbUser.role
          token.companyId = dbUser.companyId
          return token
        }

        // For credentials provider
        token.id = user.id
        token.role = user.role
        token.companyId = user.companyId
        return token
      }

      // For subsequent requests, fetch fresh user data
      const dbUser = await db.user.findUnique({
        where: {
          email: token.email!,
        },
      })

      if (!dbUser) {
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        role: dbUser.role,
        companyId: dbUser.companyId,
      }
    },
  },
}

// Helper function to register a new user
export async function registerUser(name: string, email: string, password: string, companyName: string) {
  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: {
      email,
    },
  })

  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  // Hash password
  const hashedPassword = await hash(password, 10)

  // Create company
  const company = await db.company.create({
    data: {
      name: companyName,
      planType: "FREE_TRIAL",
      maxSeats: 5,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  })

  // Create user
  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN", // First user is admin
      companyId: company.id,
    },
  })

  return user
}

