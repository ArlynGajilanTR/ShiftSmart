// Anthropic Claude client for AI scheduling

import Anthropic from '@anthropic-ai/sdk';

// Initialize client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Changed from Sonnet 4.5 to Haiku 4.5 for significantly faster response times
// Claude Haiku 4.5: Released Oct 2024, near-frontier performance, 2x+ faster, 67% cheaper
// Max output: 8192 tokens, supports extended thinking
export const MODEL = 'claude-haiku-4-5-20251001';

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // Start with 1 second

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Claude Haiku 4.5 for AI scheduling (fast, cost-effective)
 * Enhanced with retry logic for transient failures
 */
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096,
  retryCount: number = 0
): Promise<string> {
  try {
    const startTime = Date.now();
    
    if (retryCount > 0) {
      console.log(`[Retry] Attempt ${retryCount}/${MAX_RETRIES} after ${BASE_DELAY_MS * Math.pow(2, retryCount - 1)}ms delay`);
    }
    
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
    console.error(`[Claude API] Error on attempt ${retryCount + 1}:`, error);
    
    // Determine if error is retryable
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRetryable = 
      errorMessage.includes('timeout') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('503') ||
      errorMessage.includes('429') ||
      errorMessage.includes('overloaded');
    
    // Retry with exponential backoff for retryable errors
    if (isRetryable && retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
      console.log(`[Retry] Retryable error detected, waiting ${delay}ms before retry ${retryCount + 1}/${MAX_RETRIES}`);
      await sleep(delay);
      return callClaude(systemPrompt, userPrompt, maxTokens, retryCount + 1);
    }
    
    // Non-retryable error or max retries exceeded
    if (retryCount >= MAX_RETRIES) {
      console.error(`[Claude API] Max retries (${MAX_RETRIES}) exceeded`);
    }
    
    throw new Error('Failed to generate AI schedule');
  }
}

/**
 * Check if API key is configured
 */
export function isConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
