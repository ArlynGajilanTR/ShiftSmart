'use client';

import type React from 'react';
import { useState, useEffect } from 'react';

import {
  Calendar,
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Settings,
  LogOut,
  ClipboardList,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ChatbotGuide } from '@/components/chatbot-guide';

// Navigation items - Schedule Health icon will be dynamic
const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Calendar },
  { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
  { name: 'Employees', href: '/dashboard/employees', icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unresolvedConflictCount, setUnresolvedConflictCount] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<{ role: string; is_team_leader: boolean } | null>(
    null
  );

  // Authentication guard - check for valid token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, [router]);

  // Fetch current user data for role-based navigation
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser({
            role: userData.role,
            is_team_leader: userData.is_team_leader || false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };

    fetchCurrentUser();
  }, [isAuthenticated]);

  // Fetch unresolved conflict count for dynamic icon
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchConflictCount = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/conflicts?status=unresolved', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUnresolvedConflictCount(data.conflicts?.length ?? 0);
        }
      } catch (error) {
        console.error('Failed to fetch conflict count:', error);
      }
    };

    fetchConflictCount();
    // Poll every 30 seconds to keep icon updated
    const interval = setInterval(fetchConflictCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Dynamic Schedule Health icon based on conflict status
  const ScheduleHealthIcon =
    unresolvedConflictCount === null
      ? Shield // Loading state - neutral
      : unresolvedConflictCount === 0
        ? ShieldCheck // No conflicts - green checkmark shield
        : ShieldAlert; // Has conflicts - alert shield

  const scheduleHealthIconColor =
    unresolvedConflictCount === null
      ? ''
      : unresolvedConflictCount === 0
        ? 'text-green-500'
        : 'text-red-500';

  // Check if user can access team availability
  const canAccessTeamAvailability = currentUser?.role === 'admin' || currentUser?.is_team_leader;

  // Build navigation with dynamic entries
  const navigation = [
    ...baseNavigation,
    // My Availability - visible to all authenticated users
    {
      name: 'My Availability',
      href: '/dashboard/my-availability',
      icon: ClipboardList,
    },
    // Team Availability - only for team leaders and admins
    ...(canAccessTeamAvailability
      ? [
          {
            name: 'Team Availability',
            href: '/dashboard/team',
            icon: UsersRound,
          },
        ]
      : []),
    // Schedule Health with dynamic icon
    {
      name: 'Schedule Health',
      href: '/dashboard/conflicts',
      icon: ScheduleHealthIcon,
      iconClassName: scheduleHealthIconColor,
    },
  ];

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API to invalidate session
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage and redirect
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="h-16 p-0 border-b justify-center">
          <div className="flex items-center gap-3 px-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/r_pri_logo_rgb_color%20%281%29-zb8SoziJFx53ete2qb0nuMZV21AEdt.png"
              alt="Reuters"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href}>
                        <item.icon
                          className={'iconClassName' in item ? item.iconClassName : undefined}
                        />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Chatbot Guide */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <ChatbotGuide />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="cursor-pointer">
                <LogOut />
                <span>Log Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-semibold">
            <span className="text-gray-500">Shift</span>
            <span className="text-foreground">Smart</span>
          </h1>
          {/* </CHANGE> */}
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
