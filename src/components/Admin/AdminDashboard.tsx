import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  FileText,
  CheckSquare,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  CalendarCheck,
  Sparkles,
  ChevronRight,
  BookOpen,
  UserPlus
} from 'lucide-react';
import {
  UserProfile,
  AttendanceRecord,
  TaskItem,
  TestItem
} from '../../types';
import {
  getAllStudents,
  getAttendanceByDate,
  getAllTasks,
  getAllTests
} from '../../services/firestoreService';
import { getLocalDateString, getDaysDiffLocal } from '../../utils/dateUtils';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenAddStudent?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onOpenAddStudent }) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);

  const todayStr = getLocalDateString();

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsData, attendanceData, tasksData, testsData] = await Promise.all([
        getAllStudents(),
        getAttendanceByDate(todayStr),
        getAllTasks(),
        getAllTests()
      ]);
      setStudents(studentsData);
      setTodayAttendance(attendanceData);
      setTasks(tasksData);
      setTests(testsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeStudents = students.filter((s) => s.isActive || s.active);
  const totalActiveCount = activeStudents.length;

  const presentCount = todayAttendance.filter((a) => a.status === 'Present').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'Late').length;
  const absentCount = todayAttendance.filter((a) => a.status === 'Absent').length;
  const leaveCount = todayAttendance.filter((a) => a.status === 'Leave').length;
  const markedCount = todayAttendance.length;

  const attendancePercent =
    markedCount > 0 ? Math.round(((presentCount + lateCount) / markedCount) * 100) : 0;

  // Upcoming tests (today or in future, sorted soonest first)
  const upcomingTests = tests
    .filter((t) => t.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  // Pending tasks (due today or in future)
  const pendingTasks = tasks
    .filter((t) => t.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const getDaysDiff = (dateStr: string) => {
    const diffDays = getDaysDiffLocal(dateStr, todayStr);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    return `In ${diffDays} days`;
  };

  // Skeleton Loader for Liquid Glass Cards
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        {/* Top welcome skeleton */}
        <div className="glass-panel h-28 rounded-[28px] p-6 flex flex-col justify-center space-y-3">
          <div className="h-4 w-40 bg-slate-200/80 dark:bg-slate-800/80 rounded-full" />
          <div className="h-7 w-72 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl" />
        </div>

        {/* Bento Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="glass-panel h-32 rounded-3xl p-5 flex flex-col justify-between">
              <div className="h-4 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded-full" />
              <div className="h-8 w-16 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel h-64 rounded-3xl p-6" />
          <div className="glass-panel h-64 rounded-3xl p-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =========================================================================
          WELCOME & INSTITUTE COMMAND HEADER
         ========================================================================= */}
      <div className="glass-panel rounded-[28px] p-6 sm:p-7 relative overflow-hidden">
        {/* Accent light highlight */}
        <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Academic Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              I-SHARK Institute of Computer Technologies — Real-time attendance logging, active coursework tasks, and upcoming examinations.
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('attendance')}
              id="btn-quick-attendance"
              className="btn-pill px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center space-x-2"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>
            <button
              onClick={() => {
                if (onOpenAddStudent) {
                  onOpenAddStudent();
                } else {
                  onNavigate('students');
                }
              }}
              id="btn-quick-add-student"
              className="btn-pill px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4 text-indigo-500" />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BENTO GRID: ATTENDANCE & INSTITUTION METRICS
         ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Present Card */}
        <div className="glass-panel glass-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Present</span>
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {presentCount}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">on-time</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Logged today</p>
          </div>
        </div>

        {/* Late Card */}
        <div className="glass-panel glass-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Late</span>
            <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {lateCount}
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">delayed</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Recorded with arrival time</p>
          </div>
        </div>

        {/* Absent Card */}
        <div className="glass-panel glass-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Absent</span>
            <div className="p-2 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {absentCount}
              </span>
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">missing</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Unexcused status</p>
          </div>
        </div>

        {/* Leave Card */}
        <div className="glass-panel glass-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leave</span>
            <div className="p-2 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {leaveCount}
              </span>
              <span className="text-xs font-medium text-sky-600 dark:text-sky-400">approved</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Official permit</p>
          </div>
        </div>

        {/* Total Active Students Card */}
        <div
          onClick={() => onNavigate('students')}
          className="col-span-2 md:col-span-1 glass-panel glass-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enrolled Students</span>
            <div className="p-2 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {totalActiveCount}
              </span>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">active</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              <span>View registry</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BENTO SECOND ROW: TURN-OUT RATE PROGRESS & QUICK ACTION DOCK
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Turnout Progress Card */}
        <div className="md:col-span-2 glass-panel p-5 sm:p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Today's Turnout Metric
              </h2>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              {markedCount > 0 ? `${attendancePercent}% Turnout` : 'Pending Logs'}
            </span>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Marked Students: <strong>{markedCount}</strong> of {totalActiveCount}</span>
              <span>Present + Late: <strong>{presentCount + lateCount}</strong></span>
            </div>
            <div className="w-full bg-slate-200/70 dark:bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-indigo-600 to-sky-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(attendancePercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 mt-4">
            <span>Minimum academic benchmark: 75%</span>
            <button
              onClick={() => onNavigate('reports')}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Detailed Attendance Report</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick Launch Dock */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              One-tap academic shortcuts
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate('attendance')}
              className="btn-pill p-2.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 shadow-xs"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
              <span>Attendance</span>
            </button>
            <button
              onClick={() => onNavigate('students')}
              className="btn-pill p-2.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 shadow-xs"
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Students</span>
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="btn-pill p-2.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 shadow-xs"
            >
              <CheckSquare className="w-4 h-4 text-sky-500" />
              <span>Assign Task</span>
            </button>
            <button
              onClick={() => onNavigate('tests')}
              className="btn-pill p-2.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 shadow-xs"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Add Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BENTO THIRD ROW: UPCOMING TESTS & PENDING TASKS
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tests */}
        <div className="glass-panel p-5 sm:p-6 rounded-[28px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upcoming Tests & Quizzes
              </h2>
            </div>
            <button
              onClick={() => onNavigate('tests')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-semibold"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingTests.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800/80">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                No tests scheduled for upcoming dates.
              </p>
              <button
                onClick={() => onNavigate('tests')}
                className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Schedule a new test</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTests.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl glass-panel-subtle hover:bg-white/80 dark:hover:bg-slate-800/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          {t.type}
                        </span>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {t.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Subject: <span className="font-semibold text-slate-700 dark:text-slate-300">{t.subject}</span> • {t.time}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {getDaysDiff(t.date)}
                    </span>
                  </div>
                  {t.syllabus && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-1 italic">
                      Syllabus: {t.syllabus}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="glass-panel p-5 sm:p-6 rounded-[28px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Active Student Assignments
              </h2>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-semibold"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800/80">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                No active assignments pending. All student tasks completed!
              </p>
              <button
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create assignment</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl glass-panel-subtle hover:bg-white/80 dark:hover:bg-slate-800/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {t.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      Due: {t.dueDate}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 font-medium">
                      {t.assignedTo === 'all' ? 'All Students' : `${t.assignedStudentIds?.length || 0} Students`}
                    </span>
                    <span>•</span>
                    <span>{getDaysDiff(t.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
