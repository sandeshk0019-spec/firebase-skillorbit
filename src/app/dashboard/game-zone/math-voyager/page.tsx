'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MathVoyagerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mount = gameContainerRef.current;
    if (!canvas || !mount) return;

    let cleanup: () => void;

    // This function will encapsulate the entire game as requested.
    const start2DGame = () => {
      const ctx = canvas.getContext('2d')!;
      canvas.width = mount.clientWidth;
      canvas.height = 500;

      let gameSpeed = 1;
      let currentAnswer = 0;
      let animationFrameId: number;

      // Player
      const player = {
        x: canvas.width / 2,
        y: canvas.height - 50,
        width: 40,
        height: 40,
        dx: 8,
        isMovingLeft: false,
        isMovingRight: false,
      };

      // Items
      let items: { x: number; y: number; radius: number; value: number; dy: number; isCorrect: boolean }[] = [];
      let spawnTimer = 0;

      const generateQuestion = () => {
        const ops = ['+', '-', '*'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let num1 = Math.floor(Math.random() * 10) + 1;
        let num2 = Math.floor(Math.random() * 10) + 1;

        if (op === '-') {
            if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure positive result
        }
        if (op === '*') {
            num1 = Math.floor(Math.random() * 5) + 1;
            num2 = Math.floor(Math.random() * 5) + 1;
        }

        setQuestion(`${num1} ${op} ${num2} = ?`);
        currentAnswer = eval(`${num1} ${op} ${num2}`);
      };

      const spawnItem = () => {
        const radius = 25;
        const x = Math.random() * (canvas.width - radius * 2) + radius;
        const y = -radius;
        const dy = 1.5 * gameSpeed;

        // Ensure at least one correct answer is present or 25% chance to spawn one
        const hasCorrectAnswer = items.some(item => item.isCorrect);
        const isCorrect = !hasCorrectAnswer || Math.random() < 0.25;
        
        let value: number;
        if (isCorrect) {
          value = currentAnswer;
        } else {
          do {
            value = currentAnswer + Math.floor(Math.random() * 10) - 5;
          } while (value === currentAnswer);
        }
        
        items.push({ x, y, radius, value, dy, isCorrect });
      };

      const update = () => {
        // Move player
        if (player.isMovingLeft && player.x > player.width / 2) {
          player.x -= player.dx;
        }
        if (player.isMovingRight && player.x < canvas.width - player.width / 2) {
          player.x += player.dx;
        }

        // Spawn items
        spawnTimer++;
        if (spawnTimer % Math.max(30, 100 / gameSpeed) === 0) {
          spawnItem();
        }

        // Move and check items
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          item.y += item.dy;

          // Collision with player
          const dist = Math.hypot(player.x - item.x, player.y - item.y);
          if (dist < player.height / 2 + item.radius) {
            if (item.isCorrect) {
              setScore((s) => s + 10);
              gameSpeed += 0.1;
              items = [];
              generateQuestion();
              return; // This prevents a crash by exiting the update loop for this frame.
            } else {
              setScore((s) => Math.max(0, s - 5));
              setIsShaking(true);
              setTimeout(() => setIsShaking(false), 200);
              items.splice(i, 1);
            }
          } else if (item.y > canvas.height + item.radius) {
            // Remove off-screen items
            items.splice(i, 1);
          }
        }
      };

      const draw = () => {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw player
        ctx.fillStyle = '#3b82f6'; // Blue color
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - player.height / 2);
        ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
        ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
        ctx.closePath();
        ctx.fill();

        // Draw items
        items.forEach(item => {
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.strokeStyle = item.isCorrect ? '#10b981' : '#ef4444'; // Green/Red
          ctx.lineWidth = 3;
          ctx.stroke();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 20px "Montserrat"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.value.toString(), item.x, item.y);
        });
      };
      
      const startGameLoop = () => {
        if (!canvasRef.current) return; // Stop if canvas is gone
        update();
        draw();
        animationFrameId = requestAnimationFrame(startGameLoop);
      };

      // Event Handlers
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') player.isMovingLeft = true;
        if (e.key === 'ArrowRight') player.isMovingRight = true;
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') player.isMovingLeft = false;
        if (e.key === 'ArrowRight') player.isMovingRight = false;
      };
      
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
        if (touchX < player.x) {
          player.isMovingLeft = true;
          player.isMovingRight = false;
        } else {
          player.isMovingRight = true;
          player.isMovingLeft = false;
        }
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
         if (touchX < player.x) {
          player.isMovingLeft = true;
          player.isMovingRight = false;
        } else {
          player.isMovingRight = true;
          player.isMovingLeft = false;
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        player.isMovingLeft = false;
        player.isMovingRight = false;
      };

      // Setup
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      generateQuestion();
      startGameLoop();
      
      // Cleanup function
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchcancel', handleTouchEnd);
      };
    };

    cleanup = start2DGame();
    
    return cleanup;

  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 bg-background text-foreground">
      <div id="active-game-mount" ref={gameContainerRef} className={cn("w-full max-w-3xl", isShaking && 'animate-shake')}>
        <header className="flex items-center justify-between mb-0 p-4 bg-[#0a0a1a] rounded-t-lg border-b border-blue-500/50">
          <div className="flex items-center gap-4">
            <Calculator className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="font-headline text-2xl md:text-3xl text-white">Math Voyager</h1>
            </div>
          </div>
          <Link href="/dashboard/game-zone">
            <Button variant="ghost" size="icon">
              <XCircle className="w-8 h-8 text-white/70 hover:text-white" />
            </Button>
          </Link>
        </header>
        <div className="w-full bg-[#0a0a1a] p-4 text-center">
            <p className="font-mono text-2xl text-white font-bold tracking-widest">{question}</p>
        </div>
        <canvas ref={canvasRef} className="w-full bg-[#0a0a1a] block" />
        <footer className="w-full bg-[#0a0a1a] p-4 rounded-b-lg border-t border-blue-500/50 text-center">
            <p className="font-mono text-2xl text-white font-bold">SCORE: <span className="text-blue-400">{score}</span></p>
        </footer>
      </div>
    </div>
  );
}
