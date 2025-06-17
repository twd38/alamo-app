export { auth as middleware } from '@/lib/auth';

// Don't invoke Middleware on some paths
export const config = {
  matcher: [
    // Run middleware on all paths **except** the explicitly excluded ones.
    // We now also exclude /api/parts so it remains publicly accessible.
    '/((?!login|register|api/auth|api/parts|_next/static|_next/image|favicon.ico).*)'
  ]
};
