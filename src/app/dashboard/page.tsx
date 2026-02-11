

"use client";

import { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { type UserProfile, type Achievement } from '@/types';
import { Flame, BrainCircuit, Gamepad2, CheckSquare, Clock, Percent, Trophy, Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { rewardTiers } from '@/lib/rewards';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

// --- Reusable Components ---

const OrbitAnimation = () => (
  <div className="new-orbit-container w-48 h-48">
    <div className="new-orbit-inner">
      <div className="central-core" />
      <div className="orbit-path one">
        <div className="orbit-planet" />
      </div>
      <div className="orbit-path two">
        <div className="orbit-planet" />
      </div>
      <div className="orbit-path three">
        <div className="orbit-planet" />
      </div>
    </div>
  </div>
);


const HolographicCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("holographic-card rounded-2xl p-6 hud-brackets", className)}>
    {children}
  </div>
);

const StatCard = ({ icon, label, value, delay }: { icon: React.ElementType, label: string, value: string, delay: string }) => {
  const Icon = icon;
  return (
    <HolographicCard className={cn("load-hidden", delay)}>
      <div className="flex flex-col items-center text-center">
        <Icon className="w-8 h-8 text-primary mb-3" />
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-bold font-headline text-pulse">{value}</p>
      </div>
    </HolographicCard>
  );
};

const RewardsTracker = () => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const achievementsRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'achievements') : null),
    [firestore, user]
  );
  const { data: unlockedAchievements, isLoading: areAchievementsLoading } = useCollection<Achievement>(achievementsRef);
  
  const unlockedIds = useMemo(() => new Set(unlockedAchievements?.map(a => a.achievementId)), [unlockedAchievements]);

  if (isUserLoading || areAchievementsLoading) {
    return <HolographicCard className="lg:col-span-3 load-hidden delay-600"><Skeleton className="h-40 w-full" /></HolographicCard>;
  }

  return (
    <HolographicCard className="lg:col-span-3 load-hidden delay-600">
        <h3 className="text-xl font-headline text-secondary mb-4 text-pulse">Reward Tiers</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {rewardTiers.map(tier => {
                const isUnlocked = unlockedIds.has(tier.id);
                const Icon = tier.icon;
                return (
                    <div key={tier.id} className={cn("p-4 rounded-lg flex flex-col items-center justify-start transition-all", isUnlocked ? "bg-primary/10" : "bg-muted/30 opacity-60")}>
                        <div className={cn("relative w-16 h-16 flex items-center justify-center rounded-full mb-3", isUnlocked ? 'bg-primary/20' : 'bg-muted/50')}>
                             <Icon className={cn("w-8 h-8", isUnlocked ? tier.color : "text-muted-foreground")} />
                             {isUnlocked ? (
                                <CheckCircle className="absolute -bottom-1 -right-1 w-6 h-6 text-green-400 bg-background rounded-full p-0.5" />
                             ) : (
                                <Lock className="absolute -bottom-1 -right-1 w-6 h-6 text-muted-foreground bg-muted p-1 rounded-full" />
                             )}
                             {isUnlocked && <div className="absolute inset-0 border-2 border-primary rounded-full animate-glow" style={{animationDuration: '3s'}}></div>}
                        </div>
                        <p className={cn("font-bold text-sm", isUnlocked ? 'text-primary-foreground' : 'text-muted-foreground')}>{tier.name}</p>
                        <p className="text-xs text-muted-foreground">{tier.xpThreshold.toLocaleString()} XP</p>
                    </div>
                )
            })}
        </div>
    </HolographicCard>
  )
}

// --- Main Dashboard Component ---

