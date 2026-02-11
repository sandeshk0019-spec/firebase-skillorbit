'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getMotivationalSpeech, type MotivationalSpeechOutput } from '@/ai/flows/generate-motivational-speech';
import { BrainCircuit, Loader2, Mic, Sparkles, Square, Volume2, MessageSquare, RefreshCw } from 'lucide-react';
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
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", emoji: "⏰" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain", emoji: "🚀" },
  { quote: "It's hard to beat a person who never gives up.", author: "Babe Ruth", emoji: "🏆" },
  { quote: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon", emoji: "📖" },
  { quote: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson", emoji: "🍀" },
  { quote: "Success is the sum of small efforts, repeated day-in and day-out.", author: "Robert Collier", emoji: "🧱" },
  { quote: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu", emoji: "👟" },
  { quote: "Act as if what you do makes a difference. It does.", author: "William James", emoji: "🌊" },
  { quote: "Aim for the moon. If you miss, you may hit a star.", author: "W. Clement Stone", emoji: "🌙" },
  { quote: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar", emoji: "🦋" },
  { quote: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.", author: "Christian D. Larson", emoji: "🔥" },
  { quote: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas A. Edison", emoji: "💡" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", emoji: "🐢" },
  { quote: "The will to win, the desire to succeed, the urge to reach your full potential... these are the keys that will unlock the door to personal excellence.", author: "Confucius", emoji: "🔑" },
  { quote: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller", emoji: "💎" },
  { quote: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen R. Covey", emoji: "🧭" },
  { quote: "The mind is everything. What you think you become.", author: "Buddha", emoji: "🧠" },
  { quote: "Either you run the day or the day runs you.", author: "Jim Rohn", emoji: "🏃‍♂️" },
  { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", emoji: "⏳" },
  { quote: "Winning isn’t everything, but wanting to win is.", author: "Vince Lombardi", emoji: "🏅" },
  { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis", emoji: "🌅" },
  { quote: "The secret to success is to know something nobody else knows.", author: "Aristotle Onassis", emoji: "🤫" },
  { quote: "Do one thing every day that scares you.", author: "Eleanor Roosevelt", emoji: "👻" },
  { quote: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", emoji: "⛓️" },
  { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", emoji: "🕯️" },
  { quote: "The future starts today, not tomorrow.", author: "Pope John Paul II", emoji: "🗓️" },
  { quote: "Quality is not an act, it is a habit.", author: "Aristotle", emoji: "🔄" },
  { quote: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee", emoji: "🎯" },
  { quote: "Fall seven times and stand up eight.", author: "Japanese Proverb", emoji: "🌄" },
  { quote: "A creative man is motivated by the desire to achieve, not by the desire to beat others.", author: "Ayn Rand", emoji: "🎨" },
  { quote: "You can't build a reputation on what you are going to do.", author: "Henry Ford", emoji: "🏗️" },
  { quote: "The first step toward success is taken when you refuse to be a captive of the environment in which you first find yourself.", author: "Mark Caine", emoji: "🦋" },
  { quote: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington", emoji: "🤝" },
  { quote: "Everything you’ve ever wanted is on the other side of fear.", author: "George Addair", emoji: "🌉" },
  { quote: "You don’t have to be great to start, but you have to start to be great.", author: "Zig Ziglar", emoji: "🏁" },
  { quote: "What seems to us as bitter trials are often blessings in disguise.", author: "Oscar Wilde", emoji: "🎭" },
  { quote: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", emoji: "👤" },
  { quote: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau", emoji: "🌌" },
  { quote: "When I stand before God at the end of my life, I would hope that I would not have a single bit of talent left and could say, I used everything you gave me.", author: "Erma Bombeck", emoji: "🎁" },
  { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe", emoji: "🛠️" },
  { quote: "Problems are not stop signs, they are guidelines.", author: "Robert H. Schuller", emoji: "🚧" },
  { quote: "I can't change the direction of the wind, but I can adjust my sails to always reach my destination.", author: "Jimmy Dean", emoji: "⛵" },
  { quote: "Perfection is not attainable, but if we chase perfection we can catch excellence.", author: "Vince Lombardi", emoji: "🏹" },
  { quote: "The best way to predict the future is to create it.", author: "Peter Drucker", emoji: "🌍" },
  { quote: "You must do the thing you think you cannot do.", author: "Eleanor Roosevelt", emoji: "🧗‍♀️" },
  { quote: "It’s not whether you get knocked down, it’s whether you get up.", author: "Vince Lombardi", emoji: "🥊" },
  { quote: "Your attitude, not your aptitude, will determine your altitude.", author: "Zig Ziglar", emoji: "🎈" },
  { quote: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson", emoji: "🎭" },
  { quote: "We can do anything we want to do if we stick to it long enough.", author: "Helen Keller", emoji: "💪" },
  { quote: "If you are not willing to risk the usual, you will have to settle for the ordinary.", author: "Jim Rohn", emoji: "🎲" },
  { quote: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney", emoji: "🏰" },
  { quote: "The harder the conflict, the more glorious the triumph.", author: "Thomas Paine", emoji: "⚔️" },
  { quote: "I attribute my success to this: I never gave or took any excuse.", author: "Florence Nightingale", emoji: "🚫" },
  { quote: "To accomplish great things, we must not only act, but also dream; not only plan, but also believe.", author: "Anatole France", emoji: "🌠" },
  { quote: "Don't let yesterday take up too much of today.", author: "Will Rogers", emoji: "🌅" }
];

function TextMotivationTab() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Set a random quote on initial load
  useEffect(() => {
    setCurrentIndex(Math.floor(Math.random() * textMotivations.length));
  }, []);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % textMotivations.length);
  };

  const currentMotivation = textMotivations[currentIndex];
  
  if (!currentMotivation) {
    return (
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="font-headline">Daily Spark</CardTitle>
                <CardDescription>
                A few words of encouragement to brighten your day.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Loading motivation...</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="font-headline">Daily Spark</CardTitle>
        <CardDescription>
          A few words of encouragement to brighten your day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div className="bg-muted/50 p-6 rounded-lg flex flex-col items-center gap-4 min-h-[200px] justify-center animate-in fade-in">
            <span className="text-4xl">{currentMotivation.emoji}</span>
            <blockquote className="text-lg font-semibold text-primary">
              "{currentMotivation.quote}"
            </blockquote>
            <cite className="text-sm text-muted-foreground self-end">- {currentMotivation.author}</cite>
        </div>
        <Button onClick={handleNext} size="lg" className="w-full">
            <RefreshCw className="mr-2 h-5 w-5" />
            Next Spark
        </Button>
      </CardContent>
    </Card>
  );
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
