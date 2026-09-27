import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AttendanceManager } from './components/Admin/AttendanceManager';
import { StudentManagement } from './components/Admin/StudentManagement';
import { ReportsManager } from './components/Admin/ReportsManager';
import { TaskManager } from './components/Admin/TaskManager';
import { TestsManager } from './components/Admin/TestsManager';
import { StudentDashboard } from './components/Student/StudentDashboard';
import { GraduationCap } from 'lucide-react';

// Cyber Canvas Background with animated blueprint grid and ambient glowing orbs
function CyberCanvasBackground() {
  return (
    <div className="cyber-canvas-background" aria-hidden="true">
      <div className="cyber-grid-overlay" />
      <div className="cyber-glow-blob blob-violet" />
      <div className="cyber-glow-blob blob-rose" />
      <div className="cyber-glow-blob blob-lime" />
    </div>
  );
}

function AppContent() {
  const { currentUser, userProfile, loading, logout } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  // Sync dark mode class with DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Default tab when user changes
  useEffect(() => {
    setCurrentTab('dashboard');
  }, [userProfile?.role]);

  // If currentUser exists but has no userProfile after loading finishes, sign out
  useEffect(() => {
    if (!loading && currentUser && !userProfile) {
      logout();
    }
  }, [loading, currentUser, userProfile, logout]);

  // Loading skeleton screen
  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100 dark:bg-slate-950 transition-colors">
        <CyberCanvasBackground />
        <div className="relative z-10 cyber-panel p-8 rounded-3xl flex flex-col items-center space-y-5 max-w-xs w-full text-center shadow-2xl border border-violet-500/20">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 animate-pulse">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <span className="tag-mono text-violet-400 font-semibold text-[10px]">STUDENT & STAFF PORTAL</span>
            <h2 className="text-lg font-black tracking-tight text-white mt-1">
              I-SHARK ICT
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              LOADING DASHBOARD...
            </p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-rose-400 h-1.5 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // If not signed in, show the Login Page
  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-slate-900 dark:bg-slate-950 transition-colors">
        <CyberCanvasBackground />
        <div className="relative z-10">
          <LoginPage darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        </div>
      </div>
    );
  }

  // If currentUser is signed in but userProfile is missing, do not render panel
  if (!userProfile) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-900 dark:bg-slate-950 transition-colors">
        <CyberCanvasBackground />
        <div className="relative z-10 cyber-panel p-8 rounded-3xl flex flex-col items-center space-y-3 max-w-xs w-full text-center shadow-2xl">
          <p className="text-xs font-mono font-semibold text-slate-400">
            VERIFYING ACCOUNT...
          </p>
        </div>
      </div>
    );
  }

  const role = userProfile.role;

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-900 dark:bg-slate-950 text-slate-100 transition-colors">
      <CyberCanvasBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation: Cyber Sidebar + Sticky Header + Floating Mobile Tab Bar */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Main View Area: padded for desktop sidebar (lg:pl-64) and mobile floating bar (pb-28) */}
        <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12">
            {/* Admin Views */}
            {role === 'admin' && (
              <div>
                {currentTab === 'dashboard' && (
                  <AdminDashboard onNavigate={(tab) => setCurrentTab(tab)} />
                )}
                {currentTab === 'attendance' && <AttendanceManager />}
                {currentTab === 'students' && <StudentManagement />}
                {currentTab === 'reports' && <ReportsManager />}
                {currentTab === 'tasks' && <TaskManager />}
                {currentTab === 'tests' && <TestsManager />}
              </div>
            )}

            {/* Student Views */}
            {role === 'student' && (
              <StudentDashboard currentTab={currentTab} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
