import React, { useState, useEffect } from 'react';
import { api, Quiz, Question } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/Table';
import {
  Plus,
  Trash2,
  Edit,
  Clock,
  Layers,
  Code2,
  ListOrdered,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [addQuestionModalOpen, setAddQuestionModalOpen] = useState(false);

  // New Quiz Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newMaxAttempts, setNewMaxAttempts] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  // New Question Form state
  const [qType, setQType] = useState<'mcq' | 'coding'>('mcq');
  const [qText, setQText] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [mcqCorrect, setMcqCorrect] = useState(0);
  const [codingStarter, setCodingStarter] = useState('function solution() {\n  // Code\n}');
  const [codingLanguage, setCodingLanguage] = useState<'javascript' | 'python'>('javascript');
  const [codingFunctionName, setCodingFunctionName] = useState('solution');
  const [codingTestCases, setCodingTestCases] = useState([{ input: '', expected: '', hidden: false }]);

  const fetchQuizzes = async () => {
    try {
      const res = await api.quizzes.list();
      setQuizzes(res.quizzes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      await api.quizzes.create({
        title: newTitle,
        description: newDesc,
        duration_minutes: Number(newDuration),
        max_attempts: Number(newMaxAttempts),
      });
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      await fetchQuizzes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this quiz? All related questions and attempts will be removed.')) {
      return;
    }
    await api.quizzes.delete(id);
    await fetchQuizzes();
  };

  const handleOpenQuestions = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setQuestionsModalOpen(true);
    const res = await api.quizzes.get(quiz.id);
    setQuizQuestions(res.questions);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz || !qText.trim()) return;

    let options_json = '';
    let correct_index: number | null = null;

    if (qType === 'mcq') {
      options_json = JSON.stringify(mcqOptions.filter((o) => o.trim() !== ''));
      correct_index = mcqCorrect;
    } else {
      options_json = JSON.stringify({
        language: codingLanguage,
        functionName: codingFunctionName,
        starterCode: codingStarter,
        testCases: codingTestCases.filter(tc => tc.input.trim() || tc.expected.trim()),
      });
    }

    try {
      await api.questions.add(selectedQuiz.id, {
        type: qType,
        text: qText,
        options_json,
        correct_index,
        position: quizQuestions.length + 1,
      });

      // Refresh questions
      const res = await api.quizzes.get(selectedQuiz.id);
      setQuizQuestions(res.questions);
      setAddQuestionModalOpen(false);
      setQText('');
      await fetchQuizzes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!selectedQuiz) return;
    await api.questions.delete(qId);
    const res = await api.quizzes.get(selectedQuiz.id);
    setQuizQuestions(res.questions);
    await fetchQuizzes();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
            Manage Quizzes
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Author and configure test-driven coding challenges and multi-choice quizzes.
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
          <span>New Quiz</span>
        </Button>
      </div>

      {/* Quizzes Table Card */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>All Platform Quizzes ({quizzes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz Name & Description</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Max Attempts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell>
                    <div className="font-bold text-neutral-950 text-base">{quiz.title}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1 max-w-md">
                      {quiz.description || 'No description provided.'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="purple" mono>
                      {quiz.question_count || 0} Questions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-700">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{quiz.duration_minutes} mins</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{quiz.max_attempts} attempts</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        pill
                        onClick={() => handleOpenQuestions(quiz)}
                      >
                        Questions ({quiz.question_count || 0})
                      </Button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-2 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Quiz"
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

      {/* Modal: Create Quiz */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-xl font-bold text-neutral-950">Create New Quiz</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Quiz Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems & Concurrency"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Summary of topics, skills evaluated, and workspace expectations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newMaxAttempts}
                    onChange={(e) => setNewMaxAttempts(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  pill
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" pill isLoading={submitting}>
                  Save Quiz
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Manage Questions */}
      {questionsModalOpen && selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-[#7B0FE8] bg-purple-50 px-2 py-0.5 rounded">
                  Quiz Questions
                </span>
                <h3 className="text-xl font-bold text-neutral-950 mt-1">{selectedQuiz.title}</h3>
              </div>
              <button
                onClick={() => setQuestionsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                  Configured Questions ({quizQuestions.length})
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  pill
                  onClick={() => setAddQuestionModalOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </Button>
              </div>

              {quizQuestions.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-sm">
                  No questions created yet. Click "Add Question" above.
                </div>
              ) : (
                quizQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-neutral-200/90 bg-neutral-50/50 flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={q.type === 'coding' ? 'purple' : 'gray'} mono>
                            {q.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-neutral-900 mt-1.5">{q.text}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submodal: Add Question */}
      {addQuestionModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h4 className="text-lg font-bold text-neutral-950">Add New Question</h4>
              <button
                onClick={() => setAddQuestionModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Question Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQType('mcq')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                      qType === 'mcq'
                        ? 'border-[#7B0FE8] bg-purple-50 text-[#7B0FE8]'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <ListOrdered className="w-4 h-4" />
                    <span>Multiple Choice (MCQ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQType('coding')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                      qType === 'coding'
                        ? 'border-[#7B0FE8] bg-purple-50 text-[#7B0FE8]'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Coding Challenge</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Question Text / Problem Prompt *
                </label>
                <textarea
                  rows={2}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder={
                    qType === 'mcq'
                      ? 'e.g. Which keyword declares an immutable variable in modern JS?'
                      : 'e.g. Write a function reverseString(str: string): string'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                />
              </div>

              {qType === 'mcq' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-neutral-700">
                    Answer Options (Select the correct radio button)
                  </label>
                  {mcqOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct_option"
                        checked={mcqCorrect === i}
                        onChange={() => setMcqCorrect(i)}
                        className="text-[#7B0FE8] focus:ring-[#7B0FE8]"
                      />
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const updated = [...mcqOptions];
                          updated[i] = e.target.value;
                          setMcqOptions(updated);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 text-xs"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Language</label>
                      <select
                        value={codingLanguage}
                        onChange={(e) => setCodingLanguage(e.target.value as 'javascript' | 'python')}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Function Name</label>
                      <input
                        type="text"
                        value={codingFunctionName}
                        onChange={(e) => setCodingFunctionName(e.target.value)}
                        placeholder="e.g. twoSum"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Starter Code
                    </label>
                    <textarea
                      rows={5}
                      value={codingStarter}
                      onChange={(e) => setCodingStarter(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-neutral-700">Test Cases</label>
                      <button
                        type="button"
                        onClick={() => setCodingTestCases(prev => [...prev, { input: '', expected: '', hidden: false }])}
                        className="text-[11px] text-[#7B0FE8] font-bold hover:underline"
                      >
                        + Add Case
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {codingTestCases.map((tc, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tc.input}
                            onChange={(e) => {
                              const updated = [...codingTestCases];
                              updated[i] = { ...updated[i], input: e.target.value };
                              setCodingTestCases(updated);
                            }}
                            placeholder='Input e.g. "hello world"'
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#7B0FE8]"
                          />
                          <input
                            type="text"
                            value={tc.expected}
                            onChange={(e) => {
                              const updated = [...codingTestCases];
                              updated[i] = { ...updated[i], expected: e.target.value };
                              setCodingTestCases(updated);
                            }}
                            placeholder='Expected e.g. "world hello"'
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#7B0FE8]"
                          />
                          <label className="flex items-center gap-1 text-[11px] text-neutral-600 shrink-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tc.hidden}
                              onChange={(e) => {
                                const updated = [...codingTestCases];
                                updated[i] = { ...updated[i], hidden: e.target.checked };
                                setCodingTestCases(updated);
                              }}
                              className="rounded"
                            />
                            Hidden
                          </label>
                          {codingTestCases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setCodingTestCases(prev => prev.filter((_, j) => j !== i))}
                              className="text-neutral-400 hover:text-rose-500 text-xs px-1"
                              title="Remove"
                            >✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  pill
                  onClick={() => setAddQuestionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" pill>
                  Save Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
