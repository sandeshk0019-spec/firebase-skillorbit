import type { Timestamp, FieldValue } from "firebase/firestore";

export interface UserProfile {
  id: string;
  email: string | null;
  username: string;
  firstName: string;
  lastName: string;
  createdAt: FieldValue | Timestamp;
  lastLogin: FieldValue | Timestamp;
  
  // Progress Stats
  totalQuizzes?: number;
  totalCorrectAnswers?: number;
  totalQuestionsAnswered?: number;
  gamesPlayed?: number;
  tasksDoneToday?: number; // tasks done for the current day, resets daily
  totalStudyTime?: number; // Total accumulated study time in seconds.
  studyTimeToday?: number; // Study time for the current day in seconds, resets daily.
  currentStreak?: number;
  lastActiveDate?: string; // YYYY-MM-DD
  totalXp?: number;
}

export interface QuizAttempt {
  id?: string;
  userId: string;
  subject: string;
  topic: string;
  score: number;
  totalQuestions: number;
  createdAt: FieldValue | Timestamp;
}

export interface GameScore {
  id?: string;
  userId: string;
  gameId: 'zen-match' | 'cosmic-typer' | 'math-voyager' | 'chem-lab-sim';
  gameName: string;
  score: number;
  createdAt: FieldValue | Timestamp;
}

export interface Activity {
  id?: string;
  userId: string;
  type: 'QUIZ_COMPLETED' | 'GAME_PLAYED' | 'ACHIEVEMENT_UNLOCKED';
  description: string;
  createdAt: FieldValue | Timestamp;
  refId?: string; // e.g., quizAttemptId or gameScoreId
}

export interface Achievement {
  id?: string;
  userId: string;
  achievementId: string; // key from achievements.ts
  unlockedAt: FieldValue | Timestamp;
}
