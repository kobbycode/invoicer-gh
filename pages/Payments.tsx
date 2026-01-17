import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useNotification } from '../context/NotificationContext';
import { getPayments, Payment, deletePayment, updatePaymentStatus } from '../services/paymentService'; // Import actions
import { exportToCSV } from '../utils/exportUtils';

const Payments: React.FC = () => {
  const { userProfile } = useAuth();
  const { showAlert } = useAlert();
  const { showNotification } = useNotification();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [methodFilter, setMethodFilter] = useState('All');

  useEffect(() => {
    if (userProfile?.uid) {
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const fetchPayments = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const data = await getPayments(userProfile.uid);
      setPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userProfile?.uid || !window.confirm("Are you sure you want to delete this payment record?")) return;
    try {
      await deletePayment(userProfile.uid, id);
      setPayments(prev => prev.filter(p => p.id !== id));
      showNotification('Payment record deleted', 'success');
    } catch (error) {
      console.error("Error deleting payment:", error);
      showNotification('Failed to delete payment record', 'error');
    }
  };

  const handleMarkAsVerified = async (paymentId: string) => {
    if (!userProfile?.uid) return;
    try {
      setActionLoading(paymentId);
      await updatePaymentStatus(userProfile.uid, paymentId, 'Verified');
      setPayments(prev => prev.map(p =>
        p.id === paymentId ? { ...p, status: 'Verified' } : p
      ));
      showNotification('Payment verified successfully', 'success');
    } catch (error) {
      console.error("Error verifying payment:", error);
      showNotification('Failed to verify payment', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPayments = useMemo(() => {
    if (methodFilter === 'All') return payments;
    return payments.filter(p => p.method.toLowerCase().includes(methodFilter.toLowerCase()));
  }, [payments, methodFilter]);

  const handleExport = () => {
    const dataToExport = filteredPayments.map(p => ({
      Date: new Date(p.date).toLocaleDateString(),
      Reference: p.reference,
      Client: p.clientName,
      InvoiceId: p.invoiceId,
      Amount: p.amount,
      Method: p.method,
      Status: p.status
    }));
    exportToCSV(dataToExport, `payments_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const stats = useMemo(() => {
    const totalReceived = payments
      .filter(p => p.status === 'Verified')
      .reduce((acc, p) => acc + p.amount, 0);

    const pendingCount = payments.filter(p => p.status === 'Pending').length;
    const pendingValue = payments
      .filter(p => p.status === 'Pending')
      .reduce((acc, p) => acc + p.amount, 0);

    return { totalReceived, pendingCount, pendingValue };
  }, [payments]);

  // Helper to get color based on method
  const getMethodColor = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('mtn')) return 'yellow';
    if (m.includes('telecel') || m.includes('vodafone')) return 'red';
    if (m.includes('bank')) return 'blue';
    return 'gray';
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Payments Overview</h2>
          <p className="text-gray-500 text-sm sm:base mt-1">Track every pesewa that enters your business.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => fetchPayments()} className="flex-1 sm:flex-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 h-10 px-4 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm" title="Refresh">
            <span className="material-symbols-outlined text-lg mr-2">refresh</span> Sync
          </button>
          <button onClick={handleExport} className="flex-1 sm:flex-none bg-primary text-white h-10 px-4 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span> Export
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-0">
        {[
          { label: 'Total Received', value: `${userProfile?.preferences?.defaultCurrency === 'GHS' || !userProfile?.preferences?.defaultCurrency ? 'GH₵' : userProfile.preferences.defaultCurrency} ${stats.totalReceived.toLocaleString()}`, change: '+0%', detail: 'MTN + TELECEL + AT' },
          { label: 'Pending Verification', value: `${userProfile?.preferences?.defaultCurrency === 'GHS' || !userProfile?.preferences?.defaultCurrency ? 'GH₵' : userProfile.preferences.defaultCurrency} ${stats.pendingValue.toLocaleString()}`, icon: 'info', iconColor: 'text-amber-500', detail: `${stats.pendingCount} WAITING` },
          { label: 'Active MoMo', value: '3', detail: 'MTN, TELECEL...', sub: 'Online', subCol: 'text-green-600', colSpan: '' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.colSpan || ''} bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-2">
              <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{stat.label}</p>
              <div className="flex gap-1">
                {stat.change && <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-black">{stat.change}</span>}
                {stat.icon && <span className={`material-symbols-outlined text-xs sm:text-sm ${stat.iconColor}`}>{stat.icon}</span>}
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <h3 className="text-lg sm:text-3xl font-black">{stat.value}</h3>
              {stat.sub && <span className={`text-[8px] sm:text-[10px] font-black ${stat.subCol} hidden sm:inline`}>{stat.sub}</span>}
            </div>
            <p className="text-[7px] sm:text-[9px] font-black text-gray-400 mt-2 uppercase tracking-[0.15em] line-clamp-1">{stat.detail}</p>
          </div>
        ))}
      </div>

      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-black">Recent Transactions</h3>
          <div className="flex gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-2 border-none ring-0 focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Methods</option>
              <option value="MTN">MTN MoMo</option>
              <option value="Telecel">Telecel</option>
              <option value="Cash">Cash</option>
              <option value="Bank">Bank Transfer</option>
            </select>
          </div>
        </div>
        <div className="hidden lg:block overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-500 font-bold">Loading transactions...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No payment history found.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4">Date & Reference</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredPayments.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black">{new Date(t.date).toLocaleDateString()}</p>
                      <p className="text-[10px] font-mono text-gray-400 font-bold">{t.reference || '---'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold">{t.clientName}</p>
                      <p className="text-[10px] text-gray-400 font-bold">Inv #{t.invoiceId}</p>
                    </td>
                    <td className="px-6 py-5 font-black text-sm">GH₵ {t.amount.toLocaleString()}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`size-6 rounded bg-${getMethodColor(t.method)}-50 dark:bg-${getMethodColor(t.method)}-900/10 flex items-center justify-center`}>
                          <span className={`material-symbols-outlined text-xs text-${getMethodColor(t.method)}-600 font-black`}>smartphone</span>
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{t.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'Verified' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.status === 'Pending' && (
                          <button
                            onClick={() => handleMarkAsVerified(t.id)}
                            disabled={actionLoading === t.id}
                            className="bg-primary text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg hover:opacity-90 transition-all"
                          >
                            {actionLoading === t.id ? '...' : 'Verify'}
                          </button>
                        )}
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-colors" title="Delete record"><span className="material-symbols-outlined text-lg">delete</span></button>
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
            <div className="p-10 text-center text-gray-500 font-bold text-xs">Loading...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-xs font-bold">No history.</div>
          ) : filteredPayments.map((t) => (
            <div key={t.id} className="p-4 flex flex-col gap-4 active:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl bg-${getMethodColor(t.method)}-50 flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-sm text-${getMethodColor(t.method)}-600`}>payments</span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-900 dark:text-gray-100 leading-none">{t.clientName}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Ref: {t.reference || 'N/A'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${t.status === 'Verified' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {t.status}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Amount</p>
                  <p className="text-base font-black text-primary">GH₵ {t.amount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Date</p>
                  <p className="text-[10px] font-bold">{new Date(t.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                {t.status === 'Pending' && (
                  <button
                    onClick={() => handleMarkAsVerified(t.id)}
                    disabled={actionLoading === t.id}
                    className="flex-1 bg-primary text-white h-10 rounded-xl font-black text-[10px] uppercase shadow-md shadow-primary/20 active:scale-95 transition-transform"
                  >
                    {actionLoading === t.id ? '...' : 'Verify Payment'}
                  </button>
                )}
                <button onClick={() => handleDelete(t.id)} className="flex-1 bg-red-50 text-red-600 h-10 rounded-xl font-black text-[10px] uppercase active:bg-red-100 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-6 lg:p-8 flex flex-col sm:flex-row gap-6">
        <div className="size-14 sm:size-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm shrink-0 mx-auto sm:mx-0">
          <span className="material-symbols-outlined text-primary text-3xl">lightbulb</span>
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-lg font-black text-primary mb-2">Pro Tip: Automatic MoMo Reconciliation</h4>
          <p className="text-sm text-[#667385] dark:text-gray-400 leading-relaxed max-w-2xl">
            When clients pay via your unique Payment Link, KVoice automatically verifies the MoMo reference number with MTN and Telecel APIs. No manual checking required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payments;
