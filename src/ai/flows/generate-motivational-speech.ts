'use server';
/**
 * @fileOverview A Genkit flow to provide motivational voice assistance.
 * - getMotivationalSpeech - Transcribes user audio, identifies language, generates a motivational response in that language, and returns it as speech.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

// Define Schemas
const MotivationalSpeechInputSchema = z.object({
  audioDataUri: z.string().describe(
    "A user's speech as a data URI. Expected format: 'data:audio/webm;base64,...' or similar."
  ),
});
export type MotivationalSpeechInput = z.infer<typeof MotivationalSpeechInputSchema>;

const MotivationalSpeechOutputSchema = z.object({
  audioResponseUri: z.string().describe("The AI's motivational response as a 'data:audio/wav;base64,...' URI."),
  transcribedText: z.string().describe("The transcription of the user's original audio."),
  responseText: z.string().describe("The text version of the AI's response."),
});
export type MotivationalSpeechOutput = z.infer<typeof MotivationalSpeechOutputSchema>;


// Exported function that calls the flow
export async function getMotivationalSpeech(input: MotivationalSpeechInput): Promise<MotivationalSpeechOutput> {
  return motivationalSpeechFlow(input);
}


// The main flow
const motivationalSpeechFlow = ai.defineFlow(
  {
    name: 'motivationalSpeechFlow',
    inputSchema: MotivationalSpeechInputSchema,
    outputSchema: MotivationalSpeechOutputSchema,
  },
  async ({ audioDataUri }) => {
    // 1. Transcribe the audio
    const { text: transcribedText } = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      prompt: [
        { text: 'Transcribe this audio. The user is speaking in English, Hindi, or Marathi.' },
        { media: { url: audioDataUri } }
      ],
    });

    if (!transcribedText) {
      throw new Error('Could not transcribe audio.');
    }

    // 2. Generate a motivational response in the same language
    const { text: responseText } = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: `You are a friendly and wise motivational coach, like a helpful friend. A user has said the following to you. 
        
        Your task is to respond in the *same language* (the user will speak English, Hindi, or Marathi) with a short, kind, and uplifting message. Make it sound natural and conversational.

        User's message: "${transcribedText}"

        Your encouraging response:`
    });

    if (!responseText) {
      throw new Error('Could not generate a motivational response.');
    }
    
    // 3. Convert the response text to speech
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A versatile voice
          },
        },
      },
      prompt: responseText,
    });
    
    if (!media) {
      throw new Error('No audio media was generated for the response.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavDataUri = `data:audio/wav;base64,${await toWav(audioBuffer)}`;

    return {
        audioResponseUri: wavDataUri,
        transcribedText: transcribedText,
        responseText: responseText
    };
  }
);


// WAV conversion utility (same as in other flows)
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
