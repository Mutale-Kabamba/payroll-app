// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0OccTaTZiPwYK4hdNr27wNim3y8ALtZU",
  authDomain: "payroll-app-sync.firebaseapp.com",
  projectId: "payroll-app-sync",
  storageBucket: "payroll-app-sync.firebasestorage.app",
  messagingSenderId: "761263659527",
  appId: "1:761263659527:web:67ae1a26087e2e831528a2",
  measurementId: "G-VT44W1WFY2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
export const db = getFirestore(app);

// Initialize Firebase Auth and export it
export const auth = getAuth(app);

export default app;