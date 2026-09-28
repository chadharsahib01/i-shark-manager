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

/* =========================================================================
   SVG OPTICAL REFRACTION FILTERS (Apple Liquid Glass Real Refraction)
   ========================================================================= */
function LiquidGlassSvgFilters() {
  return (
    <svg className="sr-only pointer-events-none absolute w-0 h-0" aria-hidden="true">
      <defs>
        {/* Real optical displacement & edge refraction */}
        <filter
          id="liquid-refraction"
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.02"
            numOctaves="2"
            seed="42"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="0.4" result="blurred" />
          <feMerge>
            <feMergeNode in="blurred" />
          </feMerge>
        </filter>

        {/* Chromatic edge dispersion for rim light */}
        <filter id="liquid-chromatic" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="turbulence" baseFrequency="0.015 0.015" numOctaves="1" result="turb" />
          <feDisplacementMap in="SourceGraphic" in2="turb" scale="6" xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </defs>
    </svg>
  );
}

/* =========================================================================
   APPLE LIQUID GLASS CHROMATIC BACKDROP
   ========================================================================= */
function LiquidGlassBackdrop() {
  return (
    <div className="liquid-glass-backdrop" aria-hidden="true">
      {/* Real Optical Caustic Ambient Canvas */}
      <div className="liquid-ambient-canvas" />

      {/* Adaptive Color Sampling Floating Chromatic Orbs */}
      <div className="liquid-chromatic-orb orb-violet" />
      <div className="liquid-chromatic-orb orb-cyan" />
      <div className="liquid-chromatic-orb orb-rose" />
      <div className="liquid-chromatic-orb orb-emerald" />

      {/* SVG Optical Refraction Filters in the DOM */}
      <LiquidGlassSvgFilters />
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

  // Dynamic Specular Highlight Tracking: Updates --highlight-x, --highlight-y, --tilt-x, --tilt-y on mousemove & device tilt
  useEffect(() => {
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const xPct = Math.round((e.clientX / window.innerWidth) * 100);
        const yPct = Math.round((e.clientY / window.innerHeight) * 100);
        
        // Tilt angles (-8deg to +8deg)
        const tiltX = (((e.clientY / window.innerHeight) - 0.5) * -12).toFixed(1);
        const tiltY = (((e.clientX / window.innerWidth) - 0.5) * 12).toFixed(1);

        document.documentElement.style.setProperty('--highlight-x', `${xPct}%`);
        document.documentElement.style.setProperty('--highlight-y', `${yPct}%`);
        document.documentElement.style.setProperty('--tilt-x', `${tiltX}deg`);
        document.documentElement.style.setProperty('--tilt-y', `${tiltY}deg`);
        document.documentElement.style.setProperty('--mouse-px', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-py', `${e.clientY}px`);
      });
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          // Normalize gamma (-45 to 45) and beta (-45 to 45) to percentages
          const xPct = Math.min(Math.max(Math.round(((e.gamma! + 45) / 90) * 100), 10), 90);
          const yPct = Math.min(Math.max(Math.round(((e.beta! + 45) / 90) * 100), 10), 90);
          document.documentElement.style.setProperty('--highlight-x', `${xPct}%`);
          document.documentElement.style.setProperty('--highlight-y', `${yPct}%`);
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      cancelAnimationFrame(rafId);
    };
  }, []);

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

  // Loading skeleton screen with Liquid Glass Squircle
  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 transition-colors">
        <LiquidGlassBackdrop />
        <div className="relative z-10 liquid-glass-card p-8 rounded-3xl flex flex-col items-center space-y-5 max-w-xs w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-violet-600/40 animate-pulse">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <span className="tag-mono text-violet-400 font-semibold text-[10px]">STUDENT & STAFF PORTAL</span>
            <h2 className="text-lg font-black tracking-tight text-white mt-1">
              I-SHARK ICT
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              LOADING LIQUID GLASS OS...
            </p>
          </div>
          <div className="w-full bg-slate-900/80 rounded-full h-1.5 overflow-hidden p-0.5 border border-white/10">
            <div className="bg-gradient-to-r from-violet-500 via-indigo-400 to-rose-400 h-1 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // If not signed in, show the Login Page
  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-slate-950 transition-colors">
        <LiquidGlassBackdrop />
        <div className="relative z-10">
          <LoginPage darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        </div>
      </div>
    );
  }

  // If currentUser is signed in but userProfile is missing, do not render panel
  if (!userProfile) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 transition-colors">
        <LiquidGlassBackdrop />
        <div className="relative z-10 liquid-glass-card p-8 rounded-3xl flex flex-col items-center space-y-3 max-w-xs w-full text-center shadow-2xl">
          <p className="text-xs font-mono font-semibold text-slate-400">
            VERIFYING ACCOUNT...
          </p>
        </div>
      </div>
    );
  }

  const role = userProfile.role;

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100 transition-colors">
      <LiquidGlassBackdrop />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation: Apple Liquid Glass Sidebar + Floating Header + VisionOS Tab Bar */}
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
