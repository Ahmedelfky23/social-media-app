import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, browserSessionPersistence, type Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrCCCxEzAOLhV60jF6wm0tyiqhpf06ABo",
  authDomain: "route-social-media.firebaseapp.com",
  projectId: "route-social-media",
  storageBucket: "route-social-media.firebasestorage.app",
  messagingSenderId: "180137826871",
  appId: "1:180137826871:web:18501ceb04d5c489e2fdb2",
  measurementId: "G-C3JD8HXNQE"
};

// Initialize Firebase safely (avoid duplicate app init during HMR)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Chat identity is scoped to THIS browser tab. The Firebase default (IndexedDB /
// localStorage) is shared by every tab, so two accounts opened in the same browser
// would share one Firebase user and every message would render as the other's.
// The chat session is re-established from the social login on every load, so a
// per-tab store loses nothing for normal single-tab use.
//
// This is configured here (rather than with setPersistence(), which is queued
// behind the serial auth queue and can stall every later auth call) so auth
// initialization can never block sign-in.
function createAuth(): Auth {
  try {
    return initializeAuth(app, { persistence: browserSessionPersistence });
  } catch {
    // Already initialized (e.g. during Vite HMR) — reuse the existing instance
    return getAuth(app);
  }
}

export const auth = createAuth();

// Initialize Analytics conditionally
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}