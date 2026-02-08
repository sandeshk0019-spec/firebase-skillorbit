"use client";

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { type UserProfile } from '@/types';
import { Flame, BrainCircuit, Gamepad2, CheckSquare, Clock, Percent, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// --- Reusable Components ---

const OrbitAnimation = () => (
  <div className="orbit-container w-40 h-40">
    <div className="orbit">
      <div className="orbit-ring orbit-ring-1"></div>
      <div className="orbit-ring orbit-ring-2"></div>
      <div className="orbit-ring orbit-ring-3"></div>
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

  const streak = userProfile?.currentStreak ?? 0;

  // Calculate dynamic stats
  const tasksDone = (userProfile?.totalQuizzes || 0) + (userProfile?.gamesPlayed || 0);

  const totalMinutes = userProfile?.totalStudyTime ?? 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const studyTime = `${hours}h ${minutes}m`;
  
  const accuracy = (userProfile?.totalQuestionsAnswered ?? 0) > 0
    ? Math.round(((userProfile?.totalCorrectAnswers ?? 0) / userProfile.totalQuestionsAnswered) * 100)
    : 0;

  const totalXp = (userProfile?.totalCorrectAnswers || 0) * 10 + (userProfile?.gamesPlayed || 0) * 50;
  const xpForLevel = 1000;
  const xpProgress = (totalXp % xpForLevel) / xpForLevel * 360;


  useEffect(() => {
    // Trigger entry animations
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Warp Speed Background Effect
    const canvas = document.getElementById('warp-speed') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    let stars: { x: number; y: number; z: number; }[] = [];
    const numStars = 800;
    const speed = 3;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    for (let i = 0; i < numStars; i++) {
      stars[i] = {
        x: Math.random() * canvas.width - canvas.width / 2,
        y: Math.random() * canvas.height - canvas.height / 2,
        z: Math.random() * canvas.width
      };
    }

    const draw = () => {
      ctx.fillStyle = "hsl(var(--background))";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      for (let i = 0; i < numStars; i++) {
        stars[i].z -= speed;
        if (stars[i].z <= 0) {
          stars[i].z = canvas.width;
        }

        const k = 128 / stars[i].z;
        const px = stars[i].x * k;
        const py = stars[i].y * k;
        const size = (1 - stars[i].z / canvas.width) * 4;
        
        ctx.beginPath();
        ctx.fillStyle = `rgba(200, 225, 255, ${1 - stars[i].z / canvas.width})`;
        ctx.arc(px, py, size/2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    let animationFrameId: number;
    const render = () => {
      draw();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  return (
    <div className={cn('p-2 sm:p-4 md:p-6', isLoaded ? 'loaded' : '')}>
      <canvas id="warp-speed"></canvas>
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
          <HolographicCard className="lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6 load-hidden delay-200">
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
              style={{ background: `radial-gradient(circle, hsl(var(--secondary)/0.3) 0%, transparent 70%), conic-gradient(hsl(var(--primary)) ${xpProgress}deg, hsl(var(--muted)) 0deg)` }}
            >
              <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                 <Trophy className="w-12 h-12 text-primary/70 text-pulse" />
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">Total XP</p>
            <p className="text-3xl font-bold font-headline text-pulse">{isProfileLoading ? '...' : totalXp.toLocaleString()}</p>
          </HolographicCard>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard icon={CheckSquare} label="Tasks Done" value={isProfileLoading ? "..." : String(tasksDone)} delay="delay-300" />
          <StatCard icon={Clock} label="Study Time" value={isProfileLoading ? "..." : studyTime} delay="delay-400" />
          <StatCard icon={Percent} label="Accuracy" value={isProfileLoading ? "..." : `${accuracy}%`} delay="delay-500" />
        </div>
      </div>
    </div>
  );
}
