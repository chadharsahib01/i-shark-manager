import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Percent
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  UserProfile,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary
} from '../../types';
import {
  getAllStudents,
  getAllAttendance,
  calculateAttendanceSummary
} from '../../services/firestoreService';
import { getLocalDateString } from '../../utils/dateUtils';

export const ReportsManager: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const currentYearMonth = getLocalDateString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsData, attendanceData] = await Promise.all([
        getAllStudents(),
        getAllAttendance()
      ]);
      setStudents(studentsData);
      setAllRecords(attendanceData);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered records matching month and student
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      const matchesMonth = rec.date.startsWith(selectedMonth);
      const matchesStudent =
        selectedStudentId === 'all' || rec.studentId === selectedStudentId;
      return matchesMonth && matchesStudent;
    });
  }, [allRecords, selectedMonth, selectedStudentId]);

  // Attendance summary metrics
  const summary: AttendanceSummary = useMemo(() => {
    return calculateAttendanceSummary(filteredRecords);
  }, [filteredRecords]);

  // Selected student details if single student
  const currentStudent = students.find((s) => s.id === selectedStudentId);

  // Calendar matrix calculation for the selected month
  const calendarData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Leading empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: null, records: [] });
    }

    // Day slots
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      const dayRecords = filteredRecords.filter((r) => r.date === dateStr);
      days.push({
        dayNumber: day,
        dateStr,
        records: dayRecords
      });
    }

    return days;
  }, [selectedMonth, filteredRecords]);

  /* =========================================================================
     EXPORT TO CSV
     ========================================================================= */
  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No records available to export for this selection.');
      return;
    }

    const headers = [
      'Date',
      'Student Name',
      'Student Roll',
      'Status',
      'In Time',
      'Out Time',
      'Notes'
    ];

    const rows = filteredRecords.map((r) => {
      const student = students.find((s) => s.id === r.studentId);
      return [
        r.date,
        `"${(r.studentName || student?.fullName || '').replace(/"/g, '""')}"`,
        `"${(student?.rollNumber || '').replace(/"/g, '""')}"`,
        r.status,
        `"${(r.inTime || '').replace(/"/g, '""')}"`,
        `"${(r.outTime || '').replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\r\n'
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const studentTag = selectedStudentId === 'all' ? 'all-students' : currentStudent?.fullName.replace(/\s+/g, '_') || 'student';
    link.setAttribute('download', `attendance_report_${selectedMonth}_${studentTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* =========================================================================
     EXPORT TO PDF
     ========================================================================= */
  const exportToPDF = () => {
    if (filteredRecords.length === 0) {
      alert('No records available to export for this selection.');
      return;
    }

    const doc = new jsPDF();
    const title = 'I-SHARK Institute of Computer Technologies - Attendance Report';
    const subTitle = `Report Period: ${selectedMonth} | Scope: ${
      selectedStudentId === 'all' ? 'All Active Students' : currentStudent?.fullName
    }`;

    // Header styling
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subTitle, 14, 28);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 34);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 40, 182, 24, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    doc.text(`Total Sessions: ${summary.total}`, 20, 48);
    doc.text(`Present: ${summary.present}`, 65, 48);
    doc.text(`Late: ${summary.late}`, 110, 48);
    doc.text(`Absent: ${summary.absent}`, 150, 48);

    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text(`Overall Attendance Rate: ${summary.percentage}%`, 20, 58);

    // Records Table Header
    let y = 72;
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.text('Date', 16, y);
    doc.text('Student', 46, y);
    doc.text('Status', 105, y);
    doc.text('In-Time', 130, y);
    doc.text('Out-Time', 155, y);

    y += 8;

    // Table rows (with pagination support)
    filteredRecords.slice(0, 50).forEach((rec) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(rec.date, 16, y);
      doc.text(rec.studentName || 'Student', 46, y);
      doc.text(rec.status, 105, y);
      doc.text(rec.inTime || '-', 130, y);
      doc.text(rec.outTime || '-', 155, y);
      y += 6;
    });

    if (filteredRecords.length > 50) {
      doc.text(`... and ${filteredRecords.length - 50} more records (truncated for summary PDF)`, 16, y + 4);
    }

    const studentTag = selectedStudentId === 'all' ? 'all_students' : currentStudent?.fullName.replace(/\s+/g, '_') || 'student';
    doc.save(`attendance_report_${selectedMonth}_${studentTag}.pdf`);
  };

  const getStatusDotColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500 text-white';
      case 'Late':
        return 'bg-amber-500 text-white';
      case 'Absent':
        return 'bg-rose-500 text-white';
      case 'Leave':
        return 'bg-sky-500 text-white';
      default:
        return 'bg-slate-300 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Attendance Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Filter monthly records by student, analyze percentages, calendar view, and export to PDF/CSV.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            id="btn-export-csv"
            disabled={filteredRecords.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition flex items-center space-x-1.5 disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportToPDF}
            id="btn-export-pdf"
            disabled={filteredRecords.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/20 transition flex items-center space-x-1.5 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel shadow-xs flex flex-col sm:flex-row items-center gap-4">
        {/* Month Selector */}
        <div className="w-full sm:w-auto flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Month:</span>
          <input
            type="month"
            id="report-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Student Selector */}
        <div className="w-full sm:flex-1 flex items-center space-x-2">
          <Users className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Student:</span>
          <select
            id="report-student-select"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full sm:max-w-xs px-3 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Students ({students.length})</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.fullName} {st.rollNumber ? `(${st.rollNumber})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl glass-panel border-indigo-200/50 dark:border-indigo-800/50">
          <span className="text-[11px] font-medium text-indigo-800 dark:text-indigo-300 flex items-center space-x-1">
            <Percent className="w-3.5 h-3.5" />
            <span>Attendance %</span>
          </span>
          <div className="text-2xl font-bold text-indigo-950 dark:text-white mt-1">
            {summary.percentage}%
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Records</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.total}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border-emerald-200/40 dark:border-emerald-900/40">
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Present</span>
          </span>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{summary.present}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border-amber-200/40 dark:border-amber-900/40">
          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Late</span>
          </span>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">{summary.late}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border-rose-200/40 dark:border-rose-900/40">
          <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400 flex items-center space-x-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Absent</span>
          </span>
          <div className="text-2xl font-bold text-rose-900 dark:text-rose-200 mt-1">{summary.absent}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border-sky-200/40 dark:border-sky-900/40">
          <span className="text-[11px] font-medium text-sky-700 dark:text-sky-400 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Leave</span>
          </span>
          <div className="text-2xl font-bold text-sky-900 dark:text-sky-200 mt-1">{summary.leave}</div>
        </div>
      </div>

      {/* Calendar-Style Monthly View */}
      <div className="p-5 rounded-3xl glass-panel shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              Calendar Matrix: {selectedMonth}
              {currentStudent ? ` — ${currentStudent.fullName}` : ' (All Students)'}
            </span>
          </h2>
          <div className="hidden sm:flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Present</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Late</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Absent</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>Leave</span>
            </span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-slate-400 mb-1">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((item, idx) => {
            if (!item.dayNumber) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[72px] rounded-lg bg-slate-50/40 dark:bg-slate-800/20 border border-transparent"
                />
              );
            }

            const hasRecords = item.records.length > 0;

            return (
              <div
                key={item.dateStr}
                className={`min-h-[72px] p-2 rounded-lg border transition flex flex-col justify-between ${
                  hasRecords
                    ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {item.dayNumber}
                  </span>
                  {hasRecords && (
                    <span className="text-[10px] text-slate-400">
                      {item.records.length} logs
                    </span>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  {selectedStudentId !== 'all' ? (
                    // Single Student view
                    item.records.map((rec) => (
                      <div
                        key={rec.id}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm flex items-center justify-between ${getStatusDotColor(
                          rec.status
                        )}`}
                      >
                        <span>{rec.status}</span>
                        {rec.inTime && <span className="text-[9px] opacity-90">{rec.inTime}</span>}
                      </div>
                    ))
                  ) : (
                    // All Students aggregated summary dots
                    <div className="flex flex-wrap gap-1">
                      {item.records.slice(0, 5).map((rec) => (
                        <span
                          key={rec.id}
                          title={`${rec.studentName}: ${rec.status} (${rec.inTime || 'N/A'})`}
                          className={`w-2 h-2 rounded-full ${
                            rec.status === 'Present'
                              ? 'bg-emerald-500'
                              : rec.status === 'Late'
                              ? 'bg-amber-500'
                              : rec.status === 'Absent'
                              ? 'bg-rose-500'
                              : 'bg-sky-500'
                          }`}
                        />
                      ))}
                      {item.records.length > 5 && (
                        <span className="text-[9px] text-slate-400">
                          +{item.records.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Table View */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Detailed Log Records ({filteredRecords.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No attendance records found for this month and student filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">In-Time</th>
                  <th className="py-3 px-4">Out-Time</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {r.date}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {r.studentName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : r.status === 'Late'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : r.status === 'Absent'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.inTime || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.outTime || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{r.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
