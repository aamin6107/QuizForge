import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api, Quiz, Question } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { CodingWorkspace } from '../../components/CodingWorkspace';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  Code2,
  Check,
} from 'lucide-react';

export default function QuizTaking() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch quiz & questions
  useEffect(() => {
    if (!id) return;
    api.quizzes
      .get(id)
      .then((res) => {
        setQuiz(res.quiz);
        setQuestions(res.questions);
        setTimeLeft(res.quiz.duration_minutes * 60);

        // Pre-initialize answer structures
        const initialAnswers: Record<number, any> = {};
        res.questions.forEach((q) => {
          if (q.type === 'coding') {
            let opts: any = {};
            try {
              opts = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json;
            } catch {}
            initialAnswers[q.id] = {
              question_id: q.id,
              code_submission: opts?.starterCode || '',
              passed_tests: false,
            };
          } else {
            initialAnswers[q.id] = {
              question_id: q.id,
              selected_index: null,
            };
          }
        });
        setAnswers(initialAnswers);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (result || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const handleSelectMCQ = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        question_id: questionId,
        selected_index: optionIndex,
      },
    }));
  };

  const handleCodeChange = (questionId: number, code: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        question_id: questionId,
        code_submission: code,
      },
    }));
  };

  const handleCodeValidation = (questionId: number, allPassed: boolean, code: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        question_id: questionId,
        code_submission: code,
        passed_tests: allPassed,
      },
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      const answersPayload = Object.values(answers);
      const res = await api.attempts.submit(attemptId, answersPayload);
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Error submitting quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !quiz) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#7B0FE8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If submitted, show result card
  if (result) {
    const isPassed = result.percentage >= 70;
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-12 text-center">
        <Card className="p-8 sm:p-12 shadow-xl border-neutral-200">
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6 ${
              isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-[#7B0FE8]'
            }`}
          >
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-black text-neutral-950 tracking-tight">
            Assessment Completed!
          </h2>
          <p className="text-neutral-500 mt-2 text-sm">
            Your results for "{quiz.title}" have been scored and recorded in the audit log.
          </p>

          <div className="my-8 p-6 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-around">
            <div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                Total Score
              </span>
              <span className="text-4xl font-black text-neutral-950 font-mono mt-1 block">
                {result.score} / {result.total}
              </span>
            </div>
            <div className="h-10 w-px bg-neutral-200" />
            <div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                Percentage
              </span>
              <span className="text-4xl font-black text-[#7B0FE8] font-mono mt-1 block">
                {result.percentage}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="primary"
              size="md"
              pill
              onClick={() => navigate('/app/history')}
            >
              View My History
            </Button>
            <Button
              variant="outline"
              size="md"
              pill
              onClick={() => navigate('/app')}
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  let currentOptions: any = null;
  try {
    currentOptions =
      typeof currentQ.options_json === 'string'
        ? JSON.parse(currentQ.options_json)
        : currentQ.options_json;
  } catch {}

  const currentAns = answers[currentQ.id];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner: Quiz Info, Timer & Submit */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase text-[#7B0FE8] bg-purple-50 px-2.5 py-0.5 rounded">
            Attempt in progress
          </span>
          <h2 className="text-xl font-bold text-neutral-950 mt-1">{quiz.title}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold border ${
              timeLeft < 300
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                : 'bg-neutral-50 text-neutral-800 border-neutral-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <Button
            variant="primary"
            size="md"
            pill
            isLoading={submitting}
            onClick={handleSubmitQuiz}
            className="gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Finish & Submit</span>
          </Button>
        </div>
      </div>

      {/* Question Number Pills Navigation */}
      <div className="bg-white p-3 rounded-2xl border border-neutral-200/90 shadow-xs flex items-center gap-2 overflow-x-auto">
        {questions.map((q, idx) => {
          const ans = answers[q.id];
          const isAnswered =
            q.type === 'mcq'
              ? ans?.selected_index !== null && ans?.selected_index !== undefined
              : ans?.code_submission && ans.code_submission.trim() !== '';

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                currentIdx === idx
                  ? 'bg-[#7B0FE8] text-white shadow-sm ring-2 ring-purple-300'
                  : isAnswered
                  ? 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                  : 'bg-neutral-50 text-neutral-400 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question Card */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <Badge variant={currentQ.type === 'coding' ? 'purple' : 'gray'} mono>
            {currentQ.type === 'coding' ? 'Interactive Coding Workspace' : 'Multiple Choice'}
          </Badge>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-neutral-950 leading-relaxed mb-6">
          {currentQ.text}
        </h3>

        {/* Question Type: MCQ */}
        {currentQ.type === 'mcq' && (
          <div className="space-y-3">
            {Array.isArray(currentOptions) &&
              currentOptions.map((opt: string, optIdx: number) => {
                const selected = currentAns?.selected_index === optIdx;
                return (
                  <label
                    key={optIdx}
                    onClick={() => handleSelectMCQ(currentQ.id, optIdx)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                      selected
                        ? 'border-[#7B0FE8] bg-purple-50/50 text-neutral-950 ring-1 ring-[#7B0FE8]'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        selected
                          ? 'border-[#7B0FE8] bg-[#7B0FE8] text-white'
                          : 'border-neutral-300'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{opt}</span>
                  </label>
                );
              })}
          </div>
        )}

        {/* Question Type: Coding Question */}
        {currentQ.type === 'coding' && (
          <div>
            <CodingWorkspace
              initialCode={currentAns?.code_submission || currentOptions?.starterCode || ''}
              testCases={(currentOptions?.testCases || []).filter((tc: any) => !tc.hidden)}
              language={currentOptions?.language || 'javascript'}
              questionId={currentQ.id}
              attemptId={attemptId ? Number(attemptId) : undefined}
              onCodeChange={(code) => handleCodeChange(currentQ.id, code)}
              onRunComplete={(allPassed, passedCount, totalCount, code) =>
                handleCodeValidation(currentQ.id, allPassed, code)
              }
              showLanguageSelector={false}
            />
          </div>
        )}

        {/* Next / Previous Controls */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
          <Button
            variant="outline"
            size="md"
            pill
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((prev) => prev - 1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {currentIdx < questions.length - 1 ? (
            <Button
              variant="primary"
              size="md"
              pill
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="gap-2"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              pill
              isLoading={submitting}
              onClick={handleSubmitQuiz}
              className="gap-2"
            >
              <span>Submit Assessment</span>
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
