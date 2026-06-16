import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const ENV_FIREBASE_API_KEY = ((import.meta as any).env?.VITE_FIREBASE_API_KEY as string) || ((window as any).env?.VITE_FIREBASE_API_KEY as string) || '';
const ENV_FIREBASE_AUTH_DOMAIN = ((import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN as string) || ((window as any).env?.VITE_FIREBASE_AUTH_DOMAIN as string) || '';
const ENV_FIREBASE_PROJECT_ID = ((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID as string) || ((window as any).env?.VITE_FIREBASE_PROJECT_ID as string) || '';
const ENV_FIREBASE_APP_ID = ((import.meta as any).env?.VITE_FIREBASE_APP_ID as string) || ((window as any).env?.VITE_FIREBASE_APP_ID as string) || '';
const ENV_FIREBASE_STORAGE_BUCKET = ((import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET as string) || ((window as any).env?.VITE_FIREBASE_STORAGE_BUCKET as string) || '';
const ENV_FIREBASE_MESSAGING_SENDER_ID = ((import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || ((window as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '';

const resolvedConfig = {
  apiKey: ENV_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: ENV_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: ENV_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: ENV_FIREBASE_APP_ID || firebaseConfig.appId,
  storageBucket: ENV_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: ENV_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
};

// Initialize Firebase App
const app = initializeApp(resolvedConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Scopes we configured in OAuth:
// Sheets: https://www.googleapis.com/auth/spreadsheets
// Docs: https://www.googleapis.com/auth/documents
// Forms: https://www.googleapis.com/auth/forms.body
// Drive: https://www.googleapis.com/auth/drive
// Calendar: https://www.googleapis.com/auth/calendar
// Gmail: https://www.googleapis.com/auth/gmail.modify

googleAuthProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleAuthProvider.addScope('https://www.googleapis.com/auth/documents');
googleAuthProvider.addScope('https://www.googleapis.com/auth/forms.body');
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive');
googleAuthProvider.addScope('https://www.googleapis.com/auth/calendar');
googleAuthProvider.addScope('https://www.googleapis.com/auth/gmail.modify');

// Lazy Test Connection to Firestore (Disabled by default to avoid eager/noisy console logs if default DB is not provisioned)
export async function testConnection() {
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      console.info("Firestore status: Client operating in sandbox/restricted mode.", error.message);
    }
  }
}

// Cache Google OAuth Access Token in Memory in line with security directives
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Authenticate and fetch google OAuth token
export const googleSignIn = async () => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve google OAuth access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Firebase OAuth popup sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = () => cachedAccessToken;

export const logoutFirebase = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
