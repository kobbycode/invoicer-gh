import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useNotification } from '../context/NotificationContext';
import { getClients, addClient, deleteClient, updateClient } from '../services/clientService';
import { Client } from '../types';

const Clients: React.FC = () => {
  const { userProfile } = useAuth();
  const { showAlert } = useAlert();
  const { showNotification } = useNotification();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    momoNumber: '',
    momoNetwork: 'MTN MOMO',
    location: ''
  });
  const [adding, setAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    if (userProfile?.uid) {
      fetchClients();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const fetchClients = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const data = await getClients(userProfile.uid);
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;
    try {
      setAdding(true);
      if (editingClient) {
        // Update existing
        await updateClient(userProfile.uid, editingClient.id, newClient);
        setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...newClient } : c));
        showNotification('Client details updated successfully!', 'success');
      } else {
        // Add new
        const client = await addClient(userProfile.uid, newClient);
        setClients([client, ...clients]);
        showNotification('New client added successfully!', 'success');
      }
      setShowModal(false);
      setNewClient({ name: '', email: '', momoNumber: '', momoNetwork: 'MTN MOMO', location: '' });
      setEditingClient(null);
    } catch (error) {
      console.error("Error saving client:", error);
      showAlert('Error', 'Failed to save client. Please try again.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const openAddModal = () => {
    setEditingClient(null);
    setNewClient({ name: '', email: '', momoNumber: '', momoNetwork: 'MTN MOMO', location: '' });
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setNewClient({
      name: client.name,
      email: client.email,
      momoNumber: client.momoNumber || '',
      momoNetwork: client.momoNetwork || 'MTN MOMO',
      location: client.location || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile?.uid || !window.confirm("Are you sure you want to delete this client?")) return;
    try {
      await deleteClient(userProfile.uid, id);
      setClients(prev => prev.filter(c => c.id !== id));
      showNotification('Client deleted successfully', 'success');
    } catch (error) {
      console.error("Error deleting client:", error);
      showNotification('Failed to delete client', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Clients</h2>
          <p className="text-gray-500 text-sm sm:base mt-1">Manage your customer relationships</p>
        </div>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto bg-primary text-white h-12 px-6 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add</span> Create New Client
        </button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Clients</p>
          <p className="text-2xl font-black">{clients.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Now</p>
          <p className="text-2xl font-black text-green-600">{clients.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-10 text-center text-gray-500 font-bold">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="col-span-full p-10 text-center text-gray-500">No clients found. Add your first client!</div>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group relative">
              <button
                onClick={(e) => handleDelete(client.id, e)}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className={`size-12 sm:size-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-blue-200`}>
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg truncate">{client.name}</h3>
                  <p className="text-gray-400 text-xs font-bold truncate">{client.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-500 font-medium">Invoices</span>
                  <span className="font-black bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded text-[10px]">{client.invoicesCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-500 font-medium">Location</span>
                  <span className="font-bold text-right truncate ml-4">{client.location || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-gray-700">
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2 min-w-0">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">MOMO</p>
                  <p className="text-[10px] sm:text-xs font-bold truncate">{client.momoNetwork} - {client.momoNumber || 'N/A'}</p>
                </div>
                <button onClick={() => openEditModal(client)} className="size-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition-colors active:scale-95">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button onClick={(e) => handleDelete(client.id, e)} className="size-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors active:scale-95 lg:hidden">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Full Name</label>
                <input required value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} className="w-full bg-gray-50 h-12 rounded-xl px-4 font-bold border-none focus:ring-2 focus:ring-primary" placeholder="e.g. Ama Mensah" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Email Address</label>
                <input required type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="w-full bg-gray-50 h-12 rounded-xl px-4 font-bold border-none focus:ring-2 focus:ring-primary" placeholder="ama@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Network</label>
                  <select value={newClient.momoNetwork} onChange={e => setNewClient({ ...newClient, momoNetwork: e.target.value })} className="w-full bg-gray-50 h-12 rounded-xl px-4 font-bold border-none focus:ring-2 focus:ring-primary">
                    <option>MTN MOMO</option>
                    <option>Telecel Cash</option>
                    <option>Airtel Tigo Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">MoMo Number</label>
                  <input required value={newClient.momoNumber} onChange={e => setNewClient({ ...newClient, momoNumber: e.target.value })} className="w-full bg-gray-50 h-12 rounded-xl px-4 font-bold border-none focus:ring-2 focus:ring-primary" placeholder="024 XXX XXXX" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Location</label>
                <input value={newClient.location} onChange={e => setNewClient({ ...newClient, location: e.target.value })} className="w-full bg-gray-50 h-12 rounded-xl px-4 font-bold border-none focus:ring-2 focus:ring-primary" placeholder="e.g. Accra, East Legon" />
              </div>
              <button disabled={adding} type="submit" className="w-full bg-primary text-white h-14 rounded-xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4">
                {adding ? 'Saving...' : (editingClient ? 'Update Client' : 'Save Client')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
