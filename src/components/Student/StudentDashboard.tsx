import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarCheck,
  CheckSquare,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  Hash,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  AttendanceRecord,
  TaskItem,
  TestItem,
  AttendanceSummary
} from '../../types';
import {
  getStudentAttendance,
  getTasksForStudent,
  getTestsForStudent,
  calculateAttendanceSummary
} from '../../services/firestoreService';
import { getLocalDateString, getDaysDiffLocal } from '../../utils/dateUtils';

interface StudentDashboardProps {
  currentTab?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentTab = 'dashboard' }) => {
  const { currentUser, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);

  // Independent error states for each data source
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [testsError, setTestsError] = useState<string | null>(null);

  // Month filter for attendance history
  const todayStr = getLocalDateString();
  const currentMonthStr = todayStr.substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [viewAllMonths, setViewAllMonths] = useState<boolean>(false);

  const studentId = currentUser?.uid || '';

  const loadStudentData = async () => {
    if (!studentId) return;
    setLoading(true);

    const [attResult, tasksResult, testsResult] = await Promise.allSettled([
      getStudentAttendance(studentId),
      getTasksForStudent(studentId),
      getTestsForStudent(studentId)
    ]);

    if (attResult.status === 'fulfilled' && attResult.value) {
      setAttendance(attResult.value);
      setAttendanceError(null);
    } else {
      setAttendanceError('Could not load attendance records.');
    }

    if (tasksResult.status === 'fulfilled' && tasksResult.value) {
      setTasks(tasksResult.value);
      setTasksError(null);
    } else {
      setTasksError('Could not load assigned tasks.');
    }

    if (testsResult.status === 'fulfilled' && testsResult.value) {
      setTests(testsResult.value);
      setTestsError(null);
    } else {
      setTestsError('Could not load scheduled tests.');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  // Overall attendance metrics across entire recorded term
  const overallSummary: AttendanceSummary = useMemo(() => {
    return calculateAttendanceSummary(attendance);
  }, [attendance]);

  // Monthly filtered attendance records
  const filteredAttendance = useMemo(() => {
    if (viewAllMonths) return attendance;
    return attendance.filter((r) => r.date.startsWith(selectedMonth));
  }, [attendance, selectedMonth, viewAllMonths]);

  // Pending tasks sorted by due date
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [tasks]);

  // Upcoming tests sorted by date
  const upcomingTests = useMemo(() => {
    return [...tests]
      .filter((t) => t.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [tests, todayStr]);

  // Liquid Glass Skeleton Loader
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="glass-panel h-36 rounded-[28px] p-6 flex flex-col justify-center space-y-3">
          <div className="h-4 w-40 bg-slate-200/80 dark:bg-slate-800/80 rounded-full" />
          <div className="h-8 w-64 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel h-44 rounded-3xl" />
          <div className="glass-panel h-44 rounded-3xl" />
          <div className="glass-panel h-44 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel h-64 rounded-3xl" />
          <div className="glass-panel h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  // SVG Ring Progress Calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const isPercentNumeric = typeof overallSummary.percentage === 'number';
  const strokeDashoffset = isPercentNumeric
    ? circumference - ((overallSummary.percentage as number) / 100) * circumference
    : circumference;

  const isGoodStanding = isPercentNumeric && (overallSummary.percentage as number) >= 75;

  /* =========================================================================
     COMPONENTS SECTIONS
     ========================================================================= */

  // 1. Welcome Card
  const WelcomeCard = (
    <div className="glass-panel rounded-[28px] p-6 sm:p-7 relative overflow-hidden">
      <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20">
            <Award className="w-3.5 h-3.5" />
            <span>I-SHARK Student Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome, {userProfile?.fullName || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg">
            I-SHARK Institute of Computer Technologies — Track your academic turnout rate, coursework deadlines, and upcoming examination schedules.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <Hash className="w-3.5 h-3.5 text-indigo-500" />
              <span>Roll: {userProfile?.rollNumber || 'Not assigned'}</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <BookOpen className="w-3.5 h-3.5 text-sky-500" />
              <span>Batch: {userProfile?.batch || 'General Batch'}</span>
            </span>
          </div>
        </div>

        {/* Attendance Ring Gauge */}
        <div className="shrink-0 p-4 rounded-3xl glass-panel-subtle flex items-center space-x-5 shadow-xs">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-indigo-600 dark:stroke-indigo-400 transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {overallSummary.percentage}{isPercentNumeric ? '%' : ''}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase">Rate</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Attendance Standing</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {overallSummary.total > 0
                ? `${overallSummary.present + overallSummary.late} of ${overallSummary.total} sessions`
                : 'No sessions recorded yet'}
            </div>
            <div className="mt-2">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  !isPercentNumeric
                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    : isGoodStanding
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                }`}
              >
                {!isPercentNumeric ? 'No Records' : isGoodStanding ? 'Good Standing' : 'Below 75% Target'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 2. Attendance Status Bento Grid
  const AttendanceBentoGrid = (
    <div className="space-y-3">
      {attendanceError && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{attendanceError}</span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Present */}
        <div className="glass-panel glass-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Present</span>
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overallSummary.present}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1.5 font-medium">
              on-time days
            </span>
          </div>
        </div>

        {/* Late */}
        <div className="glass-panel glass-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Late</span>
            <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overallSummary.late}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 ml-1.5 font-medium">
              delayed days
            </span>
          </div>
        </div>

        {/* Absent */}
        <div className="glass-panel glass-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Absent</span>
            <div className="p-2 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overallSummary.absent}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 ml-1.5 font-medium">
              unexcused
            </span>
          </div>
        </div>

        {/* Leave */}
        <div className="glass-panel glass-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leave</span>
            <div className="p-2 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overallSummary.leave}
            </span>
            <span className="text-xs text-sky-600 dark:text-sky-400 ml-1.5 font-medium">
              authorized
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // 3. Tasks Card
  const TasksSection = (
    <div className="glass-panel p-5 sm:p-6 rounded-[28px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Coursework Assignments
          </h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          {sortedTasks.length} active
        </span>
      </div>

      {tasksError ? (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{tasksError}</span>
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800/80">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            No tasks yet, enjoy your day!
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            You have completed all pending coursework and homework.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const diffDays = getDaysDiffLocal(task.dueDate, todayStr);
            const isOverdue = diffDays < 0;
            const isToday = diffDays === 0;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl transition-all duration-200 ${
                  isOverdue
                    ? 'bg-rose-500/10 border border-rose-500/30'
                    : isToday
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'glass-panel-subtle'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isOverdue
                          ? 'text-rose-700 dark:text-rose-300'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  </div>

                  {/* Overdue / Due Badge */}
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1 ${
                      isOverdue
                        ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                        : isToday
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    {isOverdue && <AlertCircle className="w-3 h-3 shrink-0" />}
                    <span>
                      {isOverdue
                        ? `OVERDUE (${Math.abs(diffDays)}d)`
                        : isToday
                        ? 'Due Today'
                        : `Due in ${diffDays}d`}
                    </span>
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Deadline: {task.dueDate}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // 4. Tests Section
  const TestsSection = (
    <div className="glass-panel p-5 sm:p-6 rounded-[28px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Upcoming Tests & Exams
          </h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          {upcomingTests.length} scheduled
        </span>
      </div>

      {testsError ? (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{testsError}</span>
        </div>
      ) : upcomingTests.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No tests scheduled right now. Keep up the good studies!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingTests.map((test) => {
            const diffDays = getDaysDiffLocal(test.date, todayStr);
            const isToday = diffDays === 0;
            const isTomorrow = diffDays === 1;

            return (
              <div
                key={test.id}
                className="p-4 rounded-2xl glass-panel-subtle hover:bg-white/80 dark:hover:bg-slate-800/70 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {test.type}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {test.subject}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {test.title}
                    </h3>
                  </div>

                  {/* Days remaining badge */}
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isToday
                        ? 'bg-amber-500 text-white animate-pulse'
                        : isTomorrow
                        ? 'bg-sky-500 text-white'
                        : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                    }`}
                  >
                    {isToday ? 'Today!' : isTomorrow ? 'Tomorrow' : `${diffDays} days left`}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Date:</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {test.date}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Time:</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {test.time}
                    </span>
                  </div>
                </div>

                {test.syllabus && (
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                    Syllabus: {test.syllabus}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // 5. Attendance History Table
  const AttendanceHistorySection = (
    <div className="glass-panel rounded-[28px] overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Your Attendance History
          </h2>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={viewAllMonths}
              onChange={(e) => setViewAllMonths(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>View All History</span>
          </label>

          {!viewAllMonths && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-semibold text-xs"
            />
          )}
        </div>
      </div>

      {attendanceError ? (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{attendanceError}</span>
        </div>
      ) : filteredAttendance.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          No attendance records logged for this selected duration.
        </div>
      ) : (
        <>
          {/* Mobile View: Clean Glass Cards (< md) */}
          <div className="md:hidden space-y-3">
            {filteredAttendance.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl glass-panel-subtle space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {rec.date}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.status === 'Present'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : rec.status === 'Late'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                        : rec.status === 'Absent'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                        : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <div>
                    <span>In: </span>
                    <strong className="text-slate-800 dark:text-slate-200">{rec.inTime || '—'}</strong>
                  </div>
                  <div>
                    <span>Out: </span>
                    <strong className="text-slate-800 dark:text-slate-200">{rec.outTime || '—'}</strong>
                  </div>
                </div>

                {rec.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    Remarks: {rec.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View: Glass Table (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">In-Time</th>
                  <th className="py-3 px-4">Out-Time</th>
                  <th className="py-3 px-4">Instructor Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                {filteredAttendance.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {rec.date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                            : rec.status === 'Late'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            : rec.status === 'Absent'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                            : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{rec.inTime || '—'}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{rec.outTime || '—'}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 italic">
                      {rec.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  /* =========================================================================
     RENDER BASED ON CURRENT TAB
     ========================================================================= */

  if (currentTab === 'attendance') {
    return (
      <div className="space-y-6">
        {AttendanceBentoGrid}
        {AttendanceHistorySection}
      </div>
    );
  }

  if (currentTab === 'tasks') {
    return (
      <div className="space-y-6">
        {TasksSection}
      </div>
    );
  }

  if (currentTab === 'tests') {
    return (
      <div className="space-y-6">
        {TestsSection}
      </div>
    );
  }

  // Default: 'dashboard' overview
  return (
    <div className="space-y-6">
      {WelcomeCard}
      {AttendanceBentoGrid}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {TasksSection}
        {TestsSection}
      </div>
      {AttendanceHistorySection}
    </div>
  );
};
