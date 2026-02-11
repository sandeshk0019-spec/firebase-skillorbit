'use client';

import { useState, useRef, useCallback } from 'react';
import { getMotivationalSpeech, type MotivationalSpeechOutput } from '@/ai/flows/generate-motivational-speech';
import { BrainCircuit, Loader2, Mic, Sparkles, Square, Volume2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const textMotivations = [
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", emoji: "🌟" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", emoji: "❤️" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", emoji: "✨" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", emoji: "💪" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", emoji: "⏰" }
];

function TextMotivationTab() {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="font-headline">Daily Spark</CardTitle>
        <CardDescription>
          A few words of encouragement to brighten your day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {textMotivations.map((m, i) => (
          <div key={i} className="bg-muted/50 p-4 rounded-lg flex items-start gap-4">
            <span className="text-2xl mt-1">{m.emoji}</span>
            <div>
              <p className="font-semibold text-primary">"{m.quote}"</p>
              <p className="text-sm text-muted-foreground text-right">- {m.author}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function VoiceAssistantTab() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioSupported, setIsAudioSupported] = useState(true);
  const [analysis, setAnalysis] = useState<MotivationalSpeechOutput | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { toast } = useToast();

  const handleToggleListening = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
    } else {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsAudioSupported(false);
        toast({ variant: "destructive", title: "Audio Not Supported", description: "Your browser does not support audio recording." });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAnalysis(null);
        setIsListening(true);
        audioChunksRef.current = [];
        
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        recorder.onstop = async () => {
          setIsProcessing(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
              const result = await getMotivationalSpeech({ audioDataUri: base64Audio });
              setAnalysis(result);
            } catch (error) {
              console.error(error);
              toast({ variant: "destructive", title: "AI Error", description: "Could not get a motivational response. Please try again." });
            } finally {
              setIsProcessing(false);
            }
          };
          stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();

      } catch (err) {
        console.error("Error accessing microphone:", err);
        setIsAudioSupported(false);
        toast({ variant: "destructive", title: "Microphone Access Denied", description: "Please allow microphone access in your browser settings to use this feature." });
        setIsListening(false);
      }
    }
  };

  const playResponseAudio = () => {
    if (analysis?.audioResponseUri && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }
  };
  
  if (!isAudioSupported) {
    return (
       <Card className="bg-card/50">
         <CardHeader>
           <CardTitle className="font-headline">Voice Assistant</CardTitle>
           <CardDescription>
             Share your feelings and get a voice response from our AI coach.
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="p-4 border rounded-lg bg-destructive/20 text-destructive-foreground">
             <p className="font-bold">Browser Not Supported</p>
             <p className="text-sm">
                Your browser does not support the necessary audio recording APIs (getUserMedia/MediaRecorder). Please use a modern browser like Chrome or Firefox.
             </p>
           </div>
         </CardContent>
       </Card>
    )
  }

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="font-headline">Voice Assistant</CardTitle>
        <CardDescription>
          Share your feelings and get a voice response from our AI coach.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
            <Button
                onClick={handleToggleListening}
                disabled={isProcessing}
                size="lg"
                className={cn("w-48 h-16 rounded-full text-lg", isListening ? 'bg-red-600 hover:bg-red-500' : 'animate-pulse-glow')}
            >
                {isListening ? <Square className="mr-2 h-6 w-6" /> : <Mic className="mr-2 h-6 w-6" />}
                {isListening ? "Stop Recording" : "Start Recording"}
            </Button>
        </div>

        {isProcessing && (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p className="font-semibold">Analyzing your thoughts...</p>
            <p className="text-muted-foreground text-sm">Please wait a moment.</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4 pt-4 animate-in fade-in">
             <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary"/> Your Words
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="italic text-primary-foreground/80">"{analysis.transcribedText}"</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-secondary"/> AI Coach Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p className="text-primary-foreground/80">{analysis.responseText}</p>
                 <Button onClick={playResponseAudio} variant="secondary">
                    <Volume2 className="mr-2 h-5 w-5" />
                    Listen to Response
                 </Button>
                 <audio ref={audioRef} src={analysis.audioResponseUri} className="hidden" />
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


export default function AiMotivationPage() {
  return (
    <div className="container mx-auto max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary/10 p-3 rounded-lg animate-pulse-glow">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-headline text-2xl">AI Motivation Coach</h1>
          <p className="text-muted-foreground">
            Get a boost of encouragement whenever you need it.
          </p>
        </div>
      </div>
      <Tabs defaultValue="voice-assistant" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text-motivation">
            Text Motivation
          </TabsTrigger>
          <TabsTrigger value="voice-assistant">
            Voice Assistant
          </TabsTrigger>
        </TabsList>
        <TabsContent value="text-motivation">
          <TextMotivationTab />
        </TabsContent>
        <TabsContent value="voice-assistant">
          <VoiceAssistantTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
