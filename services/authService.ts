import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    UserCredential,
    AuthError
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserProfile } from './userService';
import { BusinessProfile } from '../types';

export const registerUser = async (
    email: string,
    password: string,
    businessData: Partial<BusinessProfile>
): Promise<UserCredential> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create the user profile in Firestore
        await createUserProfile(userCredential.user, {
            name: businessData.name || email.split('@')[0],
            email: email,
            ...businessData
        });

        return userCredential;
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
};

export const loginUser = async (email: string, password: string): Promise<UserCredential> => {
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const logoutUser = async (): Promise<void> => {
    await signOut(auth);
};