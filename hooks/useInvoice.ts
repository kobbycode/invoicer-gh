import { useQuery } from '@tanstack/react-query';
import { getInvoice } from '../services/invoiceService';
import { useAuth } from '../context/AuthContext';

export const useInvoice = (id: string | undefined) => {
    const { userProfile } = useAuth();
    const uid = userProfile?.uid;

    const { data: invoice, isLoading, error } = useQuery({
        queryKey: ['invoice', uid, id],
        queryFn: () => getInvoice(uid!, id!),
        enabled: !!uid && !!id,
    });

    return {
        invoice,
        isLoading,
        error,
    };
};
