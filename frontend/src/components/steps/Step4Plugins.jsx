import React, { useState, useEffect } from 'react';
import { 
  Puzzle, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Sliders, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function Step4Plugins({ 
  sessionId, 
  kongExposure = 'internal', 
  onComplete, 
  initialPlugins,
  onOpenAiWithPlugin 
}) {
  const [frequentlyUsed, setFrequentlyUsed] = useState([]);
  const [allPlugins, setAllPlugins] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [selectedPlugins, setSelectedPlugins] = useState(initialPlugins || []);
  const [activePluginTab, setActivePluginTab] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlugins();
  }, [kongExposure]);

  const fetchPlugins = async () => {
    try {
      const res = await fetch(`/api/plugins?exposure=${kongExposure}`);
      const data = await res.json();
      setFrequentlyUsed(data.frequentlyUsed || []);
      setAllPlugins(data.allPlugins || []);
      setPolicy(data.policy || null);

      // Pre-select recommended plugins if none are selected yet
      if (selectedPlugins.length === 0 && data.policy?.recommended) {
        const initial = [];
        for (const recName of data.policy.recommended) {
          const schema = data.allPlugins.find(p => p.name === recName);
          if (schema) {
            const defaults = data.policy.defaults?.[recName] || {};
            const initialConfig = {};
            schema.fields?.forEach(f => {
              initialConfig[f.name] = defaults[f.name] !== undefined ? defaults[f.name] : f.default;
            });
            initial.push({
              name: schema.name,
              displayName: schema.displayName,
              enabled: true,
              config: initialConfig
            });
          }
        }
        setSelectedPlugins(initial);
        if (initial.length > 0) {
          setActivePluginTab(initial[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to fetch plugins:', err);
    }
  };

  const isPluginSelected = (name) => selectedPlugins.some(p => p.name === name);

  const togglePlugin = (plugin) => {
    if (isPluginSelected(plugin.name)) {
      const updated = selectedPlugins.filter(p => p.name !== plugin.name);
      setSelectedPlugins(updated);
      if (activePluginTab === plugin.name) {
        setActivePluginTab(updated[0]?.name || null);
      }
    } else {
      const initialConfig = {};
      const policyDefaults = policy?.defaults?.[plugin.name] || {};
      plugin.fields?.forEach(f => {
        initialConfig[f.name] = policyDefaults[f.name] !== undefined ? policyDefaults[f.name] : f.default;
      });

      const updated = [
        ...selectedPlugins,
        {
          name: plugin.name,
          displayName: plugin.displayName,
          enabled: true,
          config: initialConfig
        }
      ];
      setSelectedPlugins(updated);
      setActivePluginTab(plugin.name);
    }
  };

  const handleConfigChange = (pluginName, fieldName, value) => {
    setSelectedPlugins(prev => prev.map(p => {
      if (p.name === pluginName) {
        return {
          ...p,
          config: {
            ...p.config,
            [fieldName]: value
          }
        };
      }
      return p;
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/plugins/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          plugins: selectedPlugins
        })
      });

      const data = await res.json();
      if (res.ok) {
        onComplete(selectedPlugins);
      }
    } catch (err) {
      console.error('Save plugins error:', err);
    } finally {
      setSaving(false);
    }
  };

  const activeSchema = allPlugins.find(p => p.name === activePluginTab);
  const activeSelected = selectedPlugins.find(p => p.name === activePluginTab);

  const filteredCatalog = allPlugins.filter(p =>
    p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>4. Plugin Selection & Configuration</span>
          </h2>
          <p className="text-sm text-slate-400">
            Select and configure enterprise Kong gateway plugins. Policies are tailored for{' '}
            <span className="font-semibold text-blue-400 uppercase">{kongExposure}</span> exposure.
          </p>
        </div>

        <button
          onClick={() => setShowCatalogModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-600/20 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Plugin from Catalog</span>
        </button>
      </div>

      {/* Frequently Used Plugins Grid */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Frequently Used Plugins
          </span>
          <span className="text-xs text-slate-500">
            {selectedPlugins.length} of {allPlugins.length} active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {frequentlyUsed.map((plugin) => {
            const isSelected = isPluginSelected(plugin.name);
            const isRecommended = policy?.recommended?.includes(plugin.name);

            return (
              <div
                key={plugin.name}
                onClick={() => togglePlugin(plugin)}
                className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-950/30 border-blue-500/80 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-white block">
                    {plugin.displayName}
                  </span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-blue-600 border-slate-700 bg-slate-900 focus:ring-0"
                  />
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase">{plugin.category}</span>
                  {isRecommended && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Recommended
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Plugins Configuration Area */}
      {selectedPlugins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden p-6">
          {/* Plugin Tabs List */}
          <div className="md:col-span-4 border-r border-slate-800/80 pr-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Configured Plugins
            </span>
            <div className="space-y-1.5">
              {selectedPlugins.map((plugin) => (
                <div
                  key={plugin.name}
                  onClick={() => setActivePluginTab(plugin.name)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                    activePluginTab === plugin.name
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-950/40 text-slate-300 hover:bg-slate-850 border border-slate-850'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Sliders className="w-3.5 h-3.5 opacity-70" />
                    <span className="truncate">{plugin.displayName || plugin.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlugin({ name: plugin.name });
                    }}
                    className="text-slate-400 hover:text-red-400 p-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Plugin Dynamic Form */}
          <div className="md:col-span-8 pl-2 space-y-4">
            {activeSelected && activeSchema ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <span>{activeSchema.displayName}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {activeSchema.name}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{activeSchema.description}</p>
                  </div>

                  <button
                    onClick={() => onOpenAiWithPlugin && onOpenAiWithPlugin(activeSchema.name)}
                    className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain Policy</span>
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {activeSchema.fields?.map((field) => {
                    const currentVal = activeSelected.config?.[field.name];

                    return (
                      <div key={field.name} className="space-y-1.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">
                            {field.label || field.name}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </label>
                          <span className="text-[10px] text-slate-500 font-mono">{field.type}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{field.description}</p>

                        {field.type === 'boolean' ? (
                          <div className="pt-1">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(currentVal)}
                                onChange={(e) => handleConfigChange(activeSelected.name, field.name, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                              <span className="ml-2 text-xs font-mono text-slate-300">{currentVal ? 'Enabled' : 'Disabled'}</span>
                            </label>
                          </div>
                        ) : field.type === 'select' ? (
                          <select
                            value={currentVal || ''}
                            onChange={(e) => handleConfigChange(activeSelected.name, field.name, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={Array.isArray(currentVal) ? currentVal.join(', ') : (currentVal !== undefined ? currentVal : '')}
                            onChange={(e) => {
                              const v = field.type === 'array' ? e.target.value.split(',').map(s => s.trim()) : e.target.value;
                              handleConfigChange(activeSelected.name, field.name, v);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select a configured plugin on the left to edit its parameters.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800 text-slate-400 text-xs">
          No plugins selected yet. Click any frequently used plugin above or search the catalog to add.
        </div>
      )}

      {/* Searchable Catalog Modal (Section 10) */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Kong Plugin Catalog</h3>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plugin by name or category (e.g. oidc, rate-limiting, cors)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredCatalog.map((plugin) => {
                const isSelected = isPluginSelected(plugin.name);
                return (
                  <div
                    key={plugin.name}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-850 flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">{plugin.displayName}</span>
                        <span className="text-[10px] font-mono text-slate-500">({plugin.name})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{plugin.description}</p>
                    </div>

                    <button
                      onClick={() => togglePlugin(plugin)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        isSelected
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      {isSelected ? 'Remove' : 'Add Plugin'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSubmit}
          disabled={saving || selectedPlugins.length === 0}
          className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Save & Generate Kong Configuration</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
