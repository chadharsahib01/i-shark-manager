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
  User
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

  const currentTabLabel = navItems.find((n) => n.id === currentTab)?.label || 'Dashboard';

  return (
    <>
      {/* =========================================================================
          DESKTOP GLASS SIDEBAR (hidden on mobile/tablet, visible on lg+)
         ========================================================================= */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 z-30 p-4 flex-col pointer-events-none">
        <div className="glass-panel h-full w-full rounded-[28px] p-5 flex flex-col justify-between pointer-events-auto overflow-hidden relative">
          {/* Subtle top inner light bar */}
          <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/40 dark:via-indigo-400/40 to-transparent" />

          {/* Institute Brand Header */}
          <div>
            <div
              className="flex items-center space-x-3 cursor-pointer group mb-6"
              onClick={() => onSelectTab('dashboard')}
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                  I-SHARK Manager
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight font-medium">
                  Institute of Computer Tech
                </p>
              </div>
            </div>

            {/* Role Badge */}
            <div className="mb-6 px-3 py-2 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    role === 'admin' ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {role === 'admin' ? 'Administrator' : 'Student Portal'}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/60">
                {role === 'admin' ? 'Admin' : 'Student'}
              </span>
            </div>

            {/* Navigation List */}
            <nav className="space-y-1.5" aria-label="Desktop Sidebar Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold translate-x-1'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Global Utilities Bottom Area */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
            <div className="flex items-center justify-between">
              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                id="btn-sidebar-theme-toggle"
                aria-label="Toggle dark mode"
                className="p-2.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all shadow-xs"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                id="btn-sidebar-logout"
                aria-label="Sign Out"
                className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all shadow-xs"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* User Info Capsule */}
            <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {(userProfile?.fullName || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-snug">
                  {userProfile?.fullName || 'Institute User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {userProfile?.rollNumber || currentUser?.email || ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          STICKY TOP GLASS HEADER (All viewports)
         ========================================================================= */}
      <header className="sticky top-0 z-20 w-full px-4 sm:px-6 lg:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Mobile Logo & Title */}
          <div className="flex items-center space-x-3 lg:hidden">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                I-SHARK
              </h1>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                {currentTabLabel}
              </p>
            </div>
          </div>

          {/* Desktop Breadcrumb/Page Title */}
          <div className="hidden lg:flex items-center space-x-3">
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {currentTabLabel}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Top Actions */}
          <div className="flex items-center space-x-2">
            <span
              className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                role === 'admin'
                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
              }`}
            >
              {role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
              {role === 'admin' ? 'Chief Admin' : 'Enrolled Student'}
            </span>

            {/* Mobile dark mode button */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label="Toggle dark mode"
              className="lg:hidden p-2 rounded-2xl glass-panel text-slate-700 dark:text-slate-300"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Mobile quick sign out */}
            <button
              type="button"
              onClick={logout}
              aria-label="Sign Out"
              title="Sign Out"
              className="lg:hidden p-2 rounded-2xl glass-panel text-rose-600 dark:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          FLOATING iOS-STYLE BOTTOM TAB BAR (Mobile & Tablet: < lg)
         ========================================================================= */}
      <nav
        className="lg:hidden fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-8 z-40 max-w-md mx-auto"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="glass-panel p-1.5 rounded-3xl flex items-center justify-around shadow-2xl backdrop-blur-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-indigo-500/15 dark:bg-indigo-400/20 -z-10 animate-fade-in" />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate max-w-[54px]">
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
