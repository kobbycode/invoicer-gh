import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, deleteInvoice, updateInvoiceStatus, createInvoice, updateInvoice } from '../services/invoiceService';
import { useAuth } from '../context/AuthContext';
import { Invoice, InvoiceStatus } from '../types';

export const useInvoices = () => {
    const { userProfile } = useAuth();
    const queryClient = useQueryClient();
    const uid = userProfile?.uid;

    const { data: invoices = [], isLoading, error } = useQuery({
        queryKey: ['invoices', uid],
        queryFn: () => getInvoices(uid!),
        enabled: !!uid,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteInvoice(uid!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', uid] });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) => updateInvoiceStatus(uid!, id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', uid] });
        },
    });

    const createMutation = useMutation({
        mutationFn: (newInvoice: Omit<Invoice, 'id'>) => createInvoice(uid!, newInvoice),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', uid] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) => updateInvoice(uid!, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', uid] });
        },
    });

    return {
        invoices,
        isLoading,
        error,
        deleteInvoice: deleteMutation.mutateAsync,
        updateInvoiceStatus: updateStatusMutation.mutateAsync,
        createInvoice: createMutation.mutateAsync,
        updateInvoice: updateMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isUpdatingStatus: updateStatusMutation.isPending,
    };
};
