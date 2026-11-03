import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, Quiz, Attempt } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import {
  BookOpen,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myAttempts, setMyAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.quizzes.list(), api.attempts.list(), api.stats.get()])
      .then(([quizzesRes, attemptsRes, statsRes]) => {
        setQuizzes(quizzesRes.quizzes);
        setMyAttempts(attemptsRes.attempts);
        setStats(statsRes.stats);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleStartQuiz = async (quizId: number) => {
    try {
      const res = await api.attempts.start(quizId);
      navigate(`/app/quiz/${quizId}?attemptId=${res.attemptId}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7B0FE8] bg-purple-50 px-2.5 py-1 rounded">
            Student Assessment Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 mt-2 tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-xl">
            Test your knowledge across data structures, APIs, and algorithms with real-time coding sandboxes.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 text-center min-w-[110px]">
            <span className="text-xs font-semibold text-neutral-500 block">Completed</span>
            <span className="text-2xl font-black text-neutral-900 font-mono mt-0.5 block">
              {stats?.completed || myAttempts.length}
            </span>
          </div>

          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 text-center min-w-[110px]">
            <span className="text-xs font-semibold text-neutral-500 block">Avg Score</span>
            <span className="text-2xl font-black text-emerald-600 font-mono mt-0.5 block">
              {stats?.avgScorePercentage || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Available Quizzes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-950 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#7B0FE8]" />
            <span>Available Assessments ({quizzes.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const attemptsLeft = quiz.max_attempts - (quiz.user_attempts_count || 0);
            const canTake = attemptsLeft > 0;

            return (
              <Card key={quiz.id} hoverEffect className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="purple" mono>
                      {quiz.question_count || 5} Questions
                    </Badge>
                    <span className="text-xs font-mono text-neutral-400">
                      {quiz.user_attempts_count || 0}/{quiz.max_attempts} attempts used
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-950 leading-snug">{quiz.title}</h3>
                  <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                    {quiz.description || 'Test practical skills and algorithmic reasoning.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-neutral-500 mt-4 pt-3 border-t border-neutral-100">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      {quiz.duration_minutes} mins duration
                    </span>
                    {quiz.user_best_score !== null && (
                      <span className="flex items-center gap-1 font-mono text-emerald-700 font-bold">
                        <Award className="w-3.5 h-3.5" />
                        Best: {quiz.user_best_score} pts
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  {canTake ? (
                    <Button
                      variant="primary"
                      size="md"
                      pill
                      onClick={() => handleStartQuiz(quiz.id)}
                      className="w-full gap-2 shadow-sm"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{quiz.user_attempts_count ? 'Retake Quiz' : 'Start Assessment'}</span>
                    </Button>
                  ) : (
                    <Button variant="secondary" size="md" pill disabled className="w-full">
                      Maximum Attempts Reached
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
