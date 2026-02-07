'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { XCircle, Flame, Snowflake, RotateCw, TestTube, Beaker, FlaskConical, Droplet, Zap, Atom } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define types for better type-safety
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  type: 'fire' | 'smoke' | 'bubble' | 'steam';
  radius: number;
}

interface LabState {
  volume: number;
  ph: number;
  temp: number;
  color: { r: number; g: number; b: number; a: number };
  composition: string[];
  particles: Particle[];
  isBoiling: boolean;
  isExploding: boolean;
  explosionTimer: number;
}

const chemicals = {
    liquids: [
        { id: 'water', name: 'Water', icon: Droplet },
        { id: 'acid', name: 'Acid (HCl)', icon: TestTube },
        { id: 'base', name: 'Base (NaOH)', icon: TestTube },
    ],
    solids: [
        { id: 'sodium', name: 'Sodium (Na)', icon: Atom },
        { id: 'potassium', name: 'Potassium (K)', icon: Atom },
        { id: 'magnesium', name: 'Magnesium (Mg)', icon: Atom },
    ],
    indicators: [
        { id: 'universal_indicator', name: 'Universal Indicator', icon: FlaskConical },
        { id: 'phenolphthalein', name: 'Phenolphthalein', icon: FlaskConical },
        { id: 'copper_sulfate', name: 'Copper Sulfate', icon: Beaker },
        { id: 'silver_nitrate', name: 'Silver Nitrate', icon: Beaker },
    ]
};

const tools = [
    { id: 'heat', name: 'Heat', icon: Flame },
    { id: 'cool', name: 'Cool', icon: Snowflake },
    { id: 'stir', name: 'Stir', icon: RotateCw },
];

