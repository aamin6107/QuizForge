import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Shield, User, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#7B0FE8] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 bg-black text-white rounded font-black flex items-center justify-center text-base">
            Q
          </div>
          <span className="text-[22px] font-black tracking-[-0.03em] text-neutral-950 uppercase font-sans">
            QUIZFORGE
          </span>
          <div className="w-3.5 h-3.5 bg-black rounded-[1px] translate-y-[-1px]"></div>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold text-neutral-950 tracking-tight">
          Sign in to your platform
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Access the quiz management panel and candidate workspaces.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Quick Seed Account Fill Buttons */}
        <div className="mb-4 bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-xs">
          <p className="text-xs font-semibold text-neutral-700 mb-2.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7B0FE8]"></span>
            <span>Quick Login with Seed Accounts:</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@quizforge.com', 'Admin@123')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 text-left transition-all text-xs font-medium cursor-pointer"
            >
              <Shield className="w-4 h-4 text-[#7B0FE8] shrink-0" />
              <div>
                <div className="font-bold text-neutral-900">Admin</div>
                <div className="text-[10px] text-neutral-500 font-mono">admin@quizforge.com</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('user@quizforge.com', 'User@123')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 text-left transition-all text-xs font-medium cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-neutral-900">Student</div>
                <div className="text-[10px] text-neutral-500 font-mono">user@quizforge.com</div>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white py-8 px-6 shadow-sm border border-neutral-200/90 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@quizforge.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                pill
                isLoading={isLoading}
                className="w-full py-3"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs font-medium text-neutral-500 hover:text-black transition-colors"
            >
              ← Back to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
