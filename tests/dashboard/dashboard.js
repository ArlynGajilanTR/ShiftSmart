// ShiftSmart QA Dashboard JavaScript

// Mock data for demonstration (in production, this would come from API/artifacts)
const mockData = {
  lastUpdated: new Date().toLocaleString(),
  overview: {
    total: 332,
    passing: 325,
    failing: 7,
    coverage: 87.5,
  },
  categories: {
    unit: { pass: 150, total: 152 },
    integration: { pass: 48, total: 50 },
    e2e: { pass: 95, total: 98 },
    ai: { pass: 32, total: 32 },
  },
  performance: {
    labels: [
      'Parse Small',
      'Parse Large',
      'Generate Small',
      'Generate Large',
      'JSON Parse',
      'JSON Stringify',
    ],
    current: [0.8, 8.5, 3.2, 15.6, 0.5, 0.7],
    baseline: [0.7, 7.8, 3.0, 14.2, 0.5, 0.6],
  },
  coverage: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    values: [82.5, 84.0, 86.2, 87.5],
  },
  aiInsights: {
    avgResponseTime: 17200,
    avgTokens: 3500,
    parseSuccess: 94.5,
    retryRate: 12.3,
  },
  failures: [
    {
      category: 'Unit Tests',
      name: 'parseScheduleResponse > should handle truncated JSON',
      error: 'Expected null to be defined',
      timestamp: new Date(Date.now() - 3600000).toLocaleString(),
    },
    {
      category: 'Integration Tests',
      name: 'Schedule Generation > should handle database errors',
      error: 'Connection timeout after 30s',
      timestamp: new Date(Date.now() - 7200000).toLocaleString(),
    },
  ],
  benchmarks: [
    { name: 'Parse Small Schedule', avg: 0.8, min: 0.5, max: 1.2, trend: 'up' },
    { name: 'Parse Large Schedule', avg: 8.5, min: 7.2, max: 12.1, trend: 'stable' },
    { name: 'Generate Small Schedule', avg: 3.2, min: 2.8, max: 4.1, trend: 'down' },
    { name: 'JSON Parse Large', avg: 15.6, min: 14.0, max: 18.2, trend: 'up' },
  ],
};

// Update overview stats
function updateOverview() {
  document.getElementById('lastUpdated').textContent = mockData.lastUpdated;
  document.getElementById('totalTests').textContent = mockData.overview.total;
  document.getElementById('passingTests').textContent = mockData.overview.passing;
  document.getElementById('failingTests').textContent = mockData.overview.failing;
  document.getElementById('coverage').textContent = mockData.overview.coverage + '%';
}

// Update test results
function updateTestResults() {
  Object.entries(mockData.categories).forEach(([category, data]) => {
    const card = document.querySelector(`.${category}-progress`).closest('.result-card');
    const progressBar = card.querySelector('.progress-fill');
    const passCount = card.querySelector('.pass-count');
    const totalCount = card.querySelector('.total-count');

    const percentage = (data.pass / data.total) * 100;
    progressBar.style.width = percentage + '%';
    passCount.textContent = data.pass;
    totalCount.textContent = data.total;
  });
}

// Create performance chart
function createPerformanceChart() {
  const ctx = document.getElementById('performanceChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: mockData.performance.labels,
      datasets: [
        {
          label: 'Current',
          data: mockData.performance.current,
          borderColor: '#0066cc',
          backgroundColor: 'rgba(0, 102, 204, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Baseline',
          data: mockData.performance.baseline,
          borderColor: '#999999',
          backgroundColor: 'rgba(153, 153, 153, 0.1)',
          borderDash: [5, 5],
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Operation Performance (ms)',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Time (ms)',
          },
        },
      },
    },
  });
}

// Create coverage trend chart
function createCoverageChart() {
  const ctx = document.getElementById('coverageChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: mockData.coverage.labels,
      datasets: [
        {
          label: 'Code Coverage %',
          data: mockData.coverage.values,
          borderColor: '#00aa00',
          backgroundColor: 'rgba(0, 170, 0, 0.1)',
          tension: 0.1,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 80,
          max: 100,
          title: {
            display: true,
            text: 'Coverage %',
          },
        },
      },
    },
  });
}

// Update benchmark table
function updateBenchmarkTable() {
  const tbody = document.getElementById('benchmarkTableBody');
  tbody.innerHTML = '';

  mockData.benchmarks.forEach((benchmark) => {
    const row = document.createElement('tr');

    const trendClass = `trend-${benchmark.trend}`;
    const trendIcon = benchmark.trend === 'up' ? '↑' : benchmark.trend === 'down' ? '↓' : '→';

    row.innerHTML = `
            <td>${benchmark.name}</td>
            <td>${benchmark.avg.toFixed(2)}</td>
            <td>${benchmark.min.toFixed(2)}</td>
            <td>${benchmark.max.toFixed(2)}</td>
            <td class="${trendClass}">${trendIcon} ${benchmark.trend}</td>
        `;

    tbody.appendChild(row);
  });
}

// Update AI insights
function updateAIInsights() {
  document.getElementById('avgResponseTime').textContent =
    (mockData.aiInsights.avgResponseTime / 1000).toFixed(1) + 's';
  document.getElementById('avgTokens').textContent = mockData.aiInsights.avgTokens.toLocaleString();
  document.getElementById('parseSuccess').textContent = mockData.aiInsights.parseSuccess + '%';
  document.getElementById('retryRate').textContent = mockData.aiInsights.retryRate + '%';
}

// Update failures list
function updateFailures() {
  const failuresList = document.getElementById('failuresList');

  if (mockData.failures.length === 0) {
    failuresList.innerHTML = '<p style="text-align: center; color: #666;">No recent failures</p>';
    return;
  }

  failuresList.innerHTML = mockData.failures
    .map(
      (failure) => `
        <div class="failure-item">
            <h4>${failure.category}</h4>
            <div class="test-name">${failure.name}</div>
            <div class="error-message">${failure.error}</div>
            <div class="timestamp">${failure.timestamp}</div>
        </div>
    `
    )
    .join('');
}

// Load data from API/artifacts (placeholder)
async function loadData() {
  // In production, this would fetch from:
  // - GitHub Actions artifacts API
  // - S3 bucket with test results
  // - Database with historical data

  // For now, using mock data
  return mockData;
}

// Refresh data periodically
function startAutoRefresh() {
  setInterval(async () => {
    // Re-load and update all components
    const data = await loadData();
    updateOverview();
    updateTestResults();
    updateAIInsights();
    updateFailures();
  }, 60000); // Refresh every minute
}

// Initialize dashboard
async function initDashboard() {
  // Load initial data
  const data = await loadData();

  // Update all components
  updateOverview();
  updateTestResults();
  createPerformanceChart();
  createCoverageChart();
  updateBenchmarkTable();
  updateAIInsights();
  updateFailures();

  // Start auto-refresh
  startAutoRefresh();
}

// Run on page load
document.addEventListener('DOMContentLoaded', initDashboard);
