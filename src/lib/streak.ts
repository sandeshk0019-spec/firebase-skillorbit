'use client';

import {
  doc,
  runTransaction,
  Firestore,
  DocumentData,
} from 'firebase/firestore';
import { format, differenceInCalendarDays } from 'date-fns';

/**
 * Updates a user's daily activity streak and task count based on the Snapchat-like rules.
 * This function should be called after a user completes a streak-worthy action.
 * It uses a Firestore transaction to ensure atomic updates and is now the single source
 * of truth for daily stats.
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
      const tasksDoneToday: number = userData.tasksDoneToday || 0;

      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // If user was already active today, just increment the task count.
      if (lastActiveDateStr === todayStr) {
        transaction.update(userRef, { tasksDoneToday: tasksDoneToday + 1 });
        return;
      }

      // This is the first activity of a new day.
      let newStreak: number;
      
      // Check if this is the first activity or if the streak was broken.
      if (!lastActiveDateStr) {
        // First activity ever.
        newStreak = 1;
      } else {
        const lastActiveDate = new Date(lastActiveDateStr);
        const daysDifference = differenceInCalendarDays(today, lastActiveDate);

        if (daysDifference === 1) {
          // Consecutive day: increment the streak.
          newStreak = currentStreak + 1;
        } else {
          // Missed one or more days: reset the streak to 1 for today's activity.
          newStreak = 1;
        }
      }
      
      // Update the document in the transaction.
      // Reset tasksDoneToday to 1 for the first task of the new day.
      transaction.update(userRef, {
        currentStreak: newStreak,
        lastActiveDate: todayStr,
        tasksDoneToday: 1,
      });
    });
  } catch (error) {
    console.error('Streak update transaction failed:', error);
    // We don't throw an error to the user for this, as it's a background process.
    // The error is logged for developers.
  }
};
