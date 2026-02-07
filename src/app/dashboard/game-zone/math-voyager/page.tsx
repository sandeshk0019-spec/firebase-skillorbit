'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define a type for the items for better type-safety
interface Item {
  x: number;
  y: number;
  radius: number;
  value: number;
  dy: number;
  isCorrect: boolean;
}

export default function MathVoyagerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // useRef is essential here to hold game state that can be mutated by the game loop
  // without causing re-renders, but persists across re-renders caused by useState.
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


  useEffect(() => {
    const canvas = canvasRef.current;
    const mount = gameContainerRef.current;
    if (!canvas || !mount) return;
    
    // Encapsulate the entire game within this effect hook.
    const ctx = canvas.getContext('2d')!;
    canvas.width = mount.clientWidth;
    canvas.height = 500;
    
    const player = playerRef.current;
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;

    const generateQuestion = () => {
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
    };

    const spawnItem = () => {
      if(!canvas) return;
      const radius = 25;
      const x = Math.random() * (canvas.width - radius * 2) + radius;
      const y = -radius;
      const dy = 1.5 * gameSpeed.current;

      const hasCorrectAnswer = items.current.some(item => item.isCorrect);
      const isCorrect = !hasCorrectAnswer || Math.random() < 0.25;
      
      let value: number;
      if (isCorrect) {
        value = currentAnswer.current;
      } else {
        do {
          value = currentAnswer.current + Math.floor(Math.random() * 10) - 5;
        } while (value === currentAnswer.current);
      }
      
      items.current.push({ x, y, radius, value, dy, isCorrect });
    };
    
    const update = () => {
      if(!canvas) return;
      // Move player
      if (player.isMovingLeft && player.x > player.width / 2) {
        player.x -= player.dx;
      }
      if (player.isMovingRight && player.x < canvas.width - player.width / 2) {
        player.x += player.dx;
      }

      // Spawn items on a timer
      spawnTimer.current++;
      if (spawnTimer.current % Math.max(30, 100 / gameSpeed.current) === 0) {
        spawnItem();
      }

      // Move and check items
      for (let i = items.current.length - 1; i >= 0; i--) {
        const item = items.current[i];
        if (!item) continue;
        
        item.y += item.dy;

        // Collision with player
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < player.height / 2 + item.radius) {
          if (item.isCorrect) {
            setScore((s) => s + 10);
            gameSpeed.current += 0.1;
            items.current = []; // Clear all bubbles
            generateQuestion(); // Get a new question
            
            // Immediately spawn a new set of bubbles to prevent empty screen
            for (let j = 0; j < 3; j++) {
              spawnItem();
            }

            return; // Exit loop for this frame since items array was modified
          } else {
            setScore((s) => Math.max(0, s - 5));
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 200);
            items.current.splice(i, 1);
          }
        } else if (item.y > canvas.height + item.radius) {
          // Remove off-screen items
          if (item.isCorrect) {
             // If correct answer is missed, penalize and reset
            setScore((s) => Math.max(0, s - 10));
            items.current = [];
            generateQuestion();
            
            // Immediately spawn bubbles if correct answer is missed
            for (let j = 0; j < 3; j++) {
              spawnItem();
            }

            return; // Exit loop
          }
          items.current.splice(i, 1);
        }
      }
    };
    
    const draw = () => {
        if (!ctx) return;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw player
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - player.height / 2);
        ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
        ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
        ctx.closePath();
        ctx.fill();

        // Draw items
        items.current.forEach(item => {
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.strokeStyle = item.isCorrect ? '#10b981' : '#ef4444';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 20px "Montserrat"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.value.toString(), item.x, item.y);
        });
    };
      
    const gameLoop = () => {
      if (!canvasRef.current) return;
      update();
      draw();
      animationFrameId.current = requestAnimationFrame(gameLoop);
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
      if(!canvas) return;
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
      if(!canvas) return;
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

    // Setup event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Start the game
    generateQuestion();
    gameLoop();
      
    // Cleanup function to run when the component unmounts
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };

  }, []); // The empty dependency array ensures this effect runs only once on mount.

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
