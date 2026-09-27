import { jsPDF } from 'jspdf';
import { AttendanceRecord, AttendanceSummary, UserProfile } from '../types';

export interface PDFExportOptions {
  orientation: 'portrait' | 'landscape';
  includeSummary: boolean;
  includeSignatures: boolean;
  includeRemarks: boolean;
  institutionName?: string;
  departmentName?: string;
}

export interface AttendanceReportPDFData {
  records: AttendanceRecord[];
  students: UserProfile[];
  summary: AttendanceSummary;
  month?: string; // YYYY-MM
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
  selectedStudent?: UserProfile;
}

export function formatMonthName(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthNumStr] = monthStr.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthIndex = parseInt(monthNumStr, 10) - 1;
  const name = monthNames[monthIndex] || monthNumStr;
  return `${name} ${yearStr}`;
}

/**
 * Generates a clean, publication-grade printable PDF document using jsPDF.
 */
export function generateAttendancePDF(
  data: AttendanceReportPDFData,
  options: PDFExportOptions = {
    orientation: 'portrait',
    includeSummary: true,
    includeSignatures: true,
    includeRemarks: true,
  }
): jsPDF {
  const { records, students, summary, month, selectedStudent } = data;
  const isLandscape = options.orientation === 'landscape';

  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const bottomMargin = 22; // room for running footer

  const institutionName = options.institutionName || 'I-SHARK INSTITUTE OF COMPUTER TECHNOLOGIES';
  const departmentName = options.departmentName || 'DEPARTMENT OF ACADEMIC MONITORING & ATTENDANCE AUDIT';
  const formattedPeriod =
    data.periodLabel ||
    (data.startDate && data.endDate
      ? `${data.startDate} to ${data.endDate}`
      : formatMonthName(month || ''));
  const docRefPeriod = (data.startDate || month || 'ALL').replace(/[^a-zA-Z0-9]/g, '');
  const nowFormatted = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Table column widths definition
  interface ColumnDef {
    header: string;
    width: number;
    align: 'left' | 'center' | 'right';
  }

  const columns: ColumnDef[] = isLandscape
    ? ([
        { header: '#', width: 12, align: 'center' },
        { header: 'DATE', width: 26, align: 'center' },
        { header: 'STUDENT NAME', width: 62, align: 'left' },
        { header: 'ROLL NO', width: 28, align: 'center' },
        { header: 'STATUS', width: 28, align: 'center' },
        { header: 'CHECK-IN', width: 24, align: 'center' },
        { header: 'CHECK-OUT', width: 24, align: 'center' },
        { header: 'REMARKS / NOTES', width: options.includeRemarks ? 65 : 0, align: 'left' },
      ] as ColumnDef[]).filter((c) => c.width > 0)
    : ([
        { header: '#', width: 10, align: 'center' },
        { header: 'DATE', width: 24, align: 'center' },
        { header: 'STUDENT NAME', width: 48, align: 'left' },
        { header: 'ROLL NO', width: 22, align: 'center' },
        { header: 'STATUS', width: 24, align: 'center' },
        { header: 'IN / OUT', width: 26, align: 'center' },
        { header: 'REMARKS', width: options.includeRemarks ? 28 : 0, align: 'left' },
      ] as ColumnDef[]).filter((c) => c.width > 0);

  // Recalibrate last column width to strictly match contentWidth
  const allocatedWidth = columns.reduce((acc, col) => acc + col.width, 0);
  if (allocatedWidth !== contentWidth && columns.length > 0) {
    const diff = contentWidth - allocatedWidth;
    columns[columns.length - 1].width += diff;
  }

  // Draw Document Header
  let y = 14;

  const renderDocumentHeader = () => {
    // Top primary accent bar
    doc.setFillColor(79, 70, 229); // #4f46e5 Indigo
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Institution Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(institutionName, marginX, y);
    y += 5;

    // Department & System Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(departmentName, marginX, y);
    y += 6;

    // Report Title & Badge Container
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text('OFFICIAL ATTENDANCE REPORT & AUDIT LEDGER', marginX, y);

    // Right-aligned report code
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`DOC-ID: AR-${docRefPeriod}-${Date.now().toString().slice(-4)}`, pageWidth - marginX, y, {
      align: 'right',
    });
    y += 4;

    // Info Ribbon / Metadata box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(marginX, y, contentWidth, 14, 2, 2, 'FD');

    doc.setFontSize(8);
    const colW = contentWidth / 3;

    // Col 1: Reporting Period
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('PERIOD:', marginX + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(formattedPeriod.slice(0, 36), marginX + 22, y + 5);

    // Col 1 Row 2: Generated On
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('GENERATED:', marginX + 3, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(nowFormatted, marginX + 22, y + 10);

    // Col 2: Target Scope
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('SCOPE:', marginX + colW + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const scopeLabel = selectedStudent
      ? `${selectedStudent.fullName} (${selectedStudent.rollNumber || 'No Roll'})`
      : `All Students (${students.length} Enrolled)`;
    doc.text(scopeLabel.slice(0, 32), marginX + colW + 18, y + 5);

    // Col 2 Row 2: Batch / Group
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('BATCH:', marginX + colW + 3, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(selectedStudent?.batch || 'All Active Batches', marginX + colW + 18, y + 10);

    // Col 3: Records Logged
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('TOTAL LOGS:', marginX + colW * 2 + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${records.length} Recorded Sessions`, marginX + colW * 2 + 25, y + 5);

    // Col 3 Row 2: Status
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('STATUS:', marginX + colW * 2 + 3, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129); // emerald
    doc.text('VERIFIED AUDIT LEDGER', marginX + colW * 2 + 25, y + 10);

    y += 18;
  };

  // Render Summary Statistics Box
  const renderSummaryBox = () => {
    const boxHeight = 22;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(marginX, y, contentWidth, boxHeight, 2, 2, 'FD');

    // Left block: Attendance Percentage Ring/Box
    const rateW = isLandscape ? 60 : 45;
    doc.setFillColor(79, 70, 229); // Indigo
    doc.roundedRect(marginX + 2, y + 2, rateW, boxHeight - 4, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(224, 231, 255); // indigo-100
    doc.text('ATTENDANCE RATE', marginX + 4, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`${summary.percentage}%`, marginX + 4, y + 15);

    doc.setFontSize(6.5);
    const rateNum = typeof summary.percentage === 'number' ? summary.percentage : parseFloat(String(summary.percentage));
    const evalStanding = isNaN(rateNum)
      ? 'NO RECORDS'
      : rateNum >= 85
      ? 'EXCELLENT STANDING'
      : rateNum >= 75
      ? 'SATISFACTORY STANDING'
      : 'ATTENTION REQUIRED (<75%)';
    doc.text(evalStanding, marginX + 4, y + 19);

    // Right block: Stat badges
    const remainingW = contentWidth - rateW - 8;
    const statItemW = remainingW / 5;
    const statStartX = marginX + rateW + 6;

    const stats = [
      { label: 'TOTAL SESSIONS', value: summary.total, color: [30, 41, 59] },
      { label: 'PRESENT', value: summary.present, color: [22, 101, 52] },
      { label: 'LATE', value: summary.late, color: [180, 83, 9] },
      { label: 'ABSENT', value: summary.absent, color: [185, 28, 28] },
      { label: 'LEAVE', value: summary.leave, color: [3, 105, 161] },
    ];

    stats.forEach((stat, i) => {
      const curX = statStartX + i * statItemW;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(stat.label, curX, y + 7);

      doc.setFontSize(13);
      doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
      doc.text(String(stat.value), curX, y + 16);
    });

    y += boxHeight + 4;
  };

  // Render Table Header
  const renderTableHeader = (isContinued: boolean = false) => {
    const headerHeight = 7;
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(marginX, y, contentWidth, headerHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let curX = marginX;
    columns.forEach((col) => {
      let textX = curX + 2;
      if (col.align === 'center') {
        textX = curX + col.width / 2;
      } else if (col.align === 'right') {
        textX = curX + col.width - 2;
      }

      const title = isContinued && col === columns[0] ? '#' : col.header;
      doc.text(title, textX, y + 4.8, { align: col.align });
      curX += col.width;
    });

    y += headerHeight;
  };

  // Render Status Badge Inside Cell
  const renderStatusBadge = (status: string, cellX: number, cellY: number, cellW: number, cellH: number) => {
    let bg = [241, 245, 249];
    let fg = [71, 85, 105];

    if (status === 'Present') {
      bg = [220, 252, 231]; // emerald-100
      fg = [21, 128, 61];   // emerald-700
    } else if (status === 'Late') {
      bg = [254, 243, 199]; // amber-100
      fg = [180, 83, 9];    // amber-700
    } else if (status === 'Absent') {
      bg = [254, 226, 226]; // rose-100
      fg = [185, 28, 28];   // rose-700
    } else if (status === 'Leave') {
      bg = [224, 242, 254]; // sky-100
      fg = [3, 105, 161];   // sky-700
    }

    const badgeW = Math.min(cellW - 4, 22);
    const badgeH = 4.5;
    const badgeX = cellX + (cellW - badgeW) / 2;
    const badgeY = cellY + (cellH - badgeH) / 2;

    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(fg[0], fg[1], fg[2]);
    doc.text(status.toUpperCase(), cellX + cellW / 2, badgeY + 3.2, { align: 'center' });
  };

  // Initial page layout
  renderDocumentHeader();

  if (options.includeSummary) {
    renderSummaryBox();
  }

  // Section Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('ATTENDANCE LEDGER RECORDS', marginX, y);
  y += 3;

  renderTableHeader(false);

  // Render Table Rows
  const rowHeight = 6.8;

  if (records.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('No attendance entries logged for this period and selection.', marginX + 4, y + 6);
    y += 10;
  } else {
    records.forEach((record, index) => {
      // Check page overflow
      if (y + rowHeight > pageHeight - bottomMargin) {
        doc.addPage();
        y = 15;
        // Top continued title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`${institutionName} — Attendance Ledger (Continued)`, marginX, y - 4);
        renderTableHeader(true);
      }

      const student = students.find((s) => s.id === record.studentId);
      const studentName = record.studentName || student?.fullName || 'Student';
      const rollNumber = student?.rollNumber || '—';

      // Row background
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(marginX, y, contentWidth, rowHeight, 'F');
      }

      // Bottom row divider line
      doc.setDrawColor(241, 245, 249);
      doc.line(marginX, y + rowHeight, marginX + contentWidth, y + rowHeight);

      // Cell Data
      let cellX = marginX;

      columns.forEach((col) => {
        const textY = y + 4.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        if (col.header === '#') {
          doc.text(String(index + 1), cellX + col.width / 2, textY, { align: 'center' });
        } else if (col.header === 'DATE') {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(record.date, cellX + col.width / 2, textY, { align: 'center' });
        } else if (col.header === 'STUDENT NAME') {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          const safeName = studentName.length > 28 ? studentName.slice(0, 26) + '...' : studentName;
          doc.text(safeName, cellX + 2, textY);
        } else if (col.header === 'ROLL NO') {
          doc.text(rollNumber, cellX + col.width / 2, textY, { align: 'center' });
        } else if (col.header === 'STATUS') {
          renderStatusBadge(record.status, cellX, y, col.width, rowHeight);
        } else if (col.header === 'IN / OUT') {
          const inT = record.inTime || '—';
          const outT = record.outTime || '—';
          doc.text(`${inT} / ${outT}`, cellX + col.width / 2, textY, { align: 'center' });
        } else if (col.header === 'CHECK-IN') {
          doc.text(record.inTime || '—', cellX + col.width / 2, textY, { align: 'center' });
        } else if (col.header === 'CHECK-OUT') {
          doc.text(record.outTime || '—', cellX + col.width / 2, textY, { align: 'center' });
        } else if (col.header.startsWith('REMARKS')) {
          doc.setTextColor(100, 116, 139);
          const notesText = record.notes || '—';
          const maxLen = isLandscape ? 40 : 18;
          const safeNotes = notesText.length > maxLen ? notesText.slice(0, maxLen - 2) + '...' : notesText;
          doc.text(safeNotes, cellX + 2, textY);
        }

        cellX += col.width;
      });

      y += rowHeight;
    });
  }

  // Signatures Section
  if (options.includeSignatures) {
    const signatureBlockHeight = 28;
    if (y + signatureBlockHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = 20;
    } else {
      y += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('OFFICIAL VERIFICATION & SIGNATURES', marginX, y);
    y += 4;

    const sigColW = contentWidth / 3;
    const sigLineW = sigColW - 14;

    const signatureRoles = [
      { title: 'Faculty / Attendance Officer', sub: 'Prepared By' },
      { title: 'Academic Coordinator', sub: 'Verified By' },
      { title: 'Principal / Authorized Director', sub: 'Approved Official Seal' },
    ];

    signatureRoles.forEach((role, idx) => {
      const startX = marginX + idx * sigColW + 7;
      const lineY = y + 14;

      // Signature line
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.setLineDashPattern([1, 1], 0);
      doc.line(startX, lineY, startX + sigLineW, lineY);
      doc.setLineDashPattern([], 0); // reset dash

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(role.title, startX + sigLineW / 2, lineY + 4, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(role.sub, startX + sigLineW / 2, lineY + 7.5, { align: 'center' });
      doc.text('Date: ______________', startX + sigLineW / 2, lineY + 11, { align: 'center' });
    });

    y += signatureBlockHeight;
  }

  // Add Footers and Page Numbers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Subtle footer separator line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    // Left: Institution Notice
    doc.text(
      'CONFIDENTIAL & PROPRIETARY • I-SHARK ACADEMIC MANAGEMENT SYSTEM',
      marginX,
      pageHeight - 8
    );

    // Right: Page Numbers
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  return doc;
}

/**
 * Convenience helper to directly trigger the browser print dialog
 * for the generated PDF without opening popup windows (iframe print).
 */
export function printPDFDocument(doc: jsPDF): void {
  const blobUrl = doc.output('bloburl');
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl as unknown as string;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Error triggering iframe print:', e);
    } finally {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 60000);
    }
  };
}

/**
 * Downloads the PDF with a clean standard filename.
 */
export function downloadAttendancePDF(
  doc: jsPDF,
  periodOrMonth: string,
  studentName?: string
): string {
  const studentTag = studentName
    ? studentName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    : 'all_students';
  const cleanPeriod = (periodOrMonth || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `attendance_report_${cleanPeriod}_${studentTag}.pdf`;
  doc.save(fileName);
  return fileName;
}
