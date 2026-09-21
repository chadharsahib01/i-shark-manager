import React, { useState } from 'react';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ darkMode, onToggleDarkMode }) => {
  const { signIn, resetPassword, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalMessage('Please enter both your institute email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setLocalMessage('Invalid email or password. Please verify your credentials.');
      } else if (code === 'auth/too-many-requests') {
        setLocalMessage('Too many unsuccessful attempts. Please wait a moment or reset your password.');
      } else if (code === 'auth/invalid-email') {
        setLocalMessage('Please enter a valid institute email address.');
      } else if (err.message && !localMessage) {
        setLocalMessage(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    clearError();

    if (!email.trim()) {
      setLocalMessage('Please enter your institute email address to receive reset instructions.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setResetEmailSent(true);
      setLocalMessage('Password reset link has been dispatched to your email.');
    } catch (err: any) {
      setLocalMessage(err.message || 'Could not send reset email. Please verify the address.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = localMessage || error;

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-8 z-10">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label="Toggle dark mode"
          id="btn-login-theme-toggle"
          className="p-3 rounded-full glass-panel text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      {/* Centered Glass Container */}
      <div className="w-full max-w-md mx-auto">
        <div className="glass-panel p-8 sm:p-10 rounded-[28px] relative overflow-hidden">
          {/* Subtle top inner light bar */}
          <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/40 dark:via-indigo-400/40 to-transparent" />

          {/* Institute Branding Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-500/25 mb-4 transform hover:scale-105 transition-transform duration-300">
              <GraduationCap className="w-9 h-9" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              I-SHARK Institute Manager
            </h1>
            <p className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1">
              I-SHARK Institute of Computer Technologies
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {resetMode
                ? 'Enter your registered email to reset your account password'
                : 'Sign in with your academic credentials'}
            </p>
          </div>

          {/* Feedback / Error Banner */}
          {displayedError && (
            <div
              className={`mb-6 p-3.5 rounded-2xl flex items-start space-x-3 text-xs leading-relaxed transition-all ${
                resetEmailSent
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}
              role="alert"
            >
              {resetEmailSent ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              )}
              <span className="flex-1">{displayedError}</span>
            </div>
          )}

          {/* Reset Password Form */}
          {resetMode ? (
            <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1"
                >
                  Institute Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@institute.edu"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/15 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                id="btn-submit-reset"
                className="btn-pill w-full py-3.5 px-6 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setResetEmailSent(false);
                    setLocalMessage(null);
                    clearError();
                  }}
                  className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1"
                >
                  Institute Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@institute.edu"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/15 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode(true);
                      setLocalMessage(null);
                      clearError();
                    }}
                    id="btn-forgot-password"
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 text-sm rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/15 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                id="btn-submit-login"
                className="btn-pill w-full py-3.5 px-6 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Admin Provisioning Notice (No public signup) */}
          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
            <div className="inline-flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Institute Access Only</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
              Student accounts are provisioned directly by the institute administration. Contact the registrar for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
