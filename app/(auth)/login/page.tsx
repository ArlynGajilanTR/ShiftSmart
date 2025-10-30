'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has a bureau assigned
      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('bureau_id')
          .eq('id', data.user.id)
          .single();

        if (userData?.bureau_id) {
          // User has a bureau, go straight to dashboard
          sessionStorage.setItem('selectedBureau', userData.bureau_id);
          router.push('/dashboard');
        } else {
          // No bureau assigned, go to selection page
          router.push('/select-bureau');
        }
      }
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <a href="/welcome" className="text-sm text-gray-600 hover:text-[#FF6600] transition">
            ← Back
          </a>
        </div>
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ShiftSmart</h1>
          <p className="text-gray-600 text-sm">Reuters Editorial Scheduling</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-medium py-3 rounded-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <div>
            <a href="/signup" className="text-sm text-[#FF6600] hover:text-[#E65C00] font-medium transition">
              Don't have an account? Sign up
            </a>
          </div>
          <div>
            <a href="/auth/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 transition">
              Forgot password?
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

