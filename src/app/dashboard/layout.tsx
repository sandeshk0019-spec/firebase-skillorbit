"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import {
  BrainCircuit,
  Home,
  Webhook,
  PanelLeft,
  Cpu,
  Settings,
  LogOut,
  Loader2,
  Gamepad2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { format } from 'date-fns'

function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const auth = useAuth()

  const handleSignOut = () => {
    signOut(auth)
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-semibold font-headline">SkillOrbit</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard')} tooltip="Dashboard">
              <Link href="/dashboard">
                <Home />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/quiz')} tooltip="AI Quiz Generator">
              <Link href="/dashboard/quiz">
                <Cpu />
                <span>AI Quiz</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/game-zone')} tooltip="Game Zone">
              <Link href="/dashboard/game-zone">
                <Gamepad2 />
                <span>Game Zone</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/tutor')} tooltip="AI Tutor">
              <Link href="/dashboard/tutor">
                <BrainCircuit />
                <span>AI Tutor</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/dyslexia-support')} tooltip="Dyslexia Support">
              <Link href="/dashboard/dyslexia-support">
                <Webhook />
                <span>Speech Tools</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-9 w-9 border-2 border-primary/50 animate-glow">
                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt={user.email || 'user'} data-ai-hint="person face" />
                <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{user.displayName || user.email}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">{user.email}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        ) : (
           <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 border-2 border-primary/50 animate-glow">
              <AvatarImage src="https://picsum.photos/seed/avatar/40/40" alt="@student" data-ai-hint="person face" />
              <AvatarFallback>S</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Student</span>
              <span className="text-xs text-sidebar-foreground/70">student@email.com</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // ----- START: New Study Time Tracker Logic -----
  const sessionStartTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      return;
    }

    const userDocRef = doc(firestore, 'users', user.uid);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const updateStudyTime = async (elapsedSeconds: number) => {
      if (elapsedSeconds <= 0) return;
      
      try {
        await runTransaction(firestore, async (transaction) => {
          const userDoc = await transaction.get(userDocRef);
          if (!userDoc.exists()) return;

          const data = userDoc.data();
          const lastActive = data.lastActiveDate;
          
          const dailyTime = lastActive === todayStr ? (data.studyTimeToday || 0) : 0;
          const newDailyTime = dailyTime + elapsedSeconds;

          const totalTime = data.totalStudyTime || 0;
          const newTotalTime = totalTime + elapsedSeconds;

          transaction.update(userDocRef, {
            studyTimeToday: newDailyTime,
            totalStudyTime: newTotalTime,
            lastActiveDate: todayStr,
            lastLogin: serverTimestamp(), // Also update last login on activity
          });
        });
      } catch (e) {
        console.error("Failed to update study time:", e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App is backgrounded or tab is switched
        if (sessionStartTimeRef.current) {
          const elapsed = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
          updateStudyTime(elapsed);
          sessionStartTimeRef.current = null; // Pause the timer
        }
      } else {
        // App is foregrounded
        sessionStartTimeRef.current = Date.now(); // Resume the timer
      }
    };
    
    // Initial setup on mount
    sessionStartTimeRef.current = Date.now();
    getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.lastActiveDate !== todayStr) {
                // First session of the day, reset daily time
                runTransaction(firestore, async (transaction) => {
                    transaction.update(userDocRef, {
                        studyTimeToday: 0,
                        lastActiveDate: todayStr,
                    });
                });
            }
        }
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sessionStartTimeRef.current) {
        const elapsed = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
        updateStudyTime(elapsed); // Save final session time
      }
    };

  }, [user, isUserLoading, firestore]);
  // ----- END: New Study Time Tracker Logic -----

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
           <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden"/>
            <div className="flex-1">
              <h1 className="text-lg font-semibold md:text-xl font-headline">
                {/* Title could be dynamic based on page */}
              </h1>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
