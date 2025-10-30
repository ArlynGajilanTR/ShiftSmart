'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bureau, setBureau] = useState('');
  const [team, setTeam] = useState('Breaking News');
  const [role, setRole] = useState<'senior' | 'junior' | 'lead' | 'support'>('junior');
  const [bureaus, setBureaus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadBureaus();
  }, []);

  async function loadBureaus() {
    const { data } = await supabase
      .from('bureaus')
      .select('id, name, code')
      .order('name');
    
    if (data) {
      setBureaus(data);
      // Auto-select first bureau if available
      if (data.length > 0) {
        setBureau(data[0].id);
      }
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate bureau selection
      if (!bureau) {
        setError('Please select a bureau');
        return;
      }

      // Sign up the user
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (signupError) throw signupError;

      // Create user profile in users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: 'staff', // Default role
            shift_role: role,
            bureau_id: bureau,
            preferences: {
              team: team,
            }
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't throw - auth account is created, profile can be fixed later
        }
      }

      // Check if we need email confirmation
      if (data.user && !data.session) {
        setSuccess(true);
        setError('Please check your email to confirm your account.');
        return;
      }

      // If signed up successfully, check for bureau assignment
      if (data.user) {
        // New users typically won't have a bureau yet
        // Admin needs to assign them to a bureau first
        router.push('/select-bureau');
        router.refresh();
      }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600 text-sm">Reuters Editorial Scheduling</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            Account created! Please check your email to confirm.
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF6600] focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF6600] focus:border-transparent"
                placeholder="you@reuters.com"
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
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF6600] focus:border-transparent"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="bureau" className="block text-sm font-medium text-gray-700 mb-2">
                Bureau
              </label>
              <select
                id="bureau"
                value={bureau}
                onChange={(e) => setBureau(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF6600] focus:border-transparent"
              >
                <option value="">Select bureau...</option>
                {bureaus.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <input
                id="team"
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF6600] focus:border-transparent bg-gray-50"
                placeholder="Breaking News"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">All users are part of Breaking News for MVP</p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role Level
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF6600] focus:border-transparent"
              >
                <option value="junior">Junior Editor</option>
                <option value="senior">Senior Editor</option>
                <option value="lead">Lead Editor</option>
                <option value="support">Support Staff</option>
              </select>
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-[#FF6600] hover:text-[#E65C00] font-medium transition">
            Already have an account? Sign in
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}

