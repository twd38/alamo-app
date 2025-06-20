import { prisma } from '@/lib/db';

/**
 * Find and clean accounts with missing or problematic authentication data
 * @param email The email address of the user to clean up
 * @returns Object containing cleanup results
 */
export async function cleanupUserAccounts(email: string): Promise<{
  success: boolean;
  message: string;
  cleanedRecords?: number;
}> {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        accounts: true,
        sessions: true
      }
    });

    if (!user) {
      return {
        success: false,
        message: `No user found with email: ${email}`
      };
    }

    // Delete all sessions for this user
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    // Delete Google accounts that might be problematic (no refresh token)
    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        userId: user.id,
        provider: 'google',
        refresh_token: null
      }
    });

    return {
      success: true,
      message: `Cleaned up user account for ${email}`,
      cleanedRecords: deletedSessions.count + deletedAccounts.count
    };
  } catch (error) {
    console.error('Error cleaning up user account:', error);
    return {
      success: false,
      message: `Error cleaning up accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Force link accounts from one provider to another using the email address
 * Use this as a helper for users who can't sign in with their original method
 *
 * @param email The email address of the user
 * @param sourceProvider The provider to copy accounts from (e.g., 'google')
 * @param targetProvider The provider to link accounts to (e.g., 'credentials')
 * @returns Result of the operation
 */
export async function forceAccountLinking(
  email: string,
  sourceProvider: string,
  targetProvider: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Find the source user account
    const sourceAccount = await prisma.account.findFirst({
      where: {
        provider: sourceProvider,
        user: {
          email: email.toLowerCase()
        }
      },
      include: {
        user: true
      }
    });

    if (!sourceAccount) {
      return {
        success: false,
        message: `No ${sourceProvider} account found for ${email}`
      };
    }

    // Find the target user account
    const targetUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        accounts: {
          some: {
            provider: targetProvider
          }
        }
      },
      include: {
        accounts: {
          where: {
            provider: targetProvider
          }
        }
      }
    });

    if (!targetUser) {
      return {
        success: false,
        message: `No user with ${targetProvider} account found for ${email}`
      };
    }

    // Check if accounts are already linked
    const existingLink = await prisma.account.findFirst({
      where: {
        userId: targetUser.id,
        provider: sourceProvider
      }
    });

    if (existingLink) {
      return {
        success: true,
        message: `${sourceProvider} account is already linked to the ${targetProvider} account for ${email}`
      };
    }

    // Create a new account linking the source provider to the target user
    await prisma.account.create({
      data: {
        userId: targetUser.id,
        type: sourceAccount.type,
        provider: sourceAccount.provider,
        providerAccountId: sourceAccount.providerAccountId,
        refresh_token: sourceAccount.refresh_token,
        access_token: sourceAccount.access_token,
        expires_at: sourceAccount.expires_at,
        token_type: sourceAccount.token_type,
        scope: sourceAccount.scope,
        id_token: sourceAccount.id_token
      }
    });

    return {
      success: true,
      message: `Successfully linked ${sourceProvider} account to ${targetProvider} account for ${email}`
    };
  } catch (error) {
    console.error('Error forcing account link:', error);
    return {
      success: false,
      message: `Error linking accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Link a Google OAuth account to an existing user
 * @param email The email address of the user
 * @param googleAccountDetails The Google account details to link
 * @returns Object containing the result of the operation
 */
export async function linkGoogleAccount(
  email: string,
  googleAccountDetails: {
    provider: string;
    providerAccountId: string;
    refresh_token?: string | null;
    access_token?: string | null;
    expires_at?: number | null;
    token_type?: string | null;
    scope?: string | null;
    id_token?: string | null;
  }
): Promise<{
  success: boolean;
  message: string;
  userId?: string;
  accountId?: string;
}> {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { accounts: true }
    });

    if (!user) {
      return {
        success: false,
        message: `No user found with email: ${email}`
      };
    }

    // Check if this Google account is already linked to another user
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: googleAccountDetails.provider,
          providerAccountId: googleAccountDetails.providerAccountId
        }
      }
    });

    if (existingAccount && existingAccount.userId !== user.id) {
      // The Google account is already linked to another user
      return {
        success: false,
        message: `This Google account is already linked to another user`
      };
    }

    // Check if the user already has a Google account
    const existingGoogleAccount = user.accounts.find(
      (acc) => acc.provider === 'google'
    );

    if (existingGoogleAccount) {
      // Update the existing Google account
      const updatedAccount = await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: existingGoogleAccount.providerAccountId
          }
        },
        data: {
          refresh_token:
            googleAccountDetails.refresh_token ||
            existingGoogleAccount.refresh_token,
          access_token:
            googleAccountDetails.access_token ||
            existingGoogleAccount.access_token,
          expires_at:
            googleAccountDetails.expires_at || existingGoogleAccount.expires_at,
          token_type:
            googleAccountDetails.token_type || existingGoogleAccount.token_type,
          scope: googleAccountDetails.scope || existingGoogleAccount.scope,
          id_token:
            googleAccountDetails.id_token || existingGoogleAccount.id_token
        }
      });

      return {
        success: true,
        message: `Updated existing Google account for user ${email}`,
        userId: user.id,
        accountId: updatedAccount.providerAccountId
      };
    } else {
      // Create a new Google account for this user
      const newAccount = await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: googleAccountDetails.provider,
          providerAccountId: googleAccountDetails.providerAccountId,
          refresh_token: googleAccountDetails.refresh_token,
          access_token: googleAccountDetails.access_token,
          expires_at: googleAccountDetails.expires_at,
          token_type: googleAccountDetails.token_type,
          scope: googleAccountDetails.scope,
          id_token: googleAccountDetails.id_token
        }
      });

      return {
        success: true,
        message: `Linked new Google account to user ${email}`,
        userId: user.id,
        accountId: newAccount.providerAccountId
      };
    }
  } catch (error) {
    console.error('Error linking Google account:', error);
    return {
      success: false,
      message: `Error linking Google account: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Completely remove a user and all associated data
 * USE WITH CAUTION - this will permanently delete the user
 * @param email The email address of the user to remove
 */
export async function removeUserCompletely(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return {
        success: false,
        message: `No user found with email: ${email}`
      };
    }

    // Prisma will handle cascading deletes for accounts and sessions
    // based on the prisma schema relationships
    await prisma.user.delete({
      where: { id: user.id }
    });

    return {
      success: true,
      message: `User ${email} has been completely removed`
    };
  } catch (error) {
    console.error('Error removing user:', error);
    return {
      success: false,
      message: `Error removing user: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
