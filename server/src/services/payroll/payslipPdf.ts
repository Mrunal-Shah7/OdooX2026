import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export type PayslipDetail = {
  payslip: {
    id: string;
    payrunName: string;
    employee: {
      firstName: string;
      lastName: string;
      workEmail: string;
      jobPosition: string;
      departmentName: string;
    };
    contract: {
      reference: string;
      wage: string;
      currency: string;
    } | null;
    periodStart: string;
    periodEnd: string;
    currency: string;
    payoutCurrency: string;
    exchangeRate: string;
    scheduledDays: string;
    workedDays: string;
    paidLeaveDays: string;
    unpaidLeaveDays: string;
    absentDays: string;
    overtimeHours: string;
    basic: string;
    gross: string;
    totalDeductions: string;
    net: string;
    status: string;
  };
  lines: {
    ruleCode: string;
    ruleName: string;
    category: string;
    sequence: number;
    amount: string;
  }[];
};

// ---------------------------------------------------------------------------
// Design tokens (A4 page, matching the previous manual layout's color scheme)
// ---------------------------------------------------------------------------
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_RESERVE = 50; // vertical space reserved above the footer

const COLOR = {
  ink: rgb(0.06, 0.09, 0.16),
  muted: rgb(0.28, 0.33, 0.41),
  faint: rgb(0.39, 0.45, 0.55),
  border: rgb(0.88, 0.91, 0.94),
  panel: rgb(0.97, 0.98, 0.99),
  headerRow: rgb(0.95, 0.96, 0.98),
  white: rgb(1, 1, 1),
  green: rgb(0.09, 0.45, 0.27),
  red: rgb(0.63, 0.16, 0.16),
};

const LOGO_PATH = [
  path.resolve(process.cwd(), 'web/public/logo.png'),
  path.resolve(process.cwd(), '../web/public/logo.png'),
  path.resolve(__dirname, '../../../../web/public/logo.png'),
  path.resolve(__dirname, '../../../web/public/logo.png'),
].find((p) => fs.existsSync(p)) || path.resolve(process.cwd(), 'web/public/logo.png');

const COMPANY_NAME = 'PeoplePay360';

// ---------------------------------------------------------------------------
// Small formatting helpers
// ---------------------------------------------------------------------------
function fmtMoney(value: string | number, currencySuffix: string): string {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(n)) return currencySuffix ? `${value} ${currencySuffix}` : String(value);
  const formatted = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = n < 0 ? '-' : '';
  return currencySuffix ? `${sign}${formatted} ${currencySuffix}` : `${sign}${formatted}`;
}

function fmtDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Payroll lines don't always carry a clean "earning" / "deduction" flag, so
 * classify defensively: an explicit category wins, otherwise fall back to
 * the sign of the amount.
 */
