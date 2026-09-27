import { AttendanceRecord, AttendanceSummary, UserProfile } from '../types';
import { formatMonthName } from './pdfExport';

export interface ImageExportOptions {
  format?: 'png' | 'jpg';
  theme?: 'light' | 'dark';
  scale?: number; // Device pixel ratio multiplier, default 2 for Retina/print sharpness
  includeSummary?: boolean;
  includeSignatures?: boolean;
  includeRemarks?: boolean;
  institutionName?: string;
  departmentName?: string;
  maxRecords?: number;
}

export interface AttendanceReportImageData {
  records: AttendanceRecord[];
  students: UserProfile[];
  summary: AttendanceSummary;
  month?: string; // YYYY-MM
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
  selectedStudent?: UserProfile;
}

/**
 * Draws rounded rectangle helper
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor?: string,
  strokeColor?: string,
  lineWidth: number = 1
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Generates an HTML5 Canvas element rendering a high-resolution,
 * professionally formatted Attendance Report graphic.
 */
export function generateAttendanceCanvas(
  data: AttendanceReportImageData,
  options: ImageExportOptions = {}
): HTMLCanvasElement {
  const {
    theme = 'light',
    scale = 2,
    includeSummary = true,
    includeSignatures = true,
    includeRemarks = true,
    institutionName = 'I-SHARK INSTITUTE OF COMPUTER TECHNOLOGIES',
    departmentName = 'DEPARTMENT OF ACADEMIC MONITORING & ATTENDANCE AUDIT',
    maxRecords,
  } = options;

  const { records, summary, month, selectedStudent } = data;
  const displayRecords = maxRecords ? records.slice(0, maxRecords) : records;

  const isDark = theme === 'dark';

  // Palette definitions
  const colors = {
    bg: isDark ? '#090d16' : '#ffffff',
    cardBg: isDark ? '#111827' : '#f8fafc',
    cardBorder: isDark ? '#1f293d' : '#e2e8f0',
    primary: isDark ? '#8b5cf6' : '#6d28d9',
    primaryBg: isDark ? '#8b5cf620' : '#ede9fe',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#1e293b' : '#e2e8f0',
    tableHeaderBg: isDark ? '#131b2e' : '#f1f5f9',
    tableRowEven: isDark ? '#0c1322' : '#ffffff',
    tableRowOdd: isDark ? '#0f172a' : '#f8fafc',
    tableRowHover: isDark ? '#1e293b' : '#f1f5f9',
    accentLine: isDark ? '#7c3aed' : '#4f46e5',
    statusPresentBg: isDark ? '#064e3b' : '#dcfce7',
    statusPresentText: isDark ? '#34d399' : '#15803d',
    statusLateBg: isDark ? '#78350f' : '#fef3c7',
    statusLateText: isDark ? '#fbbf24' : '#b45309',
    statusAbsentBg: isDark ? '#7f1d1d' : '#fee2e2',
    statusAbsentText: isDark ? '#f87171' : '#b91c1c',
    statusLeaveBg: isDark ? '#0c4a6e' : '#e0f2fe',
    statusLeaveText: isDark ? '#38bdf8' : '#0369a1',
  };

  // Canvas geometry layout (logical CSS pixels)
  const canvasWidth = 1200;
  const paddingX = 48;
  const contentWidth = canvasWidth - paddingX * 2;

  // Calculate dynamic heights
  const headerHeight = 160;
  const infoBarHeight = 70;
  const summaryBoxHeight = includeSummary ? 110 : 0;
  const tableHeaderHeight = 44;
  const rowHeight = 38;
  const tableDataHeight = Math.max(displayRecords.length * rowHeight, rowHeight); // at least 1 row
  const signatureHeight = includeSignatures ? 140 : 0;
  const footerHeight = 70;
  const verticalSpacing = 24;

  const totalHeight =
    headerHeight +
    infoBarHeight +
    summaryBoxHeight +
    tableHeaderHeight +
    tableDataHeight +
    signatureHeight +
    footerHeight +
    verticalSpacing * 6;

  // Create canvas with 2x resolution for ultra-sharp typography
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not supported in this environment.');
  }

  // Scale all drawing operations
  ctx.scale(scale, scale);

  // 1. Draw solid background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvasWidth, totalHeight);

  // Subtle decorative top accent bar
  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
  gradient.addColorStop(0, '#6366f1');
  gradient.addColorStop(0.5, '#8b5cf6');
  gradient.addColorStop(1, '#ec4899');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, 6);

  let currentY = 32;

  // 2. Institutional Header
  // Logo / Crest Box
  drawRoundedRect(
    ctx,
    paddingX,
    currentY,
    64,
    64,
    14,
    colors.primaryBg,
    colors.primary,
    1.5
  );

  // Crest graphic icon: stylized graduation cap / shield
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', paddingX + 32, currentY + 32);

  // Institutional Title
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colors.textMain;
  ctx.font = '900 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(institutionName, paddingX + 80, currentY + 24);

  // Department Subtitle
  ctx.fillStyle = colors.textMuted;
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(departmentName, paddingX + 80, currentY + 42);

  // Report Document Badge
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 12px monospace';
  ctx.fillText(
    'OFFICIAL ATTENDANCE REPORT & AUDIT LEDGER',
    paddingX + 80,
    currentY + 58
  );

  // Document reference pill (Right-aligned)
  const nowFormatted = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const docRefPeriod = (data.startDate || month || 'ALL').replace(/[^a-zA-Z0-9]/g, '');
  const refCode = `DOC-ATT-${docRefPeriod}-${(selectedStudent?.rollNumber || 'ALL').toUpperCase()}`;

  drawRoundedRect(
    ctx,
    canvasWidth - paddingX - 250,
    currentY + 6,
    250,
    52,
    10,
    colors.cardBg,
    colors.cardBorder,
    1
  );

  ctx.fillStyle = colors.textMuted;
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('DOCUMENT REF:', canvasWidth - paddingX - 16, currentY + 24);
  ctx.fillStyle = colors.textMain;
  ctx.font = 'bold 11px monospace';
  ctx.fillText(refCode, canvasWidth - paddingX - 16, currentY + 38);
  ctx.fillStyle = colors.textMuted;
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText(`Generated: ${nowFormatted}`, canvasWidth - paddingX - 16, currentY + 50);

  currentY += 84;

  // Thin dividing line
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, currentY);
  ctx.lineTo(canvasWidth - paddingX, currentY);
  ctx.stroke();

  currentY += 18;

  // 3. Metadata Ribbon (Report Month, Student/Scope, Rate, Status)
  drawRoundedRect(
    ctx,
    paddingX,
    currentY,
    contentWidth,
    infoBarHeight,
    12,
    colors.cardBg,
    colors.cardBorder,
    1
  );

  const colWidth = contentWidth / 4;

  // Box 1: Period
  const formattedPeriod =
    data.periodLabel ||
    (data.startDate && data.endDate
      ? `${data.startDate} to ${data.endDate}`
      : formatMonthName(month || ''));

  ctx.textAlign = 'left';
  ctx.fillStyle = colors.textMuted;
  ctx.font = 'bold 10px monospace';
  ctx.fillText('REPORTING PERIOD', paddingX + 20, currentY + 28);
  ctx.fillStyle = colors.textMain;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(formattedPeriod.slice(0, 32), paddingX + 20, currentY + 52);

  // Box 2: Scope / Student
  ctx.fillStyle = colors.textMuted;
  ctx.font = 'bold 10px monospace';
  ctx.fillText('STUDENT SCOPE', paddingX + colWidth + 20, currentY + 28);
  ctx.fillStyle = colors.textMain;
  ctx.font = 'bold 15px system-ui, sans-serif';
  const scopeLabel = selectedStudent
    ? `${selectedStudent.fullName} (${selectedStudent.rollNumber || 'N/A'})`
    : 'All Enrolled Students';
  ctx.fillText(scopeLabel, paddingX + colWidth + 20, currentY + 52);

  // Box 3: Total Recorded
  ctx.fillStyle = colors.textMuted;
  ctx.font = 'bold 10px monospace';
  ctx.fillText('TOTAL SESSIONS', paddingX + colWidth * 2 + 20, currentY + 28);
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`${summary.total} Sessions Logged`, paddingX + colWidth * 2 + 20, currentY + 52);

  // Box 4: Attendance Rate
  ctx.fillStyle = colors.textMuted;
  ctx.font = 'bold 10px monospace';
  ctx.fillText('OVERALL RATE', paddingX + colWidth * 3 + 20, currentY + 28);
  ctx.fillStyle =
    typeof summary.percentage === 'number' && summary.percentage >= 75
      ? colors.statusPresentText
      : colors.statusAbsentText;
  ctx.font = '900 18px monospace';
  ctx.fillText(`${summary.percentage}%`, paddingX + colWidth * 3 + 20, currentY + 52);

  currentY += infoBarHeight + 20;

  // 4. Executive Summary KPI Cards
  if (includeSummary) {
    const cardGap = 16;
    const cardCount = 5;
    const cardW = (contentWidth - cardGap * (cardCount - 1)) / cardCount;
    const cardH = 86;

    const cards = [
      {
        label: 'TOTAL CLASSES',
        val: summary.total,
        color: colors.textMain,
        border: colors.cardBorder,
        bg: colors.cardBg,
      },
      {
        label: 'PRESENT',
        val: summary.present,
        color: colors.statusPresentText,
        border: isDark ? '#065f46' : '#bbf7d0',
        bg: colors.statusPresentBg,
      },
      {
        label: 'LATE',
        val: summary.late,
        color: colors.statusLateText,
        border: isDark ? '#92400e' : '#fde68a',
        bg: colors.statusLateBg,
      },
      {
        label: 'ABSENT',
        val: summary.absent,
        color: colors.statusAbsentText,
        border: isDark ? '#991b1b' : '#fecaca',
        bg: colors.statusAbsentBg,
      },
      {
        label: 'LEAVE / EXCUSED',
        val: summary.leave,
        color: colors.statusLeaveText,
        border: isDark ? '#075985' : '#bae6fd',
        bg: colors.statusLeaveBg,
      },
    ];

    cards.forEach((card, idx) => {
      const cX = paddingX + idx * (cardW + cardGap);
      drawRoundedRect(ctx, cX, currentY, cardW, cardH, 12, card.bg, card.border, 1.5);

      ctx.fillStyle = card.color;
      ctx.font = '900 28px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(card.val.toString(), cX + 18, currentY + 42);

      ctx.fillStyle = colors.textMuted;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(card.label, cX + 18, currentY + 66);
    });

    currentY += cardH + 24;
  }

  // 5. Attendance Ledger Table
  // Table column specifications
  interface ImgColumn {
    key: string;
    label: string;
    width: number;
    align: 'left' | 'center' | 'right';
  }

  const columns: ImgColumn[] = [
    { key: 'index', label: '#', width: 50, align: 'center' },
    { key: 'date', label: 'DATE', width: 130, align: 'center' },
    { key: 'student', label: 'STUDENT NAME', width: 260, align: 'left' },
    { key: 'roll', label: 'ROLL NO', width: 120, align: 'center' },
    { key: 'status', label: 'STATUS', width: 130, align: 'center' },
    { key: 'inOut', label: 'TIME IN / OUT', width: 160, align: 'center' },
    {
      key: 'notes',
      label: 'NOTES / REMARKS',
      width: includeRemarks ? 0 : 0,
      align: 'left',
    },
  ];

  // Distribute remaining space to Remarks
  const fixedWidth = columns.slice(0, 6).reduce((acc, c) => acc + c.width, 0);
  columns[6].width = Math.max(contentWidth - fixedWidth, 200);

  // Draw Table Header
  drawRoundedRect(
    ctx,
    paddingX,
    currentY,
    contentWidth,
    tableHeaderHeight,
    8,
    colors.tableHeaderBg,
    colors.border,
    1
  );

  let colX = paddingX;
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = colors.textMuted;

  columns.forEach((col) => {
    ctx.textAlign = col.align;
    const textX =
      col.align === 'center'
        ? colX + col.width / 2
        : col.align === 'right'
        ? colX + col.width - 16
        : colX + 16;
    ctx.fillText(col.label, textX, currentY + 27);
    colX += col.width;
  });

  currentY += tableHeaderHeight + 2;

  // Draw Table Rows
  if (displayRecords.length === 0) {
    drawRoundedRect(
      ctx,
      paddingX,
      currentY,
      contentWidth,
      rowHeight * 2,
      8,
      colors.tableRowOdd,
      colors.border,
      1
    );
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.textMuted;
    ctx.font = 'italic 12px system-ui, sans-serif';
    ctx.fillText(
      'No attendance records found for this period and selection.',
      canvasWidth / 2,
      currentY + 44
    );
    currentY += rowHeight * 2 + 16;
  } else {
    displayRecords.forEach((record, index) => {
      const isEven = index % 2 === 0;
      const rowBg = isEven ? colors.tableRowEven : colors.tableRowOdd;

      // Row background
      ctx.fillStyle = rowBg;
      ctx.fillRect(paddingX, currentY, contentWidth, rowHeight);

      // Subtle bottom divider
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(paddingX, currentY + rowHeight);
      ctx.lineTo(paddingX + contentWidth, currentY + rowHeight);
      ctx.stroke();

      let cellX = paddingX;

      // Col 1: Index
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.textMuted;
      ctx.font = '10px monospace';
      ctx.fillText((index + 1).toString(), cellX + columns[0].width / 2, currentY + 23);
      cellX += columns[0].width;

      // Col 2: Date
      ctx.fillStyle = colors.textMain;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(record.date, cellX + columns[1].width / 2, currentY + 23);
      cellX += columns[1].width;

      // Col 3: Student Name
      ctx.textAlign = 'left';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillStyle = colors.textMain;
      const sName = record.studentName || selectedStudent?.fullName || 'Student';
      ctx.fillText(sName, cellX + 16, currentY + 23);
      cellX += columns[2].width;

      // Col 4: Roll No
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.textMuted;
      ctx.font = 'bold 11px monospace';
      const studentObj = data.students.find((s) => s.id === record.studentId);
      const roll = studentObj?.rollNumber || selectedStudent?.rollNumber || '—';
      ctx.fillText(roll, cellX + columns[3].width / 2, currentY + 23);
      cellX += columns[3].width;

      // Col 5: Status Pill
      const statusPillW = 84;
      const statusPillH = 22;
      const statusX = cellX + (columns[4].width - statusPillW) / 2;
      const statusY = currentY + (rowHeight - statusPillH) / 2;

      let pillBg = colors.cardBg;
      let pillText = colors.textMain;

      switch (record.status) {
        case 'Present':
          pillBg = colors.statusPresentBg;
          pillText = colors.statusPresentText;
          break;
        case 'Late':
          pillBg = colors.statusLateBg;
          pillText = colors.statusLateText;
          break;
        case 'Absent':
          pillBg = colors.statusAbsentBg;
          pillText = colors.statusAbsentText;
          break;
        case 'Leave':
          pillBg = colors.statusLeaveBg;
          pillText = colors.statusLeaveText;
          break;
      }

      drawRoundedRect(ctx, statusX, statusY, statusPillW, statusPillH, 6, pillBg);
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = pillText;
      ctx.fillText(record.status.toUpperCase(), statusX + statusPillW / 2, statusY + 15);
      cellX += columns[4].width;

      // Col 6: Time In / Out
      ctx.textAlign = 'center';
      ctx.font = '10px monospace';
      ctx.fillStyle = colors.textMuted;
      const inOutText =
        record.inTime || record.outTime
          ? `${record.inTime || '—'} / ${record.outTime || '—'}`
          : '—';
      ctx.fillText(inOutText, cellX + columns[5].width / 2, currentY + 23);
      cellX += columns[5].width;

      // Col 7: Remarks
      ctx.textAlign = 'left';
      ctx.font = 'italic 11px system-ui, sans-serif';
      ctx.fillStyle = colors.textMuted;
      const remarks = record.notes || '—';
      // Truncate if too long
      const maxW = columns[6].width - 24;
      let displayRemarks = remarks;
      if (ctx.measureText(displayRemarks).width > maxW) {
        while (
          displayRemarks.length > 3 &&
          ctx.measureText(displayRemarks + '...').width > maxW
        ) {
          displayRemarks = displayRemarks.slice(0, -1);
        }
        displayRemarks += '...';
      }
      ctx.fillText(displayRemarks, cellX + 16, currentY + 23);

      currentY += rowHeight;
    });
  }

  currentY += 28;

  // 6. Signatures and Authorizations Block
  if (includeSignatures) {
    drawRoundedRect(
      ctx,
      paddingX,
      currentY,
      contentWidth,
      signatureHeight - 20,
      12,
      colors.cardBg,
      colors.cardBorder,
      1
    );

    const sigColW = contentWidth / 3;

    // Signature 1: Faculty / Attendance Officer
    let sigX = paddingX + 24;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sigX, currentY + 68);
    ctx.lineTo(sigX + sigColW - 48, currentY + 68);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textMain;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('ATTENDANCE IN-CHARGE', sigX, currentY + 86);
    ctx.fillStyle = colors.textMuted;
    ctx.font = '9px monospace';
    ctx.fillText('Prepared & Verified Signature', sigX, currentY + 98);

    // Signature 2: Academic Coordinator
    sigX = paddingX + sigColW + 24;
    ctx.beginPath();
    ctx.moveTo(sigX, currentY + 68);
    ctx.lineTo(sigX + sigColW - 48, currentY + 68);
    ctx.stroke();

    ctx.fillStyle = colors.textMain;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('ACADEMIC COORDINATOR', sigX, currentY + 86);
    ctx.fillStyle = colors.textMuted;
    ctx.font = '9px monospace';
    ctx.fillText('Audited & Approved Stamp', sigX, currentY + 98);

    // Signature 3: Institutional Stamp & Date
    sigX = paddingX + sigColW * 2 + 24;
    ctx.beginPath();
    ctx.moveTo(sigX, currentY + 68);
    ctx.lineTo(sigX + sigColW - 48, currentY + 68);
    ctx.stroke();

    ctx.fillStyle = colors.textMain;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('INSTITUTIONAL SEAL', sigX, currentY + 86);
    ctx.fillStyle = colors.textMuted;
    ctx.font = '9px monospace';
    ctx.fillText(`Dated: ${nowFormatted.split(',')[0]}`, sigX, currentY + 98);

    currentY += signatureHeight;
  }

  // 7. Footer Notice
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, currentY);
  ctx.lineTo(canvasWidth - paddingX, currentY);
  ctx.stroke();

  currentY += 20;

  ctx.textAlign = 'center';
  ctx.fillStyle = colors.textMuted;
  ctx.font = '10px monospace';
  ctx.fillText(
    'CONFIDENTIAL & OFFICIAL RECORD • PRODUCED VIA I-SHARK ICT ACADEMIC MANAGEMENT SUITE',
    canvasWidth / 2,
    currentY + 12
  );
  ctx.fillText(
    `Verification ID: ${refCode} • ISO/IEC 27001 Academic Audit Compliance`,
    canvasWidth / 2,
    currentY + 28
  );

  return canvas;
}

/**
 * Downloads the generated canvas as PNG or JPG file.
 */
export function downloadAttendanceImage(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpg',
  periodOrMonth: string,
  studentName?: string,
  quality: number = 0.95
): string {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const studentTag = studentName
    ? studentName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    : 'all_students';
  const cleanPeriod = (periodOrMonth || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `attendance_report_${cleanPeriod}_${studentTag}.${format}`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return fileName;
}

/**
 * Copies the attendance report graphic to the system clipboard (PNG).
 */
export async function copyAttendanceImageToClipboard(
  canvas: HTMLCanvasElement
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard
            .write([item])
            .then(() => resolve(true))
            .catch((err) => {
              console.warn('Clipboard write failed:', err);
              resolve(false);
            });
        } else {
          resolve(false);
        }
      }, 'image/png');
    } catch (e) {
      console.warn('Failed to copy image to clipboard:', e);
      resolve(false);
    }
  });
}
