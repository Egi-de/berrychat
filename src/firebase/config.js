// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyAQAMlPps3ysEdhdsvp0-I9d4O7t0J4_Uw",
  authDomain: "berrychat-afdd8.firebaseapp.com",
  projectId: "berrychat-afdd8",
  storageBucket: "berrychat-afdd8.appspot.com",
  messagingSenderId: "226580756770",
  appId: "1:226580756770:web:3989bd737960b4658bcd7b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication
export const auth = getAuth(app);

// Export Firestore Database
export const db = getFirestore(app);

// Export Firebase Storage
export const storage = getStorage(app);

export default app;
