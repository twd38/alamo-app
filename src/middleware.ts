export { auth as middleware } from '@/lib/auth';

// Don't invoke Middleware on some paths
export const config = {
  matcher: [
    // Run middleware on all paths **except** the explicitly excluded ones.
    // We now also exclude /api/parts and /api/print-label so they remain publicly accessible.
    // Also exclude manifest.json and other static assets from authentication
    '/((?!login|register|api/auth|api/parts|api/print-label|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)'
  ]
};
