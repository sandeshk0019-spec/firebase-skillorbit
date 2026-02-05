'use server';

/**
 * @fileOverview Analyzes speech for grammar and pronunciation, gently corrects mistakes, and provides encouraging tips for students with dyslexia.
 *
 * - analyzeSpeechForDyslexia - A function that handles the speech analysis and provides feedback.
 * - AnalyzeSpeechInput - The input type for the analyzeSpeechForDyslexia function.
 * - AnalyzeSpeechOutput - The return type for the analyzeSpeechForDyslexia function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSpeechInputSchema = z.object({
  speech: z
    .string()
    .describe('The speech to analyze for grammar and pronunciation.'),
});
export type AnalyzeSpeechInput = z.infer<typeof AnalyzeSpeechInputSchema>;

const AnalyzeSpeechOutputSchema = z.object({
  correctedSpeech: z
    .string()
    .describe('The speech corrected for grammar and pronunciation.'),
  feedback: z
    .string()
    .describe('Encouraging feedback and tips for improvement, formatted in HTML.'),
});
export type AnalyzeSpeechOutput = z.infer<typeof AnalyzeSpeechOutputSchema>;

export async function analyzeSpeechForDyslexia(
  input: AnalyzeSpeechInput
): Promise<AnalyzeSpeechOutput> {
  return analyzeSpeechFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSpeechPrompt',
  input: {schema: AnalyzeSpeechInputSchema},
  output: {schema: AnalyzeSpeechOutputSchema},
  prompt: `You are an AI assistant designed to help students with dyslexia improve their communication skills. Analyze the following speech for grammar and pronunciation errors. Gently correct any mistakes and provide encouraging tips for improvement. Format the feedback in HTML.

Speech: {{{speech}}}

Corrected Speech:

Feedback:`,
});

const analyzeSpeechFlow = ai.defineFlow(
  {
    name: 'analyzeSpeechFlow',
    inputSchema: AnalyzeSpeechInputSchema,
    outputSchema: AnalyzeSpeechOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
