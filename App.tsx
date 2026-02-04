
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { OCIConsumptionRow, ReleaseNote, AppState, EmailSchedule, AnalysisStep } from './types';
import { summarizeAndMatch, generateInsights, generateEmailDigest } from './services/geminiService';
import Papa from 'papaparse';

const SAMPLE_DATA: OCIConsumptionRow[] = [
  { sku: "B91214", productName: "Compute - Standard - E4 - OCPU", usageAmount: 450, unit: "OCPU/Hour", cost: 1250.50 },
  { sku: "B88317", productName: "Block Storage - Performance", usageAmount: 5000, unit: "GB/Month", cost: 840.00 },
  { sku: "B92322", productName: "Object Storage - Standard", usageAmount: 12000, unit: "GB/Month", cost: 315.20 },
  { sku: "B93111", productName: "Network - Outbound Data Transfer", usageAmount: 2500, unit: "GB/Month", cost: 120.00 }
];

const MOCK_RELEASES: ReleaseNote[] = [
  {
    id: "1",
    title: "Intelligence Engine Ready",
    date: "2024-05-22",
    content: "Upload CSV to begin real-time architectural matching.",
    service: "Horizon Engine",
    url: "https://docs.oracle.com/en-us/iaas/releasenotes/index.htm",
    isRelevant: true,
    matchScore: 100
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('horizon-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [state, setState] = useState<AppState>({
    consumptionData: [],
    releaseNotes: MOCK_RELEASES,
    insights: [],
    isLoading: false,
    error: null,
    analysisStep: 'idle',
    schedule: {
      frequency: 'weekly',
      dayOfWeek: 1,
      recipientEmail: 'cloud-admin@enterprise.com',
      enabled: true,
      lastSent: 'Ready'
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('horizon-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('horizon-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const processCSVData = (results: Papa.ParseResult<any>) => {
    const data = results.data;
    if (data.length === 0) return;

    const skuMap: Record<string, OCIConsumptionRow> = {};
    const rows = data[0][0] === "Subscription Plan Number" ? data.slice(1) : data;

    rows.forEach((row: any) => {
      if (!row || row.length < 9) return;
      const fullSkuString = row[2];
      if (!fullSkuString) return;

      const firstDash = fullSkuString.indexOf(' - ');
      const skuId = firstDash !== -1 ? fullSkuString.substring(0, firstDash).trim() : fullSkuString.trim();
      const productName = firstDash !== -1 ? fullSkuString.substring(firstDash + 3).trim() : fullSkuString.trim();
      
      const usage = parseFloat(row[4]) || 0;
      const cost = parseFloat(row[8]) || 0;

      if (skuMap[skuId]) {
        skuMap[skuId].usageAmount += usage;
        skuMap[skuId].cost += cost;
      } else {
        skuMap[skuId] = { sku: skuId, productName, unit: row[3], usageAmount: usage, cost: cost };
      }
    });

    const aggregatedData = Object.values(skuMap).sort((a, b) => b.cost - a.cost);
    
    // IMMEDIATE UPDATE: Show the table first
    setState(prev => ({ 
      ...prev, 
      consumptionData: aggregatedData, 
      isLoading: false,
      analysisStep: 'idle' 
    }));
    
    // Auto-start analysis but don't block
    runAnalysisWithData(aggregatedData);
  };

  const loadSampleData = () => {
    setState(prev => ({ ...prev, consumptionData: SAMPLE_DATA }));
    runAnalysisWithData(SAMPLE_DATA);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState(prev => ({ ...prev, isLoading: true, analysisStep: 'parsing' }));
    Papa.parse(file, {
      complete: processCSVData,
      error: () => setState(prev => ({ ...prev, isLoading: false, error: "CSV Error" }))
    });
  };

  const runAnalysisWithData = async (skus: OCIConsumptionRow[]) => {
    setState(prev => ({ ...prev, analysisStep: 'searching' }));
    try {
      // Step 1: Search & Map
      const { notes } = await summarizeAndMatch(state.releaseNotes, skus);
      setState(prev => ({ ...prev, releaseNotes: notes, analysisStep: 'insights' }));

      // Step 2: Insights
      const insights = await generateInsights(notes, skus);
      setState(prev => ({ 
        ...prev, 
        insights: insights, 
        analysisStep: 'complete',
        isLoading: false 
      }));

      setTimeout(() => setState(prev => ({ ...prev, analysisStep: 'idle' })), 3000);
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: "Intelligence sync failed", analysisStep: 'idle' }));
    }
  };

  const runAnalysis = () => runAnalysisWithData(state.consumptionData);

  // Added handleSendTestPreview to fix reference error and generate email digest using Gemini
  const handleSendTestPreview = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const email = await generateEmailDigest(
        state.releaseNotes.filter(n => n.isRelevant),
        "Cloud Enterprise Lead",
        state.insights
      );
      setGeneratedEmail(email);
    } catch (err) {
      console.error("Email generation error:", err);
      setState(prev => ({ ...prev, error: "Email synthesis failed" }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
      {/* Progress Bar Header */}
      {state.analysisStep !== 'idle' && state.analysisStep !== 'complete' && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-slate-200 dark:bg-slate-800">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ 
              width: state.analysisStep === 'parsing' ? '20%' : 
                     state.analysisStep === 'searching' ? '50%' : 
                     state.analysisStep === 'mapping' ? '70%' : '90%' 
            }}
          ></div>
        </div>
      )}

      {/* Analysis Status Overlay (Non-blocking) */}
      <div className={`fixed bottom-8 right-8 z-[60] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 transition-all transform ${state.analysisStep === 'idle' ? 'translate-y-32' : 'translate-y-0'}`}>
        <div className={`w-3 h-3 rounded-full ${state.analysisStep === 'complete' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analysis Status</span>
          <span className="text-xs font-bold">
            {state.analysisStep === 'parsing' && 'Aggregating CSV...'}
            {state.analysisStep === 'searching' && 'Searching OCI Roadmap...'}
            {state.analysisStep === 'mapping' && 'Mapping SKUs...'}
            {state.analysisStep === 'insights' && 'Synthesizing Insights...'}
            {state.analysisStep === 'complete' && 'Analysis Complete'}
          </span>
        </div>
      </div>

      <div className="mb-10 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-blue-600 dark:to-blue-800 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-all"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-3xl font-black tracking-tighter mb-2">
              {activeTab === 'dashboard' && 'Architecture Command Center'}
              {activeTab === 'consumption' && 'SKU Inventory Management'}
              {activeTab === 'releases' && 'Roadmap Intelligence Stream'}
              {activeTab === 'automation' && 'Executive Briefing Pipeline'}
            </h3>
            <div className="text-slate-300 font-bold max-w-xl text-sm italic space-y-2">
              <p>
                {activeTab === 'dashboard' && 'Review AI-generated strategic pillars. Data updates in real-time as analysis completes.'}
                {activeTab === 'consumption' && 'Import your OCI reports. Table renders instantly; AI analysis runs in the background.'}
                {activeTab === 'releases' && 'Matched technical updates. High match scores indicate direct impact on your footprint.'}
                {activeTab === 'automation' && 'Final synthesis for leadership. Generate reports from matched roadmap intelligence.'}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
             <button 
              onClick={runAnalysis} 
              disabled={state.consumptionData.length === 0 || state.analysisStep !== 'idle'}
              className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95 ${
                state.consumptionData.length === 0 || state.analysisStep !== 'idle'
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
             >
               {state.analysisStep === 'idle' ? '♻️ Refresh Intelligence' : '⏳ Syncing...'}
             </button>
             {state.consumptionData.length === 0 && (
               <button onClick={loadSampleData} className="px-6 py-3 bg-blue-500/20 border border-blue-400/30 text-blue-200 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500/30 transition-all active:scale-95">
                 🧪 Load Sample Portfolio
               </button>
             )}
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <Dashboard 
          consumption={state.consumptionData} 
          notes={state.releaseNotes}
          insights={state.insights}
          onViewAllUpdates={() => setActiveTab('releases')}
          onFileUpload={handleFileUpload}
        />
      )}

      {activeTab === 'consumption' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Active Footprint Analysis</h3>
              <p className="text-xs text-slate-500 font-bold">CSV parsing is handled locally for maximum performance. AI matching happens asynchronously.</p>
            </div>
            <label className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-pointer transition-all shadow-xl active:scale-95 border border-slate-700 dark:border-blue-400">
              Upload New CSV
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv" />
            </label>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">SKU ID</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Product Description</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Cost Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {state.consumptionData.map((sku) => (
                  <tr key={sku.sku} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-8 py-5 font-mono text-[10px] text-slate-400">{sku.sku}</td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-800 dark:text-slate-200">{sku.productName}</td>
                    <td className="px-8 py-5 text-xs font-black text-blue-600 dark:text-blue-400 text-right">${sku.cost.toLocaleString()}</td>
                  </tr>
                ))}
                {state.consumptionData.length === 0 && (
                  <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic">Inventory Empty</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'releases' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.releaseNotes.map((note) => (
              <div key={note.id} className="bg-white dark:bg-slate-800 p-8 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col group hover:border-blue-500/40 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${note.matchScore && note.matchScore > 80 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    Match: {note.matchScore || 0}%
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-widest rounded-md">{note.service}</span>
                  <span className="text-[8px] font-bold text-slate-400">{note.date}</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 leading-tight">{note.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 italic">{note.summary || note.content}</p>
                <a href={note.url} target="_blank" className="mt-auto text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">Verify Source ↗</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 pb-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8">Briefing Pipeline</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Recipient Cloud Lead</label>
                  <input type="email" value={state.schedule.recipientEmail} onChange={(e) => setState(prev => ({ ...prev, schedule: { ...prev.schedule, recipientEmail: e.target.value } }))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs font-bold outline-none" />
                </div>
                <button onClick={handleSendTestPreview} className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-xl">Synthesize Executive Preview</button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-slate-900 p-8 rounded-[32px] min-h-[500px] flex flex-col border border-slate-800">
               <div className="bg-white p-10 rounded-[24px] flex-1 overflow-auto custom-scrollbar">
                {generatedEmail ? (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: generatedEmail }} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-30 py-20">
                    <span className="text-6xl mb-4">📡</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">Synthesis Pending</p>
                  </div>
                )}
               </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
