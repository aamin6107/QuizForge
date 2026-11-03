import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  History,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
  Sparkles,
  Code2,
  FolderCode,
} from 'lucide-react';
import { Badge } from './Badge';

interface SidebarProps {
  type: 'admin' | 'user';
}

export function Sidebar({ type }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Manage Quizzes', path: '/admin/quizzes', icon: BookOpen },
    { name: 'Assignments', path: '/admin/assignments', icon: FolderCode },
    { name: 'Attempts & Scores', path: '/admin/attempts', icon: ClipboardList },
    { name: 'Security & Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
    { name: 'Developer Workspace', path: '/admin/workspace', icon: Code2 },
  ];

  const userLinks = [
    { name: 'My Dashboard', path: '/app', icon: LayoutDashboard },
    { name: 'My Assignments', path: '/app/assignments', icon: FolderCode },
    { name: 'Available Quizzes', path: '/app/quizzes', icon: BookOpen },
    { name: 'Coding Workspace', path: '/app/workspace', icon: Code2 },
    { name: 'Attempt History', path: '/app/history', icon: History },
  ];

  const links = type === 'admin' ? adminLinks : userLinks;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black text-white rounded font-black flex items-center justify-center text-sm">
            Q
          </div>
          <span className="font-black text-lg tracking-tight">QUIZFORGE</span>
          <Badge variant={type === 'admin' ? 'purple' : 'gray'}>
            {type === 'admin' ? 'ADMIN' : 'STUDENT'}
          </Badge>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-neutral-600 hover:text-black rounded-lg"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200/90 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1">
          {/* Logo Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-black text-white rounded-[6px] font-black flex items-center justify-center text-base shadow-xs">
                Q
              </div>
              <div>
                <span className="font-black text-[17px] tracking-tight block text-neutral-950">
                  QUIZFORGE
                </span>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  {type === 'admin' ? 'Panel' : 'Student Workspace'}
                </span>
              </div>
            </div>
            <Badge variant={type === 'admin' ? 'purple' : 'gray'}>
              {type === 'admin' ? 'Admin' : 'Student'}
            </Badge>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
              Navigation
            </div>
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/admin' || link.path === '/app'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#7B0FE8] text-white shadow-[0_2px_8px_rgba(123,15,232,0.2)]'
                        : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
              );
            })}

            {/* Quick Link to Landing */}
            <div className="pt-6">
              <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
                Portal
              </div>
              <NavLink
                to="/"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
              >
                <Sparkles className="w-4 h-4 text-[#7B0FE8]" />
                <span>Landing Page</span>
              </NavLink>
            </div>
          </nav>
        </div>

        {/* User Profile Card at Bottom */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-neutral-200/80 mb-3 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-neutral-700 text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-neutral-900 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
        />
      )}
    </>
  );
}
