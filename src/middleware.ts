import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that don't require authentication
const publicPaths = ['/login', '/register', '/api/auth', '/api/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Allow API routes that don't need auth
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }
  
  // Check for authentication token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  // If accessing dashboard without authentication, redirect to login
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing root, redirect to dashboard (for authenticated users) or login
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Allow admin API routes only for admin users
  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  
  return NextResponse.next();
}
 
export const config = {
  matcher: ['/', '/dashboard/:path*', '/api/admin/:path*']
};
