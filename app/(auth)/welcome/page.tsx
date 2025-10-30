'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Header */}
          <div className="text-center mb-16">
            <div className="mb-6">
              <div className="inline-block px-4 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-700 mb-4">
                Reuters Internal Tool
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              ShiftSmart
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Intelligent shift scheduling for Reuters editorial teams with automated conflict detection and role-based validation
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <Calendar className="w-10 h-10 text-[#FF6600] mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Multi-View Scheduling</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Plan shifts by week, month, quarter, or special events with flexible date range selection
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <Users className="w-10 h-10 text-[#FF6600] mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Role-Based Balancing</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Automatic validation of skill mix to ensure proper senior/junior coverage at all times
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <Clock className="w-10 h-10 text-[#FF6600] mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Conflict Detection</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Real-time detection of scheduling conflicts, double bookings, and rest period violations
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <TrendingUp className="w-10 h-10 text-[#FF6600] mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Drag & Drop Interface</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Intuitive drag-and-drop interface for quick staff assignment with instant visual feedback
              </p>
            </div>
          </div>

          {/* Get Started Section */}
          <div className="bg-gray-50 p-10 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Access ShiftSmart</h2>
            <p className="text-gray-600 text-center mb-8">
              Use your Reuters credentials to access the scheduling system
            </p>
            
            <div className="max-w-md mx-auto space-y-3">
              <button
                onClick={() => router.push('/signup')}
                className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-medium py-3.5 rounded-md transition duration-150"
              >
                Create Account
              </button>

              <button
                onClick={() => router.push('/login')}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-3.5 rounded-md border border-gray-300 transition duration-150"
              >
                Sign In
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
              For Reuters editors and scheduling managers only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

