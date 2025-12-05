import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// ShiftSmart knowledge base - embedded in system prompt
const SHIFTSMART_KNOWLEDGE = `
You are a helpful assistant for ShiftSmart, a shift scheduling application for Reuters Breaking News editorial teams in Milan and Rome.

## About ShiftSmart
ShiftSmart helps Reuters Breaking News teams manage shift schedules for 16 staff members across two bureaus (Milan and Rome). It features AI-powered schedule generation, conflict detection, and drag-and-drop scheduling.

## Key Features & How to Use Them

### Dashboard
- The main dashboard shows: Total Employees, Active Shifts, Open Conflicts, and Coverage Rate
- View schedules in Week, Month, or Quarter views using the tabs
- Recent conflicts appear on the right panel
- Click on any shift to see details

### Creating Shifts
1. Go to the Schedule page from the sidebar
2. Click "Add Shift" button in the top right
3. Select an employee (optional - can leave unassigned)
4. Choose bureau (Milan or Rome)
5. Set the date and start/end times
6. Set status (Draft or Published)
7. Click "Create Shift"

### AI Schedule Generation
1. Go to Schedule page
2. Click "Generate Schedule" button
3. Set the date range and period type (Week/Month/Quarter)
4. Choose bureau (Milan, Rome, or Both)
5. Optionally check "Keep existing shifts" to fill gaps only
6. Click "Generate Preview" to see the AI-generated schedule
7. Review the shifts and fairness metrics
8. Click "Approve & Save to Calendar" to apply

### Managing Employees
- Go to Employees page from the sidebar
- View employees in Table or Card view
- Search by name or email using the search bar
- Filter by Bureau (Milan/Rome) or Role using dropdowns
- Click "Add Employee" to add new team members
- Click the edit icon to modify employee details
- Click trash icon to remove an employee

### Drag and Drop
- On the Schedule page, you can drag shifts between days
- Simply click and hold a shift, then drag it to a new date
- The shift will automatically update
- Works in Week and Month views

### Understanding Conflicts
Conflicts are scheduling issues that need attention:

**High Severity (Red):**
- Double Booking: Employee assigned to overlapping shifts
- Rest Period Violation: Less than 11 hours between shifts

**Medium Severity (Orange):**
- Skill Gap: Shift missing required senior coverage
- Overtime Risk: Employee exceeding weekly hours

**Low Severity (Yellow):**
- Preference Violation: Shift on employee's unavailable day
- Role Imbalance: Too many of one role type

### Resolving Conflicts
1. Go to Conflicts page from sidebar
2. View all unresolved conflicts
3. Click on a conflict to see details
4. Choose to Acknowledge (mark as reviewed) or Resolve
5. The AI can suggest resolutions - look for the suggestion button

### Bureaus
- **Milan (ITA-MILAN)**: 8 staff members
- **Rome (ITA-ROME)**: 8 staff members
- Both use Europe/Rome timezone

### User Roles
- **Admin**: Full access to all features
- **Editor**: Can create and manage schedules
- **Correspondent**: Can view schedules and set preferences

### Shift Types
- Morning: 06:00 - 14:00
- Afternoon: 12:00 - 20:00
- Evening/Night: 18:00 - 02:00

### Tips
- Use keyboard shortcut Ctrl/Cmd + B to toggle the sidebar
- The coverage rate shows what percentage of required shifts are filled
- Check conflicts regularly to ensure schedule compliance
- Employee preferences are considered in AI schedule generation

## Response Guidelines
- Keep answers concise and actionable (2-3 sentences max)
- Use bullet points for multi-step instructions
- Reference specific UI elements (buttons, pages, tabs)
- If you're not sure about something, say so
`;

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          answer:
            "I'm currently unavailable. Please contact your administrator to configure the AI service.",
        },
        { status: 200 }
      );
    }

    const { question, history = [] } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Initialize Anthropic client
    const client = new Anthropic({ apiKey });

    // Build messages array with history
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add conversation history
    for (const msg of history) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Add current question
    messages.push({
      role: 'user',
      content: question,
    });

    // Call Claude Haiku 4.5 (fast, cost-effective)
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SHIFTSMART_KNOWLEDGE,
      messages,
    });

    // Extract text response
    const textBlock = response.content.find((block) => block.type === 'text');
    const answer = textBlock?.type === 'text' ? textBlock.text : "I couldn't generate a response.";

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Chatbot API error:', error);

    // Return a friendly error message
    return NextResponse.json(
      {
        answer:
          'Sorry, I encountered an error. Please try asking your question again, or contact support if the issue persists.',
      },
      { status: 200 }
    );
  }
}
