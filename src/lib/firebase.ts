import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDrCCCxEzAOLhV60jF6wm0tyiqhpf06ABo",
  authDomain: "route-social-media.firebaseapp.com",
  projectId: "route-social-media",
  storageBucket: "route-social-media.firebasestorage.app",
  messagingSenderId: "180137826871",
  appId: "1:180137826871:web:18501ceb04d5c489e2fdb2",
  measurementId: "G-C3JD8HXNQE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const analytics = getAnalytics(app);