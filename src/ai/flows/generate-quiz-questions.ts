'use server';

/**
 * @fileOverview Generates multiple-choice quiz questions based on a subject and topic.
 *
 * - generateQuizQuestions - A function that generates quiz questions.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizQuestionsInputSchema = z.object({
  subject: z.string().describe('The subject of the quiz questions.'),
  topic: z.string().describe('The specific topic for the quiz questions.'),
  numberOfQuestions: z.number().int().min(1).max(10).default(5).describe('The number of multiple choice questions to generate (1-10).'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The multiple choice options for the question.'),
      correctAnswer: z.string().describe('The correct answer to the question.'),
    })
  ).describe('An array of multiple choice questions.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are a quiz generator that creates multiple choice questions based on the given subject and topic.

  Generate {{{numberOfQuestions}}} multiple choice questions for the subject: {{{subject}}}, topic: {{{topic}}}.

  Each question should have 4 options, with one correct answer.

  Return the questions in JSON format.

  Example:
  {
    "questions": [
      {
        "question": "What is the capital of France?",
        "options": ["Berlin", "Paris", "Madrid", "Rome"],
        "correctAnswer": "Paris"
      },
      {
        "question": "What is the highest mountain in the world?",
        "options": ["K2", "Kangchenjunga", "Mount Everest", "Lhotse"],
        "correctAnswer": "Mount Everest"
      }
    ]
  }`,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
