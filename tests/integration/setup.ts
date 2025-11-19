/**
 * Integration Test Setup
 * Common setup and teardown for integration tests
 */

import { MockClaudeServer, startMockServer, stopMockServer } from './mock-claude-server';
import { testConfig } from '../helpers/test-config';

// Store server instance
let mockServer: MockClaudeServer | null = null;

/**
 * Setup integration test environment
 */
export async function setupIntegrationTests() {
  // Set environment to use mock server
  process.env.ANTHROPIC_API_URL = testConfig.mockApiUrl + '/v1/messages';
  process.env.ANTHROPIC_API_KEY = testConfig.anthropicTestApiKey;

  // Start mock server
  mockServer = await startMockServer({
    enableLogging: process.env.DEBUG === 'true',
  });

  return mockServer;
}

/**
 * Teardown integration test environment
 */
export async function teardownIntegrationTests() {
  // Stop mock server
  await stopMockServer();

  // Reset environment
  delete process.env.ANTHROPIC_API_URL;
}

/**
 * Get current mock server instance
 */
export function getMockServer(): MockClaudeServer {
  if (!mockServer) {
    throw new Error('Mock server not initialized. Call setupIntegrationTests first.');
  }
  return mockServer;
}

/**
 * Jest global setup
 */
export default async function globalSetup() {
  console.log('Setting up integration test environment...');
  await setupIntegrationTests();
}

/**
 * Jest global teardown
 */
export async function globalTeardown() {
  console.log('Tearing down integration test environment...');
  await teardownIntegrationTests();
}
