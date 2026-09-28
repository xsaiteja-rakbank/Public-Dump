import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  GitPullRequest, 
  CheckCircle2, 
  Upload, 
  Loader2, 
  FolderGit2, 
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function Step7GitPush({ 
  sessionId, 
  apiName = 'Customer API', 
  onSuccess 
}) {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('customer-api-kong');
  const [targetEnv, setTargetEnv] = useState('UAT');
  const [targetBranch, setTargetBranch] = useState('UAT');
  const [featureBranch, setFeatureBranch] = useState(`feature/${apiName.toLowerCase().replace(/\s+/g, '-')}-onboarding`);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const res = await fetch('/api/git/repositories');
      const data = await res.json();
      setRepositories(data.repositories || []);
    } catch (err) {
      console.error('Failed to fetch Git repositories:', err);
    }
  };

  const handlePush = async () => {
    setPushing(true);
    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          repositoryId: selectedRepo,
          targetEnvironment: targetEnv,
          targetBranch: targetBranch
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPushResult(data);
        if (onSuccess) {
          onSuccess(data);
        }
      }
    } catch (err) {
      console.error('Git push failed:', err);
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">7. GitOps Push & Pull Request</h2>
        <p className="text-sm text-slate-400">
          Commit generated Kong decK configurations and corrected OpenAPI specifications to your GitOps repository.
        </p>
      </div>

      {pushResult ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-6">
          <div className="flex items-center space-x-4 pb-6 border-b border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Push Completed Successfully
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                Branch Created & Kong Config Committed
              </h3>
              <p className="text-xs text-slate-400">
                Audit trail recorded and Pull Request ready for peer review.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
              <span className="text-[11px] text-slate-400 block">Repository</span>
              <span className="text-xs font-bold text-white font-mono mt-1 block truncate">
                {pushResult.pushResult?.repository}
              </span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
              <span className="text-[11px] text-slate-400 block">Target Base Branch</span>
              <span className="text-xs font-bold text-blue-400 font-mono mt-1 block">
                {pushResult.pushResult?.baseBranch}
              </span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
              <span className="text-[11px] text-slate-400 block">Feature Branch</span>
              <span className="text-xs font-bold text-purple-400 font-mono mt-1 block truncate">
                {pushResult.pushResult?.featureBranch}
              </span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
              <span className="text-[11px] text-slate-400 block">Commit Hash</span>
              <span className="text-xs font-bold text-emerald-400 font-mono mt-1 block">
                {pushResult.pushResult?.commitHash?.slice(0, 7) || 'HEAD'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Committed Files:</span>
            <div className="space-y-1 font-mono text-xs text-slate-400">
              {pushResult.pushResult?.filesCommitted?.map((file, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>{file}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full Audit Trail JSON has been archived.</span>
            </div>

            <a
              href={pushResult.pushResult?.pr?.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition"
            >
              <GitPullRequest className="w-4 h-4" />
              <span>Create Pull Request</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-4">
            {/* Repository Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <FolderGit2 className="w-4 h-4 text-blue-400" />
                <span>Target Git Repository</span>
              </label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              >
                {repositories.map(r => (
                  <option key={r.id} value={r.id}>{r.name} - {r.description}</option>
                ))}
              </select>
            </div>

            {/* Target Environment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">Target Environment</label>
                <select
                  value={targetEnv}
                  onChange={(e) => {
                    setTargetEnv(e.target.value);
                    setTargetBranch(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="develop">develop</option>
                  <option value="SIT">SIT</option>
                  <option value="UAT">UAT</option>
                  <option value="replica">replica</option>
                  <option value="production">production</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">Target Base Branch</label>
                <input
                  type="text"
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Feature Branch */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <GitBranch className="w-4 h-4 text-purple-400" />
                <span>Onboarding Feature Branch (Auto-created)</span>
              </label>
              <input
                type="text"
                value={featureBranch}
                onChange={(e) => setFeatureBranch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                The platform creates a temporary feature branch rather than committing directly to environment branches.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handlePush}
              disabled={pushing}
              className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition"
            >
              {pushing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Committing & Pushing to Git...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Commit & Push to Git</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
