import { NextResponse, NextRequest } from 'next/server'


export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // If logged in and trying to access /login or /signup, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If NOT logged in and trying to access /dashboard or /analytics, redirect to login
  if (!token && (pathname === '/dashboard' || pathname === '/analytics')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/login', '/signup', '/analytics'],
};
