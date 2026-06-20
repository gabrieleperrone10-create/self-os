import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — getSession reads from cookie (no network call, avoids middleware hangs)
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;

  // Auth pages — no login required
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.includes(pathname);

  // Public paths — accessible without auth
  // /api/cron: autenticato via CRON_SECRET nella route, non via sessione
  // /api/biometrics/ingest: autenticato via Bearer token (Health Auto Export da iPhone)
  const isPublicPath = isAuthPath || pathname === '/' || pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/cron') || pathname.startsWith('/join') || pathname.startsWith('/api/biometrics/ingest');

  // Redirect unauthenticated users to login
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
