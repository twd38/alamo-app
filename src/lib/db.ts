import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaClient } from '@prisma/client';

// Ensure environment variables are loaded (Edge Runtime compatible)
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  // Only load dotenv on server side if require is available (not in Edge Runtime)
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv might not be installed in production or not available in Edge Runtime
  }
}

// Configure Neon for modern versions
// Note: fetchConnectionCache is now always true by default (deprecated option)

// Global singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with lazy initialization
function createPrismaClient() {
  // Get DATABASE_URL at runtime (not during module initialization)
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. Please check your .env.local file.'
    );
  }

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });
}

// Export a getter that creates the client lazily
export const prisma = (() => {
  let client: PrismaClient | null = null;

  return new Proxy({} as PrismaClient, {
    get(target, prop, receiver) {
      if (!client) {
        client = createPrismaClient();
        if (process.env.NODE_ENV !== 'production') {
          globalForPrisma.prisma = client;
        }
      }

      const value = client[prop as keyof PrismaClient];

      // If it's a function, bind it to the client
      if (typeof value === 'function') {
        return value.bind(client);
      }

      return value;
    }
  });
})();
