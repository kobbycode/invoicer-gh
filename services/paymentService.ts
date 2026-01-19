import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    where,
    deleteDoc,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;
    date: number;
    method: string;
    reference?: string;
    clientName: string;
    status: 'Verified' | 'Pending';
}

export const getPayments = async (userId: string): Promise<Payment[]> => {
    const paymentsRef = collection(db, 'users', userId, 'payments');
    const q = query(paymentsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getPaymentsByClient = async (userId: string, clientName: string): Promise<Payment[]> => {
    const paymentsRef = collection(db, 'users', userId, 'payments');
    const q = query(paymentsRef, where('clientName', '==', clientName), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const recordPayment = async (userId: string, paymentData: Omit<Payment, 'id'>) => {
    const paymentsRef = collection(db, 'users', userId, 'payments');
    const docRef = await addDoc(paymentsRef, {
        ...paymentData,
        createdAt: Date.now()
    });
    return { id: docRef.id, ...paymentData };
};

export const updatePaymentStatus = async (userId: string, paymentId: string, status: 'Verified' | 'Pending') => {
    const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
    await updateDoc(paymentRef, {
        status,
        updatedAt: Date.now()
    });
};

export const deletePayment = async (userId: string, paymentId: string) => {
    const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
    await deleteDoc(paymentRef);
};
