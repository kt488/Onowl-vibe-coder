import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Landing from './pages/Landing';
import IDE from './pages/IDE';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import CreateWebsite from './pages/CreateWebsite';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import ContactUs from './pages/ContactUs';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import UPIPayment from './pages/UPIPayment';
import Terms from './pages/Terms';
import Pricing from './pages/Pricing';

import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Protected Routes */}
            <Route path="/create" element={<ProtectedRoute><CreateWebsite /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/ide" element={<ProtectedRoute><IDE /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            <Route path="/upi-payment" element={<ProtectedRoute><UPIPayment /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
        </ErrorBoundary>
        </>
        );
        }

export default App;