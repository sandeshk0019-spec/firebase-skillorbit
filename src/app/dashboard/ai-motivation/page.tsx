'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const textMotivations = [
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", emoji: "🌟" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", emoji: "❤️" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", emoji: "✨" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", emoji: "💪" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", emoji: "⏰" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain", emoji: "🚀" },
  { quote: "It's hard to beat a person who never gives up.", author: "Babe Ruth", emoji: "🏆" },
  { quote: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon", emoji: "📖" },
  { quote: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson", emoji: "🍀" },
  { quote: "Success is the sum of small efforts, repeated day-in and day-out.", author: "Robert Collier", emoji: "🧱" },
  { quote: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu", emoji: "👟" },
  { quote: "Act as if what you do makes a difference. It does.", author: "William James", emoji: "🌊" },
  { quote: "Aim for the moon. If you miss, you may hit a star.", author: "W. Clement Stone", emoji: "🌙" },
  { quote: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar", emoji: "🦋" },
  { quote: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.", author: "Christian D. Larson", emoji: "🔥" },
  { quote: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas A. Edison", emoji: "💡" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", emoji: "🐢" },
  { quote: "The will to win, the desire to succeed, the urge to reach your full potential... these are the keys that will unlock the door to personal excellence.", author: "Confucius", emoji: "🔑" },
  { quote: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller", emoji: "💎" },
  { quote: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen R. Covey", emoji: "🧭" },
  { quote: "The mind is everything. What you think you become.", author: "Buddha", emoji: "🧠" },
  { quote: "Either you run the day or the day runs you.", author: "Jim Rohn", emoji: "🏃‍♂️" },
  { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", emoji: "⏳" },
  { quote: "Winning isn’t everything, but wanting to win is.", author: "Vince Lombardi", emoji: "🏅" },
  { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis", emoji: "🌅" },
  { quote: "The secret to success is to know something nobody else knows.", author: "Aristotle Onassis", emoji: "🤫" },
  { quote: "Do one thing every day that scares you.", author: "Eleanor Roosevelt", emoji: "👻" },
  { quote: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", emoji: "⛓️" },
  { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", emoji: "🕯️" },
  { quote: "The future starts today, not tomorrow.", author: "Pope John Paul II", emoji: "🗓️" },
  { quote: "Quality is not an act, it is a habit.", author: "Aristotle", emoji: "🔄" },
  { quote: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee", emoji: "🎯" },
  { quote: "Fall seven times and stand up eight.", author: "Japanese Proverb", emoji: "🌄" },
  { quote: "A creative man is motivated by the desire to achieve, not by the desire to beat others.", author: "Ayn Rand", emoji: "🎨" },
  { quote: "You can't build a reputation on what you are going to do.", author: "Henry Ford", emoji: "🏗️" },
  { quote: "The first step toward success is taken when you refuse to be a captive of the environment in which you first find yourself.", author: "Mark Caine", emoji: "🦋" },
  { quote: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington", emoji: "🤝" },
  { quote: "Everything you’ve ever wanted is on the other side of fear.", author: "George Addair", emoji: "🌉" },
  { quote: "You don’t have to be great to start, but you have to start to be great.", author: "Zig Ziglar", emoji: "🏁" },
  { quote: "What seems to us as bitter trials are often blessings in disguise.", author: "Oscar Wilde", emoji: "🎭" },
  { quote: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", emoji: "👤" },
  { quote: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau", emoji: "🌌" },
  { quote: "When I stand before God at the end of my life, I would hope that I would not have a single bit of talent left and could say, I used everything you gave me.", author: "Erma Bombeck", emoji: "🎁" },
  { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe", emoji: "🛠️" },
  { quote: "Problems are not stop signs, they are guidelines.", author: "Robert H. Schuller", emoji: "🚧" },
  { quote: "I can't change the direction of the wind, but I can adjust my sails to always reach my destination.", author: "Jimmy Dean", emoji: "⛵" },
  { quote: "Perfection is not attainable, but if we chase perfection we can catch excellence.", author: "Vince Lombardi", emoji: "🏹" },
  { quote: "The best way to predict the future is to create it.", author: "Peter Drucker", emoji: "🌍" },
  { quote: "You must do the thing you think you cannot do.", author: "Eleanor Roosevelt", emoji: "🧗‍♀️" },
  { quote: "It’s not whether you get knocked down, it’s whether you get up.", author: "Vince Lombardi", emoji: "🥊" },
  { quote: "Your attitude, not your aptitude, will determine your altitude.", author: "Zig Ziglar", emoji: "🎈" },
  { quote: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson", emoji: "🎭" },
  { quote: "We can do anything we want to do if we stick to it long enough.", author: "Helen Keller", emoji: "💪" },
  { quote: "If you are not willing to risk the usual, you will have to settle for the ordinary.", author: "Jim Rohn", emoji: "🎲" },
  { quote: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney", emoji: "🏰" },
  { quote: "The harder the conflict, the more glorious the triumph.", author: "Thomas Paine", emoji: "⚔️" },
  { quote: "I attribute my success to this: I never gave or took any excuse.", author: "Florence Nightingale", emoji: "🚫" },
  { quote: "To accomplish great things, we must not only act, but also dream; not only plan, but also believe.", author: "Anatole France", emoji: "🌠" },
  { quote: "Don't let yesterday take up too much of today.", author: "Will Rogers", emoji: "🌅" }
];

export default function AiMotivationPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Set a random quote on initial load
  useEffect(() => {
    setCurrentIndex(Math.floor(Math.random() * textMotivations.length));
  }, []);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % textMotivations.length);
  };

  const currentMotivation = textMotivations[currentIndex];

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary/10 p-3 rounded-lg animate-pulse-glow">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-headline text-2xl">AI Motivation Coach</h1>
          <p className="text-muted-foreground">
            Get a boost of encouragement whenever you need it.
          </p>
        </div>
      </div>
      <Card className="bg-card/50">
        <CardHeader>
            <CardTitle className="font-headline">Daily Spark</CardTitle>
            <CardDescription>
            A few words of encouragement to brighten your day.
            </CardDescription>
        </CardHeader>
        {!currentMotivation ? (
            <CardContent>
                <p>Loading motivation...</p>
            </CardContent>
        ) : (
            <CardContent className="space-y-6 text-center">
                <div className="bg-muted/50 p-6 rounded-lg flex flex-col items-center gap-4 min-h-[200px] justify-center animate-in fade-in">
                    <span className="text-4xl">{currentMotivation.emoji}</span>
                    <blockquote className="text-lg font-semibold text-primary">
                    "{currentMotivation.quote}"
                    </blockquote>
                    <cite className="text-sm text-muted-foreground self-end">- {currentMotivation.author}</cite>
                </div>
                <Button onClick={handleNext} size="lg" className="w-full">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Next Spark
                </Button>
            </CardContent>
        )}
    </Card>
    </div>
  )
}
