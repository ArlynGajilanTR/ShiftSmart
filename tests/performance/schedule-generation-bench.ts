/**
 * Schedule Generation Performance Benchmarks
 * Measure and track performance of key operations
 */

import { performance } from 'perf_hooks';
import { parseScheduleResponse } from '@/lib/ai/scheduler-agent';
import {
  createValidSchedule,
  createTruncatedSchedule,
  createMarkdownWrappedSchedule,
} from '../helpers/schedule-factory';
import * as fs from 'fs';
import * as path from 'path';

interface BenchmarkResult {
  name: string;
  operations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  memoryUsed: number;
}

interface PerformanceBaseline {
  date: string;
  results: BenchmarkResult[];
  environment: {
    node: string;
    platform: string;
    arch: string;
    memory: number;
  };
}

class ScheduleBenchmark {
  private results: BenchmarkResult[] = [];

  /**
   * Run a benchmark
   */
  async runBenchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations = 100
  ): Promise<BenchmarkResult> {
    console.log(`Running benchmark: ${name}`);

    const times: number[] = [];
    const startMemory = process.memoryUsage().heapUsed;

    // Warmup
    for (let i = 0; i < 10; i++) {
      await fn();
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);

      // Progress indicator
      if (i % 10 === 0) {
        process.stdout.write('.');
      }
    }
    process.stdout.write('\n');

    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsed = endMemory - startMemory;

    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const result: BenchmarkResult = {
      name,
      operations: iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      memoryUsed,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Print results table
   */
  printResults() {
    console.log('\n=== Performance Benchmark Results ===\n');
    console.log(
      'Operation                          | Avg (ms) | Min (ms) | Max (ms) | Memory (MB)'
    );
    console.log(
      '-----------------------------------|----------|----------|----------|------------'
    );

    this.results.forEach((result) => {
      const name = result.name.padEnd(34);
      const avg = result.avgTime.toFixed(3).padStart(8);
      const min = result.minTime.toFixed(3).padStart(8);
      const max = result.maxTime.toFixed(3).padStart(8);
      const mem = (result.memoryUsed / 1024 / 1024).toFixed(2).padStart(10);

      console.log(`${name} | ${avg} | ${min} | ${max} | ${mem}`);
    });
  }

  /**
   * Save results to baseline file
   */
  saveBaseline(filename: string) {
    const baseline: PerformanceBaseline = {
      date: new Date().toISOString(),
      results: this.results,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: require('os').totalmem(),
      },
    };

    const baselineDir = path.join(__dirname, 'baselines');
    if (!fs.existsSync(baselineDir)) {
      fs.mkdirSync(baselineDir, { recursive: true });
    }

    const filepath = path.join(baselineDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(baseline, null, 2));
    console.log(`\nBaseline saved to: ${filepath}`);
  }

  /**
   * Compare with previous baseline
   */
  compareWithBaseline(baselineFile: string) {
    const filepath = path.join(__dirname, 'baselines', baselineFile);
    if (!fs.existsSync(filepath)) {
      console.log('\nNo baseline found for comparison');
      return;
    }

    const baseline: PerformanceBaseline = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    console.log('\n=== Performance Comparison ===\n');
    console.log('Operation                          | Current  | Baseline | Change');
    console.log('-----------------------------------|----------|----------|--------');

    this.results.forEach((current) => {
      const prev = baseline.results.find((r) => r.name === current.name);
      if (!prev) return;

      const name = current.name.padEnd(34);
      const currAvg = current.avgTime.toFixed(3).padStart(8);
      const prevAvg = prev.avgTime.toFixed(3).padStart(8);
      const change = (((current.avgTime - prev.avgTime) / prev.avgTime) * 100).toFixed(1);
      const changeStr = change.startsWith('-') ? `${change}%` : `+${change}%`;

      console.log(`${name} | ${currAvg} | ${prevAvg} | ${changeStr.padStart(7)}`);
    });
  }
}

