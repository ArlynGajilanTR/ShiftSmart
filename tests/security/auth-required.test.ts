/**
 * Security Audit: Authentication Required Tests
 * Phase 3: Security & Documentation
 *
 * These tests verify ALL protected endpoints require authentication.
 * Run with: npm test -- auth-required
 */

import { describe, it, expect } from 'vitest';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('All Protected Endpoints Require Authentication', () => {
  /**
   * List of all endpoints that MUST require authentication.
   * If a new endpoint is added, it should be included here.
   */
  const protectedEndpoints = [
    // Dashboard
    { method: 'GET', path: '/api/dashboard/stats' },

    // Employees
    { method: 'GET', path: '/api/employees' },
    { method: 'POST', path: '/api/employees' },
    { method: 'GET', path: '/api/employees/test-id' },
    { method: 'PUT', path: '/api/employees/test-id' },
    { method: 'DELETE', path: '/api/employees/test-id' },
    { method: 'GET', path: '/api/employees/test-id/preferences' },
    { method: 'PUT', path: '/api/employees/test-id/preferences' },

    // Shifts
    { method: 'GET', path: '/api/shifts' },
    { method: 'POST', path: '/api/shifts' },
    { method: 'GET', path: '/api/shifts/test-id' },
    { method: 'PUT', path: '/api/shifts/test-id' },
    { method: 'PATCH', path: '/api/shifts/test-id' },
    { method: 'DELETE', path: '/api/shifts/test-id' },
    { method: 'GET', path: '/api/shifts/upcoming' },
    { method: 'DELETE', path: '/api/shifts/reset' },

    // Conflicts
    { method: 'GET', path: '/api/conflicts' },
    { method: 'POST', path: '/api/conflicts' },
    { method: 'PUT', path: '/api/conflicts/test-id' },
    { method: 'PATCH', path: '/api/conflicts/test-id' },

    // AI Endpoints
    { method: 'POST', path: '/api/ai/generate-schedule' },
    { method: 'POST', path: '/api/ai/save-schedule' },
    { method: 'POST', path: '/api/ai/resolve-conflict' },
    { method: 'POST', path: '/api/ai/chatbot' },

    // User Profile (Phase 2)
    { method: 'GET', path: '/api/users/me' },
    { method: 'PUT', path: '/api/users/me' },
    { method: 'PUT', path: '/api/users/me/password' },

    // Auth (logout requires auth)
    { method: 'POST', path: '/api/auth/logout' },
  ];

  protectedEndpoints.forEach(({ method, path }) => {
    it(`${method} ${path} should reject unauthenticated requests with 401`, async () => {
      const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify({}) : undefined,
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('Public Endpoints Should NOT Require Authentication', () => {
  /**
   * List of endpoints that should be accessible without auth.
   */
  const publicEndpoints = [
    { method: 'POST', path: '/api/auth/login', body: { email: 'test@test.com', password: 'test' } },
    {
      method: 'POST',
      path: '/api/auth/signup',
      body: {
        email: 'test@test.com',
        password: 'testtest',
        full_name: 'Test',
        bureau_id: 'ITA-MILAN',
        title: 'Test',
        shift_role: 'correspondent',
      },
    },
  ];

  publicEndpoints.forEach(({ method, path, body }) => {
    it(`${method} ${path} should be accessible without auth (may return 400/409, but not 401)`, async () => {
      const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // These endpoints should NOT return 401
      // They may return other errors (400 for validation, 409 for conflict)
      expect(response.status).not.toBe(401);
    });
  });
});

describe('Token Validation', () => {
  const testEndpoint = { method: 'GET', path: '/api/employees' };

  it('should reject empty authorization header', async () => {
    const response = await fetch(`${API_URL}${testEndpoint.path}`, {
      method: testEndpoint.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: '',
      },
    });

    expect(response.status).toBe(401);
  });

  it('should reject "Bearer " without token', async () => {
    const response = await fetch(`${API_URL}${testEndpoint.path}`, {
      method: testEndpoint.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ',
      },
    });

    expect(response.status).toBe(401);
  });

  it('should reject random string as token', async () => {
    const response = await fetch(`${API_URL}${testEndpoint.path}`, {
      method: testEndpoint.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer random-invalid-token-string',
      },
    });

    expect(response.status).toBe(401);
  });

  it('should reject token without "Bearer" prefix', async () => {
    const response = await fetch(`${API_URL}${testEndpoint.path}`, {
      method: testEndpoint.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'some-token-without-bearer',
      },
    });

    expect(response.status).toBe(401);
  });

  it('should reject Basic auth (wrong scheme)', async () => {
    const response = await fetch(`${API_URL}${testEndpoint.path}`, {
      method: testEndpoint.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic dXNlcjpwYXNz',
      },
    });

    expect(response.status).toBe(401);
  });
});

describe('No Sensitive Data Leak on 401', () => {
  it('should not leak user information in 401 responses', async () => {
    const response = await fetch(`${API_URL}/api/employees`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status).toBe(401);
    const data = await response.json();

    // Should not contain any user data
    expect(data.user).toBeUndefined();
    expect(data.users).toBeUndefined();
    expect(data.employees).toBeUndefined();
    expect(data.password).toBeUndefined();
    expect(data.token).toBeUndefined();

    // Should only contain error message
    expect(data.error).toBeDefined();
  });
});
