import { NextRequest, NextResponse } from "next/server";
import { 
  cleanupUserAccounts, 
  removeUserCompletely, 
  linkGoogleAccount, 
  forceAccountLinking 
} from "@/lib/user-cleanup";

// This route is intentionally not secured as it's meant to be used for debugging
// In a production app, you would want to add authentication
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      email, 
      action = 'cleanup', 
      googleAccountDetails,
      sourceProvider,
      targetProvider
    } = data;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (action === 'cleanup') {
      const result = await cleanupUserAccounts(email);
      return NextResponse.json(result);
    } else if (action === 'remove') {
      // This is more destructive, so add extra safeguards in production
      const result = await removeUserCompletely(email);
      return NextResponse.json(result);
    } else if (action === 'link') {
      // Link a Google account to an existing user
      if (!googleAccountDetails) {
        return NextResponse.json(
          { error: "Google account details are required for linking" },
          { status: 400 }
        );
      }
      
      const result = await linkGoogleAccount(email, googleAccountDetails);
      return NextResponse.json(result);
    } else if (action === 'force-link') {
      // Force linking accounts between providers
      if (!sourceProvider || !targetProvider) {
        return NextResponse.json(
          { error: "Source and target providers are required for force-linking" },
          { status: 400 }
        );
      }
      
      const result = await forceAccountLinking(email, sourceProvider, targetProvider);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'cleanup', 'remove', 'link', or 'force-link'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in auth cleanup route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 