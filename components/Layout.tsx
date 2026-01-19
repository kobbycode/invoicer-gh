
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const isGuest = currentUser?.isAnonymous || false;
  const { unreadCount, notificationHistory, clearUnread } = useNotification();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Invoices', path: '/invoices', icon: 'description' },
    { name: 'Clients', path: '/clients', icon: 'group' },
    { name: 'Payments', path: '/payments', icon: 'account_balance_wallet' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-[#1a212c] border-r border-[#dce0e4] dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="size-10 rounded-lg overflow-hidden border border-[#dce0e4] dark:border-gray-700">
                <img src="/logo.jpg" alt="KVoice Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-black text-primary dark:text-blue-400 tracking-tighter">KVoice</h1>
            </div>
            <p className="text-[#667385] dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest px-1">Freelancer Pro</p>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 border-r-4 border-primary'
                    : 'text-[#667385] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="p-6 mt-auto">
            <button
              onClick={() => navigate('/invoices/new')}
              className="w-full bg-primary hover:bg-blue-800 text-white rounded-xl py-3.5 px-4 font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              New Invoice
            </button>
            <button
              onClick={handleLogout}
              className="w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-3.5 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-[#1a212c]/80 backdrop-blur-md border-b border-[#dce0e4] dark:border-gray-700 sticky top-0 z-20 px-4 lg:px-10 flex items-center justify-between">
          <button className="lg:hidden p-2 text-primary" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#667385]">search</span>
              <input
                className="w-full bg-[#f1f2f4] dark:bg-gray-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Search invoices, clients..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-l border-[#dce0e4] dark:border-gray-700 pl-6 relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) clearUnread();
                }}
                className="relative p-2 text-[#667385] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 min-w-[14px] h-[14px] px-1 bg-red-500 rounded-full border-2 border-white dark:border-[#1a212c] text-[8px] font-black text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 z-50">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h4 className="font-black text-sm">Notifications</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Activity</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notificationHistory.length > 0 ? (
                      notificationHistory.map((n) => (
                        <div key={n.id} className="p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex gap-3 items-start">
                          <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'success' ? 'bg-green-100 text-green-600' :
                            n.type === 'error' ? 'bg-red-100 text-red-600' :
                              n.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                            <span className="material-symbols-outlined text-base">
                              {n.type === 'success' ? 'check_circle' :
                                n.type === 'error' ? 'error' :
                                  n.type === 'warning' ? 'warning' :
                                    'info'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{n.message}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-20">notifications_off</span>
                        <p className="text-xs font-bold">No recent notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="hidden lg:block text-right">
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-sm font-bold">{userProfile?.name || 'User'}</p>
                    {isGuest && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-widest">Guest</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#667385] uppercase font-bold tracking-tighter">
                    {isGuest ? 'Limited Access' : (userProfile?.email || 'KVoice User')}
                  </p>
                </div>
                <div className={`size-10 rounded-full ${isGuest ? 'bg-amber-100 border-2 border-amber-200 text-amber-700' : 'bg-primary/10 border-2 border-primary/20 text-primary'} flex items-center justify-center font-black`}>
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-2 sm:p-4 lg:p-10 max-w-7xl mx-auto w-full pb-24 lg:pb-10 overflow-x-hidden">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a212c] border-t border-[#dce0e4] dark:border-gray-700 px-6 py-3 flex justify-between items-center z-40 backdrop-blur-lg bg-white/90">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`
              }
            >
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.name}</span>
            </NavLink>
          ))}
          <button
            onClick={() => navigate('/invoices/new')}
            className="size-12 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center -mt-10 border-4 border-white dark:border-[#1a212c] active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
