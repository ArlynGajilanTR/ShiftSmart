#!/usr/bin/env node

/**
 * Diagnostic script to identify issues with generate schedule feature
 * Run with: node scripts/diagnose-generate-schedule.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Generate Schedule Feature\n');
console.log('=' .repeat(60));

// Check 1: Environment variables
console.log('\n1️⃣  Checking Environment Variables...');
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasAnthropicKey = envContent.includes('ANTHROPIC_API_KEY=sk-ant-');
    const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
    const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    console.log(`   ✅ .env.local exists`);
    console.log(`   ${hasAnthropicKey ? '✅' : '❌'} ANTHROPIC_API_KEY is set`);
    console.log(`   ${hasSupabaseUrl ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_URL is set`);
    console.log(`   ${hasSupabaseKey ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_ANON_KEY is set`);
    
    if (!hasAnthropicKey) {
      console.log('   ⚠️  WARNING: ANTHROPIC_API_KEY not found or not properly formatted');
    }
  } else {
    console.log('   ❌ .env.local not found!');
    console.log('   💡 Run: cp .env.example .env.local');
  }
} catch (error) {
  console.log(`   ❌ Error reading .env.local: ${error.message}`);
}

// Check 2: Core files exist
console.log('\n2️⃣  Checking Core Files...');
const coreFiles = [
  'lib/ai/scheduler-agent.ts',
  'lib/ai/client.ts',
  'lib/ai/prompts/schedule-generation.ts',
  'app/api/ai/generate-schedule/route.ts',
  'app/api/ai/status/route.ts',
];

coreFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check 3: Test files exist
console.log('\n3️⃣  Checking Test Files...');
const testFiles = [
  'tests/unit/lib/ai/getShiftType.test.ts',
  'tests/unit/lib/ai/parseScheduleResponse.test.ts',
  'tests/unit/lib/ai/scheduler-agent.test.ts',
];

testFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check 4: Package dependencies
console.log('\n4️⃣  Checking Dependencies...');
try {
  const packageJson = require('../package.json');
  const deps = packageJson.dependencies || {};
  
  const requiredDeps = {
    '@anthropic-ai/sdk': deps['@anthropic-ai/sdk'],
    'date-fns': deps['date-fns'],
    '@supabase/supabase-js': deps['@supabase/supabase-js'],
  };
  
  Object.entries(requiredDeps).forEach(([name, version]) => {
    console.log(`   ${version ? '✅' : '❌'} ${name}${version ? ` (${version})` : ''}`);
  });
} catch (error) {
  console.log(`   ❌ Error reading package.json: ${error.message}`);
}

// Check 5: Code structure validation
console.log('\n5️⃣  Checking Code Structure...');
try {
  const schedulerAgent = fs.readFileSync(
    path.join(__dirname, '..', 'lib/ai/scheduler-agent.ts'),
    'utf8'
  );
  
  const checks = {
    'generateSchedule export': schedulerAgent.includes('export async function generateSchedule'),
    'saveSchedule export': schedulerAgent.includes('export async function saveSchedule'),
    'getShiftType function': schedulerAgent.includes('function getShiftType'),
    'parseScheduleResponse function': schedulerAgent.includes('function parseScheduleResponse'),
    'Night shift fix': schedulerAgent.includes('return \'Night\'; // 00:00 - 07:59'),
    'Midnight crossing fix': schedulerAgent.includes('// Issue #7: Handle shifts ending at midnight'),
    'Timezone handling': schedulerAgent.includes('+01:00'),
    'Shift count validation': schedulerAgent.includes('// 8. Validate shift count'),
  };
  
  Object.entries(checks).forEach(([name, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${name}`);
  });
} catch (error) {
  console.log(`   ❌ Error reading scheduler-agent.ts: ${error.message}`);
}

// Check 6: API Route structure
console.log('\n6️⃣  Checking API Route...');
try {
  const apiRoute = fs.readFileSync(
    path.join(__dirname, '..', 'app/api/ai/generate-schedule/route.ts'),
    'utf8'
  );
  
  const checks = {
    'POST handler': apiRoute.includes('export async function POST'),
    'Authentication check': apiRoute.includes('verifyAuth'),
    'generateSchedule import': apiRoute.includes('import { generateSchedule'),
    'Returns schedule object': apiRoute.includes('schedule: result.data'),
  };
  
  Object.entries(checks).forEach(([name, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${name}`);
  });
} catch (error) {
  console.log(`   ❌ Error reading API route: ${error.message}`);
}

// Check 7: Frontend integration
console.log('\n7️⃣  Checking Frontend Integration...');
try {
  const schedulePage = fs.readFileSync(
    path.join(__dirname, '..', 'app/dashboard/schedule/page.tsx'),
    'utf8'
  );
  
  const checks = {
    'handleGenerateSchedule function': schedulePage.includes('const handleGenerateSchedule'),
    'AI status check': schedulePage.includes('api.ai.checkStatus()'),
    'Calls generateSchedule API': schedulePage.includes('api.ai.generateSchedule'),
    'Response validation': schedulePage.includes('response.schedule.shifts'),
    'Error handling': schedulePage.includes('catch (error'),
  };
  
  Object.entries(checks).forEach(([name, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${name}`);
  });
} catch (error) {
  console.log(`   ❌ Error reading schedule page: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📋 SUMMARY\n');
console.log('If all checks pass above, the code structure is correct.');
console.log('If the feature still isn\'t working, check:\n');
console.log('1. 🔍 Browser console (F12) for JavaScript errors');
console.log('2. 🔍 Server logs for backend errors');
console.log('3. 🔍 Network tab to see API request/response');
console.log('4. 🔍 Database - run: npm run test:database');
console.log('5. 🔍 AI status - curl http://localhost:3000/api/ai/status');
console.log('\n💡 Next steps:');
console.log('   • Start dev server: npm run dev');
console.log('   • Open browser: http://localhost:3000');
console.log('   • Open DevTools console (F12)');
console.log('   • Navigate to Schedule Management');
console.log('   • Click "Generate Schedule" and watch console');
console.log('\n' + '='.repeat(60) + '\n');