function isDeductionLine(category: string, amount: string): boolean {
  const c = (category || '').toLowerCase();
  if (c.includes('deduct') || c.includes('tax') || c.includes('withhold')) return true;
  if (c.includes('earn') || c.includes('allowance') || c.includes('bonus')) return false;
  const n = parseFloat(amount);
  return !Number.isNaN(n) && n < 0;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
export async function renderPayslipPdf(detail: PayslipDetail): Promise<Buffer> {
  const ps = detail.payslip;
  const emp = ps.employee;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Payslip - ${emp.firstName} ${emp.lastName} - ${ps.payrunName}`);
  pdfDoc.setProducer(COMPANY_NAME);
  pdfDoc.setCreationDate(new Date());

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Embed the company logo if it's present and readable. A missing/corrupt
  // logo must never break payslip generation, so this fails soft.
  let logoImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  let logoDims: { width: number; height: number } | null = null;
  try {
    const logoBytes = fs.readFileSync(LOGO_PATH);
    const isPng = logoBytes[0] === 0x89 && logoBytes[1] === 0x50;
    logoImage = isPng ? await pdfDoc.embedPng(logoBytes) : await pdfDoc.embedJpg(logoBytes);
    const targetHeight = 34;
    const scale = targetHeight / logoImage.height;
    logoDims = logoImage.scale(scale);
  } catch {
    logoImage = null;
    logoDims = null;
  }

  let page!: PDFPage;
  let y = 0;
  let pageNum = 0;

  const rightAlignedX = (text: string, font: PDFFont, size: number, xRight: number) =>
    xRight - font.widthOfTextAtSize(text, size);

  const centeredX = (text: string, font: PDFFont, size: number, xCenter: number) =>
    xCenter - font.widthOfTextAtSize(text, size) / 2;

  function drawHeader() {
    const topY = PAGE_HEIGHT - MARGIN;
    if (logoImage && logoDims) {
      page.drawImage(logoImage, {
        x: MARGIN,
        y: topY - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
      page.drawText(COMPANY_NAME, {
        x: MARGIN + logoDims.width + 12,
        y: topY - logoDims.height / 2 - 5,
        size: 15,
        font: fontBold,
        color: COLOR.ink,
      });
    } else {
      page.drawText(COMPANY_NAME, { x: MARGIN, y: topY - 15, size: 20, font: fontBold, color: COLOR.ink });
    }

    const label = 'PAYSLIP';
    page.drawText(label, {
      x: rightAlignedX(label, fontBold, 13, PAGE_WIDTH - MARGIN),
      y: topY - 13,
      size: 13,
      font: fontBold,
      color: COLOR.faint,
    });
    const period = `${fmtDate(ps.periodStart)} - ${fmtDate(ps.periodEnd)}`;
    page.drawText(period, {
      x: rightAlignedX(period, fontRegular, 9, PAGE_WIDTH - MARGIN),
      y: topY - 27,
      size: 9,
      font: fontRegular,
      color: COLOR.faint,
    });

    y = topY - 48;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: COLOR.border });
    y -= 22;
  }

  function drawFooter() {
    const footerY = MARGIN + FOOTER_RESERVE - 40;
    page.drawLine({
      start: { x: MARGIN, y: footerY + 18 },
      end: { x: PAGE_WIDTH - MARGIN, y: footerY + 18 },
      thickness: 0.5,
      color: COLOR.border,
    });
    page.drawText('This is a system-generated payslip and does not require a signature.', {
      x: MARGIN,
      y: footerY,
      size: 7.5,
      font: fontRegular,
      color: COLOR.faint,
    });
    const pageLabel = `Page ${pageNum}`;
    page.drawText(pageLabel, {
      x: rightAlignedX(pageLabel, fontRegular, 7.5, PAGE_WIDTH - MARGIN),
      y: footerY,
      size: 7.5,
      font: fontRegular,
      color: COLOR.faint,
    });
  }

  let hasPage = false;
  function newPage() {
    if (hasPage) drawFooter();
    hasPage = true;
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pageNum += 1;
    drawHeader();
  }

  /** Starts a new page if the next block of `height` points won't fit. */
  function ensureSpace(height: number, onContinue?: () => void) {
    if (y - height < MARGIN + FOOTER_RESERVE) {
      newPage();
      if (onContinue) onContinue();
    }
  }

  function sectionTitle(text: string) {
    ensureSpace(24);
    page.drawText(text.toUpperCase(), { x: MARGIN, y, size: 9.5, font: fontBold, color: COLOR.ink });
    y -= 16;
  }

  function labelValue(x: number, width: number, label: string, value: string) {
    page.drawText(label.toUpperCase(), { x, y, size: 7.5, font: fontBold, color: COLOR.faint });
    page.drawText(value || '-', {
      x,
      y: y - 13,
      size: 10,
      font: fontRegular,
      color: COLOR.ink,
      maxWidth: width,
      lineHeight: 12,
    });
  }

  // ------------------------------------------------------------------
  // Page 1: header, employee details, attendance summary
  // ------------------------------------------------------------------
  newPage();

  const colW = (CONTENT_WIDTH - 24) / 2;
  const col1X = MARGIN;
  const col2X = MARGIN + colW + 24;

  sectionTitle('Employee Details');
  labelValue(col1X, colW, 'Employee Name', `${emp.firstName} ${emp.lastName}`);
  labelValue(col2X, colW, 'Payslip Reference', ps.id);
  y -= 34;

  labelValue(col1X, colW, 'Department / Position', `${emp.departmentName || 'General'} - ${emp.jobPosition || 'Staff'}`);
  labelValue(col2X, colW, 'Contract Reference', ps.contract?.reference || 'N/A');
  y -= 34;

  labelValue(col1X, colW, 'Work Email', emp.workEmail || '-');
  labelValue(col2X, colW, 'Payslip Status', ps.status.toUpperCase());
  y -= 28;

  // Attendance summary strip
  ensureSpace(50);
  const attendance: [string, string][] = [
    ['Scheduled', `${ps.scheduledDays}d`],
    ['Worked', `${ps.workedDays}d`],
    ['Paid Leave', `${ps.paidLeaveDays}d`],
    ['Unpaid Leave', `${ps.unpaidLeaveDays}d`],
    ['Absent', `${ps.absentDays}d`],
    ['Overtime', `${ps.overtimeHours}h`],
  ];
  const stripHeight = 42;
  page.drawRectangle({ x: MARGIN, y: y - stripHeight, width: CONTENT_WIDTH, height: stripHeight, color: COLOR.panel });
  page.drawRectangle({
    x: MARGIN,
    y: y - stripHeight,
    width: CONTENT_WIDTH,
    height: stripHeight,
    borderColor: COLOR.border,
    borderWidth: 0.75,
  });
  const cellW = CONTENT_WIDTH / attendance.length;
  attendance.forEach(([label, value], i) => {
    const cx = MARGIN + cellW * i + cellW / 2;
    page.drawText(label.toUpperCase(), {
      x: centeredX(label.toUpperCase(), fontBold, 6.5, cx),
      y: y - 16,
      size: 6.5,
      font: fontBold,
      color: COLOR.faint,
    });
    page.drawText(value, {
      x: centeredX(value, fontBold, 11, cx),
      y: y - 31,
      size: 11,
      font: fontBold,
      color: COLOR.ink,
    });
    if (i > 0) {
      page.drawLine({
        start: { x: MARGIN + cellW * i, y: y - 8 },
        end: { x: MARGIN + cellW * i, y: y - stripHeight + 8 },
        thickness: 0.5,
        color: COLOR.border,
      });
    }
  });
  y -= stripHeight + 26;

  // ------------------------------------------------------------------
  // Earnings / Deductions tables
  // ------------------------------------------------------------------
  const earnings = detail.lines
    .filter((l) => !isDeductionLine(l.category, l.amount))
    .sort((a, b) => a.sequence - b.sequence);
  const deductions = detail.lines
    .filter((l) => isDeductionLine(l.category, l.amount))
    .sort((a, b) => a.sequence - b.sequence);

  type TableColumn = {
    label: string;
    x: number;
    width: number;
    align: 'left' | 'right';
  };

  // Fixed-length tuple: all four columns are guaranteed to exist.
  // This prevents TS2532 errors when noUncheckedIndexedAccess is enabled.
  const columns: [TableColumn, TableColumn, TableColumn, TableColumn] = [
    { label: 'Code', x: MARGIN, width: 55, align: 'left' },
    { label: 'Description', x: MARGIN + 55, width: 275, align: 'left' },
    { label: 'Category', x: MARGIN + 330, width: 100, align: 'left' },
    {
      label: `Amount (${ps.currency})`,
      x: MARGIN + 430,
      width: CONTENT_WIDTH - 430,
      align: 'right',
    },
  ];

  let currentTableTitle = '';

  function drawTableHeader(title: string) {
    currentTableTitle = title;
    sectionTitle(title);
    ensureSpace(20);
    page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_WIDTH, height: 18, color: COLOR.headerRow });
    columns.forEach((col) => {
      const tx = col.align === 'right' ? rightAlignedX(col.label, fontBold, 7.5, col.x + col.width) : col.x;
      page.drawText(col.label.toUpperCase(), { x: tx, y, size: 7.5, font: fontBold, color: COLOR.muted });
    });
    y -= 18;
  }

  function drawLineRow(line: PayslipDetail['lines'][number]) {
    ensureSpace(18, () => drawTableHeader(`${currentTableTitle} (continued)`));
    const amountText = fmtMoney(line.amount, '');
    const cells = [
      { text: line.ruleCode, x: columns[0].x, width: columns[0].width, align: columns[0].align },
      { text: line.ruleName, x: columns[1].x, width: columns[1].width, align: columns[1].align },
      { text: line.category, x: columns[2].x, width: columns[2].width, align: columns[2].align },
      { text: amountText, x: columns[3].x, width: columns[3].width, align: columns[3].align },
    ];
    cells.forEach((c) => {
      const tx = c.align === 'right' ? rightAlignedX(c.text, fontRegular, 9, c.x + c.width) : c.x;
      page.drawText(c.text, { x: tx, y, size: 9, font: fontRegular, color: COLOR.ink, maxWidth: c.width });
    });
    y -= 16;
    page.drawLine({
      start: { x: MARGIN, y: y + 6 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 6 },
      thickness: 0.4,
      color: COLOR.border,
    });
  }

  function drawSubtotalRow(label: string, value: string, color: ReturnType<typeof rgb>) {
    ensureSpace(16);
    const text = fmtMoney(value, ps.currency);
    page.drawText(label, { x: columns[2].x, y, size: 9, font: fontBold, color });
    page.drawText(text, { x: rightAlignedX(text, fontBold, 9, columns[3].x + columns[3].width), y, size: 9, font: fontBold, color });
    y -= 16;
  }

  if (earnings.length) {
    drawTableHeader('Earnings');
    earnings.forEach(drawLineRow);
    drawSubtotalRow('Gross Earnings', ps.gross, COLOR.green);
    y -= 14;
  }

  if (deductions.length) {
    drawTableHeader('Deductions');
    deductions.forEach(drawLineRow);
    drawSubtotalRow('Total Deductions', ps.totalDeductions, COLOR.red);
    y -= 14;
  }

  // ------------------------------------------------------------------
  // Net pay banner
  // ------------------------------------------------------------------
  ensureSpace(36);
  const bannerHeight = 32;

  // Simple light net-pay box instead of the dark/black banner.
  page.drawRectangle({
    x: MARGIN,
    y: y - bannerHeight + 8,
    width: CONTENT_WIDTH,
    height: bannerHeight,
    color: COLOR.panel,
    borderColor: COLOR.border,
    borderWidth: 0.75,
  });

  const netLabel = `NET PAYABLE AMOUNT (${ps.currency})`;
  page.drawText(netLabel, {
    x: MARGIN + 14,
    y: y - 12,
    size: 10.5,
    font: fontBold,
    color: COLOR.ink,
  });

  const netValue = fmtMoney(ps.net, ps.currency);
  page.drawText(netValue, {
    x: rightAlignedX(netValue, fontBold, 13, PAGE_WIDTH - MARGIN - 14),
    y: y - 13,
    size: 13,
    font: fontBold,
    color: COLOR.ink,
  });
  y -= bannerHeight + 10;

  if (ps.payoutCurrency && ps.payoutCurrency !== ps.currency) {
    ensureSpace(14);
    const note = `Paid out in ${ps.payoutCurrency} at an exchange rate of ${ps.exchangeRate} ${ps.currency}/${ps.payoutCurrency}.`;
    page.drawText(note, { x: MARGIN, y, size: 8, font: fontRegular, color: COLOR.faint });
    y -= 14;
  }

  drawFooter();

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}