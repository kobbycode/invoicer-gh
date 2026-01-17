import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useNotification } from '../context/NotificationContext';
import { updateUserProfile } from '../services/userService';
import { Skeleton } from '../components/ui/Skeleton';

const Settings: React.FC = () => {
  const { currentUser, userProfile, profileError, loading } = useAuth();
  const { showAlert } = useAlert();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    momoNetwork: 'MTN MOMO',
    momoNumber: '',
    tin: '',
    logoUrl: '',
    preferences: {
      defaultCurrency: 'GHS',
      defaultTaxRate: 15,
      invoicePrefix: 'INV-',
      autoSave: true
    }
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        address: userProfile.address || '',
        momoNetwork: userProfile.momoNetwork || 'MTN MOMO',
        momoNumber: userProfile.momoNumber || '',
        tin: userProfile.tin || '',
        logoUrl: userProfile.logoUrl || '',
        preferences: userProfile.preferences || {
          defaultCurrency: 'GHS',
          defaultTaxRate: 15,
          invoicePrefix: 'INV-',
          autoSave: true
        }
      });
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setFormData(prev => ({ ...prev, logoUrl: ev.target.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (profileError) {
      showAlert('Error', `Cannot save settings: ${profileError}`, 'error');
      return;
    }
    if (!currentUser) {
      showAlert('Error', 'You must be logged in to save settings.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, formData);
      showNotification('Settings saved successfully!', 'success');
    } catch (error: any) {
      console.error("Error saving settings:", error);
      showAlert('Error', `Failed to save settings: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full overflow-x-hidden max-w-full">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-10 pb-20 max-w-full">
          <aside className="w-full lg:w-64 space-y-3 sm:space-y-4 lg:space-y-6 min-w-0 shrink-0">
            <Card className="p-3 sm:p-4 lg:p-6">
              <div className="mb-4 sm:mb-6 space-y-2">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <div className="flex lg:flex-col gap-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            </Card>
          </aside>
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 rounded" />
              <Skeleton className="h-4 w-96 rounded" />
            </div>
            <Card>
              <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 w-40 rounded" />
              </div>
              <div className="space-y-6">
                <div className="flex gap-6">
                  <Skeleton className="size-24 rounded-3xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="h-3 w-48 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden max-w-full">
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-10 pb-20 max-w-full">
        <aside className="w-full lg:w-64 space-y-3 sm:space-y-4 lg:space-y-6 min-w-0 shrink-0">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-base sm:text-lg font-black tracking-tight">Settings</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure your workspace</p>
            </div>

            {/* Refined Mobile Tab Nav - Pill Style */}
            <nav className="flex lg:flex-col gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar lg:overflow-x-visible -mx-1 sm:mx-0 px-1 sm:px-0">
              <div className="flex lg:flex-col gap-1.5 sm:gap-2 lg:min-w-0 lg:w-full">
                {[
                  { id: 'business', icon: 'store', label: 'Business' },
                  { id: 'payments', icon: 'payments', label: 'Payments' },
                  { id: 'tax', icon: 'description', label: 'Tax' },
                  { id: 'preferences', icon: 'settings', label: 'Prefs' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 lg:w-full flex items-center justify-center lg:justify-start gap-1.5 sm:gap-2 lg:gap-3 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 rounded-full lg:rounded-xl font-bold text-[9px] sm:text-[10px] lg:text-xs transition-all whitespace-nowrap ${activeTab === tab.id
                      ? 'bg-primary text-white lg:bg-primary/10 lg:text-primary lg:border-l-4 lg:border-primary shadow-md lg:shadow-none'
                      : 'text-gray-500 bg-gray-50 dark:bg-gray-900 lg:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                      }`}
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base lg:text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
          <div className="hidden lg:block bg-primary/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-primary/10">
            <p className="text-[10px] sm:text-xs font-black text-primary mb-2 uppercase tracking-widest">Need help?</p>
            <p className="text-[10px] sm:text-xs text-gray-500 mb-4 leading-relaxed font-semibold">Check out our guide for setting up GRA-compliant invoices.</p>
            <Button className="w-full py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-black uppercase rounded-lg shadow-sm">View Guide</Button>
          </div>
        </aside>

        <div className="flex-1 space-y-3 sm:space-y-4 lg:space-y-8 min-w-0">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black tracking-tight break-words">{
              activeTab === 'business' ? 'Business Settings' :
                activeTab === 'payments' ? 'Payment Methods' :
                  activeTab === 'tax' ? 'Tax & Compliance' : 'App Preferences'
            }</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 break-words">
              {activeTab === 'preferences' && "Customize how the app behaves and calculates totals."}
            </p>
          </div>

          {activeTab === 'business' && (
            <Card>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <span className="material-symbols-outlined text-primary text-base sm:text-lg lg:text-xl">badge</span>
                <h3 className="font-black text-xs sm:text-sm lg:text-base">Business Profile</h3>
              </div>
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 lg:gap-8 text-center sm:text-left">
                  <div className="size-20 sm:size-24 lg:size-32 rounded-2xl sm:rounded-3xl bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center group cursor-pointer overflow-hidden relative shadow-inner">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400 group-hover:scale-110 transition-transform text-xl sm:text-2xl">add_a_photo</span>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div>
                    <h4 className="font-black mb-1 text-xs sm:text-sm lg:text-base">Business Logo</h4>
                    <p className="text-[9px] sm:text-[10px] lg:text-xs text-gray-500 font-semibold max-w-[200px] sm:max-w-none">Best: 512x512px. PNG or JPG.</p>
                    <div className="flex gap-3 sm:gap-4 justify-center sm:justify-start mt-2 sm:mt-3">
                      <label className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline">Change Logo</label>
                      {formData.logoUrl && (
                        <button onClick={() => setFormData({ ...formData, logoUrl: '' })} className="text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Remove</button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  <Input
                    label="Business Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Koforidua Creative Hub"
                    className="sm:col-span-1"
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="billing@kofcreative.gh"
                    className="sm:col-span-1"
                  />
                  <div className="sm:col-span-2 space-y-1.5">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Office Address</span>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-[#dce0e4] bg-white dark:bg-gray-800 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rows-2"
                      placeholder="Block 4, Industrial Area, Koforidua, Eastern Region, Ghana"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'payments' && (
            <Card>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg sm:text-xl">account_balance_wallet</span>
                  <h3 className="font-black text-sm sm:text-base">Mobile Money (MoMo)</h3>
                </div>
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-green-50 border border-green-100 rounded-full">
                  <div className="size-1.5 sm:size-2 rounded-full bg-green-600 animate-pulse"></div>
                  <span className="text-[8px] sm:text-[9px] font-black text-green-600 uppercase tracking-widest">Verified</span>
                </div>
              </div>
              <div className="space-y-6 sm:space-y-8">
                <div className="flex flex-col gap-6 sm:gap-8">
                  <div className="flex-1 space-y-4 sm:space-y-6">
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Network Provider</span>
                      <select
                        name="momoNetwork"
                        value={formData.momoNetwork}
                        onChange={handleChange}
                        className="w-full h-11 rounded-xl border-[#dce0e4] bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold"
                      >
                        <option>MTN MOMO</option>
                        <option>Telecel Cash</option>
                        <option>Airtel Tigo Money</option>
                      </select>
                    </div>
                    <Input
                      label="MoMo Number"
                      name="momoNumber"
                      value={formData.momoNumber}
                      onChange={handleChange}
                      placeholder="24 123 4567"
                    />
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="size-16 sm:size-20 bg-white dark:bg-gray-800 p-2 rounded-xl sm:rounded-2xl shadow-sm mb-3 sm:mb-4">
                      <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-base sm:text-lg">QR</div>
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Direct MoMo Link Activated</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold max-w-[200px] sm:max-w-none">Clients can pay directly to your number from the invoice.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'tax' && (
            <Card>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <span className="material-symbols-outlined text-primary text-lg sm:text-xl">gavel</span>
                <h3 className="font-black text-sm sm:text-base">Tax & Compliance</h3>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-1.5">
                  <Input
                    label="Tax Identification Number (TIN)"
                    name="tin"
                    value={formData.tin}
                    onChange={handleChange}
                    placeholder="P0012345678"
                    className="font-mono uppercase"
                  />
                  <p className="text-[8px] sm:text-[9px] text-gray-400 italic font-bold">This will appear on all your invoices.</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <span className="material-symbols-outlined text-primary text-lg sm:text-xl">settings_applications</span>
                <h3 className="font-black text-sm sm:text-base">App Preferences</h3>
              </div>
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  <div className="space-y-1.5 sm:col-span-1">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Default Currency</span>
                    <select
                      value={formData.preferences.defaultCurrency}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, defaultCurrency: e.target.value }
                      })}
                      className="w-full h-11 rounded-xl border-[#dce0e4] bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold"
                    >
                      <option value="GHS">GHS (₵) - Ghana Cedi</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <Input
                      label="Default VAT Rate (%)"
                      type="number"
                      value={formData.preferences.defaultTaxRate}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, defaultTaxRate: Number(e.target.value) }
                      })}
                      placeholder="15"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <Input
                      label="Invoice Number Prefix"
                      type="text"
                      value={formData.preferences.invoicePrefix}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, invoicePrefix: e.target.value }
                      })}
                      placeholder="INV-"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 sm:col-span-1 sm:mt-0 mt-2">
                    <div>
                      <p className="text-xs sm:text-sm font-black">Auto-save Drafts</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Save invoices as you type</p>
                    </div>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, autoSave: !formData.preferences.autoSave }
                      })}
                      className={`size-10 sm:size-12 rounded-xl flex items-center justify-center transition-all ${formData.preferences.autoSave ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-200 text-gray-400'}`}
                    >
                      <span className="material-symbols-outlined text-lg sm:text-xl">{formData.preferences.autoSave ? 'toggle_on' : 'toggle_off'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 lg:gap-4 pb-12">
            <Button variant="ghost" className="text-gray-400 hover:text-gray-600">Discard Changes</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              isLoading={saving}
              size="lg"
              className="sm:w-auto w-full"
            >
              Save All Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
