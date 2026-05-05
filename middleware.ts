import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function (request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse = NextResponse.next({
              request,
            });
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Define protected routes (since you're using (dashboard) group)
  const isDashboardRoute = pathname === '/' || 
                          pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/today') || 
                          pathname.startsWith('/tasks') ||
                          pathname.startsWith('/upcoming') ||
                          pathname.startsWith('/settings');

  const isAuthRoute = pathname.startsWith('/login') || 
                      pathname.startsWith('/signup');

  // Not logged in + trying to access protected route → redirect to login
  if (!session && isDashboardRoute) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Logged in + trying to access auth pages → redirect to dashboard (root)
  if (session && isAuthRoute) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}