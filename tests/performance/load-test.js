/**
 * Performance Load Tests using k6
 * Tests API performance under load
 *
 * Run with: k6 run load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 }, // Stay at 10 users
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 50 }, // Stay at 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 100 }, // Stay at 100 users
    { duration: '30s', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.1'], // Error rate < 10%
    errors: ['rate<0.1'], // Custom error rate < 10%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Auth token (in real scenario, each VU would login)
let authToken = null;

export function setup() {
  // Login to get token
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'gianluca.semeraro@thomsonreuters.com',
      password: 'changeme',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const token = JSON.parse(loginRes.body).access_token;
  return { token };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // Test 1: Get dashboard stats
  const statsRes = http.get(`${BASE_URL}/api/dashboard/stats`, { headers });
  check(statsRes, {
    'stats status is 200': (r) => r.status === 200,
    'stats response time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: List employees
  const employeesRes = http.get(`${BASE_URL}/api/employees`, { headers });
  check(employeesRes, {
    'employees status is 200': (r) => r.status === 200,
    'employees response time < 200ms': (r) => r.timings.duration < 200,
    'employees returned data': (r) => JSON.parse(r.body).employees.length > 0,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: List shifts
  const shiftsRes = http.get(`${BASE_URL}/api/shifts`, { headers });
  check(shiftsRes, {
    'shifts status is 200': (r) => r.status === 200,
    'shifts response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: List conflicts
  const conflictsRes = http.get(`${BASE_URL}/api/conflicts`, { headers });
  check(conflictsRes, {
    'conflicts status is 200': (r) => r.status === 200,
    'conflicts response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(2);
}

export function teardown(data) {
  // Logout
  http.post(`${BASE_URL}/api/auth/logout`, null, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
}
