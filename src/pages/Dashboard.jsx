import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import MetricCard from '../components/dashboard/MetricCard';
import RecentProjects from '../components/dashboard/RecentProjects';
import { Bot, Zap, Folder, Server, Rocket, HardDrive, Plus, Layout, Globe, Github, Upload, Copy } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ credits: 0, projects: 0, generations: 0, deployments: 0, requests: 0 });
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      // Fetch user profile for credits
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      // Fetch project count
      const { count: projectCount } = await supabase.from('workspaces').select('id', { count: 'exact' }).eq('user_id', user.id);
      
      const maxCredits = profile?.plan === 'pro' ? 5000 : 100;
      const used = profile?.tokens_used_today || 0;

      setStats({
        credits: Math.max(0, maxCredits - used),
        projects: projectCount || 0,
        generations: used * 2, // simulated stat based on tokens
        deployments: Math.floor((projectCount || 0) / 3), // simulated
        requests: used * 5 // simulated
      });
    };
    loadStats();
  }, [user]);

  const handleCreateNew = () => {
    navigate('/ide', { state: { createNew: true } });
  };

  const quickActions = [
    { name: 'Create New App', icon: Plus, action: handleCreateNew },
    { name: 'Generate Website', icon: Layout, action: handleCreateNew },
    { name: 'Generate Full Stack App', icon: Globe, action: handleCreateNew },
    { name: 'Import GitHub', icon: Github },
    { name: 'Upload Files', icon: Upload },
    { name: 'Clone Project', icon: Copy },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />

      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col z-10">
        <TopBar toggleSidebar={toggleSidebar} credits={stats.credits} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Welcome back, {user?.user_metadata?.name || 'Developer'}!</h1>
              <p className="text-gray-400 text-sm mt-1">Here is what's happening with your projects today.</p>
            </div>
            <button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all">
              <Plus size={18} /> New Project
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-8">
            <MetricCard title="Remaining Credits" value={stats.credits.toLocaleString()} icon={Zap} glow="text-yellow-400" />
            <MetricCard title="Total Generations" value={stats.generations.toLocaleString()} icon={Bot} glow="text-primary" />
            <MetricCard title="Active Projects" value={stats.projects} icon={Folder} glow="text-emerald-400" />
            <MetricCard title="Deployments" value={stats.deployments} icon={Rocket} glow="text-orange-400" />
            <MetricCard title="API Requests" value={stats.requests.toLocaleString()} icon={Server} glow="text-blue-400" />
            <MetricCard title="Storage" value="2.4 GB" icon={HardDrive} glow="text-pink-400" />
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-200">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action) => (
                <button key={action.name} onClick={action.action} className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                  <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                    <action.icon size={22} className="text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs font-medium text-gray-300 group-hover:text-white text-center">{action.name}</span>
                </button>
              ))}
            </div>
          </div>

          <RecentProjects />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-gray-800 p-6 rounded-lg lg:col-span-1">
              <h2 className="text-xl font-bold mb-4">Subscription</h2>
              <p className="text-gray-400">Current Plan: <span className="text-white font-bold">Pro</span></p>
              <p className="text-gray-400">Credits Remaining: <span className="text-white font-bold">2,450</span></p>
              <button onClick={() => navigate('/payment', { state: { plan: { name: 'Pro', price: 50 } } })} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg">Upgrade Plan</button>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg lg:col-span-1">
              <h2 className="text-xl font-bold mb-4">Team Collaboration</h2>
              <p className="text-gray-400">Members: <span className="text-white font-bold">4</span></p>
              <button className="mt-4 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg">Manage Team</button>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg lg:col-span-1">
              <h2 className="text-xl font-bold mb-4">Analytics</h2>
              <div className="h-32 bg-gray-700 rounded flex items-center justify-center text-gray-500">
                [Analytics Chart Placeholder]
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
