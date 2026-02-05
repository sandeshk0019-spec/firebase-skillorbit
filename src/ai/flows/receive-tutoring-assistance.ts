'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing tutoring assistance.
 *
 * The flow takes a query and optional image and returns a helpful tutoring response with explanations and summaries.
 *
 * @remarks
 * - `receiveTutoringAssistance`: The main function to initiate the tutoring assistance flow.
 * - `TutoringInput`: The input type for the `receiveTutoringAssistance` function.
 * - `TutoringOutput`: The output type for the `receiveTutoringAssistance` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TutoringInputSchema = z.object({
  query: z.string().describe('The student question or topic for tutoring assistance.'),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image related to the query, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TutoringInput = z.infer<typeof TutoringInputSchema>;

const TutoringOutputSchema = z.object({
  response: z.string().describe('The tutoring response, potentially with HTML formatting.'),
});
export type TutoringOutput = z.infer<typeof TutoringOutputSchema>;

export async function receiveTutoringAssistance(input: TutoringInput): Promise<TutoringOutput> {
  return receiveTutoringAssistanceFlow(input);
}

const tutoringPrompt = ai.definePrompt({
  name: 'tutoringPrompt',
  input: {schema: TutoringInputSchema},
  output: {schema: TutoringOutputSchema},
  prompt: `You are a helpful and friendly tutor, skilled at explaining complex topics in simple terms.

  The student has asked the following question:
  {{query}}

  {{#if image}}
  Here is an image related to the question:
  {{media url=image}}
  {{/if}}

  Provide a clear and concise explanation, and summarize the key concepts. Use HTML formatting where appropriate to enhance readability.
  `,
});

const receiveTutoringAssistanceFlow = ai.defineFlow(
  {
    name: 'receiveTutoringAssistanceFlow',
    inputSchema: TutoringInputSchema,
    outputSchema: TutoringOutputSchema,
  },
  async input => {
    const {output} = await tutoringPrompt(input);
    return output!;
  }
);
