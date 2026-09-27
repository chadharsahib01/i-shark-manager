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
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Check
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
import { StudentReportModal } from '../StudentReportModal';

interface StudentDashboardProps {
  currentTab?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentTab = 'dashboard' }) => {
  const { currentUser, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Independent error states
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [testsError, setTestsError] = useState<string | null>(null);

  // Month filter for attendance history
  const todayStr = getLocalDateString();
  const currentMonthStr = todayStr.substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [viewAllMonths, setViewAllMonths] = useState<boolean>(false);

  // Active selected day for the Meeting-Card style calendar strip
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string>(todayStr);

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

  // Overall attendance metrics
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

  // Generate 7 days for the Meeting-Card Calendar Strip (Inspiration 2) centered around today
  const weekDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dayNumber = d.getDate();

      // Check if attendance exists for this day
      const attRecord = attendance.find((a) => a.date === dateStr);

      days.push({
        dateStr,
        dayName,
        dayNumber,
        status: attRecord ? attRecord.status : null,
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [todayStr, attendance]);

  // Loading skeleton screen
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="ticket-pass h-48 rounded-3xl p-6 bg-slate-900/80 border-slate-800" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="ticket-pass h-28 rounded-2xl bg-slate-900/80 border-slate-800" />
          <div className="ticket-pass h-28 rounded-2xl bg-slate-900/80 border-slate-800" />
          <div className="ticket-pass h-28 rounded-2xl bg-slate-900/80 border-slate-800" />
          <div className="ticket-pass h-28 rounded-2xl bg-slate-900/80 border-slate-800" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ticket-pass h-64 rounded-3xl bg-slate-900/80 border-slate-800" />
          <div className="ticket-pass h-64 rounded-3xl bg-slate-900/80 border-slate-800" />
        </div>
      </div>
    );
  }

  const isPercentNumeric = typeof overallSummary.percentage === 'number';
  const isGoodStanding = isPercentNumeric && (overallSummary.percentage as number) >= 75;

  /* =========================================================================
     1. STUDENT OVERVIEW CARD
     ========================================================================= */
  const StudentBoardingPass = (
    <div className="ticket-pass holo-sheen p-0 bg-slate-950 border-violet-500/30 shadow-2xl relative">
      {/* Top Main Section */}
      <div className="p-6 sm:p-7 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="tag-mono px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 font-bold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>STUDENT PROFILE</span>
              </span>
              <span className="tag-mono text-[9px] text-slate-500">TERM 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              {userProfile?.fullName || 'Enrolled Student'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              I-SHARK Institute of Computer Technologies // Department of Computer Science & Software Engineering
            </p>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="tag-mono px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600 border border-violet-500/50 text-violet-200 hover:text-white flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
              title="View & Download Official Academic Report"
            >
              <FileText className="w-3.5 h-3.5 text-violet-300" />
              <span>VIEW FULL REPORT</span>
            </button>
            <span className="tag-mono px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center space-x-1.5 shadow-inner">
              <Hash className="w-3.5 h-3.5 text-violet-400" />
              <span>ROLL: {userProfile?.rollNumber || 'NOT ASSIGNED'}</span>
            </span>
            <span className="tag-mono px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center space-x-1.5 shadow-inner">
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              <span>BATCH: {userProfile?.batch || 'ICT-CORE'}</span>
            </span>
          </div>
        </div>

        {/* Detail Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div>
            <span className="tag-mono text-[9px] text-slate-500 block">ENROLLMENT STATUS</span>
            <span className="font-mono font-bold text-emerald-400 flex items-center mt-0.5">
              <Check className="w-3.5 h-3.5 mr-1" /> ACTIVE
            </span>
          </div>
          <div>
            <span className="tag-mono text-[9px] text-slate-500 block">CLASSES RECORDED</span>
            <span className="font-mono font-bold text-slate-200 mt-0.5 block">
              {overallSummary.total} Total Recorded
            </span>
          </div>
          <div>
            <span className="tag-mono text-[9px] text-slate-500 block">PENDING TASKS</span>
            <span className="font-mono font-bold text-violet-400 mt-0.5 block">
              {sortedTasks.length} Active Tasks
            </span>
          </div>
          <div>
            <span className="tag-mono text-[9px] text-slate-500 block">UPCOMING TESTS</span>
            <span className="font-mono font-bold text-rose-400 mt-0.5 block">
              {upcomingTests.length} Scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Perforation Divider */}
      <div className="ticket-perforation-divider bg-slate-950">
        <div className="ticket-notch-left" />
        <div className="ticket-dashed-line" />
        <div className="ticket-notch-right" />
      </div>

      {/* Bottom Stub Section */}
      <div className="p-6 bg-slate-900/70 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="ticket-barcode-graphic text-slate-300 w-32 shrink-0" />
          <div className="min-w-0">
            <span className="tag-mono text-[8px] text-slate-500 tracking-widest block">
              ID: {studentId.slice(0, 16)}...
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              STATUS: {isGoodStanding ? 'ELIGIBLE FOR EXAMS' : 'BELOW 75% REQUIREMENT'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="tag-mono text-[8px] text-slate-400 uppercase tracking-widest block">
              ATTENDANCE RATE
            </span>
            <span className={`text-4xl font-black font-mono tracking-tight leading-none ${isGoodStanding ? 'text-violet-400' : 'text-rose-400'}`}>
              {overallSummary.percentage}{isPercentNumeric ? '%' : ''}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-[70px]">
            <span className="tag-mono text-[8px] text-slate-400 block">TARGET</span>
            <span className="tag-mono text-xs font-bold text-emerald-400">75% MIN</span>
          </div>
        </div>
      </div>
    </div>
  );

  /* =========================================================================
     2. WEEKLY ATTENDANCE STRIP
     ========================================================================= */
  const CalendarDayStripCard = (
    <div className="ticket-pass p-5 bg-slate-900/90 border-violet-500/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <CalendarCheck className="w-4 h-4 text-violet-400" />
            <span>Weekly Attendance</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Your daily attendance and check-in times for this week
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 shadow-inner">
          <Calendar className="w-3.5 h-3.5 text-violet-400" />
          <span>{new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* The Day Strip */}
      <div className="meeting-calendar-strip bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5">
        {weekDays.map((day) => {
          const isSelected = selectedCalendarDay === day.dateStr;
          return (
            <div
              key={day.dateStr}
              onClick={() => setSelectedCalendarDay(day.dateStr)}
              className={`day-pill-wrapper group ${isSelected ? 'day-pill-active' : ''}`}
            >
              <div className={`day-pill-num font-mono ${
                isSelected
                  ? 'bg-violet-600 text-white font-black'
                  : 'text-slate-300 group-hover:bg-slate-800'
              }`}>
                {day.dayNumber}
              </div>
              <div className={`day-pill-name tag-mono ${
                isSelected
                  ? 'bg-violet-700 text-white'
                  : 'text-slate-500 group-hover:bg-slate-800'
              }`}>
                {day.dayName}
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicator Connector Timeline */}
      <div className="calendar-timeline-container my-1">
        <div className="calendar-timeline-line" />
        {weekDays.map((day) => {
          let dotColor = 'bg-slate-700';
          if (day.status === 'Present') dotColor = 'bg-emerald-400 ring-4 ring-emerald-500/20';
          else if (day.status === 'Late') dotColor = 'bg-amber-400 ring-4 ring-amber-500/20';
          else if (day.status === 'Absent') dotColor = 'bg-rose-500 ring-4 ring-rose-500/20';
          else if (day.status === 'Leave') dotColor = 'bg-sky-400 ring-4 ring-sky-500/20';

          return (
            <div
              key={`dot-${day.dateStr}`}
              className={`calendar-timeline-dot ${dotColor}`}
              title={`${day.dateStr}: ${day.status || 'No session'}`}
            />
          );
        })}
      </div>

      {/* Selected Day Info Pill */}
      {(() => {
        const activeRecord = attendance.find((a) => a.date === selectedCalendarDay);
        return (
          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="tag-mono text-slate-400">SELECTED: {selectedCalendarDay}</span>
              {activeRecord ? (
                <span className={`tag-mono px-2 py-0.5 rounded font-bold ${
                  activeRecord.status === 'Present'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : activeRecord.status === 'Late'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : activeRecord.status === 'Absent'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}>
                  {activeRecord.status.toUpperCase()}
                </span>
              ) : (
                <span className="tag-mono text-slate-500">NO SESSION RECORDED</span>
              )}
            </div>

            {activeRecord && (
              <div className="tag-mono text-slate-400 flex items-center space-x-3">
                <span>IN: <strong className="text-slate-200">{activeRecord.inTime || '—'}</strong></span>
                <span>OUT: <strong className="text-slate-200">{activeRecord.outTime || '—'}</strong></span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );

  /* =========================================================================
     3. ATTENDANCE METRIC CARDS
     ========================================================================= */
  const AttendanceMetricCards = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Present */}
      <div className="ticket-pass p-4 sm:p-5 bg-slate-900/90 border-emerald-500/20 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="tag-mono text-slate-400">PRESENT</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black font-mono text-white">
            {overallSummary.present}
          </span>
          <span className="text-xs text-emerald-400 ml-1.5 font-mono">
            ON TIME
          </span>
        </div>
      </div>

      {/* Late */}
      <div className="ticket-pass p-4 sm:p-5 bg-slate-900/90 border-amber-500/20 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="tag-mono text-slate-400">LATE</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black font-mono text-white">
            {overallSummary.late}
          </span>
          <span className="text-xs text-amber-400 ml-1.5 font-mono">
            LATE
          </span>
        </div>
      </div>

      {/* Absent */}
      <div className="ticket-pass p-4 sm:p-5 bg-slate-900/90 border-rose-500/20 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="tag-mono text-slate-400">ABSENT</span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black font-mono text-white">
            {overallSummary.absent}
          </span>
          <span className="text-xs text-rose-400 ml-1.5 font-mono">
            ABSENT
          </span>
        </div>
      </div>

      {/* Leave */}
      <div className="ticket-pass p-4 sm:p-5 bg-slate-900/90 border-sky-500/20 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="tag-mono text-slate-400">LEAVE</span>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black font-mono text-white">
            {overallSummary.leave}
          </span>
          <span className="text-xs text-sky-400 ml-1.5 font-mono">
            APPROVED
          </span>
        </div>
      </div>
    </div>
  );

  /* =========================================================================
     4. ASSIGNMENTS & TASKS
     ========================================================================= */
  const TasksSection = (
    <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Assignments & Tasks
            </h2>
            <span className="tag-mono text-[9px] text-slate-400">ACTIVE COURSEWORK</span>
          </div>
        </div>
        <span className="tag-mono px-2.5 py-1 rounded-md bg-slate-800 text-violet-300 border border-slate-700">
          {sortedTasks.length} TASKS
        </span>
      </div>

      {tasksError ? (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{tasksError}</span>
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/50">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-200">
            All assignments completed!
          </p>
          <p className="tag-mono text-[10px] text-slate-500 mt-1">
            NO PENDING TASKS
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
                className={`p-4 rounded-xl border transition-all ${
                  isOverdue
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : isToday
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800 hover:border-violet-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-md tag-mono text-[10px] font-bold ${
                      isOverdue
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isToday
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-violet-300 border border-violet-500/30'
                    }`}
                  >
                    {isOverdue
                      ? `OVERDUE ${Math.abs(diffDays)}D`
                      : isToday
                      ? 'DUE TODAY'
                      : `DUE IN ${diffDays}D`}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-violet-400" />
                    <span>DUE DATE: {task.dueDate}</span>
                  </span>
                  <span className="tag-mono text-slate-500">TASK #{task.id.slice(0, 6)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* =========================================================================
     5. TESTS & EXAMS
     ========================================================================= */
  const TestsSection = (
    <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Tests & Examinations
            </h2>
            <span className="tag-mono text-[9px] text-slate-400">UPCOMING SCHEDULE</span>
          </div>
        </div>
        <span className="tag-mono px-2.5 py-1 rounded-md bg-slate-800 text-violet-300 border border-slate-700">
          {upcomingTests.length} TESTS
        </span>
      </div>

      {testsError ? (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{testsError}</span>
        </div>
      ) : upcomingTests.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/50">
          <p className="text-xs text-slate-400 font-mono">
            No upcoming tests or examinations scheduled.
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
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="tag-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                        {test.type}
                      </span>
                      <span className="tag-mono text-slate-400">
                        {test.subject}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                      {test.title}
                    </h3>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-md tag-mono text-[10px] font-bold ${
                      isToday
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : isTomorrow
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-violet-300 border border-violet-500/30'
                    }`}
                  >
                    {isToday ? 'TODAY' : isTomorrow ? 'TOMORROW' : `${diffDays} DAYS`}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4 text-slate-400">
                    <span className="flex items-center space-x-1 tag-mono">
                      <Calendar className="w-3.5 h-3.5 text-violet-400" />
                      <span>{test.date}</span>
                    </span>
                    <span className="flex items-center space-x-1 tag-mono">
                      <Clock className="w-3.5 h-3.5 text-violet-400" />
                      <span>{test.time}</span>
                    </span>
                  </div>
                  <span className="tag-mono text-[9px] text-emerald-400">STATUS: SCHEDULED</span>
                </div>

                {test.syllabus && (
                  <p className="mt-2 text-[10px] text-slate-400 line-clamp-1 italic font-mono">
                    SYLLABUS: {test.syllabus}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* =========================================================================
     6. ATTENDANCE HISTORY
     ========================================================================= */
  const AttendanceHistorySection = (
    <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <CalendarCheck className="w-4 h-4 text-violet-400" />
            <span>Attendance History</span>
          </h2>
          <span className="tag-mono text-[9px] text-slate-400">PAST ATTENDANCE RECORDS</span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer tag-mono text-slate-300">
            <input
              type="checkbox"
              checked={viewAllMonths}
              onChange={(e) => setViewAllMonths(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500"
            />
            <span>SHOW ALL MONTHS</span>
          </label>

          {!viewAllMonths && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 font-mono text-xs outline-hidden focus:border-violet-500"
            />
          )}
        </div>
      </div>

      {attendanceError ? (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{attendanceError}</span>
        </div>
      ) : filteredAttendance.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 text-xs text-slate-500 font-mono">
          NO ATTENDANCE RECORDS FOUND FOR THIS PERIOD.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider tag-mono">
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">TIME IN</th>
                <th className="py-3 px-4">TIME OUT</th>
                <th className="py-3 px-4">NOTES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAttendance.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-200">
                    {rec.date}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tag-mono ${
                        rec.status === 'Present'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : rec.status === 'Late'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : rec.status === 'Absent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {rec.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{rec.inTime || '—'}</td>
                  <td className="py-3 px-4 text-slate-300">{rec.outTime || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {rec.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* =========================================================================
     TAB ROUTING
     ========================================================================= */

  return (
    <>
      {currentTab === 'attendance' && (
        <div className="space-y-6">
          {CalendarDayStripCard}
          {AttendanceMetricCards}
          {AttendanceHistorySection}
        </div>
      )}

      {currentTab === 'tasks' && (
        <div className="space-y-6">
          {TasksSection}
        </div>
      )}

      {currentTab === 'tests' && (
        <div className="space-y-6">
          {TestsSection}
        </div>
      )}

      {currentTab !== 'attendance' && currentTab !== 'tasks' && currentTab !== 'tests' && (
        <div className="space-y-6">
          {StudentBoardingPass}
          {CalendarDayStripCard}
          {AttendanceMetricCards}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {TasksSection}
            {TestsSection}
          </div>
          {AttendanceHistorySection}
        </div>
      )}

      {/* Single Student Official Report Modal */}
      {showReportModal && (userProfile?.id || currentUser?.uid) && (
        <StudentReportModal
          studentId={userProfile?.id || currentUser?.uid || ''}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
};
