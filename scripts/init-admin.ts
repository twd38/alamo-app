#!/usr/bin/env tsx

import { initializeAdminUser } from '../src/lib/rbac-actions'

async function main() {
  const userEmail = process.argv[2]
  
  if (!userEmail) {
    console.error('❌ Please provide a user email as an argument')
    console.log('Usage: npx tsx scripts/init-admin.ts user@example.com')
    process.exit(1)
  }
  
  console.log(`🔑 Initializing admin user: ${userEmail}`)
  
  try {
    const result = await initializeAdminUser(userEmail)
    
    if (result.success) {
      console.log('✅', result.message)
    } else {
      console.error('❌', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()