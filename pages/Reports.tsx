
import React, { useMemo } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { usePayments } from '../hooks/usePayments';
import { useClients } from '../hooks/useClients';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { InvoiceStatus } from '../types';

const Reports: React.FC = () => {
    const { invoices, isLoading: invoicesLoading } = useInvoices();
    const { payments, isLoading: paymentsLoading } = usePayments();
    const { clients, isLoading: clientsLoading } = useClients();

    const loading = invoicesLoading || paymentsLoading || clientsLoading;

    const stats = useMemo(() => {
        if (!invoices || !payments) return null;

        const totalEarned = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
        const totalInvoiced = invoices.reduce((acc, i) => acc + (i.total || 0), 0);
        const outstanding = totalInvoiced - totalEarned;
        const avgInvoice = invoices.length > 0 ? totalInvoiced / invoices.length : 0;

        // Monthly Data (Last 6 months)
        const monthlyData: any[] = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();

        for (let i = 5; i >= 0; i--) {
            const m = (currentMonth - i + 12) % 12;
            const monthName = months[m];
            const year = new Date().getFullYear() - (currentMonth - i < 0 ? 1 : 0);

            const monthInvoices = invoices.filter(inv => {
                const date = new Date(inv.date);
                return date.getMonth() === m && date.getFullYear() === year;
            });

            const monthPayments = payments.filter(p => {
                const date = new Date(p.date);
                return date.getMonth() === m && date.getFullYear() === year;
            });

            monthlyData.push({
                name: monthName,
                revenue: monthPayments.reduce((acc, p) => acc + p.amount, 0),
                invoiced: monthInvoices.reduce((acc, inv) => acc + inv.total, 0)
            });
        }

        // Status Distribution
        const statusData = [
            { name: 'Paid', value: invoices.filter(i => i.status === InvoiceStatus.PAID).length, color: '#10b981' },
            { name: 'Pending', value: invoices.filter(i => i.status === InvoiceStatus.PENDING).length, color: '#f59e0b' },
            { name: 'Overdue', value: invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length, color: '#ef4444' },
        ].filter(d => d.value > 0);

        // Top Clients
        const clientRevenue = clients.map(client => {
            const rev = payments
                .filter(p => p.clientName === client.name)
                .reduce((acc, p) => acc + p.amount, 0);
            return { name: client.name, revenue: rev };
        }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        return {
            totalEarned,
            totalInvoiced,
            outstanding,
            avgInvoice,
            monthlyData,
            statusData,
            clientRevenue
        };
    }, [invoices, payments, clients]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-96 rounded-3xl" />
                    <Skeleton className="h-96 rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h2 className="text-3xl font-black tracking-tight">Business Reports</h2>
                <p className="text-gray-500 mt-1">Insights and analytics for your business performance.</p>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', value: `GH₵ ${stats.totalEarned.toLocaleString()}`, sub: 'Payments received', icon: 'payments', color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Outstanding', value: `GH₵ ${stats.outstanding.toLocaleString()}`, sub: 'Unpaid balances', icon: 'pending_actions', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Avg Invoice', value: `GH₵ ${stats.avgInvoice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: 'Per transaction', icon: 'analytics', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Success Rate', value: `${((stats.statusData.find(d => d.name === 'Paid')?.value || 0) / (invoices.length || 1) * 100).toFixed(0)}%`, sub: 'Paid vs Total', icon: 'verified', color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <Card key={i} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <span className="material-symbols-outlined">{stat.icon}</span>
                            </div>
                        </div>
                        <p className="text-[#667385] text-xs font-black uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{stat.sub}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Revenue Chart */}
                <Card className="lg:col-span-8 p-6">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-black text-lg">Revenue Overview</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Invoiced vs Received (Last 6 Months)</p>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }}
                                    tickFormatter={(val) => `₵${val}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontWeight: 800
                                    }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="invoiced" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorInv)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Status Breakdown */}
                <Card className="lg:col-span-4 p-6 flex flex-col">
                    <h3 className="font-black text-lg mb-2">Invoice Status</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Percentage breakdown</p>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {stats.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-3 mt-4">
                        {stats.statusData.map((d, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                    <span className="text-sm font-bold text-gray-600">{d.name}</span>
                                </div>
                                <span className="text-sm font-black">{((d.value / invoices.length) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Top Clients */}
                <Card className="lg:col-span-12 p-6">
                    <h3 className="font-black text-lg mb-1">Top Clients by Revenue</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Highest contributing clients</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {stats.clientRevenue.map((client, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black mb-3">
                                    {client.name.charAt(0)}
                                </div>
                                <h4 className="font-black text-sm truncate">{client.name}</h4>
                                <p className="text-xs font-bold text-gray-500 mt-1">GH₵ {client.revenue.toLocaleString()}</p>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-primary h-full rounded-full"
                                        style={{ width: `${(client.revenue / (stats.clientRevenue[0]?.revenue || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
