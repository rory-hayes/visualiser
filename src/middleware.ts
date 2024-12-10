import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit } from '@/utils/rateLimit';

const PUBLIC_PATHS = ['/login', '/register', '/api/auth'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for public paths
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Check rate limiting for API routes
    if (pathname.startsWith('/api')) {
        const rateLimitResult = await rateLimit(request);
        if (!rateLimitResult.success) {
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: {
                    'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
                },
            });
        }
    }

    // Verify authentication token
    const token = await getToken({ req: request });
    if (!token) {
        if (pathname.startsWith('/api')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api')) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', token.sub || '');
        requestHeaders.set('x-user-email', token.email || '');

        return NextResponse.next({
            headers: requestHeaders,
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
}; 