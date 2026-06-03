import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Zap, Code2, Download, Box, ShieldCheck, Github } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col w-full overflow-y-auto overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-white tracking-tight">
          <Box className="text-primary w-6 h-6 sm:w-8 h-8" />
          Onowl
        </div>
        <div className="hidden lg:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <a href="#enterprise" className="hover:text-white transition">Enterprise</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => navigate('/auth')} className="hidden sm:block text-sm font-medium hover:text-primary transition px-2">Log in</button>
          <button 
            onClick={() => navigate('/create')}
            className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition shadow-[0_0_15px_rgba(99,102,241,0.3)] whitespace-nowrap">
            Open Workspace
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 sm:px-8 py-20 sm:py-32 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[300px] sm:h-[400px] bg-primary/20 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 mb-6 tracking-tight leading-tight">
            Code at the Speed of Thought
          </h1>
          <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 px-4">
            Onowl is a premium AI-powered coding environment. Write, refactor, debug, and export full-stack applications instantly. The ultimate flow state awaits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
            <button 
              onClick={() => navigate('/create')}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg text-base sm:text-lg font-semibold transition shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2">
              <Terminal className="w-5 h-5" /> Start Coding Now
            </button>
            <button className="w-full sm:w-auto bg-surface hover:bg-surface/80 border border-border text-white px-8 py-4 rounded-lg text-base sm:text-lg font-semibold transition flex items-center justify-center gap-2">
              <Github className="w-5 h-5" /> Connect GitHub
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 sm:px-8 py-16 sm:py-24 bg-black/40 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16 px-4"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Enterprise-Grade Architecture</h2>
            <p className="text-sm sm:text-base text-gray-400">Everything you need to build production-ready software.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Zap, title: 'AI Code Generation', desc: 'Context-aware code completion powered by DeepSeek & NVIDIA NIM.' },
              { icon: Download, title: 'Powerful Export', desc: 'Download single files, ZIP archives, or push directly to GitHub.' },
              { icon: Code2, title: 'Live Preview', desc: 'Instant feedback loop for React, Next.js, and vanilla HTML/JS/CSS.' },
              { icon: Terminal, title: 'Integrated Terminal', desc: 'Cloud workspaces with full bash access and secure execution.' },
              { icon: Box, title: 'Multi-file Management', desc: 'Seamlessly jump between files, refactor across directories.' },
              { icon: ShieldCheck, title: 'Secure & Private', desc: 'End-to-end encryption, SOC2 compliance, and private instances.' }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={{
                  visible: { opacity: 1, y: 0 },
                  hidden: { opacity: 0, y: 20 }
                }}
                transition={{ duration: 0.5 }}
                className="glass-panel p-6 rounded-xl hover:border-primary/50 transition"
              >
                <feature.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="px-6 sm:px-8 py-12 border-t border-border bg-background"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <Box className="text-primary w-6 h-6" />
            Onowl
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-gray-500 font-medium">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Cookies</a>
            <button onClick={() => navigate('/contact')} className="hover:text-white transition">Contact</button>
          </div>

          <div className="flex items-center gap-4 text-gray-500">
            <Github className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <span className="text-xs">© 2026 Onowl AI Inc.</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Landing;