// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase config - Replace with your actual config
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

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// For development, you might want to use the emulator
if (process.env.NODE_ENV === 'development') {
  // Uncomment the lines below if you want to use Firebase emulator
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;
