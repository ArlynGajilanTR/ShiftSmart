// Helper to verify authentication in API routes

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSessionExpired } from './password';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  title: string;
  shift_role: string;
  bureau_id: string;
  bureau_name: string | null;
  team: string;
  status: string;
  role: string;
}

export interface AuthResult {
  user: AuthUser | null;
  error: string | null;
}

/**
 * Verify authentication token and return user data
 * Use this in API routes that require authentication
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: 'No authentication token provided',
    };
  }

  const token = authHeader.substring(7);
  const supabase = await createClient();

  // Find user by session token
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*, bureaus(name)')
    .eq('session_token', token)
    .single();

  if (userError || !user) {
    return {
      user: null,
      error: 'Invalid or expired session',
    };
  }

  // Check if session is expired
  if (!user.session_expires_at || isSessionExpired(new Date(user.session_expires_at))) {
    // Clear expired session
    await supabase
      .from('users')
      .update({
        session_token: null,
        session_expires_at: null,
      })
      .eq('id', user.id);

    return {
      user: null,
      error: 'Session expired',
    };
  }

  // Check if user is active
  if (user.status !== 'active') {
    return {
      user: null,
      error: 'Account is not active',
    };
  }

  // Return user data
  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      title: user.title,
      shift_role: user.shift_role,
      bureau_id: user.bureau_id,
      bureau_name: user.bureaus?.name || null,
      team: user.team,
      status: user.status,
      role: user.role,
    },
    error: null,
  };
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser, roles: string[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if user is admin or manager
 */
export function isAdminOrManager(user: AuthUser): boolean {
  return hasRole(user, ['admin', 'manager']);
}
