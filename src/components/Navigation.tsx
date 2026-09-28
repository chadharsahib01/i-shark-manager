import React, { useState, useRef } from 'react';
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
  Menu,
  X,
  PanelLeftClose,
  Pin,
  PinOff,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  sidebarPinned?: boolean;
  onTogglePinSidebar?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  darkMode,
  onToggleDarkMode,
  sidebarPinned = false,
  onTogglePinSidebar
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const role: UserRole = (userProfile?.role as UserRole) || 'student';

  const [isHovered, setIsHovered] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 280);
  };

  const handleToggleManualOpen = () => {
    setIsManualOpen((prev) => !prev);
  };

  const handleSelectTabWithClose = (tab: string) => {
    onSelectTab(tab);
    if (!sidebarPinned) {
      setIsManualOpen(false);
      setIsHovered(false);
    }
  };

  const isVisible = Boolean(sidebarPinned || isManualOpen || isHovered);

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
          LEFT EDGE HOVER DETECTOR & PEEK STRIP (Hover cursor to reveal sidebar)
         ========================================================================= */}
      {!sidebarPinned && (
        <div
          onMouseEnter={handleMouseEnter}
          className="hidden lg:flex fixed top-0 bottom-0 left-0 w-3 hover:w-6 z-30 group cursor-pointer items-center transition-all duration-300 pointer-events-auto"
          title="Move cursor here to reveal sidebar menu"
          aria-label="Hover to reveal sidebar menu"
        >
          {/* Subtle glowing indicator tab in the center of the left edge */}
          <div className="w-1.5 h-16 rounded-r-full bg-violet-500/30 group-hover:w-2 group-hover:h-24 group-hover:bg-gradient-to-b group-hover:from-violet-400 group-hover:to-rose-400 shadow-lg shadow-violet-500/50 transition-all duration-300 flex items-center justify-center">
            <ChevronRight className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
          </div>
        </div>
      )}

      {/* Dimmed backdrop when opened on mobile or manually toggled without pin */}
      {isVisible && !sidebarPinned && isManualOpen && (
        <div
          onClick={() => {
            setIsManualOpen(false);
            setIsHovered(false);
          }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-35 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* =========================================================================
          DESKTOP & DRAWER LIQUID GLASS BLADE (Apple visionOS Sidebar with Hover & Toggle)
         ========================================================================= */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 bottom-0 left-0 w-72 z-40 p-3 sm:p-4 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible
            ? 'translate-x-0 opacity-100 pointer-events-auto shadow-2xl'
            : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="liquid-glass-blade h-full w-full p-5 flex flex-col justify-between pointer-events-auto overflow-hidden relative shadow-2xl">
          {/* Top Specular Rim Reflection */}
          <div className="absolute top-0 left-8 right-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

          {/* Institute Brand Header with Close & Pin Controls */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div
                className="flex items-center space-x-3 cursor-pointer group min-w-0"
                onClick={() => handleSelectTabWithClose('dashboard')}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-violet-600/40 group-hover:scale-105 transition-transform duration-300 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h1 className="font-black text-sm tracking-tight text-white dark:text-white uppercase truncate">
                      I-SHARK ICT
                    </h1>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping shrink-0" />
                  </div>
                  <p className="tag-mono text-[9px] text-slate-400 truncate">
                    ACADEMIC PORTAL
                  </p>
                </div>
              </div>

              {/* Sidebar Action Buttons: Pin & Close */}
              <div className="flex items-center space-x-1 shrink-0 ml-2">
                {onTogglePinSidebar && (
                  <button
                    type="button"
                    onClick={onTogglePinSidebar}
                    title={sidebarPinned ? "Unpin sidebar (auto-hide mode)" : "Pin sidebar (keep always visible)"}
                    className={`p-1.5 rounded-xl border transition-all btn-tactile cursor-pointer hidden lg:flex items-center justify-center ${
                      sidebarPinned
                        ? 'bg-violet-600/30 text-violet-300 border-violet-500/40 shadow-xs'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white border-white/10'
                    }`}
                  >
                    {sidebarPinned ? (
                      <Pin className="w-3.5 h-3.5 text-violet-300" />
                    ) : (
                      <PinOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {!sidebarPinned && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualOpen(false);
                      setIsHovered(false);
                    }}
                    title="Close Sidebar"
                    className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-slate-400 hover:text-white border border-white/10 transition-all btn-tactile cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Role Badge Indicator */}
            <div className="mb-5 p-2.5 rounded-2xl bg-white/[0.04] dark:bg-black/40 border border-white/10 flex items-center justify-between shadow-inner backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded-lg bg-violet-500/20 text-violet-300">
                  {role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs font-bold text-slate-200 tracking-tight">
                  {role === 'admin' ? 'Administration' : 'Student Portal'}
                </span>
              </div>
              <span className="tag-mono text-[9px] px-2 py-0.5 rounded-full font-bold bg-violet-500/20 text-violet-300 border border-violet-400/30">
                {role === 'admin' ? 'ADMIN' : 'STUDENT'}
              </span>
            </div>

            {/* Navigation List with Liquid Droplet Active Highlight */}
            <nav className="space-y-1.5" aria-label="Desktop Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleSelectTabWithClose(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-violet-600/90 text-white shadow-lg shadow-violet-600/40 translate-x-1 border border-violet-400/40 backdrop-blur-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white scale-110' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Refractive Bottom Area */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                id="btn-sidebar-theme-toggle"
                aria-label="Toggle dark mode"
                className="p-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/10 transition-all btn-tactile cursor-pointer"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-violet-400" />}
              </button>

              {/* Status Pill */}
              <div className="tag-mono text-[9px] text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 font-bold">
                ACTIVE
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                id="btn-sidebar-logout"
                aria-label="Sign Out"
                className="p-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all btn-tactile cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* User Info Capsule */}
            <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center space-x-3 shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-rose-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
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
          TOP HEADER (Apple Liquid Glass Floating Capsule with Hamburger Menu)
         ========================================================================= */}
      <header className="sticky top-0 z-20 w-full px-4 sm:px-6 lg:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-2.5 sm:px-5 rounded-2xl liquid-glass-capsule">
          {/* Left section: Hamburger Menu Button + Logo/Breadcrumb */}
          <div className="flex items-center space-x-3">
            {/* Hamburger / Sidebar Toggle Button (Hover or Click) */}
            <button
              type="button"
              id="btn-sidebar-hamburger"
              onClick={handleToggleManualOpen}
              onMouseEnter={handleMouseEnter}
              aria-label="Toggle Navigation Sidebar"
              title={isVisible ? "Hide Navigation Sidebar" : "Open Navigation Sidebar (or hover left screen edge)"}
              className={`p-2 rounded-xl border transition-all btn-tactile cursor-pointer flex items-center justify-center shrink-0 ${
                isVisible
                  ? 'bg-violet-600/30 text-violet-200 border-violet-500/40 shadow-md shadow-violet-950/50'
                  : 'bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 border-white/10'
              }`}
            >
              {isVisible && !sidebarPinned ? (
                <PanelLeftClose className="w-4 h-4 text-violet-300" />
              ) : (
                <Menu className="w-4 h-4 text-violet-300" />
              )}
            </button>

            {/* Mobile Logo & Title */}
            <div className="flex items-center space-x-2.5 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-black text-sm text-white tracking-tight uppercase truncate">
                  I-SHARK ICT
                </h1>
                <p className="tag-mono text-[9px] text-violet-400 font-bold truncate">
                  {currentTabObj.label}
                </p>
              </div>
            </div>

            {/* Desktop Breadcrumb/Page Title */}
            <div className="hidden lg:flex items-center space-x-3">
              <span className="text-lg font-black text-white tracking-tight">
                {currentTabObj.label}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-xl font-mono text-slate-400 bg-white/[0.05] border border-white/10 backdrop-blur-md">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center space-x-2">
            <span
              className={`hidden sm:inline-flex items-center px-3 py-1 rounded-xl tag-mono font-bold ${
                role === 'admin'
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
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
              className="lg:hidden p-2 rounded-xl bg-white/[0.08] text-slate-200 border border-white/10"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-violet-400" />}
            </button>

            {/* Mobile quick sign out */}
            <button
              type="button"
              onClick={logout}
              aria-label="Sign Out"
              title="Sign Out"
              className="lg:hidden p-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          FLOATING BOTTOM VISIONOS DOCK (Mobile & Tablet: < lg)
         ========================================================================= */}
      <nav
        className="lg:hidden fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-8 z-40 max-w-md mx-auto"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="liquid-glass-capsule p-1.5 rounded-full flex items-center justify-around shadow-2xl backdrop-blur-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-full transition-all duration-300 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-violet-600/90 shadow-lg shadow-violet-600/50 border border-violet-400/40 -z-10" />
                )}
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 text-white' : ''}`} />
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
