import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Percent,
  Sparkles,
  BookOpen,
  Hash,
  Mail,
  Phone,
  CheckSquare,
  RefreshCw,
  Printer,
  Image as ImageIcon,
  FileImage
} from 'lucide-react';
import { SingleStudentReportData } from '../types';
import { getSingleStudentReport, calculateAttendanceSummary } from '../services/firestoreService';
import {
  generateAttendancePDF,
  downloadAttendancePDF,
} from '../utils/pdfExport';
import {
  generateAttendanceCanvas,
  downloadAttendanceImage,
} from '../utils/imageExport';
import {
  DateRangePresetId,
  getPresetDateRange,
  formatRangeDisplay,
  getDateRangeSlug,
} from '../utils/datePresets';
import { DateRangeFilter } from './Admin/DateRangeFilter';

interface StudentReportModalProps {
  studentId: string | null;
  onClose: () => void;
}

export const StudentReportModal: React.FC<StudentReportModalProps> = ({
  studentId,
  onClose
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [report, setReport] = useState<SingleStudentReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Date Range Filter States
  const initialPreset = React.useMemo(() => getPresetDateRange('allTime'), []);
  const [presetId, setPresetId] = useState<DateRangePresetId>('allTime');
  const [startDate, setStartDate] = useState<string>(initialPreset.startDate);
  const [endDate, setEndDate] = useState<string>(initialPreset.endDate);

  const filteredHistory = React.useMemo(() => {
    if (!report) return [];
    return report.attendanceHistory.filter((rec) => {
      return rec.date >= startDate && rec.date <= endDate;
    });
  }, [report, startDate, endDate]);

  const activeSummary = React.useMemo(() => {
    return calculateAttendanceSummary(filteredHistory);
  }, [filteredHistory]);

  const periodLabel = React.useMemo(() => {
    return formatRangeDisplay(startDate, endDate, presetId);
  }, [startDate, endDate, presetId]);

  const filePeriodSlug = React.useMemo(() => {
    return getDateRangeSlug(startDate, endDate, presetId);
  }, [startDate, endDate, presetId]);

  useEffect(() => {
    if (!studentId) {
      setReport(null);
      return;
    }

    let isMounted = true;
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSingleStudentReport(studentId);
        if (isMounted) {
          setReport(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to generate student report.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  if (!studentId) return null;

  const handleExportCSV = () => {
    if (!report) return;
    const { student } = report;

    const rows: string[][] = [
      ['I-SHARK INSTITUTE - STUDENT ATTENDANCE & ACADEMIC REPORT'],
      ['Generated On', new Date().toLocaleString()],
      ['Date Range / Period', periodLabel],
      ['Student Name', student.fullName || student.name],
      ['Email', student.email],
      ['Roll Number', student.rollNumber || 'N/A'],
      ['Batch', student.batch || 'N/A'],
      ['Status', student.active ? 'ACTIVE' : 'INACTIVE'],
      [''],
      ['ATTENDANCE SUMMARY (FILTERED PERIOD)'],
      ['Total Sessions Recorded', activeSummary.total.toString()],
      ['Present', activeSummary.present.toString()],
      ['Late', activeSummary.late.toString()],
      ['Absent', activeSummary.absent.toString()],
      ['Leave / Excused', activeSummary.leave.toString()],
      ['Attendance Rate', `${activeSummary.percentage}%`],
      [''],
      ['DETAILED ATTENDANCE LOG'],
      ['Date', 'Status', 'In Time', 'Out Time', 'Notes']
    ];

    filteredHistory.forEach((rec) => {
      rows.push([
        rec.date,
        rec.status,
        rec.inTime || '—',
        rec.outTime || '—',
        rec.notes ? `"${rec.notes.replace(/"/g, '""')}"` : '—'
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeName = (student.fullName || student.name || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `Student_Report_${safeName}_${filePeriodSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!report) return;
    const doc = generateAttendancePDF(
      {
        records: filteredHistory,
        students: [report.student],
        summary: activeSummary,
        startDate,
        endDate,
        periodLabel,
        month: startDate.substring(0, 7),
        selectedStudent: report.student,
      },
      {
        orientation: 'portrait',
        includeSummary: true,
        includeSignatures: true,
        includeRemarks: true,
      }
    );
    downloadAttendancePDF(doc, filePeriodSlug, report.student.fullName || report.student.name);
  };

  const handleExportImage = (format: 'png' | 'jpg') => {
    if (!report) return;
    const canvas = generateAttendanceCanvas(
      {
        records: filteredHistory,
        students: [report.student],
        summary: activeSummary,
        startDate,
        endDate,
        periodLabel,
        month: startDate.substring(0, 7),
        selectedStudent: report.student,
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
    downloadAttendanceImage(
      canvas,
      format,
      filePeriodSlug,
      report.student.fullName || report.student.name
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const getAttendanceBadge = (pct: number | string) => {
    if (pct === '—' || typeof pct !== 'number') {
      return { label: 'NO DATA', color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
    if (pct >= 80) {
      return { label: 'EXCELLENT ATTENDANCE', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    if (pct >= 75) {
      return { label: 'GOOD STANDING (≥75%)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    if (pct >= 65) {
      return { label: 'ATTENDANCE WARNING', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
    return { label: 'LOW ATTENDANCE (<65%)', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-violet-500/30 rounded-2xl shadow-2xl shadow-violet-950/40 my-8 overflow-hidden text-slate-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="tag-mono text-xs text-violet-400">STUDENT REPORT</span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs text-slate-400 font-mono">ID: {studentId}</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {report ? report.student.fullName || report.student.name : 'Student Academic & Attendance Report'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {report && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center space-x-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 hover:border-violet-500/50 transition-all shadow-xs cursor-pointer shrink-0"
                  title="Download complete attendance log as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden xs:inline sm:inline">CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="inline-flex items-center space-x-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold border border-violet-400/40 transition-all shadow-xs cursor-pointer shrink-0"
                  title="Download printable PDF report"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline sm:inline">PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportImage('png')}
                  className="inline-flex items-center space-x-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 text-xs font-mono font-bold border border-sky-500/40 transition-all shadow-xs cursor-pointer shrink-0"
                  title="Download high-resolution PNG image"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="hidden xs:inline sm:inline">PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportImage('jpg')}
                  className="inline-flex items-center space-x-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs font-mono font-bold border border-amber-500/40 transition-all shadow-xs cursor-pointer shrink-0"
                  title="Download compact JPG image"
                >
                  <FileImage className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden xs:inline sm:inline">JPG</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center space-x-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 hover:border-violet-500/50 transition-all shadow-xs cursor-pointer shrink-0"
                  title="Print Report"
                >
                  <Printer className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="hidden sm:inline">PRINT</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="font-mono text-sm text-slate-400 tracking-wider">LOADING STUDENT REPORT...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {report && !loading && (
            <>
              {/* Profile Card Banner */}
              <div className="relative rounded-xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-slate-900 border border-violet-500/20 p-5 overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-64 bg-radial from-violet-500/10 to-transparent pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black text-white font-sans tracking-tight">
                        {report.student.fullName || report.student.name}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${
                        report.student.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {report.student.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {(() => {
                        const b = getAttendanceBadge(report.summary.percentage);
                        return (
                          <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${b.color}`}>
                            {b.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-400 pt-1">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-violet-400" />
                        <span className="truncate">{report.student.email}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Hash className="w-3.5 h-3.5 text-violet-400" />
                        <span>ROLL: <strong className="text-slate-200">{report.student.rollNumber || 'NOT SET'}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                        <span>BATCH: <strong className="text-slate-200">{report.student.batch || 'DEFAULT'}</strong></span>
                      </div>
                      {report.student.phone && (
                        <div className="flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-violet-400" />
                          <span>PHONE: <strong className="text-slate-200">{report.student.phone}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Attendance Rate</span>
                    <span className="text-3xl font-black text-violet-400 font-mono tracking-tight">
                      {activeSummary.percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Date Filter & Presets for Student Dossier */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  presetId={presetId}
                  onChangeRange={(s, e, p) => {
                    setStartDate(s);
                    setEndDate(e);
                    setPresetId(p);
                  }}
                />
              </div>

              {/* Attendance Quick Stats */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Attendance Overview</span>
                  </h4>
                  <span className="tag-mono text-[10px] text-violet-300">
                    Period: {periodLabel}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="block text-[11px] font-mono text-slate-400 uppercase">Total Sessions</span>
                    <span className="text-xl font-bold font-mono text-white mt-1 block">{activeSummary.total}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="block text-[11px] font-mono text-emerald-400 uppercase flex items-center justify-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Present</span>
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-300 mt-1 block">{activeSummary.present}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="block text-[11px] font-mono text-amber-400 uppercase flex items-center justify-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Late</span>
                    </span>
                    <span className="text-xl font-bold font-mono text-amber-300 mt-1 block">{activeSummary.late}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="block text-[11px] font-mono text-rose-400 uppercase flex items-center justify-center space-x-1">
                      <XCircle className="w-3 h-3" />
                      <span>Absent</span>
                    </span>
                    <span className="text-xl font-bold font-mono text-rose-300 mt-1 block">{activeSummary.absent}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center col-span-2 sm:col-span-1">
                    <span className="block text-[11px] font-mono text-indigo-400 uppercase flex items-center justify-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Leave</span>
                    </span>
                    <span className="text-xl font-bold font-mono text-indigo-300 mt-1 block">{activeSummary.leave}</span>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  <span>Monthly Attendance Summary</span>
                </h4>

                {report.monthlyMetrics.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                    No attendance records logged for this student yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4">Month</th>
                          <th className="py-2.5 px-3 text-center">Total</th>
                          <th className="py-2.5 px-3 text-center text-emerald-400">Present</th>
                          <th className="py-2.5 px-3 text-center text-amber-400">Late</th>
                          <th className="py-2.5 px-3 text-center text-rose-400">Absent</th>
                          <th className="py-2.5 px-3 text-center text-indigo-400">Leave</th>
                          <th className="py-2.5 px-4 text-right">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                        {report.monthlyMetrics.map((m) => (
                          <tr key={m.month} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-white">{m.monthName}</td>
                            <td className="py-2.5 px-3 text-center text-slate-300">{m.total}</td>
                            <td className="py-2.5 px-3 text-center text-emerald-300">{m.present}</td>
                            <td className="py-2.5 px-3 text-center text-amber-300">{m.late}</td>
                            <td className="py-2.5 px-3 text-center text-rose-300">{m.absent}</td>
                            <td className="py-2.5 px-3 text-center text-indigo-300">{m.leave}</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                typeof m.percentage === 'number' && m.percentage >= 75
                                   ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {m.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tasks & Tests Assignments Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Assigned Tasks */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center space-x-2">
                      <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                      <span>Assignments & Tasks ({report.tasks.length})</span>
                    </span>
                  </div>

                  {report.tasks.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center font-mono">No tasks currently assigned.</p>
                  ) : (
                    <div className="space-y-2 overflow-y-auto max-h-40 pr-1">
                      {report.tasks.map((task) => (
                        <div key={task.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200 truncate mr-2">{task.title}</span>
                          <span className="font-mono text-[10px] text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-800/40 shrink-0">
                            DUE: {task.dueDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheduled Tests & Quizzes */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center space-x-2">
                      <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                      <span>Tests & Examinations ({report.tests.length})</span>
                    </span>
                  </div>

                  {report.tests.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center font-mono">No tests scheduled.</p>
                  ) : (
                    <div className="space-y-2 overflow-y-auto max-h-40 pr-1">
                      {report.tests.map((test) => (
                        <div key={test.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="truncate mr-2">
                            <span className="font-medium text-slate-200 block truncate">{test.title}</span>
                            <span className="text-[10px] text-slate-400">{test.subject} • {test.type}</span>
                          </div>
                          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
                            {test.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Log History (Last 15 records) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    <span>Attendance Records ({filteredHistory.length})</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Filtered by: {periodLabel}
                  </span>
                </div>

                {filteredHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6 font-mono">
                    No attendance entries recorded for this student in {periodLabel}.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">In / Out</th>
                          <th className="py-2.5 px-4">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                        {filteredHistory.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2 px-4 text-slate-300 font-bold">{rec.date}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rec.status === 'Present'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : rec.status === 'Late'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : rec.status === 'Leave'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[11px]">
                              {rec.inTime || '—'} {rec.outTime ? `/ ${rec.outTime}` : ''}
                            </td>
                            <td className="py-2 px-4 text-slate-400 truncate max-w-xs font-sans text-xs">
                              {rec.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <span className="text-[11px] font-mono text-slate-500">
            I-SHARK Academic Management System
          </span>
          <div className="flex items-center space-x-3">
            {report && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="sm:hidden px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-mono font-bold border border-slate-700"
              >
                CSV
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
