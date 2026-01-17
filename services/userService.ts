import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, BusinessProfile } from '../types';
import { User } from 'firebase/auth';

export const createUserProfile = async (user: User, profileData: Partial<BusinessProfile>) => {
    const userRef = doc(db, 'users', user.uid);

    const newProfile: UserProfile = {
        uid: user.uid,
        name: profileData.name || '',
        email: user.email || '',
        address: profileData.address || '',
        momoNumber: profileData.momoNumber || '',
        momoNetwork: profileData.momoNetwork || '',
        tin: profileData.tin || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    await setDoc(userRef, newProfile);
    return newProfile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
        ...data,
        updatedAt: Date.now(),
    }, { merge: true });
};
