/**
 * Time-Off API Tests
 * Tests for the time-off request endpoints including CRUD operations and overlap validation.
 *
 * Run with: npm test -- time-off
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

// Test user credentials
let authToken: string;
let testUserId: string;
let createdTimeOffIds: string[] = [];

// Create test user before tests
beforeAll(async () => {
  // Try to login with existing test user
  const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'gianluca.semeraro@thomsonreuters.com',
      password: 'changeme',
    }),
  });

  if (loginResponse.ok) {
    const data = await loginResponse.json();
    authToken = data.session.access_token;
    testUserId = data.user.id;
  } else {
    console.error('Failed to login for tests');
  }
});

// Clean up created time-off entries after tests
afterAll(async () => {
  for (const id of createdTimeOffIds) {
    try {
      await fetch(`${API_URL}/api/time-off/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
});

describe('GET /api/time-off', () => {
  describe('Successful Requests', () => {
    it('should return user time-off entries when authenticated', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.time_off_requests).toBeDefined();
      expect(Array.isArray(data.time_off_requests)).toBe(true);
    });

    it('should filter by date range', async () => {
      const response = await fetch(
        `${API_URL}/api/time-off?start_date=2025-01-01&end_date=2025-12-31`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.time_off_requests).toBeDefined();
    });
  });

  describe('Authentication Errors', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token-12345',
        },
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('POST /api/time-off', () => {
  describe('Successful Creation', () => {
    it('should create a time-off entry with valid data', async () => {
      const timeOffData = {
        start_date: '2025-12-20',
        end_date: '2025-12-27',
        type: 'vacation',
        notes: 'Test vacation entry',
      };

      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(timeOffData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.time_off_request).toBeDefined();
      expect(data.time_off_request.id).toBeDefined();
      expect(data.time_off_request.start_date).toBe(timeOffData.start_date);
      expect(data.time_off_request.end_date).toBe(timeOffData.end_date);
      expect(data.time_off_request.type).toBe(timeOffData.type);
      expect(data.time_off_request.user_id).toBe(testUserId);

      // Track for cleanup
      createdTimeOffIds.push(data.time_off_request.id);
    });

    it('should create a single-day time-off entry', async () => {
      const timeOffData = {
        start_date: '2025-11-15',
        end_date: '2025-11-15',
        type: 'personal',
      };

      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(timeOffData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.time_off_request.start_date).toBe(data.time_off_request.end_date);

      createdTimeOffIds.push(data.time_off_request.id);
    });

    it('should allow all valid time-off types', async () => {
      const types = ['vacation', 'personal', 'sick', 'other'];

      for (const type of types) {
        const response = await fetch(`${API_URL}/api/time-off`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            start_date: `2025-10-0${types.indexOf(type) + 1}`,
            end_date: `2025-10-0${types.indexOf(type) + 1}`,
            type,
          }),
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.time_off_request.type).toBe(type);

        createdTimeOffIds.push(data.time_off_request.id);
      }
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing start_date', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          end_date: '2025-12-27',
          type: 'vacation',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('required');
    });

    it('should reject missing end_date', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-12-20',
          type: 'vacation',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject missing type', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-12-20',
          end_date: '2025-12-27',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject end_date before start_date', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-12-27',
          end_date: '2025-12-20',
          type: 'vacation',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('end_date');
    });

    it('should reject invalid type', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-12-20',
          end_date: '2025-12-27',
          type: 'invalid_type',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid type');
    });
  });

  describe('Overlap Validation', () => {
    let baseEntryId: string;

    beforeAll(async () => {
      // Create a base entry to test overlaps against
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-08-10',
          end_date: '2025-08-15',
          type: 'vacation',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        baseEntryId = data.time_off_request.id;
        createdTimeOffIds.push(baseEntryId);
      }
    });

    it('should reject overlapping entry (starts during existing)', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-08-12',
          end_date: '2025-08-20',
          type: 'personal',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('overlaps');
    });

    it('should reject overlapping entry (ends during existing)', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-08-05',
          end_date: '2025-08-12',
          type: 'personal',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('overlaps');
    });

    it('should reject overlapping entry (completely contained)', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-08-11',
          end_date: '2025-08-14',
          type: 'personal',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject overlapping entry (completely contains existing)', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-08-05',
          end_date: '2025-08-20',
          type: 'personal',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should allow non-overlapping entry (before)', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-08-01',
          end_date: '2025-08-05',
          type: 'personal',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      createdTimeOffIds.push(data.time_off_request.id);
    });

    it('should allow non-overlapping entry (after)', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-08-20',
          end_date: '2025-08-25',
          type: 'personal',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      createdTimeOffIds.push(data.time_off_request.id);
    });
  });

  describe('Authentication Errors', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${API_URL}/api/time-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: '2025-12-20',
          end_date: '2025-12-27',
          type: 'vacation',
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('PUT /api/time-off/:id', () => {
  let testEntryId: string;

  beforeAll(async () => {
    // Create an entry to update
    const response = await fetch(`${API_URL}/api/time-off`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        start_date: '2025-09-01',
        end_date: '2025-09-05',
        type: 'vacation',
        notes: 'Original notes',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      testEntryId = data.time_off_request.id;
      createdTimeOffIds.push(testEntryId);
    }
  });

  describe('Successful Updates', () => {
    it('should update dates', async () => {
      const response = await fetch(`${API_URL}/api/time-off/${testEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-09-02',
          end_date: '2025-09-06',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.time_off_request.start_date).toBe('2025-09-02');
      expect(data.time_off_request.end_date).toBe('2025-09-06');
    });

    it('should update type', async () => {
      const response = await fetch(`${API_URL}/api/time-off/${testEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: 'personal',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.time_off_request.type).toBe('personal');
    });

    it('should update notes', async () => {
      const response = await fetch(`${API_URL}/api/time-off/${testEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          notes: 'Updated notes',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.time_off_request.notes).toBe('Updated notes');
    });
  });

  describe('Validation Errors', () => {
    it('should reject end_date before start_date', async () => {
      const response = await fetch(`${API_URL}/api/time-off/${testEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          start_date: '2025-09-10',
          end_date: '2025-09-05',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject invalid type', async () => {
      const response = await fetch(`${API_URL}/api/time-off/${testEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: 'invalid',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Not Found', () => {
    it('should return 404 for non-existent entry', async () => {
      const response = await fetch(`${API_URL}/api/time-off/00000000-0000-0000-0000-000000000000`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          notes: 'Should not work',
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Authentication Errors', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${API_URL}/api/time-off/${testEntryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: 'Unauthorized update',
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('DELETE /api/time-off/:id', () => {
  let deleteTestId: string;

  beforeAll(async () => {
    // Create an entry to delete
    const response = await fetch(`${API_URL}/api/time-off`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        start_date: '2025-07-01',
        end_date: '2025-07-05',
        type: 'vacation',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      deleteTestId = data.time_off_request.id;
    }
  });

  describe('Successful Deletion', () => {
    it('should delete own entry', async () => {
      const response = await fetch(`${API_URL}/api/time-off/${deleteTestId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain('deleted');
    });

    it('should return 404 when trying to delete already deleted entry', async () => {
      const response = await fetch(`${API_URL}/api/time-off/${deleteTestId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Not Found', () => {
    it('should return 404 for non-existent entry', async () => {
      const response = await fetch(`${API_URL}/api/time-off/00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Authentication Errors', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${API_URL}/api/time-off/some-id`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });
  });
});
