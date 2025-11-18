import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { getLastFailedResponses } from '@/lib/ai/scheduler-agent';

/**
 * GET /api/ai/debug-last-response
 * Retrieve last failed AI responses for debugging
 * SECURITY: Requires authentication, sanitizes PII
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication (only authenticated users can access debug info)
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get last failed responses from scheduler agent
    const failedResponses = getLastFailedResponses();

    if (failedResponses.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No recent failures',
        failures: [],
      });
    }

    // Sanitize responses (limit size, remove potentially sensitive data)
    const sanitizedResponses = failedResponses.map((failure) => ({
      timestamp: failure.timestamp,
      responseLength: failure.responseLength,
      error: failure.error,
      requestConfig: {
        period: failure.requestConfig.period,
        bureau: failure.requestConfig.bureau,
        employeeCount: failure.requestConfig.employeeCount,
        existingShiftCount: failure.requestConfig.existingShiftCount,
      },
      // Truncate response for security/size
      responsePreview: {
        first1000: failure.response.substring(0, 1000),
        last500: failure.response.substring(Math.max(0, failure.response.length - 500)),
      },
    }));

    return NextResponse.json({
      success: true,
      count: sanitizedResponses.length,
      failures: sanitizedResponses,
      note: 'Response previews are truncated for security. Full responses are logged server-side.',
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

