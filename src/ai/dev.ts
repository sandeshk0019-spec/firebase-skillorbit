import { config } from 'dotenv';
config();

import '@/ai/flows/receive-tutoring-assistance.ts';
import '@/ai/flows/compare-speech-with-target-text.ts';
import '@/ai/flows/analyze-speech-for-dyslexia.ts';
import '@/ai/flows/generate-quiz-questions.ts';
import '@/ai/flows/generate-anime-video.ts';
