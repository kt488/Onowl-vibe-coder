import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, Send, ArrowLeft, Phone, MapPin, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background text-gray-200 selection:bg-primary/30 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 sm:px-8 py-6 flex items-center justify-between glass-panel sticky top-0 backdrop-blur-md border-b border-white/5">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Home</span>
        </button>
        <div className="text-xl font-bold tracking-tighter text-white">Onowl <span className="text-primary">Support</span></div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20">
        
        {/* Left Column: Contact Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight leading-none">
              Let's build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">future</span> together.
            </h1>
            <p className="text-lg text-gray-400 max-w-md">
              Have a question about the Onowl AI Engine? Need custom enterprise features? Or just want to say hello? Drop us a line.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface/30 border border-white/5 hover:border-primary/20 transition group">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Email Us</h3>
                <p className="text-white font-medium">support@onowl.ai</p>
                <p className="text-xs text-gray-500 mt-1">Typical response time: 2 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface/30 border border-white/5 hover:border-primary/20 transition group">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Global Headquarters</h3>
                <p className="text-white font-medium">Silicon Valley, CA</p>
                <p className="text-xs text-gray-500 mt-1">Available worldwide</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface/30 border border-white/5 hover:border-primary/20 transition group">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Telegram</h3>
                <a href="https://t.me/onowlio" target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:text-primary transition">Join our channel</a>
                <p className="text-xs text-gray-500 mt-1">Get updates and community support</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
            
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <Send className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Message Received!</h2>
                <p className="text-gray-400 mb-8">Our AI agents have dispatched your message to the right team. We'll be in touch shortly.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-primary font-bold hover:underline"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Your Name</label>
                    <input 
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Jane Doe"
                      className="w-full bg-black/40 border border-border rounded-xl px-5 py-4 text-white focus:border-primary/50 outline-none transition shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="jane@example.com"
                      className="w-full bg-black/40 border border-border rounded-xl px-5 py-4 text-white focus:border-primary/50 outline-none transition shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Subject</label>
                  <input 
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="How can we help?"
                    className="w-full bg-black/40 border border-border rounded-xl px-5 py-4 text-white focus:border-primary/50 outline-none transition shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Message</label>
                  <textarea 
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Tell us about your project or inquiry..."
                    className="w-full bg-black/40 border border-border rounded-2xl px-5 py-4 text-white focus:border-primary/50 outline-none transition shadow-inner resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-2xl transition shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 flex items-center gap-2">
                        Transmit Message <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </main>

      {/* Map/Image Placeholder */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="h-[300px] w-full bg-surface/50 border border-white/5 rounded-3xl overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-700">
           <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
           {/* Placeholder for an actual Map or High-end Brand Image */}
           <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent">
              <div className="text-center space-y-4">
                 <div className="p-4 bg-primary/20 rounded-full inline-block">
                    <MapPin className="w-10 h-10 text-primary" />
                 </div>
                 <h2 className="text-xl font-bold text-white tracking-widest uppercase">Silicon Valley, California</h2>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
