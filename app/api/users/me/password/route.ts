import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth/verify';
import { verifyPassword, hashPassword } from '@/lib/auth/password';

/**
 * PUT /api/users/me/password
 * Changes the current authenticated user's password
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { current_password, new_password } = body;

    // Validate required fields
    if (!current_password) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    if (!new_password) {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    // Validate new password length
    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Use service role key to access password_hash
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user's current password hash
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData) {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json({ error: 'Failed to verify user' }, { status: 500 });
    }

    // Verify current password
    if (!userData.password_hash) {
      return NextResponse.json(
        { error: 'Account not set up properly. Please contact your administrator.' },
        { status: 403 }
      );
    }

    const isCurrentPasswordValid = await verifyPassword(current_password, userData.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(new_password);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
