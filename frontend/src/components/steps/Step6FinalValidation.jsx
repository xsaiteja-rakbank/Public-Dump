import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  RefreshCw,
  FileCheck,
  Terminal,
  Server
} from 'lucide-react';

export default function Step6FinalValidation({ sessionId, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [validationData, setValidationData] = useState(null);

  useEffect(() => {
    runFinalValidation();
  }, []);

  const runFinalValidation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/validate/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (res.ok) {
        setValidationData(data);
        if (onComplete && data.allPassed) {
          onComplete(data);
        }
      }
    } catch (err) {
      console.error('Final validation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const pipe = validationData?.pipeline;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">6. Final 5-Point Validation Pipeline</h2>
        <p className="text-sm text-slate-400">
          Strict deterministic pre-commit gate. All 5 validation checkpoints must pass before code is committed to Git.
        </p>
      </div>

      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-slate-300 font-semibold">Running comprehensive validation pipeline...</p>
          <div className="text-xs text-slate-500 space-y-1">
            <p>1. Verifying OpenAPI specifications & schema references...</p>
            <p>2. Executing Spectral linting against rules/spectral.yaml...</p>
            <p>3. Validating decK 3.0 service & route hierarchies...</p>
          </div>
        </div>
      ) : validationData ? (
        <div className="space-y-4">
          {/* Main Status Banner */}
          <div className={`p-6 rounded-2xl border flex items-center justify-between ${
            validationData.allPassed
              ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-400'
              : 'bg-red-950/20 border-red-800/60 text-red-400'
          }`}>
            <div className="flex items-center space-x-3">
              {validationData.allPassed ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
              <div>
                <h3 className="text-lg font-bold text-white">
                  {validationData.allPassed ? 'All Validation Checkpoints Passed' : 'Validation Pipeline Blocked'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {validationData.allPassed
                    ? 'Generated artifacts are fully compliant with Kong Enterprise standards.'
                    : 'Blocking issues detected. Resolve them before attempting Git push.'}
                </p>
              </div>
            </div>

            <button
              onClick={runFinalValidation}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-check</span>
            </button>
          </div>

          {/* 5 Checkpoint Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Checkpoint 1: OpenAPI Schema */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-blue-400" />
                  <span>1. OpenAPI 3.0 Structure & $refs</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  pipe?.openapi?.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {pipe?.openapi?.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Deterministic schema verification and JSON reference resolution.
              </p>
            </div>

            {/* Checkpoint 2: Spectral Ruleset */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>2. Spectral Lint Compliance</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  pipe?.spectral?.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {pipe?.spectral?.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Zero blocking violations in central governance ruleset.
              </p>
            </div>

            {/* Checkpoint 3: Kong Config */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>3. Kong decK Configuration</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  pipe?.kongConfig?.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {pipe?.kongConfig?.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Service, route, and plugin entity hierarchies.
              </p>
            </div>

            {/* Checkpoint 4: Plugin Schemas */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>4. decK Structure Verification</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  pipe?.deck?.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {pipe?.deck?.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Kong decK format version 3.0 syntax check.
              </p>
            </div>
          </div>

          {/* Checkpoint 5: Environment URL Check */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-2">
                <Server className="w-4 h-4 text-amber-400" />
                <span>5. Environment Coverage</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                pipe?.environments?.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {pipe?.environments?.passed ? 'COMPLETE' : 'WARNING'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {pipe?.environments?.missing?.length === 0
                ? 'All 5 enterprise target environments (develop, SIT, UAT, replica, production) mapped.'
                : `Missing environments: ${pipe?.environments?.missing?.join(', ')}`}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end pt-4">
        <button
          onClick={() => onComplete && onComplete(validationData)}
          disabled={!validationData?.allPassed}
          className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition"
        >
          <span>Proceed to GitOps Repository & Push</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
