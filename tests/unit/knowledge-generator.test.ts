/**
 * TDD Tests for Chatbot Knowledge Generator
 *
 * These tests define the expected behavior of the knowledge generator
 * that automatically creates chatbot knowledge from documentation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// We'll implement these - tests first!
import {
  extractMarkdownSections,
  parseUserWorkflows,
  parseVersion,
  generateKnowledgeBase,
  KnowledgeGeneratorConfig,
  GeneratedKnowledge,
} from '@/lib/ai/knowledge-generator';

describe('Knowledge Generator', () => {
  // ===========================================
  // SECTION 1: Markdown Parsing Tests
  // ===========================================
  describe('extractMarkdownSections', () => {
    it('should extract H2 sections from markdown', () => {
      const markdown = `
# Main Title

## Section One
Content for section one.

## Section Two
Content for section two.
- List item 1
- List item 2
`;
      const sections = extractMarkdownSections(markdown, 2);

      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe('Section One');
      expect(sections[0].content).toContain('Content for section one');
      expect(sections[1].title).toBe('Section Two');
      expect(sections[1].content).toContain('List item 1');
    });

    it('should extract H3 sections from markdown', () => {
      const markdown = `
## Parent Section

### Child Section One
Child content one.

### Child Section Two
Child content two.
`;
      const sections = extractMarkdownSections(markdown, 3);

      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe('Child Section One');
      expect(sections[1].title).toBe('Child Section Two');
    });

    it('should handle empty markdown gracefully', () => {
      const sections = extractMarkdownSections('', 2);
      expect(sections).toEqual([]);
    });

    it('should preserve markdown formatting in content', () => {
      const markdown = `
## Formatted Section
**Bold text** and *italic text*.

\`\`\`javascript
const code = 'example';
\`\`\`

1. Numbered list
2. Second item
`;
      const sections = extractMarkdownSections(markdown, 2);

      expect(sections[0].content).toContain('**Bold text**');
      expect(sections[0].content).toContain('1. Numbered list');
    });
  });

  // ===========================================
  // SECTION 2: User Workflows Parsing Tests
  // ===========================================
  describe('parseUserWorkflows', () => {
    const sampleWorkflowMarkdown = `
# ShiftSmart User Workflows

## Overview
ShiftSmart serves two distinct user types.

## User Type 1: Staffer Workflow

### Profile
Editorial staff in Breaking News team.

### Staffer Complete Workflow

#### Phase 1: Initial Setup
Step 1.1: Account Creation
Step 1.2: Set Shift Preferences

## User Type 2: Team Leader/Manager Workflow

### Profile
Team leaders who manage scheduling.

### Manager Complete Workflow

#### Phase 1: Pre-Schedule Preparation
Review Team Availability
`;

    it('should identify staffer vs team leader sections', () => {
      const parsed = parseUserWorkflows(sampleWorkflowMarkdown);

      expect(parsed.stafferWorkflow).toBeDefined();
      expect(parsed.teamLeaderWorkflow).toBeDefined();
    });

    it('should extract staffer workflow steps', () => {
      const parsed = parseUserWorkflows(sampleWorkflowMarkdown);

      expect(parsed.stafferWorkflow).toContain('Set Shift Preferences');
    });

    it('should extract team leader workflow steps', () => {
      const parsed = parseUserWorkflows(sampleWorkflowMarkdown);

      expect(parsed.teamLeaderWorkflow).toContain('Review Team Availability');
    });
  });

  // ===========================================
  // SECTION 3: Version Parsing Tests
  // ===========================================
  describe('parseVersion', () => {
    it('should extract version from README header', () => {
      const readme = `# ShiftSmart v1.8.1

Some description here.

**Version:** 1.8.1 | **Status:** Production Ready
`;
      const version = parseVersion(readme);
      expect(version).toBe('1.8.1');
    });

    it('should extract version from Version line', () => {
      const readme = `# ShiftSmart

**Version:** 2.0.0 | **Status:** Beta
`;
      const version = parseVersion(readme);
      expect(version).toBe('2.0.0');
    });

    it('should return "unknown" if no version found', () => {
      const readme = `# Some Project

No version info here.
`;
      const version = parseVersion(readme);
      expect(version).toBe('unknown');
    });
  });

  // ===========================================
  // SECTION 4: Knowledge Generation Tests
  // ===========================================
  describe('generateKnowledgeBase', () => {
    const mockConfig: KnowledgeGeneratorConfig = {
      userWorkflowsPath: 'docs/USER_WORKFLOWS.md',
      testerGuidePath: 'docs/TESTER_HANDOFF_GUIDE.md',
      readmePath: 'README.md',
      maxLength: 15000, // Claude context-friendly
    };

    it('should generate knowledge with required sections', () => {
      const mockDocs = {
        userWorkflows: `
## User Type 1: Staffer Workflow
Set preferences in My Availability.

## User Type 2: Team Leader/Manager Workflow
Review team in Team Management.
`,
        testerGuide: `
## Feature Checklist
- My Availability: Implemented
- My Time Off: Implemented
`,
        readme: `# ShiftSmart v1.8.1
AI-powered scheduling.
`,
      };

      const knowledge = generateKnowledgeBase(mockDocs, mockConfig);

      // Must have key sections
      expect(knowledge.content).toContain('About ShiftSmart');
      expect(knowledge.content).toContain('User Types');
      expect(knowledge.content).toContain('Response Guidelines');
    });

    it('should include version in generated knowledge', () => {
      const mockDocs = {
        userWorkflows: '## Overview\nTest content.',
        testerGuide: '## Features\nTest features.',
        readme: '# ShiftSmart v2.5.0\nDescription.',
      };

      const knowledge = generateKnowledgeBase(mockDocs, mockConfig);

      expect(knowledge.version).toBe('2.5.0');
      expect(knowledge.content).toContain('v2.5.0');
    });

    it('should respect max length constraint', () => {
      // Create realistic long content that will be included in output
      const longStafferContent = `
## User Type 1: Staffer Workflow

### My Availability
${'This is detailed content about availability preferences. '.repeat(100)}

### My Time Off
${'This is detailed content about time off management. '.repeat(100)}
`;
      const longLeaderContent = `
## User Type 2: Team Leader/Manager Workflow

### Team Management
${'This is detailed content about team management features. '.repeat(100)}

### AI Schedule Generation
${'This is detailed content about AI scheduling. '.repeat(100)}
`;
      const mockDocs = {
        userWorkflows: longStafferContent + longLeaderContent,
        testerGuide: 'B'.repeat(5000),
        readme: '# ShiftSmart v1.0.0\n',
      };

      const config = { ...mockConfig, maxLength: 5000 };
      const knowledge = generateKnowledgeBase(mockDocs, config);

      expect(knowledge.content.length).toBeLessThanOrEqual(5000);
      expect(knowledge.truncated).toBe(true);
    });

    it('should include staffer workflow content', () => {
      const mockDocs = {
        userWorkflows: `
## User Type 1: Staffer Workflow

### My Availability (For Staffers)
1. Click "My Availability" in the sidebar
2. Select preferred days
3. Save Preferences
`,
        testerGuide: '',
        readme: '# ShiftSmart v1.8.1',
      };

      const knowledge = generateKnowledgeBase(mockDocs, mockConfig);

      expect(knowledge.content).toContain('My Availability');
      expect(knowledge.content).toContain('Select preferred days');
    });

    it('should include team leader workflow content', () => {
      const mockDocs = {
        userWorkflows: `
## User Type 2: Team Leader/Manager Workflow

### Team Management (For Team Leaders Only)
- View all staff preferences
- Confirm preferences
`,
        testerGuide: '',
        readme: '# ShiftSmart v1.8.1',
      };

      const knowledge = generateKnowledgeBase(mockDocs, mockConfig);

      expect(knowledge.content).toContain('Team Management');
      expect(knowledge.content).toContain('Confirm preferences');
    });
  });

  // ===========================================
  // SECTION 5: Output Format Tests
  // ===========================================
  describe('GeneratedKnowledge output', () => {
    it('should have correct TypeScript export format', () => {
      const mockDocs = {
        userWorkflows: '## Overview\nTest.',
        testerGuide: '## Features\nTest.',
        readme: '# ShiftSmart v1.8.1',
      };

      const knowledge = generateKnowledgeBase(mockDocs, {
        userWorkflowsPath: '',
        testerGuidePath: '',
        readmePath: '',
        maxLength: 15000,
      });

      // Should be usable as a string constant
      expect(typeof knowledge.content).toBe('string');
      expect(knowledge.content.length).toBeGreaterThan(0);

      // Should have metadata
      expect(knowledge.version).toBeDefined();
      expect(knowledge.generatedAt).toBeInstanceOf(Date);
      expect(knowledge.sources).toBeInstanceOf(Array);
    });

    it('should track source documents used', () => {
      const mockDocs = {
        userWorkflows: '## Test\nContent.',
        testerGuide: '## Test\nContent.',
        readme: '# ShiftSmart v1.0.0',
      };

      const knowledge = generateKnowledgeBase(mockDocs, {
        userWorkflowsPath: 'docs/USER_WORKFLOWS.md',
        testerGuidePath: 'docs/TESTER_HANDOFF_GUIDE.md',
        readmePath: 'README.md',
        maxLength: 15000,
      });

      expect(knowledge.sources).toContain('docs/USER_WORKFLOWS.md');
      expect(knowledge.sources).toContain('README.md');
    });
  });

  // ===========================================
  // SECTION 6: Integration Tests
  // ===========================================
  describe('Integration with actual docs', () => {
    // These tests run against real files - skip in CI if files don't exist
    const docsExist =
      fs.existsSync(path.join(process.cwd(), 'docs/USER_WORKFLOWS.md')) &&
      fs.existsSync(path.join(process.cwd(), 'README.md'));

    it.skipIf(!docsExist)('should generate knowledge from actual USER_WORKFLOWS.md', () => {
      const userWorkflows = fs.readFileSync(
        path.join(process.cwd(), 'docs/USER_WORKFLOWS.md'),
        'utf-8'
      );

      const sections = extractMarkdownSections(userWorkflows, 2);

      // USER_WORKFLOWS.md should have these sections
      const sectionTitles = sections.map((s) => s.title);
      expect(sectionTitles).toContain('Overview');
    });

    it.skipIf(!docsExist)('should extract real version from README', () => {
      const readme = fs.readFileSync(path.join(process.cwd(), 'README.md'), 'utf-8');

      const version = parseVersion(readme);

      // Should match semver pattern
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
