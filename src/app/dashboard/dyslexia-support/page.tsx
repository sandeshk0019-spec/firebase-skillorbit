"use client";

import { useState } from "react";
import { analyzeSpeechForDyslexia } from "@/ai/flows/analyze-speech-for-dyslexia";
import { Webhook, Info, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function SpeechAnalysisTab() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ correctedSpeech: string; feedback: string } | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (text.trim() === "") {
      toast({ variant: "destructive", title: "Input required", description: "Please enter some text to analyze." });
      return;
    }
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeSpeechForDyslexia({ speech: text });
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to analyze speech. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="font-headline">Text Analysis</CardTitle>
        <CardDescription>Type out what you want to say, and our AI will provide gentle feedback.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Input your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="bg-background/50"
        />
        <Button onClick={handleAnalyze} disabled={isLoading} className="w-full animate-pulse-glow">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Webhook className="mr-2 h-4 w-4" />}
          Analyze Text
        </Button>
        {analysis && (
          <div className="space-y-4 pt-4 animate-in fade-in">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Corrected Text</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="italic text-primary">{analysis.correctedSpeech}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert prose-p:text-foreground/90" dangerouslySetInnerHTML={{ __html: analysis.feedback }} />
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReadingChallengeTab() {
  const challengeText = "The quick brown fox jumps over the lazy dog. This sentence contains all of the letters of the alphabet. Practicing it can help improve pronunciation and reading fluency.";

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="font-headline">Reading Challenge</CardTitle>
        <CardDescription>Read the text below aloud. Our AI will compare your speech to the text and offer feedback. (Audio recording is a demo feature).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-lg leading-relaxed">{challengeText}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button disabled className="w-full">
                  <Webhook className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Audio recording is not supported in this demo environment.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
              <h1 className="font-headline text-2xl">Neuro-Speech Hub</h1>
              <p className="text-muted-foreground">Tools to build confidence in reading and speaking.</p>
            </div>
          </div>
      <Tabs defaultValue="speech-analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="speech-analysis"><Webhook className="w-4 h-4 mr-2" />Text Analysis</TabsTrigger>
          <TabsTrigger value="reading-challenge"><BookOpen className="w-4 h-4 mr-2" />Reading Challenge</TabsTrigger>
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
