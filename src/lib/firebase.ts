import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

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

// Test Connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      console.info("Firestore status: Client operating in sandbox/restricted mode.", error.message);
    }
  }
}
testConnection();

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
