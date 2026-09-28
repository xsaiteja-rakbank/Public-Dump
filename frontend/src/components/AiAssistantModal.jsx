import React, { useState, useEffect } from 'react';
import { Sparkles, X, ShieldAlert, Puzzle, Lightbulb } from 'lucide-react';

export default function AiAssistantModal({ isOpen, onClose, initialRule, initialPlugin }) {
  const [ruleCode, setRuleCode] = useState(initialRule || 'operation-description');
  const [ruleExplanation, setRuleExplanation] = useState(null);
  const [pluginName, setPluginName] = useState(initialPlugin || 'rate-limiting');
  const [pluginExplanation, setPluginExplanation] = useState(null);
  const [activeTab, setActiveTab] = useState(initialPlugin ? 'plugin' : 'rule');

  useEffect(() => {
    if (initialRule) {
      setRuleCode(initialRule);
      setActiveTab('rule');
    }
  }, [initialRule]);

  useEffect(() => {
    if (initialPlugin) {
      setPluginName(initialPlugin);
      setActiveTab('plugin');
    }
  }, [initialPlugin]);

  useEffect(() => {
    if (isOpen) {
      loadRuleExplanation(ruleCode);
      loadPluginExplanation(pluginName);
    }
  }, [isOpen, ruleCode, pluginName]);

  const loadRuleExplanation = async (code) => {
    try {
      const res = await fetch(`/api/ai/explain-lint?rule=${code}`);
      const data = await res.json();
      setRuleExplanation(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPluginExplanation = async (pName) => {
    try {
      const res = await fetch(`/api/ai/explain-plugin?plugin=${pName}`);
      const data = await res.json();
      setPluginExplanation(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Assistant & Explanations</h3>
              <p className="text-xs text-slate-400">Section 23 Assistive Intelligence & Guidance</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
          <button
            onClick={() => setActiveTab('rule')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'rule' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Spectral Rule Explanations</span>
          </button>
          <button
            onClick={() => setActiveTab('plugin')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'plugin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span>Plugin Policy Rationale</span>
          </button>
        </div>

        {activeTab === 'rule' ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Select Rule to Explain:</label>
              <select
                value={ruleCode}
                onChange={(e) => setRuleCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
              >
                <option value="operation-description">operation-description</option>
                <option value="operation-operationId">operation-operationId</option>
                <option value="operation-tags">operation-tags</option>
                <option value="response-description">response-description</option>
                <option value="api-description">api-description</option>
              </select>
            </div>

            {ruleExplanation && (
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-indigo-400 flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>{ruleExplanation.title}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {ruleExplanation.explanation}
                </p>
                <div className="bg-indigo-950/20 p-3 rounded-lg border border-indigo-900/40">
                  <span className="text-[11px] font-semibold text-indigo-300 block mb-1">Recommended Remediation:</span>
                  <p className="text-xs text-slate-400 font-mono">{ruleExplanation.remediation}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Select Plugin Policy:</label>
              <select
                value={pluginName}
                onChange={(e) => setPluginName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
              >
                <option value="rate-limiting">Rate Limiting</option>
                <option value="correlation-id">Correlation ID</option>
                <option value="key-auth">Key Authentication</option>
                <option value="cors">CORS</option>
                <option value="acl">ACL</option>
                <option value="openid-connect">OpenID Connect</option>
                <option value="ip-restriction">IP Restriction</option>
              </select>
            </div>

            {pluginExplanation && (
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-indigo-400 flex items-center space-x-2">
                  <Puzzle className="w-4 h-4" />
                  <span>{pluginExplanation.plugin}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {pluginExplanation.explanation}
                </p>
                <div className="bg-indigo-950/20 p-3 rounded-lg border border-indigo-900/40">
                  <span className="text-[11px] font-semibold text-indigo-300 block mb-1">Exposure Context:</span>
                  <p className="text-xs text-slate-400 font-mono">{pluginExplanation.context}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
