'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { XCircle, Flame, Snowflake, RotateCw, TestTube, Beaker, FlaskConical, Atom, Minus, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { type Activity } from '@/types';
import { updateUserStreak } from '@/lib/streak';
import { useToast } from "@/hooks/use-toast";
import { awardXp } from '@/lib/xp';
import { xpValues } from '@/lib/rewards';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  precipitate: number;
  isBoiling: boolean;
  explosionTimer: number;
}

const chemicals = {
    liquids: [
        { id: 'water', name: 'Water (H₂O)', icon: Droplet },
        { id: 'acid', name: 'Acid (HCl)', icon: TestTube },
        { id: 'base', name: 'Base (NaOH)', icon: TestTube },
        { id: 'hydrogen_peroxide', name: 'Peroxide (H₂O₂)', icon: TestTube },
    ],
    solids: [
        { id: 'sodium', name: 'Sodium (Na)', icon: Atom },
        { id: 'potassium', name: 'Potassium (K)', icon: Atom },
        { id: 'magnesium', name: 'Magnesium (Mg)', icon: Atom },
        { id: 'zinc', name: 'Zinc (Zn)', icon: Atom },
        { id: 'iron', name: 'Iron (Fe)', icon: Atom },
    ],
    indicators: [
        { id: 'universal_indicator', name: 'Universal Indicator', icon: FlaskConical },
        { id: 'phenolphthalein', name: 'Phenolphthalein', icon: FlaskConical },
        { id: 'copper_sulfate', name: 'Copper Sulfate', icon: Beaker },
        { id: 'silver_nitrate', name: 'Silver Nitrate', icon: Beaker },
        { id: 'salt', name: 'Salt (NaCl)', icon: Minus },
        { id: 'potassium_iodide', name: 'Potassium Iodide (KI)', icon: Beaker },
        { id: 'calcium_carbonate', name: 'Chalk (CaCO₃)', icon: Minus },
    ]
};

const tools = [
    { id: 'heat', name: 'Heat', icon: Flame },
    { id: 'cool', name: 'Cool', icon: Snowflake },
    { id: 'mix', name: 'Mix', icon: RotateCw },
];

