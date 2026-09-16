import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes - no auth required
  const publicRoutes = [
    '/',
    '/signin',
    '/signup',
    '/notice',
    '/blog',
    '/alumni-directory',
    '/student-directory',
    '/job-portal',
    '/contact-us',
    '/api/auth',
    '/api/notices',
    '/api/success-stories',
    '/api/student-directory',
    '/api/alumni-directory',
    '/api/blog',
    '/api/jobs',
    '/api/contact',
    '/api/chat',
    '/api/verify-profile',
    '/api/profile-picture',
    '/api/presence',
    '/sw.js',
    '/favicon.ico',
  ];

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') && !pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For all other routes, check for session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token') ||
                        request.cookies.get('__Secure-better-auth.session_token');

  if (!sessionCookie) {
    // API routes: return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Page routes: redirect to signin
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Dashboard route protection by role
  if (pathname.startsWith('/dashboard')) {
    // We can't verify the role in middleware without DB access,
    // but we can ensure the user has a session token.
    // Role verification happens on each page and API route.
    return NextResponse.next();
  }

  // Admin API routes are protected by requireAdmin() in each handler
  // Other API routes need session verification in their handlers

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js).*)',
  ],
};