export default function ChemLabSimPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [consoleLogs, setConsoleLogs] = useState<string[]>(['> Lab initialized. Ready for experimentation.']);
    
    // Use useRef for lab state to prevent re-renders on every animation frame
    const labState = useRef<LabState>({
        volume: 200,
        ph: 7.0,
        temp: 25,
        color: { r: 173, g: 216, b: 230, a: 0.5 }, // Light blue for water
        composition: ['water'],
        particles: [],
        isBoiling: false,
        isExploding: false,
        explosionTimer: 0,
    });

    const animationFrameId = useRef<number>();
    const frameCount = useRef(0);

    const logToConsole = (message: string) => {
        setConsoleLogs(prev => [`> ${message}`, ...prev].slice(0, 50));
    };

    const getPhColor = useCallback((ph: number) => {
        if (ph < 3) return { r: 255, g: 0, b: 0 }; // Strong Acid
        if (ph < 6) return { r: 255, g: 165, b: 0 }; // Weak Acid
        if (ph < 8) return { r: 0, g: 255, b: 0 }; // Neutral
        if (ph < 11) return { r: 0, g: 0, b: 255 }; // Weak Base
        return { r: 128, g: 0, b: 128 }; // Strong Base
    }, []);

    const spawnParticles = useCallback((count: number, type: Particle['type'], centerX: number, centerY: number) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = type === 'fire' ? Math.random() * 5 + 2 : Math.random() * 2 + 0.5;
            labState.current.particles.push({
                x: centerX + (Math.random() - 0.5) * (type === 'fire' ? 50 : 20),
                y: centerY + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: type === 'bubble' || type === 'steam' ? -speed : Math.sin(angle) * speed - (type === 'fire' ? 3 : 0),
                life: type === 'fire' ? 40 + Math.random() * 20 : 80 + Math.random() * 40,
                type,
                radius: Math.random() * (type === 'fire' ? 4 : 3) + 2,
            });
        }
    }, []);

    const labAdd = useCallback((type: string) => {
        const state = labState.current;
        logToConsole(`Added ${type}.`);
        state.composition.push(type);
        state.volume = Math.min(450, state.volume + 25);

        let reactionOccurred = false;

        // Chemical Reactions
        switch(type) {
            case 'acid':
                state.ph = Math.max(0, state.ph - 3);
                if (state.composition.includes('magnesium')) {
                    logToConsole('Reaction: Magnesium + Acid -> Bubbles (H₂)');
                    spawnParticles(30, 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                break;
            case 'base':
                state.ph = Math.min(14, state.ph + 3);
                break;
            case 'water':
                state.ph += (7 - state.ph) * 0.3; // Neutralize towards 7
                break;
            case 'sodium':
            case 'potassium':
                if (state.composition.includes('water')) {
                    logToConsole(`DANGER: ${type} reacts violently with water!`);
                    state.isExploding = true;
                    state.explosionTimer = 50; // duration of shake
                    state.temp += 50;
                    spawnParticles(100, 'fire', 400, 350);
                    spawnParticles(50, 'smoke', 400, 350);
                    reactionOccurred = true;
                }
                break;
             case 'copper_sulfate':
                state.color = { r: 0, g: 100, b: 255, a: 0.6 }; // Blue solution
                break;
        }

        // Indicator Reactions
        if (state.composition.includes('universal_indicator')) {
            const { r, g, b } = getPhColor(state.ph);
            state.color = { r, g, b, a: 0.6 };
        }
        if (state.composition.includes('phenolphthalein')) {
            if (state.ph >= 8.2) state.color = { r: 255, g: 20, b: 147, a: 0.6 }; // Pink
            else state.color = { r: 173, g: 216, b: 230, a: 0.5 }; // Colorless
        }

        if(!reactionOccurred) spawnParticles(10, 'bubble', 400, 400);

    }, [getPhColor, spawnParticles]);

    const labAction = useCallback((action: string) => {
        logToConsole(`Action: ${action}.`);
        if (action === 'heat') {
            labState.current.temp += 20;
        } else if (action === 'cool') {
            labState.current.temp = Math.max(0, labState.current.temp - 20);
        } else if (action === 'stir') {
            spawnParticles(20, 'bubble', 400, 400);
        }
    }, [spawnParticles]);
    
    const resetLab = useCallback(() => {
        logToConsole('Lab reset.');
        labState.current = {
            volume: 200,
            ph: 7.0,
            temp: 25,
            color: { r: 173, g: 216, b: 230, a: 0.5 },
            composition: ['water'],
            particles: [],
            isBoiling: false,
            isExploding: false,
            explosionTimer: 0,
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        const labGameLoop = () => {
            frameCount.current++;
            const state = labState.current;

            // Update Logic
            if (state.temp > 100 && state.volume > 0) {
                state.isBoiling = true;
                state.volume -= 0.1;
                if(frameCount.current % 5 === 0) spawnParticles(2, 'steam', 400, 500 - state.volume);
            } else {
                state.isBoiling = false;
            }

            if(state.explosionTimer > 0) {
                state.explosionTimer--;
            } else {
                state.isExploding = false;
            }

            // Update particles
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                if (p.type === 'smoke') p.vy -= 0.05; // smoke rises
                if (p.life <= 0) {
                    state.particles.splice(i, 1);
                }
            }
            
            // Draw Logic
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (state.isExploding) {
                ctx.save();
                const dx = (Math.random() - 0.5) * 20;
                const dy = (Math.random() - 0.5) * 20;
                ctx.translate(dx, dy);
            }

            // Draw Beaker
            const beakerBottom = 550;
            const beakerWidth = 200;
            const beakerHeight = 350;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2 - beakerWidth / 2 - 20, beakerBottom - beakerHeight);
            ctx.lineTo(canvas.width / 2 - beakerWidth / 2, beakerBottom - beakerHeight + 30);
            ctx.lineTo(canvas.width / 2 - beakerWidth / 2, beakerBottom);
            ctx.quadraticCurveTo(canvas.width / 2, beakerBottom + 20, canvas.width / 2 + beakerWidth / 2, beakerBottom);
            ctx.lineTo(canvas.width / 2 + beakerWidth / 2, beakerBottom - beakerHeight + 30);
            ctx.lineTo(canvas.width / 2 + beakerWidth / 2 + 20, beakerBottom - beakerHeight);
            ctx.stroke();

            // Draw Liquid
            if (state.volume > 0) {
                const liquidY = beakerBottom - state.volume;
                ctx.fillStyle = `rgba(${state.color.r}, ${state.color.g}, ${state.color.b}, ${state.color.a})`;
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2 - beakerWidth / 2, liquidY);
                
                // Sine wave for surface
                const amplitude = state.isBoiling ? 5 : 2;
                for (let x = 0; x <= beakerWidth; x++) {
                    const waveY = liquidY + Math.sin((x + frameCount.current) * 0.1) * amplitude;
                    ctx.lineTo(canvas.width / 2 - beakerWidth / 2 + x, waveY);
                }

                ctx.lineTo(canvas.width/2 + beakerWidth/2, beakerBottom);
                ctx.lineTo(canvas.width/2 - beakerWidth/2, beakerBottom);
                ctx.closePath();
                ctx.fill();
            }

            // Draw Particles
            state.particles.forEach(p => {
                let alpha = p.life / 100;
                if (p.type === 'fire') {
                    ctx.fillStyle = `rgba(255, ${Math.random() * 150}, 0, ${alpha})`;
                } else if (p.type === 'smoke') {
                    ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.5})`;
                } else {
                    ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.7})`;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            if (state.isExploding) {
                ctx.restore();
            }

            // Draw HUD
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '16px "Montserrat", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Temp: ${state.temp.toFixed(1)}°C`, 20, 40);
            ctx.fillText(`pH: ${state.ph.toFixed(1)}`, 20, 65);
            ctx.fillText(`Volume: ${state.volume.toFixed(0)}ml`, 20, 90);

            animationFrameId.current = requestAnimationFrame(labGameLoop);
        };
        
        labGameLoop();
        
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };

    }, [labAdd, spawnParticles, getPhColor]); // Only re-run if these functions change (they are memoized)

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] w-full gap-4 p-4 bg-background text-foreground">
        {/* Left Panel: Shelf */}
        <Card className="w-full md:w-1/4 bg-black/20 backdrop-blur-md border-white/10">
            <CardHeader><CardTitle className="font-headline text-primary">Chem Shelf</CardTitle></CardHeader>
            <CardContent>
                <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                    <div className="space-y-6">
                        {Object.entries(chemicals).map(([group, items]) => (
                            <div key={group}>
                                <h3 className="font-semibold text-muted-foreground uppercase text-sm mb-2">{group}</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {items.map(item => (
                                        <Button key={item.id} variant="outline" className="flex-col h-20" onClick={() => labAdd(item.id)}>
                                            <item.icon className="w-6 h-6 mb-1"/>
                                            <span className="text-xs text-center">{item.name}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="mt-4 border-t border-white/10 pt-4">
                     <h3 className="font-semibold text-muted-foreground uppercase text-sm mb-2">Tools</h3>
                     <div className="grid grid-cols-4 gap-2">
                         {tools.map(tool => (
                             <Button key={tool.id} variant="secondary" size="icon" className="h-14 w-full" onClick={() => labAction(tool.id)}>
                                <tool.icon className="w-6 h-6"/>
                             </Button>
                         ))}
                         <Button variant="destructive" size="icon" className="h-14 w-full" onClick={resetLab}>
                            <XCircle className="w-6 h-6" />
                         </Button>
                     </div>
                </div>
            </CardContent>
        </Card>

        {/* Right Panel: Simulation */}
        <div className="flex-1 flex flex-col gap-4">
            <div className={cn("flex-1 bg-[#0a0a1a] rounded-lg relative overflow-hidden border border-primary/20", labState.current.isExploding && 'animate-shake')}>
                <canvas ref={canvasRef} width="800" height="600" className="absolute top-0 left-0 w-full h-full" />
            </div>
            <Card className="h-1/4 bg-black/50 border-white/10">
                 <CardHeader className="p-2 border-b border-white/10"><CardTitle className="text-sm font-mono">Event Log</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <ScrollArea className="h-[120px]">
                        <div className="p-2">
                        {consoleLogs.map((log, i) => (
                            <p key={i} className="font-mono text-xs text-green-400 whitespace-nowrap">{log}</p>
                        ))}
                        </div>
                    </ScrollArea>
                 </CardContent>
            </Card>
        </div>
    </div>
  );
}
