import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || email.split('@')[0];

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/create-test-user.ts <email> <password> [name]');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`User with email ${email} already exists`);
      
      // Update password if user exists
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      
      console.log(`Password updated for ${email}`);
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          emailVerified: new Date() // Mark as verified for test users
        }
      });

      console.log(`Created test user: ${user.email}`);
    }
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();