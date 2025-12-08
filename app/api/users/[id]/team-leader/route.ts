import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth, isAdmin } from '@/lib/auth/verify';

/**
 * GET /api/users/:id/team-leader
 * Check if a user is a team leader
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: targetUser, error } = await supabase
      .from('users')
      .select('id, email, full_name, is_team_leader')
      .eq('id', id)
      .single();

    if (error || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: targetUser.id,
      email: targetUser.email,
      full_name: targetUser.full_name,
      is_team_leader: targetUser.is_team_leader || false,
    });
  } catch (error) {
    console.error('Get team leader status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/users/:id/team-leader
 * Toggle team leader status (admin only)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Only admins can toggle team leader status
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Only administrators can designate team leaders' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { is_team_leader } = body;

    if (typeof is_team_leader !== 'boolean') {
      return NextResponse.json({ error: 'is_team_leader must be a boolean' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if target user exists
    const { data: targetUser, error: findError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', id)
      .single();

    if (findError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update team leader status
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ is_team_leader })
      .eq('id', id)
      .select('id, email, full_name, is_team_leader')
      .single();

    if (updateError) {
      console.error('Update team leader error:', updateError);
      return NextResponse.json({ error: 'Failed to update team leader status' }, { status: 500 });
    }

    return NextResponse.json({
      message: is_team_leader
        ? `${updatedUser.full_name} is now a team leader`
        : `${updatedUser.full_name} is no longer a team leader`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        is_team_leader: updatedUser.is_team_leader,
      },
    });
  } catch (error) {
    console.error('Update team leader error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
