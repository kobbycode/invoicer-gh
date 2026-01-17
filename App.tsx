
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import ViewInvoice from './pages/ViewInvoice';
import Clients from './pages/Clients';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { NotificationProvider } from './context/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoutes = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return currentUser ? (
    <Layout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<CreateInvoice />} />
        <Route path="invoices/:id" element={<ViewInvoice />} />
        <Route path="invoices/:id/edit" element={<CreateInvoice />} />
        <Route path="clients" element={<Clients />} />
        <Route path="payments" element={<Payments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AlertProvider>
        <NotificationProvider>
          <AuthProvider>
            <HashRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={<ProtectedRoutes />} />
              </Routes>
            </HashRouter>
          </AuthProvider>
        </NotificationProvider>
      </AlertProvider>
    </QueryClientProvider>
  );
};

export default App;
