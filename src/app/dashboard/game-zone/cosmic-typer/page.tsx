'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { XCircle, Keyboard, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Game settings
const WORD_LIST = ["ATOM", "CELL", "GRAVITY", "FORCE", "JOULE", "DATA", "ORBIT", "LASER", "NEBULA", "QUASAR", "BINARY", "ALGORITHM"];
const SPAWN_RATE = 120; // frames
const BASE_SPEED = 1;

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

  const inputRef = useRef<HTMLInputElement>(null);

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
    setScore(0);
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
    setScore(0);
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
    const speed = BASE_SPEED + Math.random() * 0.5;
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

    frameCount.current++;

    if (frameCount.current % SPAWN_RATE === 0) {
      spawnWord(canvas);
    }

    // Update word positions and check for misses
    const newWords: Word[] = [];
    let scoreDelta = 0;
    for (const word of words.current) {
      word.y += word.speed;
      if (word.y > canvas.height) {
        scoreDelta -= 5;
      } else {
        newWords.push(word);
      }
    }
    words.current = newWords;
    if (scoreDelta !== 0) {
       setScore(prev => Math.max(0, prev + scoreDelta));
    }
    
    draw();
    gameLoopId.current = requestAnimationFrame(gameLoop);
  }, [draw]);
  
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
          <div className="flex items-center gap-6">
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
                    !isPlaying && "blur-sm"
                )}
            />
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Button size="lg" onClick={startGame} className="animate-pulse-glow bg-emerald-600 hover:bg-emerald-500">
                        <Rocket className="mr-2 h-5 w-5" />
                        Start Mission
                    </Button>
                </div>
            )}
            <Input
                ref={inputRef}
                type="text"
                placeholder="Type falling words..."
                value={inputValue}
                onChange={handleInputChange}
                disabled={!isPlaying}
                className="mt-6 w-full max-w-md text-center uppercase tracking-widest font-mono text-lg bg-black/40 border-white/20 h-12"
            />
        </main>
      </div>
    </div>
  );
}
