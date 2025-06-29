import { redirect } from '@remix-run/cloudflare';
import { getUserIdFromRequest } from './getUserId';

export async function requireAuth(request: Request): Promise<string> {
  const userId = await getUserIdFromRequest(request);

  if (!userId) {
    throw redirect('/auth/signin');
  }

  return userId;
}

export async function optionalAuth(request: Request): Promise<string | null> {
  return await getUserIdFromRequest(request);
}

export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ['/chat', '/settings', '/api/chats'];
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

export function isAuthRoute(pathname: string): boolean {
  const authRoutes = ['/auth/signin', '/auth/callback'];
  return authRoutes.some((route) => pathname.startsWith(route));
}
