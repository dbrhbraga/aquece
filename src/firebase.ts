import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyACoyCZVdG8OwEa8C6ShV5TJhwQQYCDlUY",
  authDomain: "gen-lang-client-0968085167.firebaseapp.com",
  projectId: "gen-lang-client-0968085167",
  storageBucket: "gen-lang-client-0968085167.firebasestorage.app",
  messagingSenderId: "899322823007",
  appId: "1:899322823007:web:189bbb3288870d41fe36ea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
