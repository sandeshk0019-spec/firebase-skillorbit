'use server';
/**
 * @fileOverview Compares user's transcribed speech with a target text, provides feedback on accuracy and fluency, and offers encouragement.
 *
 * - compareSpeechWithTargetText - A function that handles the comparison of a transcript with text.
 * - CompareSpeechWithTargetTextInput - The input type for the compareSpeechWithTargetText function.
 * - CompareSpeechWithTargetTextOutput - The return type for the compareSpeechWithTargetText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompareSpeechWithTargetTextInputSchema = z.object({
  transcript: z.string().describe("The user's speech transcribed to text."),
  targetText: z.string().describe('The text that the speech should match.'),
});
export type CompareSpeechWithTargetTextInput = z.infer<typeof CompareSpeechWithTargetTextInputSchema>;

const CompareSpeechWithTargetTextOutputSchema = z.object({
  feedback: z.string().describe("Feedback on the user's reading accuracy and fluency, with encouraging tips."),
  correctedText: z.string().describe("The user's transcript corrected to match the target text."),
});
export type CompareSpeechWithTargetTextOutput = z.infer<typeof CompareSpeechWithTargetTextOutputSchema>;

export async function compareSpeechWithTargetText(
  input: CompareSpeechWithTargetTextInput
): Promise<CompareSpeechWithTargetTextOutput> {
  return compareSpeechWithTargetTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compareSpeechWithTargetTextPrompt',
  input: {schema: CompareSpeechWithTargetTextInputSchema},
  output: {schema: CompareSpeechWithTargetTextOutputSchema},
  prompt: `You are a helpful and encouraging reading coach for students, including those with dyslexia.

You will compare the user's transcribed speech to the target text. Identify any differences, such as missed words, mispronounced words (based on the transcription), or extra words.

Based on this comparison, provide gentle and encouraging feedback on their reading. Offer tips for improvement, focusing on fluency and accuracy. Format the output as HTML. Also provide a "corrected" version of their transcript that aligns with the target text.

**Transcribed Speech:**
{{{transcript}}}

**Target Text:**
{{{targetText}}}`,
});

const compareSpeechWithTargetTextFlow = ai.defineFlow(
  {
    name: 'compareSpeechWithTargetTextFlow',
    inputSchema: CompareSpeechWithTargetTextInputSchema,
    outputSchema: CompareSpeechWithTargetTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
