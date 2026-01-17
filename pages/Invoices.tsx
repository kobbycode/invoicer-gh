
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useNotification } from '../context/NotificationContext';
import { getInvoices, deleteInvoice, updateInvoiceStatus } from '../services/invoiceService';
import { recordPayment } from '../services/paymentService';
import { exportToCSV } from '../utils/exportUtils';
import { Invoice, InvoiceStatus } from '../types';

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, profileError } = useAuth();
  const { showAlert } = useAlert();
  const { showNotification } = useNotification();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Track specific loading action

  useEffect(() => {
    if (userProfile?.uid) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const fetchInvoices = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const data = await getInvoices(userProfile.uid);
      setInvoices(data);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      if (error.code === 'permission-denied') {
        showAlert('Permission Denied', 'You do not have permission to access these invoices. Please check your Firestore rules.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userProfile?.uid || !window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await deleteInvoice(userProfile.uid, id);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      showNotification('Invoice deleted successfully', 'success');
    } catch (error) {
      console.error("Error deleting invoice:", error);
      showNotification('Failed to delete invoice', 'error');
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (!userProfile?.uid) return;
    try {
      setActionLoading(invoice.id);
      // 1. Update invoice status
      await updateInvoiceStatus(userProfile.uid, invoice.id, InvoiceStatus.PAID);

      // 2. Record payment
      await recordPayment(userProfile.uid, {
        invoiceId: invoice.invoiceNumber, // Use invoice number for reference
        amount: invoice.total || 0,
        date: Date.now(),
        method: 'Cash/Other', // Default method for quick action
        clientName: invoice.client.name,
        status: 'Verified'
      });

      setInvoices(prev => prev.map(inv =>
        inv.id === invoice.id ? { ...inv, status: InvoiceStatus.PAID } : inv
      ));
      showNotification(`Invoice #${invoice.invoiceNumber} marked as paid`, 'success');
    } catch (error) {
      console.error("Error marking as paid:", error);
      showNotification('Failed to mark invoice as paid', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    const dataToExport = invoices.map(inv => ({
      InvoiceNumber: inv.invoiceNumber,
      Date: inv.date,
      DueDate: inv.dueDate,
      ClientName: inv.client.name,
      ClientEmail: inv.client.email,
      Total: inv.total,
      Status: inv.status
    }));
    exportToCSV(dataToExport, `invoices_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const stats = useMemo(() => {
    const totalOutstanding = invoices
      .filter(i => i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.DRAFT)
      .reduce((acc, i) => acc + (i.total || 0), 0);

    const draftCount = invoices.filter(i => i.status === InvoiceStatus.DRAFT).length;
    const draftValue = invoices
      .filter(i => i.status === InvoiceStatus.DRAFT)
      .reduce((acc, i) => acc + (i.total || 0), 0);

    // Simulating "Recent MoMo Payments" as Paid invoices in last 7 days for now
    // A real implementation would query the Payments collection
    const recentPaid = invoices
      .filter(i => i.status === InvoiceStatus.PAID)
      .reduce((acc, i) => acc + (i.total || 0), 0);

    return { totalOutstanding, draftCount, draftValue, recentPaid };
  }, [invoices]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesFilter = filter === 'All'
      ? true
      : filter === 'Paid'
        ? inv.status === InvoiceStatus.PAID
        : inv.status !== InvoiceStatus.PAID;

    const matchesSearch = search === ''
      ? true
      : inv.client.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Invoices</h2>
          <p className="text-gray-500 text-sm sm:text-base mt-1">Manage and track your business billings</p>
        </div>
        <button onClick={handleExport} className="w-full sm:w-auto flex items-center justify-center rounded-xl h-11 sm:h-12 px-4 sm:px-6 bg-white border border-gray-200 text-[#121417] text-xs sm:text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
          <span className="material-symbols-outlined mr-2 text-base sm:text-lg">file_download</span> Export CSV
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Outstanding', val: `GH₵ ${stats.totalOutstanding.toLocaleString()}`, sub: 'Unpaid Invoices', icon: 'pending_actions', iconCol: 'text-red-500' },
          { label: 'Total Received', val: `GH₵ ${stats.recentPaid.toLocaleString()}`, sub: 'All time', icon: 'account_balance_wallet', iconCol: 'text-green-600' },
          { label: 'Draft Invoices', val: `GH₵ ${stats.draftValue.toLocaleString()}`, sub: `${stats.draftCount} invoices pending`, icon: 'edit_note', iconCol: 'text-gray-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <p className="text-[#667385] dark:text-gray-400 text-[10px] sm:text-sm font-bold uppercase tracking-widest">{stat.label}</p>
              <span className={`material-symbols-outlined text-lg sm:text-xl ${stat.iconCol}`}>{stat.icon}</span>
            </div>
            <p className="text-xl sm:text-3xl font-black">{stat.val}</p>
            <p className={`text-[9px] sm:text-[10px] font-bold mt-1 uppercase tracking-widest text-gray-400`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row justify-between gap-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex gap-2 p-1 bg-gray-50 dark:bg-gray-900 rounded-xl w-fit">
            <button onClick={() => setFilter('All')} className={`px-5 py-2 rounded-lg text-sm font-bold ${filter === 'All' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500'}`}>All</button>
            <button onClick={() => setFilter('Paid')} className={`px-5 py-2 rounded-lg text-sm font-bold ${filter === 'Paid' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500'}`}>Paid</button>
            <button onClick={() => setFilter('Pending')} className={`px-5 py-2 rounded-lg text-sm font-bold ${filter === 'Pending' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500'}`}>Pending</button>
          </div>
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl pl-10 text-sm focus:ring-2 focus:ring-primary"
              placeholder="Search by invoice # or client..."
            />
          </div>
        </div>
        <div className="hidden lg:block overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-500 font-bold">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No invoices found. Create your first invoice!</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                    <td className="px-6 py-5 font-black text-primary text-sm">{inv.invoiceNumber}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]`}>
                          {inv.client.name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold">{inv.client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-black">{inv.currency === 'GHS' ? 'GH₵' : inv.currency} {(inv.total || 0).toLocaleString()}</td>
                    <td className="px-6 py-5 text-sm text-gray-500">{inv.dueDate}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${inv.status === InvoiceStatus.PAID ? 'bg-green-50 text-green-600' :
                        inv.status === InvoiceStatus.OVERDUE ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button
                          onClick={() => {
                            const message = `Hello ${inv.client.name}, here is your invoice #${inv.invoiceNumber} for ${inv.currency === 'GHS' ? 'GH₵' : inv.currency} ${inv.total.toLocaleString()}.`;
                            const phone = inv.client.momoNumber.replace(/\s+/g, '').replace('+', '');
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">send</span>
                        </button>
                        {inv.status !== InvoiceStatus.PAID && (
                          <button
                            onClick={() => handleMarkAsPaid(inv)}
                            disabled={actionLoading === inv.id}
                            className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1.5 rounded-lg hover:bg-green-100"
                          >
                            {actionLoading === inv.id ? '...' : 'Mark Paid'}
                          </button>
                        )}
                        <button onClick={() => handleDelete(inv.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile View: Cards */}
        <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {loading ? (
            <div className="p-10 text-center text-gray-500 font-bold">Loading...</div>
          ) : filteredInvoices.map((inv) => (
            <div key={inv.id} className="p-4 flex flex-col gap-4 active:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start text-sm">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                    {inv.client.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 dark:text-gray-100 leading-none mb-1">{inv.client.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{inv.invoiceNumber}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${inv.status === InvoiceStatus.PAID ? 'bg-green-50 text-green-600' :
                  inv.status === InvoiceStatus.OVERDUE ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                  {inv.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Amount</p>
                  <p className="text-lg font-black mt-1 text-primary">{inv.currency === 'GHS' ? 'GH₵' : inv.currency} {inv.total.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Due Date</p>
                  <p className="text-xs font-bold mt-1">{inv.dueDate}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => navigate(`/invoices/${inv.id}`)} className="flex-1 bg-gray-50 h-10 rounded-xl flex items-center justify-center text-gray-600 active:bg-gray-100">
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </button>
                <button
                  onClick={() => {
                    const message = `Hello ${inv.client.name}, here is your invoice #${inv.invoiceNumber} for ${inv.currency === 'GHS' ? 'GH₵' : inv.currency} ${inv.total.toLocaleString()}.`;
                    const phone = inv.client.momoNumber.replace(/\s+/g, '').replace('+', '');
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="flex-1 bg-green-50 h-10 rounded-xl flex items-center justify-center text-green-600 active:bg-green-100"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
                {inv.status !== InvoiceStatus.PAID && (
                  <button
                    onClick={() => handleMarkAsPaid(inv)}
                    disabled={actionLoading === inv.id}
                    className="flex-1 bg-primary/10 h-10 rounded-xl flex items-center justify-center text-primary font-bold text-[10px] uppercase active:bg-primary/20"
                  >
                    {actionLoading === inv.id ? '...' : 'Paid'}
                  </button>
                )}
                <button onClick={() => handleDelete(inv.id)} className="flex-1 bg-red-50 h-10 rounded-xl flex items-center justify-center text-red-600 active:bg-red-100">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Invoices;
