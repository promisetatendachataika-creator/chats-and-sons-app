import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCNHXbnWMHS-bpwxoIBBMxV2aA4DbACVrI",
  authDomain: "chats-and-sons.firebaseapp.com",
  projectId: "chats-and-sons",
  storageBucket: "chats-and-sons.firebasestorage.app",
  messagingSenderId: "896454815213",
  appId: "1:896454815213:web:7f9630aaa06258e2080be4",
  measurementId: "G-150P8R4BZP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
