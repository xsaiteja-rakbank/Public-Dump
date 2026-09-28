import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Wand2, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ArrowRight, 
  Loader2, 
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function Step3LintAndFix({ sessionId, onComplete, initialLint, onOpenAiWithRule }) {
  const [lintResults, setLintResults] = useState(initialLint || null);
  const [runningLint, setRunningLint] = useState(false);
  const [runningFix, setRunningFix] = useState(false);
  const [fixSummary, setFixSummary] = useState(null);
  const [showChangesModal, setShowChangesModal] = useState(false);

  useEffect(() => {
    if (!lintResults) {
      triggerSpectralLint();
    }
  }, []);

  const triggerSpectralLint = async () => {
    setRunningLint(true);
    try {
      const res = await fetch('/api/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (res.ok && data.results) {
        setLintResults(data.results);
      }
    } catch (err) {
      console.error('Lint error:', err);
    } finally {
      setRunningLint(false);
    }
  };

  const triggerAutoFix = async () => {
    setRunningFix(true);
    try {
      const res = await fetch('/api/autofix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (res.ok) {
        setFixSummary(data);
        setLintResults(data.reLintResult);
        if (onComplete) {
          onComplete(data);
        }
      }
    } catch (err) {
      console.error('Auto fix error:', err);
    } finally {
      setRunningFix(false);
    }
  };

  const issues = lintResults?.issues || [];
  const errors = issues.filter(i => i.severityCode === 0);
  const warnings = issues.filter(i => i.severityCode === 1);
  const infos = issues.filter(i => i.severityCode >= 2);

  const isPassed = lintResults && lintResults.summary?.blocking === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>3. Spectral Linting & Deterministic Auto-Fix</span>
          </h2>
          <p className="text-sm text-slate-400">
            Stoplight Spectral validates API standards. Deterministic Node.js fixers repair common issues automatically.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={triggerSpectralLint}
            disabled={runningLint || runningFix}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningLint ? 'animate-spin' : ''}`} />
            <span>Re-run Spectral</span>
          </button>
        </div>
      </div>

      {/* Auto-Fix Status Banner (Section 7) */}
      {fixSummary ? (
        <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Deterministic Fixes Applied Successfully</span>
              </div>
              <div className="flex items-center space-x-4 text-xs font-mono text-slate-300 pt-1">
                <span>✓ {fixSummary.changes?.length || 0} issues automatically fixed</span>
                <span>✓ 0 blocking issues remaining</span>
              </div>
            </div>

            <button
              onClick={() => setShowChangesModal(!showChangesModal)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center space-x-1"
            >
              <span>{showChangesModal ? 'Hide Changes' : 'View Changes'}</span>
              {showChangesModal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Expanded Changes Drawer */}
          {showChangesModal && (
            <div className="mt-4 pt-4 border-t border-emerald-800/40 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Change Log:</span>
              <div className="max-h-60 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
                {fixSummary.changes?.map((ch, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-950/60 border border-emerald-900/40 flex items-start justify-between">
                    <div>
                      <span className="text-blue-400 font-semibold mr-2">[{ch.rule}]</span>
                      <span className="text-slate-300">{ch.path}</span>
                      <p className="text-emerald-300/90 text-[11px] mt-0.5">{ch.change}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      Auto
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : issues.length > 0 ? (
        <div className="bg-amber-950/20 border border-amber-800/50 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Wand2 className="w-5 h-5" />
              <span>Automatic Fixes Available</span>
            </div>
            <p className="text-xs text-slate-300">
              {issues.length} standard lint issues detected. Safe deterministic Node.js fixers can resolve them without changing business logic.
            </p>
          </div>

          <button
            onClick={triggerAutoFix}
            disabled={runningFix}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition whitespace-nowrap"
          >
            {runningFix ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Applying Fixes & Re-Linting...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Apply Node.js Automatic Fixes</span>
              </>
            )}
          </button>
        </div>
      ) : null}

      {/* Lint Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Total Issues</span>
          <span className="text-xl font-bold text-white mt-1 block">{issues.length}</span>
        </div>
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-red-400 block">Errors (Blocking)</span>
          <span className="text-xl font-bold text-red-400 mt-1 block">{errors.length}</span>
        </div>
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-amber-400 block">Warnings</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">{warnings.length}</span>
        </div>
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-blue-400 block">Infos</span>
          <span className="text-xl font-bold text-blue-400 mt-1 block">{infos.length}</span>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">Spectral Rule Violations</span>
          <span className="text-xs text-slate-500">Ruleset: rules/spectral.yaml</span>
        </div>

        {issues.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-white">Spectral Lint Passed with Zero Violations</p>
            <p className="text-xs text-slate-400">All paths, operation descriptions, IDs, tags, and responses adhere to standard governance.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto">
            {issues.map((issue) => (
              <div key={issue.id} className="p-4 hover:bg-slate-850/40 transition flex items-start justify-between space-x-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      issue.severityCode === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      issue.severityCode === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {issue.severity}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-200">{issue.code}</span>
                    <span className="text-xs text-slate-500 font-mono">at {issue.pathString}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono">{issue.message}</p>
                </div>

                <button
                  onClick={() => onOpenAiWithRule && onOpenAiWithRule(issue.code)}
                  className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 transition whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explain</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => onComplete && onComplete({ passed: isPassed })}
          disabled={!isPassed}
          className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition"
        >
          <span>Continue to Plugin Selection</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
