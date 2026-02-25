/**
 * Firebase Configuration for UPPI
 * 
 * Setup instructions:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project or select existing
 * 3. Add a Web App
 * 4. Copy the config values to environment variables
 * 5. Enable Cloud Messaging in Firebase Console
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAfXTN8QiMVFJxYdzS0b2TatbUxodx3G-E",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "uppi-digital.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "uppi-digital",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "uppi-digital.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "470554921028",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:470554921028:web:90c0ab1f1569421b355411",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-HP051FTFYV",
}

export const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

// Initialize Firebase
import { initializeApp } from 'firebase/app'

let firebaseApp: ReturnType<typeof initializeApp> | undefined

export function getFirebaseApp() {
  if (typeof window === 'undefined') {
    // Server-side: create new instance each time
    return initializeApp(firebaseConfig)
  }
  
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig)
  }
  return firebaseApp
}

// Export app for convenience
export const app = typeof window !== 'undefined' ? getFirebaseApp() : initializeApp(firebaseConfig)
