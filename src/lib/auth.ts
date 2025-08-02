import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          // Always ensure we request the most complete set of scopes
          scope:
            'openid email profile https://www.googleapis.com/auth/gmail.readonly',
          // These parameters are critical for receiving a refresh token
          access_type: 'offline',
          // Always force a new consent screen to ensure refresh token is issued
          prompt: 'consent',
          include_granted_scopes: true
        }
      }
    }),
    // Add credentials provider for dev/staging environments
    ...(process.env.VERCEL_ENV !== 'production' ||
    process.env.ENABLE_CREDENTIALS_AUTH === 'true'
      ? [
          CredentialsProvider({
            name: 'credentials',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) {
                return null;
              }

              const user = await prisma.user.findUnique({
                where: { email: credentials.email as string }
              });

              if (!user || !user.password) {
                return null;
              }

              const isValid = await bcrypt.compare(
                credentials.password as string,
                user.password
              );

              if (!isValid) {
                return null;
              }

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image
              };
            }
          })
        ]
      : [])
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error' // Add an error page path
  },
  // Use JWT strategy when credentials provider is available
  session: {
    strategy:
      process.env.VERCEL_ENV !== 'production' ||
      process.env.ENABLE_CREDENTIALS_AUTH === 'true'
        ? 'jwt'
        : 'database',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth;
    },
    // Enhanced signIn callback to link accounts on login
    signIn: async ({ user, account, profile, email }) => {
      // Only run this logic for OAuth providers to avoid infinite loops
      if (account?.provider && profile?.email) {
        // Normalize email to lowercase
        const normalizedEmail = profile.email.toLowerCase();

        try {
          // Check if a user with this email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { accounts: true }
          });

          // If we found an existing user with this email
          if (existingUser) {
            // Check if this provider is already connected to this user
            const existingAccount = existingUser.accounts.find(
              (acc) => acc.provider === account.provider
            );

            // If this provider is not yet connected to this user
            if (!existingAccount) {
              // Create a new account record linking this provider to the existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token
                }
              });

              // Update user information if needed (e.g., adding picture if not set)
              if (profile.picture && !existingUser.image) {
                await prisma.user.update({
                  where: { id: existingUser.id },
                  data: { image: profile.picture }
                });
              }

              // Return true to allow sign in with the existing user
              return true;
            }
          }
        } catch (error) {
          console.error('Error linking account:', error);
          // Continue with normal sign-in flow even if account linking fails
        }
      }

      // Default allow sign-in
      return true;
    },
    // Add JWT callback for credentials provider
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    session: async ({ session, token, user }) => {
      // Handle both JWT (for credentials) and database sessions (for OAuth)
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string | null;
      } else if (user) {
        session.user = {
          ...user,
          roles: [],
          permissions: []
        };
      }
      if (session.user) {
        // Ensure we have the user ID
        const userId = (token?.id as string) || user?.id;
        if (!userId) return session;

        session.user.id = userId;

        // Load user's roles and permissions into the session
        try {
          // Get user's roles with their permissions
          const userRoles = await prisma.userRole.findMany({
            where: {
              userId,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
            },
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          });

          // Get user's direct permissions
          const userPermissions = await prisma.userPermission.findMany({
            where: {
              userId,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
            },
            include: {
              permission: true
            }
          });

          // Extract all permissions from roles
          const rolePermissions = userRoles.flatMap((ur) =>
            ur.role.rolePermissions.map((rp) => ({
              name: rp.permission.name,
              resourceType: ur.resourceType,
              resourceId: ur.resourceId
            }))
          );

          // Extract direct permissions
          const directPermissions = userPermissions
            .filter((up) => up.granted) // Only granted permissions
            .map((up) => ({
              name: up.permission.name,
              resourceType: up.resourceType,
              resourceId: up.resourceId
            }));

          // Combine all permissions
          const allPermissions = [...rolePermissions, ...directPermissions];

          // Add roles and permissions to session
          session.user.roles = userRoles.map((ur) => ({
            name: ur.role.name,
            resourceType: ur.resourceType,
            resourceId: ur.resourceId
          }));

          session.user.permissions = allPermissions;
        } catch (error) {
          console.error('Error loading user permissions in session:', error);
          // Set empty arrays as fallback
          session.user.roles = [];
          session.user.permissions = [];
        }
      }
      return session;
    }
  },
  debug: process.env.VERCEL_ENV === 'development'
});

// Extend the Session and User types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: Array<{
        name: string;
        resourceType?: string | null;
        resourceId?: string | null;
      }>;
      permissions: Array<{
        name: string;
        resourceType?: string | null;
        resourceId?: string | null;
      }>;
    };
  }
}
