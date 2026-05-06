import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { supabaseAdmin } from '@/lib/db/supabase';

export const config = {
  runtime: 'nodejs',
  matcher: ['/app', '/app/:path*', '/settings/:path*', '/onboarding/:path*', '/audit/:path*'],
};

export async function middleware(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { userId?: string })?.userId;

  // Allow access to public routes
  if (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Auditor page is public but requires valid viewing key
  if (req.nextUrl.pathname.startsWith('/audit/')) {
    return NextResponse.next();
  }

  // Redirect to sign in if not authenticated
  if (!userId) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Check if user needs onboarding (no rules yet)
  if (req.nextUrl.pathname === '/app' || req.nextUrl.pathname === '/settings') {
    try {
      const { data: rules } = await supabaseAdmin
        .from('rules')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!rules || rules.length === 0) {
        // User has no rules, redirect to onboarding
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    } catch (error) {
      // If check fails, allow access
    }
  }

  // Business-only routes check
  const businessRoutes = ['/app/payroll', '/app/batch', '/app/teams'];
  if (businessRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('account_type')
        .eq('id', userId)
        .single();

      if (user?.account_type !== 'business') {
        // Not a business account, redirect to dashboard
        return NextResponse.redirect(new URL('/app', req.url));
      }
    } catch (error) {
      // If check fails, allow access
    }
  }

  return NextResponse.next();
}
