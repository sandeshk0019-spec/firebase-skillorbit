

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutGrid,
  PanelLeft,
  Settings,
  LogOut,
  Loader2,
  Gamepad2,
  MessageSquare,
  Eye,
  CheckCircle2,
  Zap,
  Rocket
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
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { format } from 'date-fns'
import { Progress } from "@/components/ui/progress"
import { rewardTiers } from "@/lib/rewards"
import type { UserProfile } from '@/types';
import { Skeleton } from "@/components/ui/skeleton"

function AppSidebar({ userProfile, isLoading }: { userProfile: UserProfile | null, isLoading: boolean }) {
  const pathname = usePathname()
  const auth = useAuth()

  const handleSignOut = () => {
    signOut(auth)
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const totalXp = userProfile?.totalXp ?? 0;
  const nextLevelTier = rewardTiers.find(t => totalXp < t.xpThreshold);
  const currentLevelTier = [...rewardTiers].reverse().find(t => totalXp >= t.xpThreshold);
  const xpForCurrentLevelStart = currentLevelTier?.xpThreshold ?? 0;

  let progressPercentage = 0;
  let xpToNext = 0;

  if (nextLevelTier) {
    const xpForNextLevel = nextLevelTier.xpThreshold;
    const currentProgress = totalXp - xpForCurrentLevelStart;
    const totalForLevel = xpForNextLevel - xpForCurrentLevelStart;
    progressPercentage = (currentProgress / totalForLevel) * 100;
    xpToNext = xpForNextLevel - totalXp;
  }

  const NextRewardIcon = nextLevelTier?.icon;

  return (
    <Sidebar>
      <div className="flex h-full flex-col px-3 py-4">
        <SidebarHeader className="p-0 mb-8">
          <div className="flex items-center gap-3 pl-2">
            <div className="bg-blue-600/80 p-2 rounded-lg shadow-lg shadow-blue-600/40">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-headline">SO.AI</span>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0 flex flex-col">
          <SidebarMenu className="space-y-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/dashboard')} tooltip="Dashboard">
                <Link href="/dashboard">
                  <LayoutGrid />
                  <span>Dashboard</span>
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
                  <MessageSquare />
                  <span>AI Tutor</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/dashboard/dyslexia-support')} tooltip="Dyslexia Support">
                <Link href="/dashboard/dyslexia-support">
                  <Eye />
                  <span>Dyslexia Support</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/dashboard/habit-ai')} tooltip="Habit AI">
                <Link href="/dashboard/habit-ai">
                  <CheckCircle2 />
                  <span>Habit AI</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/dashboard/ai-motivation')} tooltip="AI Motivation">
                <Link href="/dashboard/ai-motivation">
                  <Zap />
                  <span>AI Motivation</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="flex-grow flex flex-col justify-center">
            <div className="p-0">
              {isLoading ? (
                  <div className="rounded-xl bg-gradient-to-br from-card/50 to-muted/30 p-4 space-y-3 border border-border/20">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-2 w-full" />
                  </div>
              ) : nextLevelTier && NextRewardIcon ? (
                  <div className="rounded-xl bg-gradient-to-br from-card/50 to-muted/30 p-4 space-y-3 border border-yellow-500/30 shadow-lg">
                      <div className="flex justify-between items-center">
                          <span className="text-sm font-bold uppercase text-yellow-400 tracking-wider">Next Reward</span>
                           <div className="relative">
                              <NextRewardIcon className={cn("w-7 h-7", nextLevelTier.color)} />
                              <div className="absolute -inset-1 border border-primary/50 rounded-full animate-glow" style={{ animationDuration: '3s' }}></div>
                          </div>
                      </div>
                      <p className="text-white font-semibold text-lg">{nextLevelTier.name}</p>
                      <Progress value={progressPercentage} className="h-2 bg-yellow-400/20 [&>div]:bg-yellow-400" />
                      <p className="text-xs text-muted-foreground text-right">{xpToNext.toLocaleString()} XP to next</p>
                  </div>
              ) : (
                   <div className="rounded-xl bg-gradient-to-br from-card/50 to-muted/30 p-4 space-y-3 border border-purple-500/30 shadow-lg">
                      <div className="flex justify-between items-center">
                          <span className="text-sm font-bold uppercase text-purple-400 tracking-wider">Max Rank</span>
                           {currentLevelTier && <currentLevelTier.icon className={cn("w-7 h-7", currentLevelTier.color)} />}
                      </div>
                      <p className="text-white font-semibold text-lg">{currentLevelTier?.name}</p>
                      <p className="text-xs text-muted-foreground">You have reached the pinnacle!</p>
                  </div>
              )}
            </div>
          </div>
          
          <SidebarMenu className="space-y-2">
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} tooltip="Log Out">
                <LogOut />
                <span>Log out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-0 mt-8" />
      </div>
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

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const sessionStartTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      return;
    }

    const userDocRef = doc(firestore, 'users', user.uid);

    const updateStudyTime = async (elapsedSeconds: number) => {
      if (elapsedSeconds <= 0) return;
      
      const todayStr = format(new Date(), 'yyyy-MM-dd');

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
            lastLogin: serverTimestamp(),
          });
        });
      } catch (e) {
        console.error("Failed to update study time:", e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (sessionStartTimeRef.current) {
          const elapsed = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
          updateStudyTime(elapsed);
          sessionStartTimeRef.current = null;
        }
      } else {
        sessionStartTimeRef.current = Date.now();
      }
    };

    const periodicSave = () => {
      if (sessionStartTimeRef.current && !document.hidden) {
        const elapsed = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
        if (elapsed > 0) {
          updateStudyTime(elapsed);
          sessionStartTimeRef.current = Date.now(); // Reset timer for next interval
        }
      }
    };
    
    // Initial setup on mount
    sessionStartTimeRef.current = Date.now();

    const intervalId = setInterval(periodicSave, 15000); // Persist every 15 seconds
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sessionStartTimeRef.current) {
        const elapsed = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
        // This fire-and-forget call can cause an unhandled promise rejection on logout,
        // as the auth state changes during the async operation.
        // We catch it to prevent a crash, logging it as a warning.
        updateStudyTime(elapsed).catch(error => {
          console.warn("Non-critical error while saving final study time on unmount:", error);
        });
      }
    };

  }, [user, isUserLoading, firestore]);

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
        <AppSidebar userProfile={userProfile} isLoading={isProfileLoading} />
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
