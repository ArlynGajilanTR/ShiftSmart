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
    const startTime = Date.now();
    
    // Use streaming for large token requests to avoid 10-minute timeout
    // OPTIMIZATION: Enable prompt caching for system prompt (saves cost on repeated calls)
    // Haiku 4.5 supports up to 200K context window, 8K max output tokens
    // Capped at 8192 for Haiku (32K was too high, causing streaming requirement errors)
    const effectiveMaxTokens = Math.min(maxTokens, 8192);
    
    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: effectiveMaxTokens,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }, // Cache system prompt (saves $0.90/$4.50 per M tokens)
        },
      ],
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Collect streamed response with performance tracking
    let fullText = '';
    let tokenCount = 0;
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        fullText += chunk.delta.text;
        tokenCount++;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[AI Performance] Generated ${fullText.length} chars in ${elapsed}ms (~${tokenCount} tokens)`);

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
