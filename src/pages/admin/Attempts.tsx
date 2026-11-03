import React, { useState, useEffect } from 'react';
import { api, Attempt } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/Table';
import { CheckCircle2, XCircle, Eye, X, Clock, Calendar } from 'lucide-react';

export default function AdminAttempts() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectData, setInspectData] = useState<{ attempt: Attempt; answers: any[] } | null>(null);

  useEffect(() => {
    api.attempts
      .list()
      .then((res) => setAttempts(res.attempts))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleInspect = async (attemptId: number) => {
    try {
      const res = await api.attempts.get(attemptId);
      setInspectData(res);
      setInspectModalOpen(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
          Candidate Attempts & Results
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review candidate submissions, score benchmarks, and submitted code.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Platform Attempts ({attempts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attempt ID</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Quiz</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((att) => {
                const percentage = Math.round((att.score / (att.total || 1)) * 100);
                const isPassed = percentage >= 70;
                return (
                  <TableRow key={att.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-neutral-600">
                        #{att.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-neutral-900">{att.user_name}</div>
                      <div className="text-xs text-neutral-400 font-mono">{att.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-neutral-800">{att.quiz_title}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 font-mono">
                          {att.score} / {att.total}
                        </span>
                        <Badge variant={isPassed ? 'green' : 'amber'} mono>
                          {percentage}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={att.status === 'completed' ? 'green' : 'gray'}>
                        {att.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {att.submitted_at
                            ? new Date(att.submitted_at).toLocaleString([], {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        pill
                        onClick={() => handleInspect(att.id)}
                        className="gap-1.5 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inspect Attempt Modal */}
      {inspectModalOpen && inspectData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-[#7B0FE8] bg-purple-50 px-2 py-0.5 rounded">
                  Attempt #{inspectData.attempt.id} Review
                </span>
                <h3 className="text-xl font-bold text-neutral-950 mt-1">
                  {inspectData.attempt.user_name} – {inspectData.attempt.quiz_title}
                </h3>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-sm">
                <div>
                  <span className="text-xs text-neutral-500 block">Total Score</span>
                  <span className="text-xl font-black text-neutral-950 font-mono">
                    {inspectData.attempt.score} / {inspectData.attempt.total}
                  </span>
                </div>
                <div className="h-8 w-px bg-neutral-200" />
                <div>
                  <span className="text-xs text-neutral-500 block">Status</span>
                  <Badge variant="green">{inspectData.attempt.status.toUpperCase()}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                  Answer Breakdown
                </h4>
                {inspectData.answers.map((ans, idx) => (
                  <div
                    key={ans.id}
                    className={`p-4 rounded-xl border ${
                      ans.is_correct
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold font-mono text-neutral-400 mt-0.5">
                          Q{idx + 1}.
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {ans.question_text}
                          </p>
                          <Badge
                            variant={ans.question_type === 'coding' ? 'purple' : 'gray'}
                            mono
                            className="mt-1"
                          >
                            {ans.question_type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {ans.is_correct ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Correct
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Incorrect
                          </span>
                        )}
                      </div>
                    </div>

                    {ans.code_submission && (
                      <div className="mt-3">
                        <span className="text-xs font-mono text-neutral-500 block mb-1">
                          Submitted Code:
                        </span>
                        <pre className="p-3 rounded-lg bg-neutral-900 text-neutral-100 font-mono text-xs overflow-x-auto">
                          {ans.code_submission}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