// Benchmark functions
const benchmarks = {
  /**
   * Parse small valid schedule
   */
  parseSmallSchedule: () => {
    const schedule = createValidSchedule({ shifts: 10 });
    const json = JSON.stringify(schedule);
    parseScheduleResponse(json);
  },

  /**
   * Parse large valid schedule
   */
  parseLargeSchedule: () => {
    const schedule = createValidSchedule({ shifts: 200 });
    const json = JSON.stringify(schedule);
    parseScheduleResponse(json);
  },

  /**
   * Parse markdown wrapped schedule
   */
  parseMarkdownSchedule: () => {
    const wrapped = createMarkdownWrappedSchedule();
    parseScheduleResponse(wrapped);
  },

  /**
   * Parse truncated schedule (failure case)
   */
  parseTruncatedSchedule: () => {
    const truncated = createTruncatedSchedule({ chars: 5000 });
    try {
      parseScheduleResponse(truncated);
    } catch {
      // Expected to fail
    }
  },

  /**
   * Generate schedule factory - small
   */
  generateSmallSchedule: () => {
    createValidSchedule({ shifts: 20, bureau: 'Milan' });
  },

  /**
   * Generate schedule factory - large
   */
  generateLargeSchedule: () => {
    createValidSchedule({ shifts: 500, bureau: 'both', includeWeekends: true });
  },

  /**
   * JSON stringify performance - small
   */
  stringifySmallSchedule: () => {
    const schedule = createValidSchedule({ shifts: 20 });
    JSON.stringify(schedule);
  },

  /**
   * JSON stringify performance - large
   */
  stringifyLargeSchedule: () => {
    const schedule = createValidSchedule({ shifts: 500 });
    JSON.stringify(schedule);
  },

  /**
   * JSON parse performance - small
   */
  parseSmallJson: () => {
    const schedule = createValidSchedule({ shifts: 20 });
    const json = JSON.stringify(schedule);
    JSON.parse(json);
  },

  /**
   * JSON parse performance - large
   */
  parseLargeJson: () => {
    const schedule = createValidSchedule({ shifts: 500 });
    const json = JSON.stringify(schedule);
    JSON.parse(json);
  },
};

/**
 * Run all benchmarks
 */
export async function runAllBenchmarks(saveBaseline = false): Promise<void> {
  const bench = new ScheduleBenchmark();

  console.log('Starting performance benchmarks...\n');

  // Run parsing benchmarks
  await bench.runBenchmark('Parse Small Schedule (10 shifts)', benchmarks.parseSmallSchedule);
  await bench.runBenchmark('Parse Large Schedule (200 shifts)', benchmarks.parseLargeSchedule);
  await bench.runBenchmark('Parse Markdown Wrapped', benchmarks.parseMarkdownSchedule);
  await bench.runBenchmark('Parse Truncated (failure)', benchmarks.parseTruncatedSchedule, 50);

  // Run generation benchmarks
  await bench.runBenchmark('Generate Small Schedule', benchmarks.generateSmallSchedule);
  await bench.runBenchmark('Generate Large Schedule', benchmarks.generateLargeSchedule, 50);

  // Run JSON benchmarks
  await bench.runBenchmark('JSON Stringify Small', benchmarks.stringifySmallSchedule);
  await bench.runBenchmark('JSON Stringify Large', benchmarks.stringifyLargeSchedule, 50);
  await bench.runBenchmark('JSON Parse Small', benchmarks.parseSmallJson);
  await bench.runBenchmark('JSON Parse Large', benchmarks.parseLargeJson, 50);

  // Print results
  bench.printResults();

  // Compare with baseline
  bench.compareWithBaseline('schedule-generation.baseline.json');

  // Save new baseline if requested
  if (saveBaseline) {
    bench.saveBaseline('schedule-generation.baseline.json');
  }

  // Performance assertions
  console.log('\n=== Performance Assertions ===\n');

  const smallParseResult = bench.results.find((r) => r.name.includes('Parse Small Schedule'));
  const largeParseResult = bench.results.find((r) => r.name.includes('Parse Large Schedule'));

  if (smallParseResult && smallParseResult.avgTime > 1) {
    console.log('⚠️  WARNING: Small schedule parsing exceeds 1ms threshold');
  } else {
    console.log('✅ Small schedule parsing within threshold');
  }

  if (largeParseResult && largeParseResult.avgTime > 10) {
    console.log('⚠️  WARNING: Large schedule parsing exceeds 10ms threshold');
  } else {
    console.log('✅ Large schedule parsing within threshold');
  }
}

// CLI execution
if (require.main === module) {
  const saveBaseline = process.argv.includes('--save-baseline');
  runAllBenchmarks(saveBaseline).catch(console.error);
}
