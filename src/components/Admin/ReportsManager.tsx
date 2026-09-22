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
  Percent,
  Sparkles
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
    link.setAttribute('download', `attendance_audit_${selectedMonth}_${studentTag}.csv`);
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
    const title = 'I-SHARK Institute of Computer Technologies - Attendance Audit';
    const subTitle = `Period: ${selectedMonth} | Target Scope: ${
      selectedStudentId === 'all' ? 'All Active Students' : currentStudent?.fullName
    }`;

    // Header styling
    doc.setFontSize(15);
    doc.setTextColor(30, 41, 59);
    doc.text(title, 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subTitle, 14, 27);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 33);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 38, 182, 24, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    doc.text(`Total Sessions: ${summary.total}`, 20, 46);
    doc.text(`Present: ${summary.present}`, 65, 46);
    doc.text(`Late: ${summary.late}`, 110, 46);
    doc.text(`Absent: ${summary.absent}`, 150, 46);

    doc.setFontSize(11);
    doc.setTextColor(124, 58, 237);
    doc.text(`Attendance Percentage: ${summary.percentage}%`, 20, 56);

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
      doc.text(`... and ${filteredRecords.length - 50} more records (truncated in summary print)`, 16, y + 4);
    }

    const studentTag = selectedStudentId === 'all' ? 'all_students' : currentStudent?.fullName.replace(/\s+/g, '_') || 'student';
    doc.save(`attendance_audit_${selectedMonth}_${studentTag}.pdf`);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500 text-slate-950 font-bold';
      case 'Late':
        return 'bg-amber-500 text-slate-950 font-bold';
      case 'Absent':
        return 'bg-rose-600 text-white font-bold';
      case 'Leave':
        return 'bg-sky-500 text-slate-950 font-bold';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="tag-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30 flex items-center space-x-1 font-bold">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>AUDIT MATRIX // TELEMETRY</span>
              </span>
              <span className="tag-mono text-[9px] text-slate-500">ANALYTICS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-violet-400" />
              <span>Attendance Reports & Analytics</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monthly audit reports, turnout rate analysis, candidate breakdown, and CSV/PDF ledger export.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={exportToCSV}
              id="btn-export-csv"
              disabled={filteredRecords.length === 0}
              className="p-2 sm:px-3 sm:py-2 rounded-xl tag-mono text-xs font-bold bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-1.5 disabled:opacity-40 btn-tactile cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">EXPORT CSV</span>
            </button>

            <button
              onClick={exportToPDF}
              id="btn-export-pdf"
              disabled={filteredRecords.length === 0}
              className="glow-orb-btn py-2 px-3 sm:px-4 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer shadow-lg shadow-violet-900/40 uppercase"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="ticket-pass p-4 bg-slate-900/90 border-violet-500/20 flex flex-col sm:flex-row items-center gap-4">
        {/* Month Selector */}
        <div className="w-full sm:w-auto flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="tag-mono text-xs text-slate-400">AUDIT MONTH:</span>
          <input
            type="month"
            id="report-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-700 bg-slate-950 text-white outline-hidden focus:border-violet-500 cursor-pointer"
          />
        </div>

        {/* Student Selector */}
        <div className="w-full sm:flex-1 flex items-center space-x-2">
          <Users className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="tag-mono text-xs text-slate-400">ROSTER FILTER:</span>
          <select
            id="report-student-select"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full sm:max-w-xs px-3 py-1.5 text-xs tag-mono font-bold rounded-xl border border-slate-700 bg-slate-950 text-white outline-hidden focus:border-violet-500"
          >
            <option value="all">ALL ENROLLED STUDENTS ({students.length})</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.fullName.toUpperCase()} {st.rollNumber ? `(${st.rollNumber})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl ticket-pass bg-slate-900/90 border-violet-500/30">
          <span className="tag-mono text-violet-300 flex items-center space-x-1 font-bold">
            <Percent className="w-3.5 h-3.5 text-violet-400" />
            <span>ATTENDANCE %</span>
          </span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {summary.percentage}%
          </div>
        </div>

        <div className="p-4 rounded-2xl ticket-pass bg-slate-900/90 border-slate-800">
          <span className="tag-mono text-slate-400 font-bold">TOTAL LOGS</span>
          <div className="text-2xl font-black font-mono text-white mt-1">{summary.total}</div>
        </div>

        <div className="p-4 rounded-2xl ticket-pass bg-slate-900/90 border-emerald-500/30">
          <span className="tag-mono text-emerald-400 flex items-center space-x-1 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PRESENT</span>
          </span>
          <div className="text-2xl font-black font-mono text-emerald-300 mt-1">{summary.present}</div>
        </div>

        <div className="p-4 rounded-2xl ticket-pass bg-slate-900/90 border-amber-500/30">
          <span className="tag-mono text-amber-400 flex items-center space-x-1 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>LATE</span>
          </span>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1">{summary.late}</div>
        </div>

        <div className="p-4 rounded-2xl ticket-pass bg-slate-900/90 border-rose-500/30">
          <span className="tag-mono text-rose-400 flex items-center space-x-1 font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>ABSENT</span>
          </span>
          <div className="text-2xl font-black font-mono text-rose-300 mt-1">{summary.absent}</div>
        </div>

        <div className="p-4 rounded-2xl ticket-pass bg-slate-900/90 border-sky-500/30">
          <span className="tag-mono text-sky-400 flex items-center space-x-1 font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>LEAVE</span>
          </span>
          <div className="text-2xl font-black font-mono text-sky-300 mt-1">{summary.leave}</div>
        </div>
      </div>

      {/* Calendar-Style Monthly View */}
      <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span>
              Monthly Matrix: {selectedMonth}
              {currentStudent ? ` — ${currentStudent.fullName}` : ' (Cohort Aggregate)'}
            </span>
          </h2>
          <div className="hidden sm:flex items-center space-x-3 tag-mono text-[9px] text-slate-400 font-bold">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>PRESENT</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>LATE</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>ABSENT</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>LEAVE</span>
            </span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center tag-mono text-[10px] text-slate-500 font-bold mb-1">
          <div>SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div>SAT</div>
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((item, idx) => {
            if (!item.dayNumber) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[72px] rounded-lg bg-slate-950/40 border border-slate-900/40"
                />
              );
            }

            const hasRecords = item.records.length > 0;

            return (
              <div
                key={item.dateStr}
                className={`min-h-[72px] p-2 rounded-lg border transition flex flex-col justify-between ${
                  hasRecords
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/40 border-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {item.dayNumber}
                  </span>
                  {hasRecords && (
                    <span className="tag-mono text-[9px] text-violet-400 font-bold">
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
                        className={`text-[9px] tag-mono px-1.5 py-0.5 rounded-sm flex items-center justify-between ${getStatusBadge(
                          rec.status
                        )}`}
                      >
                        <span>{rec.status.toUpperCase()}</span>
                        {rec.inTime && <span className="text-[8px] opacity-80">{rec.inTime}</span>}
                      </div>
                    ))
                  ) : (
                    // All Students aggregated summary dots
                    <div className="flex flex-wrap gap-1">
                      {item.records.slice(0, 6).map((rec) => (
                        <span
                          key={rec.id}
                          title={`${rec.studentName}: ${rec.status} (${rec.inTime || 'N/A'})`}
                          className={`w-2 h-2 rounded-full ${
                            rec.status === 'Present'
                              ? 'bg-emerald-400'
                              : rec.status === 'Late'
                              ? 'bg-amber-400'
                              : rec.status === 'Absent'
                              ? 'bg-rose-500'
                              : 'bg-sky-400'
                          }`}
                        />
                      ))}
                      {item.records.length > 6 && (
                        <span className="tag-mono text-[8px] text-slate-400">
                          +{item.records.length - 6}
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
      <div className="ticket-pass p-0 bg-slate-900/90 border-violet-500/20 overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tag-mono">
            Detailed Dispatch Records ({filteredRecords.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center tag-mono text-xs text-slate-500">
            No attendance entries logged for this month and roster scope.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold text-slate-400 uppercase tag-mono">
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">STUDENT CANDIDATE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">GATE IN</th>
                  <th className="py-3 px-4">GATE OUT</th>
                  <th className="py-3 px-4">NOTES / REMARKS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-violet-300 font-bold">
                      {r.date}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-white">
                      {r.studentName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold tag-mono ${
                          r.status === 'Present'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : r.status === 'Late'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : r.status === 'Absent'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{r.inTime || '—'}</td>
                    <td className="py-3 px-4 text-slate-300">{r.outTime || '—'}</td>
                    <td className="py-3 px-4 text-slate-400 italic max-w-xs truncate">{r.notes || '—'}</td>
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
