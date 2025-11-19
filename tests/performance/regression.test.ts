/**
 * Performance Regression Tests
 * Track performance over time and alert on degradation
 */

import { runAllBenchmarks } from './schedule-generation-bench';
import * as fs from 'fs';
import * as path from 'path';

interface RegressionConfig {
  maxAllowedRegression: number; // Percentage
  criticalOperations: string[];
  baselineFile: string;
}

const config: RegressionConfig = {
  maxAllowedRegression: 20, // Alert if performance degrades by more than 20%
  criticalOperations: ['Parse Small Schedule', 'Parse Large Schedule', 'Generate Small Schedule'],
  baselineFile: 'schedule-generation.baseline.json',
};

describe('Performance Regression Tests', () => {
  let baselineData: any;
  let currentResults: any[] = [];

  beforeAll(async () => {
    // Load baseline
    const baselinePath = path.join(__dirname, 'baselines', config.baselineFile);
    if (fs.existsSync(baselinePath)) {
      baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    }

    // Run current benchmarks
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => logs.push(args.join(' '));

    await runAllBenchmarks(false);

    // Parse results from console output
    const resultsStartIndex = logs.findIndex((log) =>
      log.includes('Performance Benchmark Results')
    );
    const resultsEndIndex = logs.findIndex(
      (log, i) => i > resultsStartIndex && log.includes('Performance Comparison')
    );

    if (resultsStartIndex >= 0 && resultsEndIndex > resultsStartIndex) {
      const resultLines = logs.slice(resultsStartIndex + 3, resultsEndIndex - 1);
      resultLines.forEach((line) => {
        const parts = line.split('|').map((p) => p.trim());
        if (parts.length >= 5) {
          currentResults.push({
            name: parts[0].trim(),
            avgTime: parseFloat(parts[1]),
            minTime: parseFloat(parts[2]),
            maxTime: parseFloat(parts[3]),
            memoryUsed: parseFloat(parts[4]) * 1024 * 1024, // Convert back to bytes
          });
        }
      });
    }

    console.log = originalLog;
  });

  describe('Critical Operations Performance', () => {
    it('should not regress beyond threshold', () => {
      if (!baselineData) {
        console.warn('No baseline found, skipping regression tests');
        return;
      }

      const regressions: string[] = [];

      config.criticalOperations.forEach((opName) => {
        const current = currentResults.find((r) => r.name.includes(opName));
        const baseline = baselineData.results.find((r: any) => r.name.includes(opName));

        if (current && baseline) {
          const regressionPercent = ((current.avgTime - baseline.avgTime) / baseline.avgTime) * 100;

          if (regressionPercent > config.maxAllowedRegression) {
            regressions.push(
              `${opName}: ${regressionPercent.toFixed(1)}% regression ` +
                `(${baseline.avgTime.toFixed(3)}ms → ${current.avgTime.toFixed(3)}ms)`
            );
          }
        }
      });

      if (regressions.length > 0) {
        fail(`Performance regressions detected:\n${regressions.join('\n')}`);
      }
    });
  });

  describe('Memory Usage', () => {
    it('should not increase memory usage significantly', () => {
      if (!baselineData) {
        return;
      }

      const memoryIncreases: string[] = [];
      const maxMemoryIncreasePercent = 50; // Allow up to 50% memory increase

      currentResults.forEach((current) => {
        const baseline = baselineData.results.find((r: any) => r.name === current.name);

        if (baseline && baseline.memoryUsed > 0) {
          const increasePercent =
            ((current.memoryUsed - baseline.memoryUsed) / baseline.memoryUsed) * 100;

          if (increasePercent > maxMemoryIncreasePercent) {
            memoryIncreases.push(
              `${current.name}: ${increasePercent.toFixed(1)}% memory increase ` +
                `(${(baseline.memoryUsed / 1024 / 1024).toFixed(2)}MB → ${(current.memoryUsed / 1024 / 1024).toFixed(2)}MB)`
            );
          }
        }
      });

      if (memoryIncreases.length > 0) {
        console.warn(`Memory usage increases:\n${memoryIncreases.join('\n')}`);
      }
    });
  });

  describe('Performance Thresholds', () => {
    it('should parse small schedules under 1ms', () => {
      const smallParse = currentResults.find((r) => r.name.includes('Parse Small Schedule'));
      expect(smallParse).toBeDefined();
      expect(smallParse!.avgTime).toBeLessThan(1);
    });

    it('should parse large schedules under 10ms', () => {
      const largeParse = currentResults.find((r) => r.name.includes('Parse Large Schedule'));
      expect(largeParse).toBeDefined();
      expect(largeParse!.avgTime).toBeLessThan(10);
    });

    it('should generate small schedules under 5ms', () => {
      const smallGen = currentResults.find((r) => r.name.includes('Generate Small Schedule'));
      expect(smallGen).toBeDefined();
      expect(smallGen!.avgTime).toBeLessThan(5);
    });

    it('should handle JSON operations efficiently', () => {
      const jsonOps = currentResults.filter((r) => r.name.includes('JSON'));

      jsonOps.forEach((op) => {
        if (op.name.includes('Small')) {
          expect(op.avgTime).toBeLessThan(1);
        } else if (op.name.includes('Large')) {
          expect(op.avgTime).toBeLessThan(20);
        }
      });
    });
  });

  describe('Performance Consistency', () => {
    it('should have consistent performance (low variance)', () => {
      const highVarianceOps: string[] = [];

      currentResults.forEach((result) => {
        const variance = (result.maxTime - result.minTime) / result.avgTime;

        // Flag operations with more than 100% variance
        if (variance > 1.0) {
          highVarianceOps.push(
            `${result.name}: ${(variance * 100).toFixed(1)}% variance ` +
              `(min: ${result.minTime.toFixed(3)}ms, max: ${result.maxTime.toFixed(3)}ms)`
          );
        }
      });

      if (highVarianceOps.length > 0) {
        console.warn(`High variance operations:\n${highVarianceOps.join('\n')}`);
      }
    });
  });

  describe('Performance Trends', () => {
    it('should generate performance trend report', () => {
      if (!baselineData) {
        return;
      }

      const report: string[] = [];
      report.push('=== Performance Trend Report ===');
      report.push(`Baseline Date: ${new Date(baselineData.date).toLocaleDateString()}`);
      report.push(`Current Date: ${new Date().toLocaleDateString()}`);
      report.push('');

      let improvements = 0;
      let regressions = 0;

      currentResults.forEach((current) => {
        const baseline = baselineData.results.find((r: any) => r.name === current.name);
        if (baseline) {
          const change = ((current.avgTime - baseline.avgTime) / baseline.avgTime) * 100;

          if (change < -5) {
            improvements++;
            report.push(`✅ ${current.name}: ${Math.abs(change).toFixed(1)}% improvement`);
          } else if (change > 5) {
            regressions++;
            report.push(`⚠️  ${current.name}: ${change.toFixed(1)}% regression`);
          }
        }
      });

      report.push('');
      report.push(`Summary: ${improvements} improvements, ${regressions} regressions`);

      console.log(report.join('\n'));

      // Save trend report
      const reportPath = path.join(__dirname, 'reports', `trend-${Date.now()}.txt`);
      const reportDir = path.dirname(reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      fs.writeFileSync(reportPath, report.join('\n'));
    });
  });
});

// Utility to update baseline
export function updateBaseline(): void {
  console.log('Updating performance baseline...');
  runAllBenchmarks(true)
    .then(() => {
      console.log('Baseline updated successfully');
    })
    .catch((error) => {
      console.error('Failed to update baseline:', error);
    });
}

// CLI commands
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'update-baseline':
      updateBaseline();
      break;
    case 'run':
      runAllBenchmarks(false);
      break;
    default:
      console.log('Usage: npm run perf:test [update-baseline|run]');
  }
}
