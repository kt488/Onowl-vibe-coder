import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, BarChart3, Activity, Terminal, RefreshCw, Key, 
  CheckCircle2, XCircle, Clock, Cpu, Zap, LayoutDashboard, 
  Settings, Users, Globe, Database, LogOut, Trash2, TrendingUp, TrendingDown, DollarSign, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { saveAs } from 'file-saver';

const MetricCard = ({ title, value, trend, icon: Icon, color, subValue }) => (
  <div className="glass-panel p-6 rounded-3xl border border-border bg-surface/50">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl bg-white/5`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(trend)}%
      </div>
    </div>
    <h3 className="text-sm text-gray-500 font-medium">{title}</h3>
    <div className="text-2xl font-bold text-white mt-1">{value}</div>
    {subValue && <p className="text-xs text-gray-600 mt-1">{subValue}</p>}
  </div>
);

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics');
  const [timeRange, setTimeRange] = useState('week');

  const handleExport = () => {
    if (!stats) return;
    const csvData = [
      ['Metric', 'Value'],
      ['Total Users', stats.metrics?.totalUsers],
      ['Active Users Today', stats.metrics?.activeUsersToday],
      ['Total Projects', stats.metrics?.totalProjects],
      ['Total AI Requests', stats.totalRequests],
      ['Monthly Revenue', stats.revenue?.monthly],
      ['Avg Latency', stats.avgLatency],
    ].map(e => e.join(',')).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `onowl-metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('onowl_admin_token');
    if (token) {
      fetchStats(token);
    }
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('onowl_admin_token', result.token);
        setIsAuthorized(true);
        fetchStats(result.token);
      } else {
        setError(result.error || 'Invalid password');
      }
    } catch (err) {
      setError('Could not connect to backend server.');
    }
    setIsLoading(false);
  };

  const fetchStats = async (tokenOverride) => {
    const token = tokenOverride || localStorage.getItem('onowl_admin_token');
    if (!token) return;

    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
        setIsAuthorized(true);
      } else {
        // Token might be expired
        if (response.status === 401) {
            localStorage.removeItem('onowl_admin_token');
            setIsAuthorized(false);
        }
        setError(result.error);
      }
    } catch (err) {
      setError('Could not connect to backend server.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    
    const token = localStorage.getItem('onowl_admin_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        alert('User successfully deleted');
        fetchStats(); // Refresh the list
      } else {
        alert(`Error deleting user: ${result.error}`);
      }
    } catch (err) {
      alert('Could not connect to backend server to delete user.');
    }
  };

  const handleUpdatePlan = async (userId, newPlan) => {
    const token = localStorage.getItem('onowl_admin_token');
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: newPlan })
      });
      const result = await response.json();
      
      if (result.success) {
        // Find user in stats and update locally to avoid full fetch flicker
        setStats(prev => ({
          ...prev,
          users_list: prev.users_list.map(u => u.id === userId ? { ...u, plan: newPlan } : u)
        }));
        // fetchStats(); // Alternatively refresh everything
      } else {
        alert(`Error updating plan: ${result.error}`);
      }
    } catch (err) {
      alert('Could not connect to backend server to update plan.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthorized) {
      const interval = setInterval(() => fetchStats(), 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#09090b] p-4 min-h-screen relative z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-panel p-10 rounded-3xl text-center border-primary/20 shadow-2xl shadow-primary/10 relative z-10 bg-surface"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20">
            <ShieldAlert className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-white tracking-tight">Onowl Console</h1>
          <p className="text-gray-500 mb-8 text-sm px-4">Authorized access only. Enter your administrator credentials to monitor the NIM cluster.</p>
          
          <div className="space-y-4">
            <div className="relative group">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                  <Key className="w-4 h-4" />
               </div>
               <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Master Password"
                className="w-full bg-black/40 border border-border rounded-xl pl-12 pr-4 py-4 text-white focus:border-primary/50 outline-none transition shadow-inner"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-left font-medium ml-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> {error}</motion.p>}
            <button 
              onClick={() => handleLogin()}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Login to Console <Zap className="w-4 h-4 fill-white" /></>}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-screen bg-[#020203] overflow-hidden text-gray-200 relative z-50">
      {/* Sidebar */}
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border bg-surface/30 backdrop-blur-xl flex flex-col shrink-0 z-20">
        <div className="p-4 md:p-8 flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Cpu className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
               <span className="text-lg md:text-xl font-bold text-white block leading-none">Onowl</span>
               <span className="text-[9px] md:text-[10px] text-primary font-bold uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
          {/* Mobile Sign out button in header */}
          <button onClick={() => { localStorage.removeItem('onowl_admin_token'); window.location.reload(); }} className="md:hidden flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex md:flex-1 md:flex-col overflow-x-auto md:overflow-visible px-2 md:px-4 space-x-2 md:space-x-0 md:space-y-2 pb-2 md:pb-0 md:mt-4 no-scrollbar">
          {[
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'metrics', label: 'Metrics', icon: BarChart3 },
            { id: 'logs', label: 'Logs', icon: Terminal },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'api', label: 'API', icon: Globe },
            { id: 'db', label: 'Infra', icon: Database },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'}`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-primary' : ''}`} />
              <span className="hidden sm:inline md:inline">{item.label}</span>
              {activeTab === item.id && <motion.div layoutId="activeDot" className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </nav>

        <div className="hidden md:block p-6 mt-auto border-t border-[#27272a]/50">
          <button onClick={() => { localStorage.removeItem('onowl_admin_token'); window.location.reload(); }} className="flex items-center gap-3 px-4 py-3 w-full text-gray-500 hover:text-red-400 transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <header className="sticky top-0 z-10 px-4 md:px-10 py-4 md:py-6 border-b border-border/50 bg-[#020203]/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h2 className="text-xs md:text-sm text-gray-500 font-medium uppercase tracking-widest">System Engine</h2>
              <div className="flex items-center gap-4">
                <h1 className="text-xl md:text-2xl font-bold text-white capitalize">{activeTab}</h1>
                {activeTab === 'overview' && (
                  <div className="flex bg-surface rounded-lg p-1 border border-border">
                    {['day', 'week', 'month', 'year'].map(range => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${timeRange === range ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                )}
              </div>
           </div>
           <div className="flex items-center gap-2 md:gap-4">
              {activeTab === 'overview' && (
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:border-primary/50 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              )}
              <div className="hidden sm:flex flex-col items-end mr-2 md:mr-4">
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">System Online</span>
                <span className="text-[10px] md:text-xs text-gray-500 font-mono">Uptime: {stats?.uptime || '0s'}</span>
              </div>
              <button 
                onClick={() => fetchStats()}
                className="p-2 md:p-2.5 rounded-full bg-surface border border-border hover:border-primary/50 transition-all group"
              >
                <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-primary to-purple-600 border border-white/10" />
           </div>
        </header>

        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          {activeTab === 'metrics' && (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard title="Total Users" value={stats?.metrics?.totalUsers} trend={5.2} icon={Users} color="text-pink-400" subValue={`${stats?.metrics?.newUsersThisWeek} new this week`} />
                  <MetricCard title="Active Users" value={stats?.metrics?.activeUsersToday} trend={2.1} icon={Activity} color="text-emerald-400" subValue="Today" />
                  <MetricCard title="Total Projects" value={stats?.metrics?.totalProjects} trend={3.8} icon={Database} color="text-indigo-400" subValue={`${stats?.metrics?.activeProjects} active`} />
                  <MetricCard title="Monthly Revenue" value={`$${stats?.revenue?.monthly}`} trend={stats?.revenue?.growth} icon={DollarSign} color="text-amber-400" subValue="Total: $125k" />
                </div>
                
                {/* Secondary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard title="Total AI Requests" value={stats?.totalRequests} trend={8.1} icon={Zap} color="text-blue-400" />
                  <MetricCard title="Avg Response Time" value={stats?.avgLatency} trend={-1.2} icon={Clock} color="text-purple-400" />
                  <MetricCard title="Error Rate" value="0.2%" trend={-0.5} icon={ShieldAlert} color="text-red-400" />
                  <MetricCard title="Retention Rate" value="84%" trend={1.5} icon={Users} color="text-teal-400" />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-panel p-8 rounded-3xl border border-border bg-surface/50">
                    <h3 className="text-lg font-bold mb-6 italic">Growth Trends</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.trends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="day" stroke="#52525b" />
                          <YAxis stroke="#52525b" />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                          <Area type="monotone" dataKey="users" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="glass-panel p-8 rounded-3xl border border-border bg-surface/50">
                    <h3 className="text-lg font-bold mb-6 italic">Usage Analytics</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.trends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="day" stroke="#52525b" />
                          <YAxis stroke="#52525b" />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                          <Bar dataKey="requests" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {activeTab === 'overview' && (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="md:col-span-2 glass-panel p-10 rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-transparent">
                      <h2 className="text-3xl font-bold mb-4">Neural Cluster Status</h2>
                      <p className="text-gray-400 mb-8">All AI-NIM nodes are operating within optimal parameters. System load is currently at 24% capacity.</p>
                      <div className="flex gap-4">
                        <button onClick={() => setActiveTab('metrics')} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all">View Full Metrics</button>
                        <button onClick={() => fetchStats()} className="px-6 py-3 bg-surface border border-border text-white rounded-xl font-bold hover:bg-white/5 transition-all">Refresh System</button>
                      </div>
                   </div>
                   <div className="glass-panel p-8 rounded-3xl border border-border flex flex-col justify-center items-center text-center">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h4 className="font-bold text-xl mb-1">System Health</h4>
                      <p className="text-emerald-500 font-bold text-sm uppercase tracking-widest">Stable</p>
                   </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {activeTab === 'users' && (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="glass-panel rounded-3xl border-white/5 overflow-hidden">
                  <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-surface/50">
                    <h3 className="font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" /> Registered Users Database
                    </h3>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                      <thead className="text-xs uppercase bg-black/40 text-gray-500 font-semibold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">User ID</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Current Plan</th>
                          <th className="px-6 py-4">Joined Date</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {stats?.users_list && stats.users_list.length > 0 ? (
                          stats.users_list.map((user, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">{user.id.split('-')[0]}...</td>
                              <td className="px-6 py-4 text-gray-200">{user.email}</td>
                              <td className="px-6 py-4">
                                <select 
                                  value={user.plan || 'free'} 
                                  onChange={(e) => handleUpdatePlan(user.id, e.target.value)}
                                  className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-primary font-bold uppercase focus:outline-none focus:border-primary transition-colors cursor-pointer"
                                >
                                  <option value="free">Free</option>
                                  <option value="pro">Pro</option>
                                  <option value="premium">Premium</option>
                                  <option value="business">Business</option>
                                </select>
                              </td>
                              <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-600 italic">No users found in database.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {activeTab === 'logs' && (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="glass-panel rounded-3xl border-white/5 overflow-hidden flex flex-col h-[70vh]">
                  <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-surface/50 shrink-0">
                    <h3 className="font-bold flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-primary" /> Live System Logs
                    </h3>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto space-y-2 font-mono text-xs custom-scrollbar bg-black/60">
                    {stats?.systemLogs && stats.systemLogs.length > 0 ? (
                      stats.systemLogs.map((log, i) => {
                        let logColor = 'text-gray-400';
                        if (log.type === 'error') logColor = 'text-red-400';
                        if (log.type === 'warn') logColor = 'text-amber-400';
                        if (log.type === 'info') logColor = 'text-blue-300';
                        
                        return (
                          <div key={i} className={`flex gap-4 ${logColor} border-b border-white/5 pb-2`}>
                            <span className="opacity-50 shrink-0">[{new Date(log.time).toLocaleTimeString()}]</span>
                            <span className="uppercase font-bold shrink-0 w-12">{log.type}</span>
                            <span className="break-all">{log.message}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-gray-600 italic">No system logs available.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {activeTab === 'api' && (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="glass-panel rounded-3xl border-white/5 overflow-hidden">
                  <div className="px-8 py-6 border-b border-white/5 bg-surface/50">
                    <h3 className="font-bold flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" /> API Key Status
                    </h3>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                      <thead className="text-xs uppercase bg-black/40 text-gray-500 font-semibold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">API Name</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Last Used</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {stats?.api_keys && stats.api_keys.length > 0 ? (
                          stats.api_keys.map((key, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-gray-200">{key.name}</td>
                              <td className={`px-6 py-4 font-bold ${key.status === 'Working' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {key.status}
                              </td>
                              <td className="px-6 py-4">{key.lastUsed}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="px-6 py-8 text-center text-gray-600 italic">No API keys found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {(!['overview', 'users', 'logs', 'api', 'metrics'].includes(activeTab)) && (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-20 glass-panel rounded-3xl border-dashed border-border">
               <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Settings className="w-10 h-10 text-gray-600 animate-spin-slow" />
               </div>
               <h2 className="text-2xl font-bold mb-2 text-white">Module Under Construction</h2>
               <p className="text-gray-500 max-w-md">This section of the Onowl Core Console is currently being provisioned. Advanced metrics and infrastructure management will be available in the v1.2 update.</p>
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default Admin;