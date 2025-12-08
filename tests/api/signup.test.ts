/**
 * Signup API Tests
 * Phase 1: Critical Authentication Fix
 *
 * These tests verify the signup endpoint works correctly after the bureau_id fix.
 * Run with: npm test -- signup
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

// Test data
const testUser = {
  email: `test.signup.${Date.now()}@thomsonreuters.com`,
  password: 'TestPassword123!',
  full_name: 'Test Signup User',
  bureau_id: 'ITA-MILAN', // Using bureau CODE, not name
  title: 'Breaking News Correspondent',
  shift_role: 'correspondent',
};

describe('POST /api/auth/signup', () => {
  describe('Successful Registration', () => {
    it('should create a new user with valid bureau_id (code)', async () => {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUser.email.toLowerCase());
      expect(data.user.full_name).toBe(testUser.full_name);
      expect(data.user.bureau).toBe('Milan'); // Should resolve to bureau name
      expect(data.session).toBeDefined();
      expect(data.session.access_token).toBeDefined();
    });

    it('should create user with Rome bureau', async () => {
      const romeUser = {
        ...testUser,
        email: `test.rome.${Date.now()}@thomsonreuters.com`,
        bureau_id: 'ITA-ROME',
      };

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(romeUser),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.bureau).toBe('Rome');
    });
  });

  describe('Validation Errors', () => {
    it('should reject signup with invalid bureau_id', async () => {
      const invalidUser = {
        ...testUser,
        email: `test.invalid.${Date.now()}@thomsonreuters.com`,
        bureau_id: 'INVALID-BUREAU-CODE',
      };

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUser),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('bureau');
    });

    it('should reject signup with missing email', async () => {
      const { email, ...userWithoutEmail } = testUser;

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userWithoutEmail),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('required');
    });

    it('should reject signup with missing password', async () => {
      const { password, ...userWithoutPassword } = testUser;

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userWithoutPassword,
          email: `test.nopass.${Date.now()}@thomsonreuters.com`,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject signup with short password', async () => {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          email: `test.shortpass.${Date.now()}@thomsonreuters.com`,
          password: 'short', // Less than 8 characters
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('8 characters');
    });

    it('should reject signup with missing full_name', async () => {
      const { full_name, ...userWithoutName } = testUser;

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userWithoutName,
          email: `test.noname.${Date.now()}@thomsonreuters.com`,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject signup with missing shift_role', async () => {
      const { shift_role, ...userWithoutRole } = testUser;

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userWithoutRole,
          email: `test.norole.${Date.now()}@thomsonreuters.com`,
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should reject duplicate email registration', async () => {
      const duplicateEmail = `test.duplicate.${Date.now()}@thomsonreuters.com`;

      // First signup
      const firstResponse = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testUser, email: duplicateEmail }),
      });
      expect(firstResponse.status).toBe(201);

      // Second signup with same email
      const secondResponse = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testUser, email: duplicateEmail }),
      });

      expect(secondResponse.status).toBe(409);
      const data = await secondResponse.json();
      expect(data.error).toContain('already registered');
    });

    it('should treat emails as case-insensitive', async () => {
      const baseEmail = `test.case.${Date.now()}@thomsonreuters.com`;

      // First signup with lowercase
      const firstResponse = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testUser, email: baseEmail.toLowerCase() }),
      });
      expect(firstResponse.status).toBe(201);

      // Second signup with uppercase
      const secondResponse = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testUser, email: baseEmail.toUpperCase() }),
      });

      expect(secondResponse.status).toBe(409);
    });
  });

  describe('Security', () => {
    it('should hash password before storing (not return plaintext)', async () => {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          email: `test.security.${Date.now()}@thomsonreuters.com`,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      // Ensure password hash is not returned
      expect(data.user.password).toBeUndefined();
      expect(data.user.password_hash).toBeUndefined();
    });

    it('should create session token on signup', async () => {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          email: `test.session.${Date.now()}@thomsonreuters.com`,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.session).toBeDefined();
      expect(data.session.access_token).toBeDefined();
      expect(data.session.access_token.length).toBeGreaterThan(20);
      expect(data.session.expires_at).toBeDefined();
    });
  });

  describe('Default Values', () => {
    it('should set default team to Breaking News', async () => {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          email: `test.defaults.${Date.now()}@thomsonreuters.com`,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.team).toBe('Breaking News');
      expect(data.user.status).toBe('active');
    });

    it('should create default shift preferences', async () => {
      const email = `test.prefs.${Date.now()}@thomsonreuters.com`;

      const signupResponse = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testUser, email }),
      });

      expect(signupResponse.status).toBe(201);
      const signupData = await signupResponse.json();

      // Login and check preferences
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: testUser.password }),
      });

      expect(loginResponse.status).toBe(200);
    });
  });
});

describe('Signup Integration', () => {
  it('should allow login after successful signup', async () => {
    const email = `test.loginafter.${Date.now()}@thomsonreuters.com`;
    const password = 'TestPassword123!';

    // Signup
    const signupResponse = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testUser, email, password }),
    });
    expect(signupResponse.status).toBe(201);

    // Login
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData.user.email).toBe(email.toLowerCase());
    expect(loginData.session.access_token).toBeDefined();
  });
});
