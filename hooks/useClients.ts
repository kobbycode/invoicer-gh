import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, addClient, updateClient, deleteClient } from '../services/clientService';
import { useAuth } from '../context/AuthContext';
import { Client } from '../types';

export const useClients = () => {
    const { userProfile } = useAuth();
    const queryClient = useQueryClient();
    const uid = userProfile?.uid;

    const { data: clients = [], isLoading, error } = useQuery({
        queryKey: ['clients', uid],
        queryFn: () => getClients(uid!),
        enabled: !!uid,
    });

    const addMutation = useMutation({
        mutationFn: (client: Omit<Client, 'id' | 'createdAt'>) => addClient(uid!, client),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients', uid] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) => updateClient(uid!, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients', uid] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteClient(uid!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients', uid] });
        },
    });

    return {
        clients,
        isLoading,
        error,
        addClient: addMutation.mutateAsync,
        updateClient: updateMutation.mutateAsync,
        deleteClient: deleteMutation.mutateAsync,
        isAdding: addMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};
