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
      <div className="liquid-mesh-container min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center space-y-4 max-w-xs w-full text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 animate-pulse">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              I-SHARK Institute
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Synchronizing academic portal...
            </p>
          </div>
          <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full w-1/2 animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  // If not signed in, show the Liquid Glass Login Page
  if (!currentUser) {
    return (
      <div className="liquid-mesh-container min-h-screen">
        <LoginPage darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      </div>
    );
  }

  // If currentUser is signed in but userProfile is missing, do not render panel
  if (!userProfile) {
    return (
      <div className="liquid-mesh-container min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center space-y-3 max-w-xs w-full text-center shadow-2xl">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Verifying account credentials...
          </p>
        </div>
      </div>
    );
  }

  const role = userProfile.role;

  return (
    <div className="liquid-mesh-container min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      {/* Liquid Glass Navigation: Desktop Sidebar + Sticky Top Header + Floating Mobile Tab Bar */}
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
