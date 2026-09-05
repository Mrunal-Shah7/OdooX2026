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

function pdfEscape(str: string): string {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function renderPayslipPdf(detail: PayslipDetail): Buffer {
  const ps = detail.payslip;
  const emp = ps.employee;

  const contentLines: string[] = [];

  // Header Title
  contentLines.push('BT /F2 22 Tf 0.06 0.09 0.16 rg 40 800 Td (' + pdfEscape('PeoplePay360') + ') Tj ET');
  contentLines.push(
    'BT /F1 12 Tf 0.28 0.33 0.41 rg 40 780 Td (' +
      pdfEscape(`Official Payslip — ${ps.payrunName || 'Payroll'}`) +
      ') Tj ET',
  );

  // Divider Line
  contentLines.push('0.88 0.91 0.94 RG 1 w 40 768 m 555 768 l S');

  // Employee & Pay Period Details (Grid)
  let y = 745;
  contentLines.push('BT /F2 8 Tf 0.39 0.45 0.55 rg 40 ' + y + ' Td (EMPLOYEE NAME) Tj ET');
  contentLines.push(
    'BT /F2 10 Tf 0.06 0.09 0.16 rg 40 ' + (y - 12) + ' Td (' + pdfEscape(`${emp.firstName} ${emp.lastName}`) + ') Tj ET',
  );

  contentLines.push('BT /F2 8 Tf 0.39 0.45 0.55 rg 320 ' + y + ' Td (PAY PERIOD) Tj ET');
  contentLines.push(
    'BT /F2 10 Tf 0.06 0.09 0.16 rg 320 ' +
      (y - 12) +
      ' Td (' +
      pdfEscape(`${ps.periodStart} to ${ps.periodEnd}`) +
      ') Tj ET',
  );

  y -= 30;
  contentLines.push('BT /F2 8 Tf 0.39 0.45 0.55 rg 40 ' + y + ' Td (DEPARTMENT / POSITION) Tj ET');
  contentLines.push(
    'BT /F1 10 Tf 0.06 0.09 0.16 rg 40 ' +
      (y - 12) +
      ' Td (' +
      pdfEscape(`${emp.departmentName || 'General'} · ${emp.jobPosition || 'Staff'}`) +
      ') Tj ET',
  );

  contentLines.push('BT /F2 8 Tf 0.39 0.45 0.55 rg 320 ' + y + ' Td (CONTRACT REFERENCE) Tj ET');
  contentLines.push(
    'BT /F1 10 Tf 0.06 0.09 0.16 rg 320 ' +
      (y - 12) +
      ' Td (' +
      pdfEscape(ps.contract?.reference || 'N/A') +
      ') Tj ET',
  );

  y -= 30;
  contentLines.push('BT /F2 8 Tf 0.39 0.45 0.55 rg 40 ' + y + ' Td (WORK EMAIL) Tj ET');
  contentLines.push(
    'BT /F1 10 Tf 0.06 0.09 0.16 rg 40 ' + (y - 12) + ' Td (' + pdfEscape(emp.workEmail || '—') + ') Tj ET',
  );

  contentLines.push('BT /F2 8 Tf 0.39 0.45 0.55 rg 320 ' + y + ' Td (PAYSLIP STATUS) Tj ET');
  contentLines.push(
    'BT /F2 10 Tf 0.06 0.09 0.16 rg 320 ' + (y - 12) + ' Td (' + pdfEscape(ps.status.toUpperCase()) + ') Tj ET',
  );

  // Worked Days Card Background
  y -= 35;
  contentLines.push('0.97 0.98 0.99 rg 40 ' + (y - 30) + ' 515 40 re f');
  contentLines.push('0.88 0.91 0.94 RG 0.5 w 40 ' + (y - 30) + ' 515 40 re S');

  contentLines.push('BT /F2 8 Tf 0.28 0.33 0.41 rg 50 ' + (y - 2) + ' Td (WORKED DAYS BREAKDOWN) Tj ET');
  contentLines.push(
    'BT /F1 9 Tf 0.06 0.09 0.16 rg 50 ' +
      (y - 18) +
      ' Td (' +
      pdfEscape(
        `Scheduled: ${ps.scheduledDays}d   |   Worked: ${ps.workedDays}d   |   Paid Leave: ${ps.paidLeaveDays}d   |   Unpaid: ${ps.unpaidLeaveDays}d   |   Absent: ${ps.absentDays}d`,
      ) +
      ') Tj ET',
  );

  // Salary Computation Table
  y -= 55;
  contentLines.push('BT /F2 10 Tf 0.06 0.09 0.16 rg 40 ' + y + ' Td (SALARY COMPUTATION BREAKDOWN) Tj ET');
  y -= 15;

  // Table Header Box
  contentLines.push('0.95 0.96 0.98 rg 40 ' + (y - 4) + ' 515 18 re f');
  contentLines.push(
    'BT /F2 8 Tf 0.28 0.33 0.41 rg 45 ' +
      y +
      ' Td (SEQ) Tj 40 0 Td (CODE) Tj 100 0 Td (RULE NAME) Tj 220 0 Td (CATEGORY) Tj 100 0 Td (AMOUNT ' +
      pdfEscape(ps.currency) +
      ') Tj ET',
  );

  y -= 18;

  // Table Rows
  for (const line of detail.lines) {
    if (y < 80) break; // Keep within page bounds
    contentLines.push('0.93 0.94 0.96 RG 0.5 w 40 ' + (y - 4) + ' m 555 ' + (y - 4) + ' l S');
    contentLines.push(
      'BT /F1 9 Tf 0.06 0.09 0.16 rg 45 ' +
        y +
        ' Td (' +
        pdfEscape(String(line.sequence)) +
        ') Tj 40 0 Td (' +
        pdfEscape(line.ruleCode) +
        ') Tj 100 0 Td (' +
        pdfEscape(line.ruleName) +
        ') Tj 220 0 Td (' +
        pdfEscape(line.category) +
        ') Tj 100 0 Td (' +
        pdfEscape(line.amount) +
        ') Tj ET',
    );
    y -= 16;
  }

  // Net Salary Total Banner
  y -= 15;
  contentLines.push('0.06 0.09 0.16 rg 40 ' + (y - 8) + ' 515 28 re f');
  contentLines.push(
    'BT /F2 11 Tf 1 1 1 rg 52 ' + y + ' Td (' + pdfEscape(`NET PAYABLE AMOUNT (${ps.currency})`) + ') Tj ET',
  );
  contentLines.push(
    'BT /F2 13 Tf 1 1 1 rg 430 ' + y + ' Td (' + pdfEscape(`${ps.net} ${ps.currency}`) + ') Tj ET',
  );

  const streamBody = contentLines.join('\n');
  const streamLen = Buffer.byteLength(streamBody, 'utf-8');

  const objects = [
    '%PDF-1.4\n%\xFF\xFF\xFF\xFF',
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj',
    '6 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + streamBody + '\nendstream\nendobj',
  ];

  let offset = 0;
  const xrefs = [0];
  let body = '';
  for (let i = 0; i < objects.length; i++) {
    if (i > 0) xrefs.push(offset);
    body += objects[i] + '\n';
    offset = Buffer.byteLength(body, 'utf-8');
  }

  const xrefOffset = offset;
  let xrefTable = 'xref\n0 ' + objects.length + '\n0000000000 65535 f \n';
  for (let i = 1; i < xrefs.length; i++) {
    xrefTable += String(xrefs[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer =
    'trailer\n<< /Size ' +
    objects.length +
    ' /Root 1 0 R >>\nstartxref\n' +
    xrefOffset +
    '\n%%EOF\n';

  return Buffer.from(body + xrefTable + trailer, 'utf-8');
}
