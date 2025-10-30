import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword, generateSessionToken, getSessionExpiration } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use service role key to bypass RLS for login (needs to read password_hash before auth)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, bureaus(name, code)')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Account not set up. Please contact your administrator.' },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const sessionExpires = getSessionExpiration();

    // Update user's session
    const { error: updateError } = await supabase
      .from('users')
      .update({
        session_token: sessionToken,
        session_expires_at: sessionExpires.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Return user data and session token
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
        access_token: sessionToken,
        expires_at: sessionExpires.toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

