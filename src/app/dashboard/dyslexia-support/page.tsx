

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { analyzeSpeechForDyslexia } from "@/ai/flows/analyze-speech-for-dyslexia";
import { compareSpeechWithTargetText, type CompareSpeechWithTargetTextOutput } from "@/ai/flows/compare-speech-with-target-text";
import { Webhook, Loader2, BookOpen, Mic, Square, Send, Target, Lightbulb, Smile, Volume2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { doc, runTransaction } from 'firebase/firestore';
import { xpValues } from '@/lib/rewards';
import { format, differenceInCalendarDays } from 'date-fns';

const challengeParagraphs = [
    "The Great Wall of China is not a single continuous wall but a system of walls, watchtowers, and fortresses built over centuries. It stretches over 13,000 miles, making it the longest man-made structure in the world.",
    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible. Its low moisture content and acidic pH create an environment where bacteria cannot survive.",
    "Octopuses have three hearts. Two hearts pump blood through the gills, while the third circulates blood to the rest of the body. Their blood is blue because it uses a copper-based protein called hemocyanin to transport oxygen.",
    "The Eiffel Tower can be 15 cm taller during the summer. When a substance is heated, its particles move more and it expands. This phenomenon, known as thermal expansion, causes the iron structure of the tower to grow in the heat.",
    "A day on Venus is longer than a year on Venus. It takes Venus longer to rotate once on its axis than to complete one orbit of the Sun. It has a rotation period of 243 Earth days, but its year is only about 225 Earth days long."
];

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
  const [challengeText, setChallengeText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [feedback, setFeedback] = useState<CompareSpeechWithTargetTextOutput | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // Select a random paragraph when the component mounts
    const randomIndex = Math.floor(Math.random() * challengeParagraphs.length);
    setChallengeText(challengeParagraphs[randomIndex]);

    // Set up Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript;
        }
        setLiveTranscript(finalTranscript);
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
      toast({ variant: "destructive", title: "No Speech Detected", description: "Please read the text first." });
      return;
    }
    if (!challengeText) {
      toast({ variant: "destructive", title: "Challenge Not Loaded", description: "Please wait a moment." });
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

      if (user && firestore && result.totalWordsInTarget > 0) {
        const userRef = doc(firestore, "users", user.uid);
        const xpGained = Math.round(result.accuracyScore * xpValues.READING_CHALLENGE_MULTIPLIER);
        
        runTransaction(firestore, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) throw "User document does not exist!";

          const userData = userDoc.data();
          
          // Stats
          const oldTotalCorrect = userData.totalCorrectAnswers || 0;
          const oldTotalAnswered = userData.totalQuestionsAnswered || 0;
          const gamesPlayed = userData.gamesPlayed || 0;
          const currentXp = userData.totalXp || 0;
          
          // Streak
          const currentStreak: number = userData.currentStreak || 0;
          const lastActiveDateStr: string = userData.lastActiveDate || '';
          const tasksDoneToday: number = userData.tasksDoneToday || 0;
          const today = new Date();
          const todayStr = format(today, 'yyyy-MM-dd');
          let newStreak = currentStreak;
          let newTasksDoneToday = tasksDoneToday;

          if (lastActiveDateStr === todayStr) {
            newTasksDoneToday += 1;
          } else {
            const lastActiveDate = lastActiveDateStr ? new Date(lastActiveDateStr) : new Date(0);
            const daysDifference = differenceInCalendarDays(today, lastActiveDate);
            newStreak = daysDifference === 1 ? currentStreak + 1 : 1;
            newTasksDoneToday = 1;
          }

          transaction.update(userRef, {
            gamesPlayed: gamesPlayed + 1,
            totalCorrectAnswers: oldTotalCorrect + result.correctlyReadWords,
            totalQuestionsAnswered: oldTotalAnswered + result.totalWordsInTarget,
            totalXp: currentXp + xpGained,
            currentStreak: newStreak,
            lastActiveDate: todayStr,
            tasksDoneToday: newTasksDoneToday,
          });
        }).catch(error => {
            console.error("Dyslexia support stats transaction failed:", error);
            toast({ variant: "destructive", title: "Save Error", description: "Could not save your progress." });
        });
      }

    } catch (error: any) {
      console.error("AI Feedback Error:", error);
      let description = "Failed to get feedback from the AI. Please try again later.";
      if (error.message && error.message.includes("API key not valid")) {
          description = "The AI service API key is not valid. Please check your .env configuration.";
      }
      toast({ variant: "destructive", title: "AI Feedback Error", description: description });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleListenToParagraph = () => {
    if (!challengeText || isSpeaking) return;

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Your browser does not support speech synthesis.",
      });
      return;
    }
    
    // If speech is already happening from a previous click, cancel it.
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const speech = new SpeechSynthesisUtterance(challengeText);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    
    speech.onstart = () => setIsSpeaking(true);
    speech.onend = () => setIsSpeaking(false);
    speech.onerror = () => {
      setIsSpeaking(false);
      toast({
        variant: "destructive",
        title: "Speech Error",
        description: "An error occurred while playing the audio.",
      });
    };

    window.speechSynthesis.speak(speech);
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
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline">Reading Challenge</CardTitle>
              <CardDescription>
                Read the text below aloud. Our AI will turn your speech into text and then offer feedback.
              </CardDescription>
            </div>
            <Button onClick={handleListenToParagraph} variant="outline" size="icon" disabled={isSpeaking || !challengeText}>
                {isSpeaking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                <span className="sr-only">Listen to Paragraph</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-lg bg-muted/50 min-h-[120px]">
          {challengeText ? (
            <p className="text-lg leading-relaxed">{challengeText}</p>
          ) : (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading new challenge...</p>
            </div>
          )}
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
          <div className="space-y-6 pt-6 animate-in fade-in">
              <Card className="bg-muted/30 border-primary/30">
                  <CardHeader>
                      <div className="flex items-center gap-3">
                          <Target className="w-6 h-6 text-primary" />
                          <CardTitle className="text-xl font-headline">Analysis Complete</CardTitle>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg bg-background/50 p-4">
                          <p className="font-semibold text-lg">Reading Accuracy</p>
                          <p className="text-3xl font-bold text-primary">{feedback.accuracyScore}%</p>
                      </div>
                      
                      <div className="rounded-lg bg-background/50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                              <Smile className="w-5 h-5 text-green-400" />
                              <h4 className="font-semibold">Positive Feedback</h4>
                          </div>
                          <p className="text-muted-foreground">{feedback.positiveFeedback}</p>
                      </div>

                      <div className="rounded-lg bg-background/50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="w-5 h-5 text-yellow-400" />
                              <h4 className="font-semibold">Improvement Tips</h4>
                          </div>
                          <p className="text-muted-foreground">{feedback.improvementTips}</p>
                      </div>

                  </CardContent>
              </Card>

              {feedback.wordsToPractice && feedback.wordsToPractice.length > 0 && (
                  <Card className="bg-muted/30">
                      <CardHeader>
                          <CardTitle className="text-lg font-semibold">Words to Practice</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                          {feedback.wordsToPractice.map((word, index) => (
                              <Badge key={index} variant="outline" className="text-lg py-1 px-3 bg-background border-destructive/50 text-destructive-foreground">
                                  {word}
                              </Badge>
                          ))}
                      </CardContent>
                  </Card>
              )}

              <Card className="bg-muted/30">
                  <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                          Target Text
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
