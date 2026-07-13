/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyB-nTqwgHaJFBmSnc9h6gYzv6rjIAe74zY",
  authDomain: "gen-lang-client-0308980523.firebaseapp.com",
  projectId: "gen-lang-client-0308980523",
  storageBucket: "gen-lang-client-0308980523.firebasestorage.app",
  messagingSenderId: "55011035138",
  appId: "1:55011035138:web:a8fd22c2742bb05bfcbf1b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with the custom database ID from config
export const db = getFirestore(app, "ai-studio-bookeasy-cd65647f-463d-4fc1-8fe0-4ed2320889f4");
