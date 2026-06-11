import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle2, ChevronLeft, ShieldCheck, QrCode } from 'lucide-react';

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: 'GPay', color: 'bg-[#4285F4]/20 border-[#4285F4]/50 text-[#4285F4]', activeColor: 'bg-[#4285F4] text-white' },
  { id: 'phonepe', name: 'PhonePe', icon: 'PPe', color: 'bg-[#5f259f]/20 border-[#5f259f]/50 text-[#5f259f]', activeColor: 'bg-[#5f259f] text-white' },
  { id: 'paytm', name: 'Paytm', icon: 'Paytm', color: 'bg-[#00b9f1]/20 border-[#00b9f1]/50 text-[#00b9f1]', activeColor: 'bg-[#00b9f1] text-white' },
  { id: 'amazon', name: 'Amazon', icon: 'Pay', color: 'bg-[#ff9900]/20 border-[#ff9900]/50 text-[#ff9900]', activeColor: 'bg-[#ff9900] text-white' },
  { id: 'bhim', name: 'BHIM', icon: 'BHIM', color: 'bg-[#008100]/20 border-[#008100]/50 text-[#008100]', activeColor: 'bg-[#008100] text-white' },
  { id: 'other', name: 'Other UPI', icon: '@', color: 'bg-primary/20 border-primary/50 text-primary', activeColor: 'bg-primary text-white' },
];

const UPIPayment = () => {
  const [selectedApp, setSelectedApp] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get amount from navigation state or default to 0
  const amount = location.state?.amount || '0.00';
  const planName = location.state?.planName || 'Subscription';

  const handleAppSelect = (appId) => {
    setSelectedApp(appId);
    if (appId !== 'other') {
      // Simulate auto-filling or redirecting for installed apps
      setUpiId('');
    }
  };

  const MERCHANT_UPI_ID = '8448502537@sbi'; // Actual merchant UPI ID
  const MERCHANT_NAME = 'OnOwl';

  const handlePay = (e) => {
    e.preventDefault();
    if (!selectedApp) {
      alert('Please select a payment method');
      return;
    }
    
    if (selectedApp === 'other' && !upiId.includes('@')) {
      alert('Please enter a valid UPI ID');
      return;
    }

    setIsProcessing(true);
    
    // Generate UPI Deep Link
    const params = `pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&cu=INR`;
    let upiUrl = '';

    switch(selectedApp) {
      case 'gpay':
        upiUrl = `tez://upi/pay?${params}`;
        break;
      case 'phonepe':
        upiUrl = `phonepe://pay?${params}`;
        break;
      case 'paytm':
        upiUrl = `paytmmp://pay?${params}`;
        break;
      case 'amazon':
        upiUrl = `amzn://upi/pay?${params}`;
        break;
      case 'bhim':
        upiUrl = `bhim://pay?${params}`;
        break;
      case 'other':
      default:
        upiUrl = `upi://pay?${params}`;
        break;
    }

    // Redirect user to the chosen UPI app
    window.location.href = upiUrl;

    // Simulate processing state while user is in the other app.
    // In a real production app, you would poll your backend here to check if the payment succeeded.
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/dashboard'); 
      }, 2000);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background gradients for modern glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl z-10"
      >
        {/* Header/Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>

        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-border/50 relative">
          
          {/* Top highlight bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
          
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Checkout</h1>
                <p className="text-gray-400 text-sm flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-green-400" />
                  100% Secure Payment
                </p>
              </div>
              <div className="text-right bg-surface/50 border border-border p-3 rounded-2xl">
                <p className="text-xs text-gray-400 mb-1">{planName}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  <span className="text-primary mr-1">₹</span>{amount}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {paymentSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/50">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                  <p className="text-gray-400">Redirecting to your dashboard...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
                      <Smartphone className="w-5 h-5 mr-2 text-primary" />
                      Select UPI App
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      {UPI_APPS.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => handleAppSelect(app.id)}
                          className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 group
                            ${selectedApp === app.id 
                              ? `${app.activeColor} border-transparent shadow-lg shadow-black/20 scale-[1.02]` 
                              : `bg-surface/30 border-border hover:bg-surface/80 hover:border-gray-600`
                            }
                          `}
                        >
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base border mb-2 transition-colors
                            ${selectedApp === app.id ? 'bg-white/20 border-white/30 text-white' : app.color}
                          `}>
                            {app.icon}
                          </div>
                          <span className={`text-xs sm:text-sm font-medium ${selectedApp === app.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            {app.name}
                          </span>
                          
                          {selectedApp === app.id && (
                            <motion.div 
                              layoutId="active-indicator"
                              className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedApp === 'other' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                      >
                        <label htmlFor="upiId" className="block text-sm font-medium text-gray-400 mb-2">
                          Enter your UPI ID
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="upiId"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 sm:py-4 rounded-xl bg-surface/50 border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white placeholder-gray-600 transition-all"
                            placeholder="username@upi"
                            autoComplete="off"
                          />
                          <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handlePay}
                    disabled={isProcessing || !selectedApp || (selectedApp === 'other' && !upiId)}
                    className="relative w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden group mt-4"
                  >
                    <span className={`flex items-center justify-center ${isProcessing ? 'opacity-0' : 'opacity-100'}`}>
                      {selectedApp && selectedApp !== 'other' 
                        ? `Pay with ${UPI_APPS.find(a => a.id === selectedApp)?.name}`
                        : 'Proceed to Pay'
                      }
                    </span>
                    
                    {isProcessing && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    )}
                    
                    {/* Button hover effect */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  </button>
                  
                  <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                      By proceeding, you agree to our Terms & Conditions and Privacy Policy.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}} />
    </div>
  );
};

export default UPIPayment;
