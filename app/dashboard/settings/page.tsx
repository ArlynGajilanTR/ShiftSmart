'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { User, Lock, Mail, Phone, Briefcase, MapPin, Loader2 } from 'lucide-react';
import { api, getCurrentUser } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    bureau: '',
  });

  // Store original data to enable cancel/reset
  const [originalData, setOriginalData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    bureau: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // First try to get fresh data from API
        const { user } = await api.users.getProfile();
        const userData = {
          name: user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
          title: user.title || '',
          bureau: user.bureau_id || '',
        };
        setFormData(userData);
        setOriginalData(userData);
      } catch (error) {
        // Fallback to localStorage if API fails
        const localUser = getCurrentUser();
        if (localUser) {
          const userData = {
            name: localUser.full_name || '',
            email: localUser.email || '',
            phone: localUser.phone || '',
            title: localUser.title || '',
            bureau: localUser.bureau_id || '',
          };
          setFormData(userData);
          setOriginalData(userData);
        }
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { user } = await api.users.updateProfile({
        full_name: formData.name,
        phone: formData.phone || null,
      });

      // Update original data to reflect saved state
      const updatedData = {
        name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        title: user.title || '',
        bureau: user.bureau_id || '',
      };
      setOriginalData(updatedData);
      setFormData(updatedData);

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'New password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.users.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });

      // Clear password fields on success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold">
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="transition-all focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="transition-all focus:ring-2 focus:ring-primary bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="transition-all focus:ring-2 focus:ring-primary"
                placeholder="+39 02 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Title / Role
              </Label>
              <Input
                id="title"
                value={formData.title}
                disabled
                className="transition-all bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact your administrator to change your title
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bureau" className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Bureau Location
              </Label>
              <Select value={formData.bureau} disabled>
                <SelectTrigger className="transition-all bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ITA-MILAN">Milan</SelectItem>
                  <SelectItem value="ITA-ROME">Rome</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Contact your administrator to change your bureau
              </p>
            </div>

            <Separator className="my-4" />

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 hover:scale-105 transition-transform"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 hover:bg-gray-100 transition-colors bg-transparent"
                onClick={() => {
                  // Reset to original data
                  setFormData(originalData);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-charcoal">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-charcoal" />
              Change Password
            </CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="font-semibold">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="transition-all focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="font-semibold">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="transition-all focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="font-semibold">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="transition-all focus:ring-2 focus:ring-primary"
              />
            </div>

            <Separator className="my-4" />

            <div className="flex gap-3">
              <Button
                onClick={handlePasswordChange}
                disabled={
                  isChangingPassword ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
                className="flex-1 bg-charcoal hover:bg-charcoal/90 hover:scale-105 transition-transform"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 hover:bg-gray-100 transition-colors bg-transparent"
                onClick={() => {
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your ShiftSmart experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for schedule changes and conflicts
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-gray-100 transition-colors bg-transparent"
            >
              Configure
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Default Calendar View</p>
              <p className="text-sm text-muted-foreground">
                Choose your preferred calendar view on dashboard
              </p>
            </div>
            <Select defaultValue="week">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
