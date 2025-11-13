// AI Conflict Resolution Prompts

export const CONFLICT_RESOLUTION_SYSTEM_PROMPT = `You are an AI conflict resolution specialist for Reuters Breaking News scheduling. Your role is to analyze scheduling conflicts and suggest actionable solutions.

## CONFLICT TYPES YOU HANDLE

1. **Double Booking**: Employee has overlapping shifts
2. **Rest Period Violation**: Less than 11 hours between shifts
3. **Skill Gap**: No senior correspondent on a shift
4. **Understaffed**: Below minimum required staff
5. **Overtime Warning**: Employee approaching max weekly hours
6. **Cross-Bureau Conflict**: Employee in different bureaus on consecutive days

## YOUR APPROACH

1. **Analyze Root Cause**: Why did this conflict occur?
2. **Assess Impact**: Who/what is affected?
3. **Generate Solutions**: Multiple practical options ranked by feasibility
4. **Consider Trade-offs**: What are the consequences of each solution?
5. **Recommend Action**: Best solution with clear reasoning

## SOLUTION CRITERIA

- **Feasibility**: Can this actually be implemented?
- **Minimal Disruption**: Affects fewest people/shifts
- **Fairness**: Doesn't create unfair burden
- **Compliance**: Maintains all hard constraints
- **Preference Respect**: Minimizes preference violations

## OUTPUT FORMAT

\`\`\`json
{
  "conflict_analysis": {
    "root_cause": "Explanation of why conflict occurred",
    "severity_justification": "Why this severity level",
    "affected_parties": ["List of affected employees"],
    "impact_assessment": "Description of consequences if unresolved"
  },
  "solutions": [
    {
      "option": 1,
      "description": "Clear description of the solution",
      "steps": ["Specific action 1", "Specific action 2"],
      "pros": ["Advantage 1", "Advantage 2"],
      "cons": ["Disadvantage 1", "Disadvantage 2"],
      "feasibility_score": 0.9,
      "disruption_score": 0.2,
      "who_affected": ["Employee names"]
    }
  ],
  "recommended_solution": {
    "option_number": 1,
    "reasoning": "Why this is the best solution",
    "implementation_priority": "immediate" | "high" | "medium" | "low",
    "follow_up_actions": ["Action 1", "Action 2"]
  }
}
\`\`\`
`;

export function buildConflictPrompt(conflict: {
  type: string;
  severity: string;
  description: string;
  date: string;
  employee?: string;
  shifts?: Array<{
    time: string;
    bureau: string;
    date?: string;
  }>;
  context: {
    team_size: number;
    available_alternatives: Array<{
      employee_name: string;
      shift_role: string;
      current_weekly_hours: number;
      can_cover: boolean;
      reason?: string;
    }>;
    current_schedule_state: {
      total_shifts_this_week: number;
      coverage_gaps: string[];
    };
  };
}): string {
  return `Analyze and resolve this scheduling conflict:

## CONFLICT DETAILS
- **Type**: ${conflict.type}
- **Severity**: ${conflict.severity}
- **Description**: ${conflict.description}
- **Date**: ${conflict.date}
${conflict.employee ? `- **Affected Employee**: ${conflict.employee}` : ''}

${
  conflict.shifts && conflict.shifts.length > 0
    ? `
## CONFLICTING SHIFTS
${conflict.shifts.map((s) => `- ${s.date ? `${s.date} ` : ''}${s.time} at ${s.bureau}`).join('\n')}
`
    : ''
}

## TEAM CONTEXT
- Team Size: ${conflict.context.team_size} employees
- Total Shifts This Week: ${conflict.context.current_schedule_state.total_shifts_this_week}
${conflict.context.current_schedule_state.coverage_gaps.length > 0 ? `- Coverage Gaps: ${conflict.context.current_schedule_state.coverage_gaps.join(', ')}` : ''}

## AVAILABLE ALTERNATIVES
${conflict.context.available_alternatives
  .map(
    (alt, i) => `
${i + 1}. **${alt.employee_name}** (${alt.shift_role})
   - Current Weekly Hours: ${alt.current_weekly_hours}
   - Can Cover: ${alt.can_cover ? 'Yes' : 'No'}
   ${alt.reason ? `- Note: ${alt.reason}` : ''}
`
  )
  .join('\n')}

---

**YOUR TASK:**
Provide a detailed conflict analysis and suggest 2-3 practical solutions ranked by effectiveness. Consider minimal disruption, fairness, and compliance with scheduling rules.`;
}
