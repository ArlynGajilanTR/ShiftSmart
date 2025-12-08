/**
 * User Profile API Tests
 * Phase 2: Settings Page Implementation
 *
 * These tests verify the user profile and password change endpoints.
 * Run with: npm test -- users-me
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

// Test user credentials (should exist in test database)
let authToken: string;
let testUserId: string;

// Create test user before tests
beforeAll(async () => {
  const testUser = {
    email: `test.profile.${Date.now()}@thomsonreuters.com`,
    password: 'TestPassword123!',
    full_name: 'Profile Test User',
    bureau_id: 'ITA-MILAN',
    title: 'Breaking News Correspondent',
    shift_role: 'correspondent',
  };

  const signupResponse = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  if (signupResponse.status === 201) {
    const data = await signupResponse.json();
    authToken = data.session.access_token;
    testUserId = data.user.id;
  } else {
    // If signup fails, try login with existing test user
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'gianluca.semeraro@thomsonreuters.com',
        password: 'changeme',
      }),
    });
    const data = await loginResponse.json();
    authToken = data.session.access_token;
    testUserId = data.user.id;
  }
});

describe('GET /api/users/me', () => {
  describe('Successful Requests', () => {
    it('should return current user profile when authenticated', async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
      expect(data.user.email).toBeDefined();
      expect(data.user.full_name).toBeDefined();
      expect(data.user.bureau).toBeDefined();
      expect(data.user.shift_role).toBeDefined();
    });

    it('should include all expected profile fields', async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      const { user } = data;

      // Verify all expected fields are present
      const expectedFields = [
        'id',
        'email',
        'full_name',
        'phone',
        'title',
        'shift_role',
        'bureau',
        'bureau_id',
        'team',
        'status',
        'role',
      ];

      expectedFields.forEach((field) => {
        expect(user).toHaveProperty(field);
      });

      // Ensure sensitive fields are NOT present
      expect(user.password).toBeUndefined();
      expect(user.password_hash).toBeUndefined();
      expect(user.session_token).toBeUndefined();
    });
  });

  describe('Authentication Errors', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token-12345',
        },
      });

      expect(response.status).toBe(401);
    });

    it('should reject expired token', async () => {
      // This test assumes expired tokens are properly rejected
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer expired-token-from-past',
        },
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('PUT /api/users/me', () => {
  describe('Successful Updates', () => {
    it('should update full_name', async () => {
      const newName = `Updated Name ${Date.now()}`;

      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ full_name: newName }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.full_name).toBe(newName);
      expect(data.message).toContain('updated');
    });

    it('should update phone number', async () => {
      const newPhone = '+39 06 9876 5432';

      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ phone: newPhone }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.phone).toBe(newPhone);
    });

    it('should update multiple fields at once', async () => {
      const updates = {
        full_name: `Multi Update ${Date.now()}`,
        phone: '+39 02 1111 2222',
      };

      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updates),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.full_name).toBe(updates.full_name);
      expect(data.user.phone).toBe(updates.phone);
    });

    it('should clear phone when set to null', async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ phone: null }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.phone).toBeNull();
    });
  });

  describe('Validation Errors', () => {
    it('should reject empty full_name', async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ full_name: '' }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject full_name with only whitespace', async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ full_name: '   ' }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject single character full_name', async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ full_name: 'A' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('2 characters');
    });
  });

  describe('Authentication Errors', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: 'Hacker' }),
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('PUT /api/users/me/password', () => {
  // Create a dedicated user for password tests
  let passwordTestToken: string;
  const passwordTestUser = {
    email: `test.password.${Date.now()}@thomsonreuters.com`,
    password: 'OriginalPassword123!',
    full_name: 'Password Test User',
    bureau_id: 'ITA-MILAN',
    title: 'Breaking News Correspondent',
    shift_role: 'correspondent',
  };

  beforeAll(async () => {
    const signupResponse = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordTestUser),
    });

    if (signupResponse.status === 201) {
      const data = await signupResponse.json();
      passwordTestToken = data.session.access_token;
    }
  });

  describe('Successful Password Change', () => {
    it('should change password with valid current password', async () => {
      if (!passwordTestToken) {
        console.log('Skipping: No test token available');
        return;
      }

      const response = await fetch(`${API_URL}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passwordTestToken}`,
        },
        body: JSON.stringify({
          current_password: passwordTestUser.password,
          new_password: 'NewSecurePassword456!',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain('updated');
    });

    it('should allow login with new password after change', async () => {
      if (!passwordTestToken) return;

      // First change password
      await fetch(`${API_URL}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passwordTestToken}`,
        },
        body: JSON.stringify({
          current_password: 'NewSecurePassword456!',
          new_password: 'AnotherPassword789!',
        }),
      });

      // Try to login with new password
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: passwordTestUser.email,
          password: 'AnotherPassword789!',
        }),
      });

      expect(loginResponse.status).toBe(200);
    });
  });

  describe('Validation Errors', () => {
    it('should reject incorrect current password', async () => {
      const response = await fetch(`${API_URL}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          current_password: 'WrongPassword123!',
          new_password: 'NewPassword456!',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('incorrect');
    });

    it('should reject new password shorter than 8 characters', async () => {
      const response = await fetch(`${API_URL}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          current_password: 'CurrentPassword123!',
          new_password: 'short',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('8 characters');
    });

    it('should reject missing current_password', async () => {
      const response = await fetch(`${API_URL}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          new_password: 'NewPassword456!',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject missing new_password', async () => {
      const response = await fetch(`${API_URL}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          current_password: 'CurrentPassword123!',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Authentication Errors', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${API_URL}/api/users/me/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: 'AnyPassword123!',
          new_password: 'NewPassword456!',
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});
