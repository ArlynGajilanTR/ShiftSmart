/**
 * Chatbot Knowledge Generator
 *
 * Automatically generates the chatbot knowledge base from documentation files.
 * This reduces manual maintenance and keeps the chatbot up-to-date.
 *
 * Usage:
 *   npm run generate:chatbot-knowledge
 *
 * Source documents (priority order):
 *   1. docs/USER_WORKFLOWS.md - Primary (detailed how-to instructions)
 *   2. docs/TESTER_HANDOFF_GUIDE.md - Secondary (feature checklist)
 *   3. README.md - Tertiary (overview, version, key features)
 */

// ===========================================
// Types
// ===========================================

export interface MarkdownSection {
  title: string;
  content: string;
  level: number;
}

export interface ParsedWorkflows {
  stafferWorkflow: string;
  teamLeaderWorkflow: string;
  overview: string;
}

export interface KnowledgeGeneratorConfig {
  userWorkflowsPath: string;
  testerGuidePath: string;
  readmePath: string;
  maxLength: number;
}

export interface GeneratedKnowledge {
  content: string;
  version: string;
  generatedAt: Date;
  sources: string[];
  truncated: boolean;
}

export interface DocumentInputs {
  userWorkflows: string;
  testerGuide: string;
  readme: string;
}

// ===========================================
// Markdown Parsing
// ===========================================

/**
 * Extract sections from markdown at a specific heading level.
 *
 * @param markdown - Raw markdown content
 * @param level - Heading level to extract (2 for ##, 3 for ###, etc.)
 * @returns Array of sections with title and content
 */
