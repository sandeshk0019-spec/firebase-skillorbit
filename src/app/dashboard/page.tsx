
"use client";

import { useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, TrendingUp, Trophy, BrainCircuit, Gamepad2, AlertTriangle } from 'lucide-react';
import { type UserProfile } from '@/types';

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <Card className="bg-card/50">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDoc<UserProfile>(userDocRef);

    const isLoading = isAuthLoading || isProfileLoading;
    
    const overallAccuracy = useMemo(() => {
        if (!userProfile || !userProfile.totalQuestionsAnswered || userProfile.totalQuestionsAnswered === 0) return 0;
        return Math.round(((userProfile.totalCorrectAnswers || 0) / userProfile.totalQuestionsAnswered) * 100);
    }, [userProfile]);

    if (profileError) {
      return (
        <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
            <Card className="bg-destructive/10 border-destructive max-w-lg">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle /> Data Access Error
                    </CardTitle>
                    <CardDescription className="text-destructive/80">
                        Could not load your primary profile data. This may be due to Firestore security rules or a network issue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="font-semibold">Error Details:</p>
                    <pre className="text-xs text-destructive/90 font-mono bg-background/50 p-2 rounded-md overflow-x-auto">
                        {profileError.message}
                    </pre>
                </CardContent>
            </Card>
        </div>
      )
    }

    if (isLoading) {
        return <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in-0 duration-500">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-primary/50 animate-glow">
                    <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/80/80`} data-ai-hint="person face" />
                    <AvatarFallback>{userProfile?.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="font-headline text-3xl font-bold">Welcome back, {userProfile?.firstName || 'Voyager'}!</h1>
                    <p className="text-muted-foreground">Here is your high-level progress matrix.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Overall Accuracy" value={`${overallAccuracy}%`} icon={TrendingUp} />
                <StatCard title="Quizzes Completed" value={userProfile?.totalQuizzes || 0} icon={BrainCircuit} />
                <StatCard title="Games Played" value={userProfile?.gamesPlayed || 0} icon={Gamepad2} />
            </div>

            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary"/>Feature Unlocks</CardTitle>
                    <CardDescription>More detailed charts, activity feeds, and achievements are coming soon.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                       <p>Complete quizzes and play games to unlock more dashboard features!</p>
                   </div>
                </CardContent>
            </Card>
        </div>
    );
}
