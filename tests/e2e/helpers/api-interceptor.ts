import { Page, Route } from '@playwright/test';

/**
 * API call tracking for verification
 */
export interface ApiCall {
  url: string;
  method: string;
  status?: number;
  requestBody?: any;
  responseBody?: any;
  timestamp: number;
}

export class ApiInterceptor {
  private calls: ApiCall[] = [];
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Start intercepting API calls
   */
  async start() {
    await this.page.route('**/api/**', async (route: Route) => {
      const request = route.request();
      const url = request.url();
      const method = request.method();

      let requestBody = null;
      try {
        const postData = request.postData();
        requestBody = postData ? JSON.parse(postData) : null;
      } catch {
        // Not JSON or no body
      }

      const response = await route.fetch();
      const responseBody = await response.json().catch(() => null);

      this.calls.push({
        url,
        method,
        status: response.status(),
        requestBody,
        responseBody,
        timestamp: Date.now(),
      });

      await route.fulfill({ response });
    });
  }

  /**
   * Stop intercepting
   */
  async stop() {
    await this.page.unroute('**/api/**');
  }

  /**
   * Get all API calls
   */
  getCalls(): ApiCall[] {
    return this.calls;
  }

  /**
   * Get calls matching a pattern
   */
  getCallsByPattern(pattern: RegExp | string): ApiCall[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.calls.filter((call) => regex.test(call.url));
  }

  /**
   * Get latest call matching pattern
   */
  getLatestCall(pattern: RegExp | string): ApiCall | null {
    const calls = this.getCallsByPattern(pattern);
    return calls.length > 0 ? calls[calls.length - 1] : null;
  }

  /**
   * Clear all recorded calls
   */
  clear() {
    this.calls = [];
  }

  /**
   * Verify an API call was made
   */
  verifyCall(method: string, urlPattern: RegExp | string, expectedStatus = 200): boolean {
    const calls = this.getCallsByPattern(urlPattern);
    const matchingCall = calls.find(
      (call) => call.method === method && call.status === expectedStatus
    );
    return !!matchingCall;
  }
}
