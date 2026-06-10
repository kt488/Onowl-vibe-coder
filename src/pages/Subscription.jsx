import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Check, ArrowLeft, Loader2, X, Zap, Rocket, Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANS = [
  { name: 'free', label: 'Free', price: '₹0', tokens: 10, downloads: false, icon: <Zap className="w-5 h-5 text-yellow-400" /> },
  { name: 'pro', label: 'Pro', price: '₹50/mo', tokens: 500, downloads: true, icon: <Rocket className="w-5 h-5 text-primary" /> },
  { name: 'premium', label: 'Premium', price: '₹100/mo', tokens: 2000, downloads: true, icon: <Shield className="w-5 h-5 text-purple-400" /> },
  { name: 'business', label: 'Business', price: '₹500/mo', tokens: 'Unlimited', downloads: true, icon: <Users className="w-5 h-5 text-green-400" /> },
];

const Subscription = () => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
      if (data) setCurrentPlan(data.plan);
      setLoading(false);
    };
    fetchPlan();
  }, [navigate]);

  const handleSubscribe = (planName) => {
    if (!user) return;
    const selectedPlan = PLANS.find(p => p.name === planName);
    const numericPrice = selectedPlan ? parseInt(selectedPlan.price.replace(/[^0-9]/g, ''), 10) || 0 : 0;
    
    navigate('/payment', { state: { plan: { name: selectedPlan.label, price: numericPrice } } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white py-20 px-4 relative overflow-hidden">
      {/* Background Glowing Blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-6 p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white">Your Subscription</h1>
              <p className="text-gray-400">Manage your plan and usage</p>
            </div>
          </div>
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 self-start md:self-auto">
            <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Current Plan:</span>
            <span className="text-primary font-black uppercase text-lg">{currentPlan}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <motion.div 
              key={plan.name} 
              whileHover={{ y: -5 }}
              className={`relative backdrop-blur-xl bg-white/5 rounded-3xl p-8 border-2 transition-all flex flex-col ${
                currentPlan === plan.name 
                ? 'border-primary shadow-[0_0_30px_rgba(99,102,241,0.2)]' 
                : 'border-white/10 hover:border-white/20'
              }`}
            >
              {currentPlan === plan.name && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                  Active
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{plan.label}</h3>
              </div>
              
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-white">{plan.price}</span>
              </div>
              
              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center text-sm text-gray-300">
                  <div className="bg-primary/20 rounded-full p-0.5 mr-3 shrink-0"><Check className="w-3 h-3 text-primary" /></div>
                  {plan.tokens} Tokens / day
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  {plan.downloads ? (
                    <div className="bg-primary/20 rounded-full p-0.5 mr-3 shrink-0"><Check className="w-3 h-3 text-primary" /></div>
                  ) : (
                    <div className="bg-white/10 rounded-full p-0.5 mr-3 shrink-0"><X className="w-3 h-3 text-gray-500" /></div>
                  )}
                  {plan.downloads ? 'Download Access' : 'No Downloads'}
                </div>
              </div>
              
              <button
                onClick={() => handleSubscribe(plan.name)}
                disabled={currentPlan === plan.name || updating}
                className={`w-full py-4 px-4 rounded-2xl font-black text-sm transition-all ${
                  currentPlan === plan.name 
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                }`}
              >
                {updating && currentPlan !== plan.name ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (currentPlan === plan.name ? 'Active' : 'Upgrade Plan')}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscription;
