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
  ShieldCheck,
  Moon,
  Sun,
  Sparkles,
  Barcode,
  Check,
  Calendar
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
      setLocalMessage('Please provide your academic email and authentication key.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setLocalMessage('Invalid academic credentials. Please verify your email and password.');
      } else if (code === 'auth/too-many-requests') {
        setLocalMessage('Too many attempts. Rate limit engaged. Please try again shortly.');
      } else if (code === 'auth/invalid-email') {
        setLocalMessage('Invalid format. Please enter an authorized institute email address.');
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
      setLocalMessage('Please provide your registered institute email for credential recovery.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setResetEmailSent(true);
      setLocalMessage('Credential recovery dispatch sent to your inbox.');
    } catch (err: any) {
      setLocalMessage(err.message || 'Unable to dispatch reset link. Verify institutional record.');
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
          className="p-3 rounded-2xl bg-slate-800/80 text-slate-200 hover:text-white border border-slate-700/80 hover:border-violet-500/40 transition-all shadow-md btn-tactile"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-violet-400" />}
        </button>
      </div>

      {/* Main Container: Split Grid (Form + Cyber Ticket Pass) */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: Deep Matte Inset Form (Inspiration 4 + Inspiration 3) */}
        <div className="lg:col-span-7">
          <div className="ticket-pass p-7 sm:p-9 relative overflow-hidden bg-slate-900/95 border-violet-500/20">
            {/* Top Laser Accent */}
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 tag-mono text-[10px] font-bold">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span>ACADEMIC ACCESS GATEWAY</span>
                </div>
                <span className="tag-mono text-[10px] text-slate-500">PORTAL 2.4</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                I-SHARK Institute
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {resetMode
                  ? 'Enter your institutional email to dispatch password recovery'
                  : 'Authenticate to access academic dashboard, attendance & records'}
              </p>
            </div>

            {/* Alert Message */}
            {displayedError && (
              <div
                className={`mb-6 p-3.5 rounded-xl flex items-start space-x-3 text-xs leading-relaxed transition-all ${
                  resetEmailSent
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
                role="alert"
              >
                {resetEmailSent ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <span className="flex-1 font-medium">{displayedError}</span>
              </div>
            )}

            {resetMode ? (
              /* Password Reset Form */
              <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="reset-email" className="block tag-mono text-[10px] text-slate-400 mb-2">
                    INSTITUTIONAL EMAIL
                  </label>
                  <div className="inset-field">
                    <Mail className="w-4 h-4 text-violet-400 shrink-0" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@ishark.edu"
                      className="text-sm font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  id="btn-submit-reset"
                  className="glow-orb-btn w-full py-3.5 px-6 text-sm text-white bg-slate-800 hover:bg-slate-700 border border-violet-500/30 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Dispatch Recovery Key</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode(false);
                      setResetEmailSent(false);
                      setLocalMessage(null);
                      clearError();
                    }}
                    className="tag-mono text-xs text-violet-400 hover:text-violet-300 underline underline-offset-4"
                  >
                    RETURN TO AUTH GATE
                  </button>
                </div>
              </form>
            ) : (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="login-email" className="block tag-mono text-[10px] text-slate-400 mb-2">
                    ACADEMIC IDENTIFIER / EMAIL
                  </label>
                  <div className="inset-field">
                    <Mail className="w-4 h-4 text-violet-400 shrink-0" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@ishark.edu"
                      className="text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="login-password" className="tag-mono text-[10px] text-slate-400">
                      ACCESS CIPHER
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetMode(true);
                        setLocalMessage(null);
                        clearError();
                      }}
                      id="btn-forgot-password"
                      className="tag-mono text-[10px] text-violet-400 hover:underline"
                    >
                      FORGOT CIPHER?
                    </button>
                  </div>
                  <div className="inset-field">
                    <Lock className="w-4 h-4 text-violet-400 shrink-0" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide cipher' : 'Show cipher'}
                      className="text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Glowing Orb Action Button (Inspiration 3) */}
                <button
                  type="submit"
                  disabled={submitting}
                  id="btn-submit-login"
                  className="glow-orb-btn w-full py-3.5 px-6 text-sm text-white bg-slate-900 hover:bg-black border border-violet-500/40 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-xl shadow-violet-900/30"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="tracking-wide uppercase">Authenticate Credentials</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Institutional Security Notice */}
            <div className="mt-8 pt-6 border-t border-dashed border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                <span className="tag-mono text-[9px]">ENCRYPTED ACCESS</span>
              </div>
              <span className="tag-mono text-[9px] text-slate-500">REGISTRAR VERIFIED</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Academic Admit Ticket (Inspiration 1) */}
        <div className="lg:col-span-5 hidden lg:block">
          <div className="ticket-pass holo-sheen p-0 bg-slate-950 border-violet-500/30 shadow-2xl relative">
            
            {/* Top Main Section */}
            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/40">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight text-white uppercase">
                      I-SHARK ICT
                    </h3>
                    <p className="tag-mono text-[8px] text-violet-400">ACADEMIC PASS</p>
                  </div>
                </div>
                <span className="tag-mono text-[9px] px-2 py-0.5 rounded-full border border-violet-500/40 text-violet-300 bg-violet-500/10 font-bold">
                  AUTUMN 2026
                </span>
              </div>

              <div className="mt-6 mb-4">
                <div className="tag-mono text-[9px] text-slate-400 uppercase tracking-widest">
                  AUTHORIZATION TICKET
                </div>
                <div className="text-xl font-black text-white uppercase mt-0.5">
                  STUDENT & FACULTY
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Computer Science & Software Engineering
                </div>
              </div>

              {/* Detail Items */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="tag-mono text-[9px] text-slate-500 block">SECTOR</span>
                  <span className="font-mono font-bold text-slate-200">CS-CORE</span>
                </div>
                <div>
                  <span className="tag-mono text-[9px] text-slate-500 block">ENROLLMENT STATUS</span>
                  <span className="font-mono font-bold text-emerald-400 flex items-center">
                    <Check className="w-3 h-3 mr-1" /> ACTIVE
                  </span>
                </div>
                <div>
                  <span className="tag-mono text-[9px] text-slate-500 block">GATE PROTOCOL</span>
                  <span className="font-mono font-bold text-slate-200">BIOMETRIC / TOKEN</span>
                </div>
                <div>
                  <span className="tag-mono text-[9px] text-slate-500 block">SYSTEM STATUS</span>
                  <span className="font-mono font-bold text-violet-400">ONLINE 99.9%</span>
                </div>
              </div>
            </div>

            {/* Perforation Divider Notches + Dashed Line */}
            <div className="ticket-perforation-divider bg-slate-950">
              <div className="ticket-notch-left" />
              <div className="ticket-dashed-line" />
              <div className="ticket-notch-right" />
            </div>

            {/* Bottom Stub Section */}
            <div className="p-6 bg-slate-900/60 flex items-center justify-between">
              <div>
                <div className="ticket-barcode-graphic text-slate-300 w-28" />
                <span className="tag-mono text-[8px] text-slate-500 tracking-widest block mt-1">
                  *ISHARK-GATE-2026*
                </span>
              </div>
              <div className="text-right">
                <span className="tag-mono text-[8px] text-slate-400 uppercase tracking-widest block">
                  ADMIT QUOTA
                </span>
                <span className="text-3xl font-black text-violet-400 font-mono tracking-tight leading-none">
                  100%
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
