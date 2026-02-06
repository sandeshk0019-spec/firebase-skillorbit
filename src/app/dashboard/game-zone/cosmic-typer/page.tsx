'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
      <Gamepad2 className="w-16 h-16 text-primary animate-bounce" />
      <h1 className="mt-8 font-headline text-4xl">Coming Soon!</h1>
      <p className="mt-4 text-muted-foreground max-w-md">
        This corner of the Game Zone is under construction. Our top engineers are building an exciting new experience for you.
      </p>
      <Link href="/dashboard/game-zone" className="mt-8">
        <Button>Back to Game Zone</Button>
      </Link>
    </div>
  );
}
