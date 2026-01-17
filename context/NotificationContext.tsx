
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (message: string, type?: NotificationType) => void;
    unreadCount: number;
    notificationHistory: (Notification & { timestamp: number })[];
    clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within NotificationProvider');
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationHistory, setNotificationHistory] = useState<(Notification & { timestamp: number })[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNotification = { id, message, type };
        const timestamp = Date.now();

        setNotifications(prev => [...prev, newNotification]);
        setNotificationHistory(prev => [{ ...newNotification, timestamp }, ...prev].slice(0, 10)); // Keep last 10
        setUnreadCount(prev => prev + 1);

        // Auto dismiss after 3 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    }, []);

    const clearUnread = useCallback(() => {
        setUnreadCount(0);
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification, unreadCount, notificationHistory, clearUnread }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-3 pointer-events-none">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`
              pointer-events-auto
              min-w-[280px] max-w-sm
              bg-white dark:bg-gray-900 
              rounded-2xl shadow-2xl border 
              p-4 flex items-center gap-4
              animate-in slide-in-from-right-full fade-in duration-300
              ${n.type === 'success' ? 'border-green-100 dark:border-green-900/30' :
                                n.type === 'error' ? 'border-red-100 dark:border-red-900/30' :
                                    n.type === 'warning' ? 'border-amber-100 dark:border-amber-900/30' :
                                        'border-gray-100 dark:border-gray-800'}
            `}
                    >
                        <div className={`
              size-10 rounded-full flex items-center justify-center shrink-0
              ${n.type === 'success' ? 'bg-green-100 text-green-600' :
                                n.type === 'error' ? 'bg-red-100 text-red-600' :
                                    n.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                        'bg-blue-100 text-blue-600'}
            `}>
                            <span className="material-symbols-outlined text-xl">
                                {n.type === 'success' ? 'check_circle' :
                                    n.type === 'error' ? 'error' :
                                        n.type === 'warning' ? 'warning' :
                                            'info'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{n.message}</p>
                        </div>
                        <button
                            onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
