import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, getDocFromServer, Timestamp } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with fallback
let dbInstance;
const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
console.log(`Initializing Firestore with database ID: ${dbId}`);
dbInstance = getFirestore(app, dbId);

export let db = dbInstance;

// Function to switch to fallback database if needed
export async function ensureConnection() {
  try {
    // Try a simple read to verify the database exists and is accessible
    await getDocFromServer(doc(db, 'vehicles', 'test-connection'));
    console.log(`Firestore connection to ${dbId} verified.`);
  } catch (error: any) {
    console.warn(`Firestore connection test failed for ${dbId}:`, error.message);
    
    // If NOT_FOUND or similar error, fallback to (default)
    if (dbId !== '(default)' && (
      error.message?.includes('NOT_FOUND') || 
      error.message?.includes('5') || 
      error.message?.includes('permission-denied') ||
      error.message?.includes('failed-precondition')
    )) {
      console.error(`Database ${dbId} might not exist or is inaccessible. Falling back to (default)...`);
      try {
        const fallbackDb = getFirestore(app, '(default)');
        // Verify fallback
        await getDocFromServer(doc(fallbackDb, 'vehicles', 'test-connection'));
        db = fallbackDb;
        console.log("Successfully switched to (default) database.");
      } catch (fallbackError: any) {
        console.error("Fallback to (default) also failed:", fallbackError.message);
        // Last resort: use default instance
        db = getFirestore(app);
      }
    }
  }
}
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Track pending login to avoid multiple simultaneous popups
let isLoginPending = false;

// Operation types for error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation function for connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

// Auth functions
export const loginWithGoogle = async () => {
  console.log('loginWithGoogle triggered');
  if (isLoginPending) {
    console.log('Login already pending, skipping');
    return;
  }
  isLoginPending = true;
  try {
    // Get a fresh auth instance and provider to avoid potential stale references
    const authInstance = getAuth(app);
    const provider = new GoogleAuthProvider();
    
    console.log('Auth instance:', authInstance);
    console.log('GoogleProvider instance:', provider);
    
    if (!authInstance || !provider) {
      throw new Error('Auth or GoogleProvider is not initialized');
    }

    console.log('Attempting signInWithPopup...');
    const result = await signInWithPopup(authInstance, provider);
    console.log('Login successful:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('Login error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    // If it's a popup blocked error, we might want to alert the user
    if (error instanceof Error && (error as any).code === 'auth/popup-blocked') {
      alert('Popup blocked! Please allow popups for this site to login.');
    }
    throw error;
  } finally {
    isLoginPending = false;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export { Timestamp, signInWithEmailAndPassword, signInAnonymously };
