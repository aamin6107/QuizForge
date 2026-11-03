// Centralized API client for QuizForge

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('quizforge_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = {};
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => ({}));
  } else {
    // If server returned HTML instead of JSON (e.g. hitting another app on this port)
    const text = await response.text().catch(() => '');
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(`Connected to a different service on this port (received HTML). Make sure you are accessing QuizForge on port 5173!`);
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  max_attempts: number;
  created_at: string;
  question_count?: number;
  user_attempts_count?: number;
  user_best_score?: number | null;
  can_attempt?: boolean;
}

export interface Question {
  id: number;
  quiz_id: number;
  type: 'mcq' | 'coding';
  text: string;
  options_json?: string;
  options?: any;
  correct_index?: number | null;
  position: number;
}

export interface Attempt {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  total: number;
  started_at: string;
  submitted_at?: string;
  status: 'in_progress' | 'completed' | 'timed_out';
  quiz_title?: string;
  user_name?: string;
  user_email?: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time_limit_minutes: number;
  hidden_test_file?: string;
  assigned_to: string;
  created_at: string;
  files?: Array<{ id: number; path: string; content?: string }>;
  workspace?: {
    id?: number;
    status: 'not_started' | 'provisioning' | 'running' | 'stopped' | 'submitted';
    started_at?: string;
    last_active_at?: string;
    auto_stop_at?: string;
  };
  submission?: {
    score: number;
    total: number;
    submitted_at: string;
  } | null;
  workspace_count?: number;
  submission_count?: number;
}

export interface WorkspaceFile {
  id?: number;
  workspace_id?: number;
  path: string;
  content: string;
}

export interface Workspace {
  id: number;
  user_id: number;
  assignment_id: number;
  status: 'not_started' | 'provisioning' | 'running' | 'stopped' | 'submitted';
  started_at: string;
  last_active_at: string;
  auto_stop_at: string;
  assignment_title?: string;
  assignment_description?: string;
  assignment_difficulty?: 'Easy' | 'Medium' | 'Hard';
  time_limit_minutes?: number;
}

export interface TestResultItem {
  name: string;
  passed: boolean;
  error?: string | null;
  hidden?: boolean;
}

