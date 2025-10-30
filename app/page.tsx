import { NextResponse } from 'next/server';

export default function Home() {
  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>ShiftSmart API</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Backend API for Reuters Breaking News shift scheduling system.
      </p>
      
      <h2 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>API Endpoints</h2>
      
      <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>Authentication</h3>
      <ul style={{ marginBottom: '20px', lineHeight: '1.8' }}>
        <li><code>POST /api/auth/login</code> - Login with email/password</li>
        <li><code>POST /api/auth/signup</code> - Register new user</li>
        <li><code>POST /api/auth/logout</code> - Logout</li>
        <li><code>GET /api/auth/session</code> - Get current user</li>
      </ul>

      <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>Employees</h3>
      <ul style={{ marginBottom: '20px', lineHeight: '1.8' }}>
        <li><code>GET /api/employees</code> - List employees</li>
        <li><code>POST /api/employees</code> - Create employee</li>
        <li><code>GET /api/employees/:id</code> - Get employee</li>
        <li><code>PUT /api/employees/:id</code> - Update employee</li>
        <li><code>DELETE /api/employees/:id</code> - Delete employee</li>
        <li><code>GET /api/employees/:id/preferences</code> - Get preferences</li>
        <li><code>PUT /api/employees/:id/preferences</code> - Update preferences</li>
      </ul>

      <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>Shifts</h3>
      <ul style={{ marginBottom: '20px', lineHeight: '1.8' }}>
        <li><code>GET /api/shifts</code> - List shifts</li>
        <li><code>POST /api/shifts</code> - Create shift</li>
        <li><code>GET /api/shifts/upcoming</code> - Upcoming shifts</li>
        <li><code>PUT /api/shifts/:id</code> - Update shift</li>
        <li><code>PATCH /api/shifts/:id</code> - Move shift</li>
        <li><code>DELETE /api/shifts/:id</code> - Delete shift</li>
      </ul>

      <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>Conflicts</h3>
      <ul style={{ marginBottom: '20px', lineHeight: '1.8' }}>
        <li><code>GET /api/conflicts</code> - List conflicts</li>
        <li><code>PATCH /api/conflicts/:id</code> - Resolve/acknowledge</li>
        <li><code>DELETE /api/conflicts/:id</code> - Dismiss</li>
      </ul>

      <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>Dashboard</h3>
      <ul style={{ marginBottom: '20px', lineHeight: '1.8' }}>
        <li><code>GET /api/dashboard/stats</code> - Get statistics</li>
      </ul>

      <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>AI Scheduling (Claude Sonnet 4.5)</h3>
      <ul style={{ marginBottom: '20px', lineHeight: '1.8' }}>
        <li><code>POST /api/ai/generate-schedule</code> - Generate AI-powered schedule</li>
        <li><code>POST /api/ai/resolve-conflict</code> - Get AI conflict resolution suggestions</li>
        <li><code>GET /api/ai/status</code> - Check AI configuration</li>
      </ul>

      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        borderLeft: '4px solid #FF6600'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          <strong>Note:</strong> All endpoints except authentication require a Bearer token in the Authorization header.
        </p>
      </div>

      <div style={{ marginTop: '30px', color: '#999', fontSize: '0.85rem' }}>
        <p>Frontend: <a href="https://github.com/ArlynGajilanTR/v0-shift-smart-frontend-development" style={{ color: '#FF6600' }}>V0 Vercel Frontend</a></p>
        <p>Version: 1.0.0</p>
      </div>
    </div>
  );
}
