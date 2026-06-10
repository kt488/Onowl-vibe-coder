import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabase';

const CreateWebsite = () => {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    // Redirect to IDE, passing the prompt via state
    navigate('/dashboard', { state: { initialPrompt: prompt } });
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen items-center justify-center relative px-4 bg-background">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      <button 
        onClick={() => navigate('/')} 
        className="absolute top-8 left-8 text-gray-400 hover:text-white transition flex items-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl z-10 text-center"
      >
        <Sparkles className="w-12 h-12 text-primary mx-auto mb-6 animate-pulse" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">What do you want to build?</h1>
        <p className="text-gray-400 mb-8 text-lg">Describe your website and DeepSeek will generate it for you.</p>

        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-surface border border-border rounded-2xl shadow-2xl">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Build a modern landing page for a coffee shop..."
              className="w-full bg-transparent text-white placeholder-gray-500 p-6 pr-16 rounded-2xl resize-none focus:outline-none text-lg min-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button 
              type="submit"
              disabled={!prompt.trim()}
              className="absolute bottom-4 right-4 bg-primary hover:bg-primary/90 disabled:bg-surface disabled:text-gray-500 text-white p-3 rounded-xl transition shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:shadow-none"
            >
              <Zap className="w-6 h-6" />
            </button>
          </div>
        </form>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {["A SaaS Dashboard", "A Personal Portfolio", "An E-commerce Store", "A Blog Template"].map(suggestion => (
            <button 
              key={suggestion}
              onClick={() => setPrompt(suggestion)}
              className="px-4 py-2 rounded-full border border-border bg-surface hover:bg-white/5 text-sm text-gray-300 transition"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CreateWebsite;