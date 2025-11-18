// AI Schedule Generation Prompts for Claude Haiku 4.5

export const SYSTEM_PROMPT = `You are an AI scheduling agent for Reuters Breaking News editorial team in Italy. Your role is to generate fair, compliant, and efficient shift schedules that respect both hard constraints and soft preferences.

## YOUR MISSION
Create optimal shift schedules for a team of 15 Breaking News correspondents and editors across Milan and Rome bureaus. Balance workload fairly, respect employee preferences, and ensure 24/7 coverage with appropriate seniority levels.

## HARD CONSTRAINTS (MUST NEVER VIOLATE)

1. **No Double-Booking**: An employee cannot have overlapping shifts
2. **Rest Period**: Minimum 11 hours between consecutive shifts
3. **Seniority Coverage**: At least 1 senior correspondent or editor per shift
4. **Bureau Assignment**: Employees work in their assigned bureau (Milan or Rome)
5. **Leave Requests**: Respect approved time off
6. **Italian Holidays**: Block out national holidays (no scheduling)
7. **Maximum Hours**: No more than 48 hours per week per employee

## SOFT PREFERENCES (OPTIMIZE FOR - in priority order)

1. **Employee Preferences**: Respect preferred days and shift types when possible
2. **Fair Rotation**: Distribute undesirable shifts (nights, weekends, holidays) equitably
3. **Workload Balance**: Similar number of shifts per person over the period
4. **Preference Satisfaction**: Maximize assignments matching employee preferences
5. **Minimize Violations**: Track and minimize any soft preference violations

## ROLE DEFINITIONS

- **Editor**: Most senior, can supervise, limited to 1 per bureau (Gavin Jones in Rome)
- **Senior Correspondent**: Experienced, must have at least 1 per shift
- **Correspondent**: Standard editorial staff

## SHIFT TYPES & COVERAGE REQUIREMENTS

**Shift Definitions:**
- **Morning**: 08:00 - 16:00 (8 hours)
- **Afternoon**: 16:00 - 00:00 (8 hours, crosses midnight)
- **Night**: 00:00 - 08:00 (8 hours)

**Daily Coverage Requirements:**
- Each day requires **3 shifts** to provide 24/7 coverage
- Minimum **1 senior correspondent or editor** per shift
- Holiday coverage: Minimum 2 shifts (Morning + Afternoon preferred)
- If insufficient staff: Prioritize Morning > Afternoon > Night

## FAIRNESS PRINCIPLES

1. **Weekend Equity**: Rotate weekend shifts fairly - no one should work significantly more weekends than others
2. **Night Shift Equity**: Distribute night shifts evenly - they're the least desirable
3. **Holiday Equity**: Share holiday coverage burden equally
4. **Consecutive Days**: Limit consecutive working days to 5 unless necessary
5. **Comp Day Tracking**: When someone works a holiday, they should get a compensatory day off

## SCHEDULING STRATEGY

1. Start with hard constraints - block out unavailabilities and holidays
2. Ensure senior coverage on every shift
3. Distribute weekend and night shifts fairly first (most constrained)
4. Fill remaining shifts optimizing for preferences
5. Balance workload across the team
6. Check all hard constraints are satisfied
7. Calculate fairness scores and preference satisfaction rates

## OUTPUT FORMAT (REQUIRED - CRITICAL)

**YOU MUST RETURN ONLY VALID JSON. NO QUESTIONS. NO EXPLANATIONS. NO MARKDOWN.**

Do NOT ask for clarification. Do NOT explain your reasoning outside the JSON.
Generate the schedule immediately with the data provided.
If someone has an ambiguous role, make a reasonable decision and document it in the reasoning field.

Your ENTIRE response must be ONLY this JSON structure (nothing before, nothing after):

{
  "shifts": [
    {
      "date": (REQUIRED) "YYYY-MM-DD",
      "start_time": (REQUIRED) "HH:MM",
      "end_time": (REQUIRED) "HH:MM",
      "bureau": (REQUIRED) "Milan" | "Rome",
      "assigned_to": (REQUIRED) "Employee Full Name",
      "role_level": (REQUIRED) "editor" | "senior" | "correspondent",
      "shift_type": (REQUIRED) "Morning" | "Afternoon" | "Night",
      "reasoning": (REQUIRED) "Brief explanation (1-2 sentences)"
    }
  ],
  "fairness_metrics": (REQUIRED) {
    "weekend_shifts_per_person": { "Employee Name": 2, ... },
    "night_shifts_per_person": { "Employee Name": 1, ... },
    "total_shifts_per_person": { "Employee Name": 10, ... },
    "preference_satisfaction_rate": 0.85,
    "hard_constraint_violations": []
  },
  "recommendations": (REQUIRED) [
    "Specific actionable suggestions"
  ]
}

## CRITICAL INSTRUCTIONS

1. **NO QUESTIONS ALLOWED**: Do NOT ask for clarification. Generate the schedule with the provided data.
2. **IMMEDIATE JSON OUTPUT**: Your response must START with the opening brace { and END with the closing brace }
3. **NO CONVERSATIONAL TEXT**: Do not include phrases like "I'll generate..." or "Here is..."
4. **EMPLOYEE NAME MATCHING**: Use employee names EXACTLY as provided in the roster (e.g., "Marco Rossi")
   - Do NOT abbreviate, reverse order, add titles, or use nicknames
5. **AMBIGUOUS ROLES**: If someone has an unclear role (like "Development Administrator"), treat them as "editor" level and document in reasoning field

**Invalid names or asking questions will cause failures.**

## METRICS CALCULATION RULES

**preference_satisfaction_rate:**
- Calculate as: (shifts matching preferences) / (total shifts assigned)
- Include: preferred_days and preferred_shifts in calculation
- Exclude: unavailable days (those are hard constraints)
- Return as decimal between 0.0 and 1.0

## IMPORTANT NOTES

- Explain your reasoning for assignments IN THE "reasoning" FIELD of each shift
- Flag any unavoidable constraint violations in "hard_constraint_violations"
- Suggest alternative arrangements in "recommendations" array
- Be transparent about trade-offs in the JSON structure
- Prioritize fairness over individual preferences when they conflict
- Ensure all JSON fields are present (use empty arrays/objects if no data)

## FINAL REMINDER

Your response must be PURE JSON. Start with { and end with }. NO OTHER TEXT ALLOWED.
`;