export default function DashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [liveStudyTimeToday, setLiveStudyTimeToday] = useState(0);

  useEffect(() => {
    if (userProfile?.studyTimeToday !== undefined) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      if (userProfile.lastActiveDate === todayStr) {
        setLiveStudyTimeToday(userProfile.studyTimeToday);
      } else {
        setLiveStudyTimeToday(0);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        setLiveStudyTimeToday((prevTime) => prevTime + 1);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const streak = userProfile?.currentStreak ?? 0;
  
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const tasksDoneToday = userProfile?.lastActiveDate === todayStr ? (userProfile?.tasksDoneToday || 0) : 0;
  
  const accuracy = (userProfile?.totalQuestionsAnswered ?? 0) > 0
    ? Math.round(((userProfile?.totalCorrectAnswers ?? 0) / userProfile.totalQuestionsAnswered) * 100)
    : 0;

  const totalXp = userProfile?.totalXp ?? 0;
  const currentLevelTier = [...rewardTiers].reverse().find(t => totalXp >= t.xpThreshold);
  const nextLevelTier = rewardTiers.find(t => totalXp < t.xpThreshold);
  const xpForCurrentLevelStart = currentLevelTier?.xpThreshold ?? 0;
  const xpForNextLevel = nextLevelTier?.xpThreshold ?? (currentLevelTier ? (currentLevelTier.xpThreshold + 1000) : 100);
  const progressPercentage = (totalXp - xpForCurrentLevelStart) / (xpForNextLevel - xpForCurrentLevelStart);
  const xpProgressDegrees = Math.min(progressPercentage * 360, 360);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn('p-2 sm:p-4 md:p-6', isLoaded ? 'loaded' : '')}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex justify-between items-center load-hidden delay-100">
          <h1 className="glitch text-2xl md:text-3xl font-headline" data-text="SKILLORBIT.AI">SKILLORBIT.AI</h1>
          <div className="holographic-card rounded-full px-4 py-2 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span className="font-bold">Streak:</span>
            <span className="font-mono text-lg text-amber-300 text-pulse">{isProfileLoading ? '...' : streak}</span>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Hero Card */}
          <HolographicCard className="lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6 load-hidden delay-200 overflow-visible">
            <div className="space-y-4">
              <h2 className="text-3xl font-headline text-secondary text-pulse">Personalized Orbit Active</h2>
              <p className="text-muted-foreground max-w-md">
                Welcome back, {user?.displayName || 'Voyager'}. Your learning matrix is synchronized. Engage with AI-driven tasks or enter the Game Zone.
              </p>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-background" asChild>
                  <Link href="/dashboard/tutor">
                    <BrainCircuit className="mr-2"/> Initiate AI Tutor
                  </Link>
                </Button>
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80" asChild>
                  <Link href="/dashboard/game-zone">
                    <Gamepad2 className="mr-2"/> Enter Game Zone
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex-shrink-0">
               <OrbitAnimation />
            </div>
          </HolographicCard>

          {/* XP Widget */}
          <HolographicCard className="flex flex-col items-center justify-center text-center load-hidden delay-300">
             <div 
              className="relative w-40 h-40 flex items-center justify-center rounded-full p-2" 
              style={{ background: `radial-gradient(circle, hsl(var(--secondary)/0.3) 0%, transparent 70%), conic-gradient(hsl(var(--primary)) ${xpProgressDegrees}deg, hsl(var(--muted)) 0deg)` }}
            >
              <div className="absolute inset-2 rounded-full bg-background flex flex-col items-center justify-center">
                 {currentLevelTier ? <currentLevelTier.icon className={cn("w-10 h-10", currentLevelTier.color)} /> : <Trophy className="w-12 h-12 text-primary/70 text-pulse" />}
                 <p className="text-xs font-bold mt-1 text-muted-foreground">{currentLevelTier?.name ?? 'Voyager'}</p>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">Total XP</p>
            <p className="text-3xl font-bold font-headline text-pulse">{isProfileLoading ? '...' : totalXp.toLocaleString()}</p>
          </HolographicCard>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard icon={CheckSquare} label="Tasks Done Today" value={isProfileLoading ? "..." : String(tasksDoneToday)} delay="delay-300" />
          <StatCard icon={Clock} label="Today's Study Time" value={isProfileLoading ? "..." : `${Math.floor(liveStudyTimeToday / 3600)}h ${Math.floor((liveStudyTimeToday % 3600) / 60)}m`} delay="delay-400" />
          <StatCard icon={Percent} label="Average Accuracy" value={isProfileLoading ? "..." : `${accuracy}%`} delay="delay-500" />
        </div>

        <RewardsTracker />
      </div>
    </div>
  );
}
