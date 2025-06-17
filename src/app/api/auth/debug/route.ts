import { NextResponse } from 'next/server';
import { getEnvironmentInfo } from '@/lib/auth';

/**
 * Debug endpoint to verify environment configuration and OAuth settings
 * This helps ensure the correct redirect URIs are being used in different environments
 * 
 * Usage: GET /api/auth/debug
 */
export async function GET() {
  // Only allow this endpoint in development or preview environments
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 404 }
    );
  }

  const envInfo = getEnvironmentInfo();
  
  return NextResponse.json({
    message: 'Auth environment configuration',
    environment: {
      ...envInfo,
      hasGoogleCredentials: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nextAuthSecret: !!process.env.AUTH_SECRET, // Only show if it exists, not the value
    },
    instructions: {
      googleCloudConsole: 'Add this redirect URI to your Google Cloud Console OAuth credentials:',
      redirectUri: envInfo.redirectUri,
      note: 'For preview deployments, you may need to add a wildcard redirect URI or update your OAuth app configuration'
    }
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    }
  });
} 