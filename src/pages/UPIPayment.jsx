import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const UPIPayment = () => {
  console.log('UPIPayment component rendered');
  const [upiId, setUpiId] = useState('8448502537');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get amount from navigation state or default to 0
  const amount = location.state?.amount || '0.00';
  const planName = location.state?.planName || 'Subscription';

  const handlePay = (e) => {
    e.preventDefault();
    console.log(`Processing payment of ${amount} for UPI ID: ${upiId}`);
    // Add actual payment processing logic here
    alert('Payment initiated!');
  };

  return (
    <div className="min-h-screen bg-[#fffdf5] flex items-center justify-center p-4">
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/20 backdrop-blur-lg border border-white/30 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-[#333333] mb-6">Complete Payment</h2>
        
        <div className="mb-6 text-[#333333]">
          <p className="text-sm opacity-70">Plan: {planName}</p>
          <p className="text-4xl font-bold mt-1">₹{amount}</p>
        </div>

        <form onSubmit={handlePay} className="space-y-4">
          <div>
            <label htmlFor="upiId" className="block text-sm font-medium text-[#333333] mb-1">
              Enter UPI ID
            </label>
            <input
              type="text"
              id="upiId"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#333333]/20 text-[#333333]"
              placeholder="username@upi"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-[#333333] text-[#fffdf5] font-bold text-lg hover:bg-[#333333]/90 transition-colors shadow-lg"
          >
            Pay Now
          </button>
        </form>
      </div>
    </div>
  );
};

export default UPIPayment;
