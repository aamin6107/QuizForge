import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, Quiz, AuditLog } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import {
  BookOpen,
  ClipboardList,
  Users,
  Award,
  Plus,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.stats.get(), api.quizzes.list()])
      .then(([statsRes, quizzesRes]) => {
        setStats(statsRes.stats);
        setRecentLogs(statsRes.recentActivity || []);
        setQuizzes(quizzesRes.quizzes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#7B0FE8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Quizzes',
      value: stats?.totalQuizzes || quizzes.length,
      icon: BookOpen,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Total Attempts',
      value: stats?.totalAttempts || 0,
      icon: ClipboardList,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Average Score',
      value: `${stats?.avgScorePercentage || 0}%`,
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Platform Users',
      value: stats?.totalUsers || 2,
      icon: Users,
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
            Admin Panel
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Real-time platform metrics, quiz lifecycle management, and audit verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            pill
            onClick={() => navigate('/admin/quizzes')}
            className="gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quiz</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Card key={idx} hoverEffect className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {s.title}
                  </p>
                  <p className="text-3xl font-black text-neutral-950 mt-2">{s.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Active Quizzes & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Quizzes Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-950 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#7B0FE8]" />
              <span>Active Quizzes ({quizzes.length})</span>
            </h2>
            <Link
              to="/admin/quizzes"
              className="text-xs font-semibold text-[#7B0FE8] hover:underline flex items-center gap-1"
            >
              <span>Manage all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} hoverEffect className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-neutral-950">{quiz.title}</h3>
                      <Badge variant="purple" mono>
                        {quiz.question_count || 5} Questions
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-1 max-w-xl">
                      {quiz.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-neutral-400 mt-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {quiz.duration_minutes} mins duration
                      </span>
                      <span>Max {quiz.max_attempts} attempts</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      pill
                      onClick={() => navigate('/admin/quizzes')}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      pill
                      onClick={() => navigate('/admin/attempts')}
                    >
                      Results
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Audit Log Activity Feed (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7B0FE8]" />
              <span>Audit Trail</span>
            </h2>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-semibold text-[#7B0FE8] hover:underline"
            >
              View logs
            </Link>
          </div>

          <Card className="p-5">
            <div className="divide-y divide-neutral-100 space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="gray" mono className="text-[10px]">
                      {log.action}
                    </Badge>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-neutral-800 mt-1.5">{log.details}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">By {log.user_name}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
