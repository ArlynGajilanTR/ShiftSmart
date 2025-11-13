# ShiftSmart MVP Requirements - Breaking News Team

## Overview

Initial rollout for Reuters Breaking News editorial team with staff in Milan and Rome bureaus.

## In Scope for MVP

### Team & Structure

- ✅ **Single Team**: Breaking News only
- ✅ **Two Bureaus**: Milan and Rome
- ✅ **Timezone**: Europe/Rome (CET/CEST)
- ✅ **Staff Roles**: Senior, Junior, Lead, Support editors

### Core Functionality

- ✅ **Multi-view scheduling**: Week, Month, Quarter, Special Events
- ✅ **Drag-and-drop interface**: Intuitive shift assignment
- ✅ **Role-based validation**: No all-junior shifts
- ✅ **Conflict detection**: Hard and soft warnings
- ✅ **CSV import**: Bulk staff and shift import
- ✅ **Bureau management**: Milan and Rome operations

### User Management

- ✅ **Signup with bureau selection**: Milan or Rome
- ✅ **Team auto-assignment**: All users → Breaking News
- ✅ **Role selection**: Senior/Junior/Lead/Support
- ✅ **Direct dashboard access**: No unnecessary screens

### Scheduling Rules

- ✅ Minimum 1 senior/lead per shift
- ✅ Maximum 3 juniors per shift
- ✅ Lead required for night shifts
- ✅ 11-hour rest period between shifts
- ✅ Overtime warnings
- ✅ Preference violations flagged

## Out of Scope for MVP

### Features (Future)

- ❌ Multiple teams beyond Breaking News
- ❌ Additional bureaus beyond Milan/Rome
- ❌ Shift swap requests
- ❌ Mobile app
- ❌ Real-time collaboration
- ❌ Advanced analytics/reporting
- ❌ Integration with other Reuters systems
- ❌ Automated shift generation
- ❌ Staff availability calendar sync

### Technical (Future)

- ❌ Real-time updates (WebSocket)
- ❌ Push notifications
- ❌ Advanced permissions beyond basic roles
- ❌ Custom shift templates
- ❌ Historical reporting
- ❌ Export to other formats (PDF, Excel)

## Data Requirements

### Initial Setup Needed

1. **Bureaus** (Manual setup in Supabase):

   ```
   Milan (MILAN) - Europe/Rome timezone
   Rome (ROME) - Europe/Rome timezone
   ```

2. **Staff List** (CSV Import):
   - Breaking News team members from Milan
   - Breaking News team members from Rome
   - Each person's role (Senior/Junior/Lead/Support)
   - Email addresses
   - Full names

3. **Initial Schedules** (CSV Import - Optional):
   - Current shift assignments
   - Historical data for reference

### CSV Format Required

```csv
date,start_time,end_time,staff_name,staff_email,role,bureau
2025-11-01,09:00,17:00,John Doe,john@reuters.com,senior,Milan
2025-11-01,17:00,01:00,Jane Smith,jane@reuters.com,lead,Rome
```

## Success Criteria for MVP Launch

### Technical

- ✅ All core features working
- ✅ No critical bugs
- ✅ Fast page load times (< 2s)
- ✅ Mobile responsive (view-only)
- ✅ Data properly secured (RLS enabled)

### Business

- ✅ Breaking News team onboarded (Milan)
- ✅ Breaking News team onboarded (Rome)
- ✅ Historical shifts imported
- ✅ 1 month of scheduling completed successfully
- ✅ Zero published conflicts

### User Experience

- ✅ Intuitive for schedulers (< 15 min training)
- ✅ Clear conflict warnings
- ✅ Fast shift assignment (drag & drop)
- ✅ Professional Reuters branding
- ✅ No confusion about team/bureau

## Timeline

### Phase 1: Setup (Week 1)

- Database schema deployed
- Milan and Rome bureaus created
- Administrator accounts created

### Phase 2: Data Import (Week 1-2)

- Staff list received
- CSV formatted correctly
- Bulk import completed
- Verification of all staff records

### Phase 3: Testing (Week 2)

- Schedulers create test schedules
- Conflict detection verified
- Role validation tested
- Bug fixes

### Phase 4: Launch (Week 3)

- Breaking News team notified
- Initial schedules published
- Support available for questions
- Monitoring for issues

## Post-MVP Roadmap

### Phase 2 (Month 2-3)

- Additional teams (if needed)
- Additional bureaus (if needed)
- Enhanced reporting
- Shift swap functionality

### Phase 3 (Month 4-6)

- Mobile app
- Real-time collaboration
- Integration with Reuters systems
- Advanced analytics

## Support & Training

### Documentation Provided

- ✅ Setup instructions
- ✅ User guide for schedulers
- ✅ CSV import guide
- ✅ Troubleshooting guide

### Training Required

- 15-minute demo for schedulers
- 5-minute overview for staff
- Office hours for first 2 weeks

## Risks & Mitigation

### Risk: Staff resistance to new system

**Mitigation**: Simple interface, minimal training needed, clear benefits

### Risk: Data import errors

**Mitigation**: CSV validation, error reporting, manual correction tools

### Risk: Timezone confusion (Milan/Rome)

**Mitigation**: Single timezone (Europe/Rome), clear time displays

### Risk: Technical issues at launch

**Mitigation**: Testing period, gradual rollout, support availability

## Appendix

### Key Stakeholders

- Breaking News Editorial Manager (Milan)
- Breaking News Editorial Manager (Rome)
- IT/Systems Support
- Development Team

### Communication Plan

- Weekly updates during development
- Launch announcement 1 week before
- Daily check-ins during first week
- Feedback collection after 2 weeks
