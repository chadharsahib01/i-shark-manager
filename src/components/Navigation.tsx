import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  CalendarCheck,
  Users,
  CheckSquare,
  FileText,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  Shield,
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  darkMode,
  onToggleDarkMode
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const role: UserRole = (userProfile?.role as UserRole) || 'student';

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'tests', label: 'Tests', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'tests', label: 'Tests', icon: FileText }
  ];

  const navItems = role === 'admin' ? adminNavItems : studentNavItems;
  const currentTabObj = navItems.find((n) => n.id === currentTab) || navItems[0];

  return (
    <>
      {/* =========================================================================
          DESKTOP SIDEBAR
         ========================================================================= */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 z-30 p-4 flex-col pointer-events-none">
        <div className="ticket-pass h-full w-full p-5 flex flex-col justify-between pointer-events-auto overflow-hidden relative">
          {/* Subtle top laser border accent */}
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          {/* Institute Brand Header */}
          <div>
            <div
              className="flex items-center space-x-3 cursor-pointer group mb-6"
              onClick={() => onSelectTab('dashboard')}
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform duration-200">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h1 className="font-black text-sm tracking-tight text-white dark:text-white uppercase">
                    I-SHARK ICT
                  </h1>
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                </div>
                <p className="tag-mono text-[9px] text-slate-400 truncate">
                  ACADEMIC MANAGEMENT
                </p>
              </div>
            </div>

            {/* Role Badge Header */}
            <div className="mb-6 p-2.5 rounded-xl bg-slate-900/90 dark:bg-black/50 border border-violet-500/20 flex items-center justify-between shadow-inner">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded-md bg-violet-500/10 text-violet-400">
                  {role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs font-bold text-slate-200 tracking-tight">
                  {role === 'admin' ? 'Administration' : 'Student Portal'}
                </span>
              </div>
              <span className="tag-mono text-[9px] px-2 py-0.5 rounded-md font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {role === 'admin' ? 'ADMIN' : 'STUDENT'}
              </span>
            </div>

            {/* Navigation List */}
            <nav className="space-y-1.5" aria-label="Desktop Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 translate-x-1'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Ticket Perforation Bottom Area */}
          <div className="pt-3 border-t border-dashed border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                id="btn-sidebar-theme-toggle"
                aria-label="Toggle dark mode"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all btn-tactile"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-violet-400" />}
              </button>

              {/* Status Pill */}
              <div className="tag-mono text-[9px] text-emerald-400 px-2 py-1 rounded bg-slate-900 border border-slate-800">
                ACTIVE
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                id="btn-sidebar-logout"
                aria-label="Sign Out"
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all btn-tactile"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* User Info Capsule */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-rose-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                {(userProfile?.fullName || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate leading-snug">
                  {userProfile?.fullName || 'User'}
                </p>
                <p className="tag-mono text-[9px] text-slate-400 truncate">
                  {userProfile?.rollNumber || currentUser?.email || 'ID: UNKNOWN'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          TOP HEADER
         ========================================================================= */}
      <header className="sticky top-0 z-20 w-full px-4 sm:px-6 lg:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Mobile Logo & Title */}
          <div className="flex items-center space-x-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-sm text-white tracking-tight uppercase">
                I-SHARK ICT
              </h1>
              <p className="tag-mono text-[9px] text-violet-400 font-bold">
                {currentTabObj.label}
              </p>
            </div>
          </div>

          {/* Desktop Breadcrumb/Page Title */}
          <div className="hidden lg:flex items-center space-x-3">
            <span className="text-xl font-black text-white tracking-tight">
              {currentTabObj.label}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg font-mono text-slate-400 bg-slate-900/60 border border-slate-800">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Top Actions */}
          <div className="flex items-center space-x-2">
            <span
              className={`hidden sm:inline-flex items-center px-3 py-1 rounded-lg tag-mono font-bold ${
                role === 'admin'
                  ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              }`}
            >
              {role === 'admin' ? <Shield className="w-3.5 h-3.5 mr-1 text-violet-400" /> : <User className="w-3.5 h-3.5 mr-1 text-emerald-400" />}
              {role === 'admin' ? 'ADMIN' : 'STUDENT'}
            </span>

            {/* Mobile dark mode button */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label="Toggle dark mode"
              className="lg:hidden p-2 rounded-xl bg-slate-800/80 text-slate-200 border border-slate-700"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-violet-400" />}
            </button>

            {/* Mobile quick sign out */}
            <button
              type="button"
              onClick={logout}
              aria-label="Sign Out"
              title="Sign Out"
              className="lg:hidden p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          FLOATING BOTTOM TICKET BAR (Mobile & Tablet: < lg)
         ========================================================================= */}
      <nav
        className="lg:hidden fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-8 z-40 max-w-md mx-auto"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="ticket-pass p-1.5 rounded-2xl flex items-center justify-around shadow-2xl bg-slate-900/95 border-violet-500/30 backdrop-blur-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-violet-600 shadow-md shadow-violet-600/40 -z-10" />
                )}
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110 text-white' : ''}`} />
                <span className="text-[9px] mt-1 font-mono tracking-tight truncate max-w-[58px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
