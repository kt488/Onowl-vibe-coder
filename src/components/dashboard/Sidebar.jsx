import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, FileText, Settings, Users, BarChart3, CreditCard, Bot, HelpCircle, LayoutGrid, Rocket } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'AI Projects', icon: FolderKanban, path: '/projects' },
    { name: 'Templates', icon: LayoutGrid, path: '/templates' },
    { name: 'Deployments', icon: Rocket, path: '/deployments' },
    { name: 'Files Manager', icon: FileText, path: '/files' },
    { name: 'AI Models', icon: Bot, path: '/models' },
    { name: 'Billing & Sub', icon: CreditCard, path: '/subscription' },
    { name: 'Usage Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Team Members', icon: Users, path: '/team' },
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Support', icon: HelpCircle, path: '/support' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition duration-200 ease-in-out z-50 w-64 bg-[#09090b]/90 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col lg:relative`}>
        <div className="text-2xl font-black text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">OnOwl Vibe</div>
        <nav className="flex-1 overflow-y-auto space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-xl transition-all ${
                  isActive ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={20} className={({ isActive }) => isActive ? "text-primary" : ""} />
              <span className="font-medium text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
