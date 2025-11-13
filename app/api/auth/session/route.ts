import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSessionExpired } from '@/lib/auth/password';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = await createClient();

    // Find user by session token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, bureaus(name, code)')
      .eq('session_token', token)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
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

      return NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

    // Return user data
    const response = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        title: user.title,
        shift_role: user.shift_role,
        bureau: user.bureaus?.name || null,
        bureau_id: user.bureau_id,
        team: user.team,
        status: user.status,
        role: user.role,
      },
      session: {
        access_token: token,
        expires_at: user.session_expires_at,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
