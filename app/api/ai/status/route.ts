import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { isConfigured, MODEL } from '@/lib/ai/client';

/**
 * GET /api/ai/status
 * Check AI configuration status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const configured = isConfigured();

    return NextResponse.json(
      {
        ai_enabled: configured,
        model: MODEL,
        features: {
          schedule_generation: configured,
          conflict_resolution: configured,
          fairness_analysis: configured,
        },
        configuration_status: configured
          ? 'AI features are enabled and ready to use'
          : 'AI features are disabled. Set ANTHROPIC_API_KEY environment variable to enable.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('AI status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
