'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Cpu, Gamepad2, Eye, Award, BarChart, Sparkles, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: BrainCircuit,
    title: 'AI Cognitive Tutor',
    description: 'Engage in a conversation with our AI tutor to break down complex subjects into simple, understandable concepts. Ask questions, get detailed explanations, and deepen your understanding on any topic.',
    howTo: 'Navigate to the AI Tutor section from the sidebar. Type your question into the chat box and press send. The AI will provide a comprehensive response.',
  },
  {
    icon: Cpu,
    title: 'AI Quiz Matrix',
    description: 'Generate custom multiple-choice quizzes on any subject and topic you can imagine. It\'s a powerful tool for self-assessment, exam preparation, and reinforcing what you\'ve learned.',
    howTo: 'Go to the AI Quiz Matrix, enter a subject and a more specific topic, and click "Generate Quiz". Answer the questions and receive instant results and feedback.',
  },
  {
    icon: Gamepad2,
    title: 'The Game Zone',
    description: 'Learning doesn\'t have to be a chore. The Game Zone features a collection of interactive mini-games designed to make learning fun and sharpen your cognitive skills through play.',
    howTo: 'Visit the Game Zone from the sidebar and select any of the available games. Each game has its own simple rules to get you started immediately.',
  },
  {
    icon: Eye,
    title: 'Dyslexia Support Hub',
    description: 'A dedicated space with advanced tools to help build confidence in reading and speaking. Features include AI-powered speech analysis and reading challenges designed to be gentle and encouraging.',
    howTo: 'In the Dyslexia Support section, you can either type text for analysis or take on a reading challenge where you read a paragraph aloud. The AI provides structured feedback on your accuracy and fluency.',
  },
];

const benefits = [
    {
      icon: Sparkles,
      title: 'Personalized Learning Paths',
      description: 'SkillOrbit adapts to you. The AI generates content and challenges based on your chosen topics, creating a unique learning journey tailored to your needs and interests.',
    },
    {
      icon: Award,
      title: 'Gamified Progress & Rewards',
      description: 'Stay motivated by earning Experience Points (XP) for completing tasks. Level up through Reward Tiers, unlock achievements, and maintain your daily activity streak.',
    },
    {
      icon: BarChart,
      title: 'Track Your Growth',
      description: 'The main dashboard provides a clear overview of your daily and all-time progress. Monitor your study time, tasks completed, and average accuracy to see how far you\'ve come.',
    },
]

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
            <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
            <h1 className="font-headline text-3xl">App Guide &amp; Settings</h1>
            <p className="text-muted-foreground mt-1">
            Welcome to SkillOrbit.AI! Here’s a guide to help you get the most out of your AI-powered learning co-processor.
            </p>
        </div>
      </div>

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Core Features</CardTitle>
          <CardDescription>
            Learn how to use the powerful tools at your disposal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {features.map((feature, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-lg">{feature.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none prose-p:text-muted-foreground pl-2">
                  <p>{feature.description}</p>
                  <h4 className="font-semibold text-foreground">How to Use:</h4>
                  <p>{feature.howTo}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      
       <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Why SkillOrbit Works</CardTitle>
          <CardDescription>
            The philosophy behind your enhanced learning experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 flex flex-col items-center text-center">
                    <benefit.icon className="w-8 h-8 text-secondary mb-3"/>
                    <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
            ))}
        </CardContent>
        <div className="p-6 pt-0 text-center">
             <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
            </Link>
        </div>
      </Card>
    </div>
  );
}
