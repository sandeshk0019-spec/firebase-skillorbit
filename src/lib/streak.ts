'use client';

import {
  doc,
  runTransaction,
  Firestore,
  DocumentData,
} from 'firebase/firestore';
import { format, differenceInCalendarDays } from 'date-fns';

/**
 * Updates a user's daily activity streak based on the Snapchat-like rules.
 * This function should be called after a user completes a streak-worthy action (e.g., a quiz).
 * It uses a Firestore transaction to ensure atomic updates.
 *
 * @param firestore The Firestore instance.
 * @param userId The ID of the user to update.
 */
export const updateUserStreak = async (firestore: Firestore, userId: string) => {
  if (!userId) return;

  const userRef = doc(firestore, 'users', userId);

  try {
    await runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        console.warn('User document not found for streak update. Cannot update streak.');
        return;
      }

      const userData = userDoc.data() as DocumentData;
      const currentStreak: number = userData.currentStreak || 0;
      const lastActiveDateStr: string = userData.lastActiveDate || '';

      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // 1. If user was already active today, do nothing.
      if (lastActiveDateStr === todayStr) {
        return;
      }

      let newStreak: number;

      // 2. Check if this is the first activity or if the streak was broken.
      if (!lastActiveDateStr) {
        // First activity ever.
        newStreak = 1;
      } else {
        const lastActiveDate = new Date(lastActiveDateStr);
        const daysDifference = differenceInCalendarDays(today, lastActiveDate);

        if (daysDifference === 1) {
          // 3. Consecutive day: increment the streak.
          newStreak = currentStreak + 1;
        } else {
          // 4. Missed one or more days: reset the streak to 1 for today's activity.
          newStreak = 1;
        }
      }
      
      // Update the document in the transaction.
      transaction.update(userRef, {
        currentStreak: newStreak,
        lastActiveDate: todayStr,
      });
    });
  } catch (error) {
    console.error('Streak update transaction failed:', error);
    // We don't throw an error to the user for this, as it's a background process.
    // The error is logged for developers.
  }
};
