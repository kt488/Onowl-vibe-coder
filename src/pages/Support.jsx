import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Mail, MessageSquare, BookOpen, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Support = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      q: "How do I start a new project?",
      a: "Go to your Dashboard and click 'Create New Workspace'. Our AI engine will guide you through the initial setup."
    },
    {
      q: "What payment plans are available?",
      a: "We offer Free, Pro, and Enterprise plans. Check our Pricing page for detailed comparisons."
    },
    {
      q: "How can I deploy my generated website?",
      a: "You can download your project as a ZIP file or connect your GitHub repository directly from the project settings."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-gray-200">
      <Helmet>
        <title>Support - Onowl AI Coding</title>
      </Helmet>

      {/* Navigation */}
      <nav className="px-6 sm:px-8 py-6 flex items-center justify-between sticky top-0 backdrop-blur-md border-b border-white/5 z-20">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <div className="text-xl font-bold">Onowl <span className="text-primary">Support</span></div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-white mb-4">How can we help?</h1>
          <p className="text-gray-400 text-lg">Find answers in our documentation or reach out to our team directly.</p>
        </header>

        {/* Resources */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
           <div className="p-6 rounded-3xl bg-surface/30 border border-white/5 hover:border-primary/20 transition">
              <BookOpen className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Documentation</h3>
              <p className="text-gray-400 mb-4">Browse our guides to master the Onowl IDE and AI engine.</p>
              <button className="text-primary font-bold">Read Guides →</button>
           </div>
           <div className="p-6 rounded-3xl bg-surface/30 border border-white/5 hover:border-primary/20 transition">
              <MessageSquare className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Community</h3>
              <p className="text-gray-400 mb-4">Join fellow developers on our community forum.</p>
              <button className="text-purple-400 font-bold">Join Community →</button>
           </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <HelpCircle className="text-primary" /> Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-surface/30 p-6 rounded-2xl border border-white/5">
                <summary className="font-bold text-white cursor-pointer list-none flex justify-between items-center">
                   {faq.q}
                   <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-400 mt-4 pt-4 border-t border-white/5">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="bg-surface/30 p-8 rounded-3xl border border-white/5 text-center">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Still need help?</h3>
          <p className="text-gray-400 mb-6">Our support team is available 24/7.</p>
          <button onClick={() => navigate('/contact')} className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl transition">
            Contact Support
          </button>
        </section>
      </main>
    </div>
  );
};

export default Support;
