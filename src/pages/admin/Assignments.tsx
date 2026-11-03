import React, { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import {
  Plus,
  Trash2,
  Edit,
  Clock,
  Code2,
  Layers,
  X,
  CheckCircle2,
  Users,
  Eye,
  FileCode,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { api, Assignment, WorkspaceSubmission, WorkspaceFile } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/Table';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Assignment Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [timeLimit, setTimeLimit] = useState(30);
  const [assignedTo, setAssignedTo] = useState('all');
  const [starterFiles, setStarterFiles] = useState<Array<{ path: string; content: string }>>([
    { path: 'README.md', content: '# Project Task\n\nDescribe the requirements here...' },
    { path: 'index.js', content: '// Starter file\nconsole.log("Hello from workspace");\n' },
  ]);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [hiddenTestFile, setHiddenTestFile] = useState(
    '// Hidden test suite executed on submission and via npm test\nconsole.log("✔ Test 1 passed");\n'
  );
  const [submitting, setSubmitting] = useState(false);

  // Submissions Modal State
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<WorkspaceSubmission[]>([]);

  // Code Viewer Modal State
  const [codeViewerOpen, setCodeViewerOpen] = useState(false);
  const [viewedSubmission, setViewedSubmission] = useState<WorkspaceSubmission | null>(null);
  const [viewedFiles, setViewedFiles] = useState<WorkspaceFile[]>([]);
  const [activeViewedPath, setActiveViewedPath] = useState('');

  const fetchAssignments = async () => {
    try {
      const res = await api.assignments.list();
      setAssignments(res.assignments);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api.assignments.create({
        title: title.trim(),
        description,
        difficulty,
        time_limit_minutes: Number(timeLimit) || 30,
        assigned_to: assignedTo,
        starter_files: starterFiles.filter((f) => f.path.trim()),
        hidden_test_file: hiddenTestFile,
      });

      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      await fetchAssignments();
    } catch (err: any) {
      alert('Error creating assignment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!window.confirm('Delete this assignment? All associated workspaces and submissions will be removed.')) return;
    try {
      await api.assignments.delete(id);
      await fetchAssignments();
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    }
  };

  const handleOpenSubmissions = async (ass: Assignment) => {
    setSelectedAssignment(ass);
    setSubmissionsModalOpen(true);
    try {
      const res = await api.assignments.getSubmissions(ass.id);
      setSubmissions(res.submissions);
    } catch (err: any) {
      alert('Error loading submissions: ' + err.message);
    }
  };

  const handleOpenCodeViewer = async (sub: WorkspaceSubmission) => {
    setViewedSubmission(sub);
    setCodeViewerOpen(true);
    try {
      const res = await api.submissions.getFiles(sub.id);
      setViewedFiles(res.files);
      if (res.files.length > 0) setActiveViewedPath(res.files[0].path);
    } catch (err: any) {
      alert('Error loading submission code: ' + err.message);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
            Manage Assignments
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Author multi-file coding assignments, manage starter templates, and review student workspace submissions.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          pill
          onClick={() => setCreateModalOpen(true)}
          className="gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </Button>
      </div>

      {/* Assignments Table Card */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>All Assignments ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment Name</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Time Limit</TableHead>
                <TableHead>Workspaces</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((ass) => (
                <TableRow key={ass.id}>
                  <TableCell>
                    <div className="font-bold text-neutral-950 text-base">{ass.title}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1 max-w-md">
                      {ass.description || 'No description provided.'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ass.difficulty === 'Hard'
                          ? 'red'
                          : ass.difficulty === 'Easy'
                          ? 'green'
                          : 'purple'
                      }
                      mono
                    >
                      {ass.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-700">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{ass.time_limit_minutes} mins</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{ass.workspace_count || 0} active</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-[#7B0FE8]">
                      {ass.submission_count || 0} submitted
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        pill
                        onClick={() => handleOpenSubmissions(ass)}
                        className="text-xs gap-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Submissions ({ass.submission_count || 0})</span>
                      </Button>
                      <button
                        onClick={() => handleDeleteAssignment(ass.id)}
                        className="p-2 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL: CREATE ASSIGNMENT */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-[#7B0FE8] bg-purple-50 px-2.5 py-0.5 rounded">
                  Assignment Builder
                </span>
                <h3 className="text-xl font-bold text-neutral-950 mt-1">Create Cloud Assignment</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Distributed Consensus Engine"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Assigned Target</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                  >
                    <option value="all">All Enrolled Students</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Description (Markdown)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of assignment specifications and grading rubric..."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                />
              </div>

              {/* Starter Files Editor */}
              <div className="pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-neutral-800">
                    Starter Template Files ({starterFiles.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('File name (e.g. helpers.js):');
                      if (name && name.trim()) {
                        setStarterFiles((prev) => [...prev, { path: name.trim(), content: '' }]);
                        setActiveFileIdx(starterFiles.length);
                      }
                    }}
                    className="text-xs text-[#7B0FE8] font-bold hover:underline"
                  >
                    + Add File
                  </button>
                </div>

                <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-[#141416]">
                  {/* File tabs */}
                  <div className="h-9 bg-[#1C1C1F] border-b border-neutral-800 px-2 flex items-center gap-1 overflow-x-auto">
                    {starterFiles.map((f, i) => (
                      <div
                        key={i}
                        onClick={() => setActiveFileIdx(i)}
                        className={`px-3 py-1.5 rounded-t text-xs font-mono flex items-center gap-2 cursor-pointer ${
                          activeFileIdx === i ? 'bg-[#141416] text-white font-bold' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span>{f.path}</span>
                        {starterFiles.length > 1 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setStarterFiles((prev) => prev.filter((_, idx) => idx !== i));
                              setActiveFileIdx(0);
                            }}
                            className="text-neutral-600 hover:text-rose-400"
                          >
                            ✕
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {starterFiles[activeFileIdx] && (
                    <div className="h-48">
                      <MonacoEditor
                        height="100%"
                        language={starterFiles[activeFileIdx].path.endsWith('.md') ? 'markdown' : 'javascript'}
                        theme="vs-dark"
                        value={starterFiles[activeFileIdx].content}
                        onChange={(val) => {
                          const copy = [...starterFiles];
                          copy[activeFileIdx].content = val || '';
                          setStarterFiles(copy);
                        }}
                        options={{
                          fontSize: 12,
                          minimap: { enabled: false },
                          lineNumbers: 'on',
                          automaticLayout: true,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden Test File Editor */}
              <div className="pt-2 border-t border-neutral-100">
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Hidden Test Suite (`tests.js` executed on server & `npm test`)
                </label>
                <p className="text-[11px] text-neutral-500 mb-2">
                  Never visible to students in the file tree. Must print assertions and output `__TEST_RESULTS__[...]` JSON.
                </p>
                <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-[#141416] h-48">
                  <MonacoEditor
                    height="100%"
                    language="javascript"
                    theme="vs-dark"
                    value={hiddenTestFile}
                    onChange={(val) => setHiddenTestFile(val || '')}
                    options={{
                      fontSize: 12,
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 shrink-0">
                <Button type="button" variant="outline" size="md" pill onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" pill isLoading={submitting}>
                  Save Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW SUBMISSIONS */}
      {submissionsModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-[#7B0FE8] bg-purple-50 px-2 py-0.5 rounded">
                  Student Submissions
                </span>
                <h3 className="text-xl font-bold text-neutral-950 mt-1">{selectedAssignment.title}</h3>
              </div>
              <button
                onClick={() => setSubmissionsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {submissions.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-sm">
                  No students have submitted this assignment yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead className="text-right">Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="font-bold text-neutral-900">{sub.user_name}</div>
                          <div className="text-xs text-neutral-500 font-mono">{sub.user_email}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-bold">
                            {sub.score} / {sub.total}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.score === sub.total ? 'green' : 'purple'} mono>
                            {Math.round((sub.score / sub.total) * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-neutral-500 font-mono">
                            {new Date(sub.submitted_at).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            pill
                            onClick={() => handleOpenCodeViewer(sub)}
                            className="text-xs gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Files</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: READ-ONLY SUBMITTED CODE VIEWER */}
      {codeViewerOpen && viewedSubmission && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#141416] border border-neutral-800 rounded-3xl max-w-5xl w-full p-6 shadow-2xl flex flex-col h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-white shrink-0">
              <div>
                <span className="text-[10px] font-mono text-[#7B0FE8] font-bold uppercase">
                  Submission Code Viewer
                </span>
                <h4 className="text-base font-bold">
                  {viewedSubmission.user_name} · Score: {viewedSubmission.score}/{viewedSubmission.total}
                </h4>
              </div>
              <button
                onClick={() => setCodeViewerOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden pt-3 gap-3">
              {/* File list on left */}
              <div className="w-48 bg-[#1A1A1D] border border-neutral-800 rounded-xl p-2 space-y-1 font-mono text-xs shrink-0 overflow-y-auto">
                <div className="text-[10px] text-neutral-500 uppercase px-2 py-1 font-bold">Files</div>
                {viewedFiles.map((vf) => (
                  <button
                    key={vf.path}
                    onClick={() => setActiveViewedPath(vf.path)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg truncate cursor-pointer transition-colors ${
                      activeViewedPath === vf.path
                        ? 'bg-[#7B0FE8] text-white font-bold'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    {vf.path}
                  </button>
                ))}
              </div>

              {/* Monaco viewer on right */}
              <div className="flex-1 border border-neutral-800 rounded-xl overflow-hidden bg-[#101012]">
                <MonacoEditor
                  height="100%"
                  theme="vs-dark"
                  path={activeViewedPath}
                  value={viewedFiles.find((f) => f.path === activeViewedPath)?.content || ''}
                  options={{
                    fontSize: 13,
                    readOnly: true,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
