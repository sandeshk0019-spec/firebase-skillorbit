import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bot, Puzzle, Mic } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function DashboardPage() {
  const welcomeImage = PlaceHolderImages.find(img => img.id === 'dashboard-welcome');
  
  const features = [
    {
      icon: Puzzle,
      title: "AI Quiz Generator",
      description: "Challenge yourself with custom quizzes on any topic.",
      href: "/dashboard/quiz",
      cta: "Create a Quiz",
    },
    {
      icon: Bot,
      title: "AI Tutor",
      description: "Get instant, step-by-step help with your homework.",
      href: "/dashboard/tutor",
      cta: "Start Tutoring",
    },
    {
      icon: Mic,
      title: "Dyslexia Support",
      description: "Access tools designed to aid reading and speech.",
      href: "/dashboard/dyslexia-support",
      cta: "Explore Support",
    },
  ];

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden animate-in fade-in duration-500">
        <div className="relative">
          {welcomeImage && (
            <Image
              src={welcomeImage.imageUrl}
              alt={welcomeImage.description}
              data-ai-hint={welcomeImage.imageHint}
              width={1200}
              height={400}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="font-headline text-3xl font-bold text-white animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-backwards">Welcome Back, Student!</h1>
            <p className="text-white/80 mt-2 max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-700 delay-400 fill-mode-backwards">Ready to dive back in? Your learning journey continues here.</p>
          </div>
        </div>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card 
            key={feature.title} 
            className="flex flex-col transform hover:-translate-y-1 transition-transform duration-300 animate-in fade-in slide-in-from-bottom-5 fill-mode-backwards"
            style={{ animationDelay: `${500 + index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div className='flex-1'>
                <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <CardDescription className="mb-6">{feature.description}</CardDescription>
              <Link href={feature.href}>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {feature.cta} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
