'use client';

import { useState, useEffect } from 'react';
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

const initialPairs = [
  { term: 'H₂O', definition: 'Water', pairId: 1 },
  { term: 'Au', definition: 'Gold', pairId: 2 },
  { term: 'CO₂', definition: 'Carbon Dioxide', pairId: 3 },
  { term: 'NaCl', definition: 'Salt', pairId: 4 },
  { term: 'O₂', definition: 'Oxygen', pairId: 5 },
  { term: 'Fe', definition: 'Iron', pairId: 6 },
];

// Function to shuffle array
const shuffleArray = (array: CardData[]) => {
  return array.sort(() => Math.random() - 0.5);
};

export default function ZenMatchPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Initialize and shuffle cards
  useEffect(() => {
    resetGame();
  }, []);
  
  const resetGame = () => {
    const gameCards: CardData[] = [];
    initialPairs.forEach(({ term, definition, pairId }) => {
      gameCards.push({ id: gameCards.length, content: term, pairId });
      gameCards.push({ id: gameCards.length, content: definition, pairId });
    });
    setCards(shuffleArray(gameCards));
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setIsChecking(false);
    setIsComplete(false);
  }

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
    if (matchedPairs.length > 0 && matchedPairs.length === initialPairs.length) {
      setIsComplete(true);
    }
  }, [matchedPairs]);

  const handleCardClick = (index: number) => {
    if (isChecking || flippedCards.length === 2 || flippedCards.includes(index) || matchedPairs.includes(cards[index].pairId)) {
      return;
    }
    setFlippedCards((prev) => [...prev, index]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 bg-background text-foreground">
      <div className="w-full max-w-4xl">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Brain className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="font-headline text-3xl">Zen Match</h1>
              <p className="text-muted-foreground">Relax & Connect Concepts</p>
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
                className={cn('aspect-square rounded-2xl cursor-pointer', isFlipped && 'is-flipped')}
                onClick={() => handleCardClick(index)}
              >
                <div className="card-inner w-full h-full">
                  <div className="card-front bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center">
                    <Brain className="w-1/2 h-1/2 text-yellow-500/50" />
                  </div>
                  <div className={cn(
                    "card-back bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-2 text-center flex items-center justify-center text-sm sm:text-lg font-semibold",
                    isMatched && 'bg-green-500/30 border-green-400'
                  )}>
                    {card.content}
                  </div>
                </div>
              </div>
            );
          })}
        </main>
        
        {isComplete && (
          <footer className="text-center mt-8 p-4 bg-primary/10 rounded-lg animate-in fade-in duration-500">
            <h2 className="font-headline text-2xl text-primary">Orbit Complete!</h2>
            <p className="text-muted-foreground mt-2">You matched all pairs in {moves} moves. Excellent Connection!</p>
            <Button onClick={resetGame} className="mt-4">Play Again</Button>
          </footer>
        )}
      </div>
    </div>
  );
}
