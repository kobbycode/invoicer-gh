import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Invoice, InvoiceStatus } from '../types';

export const getInvoices = async (userId: string): Promise<Invoice[]> => {
    const invoicesRef = collection(db, 'users', userId, 'invoices');
    const q = query(invoicesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
};

export const getInvoice = async (userId: string, invoiceId: string): Promise<Invoice | null> => {
    const invoiceRef = doc(db, 'users', userId, 'invoices', invoiceId);
    const docSnap = await getDoc(invoiceRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Invoice;
    }
    return null;
};

export const createInvoice = async (userId: string, invoiceData: Omit<Invoice, 'id'>) => {
    const invoicesRef = collection(db, 'users', userId, 'invoices');
    const newInvoice = {
        ...invoiceData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    const docRef = await addDoc(invoicesRef, newInvoice);
    return { id: docRef.id, ...newInvoice } as Invoice;
};

export const updateInvoiceStatus = async (userId: string, invoiceId: string, status: InvoiceStatus) => {
    const invoiceRef = doc(db, 'users', userId, 'invoices', invoiceId);
    await updateDoc(invoiceRef, {
        status,
        updatedAt: Date.now()
    });
};

export const updateInvoice = async (userId: string, invoiceId: string, invoiceData: Partial<Invoice>) => {
    const invoiceRef = doc(db, 'users', userId, 'invoices', invoiceId);
    await updateDoc(invoiceRef, {
        ...invoiceData,
        updatedAt: Date.now(),
    });
};

export const deleteInvoice = async (userId: string, invoiceId: string) => {
    const invoiceRef = doc(db, 'users', userId, 'invoices', invoiceId);
    await deleteDoc(invoiceRef);
};
