import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useNotification } from '../context/NotificationContext';
import { getClients } from '../services/clientService';
import { Client, InvoiceStatus } from '../types';
import { useClients } from '../hooks/useClients';
import { useInvoices } from '../hooks/useInvoices';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const Clients: React.FC = () => {
  const { userProfile } = useAuth();
  const { showAlert } = useAlert();
  const { showNotification } = useNotification();
  const { clients, isLoading: loading, addClient, updateClient, deleteClient, isAdding } = useClients();
  const { invoices } = useInvoices();
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    momoNumber: '',
    momoNetwork: 'MTN MOMO',
    location: ''
  });
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Fetching is handled by useClients

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;
    try {
      if (editingClient) {
        // Update existing
        await updateClient({ id: editingClient.id, data: newClient });
        showNotification('Client details updated successfully!', 'success');
      } else {
        // Add new
        await addClient(newClient);
        showNotification('New client added successfully!', 'success');
      }
      setShowModal(false);
      setNewClient({ name: '', email: '', momoNumber: '', momoNetwork: 'MTN MOMO', location: '' });
      setEditingClient(null);
    } catch (error) {
      console.error("Error saving client:", error);
      showAlert('Error', 'Failed to save client. Please try again.', 'error');
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
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      await deleteClient(id);
      showNotification('Client deleted successfully', 'success');
    } catch (error) {
      console.error("Error deleting client:", error);
      showNotification('Failed to delete client', 'error');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.momoNumber && client.momoNumber.includes(searchQuery))
  );

  return (
    <div className="space-y-8">
      {/* ... header ... */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Clients</h2>
          <p className="text-gray-500 text-sm sm:base mt-1">Manage your customer relationships</p>
        </div>
        <Button
          onClick={openAddModal}
          leftIcon={<span className="material-symbols-outlined">add</span>}
        >
          Create New Client
        </Button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, color: 'text-gray-900 dark:text-gray-100' },
          { label: 'Active Now', value: clients.length, color: 'text-green-600' } // Placeholder logic
        ].map((stat, i) => (
          <Card key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
        <input
          type="text"
          placeholder="Search clients by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border-none bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400 text-sm font-bold"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Grid Skeleton
          [...Array(6)].map((_, i) => (
            <Card key={i} className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-4 w-8 rounded" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-50 flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="size-10 rounded-xl" />
              </div>
            </Card>
          ))
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full p-10 text-center text-gray-500">
            {clients.length === 0 ? "No clients found. Add your first client!" : "No clients match your search."}
          </div>
        ) : (
          <AnimatePresence>
            {filteredClients.map((client, index) => (
              <Card
                key={client.id}
                hoverEffect
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <button
                  onClick={(e) => handleDelete(client.id, e)}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Delete client"
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
                  {(() => {
                    const clientInvoices = invoices.filter(inv => inv.client?.id === client.id);
                    const totalBilled = clientInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
                    const totalPaid = clientInvoices
                      .filter(inv => inv.status === InvoiceStatus.PAID)
                      .reduce((acc, inv) => acc + (inv.total || 0), 0);
                    const outstanding = totalBilled - totalPaid;
                    return (
                      <>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-500 font-medium">Total Billed</span>
                          <span className="font-bold text-right truncate ml-4">GH₵ {totalBilled.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-500 font-medium">Total Paid</span>
                          <span className="font-bold text-right truncate ml-4 text-green-600">GH₵ {totalPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-500 font-medium">Outstanding</span>
                          <span className="font-bold text-right truncate ml-4 text-amber-600">GH₵ {outstanding.toLocaleString()}</span>
                        </div>
                      </>
                    );
                  })()}
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
              </Card>
            ))}
          </AnimatePresence>
        )}
      </div>

      {
        showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSaveClient} className="space-y-4">
                <Input
                  label="Full Name"
                  required
                  value={newClient.name}
                  onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="e.g. Ama Mensah"
                />
                <Input
                  label="Email Address"
                  required
                  type="email"
                  value={newClient.email}
                  onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="ama@example.com"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5 block">Network</span>
                    <select
                      value={newClient.momoNetwork}
                      onChange={e => setNewClient({ ...newClient, momoNetwork: e.target.value })}
                      className="w-full h-10 sm:h-11 rounded-xl border-[#dce0e4] bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold"
                    >
                      <option>MTN MOMO</option>
                      <option>Telecel Cash</option>
                      <option>Airtel Tigo Money</option>
                    </select>
                  </div>
                  <Input
                    label="MoMo Number"
                    required
                    value={newClient.momoNumber}
                    onChange={e => setNewClient({ ...newClient, momoNumber: e.target.value })}
                    placeholder="024 XXX XXXX"
                  />
                </div>
                <Input
                  label="Location"
                  value={newClient.location}
                  onChange={e => setNewClient({ ...newClient, location: e.target.value })}
                  placeholder="e.g. Accra, East Legon"
                />
                <Button
                  type="submit"
                  disabled={isAdding}
                  isLoading={isAdding}
                  className="w-full mt-2"
                  size="lg"
                >
                  {editingClient ? 'Update Client' : 'Save Client'}
                </Button>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Clients;
