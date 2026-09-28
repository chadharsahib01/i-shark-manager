import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Image as ImageIcon,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Users,
  CheckSquare,
  Square,
  Sparkles,
  Sun,
  Moon,
  Layers,
  FileImage
} from 'lucide-react';
import {
  ImageExportOptions,
  generateAttendanceCanvas,
  downloadAttendanceImage,
  copyAttendanceImageToClipboard,
} from '../../utils/imageExport';
import { formatMonthName } from '../../utils/pdfExport';
import { AttendanceRecord, AttendanceSummary, UserProfile } from '../../types';

interface ExportImageModalProps {
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
  defaultFormat?: 'png' | 'jpg';
  onSuccessNotification: (msg: string) => void;
}

export const ExportImageModal: React.FC<ExportImageModalProps> = ({
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
  defaultFormat = 'png',
  onSuccessNotification,
}) => {
  const [format, setFormat] = useState<'png' | 'jpg'>(defaultFormat);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeRemarks, setIncludeRemarks] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync defaultFormat when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormat(defaultFormat);
    }
  }, [isOpen, defaultFormat]);

  const displayPeriod = periodLabel || (startDate && endDate ? `${startDate} – ${endDate}` : formatMonthName(month));
  const filePeriodKey = (startDate && endDate ? `${startDate}_to_${endDate}` : month || 'report');

  // Generate image preview when options change
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      return;
    }

    try {
      const options: ImageExportOptions = {
        format,
        theme,
        scale: 1.5, // 1.5x scale for preview generation speed & quality
        includeSummary,
        includeSignatures,
        includeRemarks,
      };

      const canvas = generateAttendanceCanvas(
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

      previewCanvasRef.current = canvas;
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const url = canvas.toDataURL(mime, 0.92);
      setPreviewUrl(url);
    } catch (e) {
      console.error('Failed to generate image preview:', e);
    }
  }, [isOpen, format, theme, includeSummary, includeSignatures, includeRemarks, records, students, summary, month, startDate, endDate, periodLabel, selectedStudent, displayPeriod]);

  if (!isOpen) return null;

  const handleDownload = (chosenFormat?: 'png' | 'jpg') => {
    const fmt = chosenFormat || format;
    setGenerating(true);
    try {
      // Generate full 2x high-resolution canvas for download
      const canvas = generateAttendanceCanvas(
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
        {
          format: fmt,
          theme,
          scale: 2, // 2x Retina sharpness
          includeSummary,
          includeSignatures,
          includeRemarks,
        }
      );

      const fileName = downloadAttendanceImage(
        canvas,
        fmt,
        filePeriodKey,
        selectedStudent?.fullName
      );

      onSuccessNotification(`Exported image successfully: ${fileName}`);
      onClose();
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      const canvas = generateAttendanceCanvas(
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
        {
          format: 'png',
          theme,
          scale: 2,
          includeSummary,
          includeSignatures,
          includeRemarks,
        }
      );

      const success = await copyAttendanceImageToClipboard(canvas);
      if (success) {
        setCopied(true);
        onSuccessNotification('Report graphic copied to clipboard! You can now paste (Ctrl+V) it anywhere.');
        setTimeout(() => setCopied(false), 3000);
      } else {
        onSuccessNotification('Clipboard copy not supported by browser. Please use Download button.');
      }
    } catch (e) {
      console.error('Clipboard copy error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl liquid-glass-panel rounded-3xl shadow-2xl shadow-black/80 overflow-hidden text-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {format === 'png' ? (
                <ImageIcon className="w-5 h-5" />
              ) : (
                <FileImage className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="tag-mono text-[10px] text-sky-400 font-bold uppercase">
                  EXPORT AS {format.toUpperCase()} IMAGE
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] text-slate-400 font-mono">HIGH-RESOLUTION GRAPHIC</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Attendance Report Image Export
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
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Metadata preview ribbon */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="block tag-mono text-[9px] text-slate-500 font-bold">REPORT PERIOD</span>
              <span className="font-semibold text-white flex items-center space-x-1 mt-0.5 truncate" title={displayPeriod}>
                <Calendar className="w-3.5 h-3.5 text-sky-400 inline shrink-0" />
                <span className="truncate">{displayPeriod}</span>
              </span>
            </div>
            <div>
              <span className="block tag-mono text-[9px] text-slate-500 font-bold">TARGET SCOPE</span>
              <span className="font-semibold text-white flex items-center space-x-1 mt-0.5 truncate">
                <Users className="w-3.5 h-3.5 text-sky-400 inline shrink-0" />
                <span className="truncate">
                  {selectedStudent ? selectedStudent.fullName : `All Students (${students.length})`}
                </span>
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block tag-mono text-[9px] text-slate-500 font-bold">RECORDS</span>
              <span className="font-semibold text-emerald-400 flex items-center space-x-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 inline" />
                <span>{records.length} sessions ({summary.percentage}%)</span>
              </span>
            </div>
          </div>

          {/* Format Selector: PNG vs JPG */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 tag-mono">
              Image Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  format === 'png'
                    ? 'bg-sky-500/15 border-sky-400 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono">PNG</span>
                    <span>Lossless Format</span>
                  </span>
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Maximum sharpness for text & tables. Ideal for digital sharing, slides, and archiving.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormat('jpg')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  format === 'jpg'
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">JPG</span>
                    <span>Compact Photo</span>
                  </span>
                  <FileImage className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Compressed high-quality JPEG. Smaller file size, perfect for emails and messaging apps.
                </p>
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 tag-mono">
              Visual Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-violet-600/15 border-violet-400 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase flex items-center space-x-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Printable Light</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Crisp white background with formal institutional borders. Matches printed paperwork.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-violet-600/15 border-violet-400 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase flex items-center space-x-1.5">
                    <Moon className="w-3.5 h-3.5 text-violet-400" />
                    <span>Cyber Dark Slate</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sleek dark theme. Striking visuals when posted to social media or messaging platforms.
                </p>
              </button>
            </div>
          </div>

          {/* Document Content Options */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 tag-mono">
              Included Sections
            </label>
            <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setIncludeSummary(!includeSummary)}
                className="w-full flex items-center justify-between text-xs text-left cursor-pointer p-1.5 rounded hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center space-x-2.5">
                  {includeSummary ? (
                    <CheckSquare className="w-4 h-4 text-sky-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">Executive Summary Cards</span>
                    <p className="text-[10px] text-slate-400">
                      Total classes, present, late, absent, and percentage cards
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
                    <CheckSquare className="w-4 h-4 text-sky-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">Signatures & Institutional Seal</span>
                    <p className="text-[10px] text-slate-400">
                      Attendance In-Charge, Academic Coordinator, and Seal blocks
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
                    <CheckSquare className="w-4 h-4 text-sky-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">Notes & Remarks Column</span>
                    <p className="text-[10px] text-slate-400">
                      Display session notes and admin remarks in ledger
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Live Preview Card */}
          {previewUrl && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 tag-mono flex items-center justify-between">
                <span>Live Graphic Preview</span>
                <span className="text-[10px] text-slate-500 font-mono">1200px width @ 2x Crisp</span>
              </label>
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 max-h-48 overflow-y-auto">
                <img
                  src={previewUrl}
                  alt="Attendance Report Preview"
                  className="w-full h-auto rounded shadow-lg object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
              title="Copy image to clipboard to paste directly in chats or docs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-sky-400" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDownload('png')}
              disabled={generating}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 border border-sky-400/30 flex items-center space-x-1.5 transition cursor-pointer shadow-lg shadow-sky-950/50"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('jpg')}
              disabled={generating}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 border border-amber-400/30 flex items-center space-x-1.5 transition cursor-pointer shadow-lg shadow-amber-950/50"
            >
              <Download className="w-4 h-4" />
              <span>Download JPG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
