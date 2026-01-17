
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useClients } from '../hooks/useClients';
import { useInvoices } from '../hooks/useInvoices';
import { useInvoice } from '../hooks/useInvoice';
import { LineItem, InvoiceStatus } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { InvoicePreview } from '../components/InvoicePreview';

const CreateInvoice: React.FC = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { showAlert } = useAlert();
  const { createInvoice, updateInvoice, isCreating, isUpdating } = useInvoices();
  const { clients, isLoading: clientsLoading } = useClients();
  const { invoice: existingInvoice, isLoading: invoiceLoading } = useInvoice(id);

  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');
  const [scale, setScale] = useState(1);
  const previewContainerRef = React.useRef<HTMLDivElement>(null);
  // Ref for the InvoicePreview component to allow html2canvas to capture it
  const invoicePreviewRef = React.useRef<HTMLDivElement>(null);

  const [businessDetails, setBusinessDetails] = useState({
    name: '',
    address: '',
    email: '',
    momoNumber: '',
    momoNetwork: 'MTN MOMO',
    logoUrl: '',
    tin: ''
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

  const [vatEnabled, setVatEnabled] = useState(true);
  const [leviesEnabled, setLeviesEnabled] = useState(true);
  const [covidLevyEnabled, setCovidLevyEnabled] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Load User Profile / Business Defaults
  useEffect(() => {
    if (userProfile && !isEditing) {
      setBusinessDetails({
        name: userProfile.businessName || '',
        address: userProfile.address || '',
        email: userProfile.email || '',
        momoNumber: userProfile.momoNumber || '',
        momoNetwork: userProfile.momoNetwork || 'MTN MOMO',
        logoUrl: userProfile.logoUrl || '',
        tin: userProfile.tin || ''
      });

      if (userProfile.preferences) {
        const prefix = userProfile.preferences.invoicePrefix || 'INV-';
        setInvoiceNumber(`${prefix}${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
        setVatEnabled(true);
      }
    }
  }, [userProfile, isEditing]);

  // Load Existing Invoice for Editing
  useEffect(() => {
    if (isEditing && existingInvoice) {
      setBusinessDetails({
        name: existingInvoice.businessInfo?.name || '',
        address: existingInvoice.businessInfo?.address || '',
        email: existingInvoice.businessInfo?.email || '',
        momoNumber: existingInvoice.businessInfo?.momoNumber || '',
        momoNetwork: existingInvoice.businessInfo?.momoNetwork || 'MTN MOMO',
        logoUrl: existingInvoice.businessInfo?.logoUrl || '',
        tin: existingInvoice.businessInfo?.tin || ''
      });

      setClientDetails({
        name: existingInvoice.client.name,
        email: existingInvoice.client.email || '',
        phone: existingInvoice.client.momoNumber || '',
        location: existingInvoice.client.location || ''
      });

      setInvoiceNumber(existingInvoice.invoiceNumber);
      setInvoiceDate(existingInvoice.date);
      setDueDate(existingInvoice.dueDate);
      setItems(existingInvoice.items);
      setVatEnabled(existingInvoice.vatEnabled ?? true);
      setLeviesEnabled(existingInvoice.leviesEnabled ?? true);
      setCovidLevyEnabled(existingInvoice.covidLevyEnabled ?? true);
      setSelectedClientId(existingInvoice.client.id);
    }
  }, [existingInvoice, isEditing]);

  React.useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const availableWidth = previewContainerRef.current.offsetWidth;
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
    } else {
      setClientDetails({
        name: '',
        email: '',
        phone: '',
        location: ''
      });
    }
  };

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), description: '', quantity: 1, price: 0 }]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.quantity * item.price), 0), [items]);
  const taxRate = userProfile?.preferences?.defaultTaxRate || 15;
  const vatAmount = vatEnabled ? subtotal * (taxRate / 100) : 0;
  const leviesAmount = leviesEnabled ? subtotal * 0.05 : 0; // NHIL 2.5% + GETFund 2.5%
  const covidAmount = covidLevyEnabled ? subtotal * 0.01 : 0;
  const total = subtotal + vatAmount + leviesAmount + covidAmount;
  const currency = userProfile?.preferences?.defaultCurrency || 'GHS';

  const handleSave = async (status: InvoiceStatus = InvoiceStatus.PENDING) => {
    if (!userProfile?.uid) return;
    if (!clientDetails.name || items.some(i => !i.description)) {
      showAlert('Missing Info', 'Please provide client name and item descriptions.', 'warning');
      return;
    }

    const invoiceData = {
      invoiceNumber,
      date: invoiceDate,
      dueDate: dueDate || invoiceDate,
      items,
      status: isEditing ? (existingInvoice?.status || status) : status,
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
        invoicesCount: isEditing ? existingInvoice?.client.invoicesCount || 0 : 0,
        status: isEditing ? existingInvoice?.client.status || 'Active' : 'Active'
      } as any,
      businessInfo: {
        name: businessDetails.name,
        address: businessDetails.address,
        email: businessDetails.email,
        momoNumber: businessDetails.momoNumber,
        momoNetwork: businessDetails.momoNetwork,
        tin: businessDetails.tin || ''
      },
      updatedAt: Date.now(),
      ...(isEditing ? {} : { createdAt: Date.now() })
    };

    try {
      if (isEditing) {
        await updateInvoice({ id: id!, data: invoiceData });
        showAlert('Updated', 'Invoice updated successfully.', 'success');
      } else {
        await createInvoice(invoiceData);
        showAlert('Created', 'Invoice created successfully.', 'success');
      }
      navigate('/invoices');
    } catch (error) {
      console.error("Error saving invoice:", error);
      showAlert('Error', `Failed to ${isEditing ? 'update' : 'save'} invoice.`, 'error');
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-preview') || invoicePreviewRef.current;

    if (!element) return;
    try {
      setPdfLoading(true);
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
      setPdfLoading(false);
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
      showAlert('Missing Email', 'Please enter a client email address.', 'warning');
      return;
    }
    const subject = encodeURIComponent(`Invoice #${invoiceNumber} from ${businessDetails.name}`);
    const body = encodeURIComponent(`Hello ${clientDetails.name},\n\nPlease find your invoice #${invoiceNumber} for GH₵ ${total.toLocaleString()} attached.\n\nThank you for your business!`);
    window.location.href = `mailto:${clientDetails.email}?subject=${subject}&body=${body}`;
  };

  if (!userProfile || (isEditing && invoiceLoading)) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">{isEditing ? 'Edit Invoice' : 'Create Invoice'}</h2>
          <p className="text-gray-500 mt-1">{isEditing ? `Modify invoice #${invoiceNumber}` : 'Generate a new invoice for your client.'}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setActiveView(activeView === 'edit' ? 'preview' : 'edit')}
            className="lg:hidden"
            leftIcon={<span className="material-symbols-outlined">{activeView === 'edit' ? 'visibility' : 'edit'}</span>}
          >
            {activeView === 'edit' ? 'Preview' : 'Edit'}
          </Button>
          <Button
            onClick={() => handleSave()}
            isLoading={isCreating || isUpdating}
            disabled={isCreating || isUpdating}
            className="bg-primary text-white shadow-xl shadow-primary/20"
            leftIcon={<span className="material-symbols-outlined">save</span>}
          >
            {isEditing ? 'Update Invoice' : 'Save Invoice'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Column */}
        <div className={`lg:col-span-5 space-y-6 ${activeView === 'preview' ? 'hidden lg:block' : ''}`}>

          {/* Client Details Card */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg">Client Details</h3>
              <div className="text-primary cursor-pointer hover:bg-primary/5 p-2 rounded-lg transition-colors">
                <span className="material-symbols-outlined">person_add</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Select Client</label>
                <select
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                  value={selectedClientId}
                  onChange={handleClientSelect}
                  disabled={isEditing}
                >
                  <option value="">-- New Client --</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Client Name"
                value={clientDetails.name}
                onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                placeholder="Enter client's name"
              />
              <Input
                label="Email Address"
                type="email"
                value={clientDetails.email}
                onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}
                placeholder="name@example.com"
              />
              <Input
                label="Phone / Momo Number"
                value={clientDetails.phone}
                onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
                placeholder="+233 24 000 0000"
              />
              <Input
                label="Location / Address"
                value={clientDetails.location}
                onChange={(e) => setClientDetails({ ...clientDetails, location: e.target.value })}
                placeholder="Accra, Ghana"
              />
            </div>
          </Card>

          {/* Invoice Settings Card */}
          <Card className="p-6">
            <h3 className="font-black text-lg mb-4">Invoice Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Invoice #"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled={isEditing}
              />
              <Input
                label="Date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={vatEnabled}
                  onChange={(e) => setVatEnabled(e.target.checked)}
                  className="rounded text-primary focus:ring-primary/20 size-5"
                />
                <span className="font-bold text-sm">Enable VAT (15%)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={leviesEnabled}
                  onChange={(e) => setLeviesEnabled(e.target.checked)}
                  className="rounded text-primary focus:ring-primary/20 size-5"
                />
                <span className="font-bold text-sm">Enable Levies (NHIL/GETFund)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={covidLevyEnabled}
                  onChange={(e) => setCovidLevyEnabled(e.target.checked)}
                  className="rounded text-primary focus:ring-primary/20 size-5"
                />
                <span className="font-bold text-sm">Enable COVID-19 Levy (1%)</span>
              </label>
            </div>
          </Card>

          {/* Line Items Card */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg">Line Items</h3>
              <Button onClick={addItem} size="sm" variant="secondary" leftIcon={<span className="material-symbols-outlined">add</span>}>
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 group relative">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200"
                    title="Remove Item"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 sm:col-span-6">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Description</label>
                      <input
                        type="text"
                        placeholder="Item name"
                        className="w-full bg-white border-none rounded-lg p-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Qty</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-white border-none rounded-lg p-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 text-center"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Price</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-white border-none rounded-lg p-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-1 flex items-end justify-end pb-2">
                      <span className="font-black text-sm text-gray-400">
                        {(item.quantity * item.price).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
              <span className="font-bold text-gray-500">Subtotal</span>
              <span className="font-black text-xl">{currency === 'GHS' ? 'GH₵' : currency} {subtotal.toLocaleString()}</span>
            </div>
          </Card>
        </div>

        {/* Preview Column */}
        <div className={`lg:col-span-7 sticky top-8 ${activeView === 'edit' ? 'hidden lg:block' : ''}`}>
          <div className="flex justify-between items-center mb-4 lg:hidden">
            <h3 className="font-black text-lg">Preview</h3>
          </div>

          <div
            ref={previewContainerRef}
            className="w-full overflow-hidden flex justify-start lg:justify-center bg-gray-100/50 dark:bg-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-700 p-4 min-h-[500px]"
          >
            <InvoicePreview
              ref={invoicePreviewRef}
              businessDetails={businessDetails}
              clientDetails={clientDetails}
              invoiceNumber={invoiceNumber}
              date={invoiceDate}
              dueDate={dueDate}
              items={items}
              currency={currency}
              vatEnabled={vatEnabled}
              leviesEnabled={leviesEnabled}
              covidLevyEnabled={covidLevyEnabled}
              subtotal={subtotal}
              vatAmount={vatAmount}
              leviesAmount={leviesAmount}
              covidAmount={covidAmount}
              total={total}
              scale={scale}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <Button
              onClick={handleWhatsAppShare}
              className="bg-accent-green hover:bg-accent-green/90 text-white sm:col-span-2 shadow-xl shadow-green-900/10"
              size="lg"
              leftIcon={<span className="material-symbols-outlined text-lg sm:text-xl">send</span>}
            >
              Send via WhatsApp
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              isLoading={pdfLoading}
              variant="secondary"
              size="lg"
              leftIcon={<span className="material-symbols-outlined text-base sm:text-lg">download</span>}
            >
              Download PDF
            </Button>
            <Button
              onClick={handleEmailClient}
              variant="secondary"
              size="lg"
              leftIcon={<span className="material-symbols-outlined text-base sm:text-lg">mail</span>}
            >
              Email Client
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;