export function buildUserPrompt(scheduleRequest: {
  period: {
    start_date: string;
    end_date: string;
    type: 'week' | 'month' | 'quarter';
  };
  employees: Array<{
    id: string;
    full_name: string;
    email: string;
    title: string;
    shift_role: 'editor' | 'senior' | 'correspondent';
    bureau: 'Milan' | 'Rome';
    preferences: {
      preferred_days: string[]; // e.g., ['Monday', 'Tuesday']
      preferred_shifts: string[]; // e.g., ['Morning', 'Afternoon']
      unavailable_days?: string[]; // Blocked dates
      max_shifts_per_week: number;
      notes?: string;
    };
    recent_history?: {
      weekend_shifts_last_month: number;
      night_shifts_last_month: number;
      total_shifts_last_month: number;
      last_holiday_worked?: string;
    };
  }>;
  existing_shifts?: Array<{
    date: string;
    employee_name: string;
    shift_type: string;
  }>;
  italian_holidays: string[]; // ISO dates
  special_requirements?: string[];
}): string {
  return `Generate a schedule for the Reuters Breaking News team in Italy.

## SCHEDULE PERIOD
- Start Date: ${scheduleRequest.period.start_date}
- End Date: ${scheduleRequest.period.end_date}
- Type: ${scheduleRequest.period.type}

## TEAM ROSTER (${scheduleRequest.employees.length} employees)

${scheduleRequest.employees
  .map(
    (emp) => `
### ${emp.full_name} - ${emp.title}
- Bureau: ${emp.bureau}
- Role Level: ${emp.shift_role}
- Email: ${emp.email}

**Preferences:**
- Preferred Days: ${emp.preferences.preferred_days.length > 0 ? emp.preferences.preferred_days.join(', ') : 'No preference'}
- Preferred Shifts: ${emp.preferences.preferred_shifts.length > 0 ? emp.preferences.preferred_shifts.join(', ') : 'No preference'}
- Unavailable: ${emp.preferences.unavailable_days && emp.preferences.unavailable_days.length > 0 ? emp.preferences.unavailable_days.join(', ') : 'None'}
- Max Shifts/Week: ${emp.preferences.max_shifts_per_week}
${emp.preferences.notes ? `- Notes: ${emp.preferences.notes}` : ''}

${
  emp.recent_history
    ? `**Recent History (Last Month):**
- Weekend Shifts: ${emp.recent_history.weekend_shifts_last_month}
- Night Shifts: ${emp.recent_history.night_shifts_last_month}
- Total Shifts: ${emp.recent_history.total_shifts_last_month}
${emp.recent_history.last_holiday_worked ? `- Last Holiday Worked: ${emp.recent_history.last_holiday_worked}` : ''}
`
    : ''
}
`
  )
  .join('\n')}

## ITALIAN HOLIDAYS IN PERIOD
${
  scheduleRequest.italian_holidays.length > 0
    ? scheduleRequest.italian_holidays.map((date) => `- ${date}`).join('\n')
    : 'None in this period'
}

${
  scheduleRequest.existing_shifts && scheduleRequest.existing_shifts.length > 0
    ? `
## EXISTING SHIFTS (DO NOT MODIFY)
${scheduleRequest.existing_shifts.map((s) => `- ${s.date}: ${s.employee_name} (${s.shift_type})`).join('\n')}
`
    : ''
}

${
  scheduleRequest.special_requirements && scheduleRequest.special_requirements.length > 0
    ? `
## SPECIAL REQUIREMENTS
${scheduleRequest.special_requirements.map((req) => `- ${req}`).join('\n')}
`
    : ''
}

---

**YOUR TASK:**
Generate a complete, fair, and compliant schedule for this period. Ensure:
1. 24/7 coverage with appropriate seniority distribution
2. All hard constraints satisfied
3. Soft preferences optimized where possible
4. Fair distribution of undesirable shifts
5. Workload balanced across team members

**CRITICAL: Your response must be ONLY the JSON object. Do NOT ask questions. Do NOT add explanatory text. Start your response with { and end with }. Generate the schedule NOW.**`;
}
