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
  Sparkles,
  Printer,
  X,
  Image as ImageIcon,
  FileImage,
  Sliders,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
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
import {
  generateAttendancePDF,
  downloadAttendancePDF,
  formatMonthName
} from '../../utils/pdfExport';
import {
  generateAttendanceCanvas,
  downloadAttendanceImage,
} from '../../utils/imageExport';
import {
  DateRangePresetId,
  getPresetDateRange,
  formatRangeDisplay,
  getDateRangeSlug,
} from '../../utils/datePresets';
import { DateRangeFilter } from './DateRangeFilter';
import { StudentReportModal } from '../StudentReportModal';
import { ExportPdfModal } from './ExportPdfModal';
import { ExportImageModal } from './ExportImageModal';

export const ReportsManager: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const initialPresetRange = useMemo(() => getPresetDateRange('thisMonth'), []);
  const [presetId, setPresetId] = useState<DateRangePresetId>('thisMonth');
  const [startDate, setStartDate] = useState<string>(initialPresetRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialPresetRange.endDate);
  const [calendarMonth, setCalendarMonth] = useState<string>(initialPresetRange.startDate.substring(0, 7));
  const [modalStudentId, setModalStudentId] = useState<string | null>(null);

  const periodLabel = useMemo(() => {
    return formatRangeDisplay(startDate, endDate, presetId);
  }, [startDate, endDate, presetId]);

  const filePeriodKey = useMemo(() => {
    return getDateRangeSlug(startDate, endDate, presetId);
  }, [startDate, endDate, presetId]);

  const handleRangeChange = (newStart: string, newEnd: string, newPreset: DateRangePresetId) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    setPresetId(newPreset);
    if (newStart) {
      setCalendarMonth(newStart.substring(0, 7));
    }
  };

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

  // Filtered records matching date range and student
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      const inRange = rec.date >= startDate && rec.date <= endDate;
      const matchesStudent =
        selectedStudentId === 'all' || rec.studentId === selectedStudentId;
      return inRange && matchesStudent;
    });
  }, [allRecords, startDate, endDate, selectedStudentId]);

  // Attendance summary metrics
  const summary: AttendanceSummary = useMemo(() => {
    return calculateAttendanceSummary(filteredRecords);
  }, [filteredRecords]);

  // Selected student details if single student
  const currentStudent = students.find((s) => s.id === selectedStudentId);

  // Calendar matrix calculation for the active calendarMonth
  const calendarData = useMemo(() => {
    const [yearStr, monthStr] = calendarMonth.split('-');
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
      const dateStr = `${calendarMonth}-${String(day).padStart(2, '0')}`;
      const dayRecords = filteredRecords.filter((r) => r.date === dateStr);
      days.push({
        dayNumber: day,
        dateStr,
        records: dayRecords
      });
    }

    return days;
  }, [calendarMonth, filteredRecords]);

  // Notification state
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [imageModalFormat, setImageModalFormat] = useState<'png' | 'jpg'>('png');

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4000);
  };

  /* =========================================================================
     EXPORT TO CSV
     ========================================================================= */
  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      showNotification('No attendance records available to export for this selection.', 'error');
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
    const filename = `attendance_report_${filePeriodKey}_${studentTag}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`CSV exported successfully: ${filename}`);
  };

  /* =========================================================================
     EXPORT TO PDF (Direct Quick Export)
     ========================================================================= */
  const handleQuickPdfDownload = () => {
    if (filteredRecords.length === 0) {
      showNotification('No records available to export for this selection.', 'error');
      return;
    }

    try {
      const doc = generateAttendancePDF(
        {
          records: filteredRecords,
          students,
          summary,
          month: calendarMonth,
          startDate,
          endDate,
          periodLabel,
          selectedStudent: currentStudent,
        },
        {
          orientation: 'portrait',
          includeSummary: true,
          includeSignatures: true,
          includeRemarks: true,
        }
      );

      const savedName = downloadAttendancePDF(
        doc,
        filePeriodKey,
        currentStudent?.fullName
      );

      showNotification(`Attendance PDF exported: ${savedName}`);
    } catch (err) {
      console.error('Failed to generate quick PDF:', err);
      showNotification('Failed to generate PDF document.', 'error');
    }
  };

  /* =========================================================================
     EXPORT TO IMAGE (Quick PNG / JPG Direct Download)
     ========================================================================= */
  const handleQuickImageDownload = (format: 'png' | 'jpg') => {
    if (filteredRecords.length === 0) {
      showNotification(`No records available to export as ${format.toUpperCase()}.`, 'error');
      return;
    }

    try {
      const canvas = generateAttendanceCanvas(
        {
          records: filteredRecords,
          students,
          summary,
          month: calendarMonth,
          startDate,
          endDate,
          periodLabel,
          selectedStudent: currentStudent,
        },
        {
          format,
          theme: 'light',
          scale: 2,
          includeSummary: true,
          includeSignatures: true,
          includeRemarks: true,
        }
      );

      const savedName = downloadAttendanceImage(
        canvas,
        format,
        filePeriodKey,
        currentStudent?.fullName
      );

      showNotification(`Attendance ${format.toUpperCase()} exported: ${savedName}`);
    } catch (err) {
      console.error(`Failed to generate quick ${format.toUpperCase()}:`, err);
      showNotification(`Failed to generate ${format.toUpperCase()} image.`, 'error');
    }
  };

  /* =========================================================================
     OPEN PRINTABLE PDF MODAL
     ========================================================================= */
  const openPdfExportModal = () => {
    if (filteredRecords.length === 0) {
      showNotification('No attendance records to export for this selection.', 'error');
      return;
    }
    setIsPdfModalOpen(true);
  };

  /* =========================================================================
     OPEN IMAGE EXPORT MODAL
     ========================================================================= */
  const openImageExportModal = (format: 'png' | 'jpg' = 'png') => {
    if (filteredRecords.length === 0) {
      showNotification('No attendance records to export for this selection.', 'error');
      return;
    }
    setImageModalFormat(format);
    setIsImageModalOpen(true);
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
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-mono font-bold transition-all border ${
            notification.type === 'error'
              ? 'bg-rose-950/95 text-rose-200 border-rose-500/60'
              : notification.type === 'info'
              ? 'bg-sky-950/95 text-sky-200 border-sky-500/60'
              : 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 hover:text-white transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Export Actions */}
      <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="tag-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30 flex items-center space-x-1 font-bold">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>REPORTS & ANALYTICS</span>
              </span>
              <span className="tag-mono text-[9px] text-slate-500">SUMMARY</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-violet-400" />
              <span>Attendance Reports & Analytics</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monthly attendance reports, attendance rates, student summaries, and printable PDF export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
            <button
              onClick={exportToCSV}
              id="btn-export-csv"
              disabled={filteredRecords.length === 0}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl tag-mono text-xs font-bold bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-1.5 disabled:opacity-40 btn-tactile cursor-pointer shrink-0"
              title="Download attendance ledger as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleQuickPdfDownload}
              id="btn-quick-pdf"
              disabled={filteredRecords.length === 0}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl tag-mono text-xs font-bold bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-1.5 disabled:opacity-40 btn-tactile cursor-pointer shrink-0"
              title="Instantly download standard printable PDF"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400 shrink-0" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => handleQuickImageDownload('png')}
              id="btn-quick-png"
              disabled={filteredRecords.length === 0}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl tag-mono text-xs font-bold bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-1.5 disabled:opacity-40 btn-tactile cursor-pointer shrink-0"
              title="Instantly download high-res PNG image"
            >
              <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
              <span>PNG</span>
            </button>

            <button
              onClick={() => handleQuickImageDownload('jpg')}
              id="btn-quick-jpg"
              disabled={filteredRecords.length === 0}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl tag-mono text-xs font-bold bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-1.5 disabled:opacity-40 btn-tactile cursor-pointer shrink-0"
              title="Instantly download compact JPG image"
            >
              <FileImage className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span>JPG</span>
            </button>

            <button
              onClick={() => openImageExportModal('png')}
              id="btn-export-image"
              disabled={filteredRecords.length === 0}
              className="py-1.5 px-2.5 sm:py-2 sm:px-3.5 rounded-xl tag-mono text-xs font-bold text-sky-300 hover:text-white bg-sky-950/70 hover:bg-sky-900 border border-sky-500/40 transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer uppercase shadow-md shadow-sky-950/30 shrink-0"
              title="Customize PNG / JPG image format, theme, and copy or download"
            >
              <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
              <span>IMAGE</span>
            </button>

            <button
              onClick={openPdfExportModal}
              id="btn-export-pdf"
              disabled={filteredRecords.length === 0}
              className="glow-orb-btn py-1.5 px-3 sm:py-2 sm:px-4 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer shadow-lg shadow-violet-900/40 uppercase shrink-0"
              title="Configure orientation, sections, and print or download PDF"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>PRINT / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar with Presets & Date Range */}
      <div className="ticket-pass p-5 bg-slate-900/90 border-violet-500/20 space-y-4">
        {/* Date Range & Template Presets */}
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          presetId={presetId}
          onChangeRange={handleRangeChange}
        />

        {/* Student Scope Selector */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1">
            <Users className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="tag-mono text-xs text-slate-400 font-bold uppercase">STUDENT SCOPE:</span>
            <select
              id="report-student-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="flex-1 sm:max-w-md px-3 py-1.5 text-xs tag-mono font-bold rounded-xl border border-slate-700 bg-slate-950 text-white outline-hidden focus:border-violet-500 cursor-pointer"
            >
              <option value="all">ALL STUDENTS ({students.length} ENROLLED)</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName.toUpperCase()} {st.rollNumber ? `(${st.rollNumber})` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedStudentId !== 'all' && (
            <button
              type="button"
              onClick={() => setModalStudentId(selectedStudentId)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600 border border-violet-500/40 text-violet-200 hover:text-white tag-mono text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              title="View student report"
            >
              <FileText className="w-3.5 h-3.5 text-violet-300" />
              <span>VIEW STUDENT DOSSIER</span>
            </button>
          )}
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
          <span className="tag-mono text-slate-400 font-bold">TOTAL SESSIONS</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <span>
                Calendar: {formatMonthName(calendarMonth)}
                {currentStudent ? ` — ${currentStudent.fullName}` : ' (All Students)'}
              </span>
            </h2>

            {/* Calendar Month Navigation Buttons */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => {
                  const [yStr, mStr] = calendarMonth.split('-');
                  const d = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 2, 1);
                  setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="p-1 rounded-md bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const [yStr, mStr] = calendarMonth.split('-');
                  const d = new Date(parseInt(yStr, 10), parseInt(mStr, 10), 1);
                  setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="p-1 rounded-md bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="tag-mono text-[10px] text-violet-300 bg-violet-500/10 border border-violet-500/30 px-2.5 py-1 rounded-lg">
              Active Filter: {periodLabel}
            </span>
          </div>
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

            const isDayInRange = item.dateStr ? item.dateStr >= startDate && item.dateStr <= endDate : false;
            const hasRecords = item.records.length > 0;

            return (
              <div
                key={item.dateStr}
                className={`min-h-[72px] p-2 rounded-lg border transition flex flex-col justify-between ${
                  isDayInRange
                    ? 'ring-1 ring-violet-500/50 bg-violet-950/20 border-violet-500/40'
                    : hasRecords
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/40 border-slate-900/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs font-bold ${isDayInRange ? 'text-violet-200' : 'text-slate-400'}`}>
                    {item.dayNumber}
                  </span>
                  {hasRecords && (
                    <span className="tag-mono text-[9px] text-violet-400 font-bold">
                      {item.records.length} records
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
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold text-white uppercase tag-mono">
              Attendance Records ({filteredRecords.length})
            </h3>
            <span className="text-slate-600 text-xs">•</span>
            <span className="text-[11px] font-mono text-violet-400 font-semibold truncate max-w-xs sm:max-w-md">
              {periodLabel}
            </span>
          </div>
          {filteredRecords.length > 0 && (
            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={openPdfExportModal}
                className="tag-mono text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center space-x-1 transition cursor-pointer"
                title="Print or export current records to PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <span className="text-slate-700 text-xs">•</span>
              <button
                type="button"
                onClick={() => openImageExportModal('png')}
                className="tag-mono text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1 transition cursor-pointer"
                title="Export current records as high-res PNG image"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>PNG</span>
              </button>
              <span className="text-slate-700 text-xs">•</span>
              <button
                type="button"
                onClick={() => openImageExportModal('jpg')}
                className="tag-mono text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 transition cursor-pointer"
                title="Export current records as compact JPG image"
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>JPG</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center tag-mono text-xs text-slate-500">
            No attendance entries logged for the selected period ({periodLabel}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold text-slate-400 uppercase tag-mono">
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">STUDENT</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">TIME IN</th>
                  <th className="py-3 px-4">TIME OUT</th>
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
                      <button
                        type="button"
                        onClick={() => setModalStudentId(r.studentId)}
                        className="text-left hover:text-violet-300 hover:underline transition flex items-center space-x-1 cursor-pointer"
                        title="Click to view full student report"
                      >
                        <span>{r.studentName}</span>
                        <FileText className="w-3 h-3 text-violet-400 opacity-60 inline" />
                      </button>
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

      {/* Printable PDF Export Modal */}
      <ExportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        records={filteredRecords}
        students={students}
        summary={summary}
        month={calendarMonth}
        startDate={startDate}
        endDate={endDate}
        periodLabel={periodLabel}
        selectedStudent={currentStudent}
        onSuccessNotification={(msg) => showNotification(msg, 'success')}
        onSwitchToImage={(fmt) => {
          setIsPdfModalOpen(false);
          openImageExportModal(fmt);
        }}
      />

      {/* Image (PNG / JPG) Export Modal */}
      <ExportImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        records={filteredRecords}
        students={students}
        summary={summary}
        month={calendarMonth}
        startDate={startDate}
        endDate={endDate}
        periodLabel={periodLabel}
        selectedStudent={currentStudent}
        defaultFormat={imageModalFormat}
        onSuccessNotification={(msg) => showNotification(msg, 'success')}
      />

      {/* Single Student Report Modal */}
      {modalStudentId && (
        <StudentReportModal
          studentId={modalStudentId}
          onClose={() => setModalStudentId(null)}
        />
      )}
    </div>
  );
};
