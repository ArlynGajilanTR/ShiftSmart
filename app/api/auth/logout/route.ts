import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = await createClient();

    // Clear the session token
    const { error } = await supabase
      .from('users')
      .update({
        session_token: null,
        session_expires_at: null,
      })
      .eq('session_token', token);

    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully logged out' }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
