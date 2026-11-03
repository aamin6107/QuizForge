import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  CheckCircle2,
  Shield,
  Zap,
  Terminal,
  Cpu,
  Layers,
  BookOpen,
  Users,
  Clock,
  History,
  Smartphone,
  ShieldCheck,
  Timer,
  LayoutDashboard,
  KeyRound,
  Download,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CodingWorkspace } from '../components/CodingWorkspace';
import Footer from '../components/Footer';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigation scroll blur state
  const [isScrolled, setIsScrolled] = useState(false);

  // Tabbed value state: 'admins' | 'candidates'
  const [activeTab, setActiveTab] = useState<'admins' | 'candidates'>('admins');

  // FAQ open item state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Coder external IDE connection status
  const [coderStatus, setCoderStatus] = useState<{ online: boolean; url: string }>({
    online: false,
    url: import.meta.env.VITE_CODER_URL || 'http://localhost:3000',
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.workspace
      .getStatus()
      .then(setCoderStatus)
      .catch(() =>
        setCoderStatus({
          online: false,
          url: import.meta.env.VITE_CODER_URL || 'http://localhost:3000',
        })
      );
  }, []);

  const handleOpenCoder = async () => {
    try {
      await api.workspace.openLog();
    } catch {}
    window.open(coderStatus.url || 'http://localhost:3000', '_blank', 'noopener,noreferrer');
  };

  const sampleDemoCode = `function reverseWords(str) {
  // Try editing this code directly in the browser!
  return str.split(' ').reverse().join(' ');
}`;

  const sampleTestCases = [
    { input: '"QuizForge built-in workspace"', expected: '"workspace built-in QuizForge"' },
    { input: '"hello world"', expected: '"world hello"' },
  ];

  const marqueeAudiences = [
    'Students',
    'Educators',
    'Bootcamps',
    'Hiring Teams',
    'Universities',
    'Interviewers',
    'Platform Engineers',
    'Assessment Officers',
  ];

  const adminValuePoints = [
    {
      title: 'Granular quiz authoring',
      description: 'Design mixed evaluations with multiple choice, free response, and real-time coding problems.',
    },
    {
      title: 'Server-enforced integrity',
      description: 'Set strict countdown timers, auto-submit on expiry, and configurable max attempt caps.',
    },
    {
      title: 'Automated test suite grading',
      description: 'Run candidate submissions against hidden test cases with immediate score calculations.',
    },
    {
      title: 'Tamper-resistant audit trail',
      description: 'Log every authentication, question modification, submission event, and score change.',
    },
  ];

  const candidateValuePoints = [
    {
      title: 'Frictionless in-browser editor',
      description: 'Zero local setup — syntax highlighting, line numbers, and fast execution within seconds.',
    },
    {
      title: 'Instant test feedback',
      description: 'Run code against visible sample test cases before final submission to verify edge cases.',
    },
    {
      title: 'Distraction-free exam UI',
      description: 'Clean focus-driven interface with clear question navigation and active timer countdowns.',
    },
    {
      title: 'Comprehensive history',
      description: 'Review previous attempt scores, submitted code snippets, and benchmark metrics over time.',
    },
  ];

  const coreFeatures = [
    {
      title: 'Quiz management',
      description: 'Create, edit and delete quizzes with multiple choice and interactive coding questions.',
      icon: BookOpen,
    },
    {
      title: 'Role-based access',
      description: 'Separate administrator panel and student workspace logins with distinct permissions.',
      icon: Users,
    },
    {
      title: 'Take quizzes',
      description: 'Timed quiz attempts with live progress tracking, question navigator, and instant results.',
      icon: Clock,
    },
    {
      title: 'Auto-grading',
      description: 'Instant scoring evaluation upon submission with full question-by-question answer review.',
      icon: Zap,
    },
    {
      title: 'Coding workspace',
      description: 'In-browser editor with syntax highlight, line numbering, and automated test suite runner.',
      icon: Code2,
    },
    {
      title: 'Results and history',
      description: 'Per-user attempt history with benchmark score cards, timestamps, and submitted code archives.',
      icon: History,
    },
    {
      title: 'Responsive design',
      description: 'Optimized touch-friendly UI that works seamlessly on mobile phones, tablets, and desktop workstations.',
      icon: Smartphone,
    },
  ];

  const advancedFeatures = [
    {
      title: 'Audit logging',
      description: 'Every login, attempt, submission and admin change is recorded into an immutable, filterable stream.',
      icon: ShieldCheck,
    },
    {
      title: 'Timer and attempt limits',
      description: 'Server-enforced countdown with auto-submit upon expiry, plus configurable max attempts per quiz.',
      icon: Timer,
    },
    {
      title: 'Analytics dashboard',
      description: 'Admin overview metrics on active users, total attempts, pass rates, and average score benchmarks.',
      icon: LayoutDashboard,
    },
    {
      title: 'Live coding workspace',
      description: 'Run candidate code against hidden test cases in isolated sandboxes with instant auto-grading.',
      icon: Terminal,
    },
    {
      title: 'Secure access',
      description: 'Bcrypt password hashing, token-based authentication sessions, and strictly protected API routes.',
      icon: KeyRound,
    },
    {
      title: 'CSV export',
      description: 'Export structured attempt results, grade books, and security audit log streams in one click.',
      icon: Download,
    },
  ];

  const faqs = [
    {
      question: 'How does the in-browser coding workspace execute candidate code?',
      answer:
        'Candidate code is evaluated in an isolated client/server execution sandbox with strict timeouts. Built-in test cases pass arguments into the candidate function and verify expected output returns with real-time pass/fail indicators.',
    },
    {
      question: 'What is the difference between the Quick Editor and the Full IDE (Coder)?',
      answer:
        'The Quick Editor is an integrated lightweight Monaco code editor designed for targeted quiz questions and standalone algorithmic problems. The Full IDE option connects directly to a containerized cloud developer environment powered by Coder for multi-file workspace development.',
    },
    {
      question: 'How are quiz timers and attempt limits enforced?',
      answer:
        'Timers and attempt limits are enforced server-side. When the countdown reaches zero, the attempt is automatically submitted and locked, ensuring complete assessment integrity across network disconnects or browser refreshes.',
    },
    {
      question: 'Can I export student scores and system audit logs?',
      answer:
        'Yes. Administrators have one-click CSV export access for student grade books, detailed question-by-question attempt scores, and tamper-resistant security audit log streams directly from the admin panel.',
    },
    {
      question: 'Is QuizForge secure for enterprise and university exams?',
      answer:
        'QuizForge utilizes bcrypt password encryption, stateless JWT session tokens, strict role-based route guards, and comprehensive audit trails to guarantee administrative transparency and secure candidate testing.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col justify-between selection:bg-[#7B0FE8] selection:text-white font-sans antialiased">
      {/* 1. Sticky, Slim Top Nav */}
      <header
        className={`w-full sticky top-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/85 backdrop-blur-md border-b border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
            : 'bg-white border-b border-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Left */}
            <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-90">
              <div className="w-7 h-7 bg-[#0A0A0A] text-white rounded-[6px] font-black flex items-center justify-center text-sm shadow-xs">
                Q
              </div>
              <span className="text-[17px] font-bold tracking-[-0.03em] text-[#0A0A0A] uppercase font-sans">
                QUIZFORGE
              </span>
              <div className="w-2.5 h-2.5 bg-[#0A0A0A] rounded-[1px] translate-y-[-1px]"></div>
            </Link>

            {/* 3-4 Text Links Center */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-[13px] font-medium text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
              >
                Features
              </a>
              <a
                href="#workspace"
                className="text-[13px] font-medium text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
              >
                Workspace
              </a>
              <a
                href="#audiences"
                className="text-[13px] font-medium text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
              >
                Solutions
              </a>
              <a
                href="#faq"
                className="text-[13px] font-medium text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* One Primary Button Right (Solid Black) */}
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => navigate(user.role === 'admin' ? '/admin' : '/app')}
                  className="bg-[#0A0A0A] hover:bg-[#262626] text-white text-[13px] font-medium px-4 py-2 rounded-full transition-all duration-150 shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Enter Portal ({user.role})
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="hidden sm:inline-flex text-[13px] font-medium text-[#0A0A0A] hover:text-[#6B7280] px-3 py-2 transition-colors cursor-pointer"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="bg-[#0A0A0A] hover:bg-[#262626] text-white text-[13px] font-medium px-4 py-2 rounded-full transition-all duration-150 shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Get started free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="pt-16 pb-16 sm:pt-24 sm:pb-20 text-center px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            {/* Mono Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="text-[11px] font-mono font-medium tracking-[0.1em] uppercase text-[#6B7280] bg-[#F4F4F5] border border-[#E5E7EB] px-3 py-1 rounded-full">
                GOVERNED ASSESSMENT INFRASTRUCTURE
              </span>
            </div>

            {/* Huge tight-tracked headline with restrained purple accent */}
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-bold tracking-[-0.04em] leading-[1.02] text-[#0A0A0A] max-w-4xl mx-auto">
              Build, run and <span className="text-[#7B0FE8]">grade</span> quizzes with a built-in{' '}
              <span className="text-[#7B0FE8]">coding workspace</span>.
            </h1>

            {/* One short grey sub-paragraph */}
            <p className="mt-6 text-base sm:text-lg md:text-xl leading-relaxed text-[#6B7280] max-w-2xl mx-auto font-normal">
              Provision governed, isolated testing environments for candidates and real-time coding
              assessments, secured on your enterprise infrastructure.
            </p>

            {/* Two CTAs (Solid black primary + outlined secondary) */}
            <div className="mt-8 flex items-center justify-center gap-3.5 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="bg-[#0A0A0A] hover:bg-[#262626] text-white text-sm font-medium px-6 py-3 rounded-full transition-all duration-150 shadow-sm hover:-translate-y-0.5 active:translate-y-0 cursor-pointer inline-flex items-center gap-2"
              >
                <span>Get started free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="bg-white hover:bg-[#FAFAFA] text-[#0A0A0A] border border-[#E5E7EB] hover:border-neutral-400 text-sm font-medium px-6 py-3 rounded-full transition-all duration-150 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Sign in to panel</span>
              </button>
            </div>

            {/* Wide Product Visual Framed in a Rounded Card */}
            <div id="workspace" className="mt-14 max-w-5xl mx-auto">
              <div className="p-2 sm:p-3 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                {/* Dual Environment & Coder Launch Bar */}
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#E5E7EB] mb-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#F4F4F5] text-[#0A0A0A] flex items-center justify-center shrink-0">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#0A0A0A]">Dual Workspace Runtimes</span>
                        <div className="flex items-center gap-1.5 bg-[#F4F4F5] px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              coderStatus.online ? 'bg-emerald-500' : 'bg-neutral-400'
                            }`}
                          />
                          <span className="text-[10px] font-mono text-[#6B7280]">
                            Coder: {coderStatus.online ? 'Online' : 'Standby'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        In-browser Monaco editor for rapid algorithm puzzles · Cloud container IDE for full-stack repos.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenCoder}
                    className="bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium px-4 py-2 rounded-full transition-all duration-150 shadow-xs hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Open Full IDE (Coder)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Monaco Coding Workspace Card */}
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2 text-left">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] bg-[#F4F4F5] px-2 py-0.5 rounded border border-[#E5E7EB]">
                        LIVE CODE RUNNER
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-[#0A0A0A] mt-1 tracking-tight">
                        Built-in Candidate Coding Workspace
                      </h3>
                      <p className="text-xs text-[#6B7280]">
                        Interactive Monaco code editor with real-time subprocess execution and auto-grading.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#6B7280] bg-[#F4F4F5] px-2.5 py-1 rounded-full border border-[#E5E7EB]">
                        Monaco Dark
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Auto-Grading Active
                      </span>
                    </div>
                  </div>

                  <CodingWorkspace
                    initialCode={sampleDemoCode}
                    testCases={sampleTestCases}
                    language="javascript"
                    showLanguageSelector={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Scrolling Marquee Strip */}
        <section
          id="audiences"
          className="border-y border-[#E5E7EB] bg-[#FAFAFA] py-4 overflow-hidden relative"
        >
          <div className="max-w-[1200px] mx-auto px-4 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#6B7280] text-center block">
              TRUSTED FOR TECHNICAL EVALUATIONS BY
            </span>
          </div>

          <div className="w-full overflow-hidden flex select-none py-1">
            <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
              {[...marqueeAudiences, ...marqueeAudiences].map((aud, index) => (
                <div key={index} className="flex items-center gap-8">
                  <span className="text-sm font-medium text-[#0A0A0A] tracking-tight">{aud}</span>
                  <span className="text-[#6B7280] text-xs font-mono">·</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Tabbed Value Section ("For Admins" / "For Candidates") */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-mono font-medium tracking-[0.12em] uppercase text-[#6B7280] bg-[#F4F4F5] border border-[#E5E7EB] px-3 py-1 rounded-full inline-block mb-3">
              ROLE-SPECIFIC WORKFLOWS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0A0A0A]">
              Built for <span className="text-[#7B0FE8]">administrators</span> and candidates alike.
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280] mt-3 leading-relaxed">
              Every persona gets an uncompromising interface optimized for speed, reliability, and security.
            </p>

            {/* Tab Buttons */}
            <div className="inline-flex p-1 bg-[#F4F4F5] border border-[#E5E7EB] rounded-full mt-8">
              <button
                type="button"
                onClick={() => setActiveTab('admins')}
                className={`px-5 py-2 text-xs font-medium rounded-full transition-all duration-150 cursor-pointer ${
                  activeTab === 'admins'
                    ? 'bg-[#0A0A0A] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#0A0A0A]'
                }`}
              >
                For Admins & Educators
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('candidates')}
                className={`px-5 py-2 text-xs font-medium rounded-full transition-all duration-150 cursor-pointer ${
                  activeTab === 'candidates'
                    ? 'bg-[#0A0A0A] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#0A0A0A]'
                }`}
              >
                For Candidates & Students
              </button>
            </div>
          </div>

          {/* 2-Column Grid of Value Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {(activeTab === 'admins' ? adminValuePoints : candidateValuePoints).map((point, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] hover:border-neutral-300 transition-all duration-150 flex flex-col justify-start"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />
                  <h3 className="text-sm font-bold text-[#0A0A0A] tracking-tight">{point.title}</h3>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed pl-3.5">{point.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Alternating Split Sections */}
        <section className="py-16 bg-[#FAFAFA] border-y border-[#E5E7EB]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
            {/* Split Row 1: Quiz Management (Text Left, Visual Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#6B7280] bg-white border border-[#E5E7EB] px-2.5 py-1 rounded">
                  01 · AUTHORING
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
                  Governed <span className="text-[#7B0FE8]">quiz management</span> and authoring.
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Compose comprehensive technical assessments with mixed question formats, customizable timers,
                  randomized options, and strict attempt enforcement.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Timed countdowns
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Question banks
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Role RBAC
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-[#0A0A0A]">Algorithm Mastery Quiz</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#6B7280]">45 Mins · 5 Attempts Max</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-3 bg-[#FAFAFA] rounded-lg border border-[#E5E7EB] text-xs flex justify-between items-center">
                      <span className="text-[#0A0A0A] font-medium">Q1: Reverse words in sentence</span>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E5E7EB] text-[#6B7280]">
                        Coding Question
                      </span>
                    </div>
                    <div className="p-3 bg-[#FAFAFA] rounded-lg border border-[#E5E7EB] text-xs flex justify-between items-center">
                      <span className="text-[#0A0A0A] font-medium">Q2: Asymptotic complexity of binary search</span>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E5E7EB] text-[#6B7280]">
                        Multiple Choice
                      </span>
                    </div>
                    <div className="p-3 bg-[#FAFAFA] rounded-lg border border-[#E5E7EB] text-xs flex justify-between items-center">
                      <span className="text-[#0A0A0A] font-medium">Q3: Breadth-first graph traversal</span>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E5E7EB] text-[#6B7280]">
                        Coding Question
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Row 2: Live Coding Workspace (Visual Left, Text Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3 text-[11px] text-[#6B7280]">
                    <span>RUNNER STATUS: EXECUTION COMPLETE</span>
                    <span className="text-emerald-600 font-bold">ALL PASS (2/2)</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-emerald-50/60 rounded border border-emerald-200/80 text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Test Case 1: "QuizForge built-in workspace"</div>
                        <div className="text-[10px] text-emerald-700">Expected: "workspace built-in QuizForge" · Passed in 8ms</div>
                      </div>
                    </div>
                    <div className="p-2.5 bg-emerald-50/60 rounded border border-emerald-200/80 text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Test Case 2: "hello world"</div>
                        <div className="text-[10px] text-emerald-700">Expected: "world hello" · Passed in 4ms</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#6B7280] bg-white border border-[#E5E7EB] px-2.5 py-1 rounded">
                  02 · WORKSPACE
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
                  In-browser <span className="text-[#7B0FE8]">coding workspace</span> with dual runtimes.
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Switch smoothly between lightweight in-memory evaluations for rapid algorithmic puzzles and
                  full containerized Coder environments for multi-file repositories.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Monaco engine
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Subprocess sandboxing
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Coder full IDE
                  </span>
                </div>
              </div>
            </div>

            {/* Split Row 3: Auto-Grading (Text Left, Visual Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#6B7280] bg-white border border-[#E5E7EB] px-2.5 py-1 rounded">
                  03 · EVALUATION
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
                  Instant <span className="text-[#7B0FE8]">auto-grading</span> and verification.
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Eliminate manual grading overhead with deterministic evaluation suites that grade both
                  multiple-choice questions and complex programming solutions instantly upon submission.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Zero latency
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Assertion runners
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Answer review cards
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
                    <span className="text-xs font-bold text-[#0A0A0A]">Submission Evaluation Card</span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Score: 100%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                      <div className="text-[10px] font-mono text-[#6B7280]">QUESTIONS</div>
                      <div className="text-base font-bold text-[#0A0A0A] mt-0.5">10 / 10</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                      <div className="text-[10px] font-mono text-[#6B7280]">TIME USED</div>
                      <div className="text-base font-bold text-[#0A0A0A] mt-0.5">14m 22s</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                      <div className="text-[10px] font-mono text-[#6B7280]">STATUS</div>
                      <div className="text-base font-bold text-emerald-600 mt-0.5">PASSED</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#6B7280] flex items-center justify-between">
                    <span>Submitted by candidate: Aamin (user@quizforge.com)</span>
                    <span className="font-mono">Audit ID #8492</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Row 4: Analytics and Auditing (Visual Left, Text Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
                    <span className="text-xs font-bold text-[#0A0A0A]">Live Assessment Analytics</span>
                    <span className="text-[11px] font-mono text-[#6B7280]">Cohort A · Spring 2026</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
                      <span className="text-[10px] font-mono uppercase text-[#6B7280]">Total Attempts</span>
                      <div className="text-xl font-bold text-[#0A0A0A] mt-1">128</div>
                    </div>
                    <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
                      <span className="text-[10px] font-mono uppercase text-[#6B7280]">Pass Benchmark</span>
                      <div className="text-xl font-bold text-[#0A0A0A] mt-1">91.4%</div>
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#FAFAFA] rounded-lg border border-[#E5E7EB] text-xs flex items-center justify-between">
                    <span className="text-[#6B7280]">Tamper-Proof Audit Stream</span>
                    <span className="font-mono text-[10px] text-[#0A0A0A]">SYNCED · IMMUTABLE</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#6B7280] bg-white border border-[#E5E7EB] px-2.5 py-1 rounded">
                  04 · ANALYTICS
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
                  Enterprise <span className="text-[#7B0FE8]">analytics</span> and audit logs.
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Gain actionable cohort insights with live participant benchmarks, attempt distributions,
                  and export comprehensive compliance reports directly to CSV.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Audit trails
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    Cohort metrics
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                    CSV export
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Feature Grid (Core Platform / Advanced Platform) */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
          {/* Main Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-mono font-medium tracking-[0.12em] uppercase text-[#6B7280] bg-[#F4F4F5] border border-[#E5E7EB] px-3 py-1 rounded-full inline-block mb-3">
              FULL SPECIFICATION
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0A0A0A]">
              Everything the platform provides.
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280] mt-3 leading-relaxed">
              QuizForge delivers complete assessment orchestration, sandboxed coding runtimes, and
              enterprise compliance out of the box.
            </p>
          </div>

          {/* Core Platform Grid */}
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-[#0A0A0A] tracking-tight">Core platform</h3>
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#F4F4F5] text-[#6B7280] border border-[#E5E7EB]">
                INCLUDED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coreFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white border border-[#E5E7EB] hover:border-neutral-400 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-lg bg-[#F4F4F5] text-[#0A0A0A] flex items-center justify-center mb-4">
                        <Icon className="w-4 h-4 text-[#0A0A0A]" />
                      </div>
                      <h4 className="text-sm font-bold text-[#0A0A0A] tracking-tight">{feat.title}</h4>
                      <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">{feat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Features Grid */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-[#0A0A0A] tracking-tight">Advanced features</h3>
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#0A0A0A] text-white">
                ENTERPRISE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {advancedFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white border border-[#E5E7EB] hover:border-neutral-400 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-lg bg-[#F4F4F5] text-[#0A0A0A] flex items-center justify-center mb-4">
                        <Icon className="w-4 h-4 text-[#0A0A0A]" />
                      </div>
                      <h4 className="text-sm font-bold text-[#0A0A0A] tracking-tight">{feat.title}</h4>
                      <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">{feat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. FAQ Accordion */}
        <section id="faq" className="py-20 bg-[#FAFAFA] border-t border-[#E5E7EB]">
          <div className="max-w-[800px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-[11px] font-mono font-medium tracking-[0.12em] uppercase text-[#6B7280] bg-white border border-[#E5E7EB] px-3 py-1 rounded-full inline-block mb-3">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
                Everything you need to know about QuizForge.
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden"
                    >
                      <span className="text-sm font-semibold text-[#0A0A0A]">{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#0A0A0A]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-[#6B7280] leading-relaxed border-t border-[#E5E7EB]/50 mt-1">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 8. Final CTA Band */}
        <section className="py-20 px-4 sm:px-6 text-center bg-white border-t border-[#E5E7EB]">
          <div className="max-w-[700px] mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0A0A0A]">
              Ready to streamline your technical assessments?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#6B7280] leading-relaxed">
              Create comprehensive quizzes, evaluate code candidates in sandboxed runtimes, and track results
              with enterprise governance.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3.5 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="bg-[#0A0A0A] hover:bg-[#262626] text-white text-sm font-medium px-6 py-3 rounded-full transition-all duration-150 shadow-sm hover:-translate-y-0.5 active:translate-y-0 cursor-pointer inline-flex items-center gap-2"
              >
                <span>Get started free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="bg-white hover:bg-[#FAFAFA] text-[#0A0A0A] border border-[#E5E7EB] hover:border-neutral-400 text-sm font-medium px-6 py-3 rounded-full transition-all duration-150 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Sign in to panel
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
