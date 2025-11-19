/**
 * AI Mock Helper - Sophisticated mocking for Claude API
 * Provides fluent API for setting up mock responses
 */

import { TestSchedule } from './schedule-factory';

export interface MockExpectation {
  prompt: string | RegExp;
  response: string | TestSchedule;
  delay?: number;
  error?: Error;
  times?: number;
}

export class ClaudeMock {
  private expectations: MockExpectation[] = [];
  private callHistory: Array<{ prompt: string; timestamp: Date }> = [];
  private currentIndex = 0;

  /**
   * Set up an expectation for a prompt
   */
  expectPrompt(prompt: string | RegExp) {
    const expectation: MockExpectation = {
      prompt,
      response: '',
      times: 1,
    };

    const builder = {
      respondWith: (response: string | TestSchedule) => {
        expectation.response = typeof response === 'string' ? response : JSON.stringify(response);
        return builder;
      },
      afterDelay: (ms: number) => {
        expectation.delay = ms;
        return builder;
      },
      throwError: (error: Error) => {
        expectation.error = error;
        return builder;
      },
      times: (count: number) => {
        expectation.times = count;
        return builder;
      },
    };

    this.expectations.push(expectation);
    return builder;
  }

  /**
   * Mock the callClaude function
   */
  async mockCall(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
    this.callHistory.push({
      prompt: userPrompt,
      timestamp: new Date(),
    });

    // Find matching expectation
    const expectation = this.findMatchingExpectation(userPrompt);

    if (!expectation) {
      throw new Error(`No expectation found for prompt: ${userPrompt.substring(0, 100)}...`);
    }

    // Apply delay if specified
    if (expectation.delay) {
      await new Promise((resolve) => setTimeout(resolve, expectation.delay));
    }

    // Throw error if specified
    if (expectation.error) {
      throw expectation.error;
    }

    // Decrement times if not infinite (-1)
    if (expectation.times && expectation.times > 0) {
      expectation.times--;
      if (expectation.times === 0) {
        // Remove exhausted expectation
        const index = this.expectations.indexOf(expectation);
        this.expectations.splice(index, 1);
      }
    }

    return expectation.response;
  }

  /**
   * Find expectation matching the prompt
   */
  private findMatchingExpectation(prompt: string): MockExpectation | undefined {
    return this.expectations.find((exp) => {
      if (typeof exp.prompt === 'string') {
        return prompt.includes(exp.prompt);
      } else {
        return exp.prompt.test(prompt);
      }
    });
  }

  /**
   * Verify all expectations were met
   */
  verify(): void {
    const unmetExpectations = this.expectations.filter((exp) => exp.times && exp.times > 0);

    if (unmetExpectations.length > 0) {
      throw new Error(
        `Unmet expectations:\n${unmetExpectations
          .map((exp) => `- ${exp.prompt} (${exp.times} calls remaining)`)
          .join('\n')}`
      );
    }
  }

  /**
   * Reset all expectations and history
   */
  reset(): void {
    this.expectations = [];
    this.callHistory = [];
    this.currentIndex = 0;
  }

  /**
   * Get call history
   */
  getCallHistory(): Array<{ prompt: string; timestamp: Date }> {
    return this.callHistory;
  }

  /**
   * Get call count
   */
  getCallCount(): number {
    return this.callHistory.length;
  }

  /**
   * Was specific prompt called?
   */
  wasCalledWith(prompt: string | RegExp): boolean {
    return this.callHistory.some((call) => {
      if (typeof prompt === 'string') {
        return call.prompt.includes(prompt);
      } else {
        return prompt.test(call.prompt);
      }
    });
  }
}

/**
 * Global mock instance
 */
export const claudeMock = new ClaudeMock();

/**
 * Simulate various API errors
 */
export const mockErrors = {
  timeout: () => new Error('Request timeout after 30000ms'),
  rateLimit: () => new Error('Rate limit exceeded (429)'),
  serverError: () => new Error('Internal server error (503)'),
  networkError: () => new Error('Network request failed'),
  authError: () => new Error('Invalid API key'),
  parseError: () => new Error('Failed to parse response'),
};

/**
 * Simulate streaming response
 */
export async function* mockStreamResponse(text: string, chunkSize = 100): AsyncGenerator<string> {
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/**
 * Create retryable error scenarios
 */
export function createRetryScenario(): MockExpectation[] {
  return [
    {
      prompt: /week schedule/,
      error: mockErrors.timeout(),
      times: 1, // Fail first time
      response: '',
    },
    {
      prompt: /week schedule/,
      error: mockErrors.rateLimit(),
      times: 1, // Fail second time
      response: '',
    },
    {
      prompt: /week schedule/,
      response: JSON.stringify({
        shifts: [],
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: {},
          preference_satisfaction_rate: 0,
          hard_constraint_violations: [],
        },
        recommendations: [],
      }),
      times: 1, // Succeed third time
    },
  ];
}
