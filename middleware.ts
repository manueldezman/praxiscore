import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function middleware(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { userId?: string })?.userId;

  // Allow access to public routes
  if (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/api/auth')) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/settings/:path*', '/onboarding/:path*'],
};
