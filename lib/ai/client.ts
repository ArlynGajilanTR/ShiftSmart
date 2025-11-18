// Anthropic Claude client for AI scheduling

import Anthropic from '@anthropic-ai/sdk';

// Initialize client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Changed from Sonnet 4.5 to Haiku 4.5 for significantly faster response times
// Claude Haiku 4.5: Near-frontier performance, 2x+ faster, 67% cheaper
// Increased max_tokens from 8192 to 16384 to handle large month schedules
export const MODEL = 'claude-haiku-4-5';

/**
 * Call Claude Haiku 4.5 for AI scheduling (fast, cost-effective)
 */
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<string> {
  try {
    // Use streaming for large token requests to avoid 10-minute timeout
    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Collect streamed response
    let fullText = '';
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        fullText += chunk.delta.text;
      }
    }

    if (!fullText) {
      throw new Error('No text content in Claude response');
    }

    return fullText;
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to generate AI schedule');
  }
}

/**
 * Check if API key is configured
 */
export function isConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
