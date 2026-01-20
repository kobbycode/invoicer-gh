import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useInvoices } from '../hooks/useInvoices';
import { InvoiceStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const ClientsDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients } = useClients();
  const { invoices } = useInvoices();

  const client = clients.find(c => c.id === id);
  const clientInvoices = invoices.filter(inv => inv.client?.id === id);

  const totalBilled = clientInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const totalPaid = clientInvoices
    .filter(inv => inv.status === InvoiceStatus.PAID)
    .reduce((acc, inv) => acc + (inv.total || 0), 0);
  const outstanding = totalBilled - totalPaid;

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Client Details</h2>
          <Button onClick={() => navigate('/clients')} leftIcon={<span className="material-symbols-outlined">arrow_back</span>}>
            Back to Clients
          </Button>
        </div>
        <Card className="p-6">
          <p className="text-gray-500 font-bold">Client not found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{client.name}</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 font-bold">{client.email}</p>
        </div>
        <Button onClick={() => navigate('/clients')} leftIcon={<span className="material-symbols-outlined">arrow_back</span>}>
          Back to Clients
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-base sm:text-lg font-black">Profile</h3>
          <div className="space-y-2 text-sm font-bold">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span>{client.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location</span>
              <span>{client.location || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">MoMo</span>
              <span>{client.momoNetwork} • {client.momoNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Invoices</span>
              <span>{client.invoicesCount || clientInvoices.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created</span>
              <span>{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated</span>
              <span>{client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-base sm:text-lg font-black">Financials</h3>
          <div className="space-y-2 text-sm font-bold">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Billed</span>
              <span className="text-gray-900">GH₵ {totalBilled.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Paid</span>
              <span className="text-green-600">GH₵ {totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Outstanding</span>
              <span className="text-amber-600">GH₵ {outstanding.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-base sm:text-lg font-black">Actions</h3>
          <div className="flex gap-3">
            <Button onClick={() => navigate(`/invoices/new`)} leftIcon={<span className="material-symbols-outlined">description</span>}>
              New Invoice
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-black">Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2 text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest">Invoice #</th>
                <th className="py-2 text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest">Date</th>
                <th className="py-2 text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest">Status</th>
                <th className="py-2 text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm font-bold">
              {clientInvoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">No invoices yet</td>
                </tr>
              ) : (
                clientInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50">
                    <td className="py-3">{inv.invoiceNumber}</td>
                    <td className="py-3">{new Date(inv.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-[10px] ${
                        inv.status === InvoiceStatus.PAID ? 'bg-green-50 text-green-700' :
                        inv.status === InvoiceStatus.OVERDUE ? 'bg-red-50 text-red-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="py-3 text-right">GH₵ {inv.total.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ClientsDetail;
