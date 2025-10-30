'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Bureau } from '@/types';
import { Building2 } from 'lucide-react';

export default function SelectBureauPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [selectedBureau, setSelectedBureau] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadUserAndBureaus();
  }, []);

  // If user already has a bureau and there's a session bureau, redirect to dashboard
  useEffect(() => {
    if (user?.bureau_id && !loading) {
      const storedBureau = sessionStorage.getItem('selectedBureau');
      if (storedBureau === user.bureau_id) {
        // Already have the right bureau selected, go to dashboard
        router.push('/dashboard');
      } else {
        // Set the user's bureau and redirect
        sessionStorage.setItem('selectedBureau', user.bureau_id);
        setSelectedBureau(user.bureau_id);
      }
    }
  }, [user, loading, router]);

  async function loadUserAndBureaus() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
        return;
      }

      // Fetch user details
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser(userData);

      // Fetch available bureaus
      const { data: bureauData } = await supabase
        .from('bureaus')
        .select('*')
        .order('name');

      setBureaus(bureauData || []);
      
      if (userData?.bureau_id) {
        setSelectedBureau(userData.bureau_id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleContinue = () => {
    if (selectedBureau) {
      // Store selected bureau in session
      sessionStorage.setItem('selectedBureau', selectedBureau);
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome{user ? `, ${user.full_name}` : ''}
            </h1>
            <p className="text-lg text-gray-600">
              Select your bureau to continue
            </p>
          </div>

          {/* Bureau Selection */}
          <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-[#FF6600]" />
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Bureau</h2>
            </div>
            
            {bureaus.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No bureaus available yet.</p>
                <p className="text-sm text-gray-500">
                  Please contact your administrator to set up a bureau.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {bureaus.map((bureau) => (
                    <label
                      key={bureau.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedBureau === bureau.id
                          ? 'border-[#FF6600] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bureau"
                        value={bureau.id}
                        checked={selectedBureau === bureau.id}
                        onChange={(e) => setSelectedBureau(e.target.value)}
                        className="w-4 h-4 text-[#FF6600]"
                      />
                      <div className="ml-4">
                        <div className="font-semibold text-gray-900">{bureau.name}</div>
                        <div className="text-sm text-gray-600">{bureau.code}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleContinue}
                  disabled={!selectedBureau}
                  className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-medium py-4 rounded-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

