// firebase.ts

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyASwphhE3atylju8cPGxjrFrdd_uZyR0n8',
  authDomain: 'gleegather-lms.firebaseapp.com',
  projectId: 'gleegather-lms',
  storageBucket: 'gleegather-lms.appspot.com',
  messagingSenderId: '714665461834', 
  appId: '1:714665461834:android:4aa42b47119e7b1d6cfeb3',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Retrieve Firebase Messaging
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
