import React from 'react';
import { Layers, ShieldCheck, History, Sparkles } from 'lucide-react';

export default function Header({ onOpenAudit, onOpenAi }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Kong API Onboarding</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Self-Service Platform
              </span>
            </div>
            <p className="text-xs text-slate-400">Automated OpenAPI validation, Spectral linting, Kong decK generation & GitOps</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenAi}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={onOpenAudit}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 transition-colors"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Audit Trail</span>
          </button>

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">Backend Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}
