#!/usr/bin/env tsx

import { initializeAdminUser } from '../src/lib/actions/rbac-actions';

async function main() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error('❌ Please provide a user email as an argument');
    console.log('Usage: npx tsx scripts/init-admin.ts user@example.com');
    process.exit(1);
  }

  console.log(`🔑 Initializing admin user: ${userEmail}`);
  console.log(
    `📡 Using database: ${process.env.DATABASE_URL?.substring(0, 50)}...`
  );

  try {
    const result = await initializeAdminUser(userEmail);

    if (result.success) {
      console.log('✅', result.message);
    } else {
      console.error('❌', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
