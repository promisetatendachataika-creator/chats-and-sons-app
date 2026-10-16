import { createContext, useState, useEffect, type ReactNode } from 'react';
import { type User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { ADMIN_EMAIL } from '../config/constants';

export interface UserProfile {
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

const buildProfile = (u: User): UserProfile => ({
  id: u.uid,
  email: u.email || '',
  displayName: u.displayName || u.email?.split('@')[0] || 'User',
  role: u.email === ADMIN_EMAIL ? 'admin' : 'client',
});

/**
 * Keeps the users/{uid} document in Firestore up to date, in the background.
 * The app no longer waits for this before showing a page: the role comes from the
 * signed-in email, which is already on the phone, so there's no network round-trip.
 */
async function syncProfileDoc(u: User) {
  try {
    const [{ db }, { doc, getDoc, setDoc }] = await Promise.all([
      import('../config/db'),
      import('firebase/firestore'),
    ]);
    const profile = buildProfile(u);
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, profile);
    } else if (snap.data().role !== profile.role) {
      await setDoc(ref, { role: profile.role }, { merge: true });
    }
  } catch (err) {
    console.warn('Profile sync skipped:', err);
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setProfile(currentUser ? buildProfile(currentUser) : null);
      setLoading(false);
      if (currentUser) void syncProfileDoc(currentUser);
    });
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
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
