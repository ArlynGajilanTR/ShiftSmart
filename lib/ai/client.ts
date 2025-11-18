// Anthropic Claude client for AI scheduling

import Anthropic from '@anthropic-ai/sdk';

// Initialize client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Changed from Sonnet 4.5 to Haiku 4.5 for significantly faster response times
// Claude Haiku 4.5: Near-frontier performance, 2x+ faster than Haiku 3.5, 1/3 cost of Sonnet
// Best for: Real-time tasks, JSON generation, rule-based scheduling, low latency
export const MODEL = 'claude-haiku-4-5';

/**
 * Call Claude Haiku 4.5 for AI scheduling (fast, cost-effective, near-frontier)
 */
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
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

    // Extract text from response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    return textContent.text;
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
