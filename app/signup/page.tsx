'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Mail } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/r_pri_logo_rgb_color%20%281%29-zb8SoziJFx53ete2qb0nuMZV21AEdt.png"
              alt="Reuters"
              className="h-12 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Access Request Info */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Request Access</CardTitle>
            <CardDescription>
              ShiftSmart accounts are managed by your team administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>For Reuters Breaking News staff:</strong>
              </p>
              <p>
                Contact your bureau editor or team lead to request access to ShiftSmart. They will
                set up your account with the appropriate permissions.
              </p>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:gavin.jones@thomsonreuters.com?subject=ShiftSmart%20Access%20Request&body=Hi%2C%0A%0AI%20would%20like%20to%20request%20access%20to%20ShiftSmart.%0A%0AName%3A%20%0ABureau%3A%20Milan%20%2F%20Rome%0ARole%3A%20%0A%0AThank%20you!">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Bureau Editor
                </a>
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
