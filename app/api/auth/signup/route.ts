import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashPassword, generateSessionToken, getSessionExpiration } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone, bureau, title, shift_role } = await request.json();

    // Validate required fields
    if (!email || !password || !full_name || !bureau || !title || !shift_role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Get bureau ID
    const { data: bureauData, error: bureauError } = await supabase
      .from('bureaus')
      .select('id, name')
      .eq('name', bureau)
      .single();

    if (bureauError || !bureauData) {
      return NextResponse.json(
        { error: 'Invalid bureau' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate session token for auto-login after signup
    const sessionToken = generateSessionToken();
    const sessionExpires = getSessionExpiration();

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        full_name,
        phone: phone || null,
        title,
        shift_role,
        bureau_id: bureauData.id,
        team: 'Breaking News', // Default team
        status: 'active',
        password_hash: passwordHash,
        session_token: sessionToken,
        session_expires_at: sessionExpires.toISOString(),
      })
      .select('*, bureaus(name, code)')
      .single();

    if (createError || !newUser) {
      console.error('User creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Create default shift preferences
    await supabase
      .from('shift_preferences')
      .insert({
        user_id: newUser.id,
        preferred_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        preferred_shifts: ['Morning', 'Afternoon'],
        max_shifts_per_week: 5,
        notes: '',
      });

    // Return user data and session token
    const response = {
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        phone: newUser.phone,
        title: newUser.title,
        shift_role: newUser.shift_role,
        bureau: newUser.bureaus?.name || null,
        bureau_id: newUser.bureau_id,
        team: newUser.team,
        status: newUser.status,
        role: newUser.role,
      },
      session: {
        access_token: sessionToken,
        expires_at: sessionExpires.toISOString(),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

