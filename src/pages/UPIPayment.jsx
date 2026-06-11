import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Copy, Check, QrCode } from 'lucide-react';
import { supabase } from '../utils/supabase';

const UPIPayment = () => {
  const [utr, setUpiUtr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const amount = location.state?.amount || '0.00';
  const planName = location.state?.planName || 'Subscription';

  const MERCHANT_UPI_ID = '8448502537@sbi';
  const MERCHANT_NAME = 'OnOwl';

  const handleCopy = () => {
    navigator.clipboard.writeText(MERCHANT_UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUpiApp = () => {
    const params = `pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&cu=INR`;
    window.location.href = `upi://pay?${params}`;
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!utr || utr.length < 12) {
      alert('Please enter a valid 12-digit UTR/Reference Number');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('You must be logged in to submit a payment.');
        setIsProcessing(false);
        return;
      }

      // Backend route /api/payments needs fixing to handle auth properly.
      // But we can also just insert into Supabase directly if RLS allows, 
      // or we hit the backend with the token.
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plan_name: planName,
          amount: amount,
          utr: utr
        })
      });

      const result = await response.json();
      
      if (response.ok || result.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          navigate('/dashboard'); 
        }, 3000);
      } else {
        alert(`Error: ${result.error || 'Failed to submit payment'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>

        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-border/50 relative">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
          
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Checkout</h1>
                <p className="text-gray-400 text-sm flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-green-400" />
                  Secure UPI Payment
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">{planName}</p>
                <p className="text-3xl font-bold text-white tracking-tight">
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
                    <Check className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Payment Submitted!</h3>
                  <p className="text-gray-400 text-sm">We are verifying your payment.<br/>Redirecting to your dashboard...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  
                  {/* UPI ID Bar */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Pay to this UPI ID
                    </label>
                    <div className="flex items-center justify-between bg-black/40 border border-border rounded-xl p-3">
                      <span className="text-white font-mono text-sm tracking-wide">{MERCHANT_UPI_ID}</span>
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenUpiApp}
                    className="w-full py-3.5 mb-6 rounded-xl border border-primary/50 text-primary font-bold text-sm hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-5 h-5" />
                    Open any UPI App
                  </button>

                  <div className="relative flex items-center py-2 mb-6">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase tracking-wider">After Payment</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  {/* UTR Input */}
                  <div className="mb-6">
                    <label htmlFor="utr" className="block text-sm font-medium text-gray-400 mb-2">
                      Enter 12-digit UTR / Reference No.
                    </label>
                    <input
                      type="text"
                      id="utr"
                      value={utr}
                      onChange={(e) => setUpiUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      className="w-full px-4 py-3 sm:py-4 rounded-xl bg-surface/50 border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white placeholder-gray-600 transition-all font-mono"
                      placeholder="e.g. 312345678901"
                      autoComplete="off"
                      maxLength={12}
                    />
                  </div>

                  <button
                    onClick={handleSubmitPayment}
                    disabled={isProcessing || utr.length !== 12}
                    className="relative w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden group"
                  >
                    <span className={`flex items-center justify-center ${isProcessing ? 'opacity-0' : 'opacity-100'}`}>
                      Submit Payment Details
                    </span>
                    
                    {isProcessing && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    )}
                    
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  </button>
                  
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
