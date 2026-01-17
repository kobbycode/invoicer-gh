import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile } from '../services/userService';
import { UserProfile } from '../types';

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    profileError: string | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    userProfile: null,
    profileError: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if Firebase auth is available
        if (!auth) {
            setLoading(false);
            return;
        }

        let unsubscribeProfile: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setProfileError(null);

            // Clean up previous profile listener if any
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            if (user) {
                try {
                    // Start listening to profile changes
                    const { doc, onSnapshot } = await import('firebase/firestore');
                    const { db } = await import('../lib/firebase');
                    const userRef = doc(db, 'users', user.uid);

                    unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
                        if (docSnap.exists()) {
                            setUserProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
                        } else {
                            setUserProfile(null);
                        }
                        setLoading(false);
                    }, (error) => {
                        console.error("Profile snapshot error:", error);
                        setProfileError(error.message);
                        setLoading(false);
                    });
                } catch (error: any) {
                    console.error("Failed to setup profile listener", error);
                    setProfileError(error.message || "Failed to load profile");
                    setLoading(false);
                }
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const value = {
        currentUser,
        userProfile,
        profileError,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
