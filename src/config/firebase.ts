import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase web config is public by design; access is controlled by Firestore security rules.
const firebaseConfig = {
  apiKey: 'AIzaSyCNHXbnWMHS-bpwxoIBBMxV2aA4DbACVrI',
  authDomain: 'chats-and-sons.firebaseapp.com',
  projectId: 'chats-and-sons',
  storageBucket: 'chats-and-sons.firebasestorage.app',
  messagingSenderId: '896454815213',
  appId: '1:896454815213:web:7f9630aaa06258e2080be4',
  measurementId: 'G-150P8R4BZP',
};

export const app = initializeApp(firebaseConfig);

// Auth only. Firestore lives in ./db so the login screen doesn't have to download it.
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
