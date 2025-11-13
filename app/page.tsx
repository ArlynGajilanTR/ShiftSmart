import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, AlertCircle, Clock } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/r_pri_logo_rgb_color%20%281%29-zb8SoziJFx53ete2qb0nuMZV21AEdt.png"
              alt="Reuters"
              className="h-12 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button className="font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 relative">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/RTX3Q276.png-APo5PcMsvnggNPUIfd20lvje0XM1GS.jpeg)',
          }}
        />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-white/90" />

        {/* Content */}
        <div className="max-w-4xl w-full relative z-10">
          <h1 className="text-6xl font-bold mb-6 text-balance tracking-tight">
            <span className="text-gray-500">Shift</span>
            <span className="text-foreground">Smart</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 text-balance max-w-2xl font-medium leading-relaxed">
            Intelligent shift scheduling for Reuters editorial teams.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex gap-4 items-start">
              <Calendar className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold mb-1">Multi-View Scheduling</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Plan shifts across week, month, quarter, or custom date ranges with intuitive
                  calendar views.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold mb-1">Role-Based Balancing</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Ensure proper skill mix with automated validation of senior, junior, and lead
                  editor coverage.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold mb-1">Smart Conflict Detection</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Prevent double bookings, rest period violations, and skill gaps with real-time
                  validation.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold mb-1">Cross-Bureau Coordination</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Seamlessly manage Breaking News team schedules across Milan and Rome bureaus.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-6 shadow-sm">
        <div className="container mx-auto px-6 text-sm text-muted-foreground">
          <p className="font-medium">
            ShiftSmart v1 - Internal Reuters Tool for Breaking News Team
          </p>
        </div>
      </footer>
    </div>
  );
}
