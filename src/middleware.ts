import { NextRequest, NextResponse } from 'next/server';

// Don't invoke Middleware on some paths
export const config = {
  matcher: [
    '/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)'
  ]
};

/**
 * Middleware function that handles content path redirections
 * For authentication, we rely on the auth from NextAuth which is
 * applied automatically based on the configuration
 */
export function middleware(request: NextRequest) {
  // Handle content URL redirects - only if the path starts with "/content"
  if (request.nextUrl.pathname.startsWith("/content")) {
    return NextResponse.redirect(new URL("/api" + request.nextUrl.pathname, request.url));
  }
  
  // For other paths, continue to the next middleware
  return NextResponse.next();
}
