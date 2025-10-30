# Security Policy

## Supported Versions

ShiftSmart is currently in active development. We support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Security Model

### Internal Application

ShiftSmart is designed as an **internal application** for Reuters Breaking News teams in Milan and Rome. It is **not intended for public deployment** and operates under the following security assumptions:

- ✅ Trusted users only (Reuters staff)
- ✅ Internal network or VPN access
- ✅ No public internet exposure
- ✅ Minimal authentication (session-based)

### Authentication

- **Password Hashing:** bcryptjs with salt rounds = 10
- **Session Tokens:** Random UUID stored in database
- **Token Expiration:** Configurable (default: 7 days)
- **No OAuth:** Minimal auth for portability

### Database Security

- **Row Level Security (RLS):** Enabled on all tables
- **Permissive Policies:** Internal app with trusted users
- **Service Role Key:** Server-side only, never exposed to client
- **Anon Key:** Used for read operations with RLS enforcement

### API Security

- **Bearer Token Required:** All endpoints except `/api/auth/*`
- **Input Validation:** All user input sanitized
- **SQL Injection Protection:** Supabase client prevents injection
- **Rate Limiting:** Recommended for production (not implemented in v1.0)

---

## Known Limitations

### v1.0.0

1. **No Rate Limiting:** Consider implementing rate limiting in production
2. **No 2FA:** Basic email/password authentication only
3. **Session Management:** Simple token-based, no refresh token mechanism
4. **Permissive RLS:** All authenticated users have broad access

**Mitigation:** These are acceptable for an internal application with trusted users. Future versions may add stricter controls.

---

## Reporting a Vulnerability

### For Reuters Staff

If you discover a security vulnerability in ShiftSmart:

1. **Do NOT** open a public GitHub issue
2. **Do NOT** disclose the vulnerability publicly
3. **Contact:** Project maintainers directly via Reuters internal channels
4. **Email:** [Project Lead Email - to be configured]

### Information to Include

When reporting a vulnerability, please provide:

- **Description:** Clear description of the vulnerability
- **Impact:** What could an attacker do with this?
- **Reproduction:** Step-by-step instructions to reproduce
- **Environment:** Version, deployment environment
- **Severity:** Your assessment (Critical, High, Medium, Low)

### Example Report

```
Subject: [SECURITY] SQL Injection in Employees API

Description: The /api/employees endpoint is vulnerable to SQL injection
through the 'search' query parameter.

Impact: An attacker could read/modify database records or escalate privileges.

Reproduction:
1. Call GET /api/employees?search='; DROP TABLE users; --
2. Observe server error
3. Check database logs

Environment: ShiftSmart v1.0.0, Vercel production

Severity: Critical
```

---

## Response Timeline

We aim to respond to security reports according to the following timeline:

- **Initial Response:** Within 48 hours
- **Assessment:** Within 5 business days
- **Fix Development:** Based on severity
  - Critical: 1-3 days
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next minor release
- **Disclosure:** After fix is deployed

---

## Security Best Practices

### For Developers

1. **Never commit secrets:**
   - Use `.env.local` for local development
   - Use Vercel environment variables for production
   - Never commit `.env.local` to git

2. **Validate all input:**
   - Check data types
   - Validate UUIDs
   - Sanitize strings
   - Validate date ranges

3. **Use parameterized queries:**
   - Leverage Supabase client's built-in protection
   - Never concatenate user input into SQL

4. **Secure API keys:**
   - `SUPABASE_SERVICE_ROLE_KEY` - Server-side only
   - `ANTHROPIC_API_KEY` - Server-side only
   - Never log sensitive keys

5. **Review permissions:**
   - Follow principle of least privilege
   - Review RLS policies regularly
   - Audit access logs

### For Deployers

1. **Environment Variables:**
   - Use Vercel's encrypted environment variables
   - Rotate keys periodically
   - Use separate keys for staging/production

2. **Database Access:**
   - Use connection pooling
   - Enable SSL for database connections
   - Regularly update Supabase project

3. **Monitoring:**
   - Monitor API usage patterns
   - Set up alerts for unusual activity
   - Review audit logs regularly

4. **Backup:**
   - Enable Supabase automatic backups
   - Test restore procedures
   - Document disaster recovery plan

---

## Security Checklist for Production

Before deploying to production:

- [ ] All environment variables configured
- [ ] Service role key secured (never exposed to client)
- [ ] Default passwords changed for seeded users
- [ ] Database backups enabled
- [ ] SSL/TLS enabled for all connections
- [ ] Access restricted to internal network/VPN
- [ ] Logging and monitoring configured
- [ ] Incident response plan documented
- [ ] Security review completed
- [ ] Penetration testing performed (optional but recommended)

---

## Third-Party Dependencies

ShiftSmart relies on the following third-party services:

| Service | Purpose | Security Measures |
|---------|---------|------------------|
| **Supabase** | Database & Auth | RLS, SSL, automatic backups |
| **Anthropic** | AI Scheduling | API key authentication, rate limiting |
| **Vercel** | Hosting | Edge functions, DDoS protection, SSL |

### Dependency Security

- Regularly update npm packages: `npm audit`
- Monitor GitHub Dependabot alerts
- Review security advisories for critical dependencies

---

## Compliance

### Data Privacy

- **GDPR:** Consider employee data as personal information
- **Retention:** Define data retention policies
- **Access:** Limit access to authorized personnel only

### Audit Trail

ShiftSmart maintains an audit log for:
- User authentication events
- Shift assignments/changes
- Conflict resolutions
- Administrative actions

**Retention:** Configure based on organizational policy.

---

## Updates and Patches

Security updates will be released as:
- **Patch versions** for minor security fixes (e.g., 1.0.1)
- **Minor versions** for moderate security improvements (e.g., 1.1.0)
- **Major versions** for significant security overhauls (e.g., 2.0.0)

Subscribe to GitHub releases for security notifications.

---

## Contact

For security questions or concerns:

- **GitHub Issues:** For non-security bugs
- **Security Reports:** Use responsible disclosure process above
- **General Questions:** See CONTRIBUTING.md

---

**Last Updated:** October 30, 2025  
**Version:** 1.0.0  
**Maintained by:** Reuters Breaking News Team

