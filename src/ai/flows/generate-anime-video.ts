'use server';
/**
 * @fileOverview A Genkit flow to generate a video from a script using Veo.
 *
 * - generateAnimeVideo - A function that handles the video generation process.
 * - GenerateAnimeVideoInput - The input type for the generateAnimeVideo function.
 * - GenerateAnimeVideoOutput - The return type for the generateAnimeVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {MediaPart} from 'genkit';

const GenerateAnimeVideoInputSchema = z.object({
  script: z.string().describe('The script for the anime video.'),
});
export type GenerateAnimeVideoInput = z.infer<
  typeof GenerateAnimeVideoInputSchema
>;

const GenerateAnimeVideoOutputSchema = z.object({
  videoDataUri: z.string().describe('The generated video as a data URI.'),
});
export type GenerateAnimeVideoOutput = z.infer<
  typeof GenerateAnimeVideoOutputSchema
>;

async function downloadVideoAsDataUri(video: MediaPart): Promise<string> {
  const fetch = (await import('node-fetch')).default;

  if (!video.media?.url) {
    throw new Error('Video URL not found in media part.');
  }

  // The URL from Veo is a temporary download link. It needs to be fetched.
  const downloadUrl = video.media.url;

  const videoDownloadResponse = await fetch(downloadUrl);

  if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
    throw new Error(
      `Failed to fetch video: ${videoDownloadResponse.statusText}`
    );
  }

  // Convert the response body to a Buffer
  const videoBuffer = await videoDownloadResponse.arrayBuffer();
  const buffer = Buffer.from(videoBuffer);
  const contentType = video.media?.contentType || 'video/mp4';

  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

export async function generateAnimeVideo(
  input: GenerateAnimeVideoInput
): Promise<GenerateAnimeVideoOutput> {
  const videoPrompt = `Create a short, dramatic anime-style educational video based on this script. Use vibrant colors, dynamic character animations, and energy effects. The visual style should be similar to modern science-fiction anime.

Style: Animated cartoon, anime, educational, dramatic, sci-fi.

Script:
---
${input.script}
---
`;

  let {operation} = await ai.generate({
    model: googleAI.model('veo-2.0-generate-001'),
    prompt: videoPrompt,
    config: {
      durationSeconds: 8, // Max supported is 8 for this model
      aspectRatio: '16:9',
    },
  });

  if (!operation) {
    throw new Error('Expected the model to return an operation.');
  }

  // Poll for the result. This can take a while.
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    operation = await ai.checkOperation(operation);
  }

  if (operation.error) {
    throw new Error(`Failed to generate video: ${operation.error.message}`);
  }

  const videoPart = operation.output?.message?.content.find(p => !!p.media);
  if (!videoPart) {
    throw new Error('Failed to find the generated video in the operation output.');
  }

  const videoDataUri = await downloadVideoAsDataUri(videoPart);

  return {videoDataUri};
}
