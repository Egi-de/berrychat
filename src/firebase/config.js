// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQAMlPps3ysEdhdsvp0-I9d4O7t0J4_Uw",
  authDomain: "berrychat-afdd8.firebaseapp.com",
  projectId: "berrychat-afdd8",
  storageBucket: "berrychat-afdd8.firebasestorage.app",
  messagingSenderId: "226580756770",
  appId: "1:226580756770:web:3989bd737960b4658bcd7b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
