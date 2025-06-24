import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware is now disabled for all routes
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [], // No routes are protected by middleware
};
