import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "flash-legend-plkqp",
  appId: "1:1059771368038:web:386b4c8cb5eb41131963a7",
  apiKey: "AIzaSyBdBqIoTISyMZGaT9t631vdPy3Mu9EjJmo",
  authDomain: "flash-legend-plkqp.firebaseapp.com",
  storageBucket: "flash-legend-plkqp.firebasestorage.app",
  messagingSenderId: "1059771368038"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore with our specific DatabaseId
export const db = getFirestore(app, "ai-studio-f20e3546-34e4-4c22-94d8-d6353061fc07");
