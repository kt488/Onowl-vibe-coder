import React from 'react';
import { Search, Bell, User, Sun, Zap, Menu } from 'lucide-react';

const TopBar = ({ toggleSidebar, credits }) => {
  return (
    <div className="bg-[#09090b]/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/10 sticky top-0 z-20">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white mr-4">
          <Menu size={24} />
        </button>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full md:w-96 focus-within:border-primary/50 transition-colors">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="bg-transparent border-none text-sm text-white focus:ring-0 ml-2 w-full outline-none"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4 md:space-x-6">
        <div className="flex items-center space-x-2 text-yellow-400 font-bold bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/20">
          <Zap size={16} />
          <span className="text-sm">{credits !== undefined ? credits.toLocaleString() : '...'} Credits</span>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Sun size={20} />
        </button>
        <div className="bg-white/10 border border-white/10 p-2 rounded-full text-white cursor-pointer hover:bg-white/20 transition-all">
          <User size={18} />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
