import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  id: string;
  email: string | null;
  username: string;
  firstName: string;
  lastName: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  
  // Progress Stats
  totalQuizzes?: number;
  totalCorrectAnswers?: number;
  totalQuestionsAnswered?: number;
  gamesPlayed?: number;
  currentStreak?: number;
  lastActiveDate?: string; // YYYY-MM-DD
}

export interface QuizAttempt {
  id?: string;
  userId: string;
  subject: string;
  topic: string;
  score: number;
  totalQuestions: number;
  createdAt: Timestamp;
}

export interface GameScore {
  id?: string;
  userId: string;
  gameId: 'zen-match' | 'cosmic-typer' | 'math-voyager';
  gameName: string;
  score: number;
  createdAt: Timestamp;
}

export interface Activity {
  id?: string;
  userId: string;
  type: 'QUIZ_COMPLETED' | 'GAME_PLAYED' | 'ACHIEVEMENT_UNLOCKED';
  description: string;
  createdAt: Timestamp;
  refId?: string; // e.g., quizAttemptId or gameScoreId
}

export interface Achievement {
  id?: string;
  userId: string;
  achievementId: string; // key from achievements.ts
  unlockedAt: Timestamp;
}
