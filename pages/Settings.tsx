
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useNotification } from '../context/NotificationContext';
import { updateUserProfile } from '../services/userService';

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

  if (loading) return <div className="p-10 text-center">Loading settings...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 pb-20">
      <aside className="w-full lg:w-64 space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="mb-6 hidden lg:block">
            <h1 className="text-lg font-black tracking-tight">Settings</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configure your workspace</p>
          </div>

          {/* Refined Mobile Tab Nav - Pill Style */}
          <nav className="flex lg:flex-col overflow-x-auto no-scrollbar gap-2 -mx-2 px-2 lg:mx-0 lg:px-0">
            {[
              { id: 'business', icon: 'store', label: 'Business' },
              { id: 'payments', icon: 'payments', label: 'Payments' },
              { id: 'tax', icon: 'description', label: 'Tax' },
              { id: 'preferences', icon: 'settings', label: 'Prefs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-none lg:w-full flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-4 lg:px-4 py-2 lg:py-3 rounded-full lg:rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-primary text-white lg:bg-primary/10 lg:text-primary lg:border-l-4 lg:border-primary shadow-md lg:shadow-none'
                  : 'text-gray-500 bg-gray-50 dark:bg-gray-900 lg:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                <span className="hidden sm:inline lg:inline">{tab.label}</span>
                <span className="sm:hidden lg:hidden">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="hidden lg:block bg-primary/5 p-6 rounded-2xl border border-primary/10">
          <p className="text-xs font-black text-primary mb-2 uppercase tracking-widest">Need help?</p>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed font-semibold">Check out our guide for setting up GRA-compliant invoices.</p>
          <button className="w-full py-2.5 bg-primary text-white text-[11px] font-black uppercase rounded-lg shadow-sm">View Guide</button>
        </div>
      </aside>

      <div className="flex-1 space-y-6 sm:space-y-8">
        <div className="px-1 sm:px-0">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{
            activeTab === 'business' ? 'Business Settings' :
              activeTab === 'payments' ? 'Payment Methods' :
                activeTab === 'tax' ? 'Tax & Compliance' : 'App Preferences'
          }</h2>
          <p className="text-gray-500 text-sm sm:base mt-1">
            {activeTab === 'business' && "Manage your Ghanaian business profile and local identity."}
            {activeTab === 'payments' && "Setup your MoMo networks for direct invoice payments."}
            {activeTab === 'tax' && "Configure GRA compliance and tax identification."}
            {activeTab === 'preferences' && "Customize how the app behaves and calculates totals."}
          </p>
        </div>

        {activeTab === 'business' && (
          <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              <h3 className="font-black">Business Profile</h3>
            </div>
            <div className="p-6 sm:p-8 space-y-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left">
                <div className="size-24 sm:size-32 rounded-3xl bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center group cursor-pointer overflow-hidden relative shadow-inner">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-gray-400 group-hover:scale-110 transition-transform text-2xl">add_a_photo</span>
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div>
                  <h4 className="font-black mb-1 text-sm sm:text-base">Business Logo</h4>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-semibold max-w-[200px] sm:max-w-none">Best: 512x512px. PNG or JPG.</p>
                  <div className="flex gap-4 justify-center sm:justify-start">
                    <label className="mt-3 text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline">Change Logo</label>
                    {formData.logoUrl && (
                      <button onClick={() => setFormData({ ...formData, logoUrl: '' })} className="mt-3 text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Remove</button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Business Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 h-12 rounded-xl border-gray-100 bg-gray-50 text-sm focus:ring-primary focus:border-primary"
                    type="text"
                    placeholder="e.g. Koforidua Creative Hub"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 h-12 rounded-xl border-gray-100 bg-gray-50 text-sm focus:ring-primary focus:border-primary"
                    type="email"
                    placeholder="billing@kofcreative.gh"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Office Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-gray-100 bg-gray-50 text-sm focus:ring-primary focus:border-primary"
                    rows={2}
                    placeholder="Block 4, Industrial Area, Koforidua, Eastern Region, Ghana"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'payments' && (
          <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600">account_balance_wallet</span>
                <h3 className="font-black">Mobile Money (MoMo)</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full">
                <div className="size-2 rounded-full bg-green-600 animate-pulse"></div>
                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Verified</span>
              </div>
            </div>
            <div className="p-6 sm:p-8 space-y-8">
              <div className="flex flex-col gap-8">
                <div className="flex-1 space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Network Provider</label>
                    <select
                      name="momoNetwork"
                      value={formData.momoNetwork}
                      onChange={handleChange}
                      className="w-full px-4 h-12 rounded-xl border-gray-100 bg-gray-50 dark:bg-gray-900 text-sm font-bold"
                    >
                      <option>MTN MOMO</option>
                      <option>Telecel Cash</option>
                      <option>Airtel Tigo Money</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MoMo Number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">+233</span>
                      <input
                        name="momoNumber"
                        value={formData.momoNumber}
                        onChange={handleChange}
                        className="w-full pl-16 pr-4 h-12 rounded-xl border-gray-100 bg-gray-50 dark:bg-gray-900 text-sm font-bold"
                        type="text"
                        placeholder="24 123 4567"
                      />
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                  <div className="size-20 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm mb-4">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-white font-black text-lg">QR</div>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Direct MoMo Link Activated</p>
                  <p className="text-[10px] text-gray-400 font-bold max-w-[200px]">Clients can pay directly to your number from the invoice.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'tax' && (
          <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">gavel</span>
              <h3 className="font-black">Tax & Compliance</h3>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax Identification Number (TIN)</label>
                <input
                  name="tin"
                  value={formData.tin}
                  onChange={handleChange}
                  className="w-full px-4 h-12 rounded-xl border-gray-100 bg-gray-50 text-sm focus:ring-primary focus:border-primary font-mono font-bold uppercase"
                  type="text"
                  placeholder="P0012345678"
                />
                <p className="text-[9px] text-gray-400 italic font-bold">This will appear on all your invoices.</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'preferences' && (
          <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">settings_applications</span>
              <h3 className="font-black">App Preferences</h3>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Default Currency</label>
                  <select
                    value={formData.preferences.defaultCurrency}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, defaultCurrency: e.target.value }
                    })}
                    className="w-full px-4 h-12 rounded-xl border-gray-100 bg-gray-50 text-sm font-bold"
                  >
                    <option value="GHS">GHS (₵) - Ghana Cedi</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Default VAT Rate (%)</label>
                  <input
                    type="number"
                    value={formData.preferences.defaultTaxRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, defaultTaxRate: Number(e.target.value) }
                    })}
                    className="w-full px-4 h-12 rounded-xl border-gray-100 bg-gray-50 text-sm font-bold"
                    placeholder="15"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Number Prefix</label>
                  <input
                    type="text"
                    value={formData.preferences.invoicePrefix}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, invoicePrefix: e.target.value }
                    })}
                    className="w-full px-4 h-12 rounded-xl border-gray-100 bg-gray-50 text-sm font-bold"
                    placeholder="INV-"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                  <div>
                    <p className="text-sm font-black">Auto-save Drafts</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Save invoices as you type</p>
                  </div>
                  <button
                    onClick={() => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, autoSave: !formData.preferences.autoSave }
                    })}
                    className={`size-12 rounded-xl flex items-center justify-center transition-all ${formData.preferences.autoSave ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-200 text-gray-400'}`}
                  >
                    <span className="material-symbols-outlined">{formData.preferences.autoSave ? 'toggle_on' : 'toggle_off'}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 pb-12">
          <button className="w-full sm:w-auto px-6 py-3 text-[10px] sm:text-sm font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Discard Changes</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-10 py-3.5 bg-primary text-white text-[10px] sm:text-sm font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {saving ? 'Syncing...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
