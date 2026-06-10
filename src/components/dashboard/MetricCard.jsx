import React from 'react';

const MetricCard = ({ title, value, icon: Icon, glow }) => {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all group">
      <div>
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform ${glow || 'text-blue-500'}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default MetricCard;
