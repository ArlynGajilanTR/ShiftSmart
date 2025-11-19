/**
 * Mock Claude API Server
 * Simulates Anthropic's Claude API for integration testing
 */

import express, { Request, Response } from 'express';
import { Server } from 'http';
import { testConfig } from '../helpers/test-config';
import { createValidSchedule } from '../helpers/schedule-factory';
import * as fs from 'fs';
import * as path from 'path';

interface MockServerConfig {
  port?: number;
  defaultDelay?: number;
  enableLogging?: boolean;
}

interface MockResponse {
  pattern: string | RegExp;
  response: any;
  delay?: number;
  statusCode?: number;
  error?: boolean;
}

export class MockClaudeServer {
  private app: express.Application;
  private server: Server | null = null;
  private responses: MockResponse[] = [];
  private requestHistory: any[] = [];
  private config: MockServerConfig;
  private defaultResponses: Map<string, any> = new Map();

  constructor(config: MockServerConfig = {}) {
    this.config = {
      port: config.port || testConfig.mockClaudePort,
      defaultDelay: config.defaultDelay || testConfig.mockClaudeDelayMs,
      enableLogging: config.enableLogging ?? false,
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.loadDefaultResponses();
  }

  private setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      if (this.config.enableLogging) {
        console.log(`[Mock Claude] ${req.method} ${req.url}`);
      }

      // Store request in history
      this.requestHistory.push({
        timestamp: new Date(),
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
      });

      next();
    });

    // Simulate network delay
    this.app.use((req, res, next) => {
      const delay = this.getDelayForRequest(req);
      if (delay > 0) {
        setTimeout(next, delay);
      } else {
        next();
      }
    });
  }

  private setupRoutes() {
    // Main Claude messages endpoint
    this.app.post('/v1/messages', async (req: Request, res: Response) => {
      try {
        const { messages, system, max_tokens, model } = req.body;

        // Validate API key
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            error: {
              type: 'authentication_error',
              message: 'Invalid API key',
            },
          });
        }

        // Find matching response
        const userMessage = messages[0]?.content || '';
        const fullPrompt = `${system}\n${userMessage}`;
        const mockResponse = this.findMatchingResponse(fullPrompt);

        if (mockResponse) {
          if (mockResponse.error) {
            return res.status(mockResponse.statusCode || 500).json({
              error: {
                type: 'api_error',
                message: mockResponse.response,
              },
            });
          }

          // Return success response
          return res.status(200).json({
            id: 'msg_mock_' + Date.now(),
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: mockResponse.response,
              },
            ],
            model: model || 'claude-3-haiku-20240307',
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: {
              input_tokens: 100,
              output_tokens: Math.min(max_tokens || 1000, 1000),
            },
          });
        }

        // Default response
        const defaultSchedule = this.generateDefaultSchedule(fullPrompt);
        res.status(200).json({
          id: 'msg_mock_default_' + Date.now(),
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: JSON.stringify(defaultSchedule),
            },
          ],
          model: model || 'claude-3-haiku-20240307',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: {
            input_tokens: 100,
            output_tokens: 500,
          },
        });
      } catch (error) {
        console.error('[Mock Claude] Error:', error);
        res.status(500).json({
          error: {
            type: 'api_error',
            message: 'Internal server error',
          },
        });
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', mock: true });
    });
  }

  private loadDefaultResponses() {
    // Load fixture responses
    const fixturesDir = path.join(__dirname, '../fixtures/ai-responses');
    const files = fs.readdirSync(fixturesDir);

    files.forEach((file) => {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
        const fixture = JSON.parse(content);
        this.defaultResponses.set(file.replace('.json', ''), fixture);
      }
    });
  }

  private findMatchingResponse(prompt: string): MockResponse | null {
    for (const response of this.responses) {
      if (typeof response.pattern === 'string') {
        if (prompt.includes(response.pattern)) {
          return response;
        }
      } else if (response.pattern instanceof RegExp) {
        if (response.pattern.test(prompt)) {
          return response;
        }
      }
    }
    return null;
  }

  private generateDefaultSchedule(prompt: string): any {
    // Parse request parameters from prompt
    const weekMatch = prompt.match(/type['":\s]+week/i);
    const monthMatch = prompt.match(/type['":\s]+month/i);
    const quarterMatch = prompt.match(/type['":\s]+quarter/i);

    let shifts = 14; // Default week
    if (monthMatch) shifts = 60;
    if (quarterMatch) shifts = 180;

    const bureauMatch = prompt.match(/bureau['":\s]+(\w+)/i);
    const bureau = bureauMatch ? bureauMatch[1] : 'both';

    return createValidSchedule({
      shifts,
      bureau: bureau as any,
      includeWeekends: true,
      includeNights: prompt.includes('24/7') || prompt.includes('night'),
    });
  }

  private getDelayForRequest(req: Request): number {
    const prompt = req.body?.messages?.[0]?.content || '';
    const response = this.findMatchingResponse(prompt);
    return response?.delay ?? this.config.defaultDelay ?? 0;
  }

  /**
   * Add a mock response
   */
  public addResponse(pattern: string | RegExp, response: any, options: Partial<MockResponse> = {}) {
    this.responses.push({
      pattern,
      response: typeof response === 'string' ? response : JSON.stringify(response),
      delay: options.delay,
      statusCode: options.statusCode,
      error: options.error,
    });
    return this;
  }

  /**
   * Add multiple responses
   */
  public addResponses(responses: MockResponse[]) {
    this.responses.push(...responses);
    return this;
  }

  /**
   * Clear all custom responses
   */
  public clearResponses() {
    this.responses = [];
    return this;
  }

  /**
   * Get request history
   */
  public getRequestHistory() {
    return [...this.requestHistory];
  }

  /**
   * Clear request history
   */
  public clearHistory() {
    this.requestHistory = [];
    return this;
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        if (this.config.enableLogging) {
          console.log(`[Mock Claude] Server started on port ${this.config.port}`);
        }
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          if (this.config.enableLogging) {
            console.log('[Mock Claude] Server stopped');
          }
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Simulate specific error scenarios
   */
  public simulateError(type: 'timeout' | 'rate_limit' | 'server_error' | 'auth_error') {
    switch (type) {
      case 'timeout':
        this.addResponse(/.*/, 'Request timeout', {
          delay: 35000, // Longer than typical timeout
          error: true,
          statusCode: 504,
        });
        break;

      case 'rate_limit':
        this.addResponse(/.*/, 'Rate limit exceeded', {
          error: true,
          statusCode: 429,
        });
        break;

      case 'server_error':
        this.addResponse(/.*/, 'Internal server error', {
          error: true,
          statusCode: 503,
        });
        break;

      case 'auth_error':
        this.addResponse(/.*/, 'Invalid API key', {
          error: true,
          statusCode: 401,
        });
        break;
    }
    return this;
  }

  /**
   * Load a specific fixture response
   */
  public useFixture(fixtureName: string) {
    const fixture = this.defaultResponses.get(fixtureName);
    if (fixture) {
      this.addResponse(/.*/, fixture.response);
    }
    return this;
  }
}

// Singleton instance for tests
let mockServer: MockClaudeServer | null = null;

export function getMockServer(config?: MockServerConfig): MockClaudeServer {
  if (!mockServer) {
    mockServer = new MockClaudeServer(config);
  }
  return mockServer;
}

export async function startMockServer(config?: MockServerConfig): Promise<MockClaudeServer> {
  const server = getMockServer(config);
  await server.start();
  return server;
}

export async function stopMockServer(): Promise<void> {
  if (mockServer) {
    await mockServer.stop();
    mockServer = null;
  }
}
