'use server';
/**
 * @fileOverview Compares user speech with a target text, provides feedback on pronunciation, and offers encouragement.
 *
 * - compareSpeechWithTargetText - A function that handles the comparison of speech with text.
 * - CompareSpeechWithTargetTextInput - The input type for the compareSpeechWithTargetText function.
 * - CompareSpeechWithTargetTextOutput - The return type for the compareSpeechWithTargetText function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const CompareSpeechWithTargetTextInputSchema = z.object({
  speechDataUri: z
    .string()
    .describe(
      "The recorded speech as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetText: z.string().describe('The text that the speech should match.'),
});
export type CompareSpeechWithTargetTextInput = z.infer<typeof CompareSpeechWithTargetTextInputSchema>;

const CompareSpeechWithTargetTextOutputSchema = z.object({
  feedback: z.string().describe("Feedback on the user's pronunciation, with encouraging tips."),
  correctedText: z.string().describe("The corrected text based on the user's speech."),
});
export type CompareSpeechWithTargetTextOutput = z.infer<typeof CompareSpeechWithTargetTextOutputSchema>;

export async function compareSpeechWithTargetText(
  input: CompareSpeechWithTargetTextInput
): Promise<CompareSpeechWithTargetTextOutput> {
  return compareSpeechWithTargetTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compareSpeechWithTargetTextPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: {schema: CompareSpeechWithTargetTextInputSchema},
  output: {schema: CompareSpeechWithTargetTextOutputSchema},
  prompt: `You are a helpful and encouraging tutor for students with dyslexia.

You will compare the user\'s speech to the target text, and provide feedback on their pronunciation.
Be gentle and encouraging, and offer tips for improvement. Format the output as HTML.

Speech: {{media url=speechDataUri}}
Target Text: {{{targetText}}}`,
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
