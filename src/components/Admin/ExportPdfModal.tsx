import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  Calendar,
  Users,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';
import {
  PDFExportOptions,
  generateAttendancePDF,
  printPDFDocument,
  downloadAttendancePDF,
  formatMonthName,
} from '../../utils/pdfExport';
import { AttendanceRecord, AttendanceSummary, UserProfile } from '../../types';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  students: UserProfile[];
  summary: AttendanceSummary;
  month?: string;
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
  selectedStudent?: UserProfile;
  onSuccessNotification: (msg: string) => void;
  onSwitchToImage?: (format: 'png' | 'jpg') => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  records,
  students,
  summary,
  month = '',
  startDate,
  endDate,
  periodLabel,
  selectedStudent,
  onSuccessNotification,
  onSwitchToImage,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeRemarks, setIncludeRemarks] = useState(true);
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setGenerating(true);
    try {
      const options: PDFExportOptions = {
        orientation,
        includeSummary,
        includeSignatures,
        includeRemarks,
      };

      const displayPeriod = periodLabel || (startDate && endDate ? `${startDate} – ${endDate}` : formatMonthName(month));
      const filePeriodKey = (startDate && endDate ? `${startDate}_to_${endDate}` : month || 'report');

      const doc = generateAttendancePDF(
        {
          records,
          students,
          summary,
          month,
          startDate,
          endDate,
          periodLabel: displayPeriod,
          selectedStudent,
        },
        options
      );

      const fileName = downloadAttendancePDF(
        doc,
        filePeriodKey,
        selectedStudent?.fullName
      );

      onSuccessNotification(`Downloaded ${fileName} successfully!`);
      onClose();
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    setGenerating(true);
    try {
      const options: PDFExportOptions = {
        orientation,
        includeSummary,
        includeSignatures,
        includeRemarks,
      };

      const displayPeriod = periodLabel || (startDate && endDate ? `${startDate} – ${endDate}` : formatMonthName(month));

      const doc = generateAttendancePDF(
        {
          records,
          students,
          summary,
          month,
          startDate,
          endDate,
          periodLabel: displayPeriod,
          selectedStudent,
        },
        options
      );

      printPDFDocument(doc);
      onSuccessNotification('Print dialog initiated.');
      onClose();
    } catch (err) {
      console.error('Failed to trigger print:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-violet-500/30 rounded-2xl shadow-2xl shadow-violet-950/50 overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="tag-mono text-[10px] text-violet-400 font-bold">EXPORT TO PDF</span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] text-slate-400 font-mono">PRINT READY</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Attendance Report PDF Export
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Metadata preview ribbon */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="block tag-mono text-[9px] text-slate-500 font-bold">REPORT PERIOD</span>
              <span className="font-semibold text-white flex items-center space-x-1 mt-0.5 truncate" title={periodLabel || (startDate && endDate ? `${startDate} – ${endDate}` : formatMonthName(month))}>
                <Calendar className="w-3.5 h-3.5 text-violet-400 inline shrink-0" />
                <span className="truncate">{periodLabel || (startDate && endDate ? `${startDate} – ${endDate}` : formatMonthName(month))}</span>
              </span>
            </div>
            <div>
              <span className="block tag-mono text-[9px] text-slate-500 font-bold">SCOPE</span>
              <span className="font-semibold text-white flex items-center space-x-1 mt-0.5 truncate">
                <Users className="w-3.5 h-3.5 text-violet-400 inline shrink-0" />
                <span className="truncate">
                  {selectedStudent ? selectedStudent.fullName : `All Students (${students.length})`}
                </span>
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block tag-mono text-[9px] text-slate-500 font-bold">RECORDS COUNT</span>
              <span className="font-semibold text-emerald-400 flex items-center space-x-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 inline" />
                <span>{records.length} sessions ({summary.percentage}%)</span>
              </span>
            </div>
          </div>

          {/* Orientation Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 tag-mono">
              Page Orientation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-violet-600/15 border-violet-500 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase">Portrait</span>
                  <div className="w-4 h-6 border-2 border-current rounded-xs opacity-75" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Vertical format. Best for standard physical printing and student binders.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-violet-600/15 border-violet-500 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase">Landscape</span>
                  <div className="w-6 h-4 border-2 border-current rounded-xs opacity-75" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Horizontal format. Expanded width for in/out times and notes.
                </p>
              </button>
            </div>
          </div>

          {/* Document Content Options */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 tag-mono">
              Document Sections
            </label>
            <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setIncludeSummary(!includeSummary)}
                className="w-full flex items-center justify-between text-xs text-left cursor-pointer p-1.5 rounded hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center space-x-2.5">
                  {includeSummary ? (
                    <CheckSquare className="w-4 h-4 text-violet-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">Include Executive Summary</span>
                    <p className="text-[10px] text-slate-400">
                      Attendance rate %, present/late/absent breakdown cards at the top
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeSignatures(!includeSignatures)}
                className="w-full flex items-center justify-between text-xs text-left cursor-pointer p-1.5 rounded hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center space-x-2.5">
                  {includeSignatures ? (
                    <CheckSquare className="w-4 h-4 text-violet-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">Include Institutional Signatures</span>
                    <p className="text-[10px] text-slate-400">
                      Faculty, Attendance Officer, and Principal sign-off blocks
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeRemarks(!includeRemarks)}
                className="w-full flex items-center justify-between text-xs text-left cursor-pointer p-1.5 rounded hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center space-x-2.5">
                  {includeRemarks ? (
                    <CheckSquare className="w-4 h-4 text-violet-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">Include Remarks / Notes Column</span>
                    <p className="text-[10px] text-slate-400">
                      Display teacher remarks and excuse notes in the ledger
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>

            {onSwitchToImage && (
              <button
                type="button"
                onClick={() => onSwitchToImage('png')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1.5 transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Switch to PNG/JPG Image</span>
              </button>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={generating || records.length === 0}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold tag-mono text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-40"
            >
              <Printer className="w-4 h-4 text-violet-400" />
              <span>PRINT REPORT</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={generating || records.length === 0}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold tag-mono text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-violet-900/40 disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
