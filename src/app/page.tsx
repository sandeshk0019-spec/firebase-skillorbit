import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bot, Puzzle, Mic } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');
  const quizImage = PlaceHolderImages.find(img => img.id === 'quiz');
  const tutorImage = PlaceHolderImages.find(img => img.id === 'tutor');
  const dyslexiaImage = PlaceHolderImages.find(img => img.id === 'dyslexia');

  const features = [
    {
      icon: <Puzzle className="h-8 w-8 text-primary" />,
      title: 'AI Quiz Generator',
      description: 'Instantly create engaging multiple-choice quizzes on any subject and topic. Perfect for study prep and knowledge testing.',
      image: quizImage,
    },
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: 'AI Tutor',
      description: 'Get personalized help with your questions. Our AI tutor can analyze images, explain complex solutions, and summarize content.',
      image: tutorImage,
    },
    {
      icon: <Mic className="h-8 w-8 text-primary" />,
      title: 'Dyslexia Support',
      description: 'Specialized tools to help learners with dyslexia, including speech analysis and reading challenges to build confidence.',
      image: dyslexiaImage,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center">
        <Link href="#" className="flex items-center justify-center gap-2" prefetch={false}>
          <Logo />
          <span className="text-xl font-semibold font-headline">SkillOrbit</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Features
          </Link>
          <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            About
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              data-ai-hint={heroImage.imageHint}
              fill
              className="object-cover object-center brightness-50"
            />
          )}
          <div className="container px-4 md:px-6 relative text-center text-primary-foreground">
            <div className="max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl font-headline tracking-tighter sm:text-5xl md:text-6xl">
                Unlock Your Learning Potential
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80">
                SkillOrbit is your personal AI-powered learning companion. Explore interactive quizzes, get expert tutoring, and access specialized support tools.
              </p>
              <div>
                <Link href="/dashboard">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-headline sm:text-4xl">Accelerate Your Learning Journey</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform offers a suite of AI-driven tools designed to make learning more effective, accessible, and enjoyable for everyone.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="h-full transform hover:-translate-y-2 transition-transform duration-300">
                  <CardHeader>
                    {feature.image && (
                       <Image
                        src={feature.image.imageUrl}
                        alt={feature.image.description}
                        data-ai-hint={feature.image.imageHint}
                        width={600}
                        height={400}
                        className="rounded-t-lg object-cover aspect-[3/2]"
                      />
                    )}
                    <div className="flex items-center gap-4 pt-4">
                      {feature.icon}
                      <CardTitle className="font-headline">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 SkillOrbit. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
