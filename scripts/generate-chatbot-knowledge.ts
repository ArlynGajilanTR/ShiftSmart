#!/usr/bin/env npx ts-node
/**
 * CLI Script: Generate Chatbot Knowledge Base
 *
 * Reads documentation files and generates the chatbot knowledge module.
 *
 * Usage:
 *   npx ts-node scripts/generate-chatbot-knowledge.ts
 *   npm run generate:chatbot-knowledge
 *
 * Options:
 *   --dry-run    Preview output without writing file
 *   --verbose    Show detailed progress
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  generateKnowledgeBase,
  generateTypeScriptOutput,
  KnowledgeGeneratorConfig,
  DocumentInputs,
} from '../lib/ai/knowledge-generator';

// ===========================================
// Configuration
// ===========================================

const CONFIG: KnowledgeGeneratorConfig = {
  userWorkflowsPath: 'docs/USER_WORKFLOWS.md',
  testerGuidePath: 'docs/TESTER_HANDOFF_GUIDE.md',
  readmePath: 'README.md',
  maxLength: 15000, // Keep under Claude's optimal context window
};

const OUTPUT_PATH = 'lib/ai/generated-knowledge.ts';

// ===========================================
// Main
// ===========================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('🤖 ShiftSmart Chatbot Knowledge Generator\n');

  // Read source documents
  const projectRoot = path.resolve(__dirname, '..');
  const docs: DocumentInputs = {
    userWorkflows: '',
    testerGuide: '',
    readme: '',
  };

  // Read USER_WORKFLOWS.md
  const workflowsPath = path.join(projectRoot, CONFIG.userWorkflowsPath);
  if (fs.existsSync(workflowsPath)) {
    docs.userWorkflows = fs.readFileSync(workflowsPath, 'utf-8');
    console.log(`✅ Read ${CONFIG.userWorkflowsPath} (${docs.userWorkflows.length} chars)`);
  } else {
    console.log(`⚠️  ${CONFIG.userWorkflowsPath} not found, skipping`);
  }

  // Read TESTER_HANDOFF_GUIDE.md
  const testerPath = path.join(projectRoot, CONFIG.testerGuidePath);
  if (fs.existsSync(testerPath)) {
    docs.testerGuide = fs.readFileSync(testerPath, 'utf-8');
    console.log(`✅ Read ${CONFIG.testerGuidePath} (${docs.testerGuide.length} chars)`);
  } else {
    console.log(`⚠️  ${CONFIG.testerGuidePath} not found, skipping`);
  }

  // Read README.md
  const readmePath = path.join(projectRoot, CONFIG.readmePath);
  if (fs.existsSync(readmePath)) {
    docs.readme = fs.readFileSync(readmePath, 'utf-8');
    console.log(`✅ Read ${CONFIG.readmePath} (${docs.readme.length} chars)`);
  } else {
    console.error(`❌ ${CONFIG.readmePath} not found - required for version`);
    process.exit(1);
  }

  console.log('');

  // Generate knowledge base
  console.log('📝 Generating knowledge base...');
  const knowledge = generateKnowledgeBase(docs, CONFIG);

  console.log(`   Version: ${knowledge.version}`);
  console.log(`   Content length: ${knowledge.content.length} chars`);
  console.log(`   Sources: ${knowledge.sources.join(', ')}`);
  console.log(`   Truncated: ${knowledge.truncated}`);
  console.log('');

  // Generate TypeScript output
  const tsOutput = generateTypeScriptOutput(knowledge);

  if (verbose) {
    console.log('--- Generated Content Preview ---');
    console.log(knowledge.content.slice(0, 500) + '...\n');
    console.log('---------------------------------\n');
  }

  // Write or preview
  if (dryRun) {
    console.log('🔍 DRY RUN - Not writing file');
    console.log(`   Would write to: ${OUTPUT_PATH}`);
    console.log(`   Output size: ${tsOutput.length} chars`);
  } else {
    const outputFullPath = path.join(projectRoot, OUTPUT_PATH);
    fs.writeFileSync(outputFullPath, tsOutput, 'utf-8');
    console.log(`✅ Written to ${OUTPUT_PATH}`);
    console.log(`   Output size: ${tsOutput.length} chars`);
  }

  console.log('\n🎉 Done!');

  // Reminder
  if (!dryRun) {
    console.log('\n📋 Next steps:');
    console.log('   1. Review the generated file: lib/ai/generated-knowledge.ts');
    console.log('   2. Update chatbot route to import from generated-knowledge.ts');
    console.log('   3. Test the chatbot with common questions');
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
