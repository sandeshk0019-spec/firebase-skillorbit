'use server';

/**
 * @fileOverview Converts text into speech audio.
 *
 * - generateSpeechFromText - A function that handles the text-to-speech conversion.
 * - GenerateSpeechFromTextInput - The input type for the function.
 * - GenerateSpeechFromTextOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

const GenerateSpeechFromTextInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type GenerateSpeechFromTextInput = z.infer<typeof GenerateSpeechFromTextInputSchema>;

const GenerateSpeechFromTextOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a 'data:audio/wav;base64,...' URI."),
});
export type GenerateSpeechFromTextOutput = z.infer<typeof GenerateSpeechFromTextOutputSchema>;

export async function generateSpeechFromText(
  input: GenerateSpeechFromTextInput
): Promise<GenerateSpeechFromTextOutput> {
  return generateSpeechFromTextFlow(input);
}

const generateSpeechFromTextFlow = ai.defineFlow(
  {
    name: 'generateSpeechFromTextFlow',
    inputSchema: GenerateSpeechFromTextInputSchema,
    outputSchema: GenerateSpeechFromTextOutputSchema,
  },
  async ({ text }) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: text,
    });
    
    if (!media) {
      throw new Error('No audio media was generated.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavDataUri = `data:audio/wav;base64,${await toWav(audioBuffer)}`;

    return { audioDataUri: wavDataUri };
  }
);


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
