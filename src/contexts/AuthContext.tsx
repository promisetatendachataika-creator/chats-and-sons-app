import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import { ADMIN_EMAIL } from '../config/constants';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'client' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Determine role — only the admin email gets admin access
        const isAdmin = currentUser.email === ADMIN_EMAIL;

        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 5000)
          );
          const userSnap = await Promise.race([
            getDoc(userRef),
            timeoutPromise,
          ]) as any;

          if (userSnap.exists()) {
            // Always enforce role based on email — not stored value
            const data = userSnap.data() as UserProfile;
            const correctedProfile = { ...data, role: isAdmin ? 'admin' : 'client' } as UserProfile;
            // Sync the role to Firestore if it changed
            if (data.role !== correctedProfile.role) {
              await setDoc(userRef, correctedProfile, { merge: true });
            }
            setProfile(correctedProfile);
          } else {
            const newProfile: UserProfile = {
              id: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              role: isAdmin ? 'admin' : 'client',
            };
            await Promise.race([
              setDoc(userRef, newProfile),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Write timeout')), 5000)),
            ]);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching/creating user profile:', error);
          setProfile({
            id: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'User',
            role: isAdmin ? 'admin' : 'client',
          });
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
