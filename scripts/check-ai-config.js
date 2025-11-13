#!/usr/bin/env node

/**
 * AI Configuration Checker
 *
 * Run this script to verify your AI setup is correct:
 * node scripts/check-ai-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking AI Configuration...\n');

let hasErrors = false;
let hasWarnings = false;

// Load .env.local file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return envVars;
}

const envVars = loadEnvFile();

// Check 1: .env.local file exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('   Create .env.local in the project root\n');
  hasErrors = true;
} else {
  console.log('✅ .env.local file exists');
}

// Check 2: ANTHROPIC_API_KEY is set
const apiKey = envVars.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.log('❌ ANTHROPIC_API_KEY not set');
  console.log('   Add ANTHROPIC_API_KEY=sk-ant-... to .env.local\n');
  hasErrors = true;
} else {
  console.log('✅ ANTHROPIC_API_KEY is set');

  // Check 3: API key format
  if (!apiKey.startsWith('sk-ant-')) {
    console.log('⚠️  API key format may be incorrect (should start with sk-ant-)');
    hasWarnings = true;
  } else {
    console.log('✅ API key format looks correct');
  }

  // Check 4: API key length
  if (apiKey.length < 50) {
    console.log('⚠️  API key seems too short');
    hasWarnings = true;
  } else {
    console.log('✅ API key length looks good');
  }
}

// Check 5: Supabase configuration
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_URL not set');
  hasWarnings = true;
} else {
  console.log('✅ Supabase URL is configured');
}

if (!supabaseKey) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
  hasWarnings = true;
} else {
  console.log('✅ Supabase anon key is configured');
}

// Final summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ CONFIGURATION INCOMPLETE');
  console.log('\nAI features will NOT work until errors are fixed.');
  console.log('See AI_SETUP_TROUBLESHOOTING.md for detailed instructions.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  CONFIGURATION HAS WARNINGS');
  console.log('\nAI features may work, but please review warnings above.');
  console.log('See AI_SETUP_TROUBLESHOOTING.md for detailed instructions.\n');
  process.exit(0);
} else {
  console.log('✅ CONFIGURATION LOOKS GOOD!');
  console.log('\nNext steps:');
  console.log('1. Restart your development server (npm run dev)');
  console.log('2. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+F5)');
  console.log('3. Log in and navigate to Schedule Management');
  console.log('4. Click "Generate Schedule" to test AI features\n');
  process.exit(0);
}
