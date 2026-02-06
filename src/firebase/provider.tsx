'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth || !firestore) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth or Firestore service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Auth state determined
        if (firebaseUser) {
          const creationTime = new Date(firebaseUser.metadata.creationTime || 0).getTime();
          const lastSignInTime = new Date(firebaseUser.metadata.lastSignInTime || 0).getTime();
          const isNewUser = lastSignInTime - creationTime < 5000; // 5 seconds threshold

          if (isNewUser) {
            const userDocRef = doc(firestore, 'users', firebaseUser.uid);
            
            if (firebaseUser.isAnonymous) {
              const guestProfile = {
                displayName: 'Guest Voyager',
                username: `guest_${firebaseUser.uid.substring(0, 8)}`,
                firstName: 'Guest',
                lastName: 'Voyager',
              };
              setDoc(userDocRef, {
                id: firebaseUser.uid,
                email: null,
                createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                lastLogin: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
                username: guestProfile.username,
                firstName: guestProfile.firstName,
                lastName: guestProfile.lastName,
              }).then(() => {
                 updateProfile(firebaseUser, {
                  displayName: guestProfile.displayName,
                }).catch(e => console.error("Error updating guest auth profile", e));
              }).catch(e => {
                  console.error("Error creating guest user profile document:", e);
              });
            } else {
              const pendingProfileRaw = localStorage.getItem('pendingUserProfile');
              if (pendingProfileRaw) {
                try {
                  const profileData = JSON.parse(pendingProfileRaw);
                  
                  getDoc(userDocRef).then(docSnap => {
                    if (!docSnap.exists()) {
                      setDoc(userDocRef, {
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                        lastLogin: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
                        username: profileData.username,
                        firstName: profileData.firstName,
                        lastName: profileData.lastName,
                      }).then(() => {
                         updateProfile(firebaseUser, {
                          displayName: `${profileData.firstName} ${profileData.lastName}`,
                        }).catch(e => console.error("Error updating auth profile", e));
                      }).catch(e => {
                          console.error("Error creating user profile document:", e);
                      });
                    }
                    localStorage.removeItem('pendingUserProfile');
                  }).catch(e => {
                      console.error("Error checking for user profile:", e);
                      localStorage.removeItem('pendingUserProfile');
                  });

                } catch (e) {
                  console.error("Failed to parse pending user profile:", e);
                  localStorage.removeItem('pendingUserProfile');
                }
              }
            }
          }
        }
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};