export interface WorkspaceSubmission {
  id: number;
  workspace_id: number;
  user_id: number;
  assignment_id: number;
  score: number;
  total: number;
  percentage?: number;
  test_results_json?: string;
  testResults?: TestResultItem[];
  submitted_at: string;
  user_name?: string;
  user_email?: string;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ user: User }>('/auth/me'),
    logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  },
  quizzes: {
    list: () => request<{ quizzes: Quiz[] }>('/quizzes'),
    get: (id: number | string) =>
      request<{ quiz: Quiz; questions: Question[] }>(`/quizzes/${id}`),
    create: (data: Partial<Quiz> & { questions?: any[] }) =>
      request<{ id: number; message: string }>('/quizzes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number | string, data: Partial<Quiz>) =>
      request<{ success: boolean }>(`/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number | string) =>
      request<{ success: boolean }>(`/quizzes/${id}`, { method: 'DELETE' }),
  },
  questions: {
    listAdmin: (quizId: number | string) =>
      request<{ questions: Question[] }>(`/quizzes/${quizId}/admin-questions`),
    add: (quizId: number | string, data: Partial<Question>) =>
      request<{ id: number; message: string }>(`/quizzes/${quizId}/questions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number | string) =>
      request<{ success: boolean }>(`/questions/${id}`, { method: 'DELETE' }),
  },
  attempts: {
    start: (quizId: number | string) =>
      request<{ attemptId: number; quizId: number; durationMinutes: number }>(
        `/quizzes/${quizId}/start`,
        { method: 'POST' }
      ),
    submit: (attemptId: number | string, answers: any[]) =>
      request<{
        success: boolean;
        attemptId: number;
        score: number;
        total: number;
        percentage: number;
      }>(`/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),
    get: (attemptId: number | string) =>
      request<{ attempt: Attempt; answers: any[] }>(`/attempts/${attemptId}`),
    list: () => request<{ attempts: Attempt[] }>('/attempts'),
  },
  code: {
    run: (code: string, language: string, testCases: any[]) =>
      request<{
        success: boolean;
        allPassed: boolean;
        error?: string;
        results: Array<{
          input: any;
          expected: any;
          actual: string;
          passed: boolean;
          error?: string;
        }>;
      }>('/code/run', {
        method: 'POST',
        body: JSON.stringify({ code, language, testCases }),
      }),
    workspace: (payload: { questionId?: number; language: string; code: string; testCases?: any[] }) =>
      request<{
        success: boolean;
        allPassed: boolean;
        passedCount: number;
        totalCount: number;
        results: Array<{
          input: string;
          expected: string;
          actual: string;
          passed: boolean;
          runtime: number;
          error?: string | null;
        }>;
        consoleLogs: string[];
        error?: string | null;
      }>('/workspace/run', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  workspace: {
    getStatus: () => request<{ online: boolean; url: string }>('/workspace/status'),
    openLog: () => request<{ success: boolean }>('/workspace/open-log', { method: 'POST' }),
  },
  assignments: {
    list: () => request<{ assignments: Assignment[] }>('/assignments'),
    get: (id: number | string) =>
      request<{ assignment: Assignment; files: WorkspaceFile[] }>(`/assignments/${id}`),
    create: (data: Partial<Assignment> & { starter_files?: Array<{ path: string; content: string }> }) =>
      request<{ id: number; success: boolean }>('/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number | string, data: Partial<Assignment> & { starter_files?: Array<{ path: string; content: string }> }) =>
      request<{ success: boolean }>(`/assignments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number | string) =>
      request<{ success: boolean }>(`/assignments/${id}`, { method: 'DELETE' }),
    getSubmissions: (id: number | string) =>
      request<{ submissions: WorkspaceSubmission[] }>(`/assignments/${id}/submissions`),
    launchWorkspace: (id: number | string) =>
      request<{ workspace: Workspace; files: WorkspaceFile[]; newlyCreated: boolean }>(
        `/assignments/${id}/workspace/launch`,
        { method: 'POST' }
      ),
  },
  workspaces: {
    get: (id: number | string) =>
      request<{ workspace: Workspace; files: WorkspaceFile[]; submission?: WorkspaceSubmission }>(`/workspaces/${id}`),
    stop: (id: number | string) =>
      request<{ success: boolean; status: string }>(`/workspaces/${id}/stop`, { method: 'POST' }),
    start: (id: number | string) =>
      request<{ success: boolean; status: string }>(`/workspaces/${id}/start`, { method: 'POST' }),
    delete: (id: number | string) =>
      request<{ success: boolean }>(`/workspaces/${id}`, { method: 'DELETE' }),
    saveFiles: (id: number | string, data: { path?: string; content?: string; files?: Array<{ path: string; content: string }> }) =>
      request<{ success: boolean }>(`/workspaces/${id}/files`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteFile: (id: number | string, path: string) =>
      request<{ success: boolean }>(`/workspaces/${id}/files`, {
        method: 'DELETE',
        body: JSON.stringify({ path }),
      }),
    renameFile: (id: number | string, oldPath: string, newPath: string) =>
      request<{ success: boolean }>(`/workspaces/${id}/files/rename`, {
        method: 'POST',
        body: JSON.stringify({ oldPath, newPath }),
      }),
    exec: (id: number | string, command: string) =>
      request<{ output: string; exitCode: number; clear?: boolean; testResults?: TestResultItem[] }>(
        `/workspaces/${id}/exec`,
        {
          method: 'POST',
          body: JSON.stringify({ command }),
        }
      ),
    submit: (id: number | string) =>
      request<{ submission: WorkspaceSubmission }>(`/workspaces/${id}/submit`, { method: 'POST' }),
  },
  submissions: {
    getFiles: (id: number | string) =>
      request<{ submission: WorkspaceSubmission; files: WorkspaceFile[] }>(`/submissions/${id}/files`),
  },
  auditLogs: {
    list: (limit = 100) => request<{ logs: AuditLog[] }>(`/audit-logs?limit=${limit}`),
  },
  stats: {
    get: () =>
      request<{
        stats: any;
        recentActivity?: AuditLog[];
      }>('/stats'),
  },
};
