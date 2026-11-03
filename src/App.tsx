import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminQuizzes from './pages/admin/Quizzes';
import AdminAttempts from './pages/admin/Attempts';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminAssignments from './pages/admin/Assignments';

import UserDashboard from './pages/user/Dashboard';
import QuizTaking from './pages/user/QuizTaking';
import UserHistory from './pages/user/History';
import WorkspacePage from './pages/user/Workspace';
import StudentAssignments from './pages/user/Assignments';
import CloudIDE from './pages/user/CloudIDE';

function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B0FE8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col lg:flex-row">
      <Sidebar type="admin" />
      <main className="flex-1 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

function UserLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B0FE8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col lg:flex-row">
      <Sidebar type="user" />
      <main className="flex-1 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

function IDEAuthGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141416] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B0FE8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <CloudIDE />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Full Screen Standalone Cloud IDE */}
          <Route path="/app/workspace/ide/:workspaceId" element={<IDEAuthGuard />} />

          {/* Admin Routes (/admin/*) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="quizzes" element={<AdminQuizzes />} />
            <Route path="assignments" element={<AdminAssignments />} />
            <Route path="attempts" element={<AdminAttempts />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="workspace" element={<WorkspacePage />} />
          </Route>

          {/* User Routes (/app/*) */}
          <Route path="/app" element={<UserLayout />}>
            <Route index element={<UserDashboard />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="quizzes" element={<UserDashboard />} />
            <Route path="quiz/:id" element={<QuizTaking />} />
            <Route path="history" element={<UserHistory />} />
            <Route path="workspace" element={<WorkspacePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
