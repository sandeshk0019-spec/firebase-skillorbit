import { Award, Gem, Medal, Shield, Star, Trophy } from 'lucide-react';
import { type ElementType } from 'react';

export interface RewardTier {
  id: string;
  level: number;
  name: string;
  xpThreshold: number;
  icon: ElementType;
  color: string;
}

export const rewardTiers: RewardTier[] = [
  { id: 'REWARD_TIER_1', level: 1, name: 'Bronze Voyager', xpThreshold: 100, icon: Medal, color: 'text-yellow-600' },
  { id: 'REWARD_TIER_2', level: 2, name: 'Silver Scout', xpThreshold: 500, icon: Shield, color: 'text-gray-400' },
  { id: 'REWARD_TIER_3', level: 3, name: 'Gold Guardian', xpThreshold: 1000, icon: Trophy, color: 'text-yellow-400' },
  { id: 'REWARD_TIER_4', level: 4, name: 'Platinum Pilot', xpThreshold: 2500, icon: Star, color: 'text-blue-300' },
  { id: 'REWARD_TIER_5', level: 5, name: 'Diamond Dominator', xpThreshold: 5000, icon: Gem, color: 'text-cyan-400' },
  { id: 'REWARD_TIER_6', level: 6, name: 'Orbit Master', xpThreshold: 10000, icon: Award, color: 'text-purple-500' },
];

export const xpValues = {
  QUIZ_CORRECT_ANSWER: 5, // Per correct answer
  QUIZ_PERFECT_BONUS: 25, // Bonus for 100% score
  ZEN_MATCH: 30, // For completing a board
  CHEM_LAB_SESSION: 20, // For conducting an experiment session
  READING_CHALLENGE_MULTIPLIER: 0.5, // 100% accuracy = 50XP
  COSMIC_TYPER_MULTIPLIER: 0.2, // Score of 100 = 20XP
  MATH_VOYAGER_MULTIPLIER: 0.5, // Score of 100 = 50XP
};
