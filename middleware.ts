import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If there's an auth error in URL params (e.g. failed signup), redirect to login with the error
  const errorDescription = request.nextUrl.searchParams.get('error_description');
  const errorCode = request.nextUrl.searchParams.get('error_code');
  if (errorDescription && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error_description', errorDescription);
    if (errorCode) url.searchParams.set('error_code', errorCode);
    return NextResponse.redirect(url);
  }

  // Protected routes
  const protectedPaths = ['/chat', '/builder', '/dashboard', '/settings'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/chat';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
