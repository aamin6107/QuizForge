import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Play,
  Square,
  Trash2,
  Clock,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Layers,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
  FileCode,
} from 'lucide-react';
import { api, Assignment } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { WorkspaceProvisioning } from '../../components/WorkspaceProvisioning';

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Provisioning overlay state
  const [provisioningAssignment, setProvisioningAssignment] = useState<Assignment | null>(null);
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<number | null>(null);

  // Coder external server status
  const [coderStatus, setCoderStatus] = useState<{ online: boolean; url: string }>({
    online: false,
    url: 'http://localhost:3000',
  });

  const fetchAssignments = async () => {
    try {
      const res = await api.assignments.list();
      setAssignments(res.assignments);
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    api.workspace.getStatus()
      .then(setCoderStatus)
      .catch(() => setCoderStatus({ online: false, url: 'http://localhost:3000' }));
  }, []);

  const handleLaunchWorkspace = async (assignment: Assignment) => {
    try {
      // Trigger launch endpoint
      const res = await api.assignments.launchWorkspace(assignment.id);
      setTargetWorkspaceId(res.workspace.id);

      if (res.newlyCreated) {
        // Show Coder-style provisioning sequence
        setProvisioningAssignment(assignment);
      } else {
        // Direct jump to existing workspace
        navigate(`/app/workspace/ide/${res.workspace.id}`);
      }
    } catch (err: any) {
      alert('Failed to launch workspace: ' + err.message);
    }
  };

  const handleStopWorkspace = async (workspaceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.workspaces.stop(workspaceId);
      await fetchAssignments();
    } catch (err: any) {
      alert('Error stopping workspace: ' + err.message);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Reset this workspace? All current code and changes will be cleared.')) return;
    try {
      await api.workspaces.delete(workspaceId);
      await fetchAssignments();
    } catch (err: any) {
      alert('Error resetting workspace: ' + err.message);
    }
  };

  const handleOpenCoder = async () => {
    try {
      await api.workspace.openLog();
    } catch {}
    window.open(coderStatus.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Provisioning Animation Modal */}
      {provisioningAssignment && targetWorkspaceId && (
        <WorkspaceProvisioning
          assignmentTitle={provisioningAssignment.title}
          onComplete={() => {
            navigate(`/app/workspace/ide/${targetWorkspaceId}`);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase text-[#7B0FE8] bg-purple-50 px-2.5 py-0.5 rounded">
            Student Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight mt-1">
            My Assignments
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Complete project assignments with an interactive in-browser cloud IDE and automated test suite.
          </p>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-[#7B0FE8] animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <Card className="p-12 text-center text-neutral-500">
          <Code2 className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-neutral-900">No Assignments Yet</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Your instructor has not published any assignments yet. Check back soon.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((ass) => {
            const ws = ass.workspace;
            const sub = ass.submission;
            const isRunning = ws?.status === 'running';
            const isStopped = ws?.status === 'stopped';
            const isSubmitted = ws?.status === 'submitted';
            const isNotStarted = !ws || ws.status === 'not_started';

            return (
              <Card
                key={ass.id}
                className="overflow-hidden border border-neutral-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="p-6">
                  {/* Top metadata */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
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
                      <span className="text-xs font-mono text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {ass.time_limit_minutes}m limit
                      </span>
                    </div>

                    {/* Status Badge */}
                    {isRunning && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Running
                      </span>
                    )}
                    {isStopped && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-neutral-100 text-neutral-600 border border-neutral-200">
                        Stopped
                      </span>
                    )}
                    {isSubmitted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-purple-50 text-[#7B0FE8] border border-purple-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                      </span>
                    )}
                    {isNotStarted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-neutral-500 bg-neutral-50 border border-neutral-200">
                        Not started
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-neutral-950 tracking-tight">{ass.title}</h3>
                  <p className="text-xs text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
                    {ass.description}
                  </p>

                  {/* Submission Score Banner */}
                  {isSubmitted && sub && (
                    <div className="mt-4 p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-neutral-800">Final Grade:</span>
                      <span className="font-extrabold text-[#7B0FE8] text-sm">
                        {sub.score} / {sub.total} ({Math.round((sub.score / sub.total) * 100)}%)
                      </span>
                    </div>
                  )}

                  {/* Time remaining info */}
                  {isRunning && ws.auto_stop_at && (
                    <div className="mt-4 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono text-neutral-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#7B0FE8]" />
                        Auto-stops at:
                      </span>
                      <span className="font-bold text-neutral-800">
                        {new Date(ws.auto_stop_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="p-4 bg-neutral-50/60 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {ws?.id && !isSubmitted && (
                      <>
                        {isRunning && (
                          <button
                            onClick={(e) => handleStopWorkspace(ws.id!, e)}
                            className="p-2 text-neutral-500 hover:text-rose-600 rounded-lg hover:bg-neutral-200/60 transition-colors"
                            title="Stop Workspace"
                          >
                            <Square className="w-4 h-4 fill-current text-rose-500" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteWorkspace(ws.id!, e)}
                          className="p-2 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-neutral-200/60 transition-colors"
                          title="Reset / Clear Workspace"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  <div>
                    {isSubmitted ? (
                      <Button
                        variant="outline"
                        size="sm"
                        pill
                        onClick={() => navigate(`/app/workspace/ide/${ws!.id}`)}
                        className="text-xs"
                      >
                        <span>Review Code</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    ) : isRunning ? (
                      <Button
                        variant="primary"
                        size="sm"
                        pill
                        onClick={() => navigate(`/app/workspace/ide/${ws!.id}`)}
                        className="text-xs gap-1.5"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Open IDE</span>
                      </Button>
                    ) : isStopped ? (
                      <Button
                        variant="primary"
                        size="sm"
                        pill
                        onClick={() => handleLaunchWorkspace(ass)}
                        className="text-xs gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Workspace</span>
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        pill
                        onClick={() => handleLaunchWorkspace(ass)}
                        className="text-xs gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Launch Workspace</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Secondary Option: External Coder Server Card */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <Terminal className="w-5 h-5 text-neutral-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-neutral-950">External Coder Server</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  coderStatus.online
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${coderStatus.online ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                {coderStatus.online ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {coderStatus.online
                ? 'External Coder daemon is reachable at ' + coderStatus.url
                : 'Coder is currently offline. Start Coder with `coder server` on port 3000.'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          pill
          onClick={handleOpenCoder}
          className="text-xs gap-1.5 shrink-0"
        >
          <span>Open Full IDE (Coder)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
