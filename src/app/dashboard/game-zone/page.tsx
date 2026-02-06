'use client';

import { Brain, Keyboard, Calculator, BrainCircuit, FlaskConical, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

const games = [
  {
    title: "Zen Match",
    tagline: "Relaxing Memory Pairs",
    icon: Brain,
    color: "text-yellow-500",
    hoverColor: "hover:border-yellow-500/80",
    href: "#",
    disabled: true,
  },
  {
    title: "Cosmic Typer",
    tagline: "Study Words Rain",
    icon: Keyboard,
    color: "text-emerald-500",
    hoverColor: "hover:border-emerald-500/80",
    href: "#",
    disabled: true,
  },
  {
    title: "Math Voyager",
    tagline: "Arithmetic Action",
    icon: Calculator,
    color: "text-blue-500",
    hoverColor: "hover:border-blue-500/80",
    href: "#",
    disabled: true,
  },
  {
    title: "AI Quiz Master",
    tagline: "Generative Assessments",
    icon: BrainCircuit,
    color: "text-purple-500",
    hoverColor: "hover:border-purple-500/80",
    href: "/dashboard/quiz",
    disabled: false,
  },
  {
    title: "Chem Lab Sim",
    tagline: "Virtual Reactions",
    icon: FlaskConical,
    color: "text-cyan-500",
    hoverColor: "hover:border-cyan-500/80",
    href: "#",
    disabled: true,
  },
];

export default function GameZonePage() {
  return (
    <div className="container mx-auto max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary/10 p-3 rounded-lg animate-pulse-glow">
          <Gamepad2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="font-headline text-3xl font-bold">Game Zone</h1>
          <p className="text-muted-foreground">Sharpen your mind with futuristic mini-games.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => (
          <GameCard key={game.title} {...game} />
        ))}
      </div>
    </div>
  );
}

const GameCard = ({ title, tagline, icon: Icon, color, hoverColor, href, disabled }: typeof games[0]) => {
  const cardContent = (
    <div className={cn(
      "h-full flex flex-col bg-black/20 backdrop-blur-md border border-white/10 rounded-[2rem] transition-all duration-300 transform hover:scale-105",
      !disabled && hoverColor
    )}>
      <div className="flex-row items-center gap-4 p-8 flex">
        <Icon className={cn("w-10 h-10", color)} />
        <div>
          <h2 className="font-headline text-2xl text-white">{title}</h2>
          <p className="text-sm text-white/60">{tagline}</p>
        </div>
      </div>
      <div className="flex-grow flex items-end justify-end p-6">
        <Button size="lg" disabled={disabled} className="rounded-full bg-white/10 hover:bg-white/20 text-white shadow-lg">
          Play
        </Button>
      </div>
    </div>
  );

  const cardWrapper = (
    <div className="h-full min-h-[250px]">
      {disabled ? (
         <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full h-full cursor-not-allowed opacity-60">{cardContent}</div>
            </TooltipTrigger>
            <TooltipContent className="bg-black border-purple-500 text-white">
              <p>Coming Soon!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Link href={href} className="w-full h-full block">
          {cardContent}
        </Link>
      )}
    </div>
  );
  
  return cardWrapper;
};
