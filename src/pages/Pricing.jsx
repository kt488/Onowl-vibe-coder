import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check, Star, ChevronDown, ChevronUp, Zap, Shield, Rocket, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const plans = [
  { 
    name: 'Free', 
    price: 0, 
    tokens: 50, 
    downloads: 3, 
    features: ['Basic AI Access', 'Standard Support', 'Public Projects'],
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    color: 'from-yellow-400/20 to-orange-500/20'
  },
  { 
    name: 'Pro', 
    price: 50, 
    tokens: 500, 
    downloads: 'Unlimited', 
    features: ['Faster Processing', 'Priority Support', 'Advanced Refactoring', 'Private Projects'], 
    popular: true,
    icon: <Rocket className="w-6 h-6 text-primary" />,
    color: 'from-primary/20 to-blue-600/20'
  },
  { 
    name: 'Premium', 
    price: 100, 
    tokens: 2000, 
    downloads: 'Unlimited', 
    features: ['Advanced Features', 'Premium Support', 'Project History', 'Custom Domains'],
    icon: <Shield className="w-6 h-6 text-purple-400" />,
    color: 'from-purple-400/20 to-pink-500/20'
  },
  { 
    name: 'Business', 
    price: 500, 
    tokens: 'Unlimited', 
    downloads: 'Unlimited', 
    features: ['Team Access', 'API Access', 'Commercial License', 'Dedicated Support', 'SLA Guarantee'],
    icon: <Users className="w-6 h-6 text-green-400" />,
    color: 'from-green-400/20 to-teal-500/20'
  },
];

const faqs = [
  { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time from your account settings. No questions asked." },
  { q: "Do tokens reset?", a: "Yes, tokens reset every 24 hours based on UTC time, ensuring you always have a fresh start." },
  { q: "What's included in Team Access?", a: "Team Access allows for shared workspaces, collaborative coding features, and centralized billing for your entire organization." },
  { q: "Is there a free trial for Pro?", a: "We offer a Free plan that lets you experience the core features. You can upgrade to Pro whenever you need more power." }
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-white py-24 px-4 relative overflow-hidden">
      <Helmet>
        <title>Pricing Plans - Onowl AI Coding Platform</title>
        <meta name="description" content="Choose the perfect Onowl plan to supercharge your coding workflow. Affordable options from Free to Business for solo developers and large teams." />
      </Helmet>
      {/* Background Glowing Blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-primary/50"
          >
            Pricing Built for Growth
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto"
          >
            Choose the plan that's right for you. Whether you're a solo developer or a large team, we've got you covered.
          </motion.p>
          
          <div className="flex items-center justify-center gap-6 mb-8">
            <span className={`text-sm transition-colors ${!isYearly ? 'text-white font-bold' : 'text-gray-500'}`}>Monthly</span>
            <button 
              onClick={() => setIsYearly(!isYearly)} 
              className="w-16 h-8 bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/10 transition-all flex items-center"
            >
              <motion.div 
                animate={{ x: isYearly ? 32 : 0 }} 
                className="w-6 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
              />
            </button>
            <span className={`text-sm transition-colors ${isYearly ? 'text-white font-bold' : 'text-gray-500'}`}>
              Yearly <span className='text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs ml-1'>-20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {plans.map((plan, idx) => (
            <motion.div 
              key={plan.name} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -12, scale: 1.02 }}
              className={`relative backdrop-blur-xl bg-white/5 p-8 rounded-[2.5rem] border transition-all duration-300 ${
                plan.popular 
                ? 'border-primary/50 shadow-[0_20px_50px_rgba(99,102,241,0.15)] ring-1 ring-primary/20' 
                : 'border-white/10 hover:border-white/20 shadow-2xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-blue-600 text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-primary/20">
                  <Star className="w-3 h-3 fill-current" /> MOST POPULAR
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                {plan.icon}
              </div>

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black">
                  ₹{isYearly ? Math.round(plan.price * 0.8) : plan.price}
                </span>
                <span className="text-gray-500 text-sm">/mo</span>
              </div>

              <button 
                onClick={() => {
                  navigate('/payment', { state: { plan: { name: plan.name, price: isYearly ? Math.round(plan.price * 0.8) : plan.price } } });
                }} 
                className={`w-full py-4 rounded-2xl font-black mb-8 transition-all ${
                  plan.popular 
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20' 
                  : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Get Started
              </button>

              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">What's included</p>
                <ul className="text-left space-y-3 text-sm">
                  <li className="flex items-center gap-3 text-gray-300">
                    <div className="bg-primary/20 rounded-full p-0.5"><Check className="text-primary w-3 h-3"/></div>
                    <span><strong className="text-white">{plan.tokens}</strong> Tokens/day</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <div className="bg-primary/20 rounded-full p-0.5"><Check className="text-primary w-3 h-3"/></div>
                    <span><strong className="text-white">{plan.downloads}</strong> Downloads</span>
                  </li>
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-gray-300">
                      <div className="bg-primary/20 rounded-full p-0.5"><Check className="text-primary w-3 h-3"/></div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Questions? We have answers.</h3>
            <p className="text-gray-400">Everything you need to know about our plans and billing.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, i) => (
              <div key={i} className="group">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)} 
                  className={`w-full p-6 text-left flex justify-between items-start gap-4 rounded-[2rem] border transition-all duration-300 ${
                    openFaq === i 
                    ? 'bg-white/10 border-white/20 shadow-xl' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="font-bold text-lg leading-tight">{faq.q}</span>
                  <div className={`mt-1 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-primary' : 'text-gray-500'}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }} 
                      className="overflow-hidden"
                    >
                      <div className="px-8 py-6 text-gray-400 leading-relaxed text-sm">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
