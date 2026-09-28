import React from 'react';
import { 
  FileCode, 
  Network, 
  CheckCircle2, 
  ShieldAlert, 
  Puzzle, 
  Sliders, 
  GitBranch, 
  Check
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'API Spec', icon: FileCode, desc: 'Upload & Validate' },
  { id: 2, label: 'Exposure', icon: Network, desc: 'Internal / External' },
  { id: 3, label: 'Lint & Fix', icon: ShieldAlert, desc: 'Spectral & Fixers' },
  { id: 4, label: 'Plugins', icon: Puzzle, desc: 'Policy & Catalog' },
  { id: 5, label: 'Kong Config', icon: Sliders, desc: 'decK Generation' },
  { id: 6, label: 'Validation', icon: CheckCircle2, desc: '5-Point Audit' },
  { id: 7, label: 'GitOps', icon: GitBranch, desc: 'Commit & Push' },
];

export default function WorkflowStepper({ currentStep, setStep, maxCompletedStep }) {
  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />

        {STEPS.map((step) => {
          const Icon = step.icon;
          const isCurrent = currentStep === step.id;
          const isDone = currentStep > step.id || maxCompletedStep >= step.id;
          const isClickable = step.id <= maxCompletedStep + 1;

          return (
            <div 
              key={step.id} 
              className="flex flex-col items-center relative z-10"
              onClick={() => isClickable && setStep(step.id)}
            >
              <button
                disabled={!isClickable}
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-semibold transition-all duration-200 ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/30 scale-105'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : isClickable
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                    : 'bg-slate-850 text-slate-600 border border-slate-800/80 cursor-not-allowed'
                }`}
              >
                {isDone && !isCurrent ? (
                  <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </button>
              <span className={`text-xs font-medium mt-2 text-center ${
                isCurrent ? 'text-blue-400 font-semibold' : isDone ? 'text-slate-200' : 'text-slate-500'
              }`}>
                {step.label}
              </span>
              <span className="text-[10px] text-slate-500 hidden md:block">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
