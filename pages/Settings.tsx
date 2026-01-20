
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
    logoUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        address: userProfile.address || '',
        logoUrl: userProfile.logoUrl || '',
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
              { id: 'business', icon: 'store', label: 'Business' }
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
          <button className="w-full py-2 sm:py-2.5 bg-primary text-white text-[10px] sm:text-[11px] font-black uppercase rounded-lg shadow-sm">View Guide</button>
        </div>
      </aside>

        <div className="flex-1 space-y-3 sm:space-y-4 lg:space-y-8 min-w-0">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black tracking-tight break-words">Business Settings</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 break-words">Manage your Ghanaian business profile and local identity.</p>
        </div>

        {activeTab === 'business' && (
          <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
            <div className="p-3 sm:p-4 lg:p-6 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base sm:text-lg lg:text-xl">badge</span>
              <h3 className="font-black text-xs sm:text-sm lg:text-base">Business Profile</h3>
            </div>
            <div className="p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
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
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Business Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 h-10 sm:h-12 rounded-xl border-gray-100 bg-gray-50 text-xs sm:text-sm focus:ring-primary focus:border-primary"
                    type="text"
                    placeholder="e.g. Koforidua Creative Hub"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 h-10 sm:h-12 rounded-xl border-gray-100 bg-gray-50 text-xs sm:text-sm focus:ring-primary focus:border-primary"
                    type="email"
                    placeholder="billing@kofcreative.gh"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Office Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-gray-100 bg-gray-50 text-xs sm:text-sm focus:ring-primary focus:border-primary"
                    rows={2}
                    placeholder="Block 4, Industrial Area, Koforidua, Eastern Region, Ghana"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 lg:gap-4 pb-12">
          <button className="w-full sm:w-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-[8px] sm:text-[9px] lg:text-[10px] xl:text-sm font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors rounded-xl">Discard Changes</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-4 sm:px-6 lg:px-10 py-2.5 sm:py-3 lg:py-3.5 bg-primary text-white text-[8px] sm:text-[9px] lg:text-[10px] xl:text-sm font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {saving ? 'Syncing...' : 'Save All Changes'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
