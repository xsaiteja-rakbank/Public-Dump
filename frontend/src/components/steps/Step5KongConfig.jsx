import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Copy, 
  Check,
  Server,
  GitCompare
} from 'lucide-react';

export default function Step5KongConfig({ 
  sessionId, 
  environments, 
  onComplete, 
  initialConfig 
}) {
  const [selectedEnv, setSelectedEnv] = useState('develop');
  const [loading, setLoading] = useState(false);
  const [configData, setConfigData] = useState(initialConfig || null);
  const [activeTab, setActiveTab] = useState('monolithic');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateConfig(selectedEnv);
  }, [selectedEnv]);

  const generateConfig = async (targetEnv) => {
    setLoading(true);
    try {
      const res = await fetch('/api/kong/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          targetEnvironment: targetEnv
        })
      });

      const data = await res.json();
      if (res.ok) {
        setConfigData(data);
        if (onComplete) {
          onComplete(data);
        }
      }
    } catch (err) {
      console.error('Failed to generate Kong config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const envList = environments?.environments || [
    { key: 'develop', label: 'DEVELOP', present: true, url: 'https://api-dev.company.com/customer' },
    { key: 'SIT', label: 'SIT', present: true, url: 'https://api-sit.company.com/customer' },
    { key: 'UAT', label: 'UAT', present: true, url: 'https://api-uat.company.com/customer' },
    { key: 'replica', label: 'REPLICA', present: true, url: 'https://api-replica.company.com/customer' },
    { key: 'production', label: 'PRODUCTION', present: true, url: 'https://api.company.com/customer' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>5. Generated Kong decK Configuration</span>
          </h2>
          <p className="text-sm text-slate-400">
            Declarative Kong 3.0 configuration ready for decK GitOps synchronization.
          </p>
        </div>

        {/* Environment Selector (Section 14) */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <Server className="w-4 h-4 text-slate-400 ml-2" />
          <span className="text-xs text-slate-400">Target Env:</span>
          <select
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value)}
            className="bg-slate-950 text-xs font-semibold text-blue-400 border border-slate-750 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            {envList.map(e => (
              <option key={e.key} value={e.key}>
                {e.label} {e.present ? '✓' : '(Missing)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Environment Coverage Status (Section 14) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Environment Target URLs
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {envList.map((e) => (
            <div 
              key={e.key}
              onClick={() => setSelectedEnv(e.key)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                selectedEnv === e.key
                  ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/20'
                  : 'bg-slate-950/40 border-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{e.label}</span>
                <span className={`text-[10px] font-semibold px-1 rounded ${
                  e.present ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                }`}>
                  {e.present ? '✓ Found' : 'Missing'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 truncate mt-1">
                {e.url || 'Not defined in spec'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Viewer & Diff */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('monolithic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'monolithic' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>deck.yaml (Monolithic)</span>
            </button>
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'diff' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>decK Diff Preview</span>
            </button>
          </div>

          {configData && (
            <button
              onClick={() => handleCopy(configData.yamlContent)}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy YAML'}</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Generating Kong decK declarative schema...</span>
          </div>
        ) : activeTab === 'diff' ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-emerald-400 font-bold">
                +{configData?.diff?.summary?.creating || 0} creating
              </span>
              <span className="text-amber-400 font-bold">
                ~{configData?.diff?.summary?.updating || 0} updating
              </span>
              <span className="text-red-400 font-bold">
                -{configData?.diff?.summary?.deleting || 0} deleting
              </span>
            </div>

            <div className="space-y-2">
              {configData?.diff?.changes?.map((ch, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start space-x-3 font-mono text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    CREATE
                  </span>
                  <div>
                    <span className="text-slate-300 font-semibold">{ch.type}: {ch.name}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{ch.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <pre className="p-6 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[450px]">
            {configData?.yamlContent || 'Generating configuration...'}
          </pre>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => onComplete && onComplete(configData)}
          disabled={!configData}
          className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition"
        >
          <span>Continue to Final 5-Point Validation</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
