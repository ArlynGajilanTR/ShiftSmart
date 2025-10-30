import { test, expect } from '@playwright/test';

test.describe('ShiftSmart API Integration', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Get auth token for API tests
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'gianluca.semeraro@thomsonreuters.com',
        password: 'changeme'
      }
    });
    
    const data = await response.json();
    authToken = data.token;
  });

  test('should fetch employees from API', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.employees).toBeDefined();
    expect(data.employees.length).toBe(15);
  });

  test('should filter employees by bureau', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/employees?bureau=Milan`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Milan has 8 Breaking News staff
    expect(data.employees.length).toBe(8);
    
    // All should be from Milan
    data.employees.forEach((emp: any) => {
      expect(emp.bureau).toBe('Milan');
    });
  });

  test('should fetch dashboard stats', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.stats.totalEmployees).toBe(15);
  });

  test('should fetch upcoming shifts', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/shifts/upcoming?days=7`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.shifts).toBeDefined();
    expect(Array.isArray(data.shifts)).toBeTruthy();
  });

  test('should fetch conflicts', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/conflicts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.conflicts).toBeDefined();
    expect(Array.isArray(data.conflicts)).toBeTruthy();
  });

  test('should reject unauthenticated requests', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/employees`);
    expect(response.status()).toBe(401);
  });

  test('should reject invalid tokens', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/employees`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345'
      }
    });
    expect(response.status()).toBe(401);
  });
});

