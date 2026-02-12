

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { XCircle, Brain, Trophy, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from "@/firebase";
import { collection, doc, addDoc, serverTimestamp, runTransaction, getDoc, setDoc } from 'firebase/firestore';
import { type GameScore, type Activity } from '@/types';
import { achievements } from '@/lib/achievements';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { xpValues, rewardTiers } from '@/lib/rewards';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { format, differenceInCalendarDays } from 'date-fns';
import React from 'react';

// Card data structure
interface CardData {
  id: number;
  content: string;
  pairId: number;
}

interface ConceptPair {
  term: string;
  definition: string;
  pairId: number;
}

interface ConceptSet {
  theme: string;
  pairs: ConceptPair[];
}

const conceptSets: ConceptSet[] = [
  // Science
  { theme: 'Chemical Elements', pairs: [ { term: 'H₂O', definition: 'Water', pairId: 1 }, { term: 'Au', definition: 'Gold', pairId: 2 }, { term: 'CO₂', definition: 'Carbon Dioxide', pairId: 3 }, { term: 'NaCl', definition: 'Salt', pairId: 4 }, { term: 'O₂', definition: 'Oxygen', pairId: 5 }, { term: 'Fe', definition: 'Iron', pairId: 6 } ] },
  { theme: 'Cosmic Wonders', pairs: [ { term: 'Nebula', definition: 'Cloud of Gas and Dust', pairId: 1 }, { term: 'Supernova', definition: 'Exploding Star', pairId: 2 }, { term: 'Galaxy', definition: 'System of Stars', pairId: 3 }, { term: 'Black Hole', definition: 'Infinite Gravity', pairId: 4 }, { term: 'Comet', definition: 'Icy Solar System Body', pairId: 5 }, { term: 'Asteroid', definition: 'Small Solar System Body', pairId: 6 } ] },
  { theme: 'Planets', pairs: [ { term: 'Mercury', definition: 'Closest to Sun', pairId: 1 }, { term: 'Venus', definition: 'Hottest Planet', pairId: 2 }, { term: 'Earth', definition: 'Our Home', pairId: 3 }, { term: 'Mars', definition: 'The Red Planet', pairId: 4 }, { term: 'Jupiter', definition: 'Largest Planet', pairId: 5 }, { term: 'Saturn', definition: 'Has Rings', pairId: 6 } ] },
  { theme: 'Parts of a Cell', pairs: [ { term: 'Nucleus', definition: 'The "Brain"', pairId: 1 }, { term: 'Mitochondria', definition: 'Powerhouse', pairId: 2 }, { term: 'Cell Membrane', definition: 'Outer Barrier', pairId: 3 }, { term: 'Cytoplasm', definition: 'Jelly-like Fluid', pairId: 4 }, { term: 'Ribosome', definition: 'Makes Protein', pairId: 5 }, { term: 'Vacuole', definition: 'Storage Sac', pairId: 6 } ] },
  { theme: 'Dinosaurs', pairs: [ { term: 'T-Rex', definition: 'Tyrant Lizard King', pairId: 1 }, { term: 'Triceratops', definition: 'Three-Horned Face', pairId: 2 }, { term: 'Stegosaurus', definition: 'Plated Lizard', pairId: 3 }, { term: 'Velociraptor', definition: 'Speedy Robber', pairId: 4 }, { term: 'Brachiosaurus', definition: 'Arm Lizard', pairId: 5 }, { term: 'Pterodactyl', definition: 'Winged Finger', pairId: 6 } ] },
  { theme: 'Ocean Life', pairs: [ { term: 'Dolphin', definition: 'Intelligent Mammal', pairId: 1 }, { term: 'Shark', definition: 'Cartilage Fish', pairId: 2 }, { term: 'Octopus', definition: 'Eight Arms', pairId: 3 }, { term: 'Jellyfish', definition: 'Gelatinous Animal', pairId: 4 }, { term: 'Whale', definition: 'Largest Mammal', pairId: 5 }, { term: 'Coral', definition: 'Marine Invertebrate', pairId: 6 } ] },
  // Technology
  { theme: 'Programming Jargon', pairs: [ { term: 'API', definition: 'Application Programming Interface', pairId: 1 }, { term: 'SDK', definition: 'Software Development Kit', pairId: 2 }, { term: 'JSON', definition: 'JavaScript Object Notation', pairId: 3 }, { term: 'HTML', definition: 'HyperText Markup Language', pairId: 4 }, { term: 'CSS', definition: 'Cascading Style Sheets', pairId: 5 }, { term: 'Git', definition: 'Version Control System', pairId: 6 } ] },
  { theme: 'Computer Parts', pairs: [ { term: 'CPU', definition: 'The Brain', pairId: 1 }, { term: 'RAM', definition: 'Short-Term Memory', pairId: 2 }, { term: 'GPU', definition: 'Renders Graphics', pairId: 3 }, { term: 'SSD', definition: 'Fast Storage', pairId: 4 }, { term: 'Motherboard', definition: 'Main Circuit Board', pairId: 5 }, { term: 'PSU', definition: 'Power Supply', pairId: 6 } ] },
  // Geography
  { theme: 'Countries & Capitals', pairs: [ { term: 'Japan', definition: 'Tokyo', pairId: 1 }, { term: 'France', definition: 'Paris', pairId: 2 }, { term: 'Egypt', definition: 'Cairo', pairId: 3 }, { term: 'Brazil', definition: 'Brasília', pairId: 4 }, { term: 'Australia', definition: 'Canberra', pairId: 5 }, { term: 'Canada', definition: 'Ottawa', pairId: 6 } ] },
  { theme: 'US States & Capitals', pairs: [ { term: 'California', definition: 'Sacramento', pairId: 1 }, { term: 'Texas', definition: 'Austin', pairId: 2 }, { term: 'Florida', definition: 'Tallahassee', pairId: 3 }, { term: 'New York', definition: 'Albany', pairId: 4 }, { term: 'Illinois', definition: 'Springfield', pairId: 5 }, { term: 'Colorado', definition: 'Denver', pairId: 6 } ] },
  { theme: 'Famous Landmarks', pairs: [ { term: 'Eiffel Tower', definition: 'Paris, France', pairId: 1 }, { term: 'Great Wall', definition: 'China', pairId: 2 }, { term: 'Statue of Liberty', definition: 'New York, USA', pairId: 3 }, { term: 'Colosseum', definition: 'Rome, Italy', pairId: 4 }, { term: 'Taj Mahal', definition: 'Agra, India', pairId: 5 }, { term: 'Pyramids of Giza', definition: 'Egypt', pairId: 6 } ] },
  // History & Arts
  { theme: 'Greek Mythology', pairs: [ { term: 'Zeus', definition: 'King of Gods', pairId: 1 }, { term: 'Hera', definition: 'Queen of Gods', pairId: 2 }, { term: 'Poseidon', definition: 'God of the Sea', pairId: 3 }, { term: 'Hades', definition: 'God of Underworld', pairId: 4 }, { term: 'Athena', definition: 'Goddess of Wisdom', pairId: 5 }, { term: 'Apollo', definition: 'God of Music', pairId: 6 } ] },
  { theme: 'Famous Inventors', pairs: [ { term: 'T. Edison', definition: 'Light Bulb', pairId: 1 }, { term: 'A. G. Bell', definition: 'Telephone', pairId: 2 }, { term: 'Wright Bros.', definition: 'Airplane', pairId: 3 }, { term: 'J. Gutenberg', definition: 'Printing Press', pairId: 4 }, { term: 'Marie Curie', definition: 'Radioactivity', pairId: 5 }, { term: 'Tim Berners-Lee', definition: 'World Wide Web', pairId: 6 } ] },
  { theme: 'Musical Instruments', pairs: [ { term: 'Guitar', definition: 'String', pairId: 1 }, { term: 'Piano', definition: 'Keyboard', pairId: 2 }, { term: 'Drums', definition: 'Percussion', pairId: 3 }, { term: 'Violin', definition: 'String', pairId: 4 }, { term: 'Trumpet', definition: 'Brass', pairId: 5 }, { term: 'Flute', definition: 'Woodwind', pairId: 6 } ] },
  { theme: 'Famous Authors', pairs: [ { term: 'Shakespeare', definition: 'Romeo and Juliet', pairId: 1 }, { term: 'J.K. Rowling', definition: 'Harry Potter', pairId: 2 }, { term: 'Tolkien', definition: 'Lord of the Rings', pairId: 3 }, { term: 'Jane Austen', definition: 'Pride and Prejudice', pairId: 4 }, { term: 'G. Orwell', definition: '1984', pairId: 5 }, { term: 'Mark Twain', definition: 'Huckleberry Finn', pairId: 6 } ] },
  // General Knowledge / Elementary
  { theme: 'Animals', pairs: [ { term: 'Dog', definition: 'Barks', pairId: 1 }, { term: 'Cat', definition: 'Meows', pairId: 2 }, { term: 'Cow', definition: 'Moos', pairId: 3 }, { term: 'Lion', definition: 'Roars', pairId: 4 }, { term: 'Duck', definition: 'Quacks', pairId: 5 }, { term: 'Sheep', definition: 'Baas', pairId: 6 } ] },
  { theme: 'Shapes', pairs: [ { term: 'Circle', definition: 'No Corners', pairId: 1 }, { term: 'Square', definition: '4 Equal Sides', pairId: 2 }, { term: 'Triangle', definition: '3 Sides', pairId: 3 }, { term: 'Rectangle', definition: '4 Sides', pairId: 4 }, { term: 'Star', definition: '5 Points', pairId: 5 }, { term: 'Oval', definition: 'Egg Shape', pairId: 6 } ] },
  { theme: 'Colors', pairs: [ { term: 'Red', definition: 'Apple', pairId: 1 }, { term: 'Blue', definition: 'Sky', pairId: 2 }, { term: 'Green', definition: 'Grass', pairId: 3 }, { term: 'Yellow', definition: 'Sun', pairId: 4 }, { term: 'Orange', definition: 'Carrot', pairId: 5 }, { term: 'Purple', definition: 'Grapes', pairId: 6 } ] },
  { theme: 'Simple Math', pairs: [ { term: '2 + 2', definition: '4', pairId: 1 }, { term: '5 - 3', definition: '2', pairId: 2 }, { term: '3 x 3', definition: '9', pairId: 3 }, { term: '10 ÷ 2', definition: '5', pairId: 4 }, { term: '1 + 0', definition: '1', pairId: 5 }, { term: '4 + 5', definition: '9', pairId: 6 } ] },
  { theme: 'Food Groups', pairs: [ { term: 'Apple', definition: 'Fruit', pairId: 1 }, { term: 'Broccoli', definition: 'Vegetable', pairId: 2 }, { term: 'Bread', definition: 'Grain', pairId: 3 }, { term: 'Chicken', definition: 'Protein', pairId: 4 }, { term: 'Milk', definition: 'Dairy', pairId: 5 }, { term: 'Candy', definition: 'Sweets', pairId: 6 } ] },
];


// Function to shuffle array
const shuffleArray = (array: CardData[]) => {
  return array.sort(() => Math.random() - 0.5);
};

export default function ZenMatchPage() {
  const [selectedSet, setSelectedSet] = useState<ConceptSet | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (selectedSet) {
      const gameCards: CardData[] = [];
      selectedSet.pairs.forEach(({ term, definition, pairId }) => {
        gameCards.push({ id: gameCards.length, content: term, pairId });
        gameCards.push({ id: gameCards.length, content: definition, pairId });
      });

      setCards(shuffleArray(gameCards));
      setFlippedCards([]);
      setMatchedPairs([]);
      setMoves(0);
      setIsChecking(false);
      setIsComplete(false);
      setHasSaved(false);
    }
  }, [selectedSet]);

  const checkAndUnlockAchievement = useCallback((achievementId: keyof typeof achievements) => {
    if (!user || !firestore) return;
    const achRef = doc(firestore, 'users', user.uid, 'achievements', achievementId);
    
    // This is a fire-and-forget check. We don't want to block UI on this.
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
    }).catch(error => {
        // Silently fail on achievement check error
    });
  }, [user, firestore, toast]);

  const saveGameResult = useCallback(() => {
    if (!user || !firestore || hasSaved) return;

    setHasSaved(true);
    const userRef = doc(firestore, "users", user.uid);
    const now = serverTimestamp();

    runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw "User document does not exist!";
      }
      const userData = userDoc.data() || {};

      // --- 1. Game Score & Activity Log ---
      const gameScoreData: Omit<GameScore, 'id'> = {
        userId: user.uid,
        gameId: 'zen-match',
        gameName: 'Zen Match',
        score: moves,
        createdAt: now,
      };
      const scoreRef = doc(collection(userRef, "gameScores"));
      transaction.set(scoreRef, gameScoreData);

      const activityData: Omit<Activity, 'id'> = {
        userId: user.uid,
        type: 'GAME_PLAYED',
        description: `Completed a game of Zen Match in ${moves} moves.`,
        refId: scoreRef.id,
        createdAt: now,
      };
      const activityRef = doc(collection(userRef, "activities"));
      transaction.set(activityRef, activityData);

      // --- 2. User Stats Update (Streak, XP, etc.) ---
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const lastActiveDateStr = userData.lastActiveDate || '';
      const currentStreak = userData.currentStreak || 0;

      let newStreak = 1;
      if (lastActiveDateStr && !isNaN(new Date(lastActiveDateStr).getTime())) {
          const lastActiveDate = new Date(lastActiveDateStr);
          const daysDifference = differenceInCalendarDays(today, lastActiveDate);
          if (daysDifference === 0) {
              newStreak = currentStreak || 1;
          } else if (daysDifference === 1) {
              newStreak = (currentStreak || 0) + 1;
          }
      }
      
      const tasksDoneToday = (lastActiveDateStr === todayStr) 
          ? (userData.tasksDoneToday || 0) + 1 
          : 1;

      const gamesPlayed = (userData.gamesPlayed || 0) + 1;
      const xpGained = xpValues.ZEN_MATCH;
      const totalXp = (userData.totalXp || 0) + xpGained;
      const newXp = totalXp;
      const currentXp = userData.totalXp || 0;

      transaction.update(userRef, {
        gamesPlayed,
        currentStreak: newStreak,
        lastActiveDate: todayStr,
        tasksDoneToday,
        totalXp,
      });

      return { newXp, currentXp };
    }).then(({ newXp, currentXp }) => {
      // --- 3. Post-Transaction Side Effects ---
      checkAndUnlockAchievement('ZEN_MASTER');
      
      for (const tier of rewardTiers) {
        if (newXp >= tier.xpThreshold && currentXp < tier.xpThreshold) {
          const { icon: Icon } = tier;
          toast({
            title: "Level Up!",
            description: React.createElement('div', { className: 'flex items-center gap-3' },
              React.createElement(Icon, { className: `w-8 h-8 ${tier.color}` }),
              React.createElement('div', null,
                React.createElement('p', { className: 'font-semibold' }, `You've achieved the rank of ${tier.name}!`),
                React.createElement('p', { className: 'text-xs' }, `XP Reached: ${tier.xpThreshold.toLocaleString()}`)
              )
            ),
          });
        }
      }
    }).catch(error => {
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Could not save your game progress. Please try again.",
      });
    });
  }, [user, firestore, hasSaved, moves, checkAndUnlockAchievement, toast]);


  // Check for match
  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      setMoves((prev) => prev + 1);
      const [firstIndex, secondIndex] = flippedCards;
      if (cards[firstIndex].pairId === cards[secondIndex].pairId) {
        setMatchedPairs((prev) => [...prev, cards[firstIndex].pairId]);
        setFlippedCards([]);
        setIsChecking(false);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);
  
  // Check for win condition
  useEffect(() => {
    if (selectedSet && cards.length > 0 && matchedPairs.length === selectedSet.pairs.length) {
      setIsComplete(true);
    }
  }, [matchedPairs, selectedSet, cards]);

  // Save game result on completion
  useEffect(() => {
    if (isComplete && !hasSaved) {
      saveGameResult();
    }
  }, [isComplete, hasSaved, saveGameResult]);


  const handleCardClick = (index: number) => {
    if (isChecking || flippedCards.length === 2 || flippedCards.includes(index) || matchedPairs.includes(cards[index].pairId)) {
      return;
    }
    setFlippedCards((prev) => [...prev, index]);
  };

  const handleThemeSelect = (themeName: string) => {
    const set = conceptSets.find(s => s.theme === themeName);
    if (set) {
      setSelectedSet(set);
    }
  };

  const resetToThemeSelection = () => {
    setSelectedSet(null);
  }

  if (!selectedSet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 bg-background text-foreground relative">
        <div className="w-full max-w-md z-10">
          <header className="flex items-center justify-end mb-6">
            <Link href="/dashboard/game-zone">
              <Button variant="ghost" size="icon">
                <XCircle className="w-8 h-8" />
              </Button>
            </Link>
          </header>
          <Card className="bg-card/50 text-center animate-in fade-in-0 duration-500">
            <CardHeader>
              <div className='flex items-center justify-center gap-2 mb-2'>
                <Brain className="w-8 h-8 text-yellow-500" />
                <CardTitle className="font-headline text-3xl">Zen Match</CardTitle>
              </div>
              <CardDescription>Select a theme to begin your memory challenge.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <Select onValueChange={handleThemeSelect}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Choose a concept..." />
                </SelectTrigger>
                <SelectContent>
                  {conceptSets.map((set) => (
                    <SelectItem key={set.theme} value={set.theme}>{set.theme}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 bg-background text-foreground relative overflow-hidden">
      <div className="w-full max-w-4xl z-10 animate-in fade-in-0 duration-500">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Brain className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="font-headline text-3xl">Zen Match</h1>
              <p className="text-muted-foreground">Relax & Connect | Theme: <span className="text-primary font-semibold">{selectedSet.theme}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" onClick={resetToThemeSelection}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Change Theme
            </Button>
            <p className="font-mono text-xl">Moves: {moves}</p>
            <Link href="/dashboard/game-zone">
              <Button variant="ghost" size="icon">
                <XCircle className="w-8 h-8" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="grid grid-cols-3 sm:grid-cols-4 gap-4 perspective">
          {cards.map((card, index) => {
            const isFlipped = flippedCards.includes(index) || matchedPairs.includes(card.pairId);
            const isMatched = matchedPairs.includes(card.pairId);
            return (
              <div
                key={index}
                className={cn('aspect-square rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-105', isFlipped && 'is-flipped')}
                onClick={() => handleCardClick(index)}
              >
                <div className="card-inner w-full h-full">
                  <div className="card-front bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full p-4 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 opacity-50">
                            <defs>
                                <linearGradient id="card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                                    <stop offset="100%" stopColor="hsl(var(--secondary))" />
                                </linearGradient>
                                <filter id="card-glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                    <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <g filter="url(#card-glow)" stroke="url(#card-grad)" strokeWidth="1.5">
                                <circle cx="50" cy="50" r="8" fill="none" />
                                <ellipse cx="50" cy="50" rx="30" ry="12" fill="none" transform="rotate(45 50 50)">
                                    <animateTransform attributeName="transform" type="rotate" from="45 50 50" to="405 50 50" dur="10s" repeatCount="indefinite" />
                                </ellipse>
                                <ellipse cx="50" cy="50" rx="30" ry="12" fill="none" transform="rotate(-45 50 50)">
                                    <animateTransform attributeName="transform" type="rotate" from="-45 50 50" to="315 50 50" dur="10s" repeatCount="indefinite" />
                                </ellipse>
                                 <ellipse cx="50" cy="50" rx="25" ry="25" fill="none" >
                                     <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="15s" repeatCount="indefinite" />
                                 </ellipse>
                            </g>
                        </svg>
                    </div>
                  </div>
                  <div className={cn(
                    "card-back bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-2 text-center flex items-center justify-center text-base sm:text-lg font-bold",
                    isMatched && 'bg-primary/20 border-primary animate-glow'
                  )}>
                    {card.content}
                  </div>
                </div>
              </div>
            );
          })}
        </main>
      </div>
      {isComplete && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in">
          <div className="bg-card/80 border border-primary/50 p-8 rounded-2xl shadow-2xl text-center animate-in zoom-in-90 duration-500 animate-glow" style={{animationDuration: '4s'}}>
              <h2 className="font-headline text-3xl text-primary">Orbit Complete!</h2>
              <p className="text-muted-foreground mt-2 text-lg">You matched all pairs in {moves} moves.</p>
              <p className="text-white mt-1">Excellent Connection!</p>
              <Button onClick={resetToThemeSelection} className="mt-6 animate-pulse-glow">Choose Another Theme</Button>
          </div>
        </div>
      )}
    </div>
  );
}
