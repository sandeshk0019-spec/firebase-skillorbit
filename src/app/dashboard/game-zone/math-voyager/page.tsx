

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle, Calculator, Heart, RefreshCw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, runTransaction, getDoc, setDoc } from 'firebase/firestore';
import { type GameScore, type Activity } from '@/types';
import { achievements } from '@/lib/achievements';
import { useToast } from "@/hooks/use-toast";
import { xpValues, rewardTiers } from '@/lib/rewards';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { format, differenceInCalendarDays } from 'date-fns';

interface Item {
  x: number;
  y: number;
  radius: number;
  value: number;
  dy: number;
  isCorrect: boolean;
}

const STARTING_LIVES = 3;

export default function MathVoyagerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const items = useRef<Item[]>([]);
  const gameSpeed = useRef(1);
  const currentAnswer = useRef(0);
  const spawnTimer = useRef(0);
  const animationFrameId = useRef<number>();
  const playerRef = useRef({
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    dx: 8,
    isMovingLeft: false,
    isMovingRight: false,
  });
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const checkAndUnlockAchievement = useCallback((achievementId: keyof typeof achievements) => {
    if (!user || !firestore) return;
    const achRef = doc(firestore, 'users', user.uid, 'achievements', achievementId);
    
    // Fire-and-forget check
    getDoc(achRef).then(achDoc => {
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
    }).catch(error => console.error("Error checking achievement:", error));
  }, [user, firestore, toast]);

  const saveGameResult = useCallback(() => {
    if (!user || !firestore || hasSaved) return;

    setHasSaved(true);
    const userRef = doc(firestore, "users", user.uid);
    const now = serverTimestamp();
    const xpGained = score * xpValues.MATH_VOYAGER_MULTIPLIER;

    runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw "User document does not exist!";
      const userData = userDoc.data();

      // --- Game Score & Activity ---
      const gameScoreData: Omit<GameScore, 'id'> = {
        userId: user.uid,
        gameId: 'math-voyager',
        gameName: 'Math Voyager',
        score: score,
        createdAt: now as any,
      };
      const scoreRef = doc(collection(userRef, "gameScores"));
      transaction.set(scoreRef, gameScoreData);

      const activityData: Omit<Activity, 'id'> = {
        userId: user.uid,
        type: 'GAME_PLAYED',
        description: `Scored ${score} in Math Voyager.`,
        refId: scoreRef.id,
        createdAt: now as any,
      };
      const activityRef = doc(collection(userRef, "activities"));
      transaction.set(activityRef, activityData);

      // --- User Stats Update ---
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

      const currentGamesPlayed = userData.gamesPlayed || 0;
      const currentXp = userData.totalXp || 0;
      const newXp = currentXp + xpGained;

      transaction.update(userRef, {
        gamesPlayed: currentGamesPlayed + 1,
        currentStreak: newStreak,
        lastActiveDate: todayStr,
        tasksDoneToday: newTasksDoneToday,
        totalXp: newXp,
      });

      return { newXp, currentXp };
    }).then(({ newXp, currentXp }) => {
      // --- Post-Transaction Side Effects ---
      if (score > 50) {
        checkAndUnlockAchievement('MATH_VOYAGER_ACE');
      }
       for (const tier of rewardTiers) {
        if (newXp >= tier.xpThreshold && currentXp < tier.xpThreshold) {
          // Toast logic here or in checkAndUnlockAchievement
        }
      }
    }).catch(error => {
      console.error("Math Voyager save transaction failed:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save your game progress." });
    });
  }, [user, firestore, score, hasSaved, toast, checkAndUnlockAchievement]);

  const generateQuestion = useCallback(() => {
      const ops = ['+', '-', '*'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let num1 = Math.floor(Math.random() * 10) + 1;
      let num2 = Math.floor(Math.random() * 10) + 1;

      if (op === '-') {
        if (num1 < num2) [num1, num2] = [num2, num1];
      }
      if (op === '*') {
        num1 = Math.floor(Math.random() * 5) + 1;
        num2 = Math.floor(Math.random() * 5) + 1;
      }

      setQuestion(`${num1} ${op} ${num2} = ?`);
      currentAnswer.current = eval(`${num1} ${op} ${num2}`);
  }, []);

  const resetGame = useCallback(() => {
      setScore(0);
      setLives(STARTING_LIVES);
      setIsGameOver(false);
      setHasSaved(false);
      setIsPlaying(false);
      items.current = [];
      gameSpeed.current = 1;
      generateQuestion();
      if(animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
  }, [generateQuestion]);

  const startGame = useCallback(() => {
      resetGame();
      setIsPlaying(true);
      
      const gameLoop = () => {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        // --- UPDATE LOGIC ---
        const player = playerRef.current;

        if (player.isMovingLeft && player.x > player.width / 2) player.x -= player.dx;
        if (player.isMovingRight && player.x < canvas.width - player.width / 2) player.x += player.dx;

        spawnTimer.current++;
        if (spawnTimer.current % Math.max(30, 100 / gameSpeed.current) === 0) {
            const radius = 25;
            const x = Math.random() * (canvas.width - radius * 2) + radius;
            const dy = 1.5 * gameSpeed.current;
            const hasCorrectAnswer = items.current.some(item => item.isCorrect);
            const isCorrect = !hasCorrectAnswer || Math.random() < 0.25;
            let value;
            if (isCorrect) {
              value = currentAnswer.current;
            } else {
              do {
                value = currentAnswer.current + Math.floor(Math.random() * 10) - 5;
              } while (value === currentAnswer.current);
            }
            items.current.push({ x, y: -radius, radius, value, dy, isCorrect });
        }

        for (let i = items.current.length - 1; i >= 0; i--) {
            const item = items.current[i];
            item.y += item.dy;
            
            const dist = Math.hypot(player.x - item.x, player.y - item.y);
            if (dist < player.height / 2 + item.radius) {
                if (item.isCorrect) {
                    setScore(s => s + 10);
                    gameSpeed.current += 0.1;
                    items.current = [];
                    generateQuestion();
                    return;
                } else {
                    setLives(l => l - 1);
                    setIsShaking(true);
                    setTimeout(() => setIsShaking(false), 200);
                    items.current.splice(i, 1);
                }
            } else if (item.y > canvas.height + item.radius) {
                if (item.isCorrect) {
                    setLives(l => l - 1);
                }
                items.current.splice(i, 1);
            }
        }
        
        // --- DRAW LOGIC ---
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - player.height / 2);
        ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
        ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
        ctx.closePath();
        ctx.fill();

        items.current.forEach(item => {
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 20px "Montserrat"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.value.toString(), item.x, item.y);
        });
      };
      
      gameLoop();

  }, [resetGame, generateQuestion]);


  useEffect(() => {
    const canvas = canvasRef.current;
    const mount = gameContainerRef.current;
    if (!canvas || !mount) return;
    
    canvas.width = mount.clientWidth;
    canvas.height = 500;
    
    playerRef.current.x = canvas.width / 2;
    playerRef.current.y = canvas.height - 50;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') playerRef.current.isMovingLeft = true;
      if (e.key === 'ArrowRight') playerRef.current.isMovingRight = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') playerRef.current.isMovingLeft = false;
      if (e.key === 'ArrowRight') playerRef.current.isMovingRight = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
      
    generateQuestion();
      
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };

  }, [generateQuestion]);

  useEffect(() => {
    if (lives <= 0 && !isGameOver) {
      setIsGameOver(true);
      setIsPlaying(false);
      if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    }
  }, [lives, isGameOver]);

  useEffect(() => {
    if (isGameOver && !hasSaved) {
        saveGameResult();
    }
  }, [isGameOver, hasSaved, saveGameResult]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 bg-background text-foreground">
      <div id="active-game-mount" ref={gameContainerRef} className={cn("w-full max-w-3xl relative", isShaking && 'animate-shake')}>
        <header className="flex items-center justify-between mb-0 p-4 bg-[#0a0a1a] rounded-t-lg border-b border-blue-500/50">
          <div className="flex items-center gap-4">
            <Calculator className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="font-headline text-2xl md:text-3xl text-white">Math Voyager</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                <span className="font-mono text-xl text-red-400">{lives}</span>
            </div>
            <Link href="/dashboard/game-zone" onClick={resetGame}>
              <Button variant="ghost" size="icon">
                <XCircle className="w-8 h-8 text-white/70 hover:text-white" />
              </Button>
            </Link>
          </div>
        </header>
        <div className="w-full bg-[#0a0a1a] p-4 text-center">
            <p className="font-mono text-2xl text-white font-bold tracking-widest">{question}</p>
        </div>
        <canvas ref={canvasRef} className="w-full bg-[#0a0a1a] block" />
         {!isPlaying && (
            <div className="absolute inset-0 top-[170px] flex items-center justify-center z-10 bg-black/30">
               {isGameOver ? (
                    <div className="text-center bg-black/70 backdrop-blur-sm p-8 rounded-xl animate-in fade-in-0">
                        <h2 className="font-headline text-4xl text-red-500 mb-2">Game Over</h2>
                        <p className="text-xl mb-4">Final Score: <span className="font-bold text-blue-400">{score}</span></p>
                        <Button size="lg" onClick={startGame} className="bg-blue-600 hover:bg-blue-500">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Play Again
                        </Button>
                    </div>
                ) : (
                    <Button size="lg" onClick={startGame} className="animate-pulse-glow bg-blue-600 hover:bg-blue-500">
                        Start Game
                    </Button>
                )}
            </div>
        )}
        <footer className="w-full bg-[#0a0a1a] p-4 rounded-b-lg border-t border-blue-500/50 text-center">
            <p className="font-mono text-2xl text-white font-bold">SCORE: <span className="text-blue-400">{score}</span></p>
        </footer>
      </div>
    </div>
  );
}
