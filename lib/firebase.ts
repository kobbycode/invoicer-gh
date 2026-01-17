import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Check if Firebase config is available
const hasFirebaseConfig = 
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (hasFirebaseConfig) {
    const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        auth = null;
        db = null;
    }
} else {
    console.warn(
        '⚠️ Firebase configuration is missing.\n' +
        'Please create a .env.local file with your Firebase config:\n' +
        'VITE_FIREBASE_API_KEY=your-api-key\n' +
        'VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com\n' +
        'VITE_FIREBASE_PROJECT_ID=your-project-id\n' +
        'VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com\n' +
        'VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id\n' +
        'VITE_FIREBASE_APP_ID=your-app-id\n' +
        '\nThe app will load, but authentication features will not work.'
    );
}

export { auth, db };
export default app;
