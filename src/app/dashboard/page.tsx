import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BrainCircuit, Cpu, Webhook } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function DashboardPage() {
  const welcomeImage = PlaceHolderImages.find(img => img.id === 'dashboard-welcome');
  
  const features = [
    {
      icon: Cpu,
      title: "AI Quiz Matrix",
      description: "Synthesize knowledge into custom quizzes on any subject.",
      href: "/dashboard/quiz",
      cta: "Generate Quiz",
    },
    {
      icon: BrainCircuit,
      title: "Cognitive Tutor",
      description: "Interface with our AI for step-by-step guidance and analysis.",
      href: "/dashboard/tutor",
      cta: "Access Tutor",
    },
    {
      icon: Webhook,
      title: "Neuro-Speech Hub",
      description: "Utilize advanced speech analysis tools for enhanced fluency.",
      href: "/dashboard/dyslexia-support",
      cta: "Open Hub",
    },
  ];

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-primary/20 bg-card/50 animate-in fade-in duration-1000">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="font-headline text-3xl font-bold text-white animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-backwards">
              Welcome, Neural Voyager!
            </h1>
            <p className="text-white/80 mt-2 max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-700 delay-400 fill-mode-backwards">Your cognitive enhancement journey continues. Ready to interface?</p>
          </div>
        </div>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card 
            key={feature.title} 
            className="flex flex-col bg-card/50 border-primary/10 hover:border-primary/50 transition-all duration-300 animate-float"
            style={{ animationDelay: `${index * 200}ms`, animationDuration: '8s' }}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
              <div className="p-3 rounded-lg bg-primary/10 animate-pulse-glow">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div className='flex-1'>
                <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <CardDescription className="mb-6">{feature.description}</CardDescription>
              <Link href={feature.href}>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 animate-pulse-glow">
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
