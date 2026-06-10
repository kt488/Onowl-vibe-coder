import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { 
  User, Settings, CreditCard, LogOut, ChevronDown, 
  LayoutDashboard, Zap, Shield, Rocket, Users as UsersIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileBar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    };

    getProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(data);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setIsOpen(false);
  };

  const getPlanIcon = (plan) => {
    switch (plan?.toLowerCase()) {
      case 'pro': return <Rocket className="w-3 h-3 text-primary" />;
      case 'premium': return <Shield className="w-3 h-3 text-purple-400" />;
      case 'business': return <UsersIcon className="w-3 h-3 text-green-400" />;
      default: return <Zap className="w-3 h-3 text-yellow-400" />;
    }
  };

  if (loading) return <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />;
  if (!user) return null;

  const userInitial = user.email ? user.email[0].toUpperCase() : '?';
  const displayName = profile?.name || user.email?.split('@')[0] || 'User';

  return (
    <div className="relative z-[100]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pl-3 pr-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all group"
      >
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-xs font-bold text-white leading-tight">{displayName}</span>
          <div className="flex items-center gap-1">
             {getPlanIcon(profile?.plan)}
             <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500 group-hover:text-primary transition-colors">
               {profile?.plan || 'Free'} Plan
             </span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 border border-white/20">
          {userInitial}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-64 backdrop-blur-2xl bg-surface/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg border border-white/20">
                    {userInitial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white truncate max-w-[140px]">{displayName}</span>
                    <span className="text-[10px] text-gray-500 truncate max-w-[140px]">{user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                  {getPlanIcon(profile?.plan)}
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    {profile?.plan || 'Free'} Tier
                  </span>
                </div>
              </div>

              <div className="p-2">
                <button 
                  onClick={() => { navigate('/ide'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <LayoutDashboard className="w-4 h-4 group-hover:text-primary" />
                  <span>Open IDE</span>
                </button>
                <button 
                  onClick={() => { navigate('/settings'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <Settings className="w-4 h-4 group-hover:text-primary" />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={() => { navigate('/subscription'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <CreditCard className="w-4 h-4 group-hover:text-primary" />
                  <span>Billing & Plan</span>
                </button>
              </div>

              <div className="p-2 border-t border-white/5 bg-black/20">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileBar;
