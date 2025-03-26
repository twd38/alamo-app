# NextAuth Setup Guide

This document explains how to set up the necessary environment variables for NextAuth.js to work correctly with Gmail integration.

## Required Environment Variables

You need to set the following environment variables in your project:

1. **NEXTAUTH_SECRET**: A secret string used to encrypt JWT tokens
2. **NEXTAUTH_URL**: The base URL of your site (e.g., http://localhost:3000 for development)
3. **GOOGLE_CLIENT_ID**: Your Google OAuth client ID
4. **GOOGLE_CLIENT_SECRET**: Your Google OAuth client secret

## Setting Up Environment Variables

1. Create a `.env.local` file in the root of your project if it doesn't exist already.

2. Add the following variables to the file:

```
NEXTAUTH_SECRET=your-jwt-secret-here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

3. Generate a secure random string for `NEXTAUTH_SECRET` using one of these methods:
   
   - Using openssl (Mac/Linux):
     ```bash
     openssl rand -base64 32
     ```
   
   - Using Node.js:
     ```javascript
     node -e "console.log(crypto.randomBytes(32).toString('hex'))"
     ```

4. Setting up Google OAuth:
   
   a. Go to the [Google Cloud Console](https://console.cloud.google.com/)
   b. Create a new project or select an existing one
   c. Navigate to APIs & Services > Credentials
   d. Create an OAuth client ID
   e. Set the authorized redirect URI to `http://localhost:3000/api/auth/callback/google` (for development)
   f. Make sure to enable the Gmail API for your project
   g. Copy the Client ID and Client Secret to your `.env.local` file

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

If you receive authentication errors like "Missing secret":

1. Verify that the `.env.local` file exists and contains all required variables
2. Check that your Next.js server has restarted and loaded the variables
3. Make sure there are no typos in the variable names
4. Verify that the environment variables are accessible in your code

For more information, see the [NextAuth.js documentation](https://next-auth.js.org/configuration/options). 