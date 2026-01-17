import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { getInvoice } from '../services/invoiceService';
import { Invoice, InvoiceStatus } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const getNetworkLogo = (network: string | undefined) => {
    if (!network) return null;
    switch (network) {
        case 'MTN MOMO':
            return '/networks/mtn-momo.png';
        case 'Telecel Cash':
            return '/networks/telecel-cash.jpg';
        case 'Airtel Tigo Money':
            return '/networks/airtel-tigo-money.jpg';
        default:
            return null;
    }
};

const ViewInvoice: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { showAlert } = useAlert();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [scale, setScale] = useState(1);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const availableWidth = containerRef.current.offsetWidth;
                if (availableWidth > 0 && availableWidth < 800) {
                    setScale(availableWidth / 800);
                } else {
                    setScale(1);
                }
            }
        };

        const observer = new ResizeObserver(() => {
            requestAnimationFrame(updateScale);
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        updateScale();
        const timers = [
            setTimeout(updateScale, 100),
            setTimeout(updateScale, 500),
            setTimeout(updateScale, 1500)
        ];

        window.addEventListener('resize', updateScale);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateScale);
            timers.forEach(t => clearTimeout(t));
        };
    }, [loading, invoice]);

    useEffect(() => {
        if (userProfile?.uid && id) {
            fetchInvoice();
        }
    }, [userProfile, id]);

    const fetchInvoice = async () => {
        try {
            if (!userProfile?.uid || !id) return;
            const data = await getInvoice(userProfile.uid, id);
            setInvoice(data);
        } catch (error) {
            console.error("Error fetching invoice:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('invoice-to-print');
        if (!element) return;
        try {
            setGenerating(true);
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${invoice?.invoiceNumber || 'invoice'}.pdf`);
        } catch (error) {
            console.error("PDF generation failed:", error);
            showAlert('Error', 'Failed to generate PDF.', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleWhatsAppShare = () => {
        if (!invoice) return;
        const message = `Hello ${invoice.client.name}, here is your invoice #${invoice.invoiceNumber} for GH₵ ${invoice.total.toLocaleString()}.`;
        const encodedMsg = encodeURIComponent(message);
        const phone = (invoice.client.momoNumber || '').replace(/\s+/g, '').replace('+', '');
        window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
    };

    const handleEmailClient = () => {
        if (!invoice) return;
        const subject = encodeURIComponent(`Invoice #${invoice.invoiceNumber}`);
        const body = encodeURIComponent(`Hello ${invoice.client.name},\n\nPlease find your invoice #${invoice.invoiceNumber} for GH₵ ${invoice.total.toLocaleString()} attached.\n\nThank you for your business!`);
        window.location.href = `mailto:${invoice.client.email}?subject=${subject}&body=${body}`;
    };

    const subtotal = invoice ? invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0) : 0;
    const vatAmount = invoice && invoice.vatEnabled ? subtotal * 0.15 : 0;
    const leviesAmount = invoice && invoice.leviesEnabled ? subtotal * 0.05 : 0;
    const covidAmount = invoice && invoice.covidLevyEnabled ? subtotal * 0.01 : 0;

    return (
        <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-8 pb-40 sm:pb-32 px-0 sm:px-0">
            {/* Mobile-Optimized Header */}
            <div className="flex justify-between items-center no-print px-3 sm:px-0">
                <button
                    onClick={() => navigate('/invoices')}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-3 sm:px-4 h-9 sm:h-10 rounded-xl flex items-center gap-1.5 sm:gap-2 text-gray-500 font-black text-[10px] sm:text-xs hover:text-primary transition-all border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                    <span className="material-symbols-outlined text-base sm:text-lg">arrow_back</span> BACK
                </button>
            </div>

            <div className="px-3 sm:px-0">
                <h3 className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-4">Document View</h3>
            </div>

            {/* Premium Document Stage */}
            <div
                ref={containerRef}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl sm:rounded-[2.5rem] border-2 sm:border-8 border-white dark:border-gray-800 shadow-2xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-700 w-full"
            >
                {loading ? (
                    <div className="h-96 flex items-center justify-center">
                        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full shadow-lg"></div>
                    </div>
                ) : !invoice ? (
                    <div className="h-96 flex items-center justify-center font-bold text-gray-400">
                        Invoice Not Found
                    </div>
                ) : (
                    <div
                        id="invoice-to-print"
                        className="bg-white text-[#121417] p-4 sm:p-8 lg:p-16"
                    >
                        {/* Header Section */}
                        <div className="border-b-4 sm:border-b-8 border-primary pb-4 sm:pb-10 mb-4 sm:mb-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="order-2 sm:order-1">
                                    {userProfile?.logoUrl ? (
                                        <div className="h-10 sm:h-16 mb-2 sm:mb-4 flex items-center">
                                            <img src={userProfile.logoUrl} alt="Logo" className="h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="size-10 sm:size-16 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 mb-3 sm:mb-6 font-bold">
                                            <span className="material-symbols-outlined text-xl sm:text-3xl">store</span>
                                        </div>
                                    )}
                                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-black leading-tight">{invoice.businessInfo?.name || userProfile?.name || 'Your Business Name'}</h1>
                                    <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
                                        {invoice.businessInfo?.address || userProfile?.address || 'Accra, Ghana'}
                                    </p>
                                    <p className="text-[9px] sm:text-xs text-gray-400 font-bold mt-1 break-all">
                                        {invoice.businessInfo?.email || userProfile?.email} | {invoice.businessInfo?.momoNumber || userProfile?.momoNumber}
                                    </p>
                                </div>
                                <div className="text-left sm:text-right order-1 sm:order-2 w-full sm:w-auto">
                                    <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black text-primary uppercase tracking-tighter">Invoice</h2>
                                    <div className="mt-2 sm:mt-6 space-y-0.5 sm:space-y-1">
                                        <p className="text-sm sm:text-lg font-black">#{invoice.invoiceNumber}</p>
                                        <p className="text-[10px] sm:text-sm font-bold text-gray-500 uppercase">Date: {invoice.date}</p>
                                        <p className="text-[10px] sm:text-sm font-bold text-gray-500 uppercase">Due: {invoice.dueDate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bill To & Status Section */}
                        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-20 mb-6 sm:mb-12">
                            <div>
                                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 mb-1 sm:mb-3">Bill To</p>
                                <p className="text-base sm:text-xl font-black">{invoice.client.name}</p>
                                <p className="text-gray-500 font-bold text-xs sm:text-base">{invoice.client.email}</p>
                                <p className="text-gray-500 font-bold text-xs sm:text-base">{invoice.client.momoNumber}</p>
                                <p className="text-gray-500 font-bold text-xs sm:text-base mt-1 sm:mt-2">{invoice.client.location}</p>
                            </div>
                            <div className="sm:text-right">
                                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 mb-1 sm:mb-3">Payment Status</p>
                                <span className={`inline-flex px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest ${invoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {invoice.status}
                                </span>
                            </div>
                        </div>

                        {/* Items Table - Responsive */}
                        <div className="mb-6 sm:mb-12">
                            {/* Desktop Table */}
                            <table className="hidden sm:table w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        <th className="py-4 text-xs font-black uppercase text-gray-400 tracking-widest">Description</th>
                                        <th className="py-4 text-xs font-black uppercase text-gray-400 text-center tracking-widest">Qty</th>
                                        <th className="py-4 text-xs font-black uppercase text-gray-400 text-right tracking-widest">Price</th>
                                        <th className="py-4 text-xs font-black uppercase text-gray-400 text-right tracking-widest">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="font-bold">
                                    {invoice.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-50">
                                            <td className="py-5 text-sm">{item.description}</td>
                                            <td className="py-5 text-center">{item.quantity}</td>
                                            <td className="py-5 text-right">{invoice.currency === 'GHS' ? '₵' : invoice.currency} {item.price.toLocaleString()}</td>
                                            <td className="py-5 text-right">{invoice.currency === 'GHS' ? '₵' : invoice.currency} {(item.quantity * item.price).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile Items List */}
                            <div className="sm:hidden space-y-3">
                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 pb-2">Items</div>
                                {invoice.items.map((item, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-xl p-3">
                                        <p className="font-bold text-sm">{item.description}</p>
                                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                            <span>{item.quantity} × {invoice.currency === 'GHS' ? '₵' : invoice.currency}{item.price.toLocaleString()}</span>
                                            <span className="font-black text-gray-900">{invoice.currency === 'GHS' ? '₵' : invoice.currency}{(item.quantity * item.price).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="flex flex-col items-end space-y-2 sm:space-y-3 mb-6 sm:mb-12">
                            <div className="flex justify-between w-full sm:w-64 text-xs sm:text-sm font-bold">
                                <span className="text-gray-400 uppercase tracking-widest">Subtotal</span>
                                <span>{invoice.currency === 'GHS' ? 'GH₵' : invoice.currency} {subtotal.toLocaleString()}</span>
                            </div>
                            {invoice.vatEnabled && (
                                <div className="flex justify-between w-full sm:w-64 text-xs sm:text-sm font-bold">
                                    <span className="text-gray-400 uppercase tracking-widest">VAT (15%)</span>
                                    <span>{invoice.currency === 'GHS' ? 'GH₵' : invoice.currency} {vatAmount.toLocaleString()}</span>
                                </div>
                            )}
                            {invoice.leviesEnabled && (
                                <div className="flex justify-between w-full sm:w-64 text-xs sm:text-sm font-bold">
                                    <span className="text-gray-400 uppercase tracking-widest">Levies (5%)</span>
                                    <span>{invoice.currency === 'GHS' ? 'GH₵' : invoice.currency} {leviesAmount.toLocaleString()}</span>
                                </div>
                            )}
                            {invoice.covidLevyEnabled && (
                                <div className="flex justify-between w-full sm:w-64 text-xs sm:text-sm font-bold">
                                    <span className="text-gray-400 uppercase tracking-widest">COVID-19 (1%)</span>
                                    <span>{invoice.currency === 'GHS' ? 'GH₵' : invoice.currency} {covidAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between w-full sm:w-80 text-lg sm:text-2xl pt-3 sm:pt-5 mt-2 sm:mt-3 border-t-2 border-gray-100 font-black text-primary">
                                <span className="text-[10px] sm:text-sm uppercase tracking-widest">Total Amount</span>
                                <span>{invoice.currency === 'GHS' ? 'GH₵' : invoice.currency} {invoice.total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Payment Info Section */}
                        <div className="bg-gray-50 p-4 sm:p-8 rounded-xl sm:rounded-3xl border border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="size-10 sm:size-14 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-gray-100">
                                        {getNetworkLogo(invoice.businessInfo?.momoNetwork || userProfile?.momoNetwork) ? (
                                            <img src={getNetworkLogo(invoice.businessInfo?.momoNetwork || userProfile?.momoNetwork)!} alt="Network Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="size-full bg-momo-yellow flex items-center justify-center">
                                                <span className="text-[8px] sm:text-[10px] font-black text-black tracking-tighter">MOMO</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[9px] sm:text-xs font-black text-gray-400 tracking-widest uppercase mb-0.5 sm:mb-1">Payment Method</p>
                                        <p className="text-xs sm:text-sm font-black">{invoice.businessInfo?.momoNetwork || userProfile?.momoNetwork} - {invoice.businessInfo?.momoNumber || userProfile?.momoNumber}</p>
                                    </div>
                                </div>
                                {userProfile?.tin && (
                                    <div className="sm:text-right">
                                        <p className="text-[9px] sm:text-xs font-black text-gray-400 tracking-widest uppercase mb-0.5 sm:mb-1">Business TIN</p>
                                        <p className="text-xs sm:text-sm font-black uppercase font-mono">{userProfile.tin}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 sm:mt-12 text-center border-t border-gray-100 pt-4 sm:pt-8">
                            <p className="text-[8px] sm:text-[10px] font-black text-gray-300 tracking-widest uppercase italic">Generated via KVoice • Professional Invoicing</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Action Buttons - Floating Mobile Bar */}
            <div className="lg:hidden fixed bottom-4 left-3 right-3 z-50 no-print animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-1.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex gap-2">
                    <button
                        onClick={handleWhatsAppShare}
                        className="flex-1 bg-accent-green text-white h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-md shadow-green-900/10 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">send</span> WhatsApp
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={generating}
                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 h-12 w-12 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">{generating ? 'hourglass_empty' : 'download'}</span>
                    </button>
                    <button
                        onClick={handleEmailClient}
                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 h-12 w-12 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">mail</span>
                    </button>
                </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:grid grid-cols-2 gap-4 no-print">
                <button
                    onClick={handleWhatsAppShare}
                    className="bg-accent-green text-white px-6 py-4 rounded-2xl font-black text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 lg:col-span-2 shadow-xl shadow-green-900/10 active:scale-95"
                >
                    <span className="material-symbols-outlined">send</span> Send via WhatsApp
                </button>
                <button
                    onClick={handleDownloadPDF}
                    disabled={generating}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                    <span className="material-symbols-outlined text-lg">download</span> {generating ? 'Creating...' : 'PDF'}
                </button>
                <button
                    onClick={handleEmailClient}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                    <span className="material-symbols-outlined text-lg">mail</span> Email
                </button>
            </div>
        </div>
    );
};

export default ViewInvoice;
