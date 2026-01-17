import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Client } from '../types';

export const getClients = async (userId: string): Promise<Client[]> => {
    const clientsRef = collection(db, 'users', userId, 'clients');
    const q = query(clientsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const addClient = async (userId: string, clientData: Omit<Client, 'id' | 'invoicesCount' | 'createdAt'>): Promise<Client> => {
    const clientsRef = collection(db, 'users', userId, 'clients');
    const newClientData = {
        ...clientData,
        invoicesCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'Active' // Default status
    };
    const docRef = await addDoc(clientsRef, newClientData);
    return { id: docRef.id, ...newClientData } as Client;
};

export const updateClient = async (userId: string, clientId: string, data: Partial<Client>) => {
    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    await updateDoc(clientRef, {
        ...data,
        updatedAt: Date.now()
    });
};

export const deleteClient = async (userId: string, clientId: string) => {
    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    await deleteDoc(clientRef);
};
