"use client";

import { useState, useRef, useEffect } from "react";
import { analyzeSpeechForDyslexia } from "@/ai/flows/analyze-speech-for-dyslexia";
import { compareSpeechWithTargetText } from "@/ai/flows/compare-speech-with-target-text";
import { Webhook, Loader2, BookOpen, Mic, Square, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

function SpeechAnalysisTab() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    correctedSpeech: string;
    feedback: string;
  } | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (text.trim() === "") {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please enter some text to analyze.",
      });
      return;
    }
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeSpeechForDyslexia({ speech: text });
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze speech. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="font-headline">Text Analysis</CardTitle>
        <CardDescription>
          Type out what you want to say, and our AI will provide gentle
          feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Input your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="bg-background/50"
        />
        <Button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full animate-pulse-glow"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Webhook className="mr-2 h-4 w-4" />
          )}
          Analyze Text
        </Button>
        {analysis && (
          <div className="space-y-4 pt-4 animate-in fade-in">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Corrected Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="italic text-primary">{analysis.correctedSpeech}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose dark:prose-invert prose-p:text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: analysis.feedback }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReadingChallengeTab() {
  const challengeText =
    "The quick brown fox jumps over the lazy dog. This sentence contains all of the letters of the alphabet. Practicing it can help improve pronunciation and reading fluency.";

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [feedback, setFeedback] = useState<{
    correctedText: string;
    feedback: string;
  } | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        // Create the transcript from the event results
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
  
        setLiveTranscript(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast({
          variant: "destructive",
          title: "Speech Recognition Error",
          description: `An error occurred: ${event.error}. Your browser may have blocked the microphone.`,
        });
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSpeechRecognitionSupported(false);
    }
  }, [toast]);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setLiveTranscript("");
      setFeedback(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleGetFeedback = async () => {
    if (liveTranscript.trim() === "") {
      toast({
        variant: "destructive",
        title: "No Speech Detected",
        description: "Please read the text first.",
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    try {
      const result = await compareSpeechWithTargetText({
        transcript: liveTranscript,
        targetText: challengeText,
      });
      setFeedback(result);
    } catch (error) {
      console.error("AI Feedback Error:", error);
      toast({
        variant: "destructive",
        title: "AI Feedback Error",
        description:
          "Failed to get feedback from the AI. This could be due to an invalid API key or a network issue.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSpeechRecognitionSupported) {
    return (
       <Card className="bg-card/50">
         <CardHeader>
           <CardTitle className="font-headline">Reading Challenge</CardTitle>
           <CardDescription>
             Read the text below aloud. Our AI will compare your speech to the text
             and offer feedback.
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="p-4 border rounded-lg bg-destructive/20 text-destructive-foreground">
             <p className="font-bold">Browser Not Supported</p>
             <p className="text-sm">
                Your browser does not support the Web Speech API required for this feature. Please try using a recent version of Google Chrome or Microsoft Edge.
             </p>
           </div>
         </CardContent>
       </Card>
    )
  }

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="font-headline">Reading Challenge</CardTitle>
        <CardDescription>
          Read the text below aloud. Our AI will turn your speech into text and then offer feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-lg leading-relaxed">{challengeText}</p>
        </div>

        <div className="p-4 border rounded-lg bg-background/50 min-h-[80px]">
          <p className="text-muted-foreground text-sm mb-2">Live Transcript:</p>
          {isListening && !liveTranscript && <p className="text-muted-foreground italic">Listening...</p>}
          <p className="text-primary">{liveTranscript}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={handleToggleListening}
            className="w-full"
            disabled={isProcessing}
          >
            {isListening ? (
              <Square className="mr-2 h-4 w-4" />
            ) : (
              <Mic className="mr-2 h-4 w-4" />
            )}
            {isListening ? "Stop Listening" : "Start Reading Aloud"}
          </Button>
          <Button
            onClick={handleGetFeedback}
            disabled={!liveTranscript || isProcessing || isListening}
            className="w-full animate-pulse-glow"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Get AI Feedback
          </Button>
        </div>

        {feedback && (
          <div className="space-y-4 pt-4 animate-in fade-in">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  AI Reading Coach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose dark:prose-invert prose-p:text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: feedback.feedback }}
                />
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Corrected Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="italic text-primary">{feedback.correctedText}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DyslexiaSupportPage() {
  return (
    <div className="container mx-auto max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary/10 p-3 rounded-lg animate-pulse-glow">
          <Webhook className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-headline text-2xl">Dyslexia Support</h1>
          <p className="text-muted-foreground">
            AI-powered tools to assist with reading and speech.
          </p>
        </div>
      </div>
      <Tabs defaultValue="speech-analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="speech-analysis">
            <Webhook className="w-4 h-4 mr-2" />
            Text Analysis
          </TabsTrigger>
          <TabsTrigger value="reading-challenge">
            <BookOpen className="w-4 h-4 mr-2" />
            Reading Challenge
          </TabsTrigger>
        </TabsList>
        <TabsContent value="speech-analysis">
          <SpeechAnalysisTab />
        </TabsContent>
        <TabsContent value="reading-challenge">
          <ReadingChallengeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
