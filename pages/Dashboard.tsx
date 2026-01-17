import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInvoices } from '../services/invoiceService';
import { getClients } from '../services/clientService';
import { Invoice, Client, InvoiceStatus } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.uid) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const [invoicesData, clientsData] = await Promise.all([
        getInvoices(userProfile.uid),
        getClients(userProfile.uid)
      ]);
      setInvoices(invoicesData);
      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = invoices
      .filter(i => i.status === InvoiceStatus.PAID)
      .reduce((acc, i) => acc + (i.total || 0), 0);

    const pendingValue = invoices
      .filter(i => i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.DRAFT)
      .reduce((acc, i) => acc + (i.total || 0), 0);

    return {
      totalRevenue,
      totalInvoices: invoices.length,
      totalClients: clients.length,
      pendingValue
    };
  }, [invoices, clients]);

  const chartData = useMemo(() => {
    // Simple monthly aggregation
    const data = [
      { name: 'Jan', revenue: 0 }, { name: 'Feb', revenue: 0 }, { name: 'Mar', revenue: 0 },
      { name: 'Apr', revenue: 0 }, { name: 'May', revenue: 0 }, { name: 'Jun', revenue: 0 },
      { name: 'Jul', revenue: 0 }, { name: 'Aug', revenue: 0 }, { name: 'Sep', revenue: 0 },
      { name: 'Oct', revenue: 0 }, { name: 'Nov', revenue: 0 }, { name: 'Dec', revenue: 0 }
    ];

    invoices.forEach(inv => {
      if (inv.status === InvoiceStatus.PAID && inv.date) {
        const date = new Date(inv.date);
        if (!isNaN(date.getTime())) {
          const month = date.getMonth();
          data[month].revenue += (inv.total || 0);
        }
      }
    });
    return data;
  }, [invoices]);

  const recentInvoices = invoices.slice(0, 5); // Get first 5

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Overview</h2>
          <p className="text-gray-500 text-sm sm:text-base mt-1">Welcome back, {userProfile?.name?.split(' ')[0] || 'User'}</p>
        </div>
        <button onClick={() => navigate('/invoices/new')} className="sm:hidden bg-primary text-white h-10 px-4 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-lg">add</span> New
        </button>
        <div className="hidden sm:flex gap-3 text-sm">
          <button onClick={() => navigate('/invoices/new')} className="bg-primary text-white h-12 px-6 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-transform">
            <span className="material-symbols-outlined">add</span> New Invoice
          </button>
        </div>
      </header>

      {/* Stats Grid - Premium 2-Column Mobile Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Revenue', value: `${userProfile?.preferences?.defaultCurrency === 'GHS' || !userProfile?.preferences?.defaultCurrency ? 'GH₵' : userProfile.preferences.defaultCurrency} ${stats.totalRevenue.toLocaleString()}`, change: '+0%', icon: 'payments', color: 'text-green-600' },
          { label: 'Total Invoices', value: stats.totalInvoices.toString(), change: '+0%', icon: 'description', color: 'text-blue-600' },
          { label: 'Pending Invoices', value: `${userProfile?.preferences?.defaultCurrency === 'GHS' || !userProfile?.preferences?.defaultCurrency ? 'GH₵' : userProfile.preferences.defaultCurrency} ${stats.pendingValue.toLocaleString()}`, change: '+0%', icon: 'pending', color: 'text-amber-600' },
          { label: 'Total Clients', value: stats.totalClients.toString(), change: '+0%', icon: 'group', color: 'text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-primary/20 group">
            <div className="flex justify-between items-start mb-4">
              <div className={`size-8 sm:size-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors group-hover:bg-primary/5 ${stat.color}`}>
                <span className="material-symbols-outlined text-lg sm:text-2xl">{stat.icon}</span>
              </div>
              <span className="flex items-center text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded-full">
                {stat.change}
                <span className="material-symbols-outlined text-xs ml-0.5">trending_up</span>
              </span>
            </div>
            <p className="text-gray-400 text-[9px] sm:text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-lg sm:text-2xl font-black mt-0.5 sm:mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
            <h3 className="font-black text-base sm:text-lg">Revenue Trends</h3>
            <select className="bg-gray-50 border-none text-[10px] sm:text-xs font-bold rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(value) => `${userProfile?.preferences?.defaultCurrency === 'GHS' || !userProfile?.preferences?.defaultCurrency ? '₵' : userProfile.preferences.defaultCurrency}${value}`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg">Recent Invoices</h3>
            <button onClick={() => navigate('/invoices')} className="text-primary text-xs font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent invoices.</p>
            ) : (
              recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors">
                  <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs group-hover:bg-white group-hover:shadow-sm transition-all">
                    {inv.client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{inv.client.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold">{inv.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm">{inv.currency === 'GHS' ? 'GH₵' : inv.currency} {(inv.total || 0).toLocaleString()}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${inv.status === InvoiceStatus.PAID ? 'text-green-500' : 'text-amber-500'
                      }`}>{inv.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/create-invoice')} className="w-full mt-6 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-xs font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span> Create New
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