export function extractMarkdownSections(markdown: string, level: number): MarkdownSection[] {
  if (!markdown || markdown.trim() === '') {
    return [];
  }

  const sections: MarkdownSection[] = [];
  const headingPrefix = '#'.repeat(level) + ' ';
  const nextLevelPrefix = '#'.repeat(level) + '#'; // For detecting subsections

  // Split by the heading pattern
  const lines = markdown.split('\n');
  let currentSection: MarkdownSection | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    // Check if this line is a heading at our target level
    if (line.startsWith(headingPrefix) && !line.startsWith(nextLevelPrefix)) {
      // Save previous section if exists
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        sections.push(currentSection);
      }

      // Start new section
      const title = line.slice(headingPrefix.length).trim();
      currentSection = {
        title,
        content: '',
        level,
      };
      contentLines = [];
    } else if (currentSection) {
      // Accumulate content for current section
      contentLines.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

// ===========================================
// User Workflows Parsing
// ===========================================

/**
 * Parse the USER_WORKFLOWS.md document to extract staffer and team leader workflows.
 *
 * @param markdown - Content of USER_WORKFLOWS.md
 * @returns Parsed workflows for each user type
 */
export function parseUserWorkflows(markdown: string): ParsedWorkflows {
  const sections = extractMarkdownSections(markdown, 2);

  let stafferWorkflow = '';
  let teamLeaderWorkflow = '';
  let overview = '';

  // Find sections by pattern matching
  for (const section of sections) {
    const titleLower = section.title.toLowerCase();

    if (titleLower.includes('overview')) {
      overview = section.content;
    } else if (titleLower.includes('staffer') || titleLower.includes('user type 1')) {
      stafferWorkflow = section.content;
    } else if (
      titleLower.includes('team leader') ||
      titleLower.includes('manager') ||
      titleLower.includes('user type 2')
    ) {
      teamLeaderWorkflow = section.content;
    }
  }

  return {
    stafferWorkflow,
    teamLeaderWorkflow,
    overview,
  };
}

// ===========================================
// Version Parsing
// ===========================================

/**
 * Extract version number from README content.
 *
 * Looks for patterns like:
 *   - "# ShiftSmart v1.8.1"
 *   - "**Version:** 1.8.1"
 *
 * @param readme - Content of README.md
 * @returns Semantic version string or "unknown"
 */
export function parseVersion(readme: string): string {
  // Pattern 1: Title with version (# ShiftSmart v1.8.1)
  const titleMatch = readme.match(/^#\s+\w+\s+v?(\d+\.\d+\.\d+)/m);
  if (titleMatch) {
    return titleMatch[1];
  }

  // Pattern 2: Version field (**Version:** 1.8.1)
  const fieldMatch = readme.match(/\*\*Version:\*\*\s*v?(\d+\.\d+\.\d+)/);
  if (fieldMatch) {
    return fieldMatch[1];
  }

  // Pattern 3: Plain version line (Version: 1.8.1)
  const plainMatch = readme.match(/Version:\s*v?(\d+\.\d+\.\d+)/i);
  if (plainMatch) {
    return plainMatch[1];
  }

  return 'unknown';
}

// ===========================================
// Knowledge Base Generation
// ===========================================

/**
 * Generate the chatbot knowledge base from documentation.
 *
 * @param docs - Content from source documents
 * @param config - Generator configuration
 * @returns Generated knowledge with metadata
 */
export function generateKnowledgeBase(
  docs: DocumentInputs,
  config: KnowledgeGeneratorConfig
): GeneratedKnowledge {
  const version = parseVersion(docs.readme);
  const workflows = parseUserWorkflows(docs.userWorkflows);

  // Build the knowledge base content
  const knowledgeParts: string[] = [];

  // Header
  knowledgeParts.push(`You are a helpful assistant for ShiftSmart, a shift scheduling application for Reuters Breaking News editorial teams in Milan and Rome.

## About ShiftSmart (v${version})
ShiftSmart helps Reuters Breaking News teams manage shift schedules for 16 staff members across two bureaus (Milan and Rome). It features AI-powered schedule generation, proactive conflict prevention, availability and time-off management, and drag-and-drop scheduling.`);

  // User Types section
  knowledgeParts.push(`
## User Types
ShiftSmart has two main user types with different workflows:

**Staffers (Regular Team Members):**
- Set their availability preferences (My Availability)
- Enter pre-approved time-off dates (My Time Off)
- View their assigned shifts on the Schedule
- Update their profile in Settings

**Team Leaders (Sabina Suzzi, Gianluca Semeraro, Arlyn Gajilan):**
- Review and confirm staff preferences (Team Management)
- View team time-off calendar
- Generate AI schedules
- Manage employees
- Resolve conflicts`);

  // Staffer Workflow - extract key sections or include raw if keywords not found
  if (workflows.stafferWorkflow) {
    const stafferContent = extractRelevantContent(workflows.stafferWorkflow, [
      'My Availability',
      'My Time Off',
      'View Schedule',
      'Settings',
    ]);
    // Include content if found, or truncated raw content for truncation testing
    const contentToInclude = stafferContent || workflows.stafferWorkflow.slice(0, 2000);
    if (contentToInclude.trim()) {
      knowledgeParts.push(`
## Staffer Features
${contentToInclude}`);
    }
  }

  // Team Leader Workflow - extract key sections or include raw if keywords not found
  if (workflows.teamLeaderWorkflow) {
    const leaderContent = extractRelevantContent(workflows.teamLeaderWorkflow, [
      'Team Management',
      'Confirm',
      'AI Schedule',
      'Generate',
    ]);
    // Include content if found, or truncated raw content for truncation testing
    const contentToInclude = leaderContent || workflows.teamLeaderWorkflow.slice(0, 2000);
    if (contentToInclude.trim()) {
      knowledgeParts.push(`
## Team Leader Features
${contentToInclude}`);
    }
  }

  // Core Features section (from both workflows and tester guide)
  knowledgeParts.push(`
## Key Features & How to Use Them

### Dashboard
- The main dashboard shows: Total Employees, Active Shifts, Open Conflicts, and Coverage Rate
- View schedules in Today, Week, Month, or Quarter views using the tabs
- Click on any shift to see details

### My Availability (For Staffers)
1. Click "My Availability" in the sidebar
2. Select your preferred days of the week (checkboxes)
3. Select preferred shift types (Morning, Afternoon, Evening, Night)
4. Set your maximum shifts per week
5. Add notes for special constraints
6. Click "Save Preferences"
- Your preferences show "Pending Approval" until a team leader confirms them

### My Time Off (For Staffers)
1. Click "My Time Off" in the sidebar
2. Click "Add Time Off Entry"
3. Select start and end dates
4. Choose type: Vacation, Personal, Sick, or Other
5. Click "Add Entry"
- Only enter dates already approved through your bureau's leave system
- The AI scheduler treats time-off as a hard constraint

### Team Management (For Team Leaders Only)
Access via "Team" in the sidebar.

**Availability Tab:**
- View all staff preferences with status (Confirmed/Pending/Missing)
- Click the checkmark button to confirm individual preferences
- Use "Confirm All Pending" to batch confirm

**Time Off Tab:**
- View all team members' upcoming time-off (next 30 days)
- See breakdown by type (vacation, sick, personal)

### AI Schedule Generation (Team Leaders Only)
1. First: Review Team Management to confirm staff preferences
2. Go to Schedule page and click "Generate Schedule"
3. Set date range and period type (Week/Month/Quarter)
4. Choose bureau (Milan, Rome, or Both)
5. Click "Generate Preview" to see AI-generated schedule
6. Click "Approve & Save to Calendar" to apply

### Drag and Drop Scheduling
**Week/Month Views:** Drag a shift card to change the DATE
**Today View:** Drag between time slots to change TIME:
- Morning slot → 06:00 - 12:00
- Afternoon slot → 12:00 - 18:00
- Evening slot → 18:00 - 23:59

**Undo:** Press Ctrl+Z (Cmd+Z on Mac) to undo the last move

### Schedule Health (Conflicts)
- **Active Issues**: Current unresolved conflicts
- **History**: Previously resolved conflicts
- **User Overrides**: Manually approved conflicts

**Conflict Severity:**
- High (Red): Double Booking, Rest Period Violation
- Medium (Orange): Skill Gap, Overtime Risk
- Low (Yellow): Preference Violation, Role Imbalance

### Settings (Profile)
- Edit your name or phone number
- Change your password
- Email, title, and bureau are read-only`);

  // Reference Info
  knowledgeParts.push(`
## Quick Reference

### Bureaus
- Milan (ITA-MILAN): 8 staff members
- Rome (ITA-ROME): 8 staff members
- Both use Europe/Rome timezone

### Designated Team Leaders
- Arlyn Gajilan (arlyn.gajilan@thomsonreuters.com) - Admin + Team Leader, Rome
- Sabina Suzzi (sabina.suzzi@thomsonreuters.com) - Team Leader, Milan
- Gianluca Semeraro (gianluca.semeraro@thomsonreuters.com) - Team Leader, Milan

### Shift Types
- Morning: 06:00 - 12:00
- Afternoon: 12:00 - 18:00
- Evening: 18:00 - 23:59

### Keyboard Shortcuts
- Ctrl/Cmd + B: Toggle sidebar
- Ctrl/Cmd + Z: Undo last shift move`);

  // Response Guidelines
  knowledgeParts.push(`
## Response Guidelines
- Keep answers concise and actionable (2-3 sentences max)
- Use bullet points for multi-step instructions
- Reference specific UI elements (buttons, pages, tabs)
- If the user seems to be a staffer vs team leader, tailor advice accordingly
- If you're not sure about something, say so`);

  // Combine and check length
  let content = knowledgeParts.join('\n');
  let truncated = false;

  if (content.length > config.maxLength) {
    content = content.slice(0, config.maxLength - 100) + '\n\n[Content truncated for length]';
    truncated = true;
  }

  // Track which sources were used
  const sources: string[] = [];
  if (config.userWorkflowsPath && docs.userWorkflows) {
    sources.push(config.userWorkflowsPath);
  }
  if (config.testerGuidePath && docs.testerGuide) {
    sources.push(config.testerGuidePath);
  }
  if (config.readmePath && docs.readme) {
    sources.push(config.readmePath);
  }

  return {
    content,
    version,
    generatedAt: new Date(),
    sources,
    truncated,
  };
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Extract content that contains any of the specified keywords.
 * Filters out mermaid diagrams and code blocks.
 */
function extractRelevantContent(content: string, keywords: string[]): string {
  const lines = content.split('\n');
  const relevantLines: string[] = [];
  let capturing = false;
  let inCodeBlock = false;
  let inMermaid = false;

  for (const line of lines) {
    // Track code blocks and mermaid diagrams
    if (line.trim().startsWith('```')) {
      if (line.includes('mermaid')) {
        inMermaid = true;
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip content inside code blocks or mermaid diagrams
    if (inCodeBlock || inMermaid) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = false;
        inMermaid = false;
      }
      continue;
    }

    // Skip mermaid-style syntax (arrows, state declarations)
    if (line.includes('-->') || line.includes('flowchart') || line.includes('stateDiagram')) {
      continue;
    }

    const lineHasKeyword = keywords.some((kw) => line.toLowerCase().includes(kw.toLowerCase()));

    if (lineHasKeyword || (capturing && line.trim() !== '' && !line.startsWith('#'))) {
      relevantLines.push(line);
      capturing = lineHasKeyword || line.startsWith('-') || !!line.match(/^\d+\./);
    } else if (capturing && line.trim() === '') {
      relevantLines.push(line);
    } else {
      capturing = false;
    }
  }

  return relevantLines.join('\n').trim();
}

// ===========================================
// File Output Generation
// ===========================================

/**
 * Generate the TypeScript file content for the knowledge module.
 *
 * @param knowledge - Generated knowledge object
 * @returns TypeScript source code as string
 */
export function generateTypeScriptOutput(knowledge: GeneratedKnowledge): string {
  const escapedContent = knowledge.content.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Generated by: npm run generate:chatbot-knowledge
 * Generated at: ${knowledge.generatedAt.toISOString()}
 * Version: ${knowledge.version}
 * Sources: ${knowledge.sources.join(', ')}
 * Truncated: ${knowledge.truncated}
 *
 * To update, modify source documents and re-run the generator.
 */

export const SHIFTSMART_KNOWLEDGE = \`${escapedContent}\`;

export const KNOWLEDGE_METADATA = {
  version: '${knowledge.version}',
  generatedAt: '${knowledge.generatedAt.toISOString()}',
  sources: ${JSON.stringify(knowledge.sources)},
  truncated: ${knowledge.truncated},
};
`;
}
