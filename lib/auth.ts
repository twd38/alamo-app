import NextAuth from 'next-auth';
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import Google from "next-auth/providers/google";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  pages: {
    signIn: '/login'
  },
  callbacks: {
    authorized: async ({ auth }) => {
      console.log("auth", auth)
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth
    },
    // jwt({ token, trigger, session }) {
    //   console.log("token", token)
    //   console.log("trigger", trigger)
    //   console.log("session", session)
    //   if (trigger === "update") token.name = session?.user?.name
    //   return token
    // },
  },
});


 