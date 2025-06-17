# NextAuth Setup Guide

This document explains how to set up the necessary environment variables for NextAuth.js to work correctly with Gmail integration across different deployment environments (local, Vercel preview, and production).

## Required Environment Variables

You need to set the following environment variables in your project:

1. **AUTH_SECRET**: A secret string used to encrypt JWT tokens (replaces NEXTAUTH_SECRET in NextAuth v5)
2. **NEXTAUTH_URL**: The base URL of your site (only needed for production and local development)
3. **AUTH_GOOGLE_ID**: Your Google OAuth client ID
4. **AUTH_GOOGLE_SECRET**: Your Google OAuth client secret

## Setting Up Environment Variables

### Local Development

1. Create a `.env.local` file in the root of your project if it doesn't exist already.

2. Add the following variables to the file:

```
AUTH_SECRET=your-jwt-secret-here
NEXTAUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### Vercel Deployment

For Vercel deployments, set these environment variables in your Vercel dashboard:

**Production Environment:**
```
AUTH_SECRET=your-jwt-secret-here
NEXTAUTH_URL=https://your-production-domain.com
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

**Preview Environment:**
```
AUTH_SECRET=your-jwt-secret-here
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

Note: For preview deployments, `NEXTAUTH_URL` is automatically detected using Vercel's `VERCEL_URL` environment variable.

3. Generate a secure random string for `AUTH_SECRET` using one of these methods:
   
   - Using openssl (Mac/Linux):
     ```bash
     openssl rand -base64 32
     ```
   
   - Using Node.js:
     ```javascript
     node -e "console.log(crypto.randomBytes(32).toString('hex'))"
     ```

## Google OAuth Setup for Multiple Environments

### Setting up Google OAuth:
   
   a. Go to the [Google Cloud Console](https://console.cloud.google.com/)
   b. Create a new project or select an existing one
   c. Navigate to APIs & Services > Credentials
   d. Create an OAuth client ID
   e. Configure the authorized redirect URIs for all your environments:

### Redirect URIs to Add:

**For Local Development:**
```
http://localhost:3000/api/auth/callback/google
```

**For Production:**
```
https://your-production-domain.com/api/auth/callback/google
```

**For Vercel Preview Deployments:**

Option 1 (Recommended): Use a wildcard subdomain if supported by your domain:
```
https://*.your-domain.com/api/auth/callback/google
```

Option 2: Add specific preview URLs as needed:
```
https://your-app-git-preview-branch-username.vercel.app/api/auth/callback/google
```

Option 3: Use the production redirect URI for preview deployments (set `NEXTAUTH_URL` to your production domain in preview environment variables).

### Alternative Approach for Preview Deployments

If wildcard subdomains aren't supported, you can configure preview deployments to use your production domain as the OAuth redirect:

1. In Vercel dashboard, add this environment variable to your **Preview** environment:
   ```
   NEXTAUTH_URL=https://your-production-domain.com
   ```

2. This will redirect OAuth callbacks to your production domain, which then needs to handle the redirect back to the preview URL.

## Environment Detection

The application automatically detects the environment and configures the appropriate OAuth redirect URI:

- **Local Development**: Uses `http://localhost:3000`
- **Vercel Preview**: Uses `https://{VERCEL_URL}`
- **Production**: Uses your configured `NEXTAUTH_URL`

## Debugging

To verify your configuration is working correctly, visit the debug endpoint:

- **Local**: `http://localhost:3000/api/auth/debug`
- **Preview**: `https://your-preview-url.vercel.app/api/auth/debug`

This endpoint shows the current environment configuration and the OAuth redirect URI being used.

## Permissions

For Gmail API access, ensure your Google OAuth configuration has the following scopes:

- `https://www.googleapis.com/auth/gmail.readonly` - For reading emails
- `openid`
- `email`
- `profile`

## Restarting Your Application

After setting up the environment variables, restart your Next.js development server for the changes to take effect:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**: 
   - Verify the redirect URI in Google Cloud Console matches exactly
   - Check the debug endpoint to see what URI is being used
   - Ensure your preview deployment URLs are correctly configured

2. **Missing secret error**:
   - Verify that `AUTH_SECRET` is set (not `NEXTAUTH_SECRET`)
   - Check that your Vercel environment variables are correctly configured

3. **OAuth works locally but not on Vercel**:
   - Verify Vercel environment variables are set for the correct environment (Production vs Preview)
   - Check that the redirect URI is added to Google Cloud Console

4. **Preview deployments fail authentication**:
   - Use the debug endpoint to verify the correct redirect URI
   - Consider using the production domain approach for OAuth redirects

### Environment Variable Priority:

1. **Local Development**: `.env.local` file
2. **Vercel Preview**: Vercel environment variables (Preview)
3. **Vercel Production**: Vercel environment variables (Production)

For more information, see the [NextAuth.js documentation](https://next-auth.js.org/configuration/options). 