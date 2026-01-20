
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useInvoice } from '../hooks/useInvoice';
import { InvoiceStatus } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { InvoicePreview } from '../components/InvoicePreview';

const ViewInvoice: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { showAlert } = useAlert();
    const { invoice, isLoading: loading } = useInvoice(id);
    const [generating, setGenerating] = useState(false);
    const [scale, setScale] = useState(1);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const invoicePreviewRef = React.useRef<HTMLDivElement>(null);
    const formatDate = (value: number | string | undefined) => {
        if (!value) return '-';
        const d = typeof value === 'number' ? new Date(value) : new Date(value);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    };

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

    const handleDownloadPDF = async () => {
        const element = document.getElementById('invoice-preview') || invoicePreviewRef.current;
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
        const message = `Hello ${invoice.client.name}, here is your invoice #${invoice.invoiceNumber} from ${invoice.businessInfo?.name || userProfile?.businessName} for GH₵ ${invoice.total.toLocaleString()}.`;
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

    const subtotal = useMemo(() => invoice ? invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0) : 0, [invoice]);
    const vatAmount = useMemo(() => invoice && invoice.vatEnabled ? subtotal * 0.15 : 0, [invoice, subtotal]);
    const leviesAmount = useMemo(() => invoice && invoice.leviesEnabled ? subtotal * 0.05 : 0, [invoice, subtotal]);
    const covidAmount = useMemo(() => invoice && invoice.covidLevyEnabled ? subtotal * 0.01 : 0, [invoice, subtotal]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-[600px] w-full rounded-3xl" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <span className="material-symbols-outlined text-6xl text-gray-200">error</span>
                <p className="font-black text-gray-400">Invoice not found</p>
                <Button onClick={() => navigate('/invoices')}>Back to Invoices</Button>
            </div>
        );
    }

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
                <div className="flex gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${invoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {invoice.status}
                    </span>
                </div>
            </div>

            <div className="px-3 sm:px-0">
                <h3 className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-4">Document View</h3>
            </div>
            <div className="px-3 sm:px-0 flex gap-3">
                {invoice.createdAt && (
                    <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                        Created {formatDate(invoice.createdAt)}
                    </span>
                )}
                {invoice.updatedAt && (
                    <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                        Updated {formatDate(invoice.updatedAt)}
                    </span>
                )}
            </div>

            {/* Premium Document Stage */}
            <div
                ref={containerRef}
                className="w-full overflow-hidden flex justify-start lg:justify-center bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 p-2 sm:p-4 min-h-[500px]"
            >
                <InvoicePreview
                    ref={invoicePreviewRef}
                    businessDetails={{
                        name: invoice.businessInfo?.name || '',
                        address: invoice.businessInfo?.address || '',
                        email: invoice.businessInfo?.email || '',
                        momoNumber: invoice.businessInfo?.momoNumber || userProfile?.momoNumber || '',
                        momoNetwork: invoice.businessInfo?.momoNetwork || userProfile?.momoNetwork || '',
                        logoUrl: userProfile?.logoUrl || '',
                        tin: invoice.businessInfo?.tin || ''
                    }}
                    clientDetails={{
                        name: invoice.client.name,
                        email: invoice.client.email,
                        phone: invoice.client.momoNumber || '',
                        location: invoice.client.location || ''
                    }}
                    invoiceNumber={invoice.invoiceNumber}
                    date={invoice.date}
                    dueDate={invoice.dueDate}
                    items={invoice.items}
                    currency={invoice.currency}
                    vatEnabled={invoice.vatEnabled}
                    leviesEnabled={invoice.leviesEnabled}
                    covidLevyEnabled={invoice.covidLevyEnabled}
                    subtotal={subtotal}
                    vatAmount={vatAmount}
                    leviesAmount={leviesAmount}
                    covidAmount={covidAmount}
                    total={invoice.total}
                    scale={scale}
                />
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:grid grid-cols-2 gap-4 no-print">
                <Button
                    onClick={handleWhatsAppShare}
                    className="bg-accent-green hover:bg-accent-green/90 text-white lg:col-span-2 shadow-xl shadow-green-900/10"
                    size="lg"
                    leftIcon={<span className="material-symbols-outlined">send</span>}
                >
                    Send via WhatsApp
                </Button>
                <Button
                    onClick={handleDownloadPDF}
                    disabled={generating}
                    isLoading={generating}
                    variant="secondary"
                    size="lg"
                    leftIcon={<span className="material-symbols-outlined">download</span>}
                >
                    Download PDF
                </Button>
                <Button
                    onClick={handleEmailClient}
                    variant="secondary"
                    size="lg"
                    leftIcon={<span className="material-symbols-outlined">mail</span>}
                >
                    Email Client
                </Button>
            </div>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40 no-print animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-2 rounded-2xl shadow-2xl flex gap-2">
                    <Button
                        onClick={handleWhatsAppShare}
                        className="flex-1 bg-accent-green text-white shadow-md shadow-green-900/10"
                        size="md"
                        leftIcon={<span className="material-symbols-outlined">send</span>}
                    >
                        WhatsApp
                    </Button>
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={generating}
                        isLoading={generating}
                        variant="secondary"
                        size="icon"
                    >
                        <span className="material-symbols-outlined">{generating ? 'hourglass_empty' : 'download'}</span>
                    </Button>
                    <Button
                        onClick={handleEmailClient}
                        variant="secondary"
                        size="icon"
                    >
                        <span className="material-symbols-outlined">mail</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ViewInvoice;
