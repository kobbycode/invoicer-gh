import React, { forwardRef } from 'react';

// Define types for props to ensure type safety
interface BusinessDetails {
    name: string;
    address: string;
    email: string;
    momoNumber: string;
    momoNetwork: string;
    logoUrl: string;
    tin: string;
}

interface ClientDetails {
    name: string;
    email: string;
    phone: string;
    location: string;
}

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    price: number;
}

interface InvoicePreviewProps {
    businessDetails: BusinessDetails;
    clientDetails: ClientDetails;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    items: LineItem[];
    currency: string;
    vatEnabled: boolean;
    leviesEnabled: boolean;
    covidLevyEnabled: boolean;
    subtotal: number;
    vatAmount: number;
    leviesAmount: number;
    covidAmount: number;
    total: number;
    scale: number;
}

// Helper for network logos
const getNetworkLogo = (network: string | undefined) => {
    if (!network) return null;
    switch (network) {
        case 'MTN MOMO': return '/networks/mtn-momo.png';
        case 'Telecel Cash': return '/networks/telecel-cash.jpg';
        case 'Airtel Tigo Money': return '/networks/airtel-tigo-money.jpg';
        default: return null;
    }
};

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({
    businessDetails,
    clientDetails,
    invoiceNumber,
    date,
    dueDate,
    items,
    currency,
    vatEnabled,
    leviesEnabled,
    covidLevyEnabled,
    subtotal,
    vatAmount,
    leviesAmount,
    covidAmount,
    total,
    scale
}, ref) => {
    const currencySymbol = currency === 'GHS' ? 'GH₵' : currency;
    const priceSymbol = currency === 'GHS' ? '₵' : currency;

    return (
        <div
            ref={ref}
            className="bg-gray-50 dark:bg-gray-900 rounded-2xl sm:rounded-[2.5rem] border-2 sm:border-8 border-white dark:border-gray-800 shadow-2xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-700 w-[800px] origin-top-left transform transition-transform duration-75 ease-out"
            style={{
                transform: `scale(${scale})`,
                height: `${1123}px`, // Fixed A4 height ratio
                marginBottom: `-${(1 - scale) * 1123}px`, // Compensate space
                marginRight: `-${(1 - scale) * 800}px`
            }}
        >
            <div
                id="invoice-preview"
                className="bg-white text-[#121417] p-8 lg:p-16 h-full flex flex-col justify-between relative"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

                {/* Content Wrapper */}
                <div>
                    {/* Header Section */}
                    <div className="border-b-8 border-primary pb-10 mb-10">
                        <div className="flex justify-between items-start">
                            <div>
                                {businessDetails.logoUrl ? (
                                    <div className="h-16 mb-4 flex items-center">
                                        <img src={businessDetails.logoUrl} alt="Logo" className="h-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-6 font-bold">
                                        <span className="material-symbols-outlined text-3xl">store</span>
                                    </div>
                                )}
                                <h1 className="text-3xl font-black leading-tight">{businessDetails.name || 'Your Business Name'}</h1>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
                                    {businessDetails.address || 'Accra, Ghana'}
                                </p>
                                <p className="text-xs text-gray-400 font-bold mt-1">
                                    {businessDetails.email} | {businessDetails.momoNumber}
                                </p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-6xl font-black text-primary uppercase tracking-tighter">Invoice</h2>
                                <div className="mt-6 space-y-1">
                                    <p className="text-lg font-black">#{invoiceNumber}</p>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Date: {date}</p>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Due: {dueDate || 'On Receipt'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill To & Status Section */}
                    <div className="grid grid-cols-2 gap-20 mb-12">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Bill To</p>
                            <p className="text-xl font-black">{clientDetails.name || 'Client Name'}</p>
                            <p className="text-gray-500 font-bold">{clientDetails.email}</p>
                            <p className="text-gray-500 font-bold">{clientDetails.phone}</p>
                            <p className="text-gray-500 font-bold text-sm mt-2">{clientDetails.location}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-12">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="py-4 text-xs font-black uppercase text-gray-400 tracking-widest">Description</th>
                                    <th className="py-4 text-xs font-black uppercase text-gray-400 text-center tracking-widest">Qty</th>
                                    <th className="py-4 text-xs font-black uppercase text-gray-400 text-right tracking-widest">Price</th>
                                    <th className="py-4 text-xs font-black uppercase text-gray-400 text-right tracking-widest">Total</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold">
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-50">
                                        <td className="py-5 text-sm">{item.description || 'Item Description'}</td>
                                        <td className="py-5 text-center">{item.quantity}</td>
                                        <td className="py-5 text-right">{priceSymbol} {item.price.toLocaleString()}</td>
                                        <td className="py-5 text-right">{priceSymbol} {(item.quantity * item.price).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="flex flex-col items-end space-y-3 mb-12">
                        <div className="flex justify-between w-64 text-sm font-bold">
                            <span className="text-gray-400 uppercase tracking-widest">Subtotal</span>
                            <span>{currencySymbol} {subtotal.toLocaleString()}</span>
                        </div>
                        {vatEnabled && (
                            <div className="flex justify-between w-64 text-sm font-bold">
                                <span className="text-gray-400 uppercase tracking-widest">VAT ({(15).toFixed(0)}%)</span>
                                <span>{currencySymbol} {vatAmount.toLocaleString()}</span>
                            </div>
                        )}
                        {leviesEnabled && (
                            <div className="flex justify-between w-64 text-sm font-bold">
                                <span className="text-gray-400 uppercase tracking-widest">Levies (5%)</span>
                                <span>{currencySymbol} {leviesAmount.toLocaleString()}</span>
                            </div>
                        )}
                        {covidLevyEnabled && (
                            <div className="flex justify-between w-64 text-sm font-bold">
                                <span className="text-gray-400 uppercase tracking-widest">COVID-19 (1%)</span>
                                <span>{currencySymbol} {covidAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between w-80 text-2xl pt-5 mt-3 border-t-2 border-gray-100 font-black text-primary">
                            <span className="text-sm uppercase tracking-widest">Grand Total</span>
                            <span>{currencySymbol} {total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-gray-100 flex-shrink-0">
                                {getNetworkLogo(businessDetails.momoNetwork) ? (
                                    <img src={getNetworkLogo(businessDetails.momoNetwork)!} alt={businessDetails.momoNetwork} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="size-full bg-momo-yellow flex items-center justify-center">
                                        <span className="text-[8px] font-black text-black tracking-tighter">MOMO</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">Pay via {businessDetails.momoNetwork || 'MoMo'}</p>
                                <p className="text-sm font-black break-all sm:break-normal">{businessDetails.momoNumber || '---'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Powered by KVoice • Thank you for your business!</p>
                </div>
            </div>
        </div>
    );
});

InvoicePreview.displayName = 'InvoicePreview';
