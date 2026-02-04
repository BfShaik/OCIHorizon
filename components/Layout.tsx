
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, isDarkMode, toggleDarkMode }) => {
  const tabs = [
    { id: 'dashboard', label: 'Command Center', icon: '🎯' },
    { id: 'consumption', label: 'SKU Inventory', icon: '📋' },
    { id: 'releases', label: 'Intelligence Stream', icon: '🚀' },
    { id: 'automation', label: 'Briefing Pipeline', icon: '📧' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-300 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 z-20">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
              H
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter leading-none">Horizon</h1>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">OCI Advisor</span>
            </div>
          </div>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-bold text-sm tracking-tight">{tab.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="mt-auto pt-8 border-t border-slate-800">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
              <p className="text-slate-500 mb-2 font-black text-[9px] uppercase tracking-widest">Architect Profile</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="font-bold text-xs text-slate-200">Cloud Enterprise Lead</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <h2 className="text-xl font-black text-slate-900 dark:text-white capitalize tracking-tight">
               {activeTab.replace('-', ' ')}
             </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleDarkMode}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">Horizon Intelligence</p>
              <div className="flex items-center gap-2 justify-end">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Roadmap Feed</span>
              </div>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
