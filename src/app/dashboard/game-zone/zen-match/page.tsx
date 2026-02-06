'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { XCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  {
    theme: 'Chemical Elements',
    pairs: [
      { term: 'H₂O', definition: 'Water', pairId: 1 },
      { term: 'Au', definition: 'Gold', pairId: 2 },
      { term: 'CO₂', definition: 'Carbon Dioxide', pairId: 3 },
      { term: 'NaCl', definition: 'Salt', pairId: 4 },
      { term: 'O₂', definition: 'Oxygen', pairId: 5 },
      { term: 'Fe', definition: 'Iron', pairId: 6 },
    ],
  },
  {
    theme: 'Programming Jargon',
    pairs: [
      { term: 'API', definition: 'Application Programming Interface', pairId: 1 },
      { term: 'SDK', definition: 'Software Development Kit', pairId: 2 },
      { term: 'JSON', definition: 'JavaScript Object Notation', pairId: 3 },
      { term: 'HTML', definition: 'HyperText Markup Language', pairId: 4 },
      { term: 'CSS', definition: 'Cascading Style Sheets', pairId: 5 },
      { term: 'Git', definition: 'Version Control System', pairId: 6 },
    ],
  },
  {
    theme: 'Cosmic Wonders',
    pairs: [
      { term: 'Nebula', definition: 'Cloud of Gas and Dust', pairId: 1 },
      { term: 'Supernova', definition: 'Exploding Star', pairId: 2 },
      { term: 'Galaxy', definition: 'System of Stars', pairId: 3 },
      { term: 'Black Hole', definition: 'Infinite Gravity', pairId: 4 },
      { term: 'Comet', definition: 'Icy Solar System Body', pairId: 5 },
      { term: 'Asteroid', definition: 'Small Solar System Body', pairId: 6 },
    ],
  },
];

// Function to shuffle array
const shuffleArray = (array: CardData[]) => {
  return array.sort(() => Math.random() - 0.5);
};

export default function ZenMatchPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [activePairs, setActivePairs] = useState<ConceptPair[]>([]);
  const [theme, setTheme] = useState('');
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Memoize the initial game setup
  const resetGame = useMemo(() => () => {
    const randomSetIndex = Math.floor(Math.random() * conceptSets.length);
    const selectedSet = conceptSets[randomSetIndex];
    setActivePairs(selectedSet.pairs);
    setTheme(selectedSet.theme);

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
  }, []);

  // Initialize and shuffle cards
  useEffect(() => {
    resetGame();
  }, [resetGame]);
  

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
    if (activePairs.length > 0 && matchedPairs.length === activePairs.length) {
      setIsComplete(true);
    }
  }, [matchedPairs, activePairs]);

  const handleCardClick = (index: number) => {
    if (isChecking || flippedCards.length === 2 || flippedCards.includes(index) || matchedPairs.includes(cards[index].pairId)) {
      return;
    }
    setFlippedCards((prev) => [...prev, index]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 bg-background text-foreground relative overflow-hidden">
      <div className="w-full max-w-4xl z-10">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Brain className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="font-headline text-3xl">Zen Match</h1>
              <p className="text-muted-foreground">Relax & Connect | Theme: <span className="text-primary font-semibold">{theme}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-6">
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
                    "card-back bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-2 text-center flex items-center justify-center text-lg sm:text-xl font-bold",
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
              <Button onClick={resetGame} className="mt-6 animate-pulse-glow">Play Again with a New Concept</Button>
          </div>
        </div>
      )}
    </div>
  );
}
