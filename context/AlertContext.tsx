import React, { createContext, useContext, useState, useCallback } from 'react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertContextType {
    showAlert: (title: string, message: string, type?: AlertType) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) throw new Error('useAlert must be used within AlertProvider');
    return context;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alert, setAlert] = useState<{ title: string; message: string; type: AlertType } | null>(null);

    const showAlert = useCallback((title: string, message: string, type: AlertType = 'info') => {
        setAlert({ title, message, type });
    }, []);

    const hideAlert = useCallback(() => {
        setAlert(null);
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alert && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className={`size-16 mx-auto rounded-full flex items-center justify-center mb-6 ${alert.type === 'success' ? 'bg-green-100 text-green-600' :
                                    alert.type === 'error' ? 'bg-red-100 text-red-600' :
                                        alert.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                            'bg-blue-100 text-blue-600'
                                }`}>
                                <span className="material-symbols-outlined text-3xl">
                                    {alert.type === 'success' ? 'check_circle' :
                                        alert.type === 'error' ? 'error' :
                                            alert.type === 'warning' ? 'warning' :
                                                'info'}
                                </span>
                            </div>
                            <h3 className="text-xl font-black mb-2">{alert.title}</h3>
                            <p className="text-[#667385] dark:text-gray-400 text-sm">{alert.message}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                            <button
                                onClick={hideAlert}
                                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
};
