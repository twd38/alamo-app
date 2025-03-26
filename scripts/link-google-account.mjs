#!/usr/bin/env node

/**
 * This script helps link a Google account to an existing user in your application
 * 
 * Usage:
 * 1. Get Google account details from Prisma Studio or database
 * 2. Run: node scripts/link-google-account.mjs
 * 3. Follow the prompts
 */

import fetch from 'node-fetch';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const envFiles = ['.env.local', '.env'];

// Try to load environment variables from different possible env files
for (const file of envFiles) {
  const filePath = join(rootDir, file);
  if (existsSync(filePath)) {
    config({ path: filePath });
    console.log(`Loaded environment from ${file}`);
    break;
  }
}

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  try {
    console.log('\n🔗 Google Account Linking Tool\n');
    
    // Get the base URL from environment or ask the user
    let baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    if (!baseUrl) {
      baseUrl = await question('Enter your app URL [default: http://localhost:3000]: ');
      baseUrl = baseUrl || 'http://localhost:3000';
    }
    
    const email = await question('Enter the email address of the existing user: ');
    
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      return;
    }
    
    console.log('\nNow we need the Google account details to link:');
    console.log('You can get these from Prisma Studio by looking at the Accounts table\n');
    
    const providerAccountId = await question('Google provider account ID: ');
    
    if (!providerAccountId) {
      console.error('❌ Provider account ID is required');
      return;
    }
    
    const access_token = await question('Access token (optional): ');
    const refresh_token = await question('Refresh token (optional): ');
    
    // Construct the account details
    const googleAccountDetails = {
      provider: 'google',
      providerAccountId,
      access_token: access_token || null,
      refresh_token: refresh_token || null,
      token_type: 'bearer',
      scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
    };
    
    console.log('\nSending request to link account...');
    
    // Send the request to the API
    const response = await fetch(`${baseUrl}/api/auth/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        action: 'link',
        googleAccountDetails,
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n✅ Success:', result.message);
      console.log('User ID:', result.userId);
      console.log('Account ID:', result.accountId);
      console.log('\nYou should now be able to sign in with your Google account.');
    } else {
      console.error('\n❌ Error:', result.message);
      console.log('Please check the details and try again.');
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(console.error); 