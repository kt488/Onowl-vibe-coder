import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Zap, Code2, Download, Box, ShieldCheck, Github, Menu, X } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';
import ProfileBar from '../components/ProfileBar';

const Landing = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [session, setSession] = useState(null);
  const { scrollY } = useScroll();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  React.useEffect(() => {
    return scrollY.onChange((latest) => {
      setShowBackToTop(latest > 500);
    });
  }, [scrollY]);

  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scaleX = useTransform(scrollY, [0, 2000], [0, 1]);

  const revealVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
        style={{ scaleX }}
      />

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 glass-panel sticky top-0 z-50"
      >
        <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-white tracking-tight">
          <Box className="text-primary w-6 h-6 sm:w-8 h-8" />
          Onowl
        </div>
        <div className="hidden lg:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <button onClick={() => navigate('/pricing')} className="hover:text-white transition">Pricing</button>
          <a href="#enterprise" className="hover:text-white transition">Enterprise</a>
          <a href="#" className="hover:text-white transition">Resources</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {!session ? (
            <>
              <button onClick={() => navigate('/auth')} className="hidden sm:block text-sm font-medium hover:text-primary transition px-2">Log in</button>
              <button 
                onClick={() => navigate('/create')}
                className="hidden xs:block bg-primary hover:bg-primary/90 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition shadow-[0_0_15px_rgba(99,102,241,0.3)] whitespace-nowrap">
                Open Workspace
              </button>
            </>
          ) : (
            <ProfileBar />
          )}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-white p-1"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-surface border-b border-border overflow-hidden fixed top-[72px] left-0 right-0 z-40"
          >
            <div className="flex flex-col p-4 gap-4 text-gray-400">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="hover:text-white transition text-lg">Features</a>
              <button onClick={() => { setIsMenuOpen(false); navigate('/pricing'); }} className="text-left hover:text-white transition text-lg">Pricing</button>
              <a href="#enterprise" onClick={() => setIsMenuOpen(false)} className="hover:text-white transition text-lg">Enterprise</a>
              <hr className="border-border" />
              {!session ? (
                <>
                  <button onClick={() => { setIsMenuOpen(false); navigate('/auth'); }} className="text-left hover:text-white transition text-lg">Log in</button>
                  <button onClick={() => { setIsMenuOpen(false); navigate('/create'); }} className="bg-primary text-white p-3 rounded-lg font-bold text-center">Open Workspace</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }} className="text-left hover:text-white transition text-lg">Open Dashboard</button>
                  <button onClick={() => { setIsMenuOpen(false); navigate('/settings'); }} className="text-left hover:text-white transition text-lg">Settings</button>
                  <button onClick={() => { setIsMenuOpen(false); navigate('/subscription'); }} className="text-left hover:text-white transition text-lg">Subscription</button>
                  <button onClick={() => { setIsMenuOpen(false); supabase.auth.signOut(); }} className="text-left text-red-400 hover:text-red-300 transition text-lg">Sign Out</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative px-6 sm:px-8 py-20 sm:py-32 max-w-6xl mx-auto flex flex-col items-center text-center h-[80vh] justify-center">
        <motion.div 
          style={{ y: y1, opacity }} 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[300px] sm:h-[400px] bg-primary/20 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none" 
        />
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.2 } },
            hidden: {}
          }}
          style={{ y: y2, opacity }}
          className="relative z-10"
        >
          <motion.h1 
            variants={revealVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 mb-6 tracking-tight leading-tight"
          >
            Code at the Speed of Thought
          </motion.h1>
          <motion.p 
            variants={revealVariants}
            className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 px-4"
          >
            Onowl is a premium AI-powered coding environment. Write, refactor, debug, and export full-stack applications instantly. The ultimate flow state awaits.
          </motion.p>
          <motion.div 
            variants={revealVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
          >
            <button 
              onClick={() => navigate('/create')}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg text-base sm:text-lg font-semibold transition shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2">
              <Terminal className="w-5 h-5" /> Start Coding Now
            </button>
            <button className="w-full sm:w-auto bg-surface hover:bg-surface/80 border border-border text-white px-8 py-4 rounded-lg text-base sm:text-lg font-semibold transition flex items-center justify-center gap-2">
              <Github className="w-5 h-5" /> Connect GitHub
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* What We Offering Section */}
      <section className="px-6 sm:px-8 py-20 bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
            className="mb-16"
          >
            <motion.h2 variants={revealVariants} className="text-primary font-bold tracking-widest uppercase text-sm mb-4">The Onowl Edge</motion.h2>
            <motion.h3 variants={revealVariants} className="text-3xl sm:text-5xl font-extrabold text-white mb-6">What We Offering</motion.h3>
            <motion.p variants={revealVariants} className="text-gray-400 text-lg max-w-3xl">
              We provide a complete ecosystem for the modern developer. From AI-assisted logic generation to secure cloud deployments, Onowl is designed to remove every friction point in your workflow.
            </motion.p>
          </motion.div>

          <div className="space-y-24">
            {[
              {
                title: "Next-Gen AI Intelligence",
                desc: "Our platform integrates the latest DeepSeek-V4 and NVIDIA NIM models. It doesn't just complete your code; it understands your entire project context to provide architectural suggestions, security audits, and automated refactoring.",
                image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000",
                align: "left"
              },
              {
                title: "Scalable Cloud Sandboxes",
                desc: "Every workspace is a dedicated, secure Linux container. Install dependencies, run background processes, and preview your applications in a real-time environment that mirrors production.",
                image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000",
                align: "right"
              },
              {
                title: "Global Collaboration",
                desc: "Code together in real-time. Share your workspace with a single link and collaborate with teammates on the same file, terminal, and preview. Perfect for pair programming and remote teams.",
                image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000",
                align: "left"
              }
            ].map((offering, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                className={`flex flex-col ${offering.align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}
              >
                <div className="flex-1">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <img 
                      src={offering.image} 
                      alt={offering.title}
                      className="relative rounded-2xl border border-border w-full aspect-video object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <h4 className="text-2xl sm:text-3xl font-bold text-white">{offering.title}</h4>
                  <p className="text-gray-400 leading-relaxed text-lg">{offering.desc}</p>
                  <button className="text-primary font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                    Learn more about this <Zap className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 sm:px-8 py-16 sm:py-24 bg-black/40 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
            className="text-center mb-12 sm:mb-16 px-4"
          >
            <motion.h2 variants={revealVariants} className="text-2xl sm:text-3xl font-bold mb-4">Enterprise-Grade Architecture</motion.h2>
            <motion.p variants={revealVariants} className="text-sm sm:text-base text-gray-400">Everything you need to build production-ready software.</motion.p>
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
                whileHover={{ scale: 1.05, translateY: -5 }}
                transition={{ duration: 0.3 }}
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
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          visible: { transition: { staggerChildren: 0.1 } },
          hidden: {}
        }}
        className="px-6 sm:px-8 py-12 border-t border-border bg-background"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <motion.div variants={revealVariants} className="flex items-center gap-2 text-xl font-bold text-white">
            <Box className="text-primary w-6 h-6" />
            Onowl
          </motion.div>
          
          <motion.div variants={revealVariants} className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-gray-500 font-medium">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <button onClick={() => navigate('/terms')} className="hover:text-white transition text-left">Terms of Service</button>
            <a href="#" className="hover:text-white transition">Cookies</a>
            <button onClick={() => navigate('/contact')} className="hover:text-white transition">Contact</button>
            <a href="https://t.me/onowlio" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Telegram</a>
          </motion.div>

          <motion.div variants={revealVariants} className="flex items-center gap-4 text-gray-500">
            <Github className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <span className="text-xs">© 2026 Onowl AI Inc.</span>
          </motion.div>
        </div>
      </motion.footer>
      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 p-4 bg-primary text-white rounded-full shadow-2xl z-[50] hover:bg-primary/90 transition-colors"
          >
            <Zap className="w-6 h-6 rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;