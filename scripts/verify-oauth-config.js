#!/usr/bin/env node

/**
 * Utility script to verify OAuth configuration for different environments
 * Run with: node scripts/verify-oauth-config.js
 */

function getEnvironmentInfo() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  let baseUrl;
  if (nodeEnv === 'production' && vercelEnv === 'production') {
    baseUrl = nextAuthUrl || 'https://your-production-domain.com';
  } else if (vercelUrl) {
    baseUrl = `https://${vercelUrl}`;
  } else {
    baseUrl = nextAuthUrl || 'http://localhost:3000';
  }

  return {
    nodeEnv,
    vercelEnv,
    vercelUrl,
    nextAuthUrl,
    baseUrl,
    redirectUri: `${baseUrl}/api/auth/callback/google`
  };
}

function checkEnvironmentVariables() {
  const required = ['AUTH_SECRET', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'];

  const missing = required.filter((key) => !process.env[key]);

  return {
    required,
    missing,
    hasAll: missing.length === 0
  };
}

function main() {
  console.log('🔍 OAuth Configuration Verification\n');

  const envInfo = getEnvironmentInfo();
  const envVars = checkEnvironmentVariables();

  console.log('📊 Environment Information:');
  console.log(`  NODE_ENV: ${envInfo.nodeEnv}`);
  console.log(`  VERCEL_ENV: ${envInfo.vercelEnv || 'not set'}`);
  console.log(`  VERCEL_URL: ${envInfo.vercelUrl || 'not set'}`);
  console.log(`  NEXTAUTH_URL: ${envInfo.nextAuthUrl || 'not set'}`);
  console.log(`  Computed Base URL: ${envInfo.baseUrl}`);
  console.log(`  OAuth Redirect URI: ${envInfo.redirectUri}\n`);

  console.log('🔑 Environment Variables:');
  envVars.required.forEach((key) => {
    const isSet = !!process.env[key];
    const status = isSet ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${isSet ? 'set' : 'missing'}`);
  });

  if (!envVars.hasAll) {
    console.log('\n❌ Missing required environment variables:');
    envVars.missing.forEach((key) => {
      console.log(`  - ${key}`);
    });
    console.log('\nPlease set these variables before proceeding.');
  } else {
    console.log('\n✅ All required environment variables are set!');
  }

  console.log('\n🔧 Google Cloud Console Setup:');
  console.log('Add this redirect URI to your Google OAuth app:');
  console.log(`  ${envInfo.redirectUri}`);

  if (envInfo.vercelEnv === 'preview') {
    console.log('\n📝 For Vercel Preview Deployments:');
    console.log(
      'Consider adding one of these options to Google Cloud Console:'
    );
    console.log(
      '  1. Wildcard: https://*.your-domain.com/api/auth/callback/google'
    );
    console.log('  2. Specific URL: ' + envInfo.redirectUri);
    console.log(
      '  3. Use production domain by setting NEXTAUTH_URL in preview environment'
    );
  }

  console.log('\n🐛 Debug Endpoint:');
  console.log(
    `Visit ${envInfo.baseUrl}/api/auth/debug for runtime configuration`
  );

  console.log('\n📚 Next Steps:');
  console.log('1. Set missing environment variables');
  console.log('2. Add redirect URI to Google Cloud Console');
  console.log('3. Test authentication in your application');
  console.log('4. Use debug endpoint to verify configuration');
}

main();