export default function ChemLabSimPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [consoleLogs, setConsoleLogs] = useState<{ message: string; level: 'info' | 'warn' | 'danger' }[]>([
        { message: '> Lab initialized. Ready for experimentation.', level: 'info' },
    ]);
    const [isExploding, setIsExploding] = useState(false);

    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // Use useRef for lab state to prevent re-renders on every animation frame
    const labState = useRef<LabState>({
        volume: 200,
        ph: 7.0,
        temp: 25,
        color: { r: 173, g: 216, b: 230, a: 0.5 }, // Light blue for water
        composition: ['water'],
        particles: [],
        precipitate: 0,
        isBoiling: false,
        explosionTimer: 0,
    });
    const actionsInSession = useRef(0);
    const hasSessionBeenLogged = useRef(false);

    const animationFrameId = useRef<number>();
    const frameCount = useRef(0);

    const logToConsole = useCallback((message: string, level: 'info' | 'warn' | 'danger' = 'info') => {
        setConsoleLogs(prev => [{ message: `> ${message}`, level }, ...prev].slice(0, 50));
    }, []);

    const logGameSession = useCallback(async () => {
        if (!user || !firestore) return;
    
        logToConsole('Experiment session progress saved!', 'info');
    
        try {
            const userRef = doc(firestore, "users", user.uid);
            const now = serverTimestamp();
    
            const activityData: Omit<Activity, 'id'> = {
                userId: user.uid,
                type: 'GAME_PLAYED',
                description: `Completed an experiment in the Chem Lab Sim.`,
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
    
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) return;
                const data = userDoc.data();
                const currentGamesPlayed = data.gamesPlayed || 0;

                transaction.update(userRef, {
                    gamesPlayed: currentGamesPlayed + 1,
                });
            });
            
            await awardXp(firestore, user.uid, xpValues.CHEM_LAB_SESSION, toast);
            await updateUserStreak(firestore, user.uid);
    
        } catch (error) {
             console.error("Error saving Chem Lab session:", error);
        }
    }, [user, firestore, logToConsole, toast]);

    const handleAction = useCallback(() => {
        if (hasSessionBeenLogged.current) return;
        actionsInSession.current++;
        if (actionsInSession.current >= 10) {
            hasSessionBeenLogged.current = true;
            logGameSession();
        }
    }, [logGameSession]);

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
                radius: Math.random() * (type === 'fire' ? 5 : 4) + 2,
            });
        }
    }, []);

    const labAdd = useCallback((type: string) => {
        handleAction();
        const state = labState.current;
        const chemical = [...chemicals.liquids, ...chemicals.solids, ...chemicals.indicators].find(c => c.id === type);
        logToConsole(`Added ${chemical?.name || type}.`);

        state.volume = Math.min(450, state.volume + 25);

        let reactionOccurred = false;

        // Chemical Reactions
        switch(type) {
            case 'acid':
                state.ph = Math.max(0, state.ph - 3);
                state.composition.push('acid', 'Cl-');
                if (state.composition.includes('magnesium')) {
                    logToConsole('Reaction: Magnesium + Acid -> Bubbles (H₂)', 'warn');
                    spawnParticles(30, 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                if (state.composition.includes('zinc')) {
                    logToConsole('Reaction: Zinc + Acid -> Bubbles (H₂)', 'warn');
                    spawnParticles(40, 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                if (state.composition.includes('iron')) {
                    logToConsole('Reaction: Iron + Acid -> Bubbles (H₂)', 'warn');
                    spawnParticles(15, 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                if (state.composition.includes('calcium_carbonate')) {
                    logToConsole('Reaction: Chalk + Acid -> Fizzing (CO₂)', 'warn');
                    spawnParticles(60, 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                 if (state.composition.includes('silver_nitrate')) {
                    logToConsole('Reaction: Acid (Cl-) + Silver Nitrate -> White Precipitate (AgCl)', 'warn');
                    state.precipitate = Math.min(100, state.precipitate + 20);
                    reactionOccurred = true;
                }
                break;
            case 'base':
                state.ph = Math.min(14, state.ph + 3);
                state.composition.push('base');
                break;
            case 'water':
                state.ph += (7 - state.ph) * 0.3; // Neutralize towards 7
                state.composition.push('water');
                break;
            case 'sodium':
            case 'potassium':
                if (state.composition.includes('water')) {
                    logToConsole(`DANGER: ${type} reacts violently with water!`, 'danger');
                    state.explosionTimer = 50; // duration of shake
                    setIsExploding(true);
                    state.temp += 50;
                    spawnParticles(100, 'fire', 400, 350);
                    spawnParticles(50, 'smoke', 400, 350);
                    reactionOccurred = true;
                }
                state.composition.push(type);
                break;
            case 'magnesium':
                state.composition.push('magnesium');
                 if (state.composition.includes('acid')) {
                    logToConsole('Reaction: Magnesium + Acid -> Bubbles (H₂)', 'warn');
                    spawnParticles(30, 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                break;
            case 'zinc':
                state.composition.push('zinc');
                 if (state.composition.includes('acid')) {
                    logToConsole('Reaction: Zinc + Acid -> Bubbles (H₂)', 'warn');
                    spawnParticles(40, 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                break;
            case 'iron':
                state.composition.push('iron');
                 if (state.composition.includes('acid')) {
                    logToConsole('Reaction: Iron + Acid -> Bubbles (H₂)', 'warn');
                    spawnParticles(15, 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                break;
            case 'calcium_carbonate':
                state.composition.push('calcium_carbonate');
                 if (state.composition.includes('acid')) {
                    logToConsole('Reaction: Chalk + Acid -> Fizzing (CO₂)', 'warn');
                    spawnParticles(60, 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                break;
             case 'copper_sulfate':
                state.color = { r: 0, g: 100, b: 255, a: 0.6 }; // Blue solution
                state.composition.push('copper_sulfate');
                break;
            case 'salt':
                state.composition.push('salt', 'Cl-');
                if (state.composition.includes('silver_nitrate')) {
                    logToConsole('Reaction: Salt (Cl-) + Silver Nitrate -> White Precipitate (AgCl)', 'warn');
                    state.precipitate = Math.min(100, state.precipitate + 20);
                    reactionOccurred = true;
                }
                break;
            case 'silver_nitrate':
                state.composition.push('silver_nitrate');
                if (state.composition.includes('Cl-')) {
                    logToConsole('Reaction: Silver Nitrate + Chloride -> White Precipitate (AgCl)', 'warn');
                    state.precipitate = Math.min(100, state.precipitate + 20);
                    reactionOccurred = true;
                }
                break;
            case 'hydrogen_peroxide':
                state.composition.push('hydrogen_peroxide');
                if (state.composition.includes('potassium_iodide')) {
                    logToConsole('Reaction: Peroxide + Iodide -> Rapid decomposition!', 'danger');
                    state.temp += 40;
                    spawnParticles(150, 'steam', 400, 400);
                    reactionOccurred = true;
                }
                break;
            case 'potassium_iodide':
                state.composition.push('potassium_iodide');
                if (state.composition.includes('hydrogen_peroxide')) {
                    logToConsole('Reaction: Iodide + Peroxide -> Rapid decomposition!', 'danger');
                    state.temp += 40;
                    spawnParticles(150, 'steam', 400, 400);
                    reactionOccurred = true;
                }
                break;
            default:
                 state.composition.push(type);
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

    }, [getPhColor, spawnParticles, logToConsole, handleAction]);

    const labAction = useCallback((action: string) => {
        handleAction();
        logToConsole(`Action: ${action}.`);
        if (action === 'heat') {
            labState.current.temp += 20;
            if (labState.current.composition.includes('hydrogen_peroxide')) {
                logToConsole('Reaction: Peroxide decomposes with heat', 'warn');
                spawnParticles(20, 'steam', 400, 400);
            }
        } else if (action === 'cool') {
            labState.current.temp = Math.max(0, labState.current.temp - 20);
        } else if (action === 'mix') {
            spawnParticles(20, 'bubble', 400, 400);
        }
    }, [spawnParticles, logToConsole, handleAction]);
    
    const resetLab = useCallback(() => {
        logToConsole('Lab reset.');
        actionsInSession.current = 0;
        hasSessionBeenLogged.current = false;
        labState.current = {
            volume: 200,
            ph: 7.0,
            temp: 25,
            color: { r: 173, g: 216, b: 230, a: 0.5 },
            composition: ['water'],
            particles: [],
            precipitate: 0,
            isBoiling: false,
            explosionTimer: 0,
        };
    }, [logToConsole]);

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
                if (state.explosionTimer === 0) {
                    setIsExploding(false);
                }
            }

            // Update particles
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                if (p.type === 'smoke' || p.type === 'steam') p.vy -= 0.05; // smoke and steam rises
                if (p.life <= 0) {
                    state.particles.splice(i, 1);
                }
            }
            
            // Draw Logic
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (isExploding) {
                ctx.save();
                const dx = (Math.random() - 0.5) * 20;
                const dy = (Math.random() - 0.5) * 20;
                ctx.translate(dx, dy);
            }

            // Draw Beaker
            const beakerBottom = 550;
            const beakerWidth = 200;
            const beakerHeight = 350;
            const beakerX = canvas.width / 2 - beakerWidth / 2;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(beakerX - 20, beakerBottom - beakerHeight);
            ctx.lineTo(beakerX, beakerBottom - beakerHeight + 30);
            ctx.lineTo(beakerX, beakerBottom);
            ctx.quadraticCurveTo(canvas.width / 2, beakerBottom + 20, beakerX + beakerWidth, beakerBottom);
            ctx.lineTo(beakerX + beakerWidth, beakerBottom - beakerHeight + 30);
            ctx.lineTo(beakerX + beakerWidth + 20, beakerBottom - beakerHeight);
            ctx.stroke();

             // Add highlights for glass effect
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(beakerX + 20, beakerBottom - beakerHeight + 50);
            ctx.lineTo(beakerX + 20, beakerBottom - 40);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(beakerX + beakerWidth - 10, beakerBottom - beakerHeight + 120, 3, 50, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Draw Liquid
            if (state.volume > 0) {
                const liquidY = beakerBottom - state.volume;
                ctx.fillStyle = `rgba(${state.color.r}, ${state.color.g}, ${state.color.b}, ${state.color.a})`;
                ctx.beginPath();
                ctx.moveTo(beakerX, beakerBottom);
                ctx.lineTo(beakerX + beakerWidth, beakerBottom);
                
                const amplitude = state.isBoiling ? 6 : state.explosionTimer > 0 ? 8 : 2;
                for (let x = beakerWidth; x >= 0; x--) {
                    const waveY = liquidY + Math.sin((x + frameCount.current) * 0.1) * amplitude;
                    ctx.lineTo(beakerX + x, waveY);
                }
                
                ctx.closePath();
                ctx.fill();
            }

            // Draw Precipitate
            if (state.precipitate > 0) {
                ctx.fillStyle = 'rgba(240, 240, 245, 0.9)';
                const baseHeight = state.precipitate * 0.5;
                const pileY = beakerBottom - baseHeight;

                ctx.beginPath();
                ctx.moveTo(beakerX, beakerBottom);
                for (let x = 0; x <= beakerWidth; x += 15) {
                    const currentX = beakerX + x;
                    const randomY = pileY + Math.sin(x * 0.5) * 5 + (Math.random() - 0.5) * 5;
                    ctx.lineTo(currentX, randomY > beakerBottom ? beakerBottom : randomY);
                }
                ctx.lineTo(beakerX + beakerWidth, beakerBottom);
                ctx.closePath();
                ctx.fill();
            }

            // Draw Particles
            state.particles.forEach(p => {
                let alpha = Math.max(0, p.life / (p.type === 'fire' ? 60 : 120));
                
                if (p.type === 'fire') {
                    ctx.fillStyle = `rgba(255, ${Math.random() * 150 + 50}, 0, ${alpha})`;
                    ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
                    ctx.shadowBlur = 10;
                } else if (p.type === 'smoke') {
                    ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.5})`;
                } else if (p.type === 'steam') {
                    ctx.fillStyle = `rgba(220, 220, 220, ${alpha * 0.6})`;
                } else { // Bubbles
                    ctx.strokeStyle = `rgba(220, 230, 255, ${alpha * 0.8})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    return; // skip fill for bubbles
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; // reset shadow
            });

            if (isExploding) {
                ctx.restore();
            }

            // Draw HUD
            ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
            ctx.font = '16px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.shadowColor = 'hsl(var(--primary))';
            ctx.shadowBlur = 5;
            ctx.fillText(`Temp: ${state.temp.toFixed(1)}°C`, 20, 40);
            ctx.fillText(`pH: ${state.ph.toFixed(1)}`, 20, 65);
            ctx.fillText(`Volume: ${state.volume.toFixed(0)}ml`, 20, 90);
            ctx.shadowBlur = 0;


            animationFrameId.current = requestAnimationFrame(labGameLoop);
        };
        
        labGameLoop();
        
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };

    }, [labAdd, spawnParticles, getPhColor, resetLab, labAction, isExploding]); // Only re-run if these functions change (they are memoized)

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full p-4 bg-background text-foreground animate-in fade-in duration-500">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <FlaskConical className="w-8 h-8 text-cyan-400 animate-glow" style={{animationDuration: '3s'}} />
            <h1 className="font-headline text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">Chem Lab Pro</h1>
          </div>
          <Link href="/dashboard/game-zone">
            <Button variant="ghost" size="icon">
              <XCircle className="w-8 h-8" />
            </Button>
          </Link>
        </header>
        <div className="flex flex-1 flex-col md:flex-row gap-4">
            {/* Left Panel: Shelf */}
            <Card className="w-full md:w-1/4 bg-black/30 backdrop-blur-sm border-white/10 animate-in slide-in-from-left-5 duration-500">
                <CardHeader><CardTitle className="font-headline text-primary">Reagent Shelf</CardTitle></CardHeader>
                <CardContent className="flex flex-col h-[calc(100%-80px)]">
                    <ScrollArea className="flex-grow pr-4">
                        <div className="space-y-6">
                            {Object.entries(chemicals).map(([group, items]) => (
                                <div key={group}>
                                    <h3 className="font-semibold text-muted-foreground uppercase text-sm mb-2 tracking-wider">{group}</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {items.map(item => (
                                            <Button 
                                                key={item.id} 
                                                variant="outline" 
                                                className="flex flex-col items-center justify-center text-center p-2 transition-all hover:scale-105 hover:bg-accent/50 hover:border-primary/50" 
                                                onClick={() => labAdd(item.id)}
                                                style={{minHeight: '6rem'}}
                                            >
                                                <item.icon className="w-6 h-6 mb-1"/>
                                                <span className="text-xs whitespace-normal leading-tight">{item.name}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <h3 className="font-semibold text-muted-foreground uppercase text-sm mb-2 tracking-wider">Tools</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {tools.map(tool => (
                                <Button key={tool.id} variant="secondary" size="icon" className="h-14 w-full transition-transform hover:scale-105" onClick={() => labAction(tool.id)}>
                                    <tool.icon className="w-6 h-6"/>
                                </Button>
                            ))}
                            <Button variant="destructive" size="icon" className="h-14 w-full transition-transform hover:scale-105" onClick={resetLab}>
                                <XCircle className="w-6 h-6" />
                                <span className="sr-only">Clear Lab</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Right Panel: Simulation */}
            <div className="flex-1 flex flex-col gap-4 animate-in slide-in-from-right-5 duration-500">
                <div className={cn("flex-1 bg-[#1e1e2e] rounded-lg relative overflow-hidden border border-primary/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]", isExploding && 'animate-shake')}>
                    <canvas ref={canvasRef} width="800" height="600" className="absolute top-0 left-0 w-full h-full" />
                </div>
                <Card className="h-1/4 bg-black/60 backdrop-blur-sm border-white/10">
                    <CardHeader className="p-2 border-b border-white/10">
                      <CardTitle className="text-sm font-mono text-green-300">Event Log</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[120px]">
                            <div className="p-2">
                            {consoleLogs.map((log, i) => (
                                <p key={i} className={cn("font-mono text-xs whitespace-nowrap", {
                                    'text-green-400': log.level === 'info',
                                    'text-yellow-400': log.level === 'warn',
                                    'text-red-400 font-bold': log.level === 'danger',
                                })}>{log.message}</p>
                            ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
