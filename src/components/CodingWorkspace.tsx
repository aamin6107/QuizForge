import React, { useState, useRef, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import {
  Play, CheckCircle2, XCircle, RotateCcw, Terminal, Code2, Loader2, ChevronDown,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

interface TestCase {
  input: string;
  expected: string;
  hidden?: boolean;
}

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  runtime?: number;
  error?: string | null;
}

interface CodingWorkspaceProps {
  initialCode: string;
  testCases: TestCase[];
  language?: string;
  questionId?: number;
  attemptId?: number;
  onCodeChange?: (code: string) => void;
  onRunComplete?: (allPassed: boolean, passedCount: number, totalCount: number, code: string) => void;
  readOnly?: boolean;
  showLanguageSelector?: boolean;
}

const LANG_OPTIONS = [
  { value: 'javascript', label: 'JavaScript', ext: 'js', monacoLang: 'javascript' },
  { value: 'python', label: 'Python', ext: 'py', monacoLang: 'python' },
];

export function CodingWorkspace({
  initialCode,
  testCases = [],
  language: initialLanguage = 'javascript',
  questionId,
  attemptId,
  onCodeChange,
  onRunComplete,
  readOnly = false,
  showLanguageSelector = true,
}: CodingWorkspaceProps) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);
  const [passedCount, setPassedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'tests' | 'console'>('tests');
  const [runError, setRunError] = useState<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave to backend every 5 seconds when in an attempt context
  useEffect(() => {
    if (!attemptId || !questionId) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('quizforge_token');
        await fetch(`/api/attempts/${attemptId}/autosave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ questionId, code }),
        });
      } catch {}
    }, 5000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [code, attemptId, questionId]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    const val = value ?? '';
    setCode(val);
    onCodeChange?.(val);
  }, [onCodeChange]);

  const handleReset = () => {
    setCode(initialCode);
    onCodeChange?.(initialCode);
    setResults(null);
    setAllPassed(null);
    setConsoleLogs([]);
    setRunError(null);
  };

  const handleRunTests = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunError(null);
    try {
      const token = localStorage.getItem('quizforge_token');
      const body: any = { language, code, testCases };
      if (questionId) body.questionId = questionId;

      const response = await fetch('/api/workspace/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const res = await response.json();

      if (!response.ok || !res.success) {
        setRunError(res.error || 'Execution failed.');
        setResults([]);
        setConsoleLogs(res.consoleLogs || []);
        setAllPassed(false);
        setActiveTab('console');
      } else {
        setResults(res.results || []);
        setConsoleLogs(res.consoleLogs || []);
        setAllPassed(res.allPassed);
        setPassedCount(res.passedCount ?? (res.results || []).filter((r: TestResult) => r.passed).length);
        setTotalCount(res.totalCount ?? (res.results || []).length);
        onRunComplete?.(res.allPassed, res.passedCount, res.totalCount, code);
        setActiveTab('tests');
        if (res.error) setRunError(res.error);
      }
    } catch (err: any) {
      setRunError(err.message || 'Network error');
      setResults([]);
      setConsoleLogs([]);
      setAllPassed(false);
      setActiveTab('console');
    } finally {
      setIsRunning(false);
    }
  };

  const currentLang = LANG_OPTIONS.find(l => l.value === language) || LANG_OPTIONS[0];

  return (
    <div className="rounded-2xl border border-neutral-300 bg-[#141416] text-neutral-200 overflow-hidden shadow-lg flex flex-col my-4">
      {/* Workspace Header */}
      <div className="bg-[#1C1C1F] px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block" />
          </div>
          <div className="h-4 w-px bg-neutral-700" />
          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-300">
            <Code2 className="w-3.5 h-3.5 text-[#7B0FE8]" />
            <span>solution.{currentLang.ext}</span>
          </div>
          <Badge variant="purple" mono className="text-[10px]">
            {language === 'python' ? 'Python' : 'Node.js'} Runtime
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {showLanguageSelector && !readOnly && (
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-[#2A2A2E] border border-neutral-700 text-neutral-300 text-xs font-mono px-3 py-1.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:border-[#7B0FE8]"
              >
                {LANG_OPTIONS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
          {!readOnly && (
            <>
              <button
                onClick={handleReset}
                title="Reset to starter code"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <Button
                variant="primary"
                size="sm"
                pill
                disabled={isRunning}
                onClick={handleRunTests}
                className="text-xs px-3.5 py-1.5 shadow-sm gap-1.5"
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isRunning ? 'Running…' : 'Run Test Cases'}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="min-h-[240px] max-h-[400px]">
        <MonacoEditor
          height="300px"
          language={currentLang.monacoLang}
          value={code}
          onChange={handleEditorChange}
          options={{
            theme: 'vs-dark',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            lineNumbers: 'on',
            readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'line',
            cursorStyle: 'line',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            bracketPairColorization: { enabled: true },
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          }}
        />
      </div>

      {/* Results Panel */}
      <div className="border-t border-neutral-800 bg-[#1A1A1E]">
        {/* Tab Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800/60 bg-[#161619]">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'tests'
                  ? 'border-[#7B0FE8] text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Test Suite ({testCases.filter(t => !t.hidden).length})</span>
              {allPassed !== null && (
                <span className={`w-2 h-2 rounded-full ${allPassed ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'console'
                  ? 'border-[#7B0FE8] text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Console Log</span>
              {consoleLogs.length > 0 && (
                <span className="bg-neutral-700 text-neutral-300 text-[10px] px-1.5 rounded-full">{consoleLogs.length}</span>
              )}
            </button>
          </div>

          {results !== null && (
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {allPassed ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {passedCount}/{totalCount} Passed
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {passedCount}/{totalCount} Passed
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4 max-h-[220px] overflow-y-auto">
          {activeTab === 'tests' ? (
            <div>
              {runError && (
                <div className="mb-3 p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs font-mono">
                  <span className="font-bold">Error: </span>{runError}
                </div>
              )}
              {results !== null && results.length > 0 ? (
                <div className="space-y-2.5">
                  {results.map((res, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border text-xs font-mono flex flex-col gap-1.5 ${
                        res.passed
                          ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200'
                          : 'bg-rose-950/20 border-rose-800/50 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-300">
                          Case {i + 1}{res.input ? `: ${res.input}` : ''}
                        </span>
                        <div className="flex items-center gap-2">
                          {res.runtime !== undefined && (
                            <span className="text-neutral-500 text-[10px]">{res.runtime}ms</span>
                          )}
                          <span className="font-bold flex items-center gap-1">
                            {res.passed ? (
                              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span className="text-emerald-400">Passed</span></>
                            ) : (
                              <><XCircle className="w-3.5 h-3.5 text-rose-400" /> <span className="text-rose-400">Failed</span></>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-[11px] text-neutral-400 mt-0.5">
                        <span>Expected: <span className="text-neutral-200">{res.expected}</span></span>
                        <span>Got: <span className={res.passed ? 'text-emerald-300' : 'text-rose-300'}>{res.actual}</span></span>
                      </div>
                      {res.error && <div className="text-[11px] text-rose-300 mt-0.5">↳ {res.error}</div>}
                    </div>
                  ))}
                </div>
              ) : results !== null && results.length === 0 && !runError ? (
                <p className="text-xs text-neutral-500">No test results yet.</p>
              ) : !results ? (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-400 mb-2">
                    Click "Run Test Cases" to evaluate your solution. {testCases.some(t => t.hidden) ? 'Some hidden test cases will also be evaluated.' : ''}
                  </p>
                  {testCases.filter(t => !t.hidden).map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-300 flex justify-between gap-4"
                    >
                      <span className="text-neutral-400">Input: <span className="text-neutral-200">{tc.input}</span></span>
                      <span className="text-neutral-500">Expected: <span className="text-neutral-300">{tc.expected}</span></span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="font-mono text-xs space-y-1">
              <p className="text-neutral-600 mb-2">{'// console.log() output from your code'}</p>
              {consoleLogs.length === 0 ? (
                <p className="text-neutral-500">No console output yet. Run your code to see output here.</p>
              ) : (
                consoleLogs.map((line, i) => (
                  <div key={i} className={`${
                    line.startsWith('[error]') ? 'text-rose-400' :
                    line.startsWith('[warn]') ? 'text-amber-400' :
                    'text-neutral-300'
                  }`}>
                    <span className="text-neutral-600 mr-2">{i + 1}</span>{line}
                  </div>
                ))
              )}
              {runError && (
                <div className="mt-2 text-rose-400">
                  <span className="text-neutral-600 mr-2">!</span>{runError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
