'use client';

import { useState } from 'react';
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
import { User, Lock, Mail, Phone, Briefcase, MapPin } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: 'John Smith',
    email: 'john.smith@reuters.com',
    phone: '+39 02 1234 5678',
    title: 'senior-editor',
    bureau: 'milan',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = () => {
    // Handle save logic here
    console.log('Saving settings:', formData);
  };

  const handlePasswordChange = () => {
    // Handle password change logic here
    console.log('Changing password');
  };

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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="transition-all focus:ring-2 focus:ring-primary"
              />
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Title / Role
              </Label>
              <Select
                value={formData.title}
                onValueChange={(value) => setFormData({ ...formData, title: value })}
              >
                <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="senior-editor">Senior Editor</SelectItem>
                  <SelectItem value="junior-editor">Junior Editor</SelectItem>
                  <SelectItem value="lead-editor">Lead Editor</SelectItem>
                  <SelectItem value="support-staff">Support Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bureau" className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Bureau Location
              </Label>
              <Select
                value={formData.bureau}
                onValueChange={(value) => setFormData({ ...formData, bureau: value })}
              >
                <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="milan">Milan</SelectItem>
                  <SelectItem value="rome">Rome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />

            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1 hover:scale-105 transition-transform">
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="flex-1 hover:bg-gray-100 transition-colors bg-transparent"
                onClick={() => {
                  // Reset form
                  setFormData({
                    name: 'John Smith',
                    email: 'john.smith@reuters.com',
                    phone: '+39 02 1234 5678',
                    title: 'senior-editor',
                    bureau: 'milan',
                  });
                }}
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
                className="flex-1 bg-charcoal hover:bg-charcoal/90 hover:scale-105 transition-transform"
              >
                Update Password
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
