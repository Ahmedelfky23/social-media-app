import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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

// Initialize Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics conditionally
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}