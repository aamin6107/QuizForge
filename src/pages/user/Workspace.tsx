import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Code2,
  Terminal,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { CodingWorkspace } from '../../components/CodingWorkspace';
import { api } from '../../lib/api';

const DEFAULT_CODER_URL = import.meta.env.VITE_CODER_URL || 'http://localhost:3000';

export default function WorkspacePage() {
  const navigate = useNavigate();
  const [coderStatus, setCoderStatus] = useState<{ online: boolean; url: string }>({
    online: false,
    url: DEFAULT_CODER_URL,
  });
  const [checkingStatus, setCheckingStatus] = useState(true);

  const sampleStarterCode = `function reverseWords(str) {
  // Try writing your solution here
  return str.split(' ').reverse().join(' ');
}`;

  const sampleTestCases = [
    { input: '"hello world"', expected: '"world hello"' },
    { input: '"QuizForge built-in workspace"', expected: '"workspace built-in QuizForge"' },
    { input: '"the sky is blue"', expected: '"blue is sky the"' },
  ];

  const checkStatus = async () => {
    try {
      setCheckingStatus(true);
      const res = await api.workspace.getStatus();
      setCoderStatus(res);
    } catch {
      setCoderStatus({ online: false, url: DEFAULT_CODER_URL });
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenFullIDE = async () => {
    try {
      await api.workspace.openLog();
    } catch {}
    window.open(coderStatus.url || DEFAULT_CODER_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase text-[#7B0FE8] bg-purple-50 px-2.5 py-0.5 rounded">
            Developer Environments
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight mt-1">
            Coding Workspaces
          </h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
            Choose between the built-in quick editor for quiz challenges or launch a full cloud IDE for multi-file development.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            pill
            onClick={() => navigate('/app/assignments')}
            className="text-xs font-semibold gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7B0FE8]" />
            <span>My Assignments</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            pill
            onClick={checkStatus}
            disabled={checkingStatus}
            className="text-xs"
          >
            {checkingStatus ? 'Pinging…' : 'Check Coder'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            pill
            onClick={handleOpenFullIDE}
            className="gap-2 shadow-sm font-semibold text-xs"
          >
            <span>Open Full IDE (Coder)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Difference Explanation Banner: Quick Editor vs Full IDE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Editor Explanation */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded uppercase">
                In-Browser Runtime
              </span>
              <Badge variant="purple" mono>Integrated</Badge>
            </div>
            <h3 className="text-base font-bold text-neutral-950 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#7B0FE8]" />
              Quick Editor
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Designed for <strong>quiz questions, coding assessments, and standalone algorithms</strong>. Executes in an isolated 5-second sandbox with instant test case feedback, console logs, and auto-grading. Zero setup or container startup time.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-4 text-[11px] font-mono text-neutral-500">
            <span>✓ Timed Sandbox</span>
            <span>✓ Auto-Graded</span>
            <span>✓ Per-Test Results</span>
          </div>
        </div>

        {/* Full IDE Explanation */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-xs flex flex-col justify-between border-t-2 border-t-[#7B0FE8]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold text-white bg-[#7B0FE8] px-2 py-0.5 rounded uppercase">
                Secondary Option
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    coderStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                  }`}
                />
                <span className={`text-[11px] font-bold font-mono ${coderStatus.online ? 'text-emerald-700' : 'text-neutral-500'}`}>
                  {coderStatus.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <h3 className="text-base font-bold text-neutral-950 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#7B0FE8]" />
              Full IDE (Coder)
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Designed for <strong>larger projects, full repositories, multi-file codebases, and terminal tooling</strong>. Powered by Coder enterprise infrastructure with VS Code in the browser.
            </p>
            {!coderStatus.online && (
              <div className="mt-2.5 p-2 rounded-lg bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-600 font-mono">
                Start Coder with <code className="text-neutral-900 font-bold bg-white px-1 py-0.5 rounded border border-neutral-300">coder server</code>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] font-mono text-neutral-400 truncate max-w-[200px]">
              {coderStatus.url}
            </span>
            <button
              onClick={handleOpenFullIDE}
              className="text-xs font-bold text-[#7B0FE8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Launch Coder</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Editor Interactive Section */}
      <Card className="p-6">
        <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100">
          <div>
            <CardTitle className="text-lg">Quick Coding Sandbox</CardTitle>
            <p className="text-xs text-neutral-500 mt-0.5">
              Practice algorithms and inspect automated test assertions directly in the browser.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">Monaco Editor</Badge>
            <Badge variant="green">Subprocess Runner</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-4">
          <CodingWorkspace
            initialCode={sampleStarterCode}
            testCases={sampleTestCases}
            language="javascript"
            showLanguageSelector={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
