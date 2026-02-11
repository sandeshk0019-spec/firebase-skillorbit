'use client';

import * as React from 'react';
import { doc, runTransaction, Firestore, serverTimestamp, addDoc, collection, getDoc, setDoc } from 'firebase/firestore';
import { type RewardTier, rewardTiers } from './rewards';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This function will be called from various game components after a game/task is completed.
export const awardXp = async (
  firestore: Firestore,
  userId: string,
  xpGained: number,
  toast: (options: any) => void
) => {
  if (!userId || xpGained <= 0) return;
  const roundedXpGained = Math.round(xpGained);
  if (roundedXpGained <= 0) return;

  const userRef = doc(firestore, 'users', userId);

  try {
    const newTotalXp = await runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw "User document does not exist!";
      }
      const currentXp = userDoc.data().totalXp || 0;
      const newXp = currentXp + roundedXpGained;
      transaction.update(userRef, { totalXp: newXp });
      return newXp;
    });

    // Check for newly unlocked rewards after the transaction succeeds
    for (const tier of rewardTiers) {
      if (newTotalXp >= tier.xpThreshold) {
        const achRef = doc(firestore, 'users', userId, 'achievements', tier.id);
        const achDoc = await getDoc(achRef);

        if (!achDoc.exists()) {
          // Unlock the achievement (non-blocking)
          const achievementData = {
            userId: userId,
            achievementId: tier.id,
            unlockedAt: serverTimestamp(),
          };
          setDoc(achRef, achievementData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: achRef.path,
              operation: 'create',
              requestResourceData: achievementData,
            }));
          });
          
          // Log the activity (non-blocking)
          const activityData = {
            userId: userId,
            type: 'ACHIEVEMENT_UNLOCKED' as const,
            description: `Reached Level ${tier.level}: ${tier.name}`,
            createdAt: serverTimestamp(),
            refId: tier.id,
          };
          const activitiesColRef = collection(firestore, 'users', userId, 'activities');
          addDoc(activitiesColRef, activityData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: activitiesColRef.path,
              operation: 'create',
              requestResourceData: activityData,
            }));
          });

          // Show a toast notification for the new reward
          const { icon: Icon } = tier;
          toast({
            title: "Level Up!",
            description: React.createElement(
              'div',
              { className: 'flex items-center gap-3' },
              React.createElement(Icon, { className: `w-8 h-8 ${tier.color}` }),
              React.createElement(
                'div',
                null,
                React.createElement(
                  'p',
                  { className: 'font-semibold' },
                  `You've achieved the rank of ${tier.name}!`
                ),
                React.createElement(
                  'p',
                  { className: 'text-xs' },
                  `XP Reached: ${tier.xpThreshold.toLocaleString()}`
                )
              )
            ),
          });
        }
      }
    }
  } catch (error) {
    console.error('XP award transaction failed:', error);
    // Don't show a toast for this, as it's a background process failure.
    // The error is logged for developers.
  }
};
