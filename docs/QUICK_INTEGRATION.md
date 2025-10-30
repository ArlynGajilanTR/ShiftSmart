# ShiftSmart - Quick Integration (5 Minutes)

**Connect your V0 frontend to the backend API in 5 steps.**

---

## Step 1: Get Your API URL (30 seconds)

Go to your Vercel dashboard and find your deployed API:
```
https://shift-smart-YOUR-ID.vercel.app
```

Copy this URL.

---

## Step 2: Add Environment Variable (30 seconds)

In your V0 frontend project root, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://shift-smart-YOUR-ID.vercel.app
```

(Replace with your actual Vercel URL)

---

## Step 3: Copy API Client (1 minute)

1. Copy the file `docs/api-client.ts` from the backend repo
2. Place it in your V0 frontend at: `lib/api-client.ts`

**Or copy from here:** [api-client.ts](./api-client.ts)

---

## Step 4: Update Login Page (2 minutes)

**File:** Your login page (e.g., `app/login/page.tsx`)

Replace your mock login with:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.auth.login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
```

---

## Step 5: Test! (1 minute)

```bash
npm run dev
```

Try logging in with:
- **Email:** `gianluca.semeraro@thomsonreuters.com`
- **Password:** `changeme`

✅ If you get redirected to dashboard = **SUCCESS!**

---

## Next: Wire Up Your Pages

Now that login works, wire up your other pages:

### Dashboard
```typescript
const statsData = await api.dashboard.getStats();
const shiftsData = await api.shifts.upcoming(7);
```

### Employee List
```typescript
const data = await api.employees.list({ bureau: 'Milan' });
```

### Schedule/Calendar
```typescript
const data = await api.shifts.list({
  start_date: '2025-11-01',
  end_date: '2025-11-30'
});
```

### Drag-and-Drop
```typescript
await api.shifts.move(shiftId, newDate, startTime, endTime);
```

---

## 🐛 Troubleshooting

**"No authentication token found"**
- Make sure you logged in first
- Check localStorage: `localStorage.getItem('auth_token')`

**CORS errors**
- Contact backend team to add your frontend URL to CORS whitelist

**401 Unauthorized**
- Token expired, log in again
- Or check that token is being sent in Authorization header

---

## 📚 Full Documentation

See [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) for:
- Complete API client code
- All 24 endpoint examples
- Component-by-component integration
- Error handling patterns
- TypeScript types

---

## 🚀 You're Connected!

Your V0 frontend is now talking to the real backend API with:
- ✅ 15 real Breaking News employees
- ✅ Authentication system
- ✅ Shift management
- ✅ Conflict detection
- ✅ AI scheduling (when configured)

**Questions?** Check the [API_REFERENCE.md](../API_REFERENCE.md) for all endpoint details.

