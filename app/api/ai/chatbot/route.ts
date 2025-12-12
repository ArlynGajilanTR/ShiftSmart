import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyAuth } from '@/lib/auth/verify';

// Import auto-generated knowledge base from documentation
// Regenerate with: npm run generate:chatbot-knowledge
import { SHIFTSMART_KNOWLEDGE, KNOWLEDGE_METADATA } from '@/lib/ai/generated-knowledge';

// Log knowledge version on startup (for debugging)
console.log(
  `[Chatbot] Using knowledge base v${KNOWLEDGE_METADATA.version} (generated: ${KNOWLEDGE_METADATA.generatedAt})`
);

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          answer:
            "I'm currently unavailable. Please contact your administrator to configure the AI service.",
        },
        { status: 200 }
      );
    }

    const body = await request.json();
    const { question, history = [], messages: rawMessages } = body;

    // Build messages array, supporting both legacy {question, history}
    // and the newer {messages: [{ role, content }]} format used in tests.
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (Array.isArray(rawMessages) && rawMessages.length > 0) {
      // New format: caller provides full message history
      for (const msg of rawMessages) {
        if (!msg || typeof msg.content !== 'string') continue;
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }

      if (messages.length === 0) {
        return NextResponse.json(
          { error: 'At least one valid message is required' },
          { status: 400 }
        );
      }
    } else {
      // Legacy format: separate question + history (used by ChatbotGuide)
      if (!question || typeof question !== 'string') {
        return NextResponse.json({ error: 'Question is required' }, { status: 400 });
      }

      const safeHistory = Array.isArray(history) ? history : [];
      for (const msg of safeHistory) {
        if (!msg || typeof msg.content !== 'string') continue;
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }

      messages.push({
        role: 'user',
        content: question,
      });
    }

    // Initialize Anthropic client
    const client = new Anthropic({ apiKey });

    // Call Claude Haiku 4.5 (fast, cost-effective, near-frontier)
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: SHIFTSMART_KNOWLEDGE,
      messages,
    });

    // Extract text response
    const textBlock = response.content.find((block) => block.type === 'text');
    const answer = textBlock?.type === 'text' ? textBlock.text : "I couldn't generate a response.";

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Chatbot API error:', error);

    // Return a friendly error message
    return NextResponse.json(
      {
        answer:
          'Sorry, I encountered an error. Please try asking your question again, or contact support if the issue persists.',
      },
      { status: 200 }
    );
  }
}
