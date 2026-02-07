import { BookOpenCheck, BrainCircuit, Target, Star, Brain } from 'lucide-react';
import { ElementType } from 'react';

export interface AchievementDetails {
  id: string;
  name: string;
  description: string;
  icon: ElementType;
}

export const achievements: Record<string, AchievementDetails> = {
  FIRST_QUIZ: {
    id: 'FIRST_QUIZ',
    name: 'Knowledge Quest',
    description: 'Complete your first AI-generated quiz.',
    icon: BrainCircuit,
  },
  PERFECT_SCORE: {
    id: 'PERFECT_SCORE',
    name: 'Perfect Recall',
    description: 'Achieve a perfect score on any quiz.',
    icon: Target,
  },
  ZEN_MASTER: {
    id: 'ZEN_MASTER',
    name: 'Zen Master',
    description: 'Complete your first game of Zen Match.',
    icon: Brain,
  },
  COSMIC_KEYMASTER: {
    id: 'COSMIC_KEYMASTER',
    name: 'Cosmic Keymaster',
    description: 'Score over 100 points in Cosmic Typer.',
    icon: Star,
  },
  MATH_VOYAGER_ACE: {
    id: 'MATH_VOYAGER_ACE',
    name: 'Math Voyager Ace',
    description: 'Score over 50 points in Math Voyager.',
    icon: BookOpenCheck,
  },
};
