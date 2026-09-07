import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { AuthService } from '../../services/authService';

interface StudentLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ onBack, onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Real Supabase authentication — verified server-side. No demo bypass.
      const result = await AuthService.login(identifier, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Authentication failed. Please check credentials.');
      }
    } catch {
      setError('Unable to connect to campus services. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-campus-bg relative flex flex-col justify-between overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-10 max-w-md mx-auto w-full flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-campus-textMuted hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portals</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-glow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">CampusOS</span>
        </div>
      </header>

      {/* Login Card Form */}
      <main className="relative z-10 max-w-md mx-auto w-full my-auto py-8">
        <div className="glass-panel rounded-2xl p-7 sm:p-8 shadow-2xl border border-slate-800/90 relative">

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Student Login
            </h2>
            <p className="text-xs text-campus-textMuted mt-1">
              Welcome back! Continue your academic journey.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                College Email / Student ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. firstname.lastname@campus.edu or your college ID"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-400">Remember Me</span>
              </label>

              <span className="text-xs text-slate-500">
                Encrypted Session
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-glow-sm hover:shadow-glow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Student Portal</span>
              )}
            </button>
          </form>

          {/* Administrative Notice (No self-signup permitted) */}
          <div className="mt-7 pt-6 border-t border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-campus-textMuted">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Don't have an account?</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Contact your college administrator to provision your student ID.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-md mx-auto w-full text-center text-xs text-campus-textSubtle py-2">
        CampusOS AI &bull; Protected University Network
      </footer>
    </div>
  );
};
