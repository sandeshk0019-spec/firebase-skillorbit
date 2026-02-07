"use client";

import { useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, TrendingUp, History, Trophy, BrainCircuit, Gamepad2 } from 'lucide-react';
import { type UserProfile, type QuizAttempt, type Activity, type Achievement as AchievementType } from '@/types';
import { achievements } from '@/lib/achievements';
import { formatDistanceToNow } from 'date-fns';
import { ChartTooltipContent } from '@/components/ui/chart';

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

const ActivityItem = ({ activity }: { activity: Activity }) => {
  const iconMap = {
    QUIZ_COMPLETED: <BrainCircuit className="h-5 w-5 text-purple-400" />,
    GAME_PLAYED: <Gamepad2 className="h-5 w-5 text-blue-400" />,
    ACHIEVEMENT_UNLOCKED: <Trophy className="h-5 w-5 text-yellow-400" />,
  };

  return (
    <div className="flex items-start space-x-4">
      <div className="p-2 bg-muted rounded-full">{iconMap[activity.type]}</div>
      <div className="flex-1">
        <p className="text-sm">{activity.description}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(activity.createdAt.toDate(), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

const AchievementItem = ({ achievement }: { achievement: AchievementType }) => {
  const details = achievements[achievement.achievementId];
  if (!details) return null;
  const Icon = details.icon;

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 bg-muted/50 rounded-lg animate-glow border border-transparent hover:border-primary/50 transition-all duration-300">
      <Icon className="w-8 h-8 text-primary mb-2" />
      <p className="font-semibold text-sm">{details.name}</p>
      <p className="text-xs text-muted-foreground">{details.description}</p>
    </div>
  );
};

export default function DashboardPage() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const quizAttemptsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'quizAttempts'), orderBy('createdAt', 'desc'), limit(10)) : null, [user, firestore]);
    const { data: quizAttempts, isLoading: isQuizzesLoading } = useCollection<QuizAttempt>(quizAttemptsQuery);

    const activitiesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'activities'), orderBy('createdAt', 'desc'), limit(5)) : null, [user, firestore]);
    const { data: activities, isLoading: isActivitiesLoading } = useCollection<Activity>(activitiesQuery);

    const achievementsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'achievements'), orderBy('unlockedAt', 'desc')) : null, [user, firestore]);
    const { data: unlockedAchievements, isLoading: isAchievementsLoading } = useCollection<AchievementType>(achievementsQuery);

    const isLoading = isAuthLoading || isProfileLoading || isQuizzesLoading || isActivitiesLoading || isAchievementsLoading;
    
    const overallAccuracy = useMemo(() => {
        if (!userProfile || !userProfile.totalQuestionsAnswered) return 0;
        return Math.round(((userProfile.totalCorrectAnswers || 0) / userProfile.totalQuestionsAnswered) * 100);
    }, [userProfile]);

    const chartData = useMemo(() => {
      return (quizAttempts || [])
        .map(qa => ({
          name: qa.topic,
          score: (qa.score / qa.totalQuestions) * 100,
        }))
        .reverse(); // reverse to show oldest first
    }, [quizAttempts]);

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
                    <p className="text-muted-foreground">Here is your progress matrix. Keep expanding your knowledge.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Overall Accuracy" value={`${overallAccuracy}%`} icon={TrendingUp} />
                <StatCard title="Quizzes Completed" value={userProfile?.totalQuizzes || 0} icon={BrainCircuit} />
                <StatCard title="Games Played" value={userProfile?.gamesPlayed || 0} icon={Gamepad2} />
                <StatCard title="Achievements Unlocked" value={unlockedAchievements?.length || 0} icon={Trophy} />
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-card/50">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><TrendingUp className="text-primary"/>Recent Quiz Performance</CardTitle>
                        <CardDescription>Your scores on the last 10 quizzes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 0 ? (
                           <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                                    <Tooltip
                                      content={<ChartTooltipContent indicator="dot" />}
                                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{r: 4, fill: "hsl(var(--primary))"}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No quiz data yet. Complete a quiz to see your progress!</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card/50">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><History className="text-primary"/>Recent Activity</CardTitle>
                        <CardDescription>Your latest interactions with the learning matrix.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {activities && activities.length > 0 ? (
                            activities.map(activity => <ActivityItem key={activity.id} activity={activity} />)
                        ) : (
                           <div className="h-[300px] flex items-center justify-center text-muted-foreground">No recent activity.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary"/>Achievements</CardTitle>
                    <CardDescription>Milestones you've reached on your journey.</CardDescription>
                </CardHeader>
                <CardContent>
                   {unlockedAchievements && unlockedAchievements.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {unlockedAchievements.map(ach => <AchievementItem key={ach.id} achievement={ach} />)}
                      </div>
                   ) : (
                      <div className="h-[100px] flex items-center justify-center text-muted-foreground">No achievements unlocked yet. Keep learning!</div>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}
