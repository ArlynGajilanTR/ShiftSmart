'use client';

import type React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    bureau_id: '',
    role: '',
    title: '',
    shift_role: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Real API signup
      await api.auth.signup({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        bureau_id: formData.bureau_id,
        role: formData.role,
        title: formData.title,
        shift_role: formData.shift_role,
      });

      toast({
        title: 'Account created',
        description: 'Welcome to ShiftSmart! Please log in.',
      });

      router.push('/login');
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Signup Form */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
            <CardDescription>
              Set up your ShiftSmart account with your Reuters credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Reuters Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="first.last@thomsonreuters.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bureau">Bureau</Label>
                <Select
                  value={formData.bureau_id}
                  onValueChange={(value) => setFormData({ ...formData, bureau_id: value })}
                >
                  <SelectTrigger id="bureau">
                    <SelectValue placeholder="Select your bureau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ITA-MILAN">Milan</SelectItem>
                    <SelectItem value="ITA-ROME">Rome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.shift_role}
                  onValueChange={(value) => {
                    const titleMap: any = {
                      editor: 'Breaking News Editor',
                      senior: 'Senior Breaking News Correspondent',
                      correspondent: 'Breaking News Correspondent',
                    };
                    setFormData({
                      ...formData,
                      shift_role: value,
                      role: 'Breaking News',
                      title: titleMap[value] || value,
                    });
                  }}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="senior">Senior Correspondent</SelectItem>
                    <SelectItem value="correspondent">Correspondent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
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
