
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { XCircle, Keyboard, Rocket, Shield, Heart, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, runTransaction, getDoc, setDoc } from 'firebase/firestore';
import { type GameScore, type Activity } from '@/types';
import { achievements } from '@/lib/achievements';
import { updateUserStreak } from '@/lib/streak';
import { useToast } from "@/hooks/use-toast";
import { awardXp } from '@/lib/xp';
import { xpValues } from '@/lib/rewards';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Game settings
const WORD_LIST = ["ATOM", "CELL", "GRAVITY", "FORCE", "JOULE", "DATA", "ORBIT", "LASER", "NEBULA", "QUASAR", "BINARY", "ALGORITHM"];
const SPAWN_RATE = 120; // frames
const BASE_SPEED = 1;
const STARTING_LIVES = 5;

interface Word {
  text: string;
  x: number;
  y: number;
  speed: number;
}

interface Star {
    x: number;
    y: number;
    radius: number;
}

export default function CosmicTyperPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopId = useRef<number>();
  const frameCount = useRef(0);
  const words = useRef<Word[]>([]);
  const stars = useRef<Star[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isMatch, setIsMatch] = useState(false);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const checkAndUnlockAchievement = useCallback(async (achievementId: keyof typeof achievements) => {
    if (!user || !firestore) return;
    const achRef = doc(firestore, 'users', user.uid, 'achievements', achievementId);
    const achDoc = await getDoc(achRef);

    if (!achDoc.exists()) {
        const achData = achievements[achievementId];
        const achievementData = {
            userId: user.uid,
            achievementId: achievementId,
            unlockedAt: serverTimestamp(),
        };
        setDoc(achRef, achievementData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: achRef.path,
                operation: 'create',
                requestResourceData: achievementData
            }));
        });
        
        const activityData = {
            userId: user.uid,
            type: 'ACHIEVEMENT_UNLOCKED' as const,
            description: `Unlocked: ${achData.name}`,
            createdAt: serverTimestamp(),
        };
        const activitiesColRef = collection(firestore, 'users', user.uid, 'activities');
        addDoc(activitiesColRef, activityData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: activitiesColRef.path,
                operation: 'create',
                requestResourceData: activityData
            }));
        });

        toast({
            title: "Achievement Unlocked!",
            description: (
                <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <div>
                        <p className="font-semibold">{achData.name}</p>
                        <p className="text-xs">{achData.description}</p>
                    </div>
                </div>
            ),
        });
    }
  }, [user, firestore, toast]);

  const saveGameResult = useCallback(async () => {
    if (!user || !firestore || hasSaved) return;

    setHasSaved(true);

    try {
        const userRef = doc(firestore, "users", user.uid);
        const now = serverTimestamp();

        const gameScoreData: Omit<GameScore, 'id'> = {
            userId: user.uid,
            gameId: 'cosmic-typer',
            gameName: 'Cosmic Typer',
            score: score,
            createdAt: now as any,
        };
        
        const scoresColRef = collection(userRef, "gameScores");
        const scoreRef = await addDoc(scoresColRef, gameScoreData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: scoresColRef.path,
                operation: 'create',
                requestResourceData: gameScoreData
            }));
        });

        const activityData: Omit<Activity, 'id'> = {
            userId: user.uid,
            type: 'GAME_PLAYED',
            description: `Scored ${score} in Cosmic Typer.`,
            refId: scoreRef?.id,
            createdAt: now as any,
        };
        const activitiesColRef = collection(userRef, "activities");
        addDoc(activitiesColRef, activityData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: activitiesColRef.path,
                operation: 'create',
                requestResourceData: activityData
            }));
        });

        runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) return;
            const data = userDoc.data();
            const currentGamesPlayed = data.gamesPlayed || 0;

            transaction.update(userRef, {
                gamesPlayed: currentGamesPlayed + 1,
            });
        }).catch(error => {
            console.error("Cosmic Typer gamesPlayed transaction failed:", error);
        });
        
        const xpGained = score * xpValues.COSMIC_TYPER_MULTIPLIER;
        awardXp(firestore, user.uid, xpGained, toast);
        
        updateUserStreak(firestore, user.uid);
        if (score > 100) {
            await checkAndUnlockAchievement('COSMIC_KEYMASTER');
        }

    } catch (error) {
         console.error("Error saving game results:", error);
         toast({
            variant: "destructive",
            title: "Save Error",
            description: "Could not save your game progress.",
        });
    }
  }, [user, firestore, score, hasSaved, toast, checkAndUnlockAchievement]);

  useEffect(() => {
    if (isGameOver && !hasSaved) {
      saveGameResult();
    }
  }, [isGameOver, hasSaved, saveGameResult]);

  // Initialize stars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const numStars = 100;
      const newStars: Star[] = [];
      for (let i = 0; i < numStars; i++) {
        newStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
        });
      }
      stars.current = newStars;
    }
  }, []);
  
  const resetGame = useCallback(() => {
    setIsPlaying(false);
    setIsGameOver(false);
    setHasSaved(false);
    setScore(0);
    setLives(STARTING_LIVES);
    setInputValue('');
    words.current = [];
    frameCount.current = 0;
    if (gameLoopId.current) {
      cancelAnimationFrame(gameLoopId.current);
    }
  }, []);

  const startGame = () => {
    resetGame();
    setIsPlaying(true);
    inputRef.current?.focus();
    gameLoopId.current = requestAnimationFrame(gameLoop);
  };
  
  const spawnWord = (canvas: HTMLCanvasElement) => {
    const text = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.font = '20px "Montserrat", sans-serif';
    const textWidth = ctx.measureText(text).width;
    const x = Math.random() * (canvas.width - textWidth);
    const speed = BASE_SPEED + (score / 100); // Speed increases with score
    words.current.push({ text, x, y: -30, speed });
  };
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trail effect
    ctx.fillStyle = 'rgba(10, 10, 26, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = 'white';
    stars.current.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw words
    ctx.fillStyle = '#10b981';
    ctx.font = '20px "Montserrat", sans-serif';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    
    words.current.forEach(word => {
      ctx.fillText(word.text, word.x, word.y);
    });

    ctx.shadowBlur = 0;
  }, []);


  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isPlaying || isGameOver) {
        if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
        return;
    }

    frameCount.current++;

    if (frameCount.current % SPAWN_RATE === 0) {
      spawnWord(canvas);
    }

    const newWords: Word[] = [];
    let livesLost = 0;
    for (const word of words.current) {
      word.y += word.speed;
      if (word.y > canvas.height) {
        livesLost++;
      } else {
        newWords.push(word);
      }
    }
    words.current = newWords;
    
    if (livesLost > 0) {
        setLives(prev => {
            const newLives = prev - livesLost;
            if (newLives <= 0) {
                setIsGameOver(true);
                setIsPlaying(false);
                return 0;
            }
            return newLives;
        });
    }
    
    draw();
    gameLoopId.current = requestAnimationFrame(gameLoop);
  }, [draw, isPlaying, isGameOver]);
  
  useEffect(() => {
    return () => {
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value.toUpperCase();
    setInputValue(typedValue);

    const matchIndex = words.current.findIndex(word => word.text === typedValue);
    if (matchIndex !== -1) {
      words.current.splice(matchIndex, 1);
      setScore(prev => prev + 10);
      setInputValue('');
      
      // Trigger visual feedback
      setIsMatch(true);
      setTimeout(() => setIsMatch(false), 200);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 bg-background text-foreground relative">
      <div className="w-full max-w-3xl z-10">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Keyboard className="w-8 h-8 text-emerald-500" />
            <div>
              <h1 className="font-headline text-3xl">Cosmic Typer</h1>
              <p className="text-muted-foreground">Defend the Galaxy with Words</p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                <span className="font-mono text-xl text-red-400">{lives}</span>
            </div>
            <p className="font-mono text-xl">Score: <span className="text-green-400">{score}</span></p>
            <Link href="/dashboard/game-zone" onClick={resetGame}>
              <Button variant="ghost" size="icon">
                <XCircle className="w-8 h-8" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="relative flex flex-col items-center">
            <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className={cn(
                    "rounded-2xl border-2 w-full border-white/20 bg-black/50 transition-all duration-200",
                    isMatch && "shadow-[0_0_20px_#10b981] border-green-400",
                    (!isPlaying || isGameOver) && "blur-sm"
                )}
            />
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                   {isGameOver ? (
                        <div className="text-center bg-black/70 backdrop-blur-sm p-8 rounded-xl animate-in fade-in-0">
                            <h2 className="font-headline text-4xl text-red-500 mb-2">Game Over</h2>
                            <p className="text-xl mb-4">Final Score: <span className="font-bold text-green-400">{score}</span></p>
                            <Button size="lg" onClick={startGame} className="bg-emerald-600 hover:bg-emerald-500">
                                <RefreshCw className="mr-2 h-5 w-5" />
                                Play Again
                            </Button>
                        </div>
                    ) : (
                        <Button size="lg" onClick={startGame} className="animate-pulse-glow bg-emerald-600 hover:bg-emerald-500">
                            <Rocket className="mr-2 h-5 w-5" />
                            Start Mission
                        </Button>
                    )}
                </div>
            )}
            <Input
                ref={inputRef}
                type="text"
                placeholder={isPlaying ? "Type falling words..." : "Press Start Mission to play"}
                value={inputValue}
                onChange={handleInputChange}
                disabled={!isPlaying || isGameOver}
                className="mt-6 w-full max-w-md text-center uppercase tracking-widest font-mono text-lg bg-black/40 border-white/20 h-12"
            />
        </main>
      </div>
    </div>
  );
}

    