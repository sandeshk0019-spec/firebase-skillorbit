'use server';
/**
 * @fileOverview Compares user's transcribed speech with a target text, provides structured feedback, and offers encouragement.
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
  accuracyScore: z.number().min(0).max(100).describe('The percentage of words from the target text that were correctly transcribed. Calculated as (correctly_read_words / total_words_in_target) * 100.'),
  wordsToPractice: z.array(z.string()).describe('A list of specific words that were either missed or seem to be mispronounced based on the transcript.'),
  positiveFeedback: z.string().describe('An encouraging sentence highlighting what the user did well (e.g., "Great job on the clear pronunciation of...").'),
  improvementTips: z.string().describe('One or two actionable tips for the user to improve their reading accuracy or fluency, formatted as a simple string.'),
  correctedText: z.string().describe("The user's transcript perfectly corrected to match the target text."),
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
  prompt: `You are an advanced and encouraging reading coach AI for students, including those with dyslexia. Your analysis must be precise and your feedback gentle and constructive.

You will compare the user's transcribed speech to the target text and provide structured feedback.

**Analysis Steps:**
1.  **Calculate Accuracy Score:** Carefully compare the transcript to the target text. Calculate the percentage of words that were read correctly.
2.  **Identify Words to Practice:** Create a list of specific words that were either missed entirely or seem to be mispronounced based on the transcript.
3.  **Formulate Positive Feedback:** Find something genuinely positive to say about the reading. It could be about clarity, effort, or correctly reading a difficult word.
4.  **Provide Improvement Tips:** Offer one or two simple, actionable tips for improvement.
5.  **Generate Corrected Text:** Provide a version of the text that is 100% identical to the target text.

**Crucial Instructions:**
-   **Feedback Style:** Be gentle and encouraging. Frame feedback positively.
-   **Accuracy:** The accuracy score and words to practice must be derived directly from the text comparison.
-   **Output Format:** You MUST output ONLY the JSON object matching the output schema. Do not add any conversational text, markdown, or any characters before or after the JSON object.

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
