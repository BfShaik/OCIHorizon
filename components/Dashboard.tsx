import React, { useState, useRef } from 'react';
import { OCIConsumptionRow, ReleaseNote, StrategicInsight } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  consumption: OCIConsumptionRow[];
  notes: ReleaseNote[];
  insights: StrategicInsight[];
  onViewAllUpdates: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ consumption, notes, insights, onViewAllUpdates, onFileUpload }) => {
  const [executing, setExecuting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const topSKUs = [...consumption]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  const stats = [
    { label: 'Inventory Count', value: consumption.length, icon: '📦' },
    { label: 'Roadmap Matches', value: notes.filter(n => (n.matchScore || 0) > 50).length, icon: '🧠' },
    { label: 'AI Pillars', value: insights.length, icon: '🎯' },
    { label: 'Spend Coverage', value: `$${consumption.reduce((acc, curr) => acc + curr.cost, 0).toLocaleString()}`, icon: '💎' },
  ];

  const handleExecuteAction = (title: string) => {
    setExecuting(title);
    setTimeout(() => {
      setExecuting(null);
      alert(`Strategy Executed: ${title}\nHorizon is preparing technical requirements.`);
    }, 1200);
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-blue-500/30 transition-all">
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-slate-50 dark:bg-slate-900 group-hover:scale-110 transition-transform">{stat.icon}</div>
          </div>
        ))}
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Grounded Pillar Insights</h3>
          {insights.length === 0 && consumption.length > 0 && (
            <span className="text-[10px] font-black uppercase text-blue-500 animate-pulse">🤖 Analysis in progress...</span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {insights.length > 0 ? insights.map((insight, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all flex flex-col group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl grayscale group-hover:scale-125 transition-transform">
                {insight.type === 'cost' ? '📉' : insight.type === 'security' ? '🛡️' : '🗺️'}
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${insight.impact === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                  {insight.impact} impact
                </span>
                {insight.savings && <span className="text-green-600 text-[9px] font-black bg-green-50 px-2 py-1 rounded-lg">{insight.savings}</span>}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-tight">{insight.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-6 flex-1 italic">{insight.description}</p>
              <button 
                onClick={() => handleExecuteAction(insight.title)}
                disabled={executing === insight.title}
                className="w-full py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95"
              >
                {executing === insight.title ? 'Synthesizing...' : insight.actionLabel}
              </button>
            </div>
          )) : (
            <div className="col-span-full bg-slate-100/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[40px] p-16 text-center flex flex-col items-center">
              <span className="text-5xl mb-6 block opacity-40 animate-bounce">🛸</span>
              <p className="text-slate-700 dark:text-slate-200 font-black uppercase text-sm tracking-widest">Awaiting OCI Architecture Input</p>
              <p className="text-xs text-slate-400 mt-2 mb-8 max-w-sm mx-auto italic">Table renders instantly. AI roadmap matching starts automatically after upload.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95"
                >
                  📁 Select Consumption CSV
                  <input ref={fileInputRef} type="file" className="hidden" onChange={onFileUpload} accept=".csv" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 uppercase tracking-widest">Cost Concentration</h3>
          <div className="h-[250px]">
            {topSKUs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSKUs}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700/50" />
                  <XAxis dataKey="sku" hide />
                  <YAxis tick={{fill: '#94a3b8'}} fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={({ active, payload }) => active && payload ? (
                      <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-[10px]">
                        <p className="font-black mb-1">{payload[0].payload.productName}</p>
                        <p className="text-blue-400 font-bold">${payload[0].value?.toLocaleString()}</p>
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="cost" radius={[10, 10, 10, 10]} barSize={24}>
                    {topSKUs.map((_, i) => <Cell key={i} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'][i % 5]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center opacity-10">
                <span className="text-6xl font-black italic">No Data Mapping</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] text-white border border-slate-800">
          <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-widest">
            <span>📡</span> Live Signals
          </h3>
          <div className="space-y-6">
            {notes.filter(n => n.isRelevant).slice(0, 3).map((note) => (
              <div key={note.id} onClick={onViewAllUpdates} className="group cursor-pointer border-l-2 border-slate-800 pl-4 hover:border-blue-500 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-blue-400">{note.service}</span>
                  <span className="text-[8px] text-slate-700">{note.date}</span>
                </div>
                <h4 className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors line-clamp-2 leading-tight">{note.title}</h4>
              </div>
            ))}
            {notes.length <= 1 && <div className="py-12 text-center opacity-20 font-black uppercase text-[10px] tracking-widest">Standby...</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;