/**
 * Test configuration loader
 * Loads test environment variables and provides typed config
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load test environment
config({ path: join(__dirname, '../config/test.env') });

export interface TestConfig {
  // API Configuration
  anthropicTestApiKey: string;
  testModel: string;
  maxTestTokens: number;
  testTimeoutMs: number;
  testMaxRetries: number;

  // Mock Server
  mockClaudePort: number;
  mockClaudeDelayMs: number;

  // Test Users
  testAdminEmail: string;
  testAdminPassword: string;
  testUserEmail: string;
  testUserPassword: string;

  // Feature Flags
  enableLiveAiTests: boolean;
  enablePerformanceTests: boolean;

  // Database
  testDatabaseUrl: string;

  // API URLs
  apiUrl: string;
  mockApiUrl: string;
}

export const testConfig: TestConfig = {
  // API Configuration
  anthropicTestApiKey: process.env.ANTHROPIC_TEST_API_KEY || 'sk-ant-test-xxx',
  testModel: process.env.TEST_MODEL || 'claude-3-haiku-20240307',
  maxTestTokens: parseInt(process.env.MAX_TEST_TOKENS || '1000'),
  testTimeoutMs: parseInt(process.env.TEST_TIMEOUT_MS || '30000'),
  testMaxRetries: parseInt(process.env.TEST_MAX_RETRIES || '2'),

  // Mock Server
  mockClaudePort: parseInt(process.env.MOCK_CLAUDE_PORT || '3001'),
  mockClaudeDelayMs: parseInt(process.env.MOCK_CLAUDE_DELAY_MS || '500'),

  // Test Users
  testAdminEmail: process.env.TEST_ADMIN_EMAIL || 'test.admin@thomsonreuters.com',
  testAdminPassword: process.env.TEST_ADMIN_PASSWORD || 'testadmin123',
  testUserEmail: process.env.TEST_USER_EMAIL || 'test.user@thomsonreuters.com',
  testUserPassword: process.env.TEST_USER_PASSWORD || 'testuser123',

  // Feature Flags
  enableLiveAiTests: process.env.ENABLE_LIVE_AI_TESTS === 'true',
  enablePerformanceTests: process.env.ENABLE_PERFORMANCE_TESTS === 'true',

  // Database
  testDatabaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/shiftsmart_test',

  // API URLs
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  mockApiUrl: `http://localhost:${process.env.MOCK_CLAUDE_PORT || '3001'}`,
};

// Validate required config for live tests
export function validateLiveTestConfig(): void {
  if (testConfig.enableLiveAiTests && testConfig.anthropicTestApiKey === 'sk-ant-test-xxx') {
    throw new Error('Live AI tests enabled but no real ANTHROPIC_TEST_API_KEY provided');
  }
}
