import React, { useState } from 'react';
import { Shield, Globe, Check, ArrowRight, Loader2 } from 'lucide-react';

export default function Step2Exposure({ sessionId, onSelectExposure, initialExposure }) {
  const [selected, setSelected] = useState(initialExposure || 'internal');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          kongExposure: selected
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSelectExposure(selected, data.policy);
      }
    } catch (err) {
      console.error('Exposure classification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">2. Kong Exposure Classification</h2>
        <p className="text-sm text-slate-400">
          How should this API be exposed? This drives policy recommendations, rate limiting defaults, and gateway routing topology.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Internal Kong Card */}
        <div
          onClick={() => setSelected('internal')}
          className={`cursor-pointer rounded-2xl p-6 transition-all border-2 flex flex-col justify-between ${
            selected === 'internal'
              ? 'bg-blue-950/20 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                selected === 'internal' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-700'
              }`}>
                {selected === 'internal' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Internal Kong Gateway</h3>
              <p className="text-xs text-slate-400 mt-1">
                Intra-cluster communication, private microservices, and internal corporate mesh.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
              <span className="font-semibold text-slate-300 block">Recommended Policies:</span>
              <ul className="space-y-1 text-slate-400">
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Key Authentication / Mutual TLS</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Correlation ID (Tracing)</span>
                </li>
              </ul>

              <span className="font-semibold text-slate-300 block pt-2">Optional Policies:</span>
              <p className="text-slate-500 text-[11px]">Rate Limiting, ACL, CORS</p>
            </div>
          </div>
        </div>

        {/* External Kong Card */}
        <div
          onClick={() => setSelected('external')}
          className={`cursor-pointer rounded-2xl p-6 transition-all border-2 flex flex-col justify-between ${
            selected === 'external'
              ? 'bg-blue-950/20 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                selected === 'external' ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-700'
              }`}>
                {selected === 'external' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">External Kong Gateway</h3>
              <p className="text-xs text-slate-400 mt-1">
                Public internet-facing APIs, customer portals, third-party integrations, and B2B partners.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
              <span className="font-semibold text-slate-300 block">Recommended Policies:</span>
              <ul className="space-y-1 text-slate-400">
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Authentication (Key Auth / OIDC / OAuth2)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Strict Rate Limiting (Traffic Protection)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Correlation ID (Tracing)</span>
                </li>
              </ul>

              <span className="font-semibold text-slate-300 block pt-2">Optional Policies:</span>
              <p className="text-slate-500 text-[11px]">CORS, ACL, IP Restriction</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Save & Continue to Spectral Lint</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
