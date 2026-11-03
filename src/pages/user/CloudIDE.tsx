import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import {
  Folder,
  FileCode,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Play,
  Square,
  Send,
  ArrowLeft,
  Terminal as TerminalIcon,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  Save,
  CheckSquare,
  SquareCheck,
  Maximize2,
  Minimize2,
  BookOpen,
  PanelRightClose,
  PanelRightOpen,
  PanelBottomClose,
  PanelBottomOpen,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { api, Workspace, WorkspaceFile, WorkspaceSubmission, TestResultItem } from '../../lib/api';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';

export default function CloudIDE() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  // Workspace & files state
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('README.md');
  const [openTabs, setOpenTabs] = useState<string[]>(['README.md']);
  const [dirtyFiles, setDirtyFiles] = useState<Record<string, boolean>>({});
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'QuizForge Cloud Workspace v2.4 (Isolated Container Sandbox)',
    'Type commands below or use quick action buttons.',
    'Whitelisted: node <file>, python <file>, npm test, ls, cat <file>, clear',
    '',
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecRunning, setIsExecRunning] = useState(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Panels & tabs state
  const [bottomTab, setBottomTab] = useState<'terminal' | 'tests' | 'output'>('terminal');
  const [rightTab, setRightTab] = useState<'guide' | 'checklist' | 'tests'>('guide');
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isBottomOpen, setIsBottomOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<'editor' | 'explorer' | 'guide' | 'terminal'>('editor');

  // Test Results & Submission
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [submission, setSubmission] = useState<WorkspaceSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // Time & countdown state
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(30 * 60);

  // Cursor position
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // File management modals
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState('');
  const [renameNewName, setRenameNewName] = useState('');

  // Checklist state
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    'Implement calculateAverage(scores)': false,
    'Handle empty array in calculateAverage -> return 0': false,
    'Implement getGrade(avg) tier boundaries (A-F)': false,
    'Implement topStudents(students, n) sorted descending': false,
    'Run npm test and verify all 8 assertions pass': false,
  });

  // Load workspace details
  const fetchWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await api.workspaces.get(workspaceId);
      setWorkspace(res.workspace);
      setFiles(res.files);

      // Initialize file contents map
      const contentsMap: Record<string, string> = {};
      res.files.forEach((f) => {
        contentsMap[f.path] = f.content;
      });
      setFileContents(contentsMap);

      if (res.submission) {
        setSubmission(res.submission);
        if (res.submission.testResults) setTestResults(res.submission.testResults);
      }

      // Initial active file
      if (res.files.length > 0) {
        const defaultFile = res.files.find((f) => f.path === 'README.md') || res.files[0];
        setActiveFilePath(defaultFile.path);
        setOpenTabs([defaultFile.path]);
      }

      // Calculate timer
      if (res.workspace.auto_stop_at) {
        const expiry = new Date(res.workspace.auto_stop_at).getTime();
        const now = Date.now();
        const diffSecs = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeftSeconds(diffSecs);
      }
    } catch (err: any) {
      alert('Failed to load workspace: ' + err.message);
      navigate('/app/assignments');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, navigate]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  // Real-time Countdown Timer
  useEffect(() => {
    if (!workspace || workspace.status === 'submitted' || timeLeftSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [workspace, timeLeftSeconds]);

  // Auto-save every 5 seconds if dirty
  useEffect(() => {
    if (!workspaceId || workspace?.status === 'submitted') return;
    const saveTimer = setInterval(async () => {
      const dirtyPaths = Object.keys(dirtyFiles).filter((p) => dirtyFiles[p]);
      if (dirtyPaths.length === 0) return;

      setIsSaving(true);
      try {
        const filesToSave = dirtyPaths.map((p) => ({ path: p, content: fileContents[p] || '' }));
        await api.workspaces.saveFiles(workspaceId, { files: filesToSave });
        setDirtyFiles({});
        setLastSavedTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setIsSaving(false);
      }
    }, 5000);

    return () => clearInterval(saveTimer);
  }, [workspaceId, dirtyFiles, fileContents, workspace?.status]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!workspaceId || !activeFilePath) return;
        setIsSaving(true);
        try {
          await api.workspaces.saveFiles(workspaceId, {
            path: activeFilePath,
            content: fileContents[activeFilePath] || '',
          });
          setDirtyFiles((prev) => ({ ...prev, [activeFilePath]: false }));
          setLastSavedTime(new Date().toLocaleTimeString());
        } finally {
          setIsSaving(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspaceId, activeFilePath, fileContents]);

  // Terminal scroll to bottom
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleEditorChange = (value: string | undefined) => {
    const val = value ?? '';
    setFileContents((prev) => ({ ...prev, [activeFilePath]: val }));
    setDirtyFiles((prev) => ({ ...prev, [activeFilePath]: true }));
  };

  const handleTabClick = (path: string) => {
    setActiveFilePath(path);
  };

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = openTabs.filter((t) => t !== path);
    setOpenTabs(updated);
    if (activeFilePath === path) {
      if (updated.length > 0) setActiveFilePath(updated[updated.length - 1]);
    }
  };

  const handleOpenFile = (path: string) => {
    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [...prev, path]);
    }
    setActiveFilePath(path);
    setMobileTab('editor');
  };

  // Create new file
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !newFileName.trim()) return;
    const cleanPath = newFileName.trim();
    try {
      await api.workspaces.saveFiles(workspaceId, { path: cleanPath, content: '' });
      setFiles((prev) => [...prev, { path: cleanPath, content: '' }]);
      setFileContents((prev) => ({ ...prev, [cleanPath]: '' }));
      setOpenTabs((prev) => [...prev, cleanPath]);
      setActiveFilePath(cleanPath);
      setNewFileName('');
      setNewFileModalOpen(false);
    } catch (err: any) {
      alert('Error creating file: ' + err.message);
    }
  };

  // Delete file
  const handleDeleteFile = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!workspaceId || workspace?.status === 'submitted') return;
    if (!window.confirm(`Delete "${path}"? This cannot be undone.`)) return;
    try {
      await api.workspaces.deleteFile(workspaceId, path);
      setFiles((prev) => prev.filter((f) => f.path !== path));
      setOpenTabs((prev) => prev.filter((t) => t !== path));
      if (activeFilePath === path) {
        const remaining = files.filter((f) => f.path !== path);
        if (remaining.length > 0) setActiveFilePath(remaining[0].path);
      }
    } catch (err: any) {
      alert('Failed to delete file: ' + err.message);
    }
  };

  // Rename file
  const handleRenameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !renameNewName.trim() || !renameTarget) return;
    const newName = renameNewName.trim();
    try {
      await api.workspaces.renameFile(workspaceId, renameTarget, newName);
      setFiles((prev) => prev.map((f) => (f.path === renameTarget ? { ...f, path: newName } : f)));
      setOpenTabs((prev) => prev.map((t) => (t === renameTarget ? newName : t)));
      setFileContents((prev) => {
        const copy = { ...prev };
        copy[newName] = copy[renameTarget];
        delete copy[renameTarget];
        return copy;
      });
      if (activeFilePath === renameTarget) setActiveFilePath(newName);
      setRenameModalOpen(false);
    } catch (err: any) {
      alert('Error renaming file: ' + err.message);
    }
  };

  // Execute terminal command
  const executeCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || terminalInput).trim();
    if (!cmd || !workspaceId) return;

    if (cmd === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    }

    setTerminalHistory((prev) => [...prev, `workspace:~$ ${cmd}`]);
    setCommandHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);
    setTerminalInput('');
    setIsExecRunning(true);

    try {
      // Save open dirty files first so executions see latest code
      const dirtyPaths = Object.keys(dirtyFiles).filter((p) => dirtyFiles[p]);
      if (dirtyPaths.length > 0) {
        const filesToSave = dirtyPaths.map((p) => ({ path: p, content: fileContents[p] || '' }));
        await api.workspaces.saveFiles(workspaceId, { files: filesToSave });
        setDirtyFiles({});
      }

      const res = await api.workspaces.exec(workspaceId, cmd);
      if (res.clear) {
        setTerminalHistory([]);
      } else {
        const outLines = res.output ? res.output.split('\n') : ['[Command completed with no output]'];
        setTerminalHistory((prev) => [...prev, ...outLines, '']);
      }

      if (res.testResults && res.testResults.length > 0) {
        setTestResults(res.testResults);
      }
    } catch (err: any) {
      setTerminalHistory((prev) => [...prev, `Error: ${err.message}`, '']);
    } finally {
      setIsExecRunning(false);
    }
  };

  // Terminal history navigation (Up / Down)
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setTerminalInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIdx = historyIndex - 1;
        setHistoryIndex(prevIdx);
        setTerminalInput(commandHistory[prevIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    }
  };

  // Stop / Resume Workspace
  const handleToggleWorkspaceStatus = async () => {
    if (!workspaceId || !workspace) return;
    try {
      if (workspace.status === 'running') {
        await api.workspaces.stop(workspaceId);
        setWorkspace((prev) => prev ? { ...prev, status: 'stopped' } : null);
      } else if (workspace.status === 'stopped') {
        await api.workspaces.start(workspaceId);
        setWorkspace((prev) => prev ? { ...prev, status: 'running' } : null);
      }
    } catch (err: any) {
      alert('Error updating workspace status: ' + err.message);
    }
  };

  // Submit Assignment
  const handleSubmitAssignment = async () => {
    if (!workspaceId) return;
    if (!window.confirm('Are you ready to submit your assignment? The server will grade your code against all hidden test cases and lock the workspace.')) {
      return;
    }
    setIsSubmitting(true);
    try {
      // Save all files first
      const dirtyPaths = Object.keys(dirtyFiles).filter((p) => dirtyFiles[p]);
      if (dirtyPaths.length > 0) {
        const filesToSave = dirtyPaths.map((p) => ({ path: p, content: fileContents[p] || '' }));
        await api.workspaces.saveFiles(workspaceId, { files: filesToSave });
        setDirtyFiles({});
      }

      const res = await api.workspaces.submit(workspaceId);
      setSubmission(res.submission);
      if (res.submission.testResults) {
        setTestResults(res.submission.testResults);
      }
      setWorkspace((prev) => prev ? { ...prev, status: 'submitted' } : null);
      setSubmitModalOpen(true);
    } catch (err: any) {
      alert('Submission error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!workspaceId || workspace?.status === 'submitted') return;
    try {
      const res = await api.workspaces.submit(workspaceId);
      setSubmission(res.submission);
      if (res.submission.testResults) setTestResults(res.submission.testResults);
      setWorkspace((prev) => prev ? { ...prev, status: 'submitted' } : null);
      setSubmitModalOpen(true);
    } catch {}
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine Monaco language
  const getLanguageFromPath = (path: string) => {
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.py')) return 'python';
    if (path.endsWith('.md')) return 'markdown';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.css')) return 'css';
    return 'plaintext';
  };

  if (loading || !workspace) {
    return (
      <div className="min-h-screen bg-[#141416] flex items-center justify-center text-white font-mono">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#7B0FE8] animate-spin" />
          <p className="text-xs text-neutral-400">Mounting Cloud Workspace container...</p>
        </div>
      </div>
    );
  }

  const isLocked = workspace.status === 'submitted';

  return (
    <div className="h-screen w-screen bg-[#141416] text-neutral-200 flex flex-col overflow-hidden font-sans select-none">
      {/* 1. TOP BAR */}
      <header className="h-12 bg-[#1C1C1F] border-b border-neutral-800/80 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/assignments')}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Back to My Assignments"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Assignments</span>
          </button>

          <div className="h-4 w-px bg-neutral-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-white tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#7B0FE8] inline-block" />
              {workspace.assignment_title}
            </span>

            {/* Status Badge */}
            {workspace.status === 'running' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Running
              </span>
            )}
            {workspace.status === 'stopped' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-neutral-800 text-neutral-400">
                Stopped
              </span>
            )}
            {workspace.status === 'submitted' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-950/70 text-[#C084FC] border border-purple-800/60">
                <Check className="w-3 h-3" /> Submitted
              </span>
            )}
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div className="flex items-center gap-2">
          {!isLocked && (
            <div
              className={`flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-lg border ${
                timeLeftSeconds < 300
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 animate-pulse'
                  : 'bg-neutral-900 border-neutral-700/80 text-neutral-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#7B0FE8]" />
              <span>{formatTimer(timeLeftSeconds)}</span>
              <span className="text-[10px] text-neutral-500 hidden md:inline">remaining</span>
            </div>
          )}

          {isSaving && (
            <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1 hidden sm:flex">
              <Loader2 className="w-3 h-3 animate-spin text-[#7B0FE8]" />
              Saving…
            </span>
          )}
          {!isSaving && lastSavedTime && (
            <span className="text-[10px] text-neutral-500 font-mono hidden md:inline">
              Saved {lastSavedTime}
            </span>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {!isLocked ? (
            <>
              <Button
                variant={workspace.status === 'running' ? 'outline' : 'primary'}
                size="sm"
                pill
                onClick={handleToggleWorkspaceStatus}
                className="text-xs px-3 py-1"
              >
                {workspace.status === 'running' ? (
                  <>
                    <Square className="w-3 h-3 fill-current text-rose-400" />
                    <span className="hidden sm:inline">Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current text-emerald-400" />
                    <span className="hidden sm:inline">Resume</span>
                  </>
                )}
              </Button>

              <Button
                variant="primary"
                size="sm"
                pill
                isLoading={isSubmitting}
                onClick={handleSubmitAssignment}
                className="text-xs px-3.5 py-1 gap-1.5 shadow-sm"
              >
                <Send className="w-3 h-3" />
                <span>Submit Assignment</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              pill
              onClick={() => setSubmitModalOpen(true)}
              className="text-xs px-3 py-1 text-purple-300 border-purple-800/80"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Score ({submission?.score}/{submission?.total})</span>
            </Button>
          )}

          {/* Collapsible panel buttons */}
          <div className="h-4 w-px bg-neutral-800 mx-1 hidden lg:block" />
          <button
            onClick={() => setIsBottomOpen(!isBottomOpen)}
            className={`p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors hidden lg:block ${
              isBottomOpen ? 'text-purple-400' : ''
            }`}
            title="Toggle Bottom Terminal"
          >
            {isBottomOpen ? <PanelBottomClose className="w-4 h-4" /> : <PanelBottomOpen className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsRightOpen(!isRightOpen)}
            className={`p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors hidden lg:block ${
              isRightOpen ? 'text-purple-400' : ''
            }`}
            title="Toggle Assignment Guide"
          >
            {isRightOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center justify-around bg-[#1A1A1E] border-b border-neutral-800 text-xs font-semibold">
        {(['editor', 'explorer', 'guide', 'terminal'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`py-2 px-3 uppercase tracking-wider text-[11px] font-mono border-b-2 ${
              mobileTab === tab ? 'border-[#7B0FE8] text-white font-bold' : 'border-transparent text-neutral-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2. MAIN BODY (EXPLORER | EDITOR | RIGHT PANEL) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: FILE EXPLORER */}
        <aside
          className={`w-60 bg-[#161619] border-r border-neutral-800/80 flex flex-col shrink-0 select-none ${
            mobileTab === 'explorer' ? 'flex flex-1' : 'hidden lg:flex'
          }`}
        >
          {/* Explorer Header */}
          <div className="px-3 py-2.5 border-b border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 font-bold uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-[#7B0FE8]" />
              Explorer
            </span>
            {!isLocked && (
              <button
                onClick={() => setNewFileModalOpen(true)}
                className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                title="New File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
            {files.map((file) => {
              const isActive = activeFilePath === file.path;
              const isDirty = dirtyFiles[file.path];
              const isMd = file.path.endsWith('.md');

              return (
                <div
                  key={file.path}
                  onClick={() => handleOpenFile(file.path)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#27272A] text-white font-medium'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isMd ? (
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="truncate">{file.path}</span>
                    {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-[#7B0FE8] shrink-0" />}
                  </div>

                  {!isLocked && (
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameTarget(file.path);
                          setRenameNewName(file.path);
                          setRenameModalOpen(true);
                        }}
                        className="p-1 hover:text-white rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {file.path !== 'README.md' && (
                        <button
                          onClick={(e) => handleDeleteFile(file.path, e)}
                          className="p-1 hover:text-rose-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explorer Quick Info */}
          <div className="p-3 border-t border-neutral-800/60 bg-[#121214] text-[11px] font-mono text-neutral-500">
            <div>Root: <span className="text-neutral-400">/home/workspace</span></div>
            <div>Files: <span className="text-neutral-400">{files.length}</span></div>
          </div>
        </aside>

        {/* CENTER: MONACO EDITOR + BOTTOM PANEL */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-[#141416] ${
            mobileTab === 'editor' || mobileTab === 'terminal' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* EDITOR TABS */}
          <div className="h-9 bg-[#19191C] border-b border-neutral-800/80 flex items-center overflow-x-auto shrink-0 select-none">
            {openTabs.map((tabPath) => {
              const isActive = activeFilePath === tabPath;
              const isDirty = dirtyFiles[tabPath];
              return (
                <div
                  key={tabPath}
                  onClick={() => handleTabClick(tabPath)}
                  className={`h-full px-3.5 flex items-center gap-2 border-r border-neutral-800/70 text-xs font-mono cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#141416] text-white border-t-2 border-t-[#7B0FE8] font-bold'
                      : 'bg-[#19191C] text-neutral-400 hover:text-neutral-200 hover:bg-[#1E1E22]'
                  }`}
                >
                  <span>{tabPath}</span>
                  {isDirty ? (
                    <span className="w-2 h-2 rounded-full bg-[#7B0FE8] shrink-0" />
                  ) : (
                    <button
                      onClick={(e) => handleCloseTab(tabPath, e)}
                      className="p-0.5 rounded hover:bg-neutral-700 text-neutral-500 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* MONACO EDITOR CONTAINER */}
          <div className="flex-1 min-h-[200px] relative">
            <MonacoEditor
              height="100%"
              path={activeFilePath}
              language={getLanguageFromPath(activeFilePath)}
              value={fileContents[activeFilePath] || ''}
              onChange={handleEditorChange}
              onMount={(editor) => {
                editor.onDidChangeCursorPosition((e) => {
                  setCursorPos({ line: e.position.lineNumber, col: e.position.column });
                });
              }}
              options={{
                theme: 'vs-dark',
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                readOnly: isLocked,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
                renderLineHighlight: 'line',
                automaticLayout: true,
                tabSize: 2,
                bracketPairColorization: { enabled: true },
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              }}
            />
          </div>

          {/* BOTTOM PANEL (TERMINAL / TESTS / OUTPUT) */}
          {isBottomOpen && (
            <div className="h-64 border-t border-neutral-800 bg-[#101012] flex flex-col shrink-0">
              {/* Bottom Tabs Header */}
              <div className="h-8 bg-[#17171A] border-b border-neutral-800/80 px-3 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setBottomTab('terminal')}
                    className={`flex items-center gap-1.5 h-8 border-b-2 transition-colors cursor-pointer ${
                      bottomTab === 'terminal'
                        ? 'border-[#7B0FE8] text-white font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <TerminalIcon className="w-3.5 h-3.5" />
                    <span>Terminal</span>
                  </button>
                  <button
                    onClick={() => setBottomTab('tests')}
                    className={`flex items-center gap-1.5 h-8 border-b-2 transition-colors cursor-pointer ${
                      bottomTab === 'tests'
                        ? 'border-[#7B0FE8] text-white font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tests ({testResults.length})</span>
                  </button>
                  <button
                    onClick={() => setBottomTab('output')}
                    className={`flex items-center gap-1.5 h-8 border-b-2 transition-colors cursor-pointer ${
                      bottomTab === 'output'
                        ? 'border-[#7B0FE8] text-white font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Output</span>
                  </button>
                </div>

                {/* Quick command pills */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold hidden sm:inline">Quick:</span>
                  <button
                    onClick={() => executeCommand('npm test')}
                    disabled={isExecRunning}
                    className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 hover:bg-purple-900 transition-colors text-[10px]"
                  >
                    npm test
                  </button>
                  <button
                    onClick={() => executeCommand('node index.js')}
                    disabled={isExecRunning}
                    className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors text-[10px]"
                  >
                    node index.js
                  </button>
                  <button
                    onClick={() => executeCommand('ls')}
                    disabled={isExecRunning}
                    className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors text-[10px]"
                  >
                    ls
                  </button>
                  <button
                    onClick={() => executeCommand('clear')}
                    className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors text-[10px]"
                  >
                    clear
                  </button>
                </div>
              </div>

              {/* Bottom Tab Content */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
                {bottomTab === 'terminal' && (
                  <div className="h-full flex flex-col justify-between">
                    {/* Log stream */}
                    <div className="flex-1 overflow-y-auto space-y-1 mb-2">
                      {terminalHistory.map((line, i) => (
                        <div
                          key={i}
                          className={`${
                            line.startsWith('workspace:~$')
                              ? 'text-[#C084FC] font-bold'
                              : line.includes('✔')
                              ? 'text-emerald-400'
                              : line.includes('✖') || line.includes('Error')
                              ? 'text-rose-400'
                              : 'text-neutral-300'
                          }`}
                        >
                          {line}
                        </div>
                      ))}
                      <div ref={terminalBottomRef} />
                    </div>

                    {/* Terminal Input Box */}
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/80 shrink-0">
                      <span className="text-[#7B0FE8] font-bold select-none">workspace:~$</span>
                      <input
                        type="text"
                        value={terminalInput}
                        disabled={isExecRunning}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyDown={handleTerminalKeyDown}
                        placeholder={isExecRunning ? 'Command running in sandbox…' : 'node index.js, npm test, ls...'}
                        className="flex-1 bg-transparent text-white font-mono text-xs outline-none"
                        autoFocus
                      />
                      {isExecRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7B0FE8]" />}
                    </div>
                  </div>
                )}

                {bottomTab === 'tests' && (
                  <div>
                    {testResults.length === 0 ? (
                      <div className="text-center py-6 text-neutral-500">
                        <p>No test assertions recorded yet.</p>
                        <p className="text-[11px] mt-1 text-neutral-600">Run "npm test" in the terminal to evaluate test suite.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs font-bold">
                          <span>
                            Test Suite Result:{' '}
                            <span className="text-emerald-400">
                              {testResults.filter((r) => r.passed).length}/{testResults.length} Passed
                            </span>
                          </span>
                        </div>
                        {testResults.map((t, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                              t.passed
                                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                                : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {t.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                              <span>{t.name}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold">
                              {t.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {bottomTab === 'output' && (
                  <div className="text-neutral-400 space-y-1">
                    <p className="text-neutral-500">// Process Output Stream</p>
                    <p>Container PID: 1248 (Sandboxed)</p>
                    <p>Status: {workspace.status.toUpperCase()}</p>
                    <p>Node runtime: {typeof process !== 'undefined' ? process.version : 'v20.x'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: COLLAPSIBLE ASSIGNMENT GUIDE PANEL */}
        {isRightOpen && (
          <aside
            className={`w-80 lg:w-96 bg-[#161619] border-l border-neutral-800/80 flex flex-col shrink-0 ${
              mobileTab === 'guide' ? 'flex flex-1' : 'hidden lg:flex'
            }`}
          >
            {/* Guide Header Tabs */}
            <div className="h-9 bg-[#19191C] border-b border-neutral-800/80 px-3 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRightTab('guide')}
                  className={`h-9 border-b-2 flex items-center gap-1.5 transition-colors ${
                    rightTab === 'guide' ? 'border-[#7B0FE8] text-white font-bold' : 'border-transparent text-neutral-400'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Brief</span>
                </button>
                <button
                  onClick={() => setRightTab('checklist')}
                  className={`h-9 border-b-2 flex items-center gap-1.5 transition-colors ${
                    rightTab === 'checklist' ? 'border-[#7B0FE8] text-white font-bold' : 'border-transparent text-neutral-400'
                  }`}
                >
                  <SquareCheck className="w-3.5 h-3.5" />
                  <span>Tasks</span>
                </button>
              </div>

              <Badge variant="purple" mono className="text-[10px]">
                {workspace.assignment_difficulty || 'Medium'}
              </Badge>
            </div>

            {/* Guide Body */}
            <div className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed text-neutral-300">
              {rightTab === 'guide' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-white">{workspace.assignment_title}</h3>
                    <p className="text-neutral-400 mt-1">{workspace.assignment_description}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#1C1C1F] border border-neutral-800 text-[11px] space-y-1.5">
                    <div className="font-bold text-neutral-200">Assignment Parameters:</div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Time Limit:</span>
                      <span className="font-mono text-white">{workspace.time_limit_minutes} mins</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Starter Files:</span>
                      <span className="font-mono text-white">{files.length} files</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Auto-Stop:</span>
                      <span className="font-mono text-white">Server Enforced</span>
                    </div>
                  </div>

                  {/* Render README instructions preview */}
                  {fileContents['README.md'] && (
                    <div className="pt-2 border-t border-neutral-800/80">
                      <div className="font-mono text-[11px] font-bold text-neutral-400 uppercase mb-2">Instructions Overview:</div>
                      <div className="p-3 rounded-xl bg-[#121214] border border-neutral-800 font-mono text-[11.5px] leading-relaxed text-neutral-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {fileContents['README.md']}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="font-bold text-sm text-white mb-1">Requirements Checklist</div>
                  <p className="text-neutral-500 text-[11px]">
                    Track your implementation progress. Check off items as you test them:
                  </p>

                  <div className="space-y-2 mt-3">
                    {Object.keys(checklist).map((item) => (
                      <label
                        key={item}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-[#1C1C1F] border border-neutral-800/80 hover:border-neutral-700 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checklist[item]}
                          onChange={(e) => setChecklist((prev) => ({ ...prev, [item]: e.target.checked }))}
                          className="mt-0.5 rounded text-[#7B0FE8] focus:ring-[#7B0FE8]"
                        />
                        <span className={`text-[11.5px] ${checklist[item] ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 3. STATUS BAR (VS Code Style) */}
      <footer className="h-6 bg-[#1A1A1E] border-t border-neutral-800 px-3 flex items-center justify-between text-[11px] font-mono text-neutral-400 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span
              className={`w-2 h-2 rounded-full ${
                workspace.status === 'running' ? 'bg-emerald-400' : 'bg-neutral-500'
              }`}
            />
            Workspace: {workspace.status}
          </span>
          <span className="hidden sm:inline">Path: {activeFilePath}</span>
        </div>

        <div className="flex items-center gap-4">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="text-purple-400">{getLanguageFromPath(activeFilePath).toUpperCase()}</span>
        </div>
      </footer>

      {/* MODAL: NEW FILE */}
      {newFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#1C1C1F] border border-neutral-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-white mb-3">Create New File</h4>
            <form onSubmit={handleCreateFile} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. helpers.js or config.json"
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white font-mono outline-none focus:border-[#7B0FE8]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" pill onClick={() => setNewFileModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" pill>
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENAME FILE */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#1C1C1F] border border-neutral-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-white mb-3">Rename File</h4>
            <form onSubmit={handleRenameFile} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white font-mono outline-none focus:border-[#7B0FE8]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" pill onClick={() => setRenameModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" pill>
                  Rename
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMISSION RESULT OVERLAY */}
      {submitModalOpen && submission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181B] border border-neutral-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight">Assignment Submitted!</h3>
            <p className="text-neutral-400 text-xs mt-1">
              Your submission for "{workspace.assignment_title}" has been graded on the server.
            </p>

            <div className="my-6 p-4 rounded-2xl bg-[#121214] border border-neutral-800 flex items-center justify-around font-mono">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Score</span>
                <span className="text-3xl font-black text-white block mt-0.5">
                  {submission.score} / {submission.total}
                </span>
              </div>
              <div className="h-8 w-px bg-neutral-800" />
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Grade</span>
                <span className="text-3xl font-black text-[#7B0FE8] block mt-0.5">
                  {Math.round((submission.score / submission.total) * 100)}%
                </span>
              </div>
            </div>

            {/* Test Results Breakdown */}
            {testResults.length > 0 && (
              <div className="text-left mb-6 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
                <div className="text-[11px] font-bold text-neutral-400 mb-2 uppercase">Hidden Test Assertions:</div>
                {testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      t.passed
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="font-bold text-[10px] uppercase">{t.passed ? 'PASSED' : 'FAILED'}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="md"
                pill
                onClick={() => setSubmitModalOpen(false)}
              >
                Close & Review Code
              </Button>
              <Button
                variant="primary"
                size="md"
                pill
                onClick={() => navigate('/app/assignments')}
              >
                Return to Assignments
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
