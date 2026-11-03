import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Terminal, Cpu, Server, Check } from 'lucide-react';

interface ProvisioningStep {
  id: number;
  label: string;
  description: string;
}

const STEPS: ProvisioningStep[] = [
  { id: 1, label: 'Creating isolated workspace', description: 'Allocating temporary container sandbox' },
  { id: 2, label: 'Pulling project template', description: 'Mounting starter files and configuration' },
  { id: 3, label: 'Starting runtime agent', description: 'Initializing Node.js & language tools' },
  { id: 4, label: 'Connecting IDE session', description: 'Workspace ready. Launching editor...' },
];

interface WorkspaceProvisioningProps {
  assignmentTitle: string;
  onComplete: () => void;
}

export function WorkspaceProvisioning({ assignmentTitle, onComplete }: WorkspaceProvisioningProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [logs, setLogs] = useState<string[]>([
    '[qf-agent] Initializing Coder-style cloud workspace...',
  ]);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurrentStep(2);
      setLogs((prev) => [...prev, '[storage] Workspace volume mounted at /home/workspace', '[git] Extracted assignment starter files successfully']);
    }, 700);

    const timer2 = setTimeout(() => {
      setCurrentStep(3);
      setLogs((prev) => [...prev, '[agent] Node.js runtime agent listening on IPC socket', '[agent] Language server protocol ready']);
    }, 1500);

    const timer3 = setTimeout(() => {
      setCurrentStep(4);
      setLogs((prev) => [...prev, '[network] TCP tunnel established', '[ui] Cloud IDE session authenticated', '[ready] Launching VS Code interface...']);
    }, 2300);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#141416] border border-neutral-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl text-neutral-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#7B0FE8] text-white flex items-center justify-center font-black text-sm shadow-sm">
              Q
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">Provisioning Cloud Workspace</h3>
              <p className="text-xs text-neutral-400 line-clamp-1">{assignmentTitle}</p>
            </div>
          </div>
          <span className="font-mono text-xs text-[#7B0FE8] bg-purple-950/60 border border-purple-800/50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7B0FE8] animate-ping" />
            Provisioning
          </span>
        </div>

        {/* Steps Progress */}
        <div className="space-y-3 mb-6">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'bg-purple-950/30 border-[#7B0FE8]/60 text-white'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-neutral-200'
                    : 'bg-neutral-900/40 border-neutral-800/60 text-neutral-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? 'bg-emerald-500 text-black'
                        : isCurrent
                        ? 'bg-[#7B0FE8] text-white animate-pulse'
                        : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{step.label}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{step.description}</div>
                  </div>
                </div>

                <div>
                  {isCurrent && <Loader2 className="w-4 h-4 text-[#7B0FE8] animate-spin" />}
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Console Activity Log */}
        <div className="bg-[#0D0D0F] border border-neutral-800/80 rounded-xl p-3 font-mono text-[11px] text-neutral-400 max-h-36 overflow-y-auto space-y-1">
          <div className="text-neutral-500 text-[10px] pb-1 border-b border-neutral-800/40 flex items-center justify-between">
            <span>// Provisioning Log Stream</span>
            <span className="text-neutral-600">Coder Engine v2.4</span>
          </div>
          {logs.map((log, i) => (
            <div key={i} className="leading-relaxed">
              <span className="text-[#7B0FE8] mr-1.5">›</span>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
