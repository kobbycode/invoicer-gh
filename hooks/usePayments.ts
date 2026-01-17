import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayments, recordPayment, updatePaymentStatus, deletePayment, Payment } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';

export const usePayments = () => {
    const { userProfile } = useAuth();
    const queryClient = useQueryClient();
    const uid = userProfile?.uid;

    const { data: payments = [], isLoading, error } = useQuery({
        queryKey: ['payments', uid],
        queryFn: () => getPayments(uid!),
        enabled: !!uid,
    });

    const recordMutation = useMutation({
        mutationFn: (paymentData: Omit<Payment, 'id'>) => recordPayment(uid!, paymentData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments', uid] });
            // Also invalidate invoices as they might be related? 
            // Ideally we'd know which invoice to invalidate, but global invalidation is safer for now if tightly coupled.
            queryClient.invalidateQueries({ queryKey: ['invoices', uid] });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'Verified' | 'Pending' }) => updatePaymentStatus(uid!, id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments', uid] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deletePayment(uid!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments', uid] });
        },
    });

    return {
        payments,
        isLoading,
        error,
        recordPayment: recordMutation.mutateAsync,
        updatePaymentStatus: updateStatusMutation.mutateAsync,
        deletePayment: deleteMutation.mutateAsync,
        isRecording: recordMutation.isPending,
        isUpdating: updateStatusMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};
