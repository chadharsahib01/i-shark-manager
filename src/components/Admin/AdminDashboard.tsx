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
  UserPlus,
  Search,
  X
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
import { StudentReportModal } from '../StudentReportModal';

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
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string | null>(null);

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

  // Upcoming tests
  const upcomingTests = tests
    .filter((t) => t.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  // Pending tasks
  const pendingTasks = tasks
    .filter((t) => t.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const getDaysDiff = (dateStr: string) => {
    const diffDays = getDaysDiffLocal(dateStr, todayStr);
    if (diffDays === 0) return 'TODAY';
    if (diffDays === 1) return 'TOMORROW';
    if (diffDays < 0) return `${Math.abs(diffDays)}D OVERDUE`;
    return `IN ${diffDays} DAYS`;
  };

  // Skeleton Loader
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="ticket-pass h-28 rounded-3xl p-6 bg-slate-900/80 border-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="ticket-pass h-32 rounded-2xl bg-slate-900/80 border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ticket-pass h-64 rounded-3xl bg-slate-900/80 border-slate-800" />
          <div className="ticket-pass h-64 rounded-3xl bg-slate-900/80 border-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =========================================================================
          WELCOME & INSTITUTE HEADER
         ========================================================================= */}
      <div className="ticket-pass p-6 sm:p-7 relative overflow-hidden bg-slate-900/90 border-violet-500/20">
        <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="tag-mono px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center space-x-1 font-bold">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>ADMIN DASHBOARD // 2026</span>
              </span>
              <span className="tag-mono text-[9px] text-slate-500">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              Institute Management Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              I-SHARK Institute of Computer Technologies — Overview of daily attendance, assignments, and test schedules.
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('attendance')}
              id="btn-quick-attendance"
              className="glow-orb-btn px-4 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 flex items-center space-x-2 shadow-lg shadow-violet-900/40 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span className="uppercase">Mark Attendance</span>
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
              className="px-4 py-2.5 text-xs tag-mono font-bold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl shadow-xs flex items-center space-x-2 btn-tactile cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-violet-400" />
              <span>ADD STUDENT</span>
            </button>
            <button
              onClick={() => setShowLookupModal(true)}
              id="btn-quick-lookup-report"
              className="px-4 py-2.5 text-xs tag-mono font-bold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-xl shadow-xs flex items-center space-x-2 btn-tactile cursor-pointer"
            >
              <FileText className="w-4 h-4 text-violet-400" />
              <span>STUDENT REPORT</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BENTO GRID: ATTENDANCE & INSTITUTE METRICS
         ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Present Card */}
        <div className="ticket-pass p-4 sm:p-5 bg-slate-900/90 border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="tag-mono text-slate-400">PRESENT TODAY</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                {presentCount}
              </span>
              <span className="tag-mono text-[10px] text-emerald-400 font-bold">ON TIME</span>
            </div>
            <p className="tag-mono text-[9px] text-slate-500 mt-1">RECORDED</p>
          </div>
        </div>

        {/* Late Card */}
        <div className="ticket-pass p-4 sm:p-5 bg-slate-900/90 border-amber-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="tag-mono text-slate-400">LATE TODAY</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                {lateCount}
              </span>
              <span className="tag-mono text-[10px] text-amber-400 font-bold">DELAYED</span>
            </div>
            <p className="tag-mono text-[9px] text-slate-500 mt-1">RECORDED</p>
          </div>
        </div>

        {/* Absent Card */}
        <div className="ticket-pass p-4 sm:p-5 bg-slate-900/90 border-rose-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="tag-mono text-slate-400">ABSENT TODAY</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                {absentCount}
              </span>
              <span className="tag-mono text-[10px] text-rose-400 font-bold">UNEXCUSED</span>
            </div>
            <p className="tag-mono text-[9px] text-slate-500 mt-1">RECORDED</p>
          </div>
        </div>

        {/* Leave Card */}
        <div className="ticket-pass p-4 sm:p-5 bg-slate-900/90 border-sky-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="tag-mono text-slate-400">ON LEAVE</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                {leaveCount}
              </span>
              <span className="tag-mono text-[10px] text-sky-400 font-bold">APPROVED</span>
            </div>
            <p className="tag-mono text-[9px] text-slate-500 mt-1">LEAVE RECORDED</p>
          </div>
        </div>

        {/* Total Active Students Card */}
        <div
          onClick={() => onNavigate('students')}
          className="col-span-2 md:col-span-1 ticket-pass p-4 sm:p-5 bg-slate-900/90 border-violet-500/20 flex flex-col justify-between cursor-pointer group hover:border-violet-500/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="tag-mono text-slate-400">TOTAL STUDENTS</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                {totalActiveCount}
              </span>
              <span className="tag-mono text-[10px] text-violet-400 font-bold">ACTIVE</span>
            </div>
            <div className="flex items-center space-x-1 tag-mono text-[10px] text-violet-400 font-bold mt-1">
              <span>VIEW DIRECTORY</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BENTO SECOND ROW: ATTENDANCE PROGRESS & QUICK SHORTCUTS
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Attendance Progress Card */}
        <div className="md:col-span-2 ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Today's Attendance Rate
              </h2>
            </div>
            <span className="tag-mono px-3 py-1 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/30 font-bold">
              {markedCount > 0 ? `${attendancePercent}% ATTENDANCE` : 'NOT MARKED YET'}
            </span>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between tag-mono text-[11px] text-slate-400">
              <span>MARKED: <strong className="text-slate-200">{markedCount}</strong> OF {totalActiveCount}</span>
              <span>PRESENT + LATE: <strong className="text-emerald-400">{presentCount + lateCount}</strong></span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800">
              <div
                className="bg-gradient-to-r from-violet-600 via-indigo-500 to-rose-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(attendancePercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between tag-mono text-[10px] text-slate-500 pt-3 border-t border-slate-800/80 mt-4">
            <span>TARGET: 75% MINIMUM</span>
            <button
              onClick={() => onNavigate('reports')}
              className="text-violet-400 hover:text-violet-300 flex items-center space-x-1 font-bold underline underline-offset-4"
            >
              <span>VIEW FULL REPORTS</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick Launch Dock */}
        <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Quick Navigation
            </h2>
            <p className="tag-mono text-[10px] text-slate-400 mb-3">
              JUMP TO SECTION
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate('attendance')}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold flex flex-col items-center justify-center space-y-1.5 transition-all btn-tactile"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              <span>ATTENDANCE</span>
            </button>
            <button
              onClick={() => onNavigate('students')}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold flex flex-col items-center justify-center space-y-1.5 transition-all btn-tactile"
            >
              <Users className="w-4 h-4 text-violet-400" />
              <span>STUDENTS</span>
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold flex flex-col items-center justify-center space-y-1.5 transition-all btn-tactile"
            >
              <CheckSquare className="w-4 h-4 text-sky-400" />
              <span>TASKS</span>
            </button>
            <button
              onClick={() => onNavigate('tests')}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold flex flex-col items-center justify-center space-y-1.5 transition-all btn-tactile"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>TESTS</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BENTO THIRD ROW: UPCOMING TESTS & PENDING TASKS
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tests */}
        <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Upcoming Tests & Exams
              </h2>
            </div>
            <button
              onClick={() => onNavigate('tests')}
              className="tag-mono text-[10px] text-violet-400 hover:underline flex items-center space-x-1 font-bold"
            >
              <span>VIEW ALL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingTests.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/50">
              <p className="tag-mono text-xs text-slate-500 mb-2">
                No tests or exams currently scheduled.
              </p>
              <button
                onClick={() => onNavigate('tests')}
                className="inline-flex items-center space-x-1.5 tag-mono text-xs text-violet-400 font-bold hover:underline"
              >
                <PlusCircle className="w-4 h-4" />
                <span>SCHEDULE TEST</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTests.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="tag-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                          {t.type}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                          {t.title}
                        </h3>
                      </div>
                      <p className="tag-mono text-[10px] text-slate-400 mt-1">
                        SUBJECT: <span className="font-bold text-slate-200">{t.subject}</span> • {t.time}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-md tag-mono text-[10px] font-bold bg-slate-800 text-violet-300 border border-violet-500/30">
                      {getDaysDiff(t.date)}
                    </span>
                  </div>
                  {t.syllabus && (
                    <p className="tag-mono text-[9px] text-slate-500 mt-2 line-clamp-1 italic">
                      SYLLABUS: {t.syllabus}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Active Assignments
              </h2>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="tag-mono text-[10px] text-violet-400 hover:underline flex items-center space-x-1 font-bold"
            >
              <span>VIEW ALL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/50">
              <p className="tag-mono text-xs text-slate-500 mb-2">
                No assignments pending.
              </p>
              <button
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center space-x-1.5 tag-mono text-xs text-violet-400 font-bold hover:underline"
              >
                <PlusCircle className="w-4 h-4" />
                <span>CREATE ASSIGNMENT</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                        {t.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-md tag-mono text-[10px] font-bold bg-slate-800 text-violet-300 border border-violet-500/30">
                      DUE: {t.dueDate}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 tag-mono text-[10px] text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {t.assignedTo === 'all' ? 'ALL STUDENTS' : `${t.assignedStudentIds?.length || 0} ASSIGNED`}
                    </span>
                    <span>•</span>
                    <span className="text-violet-400">{getDaysDiff(t.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Student Report Search Lookup Modal */}
      {showLookupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl ticket-pass bg-slate-950 border-violet-500/40 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowLookupModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tag-mono">
                  Search Student Report
                </h3>
                <p className="tag-mono text-[10px] text-slate-400">
                  Search for a student to view their attendance record and academic report.
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Search by student name, roll number, or batch..."
                className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-violet-500 outline-hidden"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[360px]">
              {students
                .filter((s) => {
                  const q = lookupQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    s.fullName.toLowerCase().includes(q) ||
                    (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
                    (s.batch && s.batch.toLowerCase().includes(q)) ||
                    s.email.toLowerCase().includes(q)
                  );
                })
                .map((st) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      setShowLookupModal(false);
                      setSelectedReportStudentId(st.id);
                    }}
                    className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/40 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase group-hover:text-violet-300 transition">
                        {st.fullName}
                      </h4>
                      <div className="tag-mono text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span>{st.rollNumber || 'NO ROLL'}</span>
                        <span>•</span>
                        <span className="text-violet-400">{st.batch || 'ICT-CORE'}</span>
                        <span>•</span>
                        <span className="text-slate-500">{st.email}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg tag-mono text-[10px] font-bold bg-violet-600/20 text-violet-300 group-hover:bg-violet-600 group-hover:text-white transition flex items-center space-x-1"
                    >
                      <span>VIEW REPORT</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Student Report Modal */}
      {selectedReportStudentId && (
        <StudentReportModal
          studentId={selectedReportStudentId}
          onClose={() => setSelectedReportStudentId(null)}
        />
      )}
    </div>
  );
};
