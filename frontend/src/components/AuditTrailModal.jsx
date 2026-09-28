import React, { useState, useEffect } from 'react';
import { History, X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export default function AuditTrailModal({ isOpen, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAuditRecords();
    }
  }, [isOpen]);

  const fetchAuditRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit/records');
      const data = await res.json();
      setRecords(data.records || []);
      if (data.records?.length > 0) {
        setSelectedRecord(data.records[0]);
      }
    } catch (err) {
      console.error('Failed to load audit records:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Kong Onboarding Audit Trail</h3>
              <p className="text-xs text-slate-400">Section 22 immutable enterprise audit records</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden">
          {/* Records List */}
          <div className="md:col-span-5 border-r border-slate-800 pr-3 overflow-y-auto space-y-2">
            {records.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No onboarding records yet.</p>
            ) : (
              records.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecord(r)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedRecord?.id === r.id
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-slate-950/40 border-slate-850 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{r.apiName}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                      {r.kongType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>{r.targetEnvironment}</span>
                    <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Record Details View */}
          <div className="md:col-span-7 pl-2 overflow-y-auto">
            {selectedRecord ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>Audit ID: {selectedRecord.id}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
                      {selectedRecord.gitPushStatus}
                    </span>
                  </div>
                  <pre className="text-slate-300 text-[11px] whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(selectedRecord, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Select a record to inspect JSON.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
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
