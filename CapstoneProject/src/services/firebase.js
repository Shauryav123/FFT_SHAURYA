/**
 * Centralized Firebase Initialization & Diagnostics Module
 * Validates real environment configuration, initializes Firebase Realtime Database,
 * and provides safe connection diagnostics without exposing API keys or secrets.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, update, remove, goOnline, goOffline } from 'firebase/database';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';

let app = null;
let db = null;
let auth = null;
let initError = null;

export function getFirebaseConfig() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});
  return {
    apiKey: env.VITE_FIREBASE_API_KEY ? String(env.VITE_FIREBASE_API_KEY).trim() : '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ? String(env.VITE_FIREBASE_AUTH_DOMAIN).trim() : '',
    databaseURL: env.VITE_FIREBASE_DATABASE_URL ? String(env.VITE_FIREBASE_DATABASE_URL).trim() : '',
    projectId: env.VITE_FIREBASE_PROJECT_ID ? String(env.VITE_FIREBASE_PROJECT_ID).trim() : '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ? String(env.VITE_FIREBASE_STORAGE_BUCKET).trim() : '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ? String(env.VITE_FIREBASE_MESSAGING_SENDER_ID).trim() : '',
    appId: env.VITE_FIREBASE_APP_ID ? String(env.VITE_FIREBASE_APP_ID).trim() : '',
  };
}

export function validateFirebaseConfig(config) {
  const missing = [];
  if (!config.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!config.databaseURL) missing.push('VITE_FIREBASE_DATABASE_URL');
  if (!config.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');

  if (missing.length > 0) {
    return {
      isValid: false,
      message: `Missing required Firebase environment variables in .env: ${missing.join(', ')}`,
      missing,
    };
  }

  // Validate databaseURL format (handles both standard us-central1 and regional RTDB instances)
  const isRtdbHost = config.databaseURL.includes('firebaseio.com') || config.databaseURL.includes('firebasedatabase.app');
  if (!config.databaseURL.startsWith('https://') || !isRtdbHost) {
    return {
      isValid: false,
      message: `VITE_FIREBASE_DATABASE_URL must be a valid HTTPS Realtime Database URL (e.g. https://<project-id>-default-rtdb.firebaseio.com or https://<project-id>-default-rtdb.<region>.firebasedatabase.app)`,
      missing: ['VITE_FIREBASE_DATABASE_URL'],
    };
  }

  return { isValid: true, message: 'Valid' };
}

export function initFirebase() {
  if (db && auth) return { db, auth };

  const config = getFirebaseConfig();
  const validation = validateFirebaseConfig(config);

  if (!validation.isValid) {
    initError = validation.message;
    console.warn(`[Firebase Warning] ${validation.message}`);
    return null;
  }

  try {
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    db = getDatabase(app);
    try {
      auth = getAuth(app);
    } catch (e) {
      console.warn('[Firebase Auth Warning]', e.message);
    }
    initError = null;

    if (typeof window !== 'undefined') {
      window.firebaseDb = db;
      window.firebaseAuth = auth;
      console.log(
        '%c🔥 [Firebase Services] Initialized (RTDB + Auth)',
        'background: #ff9100; color: #000; font-weight: bold; font-size: 11px; padding: 2px 6px; border-radius: 4px;',
        {
          projectId: config.projectId,
          databaseHost: new URL(config.databaseURL).host,
          authDomain: config.authDomain,
          configured: true,
        }
      );
    }
    return { db, auth };
  } catch (err) {
    initError = err.message || 'Unknown Firebase initialization error';
    console.error('[Firebase Init Error]', err);
    return null;
  }
}

export function getDatabaseInstance() {
  if (!db) {
    initFirebase();
  }
  return db;
}

export function getAuthInstance() {
  if (!auth) {
    initFirebase();
  }
  return auth;
}

export async function firebaseSignInWithEmail(email, password) {
  const authInst = getAuthInstance();
  if (!authInst) throw new Error('Firebase Auth is not initialized. Please check .env config.');
  return await signInWithEmailAndPassword(authInst, email, password);
}

export async function firebaseSignUpWithEmail(email, password, displayName, avatar) {
  const authInst = getAuthInstance();
  if (!authInst) throw new Error('Firebase Auth is not initialized. Please check .env config.');
  const userCredential = await createUserWithEmailAndPassword(authInst, email, password);
  if (displayName || avatar) {
    try {
      await updateProfile(userCredential.user, {
        displayName: displayName || email.split('@')[0],
        photoURL: avatar || '⚡',
      });
    } catch (err) {
      console.warn('Profile update warning:', err);
    }
  }
  return userCredential;
}

export async function firebaseSignInWithGoogle() {
  const authInst = getAuthInstance();
  if (!authInst) throw new Error('Firebase Auth is not initialized. Please check .env config.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return await signInWithPopup(authInst, provider);
}

export async function firebaseSignOut() {
  const authInst = getAuthInstance();
  if (authInst) {
    await signOut(authInst);
  }
}

export function onFirebaseAuthStateChanged(callback) {
  const authInst = getAuthInstance();
  if (!authInst) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(authInst, callback);
}

export function getFirebaseCurrentUser() {
  const authInst = getAuthInstance();
  return authInst ? authInst.currentUser : null;
}

export function getFriendlyAuthErrorMessage(err) {
  if (!err) return 'An error occurred';
  const code = err.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again or create an account.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Console.';
    default:
      return err.message || 'Authentication error. Please try again.';
  }
}

export function getFirebaseDiagnostics() {
  const config = getFirebaseConfig();
  const validation = validateFirebaseConfig(config);
  return {
    isConfigured: validation.isValid,
    hasInstance: Boolean(db),
    hasAuth: Boolean(auth),
    error: initError || (validation.isValid ? null : validation.message),
    projectId: config.projectId || null,
    databaseHost: config.databaseURL ? new URL(config.databaseURL).host : null,
  };
}
