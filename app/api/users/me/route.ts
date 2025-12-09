import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth/verify';

/**
 * GET /api/users/me
 * Returns the current authenticated user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    // Return user profile (sensitive fields are already excluded by verifyAuth)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        title: user.title,
        shift_role: user.shift_role,
        bureau: user.bureau_name,
        bureau_id: user.bureau_id,
        team: user.team,
        status: user.status,
        role: user.role,
        is_team_leader: user.is_team_leader,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/users/me
 * Updates the current authenticated user's profile (full_name, phone)
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone } = body;

    // Build updates object with only allowed fields
    const updates: Record<string, string | null> = {};

    // Validate and add full_name if provided
    if (full_name !== undefined) {
      if (full_name === null || (typeof full_name === 'string' && full_name.trim() === '')) {
        return NextResponse.json({ error: 'Full name cannot be empty' }, { status: 400 });
      }

      const trimmedName = full_name.trim();
      if (trimmedName.length < 2) {
        return NextResponse.json(
          { error: 'Full name must be at least 2 characters long' },
          { status: 400 }
        );
      }

      updates.full_name = trimmedName;
    }

    // Add phone if provided (can be null to clear)
    if (phone !== undefined) {
      updates.phone = phone;
    }

    // If no updates provided, return error
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Use service role key to bypass RLS
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

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('*, bureaus(name)')
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone,
        title: updatedUser.title,
        shift_role: updatedUser.shift_role,
        bureau: updatedUser.bureaus?.name || null,
        bureau_id: updatedUser.bureau_id,
        team: updatedUser.team,
        status: updatedUser.status,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
