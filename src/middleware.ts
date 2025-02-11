export { auth as middleware } from 'src/lib/auth';

// Don't invoke Middleware on some paths
export const config = {
  matcher: [
    '/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)'
  ]
};
