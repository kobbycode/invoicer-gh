
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { getClients } from '../services/clientService';
import { createInvoice } from '../services/invoiceService';
import { Client, LineItem, InvoiceStatus } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  canCreateInvoice,
  getRemainingInvoices,
  incrementGuestInvoiceCount,
  hasReachedInvoiceLimit
} from '../utils/guestManager';

const getNetworkLogo = (network: string | undefined) => {
  if (!network) return null;
  switch (network) {
    case 'MTN MOMO': return '/networks/mtn-momo.png';
    case 'Telecel Cash': return '/networks/telecel-cash.jpg';
    case 'Airtel Tigo Money': return '/networks/airtel-tigo-money.jpg';
    default: return null;
  }
};

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');
  const [scale, setScale] = useState(1);
  const previewContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLockoutModal, setShowLockoutModal] = useState(false);

  const isGuest = currentUser?.isAnonymous || false;
  const remainingInvoices = isGuest ? getRemainingInvoices() : Infinity;



  const [businessDetails, setBusinessDetails] = useState({
    name: userProfile?.businessName || '',
    address: userProfile?.address || '',
    email: userProfile?.email || '',
    momoNumber: userProfile?.momoNumber || '',
    momoNetwork: userProfile?.momoNetwork || 'MTN MOMO',
    logoUrl: userProfile?.logoUrl || '',
    tin: userProfile?.tin || ''
  });

  const [clientDetails, setClientDetails] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, price: 0 }
  ]);

  const [vatEnabled, setVatEnabled] = useState(false);
  const [leviesEnabled, setLeviesEnabled] = useState(false);
  const [covidLevyEnabled, setCovidLevyEnabled] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    if (userProfile) {
      setBusinessDetails({
        name: userProfile.businessName || '',
        address: userProfile.address || '',
        email: userProfile.email || '',
        momoNumber: userProfile.momoNumber || '',
        momoNetwork: userProfile.momoNetwork || 'MTN MOMO',
        logoUrl: userProfile.logoUrl || '',
        tin: userProfile.tin || ''
      });

      if (userProfile.uid) {
        getClients(userProfile.uid).then(setClients);
      }

      // Apply Preferences
      if (userProfile.preferences) {
        const prefix = userProfile.preferences.invoicePrefix || 'INV-';
        setInvoiceNumber(`${prefix}${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
      }
    }
  }, [userProfile]);

  React.useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const availableWidth = previewContainerRef.current.offsetWidth;
        // Only scale on large screens (lg and above), on mobile use responsive layout
        const isMobile = window.innerWidth < 1024;
        if (!isMobile && availableWidth > 0 && availableWidth < 800) {
          setScale(availableWidth / 800);
        } else {
          setScale(1);
        }
      }
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateScale);
    });

    if (previewContainerRef.current) {
      observer.observe(previewContainerRef.current);
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
  }, [activeView, items, businessDetails]);

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientDetails({
        name: client.name,
        email: client.email,
        phone: client.momoNumber,
        location: client.location
      });
    }
  };

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), description: '', quantity: 1, price: 0 }]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.quantity * item.price), 0), [items]);
  const taxRate = userProfile?.preferences?.defaultTaxRate || 15;
  const vatAmount = vatEnabled ? subtotal * (taxRate / 100) : 0;
  const leviesAmount = leviesEnabled ? subtotal * 0.05 : 0; // NHIL 2.5% + GETFund 2.5%
  const covidAmount = covidLevyEnabled ? subtotal * 0.01 : 0;
  const total = subtotal + vatAmount + leviesAmount + covidAmount;
  const currency = userProfile?.preferences?.defaultCurrency || 'GHS';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessDetails({ ...businessDetails, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (status: InvoiceStatus = InvoiceStatus.PENDING) => {
    if (!userProfile?.uid) return;

    // Check guest invoice limit
    if (isGuest && !canCreateInvoice(isGuest)) {
      setShowLockoutModal(true);
      return;
    }

    if (!clientDetails.name || items.some(i => !i.description)) {
      showAlert('Missing Info', 'Please provide client name and item descriptions.', 'warning');
      return;
    }

    try {
      setLoading(true);
      await createInvoice(userProfile.uid, {
        invoiceNumber,
        date: invoiceDate,
        dueDate: dueDate || invoiceDate,
        items,
        status,
        currency,
        vatEnabled,
        leviesEnabled,
        covidLevyEnabled,
        total,
        client: {
          id: selectedClientId || 'new',
          name: clientDetails.name,
          email: clientDetails.email,
          momoNumber: clientDetails.phone,
          momoNetwork: businessDetails.momoNetwork as any,
          location: clientDetails.location,
          invoicesCount: 0,
          status: 'Active'
        },
        businessInfo: {
          name: businessDetails.name,
          address: businessDetails.address,
          email: businessDetails.email,
          momoNumber: businessDetails.momoNumber,
          momoNetwork: businessDetails.momoNetwork,
          tin: businessDetails.tin || ''
        }
      });

      // Increment guest invoice count if guest user
      if (isGuest) {
        incrementGuestInvoiceCount();
      }

      navigate('/invoices');
    } catch (error) {
      console.error("Error saving invoice:", error);
      showAlert('Error', 'Failed to save invoice.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    try {
      setLoading(true);
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      showAlert('PDF Error', 'Something went wrong while generating your PDF.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!clientDetails.phone) {
      showAlert('Missing Phone', 'Please enter a client phone number to share via WhatsApp.', 'warning');
      return;
    }
    const message = `Hello ${clientDetails.name}, here is your invoice #${invoiceNumber} from ${businessDetails.name} for GH₵ ${total.toLocaleString()}.`;
    const encodedMsg = encodeURIComponent(message);
    const phone = clientDetails.phone.replace(/\s+/g, '').replace('+', '');
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
  };

  const handleEmailClient = () => {
    if (!clientDetails.email) {
      showAlert('Missing Email', 'Please enter a client email address to send the invoice.', 'warning');
      return;
    }
    const subject = encodeURIComponent(`Invoice #${invoiceNumber} from ${businessDetails.name}`);
    const body = encodeURIComponent(`Hello ${clientDetails.name},\n\nPlease find your invoice #${invoiceNumber} for GH₵ ${total.toLocaleString()} attached.\n\nThank you for your business!`);
    window.location.href = `mailto:${clientDetails.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-32 px-2 sm:px-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">Create Invoice</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Generate professional GHS invoices in seconds.</p>
        </div>
        <div className="hidden lg:flex gap-2 w-full lg:w-auto">
          <button onClick={() => navigate('/invoices')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#dce0e4] font-bold text-sm hover:bg-white transition-all">
            <span className="material-symbols-outlined text-lg focus:outline-none">arrow_back</span> Back
          </button>
          <button
            onClick={() => handleSave(InvoiceStatus.DRAFT)}
            disabled={loading}
            className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-lg">save</span> {loading ? '...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-20 left-2 right-2 z-40">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-2 rounded-2xl shadow-2xl flex gap-2">
          <button
            onClick={() => setActiveView('edit')}
            className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-xs sm:text-sm font-black transition-all ${activeView === 'edit' ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">edit_note</span> Edit
          </button>
          <button
            onClick={() => setActiveView('preview')}
            className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-xs sm:text-sm font-black transition-all ${activeView === 'preview' ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">visibility</span> View
          </button>
        </div>
      </div>

      {/* Mobile Top Controls */}
      <div className="lg:hidden flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
        <button onClick={() => navigate('/invoices')} className="size-10 sm:size-11 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <button
          onClick={() => handleSave(InvoiceStatus.DRAFT)}
          disabled={loading}
          className="bg-primary text-white px-4 sm:px-5 h-10 sm:h-11 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-primary/20 flex items-center gap-1.5 sm:gap-2"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">save_as</span> <span className="hidden sm:inline">Save Draft</span><span className="sm:hidden">Save</span>
        </button>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-10">
        {/* Editor Form */}
        <div className={`${activeView === 'edit' ? 'block' : 'hidden lg:block'} lg:col-span-7 space-y-4 sm:space-y-6 lg:space-y-8 order-2 lg:order-1`}>
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-[#f1f2f4] dark:border-gray-800">
            <h3 className="text-base sm:text-lg font-black mb-4 sm:mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg sm:text-xl">store</span> Business Details
            </h3>
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-2 border-dashed border-[#dce0e4] flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-gray-50 transition-colors">
                  {businessDetails.logoUrl ? (
                    <img src={businessDetails.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-2xl sm:text-3xl text-gray-400">upload_file</span>
                      <p className="text-[8px] sm:text-[10px] font-bold mt-1 sm:mt-2 uppercase tracking-widest text-gray-500">Upload Logo</p>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <label className="flex flex-col gap-1.5 sm:col-span-1">
                  <span className="text-xs font-bold text-gray-600 uppercase">Business Name</span>
                  <input
                    value={businessDetails.name}
                    onChange={e => setBusinessDetails({ ...businessDetails, name: e.target.value })}
                    className="rounded-xl border-[#dce0e4] bg-white h-10 sm:h-11 text-sm focus:ring-primary focus:border-primary"
                    type="text"
                  />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-1">
                  <span className="text-xs font-bold text-gray-600 uppercase">GHS Digital Address</span>
                  <input
                    value={businessDetails.address}
                    onChange={e => setBusinessDetails({ ...businessDetails, address: e.target.value })}
                    className="rounded-xl border-[#dce0e4] bg-white h-10 sm:h-11 text-sm focus:ring-primary focus:border-primary"
                    type="text"
                  />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs font-bold text-gray-600 uppercase">Email Address</span>
                  <input
                    value={businessDetails.email}
                    onChange={e => setBusinessDetails({ ...businessDetails, email: e.target.value })}
                    className="rounded-xl border-[#dce0e4] bg-white h-10 sm:h-11 text-sm focus:ring-primary focus:border-primary"
                    type="email"
                    placeholder="e.g. hello@business.gh"
                  />
                </label>
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-gray-600 uppercase">MoMo Network</span>
                    <select
                      value={businessDetails.momoNetwork}
                      onChange={e => setBusinessDetails({ ...businessDetails, momoNetwork: e.target.value })}
                      className="rounded-xl border-[#dce0e4] bg-white h-10 sm:h-11 text-sm focus:ring-primary focus:border-primary font-bold"
                    >
                      <option>MTN MOMO</option>
                      <option>Telecel Cash</option>
                      <option>Airtel Tigo Money</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-gray-600 uppercase">MoMo Number</span>
                    <input
                      value={businessDetails.momoNumber}
                      onChange={e => setBusinessDetails({ ...businessDetails, momoNumber: e.target.value })}
                      className="rounded-xl border-[#dce0e4] bg-white h-10 sm:h-11 text-sm focus:ring-primary focus:border-primary font-bold"
                      type="text"
                      placeholder="024 XXX XXXX"
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-[#f1f2f4] dark:border-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg sm:text-xl">person_add</span> Client Details
              </h3>
              <select
                className="w-full sm:w-auto rounded-lg border-gray-200 text-xs sm:text-sm py-2 sm:py-1.5 px-3"
                value={selectedClientId}
                onChange={handleClientSelect}
              >
                <option value="">Select Existing Client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-bold text-gray-600 uppercase">Client Name / Company</span>
                <input
                  value={clientDetails.name}
                  onChange={e => setClientDetails({ ...clientDetails, name: e.target.value })}
                  className="rounded-xl border-[#dce0e4] bg-gray-50 h-10 sm:h-11 text-sm focus:ring-primary focus:border-primary"
                  placeholder="John Doe or ABC Ghana Corp"
                  type="text"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-600 uppercase">Email Address</span>
                <input
                  value={clientDetails.email}
                  onChange={e => setClientDetails({ ...clientDetails, email: e.target.value })}
                  className="rounded-xl border-[#dce0e4] bg-gray-50 h-10 sm:h-11 text-sm focus:ring-primary focus:border-primary"
                  placeholder="client@example.com"
                  type="email"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-600 uppercase">Phone Number</span>
                <input
                  value={clientDetails.phone}
                  onChange={e => setClientDetails({ ...clientDetails, phone: e.target.value })}
                  className="rounded-xl border-[#dce0e4] bg-gray-50 h-10 sm:h-11 text-sm focus:ring-primary focus:border-primary"
                  placeholder="+233 ..."
                  type="tel"
                />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-bold text-gray-600 uppercase">Location / Address</span>
                <input
                  value={clientDetails.location}
                  onChange={e => setClientDetails({ ...clientDetails, location: e.target.value })}
                  className="rounded-xl border-[#dce0e4] bg-gray-50 h-10 sm:h-11 text-sm focus:ring-primary focus:border-primary"
                  placeholder="City, Region"
                  type="text"
                />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-bold text-gray-600 uppercase">Due Date</span>
                <input
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="rounded-xl border-[#dce0e4] bg-gray-50 h-10 sm:h-11 text-sm focus:ring-primary focus:border-primary px-3"
                  type="date"
                />
              </label>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-[#f1f2f4] dark:border-gray-800">
            <h3 className="text-base sm:text-lg font-black mb-4 sm:mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg sm:text-xl">list_alt</span> Items & Services
            </h3>
            <div className="space-y-4 sm:space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-end bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-xl">
                  <div className="w-full sm:col-span-6 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</span>
                    <input
                      className="w-full rounded-xl border-[#dce0e4] bg-white sm:bg-gray-50 text-sm h-10 sm:h-11"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder='Item or Service name'
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full sm:col-span-5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center block">Qty</span>
                      <input
                        className="w-full rounded-xl border-[#dce0e4] bg-white sm:bg-gray-50 text-sm h-10 sm:h-11 text-center"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right block">Price (₵)</span>
                      <input
                        className="w-full rounded-xl border-[#dce0e4] bg-white sm:bg-gray-50 text-sm h-10 sm:h-11 text-right"
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="w-full sm:col-span-1 pt-1 sm:pb-3 flex justify-end sm:justify-start">
                    <button 
                      onClick={() => setItems(items.filter(i => i.id !== item.id))}
                      className="text-red-500 cursor-pointer hover:scale-110 transition-transform p-2"
                      aria-label="Delete item"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addItem} className="flex items-center gap-2 text-primary text-sm font-bold hover:underline mt-4">
                <span className="material-symbols-outlined text-lg">add_circle</span> Add Line Item
              </button>
            </div>

            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowTaxModal(true)}
                className="flex items-center gap-2 text-primary font-bold text-sm bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span> Add Tax
              </button>
            </div>
          </section>
        </div>

        {/* Sticky Preview */}
        <div className={`${activeView === 'preview' ? 'block' : 'hidden lg:block'} lg:col-span-5 order-1 lg:order-2`}>
          <div className="lg:sticky lg:top-24 space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center px-2 sm:px-4 lg:px-0">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Real-time Generation</h3>
            </div>
            {/* Improved Preview Wrapper */}
            <div
              ref={previewContainerRef}
              className="lg:overflow-hidden rounded-xl sm:rounded-[2rem] lg:rounded-[2.5rem] border-2 sm:border-4 lg:border-8 border-white dark:border-gray-800 shadow-2xl bg-gray-50 dark:bg-gray-900 ring-1 ring-gray-100 dark:ring-gray-700"
            >
              <div
                className="lg:overflow-hidden lg:no-scrollbar w-full"
                style={{
                  height: scale < 1 && window.innerWidth >= 1024 ? `${1130 * scale}px` : 'auto',
                }}
              >
                <div
                  id="invoice-preview"
                  className="bg-white text-[#121417] p-4 sm:p-6 lg:p-8 xl:p-12 origin-top-left w-full lg:w-[800px] lg:min-w-[800px]"
                  style={{
                    transform: scale < 1 && window.innerWidth >= 1024 ? `scale(${scale})` : 'none',
                    transformOrigin: 'top left',
                  }}
                >
                  <div className="border-b-4 sm:border-b-8 border-primary pb-6 sm:pb-8 lg:pb-10 mb-6 sm:mb-8 lg:mb-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                      <div>
                        <div className="size-12 sm:size-14 lg:size-16 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 mb-4 sm:mb-6 overflow-hidden">
                          {businessDetails.logoUrl ? (
                            <img src={businessDetails.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-2xl sm:text-3xl">store</span>
                          )}
                        </div>
                        <h4 className="font-black text-lg sm:text-xl lg:text-2xl leading-tight">{businessDetails.name || 'Your Business Name'}</h4>
                        <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 break-words">
                          {businessDetails.address || 'Accra, Ghana'}
                          {businessDetails.email && ` • ${businessDetails.email}`}
                        </p>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <h5 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary uppercase tracking-tighter">Invoice</h5>
                        <p className="text-xs sm:text-sm font-bold mt-2 sm:mt-4">#{invoiceNumber}</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold mt-1 uppercase">Date: {invoiceDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 lg:gap-20 mb-8 sm:mb-10 lg:mb-12">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
                      <p className="font-black text-base sm:text-lg">{clientDetails.name || 'Client Name'}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Due Date</p>
                      <p className="font-black text-base sm:text-lg">{dueDate || '---'}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto mb-8 sm:mb-10 lg:mb-12">
                    <table className="w-full text-left min-w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-100">
                          <th className="py-2 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest">Description</th>
                          <th className="py-2 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase text-gray-400 text-center tracking-widest">Qty</th>
                          <th className="py-2 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase text-gray-400 text-right tracking-widest">Total</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs sm:text-sm font-bold">
                        {items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-50">
                            <td className="py-3 sm:py-4 pr-2 break-words">{item.description || 'New Item'}</td>
                            <td className="py-3 sm:py-4 text-center">{item.quantity}</td>
                            <td className="py-3 sm:py-4 text-right whitespace-nowrap">{(item.quantity * item.price).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col items-end space-y-2 mb-8 sm:mb-10 lg:mb-12">
                    <div className="flex justify-between w-full sm:w-64 text-xs sm:text-sm font-bold">
                      <span className="text-gray-400 uppercase tracking-widest">Subtotal</span>
                      <span>GH₵ {subtotal.toLocaleString()}</span>
                    </div>
                    {vatEnabled && (
                      <div className="flex justify-between w-full sm:w-64 text-xs sm:text-sm font-bold">
                        <span className="text-gray-400 uppercase tracking-widest">VAT ({taxRate}%)</span>
                        <span>{currency === 'GHS' ? 'GH₵' : currency} {vatAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {leviesEnabled && (
                      <div className="flex justify-between w-full sm:w-64 text-xs sm:text-sm font-bold">
                        <span className="text-gray-400 uppercase tracking-widest">Levies (5%)</span>
                        <span>{currency === 'GHS' ? 'GH₵' : currency} {leviesAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {covidLevyEnabled && (
                      <div className="flex justify-between w-full sm:w-64 text-xs sm:text-sm font-bold">
                        <span className="text-gray-400 uppercase tracking-widest">COVID-19 (1%)</span>
                        <span>{currency === 'GHS' ? 'GH₵' : currency} {covidAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-full sm:w-80 text-lg sm:text-xl lg:text-2xl pt-4 sm:pt-5 mt-2 sm:mt-3 border-t-2 border-gray-100 font-black text-primary">
                      <span className="text-xs sm:text-sm uppercase tracking-widest">Grand Total</span>
                      <span>{currency === 'GHS' ? 'GH₵' : currency} {total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="size-10 sm:size-12 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-gray-100 flex-shrink-0">
                        {getNetworkLogo(businessDetails.momoNetwork) ? (
                          <img src={getNetworkLogo(businessDetails.momoNetwork)!} alt={businessDetails.momoNetwork} className="w-full h-full object-contain" />
                        ) : (
                          <div className="size-full bg-momo-yellow flex items-center justify-center">
                            <span className="text-[8px] font-black text-black tracking-tighter">MOMO</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">Pay via {businessDetails.momoNetwork || 'MoMo'}</p>
                        <p className="text-xs sm:text-sm font-black break-all sm:break-normal">{businessDetails.momoNumber || '---'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 lg:mt-10 pt-6 sm:pt-7 lg:pt-8 border-t border-gray-100 text-center">
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 tracking-widest uppercase">Powered by KVoice • Thank you for your business!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-2 sm:px-4 lg:px-0">
              <button
                onClick={handleWhatsAppShare}
                className="bg-accent-green text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 sm:col-span-2 shadow-xl shadow-green-900/10 active:scale-95"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">send</span> Send via WhatsApp
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={loading}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-base sm:text-lg">download</span> PDF
              </button>
              <button
                onClick={handleEmailClient}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-base sm:text-lg">mail</span> Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Info Banner */}
      {isGuest && remainingInvoices > 0 && (
        <div className="fixed bottom-24 left-4 right-4 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-4 shadow-xl z-50 animate-in slide-in-from-bottom-5 duration-500">
          <div className="flex items-start gap-3">
            <div className="size-10 bg-amber-100 dark:bg-amber-800 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">info</span>
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sm mb-1">Guest Mode Active</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-bold">
                You have <span className="text-amber-600 dark:text-amber-400 font-black">{remainingInvoices}</span> {remainingInvoices === 1 ? 'invoice' : 'invoices'} remaining. Register to unlock unlimited access.
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 text-xs font-black text-primary underline"
              >
                Create Account Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Management Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">account_balance</span>
                  Manage Taxes
                </h3>
                <button 
                  onClick={() => setShowTaxModal(false)}
                  className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-gray-500 text-lg">close</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setVatEnabled(!vatEnabled)}>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">VAT</span>
                    <span className="text-xs text-gray-500">Value Added Tax ({taxRate}%)</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${vatEnabled ? 'bg-primary' : 'bg-gray-300'}`}>
                    <div className={`bg-white size-4 rounded-full shadow-sm transition-transform ${vatEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setLeviesEnabled(!leviesEnabled)}>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">NHIL & GETFund</span>
                    <span className="text-xs text-gray-500">National Health & Edu. (2.5% ea)</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${leviesEnabled ? 'bg-primary' : 'bg-gray-300'}`}>
                    <div className={`bg-white size-4 rounded-full shadow-sm transition-transform ${leviesEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setCovidLevyEnabled(!covidLevyEnabled)}>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">COVID-19 Levy</span>
                    <span className="text-xs text-gray-500">Recovery Levy (1%)</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${covidLevyEnabled ? 'bg-primary' : 'bg-gray-300'}`}>
                    <div className={`bg-white size-4 rounded-full shadow-sm transition-transform ${covidLevyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm font-bold mb-4">
                  <span className="text-gray-500">Tax Impact</span>
                  <span className="text-primary">+ {((vatEnabled ? taxRate : 0) + (leviesEnabled ? 5 : 0) + (covidLevyEnabled ? 1 : 0)).toFixed(1)}%</span>
                </div>
                <button
                  onClick={() => setShowTaxModal(false)}
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                  Apply Taxes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lockout Modal */}
      {showLockoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="size-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-amber-600 dark:text-amber-400">lock</span>
              </div>
              <h3 className="text-2xl font-black mb-3">Guest Limit Reached</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                You have reached the 7 invoice limit for guest users. Create a free account to generate unlimited invoices and unlock all features.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => setShowLockoutModal(false)}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
            <div className="bg-primary/5 dark:bg-primary/10 p-4 border-t border-primary/10">
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 text-base">check_circle</span>
                  <span className="font-bold text-gray-600 dark:text-gray-400">Unlimited Invoices</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 text-base">check_circle</span>
                  <span className="font-bold text-gray-600 dark:text-gray-400">Cloud Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoice;
