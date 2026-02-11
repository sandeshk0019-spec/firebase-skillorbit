

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { XCircle, Flame, Snowflake, RotateCw, TestTube, Beaker, FlaskConical, Atom, Minus, Droplet, Trash2, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { type Activity, type GameScore } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { xpValues } from '@/lib/rewards';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { format, differenceInCalendarDays } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

const chemicals = [
    { id: 'water', formula: 'H₂O', name: 'Water', description: 'SOLVENT' },
    { id: 'acid', formula: 'HCl', name: 'Acid', description: 'STRONG' },
    { id: 'base', formula: 'NaOH', name: 'Base', description: 'SODIUM HYDROXIDE' },
    { id: 'sodium', formula: 'Na', name: 'Sodium', description: 'REACTIVE METAL' },
    { id: 'potassium', formula: 'K', name: 'Potassium', description: 'HIGHLY REACTIVE' },
    { id: 'magnesium', formula: 'Mg', name: 'Magnesium', description: 'METAL STRIP' },
    { id: 'universal_indicator', formula: 'UI', name: 'Universal Ind.', description: 'PH DETECTOR' },
    { id: 'phenolphthalein', formula: 'Ph', name: 'Phenolphthalein', description: 'BASE DETECTOR' },
    { id: 'copper_sulfate', formula: 'CuSO₄', name: 'Copper Sulfate', description: 'TRANSITION METAL' },
    { id: 'silver_nitrate', formula: 'AgNO₃', name: 'Silver Nitrate', description: 'PRECIPITATE FORMER' },
    { id: 'iron_chloride', formula: 'FeCl₃', name: 'Iron(III) Chloride', description: 'Yellow Solution' },
    { id: 'ammonia', formula: 'NH₃', name: 'Ammonia', description: 'WEAK BASE' },
    { id: 'vinegar', formula: 'CH₃COOH', name: 'Vinegar', description: 'WEAK ACID' },
    { id: 'hydrogen_peroxide', formula: 'H₂O₂', name: 'Hydrogen Peroxide', description: 'OXIDIZER' },
    { id: 'calcium_carbonate', formula: 'CaCO₃', name: 'Chalk', description: 'REACTS WITH ACID' },
    { id: 'zinc', formula: 'Zn', name: 'Zinc', description: 'METAL' },
    { id: 'lead_nitrate', formula: 'Pb(NO₃)₂', name: 'Lead Nitrate', description: 'TOXIC' },
    { id: 'potassium_iodide', formula: 'KI', name: 'Potassium Iodide', description: 'FORMS PRECIPITATE' },
    { id: 'sodium_bicarbonate', formula: 'NaHCO₃', name: 'Baking Soda', description: 'REACTS WITH ACID' },
    { id: 'ethanol', formula: 'C₂H₅OH', name: 'Ethanol', description: 'ALCOHOL' },
    { id: 'glucose', formula: 'C₆H₁₂O₆', name: 'Glucose', description: 'SUGAR' },
    { id: 'starch', formula: '(C₆H₁₀O₅)n', name: 'Starch', description: 'POLYMER' },
    { id: 'iodine_solution', formula: 'I₂', name: 'Iodine Solution', description: 'STARCH INDICATOR' },
    { id: 'lithium', formula: 'Li', name: 'Lithium', description: 'REACTIVE METAL' },
    { id: 'calcium', formula: 'Ca', name: 'Calcium', description: 'REACTIVE METAL' },
    { id: 'aluminum', formula: 'Al', name: 'Aluminum', description: 'METAL FOIL' },
    { id: 'sulfuric_acid', formula: 'H₂SO₄', name: 'Sulfuric Acid', description: 'STRONG ACID' },
    { id: 'nitric_acid', formula: 'HNO₃', name: 'Nitric Acid', description: 'STRONG ACID' },
    { id: 'potassium_hydroxide', formula: 'KOH', name: 'Potassium Hydroxide', description: 'STRONG BASE' },
    { id: 'sodium_carbonate', formula: 'Na₂CO₃', name: 'Washing Soda', description: 'BASE' },
    { id: 'barium_chloride', formula: 'BaCl₂', name: 'Barium Chloride', description: 'FORMS PRECIPITATE' },
    { id: 'sodium_sulfate', formula: 'Na₂SO₄', name: 'Sodium Sulfate', description: 'SALT' },
    { id: 'glowing_algae', formula: 'Bio-L', name: 'Bioluminescent Algae', description: 'GLOWS WHEN AGITATED', disabled: true },
    { id: 'cryo_crystal', formula: 'Cry-X', name: 'Cryo Crystal', description: 'INSTANT COOLING', disabled: true },
    { id: 'thermo_gel', formula: 'Th-G', name: 'Thermo-Gel', description: 'INSTANT HEATING', disabled: true },
    { id: 'anti_gravity_dust', formula: 'AG-D', name: 'Anti-Grav Dust', description: 'MAKES BUBBLES FLOAT', disabled: true },
    { id: 'chrono_particles', formula: 'T-p', name: 'Chrono Particles', description: 'SPEEDS UP TIME', disabled: true },
    { id: 'dark_matter_slurry', formula: 'DM-S', name: 'Dark Matter Slurry', description: 'ABSORBS LIGHT', disabled: true },
    { id: 'plasma_extract', formula: 'Pl-Ex', name: 'Plasma Extract', description: 'HIGH ENERGY', disabled: true },
    { id: 'quantum_foam', formula: 'Q-Foam', name: 'Quantum Foam', description: 'UNPREDICTABLE', disabled: true },
    { id: 'cobalt_chloride', formula: 'CoCl₂', name: 'Cobalt(II) Chloride', description: 'HYDRATION INDICATOR', disabled: true },
    { id: 'manganese_dioxide', formula: 'MnO₂', name: 'Manganese Dioxide', description: 'CATALYST', disabled: true },
    { id: 'glycerol', formula: 'C₃H₈O₃', name: 'Glycerol', description: 'VISCOUS LIQUID' },
    { id: 'citric_acid', formula: 'C₆H₈O₇', name: 'Citric Acid', description: 'WEAK ACID' },
    { id: 'borax', formula: 'Na₂B₄O₇', name: 'Borax', description: 'SLIME INGREDIENT', disabled: true },
    { id: 'iron_filings', formula: 'Fe', name: 'Iron Filings', description: 'METAL POWDER' },
    { id: 'sulfur_powder', formula: 'S', name: 'Sulfur Powder', description: 'YELLOW NON-METAL' },
    { id: 'mercury', formula: 'Hg', name: 'Mercury', description: 'LIQUID METAL - TOXIC', disabled: true },
    { id: 'hydrofluoric_acid', formula: 'HF', name: 'Hydrofluoric Acid', description: 'DISSOLVES GLASS', disabled: true },
    { id: 'neon_gas', formula: 'Ne', name: 'Neon Gas', description: 'INERT GAS', disabled: true },
    { id: 'neutronium_shard', formula: 'Nu-S', name: 'Neutronium Shard', description: 'EXTREMELY DENSE', disabled: true },
    { id: 'phoenix_ash', formula: 'Ph-Ash', name: 'Phoenix Ash', description: 'REGENERATIVE', disabled: true },
    { id: 'temporal_crystal', formula: 'T-Cry', name: 'Temporal Crystal', description: 'REWINDS REACTIONS', disabled: true },
    { id: 'void_essence', formula: 'V-Es', name: 'Void Essence', description: 'ERASES MATTER', disabled: true },
    { id: 'starlight_concentrate', formula: 'S-Con', name: 'Starlight', description: 'PURE ENERGY', disabled: true },
    { id: 'dragon_breath', formula: 'DrBr', name: 'Dragon\'s Breath', description: 'HIGHLY FLAMMABLE', disabled: true },
    { id: 'gorgon_blood', formula: 'Go-Bl', name: 'Gorgon\'s Blood', description: 'PETRIFIES', disabled: true },
    { id: 'unicorn_tear', formula: 'U-Tr', name: 'Unicorn Tear', description: 'PURIFIES', disabled: true },
    { id: 'chaos_orb', formula: 'Ch-O', name: 'Chaos Orb', description: 'RANDOM EFFECT', disabled: true },
    { id: 'philosopher_stone', formula: 'P-St', name: 'Philosopher\'s Stone', description: 'TRANSMUTES', disabled: true },
];

const tools = [
    { id: 'heat', name: 'HEAT', icon: Flame, color: 'bg-red-500/80 hover:bg-red-500' },
    { id: 'cool', name: 'COOL', icon: Snowflake, color: 'bg-blue-500/80 hover:bg-blue-500' },
    { id: 'mix', name: 'STIR', icon: RotateCw, color: 'bg-green-500/80 hover:bg-green-500' },
];

export default function ChemLabSimPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [consoleLogs, setConsoleLogs] = useState<{ message: string; level: 'info' | 'warn' | 'danger' }[]>([
        { message: '> Simulation initialized. Standard Pressure 1 atm.', level: 'info' },
    ]);
    const [isExploding, setIsExploding] = useState(false);

    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Dialog state
    const [dialogState, setDialogState] = useState<{
        open: boolean;
        isTool: boolean;
        id: string;
        name: string;
        unit: string;
        max: number;
        step: number;
    } | null>(null);
    const [dialogValue, setDialogValue] = useState(0);

    const [warningDialogState, setWarningDialogState] = useState<{
      open: boolean;
      chemical: typeof chemicals[0];
    } | null>(null);
    
    // Use useRef for lab state to prevent re-renders on every animation frame
    const labState = useRef<LabState>({
        volume: 0,
        ph: 7.0,
        temp: 25,
        color: { r: 173, g: 216, b: 230, a: 0.5 }, // Light blue for water
        composition: [],
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
        if (!user || !firestore || hasSessionBeenLogged.current) return;
        
        hasSessionBeenLogged.current = true;
        logToConsole('Experiment session progress saved!', 'info');
    
        const userRef = doc(firestore, "users", user.uid);
        const now = serverTimestamp();
        const xpGained = xpValues.CHEM_LAB_SESSION;

        runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User document does not exist!";
            const userData = userDoc.data();

            // --- Game Score & Activity ---
            const gameScoreData: Omit<GameScore, 'id'> = {
                userId: user.uid,
                gameId: 'chem-lab-sim',
                gameName: 'Chem Lab Sim',
                score: actionsInSession.current, // Use actions as score
                createdAt: now,
            };
            const scoreRef = doc(collection(userRef, "gameScores"));
            transaction.set(scoreRef, gameScoreData);

            const activityData: Omit<Activity, 'id'> = {
                userId: user.uid,
                type: 'GAME_PLAYED',
                description: `Completed an experiment in the Chem Lab Sim.`,
                refId: scoreRef.id,
                createdAt: now,
            };
            const activityRef = doc(collection(userRef, "activities"));
            transaction.set(activityRef, activityData);

            // User Stats Update
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
        }).catch(error => {
            toast({ variant: "destructive", title: "Save Error", description: "Failed to save session data." });
        });
    }, [user, firestore, logToConsole, toast]);

    const handleAction = useCallback(() => {
        if (hasSessionBeenLogged.current) return;
        actionsInSession.current++;
        if (actionsInSession.current >= 5) { // Log after 5 actions
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

    const labAdd = useCallback((type: string, amount: number) => {
        handleAction();
        const state = labState.current;
        const chemical = chemicals.find(c => c.id === type);
        logToConsole(`Added ${amount}ml of ${chemical?.name || type}.`);

        state.volume = Math.min(450, state.volume + amount);
        if (!state.composition.includes(type)) {
          state.composition.push(type);
        }

        let reactionOccurred = false;
        const amountRatio = amount / 25; // Base amount for reaction scaling

        // Chemical Reactions
        switch(type) {
            case 'acid':
                state.ph = Math.max(0, state.ph - (1.5 * amountRatio));
                if (!state.composition.includes('Cl-')) state.composition.push('Cl-');
                if (state.composition.includes('magnesium')) {
                    logToConsole('Reaction: Magnesium + Acid -> Bubbles (H₂)', 'warn');
                    spawnParticles(Math.round(30 * amountRatio), 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                if (state.composition.includes('silver_nitrate')) {
                    logToConsole('Reaction: Silver Nitrate + Chloride -> White precipitate (AgCl)', 'warn');
                    state.precipitate = Math.min(100, state.precipitate + (20 * amountRatio));
                    reactionOccurred = true;
                }
                break;
            case 'base':
                state.ph = Math.min(14, state.ph + (1.5 * amountRatio));
                if (state.composition.includes('copper_sulfate')) {
                    logToConsole('Reaction: Copper Sulfate + Base -> Blue precipitate (Cu(OH)₂)', 'warn');
                    state.precipitate = Math.min(100, state.precipitate + (15 * amountRatio));
                    reactionOccurred = true;
                }
                break;
            case 'water':
                state.ph += (7 - state.ph) * (0.3 * amountRatio); // Neutralize towards 7
                if (state.composition.length === 1) { // If it's the only thing
                    state.color = { r: 173, g: 216, b: 230, a: 0.5 };
                }
                break;
            case 'sodium':
            case 'potassium':
            case 'lithium':
            case 'calcium':
                if (state.composition.includes('water')) {
                    logToConsole(`DANGER: ${type} reacts violently with water!`, 'danger');
                    state.explosionTimer = 50; // duration of shake
                    setIsExploding(true);
                    state.temp += 50 * amountRatio;
                    spawnParticles(Math.round(100 * amountRatio), 'fire', 400, 350);
                    spawnParticles(Math.round(50 * amountRatio), 'smoke', 400, 350);
                    reactionOccurred = true;
                }
                break;
            case 'magnesium':
                 if (state.composition.includes('acid')) {
                    logToConsole('Reaction: Magnesium + Acid -> Bubbles (H₂)', 'warn');
                    spawnParticles(Math.round(30 * amountRatio), 'bubble', 400, 400);
                    reactionOccurred = true;
                }
                break;
            case 'copper_sulfate':
                if (state.composition.includes('water')) {
                    state.color = { r: 0, g: 120, b: 220, a: 0.5 };
                }
                if (state.composition.includes('base')) {
                    logToConsole('Reaction: Copper Sulfate + Base -> Blue precipitate (Cu(OH)₂)', 'warn');
                    state.precipitate = Math.min(100, state.precipitate + (15 * amountRatio));
                    reactionOccurred = true;
                }
                break;
            case 'silver_nitrate':
                 if (state.composition.includes('Cl-') || state.composition.includes('acid')) {
                    logToConsole('Reaction: Silver Nitrate + Chloride -> White precipitate (AgCl)', 'warn');
                    state.precipitate = Math.min(100, state.precipitate + (20 * amountRatio));
                    reactionOccurred = true;
                }
                break;
            default:
                 // No specific reaction for this chemical yet
                 break;
        }

        // Indicator Reactions
        if (state.composition.includes('universal_indicator')) {
            const { r, g, b } = getPhColor(state.ph);
            state.color = { r, g, b, a: 0.6 };
        } else if (state.composition.includes('phenolphthalein')) {
            if (state.ph >= 8.2) state.color = { r: 255, g: 20, b: 147, a: 0.6 }; // Pink
            else if (!state.composition.includes('copper_sulfate')) {
                 state.color = { r: 173, g: 216, b: 230, a: 0.5 }; // Colorless in neutral/acidic
            }
        }

        if(!reactionOccurred) spawnParticles(Math.round(10 * amountRatio), 'bubble', 400, 400);

    }, [getPhColor, spawnParticles, logToConsole, handleAction]);

    const labAction = useCallback((action: string, amount?: number) => {
        handleAction();
        if (action === 'heat') {
            const heatAmount = amount || 20;
            logToConsole(`Action: ${action} by ${heatAmount}°C.`);
            labState.current.temp += heatAmount;
        } else if (action === 'cool') {
            const coolAmount = amount || 20;
            logToConsole(`Action: ${action} by ${coolAmount}°C.`);
            labState.current.temp = Math.max(-100, labState.current.temp - coolAmount);
        } else if (action === 'mix') {
            logToConsole(`Action: ${action}.`);
            spawnParticles(20, 'bubble', 400, 400);
        }
    }, [spawnParticles, logToConsole, handleAction]);

    const openDialog = (isTool: boolean, id: string, name: string, unit: string, max: number, step: number) => {
        setDialogValue(isTool ? 20 : 25);
        setDialogState({ open: true, isTool, id, name, unit, max, step });
    };

    const handleChemicalClick = (chemical: (typeof chemicals)[0]) => {
        const isReactive = chemical.description.includes('REACTIVE');
        if (isReactive) {
            setWarningDialogState({ open: true, chemical });
        } else {
            openDialog(false, chemical.id, chemical.name, 'ml', 100, 0.1);
        }
    };

    const handleConfirm = () => {
        if (!dialogState) return;
        if (dialogState.isTool) {
            labAction(dialogState.id, dialogValue);
        } else {
            labAdd(dialogState.id, dialogValue);
        }
        setDialogState(null);
    };
    
    const resetLab = useCallback(() => {
        logToConsole('Lab reset.');
        actionsInSession.current = 0;
        hasSessionBeenLogged.current = false;
        labState.current = {
            volume: 0,
            ph: 7.0,
            temp: 25,
            color: { r: 173, g: 216, b: 230, a: 0.5 },
            composition: [],
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
                state.volume = Math.max(0, state.volume - 0.1);
                if(frameCount.current % 5 === 0) spawnParticles(2, 'steam', canvas.width / 2, 500 - state.volume);
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
            
            // --- Draw Logic ---
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#1e1e2e'; // Dark navy background
            ctx.fillRect(0,0, canvas.width, canvas.height);
            
            if (isExploding) {
                ctx.save();
                const dx = (Math.random() - 0.5) * 20;
                const dy = (Math.random() - 0.5) * 20;
                ctx.translate(dx, dy);
            }

            // Draw Beaker
            const beakerBottom = 550;
            const beakerWidth = 250;
            const beakerHeight = 350;
            const beakerX = canvas.width / 2 - beakerWidth / 2;
            
            ctx.strokeStyle = 'rgba(150, 160, 180, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(beakerX, beakerBottom - beakerHeight);
            ctx.lineTo(beakerX, beakerBottom);
            ctx.quadraticCurveTo(canvas.width / 2, beakerBottom + 20, beakerX + beakerWidth, beakerBottom);
            ctx.lineTo(beakerX + beakerWidth, beakerBottom - beakerHeight);
            ctx.stroke();

            // Draw volume markings
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(150, 160, 180, 0.2)';
            for (let i = 1; i <= 5; i++) {
                const y = beakerBottom - (i * (beakerHeight - 50) / 5);
                ctx.beginPath();
                ctx.moveTo(beakerX, y);
                ctx.lineTo(beakerX + 15, y);
                ctx.stroke();
            }


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
            });

            if (isExploding) {
                ctx.restore();
            }

            // Draw HUD
            const hudX = canvas.width - 140;
            const hudY = 20;
            ctx.fillStyle = 'rgba(10, 15, 30, 0.7)';
            ctx.strokeStyle = 'hsl(var(--primary) / 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(hudX, hudY, 120, 85, 8);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = 'hsl(var(--foreground))';
            ctx.font = '14px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Temp:`, hudX + 15, hudY + 25);
            ctx.fillText(`pH:`, hudX + 15, hudY + 50);
            ctx.fillText(`Vol:`, hudX + 15, hudY + 75);

            ctx.textAlign = 'right';
            ctx.fillText(`${state.temp.toFixed(0)}°C`, hudX + 105, hudY + 25);
            ctx.fillText(`${state.ph.toFixed(1)}`, hudX + 105, hudY + 50);
            ctx.fillText(`${state.volume.toFixed(0)}ml`, hudX + 105, hudY + 75);


            animationFrameId.current = requestAnimationFrame(labGameLoop);
        };
        
        labGameLoop();
        
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };

    }, [labAdd, spawnParticles, getPhColor, resetLab, labAction, isExploding]);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full bg-[#0a0a1a] text-foreground animate-in fade-in duration-500">
        <div className="flex flex-1 flex-col md:flex-row gap-4 p-4">
            {/* Left Panel: Shelf */}
            <div className="w-full md:w-[340px] flex flex-col gap-4">
                <Card className="flex-1 flex flex-col bg-black/30 backdrop-blur-sm border-white/10">
                    <CardHeader>
                        <CardTitle className="font-headline text-lg text-primary tracking-widest">REAGENTS</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                        <ScrollArea className="h-full pr-3">
                            <div className="grid grid-cols-2 gap-3">
                                {chemicals.map(item => (
                                    <button 
                                        key={item.id} 
                                        className={cn(
                                            "relative text-left p-3 rounded-lg transition-all border border-white/10 bg-black/20 hover:bg-white/5 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed",
                                            item.disabled && "line-through"
                                        )}
                                        onClick={() => handleChemicalClick(item)}
                                        disabled={item.disabled}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-sm text-white/90 truncate pr-2">{item.name}</p>
                                            <span className={cn("text-xs font-mono py-0.5 px-1.5 rounded",
                                                item.description.includes('ACID') && 'bg-orange-500/80 text-white',
                                                item.description.includes('BASE') && 'bg-blue-500/80 text-white',
                                                item.description.includes('METAL') && 'bg-gray-500/80 text-white',
                                                item.description.includes('SOLVENT') && 'bg-green-500/80 text-white',
                                                item.description.includes('INDICATOR') && 'bg-purple-500/80 text-white',
                                                'bg-primary/20 text-primary-foreground'
                                            )}>
                                                {item.formula}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/50 uppercase">{item.description}</p>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>


            {/* Right Panel: Simulation */}
            <div className="flex-1 flex flex-col gap-4">
                <div className={cn("flex-1 bg-[#1e1e2e] rounded-lg relative overflow-hidden border border-primary/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]", isExploding && 'animate-shake')}>
                    <canvas ref={canvasRef} width="800" height="600" className="absolute top-0 left-0 w-full h-full" />
                </div>
                 <Card className="bg-black/30 backdrop-blur-sm border-white/10">
                   <CardHeader>
                        <CardTitle className="font-headline text-lg text-primary tracking-widest flex items-center gap-2">
                           <SlidersHorizontal className="w-5 h-5"/> LAB CONTROLS
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-4 gap-3">
                            {tools.map(tool => (
                                <Button
                                    key={tool.id}
                                    variant="secondary"
                                    className={cn("h-16 w-full flex flex-col gap-1 text-xs transition-transform hover:scale-105", tool.color)}
                                    onClick={() =>
                                        tool.id === 'mix'
                                            ? labAction(tool.id)
                                            : openDialog(true, tool.id, tool.name, '°C', 200, 1)
                                    }
                                >
                                    <tool.icon className="w-5 h-5"/>
                                    {tool.name}
                                </Button>
                            ))}
                            <Button variant="outline" className="h-16 w-full flex flex-col gap-1 text-xs transition-transform hover:scale-105 bg-muted/50 hover:bg-muted" onClick={resetLab}>
                                <Trash2 className="w-5 h-5" />
                                RESET
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="h-[140px] bg-black/60 backdrop-blur-sm border-white/10 flex flex-col">
                    <CardHeader className="p-2 border-b border-white/10">
                      <CardTitle className="text-sm font-mono text-green-400/80 tracking-widest">EXPERIMENT LOG</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-2">
                            {consoleLogs.map((log, i) => (
                                <p key={i} className={cn("font-mono text-sm whitespace-nowrap", {
                                    'text-green-400/90': log.level === 'info',
                                    'text-yellow-400': log.level === 'warn',
                                    'text-red-400 font-bold': log.level === 'danger',
                                })}>{log.message}</p>
                            ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
             <div className="absolute top-4 right-4">
                <Link href="/dashboard/game-zone" className="opacity-50 hover:opacity-100 transition-opacity">
                    <XCircle className="w-8 h-8 text-white" />
                </Link>
             </div>
        </div>
        <Dialog open={!!dialogState?.open} onOpenChange={(isOpen) => !isOpen && setDialogState(null)}>
            <DialogContent className="bg-background/80 backdrop-blur-lg border-primary/50">
                <DialogHeader>
                    <DialogTitle className="font-headline text-primary">Set Amount for {dialogState?.name}</DialogTitle>
                    <DialogDescription>
                        Use the slider or input for a precise amount to {dialogState?.isTool ? 'apply' : 'add'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="amount-input" className="text-right">
                           Amount ({dialogState?.unit})
                        </Label>
                        <Input
                            id="amount-input"
                            type="number"
                            value={dialogValue}
                            onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                    setDialogValue(Math.max(0, value));
                                }
                            }}
                            min="0"
                            step={dialogState?.step}
                            className="col-span-2"
                        />
                    </div>
                    <Slider
                        value={[dialogValue]}
                        onValueChange={(value) => setDialogValue(value[0])}
                        max={dialogState?.isTool ? 200 : undefined}
                        min={0}
                        step={dialogState?.step}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogState(null)}>Cancel</Button>
                    <Button onClick={handleConfirm}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={!!warningDialogState?.open} onOpenChange={(isOpen) => !isOpen && setWarningDialogState(null)}>
            <AlertDialogContent className="bg-background/80 backdrop-blur-lg border-yellow-500/50">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 font-headline text-yellow-400">
                        <TriangleAlert className="w-6 h-6"/>
                        Warning: Reactive Chemical
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        You are about to add {warningDialogState?.chemical.name} ({warningDialogState?.chemical.formula}), which is a {warningDialogState?.chemical.description.toLowerCase()}.
                        This can cause a violent reaction, especially with water. Are you sure you want to proceed?
                        <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-700/50 rounded-lg text-sm">
                            <p className="font-bold text-yellow-300">Safety Tip:</p>
                            <p className="text-yellow-400/90">In a real lab, always add reactive metals to a large volume of solvent in small pieces and wear safety goggles.</p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => setWarningDialogState(null)}>Cancel</Button>
                    <AlertDialogAction 
                        className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        onClick={() => {
                        if (warningDialogState) {
                          const chem = warningDialogState.chemical;
                          openDialog(false, chem.id, chem.name, 'ml', 100, 0.1);
                          setWarningDialogState(null);
                        }
                    }}>Proceed</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
