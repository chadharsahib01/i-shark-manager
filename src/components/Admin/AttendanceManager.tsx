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
  Users,
  Sparkles,
  RotateCcw,
  Check,
  FileText,
  Filter
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
import { StudentReportModal } from '../StudentReportModal';

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
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [inspectStudentId, setInspectStudentId] = useState<string | null>(null);

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

      // Default active students without record to unmarked
      activeList.forEach((st) => {
        if (!map[st.id]) {
          map[st.id] = {
            id: `${st.id}_${date}`,
            date,
            studentId: st.id,
            studentName: st.fullName,
            status: undefined,
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

  const handleMarkAllAbsent = () => {
    setRecordsMap((prev) => {
      const updated = { ...prev };
      students.forEach((st) => {
        if (updated[st.id] && !updated[st.id].status) {
          updated[st.id] = {
            ...updated[st.id],
            status: 'Absent',
            inTime: '',
            outTime: ''
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

  const batches = Array.from(new Set(students.map((s) => s.batch).filter(Boolean))) as string[];
  const displayedStudents = students.filter((s) => batchFilter === 'all' || s.batch === batchFilter);

  // Perform actual write to Firestore
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
      setErrorMessage(err.message || 'Failed to save attendance to database.');
    } finally {
      setSaving(false);
    }
  };

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

  // Stats
  const currentList = Object.values(recordsMap);
  const presentCount = currentList.filter((r) => r.status === 'Present').length;
  const lateCount = currentList.filter((r) => r.status === 'Late').length;
  const absentCount = currentList.filter((r) => r.status === 'Absent').length;
  const leaveCount = currentList.filter((r) => r.status === 'Leave').length;
  const unmarkedCount = students.length - (presentCount + lateCount + absentCount + leaveCount);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="tag-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30 flex items-center space-x-1 font-bold">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>DAILY ATTENDANCE</span>
              </span>
              <span className="tag-mono text-[9px] text-slate-500">RECORDS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
              <CalendarCheck className="w-6 h-6 text-violet-400" />
              <span>Daily Attendance</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Record daily attendance, arrival times, departure times, and remarks for enrolled students.
            </p>
          </div>

          {/* Date Selector Navigation Pill */}
          <div className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800 shadow-inner self-start md:self-auto">
            <button
              onClick={() => shiftDate(-1)}
              title="Previous Day"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 px-2">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              <input
                type="date"
                id="attendance-date-picker"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="tag-mono font-bold text-white bg-transparent outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={() => shiftDate(1)}
              title="Next Day"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate(getLocalDateString())}
              className="px-2.5 py-1 tag-mono text-[10px] font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition shadow-xs"
            >
              TODAY
            </button>
          </div>
        </div>

        {/* Stats Metrics & Actions Ribbon */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Counter Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="tag-mono px-3 py-1 rounded-lg bg-emerald-950/30 text-emerald-300 border border-emerald-500/30 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PRESENT: {presentCount}</span>
            </span>
            <span className="tag-mono px-3 py-1 rounded-lg bg-amber-950/30 text-amber-300 border border-amber-500/30 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>LATE: {lateCount}</span>
            </span>
            <span className="tag-mono px-3 py-1 rounded-lg bg-rose-950/30 text-rose-300 border border-rose-500/30 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>ABSENT: {absentCount}</span>
            </span>
            <span className="tag-mono px-3 py-1 rounded-lg bg-sky-950/30 text-sky-300 border border-sky-500/30 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>LEAVE: {leaveCount}</span>
            </span>
            {unmarkedCount > 0 && (
              <span className="tag-mono px-3 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                UNMARKED: {unmarkedCount}
              </span>
            )}
          </div>

          {/* Action Buttons & Batch Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {batches.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Filter className="w-3.5 h-3.5 text-violet-400" />
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="bg-transparent text-xs tag-mono font-bold text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">ALL BATCHES ({students.length})</option>
                  {batches.map((b) => (
                    <option key={b} value={b}>
                      {b.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-2.5 py-1.5 rounded-lg tag-mono text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer btn-tactile"
              title="Mark all active students present"
            >
              ALL PRESENT
            </button>
            <button
              type="button"
              onClick={handleMarkAllAbsent}
              className="px-2.5 py-1.5 rounded-lg tag-mono text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer btn-tactile"
              title="Mark remaining unmarked students absent"
            >
              UNMARKED TO ABSENT
            </button>
            <button
              type="button"
              onClick={handleResetToUnmarked}
              className="px-2.5 py-1.5 rounded-lg tag-mono text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
            >
              RESET
            </button>
            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={saving || loading || students.length === 0}
              id="btn-save-attendance"
              className="glow-orb-btn py-1.5 px-3.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-900/40 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'SAVING...' : 'SAVE ATTENDANCE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono font-bold">Attendance records saved successfully for {selectedDate}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-mono font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Main Student Attendance Table / List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl ticket-pass bg-slate-900/90 border-slate-800 text-slate-400">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white uppercase tag-mono">No Enrolled Students</h3>
          <p className="text-xs text-slate-500 mt-1">
            Enroll students from the Students registry first.
          </p>
        </div>
      ) : (
        <div className="ticket-pass p-0 bg-slate-900/90 border-violet-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider tag-mono">
                  <th className="py-3.5 px-4">STUDENT</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 min-w-[140px]">TIME IN</th>
                  <th className="py-3.5 px-4 min-w-[140px]">TIME OUT</th>
                  <th className="py-3.5 px-4 min-w-[180px]">NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {displayedStudents.map((student) => {
                  const record = recordsMap[student.id];

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setInspectStudentId(student.id)}
                          className="font-bold text-white tracking-tight hover:text-violet-400 hover:underline transition text-left cursor-pointer flex items-center space-x-1.5"
                          title="Click to view student attendance report"
                        >
                          <span>{student.fullName}</span>
                          <FileText className="w-3 h-3 text-violet-400 opacity-60" />
                        </button>
                        <div className="tag-mono text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>{student.rollNumber || 'NO ROLL'}</span>
                          <span>•</span>
                          <span className="text-violet-400">{student.batch || 'ICT-CORE'}</span>
                        </div>
                      </td>

                      {/* Status Pills */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          {(['Present', 'Late', 'Absent', 'Leave'] as AttendanceStatus[]).map((st) => {
                            const isSelected = record?.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(student.id, st)}
                                className={`px-2.5 py-1 rounded-md text-[10px] tag-mono font-bold transition cursor-pointer btn-tactile ${
                                  isSelected
                                    ? st === 'Present'
                                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                                      : st === 'Late'
                                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                                      : st === 'Absent'
                                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                      : 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                }`}
                              >
                                {st.toUpperCase()}
                              </button>
                            );
                          })}
                          {!record?.status && (
                            <span className="tag-mono text-[9px] text-slate-500 italic ml-1">
                              UNMARKED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* In-Time Input with Auto-Fill Now button */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            value={record?.inTime || ''}
                            onChange={(e) => handleInTimeChange(student.id, e.target.value)}
                            placeholder="09:00 AM"
                            disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                            className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-700 bg-slate-950 text-slate-100 disabled:opacity-30 outline-hidden focus:border-violet-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAutoFillInTime(student.id)}
                            disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                            title="Auto-fill current time"
                            className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/30 text-[10px] tag-mono font-bold transition disabled:opacity-30 hover:bg-violet-500/20"
                          >
                            NOW
                          </button>
                        </div>
                      </td>

                      {/* Out-Time Input with Auto-Fill Now button */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            value={record?.outTime || ''}
                            onChange={(e) => handleOutTimeChange(student.id, e.target.value)}
                            placeholder="04:30 PM"
                            disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                            className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-700 bg-slate-950 text-slate-100 disabled:opacity-30 outline-hidden focus:border-violet-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAutoFillOutTime(student.id)}
                            disabled={!record?.status || record.status === 'Absent' || record.status === 'Leave'}
                            title="Auto-fill current time"
                            className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/30 text-[10px] tag-mono font-bold transition disabled:opacity-30 hover:bg-violet-500/20"
                          >
                            NOW
                          </button>
                        </div>
                      </td>

                      {/* Note Field */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={record?.notes || ''}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          placeholder="Instructor notes..."
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-hidden focus:border-violet-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Unmarked Students */}
      {confirmUnmarkedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="ticket-pass max-w-md w-full p-6 bg-slate-950 border-violet-500/40 space-y-4 shadow-2xl relative">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tag-mono">
                Unmarked Students Found
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              <strong>{unmarkedStudentsCount} student{unmarkedStudentsCount > 1 ? 's have' : ' has'}</strong> not been marked for {selectedDate}. Proceed with saving marked records only?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmUnmarkedModalOpen(false)}
                className="px-3.5 py-2 tag-mono text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={saving}
                className="px-4 py-2 tag-mono text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition shadow-lg shadow-violet-900/40 cursor-pointer"
              >
                {saving ? 'SAVING...' : 'SAVE ANYWAY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Report Modal */}
      {inspectStudentId && (
        <StudentReportModal
          studentId={inspectStudentId}
          onClose={() => setInspectStudentId(null)}
        />
      )}
    </div>
  );
};
