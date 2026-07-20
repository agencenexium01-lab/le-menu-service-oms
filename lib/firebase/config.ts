import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase app safely (compatible with both SPA and NextJS environments)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CORRECTION : On initialise Firestore proprement sans le deuxième argument problématique
export const db = getFirestore(app); 
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;