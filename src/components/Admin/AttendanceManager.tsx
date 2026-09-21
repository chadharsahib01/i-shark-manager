import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';
import {
  UserProfile,
  AttendanceRecord,
  AttendanceStatus
} from '../../types';
import {
  getAllStudents,
  getAttendanceByDate,
  saveAttendanceRecords
} from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { getLocalDateString, addDaysLocal } from '../../utils/dateUtils';

type ExtendedAttendanceRecord = Omit<AttendanceRecord, 'status'> & {
  status?: AttendanceStatus;
};

export const AttendanceManager: React.FC = () => {
  const { currentUser } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [recordsMap, setRecordsMap] = useState<Record<string, ExtendedAttendanceRecord>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation dialog state for unmarked students
  const [confirmUnmarkedModalOpen, setConfirmUnmarkedModalOpen] = useState(false);
  const [unmarkedStudentsCount, setUnmarkedStudentsCount] = useState(0);

  // Helper to format current time e.g. "09:30 AM"
  const getCurrentFormattedTime = (): string => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const loadAttendanceForDate = async (date: string) => {
    setLoading(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    try {
      const [allStudents, existingRecords] = await Promise.all([
        getAllStudents(),
        getAttendanceByDate(date)
      ]);

      const activeList = allStudents.filter((s) => s.isActive);
      setStudents(activeList);

      const map: Record<string, ExtendedAttendanceRecord> = {};
      existingRecords.forEach((rec) => {
        map[rec.studentId] = rec;
      });

      // For active students without an existing record on this date, default to UNMARKED (empty status)
      activeList.forEach((st) => {
        if (!map[st.id]) {
          map[st.id] = {
            id: `${st.id}_${date}`,
            date,
            studentId: st.id,
            studentName: st.fullName,
            status: undefined, // Not marked
            inTime: '',
            outTime: '',
            notes: '',
            markedBy: currentUser?.uid || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      });

      setRecordsMap(map);
    } catch (err: any) {
      console.error('Error loading attendance:', err);
      setErrorMessage('Failed to load attendance records for this date.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceForDate(selectedDate);
  }, [selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecordsMap((prev) => {
      const current = prev[studentId];
      if (!current) return prev;

      let inTime = current.inTime;
      if (status === 'Absent' || status === 'Leave') {
        inTime = '';
      } else if (!inTime && (status === 'Present' || status === 'Late')) {
        inTime = getCurrentFormattedTime();
      }

      return {
        ...prev,
        [studentId]: {
          ...current,
          status,
          inTime
        }
      };
    });
  };

  const handleInTimeChange = (studentId: string, val: string) => {
    setRecordsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        inTime: val
      }
    }));
  };

  const handleOutTimeChange = (studentId: string, val: string) => {
    setRecordsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        outTime: val
      }
    }));
  };

  const handleNotesChange = (studentId: string, val: string) => {
    setRecordsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes: val
      }
    }));
  };

  const handleAutoFillInTime = (studentId: string) => {
    const time = getCurrentFormattedTime();
    handleInTimeChange(studentId, time);
  };

  const handleAutoFillOutTime = (studentId: string) => {
    const time = getCurrentFormattedTime();
    handleOutTimeChange(studentId, time);
  };

  const handleMarkAllPresent = () => {
    const time = getCurrentFormattedTime();
    setRecordsMap((prev) => {
      const updated = { ...prev };
      students.forEach((st) => {
        if (updated[st.id]) {
          updated[st.id] = {
            ...updated[st.id],
            status: 'Present',
            inTime: updated[st.id].inTime || time
          };
        }
      });
      return updated;
    });
  };

  const handleResetToUnmarked = () => {
    setRecordsMap((prev) => {
      const updated = { ...prev };
      students.forEach((st) => {
        if (updated[st.id]) {
          updated[st.id] = {
            ...updated[st.id],
            status: undefined,
            inTime: '',
            outTime: '',
            notes: ''
          };
        }
      });
      return updated;
    });
  };

  // Perform actual write to Firestore for marked records
  const executeSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    setConfirmUnmarkedModalOpen(false);

    const markedRecords = Object.values(recordsMap).filter(
      (r): r is AttendanceRecord => Boolean(r && r.status)
    );

    try {
      await saveAttendanceRecords(markedRecords);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save attendance:', err);
      setErrorMessage(err.message || 'Failed to save attendance to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  // Check if any student is unmarked before saving
  const handleSaveAttendance = async () => {
    const unmarked = students.filter((st) => !recordsMap[st.id] || !recordsMap[st.id].status);
    if (unmarked.length > 0) {
      setUnmarkedStudentsCount(unmarked.length);
      setConfirmUnmarkedModalOpen(true);
      return;
    }
    await executeSave();
  };

  const shiftDate = (days: number) => {
    setSelectedDate(addDaysLocal(selectedDate, days));
  };

  // Stats calculation
  const currentList = Object.values(recordsMap);
  const presentCount = currentList.filter((r) => r.status === 'Present').length;
  const lateCount = currentList.filter((r) => r.status === 'Late').length;
  const absentCount = currentList.filter((r) => r.status === 'Absent').length;
  const leaveCount = currentList.filter((r) => r.status === 'Leave').length;
  const unmarkedCount = students.length - (presentCount + lateCount + absentCount + leaveCount);

  const statusColors: Record<AttendanceStatus, { bg: string; text: string; active: string }> = {
    Present: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      active: 'bg-emerald-600 text-white shadow-xs'
    },
    Late: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      active: 'bg-amber-500 text-white shadow-xs'
    },
    Absent: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-300',
      active: 'bg-rose-600 text-white shadow-xs'
    },
    Leave: {
      bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      text: 'text-sky-700 dark:text-sky-300',
      active: 'bg-sky-600 text-white shadow-xs'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Date Selector Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Attendance Register</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log daily student arrival times, departures, and absences. Supports editing past dates.
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center space-x-2 glass-panel p-1.5 rounded-2xl shadow-xs">
          <button
            onClick={() => shiftDate(-1)}
            title="Previous Day"
            className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 px-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <input
              type="date"
              id="attendance-date-picker"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-900 dark:text-white bg-transparent outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={() => shiftDate(1)}
            title="Next Day"
            className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(getLocalDateString())}
            className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Stats and Quick Bulk Mark Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Counts summary card */}
        <div className="lg:col-span-3 p-4 rounded-2xl glass-panel shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-5 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-500 dark:text-slate-400">Present:</span>
              <span className="font-bold text-slate-900 dark:text-white">{presentCount}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-500 dark:text-slate-400">Late:</span>
              <span className="font-bold text-slate-900 dark:text-white">{lateCount}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-500 dark:text-slate-400">Absent:</span>
              <span className="font-bold text-slate-900 dark:text-white">{absentCount}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span className="text-slate-500 dark:text-slate-400">Leave:</span>
              <span className="font-bold text-slate-900 dark:text-white">{leaveCount}</span>
            </div>
            {unmarkedCount > 0 && (
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="text-slate-500 dark:text-slate-400">Unmarked:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{unmarkedCount}</span>
              </div>
            )}
          </div>

          {/* Quick Mark All Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              onClick={handleResetToUnmarked}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Reset to Unmarked
            </button>
          </div>
        </div>

        {/* Save button card */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading || students.length === 0}
            id="btn-save-attendance"
            className="w-full h-full py-3 px-5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-md shadow-indigo-600/25 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Records...' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Attendance records for {selectedDate} saved successfully to Firestore!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Student Attendance List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl glass-panel shadow-sm">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Active Students Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Please register active students from the Students tab first.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card View (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {students.map((student) => {
              const record = recordsMap[student.id];

              return (
                <div key={student.id} className="p-4 rounded-2xl glass-panel space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {student.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5">
                        <span>{student.rollNumber || 'No Roll'}</span>
                        <span>•</span>
                        <span>{student.batch || 'General'}</span>
                      </div>
                    </div>
                    {!record?.status && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Not marked
                      </span>
                    )}
                  </div>

                  {/* Status buttons */}
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {(['Present', 'Late', 'Absent', 'Leave'] as AttendanceStatus[]).map((st) => {
                      const isSelected = record?.status === st;
                      const colors = statusColors[st];
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(student.id, st)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition text-center cursor-pointer ${
                            isSelected
                              ? colors.active
                              : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>

                  {/* In & Out Time */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-1">In-Time</label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={record?.inTime || ''}
                          onChange={(e) => handleInTimeChange(student.id, e.target.value)}
                          placeholder="09:00 AM"
                          disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white disabled:opacity-40 outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleAutoFillInTime(student.id)}
                          disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                          className="px-2 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold transition shrink-0 disabled:opacity-40"
                        >
                          Now
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-1">Out-Time</label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={record?.outTime || ''}
                          onChange={(e) => handleOutTimeChange(student.id, e.target.value)}
                          placeholder="04:30 PM"
                          disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white disabled:opacity-40 outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleAutoFillOutTime(student.id)}
                          disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                          className="px-2 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold transition shrink-0 disabled:opacity-40"
                        >
                          Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <input
                      type="text"
                      value={record?.notes || ''}
                      onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      placeholder="Remarks / Note (optional)..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white outline-hidden"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block rounded-3xl glass-panel shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 min-w-[140px]">In-Time</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Out-Time</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Remarks / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60 text-xs">
                  {students.map((student) => {
                    const record = recordsMap[student.id];

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition"
                      >
                        {/* Student Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {student.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span>{student.rollNumber || 'No Roll'}</span>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{student.batch || 'General'}</span>
                          </div>
                        </td>

                        {/* Status Pills */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1">
                            {(['Present', 'Late', 'Absent', 'Leave'] as AttendanceStatus[]).map((st) => {
                              const isSelected = record?.status === st;
                              const colors = statusColors[st];
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, st)}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    isSelected
                                      ? colors.active
                                      : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 border border-slate-200/50 dark:border-slate-700/50'
                                  }`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                            {!record?.status && (
                              <span className="text-[10px] text-slate-400 italic ml-1">
                                Not marked
                              </span>
                            )}
                          </div>
                        </td>

                        {/* In-Time Input with Auto-Fill Now button */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={record?.inTime || ''}
                              onChange={(e) => handleInTimeChange(student.id, e.target.value)}
                              placeholder="09:00 AM"
                              disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                              className="w-24 px-2.5 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white disabled:opacity-40 outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAutoFillInTime(student.id)}
                              disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                              title="Auto-fill current time"
                              className="px-2 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold transition disabled:opacity-40 hover:bg-indigo-100"
                            >
                              Now
                            </button>
                          </div>
                        </td>

                        {/* Out-Time Input with Auto-Fill Now button */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={record?.outTime || ''}
                              onChange={(e) => handleOutTimeChange(student.id, e.target.value)}
                              placeholder="04:30 PM"
                              disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                              className="w-24 px-2.5 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white disabled:opacity-40 outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAutoFillOutTime(student.id)}
                              disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                              title="Auto-fill current time"
                              className="px-2 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold transition disabled:opacity-40 hover:bg-indigo-100"
                            >
                              Now
                            </button>
                          </div>
                        </td>

                        {/* Note Field */}
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            value={record?.notes || ''}
                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                            placeholder="Optional remarks..."
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Unmarked Students */}
      {confirmUnmarkedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl space-y-4 shadow-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 rounded-2xl bg-amber-500/15">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Unmarked Students Detected
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>{unmarkedStudentsCount} student{unmarkedStudentsCount > 1 ? 's have' : ' has'}</strong> not been marked. Do you want to save anyway?
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              Note: Unmarked students will not have an attendance record saved for {selectedDate}.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmUnmarkedModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel & Review
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={saving}
                className="btn-pill px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25"
              >
                {saving ? 'Saving...' : 'Yes, Save Marked Only'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
